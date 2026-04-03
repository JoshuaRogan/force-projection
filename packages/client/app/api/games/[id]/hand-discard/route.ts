import { NextRequest, NextResponse } from 'next/server';
import { GameEngine } from '@fp/engine';
import { getGameState, setGameState, getGameMeta } from '../../../lib/kv';
import { sanitizeStateForPlayer } from '../../../lib/sanitize';
import { runBotActions } from '../../../lib/botRunner';

type RouteContext = { params: Promise<{ id: string }> };

interface HandDiscardPayload {
  playerId: string;
  cardIds: string[];
}

// POST /api/games/[id]/hand-discard — choose programs to discard over hand limit
export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json() as HandDiscardPayload;
  const { playerId, cardIds } = body;

  const state = await getGameState(id);
  if (!state) return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  if (state.phase.type !== 'quarter' || state.phase.step !== 'handDiscard') {
    return NextResponse.json({ error: 'Not in handDiscard step' }, { status: 400 });
  }
  if (!state.players[playerId]) {
    return NextResponse.json({ error: 'Invalid player' }, { status: 400 });
  }
  if (!Array.isArray(cardIds)) {
    return NextResponse.json({ error: 'cardIds must be an array' }, { status: 400 });
  }

  const engine = GameEngine.fromState(state);
  const ok = engine.submitHandDiscard(playerId, cardIds);
  if (!ok) return NextResponse.json({ error: 'Invalid discard selection' }, { status: 400 });

  if (engine.allHandDiscardsDone()) {
    engine.endHandDiscard();
    if (engine.state.phase.type === 'quarter' && engine.state.phase.step === 'cleanup') {
      engine.endQuarter();
    }
  }

  await setGameState(id, engine.state);

  const meta = await getGameMeta(id);
  if (meta) await runBotActions(id, meta);
  const finalState = await getGameState(id) ?? engine.state;

  return NextResponse.json({
    status: 'ok',
    state: sanitizeStateForPlayer(finalState, playerId),
  });
}
