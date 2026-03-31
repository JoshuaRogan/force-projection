import type { TheaterId } from './theaters.js';

// === Orders ===
// Each quarter, players pick 2 of these 12 orders.
// Orders resolve in category sequence: Influence > Procure > Deploy > Sustain.

export type OrderCategory = 'Influence' | 'Procure' | 'Deploy' | 'Sustain';

export type OrderId =
  // Influence
  | 'lobby'
  | 'negotiate'
  | 'contracting'
  // Procure
  | 'startProgram'
  | 'activateProgram'
  | 'refitMothball'
  // Deploy
  | 'buildBase'
  | 'forwardOps'
  | 'stationPrograms'
  // Sustain
  | 'majorExercise'
  | 'logisticsSurge'
  | 'intelFocus';

export const ORDER_RESOLUTION_SEQUENCE: readonly OrderCategory[] = [
  'Influence', 'Procure', 'Deploy', 'Sustain',
] as const;

export interface OrderDefinition {
  id: OrderId;
  name: string;
  category: OrderCategory;
  description: string;
}

export const ORDERS: Record<OrderId, OrderDefinition> = {
  // -- Influence --
  lobby: {
    id: 'lobby',
    name: 'Lobby',
    category: 'Influence',
    description: 'Gain +2 PC. If Agenda passed, also gain +1 of the Agenda\'s favored budget line.',
  },
  negotiate: {
    id: 'negotiate',
    name: 'Negotiate',
    category: 'Influence',
    description: 'Place 1 Alliance in a theater where you have a Base, or spend 1 PC to place it anywhere.',
  },
  contracting: {
    id: 'contracting',
    name: 'Contracting',
    category: 'Influence',
    description: 'Draw 2 Contracts, keep 1. If you already have 2 active Contracts, instead gain +1 SI.',
  },
  // -- Procure --
  startProgram: {
    id: 'startProgram',
    name: 'Start Program',
    category: 'Procure',
    description: 'Place a Program from hand into a Pipeline slot by paying its Pipeline cost.',
  },
  activateProgram: {
    id: 'activateProgram',
    name: 'Activate Program',
    category: 'Procure',
    description: 'Pay full cost, move a Program directly into an Active slot and gain its immediate effect.',
  },
  refitMothball: {
    id: 'refitMothball',
    name: 'Refit / Mothball',
    category: 'Procure',
    description: 'Move 1 Active program to Mothball (gain +1 U), or reactivate 1 Mothballed program (pay 1 U + 1 of its budget line).',
  },
  // -- Deploy --
  buildBase: {
    id: 'buildBase',
    name: 'Build Base',
    category: 'Deploy',
    description: 'Pay 2 U + 1 of any line; place a Base in any theater with an open Base slot.',
  },
  forwardOps: {
    id: 'forwardOps',
    name: 'Forward Ops',
    category: 'Deploy',
    description: 'Requires a Base in that theater. Pay 1 L + 2 U; place Forward Ops in that theater.',
  },
  stationPrograms: {
    id: 'stationPrograms',
    name: 'Station Programs',
    category: 'Deploy',
    description: 'Move up to 2 Stationed markers from Active Programs to theaters for strength and contract progress.',
  },
  // -- Sustain --
  majorExercise: {
    id: 'majorExercise',
    name: 'Major Exercise',
    category: 'Sustain',
    description: 'Pay 1 M + 1 U; gain Readiness +2 and draw 1 card.',
  },
  logisticsSurge: {
    id: 'logisticsSurge',
    name: 'Logistics Surge',
    category: 'Sustain',
    description: 'Gain +2 L and reduce the Quarter Crisis penalty against you by 1.',
  },
  intelFocus: {
    id: 'intelFocus',
    name: 'Intel Focus',
    category: 'Sustain',
    description: 'Gain +2 I. Spend 1 I to change your Order resolution position by +1.',
  },
};

export const ALL_ORDER_IDS: readonly OrderId[] = Object.keys(ORDERS) as OrderId[];

// === Order Choices ===
// When a player selects an order, some orders need additional parameters.

export interface LobbyChoice { order: 'lobby'; }
export interface NegotiateChoice { order: 'negotiate'; theater: TheaterId; payPC: boolean; }
export interface ContractingChoice { order: 'contracting'; }
export interface StartProgramChoice { order: 'startProgram'; cardId: string; pipelineSlot: number; }
export interface ActivateProgramChoice { order: 'activateProgram'; cardId: string; activeSlot: number; }
export interface RefitMothballChoice {
  order: 'refitMothball';
  action: 'mothball' | 'reactivate';
  programSlot: number; // which active slot (mothball) or mothball index (reactivate)
}
export interface BuildBaseChoice { order: 'buildBase'; theater: TheaterId; extraBudgetLine: import('./resources.js').BudgetLine; }
export interface ForwardOpsChoice { order: 'forwardOps'; theater: TheaterId; }
export interface StationProgramsChoice {
  order: 'stationPrograms';
  assignments: Array<{ activeSlot: number; theater: TheaterId }>;
}
export interface MajorExerciseChoice { order: 'majorExercise'; }
export interface LogisticsSurgeChoice { order: 'logisticsSurge'; }
export interface IntelFocusChoice { order: 'intelFocus'; spendI: boolean; }

export type OrderChoice =
  | LobbyChoice
  | NegotiateChoice
  | ContractingChoice
  | StartProgramChoice
  | ActivateProgramChoice
  | RefitMothballChoice
  | BuildBaseChoice
  | ForwardOpsChoice
  | StationProgramsChoice
  | MajorExerciseChoice
  | LogisticsSurgeChoice
  | IntelFocusChoice;
