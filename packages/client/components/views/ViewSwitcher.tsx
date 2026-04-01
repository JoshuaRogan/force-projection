'use client';

import styles from './ViewSwitcher.module.css';

export type ViewMode = 'command' | 'personal' | 'strategic';

const VIEWS: { id: ViewMode; label: string }[] = [
  { id: 'command', label: 'COMMAND' },
  { id: 'personal', label: 'PERSONAL' },
  { id: 'strategic', label: 'STRATEGIC' },
];

export function ViewSwitcher({
  current,
  onChange,
}: {
  current: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  return (
    <div className={styles.switcher}>
      {VIEWS.map((v, i) => (
        <button
          key={v.id}
          className={`${styles.modeBtn} ${current === v.id ? styles.active : ''}`}
          onClick={() => onChange(v.id)}
        >
          <span className={styles.index}>0{i + 1}</span>
          {v.label}
        </button>
      ))}
    </div>
  );
}
