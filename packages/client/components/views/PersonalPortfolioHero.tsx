'use client';

import type { PlayerState, GameState } from '@fp/shared';
import { useCardModal } from '@/components/cards/CardModalContext';
import { ProgramVerticalCard, ProgramVerticalEmpty } from '@/components/dashboard/HandTray';
import { evaluateSustainStatus } from '@/utils/sustainStatus';
import dashStyles from '@/components/dashboard/Dashboard.module.css';
import styles from './PersonalView.module.css';

export function PersonalPortfolioHero({
  player,
  gameState,
}: {
  player: PlayerState;
  gameState: GameState;
}) {
  const { showCard } = useCardModal();
  const { portfolio } = player;

  return (
    <section className={styles.portfolioStripPanel} aria-label="Active programs and pipeline">
      <div className={styles.portfolioStripBlock}>
        <h2 className={styles.portfolioStripTitle}>Active programs</h2>
        <div className={dashStyles.handList}>
          {portfolio.active.map((slot, i) =>
            slot ? (
              <ProgramVerticalCard
                key={slot.card.id + String(i)}
                card={slot.card}
                metaLine="Active"
                onClick={() =>
                  showCard({
                    type: 'program',
                    card: slot.card,
                    sustainStatus: evaluateSustainStatus(slot, player, gameState),
                  })
                }
              />
            ) : (
              <ProgramVerticalEmpty key={`a-${i}`} label="Empty" />
            ),
          )}
        </div>
      </div>

      <div className={styles.portfolioStripBlock}>
        <h2 className={styles.portfolioStripTitle}>Pipeline</h2>
        <div className={dashStyles.handList}>
          {portfolio.pipeline.map((slot, i) =>
            slot ? (
              <ProgramVerticalCard
                key={slot.card.id + String(i)}
                card={slot.card}
                metaLine={`Year ${slot.yearsInPipeline ?? 0} in pipeline`}
                onClick={() => showCard({ type: 'program', card: slot.card })}
              />
            ) : (
              <ProgramVerticalEmpty key={`p-${i}`} label="Empty" />
            ),
          )}
        </div>
      </div>
    </section>
  );
}
