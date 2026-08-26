import { createClient, type VercelKV } from '@vercel/kv';
import type { GameState } from '@fp/shared';

const MAX_ACTIVE_GAMES = 10;
const GAME_TTL_SECONDS = 48 * 60 * 60; // 48 hours
const LOCK_TTL_SECONDS = 10;

export class GameStoreError extends Error {
  status: number;
  constructor(message: string, status = 503) {
    super(message);
    this.name = 'GameStoreError';
    this.status = status;
  }
}

let cached: VercelKV | null = null;

function firstEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return value;
  }
  return undefined;
}

function getClient(): VercelKV {
  if (cached) return cached;
  // Grant-prefixed copies first: the unprefixed KV_* names on Vercel still
  // point at a retired store, while the new Upstash credentials arrive as
  // KV_REST_API_TOKEN_KV_REST_API_URL / _TOKEN.
  const url = firstEnv(
    'KV_REST_API_TOKEN_KV_REST_API_URL',
    'KV_REST_API_URL',
    'UPSTASH_REDIS_REST_URL',
  );
  const token = firstEnv(
    'KV_REST_API_TOKEN_KV_REST_API_TOKEN',
    'KV_REST_API_TOKEN',
    'UPSTASH_REDIS_REST_TOKEN',
  );
  if (!url || !token) {
    throw new GameStoreError(
      'Game storage is not configured. Set KV_REST_API_URL and KV_REST_API_TOKEN (or the KV_REST_API_TOKEN_* grant-prefixed copies).',
    );
  }
  cached = createClient({ url, token });
  return cached;
}

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
  return getClient().get<GameMeta>(`game:${gameId}:meta`);
}

export async function setGameMeta(gameId: string, meta: GameMeta): Promise<void> {
  await getClient().set(`game:${gameId}:meta`, meta, { ex: GAME_TTL_SECONDS });
}

// --- Game state ---

export async function getGameState(gameId: string): Promise<GameState | null> {
  return getClient().get<GameState>(`game:${gameId}:state`);
}

export async function setGameState(gameId: string, state: GameState): Promise<void> {
  await getClient().set(`game:${gameId}:state`, state, { ex: GAME_TTL_SECONDS });
}

export async function deleteGame(gameId: string): Promise<void> {
  const kv = getClient();
  const keys = await kv.keys(`game:${gameId}:*`);
  if (keys.length > 0) {
    await kv.del(...keys);
  }
  await kv.srem('games:index', gameId);
}

// --- Game index ---

/** Drop index entries whose state has expired so the 10-game cap cannot stick forever. */
export async function listGameIds(): Promise<string[]> {
  const kv = getClient();
  const ids = await kv.smembers('games:index');
  const living: string[] = [];
  for (const id of ids) {
    const exists = await kv.exists(`game:${id}:state`);
    if (exists) {
      living.push(id);
    } else {
      await kv.srem('games:index', id);
    }
  }
  return living;
}

export async function addGameToIndex(gameId: string): Promise<boolean> {
  const living = await listGameIds();
  if (living.length >= MAX_ACTIVE_GAMES) return false;
  await getClient().sadd('games:index', gameId);
  return true;
}

// --- Pending submissions (orders / votes) ---

export async function setPendingSubmission(
  gameId: string,
  kind: 'orders' | 'votes' | 'contracts',
  playerId: string,
  data: unknown,
): Promise<void> {
  await getClient().set(`game:${gameId}:${kind}:${playerId}`, data, { ex: 5 * 60 });
}

export async function getPendingSubmission<T>(
  gameId: string,
  kind: 'orders' | 'votes' | 'contracts',
  playerId: string,
): Promise<T | null> {
  return getClient().get<T>(`game:${gameId}:${kind}:${playerId}`);
}

export async function getAllPendingSubmissions<T>(
  gameId: string,
  kind: 'orders' | 'votes' | 'contracts',
  playerIds: string[],
): Promise<Record<string, T>> {
  const kv = getClient();
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
    await getClient().del(...keys);
  }
}

// --- Resolution lock ---

export async function acquireResolutionLock(gameId: string): Promise<boolean> {
  const result = await getClient().set(`game:${gameId}:resolving`, '1', { nx: true, ex: LOCK_TTL_SECONDS });
  return result === 'OK';
}

export async function releaseResolutionLock(gameId: string): Promise<void> {
  await getClient().del(`game:${gameId}:resolving`);
}
