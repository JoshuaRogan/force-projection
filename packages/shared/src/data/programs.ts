import type { ProgramCard } from '../cards.js';

export const PROGRAM_CARDS: ProgramCard[] = [

  // ============================================================
  // AIR DOMAIN (20 cards)
  // ============================================================

  {
    id: 'prog-f22',
    name: 'F-22 Raptor Squadron',
    domain: 'AIR',
    subtags: ['Fighter', 'Classified'],
    pipelineCost: { budget: { A: 2, U: 1 } },
    activeCost: { budget: { A: 4, U: 2 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +2 I', params: { I: 2 } },
      { type: 'satisfyContractStep', description: 'Satisfy 1 Air Superiority contract step', params: { tag: 'Fighter' } },
    ],
    sustainEffects: [
      { type: 'conditionalSI', description: 'If Readiness >= 4, gain +1 SI at Year End', params: { condition: 'readiness', threshold: 4, si: 1 } },
    ],
    stationing: { theaters: ['homeland', 'indoPacific'], strength: 2 },
  },
  {
    id: 'prog-f35',
    name: 'F-35 Wing',
    domain: 'AIR',
    subtags: ['Fighter', 'Network'],
    pipelineCost: { budget: { A: 2, X: 1 } },
    activeCost: { budget: { A: 3, X: 2 } },
    activateEffects: [
      { type: 'gainProduction', description: 'Gain +1 I production or place 1 Alliance', params: { choice: ['productionI', 'placeAlliance'] } },
    ],
    sustainEffects: [
      { type: 'reduceCost', description: 'Network programs cost 1 less X this year', params: { subtag: 'Network', resource: 'X', amount: 1 } },
    ],
  },
  {
    id: 'prog-b21',
    name: 'B-21 Raider Wing',
    domain: 'AIR',
    subtags: ['Bomber', 'Classified'],
    pipelineCost: { budget: { A: 3, U: 1 } },
    activeCost: { budget: { A: 5, U: 2 } },
    activateEffects: [
      { type: 'gainSI', description: 'Gain +2 SI', params: { si: 2 } },
    ],
    sustainEffects: [
      { type: 'conditionalSI', description: 'If you have a Base in 3+ theaters, gain +1 SI at Year End', params: { condition: 'baseCount', threshold: 3, si: 1 } },
    ],
    stationing: { theaters: ['homeland', 'northAtlantic', 'indoPacific'], strength: 1 },
  },
  {
    id: 'prog-kc46',
    name: 'KC-46 Tanker Fleet',
    domain: 'AIR',
    subtags: ['Transport'],
    pipelineCost: { budget: { A: 1, U: 1 } },
    activeCost: { budget: { A: 2, U: 2 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +1 L', params: { L: 1 } },
    ],
    sustainEffects: [
      { type: 'reduceCost', description: 'Deploy orders cost 1 less U this year', params: { orderCategory: 'Deploy', resource: 'U', amount: 1 } },
    ],
  },
  {
    id: 'prog-mq25',
    name: 'MQ-25 Stingray Detachment',
    domain: 'AIR',
    subtags: ['Network'],
    pipelineCost: { budget: { A: 1, X: 1 } },
    activeCost: { budget: { A: 2, X: 1, U: 1 } },
    activateEffects: [
      { type: 'drawCards', description: 'Draw 2 cards', params: { count: 2 } },
    ],
    sustainEffects: [
      { type: 'gainSecondary', description: 'Gain +1 I at start of each Quarter', params: { I: 1, timing: 'quarterStart' } },
    ],
  },
  {
    id: 'prog-f15ex',
    name: 'F-15EX Strike Package',
    domain: 'AIR',
    subtags: ['Fighter'],
    pipelineCost: { budget: { A: 1, U: 1 } },
    activeCost: { budget: { A: 3, U: 1 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +1 M', params: { M: 1 } },
    ],
    sustainEffects: [
      { type: 'modifyReadiness', description: 'Gain +1 Readiness when you perform a Major Exercise', params: { trigger: 'majorExercise', bonus: 1 } },
    ],
    stationing: { theaters: ['homeland', 'middleEast', 'northAtlantic'], strength: 1 },
  },
  {
    id: 'prog-awacs',
    name: 'E-7 Wedgetail AWACS',
    domain: 'AIR',
    subtags: ['Network'],
    pipelineCost: { budget: { A: 2, X: 1 } },
    activeCost: { budget: { A: 3, X: 1, U: 1 } },
    activateEffects: [
      { type: 'gainProduction', description: 'Gain +1 I production', params: { I: 1 } },
    ],
    sustainEffects: [
      { type: 'gainSecondary', description: 'When a Crisis is revealed, gain +1 I', params: { I: 1, timing: 'crisisReveal' } },
    ],
  },
  {
    id: 'prog-cca',
    name: 'Collaborative Combat Aircraft',
    domain: 'AIR',
    subtags: ['Fighter', 'Network'],
    pipelineCost: { budget: { A: 2, X: 2 } },
    activeCost: { budget: { A: 3, X: 3 } },
    activateEffects: [
      { type: 'gainSI', description: 'Gain +1 SI', params: { si: 1 } },
      { type: 'gainSecondary', description: 'Gain +1 I', params: { I: 1 } },
    ],
    sustainEffects: [
      { type: 'conditionalSI', description: 'If you have 2+ Network programs active, gain +2 SI at Year End', params: { condition: 'activeSubtagCount', subtag: 'Network', threshold: 2, si: 2 } },
    ],
    stationing: { theaters: ['indoPacific', 'homeland'], strength: 2 },
  },

  // --- New AIR cards ---

  {
    id: 'prog-ngad',
    name: 'NGAD Air Dominance Fighter',
    domain: 'AIR',
    subtags: ['Fighter', 'Classified'],
    pipelineCost: { budget: { A: 3, U: 1 } },
    activeCost: { budget: { A: 6, U: 2 } },
    activateEffects: [
      { type: 'gainSI', description: 'Gain +2 SI', params: { si: 2 } },
      { type: 'satisfyContractStep', description: 'Satisfy 1 Fighter contract step', params: { tag: 'Fighter' } },
    ],
    sustainEffects: [
      { type: 'conditionalSI', description: 'If Readiness >= 4, gain +1 SI at Year End', params: { condition: 'readiness', threshold: 4, si: 1 } },
    ],
    stationing: { theaters: ['homeland', 'indoPacific'], strength: 2 },
    printedSI: 1,
  },
  {
    id: 'prog-a10',
    name: 'A-10 Thunderbolt II Wing',
    domain: 'AIR',
    subtags: ['Fighter'],
    pipelineCost: { budget: { A: 1, U: 1 } },
    activeCost: { budget: { A: 2, U: 1 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +2 M', params: { M: 2 } },
    ],
    sustainEffects: [
      { type: 'modifyReadiness', description: '+1 Readiness', params: { bonus: 1, timing: 'passive' } },
    ],
    stationing: { theaters: ['middleEast', 'northAtlantic'], strength: 1 },
  },
  {
    id: 'prog-c17',
    name: 'C-17 Globemaster Airlift',
    domain: 'AIR',
    subtags: ['Transport'],
    pipelineCost: { budget: { A: 1, U: 1 } },
    activeCost: { budget: { A: 2, U: 2 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +2 L', params: { L: 2 } },
    ],
    sustainEffects: [
      { type: 'reduceCost', description: 'Deploy orders cost 1 less U', params: { orderCategory: 'Deploy', resource: 'U', amount: 1 } },
    ],
  },
  {
    id: 'prog-rq4',
    name: 'RQ-4 Global Hawk ISR',
    domain: 'AIR',
    subtags: ['Network'],
    pipelineCost: { budget: { A: 1, X: 1 } },
    activeCost: { budget: { A: 2, X: 1, U: 1 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +2 I', params: { I: 2 } },
    ],
    sustainEffects: [
      { type: 'gainSecondary', description: 'Gain +1 I at start of each Quarter', params: { I: 1, timing: 'quarterStart' } },
    ],
  },
  {
    id: 'prog-mq9',
    name: 'MQ-9 Reaper Squadron',
    domain: 'AIR',
    subtags: ['Network', 'Ops'],
    pipelineCost: { budget: { A: 1, U: 1 } },
    activeCost: { budget: { A: 2, U: 1 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +1 I, +1 M', params: { I: 1, M: 1 } },
    ],
    sustainEffects: [
      { type: 'gainSecondary', description: 'When a Crisis is revealed, gain +1 I', params: { I: 1, timing: 'crisisReveal' } },
    ],
    stationing: { theaters: ['middleEast', 'indoPacific'], strength: 1 },
  },
  {
    id: 'prog-p8',
    name: 'P-8 Poseidon Maritime Patrol',
    domain: 'AIR',
    subtags: ['Network'],
    pipelineCost: { budget: { A: 1, S: 1 } },
    activeCost: { budget: { A: 2, S: 1, U: 1 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +1 I', params: { I: 1 } },
    ],
    sustainEffects: [
      { type: 'ignoreFirstCrisis', description: 'Ignore first Maritime Disruption penalty each year', params: { crisisTag: 'maritime' } },
    ],
    stationing: { theaters: ['northAtlantic', 'indoPacific'], strength: 1 },
  },
  {
    id: 'prog-e2d',
    name: 'E-2D Advanced Hawkeye',
    domain: 'AIR',
    subtags: ['Network', 'Carrier'],
    pipelineCost: { budget: { A: 2, U: 1 } },
    activeCost: { budget: { A: 3, U: 1 } },
    activateEffects: [
      { type: 'gainProduction', description: '+1 I production', params: { I: 1 } },
      { type: 'drawCards', description: 'Draw 1 card', params: { count: 1 } },
    ],
    sustainEffects: [
      { type: 'gainSecondary', description: 'Gain +1 I at start of each Quarter', params: { I: 1, timing: 'quarterStart' } },
    ],
  },
  {
    id: 'prog-v22',
    name: 'V-22 Osprey Fleet',
    domain: 'AIR',
    subtags: ['Transport', 'Marine'],
    pipelineCost: { budget: { A: 1, E: 1 } },
    activeCost: { budget: { A: 2, E: 1, U: 1 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +1 L', params: { L: 1 } },
      { type: 'placeForwardOps', description: 'Place Forward Ops at -1 U cost', params: { costModifier: { U: -1 } } },
    ],
    sustainEffects: [
      { type: 'reduceCost', description: 'Deploy orders cost 1 less U', params: { orderCategory: 'Deploy', resource: 'U', amount: 1 } },
    ],
  },
  {
    id: 'prog-b52',
    name: 'B-52 Stratofortress Wing',
    domain: 'AIR',
    subtags: ['Bomber'],
    pipelineCost: { budget: { A: 2, U: 1 } },
    activeCost: { budget: { A: 4, U: 2 } },
    activateEffects: [
      { type: 'gainSI', description: 'Gain +1 SI', params: { si: 1 } },
      { type: 'gainSecondary', description: 'Gain +1 M', params: { M: 1 } },
    ],
    sustainEffects: [
      { type: 'conditionalSI', description: 'If you have a Base in 3+ theaters, gain +1 SI at Year End', params: { condition: 'baseCount', threshold: 3, si: 1 } },
    ],
    stationing: { theaters: ['homeland', 'indoPacific', 'northAtlantic'], strength: 1 },
    printedSI: 1,
  },
  {
    id: 'prog-ec130h',
    name: 'EC-130H Compass Call',
    domain: 'AIR',
    subtags: ['Network', 'Classified'],
    pipelineCost: { budget: { A: 2, X: 1 } },
    activeCost: { budget: { A: 3, X: 1, U: 1 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +2 I', params: { I: 2 } },
    ],
    sustainEffects: [
      { type: 'gainSecondary', description: 'When you choose Intel Focus, gain +1 additional I', params: { I: 1, trigger: 'intelFocus' } },
    ],
  },
  {
    id: 'prog-c130j',
    name: 'C-130J Tactical Airlift',
    domain: 'AIR',
    subtags: ['Transport'],
    pipelineCost: { budget: { A: 1, U: 1 } },
    activeCost: { budget: { A: 2, U: 1 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +1 L', params: { L: 1 } },
    ],
    sustainEffects: [
      { type: 'gainBudget', description: 'Gain +1 A at Year Start', params: { A: 1, timing: 'yearStart' } },
    ],
    stationing: { theaters: ['middleEast', 'northAtlantic', 'arctic'], strength: 1 },
  },
  {
    id: 'prog-sr72',
    name: 'SR-72 Darkstar Reconnaissance',
    domain: 'AIR',
    subtags: ['Network', 'Classified'],
    pipelineCost: { budget: { A: 3, X: 1 } },
    activeCost: { budget: { A: 5, X: 2 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +3 I', params: { I: 3 } },
    ],
    sustainEffects: [
      { type: 'conditionalSI', description: 'If you lead any theater, gain +2 SI', params: { condition: 'leadsAnyTheater', si: 2 } },
    ],
    printedSI: 1,
  },

  // ============================================================
  // SEA DOMAIN (20 cards)
  // ============================================================

  {
    id: 'prog-csg',
    name: 'Carrier Strike Group',
    domain: 'SEA',
    subtags: ['Carrier', 'Capital'],
    pipelineCost: { budget: { S: 2, U: 2 } },
    activeCost: { budget: { S: 5, U: 3 } },
    activateEffects: [
      { type: 'placeBase', description: 'Place 1 Base in N. Atlantic or Indo-Pacific free', params: { theaters: ['northAtlantic', 'indoPacific'] } },
    ],
    sustainEffects: [
      { type: 'gainBudget', description: 'When you Deploy, gain +1 U', params: { U: 1, trigger: 'deploy' } },
    ],
  },
  {
    id: 'prog-virginia',
    name: 'Virginia-class Sub',
    domain: 'SEA',
    subtags: ['Sub', 'Classified'],
    pipelineCost: { budget: { S: 2, U: 1 } },
    activeCost: { budget: { S: 4, U: 2 } },
    activateEffects: [
      { type: 'conditionalSI', description: 'Gain +2 SI if you lead any theater', params: { condition: 'leadsAnyTheater', si: 2 } },
    ],
    sustainEffects: [
      { type: 'ignoreFirstCrisis', description: 'Ignore first Maritime Disruption crisis penalty each year', params: { crisisTag: 'maritime' } },
    ],
  },
  {
    id: 'prog-ddgx',
    name: 'DDG(X) Destroyer',
    domain: 'SEA',
    subtags: ['Surface'],
    pipelineCost: { budget: { S: 2, U: 1 } },
    activeCost: { budget: { S: 3, U: 2 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +1 M, +1 L', params: { M: 1, L: 1 } },
    ],
    sustainEffects: [
      { type: 'modifyReadiness', description: '+1 Readiness', params: { bonus: 1, timing: 'passive' } },
    ],
    stationing: { theaters: ['northAtlantic', 'indoPacific', 'middleEast'], strength: 1 },
  },
  {
    id: 'prog-lcs',
    name: 'Littoral Combat Ship',
    domain: 'SEA',
    subtags: ['Surface'],
    pipelineCost: { budget: { S: 1, U: 1 } },
    activeCost: { budget: { S: 2, U: 1 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +1 L', params: { L: 1 } },
    ],
    sustainEffects: [
      { type: 'gainBudget', description: 'Gain +1 U at start of each year', params: { U: 1, timing: 'yearStart' } },
    ],
    stationing: { theaters: ['indoPacific', 'middleEast'], strength: 1 },
  },
  {
    id: 'prog-ssbn',
    name: 'Columbia-class SSBN',
    domain: 'SEA',
    subtags: ['Sub', 'Capital', 'Classified'],
    pipelineCost: { budget: { S: 3, U: 2 } },
    activeCost: { budget: { S: 6, U: 3 } },
    activateEffects: [
      { type: 'gainSI', description: 'Gain +3 SI', params: { si: 3 } },
    ],
    sustainEffects: [
      { type: 'conditionalSI', description: 'Gain +1 SI at Year End if Readiness >= 3', params: { condition: 'readiness', threshold: 3, si: 1 } },
    ],
    printedSI: 1,
  },
  {
    id: 'prog-lha',
    name: 'Amphibious Assault Ship',
    domain: 'SEA',
    subtags: ['Capital'],
    pipelineCost: { budget: { S: 2, E: 1, U: 1 } },
    activeCost: { budget: { S: 3, E: 2, U: 2 } },
    activateEffects: [
      { type: 'placeForwardOps', description: 'Place Forward Ops at -1 U cost', params: { costModifier: { U: -1 } } },
    ],
    sustainEffects: [
      { type: 'gainSecondary', description: 'Gain +1 M when you Deploy', params: { M: 1, trigger: 'deploy' } },
    ],
  },
  {
    id: 'prog-usv',
    name: 'Unmanned Surface Vessel Squadron',
    domain: 'SEA',
    subtags: ['Surface', 'Network'],
    pipelineCost: { budget: { S: 1, X: 1 } },
    activeCost: { budget: { S: 2, X: 1, U: 1 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +1 I', params: { I: 1 } },
    ],
    sustainEffects: [
      { type: 'coverTheater', description: 'Spend 1 I to treat a theater as covered for contracts', params: { cost: { I: 1 } } },
    ],
    stationing: { theaters: ['indoPacific', 'northAtlantic'], strength: 1 },
  },
  {
    id: 'prog-frigate',
    name: 'Constellation-class Frigate',
    domain: 'SEA',
    subtags: ['Surface'],
    pipelineCost: { budget: { S: 1, U: 1 } },
    activeCost: { budget: { S: 2, U: 2 } },
    activateEffects: [
      { type: 'placeAlliance', description: 'Place 1 Alliance in any theater with your Base', params: { requireBase: true } },
    ],
    sustainEffects: [
      { type: 'gainBudget', description: 'Gain +1 S at Year Start', params: { S: 1, timing: 'yearStart' } },
    ],
    stationing: { theaters: ['northAtlantic', 'indoPacific', 'middleEast', 'arctic'], strength: 1 },
  },

  // --- New SEA cards ---

  {
    id: 'prog-burke',
    name: 'Arleigh Burke Flight III',
    domain: 'SEA',
    subtags: ['Surface'],
    pipelineCost: { budget: { S: 2, U: 1 } },
    activeCost: { budget: { S: 3, U: 2 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +1 M', params: { M: 1 } },
      { type: 'modifyReadiness', description: '+1 Readiness', params: { bonus: 1 } },
    ],
    sustainEffects: [
      { type: 'gainBudget', description: 'Gain +1 S at Year Start', params: { S: 1, timing: 'yearStart' } },
    ],
    stationing: { theaters: ['northAtlantic', 'indoPacific', 'middleEast'], strength: 1 },
  },
  {
    id: 'prog-zumwalt',
    name: 'Zumwalt-class Destroyer',
    domain: 'SEA',
    subtags: ['Surface', 'Classified'],
    pipelineCost: { budget: { S: 2, U: 1 } },
    activeCost: { budget: { S: 4, U: 2 } },
    activateEffects: [
      { type: 'gainSI', description: 'Gain +2 SI', params: { si: 2 } },
    ],
    sustainEffects: [
      { type: 'conditionalSI', description: 'If you lead any theater, gain +2 SI', params: { condition: 'leadsAnyTheater', si: 2 } },
    ],
    stationing: { theaters: ['indoPacific', 'northAtlantic'], strength: 1 },
    printedSI: 1,
  },
  {
    id: 'prog-mcm',
    name: 'Mine Countermeasures Squadron',
    domain: 'SEA',
    subtags: ['Surface', 'Ops'],
    pipelineCost: { budget: { S: 1, U: 1 } },
    activeCost: { budget: { S: 2, U: 1 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +1 L', params: { L: 1 } },
    ],
    sustainEffects: [
      { type: 'ignoreFirstCrisis', description: 'Ignore first Maritime Disruption penalty each year', params: { crisisTag: 'maritime' } },
    ],
    stationing: { theaters: ['indoPacific', 'middleEast'], strength: 1 },
  },
  {
    id: 'prog-esb',
    name: 'Expeditionary Sea Base',
    domain: 'SEA',
    subtags: ['Capital', 'Ops'],
    pipelineCost: { budget: { S: 2, U: 1 } },
    activeCost: { budget: { S: 3, U: 2 } },
    activateEffects: [
      { type: 'placeForwardOps', description: 'Place Forward Ops at -1 U cost', params: { costModifier: { U: -1 } } },
      { type: 'gainSecondary', description: 'Gain +1 L', params: { L: 1 } },
    ],
    sustainEffects: [
      { type: 'gainSecondary', description: 'Gain +1 M when you Deploy', params: { M: 1, trigger: 'deploy' } },
    ],
  },
  {
    id: 'prog-ohio-ssgn',
    name: 'Ohio-class SSGN Conversion',
    domain: 'SEA',
    subtags: ['Sub', 'Capital'],
    pipelineCost: { budget: { S: 2, U: 1 } },
    activeCost: { budget: { S: 4, U: 2 } },
    activateEffects: [
      { type: 'gainSI', description: 'Gain +2 SI', params: { si: 2 } },
      { type: 'gainSecondary', description: 'Gain +1 M', params: { M: 1 } },
    ],
    sustainEffects: [
      { type: 'conditionalSI', description: 'If Readiness >= 3, gain +1 SI at Year End', params: { condition: 'readiness', threshold: 3, si: 1 } },
    ],
    stationing: { theaters: ['indoPacific', 'middleEast'], strength: 1 },
    printedSI: 1,
  },
  {
    id: 'prog-uuv',
    name: 'Extra-Large UUV Program',
    domain: 'SEA',
    subtags: ['Sub', 'Network'],
    pipelineCost: { budget: { S: 1, X: 1 } },
    activeCost: { budget: { S: 2, X: 2 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +2 I', params: { I: 2 } },
    ],
    sustainEffects: [
      { type: 'coverTheater', description: 'Spend 1 I to treat a theater as covered for contracts', params: { cost: { I: 1 } } },
    ],
    stationing: { theaters: ['indoPacific', 'northAtlantic'], strength: 1 },
  },
  {
    id: 'prog-sbmd',
    name: 'Sea-Based Missile Defense',
    domain: 'SEA',
    subtags: ['Surface', 'Network'],
    pipelineCost: { budget: { S: 2, U: 1 } },
    activeCost: { budget: { S: 3, U: 2 } },
    activateEffects: [
      { type: 'modifyReadiness', description: '+2 Readiness', params: { bonus: 2 } },
    ],
    sustainEffects: [
      { type: 'ignoreFirstCrisis', description: 'Ignore first missile/strike crisis penalty each year', params: { crisisTag: 'strike' } },
    ],
    stationing: { theaters: ['indoPacific', 'northAtlantic', 'middleEast'], strength: 1 },
  },
  {
    id: 'prog-puller',
    name: 'USNS Puller Class ESB',
    domain: 'SEA',
    subtags: ['Capital'],
    pipelineCost: { budget: { S: 1, U: 1 } },
    activeCost: { budget: { S: 2, U: 2 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +1 L', params: { L: 1 } },
    ],
    sustainEffects: [
      { type: 'reduceCost', description: 'Deploy orders cost 1 less U', params: { orderCategory: 'Deploy', resource: 'U', amount: 1 } },
    ],
    stationing: { theaters: ['middleEast', 'indoPacific'], strength: 1 },
  },
  {
    id: 'prog-lcac',
    name: 'LCAC Hovercraft Fleet',
    domain: 'SEA',
    subtags: ['Surface', 'Marine'],
    pipelineCost: { budget: { S: 1, E: 1 } },
    activeCost: { budget: { S: 2, E: 1, U: 1 } },
    activateEffects: [
      { type: 'placeForwardOps', description: 'Place Forward Ops at -1 U cost', params: { costModifier: { U: -1 } } },
    ],
    sustainEffects: [
      { type: 'gainSecondary', description: 'Gain +1 M when you Deploy', params: { M: 1, trigger: 'deploy' } },
    ],
  },
  {
    id: 'prog-aoe',
    name: 'Fast Combat Support Ship',
    domain: 'SEA',
    subtags: ['Capital'],
    pipelineCost: { budget: { S: 1, U: 1 } },
    activeCost: { budget: { S: 2, U: 2 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +2 L', params: { L: 2 } },
    ],
    sustainEffects: [
      { type: 'gainProduction', description: '+1 L production', params: { L: 1 } },
    ],
  },
  {
    id: 'prog-ssn-attack',
    name: 'Attack Submarine Block VI',
    domain: 'SEA',
    subtags: ['Sub'],
    pipelineCost: { budget: { S: 2, U: 1 } },
    activeCost: { budget: { S: 3, U: 2 } },
    activateEffects: [
      { type: 'gainSI', description: 'Gain +1 SI', params: { si: 1 } },
    ],
    sustainEffects: [
      { type: 'conditionalSI', description: 'If you lead any theater, gain +2 SI', params: { condition: 'leadsAnyTheater', si: 2 } },
    ],
    stationing: { theaters: ['indoPacific', 'northAtlantic', 'arctic'], strength: 1 },
  },
  {
    id: 'prog-coast-guard',
    name: 'National Security Cutter',
    domain: 'SEA',
    subtags: ['Surface'],
    pipelineCost: { budget: { S: 1, U: 1 } },
    activeCost: { budget: { S: 2, U: 1 } },
    activateEffects: [
      { type: 'placeAlliance', description: 'Place 1 Alliance anywhere', params: { requireBase: false } },
    ],
    sustainEffects: [
      { type: 'gainBudget', description: 'Gain +1 U at Year Start', params: { U: 1, timing: 'yearStart' } },
    ],
    stationing: { theaters: ['homeland', 'northAtlantic'], strength: 1 },
  },

  // ============================================================
  // EXPEDITIONARY DOMAIN (20 cards)
  // ============================================================

  {
    id: 'prog-meu',
    name: 'MEU Package',
    domain: 'EXP',
    subtags: ['Marine', 'Ops'],
    pipelineCost: { budget: { E: 2, U: 1 } },
    activeCost: { budget: { E: 3, U: 2 } },
    activateEffects: [
      { type: 'placeForwardOps', description: 'Place Forward Ops at -1 U cost', params: { costModifier: { U: -1 } } },
    ],
    sustainEffects: [
      { type: 'conditionalSI', description: 'If Forward Ops in 2+ theaters, +2 SI at endgame', params: { condition: 'forwardOpsCount', threshold: 2, si: 2, timing: 'endgame' } },
    ],
  },
  {
    id: 'prog-ranger',
    name: 'Ranger Regiment',
    domain: 'EXP',
    subtags: ['SOF', 'Ops'],
    pipelineCost: { budget: { E: 1, U: 1 } },
    activeCost: { budget: { E: 2, U: 1 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +1 I, +1 M', params: { I: 1, M: 1 } },
    ],
    sustainEffects: [
      { type: 'gainSecondary', description: 'Gain +1 I when a Crisis is revealed', params: { I: 1, timing: 'crisisReveal' } },
    ],
    stationing: { theaters: ['middleEast', 'indoPacific', 'arctic'], strength: 1 },
  },
  {
    id: 'prog-jsoc',
    name: 'JSOC Task Force',
    domain: 'EXP',
    subtags: ['SOF', 'Classified'],
    pipelineCost: { budget: { E: 2, U: 1 } },
    activeCost: { budget: { E: 3, U: 2 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +2 I', params: { I: 2 } },
    ],
    sustainEffects: [
      { type: 'conditionalSI', description: 'Gain +1 SI at Year End per theater where you have Forward Ops', params: { condition: 'forwardOpsCount', siPerUnit: 1 } },
    ],
    stationing: { theaters: ['middleEast', 'indoPacific', 'homeland'], strength: 2 },
  },
  {
    id: 'prog-stryker',
    name: 'Stryker Brigade',
    domain: 'EXP',
    subtags: ['Marine'],
    pipelineCost: { budget: { E: 2, U: 1 } },
    activeCost: { budget: { E: 3, U: 2 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +2 M', params: { M: 2 } },
    ],
    sustainEffects: [
      { type: 'modifyReadiness', description: '+1 Readiness', params: { bonus: 1, timing: 'passive' } },
    ],
    stationing: { theaters: ['northAtlantic', 'middleEast', 'indoPacific'], strength: 2 },
  },
  {
    id: 'prog-seabee',
    name: 'Seabee Battalion',
    domain: 'EXP',
    subtags: ['Ops'],
    pipelineCost: { budget: { E: 1, U: 1 } },
    activeCost: { budget: { E: 2, U: 1 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +1 L', params: { L: 1 } },
    ],
    sustainEffects: [
      { type: 'reduceCost', description: 'Build Base costs 1 less U', params: { order: 'buildBase', resource: 'U', amount: 1 } },
    ],
  },
  {
    id: 'prog-himars',
    name: 'HIMARS Battery',
    domain: 'EXP',
    subtags: ['Marine'],
    pipelineCost: { budget: { E: 1, U: 1 } },
    activeCost: { budget: { E: 2, U: 2 } },
    activateEffects: [
      { type: 'gainSI', description: 'Gain +1 SI', params: { si: 1 } },
    ],
    sustainEffects: [
      { type: 'gainBudget', description: 'Gain +1 E at Year Start', params: { E: 1, timing: 'yearStart' } },
    ],
    stationing: { theaters: ['indoPacific', 'northAtlantic', 'arctic'], strength: 2 },
  },
  {
    id: 'prog-sfab',
    name: 'Security Force Assistance Brigade',
    domain: 'EXP',
    subtags: ['Ops'],
    pipelineCost: { budget: { E: 1 } },
    activeCost: { budget: { E: 2, U: 1 } },
    activateEffects: [
      { type: 'placeAlliance', description: 'Place 1 Alliance anywhere', params: { requireBase: false } },
    ],
    sustainEffects: [
      { type: 'gainSecondary', description: 'Gain +1 PC when you place an Alliance', params: { PC: 1, trigger: 'placeAlliance' } },
    ],
  },
  {
    id: 'prog-prepo',
    name: 'Prepositioned Stock Fleet',
    domain: 'EXP',
    subtags: ['Ops'],
    pipelineCost: { budget: { E: 1, U: 2 } },
    activeCost: { budget: { E: 2, U: 3 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +2 L', params: { L: 2 } },
    ],
    sustainEffects: [
      { type: 'gainProduction', description: '+1 L production', params: { L: 1 } },
    ],
  },

  // --- New EXP cards ---

  {
    id: 'prog-patriot',
    name: 'Patriot Battery',
    domain: 'EXP',
    subtags: ['Marine'],
    pipelineCost: { budget: { E: 2, U: 1 } },
    activeCost: { budget: { E: 3, U: 2 } },
    activateEffects: [
      { type: 'modifyReadiness', description: '+2 Readiness', params: { bonus: 2 } },
    ],
    sustainEffects: [
      { type: 'ignoreFirstCrisis', description: 'Ignore first missile/strike crisis penalty each year', params: { crisisTag: 'strike' } },
    ],
    stationing: { theaters: ['northAtlantic', 'middleEast', 'indoPacific'], strength: 2 },
  },
  {
    id: 'prog-thaad',
    name: 'THAAD Battery',
    domain: 'EXP',
    subtags: ['Marine'],
    pipelineCost: { budget: { E: 2, U: 1 } },
    activeCost: { budget: { E: 4, U: 2 } },
    activateEffects: [
      { type: 'modifyReadiness', description: '+2 Readiness', params: { bonus: 2 } },
      { type: 'gainSI', description: 'Gain +1 SI', params: { si: 1 } },
    ],
    sustainEffects: [
      { type: 'ignoreFirstCrisis', description: 'Ignore first missile/strike crisis penalty each year', params: { crisisTag: 'strike' } },
    ],
    stationing: { theaters: ['indoPacific', 'middleEast', 'homeland'], strength: 1 },
    printedSI: 1,
  },
  {
    id: 'prog-82nd',
    name: '82nd Airborne Division',
    domain: 'EXP',
    subtags: ['Marine', 'Ops'],
    pipelineCost: { budget: { E: 2, U: 1 } },
    activeCost: { budget: { E: 3, U: 2 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +2 M', params: { M: 2 } },
      { type: 'placeForwardOps', description: 'Place Forward Ops at -1 U cost', params: { costModifier: { U: -1 } } },
    ],
    sustainEffects: [
      { type: 'modifyReadiness', description: '+1 Readiness', params: { bonus: 1, timing: 'passive' } },
    ],
    stationing: { theaters: ['homeland', 'middleEast', 'northAtlantic'], strength: 2 },
  },
  {
    id: 'prog-combat-eng',
    name: 'Combat Engineer Brigade',
    domain: 'EXP',
    subtags: ['Ops'],
    pipelineCost: { budget: { E: 1, U: 1 } },
    activeCost: { budget: { E: 2, U: 1 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +1 L', params: { L: 1 } },
    ],
    sustainEffects: [
      { type: 'reduceCost', description: 'Build Base costs 1 less U', params: { order: 'buildBase', resource: 'U', amount: 1 } },
    ],
  },
  {
    id: 'prog-mlr',
    name: 'Marine Littoral Regiment',
    domain: 'EXP',
    subtags: ['Marine'],
    pipelineCost: { budget: { E: 2, U: 1 } },
    activeCost: { budget: { E: 3, U: 2 } },
    activateEffects: [
      { type: 'gainSI', description: 'Gain +1 SI', params: { si: 1 } },
      { type: 'gainSecondary', description: 'Gain +1 M', params: { M: 1 } },
    ],
    sustainEffects: [
      { type: 'conditionalSI', description: 'If Forward Ops in 2+ theaters, +2 SI at endgame', params: { condition: 'forwardOpsCount', threshold: 2, si: 2, timing: 'endgame' } },
    ],
    stationing: { theaters: ['indoPacific'], strength: 2 },
  },
  {
    id: 'prog-sfg',
    name: 'Special Forces Group',
    domain: 'EXP',
    subtags: ['SOF'],
    pipelineCost: { budget: { E: 1, U: 1 } },
    activeCost: { budget: { E: 2, U: 1 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +2 I', params: { I: 2 } },
    ],
    sustainEffects: [
      { type: 'gainSecondary', description: 'Gain +1 I when a Crisis is revealed', params: { I: 1, timing: 'crisisReveal' } },
    ],
    stationing: { theaters: ['middleEast', 'indoPacific', 'arctic'], strength: 1 },
  },
  {
    id: 'prog-air-assault',
    name: '101st Air Assault Division',
    domain: 'EXP',
    subtags: ['Marine', 'Ops'],
    pipelineCost: { budget: { E: 2, A: 1, U: 1 } },
    activeCost: { budget: { E: 3, A: 1, U: 2 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +1 M', params: { M: 1 } },
      { type: 'gainSecondary', description: 'Gain +1 L', params: { L: 1 } },
    ],
    sustainEffects: [
      { type: 'reduceCost', description: 'Deploy orders cost 1 less U', params: { orderCategory: 'Deploy', resource: 'U', amount: 1 } },
    ],
    stationing: { theaters: ['homeland', 'middleEast'], strength: 2 },
  },
  {
    id: 'prog-civil-affairs',
    name: 'Civil Affairs Command',
    domain: 'EXP',
    subtags: ['Ops'],
    pipelineCost: { budget: { E: 1 } },
    activeCost: { budget: { E: 2, U: 1 } },
    activateEffects: [
      { type: 'placeAlliance', description: 'Place 1 Alliance anywhere', params: { requireBase: false } },
      { type: 'gainSecondary', description: 'Gain +1 PC', params: { PC: 1 } },
    ],
    sustainEffects: [
      { type: 'gainSecondary', description: 'Gain +1 PC at Year Start', params: { PC: 1, timing: 'yearStart' } },
    ],
  },
  {
    id: 'prog-mountain-inf',
    name: '10th Mountain Division',
    domain: 'EXP',
    subtags: ['Marine'],
    pipelineCost: { budget: { E: 1, U: 1 } },
    activeCost: { budget: { E: 2, U: 2 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +2 M', params: { M: 2 } },
    ],
    sustainEffects: [
      { type: 'modifyReadiness', description: '+1 Readiness', params: { bonus: 1, timing: 'passive' } },
    ],
    stationing: { theaters: ['arctic', 'northAtlantic', 'middleEast'], strength: 2 },
  },
  {
    id: 'prog-psyop',
    name: 'Psychological Operations Group',
    domain: 'EXP',
    subtags: ['SOF', 'Ops'],
    pipelineCost: { budget: { E: 1, U: 1 } },
    activeCost: { budget: { E: 2, U: 1 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +1 PC, +1 I', params: { PC: 1, I: 1 } },
    ],
    sustainEffects: [
      { type: 'gainSecondary', description: 'Gain +1 PC when you place an Alliance', params: { PC: 1, trigger: 'placeAlliance' } },
    ],
  },
  {
    id: 'prog-log-brigade',
    name: 'Sustainment Brigade',
    domain: 'EXP',
    subtags: ['Ops'],
    pipelineCost: { budget: { E: 1, U: 1 } },
    activeCost: { budget: { E: 2, U: 2 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +2 L', params: { L: 2 } },
    ],
    sustainEffects: [
      { type: 'gainProduction', description: '+1 L production', params: { L: 1 } },
    ],
  },
  {
    id: 'prog-medevac',
    name: 'Combat MEDEVAC Battalion',
    domain: 'EXP',
    subtags: ['Ops'],
    pipelineCost: { budget: { E: 1, U: 1 } },
    activeCost: { budget: { E: 2, U: 1 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +1 M', params: { M: 1 } },
    ],
    sustainEffects: [
      { type: 'modifyReadiness', description: '+1 Readiness', params: { bonus: 1, timing: 'passive' } },
    ],
  },

  // ============================================================
  // SPACE/CYBER DOMAIN (20 cards)
  // ============================================================

  {
    id: 'prog-satcom',
    name: 'Satcom Upgrade',
    domain: 'SPACE_CYBER',
    subtags: ['Space', 'Network'],
    pipelineCost: { budget: { X: 2 } },
    activeCost: { budget: { X: 3, U: 1 } },
    activateEffects: [
      { type: 'gainProduction', description: '+1 I production', params: { I: 1 } },
      { type: 'drawCards', description: 'Draw 1 card', params: { count: 1 } },
    ],
    sustainEffects: [
      { type: 'coverTheater', description: 'Spend 1 I to treat any theater as covered for a Contract', params: { cost: { I: 1 } } },
    ],
  },
  {
    id: 'prog-gps3',
    name: 'GPS III Constellation',
    domain: 'SPACE_CYBER',
    subtags: ['Space', 'Network'],
    pipelineCost: { budget: { X: 2, U: 1 } },
    activeCost: { budget: { X: 4, U: 2 } },
    activateEffects: [
      { type: 'gainProduction', description: '+1 I production', params: { I: 1 } },
      { type: 'gainSecondary', description: 'Gain +1 I', params: { I: 1 } },
    ],
    sustainEffects: [
      { type: 'modifyReadiness', description: '+1 Readiness', params: { bonus: 1, timing: 'passive' } },
    ],
    printedSI: 1,
  },
  {
    id: 'prog-cyber-cmd',
    name: 'Cyber Mission Force',
    domain: 'SPACE_CYBER',
    subtags: ['Cyber'],
    pipelineCost: { budget: { X: 1 } },
    activeCost: { budget: { X: 2, U: 1 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +2 I', params: { I: 2 } },
    ],
    sustainEffects: [
      { type: 'gainSecondary', description: 'Gain +1 PC when opponent gains I', params: { PC: 1, trigger: 'opponentGainsI' } },
    ],
  },
  {
    id: 'prog-sbirs',
    name: 'SBIRS Missile Warning',
    domain: 'SPACE_CYBER',
    subtags: ['Space'],
    pipelineCost: { budget: { X: 2, U: 1 } },
    activeCost: { budget: { X: 3, U: 2 } },
    activateEffects: [
      { type: 'modifyReadiness', description: '+2 Readiness', params: { bonus: 2 } },
    ],
    sustainEffects: [
      { type: 'ignoreFirstCrisis', description: 'Ignore first missile/strike crisis penalty each year', params: { crisisTag: 'strike' } },
    ],
  },
  {
    id: 'prog-starlink-mil',
    name: 'Military Mesh Network',
    domain: 'SPACE_CYBER',
    subtags: ['Space', 'Network'],
    pipelineCost: { budget: { X: 2, U: 1 } },
    activeCost: { budget: { X: 3, U: 1 } },
    activateEffects: [
      { type: 'drawCards', description: 'Draw 2 cards', params: { count: 2 } },
    ],
    sustainEffects: [
      { type: 'reduceCost', description: 'Network programs cost 1 less X', params: { subtag: 'Network', resource: 'X', amount: 1 } },
    ],
  },
  {
    id: 'prog-jaic',
    name: 'AI Command Platform',
    domain: 'SPACE_CYBER',
    subtags: ['Cyber', 'Network'],
    pipelineCost: { budget: { X: 3 } },
    activeCost: { budget: { X: 4, U: 1 } },
    activateEffects: [
      { type: 'gainSI', description: 'Gain +2 SI', params: { si: 2 } },
      { type: 'gainSecondary', description: 'Gain +1 I', params: { I: 1 } },
    ],
    sustainEffects: [
      { type: 'conditionalSI', description: 'If 3+ Network programs active, +2 SI at Year End', params: { condition: 'activeSubtagCount', subtag: 'Network', threshold: 3, si: 2 } },
    ],
    printedSI: 1,
  },
  {
    id: 'prog-space-fence',
    name: 'Space Fence Radar',
    domain: 'SPACE_CYBER',
    subtags: ['Space'],
    pipelineCost: { budget: { X: 1, U: 1 } },
    activeCost: { budget: { X: 2, U: 1 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +1 I', params: { I: 1 } },
    ],
    sustainEffects: [
      { type: 'gainSecondary', description: 'At Crisis Pulse, peek at next Crisis', params: { I: 0, timing: 'crisisPeek' } },
    ],
  },
  {
    id: 'prog-offensive-cyber',
    name: 'Offensive Cyber Operations',
    domain: 'SPACE_CYBER',
    subtags: ['Cyber', 'Classified'],
    pipelineCost: { budget: { X: 2 } },
    activeCost: { budget: { X: 3, U: 1 } },
    activateEffects: [
      { type: 'gainSI', description: 'Gain +1 SI', params: { si: 1 } },
      { type: 'gainSecondary', description: 'Gain +2 I', params: { I: 2 } },
    ],
    sustainEffects: [
      { type: 'gainSecondary', description: 'When you choose Intel Focus, gain +1 additional I', params: { I: 1, trigger: 'intelFocus' } },
    ],
  },

  // --- New SPACE_CYBER cards ---

  {
    id: 'prog-cyber-def',
    name: 'Defensive Cyber Operations Center',
    domain: 'SPACE_CYBER',
    subtags: ['Cyber'],
    pipelineCost: { budget: { X: 1, U: 1 } },
    activeCost: { budget: { X: 2, U: 1 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +1 I', params: { I: 1 } },
    ],
    sustainEffects: [
      { type: 'ignoreFirstCrisis', description: 'Ignore first cyber crisis penalty each year', params: { crisisTag: 'cyber' } },
    ],
  },
  {
    id: 'prog-space-launch',
    name: 'National Security Space Launch',
    domain: 'SPACE_CYBER',
    subtags: ['Space'],
    pipelineCost: { budget: { X: 2, U: 1 } },
    activeCost: { budget: { X: 4, U: 2 } },
    activateEffects: [
      { type: 'gainSI', description: 'Gain +2 SI', params: { si: 2 } },
      { type: 'gainProduction', description: '+1 I production', params: { I: 1 } },
    ],
    sustainEffects: [
      { type: 'conditionalSI', description: 'If Readiness >= 4, gain +1 SI at Year End', params: { condition: 'readiness', threshold: 4, si: 1 } },
    ],
    printedSI: 1,
  },
  {
    id: 'prog-counter-space',
    name: 'Counter-Space Capabilities',
    domain: 'SPACE_CYBER',
    subtags: ['Space', 'Classified'],
    pipelineCost: { budget: { X: 2, U: 1 } },
    activeCost: { budget: { X: 4, U: 2 } },
    activateEffects: [
      { type: 'gainSI', description: 'Gain +1 SI', params: { si: 1 } },
      { type: 'gainSecondary', description: 'Gain +2 I', params: { I: 2 } },
    ],
    sustainEffects: [
      { type: 'conditionalSI', description: 'If you lead any theater, gain +2 SI', params: { condition: 'leadsAnyTheater', si: 2 } },
    ],
    printedSI: 1,
  },
  {
    id: 'prog-sigint',
    name: 'SIGINT Collection System',
    domain: 'SPACE_CYBER',
    subtags: ['Network', 'Classified'],
    pipelineCost: { budget: { X: 2 } },
    activeCost: { budget: { X: 3, U: 1 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +3 I', params: { I: 3 } },
    ],
    sustainEffects: [
      { type: 'gainSecondary', description: 'Gain +1 I at start of each Quarter', params: { I: 1, timing: 'quarterStart' } },
    ],
  },
  {
    id: 'prog-navwar',
    name: 'Navigation Warfare Program',
    domain: 'SPACE_CYBER',
    subtags: ['Space', 'Network'],
    pipelineCost: { budget: { X: 1, U: 1 } },
    activeCost: { budget: { X: 2, U: 1 } },
    activateEffects: [
      { type: 'modifyReadiness', description: '+1 Readiness', params: { bonus: 1 } },
    ],
    sustainEffects: [
      { type: 'reduceCost', description: 'Network programs cost 1 less X', params: { subtag: 'Network', resource: 'X', amount: 1 } },
    ],
  },
  {
    id: 'prog-ew-sq',
    name: 'Electronic Warfare Squadron',
    domain: 'SPACE_CYBER',
    subtags: ['Cyber', 'Network'],
    pipelineCost: { budget: { X: 1, A: 1 } },
    activeCost: { budget: { X: 2, A: 1, U: 1 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +2 I', params: { I: 2 } },
    ],
    sustainEffects: [
      { type: 'gainSecondary', description: 'When you choose Intel Focus, gain +1 additional I', params: { I: 1, trigger: 'intelFocus' } },
    ],
  },
  {
    id: 'prog-ground-station',
    name: 'Resilient Ground Station Network',
    domain: 'SPACE_CYBER',
    subtags: ['Space', 'Network'],
    pipelineCost: { budget: { X: 2, U: 1 } },
    activeCost: { budget: { X: 3, U: 1 } },
    activateEffects: [
      { type: 'gainProduction', description: '+1 I production', params: { I: 1 } },
    ],
    sustainEffects: [
      { type: 'modifyReadiness', description: '+1 Readiness', params: { bonus: 1, timing: 'passive' } },
    ],
  },
  {
    id: 'prog-cloud-infra',
    name: 'JWCC Cloud Infrastructure',
    domain: 'SPACE_CYBER',
    subtags: ['Cyber', 'Network'],
    pipelineCost: { budget: { X: 2 } },
    activeCost: { budget: { X: 3, U: 1 } },
    activateEffects: [
      { type: 'drawCards', description: 'Draw 2 cards', params: { count: 2 } },
      { type: 'gainSecondary', description: 'Gain +1 I', params: { I: 1 } },
    ],
    sustainEffects: [
      { type: 'reduceCost', description: 'Cyber programs cost 1 less X', params: { subtag: 'Cyber', resource: 'X', amount: 1 } },
    ],
  },
  {
    id: 'prog-autonomous',
    name: 'Autonomous Systems Office',
    domain: 'SPACE_CYBER',
    subtags: ['Network', 'Cyber'],
    pipelineCost: { budget: { X: 2 } },
    activeCost: { budget: { X: 3, U: 1 } },
    activateEffects: [
      { type: 'gainSI', description: 'Gain +1 SI', params: { si: 1 } },
      { type: 'gainSecondary', description: 'Gain +1 I', params: { I: 1 } },
    ],
    sustainEffects: [
      { type: 'conditionalSI', description: 'If 2+ Network programs active, gain +2 SI at Year End', params: { condition: 'activeSubtagCount', subtag: 'Network', threshold: 2, si: 2 } },
    ],
  },
  {
    id: 'prog-drone-swarm',
    name: 'Attritable Drone Swarm Program',
    domain: 'SPACE_CYBER',
    subtags: ['Network'],
    pipelineCost: { budget: { X: 1, A: 1 } },
    activeCost: { budget: { X: 2, A: 1, U: 1 } },
    activateEffects: [
      { type: 'gainSI', description: 'Gain +1 SI', params: { si: 1 } },
    ],
    sustainEffects: [
      { type: 'gainSecondary', description: 'Gain +1 I at start of each Quarter', params: { I: 1, timing: 'quarterStart' } },
    ],
    stationing: { theaters: ['indoPacific', 'middleEast'], strength: 1 },
  },
  {
    id: 'prog-quant-research',
    name: 'Quantum Research Initiative',
    domain: 'SPACE_CYBER',
    subtags: ['Cyber', 'Classified'],
    pipelineCost: { budget: { X: 2 } },
    activeCost: { budget: { X: 3, U: 1 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +2 I', params: { I: 2 } },
      { type: 'drawCards', description: 'Draw 1 card', params: { count: 1 } },
    ],
    sustainEffects: [
      { type: 'gainProduction', description: '+1 I production', params: { I: 1 } },
    ],
  },
  {
    id: 'prog-resilient-comms',
    name: 'Resilient Communications Architecture',
    domain: 'SPACE_CYBER',
    subtags: ['Space', 'Network'],
    pipelineCost: { budget: { X: 2, U: 1 } },
    activeCost: { budget: { X: 3, U: 1 } },
    activateEffects: [
      { type: 'gainProduction', description: '+1 I production', params: { I: 1 } },
    ],
    sustainEffects: [
      { type: 'ignoreFirstCrisis', description: 'Ignore first cyber crisis penalty each year', params: { crisisTag: 'cyber' } },
    ],
  },

  // ============================================================
  // CROSS-DOMAIN (20 cards — multi-budget, industry, doctrine, politics)
  // ============================================================

  {
    id: 'prog-jadc2',
    name: 'JADC2 Architecture',
    domain: 'SPACE_CYBER',
    subtags: ['Network', 'Doctrine'],
    pipelineCost: { budget: { X: 2, A: 1 } },
    activeCost: { budget: { X: 3, A: 1, U: 1 } },
    activateEffects: [
      { type: 'gainProduction', description: '+1 I production', params: { I: 1 } },
    ],
    sustainEffects: [
      { type: 'gainSI', description: 'Gain +1 SI per 2 Network programs you have active (at Year End)', params: { si: 1, per: 2, subtag: 'Network', timing: 'yearEnd' } },
    ],
  },
  {
    id: 'prog-allied-interop',
    name: 'Allied Interoperability Program',
    domain: 'EXP',
    subtags: ['Doctrine', 'Politics'],
    pipelineCost: { budget: { E: 1 }, secondary: { PC: 1 } },
    activeCost: { budget: { E: 2, U: 1 }, secondary: { PC: 1 } },
    activateEffects: [
      { type: 'placeAlliance', description: 'Place 2 Alliances in different theaters', params: { count: 2, different: true } },
    ],
    sustainEffects: [
      { type: 'gainSecondary', description: 'Gain +1 PC at Year Start', params: { PC: 1, timing: 'yearStart' } },
    ],
  },
  {
    id: 'prog-dib',
    name: 'Defense Industrial Base Expansion',
    domain: 'EXP',
    subtags: ['Industry'],
    pipelineCost: { budget: { U: 2 } },
    activeCost: { budget: { U: 3 } },
    activateEffects: [
      { type: 'gainProduction', description: '+1 U production', params: { U: 1 } },
    ],
    sustainEffects: [
      { type: 'reduceCost', description: 'All Pipeline costs reduced by 1 U', params: { action: 'pipeline', resource: 'U', amount: 1 } },
    ],
  },
  {
    id: 'prog-shipyard',
    name: 'Shipyard Modernization',
    domain: 'SEA',
    subtags: ['Industry'],
    pipelineCost: { budget: { S: 1, U: 2 } },
    activeCost: { budget: { S: 2, U: 3 } },
    activateEffects: [
      { type: 'gainProduction', description: '+1 S production', params: { S: 1 } },
    ],
    sustainEffects: [
      { type: 'reduceCost', description: 'SEA programs cost 1 less S to activate', params: { domain: 'SEA', resource: 'S', amount: 1 } },
    ],
  },
  {
    id: 'prog-munitions',
    name: 'Munitions Surge Program',
    domain: 'AIR',
    subtags: ['Industry'],
    pipelineCost: { budget: { A: 1, U: 1 } },
    activeCost: { budget: { A: 1, U: 2 } },
    activateEffects: [
      { type: 'gainBudget', description: 'Gain +2 of any one budget line', params: { choice: 'any', amount: 2 } },
    ],
    sustainEffects: [
      { type: 'gainProduction', description: '+1 A production', params: { A: 1 } },
    ],
  },
  {
    id: 'prog-indo-pac-init',
    name: 'Pacific Deterrence Initiative',
    domain: 'EXP',
    subtags: ['Doctrine', 'Politics'],
    pipelineCost: { budget: { E: 1, U: 1 }, secondary: { PC: 1 } },
    activeCost: { budget: { E: 2, U: 2 }, secondary: { PC: 1 } },
    activateEffects: [
      { type: 'placeBase', description: 'Place 1 Base in Indo-Pacific free', params: { theaters: ['indoPacific'] } },
    ],
    sustainEffects: [
      { type: 'conditionalSI', description: '+2 SI at Year End if you control Indo-Pacific', params: { condition: 'controlsTheater', theater: 'indoPacific', si: 2 } },
    ],
  },
  {
    id: 'prog-nato-readiness',
    name: 'NATO Readiness Initiative',
    domain: 'EXP',
    subtags: ['Doctrine', 'Politics'],
    pipelineCost: { budget: { E: 1 }, secondary: { PC: 1 } },
    activeCost: { budget: { E: 2, U: 1 }, secondary: { PC: 1 } },
    activateEffects: [
      { type: 'placeAlliance', description: 'Place 1 Alliance in North Atlantic', params: { theaters: ['northAtlantic'] } },
      { type: 'modifyReadiness', description: '+1 Readiness', params: { bonus: 1 } },
    ],
    sustainEffects: [
      { type: 'conditionalSI', description: '+1 SI at Year End if 2+ Alliances in N. Atlantic', params: { condition: 'allianceCountInTheater', theater: 'northAtlantic', threshold: 2, si: 1 } },
    ],
  },
  {
    id: 'prog-arctic-strategy',
    name: 'Arctic Strategy Office',
    domain: 'SPACE_CYBER',
    subtags: ['Doctrine'],
    pipelineCost: { budget: { X: 1, U: 1 } },
    activeCost: { budget: { X: 2, U: 1 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +1 I, +1 L', params: { I: 1, L: 1 } },
    ],
    sustainEffects: [
      { type: 'reduceCost', description: 'Deploy orders in Arctic cost 1 less U', params: { theater: 'arctic', resource: 'U', amount: 1 } },
    ],
  },

  // --- New cross-domain cards ---

  {
    id: 'prog-hypersonic',
    name: 'Hypersonic Weapons Program',
    domain: 'AIR',
    subtags: ['Industry', 'Classified'],
    pipelineCost: { budget: { A: 3, X: 1 } },
    activeCost: { budget: { A: 5, X: 2 } },
    activateEffects: [
      { type: 'gainSI', description: 'Gain +2 SI', params: { si: 2 } },
      { type: 'satisfyContractStep', description: 'Satisfy 1 Fighter contract step', params: { tag: 'Fighter' } },
    ],
    sustainEffects: [
      { type: 'conditionalSI', description: 'If Readiness >= 4, gain +1 SI at Year End', params: { condition: 'readiness', threshold: 4, si: 1 } },
    ],
    printedSI: 1,
  },
  {
    id: 'prog-directed-energy',
    name: 'Directed Energy Weapons Program',
    domain: 'AIR',
    subtags: ['Industry', 'Classified'],
    pipelineCost: { budget: { A: 2, X: 1 } },
    activeCost: { budget: { A: 3, X: 2, U: 1 } },
    activateEffects: [
      { type: 'gainSI', description: 'Gain +1 SI', params: { si: 1 } },
      { type: 'gainSecondary', description: 'Gain +1 I', params: { I: 1 } },
    ],
    sustainEffects: [
      { type: 'ignoreFirstCrisis', description: 'Ignore first missile/strike crisis penalty each year', params: { crisisTag: 'strike' } },
    ],
  },
  {
    id: 'prog-iads',
    name: 'Integrated Air Defense System',
    domain: 'AIR',
    subtags: ['Network', 'Doctrine'],
    pipelineCost: { budget: { A: 2, E: 1 } },
    activeCost: { budget: { A: 3, E: 2, U: 1 } },
    activateEffects: [
      { type: 'modifyReadiness', description: '+2 Readiness', params: { bonus: 2 } },
    ],
    sustainEffects: [
      { type: 'ignoreFirstCrisis', description: 'Ignore first missile/strike crisis penalty each year', params: { crisisTag: 'strike' } },
    ],
    stationing: { theaters: ['homeland', 'northAtlantic', 'indoPacific'], strength: 1 },
  },
  {
    id: 'prog-jle',
    name: 'Joint Logistics Enterprise',
    domain: 'EXP',
    subtags: ['Doctrine', 'Industry'],
    pipelineCost: { budget: { E: 1, U: 2 } },
    activeCost: { budget: { E: 2, U: 3 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +2 L', params: { L: 2 } },
      { type: 'gainProduction', description: '+1 L production', params: { L: 1 } },
    ],
    sustainEffects: [
      { type: 'reduceCost', description: 'Deploy orders cost 1 less U', params: { orderCategory: 'Deploy', resource: 'U', amount: 1 } },
    ],
  },
  {
    id: 'prog-stratcomm',
    name: 'Strategic Communications Office',
    domain: 'EXP',
    subtags: ['Politics', 'Doctrine'],
    pipelineCost: { budget: { E: 1 }, secondary: { PC: 1 } },
    activeCost: { budget: { E: 2, U: 1 }, secondary: { PC: 1 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +2 PC', params: { PC: 2 } },
      { type: 'placeAlliance', description: 'Place 1 Alliance anywhere', params: { requireBase: false } },
    ],
    sustainEffects: [
      { type: 'gainSecondary', description: 'Gain +1 PC at Year Start', params: { PC: 1, timing: 'yearStart' } },
    ],
  },
  {
    id: 'prog-wargaming',
    name: 'Joint Wargaming Center',
    domain: 'SPACE_CYBER',
    subtags: ['Doctrine'],
    pipelineCost: { budget: { X: 1, U: 1 } },
    activeCost: { budget: { X: 2, U: 1 } },
    activateEffects: [
      { type: 'drawCards', description: 'Draw 2 cards', params: { count: 2 } },
    ],
    sustainEffects: [
      { type: 'gainSecondary', description: 'Gain +1 I at start of each Quarter', params: { I: 1, timing: 'quarterStart' } },
    ],
  },
  {
    id: 'prog-innovation-lab',
    name: 'Defense Innovation Unit',
    domain: 'SPACE_CYBER',
    subtags: ['Industry', 'Network'],
    pipelineCost: { budget: { X: 1, U: 1 } },
    activeCost: { budget: { X: 2, U: 2 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +1 I', params: { I: 1 } },
      { type: 'drawCards', description: 'Draw 1 card', params: { count: 1 } },
    ],
    sustainEffects: [
      { type: 'gainProduction', description: '+1 I production', params: { I: 1 } },
    ],
  },
  {
    id: 'prog-force-design',
    name: 'Force Design 2030',
    domain: 'EXP',
    subtags: ['Doctrine'],
    pipelineCost: { budget: { E: 1, U: 1 } },
    activeCost: { budget: { E: 2, U: 1 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +1 M', params: { M: 1 } },
      { type: 'modifyReadiness', description: '+1 Readiness', params: { bonus: 1 } },
    ],
    sustainEffects: [
      { type: 'gainBudget', description: 'Gain +1 E at Year Start', params: { E: 1, timing: 'yearStart' } },
    ],
  },
  {
    id: 'prog-combined-arms',
    name: 'Multi-Domain Operations Concept',
    domain: 'EXP',
    subtags: ['Doctrine'],
    pipelineCost: { budget: { E: 2, A: 1 } },
    activeCost: { budget: { E: 3, A: 1, U: 1 } },
    activateEffects: [
      { type: 'gainSI', description: 'Gain +1 SI', params: { si: 1 } },
      { type: 'gainSecondary', description: 'Gain +1 M', params: { M: 1 } },
    ],
    sustainEffects: [
      { type: 'conditionalSI', description: 'If you have a Base in 3+ theaters, gain +1 SI at Year End', params: { condition: 'baseCount', threshold: 3, si: 1 } },
    ],
  },
  {
    id: 'prog-medical-ready',
    name: 'Expeditionary Medical Readiness',
    domain: 'EXP',
    subtags: ['Ops'],
    pipelineCost: { budget: { E: 1, U: 1 } },
    activeCost: { budget: { E: 2, U: 1 } },
    activateEffects: [
      { type: 'modifyReadiness', description: '+2 Readiness', params: { bonus: 2 } },
    ],
    sustainEffects: [
      { type: 'modifyReadiness', description: '+1 Readiness', params: { bonus: 1, timing: 'passive' } },
    ],
  },
  {
    id: 'prog-cip',
    name: 'Critical Infrastructure Protection',
    domain: 'SPACE_CYBER',
    subtags: ['Cyber', 'Politics'],
    pipelineCost: { budget: { X: 1, U: 1 } },
    activeCost: { budget: { X: 2, U: 1 } },
    activateEffects: [
      { type: 'gainSecondary', description: 'Gain +1 PC', params: { PC: 1 } },
    ],
    sustainEffects: [
      { type: 'ignoreFirstCrisis', description: 'Ignore first cyber crisis penalty each year', params: { crisisTag: 'cyber' } },
    ],
  },
  {
    id: 'prog-resilient-basing',
    name: 'Resilient Basing Initiative',
    domain: 'EXP',
    subtags: ['Doctrine', 'Industry'],
    pipelineCost: { budget: { E: 1, U: 2 } },
    activeCost: { budget: { E: 2, U: 3 } },
    activateEffects: [
      { type: 'placeBase', description: 'Place 1 Base in N. Atlantic or Indo-Pacific free', params: { theaters: ['northAtlantic', 'indoPacific'] } },
    ],
    sustainEffects: [
      { type: 'conditionalSI', description: 'If you have a Base in 3+ theaters, gain +1 SI at Year End', params: { condition: 'baseCount', threshold: 3, si: 1 } },
    ],
  },
];
