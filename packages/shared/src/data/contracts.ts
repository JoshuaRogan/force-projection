import type { ContractCard } from '../cards.js';

/** Starter set: 15 contracts */
export const CONTRACT_CARDS: ContractCard[] = [
  {
    id: 'con-air-dom',
    name: 'Air Dominance Demonstration',
    immediateAward: [{ type: 'gainBudget', description: 'Gain +2A', params: { A: 2 } }],
    requirements: [
      { type: 'stationProgram', description: 'Station 1 Fighter in Indo-Pacific', params: { subtag: 'Fighter', theater: 'indoPacific' } },
      { type: 'readinessThreshold', description: 'Readiness >= 4', params: { threshold: 4 } },
    ],
    rewardSI: 5,
    failurePenaltySI: -2,
    failureEffects: [{ type: 'discardCards', description: 'Discard 1 card', params: { count: 1 } }],
  },
  {
    id: 'con-sustain-surge',
    name: 'Sustainment Surge',
    immediateAward: [{ type: 'gainBudget', description: 'Gain +2U', params: { U: 2 } }],
    requirements: [
      { type: 'sustainOrderCount', description: 'Perform Sustain orders in 3 different Quarters', params: { quarters: 3 } },
    ],
    rewardSI: 4,
    rewardEffects: [{ type: 'gainProduction', description: '+1 U production', params: { U: 1 } }],
    failurePenaltySI: 0,
    failureEffects: [{ type: 'gainProduction', description: '-1 U production next year', params: { U: -1 } }],
  },
  {
    id: 'con-alliance-arch',
    name: 'Alliance Architecture',
    immediateAward: [{ type: 'placeAlliance', description: 'Place 1 Alliance', params: { anywhere: true } }],
    requirements: [
      { type: 'allianceCount', description: '3 Alliances across 3 theaters', params: { count: 3, theaters: 3 } },
    ],
    rewardSI: 6,
    failurePenaltySI: 0,
    failureEffects: [{ type: 'custom', description: 'Lose 1 Alliance of your choice', params: { action: 'removeAlliance', count: 1 } }],
  },
  {
    id: 'con-polar',
    name: 'Polar Coverage',
    immediateAward: [
      { type: 'gainBudget', description: 'Gain +1X, +1U', params: { X: 1, U: 1 } },
    ],
    requirements: [
      { type: 'baseInTheater', description: 'Base in Arctic', params: { theater: 'arctic' } },
      { type: 'forwardOpsInTheater', description: 'Forward Ops in Arctic or N. Atlantic', params: { theaters: ['arctic', 'northAtlantic'] } },
    ],
    rewardSI: 5,
    failurePenaltySI: -2,
  },
  {
    id: 'con-sea-control',
    name: 'Maritime Superiority',
    immediateAward: [{ type: 'gainBudget', description: 'Gain +2S', params: { S: 2 } }],
    requirements: [
      { type: 'stationProgram', description: 'Station 1 SEA program in 2 different theaters', params: { domain: 'SEA', theaterCount: 2 } },
    ],
    rewardSI: 5,
    failurePenaltySI: -2,
  },
  {
    id: 'con-tech-edge',
    name: 'Technology Overmatch',
    immediateAward: [{ type: 'gainBudget', description: 'Gain +2X', params: { X: 2 } }],
    requirements: [
      { type: 'activeProgramTag', description: '2+ Network programs active', params: { subtag: 'Network', count: 2 } },
    ],
    rewardSI: 4,
    rewardEffects: [{ type: 'gainProduction', description: '+1 X production', params: { X: 1 } }],
    failurePenaltySI: -1,
  },
  {
    id: 'con-global-posture',
    name: 'Global Posture Review',
    immediateAward: [{ type: 'gainSecondary', description: 'Gain +1 PC', params: { PC: 1 } }],
    requirements: [
      { type: 'theaterPresence', description: 'Presence in 4+ theaters', params: { count: 4 } },
    ],
    rewardSI: 6,
    failurePenaltySI: -2,
  },
  {
    id: 'con-rapid-deploy',
    name: 'Rapid Deployment Exercise',
    immediateAward: [{ type: 'gainSecondary', description: 'Gain +2 L', params: { L: 2 } }],
    requirements: [
      { type: 'forwardOpsInTheater', description: 'Forward Ops in 2+ theaters', params: { count: 2 } },
      { type: 'readinessThreshold', description: 'Readiness >= 3', params: { threshold: 3 } },
    ],
    rewardSI: 5,
    failurePenaltySI: -1,
  },
  {
    id: 'con-classified-ops',
    name: 'Classified Operations',
    immediateAward: [{ type: 'gainSecondary', description: 'Gain +2 I', params: { I: 2 } }],
    requirements: [
      { type: 'activeProgramTag', description: '2+ Classified programs active', params: { subtag: 'Classified', count: 2 } },
    ],
    rewardSI: 4,
    rewardEffects: [{ type: 'gainSecondary', description: 'Gain +2 I', params: { I: 2 } }],
    failurePenaltySI: -1,
  },
  {
    id: 'con-homeland-def',
    name: 'Homeland Defense Posture',
    immediateAward: [{ type: 'gainBudget', description: 'Gain +1A, +1U', params: { A: 1, U: 1 } }],
    requirements: [
      { type: 'baseInTheater', description: 'Base in Homeland', params: { theater: 'homeland' } },
      { type: 'stationProgram', description: 'Station 1 program in Homeland', params: { theater: 'homeland' } },
    ],
    rewardSI: 4,
    failurePenaltySI: -1,
  },
  {
    id: 'con-indo-pac-pres',
    name: 'Indo-Pacific Presence',
    immediateAward: [{ type: 'gainBudget', description: 'Gain +1S, +1E', params: { S: 1, E: 1 } }],
    requirements: [
      { type: 'baseInTheater', description: 'Base in Indo-Pacific', params: { theater: 'indoPacific' } },
      { type: 'allianceCount', description: '1+ Alliance in Indo-Pacific', params: { theater: 'indoPacific', count: 1 } },
    ],
    rewardSI: 4,
    failurePenaltySI: -1,
  },
  {
    id: 'con-full-spectrum',
    name: 'Full-Spectrum Readiness',
    immediateAward: [{ type: 'gainBudget', description: 'Gain +1U', params: { U: 1 } }],
    requirements: [
      { type: 'readinessThreshold', description: 'Readiness >= 6', params: { threshold: 6 } },
      { type: 'sustainOrderCount', description: 'Sustain orders in 2+ Quarters', params: { quarters: 2 } },
    ],
    rewardSI: 5,
    rewardEffects: [{ type: 'modifyReadiness', description: '+2 Readiness', params: { bonus: 2 } }],
    failurePenaltySI: -2,
  },
  {
    id: 'con-joint-force',
    name: 'Joint Force Integration',
    immediateAward: [{ type: 'gainSecondary', description: 'Gain +1 M, +1 L', params: { M: 1, L: 1 } }],
    requirements: [
      { type: 'activeProgramTag', description: 'Active programs from 3+ domains', params: { domainCount: 3 } },
    ],
    rewardSI: 5,
    failurePenaltySI: -1,
  },
  {
    id: 'con-mideast-stab',
    name: 'Middle East Stabilization',
    immediateAward: [{ type: 'gainBudget', description: 'Gain +1E, +1U', params: { E: 1, U: 1 } }],
    requirements: [
      { type: 'baseInTheater', description: 'Base in Middle East', params: { theater: 'middleEast' } },
      { type: 'allianceCount', description: '1+ Alliance in Middle East', params: { theater: 'middleEast', count: 1 } },
    ],
    rewardSI: 4,
    failurePenaltySI: -1,
  },
  {
    id: 'con-space-dom',
    name: 'Space Domain Awareness',
    immediateAward: [{ type: 'gainBudget', description: 'Gain +2X', params: { X: 2 } }],
    requirements: [
      { type: 'activeProgramTag', description: '2+ Space programs active', params: { subtag: 'Space', count: 2 } },
    ],
    rewardSI: 4,
    rewardEffects: [{ type: 'gainSecondary', description: 'Gain +1 I', params: { I: 1 } }],
    failurePenaltySI: -1,
  },
];
