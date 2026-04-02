import type {
  GameState, PlayerState, OrderChoice, OrderCategory,
  TheaterId, BudgetLine, Effect, CostReduction, CostContext,
} from '@fp/shared';
import {
  ORDER_RESOLUTION_SEQUENCE, ORDERS, THEATER_SLOTS, STRENGTH_VALUES,
  canAfford, payCost, BUDGET_LINES, SECONDARY_RESOURCES, THEATER_IDS,
  applyCostReductions, evaluateCondition,
} from '@fp/shared';

// === Main resolver: process all orders for the current quarter ===

export function resolveAllOrders(state: GameState): void {
  // Collect all chosen orders grouped by category
  const ordersByCategory = new Map<OrderCategory, Array<{ playerId: string; choice: OrderChoice }>>();

  for (const cat of ORDER_RESOLUTION_SEQUENCE) {
    ordersByCategory.set(cat, []);
  }

  for (const pid of state.turnOrder) {
    const selected = state.players[pid].selectedOrders;
    if (!selected) continue;

    for (const choice of selected) {
      const def = ORDERS[choice.order];
      ordersByCategory.get(def.category)!.push({ playerId: pid, choice });
    }
  }

  // Resolve in sequence: Influence → Procure → Deploy → Sustain
  for (const cat of ORDER_RESOLUTION_SEQUENCE) {
    const entries = ordersByCategory.get(cat)!;
    // Within a category, resolve in turn order
    const sorted = entries.sort((a, b) =>
      state.turnOrder.indexOf(a.playerId) - state.turnOrder.indexOf(b.playerId)
    );

    for (const { playerId, choice } of sorted) {
      const logLenBefore = state.log.length;
      resolveOrder(state, playerId, choice);
      // Don't log orderResolved if the resolver already logged orderFailed
      const lastEntry = state.log[state.log.length - 1];
      const failed = state.log.length > logLenBefore &&
        lastEntry.type === 'orderFailed' && lastEntry.playerId === playerId;
      if (!failed) {
        state.log.push({ type: 'orderResolved', playerId, order: choice });
      }
    }
  }
}

// === Individual order resolvers ===

function resolveOrder(state: GameState, playerId: string, choice: OrderChoice): void {
  switch (choice.order) {
    case 'lobby': return resolveLobby(state, playerId);
    case 'negotiate': return resolveNegotiate(state, playerId, choice);
    case 'contracting': return resolveContracting(state, playerId);
    case 'startProgram': return resolveStartProgram(state, playerId, choice);
    case 'activateProgram': return resolveActivateProgram(state, playerId, choice);
    case 'refitMothball': return resolveRefitMothball(state, playerId, choice);
    case 'buildBase': return resolveBuildBase(state, playerId, choice);
    case 'forwardOps': return resolveForwardOps(state, playerId, choice);
    case 'stationPrograms': return resolveStationPrograms(state, playerId, choice);
    case 'majorExercise': return resolveMajorExercise(state, playerId);
    case 'logisticsSurge': return resolveLogisticsSurge(state, playerId);
    case 'intelFocus': return resolveIntelFocus(state, playerId, choice);
  }
}

// --- Influence Orders ---

function resolveLobby(state: GameState, playerId: string): void {
  const p = state.players[playerId];
  p.resources.secondary.PC += 2;
  state.log.push({ type: 'resourceChange', playerId, resource: 'PC', delta: 2 });

  // If agenda passed, gain +1 of favored budget line
  if (state.currentAgenda?.passed && state.currentAgenda.agenda.favoredBudgetLine) {
    const line = state.currentAgenda.agenda.favoredBudgetLine;
    p.resources.budget[line] += 1;
    state.log.push({ type: 'resourceChange', playerId, resource: line, delta: 1 });
  }
}

function resolveNegotiate(
  state: GameState,
  playerId: string,
  choice: Extract<OrderChoice, { order: 'negotiate' }>,
): void {
  const p = state.players[playerId];
  const theater = choice.theater;
  const presence = p.theaterPresence[theater];
  const boardPresence = state.board.theaters[theater].presence[playerId];

  // Check: need a base in theater, OR pay 1 PC
  const hasBase = presence.bases > 0;
  if (!hasBase && choice.payPC) {
    if (p.resources.secondary.PC < 1) return; // can't afford
    p.resources.secondary.PC -= 1;
  } else if (!hasBase) {
    return; // invalid
  }

  // Check alliance slot availability
  if (presence.alliances >= THEATER_SLOTS.alliances) return;

  presence.alliances += 1;
  boardPresence.alliances += 1;
  state.log.push({ type: 'alliancePlaced', playerId, theater });

  // Fire placeAlliance trigger on active programs
  fireSustainTrigger(state, playerId, 'placeAlliance');
}

function resolveContracting(state: GameState, playerId: string): void {
  const p = state.players[playerId];

  if (p.contracts.length >= state.config.maxActiveContracts) {
    // Already at max — gain +1 SI instead
    p.si += 1;
    state.log.push({ type: 'siChange', playerId, delta: 1, reason: 'contracting_at_max' });
    return;
  }

  // Draw 2 contracts, keep 1 (simplified: take first available from market, or draw from deck)
  if (state.decks.contracts.length >= 2) {
    const drawn = state.decks.contracts.splice(0, 2);
    // For now, keep first, put second on bottom
    p.contracts.push({ card: drawn[0], progress: {} });
    state.decks.contracts.push(drawn[1]);
    state.log.push({ type: 'contractTaken', playerId, contractId: drawn[0].id });
  } else if (state.decks.contracts.length === 1) {
    const drawn = state.decks.contracts.splice(0, 1);
    p.contracts.push({ card: drawn[0], progress: {} });
    state.log.push({ type: 'contractTaken', playerId, contractId: drawn[0].id });
  }
}

// --- Procure Orders ---

function resolveStartProgram(
  state: GameState,
  playerId: string,
  choice: Extract<OrderChoice, { order: 'startProgram' }>,
): void {
  const p = state.players[playerId];
  const cardIdx = p.hand.findIndex(c => c.id === choice.cardId);
  if (cardIdx === -1) return;

  const card = p.hand[cardIdx];
  const slot = choice.pipelineSlot;

  // Check pipeline slot is free
  if (slot < 0 || slot >= p.portfolio.pipeline.length || p.portfolio.pipeline[slot] !== null) return;

  // Check can afford pipeline cost (with reductions)
  const pipeCtx: CostContext = {
    orderCategory: 'Procure', orderId: 'startProgram', action: 'pipeline',
    domain: card.domain, subtags: card.subtags as string[],
  };
  const pipeCost = applyCostReductions(card.pipelineCost, p.costReductions, pipeCtx);
  if (!canAfford(p.resources, pipeCost)) return;

  // Pay and place
  payCost(p.resources, pipeCost);
  p.hand.splice(cardIdx, 1);
  p.portfolio.pipeline[slot] = { card, yearsInPipeline: 0 };

  state.log.push({ type: 'programPipelined', playerId, cardId: card.id });
}

function resolveActivateProgram(
  state: GameState,
  playerId: string,
  choice: Extract<OrderChoice, { order: 'activateProgram' }>,
): void {
  const p = state.players[playerId];
  const slot = choice.activeSlot;

  // Check active slot is free
  if (slot < 0 || slot >= p.portfolio.active.length || p.portfolio.active[slot] !== null) {
    state.log.push({ type: 'orderFailed', playerId, order: 'activateProgram', reason: `active slot ${slot} unavailable` });
    return;
  }

  // Card can come from hand or pipeline
  let card;
  let fromPipeline = -1;

  // Check hand first
  const handIdx = p.hand.findIndex(c => c.id === choice.cardId);
  if (handIdx !== -1) {
    card = p.hand[handIdx];
  } else {
    // Check pipeline
    for (let i = 0; i < p.portfolio.pipeline.length; i++) {
      if (p.portfolio.pipeline[i]?.card.id === choice.cardId) {
        card = p.portfolio.pipeline[i]!.card;
        fromPipeline = i;
        break;
      }
    }
  }

  if (!card) {
    state.log.push({ type: 'orderFailed', playerId, order: 'activateProgram', reason: 'card not found in pipeline or hand' });
    return;
  }

  // Apply AIRCOM passive discount, then general cost reductions
  let cost = { ...card.activeCost, budget: { ...card.activeCost.budget } };
  const airgcomDiscount = p.directorate === 'AIRCOM' && card.domain === 'AIR' && !p.firstAirActivatedThisYear;
  if (airgcomDiscount) {
    cost.budget.A = Math.max(0, (cost.budget.A ?? 0) - 1);
  }
  const actCtx: CostContext = {
    orderCategory: 'Procure', orderId: 'activateProgram', action: 'activate',
    domain: card.domain, subtags: card.subtags as string[],
  };
  cost = applyCostReductions(cost, p.costReductions, actCtx);

  if (!canAfford(p.resources, cost)) {
    state.log.push({ type: 'orderFailed', playerId, order: 'activateProgram', reason: 'insufficient resources' });
    return;
  }

  // Commit AIRCOM flag only after confirmed affordable
  if (airgcomDiscount) {
    p.firstAirActivatedThisYear = true;
  }

  // Pay and place
  payCost(p.resources, cost);

  if (handIdx !== -1) {
    p.hand.splice(handIdx, 1);
  } else if (fromPipeline >= 0) {
    p.portfolio.pipeline[fromPipeline] = null;
  }

  p.portfolio.active[slot] = { card };

  // NAVSEA passive: SEA-tag program → gain +1 U
  if (p.directorate === 'NAVSEA' && card.domain === 'SEA') {
    p.resources.budget.U += 1;
    state.log.push({ type: 'resourceChange', playerId, resource: 'U', delta: 1 });
  }

  // AIRCOM passive: first AIR → gain +1 I
  if (p.directorate === 'AIRCOM' && card.domain === 'AIR') {
    p.resources.secondary.I += 1;
    state.log.push({ type: 'resourceChange', playerId, resource: 'I', delta: 1 });
  }

  // SPACECY passive: first NETWORK → +1 I production
  if (p.directorate === 'SPACECY' && card.subtags.includes('Network') && !p.firstNetworkActivatedThisYear) {
    p.resources.production.secondary.I += 1;
    p.firstNetworkActivatedThisYear = true;
  }

  state.log.push({ type: 'programActivated', playerId, cardId: card.id });

  // Resolve activate effects
  for (const effect of card.activateEffects) {
    resolveEffect(state, playerId, effect);
  }
}

function resolveRefitMothball(
  state: GameState,
  playerId: string,
  choice: Extract<OrderChoice, { order: 'refitMothball' }>,
): void {
  const p = state.players[playerId];

  if (choice.action === 'mothball') {
    const slot = choice.programSlot;
    if (slot < 0 || slot >= p.portfolio.active.length || !p.portfolio.active[slot]) return;

    const card = p.portfolio.active[slot]!.card;
    p.portfolio.active[slot] = null;
    p.portfolio.mothballed.push(card);
    p.resources.budget.U += 1;

    // Remove any stationed programs from this slot
    p.stationedPrograms = p.stationedPrograms.filter(sp => sp.activeSlot !== slot);

    state.log.push({ type: 'programMothballed', playerId, cardId: card.id });
    state.log.push({ type: 'resourceChange', playerId, resource: 'U', delta: 1 });
  } else {
    // Reactivate from mothball
    const mbIdx = choice.programSlot;
    if (mbIdx < 0 || mbIdx >= p.portfolio.mothballed.length) return;

    // Find free active slot
    const freeSlot = p.portfolio.active.findIndex(s => s === null);
    if (freeSlot === -1) return;

    const card = p.portfolio.mothballed[mbIdx];

    // Cost: 1 U + 1 of its primary budget line
    const primaryLine = getPrimaryBudgetLine(card);
    const reactivateCost = { budget: { U: 1, [primaryLine]: 1 } };
    if (!canAfford(p.resources, reactivateCost)) return;

    payCost(p.resources, reactivateCost);
    p.portfolio.mothballed.splice(mbIdx, 1);
    p.portfolio.active[freeSlot] = { card };

    state.log.push({ type: 'programReactivated', playerId, cardId: card.id });
  }
}

function getPrimaryBudgetLine(card: import('@fp/shared').ProgramCard): BudgetLine {
  // Primary line = the budget line with the highest cost in activeCost
  let maxLine: BudgetLine = 'U';
  let maxVal = 0;
  for (const line of BUDGET_LINES) {
    const val = card.activeCost.budget[line] ?? 0;
    if (val > maxVal) {
      maxVal = val;
      maxLine = line;
    }
  }
  return maxLine;
}

// --- Deploy Orders ---

function resolveBuildBase(
  state: GameState,
  playerId: string,
  choice: Extract<OrderChoice, { order: 'buildBase' }>,
): void {
  const p = state.players[playerId];
  const theater = choice.theater;
  const presence = p.theaterPresence[theater];
  const boardPresence = state.board.theaters[theater].presence[playerId];

  // Check slot
  if (presence.bases >= THEATER_SLOTS.bases) return;

  // Cost: 2U + 1 of any line, with cost reductions applied
  const baseCost = { budget: { U: 2, [choice.extraBudgetLine]: 1 } };
  const ctx: CostContext = { orderCategory: 'Deploy', orderId: 'buildBase', theater };
  const cost = applyCostReductions(baseCost, p.costReductions, ctx);
  if (!canAfford(p.resources, cost)) return;

  payCost(p.resources, cost);
  presence.bases += 1;
  boardPresence.bases += 1;

  state.log.push({ type: 'basePlaced', playerId, theater });

  // Fire deploy trigger on active programs
  fireSustainTrigger(state, playerId, 'deploy');
}

function resolveForwardOps(
  state: GameState,
  playerId: string,
  choice: Extract<OrderChoice, { order: 'forwardOps' }>,
): void {
  const p = state.players[playerId];
  const theater = choice.theater;
  const presence = p.theaterPresence[theater];
  const boardPresence = state.board.theaters[theater].presence[playerId];

  // Requirement: must have a base
  if (presence.bases < 1) return;

  // Check slot
  if (presence.forwardOps >= THEATER_SLOTS.forwardOps) return;

  // Cost: 1L + 2U with directorate + cost reduction discounts
  let lCost = 1;
  let uCost = 2;

  // MARFOR passive: -1 E on forward ops (the rules say -1 E but cost is L+U, so this reduces the U cost)
  if (p.directorate === 'MARFOR') {
    uCost = Math.max(0, uCost - 1);
  }

  // TRANSCOM passive: pay 1 less L
  if (p.directorate === 'TRANSCOM') {
    lCost = Math.max(0, lCost - 1);
  }

  const baseCost = { budget: { U: uCost }, secondary: { L: lCost } };
  const ctx: CostContext = { orderCategory: 'Deploy', orderId: 'forwardOps', theater };
  const cost = applyCostReductions(baseCost, p.costReductions, ctx);
  if (!canAfford(p.resources, cost)) return;

  payCost(p.resources, cost);
  presence.forwardOps += 1;
  boardPresence.forwardOps += 1;

  state.log.push({ type: 'forwardOpsPlaced', playerId, theater });

  // Fire deploy trigger on active programs
  fireSustainTrigger(state, playerId, 'deploy');
}

function resolveStationPrograms(
  state: GameState,
  playerId: string,
  choice: Extract<OrderChoice, { order: 'stationPrograms' }>,
): void {
  const p = state.players[playerId];

  // Max 2 assignments per order
  const assignments = choice.assignments.slice(0, 2);

  for (const { activeSlot, theater } of assignments) {
    const slot = p.portfolio.active[activeSlot];
    if (!slot) continue;

    // Check the program has stationing for this theater
    if (!slot.card.stationing) continue;
    if (!slot.card.stationing.theaters.includes(theater)) continue;

    // Remove any previous stationing for this slot and subtract old strength
    const oldStationing = p.stationedPrograms.find(sp => sp.activeSlot === activeSlot);
    if (oldStationing) {
      const oldStrength = slot.card.stationing.strength;
      p.theaterPresence[oldStationing.theater].stationedStrength -= oldStrength;
      state.board.theaters[oldStationing.theater].presence[playerId].stationedStrength -= oldStrength;
      p.stationedPrograms = p.stationedPrograms.filter(sp => sp.activeSlot !== activeSlot);
    }

    // Add new stationing
    p.stationedPrograms.push({ activeSlot, theater });

    // Update theater strength
    const boardPresence = state.board.theaters[theater].presence[playerId];
    const playerPresence = p.theaterPresence[theater];
    boardPresence.stationedStrength += slot.card.stationing.strength;
    playerPresence.stationedStrength += slot.card.stationing.strength;

    state.log.push({ type: 'programStationed', playerId, activeSlot, theater });
  }
}

// --- Sustain Orders ---

function resolveMajorExercise(state: GameState, playerId: string): void {
  const p = state.players[playerId];

  // Cost: 1M + 1U (with reductions)
  const baseCost = { budget: { U: 1 }, secondary: { M: 1 } };
  const ctx: CostContext = { orderCategory: 'Sustain', orderId: 'majorExercise' };
  const cost = applyCostReductions(baseCost, p.costReductions, ctx);
  if (!canAfford(p.resources, cost)) {
    state.log.push({ type: 'orderFailed', playerId, order: 'majorExercise', reason: 'insufficientResources' });
    return;
  }

  payCost(p.resources, cost);
  p.readiness += 2;
  state.log.push({ type: 'resourceChange', playerId, resource: 'readiness', delta: 2 });

  // Fire sustain effects on active programs that trigger on Major Exercise
  fireSustainTrigger(state, playerId, 'majorExercise');

  // Draw 1 card
  if (state.decks.programs.length > 0) {
    const drawn = state.decks.programs.splice(0, 1);
    p.hand.push(...drawn);
  }

  // Track sustain order for contract requirements
  if (state.phase.type === 'quarter') {
    p.sustainOrdersThisYear.push(state.phase.quarter);
  }
}

function resolveLogisticsSurge(state: GameState, playerId: string): void {
  const p = state.players[playerId];

  p.resources.secondary.L += 2;
  p.logisticsSurgeThisQuarter = true;
  state.log.push({ type: 'resourceChange', playerId, resource: 'L', delta: 2 });

  // Track sustain order
  if (state.phase.type === 'quarter') {
    p.sustainOrdersThisYear.push(state.phase.quarter);
  }
}

function resolveIntelFocus(
  state: GameState,
  playerId: string,
  choice: Extract<OrderChoice, { order: 'intelFocus' }>,
): void {
  const p = state.players[playerId];

  p.resources.secondary.I += 2;
  state.log.push({ type: 'resourceChange', playerId, resource: 'I', delta: 2 });

  // Fire intelFocus trigger on active programs
  fireSustainTrigger(state, playerId, 'intelFocus');

  // Reactive trigger: opponentGainsI (from the +2 I we just gave)
  fireReactiveTrigger(state, playerId, 'opponentGainsI');

  // Optional: spend 1 I to change resolution position (tracked but not enforced here)
  if (choice.spendI && p.resources.secondary.I >= 1) {
    p.resources.secondary.I -= 1;
  }

  // Track sustain order
  if (state.phase.type === 'quarter') {
    p.sustainOrdersThisYear.push(state.phase.quarter);
  }
}

/** Apply a card effect to a player. Used for activateEffects, sustain effects, contract awards, agenda/crisis effects. */
export function resolveEffect(state: GameState, playerId: string, effect: Effect): void {
  const p = state.players[playerId];
  const params = effect.params;

  switch (effect.type) {
    case 'gainBudget': {
      for (const line of BUDGET_LINES) {
        const amt = (params[line] as number | undefined) ?? 0;
        if (amt > 0) {
          p.resources.budget[line] += amt;
          state.log.push({ type: 'resourceChange', playerId, resource: line, delta: amt });
        }
      }
      break;
    }
    case 'gainSecondary': {
      for (const res of SECONDARY_RESOURCES) {
        const amt = (params[res] as number | undefined) ?? 0;
        if (amt !== 0) {
          p.resources.secondary[res] += amt;
          state.log.push({ type: 'resourceChange', playerId, resource: res, delta: amt });
          // Reactive trigger: opponentGainsI
          if (res === 'I' && amt > 0) {
            fireReactiveTrigger(state, playerId, 'opponentGainsI');
          }
        }
      }
      break;
    }
    case 'gainSI': {
      const si = (params.si as number) ?? 0;
      // Handle "per N of subtag" variants (e.g. +1 SI per 2 Network programs)
      const per = params.per as number | undefined;
      const subtag = params.subtag as string | undefined;
      if (per && subtag) {
        let count = 0;
        for (const slot of p.portfolio.active) {
          if (slot && slot.card.subtags.includes(subtag as any)) count++;
        }
        const multiplier = Math.floor(count / per);
        const totalSI = si * multiplier;
        if (totalSI !== 0) {
          p.si += totalSI;
          state.log.push({ type: 'siChange', playerId, delta: totalSI, reason: 'cardEffect' });
        }
      } else if (si !== 0) {
        p.si += si;
        state.log.push({ type: 'siChange', playerId, delta: si, reason: 'cardEffect' });
      }
      break;
    }
    case 'gainProduction': {
      if (params.choice) {
        // Player-choice variant: apply first option as default
        // (e.g. ['productionI', 'placeAlliance'] → gain +1 I production)
        const choices = params.choice as string[];
        if (choices.length > 0) {
          const first = choices[0];
          if (first.startsWith('production')) {
            const res = first.replace('production', '');
            if (SECONDARY_RESOURCES.includes(res as any)) {
              p.resources.production.secondary[res as keyof typeof p.resources.production.secondary] += 1;
            } else if (BUDGET_LINES.includes(res as any)) {
              p.resources.production.budget[res as keyof typeof p.resources.production.budget] += 1;
            }
          } else if (first === 'placeAlliance') {
            resolveEffect(state, playerId, { type: 'placeAlliance', description: '', params: { count: 1 } });
          }
        }
        break;
      }
      for (const line of BUDGET_LINES) {
        const amt = (params[line] as number | undefined) ?? 0;
        if (amt !== 0) p.resources.production.budget[line] += amt;
      }
      for (const res of SECONDARY_RESOURCES) {
        const amt = (params[res] as number | undefined) ?? 0;
        if (amt !== 0) p.resources.production.secondary[res] += amt;
      }
      break;
    }
    case 'drawCards': {
      const count = (params.count as number) ?? 1;
      const drawn = state.decks.programs.splice(0, count);
      p.hand.push(...drawn);
      break;
    }
    case 'discardCards': {
      const count = (params.count as number) ?? 1;
      // Discard from end of hand (simplified — real game needs player choice)
      for (let i = 0; i < count && p.hand.length > 0; i++) {
        const discarded = p.hand.pop()!;
        state.decks.programDiscard.push(discarded);
      }
      break;
    }
    case 'modifyReadiness': {
      const timing = params.timing as string | undefined;
      const trigger = params.trigger as string | undefined;
      // 'passive' = always-on at activation; explicit 'trigger' = fired by specific order resolver
      if (trigger) break;
      if (timing && timing !== 'passive') break;
      const bonus = (params.bonus as number) ?? 0;
      if (bonus !== 0) {
        p.readiness += bonus;
        state.log.push({ type: 'resourceChange', playerId, resource: 'readiness', delta: bonus });
      }
      break;
    }
    case 'placeAlliance': {
      const requireBase = params.requireBase as boolean | undefined;
      const theaters = params.theaters as string[] | undefined;
      const count = (params.count as number | undefined) ?? 1;
      const placed: TheaterId[] = [];
      for (let i = 0; i < count; i++) {
        const candidates = theaters
          ? (theaters as TheaterId[]).filter(t => !placed.includes(t))
          : THEATER_IDS.filter(t => !placed.includes(t));
        const target = candidates.find(tid => {
          if (p.theaterPresence[tid].alliances >= THEATER_SLOTS.alliances) return false;
          if (requireBase && p.theaterPresence[tid].bases < 1) return false;
          return true;
        });
        if (!target) break;
        p.theaterPresence[target].alliances += 1;
        state.board.theaters[target].presence[playerId].alliances += 1;
        state.log.push({ type: 'alliancePlaced', playerId, theater: target });
        placed.push(target);
        // Fire placeAlliance trigger on active programs
        fireSustainTrigger(state, playerId, 'placeAlliance');
      }
      break;
    }
    case 'placeBase': {
      const theaters = params.theaters as string[] | undefined;
      if (!theaters) break;
      const target = (theaters as TheaterId[]).find(
        tid => p.theaterPresence[tid].bases < THEATER_SLOTS.bases
      );
      if (target) {
        p.theaterPresence[target].bases += 1;
        state.board.theaters[target].presence[playerId].bases += 1;
        state.log.push({ type: 'basePlaced', playerId, theater: target });
      }
      break;
    }
    case 'placeForwardOps': {
      const theaters = params.theaters as string[] | undefined;
      const costModifier = (params.costModifier as number | undefined) ?? 0;
      if (!theaters) break;
      const target = (theaters as TheaterId[]).find(tid => {
        if (p.theaterPresence[tid].forwardOps >= THEATER_SLOTS.forwardOps) return false;
        if (p.theaterPresence[tid].bases < 1) return false; // need a base
        return true;
      });
      if (target) {
        // Pay reduced cost (base cost 1L + 2U, modified)
        let lCost = Math.max(0, 1 + costModifier);
        let uCost = Math.max(0, 2 + costModifier);
        const cost = { budget: { U: uCost }, secondary: { L: lCost } };
        if (canAfford(p.resources, cost)) {
          payCost(p.resources, cost);
          p.theaterPresence[target].forwardOps += 1;
          state.board.theaters[target].presence[playerId].forwardOps += 1;
          state.log.push({ type: 'forwardOpsPlaced', playerId, theater: target });
        }
      }
      break;
    }
    case 'reduceCost': {
      // Determine scope from params
      let scope: CostReduction['scope'];
      if (params.orderCategory) {
        scope = (params.orderCategory as string).toLowerCase() as CostReduction['scope'];
      } else if (params.action === 'pipeline' || params.action === 'activate') {
        scope = 'activate';
      } else if (params.domain || params.subtag) {
        scope = 'activate';
      } else if (params.theater) {
        // Theater-only reductions are deploy-scoped (buildBase/forwardOps in a theater)
        scope = 'deploy';
      } else {
        scope = 'all';
      }

      const reduction: CostReduction = {
        scope,
        filter: {},
        resource: (params.resource as string) ?? 'U',
        amount: (params.amount as number) ?? 1,
      };
      if (params.theater) reduction.filter!.theater = params.theater as string;
      if (params.domain) reduction.filter!.domain = params.domain as string;
      if (params.subtag) reduction.filter!.subtag = params.subtag as string;
      if (params.orderCategory) reduction.filter!.orderCategory = params.orderCategory as string;
      if (params.order) reduction.filter!.order = params.order as string;
      if (params.action) reduction.filter!.action = params.action as string;
      p.costReductions.push(reduction);
      state.log.push({ type: 'costReductionApplied', playerId, sourceCardId: reduction.sourceCardId ?? 'unknown' });
      break;
    }
    case 'satisfyContractStep': {
      const tag = params.tag as string | undefined;
      // Progress the first contract that has a matching requirement
      for (const ac of p.contracts) {
        for (const req of ac.card.requirements) {
          if (req.type === 'activeProgramTag' && tag) {
            const reqSubtag = (req.params as any).subtag as string | undefined;
            if (reqSubtag === tag || !reqSubtag) {
              const key = `satisfiedStep_${tag}`;
              ac.progress[key] = ((ac.progress[key] as number) ?? 0) + 1;
              break;
            }
          }
        }
      }
      break;
    }
    case 'conditionalSI': {
      const timing = params.timing as string | undefined;
      // Only fire at activation-time here; yearEnd and endgame are handled in phases.ts
      if (timing && timing !== 'activation') break;
      const condition = params.condition as string;
      const si = (params.si as number) ?? 0;
      let met = evaluateCondition(state, playerId, condition, params);
      if (met && si !== 0) {
        p.si += si;
        state.log.push({ type: 'siChange', playerId, delta: si, reason: 'cardEffect' });
      }
      break;
    }
    case 'ignoreFirstCrisis': {
      const matchTag = params.matchTag as string | undefined;
      p.crisisImmunities.push({
        matchTag,
        uses: 1,
        sourceCardId: params.sourceCardId as string | undefined,
      });
      break;
    }
    case 'coverTheater': {
      const theater = params.theater as TheaterId | undefined;
      if (theater && !p.coveredTheaters.includes(theater)) {
        p.coveredTheaters.push(theater);
      }
      break;
    }
    case 'freeProgramming': {
      // Mark that this player can reprogram for free this year
      // Implemented as a cost reduction with scope 'all' for PC
      p.costReductions.push({
        scope: 'all',
        resource: 'PC',
        amount: 99, // effectively free
        sourceCardId: params.sourceCardId as string | undefined,
      });
      break;
    }
    default:
      break;
  }
}

// evaluateCondition is now in @fp/shared (shared/src/rules.ts)

/** Fire sustain effects on active programs that match a specific trigger */
export function fireSustainTrigger(state: GameState, playerId: string, trigger: string): void {
  const p = state.players[playerId];
  for (const slot of p.portfolio.active) {
    if (!slot) continue;
    for (let ei = 0; ei < slot.card.sustainEffects.length; ei++) {
      const effect = slot.card.sustainEffects[ei];
      if (effect.params.trigger !== trigger) continue;

      // For modifyReadiness with a trigger, apply the bonus directly
      if (effect.type === 'modifyReadiness') {
        const bonus = (effect.params.bonus as number) ?? 0;
        if (bonus !== 0) {
          p.readiness += bonus;
          state.log.push({ type: 'resourceChange', playerId, resource: 'readiness', delta: bonus });
        }
      } else {
        resolveEffect(state, playerId, effect);
      }

      if (!slot.sustainAwardCounts) slot.sustainAwardCounts = new Array(slot.card.sustainEffects.length).fill(0);
      slot.sustainAwardCounts[ei]++;
      state.log.push({ type: 'triggerEffect', playerId, cardId: slot.card.id, trigger });
    }
  }
}

/** Fire reactive triggers on OTHER players' active programs (e.g. opponentGainsI) */
function fireReactiveTrigger(state: GameState, triggeringPlayerId: string, trigger: string): void {
  for (const pid of state.turnOrder) {
    if (pid === triggeringPlayerId) continue;
    fireSustainTrigger(state, pid, trigger);
  }
}
