/**
 * Centralized order validation with cost reduction support.
 * Used by both engine (resolution) and client (UI dropdowns).
 */

import type { GameState, PlayerState, CostReduction } from './gamestate.js';
import type { OrderId } from './orders.js';
import type { TheaterId } from './theaters.js';
import type { BudgetLine, SecondaryResource, Cost } from './resources.js';
import { BUDGET_LINES, SECONDARY_RESOURCES, canAfford } from './resources.js';
import { THEATER_IDS, THEATER_SLOTS } from './theaters.js';

// === Cost reduction context & matching ===

export interface CostContext {
  orderCategory?: string;   // 'Deploy', 'Procure', etc.
  orderId?: string;          // 'buildBase', 'forwardOps', etc.
  theater?: TheaterId;
  domain?: string;           // card domain (for activation)
  subtags?: string[];        // card subtags
  action?: string;           // 'pipeline', 'activate'
}

function matchesReduction(r: CostReduction, ctx: CostContext): boolean {
  // Check scope
  switch (r.scope) {
    case 'deploy':
      if (ctx.orderCategory !== 'Deploy') return false;
      break;
    case 'activate':
      if (ctx.action !== 'activate' && ctx.action !== 'pipeline'
          && ctx.orderId !== 'activateProgram' && ctx.orderId !== 'startProgram') return false;
      break;
    case 'negotiate':
      if (ctx.orderId !== 'negotiate') return false;
      break;
    case 'all':
      break; // matches everything
  }

  const f = r.filter;
  if (!f) return true;

  if (f.theater && f.theater !== ctx.theater) return false;
  if (f.domain && f.domain !== ctx.domain) return false;
  if (f.subtag && (!ctx.subtags || !ctx.subtags.includes(f.subtag))) return false;
  if (f.orderCategory && f.orderCategory.toLowerCase() !== ctx.orderCategory?.toLowerCase()) return false;
  if (f.order && f.order !== ctx.orderId) return false;
  if (f.action) {
    if (f.action !== ctx.action && f.action !== ctx.orderId) return false;
  }

  return true;
}

/** Apply matching cost reductions to a base cost, returning the effective cost. */
export function applyCostReductions(
  baseCost: Cost,
  reductions: CostReduction[],
  context: CostContext,
): Cost {
  const cost: Cost = {
    budget: { ...baseCost.budget },
    secondary: baseCost.secondary ? { ...baseCost.secondary } : undefined,
  };

  for (const r of reductions) {
    if (!matchesReduction(r, context)) continue;

    if (BUDGET_LINES.includes(r.resource as BudgetLine)) {
      const line = r.resource as BudgetLine;
      cost.budget[line] = Math.max(0, (cost.budget[line] ?? 0) - r.amount);
    } else if (SECONDARY_RESOURCES.includes(r.resource as SecondaryResource)) {
      const res = r.resource as SecondaryResource;
      if (!cost.secondary) cost.secondary = {};
      cost.secondary[res] = Math.max(0, (cost.secondary[res] ?? 0) - r.amount);
    }
  }

  return cost;
}

// === Per-order validation ===

export interface OrderValidation {
  canAfford: boolean;
  reason?: string;
  /** For theater-based orders: which theaters are affordable/valid */
  validTheaters?: TheaterId[];
  /** For buildBase: per-theater, which budget lines the player can pay */
  validBudgetLines?: Partial<Record<string, BudgetLine[]>>;
  /** For card-based orders: which card IDs the player can afford */
  affordableCardIds?: string[];
}

/** Get validation info for a single order, accounting for cost reductions. */
export function validateOrder(
  state: GameState,
  playerId: string,
  orderId: OrderId,
): OrderValidation {
  const p = state.players[playerId];

  switch (orderId) {
    case 'lobby':
    case 'contracting':
    case 'logisticsSurge':
    case 'intelFocus':
      return { canAfford: true };

    case 'negotiate':
      return validateNegotiate(state, p);

    case 'startProgram':
      return validateStartProgram(state, p);

    case 'activateProgram':
      return validateActivateProgram(state, p);

    case 'refitMothball':
      return validateRefitMothball(p);

    case 'buildBase':
      return validateBuildBase(state, p);

    case 'forwardOps':
      return validateForwardOps(state, p);

    case 'stationPrograms':
      return validateStationPrograms(p);

    case 'majorExercise':
      return validateMajorExercise(state, p);

    default:
      return { canAfford: true };
  }
}

// --- Individual validators ---

function validateNegotiate(state: GameState, p: PlayerState): OrderValidation {
  const hasBaseAnywhere = Object.values(p.theaterPresence).some(pr => pr.bases > 0);
  if (hasBaseAnywhere || p.resources.secondary.PC >= 1) {
    return { canAfford: true };
  }
  return { canAfford: false, reason: 'Need a base in a theater or 1 Political Capital' };
}

function validateBuildBase(state: GameState, p: PlayerState): OrderValidation {
  const baseCost: Cost = { budget: { U: 2 } };
  const ctx: CostContext = { orderCategory: 'Deploy', orderId: 'buildBase' };

  const validTheaters: TheaterId[] = [];
  const validBudgetLines: Partial<Record<string, BudgetLine[]>> = {};

  for (const tid of THEATER_IDS) {
    // Check slot availability
    if (p.theaterPresence[tid].bases >= THEATER_SLOTS.bases) continue;

    const theaterCtx: CostContext = { ...ctx, theater: tid };
    const reducedBase = applyCostReductions(baseCost, p.costReductions, theaterCtx);

    // For each budget line, compute total cost = reducedBase + 1 of that line
    const affordableLines: BudgetLine[] = [];
    for (const bl of BUDGET_LINES) {
      const fullCost: Cost = {
        budget: { ...reducedBase.budget, [bl]: (reducedBase.budget[bl] ?? 0) + 1 },
        secondary: reducedBase.secondary,
      };
      if (canAfford(p.resources, fullCost)) {
        affordableLines.push(bl);
      }
    }

    if (affordableLines.length > 0) {
      validTheaters.push(tid);
      validBudgetLines[tid] = affordableLines;
    }
  }

  if (validTheaters.length > 0) {
    return { canAfford: true, validTheaters, validBudgetLines };
  }

  // Determine reason
  const hasSlot = THEATER_IDS.some(tid => p.theaterPresence[tid].bases < THEATER_SLOTS.bases);
  if (!hasSlot) return { canAfford: false, reason: 'All base slots full' };
  return { canAfford: false, reason: 'Cannot afford 2 Sustain + 1 of any line (after reductions)' };
}

function validateForwardOps(state: GameState, p: PlayerState): OrderValidation {
  const baseLCost = 1;
  const baseUCost = 2;

  // Directorate discounts
  let dLCost = baseLCost;
  let dUCost = baseUCost;
  if (p.directorate === 'MARFOR') dUCost = Math.max(0, dUCost - 1);
  if (p.directorate === 'TRANSCOM') dLCost = Math.max(0, dLCost - 1);

  const baseCost: Cost = { budget: { U: dUCost }, secondary: { L: dLCost } };
  const ctx: CostContext = { orderCategory: 'Deploy', orderId: 'forwardOps' };

  const validTheaters: TheaterId[] = [];

  for (const tid of THEATER_IDS) {
    if (p.theaterPresence[tid].bases < 1) continue;
    if (p.theaterPresence[tid].forwardOps >= THEATER_SLOTS.forwardOps) continue;

    const theaterCtx: CostContext = { ...ctx, theater: tid };
    const effective = applyCostReductions(baseCost, p.costReductions, theaterCtx);

    if (canAfford(p.resources, effective)) {
      validTheaters.push(tid);
    }
  }

  if (validTheaters.length > 0) {
    return { canAfford: true, validTheaters };
  }

  const hasBase = Object.values(p.theaterPresence).some(pr => pr.bases > 0);
  if (!hasBase) return { canAfford: false, reason: 'No base in any theater' };
  const hasSlot = THEATER_IDS.some(tid =>
    p.theaterPresence[tid].bases >= 1 && p.theaterPresence[tid].forwardOps < THEATER_SLOTS.forwardOps
  );
  if (!hasSlot) return { canAfford: false, reason: 'All forward ops slots full' };
  return { canAfford: false, reason: 'Cannot afford forward ops cost (after reductions)' };
}

function validateStartProgram(state: GameState, p: PlayerState): OrderValidation {
  if (p.hand.length === 0) return { canAfford: false, reason: 'No cards in hand' };
  if (!p.portfolio.pipeline.some(s => s === null)) return { canAfford: false, reason: 'Pipeline full' };

  const ctx: CostContext = { orderCategory: 'Procure', orderId: 'startProgram', action: 'pipeline' };
  const affordableCardIds: string[] = [];

  for (const card of p.hand) {
    const cardCtx: CostContext = { ...ctx, domain: card.domain, subtags: card.subtags as string[] };
    const effective = applyCostReductions(card.pipelineCost, p.costReductions, cardCtx);
    if (canAfford(p.resources, effective)) {
      affordableCardIds.push(card.id);
    }
  }

  if (affordableCardIds.length > 0) {
    return { canAfford: true, affordableCardIds };
  }
  return { canAfford: false, reason: "Can't afford any card in hand", affordableCardIds: [] };
}

function validateActivateProgram(state: GameState, p: PlayerState): OrderValidation {
  if (!p.portfolio.active.some(s => s === null)) return { canAfford: false, reason: 'Active slots full' };

  const ctx: CostContext = { orderCategory: 'Procure', orderId: 'activateProgram', action: 'activate' };
  const affordableCardIds: string[] = [];

  // Check pipeline cards
  for (const slot of p.portfolio.pipeline) {
    if (!slot) continue;
    const card = slot.card;
    let cost = { ...card.activeCost, budget: { ...card.activeCost.budget } };

    // AIRCOM passive discount
    if (p.directorate === 'AIRCOM' && card.domain === 'AIR' && !p.firstAirActivatedThisYear) {
      cost.budget.A = Math.max(0, (cost.budget.A ?? 0) - 1);
    }

    const cardCtx: CostContext = { ...ctx, domain: card.domain, subtags: card.subtags as string[] };
    const effective = applyCostReductions(cost, p.costReductions, cardCtx);
    if (canAfford(p.resources, effective)) {
      affordableCardIds.push(card.id);
    }
  }

  // Also check hand cards (can activate directly from hand)
  for (const card of p.hand) {
    let cost = { ...card.activeCost, budget: { ...card.activeCost.budget } };
    if (p.directorate === 'AIRCOM' && card.domain === 'AIR' && !p.firstAirActivatedThisYear) {
      cost.budget.A = Math.max(0, (cost.budget.A ?? 0) - 1);
    }
    const cardCtx: CostContext = { ...ctx, domain: card.domain, subtags: card.subtags as string[] };
    const effective = applyCostReductions(cost, p.costReductions, cardCtx);
    if (canAfford(p.resources, effective)) {
      affordableCardIds.push(card.id);
    }
  }

  if (affordableCardIds.length > 0) {
    return { canAfford: true, affordableCardIds };
  }

  const hasPipelineCards = p.portfolio.pipeline.some(s => s !== null);
  if (!hasPipelineCards) return { canAfford: false, reason: 'No programs in pipeline', affordableCardIds: [] };
  return { canAfford: false, reason: "Can't afford activation cost", affordableCardIds: [] };
}

function validateRefitMothball(p: PlayerState): OrderValidation {
  // Can mothball any active program (free)
  if (p.portfolio.active.some(s => s !== null)) {
    return { canAfford: true };
  }
  // Or reactivate from mothball
  if (p.portfolio.mothballed.length > 0) {
    const res = p.resources;
    const canReactivate = res.budget.U >= 3
      || (res.budget.U >= 1 && BUDGET_LINES.some(l => l !== 'U' && (res.budget[l] ?? 0) >= 1));
    if (canReactivate) return { canAfford: true };
    return { canAfford: false, reason: "Can't afford reactivation cost" };
  }
  return { canAfford: false, reason: 'No programs to refit' };
}

function validateStationPrograms(p: PlayerState): OrderValidation {
  if (p.portfolio.active.some(s => s?.card.stationing != null)) {
    return { canAfford: true };
  }
  return { canAfford: false, reason: 'No active programs with stationing capability' };
}

function validateMajorExercise(state: GameState, p: PlayerState): OrderValidation {
  const baseCost: Cost = { budget: { U: 1 }, secondary: { M: 1 } };
  const ctx: CostContext = { orderCategory: 'Sustain', orderId: 'majorExercise' };
  const effective = applyCostReductions(baseCost, p.costReductions, ctx);
  if (canAfford(p.resources, effective)) {
    return { canAfford: true };
  }
  const missing: string[] = [];
  if ((p.resources.budget.U ?? 0) < (effective.budget.U ?? 0)) missing.push('Sustain');
  if ((p.resources.secondary.M ?? 0) < (effective.secondary?.M ?? 0)) missing.push('Manpower');
  return { canAfford: false, reason: `Need ${missing.join(' + ')}` };
}

/** Compute the effective cost for buildBase in a specific theater with a specific budget line. */
export function getEffectiveBuildBaseCost(
  p: PlayerState,
  theater: TheaterId,
  extraBudgetLine: BudgetLine,
): Cost {
  const baseCost: Cost = { budget: { U: 2, [extraBudgetLine]: 1 } };
  // If extraBudgetLine is U, the base cost becomes U:3
  const ctx: CostContext = { orderCategory: 'Deploy', orderId: 'buildBase', theater };
  return applyCostReductions(baseCost, p.costReductions, ctx);
}

/** Compute the effective cost for forwardOps in a specific theater. */
export function getEffectiveForwardOpsCost(p: PlayerState, theater: TheaterId): Cost {
  let dUCost = 2;
  let dLCost = 1;
  if (p.directorate === 'MARFOR') dUCost = Math.max(0, dUCost - 1);
  if (p.directorate === 'TRANSCOM') dLCost = Math.max(0, dLCost - 1);
  const baseCost: Cost = { budget: { U: dUCost }, secondary: { L: dLCost } };
  const ctx: CostContext = { orderCategory: 'Deploy', orderId: 'forwardOps', theater };
  return applyCostReductions(baseCost, p.costReductions, ctx);
}

/** Compute the effective cost for activating a specific program card. */
export function getEffectiveActivationCost(p: PlayerState, card: { activeCost: Cost; domain: string; subtags: readonly string[] }): Cost {
  let cost = { ...card.activeCost, budget: { ...card.activeCost.budget } };
  if (p.directorate === 'AIRCOM' && card.domain === 'AIR' && !p.firstAirActivatedThisYear) {
    cost.budget.A = Math.max(0, (cost.budget.A ?? 0) - 1);
  }
  const ctx: CostContext = {
    orderCategory: 'Procure', orderId: 'activateProgram', action: 'activate',
    domain: card.domain, subtags: card.subtags as string[],
  };
  return applyCostReductions(cost, p.costReductions, ctx);
}

/** Compute the effective pipeline cost for a program card. */
export function getEffectivePipelineCost(p: PlayerState, card: { pipelineCost: Cost; domain: string; subtags: readonly string[] }): Cost {
  const ctx: CostContext = {
    orderCategory: 'Procure', orderId: 'startProgram', action: 'pipeline',
    domain: card.domain, subtags: card.subtags as string[],
  };
  return applyCostReductions(card.pipelineCost, p.costReductions, ctx);
}
