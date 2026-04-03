'use client';

import { useState } from 'react';
import type { GameState } from '@fp/shared';
import { CrisisCard } from '../cards';
import { WaitingPanel } from './WaitingPanel';
import styles from './GamePanel.module.css';

export function CrisisPulsePanel({
  gameState,
  humanPlayerId,
  onAcknowledge,
  onUseSpacecyAbility,
}: {
  gameState: GameState;
  humanPlayerId: string;
  onAcknowledge: () => void;
  onUseSpacecyAbility: (bury: boolean) => void;
}) {
  const [waiting, setWaiting] = useState(false);

  const crisis = gameState.currentCrisis;
  if (!crisis) return null;

  if (waiting) {
    return <WaitingPanel title="Crisis Acknowledged" subtitle="Planning orders\u2026" />;
  }

  const player = gameState.players[humanPlayerId];
  const isSpacecy = player?.directorate === 'SPACECY';
  const canUseAbility = isSpacecy && !player.usedOncePerYear;
  const canBury = canUseAbility && player.resources.secondary.PC >= 1;

  return (
    <div className={styles.panel}>
      <div className={styles.panelTitle}>Crisis Pulse</div>
      <CrisisCard card={crisis} />

      {canUseAbility && (
        <div className={styles.abilitySection}>
          <div className={styles.abilitySectionLabel}>SPACECY Ability (once per year)</div>
          <p className={styles.panelSubtext}>
            Peek at the next crisis. Pay 1 PC to bury it and draw a new one.
          </p>
          <div className={styles.abilityButtons}>
            <button
              className={styles.btnSecondary}
              onClick={() => onUseSpacecyAbility(false)}
            >
              Peek Only
            </button>
            <button
              className={styles.btnSecondary}
              disabled={!canBury}
              onClick={() => canBury && onUseSpacecyAbility(true)}
            >
              Bury (1 PC)
            </button>
          </div>
        </div>
      )}

      <button
        className={styles.btnPrimary}
        onClick={() => { setWaiting(true); onAcknowledge(); }}
      >
        Acknowledge &amp; Plan Orders
      </button>
    </div>
  );
}
