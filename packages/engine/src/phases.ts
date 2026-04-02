import type {
  GameState, GamePhase, QuarterStep, BudgetLine,
} from '@fp/shared';
import {
  BUDGET_LINES, SECONDARY_RESOURCES, THEATER_IDS,
  calcStrength, THEATER_CONTROL_SCORING,
  evaluateCondition, checkContractComplete,
} from '@fp/shared';
import { SeededRNG } from './rng.js';
import { resolveEffect } from './orders.js';

// === Phase transition helpers ===

function log(state: GameState, phase: GamePhase): void {
  state.log.push({ type: 'phaseChange', phase, fiscalYear: state.fiscalYear });
}

function getRNG(state: GameState): SeededRNG {
  // Derive a sub-seed so the RNG stays deterministic across calls
  return new SeededRNG(state.seed + state.fiscalYear * 1000 + phaseOrdinal(state.phase));
}

function phaseOrdinal(phase: GamePhase): number {
  switch (phase.type) {
    case 'setup': return 0;
    case 'congress': return 1;
    case 'contractMarket': return 2;
    case 'quarter': return 3 + phase.quarter * 10 + stepOrdinal(phase.step);
    case 'yearEnd': return 50;
    case 'gameEnd': return 99;
  }
}

function stepOrdinal(step: QuarterStep): number {
  switch (step) {
    case 'crisisPulse': return 0;
    case 'planOrders': return 1;
    case 'resolveOrders': return 2;
    case 'cleanup': return 3;
  }
}

// === Start a new Fiscal Year ===

export function startFiscalYear(state: GameState): void {
  // Reset per-year player tracking
  for (const pid of state.turnOrder) {
    const p = state.players[pid];
    p.usedOncePerYear = false;
    p.firstAirActivatedThisYear = false;
    p.firstNetworkActivatedThisYear = false;
    p.costReductions = [];
    p.coveredTheaters = [];
    p.crisisImmunities = [];
    p.sustainOrdersThisYear = [];
  }

  // Produce resources for all players
  produceResources(state);

  // Apply yearStart sustain effects from all active programs
  for (const pid of state.turnOrder) {
    for (const slot of state.players[pid].portfolio.active) {
      if (!slot) continue;
      for (let ei = 0; ei < slot.card.sustainEffects.length; ei++) {
        const effect = slot.card.sustainEffects[ei];
        if ((effect.params as Record<string, unknown>)?.timing === 'yearStart') {
          resolveEffect(state, pid, effect);
          if (!slot.sustainAwardCounts) slot.sustainAwardCounts = new Array(slot.card.sustainEffects.length).fill(0);
          slot.sustainAwardCounts[ei]++;
          state.log.push({ type: 'sustainEffect', playerId: pid, cardId: slot.card.id, timing: 'yearStart' });
        }
      }
    }
  }

  // Move to Congress phase
  state.phase = { type: 'congress' };
  log(state, state.phase);
}

// === Production ===

function produceResources(state: GameState): void {
  for (const pid of state.turnOrder) {
    const p = state.players[pid];
    for (const line of BUDGET_LINES) {
      const delta = p.resources.production.budget[line];
      p.resources.budget[line] += delta;
      if (delta > 0) state.log.push({ type: 'resourceChange', playerId: pid, resource: line, delta });
    }
    for (const res of SECONDARY_RESOURCES) {
      const delta = p.resources.production.secondary[res];
      p.resources.secondary[res] += delta;
      if (delta > 0) state.log.push({ type: 'resourceChange', playerId: pid, resource: res, delta });
    }
  }
}

// === Congress Phase (Phase A) ===

export function setupCongress(state: GameState): void {
  const rng = getRNG(state);
  if (state.decks.agendas.length === 0) {
    // No agendas left — skip congress
    state.phase = { type: 'contractMarket' };
    log(state, state.phase);
    return;
  }

  const agenda = rng.draw(state.decks.agendas, 1)[0];
  state.currentAgenda = {
    agenda,
    commitments: {},
    resolved: false,
    passed: false,
  };
  state.log.push({ type: 'agendaRevealed', agendaId: agenda.id });
}

export function submitAgendaVote(
  state: GameState,
  playerId: string,
  amount: number,
  support: boolean,
): void {
  if (!state.currentAgenda || state.currentAgenda.resolved) return;

  const player = state.players[playerId];
  const pcToSpend = Math.min(amount, player.resources.secondary.PC);
  player.resources.secondary.PC -= pcToSpend;

  state.currentAgenda.commitments[playerId] = { amount: pcToSpend, support };
  state.log.push({ type: 'agendaVote', playerId, amount: pcToSpend, support });
}

export function resolveAgenda(state: GameState): void {
  if (!state.currentAgenda || state.currentAgenda.resolved) return;

  const votes = state.currentAgenda.commitments;
  let supportTotal = 0;
  let opposeTotal = 0;

  for (const { amount, support } of Object.values(votes)) {
    if (support) supportTotal += amount;
    else opposeTotal += amount;
  }

  state.currentAgenda.passed = supportTotal > opposeTotal;
  state.currentAgenda.resolved = true;

  state.log.push({ type: 'agendaResult', passed: state.currentAgenda.passed });

  // Apply agenda effects to all players
  const effects = state.currentAgenda.passed
    ? state.currentAgenda.agenda.passEffects
    : state.currentAgenda.agenda.failEffects;
  for (let ei = 0; ei < effects.length; ei++) {
    for (const pid of state.turnOrder) {
      resolveEffect(state, pid, effects[ei]);
      state.log.push({ type: 'agendaEffectApplied', playerId: pid, passed: state.currentAgenda.passed, effectIdx: ei });
    }
  }

  // Move to contract market
  state.phase = { type: 'contractMarket' };
  log(state, state.phase);
}

// === Contract Market (Phase B) ===

export function setupContractMarket(state: GameState): void {
  // Fill market to 3 contracts
  while (state.contractMarket.length < 3 && state.decks.contracts.length > 0) {
    state.contractMarket.push(state.decks.contracts.shift()!);
  }
}

export function takeContract(state: GameState, playerId: string, contractId: string): boolean {
  const player = state.players[playerId];
  if (player.contracts.length >= state.config.maxActiveContracts) return false;

  const idx = state.contractMarket.findIndex(c => c.id === contractId);
  if (idx === -1) return false;

  const contract = state.contractMarket.splice(idx, 1)[0];
  player.contracts.push({ card: contract, progress: {} });

  state.log.push({ type: 'contractTaken', playerId, contractId });

  // Apply immediate award effects
  for (const effect of contract.immediateAward) {
    resolveEffect(state, playerId, effect);
  }

  return true;
}

export function endContractMarket(state: GameState): void {
  state.phase = { type: 'quarter', quarter: 1, step: 'crisisPulse' };
  log(state, state.phase);
}

/** NAVSEA once-per-year action: move 1 budget from one line to another. */
export function useNavseaReprogram(
  state: GameState,
  playerId: string,
  from: BudgetLine,
  to: BudgetLine,
): boolean {
  const player = state.players[playerId];
  if (!player) return false;
  if (player.directorate !== 'NAVSEA') return false;
  if (player.usedOncePerYear) return false;
  if (from === to) return false;
  if (player.resources.budget[from] < 1) return false;

  player.resources.budget[from] -= 1;
  player.resources.budget[to] += 1;
  player.usedOncePerYear = true;

  state.log.push({ type: 'resourceChange', playerId, resource: from, delta: -1 });
  state.log.push({ type: 'resourceChange', playerId, resource: to, delta: 1 });

  return true;
}

/** TRANSCOM once-per-year action: convert 2 U into 1 of any budget line. */
export function useTranscomConversion(
  state: GameState,
  playerId: string,
  to: BudgetLine,
): boolean {
  const player = state.players[playerId];
  if (!player) return false;
  if (player.directorate !== 'TRANSCOM') return false;
  if (player.usedOncePerYear) return false;
  if (player.resources.budget.U < 2) return false;

  player.resources.budget.U -= 2;
  player.resources.budget[to] += 1;
  player.usedOncePerYear = true;

  state.log.push({ type: 'resourceChange', playerId, resource: 'U', delta: -2 });
  state.log.push({ type: 'resourceChange', playerId, resource: to, delta: 1 });

  return true;
}

/** SPACECY once-per-year action: peek next crisis, optionally bury it by paying 1 PC. */
export function useSpacecyCrisisPeek(
  state: GameState,
  playerId: string,
  bury: boolean,
): boolean {
  const player = state.players[playerId];
  if (!player) return false;
  if (player.directorate !== 'SPACECY') return false;
  if (player.usedOncePerYear) return false;
  if (state.phase.type !== 'quarter' || state.phase.step !== 'crisisPulse') return false;
  if (state.decks.crises.length === 0) return false;
  if (bury && player.resources.secondary.PC < 1) return false;

  state.log.push({ type: 'crisisPeek', playerId, cardId: state.decks.crises[0].id });

  if (bury) {
    player.resources.secondary.PC -= 1;
    state.log.push({ type: 'resourceChange', playerId, resource: 'PC', delta: -1 });
    const buried = state.decks.crises.shift()!;
    state.decks.crises.push(buried);
  }

  player.usedOncePerYear = true;
  return true;
}

// === Quarter Phases (Phase C) ===

export function setupCrisisPulse(state: GameState): void {
  if (state.decks.crises.length > 0) {
    const crisis = state.decks.crises.shift()!;
    state.currentCrisis = crisis;
    state.log.push({ type: 'crisisRevealed', crisisId: crisis.id });

    // Apply crisis immediateEffects to all players
    for (const pid of state.turnOrder) {
      for (let ei = 0; ei < crisis.immediateEffects.length; ei++) {
        resolveEffect(state, pid, crisis.immediateEffects[ei]);
        state.log.push({ type: 'crisisEffectApplied', playerId: pid, crisisId: crisis.id, category: 'immediate', effectIdx: ei });
      }
    }

    // Fire crisisReveal sustain effects from all active programs
    for (const pid of state.turnOrder) {
      for (const slot of state.players[pid].portfolio.active) {
        if (!slot) continue;
        for (let ei = 0; ei < slot.card.sustainEffects.length; ei++) {
          const effect = slot.card.sustainEffects[ei];
          if ((effect.params as Record<string, unknown>)?.timing === 'crisisReveal') {
            resolveEffect(state, pid, effect);
            if (!slot.sustainAwardCounts) slot.sustainAwardCounts = new Array(slot.card.sustainEffects.length).fill(0);
            slot.sustainAwardCounts[ei]++;
            state.log.push({ type: 'sustainEffect', playerId: pid, cardId: slot.card.id, timing: 'crisisReveal' });
          }
        }
      }
    }

    // Fire crisisPeek sustain effects (let player see next crisis)
    for (const pid of state.turnOrder) {
      for (const slot of state.players[pid].portfolio.active) {
        if (!slot) continue;
        for (let ei = 0; ei < slot.card.sustainEffects.length; ei++) {
          const effect = slot.card.sustainEffects[ei];
          if ((effect.params as Record<string, unknown>)?.timing === 'crisisPeek') {
            if (state.decks.crises.length > 0) {
              state.log.push({ type: 'crisisPeek', playerId: pid, cardId: state.decks.crises[0].id });
            }
            if (!slot.sustainAwardCounts) slot.sustainAwardCounts = new Array(slot.card.sustainEffects.length).fill(0);
            slot.sustainAwardCounts[ei]++;
            state.log.push({ type: 'sustainEffect', playerId: pid, cardId: slot.card.id, timing: 'crisisPeek' });
          }
        }
      }
    }
  }

  // Reset per-quarter player flags
  for (const pid of state.turnOrder) {
    state.players[pid].logisticsSurgeThisQuarter = false;
  }

  // Apply quarterStart sustain effects from all active programs
  for (const pid of state.turnOrder) {
    for (const slot of state.players[pid].portfolio.active) {
      if (!slot) continue;
      for (let ei = 0; ei < slot.card.sustainEffects.length; ei++) {
        const effect = slot.card.sustainEffects[ei];
        if ((effect.params as Record<string, unknown>)?.timing === 'quarterStart') {
          resolveEffect(state, pid, effect);
          if (!slot.sustainAwardCounts) slot.sustainAwardCounts = new Array(slot.card.sustainEffects.length).fill(0);
          slot.sustainAwardCounts[ei]++;
          state.log.push({ type: 'sustainEffect', playerId: pid, cardId: slot.card.id, timing: 'quarterStart' });
        }
      }
    }
  }
}

export function endCrisisPulse(state: GameState): void {
  if (state.phase.type !== 'quarter') return;
  state.phase = { type: 'quarter', quarter: state.phase.quarter, step: 'planOrders' };
  log(state, state.phase);
}

export function submitOrders(
  state: GameState,
  playerId: string,
  orders: [import('@fp/shared').OrderChoice, import('@fp/shared').OrderChoice],
): void {
  state.players[playerId].selectedOrders = orders;
}

export function allOrdersSubmitted(state: GameState): boolean {
  return state.turnOrder.every(pid => state.players[pid].selectedOrders !== null);
}

export function revealOrders(state: GameState): void {
  if (state.phase.type !== 'quarter') return;

  // Log all reveals
  for (const pid of state.turnOrder) {
    const orders = state.players[pid].selectedOrders;
    if (orders) {
      state.log.push({ type: 'orderRevealed', playerId: pid, orders });
    }
  }

  state.phase = { type: 'quarter', quarter: state.phase.quarter, step: 'resolveOrders' };
  log(state, state.phase);
}

export function endResolveOrders(state: GameState): void {
  if (state.phase.type !== 'quarter') return;
  state.phase = { type: 'quarter', quarter: state.phase.quarter, step: 'cleanup' };
  log(state, state.phase);
}

export function quarterCleanup(state: GameState): void {
  if (state.phase.type !== 'quarter') return;
  const quarter = state.phase.quarter;

  // Discard down to hand limit
  for (const pid of state.turnOrder) {
    const p = state.players[pid];
    while (p.hand.length > state.config.handLimit) {
      const discarded = p.hand.pop()!;
      state.decks.programDiscard.push(discarded);
    }
  }

  // Clear selected orders
  for (const pid of state.turnOrder) {
    state.players[pid].selectedOrders = null;
  }

  // Clear current crisis
  state.currentCrisis = null;

  // Advance to next quarter or year end
  if (quarter < 4) {
    const nextQuarter = (quarter + 1) as 1 | 2 | 3 | 4;
    state.phase = { type: 'quarter', quarter: nextQuarter, step: 'crisisPulse' };

    // Draw cards for new quarter
    for (const pid of state.turnOrder) {
      const drawn = state.decks.programs.splice(0, state.config.drawPerQuarter);
      state.players[pid].hand.push(...drawn);
    }
  } else {
    state.phase = { type: 'yearEnd' };
  }
  log(state, state.phase);
}

// === Year End (Phase D) ===

export function processYearEnd(state: GameState): void {
  // 1. Portfolio maturation: pipeline programs either activate, stay, or discard
  for (const pid of state.turnOrder) {
    const p = state.players[pid];
    for (let i = 0; i < p.portfolio.pipeline.length; i++) {
      const slot = p.portfolio.pipeline[i];
      if (!slot) continue;
      slot.yearsInPipeline = (slot.yearsInPipeline ?? 0) + 1;
      // Auto-logic: if there's a free active slot, move to active (simplified — real game needs player choice)
      // For now, just increment the year counter. Player-driven maturation will be added.
    }
  }

  // 1b. Year-end sustain effects from active programs
  for (const pid of state.turnOrder) {
    const p = state.players[pid];
    for (const slot of p.portfolio.active) {
      if (!slot) continue;
      for (let ei = 0; ei < slot.card.sustainEffects.length; ei++) {
        const effect = slot.card.sustainEffects[ei];
        const params = effect.params as Record<string, unknown>;
        if (params?.timing !== 'yearEnd') continue;

        if (effect.type === 'conditionalSI') {
          const condition = params.condition as string;
          const si = (params.si as number) ?? 0;
          const met = evaluateCondition(state, pid, condition, params);
          if (met && si !== 0) {
            p.si += si;
            if (!slot.sustainAwardCounts) slot.sustainAwardCounts = new Array(slot.card.sustainEffects.length).fill(0);
            slot.sustainAwardCounts[ei]++;
            state.log.push({ type: 'siChange', playerId: pid, delta: si, reason: 'sustainEffect' });
            state.log.push({ type: 'sustainEffect', playerId: pid, cardId: slot.card.id, timing: 'yearEnd' });
          }
        } else {
          // Handle all other yearEnd sustain effect types (gainSI with per/subtag, etc.)
          resolveEffect(state, pid, effect);
          if (!slot.sustainAwardCounts) slot.sustainAwardCounts = new Array(slot.card.sustainEffects.length).fill(0);
          slot.sustainAwardCounts[ei]++;
          state.log.push({ type: 'sustainEffect', playerId: pid, cardId: slot.card.id, timing: 'yearEnd' });
        }
      }
    }
  }

  // 2. Contract completion check
  for (const pid of state.turnOrder) {
    const p = state.players[pid];
    const completed: number[] = [];
    const failed: number[] = [];

    for (let i = 0; i < p.contracts.length; i++) {
      const ac = p.contracts[i];
      const isComplete = checkContractComplete(p, ac.card.requirements);
      if (isComplete) {
        p.si += ac.card.rewardSI;
        state.log.push({ type: 'contractCompleted', playerId: pid, contractId: ac.card.id, si: ac.card.rewardSI });
        // MARFOR once/year: first completed contract each fiscal year gives +1 PC.
        if (p.directorate === 'MARFOR' && !p.usedOncePerYear) {
          p.resources.secondary.PC += 1;
          p.usedOncePerYear = true;
          state.log.push({ type: 'resourceChange', playerId: pid, resource: 'PC', delta: 1 });
        }
        // Apply contract reward effects
        if (ac.card.rewardEffects) {
          for (const effect of ac.card.rewardEffects) {
            resolveEffect(state, pid, effect);
          }
        }
        completed.push(i);
      } else {
        p.si += ac.card.failurePenaltySI; // negative
        state.log.push({ type: 'contractFailed', playerId: pid, contractId: ac.card.id, penalty: ac.card.failurePenaltySI });
        // Apply contract failure effects
        if (ac.card.failureEffects) {
          for (const effect of ac.card.failureEffects) {
            resolveEffect(state, pid, effect);
          }
        }
        failed.push(i);
      }
    }

    // Remove completed/failed contracts (reverse order to preserve indices)
    for (const i of [...completed, ...failed].sort((a, b) => b - a)) {
      p.contracts.splice(i, 1);
    }
  }

  // 3. Theater control scoring
  scoreTheaterControl(state);

  state.log.push({ type: 'yearEnd', fiscalYear: state.fiscalYear });

  // Advance to next year or game end
  if (state.fiscalYear >= state.config.fiscalYears) {
    // Fire endgame sustain effects before final scoring
    for (const pid of state.turnOrder) {
      const p = state.players[pid];
      for (const slot of p.portfolio.active) {
        if (!slot) continue;
        for (let ei = 0; ei < slot.card.sustainEffects.length; ei++) {
          const effect = slot.card.sustainEffects[ei];
          const params = effect.params as Record<string, unknown>;
          if (params?.timing !== 'endgame') continue;

          if (effect.type === 'conditionalSI') {
            const condition = params.condition as string;
            const si = (params.si as number) ?? 0;
            const met = evaluateCondition(state, pid, condition, params);
            if (met && si !== 0) {
              p.si += si;
              if (!slot.sustainAwardCounts) slot.sustainAwardCounts = new Array(slot.card.sustainEffects.length).fill(0);
              slot.sustainAwardCounts[ei]++;
              state.log.push({ type: 'siChange', playerId: pid, delta: si, reason: 'endgameSustain' });
              state.log.push({ type: 'sustainEffect', playerId: pid, cardId: slot.card.id, timing: 'endgame' });
            }
          } else {
            resolveEffect(state, pid, effect);
            if (!slot.sustainAwardCounts) slot.sustainAwardCounts = new Array(slot.card.sustainEffects.length).fill(0);
            slot.sustainAwardCounts[ei]++;
            state.log.push({ type: 'sustainEffect', playerId: pid, cardId: slot.card.id, timing: 'endgame' });
          }
        }
      }
    }

    state.phase = { type: 'gameEnd' };
    log(state, state.phase);
  } else {
    state.fiscalYear++;
    startFiscalYear(state);
  }
}

// checkContractComplete is now imported from @fp/shared (shared/src/rules.ts)

// === Theater Control Scoring ===

function scoreTheaterControl(state: GameState): void {
  for (const tid of THEATER_IDS) {
    const rankings: Array<{ playerId: string; strength: number }> = [];

    for (const pid of state.turnOrder) {
      const presence = state.board.theaters[tid].presence[pid];
      if (presence) {
        rankings.push({ playerId: pid, strength: calcStrength(presence) });
      }
    }

    // Sort by strength descending
    rankings.sort((a, b) => b.strength - a.strength);

    // Only score if someone has presence
    if (rankings.length === 0 || rankings[0].strength === 0) continue;

    // AIRCOM once/year: if tied for first in a theater, AIRCOM takes outright first.
    const topStrength = rankings[0].strength;
    const tiedTop = rankings.filter(r => r.strength === topStrength);
    if (tiedTop.length > 1) {
      const aircomWinner = tiedTop.find(r => {
        const pl = state.players[r.playerId];
        return pl.directorate === 'AIRCOM' && !pl.usedOncePerYear;
      });
      if (aircomWinner) {
        state.players[aircomWinner.playerId].usedOncePerYear = true;
        rankings.sort((a, b) => {
          if (a.playerId === aircomWinner.playerId) return -1;
          if (b.playerId === aircomWinner.playerId) return 1;
          return b.strength - a.strength;
        });
      }
    }

    const scored: Array<{ playerId: string; si: number }> = [];

    // 1st place
    if (rankings[0].strength > 0) {
      state.players[rankings[0].playerId].si += THEATER_CONTROL_SCORING.first;
      scored.push({ playerId: rankings[0].playerId, si: THEATER_CONTROL_SCORING.first });
    }

    // 2nd place (must have > 0 strength and not tied with 1st handled separately)
    if (rankings.length > 1 && rankings[1].strength > 0) {
      state.players[rankings[1].playerId].si += THEATER_CONTROL_SCORING.second;
      scored.push({ playerId: rankings[1].playerId, si: THEATER_CONTROL_SCORING.second });
    }

    // 3rd place (4-5 players only)
    if (state.config.playerCount >= 4 && rankings.length > 2 && rankings[2].strength > 0) {
      state.players[rankings[2].playerId].si += THEATER_CONTROL_SCORING.third;
      scored.push({ playerId: rankings[2].playerId, si: THEATER_CONTROL_SCORING.third });
    }

    if (scored.length > 0) {
      state.log.push({ type: 'theaterControlScored', theater: tid, rankings: scored });
    }
  }
}
