import type { AgendaCard as AgendaCardType } from '@fp/shared';
import { CardArt } from './CardArt';
import styles from './Cards.module.css';

export function AgendaCard({ card }: { card: AgendaCardType }) {
  return (
    <div className={`${styles.card} ${styles.agendaCard}`}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>{card.name}</div>
        <div className={styles.cardSubtitle}>Congressional Agenda</div>
      </div>

      <CardArt id={card.id} type="agendas" name={card.name} />

      <div className={styles.cardBody}>
        {card.prose && <p className={styles.cardProse}>{card.prose}</p>}

        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          {card.description}
        </p>

        {/* Pass effects */}
        {card.passEffects.length > 0 && (
          <div>
            <div className={styles.sectionLabel} style={{ color: 'var(--color-success)' }}>If Passes</div>
            <ul className={styles.effectsList}>
              {card.passEffects.map((e, i) => (
                <li key={i}>{e.description}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Fail effects */}
        {card.failEffects.length > 0 && (
          <div>
            <div className={styles.sectionLabel} style={{ color: 'var(--color-danger)' }}>If Fails</div>
            <ul className={styles.effectsList}>
              {card.failEffects.map((e, i) => (
                <li key={i}>{e.description}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {card.favoredBudgetLine && (
        <div className={styles.cardFooter}>
          Favors: <span className={`badge badge-${card.favoredBudgetLine}`}>
            {card.favoredBudgetLine}
          </span>
        </div>
      )}
    </div>
  );
}
