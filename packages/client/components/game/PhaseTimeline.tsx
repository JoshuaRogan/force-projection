'use client';

import type { GameState, GamePhase } from '@fp/shared';
import styles from './PhaseTimeline.module.css';

interface PhaseStep {
  id: string;
  label: string;
  shortLabel: string;
  isActive: boolean;
  isCompleted: boolean;
  isMajor: boolean; // major phases get bigger display
}

function getPhaseSteps(state: GameState): PhaseStep[] {
  const phase = state.phase;
  const steps: PhaseStep[] = [];

  // Congress
  steps.push({
    id: 'congress',
    label: 'Congress',
    shortLabel: 'Vote',
    isActive: phase.type === 'congress',
    isCompleted: isAfterPhase(phase, 'congress'),
    isMajor: true,
  });

  // Contract Market
  steps.push({
    id: 'contracts',
    label: 'Contracts',
    shortLabel: 'Market',
    isActive: phase.type === 'contractMarket',
    isCompleted: isAfterPhase(phase, 'contractMarket'),
    isMajor: true,
  });

  // Quarters 1-4
  for (let q = 1; q <= 4; q++) {
    const isQuarterActive = phase.type === 'quarter' && phase.quarter === q;
    const isQuarterDone = phase.type === 'quarter'
      ? phase.quarter > q
      : isAfterPhase(phase, 'quarter');

    steps.push({
      id: `q${q}`,
      label: `Quarter ${q}`,
      shortLabel: `Q${q}`,
      isActive: isQuarterActive,
      isCompleted: isQuarterDone,
      isMajor: true,
    });
  }

  // Year End
  steps.push({
    id: 'yearEnd',
    label: 'Year End',
    shortLabel: 'Score',
    isActive: phase.type === 'yearEnd',
    isCompleted: phase.type === 'gameEnd',
    isMajor: false,
  });

  return steps;
}

function isAfterPhase(current: GamePhase, target: string): boolean {
  const order = ['setup', 'congress', 'contractMarket', 'quarter', 'yearEnd', 'gameEnd'];
  const currentIdx = order.indexOf(current.type);
  const targetIdx = order.indexOf(target);
  return currentIdx > targetIdx;
}

function getQuarterSubstep(phase: GamePhase): string | null {
  if (phase.type !== 'quarter') return null;
  switch (phase.step) {
    case 'crisisPulse': return 'Crisis';
    case 'planOrders': return 'Plan Orders';
    case 'resolveOrders': return 'Resolving';
    case 'contractChoice': return 'Contracting';
    case 'cleanup': return 'Cleanup';
  }
}

export function PhaseTimeline({ gameState }: { gameState: GameState }) {
  const steps = getPhaseSteps(gameState);
  const year = gameState.fiscalYear;
  const maxYears = gameState.config.fiscalYears;
  const substep = getQuarterSubstep(gameState.phase);

  return (
    <div className={styles.timeline}>
      <div className={styles.yearBadge}>
        Year {year}/{maxYears}
      </div>
      <div className={styles.steps}>
        {steps.map((step, i) => (
          <div key={step.id} className={styles.stepWrapper}>
            {i > 0 && (
              <div className={`${styles.connector} ${step.isCompleted || step.isActive ? styles.connectorActive : ''}`} />
            )}
            <div
              className={[
                styles.step,
                step.isActive ? styles.stepActive : '',
                step.isCompleted ? styles.stepCompleted : '',
                step.isMajor ? styles.stepMajor : '',
              ].filter(Boolean).join(' ')}
              title={step.label}
            >
              <div className={styles.stepDot}>
                {step.isCompleted ? '\u2713' : ''}
              </div>
              <div className={styles.stepLabel}>
                {step.shortLabel}
                {step.isActive && substep && (
                  <span className={styles.substepLabel}>{substep}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
