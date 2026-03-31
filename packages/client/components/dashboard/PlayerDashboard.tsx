import { useState } from 'react';
import type { PlayerState } from '@fp/shared';
import { DIRECTORATES } from '@fp/shared';
import { useCardModal } from '../cards/CardModalContext';
import { ResourcePanel } from './ResourcePanel';
import { PortfolioPanel } from './PortfolioPanel';
import styles from './Dashboard.module.css';

const DIRECTORATE_CSS: Record<string, string> = {
  NAVSEA: 'var(--color-navsea)', AIRCOM: 'var(--color-aircom)',
  MARFOR: 'var(--color-marfor)', SPACECY: 'var(--color-spacecy)',
  TRANSCOM: 'var(--color-transcom)',
};

function SIInfoModal({ si, onClose }: { si: number; onClose: () => void }) {
  return (
    <div className={styles.resourceInfoOverlay} onClick={onClose}>
      <div className={styles.resourceInfoPanel} onClick={e => e.stopPropagation()}>
        <div className={styles.resourceInfoHeader} style={{ borderBottom: '2px solid var(--color-si)' }}>
          <div className={styles.resourceInfoItemHeader} style={{ color: 'var(--color-si)' }}>
            <span className={styles.resourceInfoKey}>SI</span>
            <span className={styles.resourceInfoTitle}>Strategic Influence</span>
          </div>
          <button className={styles.resourceInfoClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.resourceInfoBody}>
          <div className={styles.resourceStatusRow}>
            <div className={styles.resourceStatusBlock}>
              <span className={styles.resourceStatusValue} style={{ color: 'var(--color-si)' }}>{si}</span>
              <span className={styles.resourceStatusLabel}>Your Score</span>
            </div>
          </div>
          <p className={styles.resourceInfoDesc}>
            Strategic Influence is your score. The player with the most SI at the end of the game wins.
          </p>
          <div className={styles.resourceInfoUsedBlock}>
            <span className={styles.resourceInfoUsedLabel}>How to earn SI</span>
            <div className={styles.siEarnList}>
              <div className={styles.siEarnItem}>
                <span className={styles.siEarnIcon}>&#9654;</span>
                <span><strong>Theater Control</strong> — Lead theaters at year end to earn SI based on rank (1st, 2nd, 3rd).</span>
              </div>
              <div className={styles.siEarnItem}>
                <span className={styles.siEarnIcon}>&#9654;</span>
                <span><strong>Contracts</strong> — Complete active defense contracts for a direct SI reward.</span>
              </div>
              <div className={styles.siEarnItem}>
                <span className={styles.siEarnIcon}>&#9654;</span>
                <span><strong>Programs</strong> — Some active programs generate SI each year if conditions are met (readiness, base count, theater lead).</span>
              </div>
              <div className={styles.siEarnItem}>
                <span className={styles.siEarnIcon}>&#9654;</span>
                <span><strong>Congress</strong> — Winning agenda votes and passing favorable legislation can grant SI bonuses.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PlayerDashboard({ player }: { player: PlayerState }) {
  const { showCard } = useCardModal();
  const [showSIInfo, setShowSIInfo] = useState(false);
  const dir = DIRECTORATES[player.directorate];
  const readinessPct = Math.min(100, Math.max(0, player.readiness * 10));
  const readinessColor = player.readiness >= 7 ? 'var(--color-success)'
    : player.readiness >= 4 ? 'var(--color-warning)' : 'var(--color-danger)';

  return (
    <div className={styles.dashboard}>
      {showSIInfo && <SIInfoModal si={player.si} onClose={() => setShowSIInfo(false)} />}

      {/* Header */}
      <div className={styles.playerHeader}>
        <div className={styles.playerInfo}>
          <div className={styles.playerName} style={{ color: DIRECTORATE_CSS[player.directorate] }}>
            {player.name}
          </div>
          <div className={styles.directorate}>{dir.name}</div>
        </div>
        <button className={styles.siBadge} onClick={() => setShowSIInfo(true)} title="Strategic Influence — your score">
          <span className={styles.siValue}>{player.si}</span>
          <span className={styles.siLabel}>Score</span>
        </button>
      </div>

      {/* Readiness */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Readiness</div>
        <div className={styles.readinessBar}>
          <span className={styles.readinessValue} style={{ color: readinessColor }}>{player.readiness}</span>
          <div className={styles.readinessTrack}>
            <div className={styles.readinessFill} style={{ width: `${readinessPct}%`, background: readinessColor }} />
          </div>
        </div>
      </div>

      {/* Resources */}
      <ResourcePanel resources={player.resources} />

      {/* Active Contracts */}
      {player.contracts.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Contracts — click to view</div>
          {player.contracts.map(ac => (
            <div
              key={ac.card.id}
              className={`${styles.contractCard} ${styles.contractCardClickable}`}
              onClick={() => showCard({ type: 'contract', card: ac.card })}
            >
              <div className={styles.contractHeader}>
                <span className={styles.contractName}>{ac.card.name}</span>
                <span className={styles.contractReward}>+{ac.card.rewardSI} SI</span>
              </div>
              <div className={styles.contractReqs}>
                {ac.card.requirements.map((req, i) => (
                  <div key={i} className={styles.contractReq}>&#x2022; {req.description}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Portfolio */}
      <PortfolioPanel portfolio={player.portfolio} />
    </div>
  );
}
