import type { GameState, PlayerState, PortfolioSlot, TheaterId } from '@fp/shared';
import type { SustainEffectStatus } from '../components/cards/CardModalContext';

const THEATER_IDS: TheaterId[] = ['northAtlantic', 'indoPacific', 'middleEast', 'arctic', 'homeland', 'spaceCyber'];

function calcStrength(presence: { bases: number; alliances: number; forwardOps: number }): number {
  return (presence.bases ?? 0) * 2 + (presence.alliances ?? 0) + (presence.forwardOps ?? 0);
}

/**
 * Evaluate whether each sustain effect's condition is currently met.
 * Returns a SustainEffectStatus[] parallel to the card's sustainEffects array.
 */
export function evaluateSustainStatus(
  slot: PortfolioSlot,
  player: PlayerState,
  gameState: GameState,
): SustainEffectStatus[] {
  const counts = slot.sustainAwardCounts ?? [];
  return slot.card.sustainEffects.map((effect, i) => {
    const totalAwards = counts[i] ?? 0;

    if (effect.type !== 'conditionalSI') {
      // Non-conditional effects: no checkbox, just show awards
      return { conditionMet: null, totalAwards };
    }

    const params = effect.params as Record<string, unknown>;
    const condition = params.condition as string;
    let met = false;

    if (condition === 'readiness') {
      met = player.readiness >= ((params.threshold as number) ?? 0);
    } else if (condition === 'leadsAnyTheater') {
      for (const tid of THEATER_IDS) {
        const myStr = calcStrength(player.theaterPresence[tid]);
        if (myStr > 0 && gameState.turnOrder
          .filter(pid => pid !== player.id)
          .every(pid => calcStrength(gameState.players[pid].theaterPresence[tid]) < myStr)) {
          met = true;
          break;
        }
      }
    } else if (condition === 'baseCount') {
      const count = Object.values(player.theaterPresence).filter(pr => pr.bases > 0).length;
      met = count >= ((params.threshold as number) ?? 0);
    } else if (condition === 'activeSubtagCount') {
      const subtag = params.subtag as string;
      const threshold = (params.threshold as number) ?? 0;
      const count = player.portfolio.active.filter(
        s => s && s.card.subtags.includes(subtag as any)
      ).length;
      met = count >= threshold;
    }

    return { conditionMet: met, totalAwards };
  });
}
