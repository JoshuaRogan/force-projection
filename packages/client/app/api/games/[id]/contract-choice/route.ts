import { NextRequest, NextResponse } from 'next/server';
import { GameEngine } from '@fp/engine';
import { getGameState, setGameState, getGameMeta } from '../../../lib/kv';
import { sanitizeStateForPlayer } from '../../../lib/sanitize';
import { runBotActions } from '../../../lib/botRunner';

type RouteContext = { params: Promise<{ id: string }> };

interface ContractChoicePayload {
  playerId: string;
  contractId: string;
}

// POST /api/games/[id]/contract-choice — pick which drawn contract to keep
export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json() as ContractChoicePayload;
  const { playerId, contractId } = body;

  const state = await getGameState(id);
  if (!state) return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  if (state.phase.type !== 'quarter' || state.phase.step !== 'contractChoice') {
    return NextResponse.json({ error: 'Not in contractChoice step' }, { status: 400 });
  }
  if (!state.players[playerId]) {
    return NextResponse.json({ error: 'Invalid player' }, { status: 400 });
  }

  const engine = GameEngine.fromState(state);
  const ok = engine.submitContractChoice(playerId, contractId);
  if (!ok) return NextResponse.json({ error: 'Invalid contract choice' }, { status: 400 });

  // If all choices done, advance to cleanup and end the quarter
  if (engine.allContractChoicesDone()) {
    engine.endContractChoices();
    engine.endQuarter();
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
