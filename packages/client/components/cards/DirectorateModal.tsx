'use client';
import { useState } from 'react';
import type { DirectorateDefinition, BudgetLine, SecondaryResource } from '@fp/shared';
import { ResourceToken } from '../ui/ResourceToken';
import { colorizeDesc } from '../../utils/colorizeDesc';
import { CARD_ART_VARIANTS } from './cardArtVariants';
import styles from './CardDetailModal.module.css';
import dStyles from './DirectorateModal.module.css';

const DIRECTORATE_ACCENT: Record<string, string> = {
  NAVSEA:   'var(--color-navsea)',
  AIRCOM:   'var(--color-aircom)',
  MARFOR:   'var(--color-marfor)',
  SPACECY:  'var(--color-spacecy)',
  TRANSCOM: 'var(--color-transcom)',
};

function ArtInner({ id, name, accent }: { id: string; name: string; accent: string }) {
  const [failed, setFailed] = useState(false);
  const variant = CARD_ART_VARIANTS[id] ?? 1;
  return (
    <>
      {failed ? (
        <div className={styles.artFallback} style={{ background: `color-mix(in srgb, ${accent} 12%, var(--bg-elevated))` }} />
      ) : (
        <img
          src={`/cards/directorates/${id}-v${variant}.png`}
          alt={name}
          className={styles.artImage}
          onError={() => setFailed(true)}
        />
      )}
      <div className={styles.artScanlines} />
      <div className={styles.artGradient} />
    </>
  );
}

function BonusChips({ label, pool }: { label: string; pool: Partial<Record<string, number>> }) {
  const entries = Object.entries(pool).filter(([, v]) => v && v > 0);
  if (entries.length === 0) return null;
  return (
    <div className={dStyles.bonusRow}>
      <span className={dStyles.bonusLabel}>{label}</span>
      <span className={dStyles.bonusChips}>
        {entries.map(([k, v]) => (
          <ResourceToken key={k} resource={k as BudgetLine | SecondaryResource} count={v} mode="labeled" />
        ))}
      </span>
    </div>
  );
}

export function DirectorateModal({ directorate }: { directorate: DirectorateDefinition }) {
  const accent = DIRECTORATE_ACCENT[directorate.id] ?? 'var(--color-accent)';

  const hasStartBonuses =
    Object.values(directorate.startBonusBudgetProduction).some(v => v && v > 0) ||
    Object.values(directorate.startBonusSecondaryProduction).some(v => v && v > 0) ||
    Object.values(directorate.startBonusTokens).some(v => v && v > 0);

  return (
    <div className={styles.modal} style={{ '--accent': accent } as React.CSSProperties}>
      <div className={styles.accentBar} />

      {/* Art hero */}
      <div className={styles.artHero}>
        <ArtInner id={directorate.id} name={directorate.name} accent={accent} />
        <div className={styles.nameOverlay}>
          <div className={styles.typePill}>Directorate · {directorate.subtitle}</div>
          <h2 className={styles.cardName}>{directorate.name}</h2>
        </div>
      </div>

      {/* Body */}
      <div className={styles.body}>
        {/* Passive */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Passive Ability</div>
          <div className={dStyles.abilityBlock}>
            {colorizeDesc(directorate.passiveDescription)}
          </div>
        </div>

        {/* Once per year */}
        <div className={styles.section}>
          <div className={styles.sectionLabel} style={{ color: accent }}>Once Per Year</div>
          <div className={dStyles.abilityBlock} style={{ borderColor: accent }}>
            {colorizeDesc(directorate.oncePerYearDescription)}
          </div>
        </div>

        {/* Starting bonuses */}
        {hasStartBonuses && (
          <>
            <div className={styles.divider} />
            <div className={styles.section}>
              <div className={styles.sectionLabel}>Starting Bonuses</div>
              <div className={dStyles.bonusGroup}>
                <BonusChips label="Budget production" pool={directorate.startBonusBudgetProduction} />
                <BonusChips label="Secondary production" pool={directorate.startBonusSecondaryProduction} />
                <BonusChips label="Starting tokens" pool={directorate.startBonusTokens} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
