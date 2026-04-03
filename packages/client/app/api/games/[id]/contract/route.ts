import { NextRequest, NextResponse } from 'next/server';
import { GameEngine } from '@fp/engine';
import { getGameState, setGameState, getGameMeta, setPendingSubmission, getAllPendingSubmissions, clearPendingSubmissions, acquireResolutionLock, releaseResolutionLock } from '../../../lib/kv';
import { sanitizeStateForPlayer } from '../../../lib/sanitize';
import { runBotActions } from '../../../lib/botRunner';

type RouteContext = { params: Promise<{ id: string }> };

interface ContractPayload {
  playerId: string;
  contractIds: string[]; // chosen contract ids (may be empty to pass)
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json() as ContractPayload;
  const { playerId, contractIds } = body;

  const state = await getGameState(id);
  if (!state) return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  if (state.phase.type !== 'contractMarket') return NextResponse.json({ error: 'Not in contract market phase' }, { status: 400 });
  if (!state.players[playerId]) return NextResponse.json({ error: 'Invalid player' }, { status: 400 });

  await setPendingSubmission(id, 'contracts', playerId, contractIds);

  // Trigger bot submissions
  const meta = await getGameMeta(id);
  if (meta) await runBotActions(id, meta);

  // Check if all players have submitted
  const allChoices = await getAllPendingSubmissions<string[]>(id, 'contracts', state.turnOrder);
  if (Object.keys(allChoices).length < state.turnOrder.length) {
    return NextResponse.json({ status: 'waiting', submitted: Object.keys(allChoices) });
  }

  const locked = await acquireResolutionLock(id);
  if (!locked) return NextResponse.json({ status: 'resolving' });

  try {
    const freshState = await getGameState(id);
    if (!freshState || freshState.phase.type !== 'contractMarket') {
      return NextResponse.json({ status: 'already_resolved' });
    }

    const engine = GameEngine.fromState(freshState);

    for (const [pid, choices] of Object.entries(allChoices)) {
      engine.submitMarketChoices(pid, choices);
    }

    engine.endContractMarket();

    await setGameState(id, engine.state);
    await clearPendingSubmissions(id, 'contracts', state.turnOrder);

    if (meta) await runBotActions(id, meta);
    const finalState = await getGameState(id) ?? engine.state;

    return NextResponse.json({
      status: 'resolved',
      state: sanitizeStateForPlayer(finalState, playerId),
    });
  } finally {
    await releaseResolutionLock(id);
  }
}
