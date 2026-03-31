'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ORDERS, DIRECTORATES, THEATER_NAMES, THEATER_IDS, STRENGTH_VALUES, THEATER_CONTROL_SCORING } from '@fp/shared';
import type { OrderCategory } from '@fp/shared';
import styles from './Tutorial.module.css';

const CATEGORY_INFO: Record<OrderCategory, { color: string; desc: string }> = {
  Influence: { color: 'var(--color-polcap)', desc: 'Gain resources, pick up contracts, and build alliances. Resolves first.' },
  Procure: { color: 'var(--color-air)', desc: 'Build out your program portfolio — pipeline, activate, or refit. Resolves second.' },
  Deploy: { color: 'var(--color-exp)', desc: 'Establish presence in theaters through bases, forward ops, and stationing. Resolves third.' },
  Sustain: { color: 'var(--color-sustain)', desc: 'Refill resources, shore up logistics, and gather intel. Resolves last.' },
};

const BUDGET_LINES = [
  { key: 'A', name: 'Air', color: 'var(--color-air)', desc: 'Funds AIR-domain programs. High-value for North Atlantic and Arctic presence.' },
  { key: 'S', name: 'Sea', color: 'var(--color-sea)', desc: 'Funds SEA-domain programs. Essential for Indo-Pacific and North Atlantic control.' },
  { key: 'E', name: 'Expeditionary', color: 'var(--color-exp)', desc: 'Funds EXP-domain programs and Forward Ops placement costs.' },
  { key: 'X', name: 'Space / Cyber', color: 'var(--color-space)', desc: 'Funds SPACE_CYBER programs. Growing relevance in late-game crises.' },
  { key: 'U', name: 'Sustain', color: 'var(--color-sustain)', desc: 'General-purpose maintenance. Required for bases, forward ops, and readiness.' },
];

const SECONDARY_RESOURCES = [
  { key: 'M', name: 'Manpower', color: 'var(--color-manpower)', desc: 'Spent on Major Exercise and some program activations. Produced slowly.' },
  { key: 'L', name: 'Logistics', color: 'var(--color-logistics)', desc: 'Required for Forward Ops. Gain via Logistics Surge or TRANSCOM passive.' },
  { key: 'I', name: 'Intel', color: 'var(--color-intel)', desc: 'Used to reorder resolution timing. Spend via Intel Focus for advantage.' },
  { key: 'PC', name: 'Political Capital', color: 'var(--color-polcap)', desc: 'Spent to vote on Agendas, reprogram budgets, and place Alliances without a Base.' },
];

const DIRECTORATE_COLORS: Record<string, string> = {
  NAVSEA: 'var(--color-navsea)',
  AIRCOM: 'var(--color-aircom)',
  MARFOR: 'var(--color-marfor)',
  SPACECY: 'var(--color-spacecy)',
  TRANSCOM: 'var(--color-transcom)',
};

const CARD_TYPES = [
  {
    name: 'Program',
    color: 'var(--color-card-program)',
    icon: '⬡',
    desc: 'Military platforms you build into your portfolio. Each has Pipeline and Activate costs, domain tags, effects on activate, and ongoing Sustain effects while active.',
    tips: ['Start programs cheaply via Pipeline, then pay full cost to Activate', 'Stationed programs add strength to theaters', 'Mothball unused programs for +1 U — reactivate later'],
  },
  {
    name: 'Contract',
    color: 'var(--color-card-contract)',
    icon: '◈',
    desc: 'Public objectives that award SI when completed. Completing them requires meeting specific theater presence, readiness, or resource conditions.',
    tips: ['You can hold max 2 active contracts at once', 'Use Contracting order to draw and keep new contracts', 'Some contracts score multiple SI — prioritize them early'],
  },
  {
    name: 'Agenda',
    color: 'var(--color-card-agenda)',
    icon: '▣',
    desc: 'Congressional budget priorities voted on each year. Spend Political Capital to influence the vote. Passing or defeating the Agenda triggers different effects for all players.',
    tips: ['Even small PC investments can swing the vote', 'Check if the Agenda favors your directorate before spending', 'SPACECY can peek at the next crisis to plan around it'],
  },
  {
    name: 'Crisis',
    color: 'var(--color-card-crisis)',
    icon: '◬',
    desc: 'Quarterly shocks that penalize players without adequate readiness or theater presence. Each crisis targets specific theaters and resource thresholds.',
    tips: ['Readiness above threshold reduces crisis penalties', 'Logistics Surge cuts your crisis penalty by 1', 'SPACECY can bury an incoming crisis for 1 PC'],
  },
];

const SECTIONS = [
  { id: 'objective', label: 'Objective' },
  { id: 'flow', label: 'Game Flow' },
  { id: 'resources', label: 'Resources' },
  { id: 'orders', label: 'The 12 Orders' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'theaters', label: 'Theaters' },
  { id: 'cards', label: 'Cards' },
  { id: 'directorates', label: 'Directorates' },
];

export default function TutorialPage() {
  const [activeSection, setActiveSection] = useState('objective');

  const ordersByCategory = Object.values(ORDERS).reduce<Record<OrderCategory, typeof ORDERS[keyof typeof ORDERS][]>>(
    (acc, order) => {
      if (!acc[order.category]) acc[order.category] = [];
      acc[order.category].push(order);
      return acc;
    },
    {} as Record<OrderCategory, typeof ORDERS[keyof typeof ORDERS][]>
  );

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div>
            <div className={styles.headerEyebrow}>Command Briefing</div>
            <h1 className={styles.headerTitle}>Force Projection: Joint Command</h1>
          </div>
          <Link href="/" className={styles.backBtn}>Back to Menu</Link>
        </div>
      </header>

      {/* Sticky nav */}
      <nav className={styles.nav}>
        {SECTIONS.map(s => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={`${styles.navLink} ${activeSection === s.id ? styles.navLinkActive : ''}`}
            onClick={() => setActiveSection(s.id)}
          >
            {s.label}
          </a>
        ))}
      </nav>

      <main className={styles.main}>

        {/* === OBJECTIVE === */}
        <section id="objective" className={styles.section}>
          <h2 className={styles.sectionTitle}>Objective</h2>
          <p className={styles.lead}>
            Accumulate the most <strong className={styles.highlight}>Strategic Influence (SI)</strong> across
            3–5 fiscal years. SI represents your directorate's ability to shape US foreign and defense policy —
            earned by activating programs, controlling theaters, completing contracts, and scoring at year-end.
          </p>
          <div className={styles.calloutGrid}>
            <div className={styles.callout}>
              <div className={styles.calloutValue} style={{ color: 'var(--color-si)' }}>SI</div>
              <div className={styles.calloutLabel}>Strategic Influence — the win condition. Track it on your dashboard.</div>
            </div>
            <div className={styles.callout}>
              <div className={styles.calloutValue}>6</div>
              <div className={styles.calloutLabel}>Theaters to contest. Control them by building presence and stationing programs.</div>
            </div>
            <div className={styles.callout}>
              <div className={styles.calloutValue}>12</div>
              <div className={styles.calloutLabel}>Actions to choose from each quarter. Pick 2 — they resolve in strict category order.</div>
            </div>
            <div className={styles.callout}>
              <div className={styles.calloutValue}>5</div>
              <div className={styles.calloutLabel}>Directorates (factions) — each with distinct passives and a once-per-year power.</div>
            </div>
          </div>
        </section>

        {/* === GAME FLOW === */}
        <section id="flow" className={styles.section}>
          <h2 className={styles.sectionTitle}>Game Flow</h2>
          <p className={styles.sectionDesc}>Each fiscal year follows this sequence. A full game runs 3–5 years.</p>

          <div className={styles.flowYear}>
            <div className={styles.flowPhase} style={{ '--phase-color': 'var(--color-card-agenda)' } as React.CSSProperties}>
              <div className={styles.flowPhaseLetter}>A</div>
              <div className={styles.flowPhaseContent}>
                <div className={styles.flowPhaseName}>Congress</div>
                <div className={styles.flowPhaseDesc}>Vote on the Congressional Agenda using Political Capital. The outcome applies budget bonuses or penalties to all players for the year.</div>
              </div>
            </div>
            <div className={styles.flowArrow}>→</div>
            <div className={styles.flowPhase} style={{ '--phase-color': 'var(--color-card-contract)' } as React.CSSProperties}>
              <div className={styles.flowPhaseLetter}>B</div>
              <div className={styles.flowPhaseContent}>
                <div className={styles.flowPhaseName}>Contract Market</div>
                <div className={styles.flowPhaseDesc}>A public market of contracts is revealed. Each player may claim up to 2 active contracts to pursue this year.</div>
              </div>
            </div>
            <div className={styles.flowArrow}>→</div>
            <div className={styles.flowPhase} style={{ '--phase-color': 'var(--color-info)' } as React.CSSProperties}>
              <div className={styles.flowPhaseLetter}>C</div>
              <div className={styles.flowPhaseContent}>
                <div className={styles.flowPhaseName}>4 Quarters</div>
                <div className={styles.flowPhaseDesc}>Each quarter: reveal a Crisis, plan 2 Orders simultaneously, resolve them in sequence, then clean up.</div>
              </div>
            </div>
            <div className={styles.flowArrow}>→</div>
            <div className={styles.flowPhase} style={{ '--phase-color': 'var(--color-si)' } as React.CSSProperties}>
              <div className={styles.flowPhaseLetter}>D</div>
              <div className={styles.flowPhaseContent}>
                <div className={styles.flowPhaseName}>Year End</div>
                <div className={styles.flowPhaseDesc}>Score theater control (4/2/1 SI for 1st/2nd/3rd), evaluate contracts, pay sustain costs for active programs.</div>
              </div>
            </div>
          </div>

          <div className={styles.quarterBreakdown}>
            <div className={styles.quarterTitle}>Inside a Quarter</div>
            <div className={styles.quarterSteps}>
              {[
                { label: 'Crisis Pulse', desc: 'A Crisis card is revealed. Players without adequate readiness or presence face penalties.' },
                { label: 'Plan Orders', desc: 'All players simultaneously choose 2 orders from the 12 available. Choices are hidden until revealed.' },
                { label: 'Resolve Orders', desc: 'Orders execute in category sequence: Influence → Procure → Deploy → Sustain. Ties broken by Intel spend.' },
                { label: 'Cleanup', desc: 'Production runs — each budget line and secondary resource refills by its production rate.' },
              ].map((step, i) => (
                <div key={i} className={styles.quarterStep}>
                  <div className={styles.quarterStepNum}>{i + 1}</div>
                  <div>
                    <div className={styles.quarterStepLabel}>{step.label}</div>
                    <div className={styles.quarterStepDesc}>{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* === RESOURCES === */}
        <section id="resources" className={styles.section}>
          <h2 className={styles.sectionTitle}>Resources</h2>
          <p className={styles.sectionDesc}>
            You manage two pools of resources. Budget lines fund specific program domains. Secondary resources
            are spent on orders, activations, and special actions. Both pools have a current amount and a
            production rate — production runs every quarter during Cleanup.
          </p>

          <h3 className={styles.subTitle}>Budget Lines</h3>
          <div className={styles.resourceGrid}>
            {BUDGET_LINES.map(r => (
              <div key={r.key} className={styles.resourceCard} style={{ '--res-color': r.color } as React.CSSProperties}>
                <div className={styles.resourceKey}>{r.key}</div>
                <div className={styles.resourceName}>{r.name}</div>
                <div className={styles.resourceDesc}>{r.desc}</div>
              </div>
            ))}
          </div>

          <h3 className={styles.subTitle} style={{ marginTop: '1.5rem' }}>Secondary Resources</h3>
          <div className={styles.resourceGrid}>
            {SECONDARY_RESOURCES.map(r => (
              <div key={r.key} className={styles.resourceCard} style={{ '--res-color': r.color } as React.CSSProperties}>
                <div className={styles.resourceKey}>{r.key}</div>
                <div className={styles.resourceName}>{r.name}</div>
                <div className={styles.resourceDesc}>{r.desc}</div>
              </div>
            ))}
          </div>

          <div className={styles.tip}>
            <strong>Reprogramming:</strong> You can move budget between lines by spending Political Capital.
            TRANSCOM can convert 2U → 1 of any line once per year for free.
          </div>
        </section>

        {/* === THE 12 ORDERS === */}
        <section id="orders" className={styles.section}>
          <h2 className={styles.sectionTitle}>The 12 Orders</h2>
          <p className={styles.sectionDesc}>
            Each quarter you pick exactly <strong>2 orders</strong>. Orders resolve in category sequence —
            Influence first, then Procure, Deploy, and finally Sustain. Everyone's orders resolve simultaneously
            within each category, with Intel spend used to shift your position.
          </p>

          {(['Influence', 'Procure', 'Deploy', 'Sustain'] as OrderCategory[]).map(cat => (
            <div key={cat} className={styles.categoryBlock}>
              <div className={styles.categoryHeader} style={{ '--cat-color': CATEGORY_INFO[cat].color } as React.CSSProperties}>
                <span className={styles.categoryName}>{cat}</span>
                <span className={styles.categoryDesc}>{CATEGORY_INFO[cat].desc}</span>
              </div>
              <div className={styles.orderGrid}>
                {(ordersByCategory[cat] ?? []).map(order => (
                  <div key={order.id} className={styles.orderCard} style={{ '--cat-color': CATEGORY_INFO[cat].color } as React.CSSProperties}>
                    <div className={styles.orderName}>{order.name}</div>
                    <div className={styles.orderDesc}>{order.description}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* === PORTFOLIO === */}
        <section id="portfolio" className={styles.section}>
          <h2 className={styles.sectionTitle}>Program Portfolio</h2>
          <p className={styles.sectionDesc}>
            Your programs are your primary source of sustained SI, theater strength, and resource production.
            Managing your portfolio efficiently is the central strategic challenge.
          </p>

          <div className={styles.portfolioSlots}>
            <div className={styles.portfolioSlot}>
              <div className={styles.portfolioSlotHeader} style={{ color: 'var(--color-info)' }}>Pipeline</div>
              <div className={styles.portfolioSlotCount}>3 slots</div>
              <div className={styles.portfolioSlotDesc}>
                Programs in development. Pay the reduced Pipeline cost to place a card here.
                Use <strong>Start Program</strong> order. Programs here generate no effects — they're just queued.
              </div>
              <div className={styles.portfolioSlotTip}>Tip: Fill your pipeline early to prep activations for later quarters.</div>
            </div>
            <div className={styles.portfolioSlotArrow}>→</div>
            <div className={styles.portfolioSlot}>
              <div className={styles.portfolioSlotHeader} style={{ color: 'var(--color-success)' }}>Active</div>
              <div className={styles.portfolioSlotCount}>6 slots</div>
              <div className={styles.portfolioSlotDesc}>
                Fully commissioned programs. Pay the full Activate cost via <strong>Activate Program</strong> order.
                Active programs grant immediate effects, ongoing Sustain effects, and can be stationed in theaters.
              </div>
              <div className={styles.portfolioSlotTip}>Tip: Active slots are scarce — prioritize programs with strong Sustain effects or high station strength.</div>
            </div>
            <div className={styles.portfolioSlotArrow}>→</div>
            <div className={styles.portfolioSlot}>
              <div className={styles.portfolioSlotHeader} style={{ color: 'var(--color-sustain)' }}>Mothball</div>
              <div className={styles.portfolioSlotCount}>Unlimited</div>
              <div className={styles.portfolioSlotDesc}>
                Decommissioned programs stored in reserve. Use <strong>Refit / Mothball</strong> to move an Active
                program here and gain +1 U. Reactivate later by paying 1U + 1 of its budget line.
              </div>
              <div className={styles.portfolioSlotTip}>Tip: Mothball programs that aren't contributing to free up Active slots and recover Sustain.</div>
            </div>
          </div>
        </section>

        {/* === THEATERS === */}
        <section id="theaters" className={styles.section}>
          <h2 className={styles.sectionTitle}>Theaters</h2>
          <p className={styles.sectionDesc}>
            Theater control is scored at Year End. The player with the highest strength in each theater
            scores {THEATER_CONTROL_SCORING.first} SI, second scores {THEATER_CONTROL_SCORING.second} SI,
            and third scores {THEATER_CONTROL_SCORING.third} SI (4–5 player games only).
          </p>

          <div className={styles.strengthTable}>
            <div className={styles.strengthTitle}>Strength Sources</div>
            <div className={styles.strengthRows}>
              <div className={styles.strengthRow}>
                <span className={styles.strengthLabel}>Base</span>
                <span className={styles.strengthValue}>+{STRENGTH_VALUES.base} strength</span>
                <span className={styles.strengthDesc}>Build with Build Base order (2U + 1 any line). Each theater has 2 Base slots.</span>
              </div>
              <div className={styles.strengthRow}>
                <span className={styles.strengthLabel}>Alliance</span>
                <span className={styles.strengthValue}>+{STRENGTH_VALUES.alliance} strength</span>
                <span className={styles.strengthDesc}>Place with Negotiate order — requires a Base, or spend 1 PC to place anywhere. 2 Alliance slots per theater.</span>
              </div>
              <div className={styles.strengthRow}>
                <span className={styles.strengthLabel}>Forward Ops</span>
                <span className={styles.strengthValue}>+{STRENGTH_VALUES.forwardOps} strength</span>
                <span className={styles.strengthDesc}>High value but expensive (1L + 2U). Requires a Base in that theater. 1 Forward Ops slot per theater.</span>
              </div>
              <div className={styles.strengthRow}>
                <span className={styles.strengthLabel}>Stationed</span>
                <span className={styles.strengthValue}>+ card value</span>
                <span className={styles.strengthDesc}>Station Active Programs using the Station Programs order. Strength equals the program's stationing value.</span>
              </div>
            </div>
          </div>

          <div className={styles.theaterGrid}>
            {THEATER_IDS.map(id => (
              <div key={id} className={styles.theaterCard}>
                <div className={styles.theaterName}>{THEATER_NAMES[id]}</div>
              </div>
            ))}
          </div>
        </section>

        {/* === CARDS === */}
        <section id="cards" className={styles.section}>
          <h2 className={styles.sectionTitle}>Card Types</h2>
          <p className={styles.sectionDesc}>There are four card types, each playing a distinct role in the game.</p>

          <div className={styles.cardTypeGrid}>
            {CARD_TYPES.map(ct => (
              <div key={ct.name} className={styles.cardTypeCard} style={{ '--ct-color': ct.color } as React.CSSProperties}>
                <div className={styles.cardTypeHeader}>
                  <span className={styles.cardTypeIcon}>{ct.icon}</span>
                  <span className={styles.cardTypeName}>{ct.name}</span>
                </div>
                <p className={styles.cardTypeDesc}>{ct.desc}</p>
                <ul className={styles.cardTypeTips}>
                  {ct.tips.map((tip, i) => <li key={i}>{tip}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* === DIRECTORATES === */}
        <section id="directorates" className={styles.section}>
          <h2 className={styles.sectionTitle}>Directorates</h2>
          <p className={styles.sectionDesc}>
            Your directorate is your faction. Each has a starting resource bonus, a permanent passive ability,
            and a powerful once-per-year action.
          </p>

          <div className={styles.directorateGrid}>
            {Object.values(DIRECTORATES).map(d => (
              <div key={d.id} className={styles.directorateCard} style={{ '--dir-color': DIRECTORATE_COLORS[d.id] } as React.CSSProperties}>
                <div className={styles.directorateHeader}>
                  <div className={styles.directorateName}>{d.name}</div>
                  <div className={styles.directorateSubtitle}>{d.subtitle}</div>
                </div>
                <div className={styles.directorateAbilities}>
                  <div className={styles.ability}>
                    <div className={styles.abilityLabel}>Passive</div>
                    <div className={styles.abilityDesc}>{d.passiveDescription}</div>
                  </div>
                  <div className={styles.ability}>
                    <div className={styles.abilityLabel}>Once / Year</div>
                    <div className={styles.abilityDesc}>{d.oncePerYearDescription}</div>
                  </div>
                </div>
                {(Object.keys(d.startBonusBudgetProduction).length > 0 || Object.keys(d.startBonusSecondaryProduction).length > 0 || Object.keys(d.startBonusTokens).length > 0) && (
                  <div className={styles.directorateBonus}>
                    Starting bonus:{' '}
                    {[
                      ...Object.entries(d.startBonusBudgetProduction).map(([k, v]) => `+${v} ${k} production`),
                      ...Object.entries(d.startBonusSecondaryProduction).map(([k, v]) => `+${v} ${k} production`),
                      ...Object.entries(d.startBonusTokens).map(([k, v]) => `+${v} ${k}`),
                    ].join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Footer CTA */}
        <div className={styles.cta}>
          <p className={styles.ctaText}>Ready to command?</p>
          <Link href="/game" className={styles.ctaBtn}>Start a Game</Link>
        </div>

      </main>
    </div>
  );
}
