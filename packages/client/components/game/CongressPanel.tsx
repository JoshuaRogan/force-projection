'use client';

import { useState } from 'react';
import type { GameState } from '@fp/shared';
import { AgendaCard } from '../cards';
import styles from './GamePanel.module.css';

export function CongressPanel({
  gameState,
  humanPlayerId,
  onVote,
}: {
  gameState: GameState;
  humanPlayerId: string;
  onVote: (amount: number, support: boolean) => void;
}) {
  const [amount, setAmount] = useState(1);
  const [support, setSupport] = useState(true);

  const agenda = gameState.currentAgenda;
  if (!agenda) return <div className={styles.panel}>No agenda to vote on</div>;

  const player = gameState.players[humanPlayerId];
  const maxPC = player.resources.secondary.PC;
  const alreadyVoted = agenda.commitments[humanPlayerId] !== undefined;

  return (
    <div className={styles.panel}>
      <div className={styles.panelTitle}>Congressional Budget Vote</div>
      <div className={styles.voteLayout}>
        <AgendaCard card={agenda.agenda} />

        {alreadyVoted ? (
          <p className={styles.mutedText}>Vote submitted. Waiting for resolution...</p>
        ) : (
          <div className={styles.voteControls}>
            <div className={styles.voteSection}>
              <div className={styles.voteSectionLabel}>Position</div>
              <div className={styles.voteToggle}>
                <button
                  onClick={() => setSupport(true)}
                  className={`${styles.voteToggleBtn} ${support ? styles.voteToggleBtnSupport : ''}`}
                >
                  Support
                </button>
                <button
                  onClick={() => setSupport(false)}
                  className={`${styles.voteToggleBtn} ${!support ? styles.voteToggleBtnOppose : ''}`}
                >
                  Oppose
                </button>
              </div>
            </div>

            <div className={styles.voteSection}>
              <div className={styles.voteSectionLabel}>
                Commit PC <span className={styles.votePCHint}>(more = stronger vote)</span>
              </div>
              <div className={styles.pcChips}>
                {Array.from({ length: maxPC + 1 }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setAmount(i)}
                    className={`${styles.pcChip} ${amount === i ? styles.pcChipActive : ''}`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => onVote(amount, support)} className={styles.btnPrimary}>
              Submit Vote
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
