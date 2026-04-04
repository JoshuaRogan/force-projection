import { NextRequest, NextResponse } from 'next/server';
import { getGameState, deleteGame } from '../../lib/kv';
import { sanitizeStateForPlayer, sanitizeStateForSpectator } from '../../lib/sanitize';

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/games/[id]?player=<playerId> — fetch game state (sanitized for player)
export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const playerId = request.nextUrl.searchParams.get('player');

  const state = await getGameState(id);
  if (!state) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  const spectatorParam = request.nextUrl.searchParams.get('spectator');
  if (spectatorParam === '1' || spectatorParam === 'true') {
    return NextResponse.json(sanitizeStateForSpectator(state));
  }

  if (!playerId || !state.players[playerId]) {
    return NextResponse.json({ error: 'player query param required and must be valid' }, { status: 400 });
  }

  return NextResponse.json(sanitizeStateForPlayer(state, playerId));
}

// DELETE /api/games/[id] — abandon a game
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  await deleteGame(id);
  return NextResponse.json({ deleted: true });
}
