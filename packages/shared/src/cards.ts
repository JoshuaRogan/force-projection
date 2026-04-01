import type { Cost } from './resources.js';
import type { TheaterId } from './theaters.js';

// === Program Tags ===

export type ProgramDomain = 'AIR' | 'SEA' | 'EXP' | 'SPACE_CYBER';

export type ProgramSubtag =
  | 'Fighter' | 'Bomber' | 'Transport'      // AIR
  | 'Carrier' | 'Sub' | 'Surface' | 'Capital' // SEA
  | 'Marine' | 'SOF' | 'Ops'                  // EXP
  | 'Space' | 'Cyber' | 'Network'             // SPACE_CYBER
  | 'Classified'                               // cross-domain
  | 'Industry' | 'Doctrine' | 'Politics';     // non-platform

// === Effect System ===
// Effects are data-driven so the engine can execute them without card-specific code.

export type EffectType =
  | 'gainBudget'          // gain budget tokens
  | 'gainSecondary'       // gain secondary resource tokens
  | 'gainProduction'      // increase production rate
  | 'gainSI'              // gain strategic influence
  | 'placeAlliance'       // place an alliance in a theater
  | 'placeBase'           // place a base (skipping deploy cost)
  | 'placeForwardOps'     // place forward ops (with cost modifier)
  | 'drawCards'           // draw program cards
  | 'discardCards'        // force discard
  | 'reduceCost'          // reduce cost of future actions this year
  | 'satisfyContractStep' // progress on a contract requirement
  | 'conditionalSI'       // gain SI if a condition is met
  | 'ignoreFirstCrisis'   // ignore the first matching crisis penalty
  | 'coverTheater'        // treat a theater as "covered" for contracts
  | 'modifyReadiness'     // change readiness level
  | 'freeProgramming'     // reprogram budget without PC cost
  | 'custom';             // for effects too unique to generalize

export interface Effect {
  type: EffectType;
  /** What this effect does in plain text (for UI display) */
  description: string;
  /** Structured parameters interpreted by the engine per effect type */
  params: Record<string, unknown>;
}

// === Program Cards ===

export interface StationingOption {
  theaters: TheaterId[];
  strength: number; // typically +1 or +2
}

export interface ProgramCard {
  id: string;
  name: string;
  domain: ProgramDomain;
  subtags: ProgramSubtag[];
  pipelineCost: Cost;
  activeCost: Cost;
  activateEffects: Effect[];
  sustainEffects: Effect[];
  stationing?: StationingOption;
  /** SI printed directly on the card (rare) */
  printedSI?: number;
  /** One-sentence flavour text injected from cardProse.json */
  prose?: string;
}

// === Contract Cards ===

export type ContractRequirementType =
  | 'stationProgram'     // station a program with specific tag in a theater
  | 'readinessThreshold' // have readiness >= X
  | 'allianceCount'      // have N alliances across N theaters
  | 'baseInTheater'      // have a base in a specific theater
  | 'forwardOpsInTheater'// have forward ops in a specific theater
  | 'sustainOrderCount'  // perform sustain orders in N quarters
  | 'activeProgramTag'   // have an active program with a specific tag
  | 'theaterPresence'    // have presence in N theaters
  | 'custom';

export interface ContractRequirement {
  type: ContractRequirementType;
  description: string;
  params: Record<string, unknown>;
}

export interface ContractCard {
  id: string;
  name: string;
  immediateAward: Effect[];
  requirements: ContractRequirement[];
  rewardSI: number;
  rewardEffects?: Effect[]; // bonus effects beyond SI on completion
  failurePenaltySI: number; // negative number
  failureEffects?: Effect[];
  prose?: string;
}

// === Agenda Cards ===

export interface AgendaCard {
  id: string;
  name: string;
  description: string;
  /** Effects that apply for the year if the agenda passes */
  passEffects: Effect[];
  /** Effects that apply for the year if the agenda fails */
  failEffects: Effect[];
  /** Which budget line this agenda "favors" (used by Lobby order) */
  favoredBudgetLine?: import('./resources.js').BudgetLine;
  prose?: string;
}

// === Crisis Cards ===

export interface CrisisCard {
  id: string;
  name: string;
  /** Rule change for this quarter */
  immediateRule: string;
  immediateEffects: Effect[];
  /** What helps mitigate this crisis */
  responseDescription: string;
  responseEffects: Effect[];
  /** Penalty if crisis is ignored */
  penaltyDescription: string;
  penaltyEffects: Effect[];
  prose?: string;
}

// === Union type for any card ===

export type GameCard =
  | { type: 'program'; card: ProgramCard }
  | { type: 'contract'; card: ContractCard }
  | { type: 'agenda'; card: AgendaCard }
  | { type: 'crisis'; card: CrisisCard };
