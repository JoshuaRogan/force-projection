import type { ProgramCard } from '../cards.js';

/** Starter set: 40 program cards, 8 per domain + 4 cross-domain */
export const PROGRAM_CARDS: ProgramCard[] = [

  // ============================================================
  // AIR DOMAIN (8 cards)
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

  // ============================================================
  // SEA DOMAIN (8 cards)
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

  // ============================================================
  // EXPEDITIONARY DOMAIN (8 cards)
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

  // ============================================================
  // SPACE/CYBER DOMAIN (8 cards)
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

  // ============================================================
  // CROSS-DOMAIN (8 cards — multi-budget, industry, doctrine, politics)
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
];
