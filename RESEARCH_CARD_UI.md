# Card Design & UI Research -- Force Projection: Joint Command

Research completed 2026-03-30. Covers card rendering, UI design patterns, icon systems, complex board state management, and animation libraries.

---

## 1. Card Rendering Approaches for Web

### Option A: Pure CSS/HTML with React Components

**How it works:** Each card is a React component using styled `<div>` elements, CSS Grid/Flexbox for layout, CSS custom properties for theming, and standard web typography.

**Strengths:**

- Native text rendering with full control over typography (font-variant-numeric, letter-spacing, line clamping)
- Accessibility built in (screen readers, keyboard nav, ARIA attributes for free)
- Responsive by default -- cards scale with container queries or CSS clamp()
- Fastest developer iteration cycle -- just React + CSS, no special tooling
- Trivially supports hover states, tooltips, contextual menus
- CSS `contain: layout style` for rendering performance isolation
- Container queries let cards adapt their layout at different sizes (hand vs. board vs. detail view)
- Print-to-PDF for physical prototyping is straightforward

**Weaknesses:**

- Complex decorative borders, textures, and organic shapes require background images or SVG
- Hundreds of animated cards on screen could hit DOM limits (mitigated with virtualization)
- No pixel-perfect control over subpixel rendering

**Performance:** Modern browsers composite CSS transforms on the GPU. With `will-change: transform` and `contain: layout`, 50-100 card DOM nodes animate smoothly. For the hand (max ~7 cards), board (6-9 active programs per player), and market (3-5 contracts), total visible cards rarely exceed 30-40 even in a 4-player game.

### Option B: SVG Cards

**How it works:** Each card is an `<svg>` element or inline SVG within React. All layout done with SVG `<g>`, `<text>`, `<rect>`, `<path>`.

**Strengths:**

- Resolution-independent, crisp at any zoom
- Precise decorative shapes (borders, filigree, non-rectangular clip paths)
- Can be exported directly to print assets
- Inline SVG is part of the DOM, so accessible and animatable with CSS/JS

**Weaknesses:**

- SVG text layout is painful: no automatic line wrapping, no CSS Grid, manual `<tspan>` positioning
- Complex effect text (the meat of program cards) needs foreign-object fallback to HTML, defeating the purpose
- Developer experience is worse -- SVG layout is fiddly compared to Flexbox
- SVG DOM nodes are heavier than HTML divs for the browser's layout engine

**Verdict:** SVG is excellent for *icons and decorative elements* but poor as the primary card layout system when cards contain variable-length text with rich formatting.

### Option C: Canvas (html2canvas, Fabric.js)

**How it works:** Render cards to a `<canvas>` element. html2canvas snapshots HTML to canvas. Fabric.js provides a retained-mode canvas API.

**Strengths:**

- Good for generating card images (export to PNG for print/upload)
- Fabric.js is strong for drag-and-drop card builders

**Weaknesses:**

- No accessibility (canvas is a bitmap; screen readers see nothing)
- Text rendering is inferior to native HTML (no subpixel antialiasing, no kerning tables, no CSS typography features)
- Every interaction (hover, click, tooltip) must be manually programmed
- No DOM event model -- hit testing is manual
- html2canvas is a *snapshot* tool, not a rendering engine; it re-implements CSS in JS and has many limitations

**Verdict:** Useful only as a secondary tool for card-image export. Not suitable as the primary rendering approach.

### Option D: WebGL / PixiJS / Phaser

**How it works:** Full GPU-accelerated rendering pipeline. PixiJS is a 2D WebGL renderer. Phaser is a game framework built on PixiJS.

**Strengths:**

- Can render thousands of sprites at 60fps
- Advanced visual effects (shaders for holographic foil, particle systems, glow)
- Phaser provides a complete game framework (input, scenes, tweens, audio)

**Weaknesses:**

- Text rendering is the worst of all options (bitmap fonts or MSDF text, no native kerning/ligatures)
- No DOM accessibility
- Much higher learning curve and development time
- Overkill for a turn-based card game that never needs to render more than ~50 cards simultaneously
- Harder to integrate with standard React UI patterns (modals, tooltips, forms)
- Debugging is harder (no DOM inspector for canvas elements)

**Verdict:** Only justified for real-time games with hundreds of moving entities. A turn-based strategy card game does not need this level of rendering power, and the tradeoffs in text quality and accessibility are severe.

### RECOMMENDATION: Hybrid CSS/HTML + SVG

**Primary rendering: CSS/HTML React components.** All card layout, text, and interaction handled with standard web technology.

**SVG for:** Icons (budget types, resources, theaters, tags), decorative card borders, card-type indicators, and the theater map board.

**Canvas for:** Optional card-image export (for sharing, deck lists). Use `html-to-image` (modern, maintained alternative to html2canvas) only when users want to export.

**Rationale:** This game has ~355 unique cards with dense text. Typography quality is paramount. CSS/HTML gives the best text rendering, fastest development, full accessibility, and more than sufficient performance for the card counts involved.

---

## 2. Card Game UI Design Patterns

### Lessons from Magic: The Gathering Arena

**Layout structure:** MTG Arena cards follow a strict vertical hierarchy: mana cost (top right) > name (top) > art (center) > type line (middle) > rules text (lower center) > power/toughness (bottom right). This hierarchy has been refined over 30 years across thousands of cards.

**Key patterns to adopt:**

- **Cost in the corner.** Players scan collections by cost first. MTG puts mana cost top-right. For Force Projection, the budget-line cost (e.g., "3A + 2U") should be top-right, using colored pips matching the budget-line colors.
- **Card frame color = card identity.** MTG uses border/frame color (gold, blue, red, green, white, black) so you can identify a card's color at a glance even in a fanned hand where only the top edge is visible. For FP:JC, the card frame/border color should encode the *primary budget line* -- a card costing mostly A (Air) budget has an Air-colored frame.
- **Compact rules text with keywords.** MTG uses bold keywords ("Flying", "Trample") that experienced players can skip reading. FP:JC should define similar keywords (e.g., bold **Station**, **Sustain**, **Pipeline**, **Activate**) and use consistent formatting.
- **Zoomed card on hover.** Arena shows a full-size readable card when you hover over any card in hand, battlefield, or graveyard. Essential for information density.

### Lessons from Legends of Runeterra (LoR)

**What LoR does exceptionally well:**

- **Dynamic card states.** Cards visually change when conditions are met (champion level-up has dramatic animation, card glows when playable). FP:JC should visually distinguish Pipeline vs. Active vs. Mothballed states with distinct visual treatments (desaturation for mothballed, progress indicator for pipeline, full brightness for active).
- **Keyword tooltips on hover.** Hovering a keyword shows a tooltip with the full explanation. Critical for a complex game like FP:JC where players need to reference what "Readiness >= 4" means or what a specific tag does.
- **Board regions.** LoR has clearly delineated regions (hand, bench, board, spell stack). FP:JC needs clear visual regions for: Hand, Pipeline, Active Portfolio, Mothball Row, Theater Board, Contract Area, Order Selection.
- **Playability glow.** Cards you can afford to play have a subtle glow or border highlight. Essential for FP:JC given the multi-resource cost system -- instantly show which programs you can afford to pipeline or activate.

### Lessons from Slay the Spire

**Relevant patterns:**

- **Single-player information density.** StS shows energy, HP, block, and card intent on every enemy simultaneously. It solves information overload with consistent icon placement and color coding.
- **Card piles as stacks with counts.** Draw pile, discard pile, exhaust pile are shown as stacks with a number badge. FP:JC should show the Program deck remaining, discard pile, and Crisis deck similarly.
- **Tooltip chains.** Hovering on a card shows tooltips for every keyword/icon on that card. This is how you teach a complex game without a manual.
- **Simple card structure.** StS cards are: cost (top left), name (top), art (center), description (bottom). Only 3-4 fields. FP:JC cards are more complex, so the lesson is to keep the visual hierarchy *as flat as possible* -- only 2-3 levels of information prominence.

### Lessons from Balatro

**What makes Balatro's cards beautiful:**

- **Tactile card physics.** Cards have subtle rotation, shadow depth, and spring-based motion that makes them feel physical. The "pick up, hover, drag, release" loop feels like handling real cards.
- **Minimal text, strong visuals.** Balatro poker cards are mostly art and numbers. Where Balatro adds joker effects, it uses a very simple text box. Lesson: where possible, use icons instead of text for recurring concepts (budget types, resources, tags).
- **Holographic / foil shader effects.** Balatro's rare cards use WebGL shaders for holographic effects. While we recommend CSS/HTML for layout, a single `<canvas>` overlay with a CSS mix-blend-mode can achieve similar effects for "rare" or high-value program cards without switching the entire rendering stack.
- **Sound + visual pairing.** Every card interaction has a corresponding sound. Plan for sound attachment points in the animation system.

### Typography Hierarchy for FP:JC Cards

Based on the analysis above, here is a recommended hierarchy for Program cards (the most complex card type):

```
LEVEL 1 (largest, always visible in hand):
  - Card name ("F-22 Raptor Squadron")
  - Budget cost pips (top right corner, colored icons)

LEVEL 2 (visible in hand if not fanned too tightly):
  - Tags bar ("AIR / Fighter / Classified") -- colored tag pills
  - Card type indicator (color of card frame/border)

LEVEL 3 (visible on hover/zoom or when card is on board):
  - Pipeline cost vs. Active cost (two columns or toggle)
  - Activate effect text
  - Sustain effect text
  - Stationing info (theater icons)

LEVEL 4 (fine print, visible only in detail view):
  - Set number / card ID
  - Artist credit (if art is added later)
  - Flavor text
```

**Font recommendations:**

- Card names: A condensed sans-serif with military character. **Barlow Condensed** (Google Fonts, free) or **Saira Condensed** -- both have good readability at small sizes and a utilitarian aesthetic fitting the military theme.
- Body text / effect text: **Inter** or **Source Sans 3** -- highly legible at 10-12px equivalent, excellent digit legibility, open-source.
- Cost numbers / resource amounts: **Tabular numerals** (monospaced digits) so numbers align in columns. Inter supports this with `font-variant-numeric: tabular-nums`.
- Tags: All-caps small text, tracked out slightly. Same font as body but at 0.7em with `letter-spacing: 0.05em`.

---

## 3. Icon Systems for Games

### Icon Inventory for FP:JC

| Category | Icons Needed | Count |
|----------|-------------|-------|
| Budget lines | A (Air), S (Sea), E (Expeditionary), X (Space/Cyber), U (Sustain) | 5 |
| Secondary resources | M (Manpower), L (Logistics), I (Intel), PC (Political Capital) | 4 |
| Theaters | North Atlantic, Indo-Pacific, Middle East, Arctic, Homeland, Space & Cyber | 6 |
| Program tags | AIR, SEA, EXP, SPACE-CYBER (+ subtags: Fighter, Carrier, Sub, Marine, Network, etc.) | ~10 |
| Card types | Program, Contract, Agenda, Crisis | 4 |
| Game actions | Pipeline, Activate, Mothball, Station, Deploy, Sustain, Lobby, etc. | ~8 |
| UI chrome | Draw pile, Discard, Hand, Readiness, SI (victory points) | ~5 |
| **Total** | | **~42** |

### Approach: Custom SVG Icon Set Built on game-icons.net Foundation

**game-icons.net** is a collection of 4000+ free SVG game icons under CC BY 3.0 license. Icons are single-path silhouettes on transparent backgrounds, designed for board and video games. They cover military, sci-fi, fantasy, and abstract concepts extensively.

**Recommended workflow:**

1. **Source base shapes from game-icons.net.** Many FP:JC concepts map directly:
   - Air budget: jet fighter silhouette (game-icons.net has several)
   - Sea budget: anchor or battleship silhouette
   - Expeditionary: boot print or parachute
   - Space/Cyber: satellite or circuit
   - Sustain: wrench or supply crate
   - Manpower: person silhouette
   - Logistics: truck or supply chain
   - Intel: eye or satellite dish
   - Political Capital: capitol building or handshake
   - Theaters: globe sections, compass points, snowflake (arctic), etc.

2. **Normalize into a cohesive system.** Raw game-icons.net icons come from many artists and vary in stroke weight, detail level, and visual density. You must:
   - Choose a consistent **optical size** (all icons should feel the same visual weight in a 24x24 or 32x32 bounding box)
   - Apply consistent **stroke width** if converting from filled to outlined style
   - Use a consistent **corner radius** and level of detail
   - Process through a tool like **SVGO** to normalize paths and optimize file size

3. **Wrap in a design system.** Each icon gets:
   - A colored circular or rounded-square background (the budget line's color)
   - Consistent padding within the container
   - A React component that accepts `size`, `color`, and `variant` props
   - Both filled and outlined variants for different contexts (filled for resource pips, outlined for card type indicators)

### Color System for Icons

| Symbol | Color | Hex (suggested) | Rationale |
|--------|-------|-----------------|-----------|
| A (Air) | Sky Blue | #4A9FD9 | Aviation, sky |
| S (Sea) | Navy | #2B5C8A | Naval, ocean |
| E (Exp) | OD Green | #5B7A3A | Military ground ops |
| X (Space/Cyber) | Purple | #7B4FBF | Tech, space, digital |
| U (Sustain) | Amber/Gold | #D4943A | Maintenance, logistics |
| M (Manpower) | Warm Gray | #8B7D6B | Personnel |
| L (Logistics) | Olive | #8B8B3A | Supply chain |
| I (Intel) | Cyan | #3ABFBF | Information, signals |
| PC (Political) | Crimson | #C44040 | Political power |
| SI (Victory) | Gold/Star | #E8C840 | Prestige, winning |

### Alternative Icon Resources

- **Lucide** (fork of Feather Icons): 1000+ clean, consistent SVG icons. Good for UI chrome (menus, close buttons, expand/collapse) but not game-specific.
- **Iconify**: Aggregator providing access to 150k+ icons from 100+ sets including game-icons. Useful as a browsing tool.
- **Noun Project**: 5M+ icons, many game/military themed. Paid license but very high quality.
- **Custom illustration**: For the ~5 budget-line icons that players see most frequently, consider commissioning or designing custom icons that are unique to this game. These are the most-seen symbols and deserve to feel proprietary.

### Icon Implementation

```
Recommended: Inline SVG React components

- Bundle icons as React components (e.g., <AirBudgetIcon size={24} />)
- Use currentColor for fill so icons inherit text color or accept color prop
- Use an icon sprite sheet (<svg> with <symbol> elements) for the theater map
  where many icons repeat
- SVGO optimization: typically reduces icon file size by 30-60%
- Tree-shaking: only icons actually used get bundled
```

Do NOT use an icon font. Icon fonts have alignment issues, render inconsistently across browsers, cannot be multicolored, and are harder to tree-shake than individual SVG components.

---

## 4. Board Game UI Patterns for Complex State

### The Core Problem

FP:JC has enormous state at any moment:

- Per player: 9 resource pools, 6 active program slots, 3 pipeline slots, mothball row, hand of up to 7 cards, up to 2 contracts, base/alliance/forward ops in 6 theaters, readiness level, order selection
- Shared: current quarter, active agenda, contract market, crisis, national posture (3 thresholds), theater control state across 6 theaters

A naive UI showing everything simultaneously would be overwhelming. The research points to three complementary patterns.

### Pattern 1: Progressive Disclosure (Primary Strategy)

**Principle:** Show the minimum information needed for the current decision. Reveal more on demand.

**How BoardGameArena implements this:** BGA uses a layered approach where the main board shows a simplified overview, and clicking/hovering any area zooms into full detail. Player areas are collapsed by default and expand on click. Log messages are the primary way state changes are communicated, with the board as visual confirmation.

**Application to FP:JC:**

| Game Phase | Primary View | Secondary (on demand) |
|------------|-------------|----------------------|
| Order Selection | Your hand + your portfolio + your resources | Other players' visible state, theater overview |
| Order Reveal | All revealed orders side by side | Card details on hover |
| Procure Resolution | Your portfolio (pipeline + active) with affordability indicators | Card shop / hand, cost calculator |
| Deploy Resolution | Theater map (primary) | Your available programs for stationing |
| Year End Scoring | Scoreboard + theater control summary | Detailed breakdown per player |

**Key principle:** The UI should *change layout based on the current game phase*, not show a static dashboard. This is the single most impactful design decision.

### Pattern 2: Contextual Panels (Information Architecture)

**Principle:** Divide the screen into zones with different information refresh rates.

**Recommended screen layout:**

```
+------------------------------------------------------------------+
|  TOP BAR: Phase indicator, Quarter/Year, Timer, Turn order        |
+------------------+-------------------------------+----------------+
|                  |                               |                |
|  LEFT PANEL:     |  CENTER STAGE:                | RIGHT PANEL:   |
|  Your Resources  |  Context-dependent main view  | Game Log       |
|  (always visible)|  (changes per phase)          | + Other players|
|  Budget lines    |                               | summary        |
|  M/L/I/PC        |  During Orders: Hand + Board  |                |
|  Portfolio summary|  During Deploy: Theater Map   |                |
|  Contract status |  During Scoring: Scoreboard   |                |
|                  |                               |                |
+------------------+-------------------------------+----------------+
|  BOTTOM: Your hand of cards (collapsible, peek-up on hover)      |
+------------------------------------------------------------------+
```

**How Tabletop Simulator / Tabletopia handle this:** Both tools give each player a "personal area" that only they see in detail, with the shared board visible from a zoomed-out camera angle. Players can zoom in/out and pan. The lesson: give each player a private "home base" view and make the shared board a secondary view they can pull up.

**Responsive breakpoints:**

- Desktop (1200px+): Full three-panel layout as above
- Tablet (768-1199px): Center stage + bottom hand; panels become slide-out drawers
- Mobile (< 768px): Single column; swipe between hand, board, and resources

### Pattern 3: Glanceable Status (Dashboard Design)

**Principle:** The most-checked information should be readable in under 1 second without interaction.

**What to make glanceable:**

- Your budget totals: 5 colored pips with numbers (e.g., the blue "A" icon with "3" next to it)
- Your secondary resources: 4 smaller pips with numbers
- Active program count: "4/6 Active | 2/3 Pipeline"
- Contract deadlines: progress bar or checkmark indicators
- Current phase / quarter: large, clear phase name
- Other players' SI (victory points): always visible in turn-order bar

**Compact resource display pattern:**

```
Instead of:
  Air Budget: 3   Sea Budget: 2   Exp Budget: 5   Space Budget: 1   Sustain: 4

Use:
  [A]3  [S]2  [E]5  [X]1  [U]4    (colored icon + number, horizontal row)
  [M]2  [L]3  [I]1  [PC]2         (second row for secondary resources)
```

Each `[X]` is the colored icon from the icon system. Numbers use tabular-nums for alignment. Changes animate (pulse, color flash) when resources are gained or spent.

### Pattern 4: Opponent Information Hierarchy

**Problem:** In a 4-5 player game, you need to see opponent state but it cannot occupy equal screen space to your own.

**Solution: Progressive opponent display.**

- **Always visible:** Opponent name, SI score, directorate icon, active contract count
- **On hover/click:** Their visible portfolio (active programs, face-up pipeline), their theater presence, their resource totals
- **Never visible (hidden information):** Their hand contents, their order selection before reveal, their PC commitment to agenda votes

This maps to physical board games where you can see across the table (face-up programs and board presence) but not into someone's hand.

### Lessons from BoardGameArena Specifically

BGA handles 800+ different games and has converged on patterns worth noting:

- **Action log is king.** A scrolling log of "Player A activated F-22 Raptor (paid 4A + 2U)" is how most players actually track game state. Implement a rich game log with inline icons, card references (clickable to show card detail), and color-coded player names.
- **Undo within a turn.** BGA allows undo of the current action before confirming. Essential for a game where cost miscalculations are easy.
- **Notification system.** When it is not your turn, events appear as notifications. When it becomes your turn, the UI shifts to show your decision space.
- **Preference for 2D top-down.** Despite 3D being available, most BGA games use flat 2D views. Players prefer clarity over visual spectacle.

---

## 5. Animation Libraries

### The Contenders

| Library | Size (gzip) | Approach | React Integration | Best For |
|---------|-------------|----------|-------------------|----------|
| **Framer Motion** | ~30kb | Declarative, React-native | First-class (it IS a React library) | Layout animations, gestures, spring physics, AnimatePresence |
| **GSAP** | ~25kb core | Imperative timeline API | Via refs/useGSAP hook | Complex sequenced animations, ScrollTrigger, fine control |
| **react-spring** | ~18kb | Spring physics, declarative | First-class React | Physics-based motion, fluid transitions |
| **anime.js** | ~17kb | Imperative, lightweight | Manual ref binding | Simple tweens, SVG animation, timeline sequences |
| **Motion One** | ~3.5kb | Web Animations API wrapper | Vanilla, framework-agnostic | Tiny bundle, high perf, limited features |

### What Card Game Animations Need

1. **Layout animation (cards entering/leaving hand, moving between zones):** Cards move from deck to hand, hand to pipeline, pipeline to active, active to mothball. These are *layout transitions* where an element moves from one DOM position to another.

2. **Enter/exit animation (card draw, card discard, crisis reveal):** Cards need to appear from nowhere (deck) and disappear (discard pile) with smooth transitions.

3. **Gesture-driven interaction (hover preview, drag to play):** Cards should lift and scale on hover, follow the cursor when dragged to a play zone, and snap back if released outside a valid target.

4. **Sequenced group animation (order reveal, scoring):** When all players reveal orders simultaneously, cards flip in sequence. Scoring at year-end should cascade numbers.

5. **Micro-interactions (resource gain/loss, affordability pulse, state change):** Small animations that communicate state changes -- a +2 floating up when gaining resources, a pulse on a card when it becomes affordable.

### Analysis

**Framer Motion** dominates for this use case:

- `AnimatePresence` solves enter/exit animation perfectly. Wrap card lists in `<AnimatePresence>` and cards automatically animate in and out.
- `layout` prop enables automatic layout animation. When a card moves from hand to pipeline (different DOM parent), Framer Motion's `layoutId` shared layout animation smoothly transitions it.
- Built-in gesture support: `whileHover`, `whileTap`, `drag`, `dragConstraints` handle the entire card interaction model.
- Spring physics by default, giving that Balatro-like tactile feel.
- `useMotionValue` and `useTransform` for derived motion (e.g., card tilt based on cursor position for a 3D hover effect).
- Variants system lets you define animation states ("inHand", "inPipeline", "active", "mothballed") and transition between them declaratively.

**Weaknesses of Framer Motion:**

- Bundle size is the largest (~30kb gzip). Acceptable for a game app, not ideal for a landing page.
- Complex timeline sequences (e.g., "flip card, wait 200ms, slide to position, then pulse") are less natural than GSAP's timeline API.
- Performance with 50+ simultaneously animating elements can degrade. Mitigated by animating only `transform` and `opacity` (GPU-composited properties).

**When to supplement with GSAP:**

- GSAP's `timeline()` is better for scripted cinematics like the year-end scoring sequence, where you want precise control over staggered animations with exact timing.
- GSAP's `Flip` plugin handles DOM reparenting animation (moving a card from one container to another) and may be more reliable than Framer Motion's `layoutId` for complex cases.
- If you find Framer Motion's layout animation struggling with the portfolio grid (6 active + 3 pipeline + mothball row), GSAP Flip is the fallback.

**react-spring** is a viable alternative to Framer Motion with a smaller bundle and excellent spring physics, but it lacks `AnimatePresence` (enter/exit) and gesture support out of the box. You would need to pair it with `@use-gesture/react` for drag/hover, adding complexity.

**anime.js** is too low-level. You would spend significant time building abstractions that Framer Motion provides out of the box.

### RECOMMENDATION: Framer Motion as Primary, GSAP for Sequenced Cinematics

```
Day-to-day card interactions:
  - Framer Motion for hover, drag, layout transitions, enter/exit

Scripted sequences:
  - GSAP timeline for: order reveal ceremony, scoring animations,
    year-end portfolio maturation sequence, crisis reveal

Micro-interactions:
  - CSS transitions/animations for: resource pip changes, affordability
    glow, phase indicator transitions (no library needed for these)
```

### Performance Guidelines

1. **Only animate `transform` and `opacity`.** These are GPU-composited and do not trigger layout/paint. Never animate `width`, `height`, `top`, `left`, `margin`, or `padding`.

2. **Use `will-change: transform` sparingly.** Apply it only to elements that are actively animating or about to animate. Remove it after animation completes. Overuse promotes elements to their own compositor layer, consuming GPU memory.

3. **Virtualize off-screen cards.** If a player's discard pile has 30 cards, do not render 30 DOM nodes. Show a stack image with a count badge. Only render individual cards when the user opens the discard pile browser.

4. **Stagger group animations.** When revealing 4 players' orders simultaneously, stagger by 100-150ms per player. This is more readable than simultaneous and is cheaper to render (fewer simultaneous repaints).

5. **Reduce motion preference.** Respect `prefers-reduced-motion` media query. Provide an option to reduce or disable animations for accessibility. Map all animations through a utility that checks this preference.

---

## 6. Consolidated Recommendations for Force Projection: Joint Command

### Technology Stack (UI Layer)

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Framework | React + TypeScript | Already implied by project. Component model maps perfectly to cards/zones. |
| Card layout | CSS/HTML components | Best text rendering, accessibility, developer speed |
| Icons | Custom SVG set (game-icons.net base) | 42 icons, normalized style, inline SVG React components |
| Card decorations | SVG borders/shapes embedded in CSS | Resolution-independent, crisp at any size |
| Theater map | SVG (the one SVG-primary component) | Geographic/spatial layout suits SVG well |
| Animation (interactions) | Framer Motion | Layout animation, gestures, enter/exit, spring physics |
| Animation (sequences) | GSAP | Order reveal, scoring, year-end cinematics |
| Animation (micro) | CSS transitions | Resource changes, glow, pulse -- no library overhead |
| Card image export | html-to-image | On-demand export for deck lists or sharing |
| Typography | Barlow Condensed (names) + Inter (body) | Military aesthetic + maximum legibility, both free |

### Design System Foundation

Before building any cards, establish:

1. **Color palette:** 10 colors for resource/budget types (table in section 3), plus neutral grays for card backgrounds, plus a dark theme base (dark games reduce eye strain in long sessions).

2. **Spacing scale:** 4px base unit. Card padding: 8px (compact) / 12px (standard) / 16px (expanded). Consistent spacing scale prevents visual chaos.

3. **Card size ratios:** Standard playing card is 2.5:3.5 (5:7). MTG is 2.5:3.5. Recommend 5:7 ratio for program cards. Contract and Crisis cards could be wider (3:4) to accommodate their table-like structure.

4. **Card states:** Define visual treatment for every card state:
   - In hand (full color, slight shadow)
   - In pipeline (progress bar overlay, slightly muted)
   - Active (full color, bright border, "deployed" badge)
   - Mothballed (grayscale or heavy desaturation, dashed border)
   - Playable (subtle glow matching the primary budget line color)
   - Selected (lifted, scaled 1.05x, strong shadow)
   - Hovering (scale 1.02x, elevated shadow)

5. **Icon component library:** Build all ~42 icons as a React component library before building cards. Each icon component: `<BudgetIcon type="air" size="sm|md|lg" />`, `<TheaterIcon theater="indoPacific" />`, etc.

### Development Order for Phase 4

1. Design tokens (colors, spacing, typography) as CSS custom properties
2. Icon component library (all 42 icons)
3. Single card component (Program card -- most complex, proves the system)
4. Card variants (Contract, Agenda, Crisis -- simpler layouts)
5. Card zones (Hand, Pipeline row, Active grid, Mothball row)
6. Resource dashboard (budget pips + secondary resources)
7. Theater map (SVG-based)
8. Phase-aware layout manager (switches center stage based on game phase)
9. Animation layer (Framer Motion integration for card movement)
10. Opponent summary panels

---

## 7. Card Component Architecture Sketch

A rough mental model for the Program card component:

```
ProgramCard
  props: card data, state (hand|pipeline|active|mothballed), size (sm|md|lg|detail), interactive (boolean)

  Renders:
    CardFrame (border color based on primary budget line)
      CardHeader
        CardName (Barlow Condensed, Level 1)
        CostPips (row of colored budget icons with amounts)
      TagBar (row of colored tag pills: AIR / Fighter / Classified)
      CardBody (only rendered at md+ size)
        EffectSection (label: "Activate" | "Sustain" | "Station")
          EffectText (Inter, with inline keyword tooltips)
      CardFooter
        PipelineCost (if showing both costs)
        SetInfo (card ID, small text)

  Sizes:
    sm: 60x84px -- shows only frame color + name + cost pips (for fanned hand)
    md: 120x168px -- adds tag bar and abbreviated effect text
    lg: 200x280px -- full card, all text readable
    detail: 300x420px -- hover zoom, includes flavor text
```

This architecture lets the same component render at different detail levels depending on context (hand fan, board grid, hover zoom, detail modal).
