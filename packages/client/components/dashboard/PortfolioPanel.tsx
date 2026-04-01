import type { Portfolio } from '@fp/shared';
import { SubtagIcon } from '../icons';
import { useCardModal } from '../cards/CardModalContext';
import styles from './Dashboard.module.css';

const DOMAIN_COLORS: Record<string, string> = {
  AIR: 'var(--color-domain-air)', SEA: 'var(--color-domain-sea)',
  EXP: 'var(--color-domain-exp)', SPACE_CYBER: 'var(--color-domain-space-cyber)',
};

export function PortfolioPanel({ portfolio }: { portfolio: Portfolio }) {
  const { showCard } = useCardModal();

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Active Programs</div>
      <div className={styles.portfolioGrid}>
        {portfolio.active.map((slot, i) => (
          <div
            key={i}
            className={`${styles.portfolioSlot} ${slot ? styles.portfolioSlotFilled : ''} ${slot ? styles.portfolioSlotClickable : ''}`}
            style={slot ? { borderColor: DOMAIN_COLORS[slot.card.domain] } : undefined}
            onClick={slot ? () => showCard({ type: 'program', card: slot.card }) : undefined}
          >
            {slot ? (
              <>
                <span className={styles.slotName}>{slot.card.name}</span>
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
                <span className={styles.slotName}>{slot.card.name}</span>
                <span className={styles.slotDomain}>Year {slot.yearsInPipeline ?? 0}</span>
              </>
            ) : (
              'Empty'
            )}
          </div>
        ))}
      </div>

      {portfolio.mothballed.length > 0 && (
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
                <span className={styles.slotName}>{card.name}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
