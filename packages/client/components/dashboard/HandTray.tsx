import type { ProgramCard, BudgetLine, SecondaryResource } from '@fp/shared';
import { hasSIBonus } from '@fp/shared';
import { useCardModal } from '../cards/CardModalContext';
import { CARD_ART_VARIANTS } from '../cards/cardArtVariants';
import { ResourceToken } from '../ui/ResourceToken';
import { colorizeDesc } from '../../utils/colorizeDesc';
import styles from './Dashboard.module.css';

const DOMAIN_COLORS: Record<string, string> = {
  AIR: 'var(--color-domain-air)', SEA: 'var(--color-domain-sea)',
  EXP: 'var(--color-domain-exp)', SPACE_CYBER: 'var(--color-domain-space-cyber)',
};

const DOMAIN_SHORT: Record<string, string> = {
  AIR: 'AIR', SEA: 'SEA', EXP: 'EXP', SPACE_CYBER: 'SPC',
};

export function ProgramCostChips({ cost }: { cost: { budget: Record<string, number>; secondary?: Record<string, number> } }) {
  const budget = Object.entries(cost.budget).filter(([, v]) => v > 0) as [BudgetLine, number][];
  const secondary = cost.secondary
    ? (Object.entries(cost.secondary).filter(([, v]) => v > 0) as [SecondaryResource, number][])
    : [];
  return (
    <>
      {budget.map(([k, v]) => <ResourceToken key={k} resource={k} count={v} mode="chip" />)}
      {secondary.map(([k, v]) => <ResourceToken key={k} resource={k} count={v} mode="chip" />)}
    </>
  );
}

/** Same vertical layout as the hand tray; optional status line under the title. */
export function ProgramVerticalCard({
  card,
  onClick,
  metaLine,
  showFirstEffect = true,
}: {
  card: ProgramCard;
  onClick: () => void;
  metaLine?: string;
  showFirstEffect?: boolean;
}) {
  const domainColor = DOMAIN_COLORS[card.domain];
  const variant = CARD_ART_VARIANTS[card.id] ?? 1;
  const artSrc = `/cards/programs/${card.id}-v${variant}.png`;
  const hasSI = hasSIBonus(card);

  return (
    <div
      role="button"
      tabIndex={0}
      className={styles.handCard}
      style={{ '--domain-color': domainColor } as React.CSSProperties}
      onClick={onClick}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className={styles.handCardArtWrap}>
        <img src={artSrc} alt="" className={styles.handCardArt} />
        <span className={styles.handCardDomainBadge} style={{ color: domainColor }}>
          {DOMAIN_SHORT[card.domain]}
        </span>
      </div>
      <div className={styles.handCardInfo}>
        <div
          className={styles.handCardName}
          style={hasSI ? { color: 'var(--color-si)', fontWeight: 700 } : undefined}
        >
          {card.name}
          {hasSI && (
            <span
              style={{
                marginLeft: 3,
                fontSize: '0.85em',
                filter: 'drop-shadow(0 0 3px color-mix(in srgb, var(--color-si) 60%, transparent))',
              }}
            >
              ★
            </span>
          )}
        </div>
        {metaLine ? <div className={styles.handCardMeta}>{metaLine}</div> : null}
        <div className={styles.handCardCostRows}>
          <div className={styles.handCardCostRow}>
            <span className={styles.handCardCostLabel}>P</span>
            <ProgramCostChips cost={card.pipelineCost} />
          </div>
          <div className={styles.handCardCostRow}>
            <span className={styles.handCardCostLabel}>A</span>
            <ProgramCostChips cost={card.activeCost} />
          </div>
        </div>
        {showFirstEffect && card.activateEffects.length > 0 && (
          <div className={styles.handCardEffects}>{colorizeDesc(card.activateEffects[0].description)}</div>
        )}
      </div>
    </div>
  );
}

export function ProgramVerticalEmpty({ label }: { label: string }) {
  return (
    <div className={styles.handCardEmpty} aria-hidden>
      <span className={styles.handCardEmptyLabel}>{label}</span>
    </div>
  );
}

export function HandTray({ hand }: { hand: ProgramCard[] }) {
  const { showCard } = useCardModal();

  if (hand.length === 0) return null;

  return (
    <div className={styles.handTray}>
      <div className={styles.handList}>
        {hand.map(card => (
          <ProgramVerticalCard
            key={card.id}
            card={card}
            onClick={() => showCard({ type: 'program', card })}
          />
        ))}
      </div>
    </div>
  );
}
