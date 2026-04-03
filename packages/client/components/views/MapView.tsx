'use client';

import type { GameState, GameEvent, DirectorateId, AgendaCard, CrisisCard, AgendaVoteState } from '@fp/shared';
import { PhaseTimeline } from '@/components/game/PhaseTimeline';
import { EventFeed } from '@/components/game/EventFeed';
import { useCardModal } from '@/components/cards';
import { colorizeDesc } from '@/utils/colorizeDesc';
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

// ── Phase status ─────────────────────────────────────────────────────────────

function PhaseStatus({ gameState }: { gameState: GameState }) {
  const phase = gameState.phase;
  let label = '';
  let sub = '';

  if (phase.type === 'congress') { label = 'Congress'; sub = 'Budget vote in progress'; }
  else if (phase.type === 'contractMarket') { label = 'Contract Market'; sub = 'Players selecting contracts'; }
  else if (phase.type === 'quarter') {
    const qn = phase.quarter;
    if (phase.step === 'crisisPulse') { label = `Q${qn} — Crisis`; sub = 'Crisis response phase'; }
    else if (phase.step === 'planOrders') { label = `Q${qn} — Orders`; sub = 'Players planning orders'; }
    else if (phase.step === 'resolveOrders') { label = `Q${qn} — Resolution`; sub = 'Resolving orders'; }
    else if (phase.step === 'contractChoice') { label = `Q${qn} — Contracting`; sub = 'Choosing a contract'; }
    else if (phase.step === 'handDiscard') { label = `Q${qn} — Discard`; sub = 'Trimming hand to limit'; }
    else { label = `Q${qn} — Cleanup`; sub = 'End-of-quarter cleanup'; }
  }
  else if (phase.type === 'yearEnd') { label = 'Year End'; sub = 'Annual scoring'; }
  else if (phase.type === 'gameEnd') { label = 'Game Over'; sub = 'Final scores calculated'; }

  return (
    <div className={styles.phaseStatus}>
      <div className={styles.phaseRow}>
        <span className={styles.phaseLabel}>FY{gameState.fiscalYear}</span>
        <span className={styles.phaseName}>{label}</span>
      </div>
      <span className={styles.phaseSub}>{sub}</span>
    </div>
  );
}

// ── Agenda panel ─────────────────────────────────────────────────────────────

function AgendaPanel({ agendaState, onView }: {
  agendaState: AgendaVoteState;
  onView: () => void;
}) {
  const { agenda, commitments, resolved, passed } = agendaState;

  let totalSupport = 0;
  let totalOppose = 0;
  for (const c of Object.values(commitments)) {
    if (c.support) totalSupport += c.amount;
    else totalOppose += c.amount;
  }
  const totalVotes = totalSupport + totalOppose;
  const supportPct = totalVotes > 0 ? (totalSupport / totalVotes) * 100 : 50;

  return (
    <div className={`${styles.agendaPanel} ${resolved ? (passed ? styles.agendaPassed : styles.agendaFailed) : ''}`}>
      <div className={styles.agendaPanelHeader}>
        <div className={styles.agendaMeta}>
          <span className={styles.sectionLabel}>ACTIVE AGENDA</span>
          {resolved && (
            <span className={`${styles.agendaResultBadge} ${passed ? styles.badgePassed : styles.badgeFailed}`}>
              {passed ? 'PASSED' : 'FAILED'}
            </span>
          )}
        </div>
        <button className={styles.agendaViewBtn} onClick={onView}>full card →</button>
      </div>
      <div className={styles.agendaName}>{agenda.name}</div>
      <p className={styles.agendaDesc}>{colorizeDesc(agenda.description)}</p>
      {totalVotes > 0 && (
        <div className={styles.voteBlock}>
          <div className={styles.voteBar}>
            <div className={styles.voteBarSupport} style={{ width: `${supportPct}%` }} />
          </div>
          <div className={styles.voteNumbers}>
            <span className={styles.voteSupport}>{totalSupport} support</span>
            <span className={styles.voteOppose}>{totalOppose} oppose</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Crisis panel ─────────────────────────────────────────────────────────────

function CrisisPanel({ crisis, onView }: { crisis: CrisisCard; onView: () => void }) {
  return (
    <div className={styles.crisisPanel}>
      <div className={styles.crisisPanelHeader}>
        <span className={styles.sectionLabel}>ACTIVE CRISIS</span>
        <button className={styles.agendaViewBtn} onClick={onView}>full card →</button>
      </div>
      <div className={styles.crisisName}>{crisis.name}</div>
      <p className={styles.crisisRule}>{crisis.immediateRule}</p>
      {crisis.responseDescription && (
        <div className={styles.crisisResponse}>
          <span className={styles.crisisResponseLabel}>Response</span>
          <p>{crisis.responseDescription}</p>
        </div>
      )}
    </div>
  );
}

// ── Posture strip ─────────────────────────────────────────────────────────────

function PostureStrip({ gameState }: { gameState: GameState }) {
  const p = gameState.nationalPosture;
  return (
    <div className={styles.postureStrip}>
      <div className={styles.postureItem}>
        <span className={styles.postureVal}>{p.coverage}</span>
        <span className={styles.postureKey}>COVERAGE</span>
      </div>
      <div className={styles.postureDivider} />
      <div className={styles.postureItem}>
        <span className={styles.postureVal}>{p.readiness}</span>
        <span className={styles.postureKey}>READINESS</span>
      </div>
      <div className={styles.postureDivider} />
      <div className={styles.postureItem}>
        <span className={styles.postureVal}>{p.techEdge}</span>
        <span className={styles.postureKey}>TECH EDGE</span>
      </div>
    </div>
  );
}

// ── Score board ──────────────────────────────────────────────────────────────

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
              <span className={styles.scoreName}>{p.name}{isHuman ? ' ★' : ''}</span>
              <span className={styles.scoreDir}>{p.directorate}</span>
            </div>
            <span className={styles.scoreValue}>{p.si}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main view ────────────────────────────────────────────────────────────────

export function MapView({ gameState, humanPlayerId, events }: MapViewProps) {
  const { showCard } = useCardModal();
  const agendaState = gameState.currentAgenda;
  const crisis = gameState.currentCrisis;

  return (
    <div className={styles.layout}>
      <div className={styles.timelineRow}>
        <PhaseTimeline gameState={gameState} />
      </div>

      <div className={styles.body}>
        <aside className={styles.infoPanel}>
          <PhaseStatus gameState={gameState} />

          <PostureStrip gameState={gameState} />

          {agendaState && (
            <AgendaPanel
              agendaState={agendaState}
              onView={() => showCard({ type: 'agenda', card: agendaState.agenda })}
            />
          )}

          {crisis && (
            <CrisisPanel
              crisis={crisis}
              onView={() => showCard({ type: 'crisis', card: crisis })}
            />
          )}

          <ScoreBoard gameState={gameState} humanPlayerId={humanPlayerId} />

          <div className={styles.feedBlock}>
            <EventFeed events={events} gameState={gameState} />
          </div>
        </aside>

        <div className={styles.mapCanvas}>
          <WorldMap gameState={gameState} humanPlayerId={humanPlayerId} />
        </div>
      </div>
    </div>
  );
}
