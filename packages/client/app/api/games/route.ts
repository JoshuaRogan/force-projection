import { NextRequest, NextResponse } from 'next/server';
import { GameEngine } from '@fp/engine';
import type { DirectorateId } from '@fp/shared';
import { listGameIds, getGameState, setGameState, addGameToIndex } from '../lib/kv';

// GET /api/games — list active games with summary info
export async function GET() {
  const ids = await listGameIds();
  const summaries = await Promise.all(
    ids.map(async (id) => {
      const state = await getGameState(id);
      if (!state) return null;
      return {
        id,
        phase: state.phase,
        fiscalYear: state.fiscalYear,
        players: state.turnOrder.map((pid) => ({
          id: pid,
          name: state.players[pid].name,
          directorate: state.players[pid].directorate,
          si: state.players[pid].si,
        })),
      };
    }),
  );
  return NextResponse.json(summaries.filter(Boolean));
}

// POST /api/games — create a new game
export async function POST(request: NextRequest) {
  const body = await request.json() as {
    players: Array<{ id: string; name: string; directorate: DirectorateId }>;
    config?: { fiscalYears?: number };
  };

  if (!body.players || body.players.length < 2 || body.players.length > 5) {
    return NextResponse.json({ error: 'Need 2-5 players' }, { status: 400 });
  }

  // Check for duplicate directorates
  const directorates = body.players.map((p) => p.directorate);
  if (new Set(directorates).size !== directorates.length) {
    return NextResponse.json({ error: 'Duplicate directorates not allowed' }, { status: 400 });
  }

  const gameId = crypto.randomUUID().slice(0, 8);

  const added = await addGameToIndex(gameId);
  if (!added) {
    return NextResponse.json(
      { error: 'Server full — maximum 10 active games. Try again later.' },
      { status: 503 },
    );
  }

  const engine = new GameEngine({
    players: body.players,
    config: body.config,
  });
  engine.start();

  await setGameState(gameId, engine.state);

  return NextResponse.json({ gameId, phase: engine.state.phase }, { status: 201 });
}
