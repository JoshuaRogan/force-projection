'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { GameState, GameEvent, OrderChoice, DirectorateId, BudgetLine } from '@fp/shared';
import { DIRECTORATE_IDS, PROGRAM_CARDS, CONTRACT_CARDS, AGENDA_CARDS, CRISIS_CARDS } from '@fp/shared';
import { GameEngine, SeededRNG } from '@fp/engine';

function handDiscardExcessForPlayer(state: GameState, playerId: string): number {
  const p = state.players[playerId];
  return Math.max(0, p.hand.length - state.config.handLimit);
}
import { Bot, PERSONALITIES } from '@fp/simulation';

const STORAGE_KEY = 'fp-game-state';

// Lookup map to re-attach prose to cards deserialized from localStorage
// (prose is not re-saved if state was stored before prose was generated)
const _proseMap: Record<string, string | undefined> = {};
for (const c of [...PROGRAM_CARDS, ...CONTRACT_CARDS, ...AGENDA_CARDS, ...CRISIS_CARDS]) {
  if (c.prose) _proseMap[c.id] = c.prose;
}

function withProse<T extends { id: string; prose?: string }>(card: T): T {
  const prose = _proseMap[card.id];
  return prose && !card.prose ? { ...card, prose } : card;
}

function hydrateStateProse(state: GameState): GameState {
  for (const player of Object.values(state.players)) {
    if (player.hand?.length) {
      (player as any).hand = player.hand.map(withProse);
    }
  }
  return state;
}

/** How long to show the resolution summary before auto-advancing (ms) */
const RESOLUTION_DISPLAY_MS = 5000;

interface GameController {
  gameState: GameState;
  humanPlayerId: string;
  submitVote: (amount: number, support: boolean) => void;
  submitOrders: (orders: [OrderChoice, OrderChoice]) => void;
  useNavseaAbility: (from: BudgetLine, to: BudgetLine) => void;
  useTranscomAbility: (to: BudgetLine) => void;
  useSpacecyAbility: () => void;
  buryPeekedCrisis: () => void;
  endContractMarket: (chosenIds: string[]) => void;
  submitContractChoice: (contractId: string) => void;
  submitHandDiscard: (cardIds: string[]) => void;
  getFinalScores: () => { winnerId: string; scores: Record<string, number> } | null;
  newGame: () => void;
  phaseLabel: string;
  /** Events from the game log */
  events: GameEvent[];
  /** Events that happened during the last auto-advance (resolution summary) */
  recentEvents: GameEvent[];
  /** Whether we're showing resolution results before advancing */
  showingResolution: boolean;
  /** Skip the resolution delay and continue */
  skipResolution: () => void;
  /** Human acknowledges the crisis and continues to order planning */
  acknowledgeCrisis: () => void;
}

function saveState(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* storage full or unavailable */ }
}

function loadState(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return hydrateStateProse(JSON.parse(raw) as GameState);
  } catch {
    return null;
  }
}

function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}

function createBots(state: GameState, humanId: string): Map<string, Bot> {
  const bots = new Map<string, Bot>();
  for (const pid of state.turnOrder) {
    if (pid === humanId) continue;
    const playerIdx = parseInt(pid.replace('p', ''), 10);
    bots.set(pid, new Bot(
      pid,
      PERSONALITIES['balanced'],
      new SeededRNG(state.seed + playerIdx * 7919),
    ));
  }
  return bots;
}

/**
 * Returns true if the current phase requires human input.
 */
function needsHumanInput(state: GameState, humanId: string): boolean {
  const phase = state.phase;

  switch (phase.type) {
    case 'congress': {
      const agenda = state.currentAgenda;
      if (!agenda) return false;
      return agenda.commitments[humanId] === undefined;
    }
    case 'contractMarket':
      return true;
    case 'quarter': {
      if (phase.step === 'planOrders') {
        return state.players[humanId].selectedOrders === null;
      }
      if (phase.step === 'crisisPulse') {
        return state.currentCrisis !== null;
      }
      if (phase.step === 'contractChoice') {
        const pending = state.players[humanId].pendingContractDraw;
        return pending !== null && pending.length > 0;
      }
      if (phase.step === 'handDiscard') {
        return handDiscardExcessForPlayer(state, humanId) > 0;
      }
      return false;
    }
    case 'gameEnd':
      return true;
    default:
      return false;
  }
}

export function useGameController(seed: number = 42): GameController {
  const engineRef = useRef<GameEngine | null>(null);
  const botsRef = useRef<Map<string, Bot>>(new Map());
  const humanId = 'p0';

  // Initialize
  if (!engineRef.current) {
    const saved = loadState();

    if (saved) {
      engineRef.current = GameEngine.fromState(saved);
      botsRef.current = createBots(saved, humanId);
    } else {
      const rng = new SeededRNG(seed);
      const directorates = rng.pick(DIRECTORATE_IDS, 4) as DirectorateId[];

      const players = directorates.map((dir, i) => ({
        id: `p${i}`,
        name: i === 0 ? 'You' : `Bot ${i}`,
        directorate: dir,
      }));

      const engine = new GameEngine({
        players,
        seed,
        config: { fiscalYears: 4, playerCount: 4 },
      });

      engine.start();
      engineRef.current = engine;
      botsRef.current = createBots(engine.state, humanId);
      saveState(engine.state);
    }
  }

  const [, setTick] = useState(0);
  const [recentEvents, setRecentEvents] = useState<GameEvent[]>([]);
  const [showingResolution, setShowingResolution] = useState(false);
  const showingResolutionRef = useRef(false);
  const resolutionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rerender = useCallback(() => setTick(n => n + 1), []);

  const engine = engineRef.current!;
  const bots = botsRef.current;

  /**
   * Auto-advance through non-interactive phases, collecting events.
   * If significant events happened (order resolution, year end), pause to show them.
   */
  const advanceUntilHumanInput = useCallback(() => {
    if (showingResolutionRef.current) return;

    const logBefore = engine.state.log.length;
    let hadResolution = false;
    let safety = 0;
    let advanced = false;

    while (!engine.isGameOver && !needsHumanInput(engine.state, humanId) && safety < 200) {
      safety++;
      advanced = true;
      const phase = engine.state.phase;

      if (phase.type === 'congress') {
        for (const [id, bot] of bots) {
          try {
            const vote = bot.chooseAgendaVote(engine.state);
            engine.submitVote(id, vote.amount, vote.support);
          } catch { /* already voted */ }
        }
        if (engine.state.currentAgenda?.commitments[humanId] !== undefined) {
          engine.resolveVotes();
        }
        continue;
      }

      if (phase.type === 'quarter') {
        switch (phase.step) {
          case 'crisisPulse':
            engine.endCrisisPulse();
            continue;
          case 'planOrders':
            for (const [id, bot] of bots) {
              try {
                const orders = bot.chooseOrders(engine.state);
                engine.submitOrders(id, orders);
              } catch { /* already submitted */ }
            }
            if (engine.state.players[humanId].selectedOrders !== null && engine.allOrdersIn()) {
              engine.revealAndResolve();
              hadResolution = true;
            }
            continue;
          case 'resolveOrders':
            continue;
          case 'contractChoice':
            // Bots choose their pending contracts; if human has a pending draw, stop
            for (const [id, bot] of bots) {
              const pending = engine.state.players[id]?.pendingContractDraw;
              if (pending && pending.length > 0) {
                try { engine.submitContractChoice(id, pending[0].id); } catch { /* ignore */ }
              }
            }
            if (engine.allContractChoicesDone()) {
              engine.endContractChoices();
            }
            continue;
          case 'handDiscard':
            for (const [id] of bots) {
              const p = engine.state.players[id];
              const excess = Math.max(0, p.hand.length - engine.state.config.handLimit);
              if (excess <= 0) continue;
              const playerIdx = parseInt(id.replace('p', ''), 10) || 0;
              const rng = new SeededRNG(engine.state.seed + playerIdx * 7919 + 31);
              const cardIds = rng.pick(p.hand.map(c => c.id), excess);
              try {
                engine.submitHandDiscard(id, cardIds);
              } catch { /* ignore */ }
            }
            if (engine.allHandDiscardsDone()) {
              try {
                engine.endHandDiscard();
              } catch { /* ignore */ }
            }
            continue;
          case 'cleanup':
            engine.endQuarter();
            continue;
        }
      }

      break;
    }

    // Only update state if something actually happened
    if (!advanced && logBefore === engine.state.log.length) return;

    const newEvents = engine.state.log.slice(logBefore);
    saveState(engine.state);

    const hasYearEnd = newEvents.some(e => e.type === 'yearEnd');
    if ((hadResolution || hasYearEnd) && newEvents.length > 0) {
      showingResolutionRef.current = true;
      setShowingResolution(true);
      setRecentEvents(newEvents);
      resolutionTimerRef.current = setTimeout(() => {
        showingResolutionRef.current = false;
        setShowingResolution(false);
        setRecentEvents([]);
        rerender();
      }, RESOLUTION_DISPLAY_MS);
    } else if (newEvents.length > 0) {
      setRecentEvents(newEvents);
    }

    rerender();
  }, [engine, bots, rerender]);

  // Run auto-advance once on mount
  const didInitRef = useRef(false);
  useEffect(() => {
    if (!didInitRef.current) {
      didInitRef.current = true;
      advanceUntilHumanInput();
    }
  }, [advanceUntilHumanInput]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (resolutionTimerRef.current) {
        clearTimeout(resolutionTimerRef.current);
      }
    };
  }, []);

  // Helper: rerender then schedule advance on next frame
  const rerenderAndAdvance = useCallback(() => {
    rerender();
    setTimeout(() => advanceUntilHumanInput(), 0);
  }, [rerender, advanceUntilHumanInput]);

  const skipResolution = useCallback(() => {
    if (resolutionTimerRef.current) {
      clearTimeout(resolutionTimerRef.current);
      resolutionTimerRef.current = null;
    }
    showingResolutionRef.current = false;
    setShowingResolution(false);
    setRecentEvents([]);
    rerenderAndAdvance();
  }, [rerenderAndAdvance]);

  const acknowledgeCrisis = useCallback(() => {
    engine.endCrisisPulse();
    saveState(engine.state);
    rerenderAndAdvance();
  }, [engine, rerenderAndAdvance]);

  // === Human actions ===

  const submitVote = useCallback((amount: number, support: boolean) => {
    engine.submitVote(humanId, amount, support);
    engine.resolveVotes();
    saveState(engine.state);
    rerenderAndAdvance();
  }, [engine, rerenderAndAdvance]);

  const doEndContractMarket = useCallback((chosenIds: string[]) => {
    // Submit human choices
    engine.submitMarketChoices(humanId, chosenIds);
    // Submit bot choices immediately
    for (const [id, bot] of bots) {
      const contractId = bot.chooseContract(engine.state);
      const botChoices = contractId ? [contractId] : [];
      engine.submitMarketChoices(id, botChoices);
    }
    if (engine.allMarketChoicesSubmitted()) {
      engine.endContractMarket();
    }
    saveState(engine.state);
    rerenderAndAdvance();
  }, [engine, bots, rerenderAndAdvance]);

  const doSubmitOrders = useCallback((orders: [OrderChoice, OrderChoice]) => {
    engine.submitOrders(humanId, orders);
    if (engine.allOrdersIn()) {
      engine.revealAndResolve();
    }
    saveState(engine.state);
    rerenderAndAdvance();
  }, [engine, rerenderAndAdvance]);

  const doSubmitContractChoice = useCallback((contractId: string) => {
    try {
      engine.submitContractChoice(humanId, contractId);
      if (engine.allContractChoicesDone()) {
        engine.endContractChoices();
      }
    } catch { /* ignore invalid calls */ }
    saveState(engine.state);
    rerenderAndAdvance();
  }, [engine, rerenderAndAdvance]);

  const doSubmitHandDiscard = useCallback((cardIds: string[]) => {
    try {
      const ok = engine.submitHandDiscard(humanId, cardIds);
      if (ok && engine.allHandDiscardsDone()) {
        engine.endHandDiscard();
      }
    } catch { /* ignore */ }
    saveState(engine.state);
    rerenderAndAdvance();
  }, [engine, rerenderAndAdvance]);

  const doUseNavseaAbility = useCallback((from: BudgetLine, to: BudgetLine) => {
    engine.useNavseaAbility(humanId, from, to);
    saveState(engine.state);
    rerender();
  }, [engine, rerender]);

  const doUseTranscomAbility = useCallback((to: BudgetLine) => {
    engine.useTranscomAbility(humanId, to);
    saveState(engine.state);
    rerender();
  }, [engine, rerender]);

  const doUseSpacecyAbility = useCallback(() => {
    engine.useSpacecyAbility(humanId);
    saveState(engine.state);
    rerender();
  }, [engine, rerender]);

  const doBuryPeekedCrisis = useCallback(() => {
    engine.buryPeekedCrisis(humanId);
    saveState(engine.state);
    rerender();
  }, [engine, rerender]);

  const getFinalScores = useCallback(() => {
    if (!engine.isGameOver) return null;
    return engine.getFinalScores();
  }, [engine]);

  const newGame = useCallback(() => {
    clearState();
    engineRef.current = null;
    window.location.reload();
  }, []);

  return {
    gameState: engine.state,
    humanPlayerId: humanId,
    submitVote,
    endContractMarket: doEndContractMarket,
    submitOrders: doSubmitOrders,
    submitContractChoice: doSubmitContractChoice,
    submitHandDiscard: doSubmitHandDiscard,
    useNavseaAbility: doUseNavseaAbility,
    useTranscomAbility: doUseTranscomAbility,
    useSpacecyAbility: doUseSpacecyAbility,
    buryPeekedCrisis: doBuryPeekedCrisis,
    getFinalScores,
    newGame,
    phaseLabel: getPhaseLabel(engine.state),
    events: engine.state.log,
    recentEvents,
    showingResolution,
    skipResolution,
    acknowledgeCrisis,
  };
}

function getPhaseLabel(state: GameState): string {
  const phase = state.phase;
  const year = state.fiscalYear;

  switch (phase.type) {
    case 'setup': return 'Setting up...';
    case 'congress': return `Year ${year} \u2014 Congressional Budget`;
    case 'contractMarket': return `Year ${year} \u2014 Contract Market`;
    case 'quarter':
      return `Year ${year}, Q${phase.quarter} \u2014 ${
        phase.step === 'crisisPulse' ? 'Crisis' :
        phase.step === 'planOrders' ? 'Plan Orders' :
        phase.step === 'resolveOrders' ? 'Resolving...' :
        phase.step === 'contractChoice' ? 'Contracting' :
        phase.step === 'handDiscard' ? 'Discard' :
        'Cleanup'
      }`;
    case 'yearEnd': return `Year ${year} \u2014 Year End`;
    case 'gameEnd': return 'Game Over';
  }
}
