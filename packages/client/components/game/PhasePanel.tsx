'use client';

import type { GameState, GameEvent, OrderChoice, BudgetLine } from '@fp/shared';
import { ORDERS, THEATER_NAMES } from '@fp/shared';
import { CongressPanel } from './CongressPanel';
import { ContractMarketPanel } from './ContractMarketPanel';
import { ContractChoicePanel } from './ContractChoicePanel';
import { HandDiscardPanel } from './HandDiscardPanel';
import { OrdersPanel } from './OrdersPanel';
import { GameOverPanel } from './GameOverPanel';
import { WaitingPanel } from './WaitingPanel';
import { CrisisPulsePanel } from './CrisisPulsePanel';
import styles from './GamePanel.module.css';

interface PhasePanelProps {
  gameState: GameState;
  humanPlayerId: string;
  gameId?: string;
  onVote: (amount: number, support: boolean) => void;
  onEndContractMarket: (chosenIds: string[]) => void;
  onSubmitOrders: (orders: [OrderChoice, OrderChoice]) => void;
  onUseNavseaAbility: (from: BudgetLine, to: BudgetLine) => void;
  onUseTranscomAbility: (to: BudgetLine) => void;
  onUseSpacecyAbility: () => void;
  onBuryPeekedCrisis: () => void;
  finalScores: { winnerId: string; scores: Record<string, number> } | null;
  onNewGame: () => void;
  showingResolution: boolean;
  recentEvents: GameEvent[];
  onSkipResolution: () => void;
  onAcknowledgeCrisis: () => void;
  onSubmitContractChoice: (contractId: string) => void;
  onSubmitHandDiscard: (cardIds: string[]) => Promise<boolean>;
  /** Personal view: no order picker; use Strategic view to submit orders. */
  hideOrdersPanel?: boolean;
  /** Read-only: no actions (spectator stream). */
  spectator?: boolean;
  /** Shown in spectator panel (e.g. current phase line). */
  readOnlyPhaseCaption?: string;
}

const PHASE_HELP: Record<string, string> = {
  congress: 'Vote on the budget agenda using your Political Capital. Supporting a passed agenda gives budget bonuses; opposing costs you nothing but the PC you commit.',
  contractMarket: 'Pick contracts to pursue this year. Completing contracts earns SI (victory points). You can hold up to 2 active contracts.',
  planOrders: 'Choose 2 orders to execute this quarter. Orders resolve in category order: Influence, then Procure, Deploy, Sustain. Pick orders that advance your contracts and theater position.',
  gameEnd: 'Final scores include bonuses for program sets, contract completion, and theater presence.',
  handDiscard: 'You are over your hand limit. Choose which programs to discard to the discard pile — only the count shown matters; pick the weakest or least relevant cards for your strategy.',
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
  const { gameState, humanPlayerId, gameId, showingResolution, recentEvents, onSkipResolution } = props;
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

  if (props.spectator && phase.type !== 'gameEnd') {
    return (
      <div className={styles.panel}>
        <div className={styles.spectatorNote}>
          <strong>Spectator</strong>
          <p className={styles.mutedText}>
            Hands, vote commitments, and secret choices stay hidden. Follow the map, event log, and roster.
          </p>
          {props.readOnlyPhaseCaption && (
            <p className={styles.spectatorPhaseLine}>{props.readOnlyPhaseCaption}</p>
          )}
        </div>
      </div>
    );
  }

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
          <CrisisPulsePanel
            gameState={gameState}
            humanPlayerId={humanPlayerId}
            onAcknowledge={props.onAcknowledgeCrisis}
            onUseSpacecyAbility={props.onUseSpacecyAbility}
            onBuryPeekedCrisis={props.onBuryPeekedCrisis}
          />
        );
      }
      if (phase.step === 'contractChoice') {
        return (
          <ContractChoicePanel
            gameState={gameState}
            humanPlayerId={humanPlayerId}
            onSubmitChoice={props.onSubmitContractChoice}
          />
        );
      }
      if (phase.step === 'handDiscard') {
        return (
          <>
            {helpElement}
            <HandDiscardPanel
              gameState={gameState}
              humanPlayerId={humanPlayerId}
              onSubmitDiscard={props.onSubmitHandDiscard}
            />
          </>
        );
      }
      if (phase.step === 'planOrders') {
        if (props.hideOrdersPanel) {
          const p = gameState.players[humanPlayerId];
          const locked = p?.selectedOrders;
          if (locked) {
            const lines = locked.map(choice => ORDERS[choice.order].name);
            return <WaitingPanel title="Orders locked in" lines={lines} />;
          }
          return null;
        }
        return (
          <>
            {helpElement}
            <OrdersPanel
              gameState={gameState}
              humanPlayerId={humanPlayerId}
              gameId={gameId}
              onSubmit={props.onSubmitOrders}
              onUseNavseaAbility={props.onUseNavseaAbility}
              onUseTranscomAbility={props.onUseTranscomAbility}
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
          <GameOverPanel
            gameState={gameState}
            finalScores={props.finalScores}
            onNewGame={props.onNewGame}
            primaryActionLabel={props.spectator ? 'Back to operations' : undefined}
          />
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
