import type {
  GameState, GameConfig, PlayerState, BoardState, Decks,
  Portfolio, ActiveContract, NationalPosture, AgendaVoteState,
  GameEvent,
} from '@fp/shared';
import {
  DEFAULT_CONFIG, startingResources, emptyPresence,
  THEATER_IDS, DIRECTORATES,
  PROGRAM_CARDS, CONTRACT_CARDS, AGENDA_CARDS, CRISIS_CARDS,
} from '@fp/shared';
import type { DirectorateId } from '@fp/shared';
import { SeededRNG } from './rng.js';

export interface CreateGameOptions {
  players: Array<{ id: string; name: string; directorate: DirectorateId }>;
  config?: Partial<GameConfig>;
  seed?: number;
}

export function createGame(options: CreateGameOptions): GameState {
  const config: GameConfig = { ...DEFAULT_CONFIG, ...options.config, playerCount: options.players.length };
  const seed = options.seed ?? Date.now();
  const rng = new SeededRNG(seed);

  // Build decks (copy + shuffle)
  const decks: Decks = {
    programs: rng.shuffle([...PROGRAM_CARDS]),
    programDiscard: [],
    contracts: rng.shuffle([...CONTRACT_CARDS]),
    agendas: rng.shuffle([...AGENDA_CARDS]),
    crises: rng.shuffle([...CRISIS_CARDS]),
  };

  // Build board
  const board: BoardState = {
    theaters: {} as BoardState['theaters'],
  };
  for (const tid of THEATER_IDS) {
    board.theaters[tid] = { presence: {} };
    for (const p of options.players) {
      board.theaters[tid].presence[p.id] = emptyPresence();
    }
  }

  // Build player states
  const players: Record<string, PlayerState> = {};
  for (const p of options.players) {
    const dir = DIRECTORATES[p.directorate];
    const resources = startingResources();

    // Apply directorate start bonuses to production
    for (const [line, amount] of Object.entries(dir.startBonusBudgetProduction)) {
      resources.production.budget[line as keyof typeof resources.production.budget] += amount as number;
    }
    for (const [res, amount] of Object.entries(dir.startBonusSecondaryProduction)) {
      resources.production.secondary[res as keyof typeof resources.production.secondary] += amount as number;
    }

    // Apply directorate start bonus tokens
    for (const [key, amount] of Object.entries(dir.startBonusTokens)) {
      if (key in resources.budget) {
        resources.budget[key as keyof typeof resources.budget] += amount as number;
      } else if (key in resources.secondary) {
        resources.secondary[key as keyof typeof resources.secondary] += amount as number;
      }
    }

    // Draw starting hand: 8 cards, keep 6
    const startingDraw = rng.draw(decks.programs, 8);
    const hand = startingDraw.slice(0, 6);
    const discarded = startingDraw.slice(6);
    decks.programDiscard.push(...discarded);

    const portfolio: Portfolio = {
      active: new Array(config.activeSlots).fill(null),
      pipeline: new Array(config.pipelineSlots).fill(null),
      mothballed: [],
    };

    const theaterPresence: Record<string, typeof emptyPresence extends () => infer R ? R : never> = {} as any;
    for (const tid of THEATER_IDS) {
      theaterPresence[tid] = emptyPresence();
    }

    players[p.id] = {
      id: p.id,
      name: p.name,
      directorate: p.directorate,
      resources,
      si: 0,
      readiness: 0,
      portfolio,
      hand,
      contracts: [],
      theaterPresence: theaterPresence as Record<typeof THEATER_IDS[number], ReturnType<typeof emptyPresence>>,
      usedOncePerYear: false,
      firstAirActivatedThisYear: false,
      firstNetworkActivatedThisYear: false,
      selectedOrders: null,
      sustainOrdersThisYear: [],
      logisticsSurgeThisQuarter: false,
      stationedPrograms: [],
    };
  }

  // Turn order: randomized initially
  const turnOrder = rng.shuffle(options.players.map(p => p.id));

  // Initial national posture
  const nationalPosture: NationalPosture = {
    coverage: 0,
    readiness: 0,
    techEdge: 0,
  };

  const state: GameState = {
    config,
    phase: { type: 'setup' },
    fiscalYear: 1,
    turnOrder,
    players,
    board,
    decks,
    nationalPosture,
    currentAgenda: null,
    contractMarket: [],
    currentCrisis: null,
    log: [],
    seed,
  };

  return state;
}
