'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { DirectorateId } from '@fp/shared';
import styles from './lobby.module.css';

interface SlotConfig {
  directorate: DirectorateId | null;
  isBot: boolean;
  personality: 'balanced' | 'greedy' | 'aggressive' | 'random';
}

const DIRECTORATES: { id: DirectorateId; label: string; color: string; domain: string }[] = [
  { id: 'NAVSEA',  label: 'NAVSEA',  color: 'var(--color-navsea)',  domain: 'SEA' },
  { id: 'AIRCOM',  label: 'AIRCOM',  color: 'var(--color-aircom)',  domain: 'AIR' },
  { id: 'MARFOR',  label: 'MARFOR',  color: 'var(--color-marfor)',  domain: 'EXP' },
  { id: 'SPACECY', label: 'SPACECY', color: 'var(--color-spacecy)', domain: 'SPC' },
  { id: 'TRANSCOM',label: 'TRANSCOM',color: 'var(--color-transcom)',domain: 'LOG' },
];

const PERSONALITIES = ['balanced', 'greedy', 'aggressive', 'random'] as const;

export default function LobbyPage() {
  const router = useRouter();
  const [slots, setSlots] = useState<SlotConfig[]>([
    { directorate: null, isBot: false, personality: 'balanced' },
    { directorate: null, isBot: false, personality: 'balanced' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usedDirectorates = slots.map(s => s.directorate).filter(Boolean) as DirectorateId[];

  function updateSlot(i: number, patch: Partial<SlotConfig>) {
    setSlots(prev => prev.map((s, idx) => idx === i ? { ...s, ...patch } : s));
  }

  function addSlot() {
    if (slots.length >= 4) return;
    setSlots(prev => [...prev, { directorate: null, isBot: false, personality: 'balanced' }]);
  }

  function removeSlot(i: number) {
    if (slots.length <= 2) return;
    setSlots(prev => prev.filter((_, idx) => idx !== i));
  }

  async function deploy() {
    setError(null);

    if (slots.some(s => !s.directorate)) {
      setError('All slots must have a directorate selected.');
      return;
    }
    if (slots.every(s => s.isBot)) {
      setError('At least one human player is required.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: slots.map(s => ({
          directorate: s.directorate,
          isBot: s.isBot,
          personality: s.personality,
        })) }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Deployment failed.');
        return;
      }

      const data = await res.json();
      const firstHuman = data.slots.find((s: { isBot: boolean; playerId: string }) => !s.isBot);
      router.push(`/join/${data.gameId}?mine=${firstHuman.playerId}`);
    } catch {
      setError('Network error — check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.grid} />
      <div className={styles.scanlines} />

      <div className={styles.domainStrip}>
        {DIRECTORATES.map(d => (
          <span key={d.id} style={{ background: d.color }} />
        ))}
      </div>

      <header className={styles.sysBar}>
        <div className={styles.sysBarLeft}>
          <span className={styles.sysDot} />
          <span>// Force Projection Command Network</span>
          <span className={styles.sysSep}>|</span>
          <span>MISSION SETUP</span>
        </div>
        <div className={styles.sysBarRight}>
          <Link href="/games" className={styles.sysBarLink}>
            Find game / rejoin
          </Link>
          <span className={styles.sysSep}>|</span>
          <span>CLEARANCE: COMMANDER</span>
          <span className={styles.sysSep}>|</span>
          <span>FPJC-REFORGED</span>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.classifBadge}>// Mission Configuration</div>
        <h1 className={styles.heading}>Deploy New Operation</h1>
        <p className={styles.sub}>Configure command slots, assign directorates, and authorize deployment.</p>

        <div className={styles.slots}>
          {slots.map((slot, i) => {
            const isSelected = (d: DirectorateId) => slot.directorate === d;
            const isDisabled = (d: DirectorateId) => usedDirectorates.includes(d) && slot.directorate !== d;
            const dirInfo = DIRECTORATES.find(d => d.id === slot.directorate);

            return (
              <div
                key={i}
                className={styles.slotCard}
                style={dirInfo ? { '--slot-color': dirInfo.color } as React.CSSProperties : undefined}
              >
                <div className={styles.slotHeader}>
                  <span className={styles.slotNum}>SLOT {String(i + 1).padStart(2, '0')}</span>
                  {slots.length > 2 && (
                    <button className={styles.removeBtn} onClick={() => removeSlot(i)} aria-label="Remove slot">×</button>
                  )}
                </div>

                <div className={styles.modeToggle}>
                  <button
                    className={`${styles.modeBtn} ${!slot.isBot ? styles.modeBtnActive : ''}`}
                    onClick={() => updateSlot(i, { isBot: false })}
                  >
                    HUMAN
                  </button>
                  <button
                    className={`${styles.modeBtn} ${slot.isBot ? styles.modeBtnActive : ''}`}
                    onClick={() => updateSlot(i, { isBot: true })}
                  >
                    BOT
                  </button>
                </div>

                <div className={styles.dirLabel}>DIRECTORATE</div>
                <div className={styles.dirGrid}>
                  {DIRECTORATES.map(d => (
                    <button
                      key={d.id}
                      className={`${styles.dirChip} ${isSelected(d.id) ? styles.dirChipActive : ''} ${isDisabled(d.id) ? styles.dirChipDisabled : ''}`}
                      style={isSelected(d.id) ? { '--chip-color': d.color } as React.CSSProperties : undefined}
                      onClick={() => !isDisabled(d.id) && updateSlot(i, { directorate: d.id })}
                      disabled={isDisabled(d.id)}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                {slot.isBot && (
                  <>
                    <div className={styles.dirLabel}>PERSONALITY</div>
                    <div className={styles.personalityGrid}>
                      {PERSONALITIES.map(p => (
                        <button
                          key={p}
                          className={`${styles.personalityChip} ${slot.personality === p ? styles.personalityChipActive : ''}`}
                          onClick={() => updateSlot(i, { personality: p })}
                        >
                          {p.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {dirInfo && (
                  <div className={styles.slotFooter} style={{ color: dirInfo.color }}>
                    ▸ {dirInfo.domain} DOMAIN ASSIGNED
                  </div>
                )}
              </div>
            );
          })}

          {slots.length < 4 && (
            <button className={styles.addSlot} onClick={addSlot}>
              <span className={styles.addSlotPlus}>+</span>
              <span>ADD SLOT</span>
            </button>
          )}
        </div>

        {error && <div className={styles.error}>⚠ {error}</div>}

        <div className={styles.deployRow}>
          <button className={styles.deployBtn} onClick={deploy} disabled={loading}>
            {loading ? (
              <><span className={styles.spinner} /> DEPLOYING…</>
            ) : (
              <>▶ DEPLOY OPERATION</>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
