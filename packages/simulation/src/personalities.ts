import type { BotPersonality } from './bot.js';

export const PERSONALITIES: Record<string, BotPersonality> = {

  random: {
    name: 'Random',
    weights: {
      resourceGain: 1, siGain: 1, portfolioFit: 1, contractProgress: 1,
      theaterControl: 1, readiness: 1, tempo: 1, political: 1,
    },
    phaseMultipliers: { early: {}, mid: {}, late: {} },
    noise: 0.9,
    contractOptimism: 1.0,
  },

  greedy: {
    name: 'Greedy',
    weights: {
      resourceGain: 2.5, siGain: 3, portfolioFit: 1.5, contractProgress: 2,
      theaterControl: 0.5, readiness: 0.5, tempo: 1, political: 1,
    },
    phaseMultipliers: {
      early: { resourceGain: 1.5 },
      mid: {},
      late: { siGain: 2 },
    },
    noise: 0.15,
    contractOptimism: 1.2,
  },

  balanced: {
    name: 'Balanced',
    weights: {
      resourceGain: 1.5, siGain: 1.5, portfolioFit: 2, contractProgress: 2,
      theaterControl: 1.5, readiness: 1.5, tempo: 1.5, political: 1.5,
    },
    phaseMultipliers: {
      early: { portfolioFit: 1.5, tempo: 1.3 },
      mid: { contractProgress: 1.3 },
      late: { siGain: 1.5, theaterControl: 1.3 },
    },
    noise: 0.2,
    contractOptimism: 1.0,
  },

  aggressive: {
    name: 'Aggressive',
    weights: {
      resourceGain: 1, siGain: 2, portfolioFit: 1.5, contractProgress: 2.5,
      theaterControl: 3, readiness: 0.5, tempo: 1, political: 0.5,
    },
    phaseMultipliers: {
      early: { theaterControl: 1.5 },
      mid: { contractProgress: 1.5, theaterControl: 1.3 },
      late: { siGain: 2, theaterControl: 1.5 },
    },
    noise: 0.15,
    contractOptimism: 1.3,
  },

  defensive: {
    name: 'Defensive',
    weights: {
      resourceGain: 2, siGain: 1, portfolioFit: 2, contractProgress: 1.5,
      theaterControl: 1, readiness: 3, tempo: 1.5, political: 2,
    },
    phaseMultipliers: {
      early: { readiness: 1.5, resourceGain: 1.3 },
      mid: { readiness: 1.3, political: 1.3 },
      late: { siGain: 1.5 },
    },
    noise: 0.2,
    contractOptimism: 0.7,
  },
};

export const PERSONALITY_NAMES = Object.keys(PERSONALITIES);
