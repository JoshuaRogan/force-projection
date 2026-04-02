import { NextRequest, NextResponse } from 'next/server';
import { GameEngine } from '@fp/engine';
import { getGameState, setGameState } from '../../../lib/kv';
import { sanitizeStateForPlayer } from '../../../lib/sanitize';

type RouteContext = { params: Promise<{ id: string }> };

interface ContractPayload {
  playerId: string;
  contractId: string;
}

// POST /api/games/[id]/contract — take a contract during contractMarket phase
// This is sequential (turn-based), no simultaneous submission concern.
export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json() as ContractPayload;
  const { playerId, contractId } = body;

  const state = await getGameState(id);
  if (!state) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }
  if (state.phase.type !== 'contractMarket') {
    return NextResponse.json({ error: 'Not in contract market phase' }, { status: 400 });
  }
  if (!state.players[playerId]) {
    return NextResponse.json({ error: 'Invalid player' }, { status: 400 });
  }

  const engine = GameEngine.fromState(state);
  const success = engine.takeContract(playerId, contractId);

  if (!success) {
    return NextResponse.json({ error: 'Cannot take that contract' }, { status: 400 });
  }

  await setGameState(id, engine.state);

  return NextResponse.json({
    status: 'ok',
    state: sanitizeStateForPlayer(engine.state, playerId),
  });
}
