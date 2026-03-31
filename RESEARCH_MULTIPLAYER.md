# Multiplayer Architecture Research

## 1. Framework Evaluation

### Colyseus (Recommended)

Purpose-built for multiplayer game rooms. Key strengths:

- **Room-based architecture** — players join "rooms" that each run an authoritative game loop on the server. Maps directly to a board game session.
- **Automatic state synchronization** — define a schema on the server; Colyseus serializes and patches state to clients automatically (binary delta encoding). Clients get `onChange` callbacks.
- **TypeScript-native** — schema definitions generate typed client-side objects.
- **Built-in lifecycle hooks** — `onJoin`, `onLeave`, `onMessage`, `onDispose` — perfect for lobby/disconnect handling.
- **Scalability** — each room is a process; can scale rooms across machines with `@colyseus/monitor`.

**Simultaneous-reveal fit:** Colyseus's message-passing model (`onMessage`) handles this cleanly. Players send secret orders via messages (not written to shared state), the server collects them, and only patches the shared state once all orders are in.

### Socket.io

General-purpose WebSocket abstraction. Would require building all room management, state serialization, reconnection logic, and delta patching from scratch. Battle-tested but 2-3x more infrastructure code. **Unnecessary overhead for this use case.**

### Liveblocks

Designed for collaborative apps (Figma-style). Model is "shared mutable state that syncs" — great for documents, poor for games. No concept of hidden information, no server authority, no game lifecycle hooks. **Not a fit.**

### PartyKit

Cloudflare-based "per-room server" model (Durable Objects under the hood). Interesting but:
- Newer, smaller ecosystem
- No built-in state schema/serialization
- Less game-specific tooling than Colyseus

Viable but requires building more from scratch.

### Decision: Colyseus

It was designed for exactly this kind of game. Room model, schema-based state sync, and lifecycle hooks eliminate huge amounts of boilerplate.

---

## 2. State Synchronization Patterns

### Authoritative Server (Required)

For a board game with hidden information, the server must be authoritative:

- Server holds complete game state (all players' secret orders, full deck, etc.)
- Clients only receive the state they're allowed to see
- All game logic runs server-side
- Clients send intentions and render results

Client-side prediction is **not needed** for turn-based games — 50-200ms round trip is imperceptible.

### Simultaneous Reveal Protocol

```
Phase: ORDER_SUBMISSION
┌─────────────────────────────────────┐
│ Server state (private):             │
│   submittedOrders: Map<playerId,    │
│     { orders: Order[] }>            │
│                                     │
│ Client-visible state:               │
│   playersReady: Map<playerId, bool> │
│   myOrders: Order[] // only yours   │
└─────────────────────────────────────┘

Flow:
1. Each player sends: { type: "SUBMIT_ORDERS", orders: [...] }
2. Server stores orders privately, sets playersReady[id] = true
3. Server broadcasts updated ready flags (NOT orders)
4. When ALL players are ready:
   - Transition to RESOLUTION phase
   - Reveal all orders simultaneously
   - Run resolution logic
   - Patch resolved state to all clients
```

### Hidden Information Handling

Keep secrets out of the synchronized schema entirely. Send them via targeted messages:

```typescript
// Don't put secrets in the schema — send private messages instead
room.send(client, { type: "YOUR_HAND", cards: [...] });
```

This is safer and easier to reason about than schema-level filtering.

---

## 3. Game State Management

### State Structure

```typescript
// Shared/visible (Colyseus Schema, synced to all)
interface PublicGameState {
  phase: GamePhase;
  currentFiscalYear: number;
  currentQuarter: number;
  board: BoardState;
  players: Map<string, PublicPlayerState>;
  log: GameEvent[];
}

// Private per-player (sent only to that player)
interface PrivatePlayerState {
  hand: Card[];
  submittedOrders: Order[];
}

// Server-only (never sent to any client)
interface ServerOnlyState {
  allSubmittedOrders: Map<string, Order[]>;
  deck: Card[];
  rng: SeededRandom;  // deterministic for replay
}
```

### State Machine for Game Flow

Use an explicit state machine for the fiscal year / quarter / phase flow:

```
LOBBY → SETUP → FISCAL_YEAR
  FISCAL_YEAR:
    CONGRESS (Agenda Vote)
    → CONTRACT_MARKET
    → Q1 → Q2 → Q3 → Q4
      Each Quarter:
        CRISIS_PULSE → ORDER_SUBMISSION → REVEAL → RESOLUTION → CLEANUP
    → YEAR_END
  → next FISCAL_YEAR or GAME_END
```

Keep state transitions on the server. Client reads the current phase and renders accordingly.

### Event Sourcing + Snapshots (for save/resume and replay)

- Store every action as an event → enables full replay and spectator mode
- Snapshot full state at fiscal year boundaries (~every 15-20 min of play)
- To resume: load snapshot + replay events since snapshot
- Use seeded PRNG for deterministic replay

---

## 4. Lobby, Disconnection, Save/Resume

### Lobby

Colyseus handles natively — create room, get room code, share via link (`yoursite.com/game/AbCdEf`). No matchmaking queue needed for 2-5 player friend groups.

### Disconnection Handling (Critical for 60-90 min games)

- **Reserve seat on disconnect** — Colyseus `allowReconnection(client, 300)` gives 5-minute window
- **Pause on disconnect** — other players see "Player X disconnected, waiting..."
- **Bot substitution** — after timeout, optionally replace with simple bot or let remaining players vote
- **Session tokens** — store reconnection token in localStorage for seamless page refresh

### Save/Resume

Store game state to database at:
- End of each quarter
- When a player disconnects
- Periodic auto-save (every 5 minutes)

To resume: create new room, load snapshot, hydrate state, players rejoin with original tokens.

---

## 5. Recommended Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Language** | TypeScript everywhere | Shared types between client/server |
| **Game Server** | Colyseus (Node.js) | Purpose-built; handles rooms, sync, reconnection |
| **Frontend** | React (via Next.js or Vite+React) | Component model fits board game UI |
| **Routing/SSR** | Next.js (App Router) | Lobby pages, SEO, auth flows |
| **Live State** | Colyseus in-memory | Fast, no DB round-trip during gameplay |
| **Persistence** | PostgreSQL (Prisma or Drizzle) | Game saves, user accounts, match history |
| **Cache** | Redis (Upstash) | Active room registry, session tokens |
| **Auth** | NextAuth.js or Lucia | Simple player accounts, OAuth |
| **Deployment** | Fly.io or Railway | WebSocket-friendly, persistent processes |

### Architecture Diagram

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Next.js App   │────▶│  Colyseus Server  │────▶│  PostgreSQL  │
│  (Vercel/etc.)  │     │  (Fly.io/Railway) │     │  (Neon/Supa) │
│                 │     │                    │     │              │
│ - Lobby UI      │ WS  │ - Game rooms       │     │ - Game saves │
│ - Auth          │◀───▶│ - State sync       │     │ - Users      │
│ - Game board UI │     │ - Game logic       │     │ - History    │
│ - Static pages  │     │ - Hidden info mgmt │     │              │
└─────────────────┘     └──────────────────┘     └──────────────┘
                              │
                              ▼
                        ┌──────────┐
                        │  Redis   │
                        │ (Upstash)│
                        │ Sessions │
                        └──────────┘
```

### Monorepo Structure

```
/packages
  /shared        # Game types, constants, validation rules
    /types       # Order, Card, GamePhase, BoardState, etc.
    /rules       # Pure functions: isValidOrder(), resolveOrders()
    /constants   # Map data, card definitions, scoring tables
  /server        # Colyseus game server
  /client        # Next.js frontend
```

The `/shared/rules` package is critical — same validation logic runs on client (instant UI feedback) and server (authoritative check).

### Deployment Notes

- **Fly.io** — best for game server. Persistent processes, WebSockets, multi-region. ~$5-15/mo initially.
- **Vercel** — for Next.js frontend only. Serverless model cannot host Colyseus.
- **Neon** — serverless Postgres. **Upstash** — serverless Redis.
- Edge functions / serverless **do not work** for game servers (need long-lived WebSocket connections and in-memory state).

---

## Key Takeaway

The most complex implementation work will be the game state machine and order resolution logic — those are game design challenges, not infrastructure challenges. Colyseus handles the networking plumbing so we can focus on game rules.
