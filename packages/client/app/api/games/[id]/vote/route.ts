import { NextRequest, NextResponse } from 'next/server';
import { GameEngine } from '@fp/engine';
import {
  getGameState, setGameState, getGameMeta,
  setPendingSubmission, getAllPendingSubmissions, clearPendingSubmissions,
  acquireResolutionLock, releaseResolutionLock,
} from '../../../lib/kv';
import { sanitizeStateForPlayer } from '../../../lib/sanitize';
import { runBotActions } from '../../../lib/botRunner';

type RouteContext = { params: Promise<{ id: string }> };

interface VotePayload {
  playerId: string;
  amount: number;
  support: boolean;
}

// POST /api/games/[id]/vote — submit a secret vote during congress phase
export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json() as VotePayload;
  const { playerId, amount, support } = body;

  const state = await getGameState(id);
  if (!state) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }
  if (state.phase.type !== 'congress') {
    return NextResponse.json({ error: 'Not in congress phase' }, { status: 400 });
  }
  if (!state.players[playerId]) {
    return NextResponse.json({ error: 'Invalid player' }, { status: 400 });
  }
  if (typeof amount !== 'number' || amount < 0) {
    return NextResponse.json({ error: 'Invalid vote amount' }, { status: 400 });
  }

  // Store this player's vote separately (atomic per player)
  await setPendingSubmission(id, 'votes', playerId, { amount, support });

  // Trigger bot votes — they will submit and potentially resolve if all humans are in
  const meta = await getGameMeta(id);
  if (meta) await runBotActions(id, meta);

  // Check if all players have submitted
  const allVotes = await getAllPendingSubmissions<{ amount: number; support: boolean }>(
    id, 'votes', state.turnOrder,
  );
  if (Object.keys(allVotes).length < state.turnOrder.length) {
    return NextResponse.json({
      status: 'waiting',
      submitted: Object.keys(allVotes),
    });
  }

  // All votes in — acquire lock and resolve
  const locked = await acquireResolutionLock(id);
  if (!locked) {
    return NextResponse.json({ status: 'resolving' });
  }

  try {
    // Re-read state inside lock to ensure freshness
    const freshState = await getGameState(id);
    if (!freshState || freshState.phase.type !== 'congress') {
      return NextResponse.json({ status: 'already_resolved' });
    }

    const engine = GameEngine.fromState(freshState);

    // Apply all votes
    for (const [pid, vote] of Object.entries(allVotes)) {
      engine.submitVote(pid, vote.amount, vote.support);
    }

    // Resolve and advance to contract market
    engine.resolveVotes();

    await setGameState(id, engine.state);
    await clearPendingSubmissions(id, 'votes', state.turnOrder);

    // Bot contract picks for the new contractMarket phase
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
