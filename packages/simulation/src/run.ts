import { runMonteCarlo, DEFAULT_MC_CONFIG, type MonteCarloConfig } from './monteCarlo.js';
import { analyzeResults, formatReport } from './stats.js';

// Parse CLI args
const args = process.argv.slice(2);
const config: MonteCarloConfig = { ...DEFAULT_MC_CONFIG };

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--games': case '-n':
      config.totalGames = parseInt(args[++i], 10);
      break;
    case '--players': case '-p':
      config.playerCount = parseInt(args[++i], 10);
      break;
    case '--years': case '-y':
      config.fiscalYears = parseInt(args[++i], 10);
      break;
    case '--seed': case '-s':
      config.baseSeed = parseInt(args[++i], 10);
      break;
    case '--stratified':
      config.stratified = true;
      break;
    case '--personality':
      config.personality = args[++i];
      break;
    case '--help': case '-h':
      console.log(`
Force Projection: Joint Command — Balance Simulator

Usage: npm run sim -- [options]

Options:
  -n, --games <N>          Number of games to simulate (default: 1000)
  -p, --players <N>        Players per game: 2-5 (default: 4)
  -y, --years <N>          Fiscal years per game: 1-5 (default: 4)
  -s, --seed <N>           Base RNG seed (default: 42)
  --stratified             Cycle through directorate combinations
  --personality <name>     Bot type: random|greedy|balanced|aggressive|defensive|mixed (default: balanced)
  -h, --help               Show this help
`);
      process.exit(0);
  }
}

console.log(`Running ${config.totalGames} games...`);
console.log(`  Players: ${config.playerCount}, Years: ${config.fiscalYears}, Seed: ${config.baseSeed}`);
console.log(`  Personality: ${config.personality}, Stratified: ${config.stratified}`);

const start = Date.now();
const results = runMonteCarlo(config);
const elapsed = ((Date.now() - start) / 1000).toFixed(1);

console.log(`Completed in ${elapsed}s (${(config.totalGames / parseFloat(elapsed)).toFixed(0)} games/sec)`);

const report = analyzeResults(results);
console.log(formatReport(report));
