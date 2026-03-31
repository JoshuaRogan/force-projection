# Research: Game Balance Simulation & Testing

> Research findings for Force Projection: Joint Command automated balance testing.
> Covers Monte Carlo simulation, OpenSpiel evaluation, AI agent design, statistical methods, and tooling.

---

## Table of Contents

1. [Monte Carlo Simulation for Board Games](#1-monte-carlo-simulation-for-board-games)
2. [OpenSpiel (Google DeepMind) Evaluation](#2-openspiel-google-deepmind-evaluation)
3. [AI Agent Design for Simulation](#3-ai-agent-design-for-simulation)
4. [Statistical Methods for Balance Analysis](#4-statistical-methods-for-balance-analysis)
5. [Existing Tools and Libraries](#5-existing-tools-and-libraries)
6. [Recommended Architecture](#6-recommended-architecture)
7. [Next Steps](#7-next-steps)

---

## 1. Monte Carlo Simulation for Board Games

### What It Is

Monte Carlo simulation means running thousands (or millions) of randomized game playthroughs with automated agents, then analyzing the statistical distributions of outcomes. It is the primary technique used to balance complex strategy games with large state spaces where analytical solutions are intractable.

The core loop is simple:

```
for seed in range(N):
    game = create_game(seed, parameters)
    assign_factions_and_bots(game)
    while not game.is_over():
        for player in game.active_players():
            action = player.bot.choose_action(game.state)
            game.apply(action)
    record_results(game)
analyze(all_results)
```

The power comes from volume: patterns invisible in 10 games become statistically clear in 10,000.

### How Commercial Games Used It

**Dominion (Donald X. Vaccarino):** Balanced primarily through human playtesting, but the community later built simulators (e.g., "Geronimoo's Dominion Simulator") that run millions of games with "Big Money + X" strategies to evaluate card power levels. The key insight: even simple heuristic bots (buy Province when you can afford it, buy the card being tested otherwise) reveal dominant strategies and broken cards. Dominion's relatively simple decision tree (buy phase + action phase) made this tractable.

**Terraforming Mars (Jacob Fryxelius):** Balanced through extensive human playtesting (years), but the game's 200+ unique project cards made systematic balance difficult. The community has since built simulators that revealed known imbalances (e.g., certain corporations like Ecoline being statistically stronger). TM's complexity -- simultaneous resource tracks (MegaCredits, Steel, Titanium, Plants, Energy, Heat), tableau building, and variable card market -- is structurally similar to Force Projection's design. The lesson: TM shipped with known imbalances that took expansions to address. Automated simulation from the start would have caught these.

**Spirit Island:** Uses asymmetric spirits (analogous to our Directorates) with wildly different power curves. Balance was achieved through target win-rate ranges per difficulty level rather than forcing all spirits to identical win rates. This is a useful model: rather than demanding exactly 20% win rate per Directorate, we should target a range (e.g., 17-23%) and focus on ensuring no faction is strictly dominated.

**Magic: The Gathering (Wizards of the Coast):** WotC's "Future Future League" is an internal playtesting group that plays with cards 12-18 months before release. They supplement this with automated simulations for mana base calculations, curve analysis, and format speed estimation. The combination of simulation (catches numerical issues) and human playtesting (catches feel/fun issues) is the gold standard.

### What Works for Simultaneous-Action, Multi-Resource Games

Our game has several properties that shape the simulation approach:

1. **Simultaneous order selection** -- all players pick 2 orders secretly, then reveal. This creates a combinatorial explosion for game-tree search but is straightforward for Monte Carlo simulation (each bot just picks its orders independently).

2. **Multi-resource economy** -- 5 budget lines + 4 secondary resources. This means a bot can't just "maximize money." It needs to reason about resource portfolios.

3. **220+ unique cards** -- each card changes the decision landscape. The card pool is too large for exhaustive analysis; statistical sampling is the only option.

4. **5 asymmetric factions** -- the primary balance question. Faction balance must be validated across all player counts and matchup combinations.

Recommended techniques:

**A) Self-play with heuristic agents.** Run 10,000+ games with diverse bot strategies, collect win rates, score distributions, and resource utilization per faction. This is the bread-and-butter approach.

**B) Sensitivity analysis.** Systematically vary one parameter (e.g., a program cost, a contract reward, a faction starting bonus) and measure the impact on win rates and score variance. This identifies which numbers are "load-bearing" vs. cosmetic. Implementation:

```typescript
interface ParameterSweep {
  parameter: string;        // e.g., "NAVSEA.startBonus.S_production"
  values: number[];         // e.g., [0, 1, 2, 3]
  gamesPerValue: number;    // e.g., 2000
}
```

**C) Stratified sampling.** Don't just run all-random matchups. Run specific faction combinations (all 10 possible 2-faction matchups for 2-player, key 3/4/5 player combos) to detect pairwise imbalances that aggregate statistics would hide. For 5 factions at 2-player: 10 matchups. At 3-player: 10 combinations. At 4-player: 5 combinations. At 5-player: 1 combination. Run 1,000+ games per combination.

**D) Card power scoring.** For the 220+ program cards, assign a heuristic "power level" based on cost-efficiency (SI gained per resource spent, tempo advantage, etc.) and validate these predictions against simulation results. Cards whose simulated performance deviates significantly from predicted power are balance risks.

### Practical for Our Use Case?

**YES** -- this is the core of Phase 2 and the right approach. Our game has exactly the properties that make Monte Carlo simulation valuable: large state space, asymmetric factions, hundreds of unique cards, and simultaneous decision-making.

### Recommendation

**BUILD** a Monte Carlo simulation harness as a first-class TypeScript module alongside the game engine. Target 10,000 games minimum per balance pass. Design the harness to be parameterized so card costs, faction bonuses, and resource values can be swept automatically.

---

## 2. OpenSpiel (Google DeepMind) Evaluation

### What It Is

OpenSpiel is an open-source framework for research in games, developed by DeepMind. It provides a unified interface for representing games, algorithms for playing them (MCTS, CFR, alpha-beta, etc.), and tools for evaluating strategies. It supports Python and C++ with the Python API as the primary interface.

### Games Supported

OpenSpiel includes implementations of ~70 games: Go, Chess, Poker variants (Texas Hold'em, Kuhn, Leduc), Hanabi, Tic-Tac-Toe, Connect Four, Backgammon, Breakthrough, Bridge, Battleship, and others. The framework supports:

- Perfect and imperfect information games
- Simultaneous-move games (via "simultaneous node" game type)
- N-player games (arbitrary player count)
- Chance nodes (card draws, dice rolls)
- Extensive-form and normal-form representations
- Sequential and simultaneous action spaces

### Custom Game Implementation

To add a custom game, you implement the framework's abstract interfaces:

**In Python (`pyspiel`):**
- `Game` class: defines game parameters, creates initial state
- `State` class: implements `legal_actions()`, `apply_action()`, `is_terminal()`, `returns()`, `current_player()`, `information_state_string()`, `observation_tensor()`

**In C++ (for performance):**
- Same interfaces but in C++, with Python bindings generated automatically

The action space must be represented as integers from a fixed-size action set defined at game creation time.

### Key Limitations for Force Projection

**1. Action Space Representation**

OpenSpiel expects actions to be integers from a fixed action space. Force Projection's action space is highly context-dependent:
- Order selection: pick 2 of 12 (66 combinations)
- Card play: which card from hand (variable, up to 7 cards)
- Theater targeting: which of 6 theaters
- Agenda voting: how much PC to commit and Support vs. Oppose

Encoding this as a flat integer space requires something like:
- 66 order-pair actions + 7 * (pipeline/active/mothball) card actions + 6 theater actions + ...
- Potentially 500+ action IDs, most illegal in any given state

This is technically possible but creates an extremely sparse action space that OpenSpiel's algorithms (especially MCTS and CFR) handle poorly.

**2. Simultaneous Moves**

OpenSpiel DOES support simultaneous moves, which is relevant for our order selection phase. However, it models them by converting to a "simultaneous node" where each player independently chooses an action, and the framework creates the joint action implicitly. This works for our order selection but does NOT naturally handle the sequential resolution phase (Influence > Procure > Deploy > Sustain) that follows the simultaneous reveal.

**3. State Complexity**

OpenSpiel games are typically representable as compact tensors for neural network input. Our game state includes:
- Per-player: portfolio (6 active slots with specific cards from 220+, 3 pipeline, mothball row), 9 resource types with production tracks, theater presence (6 theaters x 3 placement types), hand of cards, active contracts
- Shared: agenda state, contract market, crisis deck, national posture thresholds, turn/phase/quarter tracking

This is 1-2 orders of magnitude more complex than any game in OpenSpiel's standard library. The observation tensor would be enormous and sparse.

**4. Algorithm Fit**

OpenSpiel's strength is game-theoretic algorithms:
- **CFR (Counterfactual Regret Minimization):** for computing Nash equilibria in imperfect-information games (poker). Our game is too large for CFR.
- **MCTS (Monte Carlo Tree Search):** for games with clear decision trees (Go, Chess). Our simultaneous action selection makes the game tree branch factor enormous.
- **Alpha-beta:** for perfect-information two-player games. Not applicable.

We don't need Nash equilibrium solvers or neural network training. We need simple heuristic bots and statistical analysis -- things OpenSpiel doesn't particularly help with.

**5. Language Mismatch**

OpenSpiel is Python/C++. Our game engine will be TypeScript. Using OpenSpiel means either:
- (a) Reimplementing the entire game engine in Python/C++ (duplicating work, divergence risk)
- (b) Building a bridge layer (serializing game state between TypeScript and Python each turn)

Neither is practical for a game this complex.

**6. Learning Curve**

Implementing a custom game in OpenSpiel requires understanding its type system, game tree representation, serialization format, and observation tensor design. For a game at Force Projection's complexity, expect 2-4 weeks for the integration alone, with ongoing maintenance burden every time the game rules change.

### Practical for Our Use Case?

**NO.** OpenSpiel is designed for game theory research on well-defined abstract games with compact state spaces. It excels at poker variants, simple board games, and canonical game theory problems. Force Projection is too complex, too domain-specific, and in the wrong programming language for OpenSpiel to add value.

### Recommendation

**SKIP** OpenSpiel entirely. Build a custom simulation harness in TypeScript that sits directly on top of the game engine. This avoids the language bridge, the awkward action-space encoding, and the overhead of a framework designed for a different problem. The 2-4 weeks saved on OpenSpiel integration is better spent on bot diversity and statistical analysis.

---

## 3. AI Agent Design for Simulation

### What It Is

For balance testing, we need automated players that make "reasonable but varied" decisions. These are NOT ML agents -- they are rule-based heuristic bots with different strategic personalities. The goal is not to find optimal play but to stress-test the game from multiple angles.

The critical insight: **you don't need good AI to detect balance problems.** Even mediocre bots that make "plausible human" decisions will reveal when one faction wins 30% instead of 20%, when one order is always chosen, or when a card is too cheap for its effect. The bots need to be "good enough" to avoid pathological play (never taking contracts, never building bases) without needing to be competitive with expert humans.

### Pattern A: Utility-Function Agents (Recommended Core)

Each bot has a utility function that scores every legal action. The utility function is a weighted sum of factors:

```typescript
function evaluateAction(state: GameState, action: Action, weights: WeightVector): number {
  return weights.resourceEfficiency * estimateResourceEfficiency(state, action)
       + weights.siGained         * estimateImmediateSI(state, action)
       + weights.portfolioFit     * evaluatePortfolioSynergy(state, action)
       + weights.contractProgress * estimateContractProgress(state, action)
       + weights.theaterPosition  * evaluateTheaterImpact(state, action)
       + weights.crisisMitigation * estimateCrisisMitigation(state, action)
       + weights.tempoValue       * estimateTempoGain(state, action);
}
```

Different bot personalities are created by changing the weights:

| Bot Type | Key Weight Biases | Behavior |
|----------|------------------|----------|
| **Aggressive** | High SI_gained, high theater_position, low crisis_mitigation | Rushes theater control, takes high-risk contracts, ignores sustain |
| **Defensive** | High crisis_mitigation, high resource_efficiency, low theater_position | Plays safe, sustains heavily, avoids contested theaters |
| **Balanced** | Moderate all weights, slight contract_progress bias | The "default good player" -- takes safe contracts, builds steadily |
| **Specialist** | Massive bonus for actions matching directorate strengths | NAVSEA bots weight SEA-tag programs heavily, AIRCOM weights fighters, etc. |
| **Random** | All weights = 0, uniform random | Pure baseline for statistical comparison |
| **Greedy** | Maximize immediate resource/SI gain | No long-term planning, takes whatever scores now |
| **Builder** | High portfolio_fit, prioritizes pipeline and production | Focuses on engine-building, slow to score but strong late |

### Pattern B: Phase-Aware Decision Making

Smart bots should shift strategy based on game phase:

- **Early game (Year 1):** Prioritize production upgrades, pipeline programs, base placement
- **Mid game (Years 2-3):** Activate key programs, pursue contracts, contest theaters
- **Late game (Year 4):** Score-maximizing moves, endgame set bonuses, complete contracts

Implementation as phase multipliers on the base weights:

```typescript
interface BotPersonality {
  name: string;
  baseWeights: WeightVector;
  phaseMultipliers: {
    early: WeightVector;   // Year 1
    mid: WeightVector;     // Years 2-3
    late: WeightVector;    // Year 4
  };
  noise: number;           // 0.0 = deterministic, 1.0 = fully random
}

function getEffectiveWeights(personality: BotPersonality, year: number): WeightVector {
  const phase = year <= 1 ? 'early' : year <= 3 ? 'mid' : 'late';
  const multiplier = personality.phaseMultipliers[phase];
  return elementwiseMultiply(personality.baseWeights, multiplier);
}
```

### Pattern C: The Noise Dial

Every bot should have a configurable noise parameter. Even the "aggressive" bot should occasionally make suboptimal moves. This prevents bots from being overly predictable (which would bias the simulation toward whatever counters that specific pattern). Implementation:

```typescript
function selectAction(
  actions: Action[],
  scores: number[],
  noise: number,
  rng: SeededRNG
): Action {
  // Normalize scores to [0, 1]
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  const range = maxScore - minScore || 1;
  const normalized = scores.map(s => (s - minScore) / range);

  // Add Gaussian noise scaled by the noise parameter
  const noisyScores = normalized.map(s => s + noise * rng.gaussian());

  // Select the highest noisy score
  return actions[argmax(noisyScores)];
}
```

Calibration guidelines:
- Noise 0.05-0.1: "Expert player who occasionally makes mistakes"
- Noise 0.2-0.3: "Good player, sometimes tries suboptimal ideas"
- Noise 0.5: "Casual player"
- Noise 1.0: "Near-random"

For balance testing, the sweet spot is 0.15-0.25 -- good enough to avoid pathological play, noisy enough to explore diverse game states.

### Pattern D: Order Selection Strategy

Simultaneous 2-of-12 order selection is the unique challenge for this game. There are C(12,2) = 66 possible order pairs each quarter. The bot needs to evaluate them efficiently.

**Simple approach (start here):** Score each of the 12 orders independently, pick the top 2.

```typescript
function selectOrders(state: GameState, personality: BotPersonality): [Order, Order] {
  const scores = ALL_ORDERS.map(order =>
    evaluateOrder(state, order, personality.effectiveWeights)
  );
  const sorted = argsort(scores).reverse();
  return [ALL_ORDERS[sorted[0]], ALL_ORDERS[sorted[1]]];
}
```

This is "wrong" because order pairs can have synergies (e.g., Lobby + Contracting in the same quarter for a political strategy). But it is fast and good enough for initial balance testing.

**Advanced approach (upgrade later):** Evaluate all 66 pairs, considering synergy bonuses:

```typescript
function selectOrderPair(state: GameState, personality: BotPersonality): [Order, Order] {
  let bestPair: [Order, Order];
  let bestScore = -Infinity;

  for (let i = 0; i < ALL_ORDERS.length; i++) {
    for (let j = i + 1; j < ALL_ORDERS.length; j++) {
      const pairScore = evaluateOrder(state, ALL_ORDERS[i], weights)
                      + evaluateOrder(state, ALL_ORDERS[j], weights)
                      + evaluateSynergy(ALL_ORDERS[i], ALL_ORDERS[j], state);
      if (pairScore > bestScore) {
        bestScore = pairScore;
        bestPair = [ALL_ORDERS[i], ALL_ORDERS[j]];
      }
    }
  }
  return bestPair;
}
```

### Pattern E: Contract Evaluation

Bots need a contract-evaluation heuristic for the Contract Market phase:

```typescript
function evaluateContract(
  contract: Contract,
  state: GameState,
  personality: BotPersonality
): number {
  const completionProb = estimateCompletionProbability(contract, state);
  const expectedValue = contract.rewardSI * completionProb
                      - contract.failurePenalty * (1 - completionProb);
  const resourceCost = estimateResourceCost(contract, state);

  // Aggressive bots overestimate completion probability
  // Defensive bots underestimate it
  const biasedProb = completionProb * personality.contractOptimism; // 0.7 to 1.3

  return expectedValue / Math.max(resourceCost, 1);
}
```

### Pattern F: Opponent Modeling (Optional, Later)

For more realistic simulation, bots can model what opponents are likely doing:

```typescript
function estimateOpponentOrders(
  opponent: Player,
  state: GameState
): OrderDistribution {
  // Simple model: assume opponents pick orders matching their
  // apparent strategy (heavy on Deploy if they've been building bases, etc.)
  const recentOrders = opponent.orderHistory.slice(-4);
  const distribution = computeOrderFrequency(recentOrders);
  return smoothDistribution(distribution, 0.1); // add 10% uniform noise
}
```

This enables strategic reasoning like "if opponents are likely to Deploy, I should Sustain to prepare for the crisis" -- but it adds complexity and should be deferred to later iterations.

### Lessons from Notable Tabletop AI Implementations

**Dominion bots:** The most successful were "Big Money + X" variants -- a simple baseline strategy with one modification. This is a powerful pattern: define a "Big Money equivalent" for Force Projection (steady production growth, take safe contracts, avoid risks) and then create variants that deviate from it in one dimension.

**Through the Ages (CGE Digital):** Uses difficulty-tiered AI with utility functions. Lower-difficulty bots have higher noise and simpler evaluation. Higher-difficulty bots evaluate multi-turn sequences. For balance testing, mid-tier bots are most useful.

**Twilight Imperium simulators (community):** For complex 4X-style games, the community found that even very simple bots (pick the most obviously good action each turn) can detect major balance issues. You don't need perfect play to find that one faction wins 35% instead of 17%.

**Root (Leder Games):** The digital adaptation has faction-specific AI with distinct behavior trees for each asymmetric faction. This validates the Specialist bot approach -- bots that understand their faction's strengths are more realistic than generic strategies.

### Practical for Our Use Case?

**YES** -- utility-function agents with personality weights are exactly the right approach for a game this complex.

### Recommendation

**BUILD** a `BotPersonality` system with utility-function scoring. Implementation order:

1. **Random bot** -- baseline; validates the simulation harness works end-to-end
2. **Greedy bot** -- picks highest immediate value; first real balance signal
3. **Balanced bot** -- the "Big Money" equivalent; steady, reasonable play
4. **Aggressive + Defensive** -- weight adjustments on Balanced
5. **Specialist bots** -- one per Directorate, for faction-specific optimization (Phase 3)
6. **Builder bot** -- long-term engine focus, catches snowball issues

Use the noise dial to generate hundreds of personality variants from the base types (e.g., "Aggressive with noise 0.1", "Aggressive with noise 0.3", etc.).

---

## 4. Statistical Methods for Balance Analysis

### Core Metrics

| Metric | What It Measures | Target Range | Computation |
|--------|-----------------|--------------|-------------|
| **Win rate by Directorate** | Faction power level | 17-23% (for 5 factions, baseline 20%) | `wins / games_played` per faction |
| **Mean SI by Directorate** | Average scoring power | Within 1 SD across factions | `mean(finalSI)` per faction |
| **SI standard deviation** | Score spread / snowball | Lower is better (tight games) | `std(finalSI)` across all games |
| **Gini coefficient** | Score inequality within a game | 0.05-0.15 (low inequality = competitive) | See formula below |
| **First-player advantage** | Initiative order bias | < 2% win rate difference across seats | Win rate by seat position |
| **Game length variance** | Pacing consistency | CV < 0.15 | `std(gameLength) / mean(gameLength)` |
| **Order selection frequency** | Action viability | No order < 5% or > 25% | `count(chosen) / total_slots` |
| **Order-win correlation** | Dominant strategies | Pearson r < 0.3 for any order | `pearson(orderFreq, win)` per player |
| **Contract completion rate** | Risk/reward calibration | 50-70% overall | `completed / taken` |
| **Theater control concentration** | Map balance | No theater > 40% controlled by one faction | HHI per theater |
| **Comeback rate** | Anti-snowball | > 15% of trailing players at midpoint finish top 2 | Track position changes |

### Gini Coefficient for Score Distribution

The Gini coefficient measures inequality in a distribution. For a single game's final scores:

```
Given sorted scores x_1 <= x_2 <= ... <= x_n:
Gini = (2 * sum(i * x_i, i=1..n)) / (n * sum(x_i)) - (n + 1) / n
```

Interpretation for our game:
- **Gini = 0:** All players scored identically (perfectly balanced but boring)
- **Gini 0.05-0.10:** Very close competitive games (ideal for a strategy game)
- **Gini 0.10-0.15:** Moderate spread, clear winner but others competitive (acceptable)
- **Gini 0.15-0.25:** Significant spread, some blowouts (investigate)
- **Gini > 0.25:** Frequent blowouts (likely snowball problem, needs fixing)

Compute the Gini for each game, then examine the distribution:
- **Median Gini:** overall game closeness
- **90th percentile Gini:** worst-case blowout severity
- **Gini by faction matchup:** which faction combinations produce the most uneven games

### Statistical Tests for Balance

#### Primary Tests (implement first)

**Chi-squared goodness-of-fit test:**
- Question: "Is the win distribution across 5 factions significantly different from uniform (20% each)?"
- Input: observed win counts per faction, expected = total_games / 5
- Output: chi-squared statistic and p-value
- Decision: p < 0.05 means imbalance is statistically significant, not just noise
- Minimum sample: ~1,500 games for meaningful results

```typescript
// Using simple-statistics or manual implementation
function chiSquaredBalance(winCounts: number[], expectedRate: number): {
  statistic: number;
  pValue: number;
  isBalanced: boolean;
} {
  const total = sum(winCounts);
  const expected = total * expectedRate;
  const chiSq = winCounts.reduce((acc, obs) =>
    acc + Math.pow(obs - expected, 2) / expected, 0
  );
  // df = 4 (5 factions - 1)
  // Look up p-value from chi-squared distribution with 4 df
  return { statistic: chiSq, pValue: chiSquaredPValue(chiSq, 4), isBalanced: pValue > 0.05 };
}
```

**Bootstrap confidence intervals:**
- For any metric (win rate, mean SI, Gini), generate 95% confidence intervals via resampling
- Method: sample N results with replacement 10,000 times, compute the metric each time, take the 2.5th and 97.5th percentiles
- This is non-parametric (no distribution assumptions) and works for any metric

```typescript
function bootstrapCI(
  data: number[],
  metric: (sample: number[]) => number,
  nBootstrap: number = 10000,
  alpha: number = 0.05
): [number, number] {
  const estimates: number[] = [];
  for (let i = 0; i < nBootstrap; i++) {
    const sample = sampleWithReplacement(data, data.length);
    estimates.push(metric(sample));
  }
  estimates.sort((a, b) => a - b);
  return [
    estimates[Math.floor(nBootstrap * alpha / 2)],
    estimates[Math.floor(nBootstrap * (1 - alpha / 2))]
  ];
}
```

**Binomial test (per faction):**
- Question: "Is NAVSEA's win rate significantly different from 20%?"
- Test: exact binomial test, H0: p = 0.2
- Run for each of the 5 factions independently
- Apply Bonferroni correction for multiple comparisons (significance threshold = 0.05 / 5 = 0.01)

#### Secondary Tests (implement in Phase 3)

**Kruskal-Wallis H test:**
- Non-parametric equivalent of one-way ANOVA
- Question: "Do the SI score distributions differ across factions?"
- Better than ANOVA because score distributions are likely non-normal (skewed by blowouts)
- If significant, follow up with pairwise Mann-Whitney U tests

**Mann-Whitney U test:**
- Non-parametric comparison of two score distributions
- Question: "Is NAVSEA's score distribution significantly different from AIRCOM's?"
- Run for all 10 pairwise faction comparisons
- Apply Bonferroni correction (threshold = 0.05 / 10 = 0.005)

**Effect size (Cohen's d):**
- How practically significant is a difference?
- A faction might be statistically significantly stronger but only by 0.5 SI average -- not worth fixing
- Cohen's d < 0.2: negligible practical difference
- Cohen's d 0.2-0.5: small but notable
- Cohen's d > 0.5: meaningful balance problem

### Detecting Specific Problems

#### Snowball Detection

Compute the Pearson correlation between "SI at end of Year 1" and "final SI."

| Correlation | Interpretation |
|------------|----------------|
| r < 0.3 | Healthy -- early performance is not deterministic |
| r 0.3-0.5 | Moderate -- early advantages matter but can be overcome |
| r 0.5-0.7 | Concerning -- early leads are sticky, comeback is hard |
| r > 0.7 | Snowball problem -- early game decides the winner |

Also track "comeback rate": how often does the player in last place after Year 2 finish in the top 2? Target: > 15%.

Additional snowball metric: **Kendall's tau** between player rankings at each year-end and final rankings. If tau increases monotonically (e.g., 0.3, 0.5, 0.8, 1.0), positions "lock in" too early.

#### Order Dominance Detection

For each order:
1. **Selection frequency:** How often is it chosen? (Expected: ~16.7% for each of 12 orders if uniform, but some variance is fine)
2. **Conditional win rate:** P(win | player chose this order in > 50% of available quarters)
3. **Mutual information** between order choice and winning

An order is **dominant** if it has BOTH high selection frequency AND high conditional win rate. An order is **dead** if it's chosen < 3% of the time by non-random bots.

For order pairs, check if any pair is chosen > 30% of the time by winning players. This indicates a "solved" meta that reduces strategic diversity.

#### First-Player Advantage

Run games with fixed seating and rotate. Test:
1. Chi-squared test on win rate by seat position
2. ANOVA on mean SI by seat position
3. Check if seat position correlates with SI even among non-winners

For simultaneous games, first-player advantage is usually small (it mainly affects contract market selection and initiative order for same-order resolution). If it exceeds 2%, consider adding a compensation mechanism (e.g., last player gets +1 of a resource).

#### Card Power Outliers

For each of the 220+ program cards, track:
- Times drawn across all games
- Times played (activated or pipelined) when drawn
- Play rate: `played / drawn` (a card drawn but never played is weak or situational)
- Win correlation: average win rate of players who played this card vs. those who didn't
- SI contribution: estimated SI gained from this card when played

Cards with z-scores > 2 on win correlation are candidates for cost increases. Cards with z-scores < -2 are candidates for buffs. Cards with play rate < 10% may be too narrow or overcosted.

**Important caveat:** card balance requires many more games than faction balance. With 220 cards and each card appearing in ~5% of games (drawn from a deck), you need ~10,000 games to get ~500 observations per card for basic statistics, and ~50,000 for confident card-level conclusions.

#### Budget Line Health

Track per-game resource utilization for each budget line:
- **Generation rate:** average resources of each type produced per fiscal year
- **Spend rate:** average resources of each type spent per fiscal year
- **Surplus/deficit:** generation - spend
- **Reprogramming frequency:** how often players convert between lines, and which conversions are most common

A healthy economy has:
- All budget lines with spend rate > 70% of generation (resources are useful)
- No budget line chronically at 0 (players can execute their strategies)
- Reprogramming used 1-3 times per year (it's a meaningful choice, not a constant tax)
- Sustain (U) is the most-used line (by design, it's the universal maintenance cost)

### Minimum Sample Sizes

| Precision Goal | Minimum Games | Rationale |
|----------------|--------------|-----------|
| Detect 5% win rate deviation from 20% | ~1,500 | Chi-squared with 80% power |
| Detect 3% deviation | ~4,000 | Higher sensitivity |
| Stable card-level statistics (220 cards) | ~10,000 | ~500 observations per card |
| Pairwise faction matchup analysis | ~2,000 per matchup | 10 matchups = 20,000 total |
| Full validation run | ~50,000 | Confident card-level + all matchups |
| Quick smoke test | ~500 | Catches gross imbalances only |

### Practical for Our Use Case?

**YES** -- these statistical methods are essential for interpreting simulation results correctly.

### Recommendation

**BUILD** a statistics module that computes all metrics in the core metrics table after each simulation batch. Implementation priority:

1. Win rate + mean SI per faction (immediate signal)
2. Chi-squared test + binomial tests (statistical significance)
3. Bootstrap confidence intervals (uncertainty quantification)
4. Gini coefficient (game closeness)
5. Snowball correlation (healthy game arcs)
6. Order frequency analysis (strategic diversity)
7. Card-level statistics (requires many more games, Phase 3)

---

## 5. Existing Tools and Libraries

### TypeScript/JavaScript Ecosystem

| Library | Purpose | Verdict | Notes |
|---------|---------|---------|-------|
| **simple-statistics** | Stats: mean, median, std, chi-squared, t-test, linear regression, Bayesian, quantiles | **USE** | Lightweight, zero deps, well-maintained. Covers 80% of our stats needs. |
| **jStat** | Full stats suite: distributions, hypothesis tests, matrix ops, ANOVA | **MAYBE** | Heavier than simple-statistics but has ANOVA, distribution CDFs. Use if simple-statistics is insufficient. |
| **seedrandom** | Seeded PRNG for reproducible randomness | **USE** | Essential. Every simulation run must be reproducible from its seed. |
| **workerpool** | Node.js worker thread pool | **USE** | Parallelize simulation across CPU cores. 8-core machine = ~8x throughput. |
| **Comlink** | Web Worker wrapper for browser | **USE** | If we run simulations in the browser for the dashboard. |
| **d3** / **Observable Plot** | Data visualization | **USE** | For the balance dashboard visualizations. |
| **Chart.js** | Simpler charting | **ALTERNATIVE** | Easier than d3 for standard charts (bar, line, scatter). |
| **boardgame.io** | Game framework with MCTS AI | **SKIP** | See detailed evaluation below. |
| **mathjs** | General math library | **SKIP** | Overkill; simple-statistics covers our needs. |
| **ml-matrix** | Matrix operations | **SKIP** | Not needed for heuristic bots. |

#### boardgame.io Detailed Evaluation

boardgame.io is a well-known framework for building turn-based multiplayer games. It handles state management, turn order, phases, moves, and has AI support.

**Pros:**
- Built-in AI framework with MCTS and random bots
- Handles game phases, turns, and moves
- Has multiplayer support with state sync via socket.io
- Mature project, actively maintained, good documentation

**Cons for Force Projection:**
- Its state model assumes a specific turn structure (`moves` within `turns` within `phases`) that doesn't map cleanly to our simultaneous-order-selection model
- Its AI (MCTS-based) is designed for games with clear decision trees, not contextual utility-function evaluation
- The framework's abstractions would fight against our game's unique structure (simultaneous reveal, sequential resolution by order category, portfolio system)
- We'd still need to build ALL domain-specific logic ourselves
- Adopting it locks us into its state management patterns, which may limit optimization

**Verdict:** boardgame.io is excellent for simpler games (Tic-Tac-Toe through mid-complexity euros). For Force Projection's complexity and unique structure, the cost of conforming to the framework exceeds the benefit. Build a purpose-built engine.

### Python Ecosystem (for analysis alongside)

| Library | Purpose | Verdict |
|---------|---------|---------|
| **scipy.stats** | All statistical tests: chi2, ANOVA, Mann-Whitney, Kruskal-Wallis, bootstrapping | **USE** |
| **pandas** | Data manipulation and analysis | **USE** |
| **matplotlib** + **seaborn** | Statistical visualization | **USE** |
| **numpy** | Numerical computing, array operations | **USE** |
| **Jupyter notebooks** | Interactive analysis environment | **USE** |
| **statsmodels** | Advanced regression, time series, more hypothesis tests | **MAYBE** -- for advanced analysis later |
| **plotly** | Interactive visualizations | **MAYBE** -- for shareable balance reports |

The Python ecosystem is vastly superior for statistical analysis and visualization. Rather than reimplementing scipy.stats in TypeScript, export simulation results as JSON/CSV and analyze in Python when deep investigation is needed.

### Purpose-Built Game Balance Tools

**Machinations (machinations.io):**
- Visual game economy modeling tool
- Models resource flows as node-and-edge diagrams
- Useful for validating economy design BEFORE building the full simulation
- Can answer questions like: "If a player focuses entirely on SEA budget, do they run out of U?" or "How many turns until a Pipeline program pays for itself?"
- Cost: free tier available, paid for collaboration features
- **Verdict: CONSIDER** for early economy validation. Complementary to (not a replacement for) full simulation.

**GameBalancer (academic):**
- Research prototype from game AI papers on automated parameter tuning
- Uses evolutionary algorithms or Bayesian optimization to minimize win-rate variance
- Not production-ready but the technique is sound
- **Verdict: ADAPT THE PATTERN** -- implement a simple parameter optimizer that varies costs/rewards to minimize the chi-squared statistic of faction win rates. This is essentially automated balance tuning.

**Custom is the industry standard:**
Riot Games, Blizzard, Wizards of the Coast, and Leder Games all build custom simulation and analysis tools. There is no "Unity of game balance." This is normal.

### Recommendation

**Core TypeScript stack:**
1. `simple-statistics` -- primary stats library
2. `seedrandom` -- reproducible RNG
3. `workerpool` -- parallel simulation
4. `d3` or `Chart.js` -- balance dashboard visualization

**Analysis stack (Python):**
1. `pandas` + `numpy` -- data manipulation
2. `scipy.stats` -- hypothesis testing
3. `seaborn` -- statistical visualization
4. Jupyter notebooks -- interactive exploration

**Skip:**
- boardgame.io (wrong abstraction for our game complexity)
- OpenSpiel (wrong language and problem domain)
- mathjs, ml-matrix (overkill)

---

## 6. Recommended Architecture

```
+----------------------------------------------------------+
|                 TypeScript Game Engine                     |
|  - Pure function: (GameState, Action[]) -> GameState      |
|  - Deterministic (RNG injected, not internal)             |
|  - Zero UI coupling, zero side effects                    |
|  - All 12 orders, 5 factions, portfolio system,           |
|    contracts, crises, theater control, scoring            |
+----------------------------------------------------------+
                            |
                            v
+----------------------------------------------------------+
|              TypeScript Simulation Harness                 |
|                                                           |
|  BotPersonality System                                    |
|  - WeightVector per personality type                      |
|  - Phase-aware weight multipliers                         |
|  - Configurable noise parameter                           |
|  - 7 base types: Random, Greedy, Balanced,                |
|    Aggressive, Defensive, Specialist, Builder             |
|                                                           |
|  Monte Carlo Runner                                       |
|  - Configurable: player count, factions, bot types        |
|  - Parallel execution via workerpool                      |
|  - Seeded RNG (seedrandom) per game                       |
|  - Parameter sweep support                                |
|                                                           |
|  Statistics Module                                        |
|  - Win rates, SI distributions, Gini coefficients         |
|  - Chi-squared, binomial, bootstrap CI                    |
|  - Order/card/faction analysis                            |
|  - JSON/CSV export for Python analysis                    |
+----------------------------------------------------------+
                            |
              +-------------+-------------+
              |                           |
              v                           v
+-------------------------+   +---------------------------+
|  TypeScript Dashboard   |   |  Python Analysis Suite    |
|  (quick metrics,        |   |  (Jupyter notebooks,      |
|   live balance view,    |   |   scipy, seaborn,         |
|   Chart.js / d3)        |   |   deep statistical dives, |
|                         |   |   publishable reports)    |
+-------------------------+   +---------------------------+
```

### Key Design Principles

1. **The game engine is a pure function.** `(GameState, Action[]) -> GameState`. No side effects, no UI, no internal randomness. RNG is injected. This makes it trivially simulatable and testable.

2. **The simulation harness owns the RNG, bots, and game loop.** It creates games, assigns bots, runs them to completion, and collects results.

3. **Two-tier analysis.** Fast TypeScript stats for the dashboard (win rates, means, basic tests). Deep Python analysis for detailed balance investigations (heatmaps, regression, publication-quality charts).

4. **Every simulation run is reproducible.** Given the same seed, faction assignments, and bot personalities, the exact same game plays out. When a balance issue is found, the specific game can be replayed and inspected.

5. **Parallelism is at the game level.** Each game is independent, so workerpool distributes games across CPU cores with zero coordination overhead.

### Performance Targets

The game has approximately:
- 4 quarters/year x 4 years = 16 quarters
- Per quarter: ~4 decision points per player (order selection + card/theater choices during resolution)
- Per game: ~64 decisions/player x 5 players = ~320 total decision points
- Each decision: utility evaluation of ~20-70 options = microseconds

**Target: 50-200 games/second** on a modern machine (single core). With 8-core parallelism: 400-1,600 games/second.

At 100 games/sec:
- 1,000 games (smoke test): 10 seconds
- 10,000 games (standard balance pass): 100 seconds (~2 minutes)
- 50,000 games (full validation): ~8 minutes

This is fast enough for rapid iteration.

---

## 7. Next Steps

### Immediate (Phase 0 completion)

1. **Finalize game engine type definitions** -- `GameState`, `Action`, all resource types, order types, card types as TypeScript interfaces
2. **Design the `BotPersonality` interface** -- weight vectors, phase multipliers, noise parameter
3. **Choose npm packages** -- install `simple-statistics`, `seedrandom`, `workerpool`

### Phase 1 (Game Engine)

4. **Implement the Random bot** -- validates the engine plays complete games without errors
5. **Run 100 random games end-to-end** -- first smoke test

### Phase 2 (Simulation Harness)

6. **Implement Greedy bot** -- first real balance signal
7. **Implement Balanced bot** -- the "default good player" baseline
8. **Build statistics module** -- win rates, chi-squared, Gini, bootstrap CI
9. **Run 10,000-game balance pass** -- first serious balance data
10. **Build balance dashboard** -- visualize results
11. **Implement Aggressive + Defensive bots** -- strategic diversity
12. **Set up Python analysis notebook** -- for deep dives

### Phase 3 (Balance Tuning)

13. **Implement Specialist bots** -- one per Directorate
14. **Run pairwise faction analysis** -- all 10 matchups
15. **Parameter sensitivity sweeps** -- identify load-bearing numbers
16. **Card-level analysis** -- 50,000+ game run
17. **Automated parameter optimizer** -- minimize chi-squared on faction win rates
18. **Final validation** -- 50,000 games confirming balance targets are met
