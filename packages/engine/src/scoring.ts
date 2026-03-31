import type { GameState } from '@fp/shared';
import { THEATER_IDS, calcStrength } from '@fp/shared';

/**
 * Compute final endgame scoring bonuses and determine winner.
 * Called when phase is 'gameEnd'.
 */
export function computeEndgameScoring(state: GameState): Record<string, number> {
  const finalScores: Record<string, number> = {};

  for (const pid of state.turnOrder) {
    const p = state.players[pid];
    let bonus = 0;

    // 1. Program set bonuses: +3 SI per full set of (AIR, SEA, EXP, SPACE_CYBER) in Active
    const domainCounts = { AIR: 0, SEA: 0, EXP: 0, SPACE_CYBER: 0 };
    for (const slot of p.portfolio.active) {
      if (slot) {
        domainCounts[slot.card.domain]++;
      }
    }
    const fullSets = Math.min(
      domainCounts.AIR,
      domainCounts.SEA,
      domainCounts.EXP,
      domainCounts.SPACE_CYBER,
      2, // max 2 sets
    );
    bonus += fullSets * 3;

    // 2. +2 SI if completed all contracts (no failures)
    // This is tracked implicitly — if the player has no contract failures logged
    const failures = state.log.filter(
      e => e.type === 'contractFailed' && e.playerId === pid
    );
    const completions = state.log.filter(
      e => e.type === 'contractCompleted' && e.playerId === pid
    );
    if (completions.length > 0 && failures.length === 0) {
      bonus += 2;
    }

    // 3. +1 SI per theater with any presence
    let theaterPresenceCount = 0;
    for (const presence of Object.values(p.theaterPresence)) {
      if (presence.bases > 0 || presence.alliances > 0 || presence.forwardOps > 0) {
        theaterPresenceCount++;
      }
    }
    bonus += theaterPresenceCount;

    // 4. Add printed SI from active programs
    for (const slot of p.portfolio.active) {
      if (slot?.card.printedSI) {
        bonus += slot.card.printedSI;
      }
    }

    p.si += bonus;
    finalScores[pid] = p.si;
  }

  state.log.push({ type: 'gameEnd', finalScores });
  return finalScores;
}

/** Determine winner with tiebreakers */
export function determineWinner(state: GameState): { winnerId: string; scores: Record<string, number> } {
  const scores = computeEndgameScoring(state);

  const ranked = state.turnOrder
    .map(pid => ({
      pid,
      si: scores[pid],
      contractsCompleted: state.log.filter(e => e.type === 'contractCompleted' && e.playerId === pid).length,
      theatersControlled: countTheatersControlled(state, pid),
      pcRemaining: state.players[pid].resources.secondary.PC,
    }))
    .sort((a, b) => {
      if (b.si !== a.si) return b.si - a.si;
      if (b.contractsCompleted !== a.contractsCompleted) return b.contractsCompleted - a.contractsCompleted;
      if (b.theatersControlled !== a.theatersControlled) return b.theatersControlled - a.theatersControlled;
      return b.pcRemaining - a.pcRemaining;
    });

  return { winnerId: ranked[0].pid, scores };
}

function countTheatersControlled(state: GameState, playerId: string): number {
  let controlled = 0;

  for (const tid of THEATER_IDS) {
    let maxStrength = 0;
    let leaderId = '';

    for (const pid of state.turnOrder) {
      const presence = state.board.theaters[tid].presence[pid];
      if (presence) {
        const str = calcStrength(presence);
        if (str > maxStrength) {
          maxStrength = str;
          leaderId = pid;
        }
      }
    }

    if (leaderId === playerId) controlled++;
  }

  return controlled;
}
