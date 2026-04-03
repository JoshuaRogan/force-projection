import { useState } from 'react';
import type { PlayerState, GameState } from '@fp/shared';
import { DIRECTORATES } from '@fp/shared';
import { useCardModal } from '../cards/CardModalContext';
import { colorizeDesc } from '../../utils/colorizeDesc';
import { ResourcePanel } from './ResourcePanel';
import { PortfolioPanel } from './PortfolioPanel';
import styles from './Dashboard.module.css';

const DIRECTORATE_CSS: Record<string, string> = {
  NAVSEA: 'var(--color-navsea)', AIRCOM: 'var(--color-aircom)',
  MARFOR: 'var(--color-marfor)', SPACECY: 'var(--color-spacecy)',
  TRANSCOM: 'var(--color-transcom)',
};

function SIInfoModal({ si, onClose, audience = 'self' }: { si: number; onClose: () => void; audience?: 'self' | 'other' }) {
  const scoreLabel = audience === 'self' ? 'Your Score' : 'Strategic Influence';
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
              <span className={styles.resourceStatusLabel}>{scoreLabel}</span>
            </div>
          </div>
          <p className={styles.resourceInfoDesc}>
            {audience === 'self'
              ? 'Strategic Influence is your score. The player with the most SI at the end of the game wins.'
              : 'Strategic Influence is the player’s score toward winning. The highest SI at game end wins.'}
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

export type PlayerDashboardVisibility = 'self' | 'public';

/** `mothballed-only`: active + pipeline omitted (shown in personal view hero). */
export type PortfolioSidebarMode = 'full' | 'mothballed-only';

export function PlayerDashboard({
  player,
  gameState,
  visibility = 'self',
  portfolioSidebarMode = 'full',
}: {
  player: PlayerState;
  gameState?: GameState;
  visibility?: PlayerDashboardVisibility;
  portfolioSidebarMode?: PortfolioSidebarMode;
}) {
  const { showCard } = useCardModal();
  const [showSIInfo, setShowSIInfo] = useState(false);
  const dir = DIRECTORATES[player.directorate];
  const readinessPct = Math.min(100, Math.max(0, player.readiness * 10));
  const readinessColor = player.readiness >= 7 ? 'var(--color-success)'
    : player.readiness >= 4 ? 'var(--color-warning)' : 'var(--color-danger)';
  const isPublic = visibility === 'public';
  const siAudience = isPublic ? 'other' : 'self';

  return (
    <div className={styles.dashboard}>
      {showSIInfo && (
        <SIInfoModal si={player.si} onClose={() => setShowSIInfo(false)} audience={siAudience} />
      )}

      {/* Header */}
      <div className={styles.playerHeader}>
        <div className={styles.playerInfo}>
          <div className={styles.playerName} style={{ color: DIRECTORATE_CSS[player.directorate] }}>
            {player.name}
          </div>
          <button
            className={styles.directorateBtn}
            style={{ color: DIRECTORATE_CSS[player.directorate] }}
            onClick={() => showCard({ type: 'directorate', directorate: dir })}
            title={`View ${dir.name} abilities`}
          >
            {dir.name} ·  {dir.subtitle}
          </button>
        </div>
        <button
          className={styles.siBadge}
          onClick={() => setShowSIInfo(true)}
          title={isPublic ? 'Strategic Influence — their score' : 'Strategic Influence — your score'}
        >
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

      {/* Contracts */}
      {isPublic ? (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Contracts</div>
          <div className={styles.privatePlaceholder}>
            <div className={styles.privatePlaceholderStrip}>
              <span className={styles.privatePlaceholderGlyph} aria-hidden>◆</span>
              <span className={styles.privatePlaceholderLabel}>Withheld — commander only</span>
            </div>
            <p className={styles.privatePlaceholderDesc}>
              Active defense contracts are not shown on other players’ dossiers.
            </p>
          </div>
        </div>
      ) : (
        player.contracts.length > 0 && (
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
                    <div key={i} className={styles.contractReq}>&#x2022; {colorizeDesc(req.description)}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Portfolio */}
      <PortfolioPanel
        portfolio={player.portfolio}
        player={player}
        gameState={gameState}
        visibility={isPublic ? 'public' : 'full'}
        hideActiveAndPipeline={!isPublic && portfolioSidebarMode === 'mothballed-only'}
      />
    </div>
  );
}
