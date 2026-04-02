'use client';

import type { GameState, GameEvent, OrderChoice, BudgetLine } from '@fp/shared';
import { ORDERS, THEATER_NAMES } from '@fp/shared';
import { CongressPanel } from './CongressPanel';
import { ContractMarketPanel } from './ContractMarketPanel';
import { OrdersPanel } from './OrdersPanel';
import { GameOverPanel } from './GameOverPanel';
import { CrisisCard } from '../cards';
import styles from './GamePanel.module.css';

interface PhasePanelProps {
  gameState: GameState;
  humanPlayerId: string;
  onVote: (amount: number, support: boolean) => void;
  onEndContractMarket: (chosenIds: string[]) => void;
  onSubmitOrders: (orders: [OrderChoice, OrderChoice]) => void;
  onUseNavseaAbility: (from: BudgetLine, to: BudgetLine) => void;
  finalScores: { winnerId: string; scores: Record<string, number> } | null;
  onNewGame: () => void;
  showingResolution: boolean;
  recentEvents: GameEvent[];
  onSkipResolution: () => void;
  onAcknowledgeCrisis: () => void;
}

const PHASE_HELP: Record<string, string> = {
  congress: 'Vote on the budget agenda using your Political Capital. Supporting a passed agenda gives budget bonuses; opposing costs you nothing but the PC you commit.',
  contractMarket: 'Pick contracts to pursue this year. Completing contracts earns SI (victory points). You can hold up to 2 active contracts.',
  planOrders: 'Choose 2 orders to execute this quarter. Orders resolve in category order: Influence, then Procure, Deploy, Sustain. Pick orders that advance your contracts and theater position.',
  gameEnd: 'Final scores include bonuses for program sets, contract completion, and theater presence.',
};

function playerName(state: GameState, playerId: string): string {
  return state.players[playerId]?.name ?? playerId;
}

function formatResolutionEvent(event: GameEvent, state: GameState): string | null {
  switch (event.type) {
    case 'orderRevealed': {
      const name = playerName(state, event.playerId);
      const orderNames = event.orders.map(o => ORDERS[o.order].name).join(' + ');
      return `${name} chose: ${orderNames}`;
    }
    case 'orderResolved': {
      const name = playerName(state, event.playerId);
      return `${name} executed ${ORDERS[event.order.order].name}`;
    }
    case 'siChange':
      return `${playerName(state, event.playerId)} ${event.delta >= 0 ? '+' : ''}${event.delta} SI (${event.reason})`;
    case 'basePlaced':
      return `${playerName(state, event.playerId)} built a Base in ${THEATER_NAMES[event.theater]}`;
    case 'alliancePlaced':
      return `${playerName(state, event.playerId)} formed Alliance in ${THEATER_NAMES[event.theater]}`;
    case 'forwardOpsPlaced':
      return `${playerName(state, event.playerId)} deployed Forward Ops to ${THEATER_NAMES[event.theater]}`;
    case 'programPipelined':
      return `${playerName(state, event.playerId)} started a program`;
    case 'programActivated':
      return `${playerName(state, event.playerId)} activated a program`;
    case 'contractCompleted':
      return `${playerName(state, event.playerId)} completed a contract (+${event.si} SI)`;
    case 'contractFailed':
      return `${playerName(state, event.playerId)} failed a contract (-${event.penalty} SI)`;
    case 'theaterControlScored': {
      const leader = event.rankings[0];
      if (leader) return `${THEATER_NAMES[event.theater]}: ${playerName(state, leader.playerId)} leads (+${leader.si} SI)`;
      return null;
    }
    case 'yearEnd':
      return `\u2015 Year ${(event as any).fiscalYear} complete \u2015`;
    default:
      return null;
  }
}

export function PhasePanel(props: PhasePanelProps) {
  const { gameState, humanPlayerId, showingResolution, recentEvents, onSkipResolution } = props;
  const phase = gameState.phase;

  // Show resolution summary between quarters
  if (showingResolution && recentEvents.length > 0) {
    const displayEvents = recentEvents
      .map(e => formatResolutionEvent(e, gameState))
      .filter((t): t is string => t !== null);

    const isYearEnd = recentEvents.some(e => e.type === 'yearEnd');
    return (
      <div className={styles.resolutionPanel}>
        <div className={styles.resolutionTitle}>{isYearEnd ? 'Year End Summary' : 'Quarter Resolution'}</div>
        <div className={styles.resolutionEvents}>
          {displayEvents.map((text, i) => (
            <div
              key={i}
              className={styles.resolutionEvent}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className={styles.eventIcon}>{'\u2699'}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
        <button onClick={onSkipResolution} className={styles.btnPrimary}>
          Continue
        </button>
      </div>
    );
  }

  // Get phase help text
  const helpKey = phase.type === 'quarter' ? phase.step : phase.type;
  const helpText = PHASE_HELP[helpKey];

  const helpElement = helpText ? (
    <div className={styles.phaseHelp}>{helpText}</div>
  ) : null;

  switch (phase.type) {
    case 'congress':
      return (
        <>
          {helpElement}
          <CongressPanel gameState={gameState} humanPlayerId={humanPlayerId} onVote={props.onVote} />
        </>
      );

    case 'contractMarket':
      return (
        <>
          {helpElement}
          <ContractMarketPanel
            gameState={gameState}
            humanPlayerId={humanPlayerId}
            onEndMarket={props.onEndContractMarket}
          />
        </>
      );

    case 'quarter':
      if (phase.step === 'crisisPulse' && gameState.currentCrisis) {
        return (
          <div className={styles.panel}>
            <div className={styles.panelTitle}>Crisis This Quarter</div>
            <p className={styles.panelSubtext}>
              A crisis has emerged. Review the situation and prepare your response.
            </p>
            <div className={styles.wideCard}>
              <CrisisCard card={gameState.currentCrisis} layout="horizontal" />
            </div>
            <button onClick={props.onAcknowledgeCrisis} className={styles.btnPrimary}>
              Acknowledge &amp; Plan Orders
            </button>
          </div>
        );
      }
      if (phase.step === 'planOrders') {
        return (
          <>
            {helpElement}
            <OrdersPanel
              gameState={gameState}
              humanPlayerId={humanPlayerId}
              onSubmit={props.onSubmitOrders}
              onUseNavseaAbility={props.onUseNavseaAbility}
            />
          </>
        );
      }
      return (
        <div className={styles.panel}>
          <p className={styles.mutedText}>Processing {phase.step}...</p>
        </div>
      );

    case 'gameEnd':
      return (
        <>
          {helpElement}
          <GameOverPanel gameState={gameState} finalScores={props.finalScores} onNewGame={props.onNewGame} />
        </>
      );

    default:
      return (
        <div className={styles.panel}>
          <p className={styles.mutedText}>Phase: {phase.type}</p>
        </div>
      );
  }
}
