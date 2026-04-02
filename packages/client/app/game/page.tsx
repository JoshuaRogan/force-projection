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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [handOpen, setHandOpen] = useState(true);

  const { gameState, humanPlayerId } = game;
  const humanPlayer = gameState.players[humanPlayerId];
  const agenda = gameState.currentAgenda?.agenda;
  const crisis = gameState.currentCrisis;
  const handCount = humanPlayer.hand.length;

  return (
    <div className={gameStyles.shell}>
      {/* Top bar: always present across all views */}
      <header className={gameStyles.topBar}>
        <span className={gameStyles.title}>Force Projection</span>

        <ViewSwitcher current={viewMode} onChange={setViewMode} />

        {/* Active card indicators — click to open modal */}
        {agenda && (
          <button
            className={gameStyles.activeCardBtn}
            onClick={() => showCard({ type: 'agenda', card: agenda })}
          >
            <span className={gameStyles.activeCardType}>Agenda</span>
            <span className={gameStyles.activeCardName}>{agenda.name}</span>
          </button>
        )}
        {crisis && (
          <button
            className={`${gameStyles.activeCardBtn} ${gameStyles.activeCardBtnCrisis}`}
            onClick={() => showCard({ type: 'crisis', card: crisis })}
          >
            <span className={gameStyles.activeCardType}>Crisis</span>
            <span className={gameStyles.activeCardName}>{crisis.name}</span>
          </button>
        )}

        {/* Panel visibility toggles — always in top bar */}
        <div className={gameStyles.panelToggles}>
          <button
            className={`${gameStyles.panelToggleBtn} ${sidebarOpen ? gameStyles.panelToggleBtnActive : ''}`}
            onClick={() => setSidebarOpen(o => !o)}
          >
            <span className={gameStyles.panelToggleDot} />
            Stats
          </button>
          <button
            className={`${gameStyles.panelToggleBtn} ${handOpen ? gameStyles.panelToggleBtnActive : ''}`}
            onClick={() => setHandOpen(o => !o)}
          >
            <span className={gameStyles.panelToggleDot} />
            Hand {handCount > 0 && `(${handCount})`}
          </button>
        </div>

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

      {/* COMMAND view */}
      {viewMode === 'command' && (
        <div className={gameStyles.commandBody}>
          <div className={gameStyles.timelineRow}>
            <PhaseTimeline gameState={gameState} />
          </div>

          <div className={gameStyles.commandMain}>
            {/* Center: orders (primary) + theater strip (secondary) */}
            <div className={gameStyles.commandCenter}>
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
              <div className={gameStyles.theaterStrip}>
                <TheaterBoard gameState={gameState} humanPlayerId={humanPlayerId} />
              </div>
            </div>

            {/* Collapsible sidebar: "You" section */}
            <div className={gameStyles.sidebarWrapper}>
              <button
                className={gameStyles.sidebarToggle}
                onClick={() => setSidebarOpen(o => !o)}
                title={sidebarOpen ? 'Hide panel' : 'Show your stats'}
              >
                <span className={gameStyles.sidebarToggleIcon}>
                  {sidebarOpen ? '◀' : '▶'}
                </span>
              </button>
              <aside className={`${gameStyles.sidebar} ${sidebarOpen ? '' : gameStyles.sidebarClosed}`}>
                <div className={gameStyles.playerDashboardArea}>
                  <PlayerDashboard player={humanPlayer} />
                </div>
                <div className={gameStyles.eventFeedWrapper}>
                  <EventFeed events={game.events} gameState={gameState} />
                </div>
              </aside>
            </div>
          </div>

          {/* Hand toggle bar — always visible */}
          <button
            className={gameStyles.handToggleBar}
            onClick={() => setHandOpen(o => !o)}
          >
            <span className={gameStyles.handToggleLabel}>
              Hand ({handCount} card{handCount !== 1 ? 's' : ''})
            </span>
            <span className={`${gameStyles.handToggleChevron} ${handOpen ? gameStyles.handToggleChevronOpen : ''}`}>
              ▲
            </span>
          </button>

          {/* Collapsible hand tray */}
          <div className={`${gameStyles.handArea} ${handOpen ? '' : gameStyles.handAreaClosed}`}>
            <HandTray hand={humanPlayer.hand} />
          </div>
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
