import type { DirectorateId } from '@fp/shared';
import { DIRECTORATE_IDS } from '@fp/shared';
import type { SimulationResult } from './gameRunner.js';

export interface BalanceReport {
  totalGames: number;
  playerCount: number;

  // Per-directorate stats
  directorateStats: Record<DirectorateId, {
    gamesPlayed: number;
    wins: number;
    winRate: number;
    avgSI: number;
    medianSI: number;
    siStdDev: number;
    avgRank: number;
  }>;

  // Overall balance metrics
  winRateGini: number;       // 0 = perfect balance, 1 = one faction wins all
  siSpread: number;          // avg difference between highest and lowest SI per game
  avgGameSI: number;         // average winning SI across all games

  // Top-level assessment
  balanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  issues: string[];
}

export function analyzeResults(results: SimulationResult[]): BalanceReport {
  const totalGames = results.length;
  if (totalGames === 0) {
    throw new Error('No results to analyze');
  }

  const playerCount = results[0].playerCount;
  const expectedWinRate = 1 / playerCount;

  // Collect per-directorate data
  const dirData: Record<DirectorateId, { wins: number; played: number; scores: number[]; ranks: number[] }> = {} as any;
  for (const did of DIRECTORATE_IDS) {
    dirData[did] = { wins: 0, played: 0, scores: [], ranks: [] };
  }

  const siSpreads: number[] = [];
  const winningSIs: number[] = [];

  for (const result of results) {
    let maxSI = -Infinity;
    let minSI = Infinity;

    for (const p of result.players) {
      const data = dirData[p.directorate];
      data.played++;
      data.scores.push(p.finalSI);
      data.ranks.push(p.rank);
      if (p.won) data.wins++;

      maxSI = Math.max(maxSI, p.finalSI);
      minSI = Math.min(minSI, p.finalSI);
    }

    siSpreads.push(maxSI - minSI);
    winningSIs.push(maxSI);
  }

  // Compute per-directorate stats
  const directorateStats: BalanceReport['directorateStats'] = {} as any;
  for (const did of DIRECTORATE_IDS) {
    const d = dirData[did];
    if (d.played === 0) {
      directorateStats[did] = {
        gamesPlayed: 0, wins: 0, winRate: 0, avgSI: 0, medianSI: 0,
        siStdDev: 0, avgRank: 0,
      };
      continue;
    }

    const sortedScores = [...d.scores].sort((a, b) => a - b);

    directorateStats[did] = {
      gamesPlayed: d.played,
      wins: d.wins,
      winRate: d.wins / d.played,
      avgSI: mean(d.scores),
      medianSI: median(sortedScores),
      siStdDev: stdDev(d.scores),
      avgRank: mean(d.ranks),
    };
  }

  // Compute Gini coefficient on win rates
  const winRates = DIRECTORATE_IDS
    .map(did => directorateStats[did])
    .filter(s => s.gamesPlayed > 0)
    .map(s => s.winRate);
  const winRateGini = gini(winRates);

  // Overall metrics
  const siSpread = mean(siSpreads);
  const avgGameSI = mean(winningSIs);

  // Issues detection
  const issues: string[] = [];

  for (const did of DIRECTORATE_IDS) {
    const s = directorateStats[did];
    if (s.gamesPlayed < 10) continue;

    // Flag if win rate deviates more than 50% from expected
    if (s.winRate > expectedWinRate * 1.5) {
      issues.push(`${did} is overpowered: ${(s.winRate * 100).toFixed(1)}% win rate (expected ~${(expectedWinRate * 100).toFixed(0)}%)`);
    }
    if (s.winRate < expectedWinRate * 0.5) {
      issues.push(`${did} is underpowered: ${(s.winRate * 100).toFixed(1)}% win rate (expected ~${(expectedWinRate * 100).toFixed(0)}%)`);
    }
  }

  if (winRateGini > 0.2) {
    issues.push(`High faction imbalance (Gini: ${winRateGini.toFixed(3)})`);
  }

  if (siSpread < 2) {
    issues.push(`Games are too close — scores may not differentiate players enough`);
  }

  // Grade
  let grade: BalanceReport['balanceGrade'];
  if (winRateGini < 0.05 && issues.length === 0) grade = 'A';
  else if (winRateGini < 0.1 && issues.length <= 1) grade = 'B';
  else if (winRateGini < 0.2 && issues.length <= 2) grade = 'C';
  else if (winRateGini < 0.3) grade = 'D';
  else grade = 'F';

  return {
    totalGames,
    playerCount,
    directorateStats,
    winRateGini,
    siSpread,
    avgGameSI,
    balanceGrade: grade,
    issues,
  };
}

// === Math helpers ===

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function median(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((sum, x) => sum + (x - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

function gini(values: number[]): number {
  if (values.length < 2) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const m = mean(sorted);
  if (m === 0) return 0;

  let sum = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      sum += Math.abs(sorted[i] - sorted[j]);
    }
  }
  return sum / (2 * n * n * m);
}

// === Pretty-print report ===

export function formatReport(report: BalanceReport): string {
  const lines: string[] = [];

  lines.push(`\n=== BALANCE REPORT (${report.totalGames} games, ${report.playerCount} players) ===`);
  lines.push(`Grade: ${report.balanceGrade}`);
  lines.push(`Win Rate Gini: ${report.winRateGini.toFixed(4)} (0 = perfect, lower = better)`);
  lines.push(`Avg SI Spread: ${report.siSpread.toFixed(1)} (gap between 1st and last per game)`);
  lines.push(`Avg Winning SI: ${report.avgGameSI.toFixed(1)}`);
  lines.push('');

  lines.push('Directorate        | Games | Wins | Win%   | Avg SI | Med SI | StdDev | Avg Rank');
  lines.push('-'.repeat(85));

  for (const did of DIRECTORATE_IDS) {
    const s = report.directorateStats[did];
    if (s.gamesPlayed === 0) continue;
    lines.push(
      `${did.padEnd(19)} | ${String(s.gamesPlayed).padStart(5)} | ${String(s.wins).padStart(4)} | ` +
      `${(s.winRate * 100).toFixed(1).padStart(5)}% | ` +
      `${s.avgSI.toFixed(1).padStart(6)} | ${s.medianSI.toFixed(0).padStart(6)} | ` +
      `${s.siStdDev.toFixed(1).padStart(6)} | ${s.avgRank.toFixed(2).padStart(8)}`
    );
  }

  if (report.issues.length > 0) {
    lines.push('');
    lines.push('Issues:');
    for (const issue of report.issues) {
      lines.push(`  ! ${issue}`);
    }
  } else {
    lines.push('\nNo balance issues detected.');
  }

  lines.push('');
  return lines.join('\n');
}
