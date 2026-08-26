import type { DirectorateId } from '@fp/shared';

export const LOBBY_SETUP_KEY = 'fp-lobby-setup';
export const LOCAL_GAME_STORAGE_KEY = 'fp-game-state';

export type BotPersonality = 'balanced' | 'greedy' | 'aggressive' | 'random';

export interface LocalSetupSlot {
  directorate: DirectorateId;
  isBot: boolean;
  personality: BotPersonality;
}

export function saveLobbySetup(slots: LocalSetupSlot[]): void {
  sessionStorage.setItem(LOBBY_SETUP_KEY, JSON.stringify({ slots }));
  try {
    localStorage.removeItem(LOCAL_GAME_STORAGE_KEY);
  } catch { /* ignore */ }
}

export function loadLobbySetup(): LocalSetupSlot[] | null {
  try {
    const raw = sessionStorage.getItem(LOBBY_SETUP_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { slots?: LocalSetupSlot[] };
    if (!Array.isArray(data.slots) || data.slots.length < 2) return null;
    return data.slots;
  } catch {
    return null;
  }
}
