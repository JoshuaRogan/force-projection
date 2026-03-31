import type { DirectorateId } from '@fp/shared';
import { DIRECTORATE_IDS } from '@fp/shared';
import { SeededRNG } from '@fp/engine';
import { runGame, type SimulationResult, type RunConfig } from './gameRunner.js';
import { PERSONALITY_NAMES } from './personalities.js';

export interface MonteCarloConfig {
  totalGames: number;
  playerCount: number;
  fiscalYears: number;
  baseSeed: number;
  /** If true, cycle through all directorate combinations. Otherwise random. */
  stratified: boolean;
  /** Bot personality to use for all players (or 'mixed' for variety) */
  personality: string;
}

export const DEFAULT_MC_CONFIG: MonteCarloConfig = {
  totalGames: 1000,
  playerCount: 4,
  fiscalYears: 4,
  baseSeed: 42,
  stratified: false,
  personality: 'balanced',
};

/** Run N games and collect all results */
export function runMonteCarlo(config: MonteCarloConfig): SimulationResult[] {
  const results: SimulationResult[] = [];
  const rng = new SeededRNG(config.baseSeed);

  // Pre-generate directorate assignments if stratified
  let directorateQueue: DirectorateId[][] = [];
  if (config.stratified) {
    directorateQueue = generateStratifiedCombinations(config.playerCount);
  }

  const personalityOptions = config.personality === 'mixed'
    ? PERSONALITY_NAMES.filter(p => p !== 'random') // exclude pure random from mixed
    : null;

  for (let i = 0; i < config.totalGames; i++) {
    const seed = config.baseSeed + i;

    let directorates: DirectorateId[];
    if (config.stratified && directorateQueue.length > 0) {
      directorates = directorateQueue[i % directorateQueue.length];
    } else {
      directorates = rng.pick(DIRECTORATE_IDS, config.playerCount) as DirectorateId[];
    }

    let personalities: string[];
    if (personalityOptions) {
      personalities = Array.from({ length: config.playerCount }, () =>
        personalityOptions[rng.int(0, personalityOptions.length - 1)]
      );
    } else {
      personalities = new Array(config.playerCount).fill(config.personality);
    }

    const runConfig: RunConfig = {
      playerCount: config.playerCount,
      fiscalYears: config.fiscalYears,
      seed,
      directorates,
      personalities,
    };

    const result = runGame(runConfig);
    results.push(result);

    // Progress reporting
    if ((i + 1) % 100 === 0 || i + 1 === config.totalGames) {
      const pct = ((i + 1) / config.totalGames * 100).toFixed(0);
      process.stderr.write(`\r  ${i + 1}/${config.totalGames} games (${pct}%)`);
    }
  }

  process.stderr.write('\n');
  return results;
}

/** Generate all unique directorate combinations for a given player count */
function generateStratifiedCombinations(playerCount: number): DirectorateId[][] {
  const combos: DirectorateId[][] = [];

  if (playerCount === 2) {
    // All 10 possible 2-faction matchups
    for (let i = 0; i < DIRECTORATE_IDS.length; i++) {
      for (let j = i + 1; j < DIRECTORATE_IDS.length; j++) {
        combos.push([DIRECTORATE_IDS[i], DIRECTORATE_IDS[j]]);
      }
    }
  } else if (playerCount === 3) {
    // All 10 possible 3-faction combos from 5
    for (let i = 0; i < 5; i++) {
      for (let j = i + 1; j < 5; j++) {
        for (let k = j + 1; k < 5; k++) {
          combos.push([DIRECTORATE_IDS[i], DIRECTORATE_IDS[j], DIRECTORATE_IDS[k]]);
        }
      }
    }
  } else if (playerCount === 4) {
    // All 5 possible 4-faction combos from 5 (drop one each time)
    for (let skip = 0; skip < 5; skip++) {
      combos.push(DIRECTORATE_IDS.filter((_, i) => i !== skip) as DirectorateId[]);
    }
  } else if (playerCount === 5) {
    // Only 1 combination: all 5
    combos.push([...DIRECTORATE_IDS] as DirectorateId[]);
  }

  return combos;
}
