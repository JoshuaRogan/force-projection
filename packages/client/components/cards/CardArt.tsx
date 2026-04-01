'use client';

import { useState } from 'react';
import styles from './Cards.module.css';
import { CARD_ART_VARIANTS } from './cardArtVariants';

export type CardArtType = 'programs' | 'contracts' | 'agendas' | 'crises';

interface CardArtProps {
  id: string;
  type: CardArtType;
  name: string;
}

export function CardArt({ id, type, name }: CardArtProps) {
  const [failed, setFailed] = useState(false);
  const variant = CARD_ART_VARIANTS[id] ?? 1;
  const src = `/cards/${type}/${id}-v${variant}.png`;

  return (
    <div className={`${styles.cardArtSection} ${styles[`cardArt_${type}`]}`}>
      {failed ? (
        <div className={styles.cardArtPlaceholder} aria-label={name}>
          <span className={styles.cardArtPlaceholderLabel}>{name}</span>
        </div>
      ) : (
        <img
          src={src}
          alt={name}
          className={styles.cardArtImage}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
