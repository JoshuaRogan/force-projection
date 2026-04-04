'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import styles from '../join/[id]/join.module.css';

interface GameSummary {
  id: string;
  phase: { type: string; quarter?: number; step?: string };
  fiscalYear: number;
  finished: boolean;
  players: { id: string; name: string; directorate: string; si: number }[];
}

const DIRECTORATE_COLORS: Record<string, string> = {
  NAVSEA: 'var(--color-navsea)',
  AIRCOM: 'var(--color-aircom)',
  MARFOR: 'var(--color-marfor)',
  SPACECY: 'var(--color-spacecy)',
  TRANSCOM: 'var(--color-transcom)',
};

function normalizeGameSummary(raw: unknown): GameSummary | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = o.id;
  if (id === undefined || id === null) return null;
  const idStr = String(id);
  const phase = o.phase;
  const p =
    phase && typeof phase === 'object'
      ? (phase as { type?: string; quarter?: number; step?: string })
      : { type: 'unknown' };
  const playersRaw = Array.isArray(o.players) ? o.players : [];
  const players = playersRaw.map((row) => {
    const pr = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
    return {
      id: String(pr.id ?? ''),
      name: String(pr.name ?? ''),
      directorate: String(pr.directorate ?? ''),
      si: Number(pr.si) || 0,
    };
  });
  return {
    id: idStr,
    phase: {
      type: typeof p.type === 'string' ? p.type : 'unknown',
      quarter: p.quarter,
      step: p.step,
    },
    fiscalYear: Number(o.fiscalYear) || 0,
    finished: Boolean(o.finished),
    players,
  };
}

function phaseLine(g: GameSummary): string {
  if (g.finished) return 'Game over';
  const p = g.phase;
  const y = g.fiscalYear;
  switch (p.type) {
    case 'congress':
      return `Year ${y} — Congressional budget`;
    case 'contractMarket':
      return `Year ${y} — Contract market`;
    case 'quarter':
      return `Year ${y}, Q${p.quarter ?? '?'} — ${p.step ?? 'Quarter'}`;
    case 'yearEnd':
      return `Year ${y} — Year end`;
    case 'setup':
      return 'Setup';
    default:
      return String(p.type ?? 'unknown');
  }
}

export default function GamesHubPage() {
  const [games, setGames] = useState<GameSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadGames = useCallback(() => {
    setError(null);
    fetch('/api/games')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to list games'))))
      .then((data: unknown) => {
        const list = Array.isArray(data) ? data : [];
        const normalized = list
          .map(normalizeGameSummary)
          .filter((g): g is GameSummary => g !== null);
        const sorted = [...normalized].sort((a, b) => Number(a.finished) - Number(b.finished));
        setGames(sorted);
      })
      .catch(() => setError('Could not load operations. Is the server configured (KV)?'));
  }, []);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  async function deleteGame(gameId: string) {
    const code = String(gameId).toUpperCase();
    if (
      !window.confirm(
        `Remove mission ${code} from the server? All players and spectators will lose this session.`,
      )
    ) {
      return;
    }
    setError(null);
    setDeletingId(gameId);
    try {
      const res = await fetch(`/api/games/${encodeURIComponent(gameId)}`, { method: 'DELETE' });
      if (!res.ok) {
        setError('Could not delete that operation.');
        return;
      }
      setGames((prev) => (prev ? prev.filter((g) => g.id !== gameId) : prev));
    } catch {
      setError('Could not delete that operation.');
    } finally {
      setDeletingId(null);
    }
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
          <span>ACTIVE OPERATIONS</span>
        </div>
        <div className={styles.sysBarRight}>
          <Link href="/" className={styles.copyBtn} style={{ textDecoration: 'none' }}>
            HOME
          </Link>
          <Link href="/lobby" className={styles.copyBtn} style={{ textDecoration: 'none' }}>
            NEW GAME
          </Link>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.classifBadge}>// Spectate or rejoin</div>
        <h1 className={styles.heading}>Operations board</h1>
        <p className={styles.sub}>
          Watch any mission as a spectator (no private info), rejoin if you lost the link, or remove a stale operation
          from the server.
        </p>

        {error && <div className={styles.loadError}>⚠ {error}</div>}

        {!error && games === null && (
          <div className={styles.loading}>
            <span className={styles.spinner} />
            <span>SCANNING NETWORK…</span>
          </div>
        )}

        {!error && games && games.length === 0 && (
          <div className={styles.loadError}>No active operations. Start one from the lobby.</div>
        )}

        {!error && games && games.length > 0 && (
          <ul className={styles.roster} style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {games.map((g) => (
              <li
                key={g.id}
                className={styles.slotRow}
                style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12, cursor: 'default' }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
                  <span className={styles.missionCode} style={{ marginRight: 8 }}>
                    {String(g.id).toUpperCase()}
                  </span>
                  {g.finished && (
                    <span className={styles.botBadge} style={{ opacity: 0.85 }}>
                      ENDED
                    </span>
                  )}
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    {phaseLine(g)}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {g.players.map((p) => {
                    const color = DIRECTORATE_COLORS[p.directorate] ?? 'var(--text-muted)';
                    return (
                      <span
                        key={p.id}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.62rem',
                          color,
                          border: `1px solid color-mix(in srgb, ${color} 40%, transparent)`,
                          padding: '4px 8px',
                          borderRadius: 4,
                        }}
                      >
                        {p.name} · {p.directorate} · {p.si} SI
                      </span>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                  <Link
                    href={`/game?gameId=${encodeURIComponent(g.id)}&spectator=1`}
                    className={styles.confirmBtn}
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    ▶ Watch (spectator)
                  </Link>
                  <Link
                    href={`/join/${encodeURIComponent(g.id)}`}
                    className={styles.proceedBtn}
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    ↩ Rejoin as player
                  </Link>
                  <button
                    type="button"
                    disabled={deletingId === g.id}
                    onClick={() => deleteGame(g.id)}
                    style={{
                      padding: '8px 16px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid color-mix(in srgb, var(--color-danger) 45%, transparent)',
                      borderRadius: 4,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.58rem',
                      fontWeight: 600,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--color-danger)',
                      cursor: deletingId === g.id ? 'wait' : 'pointer',
                      opacity: deletingId === g.id ? 0.65 : 1,
                    }}
                    title="Remove this game from the server"
                  >
                    {deletingId === g.id ? '…' : '✕ Remove'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
