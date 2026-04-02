'use client';
import { useState } from 'react';
import type { ProgramCard, ContractCard, AgendaCard, CrisisCard, BudgetLine, SecondaryResource } from '@fp/shared';
import { THEATER_NAMES } from '@fp/shared';
import type { CardModalData } from './CardModalContext';
import { SubtagIcon, RequirementIcon } from '../icons';
import { ResourceToken } from '../ui/ResourceToken';
import { colorizeDesc } from '../../utils/colorizeDesc';
import { CARD_ART_VARIANTS } from './cardArtVariants';
import styles from './CardDetailModal.module.css';

const DOMAIN_LABELS: Record<string, string> = {
  AIR: 'Air', SEA: 'Sea', EXP: 'Expeditionary', SPACE_CYBER: 'Space / Cyber',
};

const TYPE_META: Record<string, { label: string; artFolder: string }> = {
  program:  { label: 'Defense Program',      artFolder: 'programs'  },
  contract: { label: 'Defense Contract',     artFolder: 'contracts' },
  agenda:   { label: 'Congressional Agenda', artFolder: 'agendas'   },
  crisis:   { label: 'Crisis Event',         artFolder: 'crises'    },
};

const ACCENT_COLORS: Record<string, string> = {
  program:  'var(--color-card-program)',
  contract: 'var(--color-card-contract)',
  agenda:   'var(--color-card-agenda)',
  crisis:   'var(--color-card-crisis)',
};

const DOMAIN_ACCENT: Record<string, string> = {
  AIR:         'var(--color-domain-air)',
  SEA:         'var(--color-domain-sea)',
  EXP:         'var(--color-domain-exp)',
  SPACE_CYBER: 'var(--color-domain-space-cyber)',
};

function CostChips({ cost }: { cost: { budget: Partial<Record<string, number>>; secondary?: Partial<Record<string, number>> } }) {
  const budgetEntries = Object.entries(cost.budget).filter(([, v]) => v && v > 0) as [BudgetLine, number][];
  const secondaryEntries = cost.secondary
    ? (Object.entries(cost.secondary).filter(([, v]) => v && v > 0) as [SecondaryResource, number][])
    : [];
  if (budgetEntries.length === 0 && secondaryEntries.length === 0) return <span className={styles.costEmpty}>—</span>;
  return (
    <span className={styles.costChips}>
      {budgetEntries.map(([k, v]) => <ResourceToken key={k} resource={k} count={v} mode="labeled" />)}
      {secondaryEntries.map(([k, v]) => <ResourceToken key={k} resource={k} count={v} mode="labeled" />)}
    </span>
  );
}


function Section({ label, color, children }: { label: string; color?: string; children: React.ReactNode }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionLabel} style={color ? { color } : undefined}>{label}</div>
      {children}
    </div>
  );
}

function EffectList({ items }: { items: Array<{ description: string }> }) {
  return (
    <ul className={styles.effectList}>
      {items.map((e, i) => <li key={i}>{colorizeDesc(e.description)}</li>)}
    </ul>
  );
}

function ProgramBody({ card }: { card: ProgramCard }) {
  return (
    <>
      {card.subtags.length > 0 && (
        <div className={styles.tagsRow}>
          {card.subtags.map(t => (
            <span key={t} className={styles.tag} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <SubtagIcon subtag={t} size={12} colored />
              {t}
            </span>
          ))}
        </div>
      )}
      <div className={styles.costGrid}>
        <div className={styles.costCell}>
          <span className={styles.costCellLabel}>Pipeline</span>
          <CostChips cost={card.pipelineCost} />
        </div>
        <div className={styles.costCell}>
          <span className={styles.costCellLabel}>Activate</span>
          <CostChips cost={card.activeCost} />
        </div>
      </div>
      {card.activateEffects.length > 0 && (
        <Section label="On Activate">
          <EffectList items={card.activateEffects} />
        </Section>
      )}
      {card.sustainEffects.length > 0 && (
        <Section label="Sustain">
          <EffectList items={card.sustainEffects} />
        </Section>
      )}
      {card.stationing && (
        <Section label="Station">
          <p className={styles.stationNote}>
            +{card.stationing.strength} strength · {card.stationing.theaters.map(t => (THEATER_NAMES as Record<string, string>)[t] ?? t).join(', ')}
          </p>
        </Section>
      )}
    </>
  );
}

function ContractBody({ card }: { card: ContractCard }) {
  return (
    <>
      {card.immediateAward.length > 0 && (
        <Section label="Immediate Award">
          <EffectList items={card.immediateAward} />
        </Section>
      )}
      <Section label="Requirements">
        <ul className={styles.requireList}>
          {card.requirements.map((r, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, paddingLeft: 0 }}>
              <span style={{ marginTop: 2, flexShrink: 0, opacity: 0.65 }}>
                <RequirementIcon req={r} size={14} />
              </span>
              <span>{colorizeDesc(r.description)}</span>
            </li>
          ))}
        </ul>
      </Section>
      <div className={styles.costGrid}>
        <div className={styles.costCell}>
          <span className={styles.costCellLabel}>Reward</span>
          <span className={styles.costCellValue} style={{ color: 'var(--color-success)' }}>+{card.rewardSI} SI</span>
        </div>
        <div className={styles.costCell}>
          <span className={styles.costCellLabel}>Failure Penalty</span>
          <span className={styles.costCellValue} style={{ color: 'var(--color-danger)' }}>{card.failurePenaltySI} SI</span>
        </div>
      </div>
    </>
  );
}

function AgendaBody({ card }: { card: AgendaCard }) {
  return (
    <>
      <p className={styles.descriptionText}>{colorizeDesc(card.description)}</p>
      {card.passEffects.length > 0 && (
        <Section label="If Passes" color="var(--color-success)">
          <EffectList items={card.passEffects} />
        </Section>
      )}
      {card.failEffects.length > 0 && (
        <Section label="If Fails" color="var(--color-danger)">
          <EffectList items={card.failEffects} />
        </Section>
      )}
      {card.favoredBudgetLine && (
        <div className={styles.favoredRow}>
          Favors: <span className={`badge badge-${card.favoredBudgetLine}`}>{card.favoredBudgetLine}</span>
        </div>
      )}
    </>
  );
}

function CrisisBody({ card }: { card: CrisisCard }) {
  return (
    <>
      <div className={styles.crisisRule}>{colorizeDesc(card.immediateRule)}</div>
      <Section label="Response" color="var(--color-success)">
        <p className={styles.crisisNote} style={{ color: 'var(--color-success)' }}>{colorizeDesc(card.responseDescription)}</p>
      </Section>
      <Section label="Penalty" color="var(--color-danger)">
        <p className={styles.crisisNote} style={{ color: 'var(--color-danger)' }}>{colorizeDesc(card.penaltyDescription)}</p>
      </Section>
    </>
  );
}

export function CardDetailModal({ data }: { data: CardModalData }) {
  const meta = TYPE_META[data.type];
  const accent = data.type === 'program'
    ? (DOMAIN_ACCENT[data.card.domain] ?? ACCENT_COLORS[data.type])
    : ACCENT_COLORS[data.type];

  const subtitleParts = [meta.label];
  if (data.type === 'program') subtitleParts.push(DOMAIN_LABELS[data.card.domain]);

  const prose = data.card.prose;

  return (
    <div className={styles.modal} style={{ '--accent': accent } as React.CSSProperties}>
      <div className={styles.accentBar} />

      {/* Art + name overlay */}
      <div className={styles.artHero}>
        <ArtInner id={data.card.id} folder={meta.artFolder} name={data.card.name} />
        <div className={styles.nameOverlay}>
          <div className={styles.typePill}>{subtitleParts.join(' · ')}</div>
          <h2 className={styles.cardName}>{data.card.name}</h2>
        </div>
      </div>

      {/* Body */}
      <div className={styles.body}>
        {prose && (
          <div className={styles.prose}>
            <span className={styles.proseLabel}>Intel</span>
            <p className={styles.proseText}>{prose}</p>
          </div>
        )}

        <div className={styles.divider} />

        {data.type === 'program'  && <ProgramBody  card={data.card} />}
        {data.type === 'contract' && <ContractBody card={data.card} />}
        {data.type === 'agenda'   && <AgendaBody   card={data.card} />}
        {data.type === 'crisis'   && <CrisisBody   card={data.card} />}
      </div>

      {/* Footer */}
      {data.type === 'program' && (
        <div className={styles.footer}>
          {data.card.printedSI
            ? <span className={styles.siBadge}>+{data.card.printedSI} SI</span>
            : <span className={styles.footerMuted}>No printed SI</span>}
        </div>
      )}
      {data.type === 'contract' && (
        <div className={styles.footer}>
          <span className={styles.siBadge}>+{data.card.rewardSI} SI on complete</span>
        </div>
      )}
    </div>
  );
}

// Inner art image component (avoids hook inside conditional)
function ArtInner({ id, folder, name }: { id: string; folder: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const variant = CARD_ART_VARIANTS[id] ?? 1;
  return (
    <>
      {failed ? (
        <div className={styles.artFallback} />
      ) : (
        <img
          src={`/cards/${folder}/${id}-v${variant}.png`}
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
