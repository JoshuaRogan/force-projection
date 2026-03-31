// === Theaters ===
// The 6 global theaters on the board

export type TheaterId =
  | 'northAtlantic'
  | 'indoPacific'
  | 'middleEast'
  | 'arctic'
  | 'homeland'
  | 'spaceCyber';

export const THEATER_IDS: readonly TheaterId[] = [
  'northAtlantic',
  'indoPacific',
  'middleEast',
  'arctic',
  'homeland',
  'spaceCyber',
] as const;

export const THEATER_NAMES: Record<TheaterId, string> = {
  northAtlantic: 'North Atlantic',
  indoPacific: 'Indo-Pacific',
  middleEast: 'Middle East',
  arctic: 'Arctic',
  homeland: 'Homeland',
  spaceCyber: 'Space & Cyber',
};

// Each theater has fixed slot counts
export const THEATER_SLOTS = {
  bases: 2,
  alliances: 2,
  forwardOps: 1,
} as const;

// Strength values for theater control
export const STRENGTH_VALUES = {
  base: 2,
  alliance: 1,
  forwardOps: 3,
} as const;

// Theater control scoring
export const THEATER_CONTROL_SCORING = {
  first: 4,
  second: 2,
  third: 1, // only in 4-5 player games
} as const;

/** Per-player presence in a single theater */
export interface TheaterPresence {
  bases: number;      // 0-2
  alliances: number;  // 0-2
  forwardOps: number; // 0-1
  stationedStrength: number; // from stationed programs
}

export function emptyPresence(): TheaterPresence {
  return { bases: 0, alliances: 0, forwardOps: 0, stationedStrength: 0 };
}

export function calcStrength(presence: TheaterPresence): number {
  return (
    presence.bases * STRENGTH_VALUES.base +
    presence.alliances * STRENGTH_VALUES.alliance +
    presence.forwardOps * STRENGTH_VALUES.forwardOps +
    presence.stationedStrength
  );
}
