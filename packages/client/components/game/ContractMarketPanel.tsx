'use client';

import { useState } from 'react';
import type { GameState } from '@fp/shared';
import { ContractCard, useCardModal } from '../cards';
import { checkRequirements } from '../../utils/checkRequirements';
import { WaitingPanel } from './WaitingPanel';
import styles from './GamePanel.module.css';

export function ContractMarketPanel({
  gameState,
  humanPlayerId,
  onEndMarket,
}: {
  gameState: GameState;
  humanPlayerId: string;
  onEndMarket: (chosenIds: string[]) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [waiting, setWaiting] = useState(false);
  const { showCard } = useCardModal();

  const player = gameState.players[humanPlayerId];
  const maxContracts = gameState.config.maxActiveContracts;
  const alreadyHeld = player.contracts.length;
  const canSelectMore = selectedIds.length + alreadyHeld < maxContracts;
  const contracts = player.marketOffer;

  const toggle = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : canSelectMore ? [...prev, id] : prev
    );
  };

  const totalAfterDone = alreadyHeld + selectedIds.length;
  const alreadySubmitted = player.marketSelections !== null;

  if (waiting || alreadySubmitted) {
    const chosen = (alreadySubmitted ? player.marketSelections : selectedIds) ?? [];
    const lines = chosen.length === 0
      ? ['Passing this market']
      : chosen.map(id => contracts.find(c => c.id === id)?.name ?? id);
    return <WaitingPanel title="Selections Submitted" lines={lines} />;
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelTitle}>Contract Market</div>
      <p className={styles.panelSubtext}>
          {contracts.length === 0
          ? 'No contracts available.'
          : `Select up to ${maxContracts - alreadyHeld} contract${maxContracts - alreadyHeld !== 1 ? 's' : ''} from your offer. Click a card for details.`
        }
      </p>

      {contracts.length > 0 ? (
        <div className={styles.contractGrid}>
          {contracts.map(card => {
            const isSelected = selectedIds.includes(card.id);
            const isDisabled = !isSelected && !canSelectMore;
            return (
              <div key={card.id} className={styles.contractEntry}>
                <div
                  className={[
                    styles.contractClickable,
                    isSelected ? styles.contractSelected : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => showCard({ type: 'contract', card })}
                  role="button"
                  tabIndex={0}
                >
                  <div className={styles.contractClickHint}>
                    {isSelected ? '✓ Selected' : 'Click for details'}
                  </div>
                  <ContractCard card={card} fulfillment={checkRequirements(card, player)} />
                </div>
                <button
                  className={[
                    styles.contractSelectBtn,
                    isSelected ? styles.contractSelectBtnActive : '',
                    isDisabled ? styles.contractSelectBtnDisabled : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => !isDisabled && toggle(card.id)}
                  disabled={isDisabled}
                >
                  {isSelected ? '✓ Selected' : isDisabled ? 'Slots full' : 'Select'}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyState}>No contracts in your offer.</div>
      )}

      <button
        onClick={() => { setWaiting(true); onEndMarket(selectedIds); }}
        className={styles.btnPrimary}
      >
        Done ({totalAfterDone}/{maxContracts} contracts)
      </button>
    </div>
  );
}
