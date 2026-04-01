import type { Cost, BudgetLine, SecondaryResource } from '@fp/shared';
import { ResourceToken } from '../ui/ResourceToken';
import styles from './Cards.module.css';

export function CostDisplay({ cost, label }: { cost: Cost; label?: string }) {
  const budgetEntries = Object.entries(cost.budget).filter(([, v]) => v && v > 0) as [BudgetLine, number][];
  const secondaryEntries = (cost.secondary
    ? Object.entries(cost.secondary).filter(([, v]) => v && v > 0)
    : []) as [SecondaryResource, number][];

  if (budgetEntries.length === 0 && secondaryEntries.length === 0) {
    return label ? <span className={styles.costLabel}>{label}: Free</span> : null;
  }

  return (
    <div className={styles.costRow}>
      {label && <span className={styles.costLabel}>{label}:</span>}
      {budgetEntries.map(([key, val]) => (
        <ResourceToken key={key} resource={key} count={val} mode="chip" />
      ))}
      {secondaryEntries.map(([key, val]) => (
        <ResourceToken key={key} resource={key} count={val} mode="chip" />
      ))}
    </div>
  );
}
