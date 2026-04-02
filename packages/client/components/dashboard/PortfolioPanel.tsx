import type { Portfolio, ProgramCard, PlayerState, GameState } from '@fp/shared';
import { SubtagIcon } from '../icons';
import { useCardModal } from '../cards/CardModalContext';
import { evaluateSustainStatus } from '../../utils/sustainStatus';
import styles from './Dashboard.module.css';

function hasSIBonus(card: ProgramCard): boolean {
  if ((card.printedSI ?? 0) > 0) return true;
  return [...card.activateEffects, ...card.sustainEffects].some(
    e => e.type === 'gainSI' || e.type === 'conditionalSI'
  );
}

const DOMAIN_COLORS: Record<string, string> = {
  AIR: 'var(--color-domain-air)', SEA: 'var(--color-domain-sea)',
  EXP: 'var(--color-domain-exp)', SPACE_CYBER: 'var(--color-domain-space-cyber)',
};

export function PortfolioPanel({ portfolio, player, gameState }: { portfolio: Portfolio; player?: PlayerState; gameState?: GameState }) {
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
