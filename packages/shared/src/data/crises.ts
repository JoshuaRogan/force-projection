import type { CrisisCard } from '../cards.js';

/** Starter set: 10 crises */
export const CRISIS_CARDS: CrisisCard[] = [
  {
    id: 'crisis-budget-freeze',
    name: 'Budget Freeze',
    immediateRule: 'Activate Program costs +1 U this Quarter.',
    immediateEffects: [
      { type: 'custom', description: 'Activate costs +1U', params: { activateCostIncrease: { U: 1 } } },
    ],
    responseDescription: 'Any player who chose Lobby may ignore the +1 U.',
    responseEffects: [
      { type: 'custom', description: 'Lobby negates the cost increase', params: { negateFor: 'lobby' } },
    ],
    penaltyDescription: 'If fewer than 2 players performed a Sustain order, everyone loses 1 SI.',
    penaltyEffects: [
      { type: 'custom', description: 'Check sustain count; if < 2, all lose 1 SI', params: { sustainThreshold: 2, siPenalty: -1, target: 'all' } },
    ],
  },
  {
    id: 'crisis-maritime-disruption',
    name: 'Maritime Disruption',
    immediateRule: 'Sea programs cost +1 S to activate this Quarter.',
    immediateEffects: [
      { type: 'custom', description: 'SEA activate costs +1S', params: { activateCostIncrease: { S: 1 }, domain: 'SEA' } },
    ],
    responseDescription: 'Players with a stationed SEA program ignore the +1 S.',
    responseEffects: [
      { type: 'custom', description: 'Stationed SEA program negates cost', params: { negateFor: 'stationedSEA' } },
    ],
    penaltyDescription: 'Player with least Sea budget loses 1 SI.',
    penaltyEffects: [
      { type: 'custom', description: 'Lowest S loses 1 SI', params: { lowestResource: 'S', siPenalty: -1 } },
    ],
  },
  {
    id: 'crisis-cyber-attack',
    name: 'Major Cyber Attack',
    immediateRule: 'All players lose 1 I this Quarter.',
    immediateEffects: [
      { type: 'gainSecondary', description: 'All players lose 1 I', params: { I: -1, target: 'all' } },
    ],
    responseDescription: 'Players with an active Cyber program are immune.',
    responseEffects: [
      { type: 'custom', description: 'Active Cyber program negates I loss', params: { negateFor: 'activeCyber' } },
    ],
    penaltyDescription: 'If no player has an active Network program, all lose 1 SI.',
    penaltyEffects: [
      { type: 'custom', description: 'No Network active → all lose 1 SI', params: { requireSubtag: 'Network', siPenalty: -1, target: 'all' } },
    ],
  },
  {
    id: 'crisis-regional-flare',
    name: 'Regional Flare-Up',
    immediateRule: 'Forward Ops costs +1 L this Quarter.',
    immediateEffects: [
      { type: 'custom', description: 'Forward Ops costs +1L', params: { forwardOpsCostIncrease: { L: 1 } } },
    ],
    responseDescription: 'Players with Forward Ops in Middle East gain +1 SI.',
    responseEffects: [
      { type: 'conditionalSI', description: 'Forward Ops in Middle East → +1 SI', params: { condition: 'forwardOpsInTheater', theater: 'middleEast', si: 1 } },
    ],
    penaltyDescription: 'If no player has Forward Ops in Middle East, all lose 1 Readiness.',
    penaltyEffects: [
      { type: 'modifyReadiness', description: 'All lose 1 Readiness', params: { bonus: -1, target: 'all', condition: 'noForwardOps', theater: 'middleEast' } },
    ],
  },
  {
    id: 'crisis-supply-chain',
    name: 'Supply Chain Disruption',
    immediateRule: 'All players lose 1 L this Quarter.',
    immediateEffects: [
      { type: 'gainSecondary', description: 'All players lose 1 L', params: { L: -1, target: 'all' } },
    ],
    responseDescription: 'Players who chose Logistics Surge are immune.',
    responseEffects: [
      { type: 'custom', description: 'Logistics Surge negates L loss', params: { negateFor: 'logisticsSurge' } },
    ],
    penaltyDescription: 'Players with 0 L cannot perform Deploy orders this Quarter.',
    penaltyEffects: [
      { type: 'custom', description: 'Block Deploy if L = 0', params: { blockCategory: 'Deploy', condition: 'resourceZero', resource: 'L' } },
    ],
  },
  {
    id: 'crisis-alliance-strain',
    name: 'Alliance Strain',
    immediateRule: 'Negotiate order costs +1 PC this Quarter.',
    immediateEffects: [
      { type: 'custom', description: 'Negotiate costs +1 PC', params: { negotiateCostIncrease: 1 } },
    ],
    responseDescription: 'Players with 3+ Alliances are immune to the cost increase.',
    responseEffects: [
      { type: 'custom', description: '3+ Alliances negates cost', params: { negateFor: 'allianceCount', threshold: 3 } },
    ],
    penaltyDescription: 'Player with fewest Alliances loses 1 SI.',
    penaltyEffects: [
      { type: 'custom', description: 'Fewest Alliances loses 1 SI', params: { lowestCount: 'alliances', siPenalty: -1 } },
    ],
  },
  {
    id: 'crisis-manpower-short',
    name: 'Manpower Shortage',
    immediateRule: 'Major Exercise costs +1 M this Quarter.',
    immediateEffects: [
      { type: 'custom', description: 'Major Exercise costs +1M', params: { majorExerciseCostIncrease: { M: 1 } } },
    ],
    responseDescription: 'Players with 3+ M are immune.',
    responseEffects: [
      { type: 'custom', description: '3+ M negates cost increase', params: { negateFor: 'resourceThreshold', resource: 'M', threshold: 3 } },
    ],
    penaltyDescription: 'All players lose 1 Readiness.',
    penaltyEffects: [
      { type: 'modifyReadiness', description: 'All lose 1 Readiness', params: { bonus: -1, target: 'all' } },
    ],
  },
  {
    id: 'crisis-space-debris',
    name: 'Orbital Debris Event',
    immediateRule: 'Space programs cannot be activated this Quarter.',
    immediateEffects: [
      { type: 'custom', description: 'Block Space program activation', params: { blockActivation: { subtag: 'Space' } } },
    ],
    responseDescription: 'Players with SBIRS or Space Fence active lose no I production.',
    responseEffects: [
      { type: 'custom', description: 'Specific programs negate effect', params: { negateFor: 'specificPrograms', ids: ['prog-sbirs', 'prog-space-fence'] } },
    ],
    penaltyDescription: 'All players lose 1 I.',
    penaltyEffects: [
      { type: 'gainSecondary', description: 'All lose 1 I', params: { I: -1, target: 'all' } },
    ],
  },
  {
    id: 'crisis-political-scandal',
    name: 'Political Scandal',
    immediateRule: 'All players lose 1 PC this Quarter.',
    immediateEffects: [
      { type: 'gainSecondary', description: 'All players lose 1 PC', params: { PC: -1, target: 'all' } },
    ],
    responseDescription: 'Players who chose Lobby gain 1 PC back.',
    responseEffects: [
      { type: 'gainSecondary', description: 'Lobby restores 1 PC', params: { PC: 1, trigger: 'lobby' } },
    ],
    penaltyDescription: 'No reprogramming allowed this Quarter.',
    penaltyEffects: [
      { type: 'custom', description: 'Block reprogramming', params: { blockReprogramming: true } },
    ],
  },
  {
    id: 'crisis-natural-disaster',
    name: 'Natural Disaster Response',
    immediateRule: 'All players lose 1 U this Quarter.',
    immediateEffects: [
      { type: 'gainBudget', description: 'All players lose 1 U', params: { U: -1, target: 'all' } },
    ],
    responseDescription: 'Players with a Base in Homeland gain +1 SI for disaster relief.',
    responseEffects: [
      { type: 'conditionalSI', description: 'Base in Homeland → +1 SI', params: { condition: 'baseInTheater', theater: 'homeland', si: 1 } },
    ],
    penaltyDescription: 'Player with lowest Readiness loses 2 SI.',
    penaltyEffects: [
      { type: 'custom', description: 'Lowest Readiness loses 2 SI', params: { lowestStat: 'readiness', siPenalty: -2 } },
    ],
  },
];
