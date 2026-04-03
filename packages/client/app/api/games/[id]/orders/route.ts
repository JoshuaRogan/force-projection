import { NextRequest, NextResponse } from 'next/server';
import { GameEngine } from '@fp/engine';
import type { OrderChoice } from '@fp/shared';
import {
  getGameState, setGameState, getGameMeta,
  setPendingSubmission, getAllPendingSubmissions, clearPendingSubmissions,
  acquireResolutionLock, releaseResolutionLock,
} from '../../../lib/kv';
import { sanitizeStateForPlayer } from '../../../lib/sanitize';
import { runBotActions } from '../../../lib/botRunner';

type RouteContext = { params: Promise<{ id: string }> };

interface OrdersPayload {
  playerId: string;
  orders: [OrderChoice, OrderChoice];
}

// POST /api/games/[id]/orders — submit orders during planOrders step
export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json() as OrdersPayload;
  const { playerId, orders } = body;

  const state = await getGameState(id);
  if (!state) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }
  if (state.phase.type !== 'quarter' || state.phase.step !== 'planOrders') {
    return NextResponse.json({ error: 'Not in planOrders step' }, { status: 400 });
  }
  if (!state.players[playerId]) {
    return NextResponse.json({ error: 'Invalid player' }, { status: 400 });
  }
  if (!Array.isArray(orders) || orders.length !== 2) {
    return NextResponse.json({ error: 'Must submit exactly 2 orders' }, { status: 400 });
  }

  // Store this player's orders separately (atomic per player)
  await setPendingSubmission(id, 'orders', playerId, orders);

  // Trigger bot order submissions — may resolve if this was the last human
  const meta = await getGameMeta(id);
  if (meta) await runBotActions(id, meta);

  // Check if all players have submitted
  const allOrders = await getAllPendingSubmissions<[OrderChoice, OrderChoice]>(
    id, 'orders', state.turnOrder,
  );
  if (Object.keys(allOrders).length < state.turnOrder.length) {
    return NextResponse.json({
      status: 'waiting',
      submitted: Object.keys(allOrders),
    });
  }

  // All orders in — acquire lock and resolve
  const locked = await acquireResolutionLock(id);
  if (!locked) {
    return NextResponse.json({ status: 'resolving' });
  }

  try {
    // Re-read state inside lock
    const freshState = await getGameState(id);
    if (!freshState || freshState.phase.type !== 'quarter' || freshState.phase.step !== 'planOrders') {
      return NextResponse.json({ status: 'already_resolved' });
    }

    const engine = GameEngine.fromState(freshState);

    // Apply all orders
    for (const [pid, playerOrders] of Object.entries(allOrders)) {
      engine.submitOrders(pid, playerOrders);
    }

    // Reveal and resolve all orders
    engine.revealAndResolve();

    // If contracting draws are pending, stop here for player choice
    const needsContractChoice = engine.state.phase.type === 'quarter' &&
      engine.state.phase.step === 'contractChoice';

    if (!needsContractChoice) {
      engine.endQuarter();
    }

    await setGameState(id, engine.state);
    await clearPendingSubmissions(id, 'orders', state.turnOrder);

    // Run bots for the next phase (congress votes, new quarter crisis, etc.)
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
