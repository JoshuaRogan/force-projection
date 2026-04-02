'use client';

import type { GameState, PlayerState, GameEvent, OrderChoice } from '@fp/shared';
import { PlayerDashboard, HandTray } from '@/components/dashboard';
import { PhasePanel } from '@/components/game/PhasePanel';
import { PhaseTimeline } from '@/components/game/PhaseTimeline';
import { EventFeed } from '@/components/game/EventFeed';
import styles from './PersonalView.module.css';

interface PersonalViewProps {
  gameState: GameState;
  humanPlayerId: string;
  humanPlayer: PlayerState;
  events: GameEvent[];
  recentEvents: GameEvent[];
  showingResolution: boolean;
  onVote: (amount: number, support: boolean) => void;
  onEndContractMarket: (ids: string[]) => void;
  onSubmitOrders: (orders: [OrderChoice, OrderChoice]) => void;
  getFinalScores: () => { winnerId: string; scores: Record<string, number> } | null;
  onNewGame: () => void;
  onSkipResolution: () => void;
  onAcknowledgeCrisis: () => void;
}

export function PersonalView({
  gameState,
  humanPlayerId,
  humanPlayer,
  events,
  recentEvents,
  showingResolution,
  onVote,
  onEndContractMarket,
  onSubmitOrders,
  getFinalScores,
  onNewGame,
  onSkipResolution,
  onAcknowledgeCrisis,
}: PersonalViewProps) {
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
          <PlayerDashboard player={humanPlayer} gameState={gameState} />
        </aside>

        {/* Right: phase panel + event feed */}
        <main className={styles.mainCol}>
          <div className={styles.phasePanel}>
            <PhasePanel
              gameState={gameState}
              humanPlayerId={humanPlayerId}
              onVote={onVote}
              onEndContractMarket={onEndContractMarket}
              onSubmitOrders={onSubmitOrders}
              finalScores={getFinalScores()}
              onNewGame={onNewGame}
              showingResolution={showingResolution}
              recentEvents={recentEvents}
              onSkipResolution={onSkipResolution}
              onAcknowledgeCrisis={onAcknowledgeCrisis}
            />
          </div>
          <div className={styles.feedWrapper}>
            <EventFeed events={events} gameState={gameState} />
          </div>
        </main>
      </div>

      {/* Bottom: hand tray */}
      <footer className={styles.handArea}>
        <HandTray hand={humanPlayer.hand} />
      </footer>
    </div>
  );
}
