import type { ContractCard, PlayerState } from '@fp/shared';
import { checkRequirement } from '@fp/shared';

/**
 * Returns one boolean|null per requirement in the contract.
 * true  = requirement currently met
 * false = requirement not met
 * null  = can't determine (custom type)
 *
 * Delegates to shared checkRequirement() — single source of truth.
 */
export function checkRequirements(
  contract: ContractCard,
  player: PlayerState,
): (boolean | null)[] {
  return contract.requirements.map(req => checkRequirement(req, player));
}
