import { useState } from 'react';
import type { PlayerResources, BudgetLine, SecondaryResource } from '@fp/shared';
import { BUDGET_LINES, SECONDARY_RESOURCES } from '@fp/shared';
import { ResourceToken } from '../ui/ResourceToken';
import styles from './Dashboard.module.css';

const BUDGET_CSS: Record<BudgetLine, string> = {
  A: 'var(--color-air)', S: 'var(--color-sea)', E: 'var(--color-exp)',
  X: 'var(--color-space)', U: 'var(--color-sustain)',
};

const BUDGET_SHORT: Record<BudgetLine, string> = {
  A: 'Air', S: 'Sea', E: 'Expedit.', X: 'Space/Cyber', U: 'Sustain',
};

const SECONDARY_CSS: Record<SecondaryResource, string> = {
  M: 'var(--color-manpower)', L: 'var(--color-logistics)',
  I: 'var(--color-intel)', PC: 'var(--color-polcap)',
};

const SECONDARY_SHORT: Record<SecondaryResource, string> = {
  M: 'Manpower', L: 'Logistics', I: 'Intel', PC: 'Pol. Capital',
};

// Maps each resource key to its image filename stem in /resources/
const RESOURCE_IMAGE: Record<BudgetLine | SecondaryResource, string> = {
  A: 'air',
  S: 'sea',
  E: 'expeditionary',
  X: 'space-cyber',
  U: 'sustain',
  M: 'manpower',
  L: 'logistics',
  I: 'intel',
  PC: 'political-capital',
};

const BUDGET_INFO: Record<BudgetLine, { name: string; description: string; usedFor: string }> = {
  A: { name: 'Air', description: 'Funds Air Force and aviation programs.', usedFor: 'Procuring air platforms, activating AIR domain programs, sustaining air capabilities in theater.' },
  S: { name: 'Sea', description: 'Funds naval programs and maritime operations.', usedFor: 'Procuring naval vessels, activating SEA domain programs, maintaining maritime presence.' },
  E: { name: 'Expeditionary', description: 'Funds joint and expeditionary forces.', usedFor: 'Rapid deployment, amphibious operations, activating EXPEDITIONARY domain programs.' },
  X: { name: 'Space/Cyber', description: 'Funds space operations and cyber programs.', usedFor: 'Activating SPACE/CYBER domain programs, next-generation C2 and ISR capabilities.' },
  U: { name: 'Sustain', description: 'Funds ongoing logistics and maintenance.', usedFor: 'Long-term deployments, base operations, sustaining active forces in theater. Deploy orders often cost Sustain.' },
};

const SECONDARY_INFO: Record<SecondaryResource, { name: string; description: string; usedFor: string }> = {
  M: { name: 'Manpower', description: 'Personnel for your forces.', usedFor: 'Deploying units to theaters, activating programs that require people, maintaining active theater presence.' },
  L: { name: 'Logistics', description: 'Supply chain and transport capacity.', usedFor: 'Moving forces between theaters, sustaining deployed units, enabling large-scale operations.' },
  I: { name: 'Intel', description: 'Intelligence collection and analysis.', usedFor: 'Precision targeting, crisis response, programs that rely on ISR and information advantage.' },
  PC: { name: 'Political Capital', description: 'Congressional and coalition influence.', usedFor: 'Voting on congressional agendas, diplomatic actions, programs requiring political leverage.' },
};

type DetailView =
  | { kind: 'section'; type: 'budget' | 'secondary' }
  | { kind: 'budget-item'; key: BudgetLine }
  | { kind: 'secondary-item'; key: SecondaryResource };

function ResourceArtHero({ resourceKey, color, name }: { resourceKey: BudgetLine | SecondaryResource; color: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const slug = RESOURCE_IMAGE[resourceKey];
  return (
    <div className={styles.resourceArtHero} style={{ '--resource-color': color } as React.CSSProperties}>
      {!failed && (
        <img
          src={`/resources/${slug}.png`}
          alt={slug}
          className={styles.resourceArtImage}
          onError={() => setFailed(true)}
        />
      )}
      {failed && <div className={styles.resourceArtFallback} />}
      <div className={styles.resourceArtGradient} />
      <div className={styles.resourceArtNameOverlay}>
        <div className={styles.resourceArtKeyPill}>{resourceKey}</div>
        <div className={styles.resourceArtTitle}>{name}</div>
      </div>
    </div>
  );
}

function ResourceItemModal({
  resourceKey,
  info,
  color,
  current,
  prod,
  onClose,
}: {
  resourceKey: BudgetLine | SecondaryResource;
  info: { name: string; description: string; usedFor: string };
  color: string;
  current: number;
  prod: number;
  onClose: () => void;
}) {
  return (
    <div className={styles.resourceInfoOverlay} onClick={onClose}>
      <div className={styles.resourceInfoPanel} onClick={e => e.stopPropagation()}>
        <button className={styles.resourceInfoClose} onClick={onClose}>✕</button>

        {/* Art hero with name overlay inside */}
        <ResourceArtHero resourceKey={resourceKey} color={color} name={info.name} />

        {/* Body */}
        <div className={styles.resourceInfoBody}>
          {/* Stats row */}
          <div className={styles.resourceStatusRow}>
            <div className={styles.resourceStatusBlock}>
              <span className={styles.resourceStatusValue} style={{ color }}>{current}</span>
              <span className={styles.resourceStatusLabel}>Current</span>
            </div>
            <div className={styles.resourceStatusDivider} />
            <div className={styles.resourceStatusBlock}>
              <span className={styles.resourceStatusValue} style={{ color }}>+{prod}</span>
              <span className={styles.resourceStatusLabel}>Per Year</span>
            </div>
          </div>

          {/* Description callout */}
          <div className={styles.resourceDescCallout} style={{ '--resource-color': color } as React.CSSProperties}>
            <span className={styles.resourceDescLabel}>Overview</span>
            <p className={styles.resourceDescText}>{info.description}</p>
          </div>

          {/* Used for */}
          <div className={styles.resourceInfoUsedBlock}>
            <span className={styles.resourceInfoUsedLabel}>Used for</span>
            <p className={styles.resourceInfoUsed}>{info.usedFor}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResourceInfoModal({
  view,
  resources,
  onClose,
}: {
  view: DetailView;
  resources: PlayerResources;
  onClose: () => void;
}) {
  if (view.kind === 'budget-item') {
    const { key } = view;
    return (
      <ResourceItemModal
        resourceKey={key}
        info={BUDGET_INFO[key]}
        color={BUDGET_CSS[key]}
        current={resources.budget[key]}
        prod={resources.production.budget[key]}
        onClose={onClose}
      />
    );
  }

  if (view.kind === 'secondary-item') {
    const { key } = view;
    return (
      <ResourceItemModal
        resourceKey={key}
        info={SECONDARY_INFO[key]}
        color={SECONDARY_CSS[key]}
        current={resources.secondary[key]}
        prod={resources.production.secondary[key]}
        onClose={onClose}
      />
    );
  }

  // Section overview (unchanged)
  const isBudget = view.type === 'budget';
  return (
    <div className={styles.resourceInfoOverlay} onClick={onClose}>
      <div className={styles.resourceInfoPanel} onClick={e => e.stopPropagation()}>
        <div className={styles.resourceInfoHeader}>
          <span className={styles.resourceInfoTitle}>{isBudget ? 'Budget Resources' : 'Secondary Resources'}</span>
          <button className={styles.resourceInfoClose} onClick={onClose}>✕</button>
        </div>
        <p className={styles.resourceInfoIntro}>
          {isBudget
            ? 'Budget tokens are earned each fiscal year and spent on procuring and activating programs. Each domain has its own pool.'
            : 'Secondary resources support your operations. They are spent alongside budget to pay for programs, deployments, and special actions.'}
        </p>
        <div className={styles.resourceInfoList}>
          {isBudget
            ? BUDGET_LINES.map(line => (
                <div key={line} className={styles.resourceInfoItem}>
                  <div className={styles.resourceInfoItemHeader} style={{ color: BUDGET_CSS[line] }}>
                    <span className={styles.resourceInfoKey}>{line}</span>
                    <span className={styles.resourceInfoName}>{BUDGET_INFO[line].name}</span>
                  </div>
                  <p className={styles.resourceInfoDesc}>{BUDGET_INFO[line].description}</p>
                  <p className={styles.resourceInfoUsed}><strong>Used for:</strong> {BUDGET_INFO[line].usedFor}</p>
                </div>
              ))
            : SECONDARY_RESOURCES.map(res => (
                <div key={res} className={styles.resourceInfoItem}>
                  <div className={styles.resourceInfoItemHeader} style={{ color: SECONDARY_CSS[res] }}>
                    <span className={styles.resourceInfoKey}>{res}</span>
                    <span className={styles.resourceInfoName}>{SECONDARY_INFO[res].name}</span>
                  </div>
                  <p className={styles.resourceInfoDesc}>{SECONDARY_INFO[res].description}</p>
                  <p className={styles.resourceInfoUsed}><strong>Used for:</strong> {SECONDARY_INFO[res].usedFor}</p>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
}

export function ResourcePanel({ resources }: { resources: PlayerResources }) {
  const [detail, setDetail] = useState<DetailView | null>(null);

  return (
    <>
      {detail && <ResourceInfoModal view={detail} resources={resources} onClose={() => setDetail(null)} />}

      <div className={styles.section}>
        <button className={styles.sectionTitleBtn} onClick={() => setDetail({ kind: 'section', type: 'budget' })}>
          Budget <span className={styles.infoIcon}>ⓘ</span>
        </button>
        <div className={styles.resourceList}>
          {BUDGET_LINES.map(line => (
            <div
              key={line}
              className={styles.resourceRow}
              style={{ '--stripe-color': BUDGET_CSS[line] } as React.CSSProperties}
              onClick={() => setDetail({ kind: 'budget-item', key: line })}
            >
              <ResourceToken resource={line} mode="cell" />
              <div className={styles.resourceRowRight}>
                <span className={styles.resourceValue} style={{ color: BUDGET_CSS[line] }}>
                  {resources.budget[line]}
                </span>
                <span className={styles.resourceProduction}>+{resources.production.budget[line]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <button className={styles.sectionTitleBtn} onClick={() => setDetail({ kind: 'section', type: 'secondary' })}>
          Secondary <span className={styles.infoIcon}>ⓘ</span>
        </button>
        <div className={styles.resourceList}>
          {SECONDARY_RESOURCES.map(res => (
            <div
              key={res}
              className={styles.resourceRow}
              style={{ '--stripe-color': SECONDARY_CSS[res] } as React.CSSProperties}
              onClick={() => setDetail({ kind: 'secondary-item', key: res })}
            >
              <ResourceToken resource={res} mode="cell" />
              <div className={styles.resourceRowRight}>
                <span className={styles.resourceValue} style={{ color: SECONDARY_CSS[res] }}>
                  {resources.secondary[res]}
                </span>
                <span className={styles.resourceProduction}>+{resources.production.secondary[res]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
