import type { Portfolio, PlayerState, GameState } from '@fp/shared';
import { hasSIBonus } from '@fp/shared';
import { SubtagIcon } from '../icons';
import { useCardModal } from '../cards/CardModalContext';
import { evaluateSustainStatus } from '../../utils/sustainStatus';
import styles from './Dashboard.module.css';

const DOMAIN_COLORS: Record<string, string> = {
  AIR: 'var(--color-domain-air)', SEA: 'var(--color-domain-sea)',
  EXP: 'var(--color-domain-exp)', SPACE_CYBER: 'var(--color-domain-space-cyber)',
};

export type PortfolioVisibility = 'full' | 'public';

export function PortfolioPanel({
  portfolio,
  player,
  gameState,
  visibility = 'full',
  /** When true (self view only), active + pipeline are omitted — shown elsewhere (e.g. personal view hero). */
  hideActiveAndPipeline = false,
}: {
  portfolio: Portfolio;
  player?: PlayerState;
  gameState?: GameState;
  visibility?: PortfolioVisibility;
  hideActiveAndPipeline?: boolean;
}) {
  const { showCard } = useCardModal();
  const showPipelineAndMothballed = visibility === 'full';
  const omitPrograms = hideActiveAndPipeline && visibility === 'full';

  if (omitPrograms && portfolio.mothballed.length === 0) {
    return null;
  }

  return (
    <div className={styles.section}>
      {!omitPrograms && (
        <>
          <div className={styles.sectionTitle}>Active Programs</div>
          <div className={styles.portfolioGrid}>
            {portfolio.active.map((slot, i) => (
          <div
            key={i}
            className={`${styles.portfolioSlot} ${slot ? styles.portfolioSlotFilled : ''} ${slot ? styles.portfolioSlotClickable : ''}`}
            style={slot ? { borderColor: DOMAIN_COLORS[slot.card.domain] } : undefined}
            onClick={slot ? () => showCard({
              type: 'program',
              card: slot.card,
              sustainStatus: player && gameState ? evaluateSustainStatus(slot, player, gameState) : undefined,
            }) : undefined}
          >
            {slot ? (
              <>
                <span
                  className={styles.slotName}
                  style={hasSIBonus(slot.card) ? { color: 'var(--color-si)', fontWeight: 700 } : undefined}
                >
                  {slot.card.name}{hasSIBonus(slot.card) && <span style={{ marginLeft: 3, fontSize: '0.8em' }}>★</span>}
                </span>
                <span className={styles.slotDomain}>{slot.card.domain}</span>
                {slot.card.subtags.length > 0 && (
                  <div className={styles.slotSubtags}>
                    {slot.card.subtags.map(tag => (
                      <SubtagIcon key={tag} subtag={tag} size={10} className={styles.slotSubtagIcon} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              'Empty'
            )}
          </div>
        ))}
          </div>
        </>
      )}

      {visibility === 'public' && (
        <>
          <div className={styles.sectionTitle}>Pipeline</div>
          <div className={styles.privatePlaceholder}>
            <div className={styles.privatePlaceholderStrip}>
              <span className={styles.privatePlaceholderGlyph} aria-hidden>◆</span>
              <span className={styles.privatePlaceholderLabel}>Restricted — not disclosed</span>
            </div>
            <p className={styles.privatePlaceholderDesc}>
              Programs still in the pipeline are private until they activate.
            </p>
          </div>
        </>
      )}

      {showPipelineAndMothballed && !omitPrograms && (
        <>
          <div className={styles.sectionTitle}>Pipeline</div>
          <div className={styles.portfolioGrid}>
            {portfolio.pipeline.map((slot, i) => (
              <div
                key={i}
                className={`${styles.portfolioSlot} ${slot ? styles.portfolioSlotFilled : ''} ${slot ? styles.portfolioSlotClickable : ''}`}
                style={slot ? { borderColor: DOMAIN_COLORS[slot.card.domain] } : undefined}
                onClick={slot ? () => showCard({ type: 'program', card: slot.card }) : undefined}
              >
                {slot ? (
                  <>
                    <span
                      className={styles.slotName}
                      style={hasSIBonus(slot.card) ? { color: 'var(--color-si)', fontWeight: 700 } : undefined}
                    >
                      {slot.card.name}{hasSIBonus(slot.card) && <span style={{ marginLeft: 3, fontSize: '0.8em' }}>★</span>}
                    </span>
                    <span className={styles.slotDomain}>Year {slot.yearsInPipeline ?? 0}</span>
                  </>
                ) : (
                  'Empty'
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {showPipelineAndMothballed && portfolio.mothballed.length > 0 && (
        <>
          <div className={styles.sectionTitle}>Mothballed ({portfolio.mothballed.length})</div>
          <div className={styles.portfolioGrid}>
            {portfolio.mothballed.map(card => (
              <div
                key={card.id}
                className={`${styles.portfolioSlot} ${styles.portfolioSlotFilled} ${styles.portfolioSlotClickable}`}
                style={{ opacity: 0.6 }}
                onClick={() => showCard({ type: 'program', card })}
              >
                <span
                  className={styles.slotName}
                  style={hasSIBonus(card) ? { color: 'var(--color-si)', fontWeight: 700 } : undefined}
                >
                  {card.name}{hasSIBonus(card) && <span style={{ marginLeft: 3, fontSize: '0.8em' }}>★</span>}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
