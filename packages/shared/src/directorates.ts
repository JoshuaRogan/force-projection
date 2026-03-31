import type { BudgetPool, SecondaryPool } from './resources.js';

// === Directorates (Factions) ===

export type DirectorateId = 'NAVSEA' | 'AIRCOM' | 'MARFOR' | 'SPACECY' | 'TRANSCOM';

export const DIRECTORATE_IDS: readonly DirectorateId[] = [
  'NAVSEA', 'AIRCOM', 'MARFOR', 'SPACECY', 'TRANSCOM',
] as const;

export interface DirectorateDefinition {
  id: DirectorateId;
  name: string;
  subtitle: string;
  passiveDescription: string;
  oncePerYearDescription: string;
  startBonusBudgetProduction: Partial<BudgetPool>;
  startBonusSecondaryProduction: Partial<SecondaryPool>;
  startBonusTokens: Partial<BudgetPool & SecondaryPool>;
}

export const DIRECTORATES: Record<DirectorateId, DirectorateDefinition> = {
  NAVSEA: {
    id: 'NAVSEA',
    name: 'NAVSEA',
    subtitle: 'Fleet & Shipyard Command',
    passiveDescription: 'When you place a SEA-tag Program into Active, gain +1 U immediately.',
    oncePerYearDescription: 'Reprogram 1 budget between lines for free.',
    startBonusBudgetProduction: { S: 1, U: 1 },
    startBonusSecondaryProduction: {},
    startBonusTokens: {},
  },
  AIRCOM: {
    id: 'AIRCOM',
    name: 'AIRCOM',
    subtitle: 'Air Dominance Command',
    passiveDescription: 'The first AIR-tag Program you activate each Year costs 1 less A and gives +1 I.',
    oncePerYearDescription: 'If you win a Theater Control tie, you win it outright.',
    startBonusBudgetProduction: { A: 1 },
    startBonusSecondaryProduction: {},
    startBonusTokens: { M: 1 },
  },
  MARFOR: {
    id: 'MARFOR',
    name: 'MARFOR',
    subtitle: 'Expeditionary Command',
    passiveDescription: 'Your Forward Ops placements cost -1 E.',
    oncePerYearDescription: 'When you complete a Contract, gain +1 PC.',
    startBonusBudgetProduction: { E: 1 },
    startBonusSecondaryProduction: {},
    startBonusTokens: { L: 1 },
  },
  SPACECY: {
    id: 'SPACECY',
    name: 'SPACECY',
    subtitle: 'Space & Cyber Command',
    passiveDescription: 'Your first NETWORK program you activate each Year gives +1 I production.',
    oncePerYearDescription: 'Peek at the next Crisis; you may pay 1 PC to bury it and draw a new one.',
    startBonusBudgetProduction: { X: 1 },
    startBonusSecondaryProduction: {},
    startBonusTokens: { I: 1 },
  },
  TRANSCOM: {
    id: 'TRANSCOM',
    name: 'TRANSCOM',
    subtitle: 'Mobility & Sustainment Command',
    passiveDescription: 'Any time you pay L, pay 1 less L (min 0).',
    oncePerYearDescription: 'Convert 2 U → 1 of any line without PC cost.',
    startBonusBudgetProduction: { U: 1 },
    startBonusSecondaryProduction: { L: 1 },
    startBonusTokens: {},
  },
};
