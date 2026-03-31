import type { Cost } from '@fp/shared';
import styles from './Cards.module.css';

const BUDGET_LABELS: Record<string, string> = {
  A: 'Air', S: 'Sea', E: 'Exp', X: 'Spc', U: 'Sus',
};

const SECONDARY_LABELS: Record<string, string> = {
  M: 'Man', L: 'Log', I: 'Int', PC: 'PC',
};

export function CostDisplay({ cost, label }: { cost: Cost; label?: string }) {
  const budgetEntries = Object.entries(cost.budget).filter(([, v]) => v && v > 0);
  const secondaryEntries = cost.secondary
    ? Object.entries(cost.secondary).filter(([, v]) => v && v > 0)
    : [];

  if (budgetEntries.length === 0 && secondaryEntries.length === 0) {
    return label ? <span className={styles.costLabel}>{label}: Free</span> : null;
  }

  return (
    <div className={styles.costRow}>
      {label && <span className={styles.costLabel}>{label}:</span>}
      {budgetEntries.map(([key, val]) => (
        <span key={key} className={`badge badge-${key}`}>
          {val}{BUDGET_LABELS[key]}
        </span>
      ))}
      {secondaryEntries.map(([key, val]) => (
        <span key={key} className={`badge badge-${key}`}>
          {val}{SECONDARY_LABELS[key]}
        </span>
      ))}
    </div>
  );
}
