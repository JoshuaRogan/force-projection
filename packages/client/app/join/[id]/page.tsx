'use client';

import { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './join.module.css';

interface SlotInfo {
  playerId: string;
  name: string;
  isBot: boolean;
  directorate: string;
}

interface JoinData {
  gameId: string;
  phase: { type: string };
  slots: SlotInfo[];
}

const DIRECTORATE_COLORS: Record<string, string> = {
  NAVSEA:   'var(--color-navsea)',
  AIRCOM:   'var(--color-aircom)',
  MARFOR:   'var(--color-marfor)',
  SPACECY:  'var(--color-spacecy)',
  TRANSCOM: 'var(--color-transcom)',
};

export default function JoinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: gameId } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const mine = searchParams.get('mine'); // pre-assigned slot for game creator

  const [joinData, setJoinData] = useState<JoinData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(mine);
  const [name, setName] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [confirmedPlayerId, setConfirmedPlayerId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isRejoin = !mine;

  useEffect(() => {
    fetch(`/api/games/${gameId}/join`)
      .then(r => r.ok ? r.json() : Promise.reject('Game not found'))
      .then(setJoinData)
      .catch(() => setLoadError('Game not found or has expired.'));
  }, [gameId]);

  async function confirm() {
    if (!selectedSlot || !name.trim()) return;
    setSubmitError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/games/${gameId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: selectedSlot, name: name.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSubmitError(data.error ?? 'Failed to confirm identity.');
        return;
      }
      setConfirmed(true);
      setConfirmedPlayerId(selectedSlot);
    } catch {
      setSubmitError('Network error.');
    } finally {
      setSubmitting(false);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.origin + `/join/${gameId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={styles.root}>
      <div className={styles.grid} />
      <div className={styles.scanlines} />

      <div className={styles.domainStrip}>
        {Object.values(DIRECTORATE_COLORS).map((c, i) => (
          <span key={i} style={{ background: c }} />
        ))}
      </div>

      <header className={styles.sysBar}>
        <div className={styles.sysBarLeft}>
          <span className={styles.sysDot} />
          <span>// Force Projection Command Network</span>
          <span className={styles.sysSep}>|</span>
          <span>{isRejoin ? 'REJOIN OPERATION' : 'COMMANDER ASSIGNMENT'}</span>
        </div>
        <div className={styles.sysBarRight}>
          <span className={styles.missionCode}>MISSION CODE: {gameId.toUpperCase()}</span>
        </div>
      </header>

      <main className={styles.main}>
        {loadError ? (
          <div className={styles.loadError}>⚠ {loadError}</div>
        ) : !joinData ? (
          <div className={styles.loading}>
            <span className={styles.spinner} />
            <span>RETRIEVING MISSION BRIEFING…</span>
          </div>
        ) : (
          <>
            <div className={styles.classifBadge}>
              {isRejoin ? '// Rejoin in Progress' : '// New Operation Briefing'}
            </div>
            <h1 className={styles.heading}>
              {isRejoin ? 'Rejoin Operation' : 'Commander Assignment'}
            </h1>

            {/* Share link */}
            <div className={styles.shareRow}>
              <span className={styles.shareLabel}>INVITE LINK</span>
              <div className={styles.shareBox}>
                <span className={styles.shareUrl}>{typeof window !== 'undefined' ? window.location.origin : ''}/join/{gameId}</span>
                <button className={styles.copyBtn} onClick={copyLink}>
                  {copied ? '✓ COPIED' : 'COPY'}
                </button>
              </div>
            </div>

            {/* Slot roster */}
            <div className={styles.rosterLabel}>COMMAND ROSTER</div>
            <div className={styles.roster}>
              {joinData.slots.map(slot => {
                const color = DIRECTORATE_COLORS[slot.directorate] ?? 'var(--text-muted)';
                const isMe = slot.playerId === mine;
                const isActive = selectedSlot === slot.playerId;
                const isNamed = slot.name && slot.name !== `Player ${joinData.slots.indexOf(slot) + 1}` && slot.name !== `Bot ${joinData.slots.indexOf(slot) + 1}`;
                const clickable = !slot.isBot && !confirmed;

                return (
                  <div
                    key={slot.playerId}
                    className={`${styles.slotRow} ${isActive ? styles.slotRowActive : ''} ${isMe ? styles.slotRowMine : ''} ${clickable ? styles.slotRowClickable : ''}`}
                    style={{ '--slot-color': color } as React.CSSProperties}
                    onClick={() => clickable && setSelectedSlot(slot.playerId)}
                  >
                    <div className={styles.slotDot} style={{ background: color }} />
                    <div className={styles.slotInfo}>
                      <span className={styles.slotDirectorate} style={{ color }}>{slot.directorate}</span>
                      <span className={styles.slotName}>
                        {slot.isBot
                          ? slot.name
                          : isNamed
                            ? slot.name
                            : '— AWAITING COMMANDER —'}
                      </span>
                    </div>
                    <div className={styles.slotBadges}>
                      {slot.isBot && <span className={styles.botBadge}>BOT</span>}
                      {isMe && !confirmed && <span className={styles.youBadge}>YOU</span>}
                      {isMe && confirmed && <span className={styles.readyBadge}>✓ READY</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Identity confirmation */}
            {!confirmed && selectedSlot && !joinData.slots.find(s => s.playerId === selectedSlot)?.isBot && (
              <div className={styles.identityBox}>
                <div className={styles.identityLabel}>ENTER CALLSIGN</div>
                <div className={styles.identityRow}>
                  <input
                    className={styles.nameInput}
                    type="text"
                    placeholder="YOUR CALLSIGN"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && confirm()}
                    maxLength={24}
                    autoFocus
                  />
                  <button
                    className={styles.confirmBtn}
                    onClick={confirm}
                    disabled={submitting || !name.trim()}
                  >
                    {submitting ? <span className={styles.spinner} /> : '▶ CONFIRM IDENTITY'}
                  </button>
                </div>
                {submitError && <div className={styles.submitError}>⚠ {submitError}</div>}
              </div>
            )}

            {/* Proceed button after confirmation */}
            {confirmed && confirmedPlayerId && (
              <div className={styles.proceedRow}>
                <div className={styles.proceedMsg}>Identity confirmed. Ready for deployment.</div>
                <button
                  className={styles.proceedBtn}
                  onClick={() => router.push(`/game?gameId=${gameId}&player=${confirmedPlayerId}`)}
                >
                  ▶ PROCEED TO BRIEFING
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
