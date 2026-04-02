import type { TheaterId, TheaterPresence } from '@fp/shared';
import { THEATER_NAMES, calcStrength } from '@fp/shared';
import styles from './TheaterBoard.module.css';

interface PlayerPresenceData {
  playerId: string;
  playerName: string;
  color: string;
  presence: TheaterPresence;
  isHuman?: boolean;
}

// Inline SVG icons for presence types
function BaseIcon() {
  return (
    <svg viewBox="0 0 20 20" width={11} height={11} fill="currentColor" aria-hidden="true">
      <rect x="8.5" y="3" width="1.5" height="11" />
      <path d="M10 3.5 L16 6.5 L10 9 Z" />
      <rect x="4" y="15" width="12" height="1.5" rx="0.5" />
    </svg>
  );
}

function FwdOpsIcon() {
  return (
    <svg viewBox="0 0 20 20" width={11} height={11} fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M4 15 A8 8 0 0 1 16 15 L14.5 15 A6.5 6.5 0 0 0 5.5 15 Z" />
      <rect x="9.3" y="9.5" width="1.4" height="5.5" />
      <circle cx="10" cy="9" r="1.5" />
      <path fillRule="evenodd" d="M7 6 A4 4 0 0 1 13 6 L12 6.8 A2.8 2.8 0 0 0 8 6.8 Z" />
    </svg>
  );
}

function AllianceIcon() {
  return (
    <svg viewBox="0 0 20 20" width={11} height={11} fill="currentColor" aria-hidden="true">
      <path d="M2 9 L6 7 L8 8 L8 11 L9 12 L7 13 L5 12 L2 13 Z" />
      <path d="M18 9 L14 7 L12 8 L12 11 L11 12 L13 13 L15 12 L18 13 Z" />
      <path d="M8 8 L12 8 L12 12 L8 12 Z" />
    </svg>
  );
}

function StationedIcon() {
  return (
    <svg viewBox="0 0 20 20" width={11} height={11} fill="currentColor" aria-hidden="true">
      <path d="M10 2 L12.5 7.5 L18 8.2 L14 12 L15 17.5 L10 14.8 L5 17.5 L6 12 L2 8.2 L7.5 7.5 Z" />
    </svg>
  );
}

export function TheaterTile({
  theaterId,
  players,
}: {
  theaterId: TheaterId;
  players: PlayerPresenceData[];
}) {
  const sorted = [...players]
    .map(p => ({ ...p, strength: calcStrength(p.presence) }))
    .filter(p => p.strength > 0)
    .sort((a, b) => b.strength - a.strength);

  const maxStrength = sorted.length > 0 ? sorted[0].strength : 0;

  return (
    <div className={styles.theater}>
      <div className={styles.theaterHeader}>
        <span className={styles.theaterName}>{THEATER_NAMES[theaterId]}</span>
        {sorted.length === 0 && (
          <span className={styles.theaterEmpty}>Uncontested</span>
        )}
      </div>

      {sorted.length > 0 && (
        <div className={styles.presenceList}>
          {sorted.map(p => (
            <div
              key={p.playerId}
              className={[
                styles.presenceRow,
                p.strength === maxStrength ? styles.strengthLeader : '',
                p.isHuman ? styles.humanRow : '',
              ].filter(Boolean).join(' ')}
            >
              <span className={styles.presencePlayer} style={{ color: p.color }}>
                {p.playerName}
              </span>
              <span className={styles.presenceAssets}>
                {p.presence.bases > 0 && (
                  <span className={styles.assetChip} data-tip="Bases">
                    <BaseIcon />
                    <span>{p.presence.bases}</span>
                  </span>
                )}
                {p.presence.forwardOps > 0 && (
                  <span className={styles.assetChip} data-tip="Forward Ops">
                    <FwdOpsIcon />
                    <span>{p.presence.forwardOps}</span>
                  </span>
                )}
                {p.presence.alliances > 0 && (
                  <span className={styles.assetChip} data-tip="Alliances">
                    <AllianceIcon />
                    <span>{p.presence.alliances}</span>
                  </span>
                )}
                {p.presence.stationedStrength > 0 && (
                  <span className={styles.assetChip} data-tip="Stationed">
                    <StationedIcon />
                    <span>+{p.presence.stationedStrength}</span>
                  </span>
                )}
              </span>
              <span className={styles.presenceStrength}>{p.strength}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
