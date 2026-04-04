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
  onBuryPeekedCrisis,
}: {
  gameState: GameState;
  humanPlayerId: string;
  onAcknowledge: () => void;
  onUseSpacecyAbility: () => void;
  onBuryPeekedCrisis: () => void;
}) {
  const [waiting, setWaiting] = useState(false);

  const crisis = gameState.currentCrisis;
  if (!crisis) return null;

  if (waiting) {
    return <WaitingPanel title="Crisis Acknowledged" subtitle="Planning orders…" />;
  }

  const player = gameState.players[humanPlayerId];
  const isSpacecy = player?.directorate === 'SPACECY';
  const canPeek = isSpacecy && !player.usedOncePerYear;
  const peeked = player?.peekedCrisis ?? null;
  const canBury = peeked !== null && player.resources.secondary.PC >= 1;

  return (
    <div className={styles.panel}>
      <div className={styles.panelTitle}>Crisis Pulse</div>
      <div className={styles.horizontalCard}>
        <CrisisCard card={crisis} layout="horizontal" />
      </div>

      {/* Step 1: offer peek before they've used the ability */}
      {canPeek && (
        <div className={styles.abilitySection}>
          <div className={styles.abilitySectionLabel}>SPACECY Ability — once per year</div>
          <p className={styles.panelSubtext}>
            Peek at the next crisis card in the deck.
          </p>
          <button className={styles.btnSecondary} onClick={onUseSpacecyAbility}>
            Peek Next Crisis
          </button>
        </div>
      )}

      {/* Step 2: after peeking, show the card and offer the bury */}
      {peeked && (
        <div className={styles.abilitySection}>
          <div className={styles.abilitySectionLabel}>Next Crisis</div>
          <div className={styles.horizontalCard}>
            <CrisisCard card={peeked} layout="horizontal" />
          </div>
          <div className={styles.abilityButtons}>
            <button
              className={styles.btnSecondary}
              disabled={!canBury}
              onClick={onBuryPeekedCrisis}
              title={canBury ? undefined : 'Requires 1 PC'}
            >
              Bury It (1 PC)
            </button>
            <span className={styles.panelSubtext} style={{ alignSelf: 'center' }}>
              or just Acknowledge below to keep it
            </span>
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
