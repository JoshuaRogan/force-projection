import type { CrisisCard as CrisisCardType } from '@fp/shared';
import styles from './Cards.module.css';

export function CrisisCard({ card }: { card: CrisisCardType }) {
  return (
    <div className={`${styles.card} ${styles.crisisCard}`}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>{card.name}</div>
        <div className={styles.cardSubtitle}>Crisis</div>
      </div>

      <div className={styles.cardBody}>
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
