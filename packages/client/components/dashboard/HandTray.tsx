import type { ProgramCard } from '@fp/shared';
import { useCardModal } from '../cards/CardModalContext';
import styles from './Dashboard.module.css';

const DOMAIN_COLORS: Record<string, string> = {
  AIR: 'var(--color-domain-air)', SEA: 'var(--color-domain-sea)',
  EXP: 'var(--color-domain-exp)', SPACE_CYBER: 'var(--color-domain-space-cyber)',
};

const DOMAIN_SHORT: Record<string, string> = {
  AIR: 'AIR', SEA: 'SEA', EXP: 'EXP', SPACE_CYBER: 'SPC',
};

function formatCostShort(cost: { budget: Record<string, number> }): string {
  return Object.entries(cost.budget)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${v}${k}`)
    .join(' ');
}

export function HandTray({ hand }: { hand: ProgramCard[] }) {
  const { showCard } = useCardModal();

  if (hand.length === 0) return null;

  return (
    <div className={styles.handTray}>
      <div className={styles.handTrayHeader}>Hand ({hand.length}) — click any card to view details</div>
      <div className={styles.handList}>
        {hand.map(card => {
          const domainColor = DOMAIN_COLORS[card.domain];
          return (
            <div
              key={card.id}
              className={styles.handCard}
              style={{ '--stripe-color': domainColor, cursor: 'pointer' } as React.CSSProperties}
              onClick={() => showCard({ type: 'program', card })}
            >
              <div className={styles.handCardName}>{card.name}</div>
              <div className={styles.handCardMeta}>
                <span className={styles.handCardDomain} style={{ color: domainColor }}>
                  {DOMAIN_SHORT[card.domain]}
                </span>
                <span className={styles.handCardCosts}>
                  P:{formatCostShort(card.pipelineCost) || '0'}
                </span>
                <span className={styles.handCardCosts}>
                  A:{formatCostShort(card.activeCost) || '0'}
                </span>
              </div>
              {card.activateEffects.length > 0 && (
                <div className={styles.handCardEffects}>
                  {card.activateEffects[0].description}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
