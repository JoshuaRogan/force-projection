import { NextRequest, NextResponse } from 'next/server';
import { GameEngine } from '@fp/engine';
import { getGameState, setGameState, getGameMeta, setGameMeta } from '../../../lib/kv';
import { sanitizeStateForPlayer } from '../../../lib/sanitize';

type RouteContext = { params: Promise<{ id: string }> };

interface JoinPayload {
  playerId: string; // which slot to claim (from the slots list returned at creation)
  name: string;     // display name the human picks
}

// POST /api/games/[id]/join — claim a human slot and set your display name
// For rejoin: call again with the same playerId — name update is idempotent
export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json() as JoinPayload;
  const { playerId, name } = body;

  if (!name || name.trim().length === 0) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const [state, meta] = await Promise.all([getGameState(id), getGameMeta(id)]);

  if (!state || !meta) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  const slot = meta.slots.find((s) => s.playerId === playerId);
  if (!slot) {
    return NextResponse.json({ error: 'Player ID not found in this game' }, { status: 404 });
  }
  if (slot.isBot) {
    return NextResponse.json({ error: 'Cannot join a bot slot' }, { status: 400 });
  }

  // Update name in meta
  slot.name = name.trim();
  await setGameMeta(id, meta);

  // Update name in the live GameState so it shows up everywhere
  const engine = GameEngine.fromState(state);
  engine.state.players[playerId].name = name.trim();
  await setGameState(id, engine.state);

  return NextResponse.json({
    playerId,
    name: slot.name,
    directorate: state.players[playerId].directorate,
    state: sanitizeStateForPlayer(engine.state, playerId),
  });
}

// GET /api/games/[id]/join — list joinable (human) slots so a player can pick one
export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const [state, meta] = await Promise.all([getGameState(id), getGameMeta(id)]);

  if (!state || !meta) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  return NextResponse.json({
    gameId: id,
    phase: state.phase,
    slots: meta.slots.map((s) => ({
      playerId: s.playerId,
      name: s.name,
      isBot: s.isBot,
      directorate: state.players[s.playerId].directorate,
    })),
  });
}
