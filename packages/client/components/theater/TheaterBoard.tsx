import type { GameState, TheaterId } from '@fp/shared';
import { THEATER_IDS } from '@fp/shared';
import { TheaterTile } from './TheaterTile';
import styles from './TheaterBoard.module.css';

const DIRECTORATE_COLORS: Record<string, string> = {
  NAVSEA: 'var(--color-navsea)', AIRCOM: 'var(--color-aircom)',
  MARFOR: 'var(--color-marfor)', SPACECY: 'var(--color-spacecy)',
  TRANSCOM: 'var(--color-transcom)',
};

export function TheaterBoard({ gameState, humanPlayerId }: { gameState: GameState; humanPlayerId?: string }) {
  return (
    <div className={styles.board}>
      {THEATER_IDS.map(tid => (
        <TheaterTile
          key={tid}
          theaterId={tid}
          players={buildPlayerPresence(gameState, tid, humanPlayerId)}
        />
      ))}
    </div>
  );
}

function buildPlayerPresence(gs: GameState, theaterId: TheaterId, humanPlayerId?: string) {
  return gs.turnOrder.map(pid => {
    const player = gs.players[pid];
    return {
      playerId: pid,
      playerName: player.name,
      color: DIRECTORATE_COLORS[player.directorate] ?? 'var(--text-primary)',
      presence: player.theaterPresence[theaterId],
      isHuman: pid === humanPlayerId,
    };
  });
}
