import type {
  GameState, PlayerState, OrderChoice, OrderCategory,
  TheaterId, BudgetLine, Effect,
} from '@fp/shared';
import {
  ORDER_RESOLUTION_SEQUENCE, ORDERS, THEATER_SLOTS, STRENGTH_VALUES,
  canAfford, payCost, BUDGET_LINES, SECONDARY_RESOURCES, THEATER_IDS, calcStrength,
} from '@fp/shared';

// === Main resolver: process all orders for the current quarter ===

export function resolveAllOrders(state: GameState): void {
  // Collect all chosen orders grouped by category
  const ordersByCategory = new Map<OrderCategory, Array<{ playerId: string; choice: OrderChoice }>>();

  for (const cat of ORDER_RESOLUTION_SEQUENCE) {
    ordersByCategory.set(cat, []);
  }

  for (const pid of state.turnOrder) {
    const selected = state.players[pid].selectedOrders;
    if (!selected) continue;

    for (const choice of selected) {
      const def = ORDERS[choice.order];
      ordersByCategory.get(def.category)!.push({ playerId: pid, choice });
    }
  }

  // Resolve in sequence: Influence → Procure → Deploy → Sustain
  for (const cat of ORDER_RESOLUTION_SEQUENCE) {
    const entries = ordersByCategory.get(cat)!;
    // Within a category, resolve in turn order
    const sorted = entries.sort((a, b) =>
      state.turnOrder.indexOf(a.playerId) - state.turnOrder.indexOf(b.playerId)
    );

    for (const { playerId, choice } of sorted) {
      resolveOrder(state, playerId, choice);
      state.log.push({ type: 'orderResolved', playerId, order: choice });
    }
  }
}

// === Individual order resolvers ===

function resolveOrder(state: GameState, playerId: string, choice: OrderChoice): void {
  switch (choice.order) {
    case 'lobby': return resolveLobby(state, playerId);
    case 'negotiate': return resolveNegotiate(state, playerId, choice);
    case 'contracting': return resolveContracting(state, playerId);
    case 'startProgram': return resolveStartProgram(state, playerId, choice);
    case 'activateProgram': return resolveActivateProgram(state, playerId, choice);
    case 'refitMothball': return resolveRefitMothball(state, playerId, choice);
    case 'buildBase': return resolveBuildBase(state, playerId, choice);
    case 'forwardOps': return resolveForwardOps(state, playerId, choice);
    case 'stationPrograms': return resolveStationPrograms(state, playerId, choice);
    case 'majorExercise': return resolveMajorExercise(state, playerId);
    case 'logisticsSurge': return resolveLogisticsSurge(state, playerId);
    case 'intelFocus': return resolveIntelFocus(state, playerId, choice);
  }
}

// --- Influence Orders ---

function resolveLobby(state: GameState, playerId: string): void {
  const p = state.players[playerId];
  p.resources.secondary.PC += 2;
  state.log.push({ type: 'resourceChange', playerId, resource: 'PC', delta: 2 });

  // If agenda passed, gain +1 of favored budget line
  if (state.currentAgenda?.passed && state.currentAgenda.agenda.favoredBudgetLine) {
    const line = state.currentAgenda.agenda.favoredBudgetLine;
    p.resources.budget[line] += 1;
    state.log.push({ type: 'resourceChange', playerId, resource: line, delta: 1 });
  }
}

function resolveNegotiate(
  state: GameState,
  playerId: string,
  choice: Extract<OrderChoice, { order: 'negotiate' }>,
): void {
  const p = state.players[playerId];
  const theater = choice.theater;
  const presence = p.theaterPresence[theater];
  const boardPresence = state.board.theaters[theater].presence[playerId];

  // Check: need a base in theater, OR pay 1 PC
  const hasBase = presence.bases > 0;
  if (!hasBase && choice.payPC) {
    if (p.resources.secondary.PC < 1) return; // can't afford
    p.resources.secondary.PC -= 1;
  } else if (!hasBase) {
    return; // invalid
  }

  // Check alliance slot availability
  if (presence.alliances >= THEATER_SLOTS.alliances) return;

  presence.alliances += 1;
  boardPresence.alliances += 1;
  state.log.push({ type: 'alliancePlaced', playerId, theater });
}

function resolveContracting(state: GameState, playerId: string): void {
  const p = state.players[playerId];

  if (p.contracts.length >= state.config.maxActiveContracts) {
    // Already at max — gain +1 SI instead
    p.si += 1;
    state.log.push({ type: 'siChange', playerId, delta: 1, reason: 'contracting_at_max' });
    return;
  }

  // Draw 2 contracts, keep 1 (simplified: take first available from market, or draw from deck)
  if (state.decks.contracts.length >= 2) {
    const drawn = state.decks.contracts.splice(0, 2);
    // For now, keep first, put second on bottom
    p.contracts.push({ card: drawn[0], progress: {} });
    state.decks.contracts.push(drawn[1]);
    state.log.push({ type: 'contractTaken', playerId, contractId: drawn[0].id });
  } else if (state.decks.contracts.length === 1) {
    const drawn = state.decks.contracts.splice(0, 1);
    p.contracts.push({ card: drawn[0], progress: {} });
    state.log.push({ type: 'contractTaken', playerId, contractId: drawn[0].id });
  }
}

// --- Procure Orders ---

function resolveStartProgram(
  state: GameState,
  playerId: string,
  choice: Extract<OrderChoice, { order: 'startProgram' }>,
): void {
  const p = state.players[playerId];
  const cardIdx = p.hand.findIndex(c => c.id === choice.cardId);
  if (cardIdx === -1) return;

  const card = p.hand[cardIdx];
  const slot = choice.pipelineSlot;

  // Check pipeline slot is free
  if (slot < 0 || slot >= p.portfolio.pipeline.length || p.portfolio.pipeline[slot] !== null) return;

  // Check can afford pipeline cost
  if (!canAfford(p.resources, card.pipelineCost)) return;

  // Pay and place
  payCost(p.resources, card.pipelineCost);
  p.hand.splice(cardIdx, 1);
  p.portfolio.pipeline[slot] = { card, yearsInPipeline: 0 };

  state.log.push({ type: 'programPipelined', playerId, cardId: card.id });
}

function resolveActivateProgram(
  state: GameState,
  playerId: string,
  choice: Extract<OrderChoice, { order: 'activateProgram' }>,
): void {
  const p = state.players[playerId];
  const slot = choice.activeSlot;

  // Check active slot is free
  if (slot < 0 || slot >= p.portfolio.active.length || p.portfolio.active[slot] !== null) {
    state.log.push({ type: 'orderFailed', playerId, order: 'activateProgram', reason: `active slot ${slot} unavailable` });
    return;
  }

  // Card can come from hand or pipeline
  let card;
  let fromPipeline = -1;

  // Check hand first
  const handIdx = p.hand.findIndex(c => c.id === choice.cardId);
  if (handIdx !== -1) {
    card = p.hand[handIdx];
  } else {
    // Check pipeline
    for (let i = 0; i < p.portfolio.pipeline.length; i++) {
      if (p.portfolio.pipeline[i]?.card.id === choice.cardId) {
        card = p.portfolio.pipeline[i]!.card;
        fromPipeline = i;
        break;
      }
    }
  }

  if (!card) {
    state.log.push({ type: 'orderFailed', playerId, order: 'activateProgram', reason: 'card not found in pipeline or hand' });
    return;
  }

  // Apply AIRCOM passive discount before affordability check
  let cost = { ...card.activeCost, budget: { ...card.activeCost.budget } };
  const airgcomDiscount = p.directorate === 'AIRCOM' && card.domain === 'AIR' && !p.firstAirActivatedThisYear;
  if (airgcomDiscount) {
    cost.budget.A = Math.max(0, (cost.budget.A ?? 0) - 1);
  }

  if (!canAfford(p.resources, cost)) {
    state.log.push({ type: 'orderFailed', playerId, order: 'activateProgram', reason: 'insufficient resources' });
    return;
  }

  // Commit AIRCOM flag only after confirmed affordable
  if (airgcomDiscount) {
    p.firstAirActivatedThisYear = true;
  }

  // Pay and place
  payCost(p.resources, cost);

  if (handIdx !== -1) {
    p.hand.splice(handIdx, 1);
  } else if (fromPipeline >= 0) {
    p.portfolio.pipeline[fromPipeline] = null;
  }

  p.portfolio.active[slot] = { card };

  // NAVSEA passive: SEA-tag program → gain +1 U
  if (p.directorate === 'NAVSEA' && card.domain === 'SEA') {
    p.resources.budget.U += 1;
    state.log.push({ type: 'resourceChange', playerId, resource: 'U', delta: 1 });
  }

  // AIRCOM passive: first AIR → gain +1 I
  if (p.directorate === 'AIRCOM' && card.domain === 'AIR') {
    p.resources.secondary.I += 1;
    state.log.push({ type: 'resourceChange', playerId, resource: 'I', delta: 1 });
  }

  // SPACECY passive: first NETWORK → +1 I production
  if (p.directorate === 'SPACECY' && card.subtags.includes('Network') && !p.firstNetworkActivatedThisYear) {
    p.resources.production.secondary.I += 1;
    p.firstNetworkActivatedThisYear = true;
  }

  state.log.push({ type: 'programActivated', playerId, cardId: card.id });

  // Resolve activate effects
  for (const effect of card.activateEffects) {
    resolveEffect(state, playerId, effect);
  }
}

function resolveRefitMothball(
  state: GameState,
  playerId: string,
  choice: Extract<OrderChoice, { order: 'refitMothball' }>,
): void {
  const p = state.players[playerId];

  if (choice.action === 'mothball') {
    const slot = choice.programSlot;
    if (slot < 0 || slot >= p.portfolio.active.length || !p.portfolio.active[slot]) return;

    const card = p.portfolio.active[slot]!.card;
    p.portfolio.active[slot] = null;
    p.portfolio.mothballed.push(card);
    p.resources.budget.U += 1;

    // Remove any stationed programs from this slot
    p.stationedPrograms = p.stationedPrograms.filter(sp => sp.activeSlot !== slot);

    state.log.push({ type: 'programMothballed', playerId, cardId: card.id });
    state.log.push({ type: 'resourceChange', playerId, resource: 'U', delta: 1 });
  } else {
    // Reactivate from mothball
    const mbIdx = choice.programSlot;
    if (mbIdx < 0 || mbIdx >= p.portfolio.mothballed.length) return;

    // Find free active slot
    const freeSlot = p.portfolio.active.findIndex(s => s === null);
    if (freeSlot === -1) return;

    const card = p.portfolio.mothballed[mbIdx];

    // Cost: 1 U + 1 of its primary budget line
    const primaryLine = getPrimaryBudgetLine(card);
    const reactivateCost = { budget: { U: 1, [primaryLine]: 1 } };
    if (!canAfford(p.resources, reactivateCost)) return;

    payCost(p.resources, reactivateCost);
    p.portfolio.mothballed.splice(mbIdx, 1);
    p.portfolio.active[freeSlot] = { card };

    state.log.push({ type: 'programReactivated', playerId, cardId: card.id });
  }
}

function getPrimaryBudgetLine(card: import('@fp/shared').ProgramCard): BudgetLine {
  // Primary line = the budget line with the highest cost in activeCost
  let maxLine: BudgetLine = 'U';
  let maxVal = 0;
  for (const line of BUDGET_LINES) {
    const val = card.activeCost.budget[line] ?? 0;
    if (val > maxVal) {
      maxVal = val;
      maxLine = line;
    }
  }
  return maxLine;
}

// --- Deploy Orders ---

function resolveBuildBase(
  state: GameState,
  playerId: string,
  choice: Extract<OrderChoice, { order: 'buildBase' }>,
): void {
  const p = state.players[playerId];
  const theater = choice.theater;
  const presence = p.theaterPresence[theater];
  const boardPresence = state.board.theaters[theater].presence[playerId];

  // Check slot
  if (presence.bases >= THEATER_SLOTS.bases) return;

  // Cost: 2U + 1 of any line
  const cost = { budget: { U: 2, [choice.extraBudgetLine]: 1 } };
  if (!canAfford(p.resources, cost)) return;

  payCost(p.resources, cost);
  presence.bases += 1;
  boardPresence.bases += 1;

  state.log.push({ type: 'basePlaced', playerId, theater });
}

function resolveForwardOps(
  state: GameState,
  playerId: string,
  choice: Extract<OrderChoice, { order: 'forwardOps' }>,
): void {
  const p = state.players[playerId];
  const theater = choice.theater;
  const presence = p.theaterPresence[theater];
  const boardPresence = state.board.theaters[theater].presence[playerId];

  // Requirement: must have a base
  if (presence.bases < 1) return;

  // Check slot
  if (presence.forwardOps >= THEATER_SLOTS.forwardOps) return;

  // Cost: 1L + 2U
  let lCost = 1;
  let uCost = 2;

  // MARFOR passive: -1 E on forward ops (the rules say -1 E but cost is L+U, so this reduces the U cost)
  if (p.directorate === 'MARFOR') {
    uCost = Math.max(0, uCost - 1);
  }

  // TRANSCOM passive: pay 1 less L
  if (p.directorate === 'TRANSCOM') {
    lCost = Math.max(0, lCost - 1);
  }

  const cost = { budget: { U: uCost }, secondary: { L: lCost } };
  if (!canAfford(p.resources, cost)) return;

  payCost(p.resources, cost);
  presence.forwardOps += 1;
  boardPresence.forwardOps += 1;

  state.log.push({ type: 'forwardOpsPlaced', playerId, theater });
}

function resolveStationPrograms(
  state: GameState,
  playerId: string,
  choice: Extract<OrderChoice, { order: 'stationPrograms' }>,
): void {
  const p = state.players[playerId];

  // Max 2 assignments per order
  const assignments = choice.assignments.slice(0, 2);

  for (const { activeSlot, theater } of assignments) {
    const slot = p.portfolio.active[activeSlot];
    if (!slot) continue;

    // Check the program has stationing for this theater
    if (!slot.card.stationing) continue;
    if (!slot.card.stationing.theaters.includes(theater)) continue;

    // Remove any previous stationing for this slot
    p.stationedPrograms = p.stationedPrograms.filter(sp => sp.activeSlot !== activeSlot);

    // Add new stationing
    p.stationedPrograms.push({ activeSlot, theater });

    // Update theater strength
    const boardPresence = state.board.theaters[theater].presence[playerId];
    const playerPresence = p.theaterPresence[theater];
    boardPresence.stationedStrength += slot.card.stationing.strength;
    playerPresence.stationedStrength += slot.card.stationing.strength;

    state.log.push({ type: 'programStationed', playerId, activeSlot, theater });
  }
}

// --- Sustain Orders ---

function resolveMajorExercise(state: GameState, playerId: string): void {
  const p = state.players[playerId];

  // Cost: 1M + 1U
  let mCost = 1;
  const cost = { budget: { U: 1 }, secondary: { M: mCost } };
  if (!canAfford(p.resources, cost)) return;

  payCost(p.resources, cost);
  p.readiness += 2;
  state.log.push({ type: 'resourceChange', playerId, resource: 'readiness', delta: 2 });

  // Draw 1 card
  if (state.decks.programs.length > 0) {
    const drawn = state.decks.programs.splice(0, 1);
    p.hand.push(...drawn);
  }

  // Track sustain order for contract requirements
  if (state.phase.type === 'quarter') {
    p.sustainOrdersThisYear.push(state.phase.quarter);
  }
}

function resolveLogisticsSurge(state: GameState, playerId: string): void {
  const p = state.players[playerId];

  p.resources.secondary.L += 2;
  p.logisticsSurgeThisQuarter = true;
  state.log.push({ type: 'resourceChange', playerId, resource: 'L', delta: 2 });

  // Track sustain order
  if (state.phase.type === 'quarter') {
    p.sustainOrdersThisYear.push(state.phase.quarter);
  }
}

function resolveIntelFocus(
  state: GameState,
  playerId: string,
  choice: Extract<OrderChoice, { order: 'intelFocus' }>,
): void {
  const p = state.players[playerId];

  p.resources.secondary.I += 2;
  state.log.push({ type: 'resourceChange', playerId, resource: 'I', delta: 2 });

  // Optional: spend 1 I to change resolution position (tracked but not enforced here)
  if (choice.spendI && p.resources.secondary.I >= 1) {
    p.resources.secondary.I -= 1;
  }

  // Track sustain order
  if (state.phase.type === 'quarter') {
    p.sustainOrdersThisYear.push(state.phase.quarter);
  }
}

/** Apply a card effect to a player. Used for activateEffects and contract immediateAward. */
export function resolveEffect(state: GameState, playerId: string, effect: Effect): void {
  const p = state.players[playerId];
  const params = effect.params;

  switch (effect.type) {
    case 'gainBudget': {
      for (const line of BUDGET_LINES) {
        const amt = (params[line] as number | undefined) ?? 0;
        if (amt > 0) {
          p.resources.budget[line] += amt;
          state.log.push({ type: 'resourceChange', playerId, resource: line, delta: amt });
        }
      }
      break;
    }
    case 'gainSecondary': {
      for (const res of SECONDARY_RESOURCES) {
        const amt = (params[res] as number | undefined) ?? 0;
        if (amt !== 0) {
          p.resources.secondary[res] += amt;
          state.log.push({ type: 'resourceChange', playerId, resource: res, delta: amt });
        }
      }
      break;
    }
    case 'gainSI': {
      const si = (params.si as number) ?? 0;
      if (si !== 0) {
        p.si += si;
        state.log.push({ type: 'siChange', playerId, delta: si, reason: 'cardEffect' });
      }
      break;
    }
    case 'gainProduction': {
      if (params.choice) break; // player-choice variants deferred
      for (const line of BUDGET_LINES) {
        const amt = (params[line] as number | undefined) ?? 0;
        if (amt !== 0) p.resources.production.budget[line] += amt;
      }
      for (const res of SECONDARY_RESOURCES) {
        const amt = (params[res] as number | undefined) ?? 0;
        if (amt !== 0) p.resources.production.secondary[res] += amt;
      }
      break;
    }
    case 'drawCards': {
      const count = (params.count as number) ?? 1;
      const drawn = state.decks.programs.splice(0, count);
      p.hand.push(...drawn);
      break;
    }
    case 'modifyReadiness': {
      const timing = params.timing as string | undefined;
      // 'passive' means always-on — apply immediately at activation; skip timing-gated ones
      if (timing && timing !== 'passive') break;
      const bonus = (params.bonus as number) ?? 0;
      if (bonus !== 0) {
        p.readiness += bonus;
        state.log.push({ type: 'resourceChange', playerId, resource: 'readiness', delta: bonus });
      }
      break;
    }
    case 'placeAlliance': {
      const requireBase = params.requireBase as boolean | undefined;
      const theaters = params.theaters as string[] | undefined;
      const count = (params.count as number | undefined) ?? 1;
      const placed: TheaterId[] = [];
      for (let i = 0; i < count; i++) {
        const candidates = theaters
          ? (theaters as TheaterId[]).filter(t => !placed.includes(t))
          : THEATER_IDS.filter(t => !placed.includes(t));
        const target = candidates.find(tid => {
          if (p.theaterPresence[tid].alliances >= THEATER_SLOTS.alliances) return false;
          if (requireBase && p.theaterPresence[tid].bases < 1) return false;
          return true;
        });
        if (!target) break;
        p.theaterPresence[target].alliances += 1;
        state.board.theaters[target].presence[playerId].alliances += 1;
        state.log.push({ type: 'alliancePlaced', playerId, theater: target });
        placed.push(target);
      }
      break;
    }
    case 'placeBase': {
      const theaters = params.theaters as string[] | undefined;
      if (!theaters) break;
      const target = (theaters as TheaterId[]).find(
        tid => p.theaterPresence[tid].bases < THEATER_SLOTS.bases
      );
      if (target) {
        p.theaterPresence[target].bases += 1;
        state.board.theaters[target].presence[playerId].bases += 1;
        state.log.push({ type: 'basePlaced', playerId, theater: target });
      }
      break;
    }
    case 'conditionalSI': {
      const timing = params.timing as string | undefined;
      if (timing && timing !== 'activation') break;
      const condition = params.condition as string;
      const si = (params.si as number) ?? 0;
      let met = false;
      if (condition === 'readiness') {
        met = p.readiness >= ((params.threshold as number) ?? 0);
      } else if (condition === 'leadsAnyTheater') {
        for (const tid of THEATER_IDS) {
          const myStr = calcStrength(p.theaterPresence[tid]);
          if (myStr > 0 && state.turnOrder
            .filter(pid => pid !== playerId)
            .every(pid2 => calcStrength(state.players[pid2].theaterPresence[tid]) < myStr)) {
            met = true; break;
          }
        }
      }
      if (met && si !== 0) {
        p.si += si;
        state.log.push({ type: 'siChange', playerId, delta: si, reason: 'cardEffect' });
      }
      break;
    }
    default:
      break;
  }
}
