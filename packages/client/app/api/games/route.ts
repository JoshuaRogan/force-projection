import { NextRequest, NextResponse } from 'next/server';
import { GameEngine } from '@fp/engine';
import type { DirectorateId } from '@fp/shared';
import { listGameIds, getGameState, setGameState, addGameToIndex, setGameMeta, type SlotMeta } from '../lib/kv';
import { runBotActions } from '../lib/botRunner';

export interface SlotInput {
  directorate: DirectorateId;
  isBot: boolean;
  name?: string;           // optional at creation; humans set on join
  personality?: string;    // for bots: 'balanced' | 'greedy' | 'aggressive' | 'random'
}

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
// Body: { slots: SlotInput[] }
export async function POST(request: NextRequest) {
  const body = await request.json() as { slots: SlotInput[]; config?: { fiscalYears?: number } };

  if (!body.slots || body.slots.length < 2 || body.slots.length > 4) {
    return NextResponse.json({ error: 'Need 2-4 slots' }, { status: 400 });
  }

  const directorates = body.slots.map((s) => s.directorate);
  if (new Set(directorates).size !== directorates.length) {
    return NextResponse.json({ error: 'Duplicate directorates not allowed' }, { status: 400 });
  }

  const gameId = crypto.randomUUID().slice(0, 8);
  const added = await addGameToIndex(gameId);
  if (!added) {
    return NextResponse.json(
      { error: 'Server full — maximum 10 active games.' },
      { status: 503 },
    );
  }

  // Assign a stable player ID to every slot up front
  const slots: SlotMeta[] = body.slots.map((slot, i) => ({
    playerId: `${gameId}-p${i}`,
    name: slot.isBot ? (slot.name ?? `Bot ${i + 1}`) : (slot.name ?? `Player ${i + 1}`),
    isBot: slot.isBot,
    personality: slot.personality ?? 'balanced',
  }));

  const players = slots.map((s) => ({
    id: s.playerId,
    name: s.name,
    directorate: body.slots[slots.indexOf(s)].directorate,
  }));

  const engine = new GameEngine({ players, config: body.config });
  engine.start();

  await Promise.all([
    setGameState(gameId, engine.state),
    setGameMeta(gameId, { slots }),
  ]);

  // Fire bot actions for congress phase (bots may vote immediately)
  await runBotActions(gameId, { slots });

  // Return all slot IDs so the creator knows which one to use
  return NextResponse.json(
    {
      gameId,
      slots: slots.map((s) => ({
        playerId: s.playerId,
        name: s.name,
        isBot: s.isBot,
        directorate: players.find((p) => p.id === s.playerId)!.directorate,
      })),
    },
    { status: 201 },
  );
}
