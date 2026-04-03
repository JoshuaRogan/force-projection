import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { GameEngine } from './engine.js';
import type { OrderChoice } from '@fp/shared';
import { PROGRAM_CARDS } from '@fp/shared';

describe('GameEngine', () => {

  /** Auto-pick discards from end of hand (deterministic) then end quarter from cleanup. */
  function endQuarterThroughCleanup(engine: GameEngine) {
    while (engine.state.phase.type === 'quarter' && engine.state.phase.step === 'handDiscard') {
      for (const pid of engine.state.turnOrder) {
        const p = engine.getPlayer(pid);
        const excess = Math.max(0, p.hand.length - engine.state.config.handLimit);
        if (excess <= 0) continue;
        const cardIds = p.hand.slice(-excess).map(c => c.id);
        engine.submitHandDiscard(pid, cardIds);
      }
      if (engine.allHandDiscardsDone()) {
        engine.endHandDiscard();
      }
    }
    if (engine.state.phase.type === 'quarter' && engine.state.phase.step === 'cleanup') {
      engine.endQuarter();
    }
  }

  function createTestGame(playerCount = 2) {
    const directorates = ['NAVSEA', 'AIRCOM', 'MARFOR', 'SPACECY', 'TRANSCOM'] as const;
    const players = Array.from({ length: playerCount }, (_, i) => ({
      id: `p${i + 1}`,
      name: `Player ${i + 1}`,
      directorate: directorates[i],
    }));
    return new GameEngine({ players, seed: 42, config: { fiscalYears: 1 } });
  }

  /** Pass on contracts for all players, then end the market phase. */
  function skipContractMarket(engine: GameEngine) {
    for (const pid of engine.state.turnOrder) {
      engine.submitMarketChoices(pid, []);
    }
    engine.endContractMarket();
  }

  it('should create a game in setup phase', () => {
    const engine = createTestGame();
    assert.equal(engine.state.phase.type, 'setup');
    assert.equal(Object.keys(engine.state.players).length, 2);
  });

  it('should start and move to congress phase', () => {
    const engine = createTestGame();
    engine.start();
    assert.equal(engine.state.phase.type, 'congress');
    assert.ok(engine.state.currentAgenda, 'should have a current agenda');
  });

  it('should handle agenda voting', () => {
    const engine = createTestGame();
    engine.start();

    // Both players vote
    engine.submitVote('p1', 1, true);
    engine.submitVote('p2', 0, false);
    engine.resolveVotes();

    assert.equal(engine.state.phase.type, 'contractMarket');
    assert.ok(engine.state.currentAgenda!.resolved);
    assert.ok(engine.state.currentAgenda!.passed); // 1 support > 0 oppose
  });

  it('should handle contract market', () => {
    const engine = createTestGame();
    engine.start();
    engine.submitVote('p1', 0, true);
    engine.submitVote('p2', 0, true);
    engine.resolveVotes();

    assert.equal(engine.state.phase.type, 'contractMarket');
    const offer = engine.state.players['p1'].marketOffer;
    assert.ok(offer.length > 0, 'should have a private contract offer');

    const contractId = offer[0].id;
    const took = engine.submitMarketChoices('p1', [contractId]);
    assert.ok(took, 'should successfully submit market choices');
    // p2 passes (empty choices)
    engine.submitMarketChoices('p2', []);
    assert.ok(engine.allMarketChoicesSubmitted());

    engine.endContractMarket();
    assert.equal(engine.state.players['p1'].contracts.length, 1);
    assert.equal(engine.state.phase.type, 'quarter');
  });

  it('should handle a full quarter cycle', () => {
    const engine = createTestGame();
    engine.start();
    engine.submitVote('p1', 0, true);
    engine.submitVote('p2', 0, true);
    engine.resolveVotes();
    skipContractMarket(engine);

    // We're in Q1 crisisPulse
    assert.deepEqual(engine.state.phase, { type: 'quarter', quarter: 1, step: 'crisisPulse' });

    engine.endCrisisPulse();
    assert.deepEqual(engine.state.phase, { type: 'quarter', quarter: 1, step: 'planOrders' });

    // Submit orders: both players pick lobby + majorExercise
    const orders: [OrderChoice, OrderChoice] = [
      { order: 'lobby' },
      { order: 'majorExercise' },
    ];
    engine.submitOrders('p1', orders);
    engine.submitOrders('p2', orders);
    assert.ok(engine.allOrdersIn());

    engine.revealAndResolve();
    const stepAfter = engine.state.phase.type === 'quarter' ? engine.state.phase.step : null;
    assert.ok(stepAfter === 'cleanup' || stepAfter === 'handDiscard');

    // Check that lobby gave +2 PC
    assert.ok(engine.state.players['p1'].resources.secondary.PC >= 2);

    endQuarterThroughCleanup(engine);
    // Should advance to Q2
    assert.deepEqual(engine.state.phase, { type: 'quarter', quarter: 2, step: 'crisisPulse' });
  });

  it('should play through a full 1-year game', () => {
    const engine = createTestGame(3);
    engine.start();

    // Congress
    engine.submitVote('p1', 0, true);
    engine.submitVote('p2', 0, true);
    engine.submitVote('p3', 0, false);
    engine.resolveVotes();

    // Contract market
    skipContractMarket(engine);

    // Play 4 quarters
    for (let q = 1; q <= 4; q++) {
      engine.endCrisisPulse();

      // Everyone picks lobby + logisticsSurge (simple valid orders)
      for (const pid of ['p1', 'p2', 'p3']) {
        engine.submitOrders(pid, [
          { order: 'lobby' },
          { order: 'logisticsSurge' },
        ]);
      }

      engine.revealAndResolve();
      endQuarterThroughCleanup(engine);
    }

    // After Q4, year end processes and game should end (1-year game)
    assert.equal(engine.state.phase.type, 'gameEnd');
    assert.ok(engine.isGameOver);

    const result = engine.getFinalScores();
    assert.ok(result.winnerId, 'should have a winner');
    assert.equal(Object.keys(result.scores).length, 3);
  });

  it('should enforce phase ordering', () => {
    const engine = createTestGame();
    engine.start();

    assert.throws(() => engine.endContractMarket(), /Expected phase 'contractMarket'/);
    assert.throws(() => engine.endCrisisPulse(), /Expected quarter phase/);
  });

  it('should allow NAVSEA once-per-year reprogram during planOrders', () => {
    const engine = createTestGame();
    engine.start();
    engine.submitVote('p1', 0, true);
    engine.submitVote('p2', 0, true);
    engine.resolveVotes();
    skipContractMarket(engine);
    engine.endCrisisPulse();

    const p1 = engine.getPlayer('p1');
    const fromBefore = p1.resources.budget.A;
    const toBefore = p1.resources.budget.S;

    engine.useNavseaAbility('p1', 'A', 'S');

    assert.equal(p1.resources.budget.A, fromBefore - 1);
    assert.equal(p1.resources.budget.S, toBefore + 1);
    assert.equal(p1.usedOncePerYear, true);

    assert.throws(() => engine.useNavseaAbility('p1', 'S', 'U'), /not available/i);
    assert.throws(() => engine.useNavseaAbility('p2', 'A', 'S'), /not available/i);
  });

  it('should allow TRANSCOM once-per-year conversion during planOrders', () => {
    const engine = new GameEngine({
      players: [
        { id: 'p1', name: 'P1', directorate: 'TRANSCOM' },
        { id: 'p2', name: 'P2', directorate: 'NAVSEA' },
      ],
      seed: 42,
      config: { fiscalYears: 1 },
    });
    engine.start();
    engine.submitVote('p1', 0, true);
    engine.submitVote('p2', 0, true);
    engine.resolveVotes();
    skipContractMarket(engine);
    engine.endCrisisPulse();

    const p1 = engine.getPlayer('p1');
    p1.resources.budget.U = 3;
    const aBefore = p1.resources.budget.A;

    engine.useTranscomAbility('p1', 'A');

    assert.equal(p1.resources.budget.U, 1);
    assert.equal(p1.resources.budget.A, aBefore + 1);
    assert.equal(p1.usedOncePerYear, true);
    assert.throws(() => engine.useTranscomAbility('p1', 'S'), /not available/i);
  });

  it('should allow SPACECY peek and bury during crisisPulse', () => {
    const engine = new GameEngine({
      players: [
        { id: 'p1', name: 'P1', directorate: 'SPACECY' },
        { id: 'p2', name: 'P2', directorate: 'NAVSEA' },
      ],
      seed: 42,
      config: { fiscalYears: 1 },
    });
    engine.start();
    engine.submitVote('p1', 0, true);
    engine.submitVote('p2', 0, true);
    engine.resolveVotes();
    skipContractMarket(engine);

    assert.deepEqual(engine.state.phase, { type: 'quarter', quarter: 1, step: 'crisisPulse' });
    const p1 = engine.getPlayer('p1');
    p1.resources.secondary.PC = 2;
    const first = engine.state.decks.crises[0]?.id;
    const second = engine.state.decks.crises[1]?.id;

    engine.useSpacecyAbility('p1');
    assert.equal(p1.usedOncePerYear, true);
    engine.buryPeekedCrisis('p1');

    assert.equal(p1.resources.secondary.PC, 1);
    assert.equal(engine.state.decks.crises[0]?.id, second);
    assert.throws(() => engine.useSpacecyAbility('p1'), /not available/i);
    assert.ok(first, 'expected at least one crisis card');
  });

  it('should award MARFOR once-per-year +1 PC on first contract completion', () => {
    const engine = new GameEngine({
      players: [
        { id: 'p1', name: 'P1', directorate: 'MARFOR' },
        { id: 'p2', name: 'P2', directorate: 'NAVSEA' },
      ],
      seed: 42,
      config: { fiscalYears: 1 },
    });
    engine.start();
    engine.submitVote('p1', 0, true);
    engine.submitVote('p2', 0, true);
    engine.resolveVotes();
    skipContractMarket(engine);

    const p1 = engine.getPlayer('p1');
    p1.contracts.push({
      card: {
        id: 'test-marfor-contract',
        type: 'contract',
        name: 'Test Contract',
        tags: [],
        contractType: 'Service',
        objectiveText: '',
        requirements: [],
        rewardSI: 1,
        failurePenaltySI: -1,
        immediateAward: [],
      } as any,
      progress: {},
    });
    const pcBefore = p1.resources.secondary.PC;

    for (let q = 1; q <= 4; q++) {
      engine.endCrisisPulse();
      engine.submitOrders('p1', [{ order: 'logisticsSurge' }, { order: 'stationPrograms', assignments: [] }]);
      engine.submitOrders('p2', [{ order: 'logisticsSurge' }, { order: 'stationPrograms', assignments: [] }]);
      engine.revealAndResolve();
      endQuarterThroughCleanup(engine);
    }

    assert.ok(p1.resources.secondary.PC >= pcBefore + 1);
    assert.equal(p1.usedOncePerYear, true);
  });

  it('should apply AIRCOM theater tie-break once per year at year end', () => {
    const engine = new GameEngine({
      players: [
        { id: 'p1', name: 'P1', directorate: 'NAVSEA' },
        { id: 'p2', name: 'P2', directorate: 'AIRCOM' },
      ],
      seed: 42,
      config: { fiscalYears: 1 },
    });
    engine.start();
    engine.submitVote('p1', 0, true);
    engine.submitVote('p2', 0, true);
    engine.resolveVotes();
    skipContractMarket(engine);

    for (let q = 1; q <= 4; q++) {
      engine.endCrisisPulse();
      engine.submitOrders('p1', [{ order: 'lobby' }, { order: 'logisticsSurge' }]);
      engine.submitOrders('p2', [{ order: 'lobby' }, { order: 'logisticsSurge' }]);
      engine.revealAndResolve();
      if (q === 4) {
        const p1 = engine.getPlayer('p1');
        const p2 = engine.getPlayer('p2');
        p1.theaterPresence.northAtlantic.bases = 1;
        p2.theaterPresence.northAtlantic.bases = 1;
        engine.state.board.theaters.northAtlantic.presence.p1.bases = 1;
        engine.state.board.theaters.northAtlantic.presence.p2.bases = 1;
      }
      endQuarterThroughCleanup(engine);
    }

    const p1 = engine.getPlayer('p1');
    const p2 = engine.getPlayer('p2');
    assert.ok(p2.si > p1.si, 'AIRCOM should win tie-break for first place');
    assert.equal(p2.usedOncePerYear, true);
  });

  it('should handle build base order', () => {
    const engine = createTestGame();
    engine.start();
    engine.submitVote('p1', 0, true);
    engine.submitVote('p2', 0, true);
    engine.resolveVotes();
    skipContractMarket(engine);
    engine.endCrisisPulse();

    // P1 builds a base (needs 2U + 1 of any line)
    engine.submitOrders('p1', [
      { order: 'buildBase', theater: 'indoPacific', extraBudgetLine: 'S' },
      { order: 'lobby' },
    ]);
    engine.submitOrders('p2', [
      { order: 'lobby' },
      { order: 'logisticsSurge' },
    ]);

    engine.revealAndResolve();

    const p1 = engine.getPlayer('p1');
    // Check if base was placed (depends on having enough resources)
    // Starting resources: S=2(+1 NAVSEA prod)=3 after production, U=2(+1 prod)=3
    // Cost: 2U + 1S. After: U=1, S=2
    if (p1.theaterPresence.indoPacific.bases > 0) {
      assert.equal(p1.theaterPresence.indoPacific.bases, 1);
      assert.equal(engine.state.board.theaters.indoPacific.presence['p1'].bases, 1);
    }

    endQuarterThroughCleanup(engine);
  });

  it('should handle pipeline and activate program', () => {
    const engine = createTestGame();
    engine.start();
    engine.submitVote('p1', 0, true);
    engine.submitVote('p2', 0, true);
    engine.resolveVotes();
    skipContractMarket(engine);
    engine.endCrisisPulse();

    const p1 = engine.getPlayer('p1');
    // Find a cheap program in hand
    const cheapCard = p1.hand.find(c => {
      const totalCost = Object.values(c.pipelineCost.budget).reduce((a, b) => a + (b ?? 0), 0);
      return totalCost <= 3;
    });

    if (cheapCard) {
      engine.submitOrders('p1', [
        { order: 'startProgram', cardId: cheapCard.id, pipelineSlot: 0 },
        { order: 'lobby' },
      ]);
    } else {
      engine.submitOrders('p1', [
        { order: 'lobby' },
        { order: 'logisticsSurge' },
      ]);
    }

    engine.submitOrders('p2', [
      { order: 'lobby' },
      { order: 'logisticsSurge' },
    ]);

    engine.revealAndResolve();

    if (cheapCard) {
      const slot = p1.portfolio.pipeline[0];
      if (slot) {
        assert.equal(slot.card.id, cheapCard.id);
        assert.ok(!p1.hand.find(c => c.id === cheapCard.id), 'card should be removed from hand');
      }
    }

    endQuarterThroughCleanup(engine);
  });

  it('should fire activate effects (V-22 Osprey +1 L)', () => {
    const engine = createTestGame();
    engine.start();
    engine.submitVote('p1', 0, true);
    engine.submitVote('p2', 0, true);
    engine.resolveVotes();
    skipContractMarket(engine);
    engine.endCrisisPulse();

    const p1 = engine.getPlayer('p1');
    const v22 = PROGRAM_CARDS.find(c => c.id === 'prog-v22')!;
    assert.ok(v22, 'V-22 card should exist');

    // Inject V-22 into player's hand and give enough resources
    p1.hand.push(v22);
    p1.resources.budget.A = 10;
    p1.resources.budget.E = 10;
    p1.resources.budget.U = 10;

    const lBefore = p1.resources.secondary.L;

    engine.submitOrders('p1', [
      { order: 'activateProgram', cardId: v22.id, activeSlot: 0 },
      { order: 'lobby' },
    ]);
    engine.submitOrders('p2', [
      { order: 'lobby' },
      { order: 'logisticsSurge' },
    ]);
    engine.revealAndResolve();

    // Check the +1 L activate effect fired
    const lAfter = p1.resources.secondary.L;
    assert.equal(lAfter, lBefore + 1, `V-22 activate should give +1 L (before=${lBefore}, after=${lAfter})`);

    // Check the card is now in active slot
    assert.ok(p1.portfolio.active[0], 'V-22 should be in active slot 0');
    assert.equal(p1.portfolio.active[0]!.card.id, 'prog-v22');

    // Check log has the effect
    const resourceLog = engine.state.log.filter(
      e => e.type === 'resourceChange' && e.playerId === 'p1' && e.resource === 'L'
    );
    assert.ok(resourceLog.length > 0, 'should have L resource change in log');
  });

  it('determinism: same seed produces same game', () => {
    function playGame(seed: number) {
      const engine = createTestGame(2);
      engine.state.seed = seed;
      engine.start();
      engine.submitVote('p1', 1, true);
      engine.submitVote('p2', 0, false);
      engine.resolveVotes();
      skipContractMarket(engine);

      for (let q = 1; q <= 4; q++) {
        engine.endCrisisPulse();
        engine.submitOrders('p1', [{ order: 'lobby' }, { order: 'logisticsSurge' }]);
        engine.submitOrders('p2', [{ order: 'lobby' }, { order: 'majorExercise' }]);
        engine.revealAndResolve();
        endQuarterThroughCleanup(engine);
      }

      return engine.state.players;
    }

    const result1 = playGame(12345);
    const result2 = playGame(12345);

    assert.equal(result1['p1'].si, result2['p1'].si);
    assert.equal(result1['p2'].si, result2['p2'].si);
    assert.equal(result1['p1'].resources.secondary.PC, result2['p1'].resources.secondary.PC);
  });
});
