'use client';

import { useState } from 'react';
import type { GameState } from '@fp/shared';
import { ContractCard } from '../cards';
import { checkRequirements } from '../../utils/checkRequirements';
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

  const player = gameState.players[humanPlayerId];
  const maxContracts = gameState.config.maxActiveContracts;
  const alreadyHeld = player.contracts.length;
  const canSelectMore = selectedIds.length + alreadyHeld < maxContracts;
  const contracts = gameState.contractMarket;

  const toggle = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : canSelectMore ? [...prev, id] : prev
    );
  };

  const totalAfterDone = alreadyHeld + selectedIds.length;

  return (
    <div className={styles.panel}>
      <div className={styles.panelTitle}>Contract Market</div>
      <p className={styles.panelSubtext}>
        {contracts.length === 0
          ? 'No contracts available.'
          : `Select up to ${maxContracts - alreadyHeld} contract${maxContracts - alreadyHeld !== 1 ? 's' : ''}. Click a selected contract to deselect it.`
        }
      </p>

      {contracts.length > 0 ? (
        <div className={styles.contractGrid}>
          {contracts.map(card => {
            const isSelected = selectedIds.includes(card.id);
            const isDisabled = !isSelected && !canSelectMore;
            return (
              <div
                key={card.id}
                className={[
                  styles.contractClickable,
                  isSelected ? styles.contractSelected : '',
                  isDisabled ? styles.contractDisabled : '',
                ].filter(Boolean).join(' ')}
                onClick={() => !isDisabled && toggle(card.id)}
                role="button"
                tabIndex={isDisabled ? undefined : 0}
              >
                <div className={styles.contractClickHint}>
                  {isSelected ? '✓ Selected — click to remove' : isDisabled ? 'Slots full' : 'Click to select'}
                </div>
                <ContractCard card={card} fulfillment={checkRequirements(card, player)} />
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyState}>All contracts have been taken</div>
      )}

      <button onClick={() => onEndMarket(selectedIds)} className={styles.btnPrimary}>
        Done ({totalAfterDone}/{maxContracts} contracts)
      </button>
    </div>
  );
}
