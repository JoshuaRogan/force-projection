import type { ContractCard as ContractCardType } from '@fp/shared';
import { RequirementIcon } from '../icons';
import { CardArt } from './CardArt';
import styles from './Cards.module.css';

export function ContractCard({
  card,
  layout = 'vertical',
  fulfillment,
}: {
  card: ContractCardType;
  layout?: 'horizontal' | 'vertical';
  fulfillment?: (boolean | null)[];
}) {
  return (
    <div className={`${styles.card} ${styles.contractCard} ${layout === 'horizontal' ? styles.cardHorizontal : ''}`}>
      <CardArt id={card.id} type="contracts" name={card.name} />

      <div className={styles.cardDetails}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>{card.name}</div>
          <div className={styles.cardSubtitle}>Contract</div>
        </div>

        <div className={styles.cardBody}>
          {card.prose && <p className={styles.cardProse}>{card.prose}</p>}

          {card.immediateAward.length > 0 && (
            <div>
              <div className={styles.sectionLabel}>Immediate</div>
              <ul className={styles.effectsList}>
                {card.immediateAward.map((e, i) => (
                  <li key={i}>{e.description}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <div className={styles.sectionLabel}>Requirements</div>
            <ul className={styles.requirementsList}>
              {card.requirements.map((r, i) => {
                const met = fulfillment?.[i];
                return (
                  <li
                    key={i}
                    className={`${styles.reqRow} ${met === true ? styles.reqMet : met === false ? styles.reqUnmet : ''}`}
                  >
                    <RequirementIcon req={r} size={12} className={styles.reqIcon} />
                    <span className={styles.reqDesc}>{r.description}</span>
                    {met !== undefined && met !== null && (
                      <span className={styles.reqStatus}>{met ? '✓' : '–'}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto' }}>
            <span className={styles.siBadge}>+{card.rewardSI} SI</span>
            <span className={styles.crisisPenalty}>{card.failurePenaltySI} SI</span>
          </div>
        </div>
      </div>
    </div>
  );
}
