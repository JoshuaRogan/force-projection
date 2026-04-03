import { NextRequest, NextResponse } from 'next/server';
import { GameEngine } from '@fp/engine';
import { getGameState, setGameState, getGameMeta } from '../../../lib/kv';
import { sanitizeStateForPlayer } from '../../../lib/sanitize';
import { runBotActions } from '../../../lib/botRunner';

type RouteContext = { params: Promise<{ id: string }> };

interface AdvancePayload {
  playerId: string;
  action: 'endCrisisPulse';
}

/**
 * POST /api/games/[id]/advance — advance through phases that don't require
 * simultaneous input (contract market done, crisis pulse done).
 *
 * These transitions need an explicit "I'm done" signal from players.
 * For simplicity, any player can trigger these — in a real game you'd
 * want all players to confirm, but for 2-player this works fine.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json() as AdvancePayload;
  const { playerId, action } = body;

  const state = await getGameState(id);
  if (!state) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }
  if (!state.players[playerId]) {
    return NextResponse.json({ error: 'Invalid player' }, { status: 400 });
  }

  const engine = GameEngine.fromState(state);

  switch (action) {
    case 'endCrisisPulse': {
      if (state.phase.type !== 'quarter' || state.phase.step !== 'crisisPulse') {
        return NextResponse.json({ error: 'Not in crisis pulse step' }, { status: 400 });
      }
      engine.endCrisisPulse();
      break;
    }
    default:
      return NextResponse.json({ error: `Unknown advance action: ${action}` }, { status: 400 });
  }

  await setGameState(id, engine.state);

  // After advancing phase, bots may need to act (e.g. vote in congress, order in planOrders)
  const meta = await getGameMeta(id);
  if (meta) await runBotActions(id, meta);
  const finalState = await getGameState(id) ?? engine.state;

  return NextResponse.json({
    status: 'ok',
    state: sanitizeStateForPlayer(finalState, playerId),
  });
}
