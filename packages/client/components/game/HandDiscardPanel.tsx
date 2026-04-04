'use client';

import { useState, useMemo, type CSSProperties } from 'react';
import type { GameState } from '@fp/shared';
import { useCardModal } from '../cards';
import { CARD_ART_VARIANTS } from '../cards/cardArtVariants';
import { WaitingPanel } from './WaitingPanel';
import styles from './GamePanel.module.css';

const DOMAIN_COLORS: Record<string, string> = {
  AIR: 'var(--color-domain-air)', SEA: 'var(--color-domain-sea)',
  EXP: 'var(--color-domain-exp)', SPACE_CYBER: 'var(--color-domain-space-cyber)',
};

export function HandDiscardPanel({
  gameState,
  humanPlayerId,
  onSubmitDiscard,
}: {
  gameState: GameState;
  humanPlayerId: string;
  onSubmitDiscard: (cardIds: string[]) => void;
}) {
  const { showCard } = useCardModal();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [waiting, setWaiting] = useState(false);

  const player = gameState.players[humanPlayerId];
  const limit = gameState.config.handLimit;
  const excess = Math.max(0, player.hand.length - limit);

  const canConfirm = selected.size === excess && excess > 0;

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < excess) next.add(id);
      return next;
    });
  };

  const handKey = useMemo(
    () => player.hand.map(c => c.id).join(','),
    [player.hand],
  );

  if (waiting || excess === 0) {
    return (
      <WaitingPanel
        title={excess === 0 ? 'Hand OK' : 'Discards submitted'}
        subtitle="Waiting for other players…"
      />
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelTitle}>Discard to hand limit</div>
      <p className={styles.panelSubtext}>
        You have {player.hand.length} programs; limit is {limit}. Select {excess} to discard to the program discard pile.
        Tap a card for full details; use Select to mark discards.
      </p>
      <div className={styles.discardGrid} key={handKey}>
        {player.hand.map(card => {
          const isOn = selected.has(card.id);
          const domainColor = DOMAIN_COLORS[card.domain] ?? 'var(--text-muted)';
          const variant = CARD_ART_VARIANTS[card.id] ?? 1;
          const artSrc = `/cards/programs/${card.id}-v${variant}.png`;
          return (
            <div key={card.id} className={styles.discardEntry}>
              <button
                type="button"
                className={[
                  styles.discardCardBtn,
                  isOn ? styles.discardCardBtnSelected : '',
                ].filter(Boolean).join(' ')}
                style={{ '--domain-color': domainColor } as CSSProperties}
                onClick={() => toggle(card.id)}
              >
                <img src={artSrc} alt="" className={styles.discardCardArt} />
                <span className={styles.discardCardName}>{card.name}</span>
                {isOn && <span className={styles.discardCardBadge}>Discard</span>}
              </button>
              <button
                type="button"
                className={styles.discardDetailBtn}
                onClick={() => showCard({ type: 'program', card })}
              >
                Details
              </button>
            </div>
          );
        })}
      </div>
      <p className={styles.panelSubtext}>
        Selected: {selected.size} / {excess}
      </p>
      <button
        type="button"
        className={styles.btnPrimary}
        disabled={!canConfirm}
        onClick={() => {
          if (!canConfirm) return;
          setWaiting(true);
          onSubmitDiscard([...selected]);
        }}
      >
        Confirm discard
      </button>
    </div>
  );
}
