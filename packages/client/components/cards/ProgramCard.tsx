import type { ProgramCard as ProgramCardType } from '@fp/shared';
import { THEATER_NAMES } from '@fp/shared';
import { CostDisplay } from './CostDisplay';
import { CardArt } from './CardArt';
import styles from './Cards.module.css';

const DOMAIN_LABELS: Record<string, string> = {
  AIR: 'Air', SEA: 'Sea', EXP: 'Expeditionary', SPACE_CYBER: 'Space/Cyber',
};

export function ProgramCard({ card }: { card: ProgramCardType }) {
  return (
    <div className={`${styles.card} ${styles.programCard} ${styles[`domain${card.domain}`]}`}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>{card.name}</div>
        <div className={styles.cardSubtitle}>
          {DOMAIN_LABELS[card.domain]} Program
        </div>
      </div>

      <CardArt id={card.id} type="programs" name={card.name} />

      <div className={styles.cardBody}>
        {card.prose && <p className={styles.cardProse}>{card.prose}</p>}

        {/* Tags */}
        <div className={styles.tagsRow}>
          {card.subtags.map(tag => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>

        {/* Costs */}
        <CostDisplay cost={card.pipelineCost} label="Pipeline" />
        <CostDisplay cost={card.activeCost} label="Activate" />

        {/* Activate effects */}
        {card.activateEffects.length > 0 && (
          <div>
            <div className={styles.sectionLabel}>On Activate</div>
            <ul className={styles.effectsList}>
              {card.activateEffects.map((e, i) => (
                <li key={i}>{e.description}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Sustain effects */}
        {card.sustainEffects.length > 0 && (
          <div>
            <div className={styles.sectionLabel}>Sustain</div>
            <ul className={styles.effectsList}>
              {card.sustainEffects.map((e, i) => (
                <li key={i}>{e.description}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Stationing */}
        {card.stationing && (
          <div>
            <div className={styles.sectionLabel}>Station</div>
            <div className={styles.tag}>
              +{card.stationing.strength} strength &middot; {card.stationing.theaters.map(t => (THEATER_NAMES as Record<string, string>)[t] ?? t).join(', ')}
            </div>
          </div>
        )}
      </div>

      <div className={styles.cardFooter}>
        {card.printedSI ? (
          <span className={styles.siBadge}>+{card.printedSI} SI</span>
        ) : (
          <span>No printed SI</span>
        )}
      </div>
    </div>
  );
}
