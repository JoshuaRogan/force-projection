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
              <span className={styles.presenceDetails}>
                {p.presence.bases > 0 && `${p.presence.bases}B `}
                {p.presence.alliances > 0 && `${p.presence.alliances}A `}
                {p.presence.forwardOps > 0 && `${p.presence.forwardOps}F `}
                {p.presence.stationedStrength > 0 && `+${p.presence.stationedStrength}S`}
              </span>
              <span className={styles.presenceStrength}>{p.strength}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
