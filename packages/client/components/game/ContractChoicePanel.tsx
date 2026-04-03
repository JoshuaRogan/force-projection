'use client';

import { useState } from 'react';
import type { GameState } from '@fp/shared';
import { ContractCard, useCardModal } from '../cards';
import { WaitingPanel } from './WaitingPanel';
import styles from './GamePanel.module.css';

export function ContractChoicePanel({
  gameState,
  humanPlayerId,
  onSubmitChoice,
}: {
  gameState: GameState;
  humanPlayerId: string;
  onSubmitChoice: (contractId: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string>('');
  const [waiting, setWaiting] = useState(false);
  const { showCard } = useCardModal();

  const player = gameState.players[humanPlayerId];
  const pending = player.pendingContractDraw;
  const alreadyChose = !pending || pending.length === 0;
  const maxContracts = gameState.config.maxActiveContracts;
  const atMaxContracts = player.contracts.length >= maxContracts;

  if (waiting || alreadyChose) {
    const chosenName = pending?.find(c => c.id === selectedId)?.name;
    return (
      <WaitingPanel
        title="Contract Chosen"
        lines={chosenName ? [chosenName] : undefined}
        subtitle="Waiting for other players\u2026"
      />
    );
  }

  // At max active contracts the order resolves to +1 SI, not a new contract — offer that explicitly if a draw is pending.
  if (atMaxContracts) {
    return (
      <div className={styles.panel}>
        <div className={styles.panelTitle}>Contracting — at contract limit</div>
        <p className={styles.panelSubtext}>
          You already have {maxContracts} active contracts. The Contracting order grants +1 SI instead of taking a new
          contract. Drawn cards are returned to the bottom of the deck.
        </p>
        <button
          className={styles.btnPrimary}
          onClick={() => {
            setWaiting(true);
            onSubmitChoice(pending[0]!.id);
          }}
        >
          Gain +1 SI
        </button>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelTitle}>Contracting — Keep 1 of {pending.length}</div>
      <p className={styles.panelSubtext}>
        Click a card for full details. Select one to keep — the other goes to the bottom of the deck.
      </p>
      <div className={styles.contractGrid}>
        {pending.map(card => (
          <div key={card.id} className={styles.contractEntry}>
            <div
              className={[
                styles.contractClickable,
                styles.horizontalCard,
                selectedId === card.id ? styles.contractSelected : '',
              ].filter(Boolean).join(' ')}
              onClick={() => showCard({ type: 'contract', card })}
              role="button"
              tabIndex={0}
            >
              <div className={styles.contractClickHint}>
                {selectedId === card.id ? '\u2713 Selected' : 'Click for details'}
              </div>
              <ContractCard card={card} layout="horizontal" />
            </div>
            <button
              className={[
                styles.contractSelectBtn,
                selectedId === card.id ? styles.contractSelectBtnActive : '',
              ].filter(Boolean).join(' ')}
              onClick={() => setSelectedId(card.id)}
            >
              {selectedId === card.id ? '\u2713 Selected' : 'Select'}
            </button>
          </div>
        ))}
      </div>
      <button
        className={styles.btnPrimary}
        disabled={!selectedId}
        onClick={() => { if (selectedId) { setWaiting(true); onSubmitChoice(selectedId); } }}
      >
        Confirm Selection
      </button>
    </div>
  );
}
