import type { CrisisCard as CrisisCardType } from '@fp/shared';
import { CardArt } from './CardArt';
import styles from './Cards.module.css';

export function CrisisCard({ card, layout = 'vertical' }: { card: CrisisCardType; layout?: 'horizontal' | 'vertical' }) {
  return (
    <div className={`${styles.card} ${styles.crisisCard} ${layout === 'horizontal' ? styles.cardHorizontal : ''}`}>
      <CardArt id={card.id} type="crises" name={card.name} />

      <div className={styles.cardDetails}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>{card.name}</div>
          <div className={styles.cardSubtitle}>Crisis</div>
        </div>

        <div className={styles.cardBody}>
          {card.prose && <p className={styles.cardProse}>{card.prose}</p>}

          <p className={styles.crisisRule}>{card.immediateRule}</p>

          <div>
            <div className={styles.sectionLabel} style={{ color: 'var(--color-success)' }}>Response</div>
            <p className={styles.crisisResponse}>{card.responseDescription}</p>
          </div>

          <div>
            <div className={styles.sectionLabel} style={{ color: 'var(--color-danger)' }}>Penalty</div>
            <p className={styles.crisisPenalty}>{card.penaltyDescription}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
