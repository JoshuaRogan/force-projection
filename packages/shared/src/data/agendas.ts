import type { AgendaCard } from '../cards.js';
import prose from './cardProse.json';

const _prose = prose as Record<string, string>;

const _cards: AgendaCard[] = [
  {
    id: 'agenda-pivot-pacific',
    name: 'Pivot to the Pacific',
    description: 'Shift strategic focus to Indo-Pacific theater.',
    favoredBudgetLine: 'S',
    passEffects: [
      { type: 'reduceCost', description: 'Deploy in Indo-Pacific costs 1 less U', params: { theater: 'indoPacific', resource: 'U', amount: 1 } },
      { type: 'gainSI', description: '+1 SI for any player with a Base in Indo-Pacific', params: { condition: 'baseInTheater', theater: 'indoPacific', si: 1 } },
    ],
    failEffects: [
      { type: 'gainBudget', description: 'All players gain +1E', params: { E: 1, target: 'all' } },
    ],
  },
  {
    id: 'agenda-defense-spending',
    name: 'Defense Spending Increase',
    description: 'Congress approves a major budget increase.',
    favoredBudgetLine: 'U',
    passEffects: [
      { type: 'gainBudget', description: 'All players gain +2U', params: { U: 2, target: 'all' } },
    ],
    failEffects: [
      { type: 'custom', description: 'Reprogramming costs +1 PC this year', params: { reprogramCostIncrease: 1 } },
    ],
  },
  {
    id: 'agenda-cyber-priority',
    name: 'Cyber & Space Prioritization',
    description: 'Elevate Space/Cyber to top funding priority.',
    favoredBudgetLine: 'X',
    passEffects: [
      { type: 'reduceCost', description: 'Space/Cyber programs cost 1 less X to activate', params: { domain: 'SPACE_CYBER', resource: 'X', amount: 1 } },
    ],
    failEffects: [
      { type: 'gainBudget', description: 'All players gain +1A', params: { A: 1, target: 'all' } },
    ],
  },
  {
    id: 'agenda-alliance-invest',
    name: 'Allied Investment Act',
    description: 'Strengthen alliances with increased diplomatic funding.',
    favoredBudgetLine: 'E',
    passEffects: [
      { type: 'custom', description: 'Negotiate order places Alliance for free (no Base requirement)', params: { negotiateFreePlace: true } },
    ],
    failEffects: [
      { type: 'custom', description: 'Negotiate order costs +1 PC everywhere', params: { negotiateCostIncrease: 1 } },
    ],
  },
  {
    id: 'agenda-sequestration',
    name: 'Budget Sequestration',
    description: 'Across-the-board cuts threaten all programs.',
    favoredBudgetLine: 'U',
    passEffects: [
      { type: 'custom', description: 'Avoided! No negative effect. All players gain +1U', params: { U: 1, target: 'all' } },
    ],
    failEffects: [
      { type: 'custom', description: 'All Activate Program costs +1U this year', params: { activateCostIncrease: { U: 1 } } },
    ],
  },
  {
    id: 'agenda-air-mod',
    name: 'Tactical Aviation Modernization',
    description: 'Fund next-gen fighter and bomber programs.',
    favoredBudgetLine: 'A',
    passEffects: [
      { type: 'reduceCost', description: 'AIR programs cost 1 less A to pipeline', params: { domain: 'AIR', resource: 'A', amount: 1, action: 'pipeline' } },
    ],
    failEffects: [
      { type: 'gainBudget', description: 'All players gain +1S', params: { S: 1, target: 'all' } },
    ],
  },
  {
    id: 'agenda-readiness-mandate',
    name: 'Readiness Mandate',
    description: 'Congress demands higher force readiness.',
    favoredBudgetLine: 'U',
    passEffects: [
      { type: 'custom', description: 'Major Exercise gives +3 Readiness instead of +2', params: { majorExerciseBonus: 1 } },
      { type: 'gainSI', description: '+1 SI for any player with Readiness >= 4 at Year End', params: { condition: 'readiness', threshold: 4, si: 1 } },
    ],
    failEffects: [
      { type: 'custom', description: 'All players lose 1 Readiness', params: { readinessLoss: 1, target: 'all' } },
    ],
  },
  {
    id: 'agenda-arctic-focus',
    name: 'Arctic Strategy Act',
    description: 'New focus on Arctic presence and capabilities.',
    favoredBudgetLine: 'E',
    passEffects: [
      { type: 'reduceCost', description: 'Deploy in Arctic costs 2 less U', params: { theater: 'arctic', resource: 'U', amount: 2 } },
    ],
    failEffects: [
      { type: 'custom', description: 'Arctic theater ignored — no Theater Control scoring for Arctic this year', params: { disableTheaterScoring: 'arctic' } },
    ],
  },
  {
    id: 'agenda-procurement-reform',
    name: 'Procurement Reform',
    description: 'Streamline the acquisition process.',
    favoredBudgetLine: 'A',
    passEffects: [
      { type: 'custom', description: 'Pipeline programs mature 1 cost cheaper (save 1U on maturation)', params: { maturationDiscount: { U: 1 } } },
    ],
    failEffects: [
      { type: 'custom', description: 'All Pipeline costs +1U this year', params: { pipelineCostIncrease: { U: 1 } } },
    ],
  },
  {
    id: 'agenda-homeland-sec',
    name: 'Homeland Security Enhancement',
    description: 'Increase homeland defense spending and posture.',
    favoredBudgetLine: 'A',
    passEffects: [
      { type: 'reduceCost', description: 'Deploy in Homeland costs 1 less U', params: { theater: 'homeland', resource: 'U', amount: 1 } },
      { type: 'gainSI', description: '+1 SI for any player with presence in Homeland at Year End', params: { condition: 'presenceInTheater', theater: 'homeland', si: 1 } },
    ],
    failEffects: [
      { type: 'custom', description: 'Crisis penalties are +1 worse this year', params: { crisisPenaltyIncrease: 1 } },
    ],
  },
  {
    id: 'agenda-naval-expansion',
    name: 'Naval Build-Up',
    description: 'Accelerate shipbuilding and forward naval presence.',
    favoredBudgetLine: 'S',
    passEffects: [
      { type: 'reduceCost', description: 'SEA Activate Program costs 1 less S', params: { domain: 'SEA', resource: 'S', amount: 1, action: 'activate' } },
    ],
    failEffects: [
      { type: 'gainBudget', description: 'All players lose 1U', params: { U: -1, target: 'all' } },
    ],
  },
  {
    id: 'agenda-space-race',
    name: 'New Space Race',
    description: 'Commit national resources to achieving space superiority.',
    favoredBudgetLine: 'X',
    passEffects: [
      { type: 'gainBudget', description: 'All players gain +1X', params: { X: 1, target: 'all' } },
    ],
    failEffects: [
      { type: 'custom', description: 'Space programs cost +1X to activate this year', params: { activateCostIncrease: { domain: 'SPACE', X: 1 } } },
    ],
  },
  {
    id: 'agenda-force-restructure',
    name: 'Force Restructuring',
    description: 'Reorganize the joint force for future warfighting.',
    favoredBudgetLine: 'E',
    passEffects: [
      { type: 'reduceCost', description: 'EXP programs cost 1 less E to pipeline', params: { domain: 'EXP', resource: 'E', amount: 1, action: 'pipeline' } },
    ],
    failEffects: [
      { type: 'gainBudget', description: 'All players lose 1M', params: { M: -1, target: 'all' } },
    ],
  },
  {
    id: 'agenda-intel-community',
    name: 'Intelligence Community Act',
    description: 'Expand intelligence collection and sharing authorities.',
    favoredBudgetLine: 'X',
    passEffects: [
      { type: 'gainSecondary', description: 'All players gain +1 Intelligence', params: { I: 1, target: 'all' } },
    ],
    failEffects: [
      { type: 'gainSecondary', description: 'All players lose 1 Intelligence', params: { I: -1, target: 'all' } },
    ],
  },
  {
    id: 'agenda-reserve-call',
    name: 'Reserve Component Activation',
    description: 'Mobilize Reserve and National Guard forces nationwide.',
    favoredBudgetLine: 'U',
    passEffects: [
      { type: 'gainBudget', description: 'All players gain +2M', params: { M: 2, target: 'all' } },
    ],
    failEffects: [
      { type: 'custom', description: 'Major Exercise costs +1M this year', params: { majorExerciseCostIncrease: { M: 1 } } },
    ],
  },
  {
    id: 'agenda-pacific-basing',
    name: 'Pacific Basing Rights',
    description: 'Secure new basing agreements across the Indo-Pacific.',
    favoredBudgetLine: 'S',
    passEffects: [
      { type: 'custom', description: 'Deploy in Indo-Pacific is free (0U cost) this year', params: { freeDeployTheater: 'indoPacific' } },
    ],
    failEffects: [
      { type: 'custom', description: 'All players lose 1 Alliance in Indo-Pacific', params: { loseAlliance: { theater: 'indoPacific', amount: 1 }, target: 'all' } },
    ],
  },
  {
    id: 'agenda-natsec-budget',
    name: 'National Security Budget Boost',
    description: 'A rare bipartisan deal injects resources across the board.',
    favoredBudgetLine: 'U',
    passEffects: [
      { type: 'gainBudget', description: 'All players gain +1 of each budget line (A, S, E, X, U) up to hand limit', params: { A: 1, S: 1, E: 1, X: 1, U: 1, target: 'all', capAtHandLimit: true } },
    ],
    failEffects: [
      { type: 'custom', description: 'All players lose 1 Readiness', params: { readinessLoss: 1, target: 'all' } },
    ],
  },
  {
    id: 'agenda-cyber-mandate',
    name: 'Mandatory Cyber Standards',
    description: 'Mandate baseline cyber resilience across all commands.',
    favoredBudgetLine: 'X',
    passEffects: [
      { type: 'gainSecondary', description: 'All players gain +1 Intelligence', params: { I: 1, target: 'all' } },
    ],
    failEffects: [
      { type: 'gainSI', description: 'Players with no active Cyber program lose 1 SI', params: { condition: 'noCyberProgram', si: -1 } },
    ],
  },
  {
    id: 'agenda-mil-construction',
    name: 'Military Construction Act',
    description: 'Appropriate funds for bases, airfields, and port improvements.',
    favoredBudgetLine: 'U',
    passEffects: [
      { type: 'reduceCost', description: 'Build Base costs 1 less U this year', params: { action: 'buildBase', resource: 'U', amount: 1 } },
    ],
    failEffects: [
      { type: 'custom', description: 'No Build Base orders may be placed this year', params: { blockAction: 'buildBase' } },
    ],
  },
  {
    id: 'agenda-strategic-reserve',
    name: 'Strategic Petroleum Reserve',
    description: 'Release reserves to sustain extended military operations.',
    favoredBudgetLine: 'U',
    passEffects: [
      { type: 'gainBudget', description: 'All players gain +2U', params: { U: 2, target: 'all' } },
    ],
    failEffects: [
      { type: 'custom', description: 'Logistics Surge gives 1 less L this year', params: { logisticsSurgeReduction: 1 } },
    ],
  },
];

export const AGENDA_CARDS: AgendaCard[] = _cards.map(c => ({ ...c, prose: _prose[c.id] }));
