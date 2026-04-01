import type { CrisisCard as CrisisCardType } from '@fp/shared';
import { CardArt } from './CardArt';
import styles from './Cards.module.css';

export function CrisisCard({ card }: { card: CrisisCardType }) {
  return (
    <div className={`${styles.card} ${styles.crisisCard}`}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>{card.name}</div>
        <div className={styles.cardSubtitle}>Crisis</div>
      </div>

      <CardArt id={card.id} type="crises" name={card.name} />

      <div className={styles.cardBody}>
        {card.prose && <p className={styles.cardProse}>{card.prose}</p>}

        {/* Immediate rule */}
        <p className={styles.crisisRule}>{card.immediateRule}</p>

        {/* Response */}
        <div>
          <div className={styles.sectionLabel} style={{ color: 'var(--color-success)' }}>Response</div>
          <p className={styles.crisisResponse}>{card.responseDescription}</p>
        </div>

        {/* Penalty */}
        <div>
          <div className={styles.sectionLabel} style={{ color: 'var(--color-danger)' }}>Penalty</div>
          <p className={styles.crisisPenalty}>{card.penaltyDescription}</p>
        </div>
      </div>
    </div>
  );
}
