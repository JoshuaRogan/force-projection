import type { AgendaCard } from '../cards.js';

/** Starter set: 10 agendas */
export const AGENDA_CARDS: AgendaCard[] = [
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
];
