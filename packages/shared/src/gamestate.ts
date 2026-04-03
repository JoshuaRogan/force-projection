import type { DirectorateId } from './directorates.js';
import type { ProgramCard, ContractCard, AgendaCard, CrisisCard } from './cards.js';
import type { PlayerResources } from './resources.js';
import type { TheaterId, TheaterPresence } from './theaters.js';
import type { OrderChoice } from './orders.js';

// === Year-scoped modifiers (reset at year start) ===

export interface CostReduction {
  /** Which orders/actions this applies to */
  scope: 'deploy' | 'activate' | 'negotiate' | 'all';
  /** Optional filter: only applies to specific domain, subtag, or theater */
  filter?: { domain?: string; subtag?: string; theater?: string; orderCategory?: string; order?: string; action?: string };
  /** Which resource is reduced */
  resource: string;
  /** How much to reduce */
  amount: number;
  /** Source card ID for debugging */
  sourceCardId?: string;
}

export interface CrisisImmunity {
  /** Which crisis domains/tags this blocks (empty = any) */
  matchTag?: string;
  /** How many times this can trigger (default 1) */
  uses: number;
  /** Source card ID */
  sourceCardId?: string;
}

// === Game Configuration ===

export interface GameConfig {
  playerCount: number;       // 2-5
  fiscalYears: number;       // 3 (short), 4 (standard), 5 (long)
  handLimit: number;         // default 7
  activeSlots: number;       // default 6
  pipelineSlots: number;     // default 3
  drawPerQuarter: number;    // default 2
  maxActiveContracts: number;// default 2
}

export const DEFAULT_CONFIG: GameConfig = {
  playerCount: 4,
  fiscalYears: 4,
  handLimit: 7,
  activeSlots: 6,
  pipelineSlots: 3,
  drawPerQuarter: 2,
  maxActiveContracts: 2,
};

// === Game Phase State Machine ===

export type GamePhase =
  | { type: 'setup' }
  | { type: 'congress' }                                          // Phase A
  | { type: 'contractMarket' }                                    // Phase B
  | { type: 'quarter'; quarter: 1 | 2 | 3 | 4; step: QuarterStep } // Phase C
  | { type: 'yearEnd' }                                            // Phase D
  | { type: 'gameEnd' };

export type QuarterStep =
  | 'crisisPulse'
  | 'planOrders'
  | 'resolveOrders'
  | 'contractChoice'
  | 'cleanup';

// === Portfolio (per-player program management) ===

export interface PortfolioSlot {
  card: ProgramCard;
  /** For pipeline: how many years it has been in the pipeline */
  yearsInPipeline?: number;
  /** Count of how many times each sustain effect has awarded (indexed by sustainEffects index) */
  sustainAwardCounts?: number[];
}

export interface Portfolio {
  active: (PortfolioSlot | null)[];   // length = config.activeSlots (6)
  pipeline: (PortfolioSlot | null)[]; // length = config.pipelineSlots (3)
  mothballed: ProgramCard[];          // unlimited
}

// === Active Contract Tracking ===

export interface ActiveContract {
  card: ContractCard;
  /** Track progress toward requirements */
  progress: Record<string, unknown>;
  /** Which quarters sustain orders were performed (for sustain-count requirements) */
  sustainQuarters?: number[];
}

// === Player State ===

export interface PlayerState {
  id: string;
  name: string;
  directorate: DirectorateId;
  resources: PlayerResources;
  si: number;                          // Strategic Influence (victory points)
  readiness: number;
  portfolio: Portfolio;
  hand: ProgramCard[];
  contracts: ActiveContract[];         // max 2
  theaterPresence: Record<TheaterId, TheaterPresence>;

  // Per-year tracking (reset at year start)
  usedOncePerYear: boolean;            // directorate ability
  firstAirActivatedThisYear: boolean;  // for AIRCOM passive
  firstNetworkActivatedThisYear: boolean; // for SPACECY passive
  costReductions: CostReduction[];     // active cost reductions for this year
  coveredTheaters: TheaterId[];        // theaters treated as "covered" for contracts
  crisisImmunities: CrisisImmunity[]; // ignore first matching crisis penalty

  // Per-quarter tracking
  selectedOrders: [OrderChoice, OrderChoice] | null;
  sustainOrdersThisYear: number[];     // which quarters had sustain orders
  logisticsSurgeThisQuarter: boolean;  // for crisis penalty reduction

  // Stations: which active slot is stationed where
  stationedPrograms: Array<{ activeSlot: number; theater: TheaterId }>;

  // Pending contract draw from contracting order — awaiting player choice in contractChoice step
  pendingContractDraw: ContractCard[] | null;

  // Per-player contract market offer (simultaneous, private)
  marketOffer: ContractCard[];          // private offer during contractMarket phase
  marketSelections: string[] | null;    // null = not submitted, [] = pass, ['id1'] = chose these

  // SPACECY peek: next crisis card revealed to this player
  peekedCrisis: CrisisCard | null;
}

// === National Posture (shared thresholds) ===

export interface NationalPosture {
  coverage: number;   // how many theaters have meaningful presence
  readiness: number;  // table-wide readiness
  techEdge: number;   // enables high-end programs/contracts
}

// === Agenda Vote State ===

export interface AgendaVoteState {
  agenda: AgendaCard;
  commitments: Record<string, { amount: number; support: boolean }>;
  resolved: boolean;
  passed: boolean;
}

// === Board State ===

export interface BoardState {
  theaters: Record<TheaterId, {
    /** Per-player presence */
    presence: Record<string, TheaterPresence>;
  }>;
}

// === Decks ===

export interface Decks {
  programs: ProgramCard[];
  programDiscard: ProgramCard[];
  contracts: ContractCard[];
  agendas: AgendaCard[];
  crises: CrisisCard[];
}

// === Full Game State ===

export interface GameState {
  config: GameConfig;
  phase: GamePhase;
  fiscalYear: number;         // 1-based
  turnOrder: string[];        // player IDs in initiative order
  players: Record<string, PlayerState>;
  board: BoardState;
  decks: Decks;
  nationalPosture: NationalPosture;

  // Current year/quarter state
  currentAgenda: AgendaVoteState | null;
  contractMarket: ContractCard[];     // face-up contracts available
  currentCrisis: CrisisCard | null;

  // Event log for replay
  log: GameEvent[];

  // RNG seed for determinism
  seed: number;
}

// === Game Events (for logging and replay) ===

export type GameEvent =
  | { type: 'phaseChange'; phase: GamePhase; fiscalYear: number }
  | { type: 'agendaRevealed'; agendaId: string }
  | { type: 'agendaVote'; playerId: string; amount: number; support: boolean }
  | { type: 'agendaResult'; passed: boolean }
  | { type: 'contractTaken'; playerId: string; contractId: string }
  | { type: 'crisisRevealed'; crisisId: string }
  | { type: 'orderRevealed'; playerId: string; orders: [OrderChoice, OrderChoice] }
  | { type: 'orderResolved'; playerId: string; order: OrderChoice }
  | { type: 'resourceChange'; playerId: string; resource: string; delta: number }
  | { type: 'siChange'; playerId: string; delta: number; reason: string }
  | { type: 'programPipelined'; playerId: string; cardId: string }
  | { type: 'programActivated'; playerId: string; cardId: string }
  | { type: 'programMothballed'; playerId: string; cardId: string }
  | { type: 'programReactivated'; playerId: string; cardId: string }
  | { type: 'basePlaced'; playerId: string; theater: TheaterId }
  | { type: 'alliancePlaced'; playerId: string; theater: TheaterId }
  | { type: 'forwardOpsPlaced'; playerId: string; theater: TheaterId }
  | { type: 'programStationed'; playerId: string; activeSlot: number; theater: TheaterId }
  | { type: 'contractCompleted'; playerId: string; contractId: string; si: number }
  | { type: 'contractFailed'; playerId: string; contractId: string; penalty: number }
  | { type: 'theaterControlScored'; theater: TheaterId; rankings: Array<{ playerId: string; si: number }> }
  | { type: 'sustainEffect'; playerId: string; cardId: string; timing: string }
  | { type: 'orderFailed'; playerId: string; order: string; reason: string }
  | { type: 'agendaEffectApplied'; playerId: string; passed: boolean; effectIdx: number }
  | { type: 'crisisEffectApplied'; playerId: string; crisisId: string; category: 'immediate' | 'response' | 'penalty'; effectIdx: number }
  | { type: 'crisisPeek'; playerId: string; cardId: string }
  | { type: 'triggerEffect'; playerId: string; cardId: string; trigger: string }
  | { type: 'costReductionApplied'; playerId: string; sourceCardId: string }
  | { type: 'crisisImmunityUsed'; playerId: string; sourceCardId: string }
  | { type: 'yearEnd'; fiscalYear: number }
  | { type: 'gameEnd'; finalScores: Record<string, number> };
