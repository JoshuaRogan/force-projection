'use client';

import type { GameState, PlayerState, GameEvent, OrderChoice, BudgetLine } from '@fp/shared';
import { PlayerDashboard, HandTray } from '@/components/dashboard';
import { PhasePanel } from '@/components/game/PhasePanel';
import { PhaseTimeline } from '@/components/game/PhaseTimeline';
import { PersonalPortfolioHero } from './PersonalPortfolioHero';
import styles from './PersonalView.module.css';

interface PersonalViewProps {
  gameState: GameState;
  humanPlayerId: string;
  gameId?: string;
  humanPlayer: PlayerState;
  recentEvents: GameEvent[];
  showingResolution: boolean;
  onVote: (amount: number, support: boolean) => void;
  onEndContractMarket: (ids: string[]) => void;
  onSubmitOrders: (orders: [OrderChoice, OrderChoice]) => void;
  onUseNavseaAbility: (from: BudgetLine, to: BudgetLine) => void;
  onUseTranscomAbility: (to: BudgetLine) => void;
  onUseSpacecyAbility: () => void;
  onBuryPeekedCrisis: () => void;
  getFinalScores: () => { winnerId: string; scores: Record<string, number> } | null;
  onNewGame: () => void;
  onSkipResolution: () => void;
  onAcknowledgeCrisis: () => void;
  onSubmitContractChoice: (contractId: string) => void;
  onSubmitHandDiscard: (cardIds: string[]) => void;
}

export function PersonalView({
  gameState,
  humanPlayerId,
  gameId,
  humanPlayer,
  recentEvents,
  showingResolution,
  onVote,
  onEndContractMarket,
  onSubmitOrders,
  onUseNavseaAbility,
  onUseTranscomAbility,
  onUseSpacecyAbility,
  onBuryPeekedCrisis,
  getFinalScores,
  onNewGame,
  onSkipResolution,
  onAcknowledgeCrisis,
  onSubmitContractChoice,
  onSubmitHandDiscard,
}: PersonalViewProps) {
  const phase = gameState.phase;
  const me = gameState.players[humanPlayerId];
  const hidePhasePanelChrome =
    phase.type === 'quarter' &&
    phase.step === 'planOrders' &&
    !showingResolution &&
    me?.selectedOrders === null;

  return (
    <div className={styles.layout}>
      {/* Timeline — full width */}
      <div className={styles.timelineRow}>
        <PhaseTimeline gameState={gameState} />
      </div>

      {/* Two-column body */}
      <div className={styles.body}>
        {/* Left: player stats */}
        <aside className={styles.statsCol}>
          <PlayerDashboard
            player={humanPlayer}
            gameState={gameState}
            portfolioSidebarMode="mothballed-only"
          />
        </aside>

        {/* Right: program strips + phase panel (no activity log) */}
        <main className={styles.mainCol}>
          <PersonalPortfolioHero player={humanPlayer} gameState={gameState} />
          {!hidePhasePanelChrome && (
            <div className={styles.phasePanel}>
              <PhasePanel
                gameState={gameState}
                humanPlayerId={humanPlayerId}
                gameId={gameId}
                onVote={onVote}
                onEndContractMarket={onEndContractMarket}
                onSubmitOrders={onSubmitOrders}
                onUseNavseaAbility={onUseNavseaAbility}
                onUseTranscomAbility={onUseTranscomAbility}
                onUseSpacecyAbility={onUseSpacecyAbility}
                onBuryPeekedCrisis={onBuryPeekedCrisis}
                finalScores={getFinalScores()}
                onNewGame={onNewGame}
                showingResolution={showingResolution}
                recentEvents={recentEvents}
                onSkipResolution={onSkipResolution}
                onAcknowledgeCrisis={onAcknowledgeCrisis}
                onSubmitContractChoice={onSubmitContractChoice}
                onSubmitHandDiscard={onSubmitHandDiscard}
                hideOrdersPanel
              />
            </div>
          )}
        </main>
      </div>

      <footer className={styles.handArea}>
        <HandTray hand={humanPlayer.hand} />
      </footer>
    </div>
  );
}
