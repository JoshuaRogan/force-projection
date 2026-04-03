import { kv } from '@vercel/kv';
import type { GameState } from '@fp/shared';

const MAX_ACTIVE_GAMES = 10;
const GAME_TTL_SECONDS = 48 * 60 * 60; // 48 hours
const LOCK_TTL_SECONDS = 10;

// --- Game metadata (slots, bot config) ---

export interface SlotMeta {
  playerId: string;
  name: string;
  isBot: boolean;
  personality: string; // only used if isBot
}

export interface GameMeta {
  slots: SlotMeta[];
}

export async function getGameMeta(gameId: string): Promise<GameMeta | null> {
  return kv.get<GameMeta>(`game:${gameId}:meta`);
}

export async function setGameMeta(gameId: string, meta: GameMeta): Promise<void> {
  await kv.set(`game:${gameId}:meta`, meta, { ex: GAME_TTL_SECONDS });
}

// --- Game state ---

export async function getGameState(gameId: string): Promise<GameState | null> {
  return kv.get<GameState>(`game:${gameId}:state`);
}

export async function setGameState(gameId: string, state: GameState): Promise<void> {
  await kv.set(`game:${gameId}:state`, state, { ex: GAME_TTL_SECONDS });
}

export async function deleteGame(gameId: string): Promise<void> {
  const keys = await kv.keys(`game:${gameId}:*`);
  if (keys.length > 0) {
    await kv.del(...keys);
  }
  await kv.srem('games:index', gameId);
}

// --- Game index ---

export async function listGameIds(): Promise<string[]> {
  return kv.smembers('games:index');
}

export async function addGameToIndex(gameId: string): Promise<boolean> {
  const count = await kv.scard('games:index');
  if (count >= MAX_ACTIVE_GAMES) return false;
  await kv.sadd('games:index', gameId);
  return true;
}

// --- Pending submissions (orders / votes) ---

export async function setPendingSubmission(
  gameId: string,
  kind: 'orders' | 'votes' | 'contracts',
  playerId: string,
  data: unknown,
): Promise<void> {
  await kv.set(`game:${gameId}:${kind}:${playerId}`, data, { ex: 5 * 60 });
}

export async function getPendingSubmission<T>(
  gameId: string,
  kind: 'orders' | 'votes' | 'contracts',
  playerId: string,
): Promise<T | null> {
  return kv.get<T>(`game:${gameId}:${kind}:${playerId}`);
}

export async function getAllPendingSubmissions<T>(
  gameId: string,
  kind: 'orders' | 'votes' | 'contracts',
  playerIds: string[],
): Promise<Record<string, T>> {
  const result: Record<string, T> = {};
  for (const pid of playerIds) {
    const data = await kv.get<T>(`game:${gameId}:${kind}:${pid}`);
    if (data !== null) {
      result[pid] = data;
    }
  }
  return result;
}

export async function clearPendingSubmissions(
  gameId: string,
  kind: 'orders' | 'votes' | 'contracts',
  playerIds: string[],
): Promise<void> {
  const keys = playerIds.map(pid => `game:${gameId}:${kind}:${pid}`);
  if (keys.length > 0) {
    await kv.del(...keys);
  }
}

// --- Resolution lock ---

export async function acquireResolutionLock(gameId: string): Promise<boolean> {
  const result = await kv.set(`game:${gameId}:resolving`, '1', { nx: true, ex: LOCK_TTL_SECONDS });
  return result === 'OK';
}

export async function releaseResolutionLock(gameId: string): Promise<void> {
  await kv.del(`game:${gameId}:resolving`);
}
