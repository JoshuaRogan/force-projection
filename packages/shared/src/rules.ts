/**
 * Pure game-rule functions used by both engine and client.
 * These evaluate game state without mutating it.
 */

import type { GameState, PlayerState } from './gamestate.js';
import type { ContractRequirement, ProgramCard } from './cards.js';
import { THEATER_IDS, calcStrength } from './theaters.js';

// === Condition evaluation (sustain effects, conditional SI) ===

/**
 * Evaluate a named condition for conditionalSI / sustain effects.
 * Used by engine (year-end scoring, activation) and client (sustain status display).
 */
export function evaluateCondition(
  state: GameState,
  playerId: string,
  condition: string,
  params: Record<string, unknown>,
): boolean {
  const p = state.players[playerId];
  switch (condition) {
    case 'readiness':
      return p.readiness >= ((params.threshold as number) ?? 0);
    case 'leadsAnyTheater':
      for (const tid of THEATER_IDS) {
        const myStr = calcStrength(p.theaterPresence[tid]);
        if (myStr > 0 && state.turnOrder
          .filter(pid => pid !== playerId)
          .every(pid2 => calcStrength(state.players[pid2].theaterPresence[tid]) < myStr)) {
          return true;
        }
      }
      return false;
    case 'baseCount': {
      const count = Object.values(p.theaterPresence).filter(pr => pr.bases > 0).length;
      return count >= ((params.threshold as number) ?? 0);
    }
    case 'forwardOpsCount': {
      const count = Object.values(p.theaterPresence).filter(pr => pr.forwardOps > 0).length;
      return count >= ((params.threshold as number) ?? 0);
    }
    case 'activeSubtagCount': {
      const subtag = params.subtag as string;
      const threshold = (params.threshold as number) ?? 0;
      const count = p.portfolio.active.filter(
        s => s && s.card.subtags.includes(subtag as never)
      ).length;
      return count >= threshold;
    }
    default:
      return false;
  }
}

// === Contract requirement checking ===

/**
 * Check a single contract requirement against a player's state.
 * Returns true (met), false (not met), or null (can't determine).
 */
export function checkRequirement(
  req: ContractRequirement,
  player: PlayerState,
): boolean | null {
  const p = req.params as Record<string, unknown>;

  switch (req.type) {
    case 'readinessThreshold': {
      const threshold = (p.threshold as number) ?? 0;
      return player.readiness >= threshold;
    }

    case 'sustainOrderCount': {
      const needed = (p.quarters as number) ?? 0;
      return player.sustainOrdersThisYear.length >= needed;
    }

    case 'theaterPresence': {
      const needed = (p.count as number) ?? 0;
      let count = 0;
      for (const presence of Object.values(player.theaterPresence)) {
        if (presence.bases > 0 || presence.alliances > 0 || presence.forwardOps > 0) count++;
      }
      return count >= needed;
    }

    case 'baseInTheater': {
      const theater = p.theater as string | undefined;
      if (!theater) return null;
      return (player.theaterPresence[theater as keyof typeof player.theaterPresence]?.bases ?? 0) >= 1;
    }

    case 'forwardOpsInTheater': {
      const theaters = p.theaters as string[] | undefined;
      const count = p.count as number | undefined;
      if (theaters) {
        return theaters.some(t =>
          (player.theaterPresence[t as keyof typeof player.theaterPresence]?.forwardOps ?? 0) > 0
        );
      }
      if (count) {
        let fwdCount = 0;
        for (const presence of Object.values(player.theaterPresence)) {
          if (presence.forwardOps > 0) fwdCount++;
        }
        return fwdCount >= count;
      }
      return null;
    }

    case 'allianceCount': {
      const theater = p.theater as string | undefined;
      const neededCount = (p.count as number) ?? 0;
      const neededTheaters = p.theaters as number | undefined;
      if (theater) {
        return (player.theaterPresence[theater as keyof typeof player.theaterPresence]?.alliances ?? 0) >= neededCount;
      }
      if (neededTheaters) {
        let theatersWithAlliance = 0;
        let totalAlliances = 0;
        for (const presence of Object.values(player.theaterPresence)) {
          if (presence.alliances > 0) {
            theatersWithAlliance++;
            totalAlliances += presence.alliances;
          }
        }
        return totalAlliances >= neededCount && theatersWithAlliance >= neededTheaters;
      }
      return null;
    }

    case 'activeProgramTag': {
      const subtag = p.subtag as string | undefined;
      const domainCount = p.domainCount as number | undefined;
      const needed = (p.count as number) ?? 0;
      if (subtag) {
        let tagCount = 0;
        for (const slot of player.portfolio.active) {
          if (slot && slot.card.subtags.includes(subtag as never)) tagCount++;
        }
        return tagCount >= needed;
      }
      if (domainCount) {
        const domains = new Set<string>();
        for (const slot of player.portfolio.active) {
          if (slot) domains.add(slot.card.domain);
        }
        return domains.size >= domainCount;
      }
      return null;
    }

    case 'stationProgram': {
      const theater = p.theater as string | undefined;
      const theaterCount = p.theaterCount as number | undefined;
      if (theater) {
        return player.stationedPrograms.some(sp => sp.theater === theater);
      }
      if (theaterCount) {
        const theaters = new Set(player.stationedPrograms.map(sp => sp.theater));
        return theaters.size >= theaterCount;
      }
      return null;
    }

    case 'custom':
    default:
      return null;
  }
}

/**
 * Check ALL requirements for a contract. Returns true if all are met.
 */
export function checkContractComplete(
  player: PlayerState,
  requirements: ContractRequirement[],
): boolean {
  for (const req of requirements) {
    const result = checkRequirement(req, player);
    if (result === false) return false;
    // null (can't determine) is treated as passing in the engine
  }
  return true;
}

/**
 * Check if a program card has any SI-granting effects (for UI badge display).
 */
export function hasSIBonus(card: ProgramCard): boolean {
  if ((card.printedSI ?? 0) > 0) return true;
  return [...card.activateEffects, ...card.sustainEffects].some(
    e => e.type === 'gainSI' || e.type === 'conditionalSI'
  );
}
