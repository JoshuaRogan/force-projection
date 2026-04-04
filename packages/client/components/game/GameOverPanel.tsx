'use client';

import type { GameState } from '@fp/shared';
import styles from './GamePanel.module.css';

export function GameOverPanel({
  gameState,
  finalScores,
  onNewGame,
  primaryActionLabel = 'New Game',
}: {
  gameState: GameState;
  finalScores: { winnerId: string; scores: Record<string, number> } | null;
  onNewGame: () => void;
  primaryActionLabel?: string;
}) {
  if (!finalScores) {
    return <div className={styles.panel}><p className={styles.mutedText}>Computing final scores...</p></div>;
  }

  const sortedPlayers = Object.entries(finalScores.scores)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className={styles.panel}>
      <div className={styles.gameOverTitle}>Game Over</div>

      <table className={styles.scoresTable}>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>Directorate</th>
            <th style={{ textAlign: 'right' }}>SI</th>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map(([pid, si], i) => {
            const player = gameState.players[pid];
            const isWinner = pid === finalScores.winnerId;
            return (
              <tr key={pid} className={isWinner ? styles.winnerRow : undefined}>
                <td>{i + 1}</td>
                <td style={{ fontWeight: isWinner ? 700 : 400 }}>{player.name}</td>
                <td>{player.directorate}</td>
                <td className={styles.scoreValue}>{si}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <button type="button" onClick={onNewGame} className={styles.btnPrimary}>
        {primaryActionLabel}
      </button>
    </div>
  );
}
