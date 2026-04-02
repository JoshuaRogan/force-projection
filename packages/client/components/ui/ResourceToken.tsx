'use client';
import type { BudgetLine, SecondaryResource } from '@fp/shared';
import { BUDGET_LINE_NAMES, SECONDARY_RESOURCE_NAMES } from '@fp/shared';
import { ResourceIcon } from '../icons/ResourceIcon';
import styles from './ResourceToken.module.css';

type ResourceKey = BudgetLine | SecondaryResource;

// Color CSS variables for each resource type — mirrors ResourcePanel.tsx
const RESOURCE_COLOR: Record<ResourceKey, string> = {
  A:  'var(--color-air)',
  S:  'var(--color-sea)',
  E:  'var(--color-exp)',
  X:  'var(--color-space)',
  U:  'var(--color-sustain)',
  M:  'var(--color-manpower)',
  L:  'var(--color-logistics)',
  I:  'var(--color-intel)',
  PC: 'var(--color-polcap)',
};

export function resourceColor(key: ResourceKey): string {
  return RESOURCE_COLOR[key];
}

export function resourceFullName(key: ResourceKey): string {
  if (key in BUDGET_LINE_NAMES) return BUDGET_LINE_NAMES[key as BudgetLine];
  return SECONDARY_RESOURCE_NAMES[key as SecondaryResource];
}

interface ResourceTokenProps {
  resource: ResourceKey;
  count?: number;
  /** chip: compact pill for inline costs | labeled: pill with full name | cell: flat row for panel headers */
  mode?: 'chip' | 'labeled' | 'cell';
  /** compact: in cell mode, hide the full name — shows [icon] KEY only */
  compact?: boolean;
  className?: string;
}

export function ResourceToken({ resource, count, mode = 'chip', compact, className }: ResourceTokenProps) {
  const color = RESOURCE_COLOR[resource];
  const fullName = resourceFullName(resource);
  const iconSize = mode === 'chip' ? 10 : mode === 'labeled' ? 12 : 11;

  if (mode === 'cell') {
    // Flat inline row: [icon] U · Sustain (or [icon] U when compact)
    return (
      <span
        className={`${styles.cellMode} ${className ?? ''}`}
        style={{ '--token-color': color } as React.CSSProperties}
        title={fullName}
      >
        <ResourceIcon resource={resource} size={iconSize} className={styles.cellIcon} />
        <span className={styles.cellKey}>{resource}</span>
        {!compact && <span className={styles.cellSep}>·</span>}
        {!compact && <span className={styles.cellName}>{fullName}</span>}
      </span>
    );
  }

  // chip or labeled — both render as a pill
  const label = mode === 'labeled' ? fullName : resource;

  return (
    <span
      className={`${styles.pill} ${mode === 'labeled' ? styles.pillLabeled : styles.pillChip} ${className ?? ''}`}
      style={{ '--token-color': color } as React.CSSProperties}
      title={fullName}
    >
      <ResourceIcon resource={resource} size={iconSize} className={styles.pillIcon} />
      {count !== undefined && <span className={styles.pillCount}>{count}</span>}
      <span className={styles.pillLabel}>{label}</span>
    </span>
  );
}
