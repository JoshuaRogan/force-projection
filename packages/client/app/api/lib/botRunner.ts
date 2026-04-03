import { GameEngine, SeededRNG } from '@fp/engine';
import { Bot } from '@fp/simulation';
import { PERSONALITIES } from '@fp/simulation';
import type { GameState } from '@fp/shared';
import type { GameMeta } from './kv';
import {
  getGameState, setGameState,
  setPendingSubmission, getAllPendingSubmissions, clearPendingSubmissions,
  acquireResolutionLock, releaseResolutionLock,
} from './kv';

function makeBotRng(state: GameState, playerId: string): SeededRNG {
  // Deterministic per-player per-phase seed so bots don't affect each other's RNG
  const pidHash = playerId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return new SeededRNG(state.seed + pidHash + state.fiscalYear * 10000);
}

function getBotSlots(meta: GameMeta) {
  return meta.slots.filter(s => s.isBot);
}

function getHumanSlots(meta: GameMeta) {
  return meta.slots.filter(s => !s.isBot);
}

/**
 * After any state mutation, call this to fire bot actions for all phases
 * where bots need to act before a human can proceed.
 *
 * Returns the final state after all bot actions are complete.
 */
export async function runBotActions(gameId: string, meta: GameMeta): Promise<GameState | null> {
  const state = await getGameState(gameId);
  if (!state) return null;

  const botSlots = getBotSlots(meta);
  if (botSlots.length === 0) return state;

  const phase = state.phase;

  // Congress: bots submit votes
  if (phase.type === 'congress') {
    await runBotVotes(gameId, state, meta, botSlots);
    return getGameState(gameId);
  }

  // Contract market: bots submit their choices as pending submissions
  if (phase.type === 'contractMarket') {
    await runBotContracts(gameId, state, botSlots);
    return getGameState(gameId);
  }

  // Quarter - crisis pulse: bots have nothing to decide, just advance if ALL players are bots
  // (human player clicks "end crisis pulse" themselves)

  // Quarter - planOrders: bots submit orders
  if (phase.type === 'quarter' && phase.step === 'planOrders') {
    await runBotOrders(gameId, state, meta, botSlots);
    return getGameState(gameId);
  }

  // Quarter - contractChoice: bots pick their drawn contracts
  if (phase.type === 'quarter' && phase.step === 'contractChoice') {
    await runBotContractChoices(gameId, state, meta, botSlots);
    return getGameState(gameId);
  }

  // Quarter - handDiscard: bots randomly discard down to hand limit
  if (phase.type === 'quarter' && phase.step === 'handDiscard') {
    await runBotHandDiscards(gameId, state, meta, botSlots);
    return getGameState(gameId);
  }

  return state;
}

// --- Congress phase bot votes ---

async function runBotVotes(
  gameId: string,
  state: GameState,
  meta: GameMeta,
  botSlots: GameMeta['slots'],
): Promise<void> {
  for (const slot of botSlots) {
    const bot = new Bot(slot.playerId, PERSONALITIES[slot.personality] ?? PERSONALITIES.balanced, makeBotRng(state, slot.playerId));
    const vote = bot.chooseAgendaVote(state);
    await setPendingSubmission(gameId, 'votes', slot.playerId, vote);
  }

  // Check if all players (bots + humans) have submitted — if so, resolve
  const allVotes = await getAllPendingSubmissions<{ amount: number; support: boolean }>(
    gameId, 'votes', state.turnOrder,
  );
  if (Object.keys(allVotes).length < state.turnOrder.length) return; // humans haven't voted yet

  const locked = await acquireResolutionLock(gameId);
  if (!locked) return;

  try {
    const fresh = await getGameState(gameId);
    if (!fresh || fresh.phase.type !== 'congress') return;

    const engine = GameEngine.fromState(fresh);
    for (const [pid, vote] of Object.entries(allVotes)) {
      engine.submitVote(pid, vote.amount, vote.support);
    }
    engine.resolveVotes();

    await setGameState(gameId, engine.state);
    await clearPendingSubmissions(gameId, 'votes', state.turnOrder);

    // Recurse: bots may need to act in the next phase (contractMarket)
    const newMeta = meta; // meta unchanged
    const nextState = engine.state;
    if (nextState.phase.type === 'contractMarket') {
      await runBotContracts(gameId, nextState, getBotSlots(newMeta));
    }
  } finally {
    await releaseResolutionLock(gameId);
  }
}

// --- Contract market bot picks ---

async function runBotContracts(
  gameId: string,
  state: GameState,
  botSlots: GameMeta['slots'],
): Promise<void> {
  for (const slot of botSlots) {
    const bot = new Bot(slot.playerId, PERSONALITIES[slot.personality] ?? PERSONALITIES.balanced, makeBotRng(state, slot.playerId));
    const contractId = bot.chooseContract(state);
    const chosen = contractId ? [contractId] : [];
    await setPendingSubmission(gameId, 'contracts', slot.playerId, chosen);
  }
}

// --- Plan orders bot submission ---

async function runBotOrders(
  gameId: string,
  state: GameState,
  meta: GameMeta,
  botSlots: GameMeta['slots'],
): Promise<void> {
  for (const slot of botSlots) {
    const bot = new Bot(slot.playerId, PERSONALITIES[slot.personality] ?? PERSONALITIES.balanced, makeBotRng(state, slot.playerId));
    const orders = bot.chooseOrders(state);
    await setPendingSubmission(gameId, 'orders', slot.playerId, orders);
  }

  // Check if all players have submitted
  const allOrders = await getAllPendingSubmissions<[any, any]>(
    gameId, 'orders', state.turnOrder,
  );
  if (Object.keys(allOrders).length < state.turnOrder.length) return; // humans haven't submitted yet

  const locked = await acquireResolutionLock(gameId);
  if (!locked) return;

  try {
    const fresh = await getGameState(gameId);
    if (!fresh || fresh.phase.type !== 'quarter' || fresh.phase.step !== 'planOrders') return;

    const engine = GameEngine.fromState(fresh);
    for (const [pid, orders] of Object.entries(allOrders)) {
      engine.submitOrders(pid, orders);
    }
    engine.revealAndResolve();

    const stepAfter = engine.state.phase.type === 'quarter' ? engine.state.phase.step : null;
    if (stepAfter === 'cleanup') {
      engine.endQuarter();
    }

    await setGameState(gameId, engine.state);
    await clearPendingSubmissions(gameId, 'orders', state.turnOrder);

    // Recurse into next phase if bots need to act again
    await runBotActions(gameId, meta);
  } finally {
    await releaseResolutionLock(gameId);
  }
}

// --- Contract choice bot selection ---

async function runBotContractChoices(
  gameId: string,
  state: GameState,
  meta: GameMeta,
  botSlots: GameMeta['slots'],
): Promise<void> {
  const current = await getGameState(gameId);
  if (!current || current.phase.type !== 'quarter' || current.phase.step !== 'contractChoice') return;

  const engine = GameEngine.fromState(current);

  for (const slot of botSlots) {
    const pending = engine.state.players[slot.playerId]?.pendingContractDraw;
    if (pending && pending.length > 0) {
      // Bots just take the first drawn contract
      engine.submitContractChoice(slot.playerId, pending[0].id);
    }
  }

  if (engine.allContractChoicesDone()) {
    engine.endContractChoices();
    const step = engine.state.phase.type === 'quarter' ? engine.state.phase.step : null;
    if (step === 'cleanup') {
      engine.endQuarter();
    }
    await setGameState(gameId, engine.state);
    await runBotActions(gameId, meta);
  } else {
    // Humans still need to choose — just save bot choices
    await setGameState(gameId, engine.state);
  }
}

// --- Hand limit discard (bots pick randomly) ---

async function runBotHandDiscards(
  gameId: string,
  state: GameState,
  meta: GameMeta,
  botSlots: GameMeta['slots'],
): Promise<void> {
  const current = await getGameState(gameId);
  if (!current || current.phase.type !== 'quarter' || current.phase.step !== 'handDiscard') return;

  const engine = GameEngine.fromState(current);

  for (const slot of botSlots) {
    const p = engine.state.players[slot.playerId];
    if (!p) continue;
    const excess = Math.max(0, p.hand.length - engine.state.config.handLimit);
    if (excess <= 0) continue;
    const rng = makeBotRng(state, slot.playerId);
    const cardIds = rng.pick(p.hand.map(c => c.id), excess);
    engine.submitHandDiscard(slot.playerId, cardIds);
  }

  if (engine.allHandDiscardsDone()) {
    engine.endHandDiscard();
    if (engine.state.phase.type === 'quarter' && engine.state.phase.step === 'cleanup') {
      engine.endQuarter();
    }
  }

  await setGameState(gameId, engine.state);
  await runBotActions(gameId, meta);
}
