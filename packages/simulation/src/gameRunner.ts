import type { DirectorateId } from '@fp/shared';
import { DIRECTORATE_IDS } from '@fp/shared';
import { GameEngine, SeededRNG } from '@fp/engine';
import { Bot } from './bot.js';
import type { BotPersonality } from './bot.js';
import { PERSONALITIES } from './personalities.js';

export interface SimulationResult {
  seed: number;
  playerCount: number;
  fiscalYears: number;
  players: Array<{
    id: string;
    directorate: DirectorateId;
    personality: string;
    finalSI: number;
    rank: number;
    won: boolean;
  }>;
  winnerId: string;
  winnerDirectorate: DirectorateId;
  winnerPersonality: string;
  gameLengthQuarters: number;
}

export interface RunConfig {
  playerCount: number;
  fiscalYears: number;
  seed: number;
  /** Map player index to personality name. If not provided, uses 'balanced' */
  personalities?: string[];
  /** Map player index to directorate. If not provided, shuffled randomly */
  directorates?: DirectorateId[];
}

/** Play a single complete game with bots. Returns result. */
export function runGame(config: RunConfig): SimulationResult {
  const rng = new SeededRNG(config.seed);

  // Assign directorates
  const directorates = config.directorates
    ?? rng.pick(DIRECTORATE_IDS, config.playerCount) as DirectorateId[];

  // Assign personalities
  const personalityNames = config.personalities
    ?? new Array(config.playerCount).fill('balanced');

  const players = directorates.map((dir, i) => ({
    id: `p${i}`,
    name: `Bot-${i}-${personalityNames[i]}`,
    directorate: dir,
  }));

  const engine = new GameEngine({
    players,
    seed: config.seed,
    config: { fiscalYears: config.fiscalYears, playerCount: config.playerCount },
  });

  // Create bots
  const bots = players.map((p, i) => new Bot(
    p.id,
    PERSONALITIES[personalityNames[i]] ?? PERSONALITIES['balanced'],
    new SeededRNG(config.seed + i * 7919), // unique sub-seed per bot
  ));

  const botMap = new Map(bots.map(b => [b.playerId, b]));

  // Play the game
  try {
    engine.start();

    while (!engine.isGameOver) {
      const phase = engine.state.phase;

      switch (phase.type) {
        case 'congress': {
          for (const bot of bots) {
            const vote = bot.chooseAgendaVote(engine.state);
            engine.submitVote(bot.playerId, vote.amount, vote.support);
          }
          engine.resolveVotes();

          // Contract market
          for (const bot of bots) {
            const contractId = bot.chooseContract(engine.state);
            if (contractId) {
              engine.takeContract(bot.playerId, contractId);
            }
          }
          engine.endContractMarket();
          break;
        }

        case 'contractMarket': {
          for (const bot of bots) {
            const contractId = bot.chooseContract(engine.state);
            if (contractId) {
              engine.takeContract(bot.playerId, contractId);
            }
          }
          engine.endContractMarket();
          break;
        }

        case 'quarter': {
          switch (phase.step) {
            case 'crisisPulse':
              engine.endCrisisPulse();
              break;

            case 'planOrders':
              for (const bot of bots) {
                const orders = bot.chooseOrders(engine.state);
                engine.submitOrders(bot.playerId, orders);
              }
              engine.revealAndResolve();
              break;

            case 'cleanup':
              engine.endQuarter();
              break;

            case 'resolveOrders':
              // Should not reach here — revealAndResolve moves past this
              engine.endQuarter();
              break;
          }
          break;
        }

        case 'yearEnd': {
          // processYearEnd is called by endQuarter, but if we land here directly:
          // The engine handles this in endQuarter → processYearEnd → startFiscalYear
          // If somehow we're stuck, force advance
          break;
        }

        default:
          break;
      }

      // Safety valve: prevent infinite loops
      if (engine.state.log.length > 5000) {
        break;
      }
    }
  } catch (e) {
    // Game errored — return partial results
    console.error(`Game ${config.seed} errored:`, e);
  }

  // Collect results
  const scores: Array<{ id: string; si: number; directorate: DirectorateId; personality: string }> = [];
  for (let i = 0; i < players.length; i++) {
    const p = engine.state.players[players[i].id];
    scores.push({
      id: players[i].id,
      si: p?.si ?? 0,
      directorate: directorates[i],
      personality: personalityNames[i],
    });
  }

  scores.sort((a, b) => b.si - a.si);

  const quarterCount = engine.state.fiscalYear * 4; // approximate

  return {
    seed: config.seed,
    playerCount: config.playerCount,
    fiscalYears: config.fiscalYears,
    players: scores.map((s, rank) => ({
      id: s.id,
      directorate: s.directorate,
      personality: s.personality,
      finalSI: s.si,
      rank: rank + 1,
      won: rank === 0,
    })),
    winnerId: scores[0].id,
    winnerDirectorate: scores[0].directorate,
    winnerPersonality: scores[0].personality,
    gameLengthQuarters: quarterCount,
  };
}
