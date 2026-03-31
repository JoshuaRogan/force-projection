import type {
  GameState, PlayerState, OrderChoice, OrderId, TheaterId,
  ContractCard, BudgetLine, ProgramCard,
} from '@fp/shared';
import {
  ALL_ORDER_IDS, ORDERS, THEATER_IDS, BUDGET_LINES,
  canAfford,
} from '@fp/shared';
import { SeededRNG } from '@fp/engine';

// === Weight vector for scoring actions ===

export interface WeightVector {
  resourceGain: number;     // how much to value gaining resources
  siGain: number;           // how much to value immediate SI
  portfolioFit: number;     // how much to value filling portfolio slots
  contractProgress: number; // how much to value contract progress
  theaterControl: number;   // how much to value theater strength
  readiness: number;        // how much to value readiness
  tempo: number;            // how much to value card draw / tempo
  political: number;        // how much to value PC gain
}

export interface BotPersonality {
  name: string;
  weights: WeightVector;
  phaseMultipliers: {
    early: Partial<WeightVector>;  // year 1
    mid: Partial<WeightVector>;    // years 2-3
    late: Partial<WeightVector>;   // year 4+
  };
  noise: number;            // 0 = deterministic, 1 = near-random
  contractOptimism: number; // 0.7 = pessimistic, 1.3 = optimistic
}

// === Bot decision maker ===

export class Bot {
  constructor(
    public readonly playerId: string,
    public readonly personality: BotPersonality,
    private rng: SeededRNG,
  ) {}

  /** Choose 2 orders for this quarter */
  chooseOrders(state: GameState): [OrderChoice, OrderChoice] {
    const player = state.players[this.playerId];
    const weights = this.getEffectiveWeights(state);

    // Score each of the 12 orders
    const scored = ALL_ORDER_IDS.map(orderId => ({
      orderId,
      score: this.scoreOrder(state, player, orderId, weights),
    }));

    // Add noise
    for (const entry of scored) {
      entry.score += this.personality.noise * this.rng.next() * 2;
    }

    // Sort descending
    scored.sort((a, b) => b.score - a.score);

    // Pick top 2 and build choices
    const first = this.buildOrderChoice(state, player, scored[0].orderId);
    const second = this.buildOrderChoice(state, player, scored[1].orderId);

    return [first, second];
  }

  /** Choose how to vote on agenda */
  chooseAgendaVote(state: GameState): { amount: number; support: boolean } {
    const player = state.players[this.playerId];
    const pc = player.resources.secondary.PC;

    // Simple heuristic: support if we like the favored budget line, oppose otherwise
    const agenda = state.currentAgenda?.agenda;
    if (!agenda || pc === 0) return { amount: 0, support: true };

    // Spend 0-1 PC based on personality
    const amount = Math.min(1, pc);
    const support = this.rng.next() > 0.3; // slight bias toward support
    return { amount, support };
  }

  /** Choose whether to take a contract from the market */
  chooseContract(state: GameState): string | null {
    const player = state.players[this.playerId];
    if (player.contracts.length >= state.config.maxActiveContracts) return null;
    if (state.contractMarket.length === 0) return null;

    // Score each available contract
    let bestId: string | null = null;
    let bestScore = 0;

    for (const contract of state.contractMarket) {
      const score = this.scoreContract(state, player, contract);
      if (score > bestScore) {
        bestScore = score;
        bestId = contract.id;
      }
    }

    // Only take if score is positive
    return bestScore > 0.5 ? bestId : null;
  }

  // === Scoring functions ===

  private getEffectiveWeights(state: GameState): WeightVector {
    const year = state.fiscalYear;
    const totalYears = state.config.fiscalYears;
    let phase: 'early' | 'mid' | 'late';

    if (year <= 1) phase = 'early';
    else if (year >= totalYears) phase = 'late';
    else phase = 'mid';

    const base = { ...this.personality.weights };
    const mult = this.personality.phaseMultipliers[phase];

    for (const key of Object.keys(mult) as (keyof WeightVector)[]) {
      base[key] *= mult[key] ?? 1;
    }

    return base;
  }

  private scoreOrder(
    state: GameState,
    player: PlayerState,
    orderId: OrderId,
    weights: WeightVector,
  ): number {
    let score = 0;

    switch (orderId) {
      case 'lobby':
        score += weights.political * 2;
        if (state.currentAgenda?.passed) score += weights.resourceGain * 1;
        break;

      case 'negotiate':
        score += weights.theaterControl * 1.5;
        // Better if we have bases to place alliances near
        const baseCount = THEATER_IDS.reduce((acc, t) =>
          acc + player.theaterPresence[t].bases, 0);
        if (baseCount > 0) score += weights.theaterControl * 0.5;
        break;

      case 'contracting':
        if (player.contracts.length < state.config.maxActiveContracts) {
          score += weights.contractProgress * 2;
        } else {
          score += weights.siGain * 1; // +1 SI fallback
        }
        break;

      case 'startProgram': {
        const affordablePipeline = player.hand.filter(c =>
          canAfford(player.resources, c.pipelineCost)
        );
        const freePipelineSlots = player.portfolio.pipeline.filter(s => s === null).length;
        if (affordablePipeline.length > 0 && freePipelineSlots > 0) {
          score += weights.portfolioFit * 2;
          score += weights.tempo * 0.5;
        }
        break;
      }

      case 'activateProgram': {
        const affordableActive = player.hand.filter(c =>
          canAfford(player.resources, c.activeCost)
        );
        // Also check pipeline programs
        const pipelineReady = player.portfolio.pipeline.filter(s =>
          s !== null && canAfford(player.resources, s.card.activeCost)
        );
        const freeActiveSlots = player.portfolio.active.filter(s => s === null).length;
        if ((affordableActive.length > 0 || pipelineReady.length > 0) && freeActiveSlots > 0) {
          score += weights.portfolioFit * 3;
          score += weights.siGain * 1;
        }
        break;
      }

      case 'refitMothball': {
        const hasActive = player.portfolio.active.some(s => s !== null);
        const hasMothballed = player.portfolio.mothballed.length > 0;
        if (hasActive || hasMothballed) {
          score += weights.portfolioFit * 0.5;
        }
        break;
      }

      case 'buildBase': {
        const cost = { budget: { U: 2, A: 1 } }; // cheapest version
        if (canAfford(player.resources, cost)) {
          score += weights.theaterControl * 2.5;
          const totalBases = THEATER_IDS.reduce((a, t) =>
            a + player.theaterPresence[t].bases, 0);
          if (totalBases < 2) score += weights.theaterControl * 1; // bonus for first bases
        }
        break;
      }

      case 'forwardOps': {
        const hasBaseAnywhere = THEATER_IDS.some(t => player.theaterPresence[t].bases > 0);
        if (hasBaseAnywhere) {
          score += weights.theaterControl * 2;
        }
        break;
      }

      case 'stationPrograms': {
        const stationable = player.portfolio.active.filter(s =>
          s !== null && s.card.stationing
        );
        if (stationable.length > 0) {
          score += weights.theaterControl * 1.5;
          score += weights.contractProgress * 0.5;
        }
        break;
      }

      case 'majorExercise': {
        const cost = { budget: { U: 1 }, secondary: { M: 1 } };
        if (canAfford(player.resources, cost)) {
          score += weights.readiness * 2;
          score += weights.tempo * 1; // draw a card
        }
        break;
      }

      case 'logisticsSurge':
        score += weights.resourceGain * 1.5;
        // Better when L is low
        if (player.resources.secondary.L < 2) score += weights.resourceGain * 1;
        break;

      case 'intelFocus':
        score += weights.resourceGain * 1;
        score += weights.political * 0.5;
        break;
    }

    return score;
  }

  private scoreContract(
    state: GameState,
    player: PlayerState,
    contract: ContractCard,
  ): number {
    const weights = this.getEffectiveWeights(state);

    // Estimated completion probability (crude)
    let feasibility = 0.5; // baseline

    for (const req of contract.requirements) {
      switch (req.type) {
        case 'readinessThreshold': {
          const threshold = (req.params as any).threshold ?? 0;
          if (player.readiness >= threshold) feasibility += 0.2;
          else if (player.readiness >= threshold - 2) feasibility += 0.05;
          else feasibility -= 0.2;
          break;
        }
        case 'baseInTheater': {
          const theater = (req.params as any).theater as string;
          if (player.theaterPresence[theater as TheaterId]?.bases > 0) feasibility += 0.3;
          else feasibility -= 0.1;
          break;
        }
        case 'sustainOrderCount':
          feasibility += 0.1; // usually doable
          break;
        case 'theaterPresence': {
          const needed = (req.params as any).count ?? 0;
          let have = 0;
          for (const p of Object.values(player.theaterPresence)) {
            if (p.bases > 0 || p.alliances > 0 || p.forwardOps > 0) have++;
          }
          if (have >= needed) feasibility += 0.2;
          else feasibility -= 0.1;
          break;
        }
        default:
          // Assume moderately feasible
          break;
      }
    }

    feasibility = Math.max(0.1, Math.min(1, feasibility * this.personality.contractOptimism));

    const expectedValue = contract.rewardSI * feasibility + contract.failurePenaltySI * (1 - feasibility);
    return expectedValue * weights.contractProgress;
  }

  /** Build a concrete OrderChoice from an OrderId */
  private buildOrderChoice(state: GameState, player: PlayerState, orderId: OrderId): OrderChoice {
    switch (orderId) {
      case 'lobby': return { order: 'lobby' };
      case 'contracting': return { order: 'contracting' };
      case 'majorExercise': return { order: 'majorExercise' };
      case 'logisticsSurge': return { order: 'logisticsSurge' };
      case 'intelFocus': return { order: 'intelFocus', spendI: player.resources.secondary.I >= 3 };

      case 'negotiate': {
        // Pick a theater where we have a base, or pay PC
        const withBase = THEATER_IDS.filter(t => player.theaterPresence[t].bases > 0 && player.theaterPresence[t].alliances < 2);
        if (withBase.length > 0) {
          return { order: 'negotiate', theater: this.rng.pick(withBase, 1)[0], payPC: false };
        }
        const open = THEATER_IDS.filter(t => player.theaterPresence[t].alliances < 2);
        if (open.length > 0 && player.resources.secondary.PC >= 1) {
          return { order: 'negotiate', theater: this.rng.pick(open, 1)[0], payPC: true };
        }
        return { order: 'negotiate', theater: 'homeland', payPC: false };
      }

      case 'startProgram': {
        const freePipeline = player.portfolio.pipeline.findIndex(s => s === null);
        const affordable = player.hand
          .filter(c => canAfford(player.resources, c.pipelineCost))
          .sort((a, b) => this.cardValue(b) - this.cardValue(a));
        if (affordable.length > 0 && freePipeline >= 0) {
          return { order: 'startProgram', cardId: affordable[0].id, pipelineSlot: freePipeline };
        }
        // Fallback: try anyway (will fail validation in engine, harmless)
        return { order: 'startProgram', cardId: player.hand[0]?.id ?? '', pipelineSlot: 0 };
      }

      case 'activateProgram': {
        const freeActive = player.portfolio.active.findIndex(s => s === null);
        // Try from hand
        const fromHand = player.hand
          .filter(c => canAfford(player.resources, c.activeCost))
          .sort((a, b) => this.cardValue(b) - this.cardValue(a));
        if (fromHand.length > 0 && freeActive >= 0) {
          return { order: 'activateProgram', cardId: fromHand[0].id, activeSlot: freeActive };
        }
        // Try from pipeline
        for (let i = 0; i < player.portfolio.pipeline.length; i++) {
          const slot = player.portfolio.pipeline[i];
          if (slot && canAfford(player.resources, slot.card.activeCost) && freeActive >= 0) {
            return { order: 'activateProgram', cardId: slot.card.id, activeSlot: freeActive };
          }
        }
        return { order: 'activateProgram', cardId: '', activeSlot: 0 };
      }

      case 'refitMothball': {
        // Prefer reactivating if we have mothballed + free slot
        if (player.portfolio.mothballed.length > 0) {
          const freeSlot = player.portfolio.active.findIndex(s => s === null);
          if (freeSlot >= 0) {
            return { order: 'refitMothball', action: 'reactivate', programSlot: 0 };
          }
        }
        // Otherwise mothball lowest-value active
        const activeIndices = player.portfolio.active
          .map((s, i) => s ? { slot: i, value: this.cardValue(s.card) } : null)
          .filter((x): x is { slot: number; value: number } => x !== null)
          .sort((a, b) => a.value - b.value);
        if (activeIndices.length > 0) {
          return { order: 'refitMothball', action: 'mothball', programSlot: activeIndices[0].slot };
        }
        return { order: 'refitMothball', action: 'mothball', programSlot: 0 };
      }

      case 'buildBase': {
        const open = THEATER_IDS.filter(t => player.theaterPresence[t].bases < 2);
        const theater = open.length > 0 ? this.rng.pick(open, 1)[0] : 'homeland';
        // Pick cheapest extra budget line we can afford
        const extraLine = this.cheapestAffordableLine(player);
        return { order: 'buildBase', theater, extraBudgetLine: extraLine };
      }

      case 'forwardOps': {
        const eligible = THEATER_IDS.filter(t =>
          player.theaterPresence[t].bases > 0 && player.theaterPresence[t].forwardOps < 1
        );
        const theater = eligible.length > 0 ? this.rng.pick(eligible, 1)[0] : 'homeland';
        return { order: 'forwardOps', theater };
      }

      case 'stationPrograms': {
        const assignments: Array<{ activeSlot: number; theater: TheaterId }> = [];
        for (let i = 0; i < player.portfolio.active.length && assignments.length < 2; i++) {
          const slot = player.portfolio.active[i];
          if (slot?.card.stationing) {
            const theater = this.rng.pick(slot.card.stationing.theaters, 1)[0];
            assignments.push({ activeSlot: i, theater });
          }
        }
        return { order: 'stationPrograms', assignments };
      }
    }
  }

  /** Crude card value estimate for sorting */
  private cardValue(card: ProgramCard): number {
    let value = 0;
    value += (card.printedSI ?? 0) * 3;
    value += card.activateEffects.length * 1.5;
    value += card.sustainEffects.length * 1;
    if (card.stationing) value += card.stationing.strength;
    // Cheaper = better value per cost
    const totalCost = Object.values(card.activeCost.budget).reduce((a, b) => a + (b ?? 0), 0);
    value -= totalCost * 0.3;
    return value;
  }

  private cheapestAffordableLine(player: PlayerState): BudgetLine {
    let best: BudgetLine = 'U';
    let bestAmount = Infinity;
    for (const line of BUDGET_LINES) {
      if (player.resources.budget[line] >= 1 && player.resources.budget[line] < bestAmount) {
        bestAmount = player.resources.budget[line];
        best = line;
      }
    }
    return best;
  }
}
