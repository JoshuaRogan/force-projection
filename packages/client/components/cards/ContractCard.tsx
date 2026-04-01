import type { ContractCard as ContractCardType } from '@fp/shared';
import { CardArt } from './CardArt';
import styles from './Cards.module.css';

export function ContractCard({ card }: { card: ContractCardType }) {
  return (
    <div className={`${styles.card} ${styles.contractCard}`}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>{card.name}</div>
        <div className={styles.cardSubtitle}>Contract</div>
      </div>

      <CardArt id={card.id} type="contracts" name={card.name} />

      <div className={styles.cardBody}>
        {card.prose && <p className={styles.cardProse}>{card.prose}</p>}

        {/* Immediate award */}
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

        {/* Requirements */}
        <div>
          <div className={styles.sectionLabel}>Requirements</div>
          <ul className={styles.requirementsList}>
            {card.requirements.map((r, i) => (
              <li key={i}>{r.description}</li>
            ))}
          </ul>
        </div>

        {/* Reward / Penalty */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto' }}>
          <span className={styles.siBadge}>+{card.rewardSI} SI</span>
          <span className={styles.crisisPenalty}>{card.failurePenaltySI} SI</span>
        </div>
      </div>
    </div>
  );
}
