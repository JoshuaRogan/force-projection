export { Bot, type BotPersonality, type WeightVector } from './bot.js';
export { PERSONALITIES, PERSONALITY_NAMES } from './personalities.js';
export { runGame, type SimulationResult, type RunConfig } from './gameRunner.js';
export { runMonteCarlo, type MonteCarloConfig, DEFAULT_MC_CONFIG } from './monteCarlo.js';
export { analyzeResults, formatReport, type BalanceReport } from './stats.js';
