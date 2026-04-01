import type { CrisisCard } from '../cards.js';

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

  // ── New crises ────────────────────────────────────────────────────────────

  {
    id: 'crisis-force-reposture',
    name: 'Emergency Reposture',
    immediateRule: 'All Deploy orders cost +1 U this Quarter.',
    immediateEffects: [
      { type: 'custom', description: 'Deploy costs +1U', params: { deployCostIncrease: { U: 1 } } },
    ],
    responseDescription: 'Players with 3 or more Bases already in place are immune to the extra cost.',
    responseEffects: [
      { type: 'custom', description: '3+ Bases negates Deploy cost increase', params: { negateFor: 'baseCount', threshold: 3 } },
    ],
    penaltyDescription: 'The player with the fewest Bases loses 1 SI.',
    penaltyEffects: [
      { type: 'custom', description: 'Fewest Bases loses 1 SI', params: { lowestCount: 'bases', siPenalty: -1 } },
    ],
  },
  {
    id: 'crisis-readiness-decline',
    name: 'Readiness Degradation',
    immediateRule: 'All players lose 1 Readiness this Quarter.',
    immediateEffects: [
      { type: 'modifyReadiness', description: 'All lose 1 Readiness', params: { bonus: -1, target: 'all' } },
    ],
    responseDescription: 'Players who performed a Major Exercise this Quarter are immune to the Readiness loss.',
    responseEffects: [
      { type: 'custom', description: 'Major Exercise negates Readiness loss', params: { negateFor: 'majorExercise' } },
    ],
    penaltyDescription: 'All players whose Readiness is below 3 after the pulse lose 1 SI.',
    penaltyEffects: [
      { type: 'custom', description: 'Readiness < 3 → lose 1 SI', params: { condition: 'readinessBelow', threshold: 3, siPenalty: -1, target: 'qualifying' } },
    ],
  },
  {
    id: 'crisis-intel-failure',
    name: 'Intelligence Failure',
    immediateRule: 'All players lose 1 I this Quarter.',
    immediateEffects: [
      { type: 'gainSecondary', description: 'All players lose 1 I', params: { I: -1, target: 'all' } },
    ],
    responseDescription: 'Players with 2 or more active Network programs are immune to the I loss.',
    responseEffects: [
      { type: 'custom', description: '2+ active Network programs negates I loss', params: { negateFor: 'subtagCount', subtag: 'Network', threshold: 2 } },
    ],
    penaltyDescription: 'If no player has I of 2 or higher, all players lose 1 SI.',
    penaltyEffects: [
      { type: 'custom', description: 'No player with I ≥ 2 → all lose 1 SI', params: { requireAnyPlayerResource: 'I', threshold: 2, siPenalty: -1, target: 'all' } },
    ],
  },
  {
    id: 'crisis-theater-tension',
    name: 'Regional Tensions',
    immediateRule: 'Forward Ops orders cost +1 L this Quarter.',
    immediateEffects: [
      { type: 'custom', description: 'Forward Ops costs +1L', params: { forwardOpsCostIncrease: { L: 1 } } },
    ],
    responseDescription: 'Players with Forward Ops in Middle East or Indo-Pacific gain +1 SI for maintaining presence under pressure.',
    responseEffects: [
      { type: 'conditionalSI', description: 'Forward Ops in Middle East → +1 SI', params: { condition: 'forwardOpsInTheater', theater: 'middleEast', si: 1 } },
      { type: 'conditionalSI', description: 'Forward Ops in Indo-Pacific → +1 SI', params: { condition: 'forwardOpsInTheater', theater: 'indoPacific', si: 1 } },
    ],
    penaltyDescription: 'Players with no Forward Ops anywhere lose 1 Readiness.',
    penaltyEffects: [
      { type: 'modifyReadiness', description: 'No Forward Ops → lose 1 Readiness', params: { bonus: -1, condition: 'noForwardOps', target: 'qualifying' } },
    ],
  },
  {
    id: 'crisis-logistics-crisis',
    name: 'Logistics Breakdown',
    immediateRule: 'All players lose 1 L this Quarter.',
    immediateEffects: [
      { type: 'gainSecondary', description: 'All players lose 1 L', params: { L: -1, target: 'all' } },
    ],
    responseDescription: 'Players who performed Logistics Surge are immune and keep their full L.',
    responseEffects: [
      { type: 'custom', description: 'Logistics Surge negates L loss', params: { negateFor: 'logisticsSurge' } },
    ],
    penaltyDescription: 'Players reduced to 0 L cannot perform Deploy orders for the rest of this Quarter.',
    penaltyEffects: [
      { type: 'custom', description: 'Block Deploy if L = 0', params: { blockCategory: 'Deploy', condition: 'resourceZero', resource: 'L' } },
    ],
  },
  {
    id: 'crisis-personnel-shortfall',
    name: 'Personnel Shortfall',
    immediateRule: 'Major Exercise costs +1 M this Quarter.',
    immediateEffects: [
      { type: 'custom', description: 'Major Exercise costs +1M', params: { majorExerciseCostIncrease: { M: 1 } } },
    ],
    responseDescription: 'Players with 3 or more active EXP programs have enough trained personnel and are immune.',
    responseEffects: [
      { type: 'custom', description: '3+ active EXP programs negates cost increase', params: { negateFor: 'subtagCount', subtag: 'EXP', threshold: 3 } },
    ],
    penaltyDescription: 'All players lose 1 Readiness as units fall below manning requirements.',
    penaltyEffects: [
      { type: 'modifyReadiness', description: 'All lose 1 Readiness', params: { bonus: -1, target: 'all' } },
    ],
  },
  {
    id: 'crisis-space-threat',
    name: 'Anti-Satellite Threat',
    immediateRule: 'Space programs cannot gain resource bonuses this Quarter.',
    immediateEffects: [
      { type: 'custom', description: 'Block Space program bonus generation', params: { blockBonuses: { subtag: 'Space' } } },
    ],
    responseDescription: 'Players with an active Counter-Space or SBIRS program are immune and keep their bonuses.',
    responseEffects: [
      { type: 'custom', description: 'Counter-Space or SBIRS negates bonus block', params: { negateFor: 'specificPrograms', ids: ['prog-counter-space', 'prog-sbirs'] } },
    ],
    penaltyDescription: 'All players lose 1 I as satellite surveillance is degraded.',
    penaltyEffects: [
      { type: 'gainSecondary', description: 'All lose 1 I', params: { I: -1, target: 'all' } },
    ],
  },
  {
    id: 'crisis-arctic-incident',
    name: 'Arctic Incident',
    immediateRule: 'Deploy orders into Arctic cost +2 U this Quarter.',
    immediateEffects: [
      { type: 'custom', description: 'Deploy in Arctic costs +2U', params: { deployCostIncrease: { U: 2 }, theater: 'arctic' } },
    ],
    responseDescription: 'Players with a Base already established in the Arctic are immune to the cost increase.',
    responseEffects: [
      { type: 'custom', description: 'Base in Arctic negates cost increase', params: { negateFor: 'baseInTheater', theater: 'arctic' } },
    ],
    penaltyDescription: 'Arctic theater scoring is suspended for this Year if no player has presence there.',
    penaltyEffects: [
      { type: 'custom', description: 'No Arctic presence → suspend Arctic theater scoring', params: { suspendTheaterScoring: 'arctic', condition: 'noPresence' } },
    ],
  },
  {
    id: 'crisis-cyber-intrusion',
    name: 'Sophisticated Cyber Intrusion',
    immediateRule: 'All players lose 1 PC as diplomatic channels are compromised.',
    immediateEffects: [
      { type: 'gainSecondary', description: 'All players lose 1 PC', params: { PC: -1, target: 'all' } },
    ],
    responseDescription: 'Players with an active Cyber program detected the intrusion early and are immune.',
    responseEffects: [
      { type: 'custom', description: 'Active Cyber program negates PC loss', params: { negateFor: 'activeCyber' } },
    ],
    penaltyDescription: 'Negotiate orders are blocked this Quarter while communications are restored.',
    penaltyEffects: [
      { type: 'custom', description: 'Block Negotiate this Quarter', params: { blockOrder: 'Negotiate' } },
    ],
  },
  {
    id: 'crisis-public-opinion',
    name: 'Negative Public Opinion',
    immediateRule: 'Lobby actions generate 1 fewer PC this Quarter.',
    immediateEffects: [
      { type: 'custom', description: 'Lobby yields 1 less PC', params: { lobbyCostReduction: { PC: -1 } } },
    ],
    responseDescription: 'Players with Readiness of 5 or higher project strength and are immune to the PC reduction.',
    responseEffects: [
      { type: 'custom', description: 'Readiness ≥ 5 negates Lobby PC reduction', params: { negateFor: 'statThreshold', stat: 'readiness', threshold: 5 } },
    ],
    penaltyDescription: 'All players lose 1 PC as public support erodes further.',
    penaltyEffects: [
      { type: 'gainSecondary', description: 'All lose 1 PC', params: { PC: -1, target: 'all' } },
    ],
  },
  {
    id: 'crisis-equipment-delay',
    name: 'Procurement Delay',
    immediateRule: 'Pipeline orders cost +1 U this Quarter.',
    immediateEffects: [
      { type: 'custom', description: 'Pipeline costs +1U', params: { pipelineCostIncrease: { U: 1 } } },
    ],
    responseDescription: 'Players with 2 or more active Industry programs have diversified suppliers and are immune.',
    responseEffects: [
      { type: 'custom', description: '2+ active Industry programs negates Pipeline cost increase', params: { negateFor: 'subtagCount', subtag: 'Industry', threshold: 2 } },
    ],
    penaltyDescription: 'No new Pipeline orders may be placed this Quarter.',
    penaltyEffects: [
      { type: 'custom', description: 'Block new Pipeline orders this Quarter', params: { blockOrder: 'Pipeline' } },
    ],
  },
  {
    id: 'crisis-force-fatigue',
    name: 'Operational Fatigue',
    immediateRule: 'All Sustain orders cost +1 U this Quarter.',
    immediateEffects: [
      { type: 'custom', description: 'Sustain costs +1U', params: { sustainCostIncrease: { U: 1 } } },
    ],
    responseDescription: 'Players who chose Lobby this Quarter secured supplemental funding and are immune to the extra cost.',
    responseEffects: [
      { type: 'custom', description: 'Lobby negates Sustain cost increase', params: { negateFor: 'lobby' } },
    ],
    penaltyDescription: 'All players lose 1 Readiness and 1 SI as overextended forces reach a breaking point.',
    penaltyEffects: [
      { type: 'modifyReadiness', description: 'All lose 1 Readiness', params: { bonus: -1, target: 'all' } },
      { type: 'custom', description: 'All lose 1 SI', params: { siPenalty: -1, target: 'all' } },
    ],
  },
  {
    id: 'crisis-north-atlantic',
    name: 'North Atlantic Surge',
    immediateRule: 'Deploy orders into the North Atlantic cost +2 U this Quarter.',
    immediateEffects: [
      { type: 'custom', description: 'Deploy in North Atlantic costs +2U', params: { deployCostIncrease: { U: 2 }, theater: 'northAtlantic' } },
    ],
    responseDescription: 'Players who already have presence in the North Atlantic gain +1 SI for holding the line.',
    responseEffects: [
      { type: 'conditionalSI', description: 'Presence in North Atlantic → +1 SI', params: { condition: 'presenceInTheater', theater: 'northAtlantic', si: 1 } },
    ],
    penaltyDescription: 'The player with the least presence in the North Atlantic loses 1 SI.',
    penaltyEffects: [
      { type: 'custom', description: 'Lowest North Atlantic presence loses 1 SI', params: { lowestPresence: 'northAtlantic', siPenalty: -1 } },
    ],
  },
  {
    id: 'crisis-homeland-threat',
    name: 'Homeland Defense Alert',
    immediateRule: 'Station orders cost +1 U everywhere this Quarter.',
    immediateEffects: [
      { type: 'custom', description: 'All Station orders cost +1U', params: { stationCostIncrease: { U: 1 } } },
    ],
    responseDescription: 'Players with a Base in the Homeland already have forces in position and are immune.',
    responseEffects: [
      { type: 'custom', description: 'Base in Homeland negates Station cost increase', params: { negateFor: 'baseInTheater', theater: 'homeland' } },
    ],
    penaltyDescription: 'Players with no Base in the Homeland lose 1 SI.',
    penaltyEffects: [
      { type: 'custom', description: 'No Homeland Base → lose 1 SI', params: { condition: 'noBaseInTheater', theater: 'homeland', siPenalty: -1, target: 'qualifying' } },
    ],
  },
  {
    id: 'crisis-allied-defection',
    name: 'Allied Defection',
    immediateRule: 'All players lose 1 Alliance this Quarter.',
    immediateEffects: [
      { type: 'gainSecondary', description: 'All players lose 1 Alliance', params: { Alliance: -1, target: 'all' } },
    ],
    responseDescription: 'Players with 3 or more Alliances weather the defection with their coalition intact and are immune.',
    responseEffects: [
      { type: 'custom', description: '3+ Alliances negates Alliance loss', params: { negateFor: 'allianceCount', threshold: 3 } },
    ],
    penaltyDescription: 'The player with the fewest Alliances loses 2 SI as their coalition collapses.',
    penaltyEffects: [
      { type: 'custom', description: 'Fewest Alliances loses 2 SI', params: { lowestCount: 'alliances', siPenalty: -2 } },
    ],
  },
];
