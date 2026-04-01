'use client';

import type { GameState, GameEvent, DirectorateId } from '@fp/shared';
import { PhaseTimeline } from '@/components/game/PhaseTimeline';
import { EventFeed } from '@/components/game/EventFeed';
import { useCardModal } from '@/components/cards';
import { WorldMap } from './WorldMap';
import styles from './MapView.module.css';

const DIR_COLOR: Record<DirectorateId, string> = {
  NAVSEA: 'var(--color-navsea)',
  AIRCOM: 'var(--color-aircom)',
  MARFOR: 'var(--color-marfor)',
  SPACECY: 'var(--color-spacecy)',
  TRANSCOM: 'var(--color-transcom)',
};

interface MapViewProps {
  gameState: GameState;
  humanPlayerId: string;
  events: GameEvent[];
}

function PhaseStatus({ gameState }: { gameState: GameState }) {
  const phase = gameState.phase;
  let label = '';
  let sub = '';

  if (phase.type === 'congress') { label = 'Congress'; sub = 'Voting on agenda'; }
  else if (phase.type === 'contractMarket') { label = 'Contracts'; sub = 'Selecting contracts'; }
  else if (phase.type === 'quarter') {
    const qn = phase.quarter;
    if (phase.step === 'crisisPulse') { label = `Q${qn} Crisis`; sub = 'Crisis response'; }
    else if (phase.step === 'planOrders') { label = `Q${qn} Orders`; sub = 'Planning orders'; }
    else if (phase.step === 'resolveOrders') { label = `Q${qn} Resolve`; sub = 'Processing'; }
    else { label = `Q${qn} Cleanup`; sub = 'Cleanup phase'; }
  }
  else if (phase.type === 'yearEnd') { label = 'Year End'; sub = 'Scoring'; }
  else if (phase.type === 'gameEnd') { label = 'Game Over'; sub = 'Final scores'; }

  return (
    <div className={styles.phaseStatus}>
      <span className={styles.phaseLabel}>PHASE</span>
      <span className={styles.phaseName}>{label}</span>
      <span className={styles.phaseSub}>{sub}</span>
    </div>
  );
}

function ScoreBoard({ gameState, humanPlayerId }: { gameState: GameState; humanPlayerId: string }) {
  const sorted = [...gameState.turnOrder].sort(
    (a, b) => gameState.players[b].si - gameState.players[a].si
  );

  return (
    <div className={styles.scoreBoard}>
      <div className={styles.sectionLabel}>INFLUENCE INDEX</div>
      {sorted.map((pid, i) => {
        const p = gameState.players[pid];
        const isHuman = pid === humanPlayerId;
        return (
          <div
            key={pid}
            className={`${styles.scoreRow} ${isHuman ? styles.humanRow : ''}`}
            style={{ '--dir-color': DIR_COLOR[p.directorate as DirectorateId] } as React.CSSProperties}
          >
            <span className={styles.scoreRank}>{i + 1}</span>
            <div className={styles.scoreInfo}>
              <span className={styles.scoreName}>{p.name}</span>
              <span className={styles.scoreDir}>{p.directorate}</span>
            </div>
            <span className={styles.scoreValue}>{p.si}</span>
          </div>
        );
      })}
    </div>
  );
}

export function MapView({ gameState, humanPlayerId, events }: MapViewProps) {
  const { showCard } = useCardModal();
  const agenda = gameState.currentAgenda?.agenda;

  return (
    <div className={styles.layout}>
      {/* Timeline row — full width */}
      <div className={styles.timelineRow}>
        <PhaseTimeline gameState={gameState} />
      </div>

      {/* Body: sidebar + map */}
      <div className={styles.body}>
        {/* Left info panel */}
        <aside className={styles.infoPanel}>
          <PhaseStatus gameState={gameState} />

          {agenda && (
            <div className={styles.agendaBlock}>
              <div className={styles.sectionLabel}>ACTIVE AGENDA</div>
              <button
                className={styles.agendaBtn}
                onClick={() => showCard({ type: 'agenda', card: agenda })}
              >
                <span className={styles.agendaBtnName}>{agenda.name}</span>
                <span className={styles.agendaBtnHint}>view →</span>
              </button>
            </div>
          )}

          <ScoreBoard gameState={gameState} humanPlayerId={humanPlayerId} />

          <div className={styles.feedBlock}>
            <EventFeed events={events} gameState={gameState} />
          </div>
        </aside>

        {/* Map canvas */}
        <div className={styles.mapCanvas}>
          <WorldMap gameState={gameState} humanPlayerId={humanPlayerId} />
        </div>
      </div>
    </div>
  );
}
