'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { GameEvent, GameState, ProgramCard } from '@fp/shared';
import { PROGRAM_CARDS } from '@fp/shared';
import { ProgramCard as ProgramCardView } from '@/components/cards/ProgramCard';
import styles from './ProgramDrawReveal.module.css';

function drawKey(e: Extract<GameEvent, { type: 'programsDrawn' }>): string {
  return `${e.fiscalYear}|${e.enteringQuarter}|${e.cardIds.join(',')}`;
}

function resolveDrawnCards(cardIds: string[], hand: ProgramCard[]): ProgramCard[] {
  return cardIds.map(id => {
    const fromHand = hand.find(c => c.id === id);
    if (fromHand) return fromHand;
    return PROGRAM_CARDS.find(c => c.id === id);
  }).filter((c): c is ProgramCard => c != null);
}

export function ProgramDrawReveal({
  gameState,
  humanPlayerId,
}: {
  gameState: GameState;
  humanPlayerId: string;
}) {
  const prevLogLen = useRef(-1);
  const seenKeys = useRef<Set<string>>(new Set());
  const [open, setOpen] = useState<{
    cards: ProgramCard[];
    fiscalYear: number;
    enteringQuarter: number;
  } | null>(null);

  const dismiss = useCallback(() => setOpen(null), []);

  useEffect(() => {
    const log = gameState.log;
    const hand = gameState.players[humanPlayerId]?.hand ?? [];

    if (prevLogLen.current < 0) {
      for (const e of log) {
        if (e.type === 'programsDrawn' && e.playerId === humanPlayerId) {
          seenKeys.current.add(drawKey(e));
        }
      }
      prevLogLen.current = log.length;
      return;
    }

    if (log.length < prevLogLen.current) {
      prevLogLen.current = 0;
      seenKeys.current.clear();
    }

    for (let i = prevLogLen.current; i < log.length; i++) {
      const e = log[i];
      if (e.type !== 'programsDrawn' || e.playerId !== humanPlayerId) continue;
      const key = drawKey(e);
      if (seenKeys.current.has(key)) continue;
      seenKeys.current.add(key);
      const cards = resolveDrawnCards(e.cardIds, hand);
      if (cards.length === 0) continue;
      setOpen({
        cards,
        fiscalYear: e.fiscalYear,
        enteringQuarter: e.enteringQuarter,
      });
    }

    prevLogLen.current = log.length;
  }, [gameState.log, gameState.players, humanPlayerId]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') dismiss();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, dismiss]);

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="program-draw-title"
      onClick={dismiss}
    >
      <div className={styles.panel} onClick={ev => ev.stopPropagation()}>
        <button type="button" className={styles.close} onClick={dismiss} aria-label="Close">
          ✕
        </button>
        <h2 id="program-draw-title" className={styles.title}>
          New programs
        </h2>
        <p className={styles.subtitle}>
          Year {open.fiscalYear}, Q{open.enteringQuarter} — added to your hand
        </p>
        <div className={styles.cardsRow}>
          {open.cards.map(card => (
            <div key={card.id} className={styles.cardWrap}>
              <ProgramCardView card={card} layout="vertical" />
            </div>
          ))}
        </div>
        <div className={styles.footer}>
          <button type="button" className={styles.continueBtn} onClick={dismiss}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
