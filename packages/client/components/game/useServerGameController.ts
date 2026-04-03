'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { GameState, GameEvent, OrderChoice, BudgetLine } from '@fp/shared';
import { GameEngine } from '@fp/engine';

const POLL_INTERVAL_MS = 2500;

// The server strips deck arrays and replaces with counts.
// Reconstruct fake arrays of the right length so components that call
// .length on deck arrays don't crash.
function normalizeSanitizedState(raw: Record<string, unknown>): GameState {
  const decks = raw.decks as Record<string, number>;
  return {
    ...raw,
    decks: {
      programs:       new Array(decks.programsCount ?? 0).fill(null),
      programDiscard: new Array(decks.programDiscardCount ?? 0).fill(null),
      contracts:      new Array(decks.contractsCount ?? 0).fill(null),
      agendas:        new Array(decks.agendasCount ?? 0).fill(null),
      crises:         new Array(decks.crisesCount ?? 0).fill(null),
    },
    seed: 0, // stripped server-side; not needed client-side
  } as unknown as GameState;
}

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
  events: GameEvent[];
  recentEvents: GameEvent[];
  showingResolution: boolean;
  skipResolution: () => void;
  acknowledgeCrisis: () => void;
}

export function useServerGameController(gameId: string, playerId: string): GameController {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [recentEvents, setRecentEvents] = useState<GameEvent[]>([]);
  const [showingResolution, setShowingResolution] = useState(false);
  const prevLogLengthRef = useRef(0);
  const showingResolutionRef = useRef(false);
  const resolutionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const applyState = useCallback((raw: Record<string, unknown>) => {
    const next = normalizeSanitizedState(raw);

    setGameState(prev => {
      const prevLen = prev?.log.length ?? 0;
      const newEvents = next.log.slice(prevLen);
      prevLogLengthRef.current = next.log.length;

      if (newEvents.length > 0) {
        const hadResolution = newEvents.some(e =>
          e.type === 'orderResolved' || e.type === 'yearEnd'
        );
        if (hadResolution && !showingResolutionRef.current) {
          showingResolutionRef.current = true;
          setShowingResolution(true);
          setRecentEvents(newEvents);
          if (resolutionTimerRef.current) clearTimeout(resolutionTimerRef.current);
          resolutionTimerRef.current = setTimeout(() => {
            showingResolutionRef.current = false;
            setShowingResolution(false);
            setRecentEvents([]);
          }, 3000);
        } else {
          setRecentEvents(newEvents);
        }
      }

      return next;
    });
  }, []);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/games/${gameId}?player=${playerId}`);
      if (!res.ok) return;
      const raw = await res.json();
      applyState(raw);
    } catch { /* network hiccup — retry next poll */ }
  }, [gameId, playerId, applyState]);

  // Initial fetch + polling
  useEffect(() => {
    fetchState();
    pollRef.current = setInterval(fetchState, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (resolutionTimerRef.current) clearTimeout(resolutionTimerRef.current);
    };
  }, [fetchState]);

  // Generic action helper — POSTs to an endpoint and applies returned state
  const action = useCallback(async (endpoint: string, body: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/games/${gameId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, ...body }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.state) applyState(data.state);
    } catch { /* ignore */ }
  }, [gameId, playerId, applyState]);

  const submitVote = useCallback((amount: number, support: boolean) => {
    action('vote', { amount, support });
  }, [action]);

  const submitOrders = useCallback((orders: [OrderChoice, OrderChoice]) => {
    action('orders', { orders });
  }, [action]);

  const endContractMarket = useCallback(async (chosenIds: string[]) => {
    await action('contract', { contractIds: chosenIds });
  }, [action]);

  const acknowledgeCrisis = useCallback(() => {
    action('advance', { action: 'endCrisisPulse' });
  }, [action]);

  const submitContractChoice = useCallback((contractId: string) => {
    action('contract-choice', { contractId });
  }, [action]);

  const submitHandDiscard = useCallback((cardIds: string[]) => {
    action('hand-discard', { cardIds });
  }, [action]);

  const useNavseaAbility = useCallback((from: BudgetLine, to: BudgetLine) => {
    action('ability', { ability: 'navsea', from, to });
  }, [action]);

  const useTranscomAbility = useCallback((to: BudgetLine) => {
    action('ability', { ability: 'transcom', to });
  }, [action]);

  const useSpacecyAbility = useCallback(() => {
    action('ability', { ability: 'spacecy' });
  }, [action]);

  const buryPeekedCrisis = useCallback(() => {
    action('ability', { ability: 'spacecy-bury' });
  }, [action]);

  const getFinalScores = useCallback(() => {
    if (!gameState || gameState.phase.type !== 'gameEnd') return null;
    return GameEngine.fromState(gameState).getFinalScores();
  }, [gameState]);

  const skipResolution = useCallback(() => {
    if (resolutionTimerRef.current) clearTimeout(resolutionTimerRef.current);
    showingResolutionRef.current = false;
    setShowingResolution(false);
    setRecentEvents([]);
  }, []);

  const newGame = useCallback(() => {
    window.location.href = '/lobby';
  }, []);

  // Loading state — return a minimal stub so the game page can show a spinner
  if (!gameState) {
    return {
      gameState: null as unknown as GameState,
      humanPlayerId: playerId,
      submitVote, submitOrders, endContractMarket, acknowledgeCrisis,
      useNavseaAbility, useTranscomAbility, useSpacecyAbility, buryPeekedCrisis,
      submitContractChoice, submitHandDiscard,
      getFinalScores, newGame, skipResolution,
      phaseLabel: 'Loading…',
      events: [], recentEvents: [], showingResolution: false,
    };
  }

  return {
    gameState,
    humanPlayerId: playerId,
    submitVote,
    submitOrders,
    endContractMarket,
    acknowledgeCrisis,
    useNavseaAbility,
    useTranscomAbility,
    useSpacecyAbility,
    buryPeekedCrisis,
    submitContractChoice,
    submitHandDiscard,
    getFinalScores,
    newGame,
    skipResolution,
    phaseLabel: getPhaseLabel(gameState),
    events: gameState.log,
    recentEvents,
    showingResolution,
  };
}

function getPhaseLabel(state: GameState): string {
  const phase = state.phase;
  const year = state.fiscalYear;
  switch (phase.type) {
    case 'setup': return 'Setting up...';
    case 'congress': return `Year ${year} — Congressional Budget`;
    case 'contractMarket': return `Year ${year} — Contract Market`;
    case 'quarter':
      return `Year ${year}, Q${phase.quarter} — ${
        phase.step === 'crisisPulse' ? 'Crisis' :
        phase.step === 'planOrders' ? 'Plan Orders' :
        phase.step === 'resolveOrders' ? 'Resolving...' :
        phase.step === 'contractChoice' ? 'Contracting' :
        phase.step === 'handDiscard' ? 'Discard' :
        'Cleanup'
      }`;
    case 'yearEnd': return `Year ${year} — Year End`;
    case 'gameEnd': return 'Game Over';
  }
}
