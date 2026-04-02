import { NextRequest, NextResponse } from 'next/server';
import { GameEngine } from '@fp/engine';
import type { BudgetLine } from '@fp/shared';
import { getGameState, setGameState } from '../../../lib/kv';
import { sanitizeStateForPlayer } from '../../../lib/sanitize';

type RouteContext = { params: Promise<{ id: string }> };

type AbilityPayload =
  | { playerId: string; ability: 'navsea'; from: BudgetLine; to: BudgetLine }
  | { playerId: string; ability: 'transcom'; to: BudgetLine }
  | { playerId: string; ability: 'spacecy'; bury: boolean };

// POST /api/games/[id]/ability — use a once-per-year directorate ability
export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json() as AbilityPayload;
  const { playerId, ability } = body;

  const state = await getGameState(id);
  if (!state) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }
  if (!state.players[playerId]) {
    return NextResponse.json({ error: 'Invalid player' }, { status: 400 });
  }

  const engine = GameEngine.fromState(state);

  try {
    switch (ability) {
      case 'navsea': {
        const { from, to } = body as Extract<AbilityPayload, { ability: 'navsea' }>;
        engine.useNavseaAbility(playerId, from, to);
        break;
      }
      case 'transcom': {
        const { to } = body as Extract<AbilityPayload, { ability: 'transcom' }>;
        engine.useTranscomAbility(playerId, to);
        break;
      }
      case 'spacecy': {
        const { bury } = body as Extract<AbilityPayload, { ability: 'spacecy' }>;
        engine.useSpacecyAbility(playerId, bury);
        break;
      }
      default:
        return NextResponse.json({ error: `Unknown ability: ${ability}` }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  await setGameState(id, engine.state);

  return NextResponse.json({
    status: 'ok',
    state: sanitizeStateForPlayer(engine.state, playerId),
  });
}
