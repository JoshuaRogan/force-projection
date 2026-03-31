# Force Projection: Joint Command — Project Plan

## Overview

Building "Force Projection: Joint Command (Reforged Edition)" as a web-based board game. The game is a competitive strategy game about procurement, basing, alliances, and global posture — see [GAME_DETAILS.md](GAME_DETAILS.md) for the full ruleset.

### Guiding Principles

- **Mechanics first** — the game engine must perfectly model every rule before we think about visuals
- **Balance through simulation** — automated playtesting across thousands of games, not gut feel
- **Beautiful cards and UI** — the visual layer should match the depth of the mechanics
- **Take the time to get it right** — no shortcuts on correctness or quality

---

## Architecture — Three Layers

### 1. Game Engine (the truth)

A pure logic layer with zero UI — just rules, state transitions, and validation. Must model:

- Full fiscal year / quarter loop (4 phases per year, 4 quarters in Phase C)
- Budget lines (A/S/E/X/U) as separate resource pools
- Secondary resources: Manpower (M), Logistics (L), Intel (I), Political Capital (PC)
- Program Portfolio system: 6 Active slots, 3 Pipeline slots, Mothball row
- Order selection (pick 2), simultaneous reveal, resolution in sequence (Influence > Procure > Deploy > Sustain)
- Congressional Agenda voting (secret PC commitment, Support vs. Oppose)
- Contract lifecycle (take from market, track obligations, complete or fail at year end)
- Crisis cards per quarter (immediate twist, response window, penalty)
- Theater control scoring (Base/Alliance/Forward Ops/Stationed Programs)
- All 5 Directorates with passives and once-per-year abilities
- Reprogramming (budget line conversion at PC cost)
- Hand management (draw 2 per quarter, hand limit of 7)
- National Posture thresholds (Coverage, Readiness, Tech Edge)
- Endgame scoring (SI total + set bonuses + contract completion + theater presence)

**Key requirement:** Deterministic given the same inputs, so simulations are reproducible.

### 2. Simulation / Balance Harness

Runs thousands of games with AI agents to validate balance:

- **Directorate balance** — all 5 factions should win at roughly equal rates
- **Order viability** — no order should be strictly dominant or never worth picking
- **Contract risk/reward** — failure penalties and SI rewards should be proportional
- **Budget line balance** — no line should be chronically starved or flooded
- **Snowball detection** — games should stay competitive, not be decided by Quarter 4
- **Game length** — standard 16-quarter games should resolve meaningfully
- **First-player advantage** — initiative order shouldn't determine outcomes

### 3. Web UI

The visual layer — card design, board layout, animations, multiplayer:

- Card rendering (program cards, contracts, agendas, crises)
- Global theater board with 6 theaters
- Player dashboard (portfolio, resources, order selection)
- Simultaneous order reveal UX
- Multiplayer real-time sync
- Responsive design for different screen sizes

---

## Phase Plan

### Phase 0 — Research

**Goal:** Make informed technology and design decisions before writing code.

Research areas:
- Game balance simulation frameworks (OpenSpiel, custom Monte Carlo)
- Statistical methods for balance analysis (win rates, score distributions, Gini coefficient)
- AI agent design for simulation (heuristic bots with diverse strategies, not ML)
- Card UI rendering for web (CSS/SVG vs. canvas, typography hierarchy, icon systems)
- Board game UI patterns (progressive disclosure, contextual panels, state visualization)
- Multiplayer architecture (WebSockets, state sync, simultaneous reveal)
- Animation and visual effects libraries

**Outcome:** Technology decision document with chosen stack and rationale.

### Phase 1 — Game Engine

**Goal:** Pure TypeScript game logic, fully tested, that can play a complete game via function calls.

- Define all game state types and interfaces
- Implement the fiscal year / quarter state machine
- Implement all 12 orders with their resolution logic
- Implement the program portfolio system (pipeline, activate, mothball, mature)
- Implement agenda voting, contract lifecycle, crisis resolution
- Implement all 5 directorates
- Implement theater control and scoring
- Implement endgame scoring with set bonuses
- Comprehensive unit and integration tests
- Validate against hand-played example games

### Phase 2 — Simulation Harness

**Goal:** Bot agents + Monte Carlo runner + statistics dashboard.

- Build heuristic AI agents with different strategies:
  - Aggressive (rush theater control, high-risk contracts)
  - Balanced (steady portfolio growth, moderate contracts)
  - Defensive (sustain-heavy, crisis mitigation, safe contracts)
  - Specialist (lean into directorate strengths)
  - Random (baseline for statistical comparison)
- Monte Carlo runner that executes N games with configurable parameters
- Statistics collection and analysis:
  - Win rate by directorate
  - Average SI by directorate
  - Score variance and distribution
  - Order selection frequency and correlation with wins
  - Contract completion rates
  - Game length analysis
  - Theater control patterns
- Output: balance reports with visualizations

### Phase 3 — Balance Tuning

**Goal:** Validated, balanced parameter set for all game values.

- Use simulation data to identify imbalances
- Adjust program costs, contract rewards/penalties, crisis severity
- Tune directorate abilities and start bonuses
- Validate slot counts and hand limits
- Re-run simulations after each adjustment
- Document final parameter decisions and rationale

### Phase 4 — UI Foundation

**Goal:** Playable single-player prototype with polished visuals.

- Design system: colors, typography, iconography for all game symbols
- Card component library (program cards, contracts, agendas, crises)
- Global theater board visualization
- Player dashboard (portfolio view, resource tracks, order selection)
- Single-player game flow against AI opponents
- Responsive layout

### Phase 5 — Multiplayer (Minimal Viable)

**Goal:** Get a few friends playing together online. No production infrastructure — just enough to host a couple concurrent games.

- Colyseus server with basic room create/join (share a room code link)
- Simultaneous order reveal protocol (the one thing that must work correctly)
- Hidden information handling (hands, secret PC commitments)
- In-memory game state only — no database, no persistence, no save/resume
- No auth — players pick a name when joining
- No reconnection logic — if someone drops, start a new game
- No Redis, no spectator mode, no matchmaking
- Deploy to a single Fly.io instance (or run locally with ngrok for testing)

**Scope ceiling:** 2-5 players, 1-2 concurrent games, trusted friends only. This is playtesting infrastructure, not a product launch.

**Deferred to Phase 7:** PostgreSQL persistence, save/resume, auth/accounts, reconnection handling, spectator mode, scalable deployment.

### Phase 6 — Polish

**Goal:** Release-quality experience.

- Card animations (draw, play, activate, discard)
- Board animations (base/alliance/forward ops placement)
- Sound design
- Visual effects for key moments (agenda votes, crisis reveals, scoring)
- Tutorial / onboarding flow
- Performance optimization

### Phase 7 — Production Infrastructure (when needed)

**Goal:** Scale beyond friend-group playtesting.

- Auth (NextAuth.js or Lucia) — player accounts, OAuth
- PostgreSQL (Prisma/Drizzle) — game saves, user accounts, match history
- Redis — session tokens, room registry
- Save/resume — snapshots at fiscal year boundaries, reconnection on disconnect
- Spectator mode
- Deployment: Vercel (Next.js) + Fly.io (Colyseus), multi-region if needed

---

## Research Findings

*This section will be populated as research is completed.*

### Game Balance & Simulation

See [RESEARCH_BALANCE_SIMULATION.md](RESEARCH_BALANCE_SIMULATION.md) for full findings covering:

- Monte Carlo simulation methodology for complex strategy board games
- OpenSpiel evaluation (verdict: skip -- wrong abstraction level)
- Heuristic AI agent design with utility-function bots
- Statistical methods for balance analysis (Gini coefficient, chi-squared, ANOVA, etc.)
- Tools and libraries (TypeScript and Python ecosystems)
- Recommended simulation architecture

**Key decisions:** Custom TypeScript simulation harness on top of the game engine, utility-function bot system with 7 personality types, simple-statistics + seedrandom + workerpool as core libraries, Python/Jupyter for deep analysis, skip OpenSpiel and boardgame.io.

### Card Design & UI Patterns

See [RESEARCH_CARD_UI.md](RESEARCH_CARD_UI.md) for full findings covering:

- Card rendering approaches (CSS/HTML vs SVG vs Canvas/WebGL)
- Card game UI design patterns from MTG Arena, LoR, Slay the Spire, Balatro
- Icon systems for 20+ game symbols
- Board game UI patterns for complex state
- Animation library comparison

**Key decisions:** CSS/HTML cards with SVG icons, Framer Motion for animations, game-icons.net as icon foundation, progressive disclosure UI pattern.

### Multiplayer Architecture

See [RESEARCH_MULTIPLAYER.md](RESEARCH_MULTIPLAYER.md) for full findings covering:

- Framework evaluation (Colyseus, Socket.io, Liveblocks, PartyKit)
- State synchronization and simultaneous reveal protocol
- Game state management (authoritative server, hidden information, event sourcing)
- Lobby, disconnection handling, save/resume for 60-90 min games
- Full technology stack with architecture diagram

**Key decisions:** Colyseus for game server, authoritative server with filtered state views, TypeScript monorepo with shared game logic, Next.js frontend on Vercel + Colyseus on Fly.io, PostgreSQL for persistence.

### Technology Stack Decision

Consolidated from all three research tracks. Split into what we need now (Phases 1-6) vs. what's deferred (Phase 7).

**Core stack (Phases 1-6):**

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Language** | TypeScript everywhere | Shared types/validation between client, server, and simulation |
| **Game Engine** | Pure TypeScript module | Deterministic, zero dependencies, used by server + simulation |
| **Simulation** | Custom TS harness + `simple-statistics` + `seedrandom` + `workerpool` | Utility-function bots, Monte Carlo runner, parallelized |
| **Deep Analysis** | Python (pandas, scipy, seaborn, Jupyter) | CSV/JSON export from TS sim for statistical deep dives |
| **Game Server** | Colyseus (Node.js) | Room-based, in-memory state sync, simultaneous reveal |
| **Frontend** | React + Next.js (App Router) | Lobby page + game board, client-rendered |
| **Card Rendering** | CSS/HTML React components + SVG icons | Best text quality, accessibility, performance for ~40 visible cards |
| **Icons** | Custom SVG set (~42 icons, game-icons.net base) | Inline SVG React components, 10-color system |
| **Typography** | Barlow Condensed (names) + Inter (body) | Military aesthetic + maximum legibility, both free |
| **Animation** | Framer Motion (interactions) + GSAP (sequences) | Layout animation, gestures, spring physics; GSAP for cinematics |
| **Deployment** | Single Fly.io instance (or local + ngrok) | Minimal — just enough for a few friends to play |

**Deferred to Phase 7 (production infrastructure):**

| Layer | Technology | When Needed |
|-------|-----------|-------------|
| Persistence | PostgreSQL (Prisma or Drizzle) | Save/resume, accounts, match history |
| Cache | Redis (Upstash) | Session tokens, room registry at scale |
| Auth | NextAuth.js or Lucia | Player accounts, OAuth |
| Deployment (scaled) | Fly.io (multi-region) + Vercel (Next.js SSR) | Beyond friend-group playtesting |

**Monorepo structure:**

```
/packages
  /shared      — Game types, constants, pure validation/rules functions
  /engine      — Game state machine, order resolution, scoring (pure TS, no IO)
  /simulation  — Bot agents, Monte Carlo runner, stats collection
  /server      — Colyseus game server (imports engine + shared)
  /client      — Next.js frontend (imports shared for client-side validation)
```

**Key architectural principles:**
- Game engine is pure functions with zero side effects — deterministic given same inputs + seed
- Server is authoritative — clients never see hidden state until reveal
- Shared validation runs on both client (instant UI feedback) and server (authoritative check)
- Seeded PRNG everywhere for reproducible simulations and debugging
- Keep the server stateless-friendly so persistence can be layered in later without rewrites
