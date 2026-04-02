import type { GameState, PlayerState, PortfolioSlot } from '@fp/shared';
import { evaluateCondition } from '@fp/shared';
import type { SustainEffectStatus } from '../components/cards/CardModalContext';

/**
 * Evaluate whether each sustain effect's condition is currently met.
 * Returns a SustainEffectStatus[] parallel to the card's sustainEffects array.
 * Delegates all condition logic to shared evaluateCondition().
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
      return { conditionMet: null, totalAwards };
    }

    const params = effect.params as Record<string, unknown>;
    const condition = params.condition as string;
    const met = evaluateCondition(gameState, player.id, condition, params);

    return { conditionMet: met, totalAwards };
  });
}
