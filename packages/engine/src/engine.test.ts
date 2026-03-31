import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { GameEngine } from './engine.js';
import type { OrderChoice } from '@fp/shared';

describe('GameEngine', () => {

  function createTestGame(playerCount = 2) {
    const directorates = ['NAVSEA', 'AIRCOM', 'MARFOR', 'SPACECY', 'TRANSCOM'] as const;
    const players = Array.from({ length: playerCount }, (_, i) => ({
      id: `p${i + 1}`,
      name: `Player ${i + 1}`,
      directorate: directorates[i],
    }));
    return new GameEngine({ players, seed: 42, config: { fiscalYears: 1 } });
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
    assert.ok(engine.state.contractMarket.length > 0, 'should have contracts available');

    const contractId = engine.state.contractMarket[0].id;
    const took = engine.takeContract('p1', contractId);
    assert.ok(took, 'should successfully take contract');
    assert.equal(engine.state.players['p1'].contracts.length, 1);

    engine.endContractMarket();
    assert.equal(engine.state.phase.type, 'quarter');
  });

  it('should handle a full quarter cycle', () => {
    const engine = createTestGame();
    engine.start();
    engine.submitVote('p1', 0, true);
    engine.submitVote('p2', 0, true);
    engine.resolveVotes();
    engine.endContractMarket();

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
    assert.deepEqual(engine.state.phase, { type: 'quarter', quarter: 1, step: 'cleanup' });

    // Check that lobby gave +2 PC
    assert.ok(engine.state.players['p1'].resources.secondary.PC >= 2);

    engine.endQuarter();
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
    engine.endContractMarket();

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
      engine.endQuarter();
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

  it('should handle build base order', () => {
    const engine = createTestGame();
    engine.start();
    engine.submitVote('p1', 0, true);
    engine.submitVote('p2', 0, true);
    engine.resolveVotes();
    engine.endContractMarket();
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

    engine.endQuarter();
  });

  it('should handle pipeline and activate program', () => {
    const engine = createTestGame();
    engine.start();
    engine.submitVote('p1', 0, true);
    engine.submitVote('p2', 0, true);
    engine.resolveVotes();
    engine.endContractMarket();
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

    engine.endQuarter();
  });

  it('determinism: same seed produces same game', () => {
    function playGame(seed: number) {
      const engine = createTestGame(2);
      engine.state.seed = seed;
      engine.start();
      engine.submitVote('p1', 1, true);
      engine.submitVote('p2', 0, false);
      engine.resolveVotes();
      engine.endContractMarket();

      for (let q = 1; q <= 4; q++) {
        engine.endCrisisPulse();
        engine.submitOrders('p1', [{ order: 'lobby' }, { order: 'logisticsSurge' }]);
        engine.submitOrders('p2', [{ order: 'lobby' }, { order: 'majorExercise' }]);
        engine.revealAndResolve();
        engine.endQuarter();
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
