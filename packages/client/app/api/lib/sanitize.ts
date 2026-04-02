import type { GameState } from '@fp/shared';

/**
 * Strip secret information from GameState before sending to a specific player.
 * - Other players' hands are hidden
 * - Other players' pending orders are hidden (before reveal)
 * - Deck contents are hidden (prevents predicting draws)
 * - Seed is hidden (prevents RNG prediction)
 * - Vote commitments hidden until agenda is resolved
 */
export function sanitizeStateForPlayer(state: GameState, playerId: string): Record<string, unknown> {
  const sanitized = structuredClone(state) as unknown as Record<string, unknown>;
  const players = sanitized.players as Record<string, Record<string, unknown>>;

  for (const [pid, player] of Object.entries(players)) {
    if (pid !== playerId) {
      // Hide other players' hands (show count only)
      const hand = player.hand as unknown[];
      player.handCount = hand.length;
      player.hand = [];

      // Hide pending orders before reveal
      player.selectedOrders = player.selectedOrders ? 'submitted' : null;
    }
  }

  // Hide deck contents (show counts only)
  const decks = sanitized.decks as Record<string, unknown[]>;
  sanitized.decks = {
    programsCount: decks.programs.length,
    programDiscardCount: decks.programDiscard.length,
    contractsCount: decks.contracts.length,
    agendasCount: decks.agendas.length,
    crisesCount: decks.crises.length,
  };

  // Hide seed
  delete sanitized.seed;

  // Hide vote commitments until resolved
  const agenda = sanitized.currentAgenda as Record<string, unknown> | null;
  if (agenda && !agenda.resolved) {
    const commitments = agenda.commitments as Record<string, unknown>;
    const sanitizedCommitments: Record<string, unknown> = {};
    for (const pid of Object.keys(commitments)) {
      sanitizedCommitments[pid] = pid === playerId ? commitments[pid] : 'submitted';
    }
    agenda.commitments = sanitizedCommitments;
  }

  return sanitized;
}
