'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { ProgramCard, ContractCard, CrisisCard, AgendaCard } from '@fp/shared';
import { ProgramCard as ProgramCardComp } from './ProgramCard';
import { ContractCard as ContractCardComp } from './ContractCard';
import { CrisisCard as CrisisCardComp } from './CrisisCard';
import { AgendaCard as AgendaCardComp } from './AgendaCard';
import styles from './Cards.module.css';

export type CardModalData =
  | { type: 'program'; card: ProgramCard }
  | { type: 'contract'; card: ContractCard }
  | { type: 'crisis'; card: CrisisCard }
  | { type: 'agenda'; card: AgendaCard };

interface CardModalContextType {
  showCard: (data: CardModalData) => void;
  closeCard: () => void;
}

const CardModalContext = createContext<CardModalContextType>({
  showCard: () => {},
  closeCard: () => {},
});

export function useCardModal() {
  return useContext(CardModalContext);
}

function CardModalOverlay({ data, onClose }: { data: CardModalData; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose} aria-label="Close">✕</button>
        {data.type === 'program' && <ProgramCardComp card={data.card} />}
        {data.type === 'contract' && <ContractCardComp card={data.card} />}
        {data.type === 'crisis' && <CrisisCardComp card={data.card} />}
        {data.type === 'agenda' && <AgendaCardComp card={data.card} />}
      </div>
    </div>
  );
}

export function CardModalProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<CardModalData | null>(null);

  const showCard = useCallback((data: CardModalData) => setCurrent(data), []);
  const closeCard = useCallback(() => setCurrent(null), []);

  return (
    <CardModalContext.Provider value={{ showCard, closeCard }}>
      {children}
      {current && <CardModalOverlay data={current} onClose={closeCard} />}
    </CardModalContext.Provider>
  );
}
