import type { GameState, OrderChoice, BudgetLine } from '@fp/shared';
import { createGame, type CreateGameOptions } from './createGame.js';
import {
  startFiscalYear, setupCongress, submitAgendaVote, resolveAgenda,
  setupContractMarket, takeContract, endContractMarket,
  setupCrisisPulse, endCrisisPulse, submitOrders, allOrdersSubmitted,
  revealOrders, endResolveOrders, quarterCleanup, processYearEnd,
  useNavseaReprogram, useTranscomConversion, useSpacecyCrisisPeek,
} from './phases.js';
import { resolveAllOrders } from './orders.js';
import { computeEndgameScoring, determineWinner } from './scoring.js';

/**
 * GameEngine provides a high-level API for driving a game.
 * All mutations happen through this class — it enforces phase ordering.
 */
export class GameEngine {
  public state: GameState;
  private cachedFinalScores: { winnerId: string; scores: Record<string, number> } | null = null;

  constructor(options: CreateGameOptions) {
    this.state = createGame(options);
  }

  /** Restore an engine from a previously saved GameState (e.g. from localStorage) */
  static fromState(state: GameState): GameEngine {
    const engine = Object.create(GameEngine.prototype) as GameEngine;
    engine.state = state;
    return engine;
  }

  /** Start the game — transitions from setup to first fiscal year */
  start(): void {
    if (this.state.phase.type !== 'setup') throw new Error('Game already started');
    startFiscalYear(this.state);
    setupCongress(this.state);
  }

  // === Congress Phase ===

  submitVote(playerId: string, amount: number, support: boolean): void {
    this.assertPhase('congress');
    submitAgendaVote(this.state, playerId, amount, support);
  }

  resolveVotes(): void {
    this.assertPhase('congress');
    resolveAgenda(this.state);
    setupContractMarket(this.state);
  }

  // === Contract Market Phase ===

  takeContract(playerId: string, contractId: string): boolean {
    this.assertPhase('contractMarket');
    return takeContract(this.state, playerId, contractId);
  }

  endContractMarket(): void {
    this.assertPhase('contractMarket');
    endContractMarket(this.state);
    setupCrisisPulse(this.state);
  }

  // === Quarter Phases ===

  endCrisisPulse(): void {
    this.assertQuarterStep('crisisPulse');
    endCrisisPulse(this.state);
  }

  submitOrders(playerId: string, orders: [OrderChoice, OrderChoice]): void {
    this.assertQuarterStep('planOrders');
    submitOrders(this.state, playerId, orders);
  }

  /** NAVSEA once/year: move 1 budget token between lines. */
  useNavseaAbility(playerId: string, from: BudgetLine, to: BudgetLine): void {
    this.assertQuarterStep('planOrders');
    const ok = useNavseaReprogram(this.state, playerId, from, to);
    if (!ok) {
      throw new Error('NAVSEA reprogram action is not available');
    }
  }

  /** TRANSCOM once/year: convert 2 U to 1 budget line. */
  useTranscomAbility(playerId: string, to: BudgetLine): void {
    this.assertQuarterStep('planOrders');
    const ok = useTranscomConversion(this.state, playerId, to);
    if (!ok) {
      throw new Error('TRANSCOM conversion is not available');
    }
  }

  /** SPACECY once/year: peek next crisis and optionally bury it. */
  useSpacecyAbility(playerId: string, bury: boolean): void {
    this.assertQuarterStep('crisisPulse');
    const ok = useSpacecyCrisisPeek(this.state, playerId, bury);
    if (!ok) {
      throw new Error('SPACECY crisis peek is not available');
    }
  }

  /** Check if all players have submitted orders */
  allOrdersIn(): boolean {
    return allOrdersSubmitted(this.state);
  }

  /** Reveal all orders and transition to resolution */
  revealAndResolve(): void {
    this.assertQuarterStep('planOrders');
    if (!allOrdersSubmitted(this.state)) throw new Error('Not all orders submitted');
    revealOrders(this.state);
    resolveAllOrders(this.state);
    endResolveOrders(this.state);
  }

  /** Run cleanup and advance to next quarter or year end */
  endQuarter(): void {
    this.assertQuarterStep('cleanup');

    // Draw cards for next quarter (if advancing to another quarter)
    quarterCleanup(this.state);

    // If we just moved to yearEnd, process it
    if (this.state.phase.type === 'yearEnd') {
      processYearEnd(this.state);
      // processYearEnd transitions to either 'congress' (new year) or 'gameEnd'
      this.afterYearEnd();
    } else if (this.state.phase.type === 'quarter' && this.state.phase.step === 'crisisPulse') {
      // New quarter started — set up crisis
      setupCrisisPulse(this.state);
    }
  }

  // === Endgame ===

  getFinalScores(): { winnerId: string; scores: Record<string, number> } {
    this.assertPhase('gameEnd');
    if (!this.cachedFinalScores) {
      this.cachedFinalScores = determineWinner(this.state);
    }
    return this.cachedFinalScores;
  }

  // === Helpers ===

  get phase() { return this.state.phase; }
  get fiscalYear() { return this.state.fiscalYear; }
  get isGameOver() { return this.state.phase.type === 'gameEnd'; }

  getPlayer(id: string) { return this.state.players[id]; }

  private assertPhase(type: string): void {
    if (this.state.phase.type !== type) {
      throw new Error(`Expected phase '${type}', got '${this.state.phase.type}'`);
    }
  }

  private afterYearEnd(): void {
    const phase = this.state.phase;
    if (phase.type === 'congress') {
      setupCongress(this.state);
    }
    // if gameEnd, nothing to do — caller uses getFinalScores()
  }

  private assertQuarterStep(step: string): void {
    if (this.state.phase.type !== 'quarter') {
      throw new Error(`Expected quarter phase, got '${this.state.phase.type}'`);
    }
    if (this.state.phase.step !== step) {
      throw new Error(`Expected quarter step '${step}', got '${this.state.phase.step}'`);
    }
  }
}
