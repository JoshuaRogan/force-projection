import type { ProgramCard as ProgramCardType } from '@fp/shared';
import { THEATER_NAMES, hasSIBonus } from '@fp/shared';
import { colorizeDesc } from '../../utils/colorizeDesc';
import { SubtagIcon } from '../icons';
import { CostDisplay } from './CostDisplay';
import { CardArt } from './CardArt';
import styles from './Cards.module.css';

const DOMAIN_LABELS: Record<string, string> = {
  AIR: 'Air', SEA: 'Sea', EXP: 'Expeditionary', SPACE_CYBER: 'Space/Cyber',
};

export function ProgramCard({ card, layout = 'vertical' }: { card: ProgramCardType; layout?: 'horizontal' | 'vertical' }) {
  const siBonus = hasSIBonus(card);
  return (
    <div className={`${styles.card} ${styles.programCard} ${styles[`domain${card.domain}`]} ${layout === 'horizontal' ? styles.cardHorizontal : ''}`}>
      <CardArt id={card.id} type="programs" name={card.name} />

      <div className={styles.cardDetails}>
        <div className={styles.cardHeader}>
          <div className={`${styles.cardTitle} ${siBonus ? styles.siCardTitle : ''}`}>
            {card.name}{siBonus && <span className={styles.siStar}>★</span>}
          </div>
          <div className={styles.cardSubtitle}>{DOMAIN_LABELS[card.domain]} Program</div>
        </div>

        <div className={styles.cardBody}>
          {card.prose && <p className={styles.cardProse}>{card.prose}</p>}

          <div className={styles.tagsRow}>
            {card.subtags.map(tag => (
              <span key={tag} className={styles.iconTag}>
                <SubtagIcon subtag={tag} size={11} colored className={styles.iconTagGlyph} />
                {tag}
              </span>
            ))}
          </div>

          <CostDisplay cost={card.pipelineCost} label="Pipeline" />
          <CostDisplay cost={card.activeCost} label="Activate" />

          {card.activateEffects.length > 0 && (
            <div>
              <div className={styles.sectionLabel}>On Activate</div>
              <ul className={styles.effectsList}>
                {card.activateEffects.map((e, i) => (
                  <li key={i}>{colorizeDesc(e.description)}</li>
                ))}
              </ul>
            </div>
          )}

          {card.sustainEffects.length > 0 && (
            <div>
              <div className={styles.sectionLabel}>Sustain</div>
              <ul className={styles.effectsList}>
                {card.sustainEffects.map((e, i) => (
                  <li key={i}>{colorizeDesc(e.description)}</li>
                ))}
              </ul>
            </div>
          )}

          {card.stationing && (
            <div>
              <div className={styles.sectionLabel}>Station</div>
              <div className={styles.tag}>
                +{card.stationing.strength} strength &middot; {card.stationing.theaters.map(t => (THEATER_NAMES as Record<string, string>)[t] ?? t).join(', ')}
              </div>
            </div>
          )}
        </div>

        {card.printedSI ? (
          <div className={styles.cardFooter}>
            <span className={styles.siBadge}>+{card.printedSI} SI</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
