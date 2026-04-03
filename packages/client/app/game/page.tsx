'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useGameController } from '@/components/game/useGameController';
import { useServerGameController } from '@/components/game/useServerGameController';
import { PlayerDashboard, HandTray } from '@/components/dashboard';
import { TheaterBoard } from '@/components/theater';
import { PhasePanel } from '@/components/game/PhasePanel';
import { ProgramDrawReveal } from '@/components/game/ProgramDrawReveal';
import { PhaseTimeline } from '@/components/game/PhaseTimeline';
import { EventFeed } from '@/components/game/EventFeed';
import { CardModalProvider, useCardModal } from '@/components/cards';
import { DIRECTORATES } from '@fp/shared';
import { ViewSwitcher, PersonalView, MapView } from '@/components/views';
import type { ViewMode } from '@/components/views';
import gameStyles from './game.module.css';

const INACTIVITY_TIMEOUT_MS = 2 * 60 * 1000;

export default function GamePage() {
  return (
    <Suspense fallback={
      <div className={gameStyles.shell}>
        <header className={gameStyles.topBar}>
          <span className={gameStyles.title}>Force Projection: Joint Command</span>
        </header>
      </div>
    }>
      <GamePageInner />
    </Suspense>
  );
}

function GamePageInner() {
  const searchParams = useSearchParams();
  const gameId = searchParams.get('gameId');
  const playerId = searchParams.get('player');
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

  if (gameId && playerId) {
    return (
      <CardModalProvider>
        <ServerGameBoard gameId={gameId} playerId={playerId} />
      </CardModalProvider>
    );
  }

  return (
    <CardModalProvider>
      <GameBoard seed={seedRef.current!} />
    </CardModalProvider>
  );
}

function ServerGameBoard({ gameId, playerId }: { gameId: string; playerId: string }) {
  const [pollingActive, setPollingActive] = useState(true);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingActiveRef = useRef(true);

  const resetIdleTimer = useCallback(() => {
    if (!pollingActiveRef.current) return;
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      pollingActiveRef.current = false;
      setPollingActive(false);
    }, INACTIVITY_TIMEOUT_MS);
  }, []);

  const resumePolling = useCallback(() => {
    pollingActiveRef.current = true;
    setPollingActive(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      pollingActiveRef.current = false;
      setPollingActive(false);
    }, INACTIVITY_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart', 'focus'];
    const onActivity = () => resetIdleTimer();

    resetIdleTimer();
    for (const eventName of events) {
      window.addEventListener(eventName, onActivity);
    }

    return () => {
      for (const eventName of events) {
        window.removeEventListener(eventName, onActivity);
      }
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleTimer]);

  const game = useServerGameController(gameId, playerId, pollingActive);
  if (!game.gameState) {
    return (
      <div className={gameStyles.shell}>
        <header className={gameStyles.topBar}>
          <span className={gameStyles.title}>Force Projection: Joint Command</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            LOADING MISSION…
          </span>
        </header>
      </div>
    );
  }
  return (
    <>
      <GameBoardInner game={game} gameId={gameId} />
      {!pollingActive && (
        <div className={gameStyles.inactiveOverlay} role="dialog" aria-modal="true" aria-labelledby="inactive-session-title">
          <div className={gameStyles.inactiveModal}>
            <h2 id="inactive-session-title" className={gameStyles.inactiveTitle}>Session paused</h2>
            <p className={gameStyles.inactiveCopy}>
              Polling stopped after inactivity to reduce backend requests.
            </p>
            <button type="button" className={gameStyles.inactiveResumeBtn} onClick={resumePolling}>
              Resume session
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function GameBoard({ seed }: { seed: number }) {
  const game = useGameController(seed);
  return <GameBoardInner game={game} />;
}

function GameBoardInner({ game, gameId }: { game: ReturnType<typeof useGameController>; gameId?: string }) {
  const { showCard } = useCardModal();
  const [viewMode, setViewMode] = useState<ViewMode>('command');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [handOpen, setHandOpen] = useState(true);
  const [opponentProfileId, setOpponentProfileId] = useState<string | null>(null);
  const shownIntroRef = useRef(false);

  const { gameState, humanPlayerId } = game;
  const humanPlayer = gameState.players[humanPlayerId];

  // Show directorate info on game start
  useEffect(() => {
    if (!shownIntroRef.current) {
      shownIntroRef.current = true;
      const dir = DIRECTORATES[humanPlayer.directorate];
      if (dir) showCard({ type: 'directorate', directorate: dir, intro: true });
    }
  }, [humanPlayer.directorate, showCard]);
  const agenda = gameState.currentAgenda?.agenda;
  const crisis = gameState.currentCrisis;
  const handCount = humanPlayer.hand.length;

  return (
    <div className={gameStyles.shell}>
      <ProgramDrawReveal gameState={gameState} humanPlayerId={humanPlayerId} />
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

        {/* spacer to push right section */}
        <div style={{ flex: 1 }} />

        <div className={gameStyles.topBarRight}>
          {gameState.turnOrder
            .filter(pid => pid !== humanPlayerId)
            .map(pid => {
              const p = gameState.players[pid];
              return (
                <button
                  key={pid}
                  type="button"
                  className={gameStyles.opponentChipBtn}
                  onClick={() => setOpponentProfileId(pid)}
                  title={`View public stats: ${p.name}`}
                >
                  <span>{p.name}</span>
                  <span className={gameStyles.opponentDir}>{p.directorate}</span>
                  <span className={gameStyles.opponentSI}>{p.si}</span>
                </button>
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
                  gameId={gameId}
                  onVote={game.submitVote}
                  onEndContractMarket={game.endContractMarket}
                  onSubmitOrders={game.submitOrders}
                  onUseNavseaAbility={game.useNavseaAbility}
                  onUseTranscomAbility={game.useTranscomAbility}
                  onUseSpacecyAbility={game.useSpacecyAbility}
                  onBuryPeekedCrisis={game.buryPeekedCrisis}
                  onSubmitContractChoice={game.submitContractChoice}
                  onSubmitHandDiscard={game.submitHandDiscard}
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
                  <PlayerDashboard player={humanPlayer} gameState={gameState} />
                </div>
                <div className={gameStyles.eventFeedWrapper}>
                  <EventFeed events={game.events} gameState={gameState} />
                </div>
              </aside>
            </div>
          </div>

          {/* Hand dock: one overlay; bar is the top edge; whole block slides up when open */}
          <div
            id="game-hand-panel"
            className={`${gameStyles.handDock} ${handOpen ? '' : gameStyles.handDockCollapsed}`}
            role="region"
            aria-label="Your hand"
          >
            <button
              type="button"
              className={gameStyles.handDockBar}
              onClick={() => setHandOpen(o => !o)}
              aria-expanded={handOpen}
              aria-controls="game-hand-panel-body"
            >
              <span className={gameStyles.handDockBarLabel}>
                Hand ({handCount} card{handCount !== 1 ? 's' : ''})
              </span>
              <span
                className={`${gameStyles.handDockBarChevron} ${handOpen ? gameStyles.handDockBarChevronOpen : ''}`}
                aria-hidden
              >
                ▲
              </span>
            </button>
            <div
              id="game-hand-panel-body"
              className={gameStyles.handDockBody}
              aria-hidden={!handOpen}
            >
              <HandTray hand={humanPlayer.hand} />
            </div>
          </div>
        </div>
      )}

      {/* PERSONAL view: player stats + phase panel + hand, no theater */}
      {viewMode === 'personal' && (
        <PersonalView
          gameState={gameState}
          humanPlayerId={humanPlayerId}
          gameId={gameId}
          humanPlayer={humanPlayer}
          recentEvents={game.recentEvents}
          showingResolution={game.showingResolution}
          onVote={game.submitVote}
          onEndContractMarket={game.endContractMarket}
          onSubmitOrders={game.submitOrders}
          onUseNavseaAbility={game.useNavseaAbility}
          onUseTranscomAbility={game.useTranscomAbility}
          onUseSpacecyAbility={game.useSpacecyAbility}
          onBuryPeekedCrisis={game.buryPeekedCrisis}
          getFinalScores={game.getFinalScores}
          onNewGame={game.newGame}
          onSkipResolution={game.skipResolution}
          onAcknowledgeCrisis={game.acknowledgeCrisis}
          onSubmitContractChoice={game.submitContractChoice}
          onSubmitHandDiscard={game.submitHandDiscard}
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

      {opponentProfileId && gameState.players[opponentProfileId] && (
        <div
          className={gameStyles.opponentStatsOverlay}
          onClick={() => setOpponentProfileId(null)}
          role="presentation"
        >
          <div
            className={gameStyles.opponentStatsPanel}
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Public stats: ${gameState.players[opponentProfileId].name}`}
          >
            <div className={gameStyles.opponentStatsToolbar}>
              <span className={gameStyles.opponentStatsToolbarLabel}>Public record</span>
              <button
                type="button"
                className={gameStyles.opponentStatsClose}
                onClick={() => setOpponentProfileId(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className={gameStyles.opponentStatsScroll}>
              <PlayerDashboard
                player={gameState.players[opponentProfileId]}
                gameState={gameState}
                visibility="public"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
