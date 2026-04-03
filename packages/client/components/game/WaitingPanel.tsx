'use client';

import styles from './GamePanel.module.css';

/**
 * Shown immediately after the player submits any action,
 * while waiting for other players / server resolution.
 */
export function WaitingPanel({
  title,
  lines,
  subtitle = 'Waiting for other players\u2026',
}: {
  title: string;
  lines?: string[];
  subtitle?: string;
}) {
  return (
    <div className={styles.waitingPanel}>
      <div className={styles.waitingSpinner} aria-hidden="true" />
      <div className={styles.waitingTitle}>{title}</div>
      {lines && lines.length > 0 && (
        <div className={styles.waitingOrders}>
          {lines.map((line, i) => (
            <div key={i} className={styles.waitingOrder}>
              <span className={styles.waitingOrderNum}>{i + 1}</span>
              <span className={styles.waitingOrderName}>{line}</span>
            </div>
          ))}
        </div>
      )}
      <p className={styles.waitingSubtext}>{subtitle}</p>
    </div>
  );
}
