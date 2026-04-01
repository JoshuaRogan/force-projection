'use client';

import { useState, useRef, useEffect } from 'react';
import { useGameController } from '@/components/game/useGameController';
import { PlayerDashboard, HandTray } from '@/components/dashboard';
import { TheaterBoard } from '@/components/theater';
import { PhasePanel } from '@/components/game/PhasePanel';
import { PhaseTimeline } from '@/components/game/PhaseTimeline';
import { EventFeed } from '@/components/game/EventFeed';
import { CardModalProvider, useCardModal } from '@/components/cards';
import { ViewSwitcher, PersonalView, MapView } from '@/components/views';
import type { ViewMode } from '@/components/views';
import gameStyles from './game.module.css';

export default function GamePage() {
  const seedRef = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    seedRef.current = Date.now();
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={gameStyles.shell}>
        <header className={gameStyles.topBar}>
          <span className={gameStyles.title}>Force Projection: Joint Command</span>
        </header>
      </div>
    );
  }

  return (
    <CardModalProvider>
      <GameBoard seed={seedRef.current!} />
    </CardModalProvider>
  );
}

function GameBoard({ seed }: { seed: number }) {
  const game = useGameController(seed);
  const { showCard } = useCardModal();
  const [viewMode, setViewMode] = useState<ViewMode>('command');

  const { gameState, humanPlayerId } = game;
  const humanPlayer = gameState.players[humanPlayerId];
  const agenda = gameState.currentAgenda?.agenda;

  return (
    <div className={gameStyles.shell}>
      {/* Top bar: always present across all views */}
      <header className={gameStyles.topBar}>
        <span className={gameStyles.title}>Force Projection</span>

        <ViewSwitcher current={viewMode} onChange={setViewMode} />

        {agenda && (
          <button
            onClick={() => showCard({ type: 'agenda', card: agenda })}
            className={gameStyles.agendaBtn}
            title="View current congressional agenda"
          >
            Agenda: {agenda.name}
          </button>
        )}
        <div className={gameStyles.topBarRight}>
          {gameState.turnOrder
            .filter(pid => pid !== humanPlayerId)
            .map(pid => {
              const p = gameState.players[pid];
              return (
                <div key={pid} className={gameStyles.opponentChip}>
                  <span>{p.name}</span>
                  <span className={gameStyles.opponentDir}>{p.directorate}</span>
                  <span className={gameStyles.opponentSI}>{p.si}</span>
                </div>
              );
            })}
          <button onClick={game.newGame} className={gameStyles.newGameBtn}>New Game</button>
        </div>
      </header>

      {/* COMMAND view: existing unified layout */}
      {viewMode === 'command' && (
        <div className={gameStyles.commandGrid}>
          <div className={gameStyles.timelineRow}>
            <PhaseTimeline gameState={gameState} />
          </div>

          <main className={gameStyles.center}>
            <div className={gameStyles.phasePanel}>
              <PhasePanel
                gameState={gameState}
                humanPlayerId={humanPlayerId}
                onVote={game.submitVote}
                onEndContractMarket={game.endContractMarket}
                onSubmitOrders={game.submitOrders}
                finalScores={game.getFinalScores()}
                onNewGame={game.newGame}
                showingResolution={game.showingResolution}
                recentEvents={game.recentEvents}
                onSkipResolution={game.skipResolution}
                onAcknowledgeCrisis={game.acknowledgeCrisis}
              />
            </div>
            <TheaterBoard gameState={gameState} humanPlayerId={humanPlayerId} />
          </main>

          <aside className={gameStyles.sidebar}>
            <div className={gameStyles.playerDashboardArea}>
              <PlayerDashboard player={humanPlayer} />
            </div>
            <div className={gameStyles.eventFeedWrapper}>
              <EventFeed events={game.events} gameState={gameState} />
            </div>
          </aside>

          <footer className={gameStyles.handArea}>
            <HandTray hand={humanPlayer.hand} />
          </footer>
        </div>
      )}

      {/* PERSONAL view: player stats + phase panel + hand, no theater */}
      {viewMode === 'personal' && (
        <PersonalView
          gameState={gameState}
          humanPlayerId={humanPlayerId}
          humanPlayer={humanPlayer}
          events={game.events}
          recentEvents={game.recentEvents}
          showingResolution={game.showingResolution}
          onVote={game.submitVote}
          onEndContractMarket={game.endContractMarket}
          onSubmitOrders={game.submitOrders}
          getFinalScores={game.getFinalScores}
          onNewGame={game.newGame}
          onSkipResolution={game.skipResolution}
          onAcknowledgeCrisis={game.acknowledgeCrisis}
        />
      )}

      {/* STRATEGIC view: world map + public info */}
      {viewMode === 'strategic' && (
        <MapView
          gameState={gameState}
          humanPlayerId={humanPlayerId}
          events={game.events}
        />
      )}
    </div>
  );
}
