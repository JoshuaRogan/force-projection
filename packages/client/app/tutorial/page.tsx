'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ORDERS,
  DIRECTORATES,
  THEATER_NAMES,
  THEATER_IDS,
  STRENGTH_VALUES,
  THEATER_CONTROL_SCORING,
  DEFAULT_CONFIG,
} from '@fp/shared';
import type { OrderCategory } from '@fp/shared';
import { colorizeDesc } from '@/utils/colorizeDesc';
import styles from './Tutorial.module.css';

/** Inline text with the same resource / SI highlighting as cards and the orders panel. */
function C({ children, className }: { children: string; className?: string }) {
  return <span className={className ?? styles.tokenText}>{colorizeDesc(children)}</span>;
}

const CATEGORY_INFO: Record<OrderCategory, { color: string; desc: string }> = {
  Influence: { color: 'var(--color-polcap)', desc: 'Gain PC, contracts, and alliances. Resolves first.' },
  Procure: { color: 'var(--color-air)', desc: 'Pipeline, activate, or refit programs. Resolves second.' },
  Deploy: { color: 'var(--color-exp)', desc: 'Bases, Forward Ops, and stationed programs. Resolves third.' },
  Sustain: { color: 'var(--color-sustain)', desc: 'Readiness, logistics, intel, crisis mitigation. Resolves last.' },
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
    tips: ['Start programs cheaply via Pipeline, then pay full cost to Activate', 'Stationed programs add strength to theaters', 'Mothball unused programs for +1U — reactivate later with 1U + 1 domain line (e.g. 1A)'],
  },
  {
    name: 'Contract',
    color: 'var(--color-card-contract)',
    icon: '◈',
    desc: 'Public objectives that award SI when completed. Completing them requires meeting specific theater presence, readiness, or resource conditions.',
    tips: ['You can hold max 2 active contracts at once', 'Use Contracting order to draw and keep new contracts', 'Some contracts award big SI payouts — prioritize them early'],
  },
  {
    name: 'Agenda',
    color: 'var(--color-card-agenda)',
    icon: '▣',
    desc: 'Congressional budget priorities voted on each year. Spend PC to influence the vote. Passing or defeating the Agenda triggers different effects for all players.',
    tips: ['Even 1 PC can swing a close vote', 'Check if the Agenda favors your directorate before spending', 'SPACECY can peek at the next crisis to plan around it'],
  },
  {
    name: 'Crisis',
    color: 'var(--color-card-crisis)',
    icon: '◬',
    desc: 'Quarterly shocks that penalize players without adequate readiness or theater presence. Each crisis targets specific theaters and resource thresholds.',
    tips: ['Readiness above threshold reduces crisis penalties', 'Logistics Surge grants +2L and cuts your crisis penalty by 1', 'SPACECY can bury an incoming crisis for 1 PC'],
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
    <div className={styles.root}>
      <div className={styles.corners} />

      <div className={styles.domainStrip}>
        <span style={{ background: 'var(--color-air)' }} />
        <span style={{ background: 'var(--color-sea)' }} />
        <span style={{ background: 'var(--color-exp)' }} />
        <span style={{ background: 'var(--color-space)' }} />
        <span style={{ background: 'var(--color-sustain)' }} />
      </div>

      <div className={styles.sysBar}>
        <div className={styles.sysBarLeft}>
          <span className={styles.sysDot} />
          <span>// Force Projection Doctrine Brief</span>
          <span className={styles.sysSep}>|</span>
          <span>REV: CURRENT BUILD</span>
        </div>
        <div className={styles.sysBarRight}>
          <Link href="/" className={styles.sysLink}>Main Menu</Link>
          <span className={styles.sysSep}>|</span>
          <Link href="/gallery" className={styles.sysLink}>Card Gallery</Link>
          <span className={styles.sysSep}>|</span>
          <Link href="/game" className={styles.sysLink}>New Game</Link>
        </div>
      </div>

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
          <div className={styles.navInner}>
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
          </div>
        </nav>

        <main className={styles.main}>
          {/* === OBJECTIVE === */}
          <section id="objective" className={styles.section}>
            <h2 className={styles.sectionTitle}>Objective</h2>
            <p className={styles.lead}>
              <C>
                Accumulate the most SI across a standard 4 fiscal years (3-year and 5-year games are also supported).
                SI is your directorate score — earn it through programs, theater control, contracts, and year-end effects.
              </C>
            </p>
            <p className={styles.sectionDesc}>
              <C>
                Track SI on your dashboard. Each quarter: Crisis, hidden orders, resolution, cleanup, and card draw.
              </C>
            </p>
            <div className={styles.calloutGrid}>
              <div className={styles.callout} style={{ borderTopColor: 'var(--color-si)' } as React.CSSProperties}>
                <div className={styles.calloutTop}>
                  <span className={styles.calloutName} style={{ color: 'var(--color-si)' }}>Strategic Influence</span>
                  <span className={styles.calloutBadge} style={{ color: 'var(--color-si)', borderColor: 'color-mix(in srgb, var(--color-si) 45%, var(--border-subtle))' } as React.CSSProperties}>SI</span>
                </div>
                <p className={styles.calloutLabel}><C>Highest SI wins. Earn it from programs, theaters, contracts, and year-end scoring.</C></p>
              </div>
              <div className={styles.callout} style={{ borderTopColor: 'var(--color-info)' } as React.CSSProperties}>
                <div className={styles.calloutTop}>
                  <span className={styles.calloutName} style={{ color: 'var(--color-info)' }}>Theaters</span>
                  <span className={styles.calloutMetrics}>
                    <span className={styles.calloutMetric}>6 regions</span>
                  </span>
                </div>
                <p className={styles.calloutLabel}>
                  The global map you fight over — presence from bases, alliances, forward ops, and stationed programs drives control and SI.
                </p>
              </div>
              <div className={styles.callout} style={{ borderTopColor: 'var(--color-air)' } as React.CSSProperties}>
                <div className={styles.calloutTop}>
                  <span className={styles.calloutName} style={{ color: 'var(--color-air)' }}>Orders</span>
                  <span className={styles.calloutMetrics}>
                    <span className={styles.calloutMetric}>12 total</span>
                    <span className={styles.calloutMetric}>pick 2 / quarter</span>
                  </span>
                </div>
                <p className={styles.calloutLabel}>
                  Your quarterly actions — chosen hidden, then resolved in sequence: Influence, Procure, Deploy, Sustain.
                </p>
              </div>
              <div className={styles.callout} style={{ borderTopColor: 'var(--color-exp)' } as React.CSSProperties}>
                <div className={styles.calloutTop}>
                  <span className={styles.calloutName} style={{ color: 'var(--color-exp)' }}>Quarters</span>
                  <span className={styles.calloutMetrics}>
                    <span className={styles.calloutMetric}>4 / year</span>
                    <span className={styles.calloutMetric}>16 in standard</span>
                  </span>
                </div>
                <p className={styles.calloutLabel}>
                  Each fiscal year is four quarters of Crisis, orders, resolution, cleanup, and draws — standard campaign is 4 years.
                </p>
              </div>
            </div>
          </section>

          {/* === GAME FLOW === */}
          <section id="flow" className={styles.section}>
            <h2 className={styles.sectionTitle}>Game Flow</h2>
            <p className={styles.sectionDesc}>
              <C>Each fiscal year follows this sequence. Standard length is 4 years (16 quarters).</C>
            </p>
            <p className={styles.flowIntro}>
              The four beats below run in reading order — that is the order of play at the table each year.
            </p>

            <div className={styles.calloutGrid}>
              <div className={styles.callout} style={{ borderTopColor: 'var(--color-card-agenda)' } as React.CSSProperties}>
                <div className={styles.calloutTop}>
                  <span className={styles.calloutName} style={{ color: 'var(--color-card-agenda)' }}>Agenda vote</span>
                  <span className={styles.calloutMetrics}>
                    <span className={styles.calloutMetric}>opens the year</span>
                    <span className={styles.calloutMetric}>1 agenda</span>
                  </span>
                </div>
                <p className={styles.calloutLabel}>
                  <C>Commit PC to support or oppose the Congressional Agenda. Pass or fail applies that card&apos;s effects to every player for the whole year.</C>
                </p>
              </div>
              <div className={styles.callout} style={{ borderTopColor: 'var(--color-card-contract)' } as React.CSSProperties}>
                <div className={styles.calloutTop}>
                  <span className={styles.calloutName} style={{ color: 'var(--color-card-contract)' }}>Contract market</span>
                  <span className={styles.calloutMetrics}>
                    <span className={styles.calloutMetric}>up to 3 shown</span>
                    <span className={styles.calloutMetric}>2 active max</span>
                  </span>
                </div>
                <p className={styles.calloutLabel}>
                  <C>Pick public objectives with immediate perks and year-end requirements. Taking a contract applies its on-take effects.</C>
                </p>
              </div>
              <div className={styles.callout} style={{ borderTopColor: 'var(--color-info)' } as React.CSSProperties}>
                <div className={styles.calloutTop}>
                  <span className={styles.calloutName} style={{ color: 'var(--color-info)' }}>Quarterly operations</span>
                  <span className={styles.calloutMetrics}>
                    <span className={styles.calloutMetric}>4 per year</span>
                    <span className={styles.calloutMetric}>2 orders each</span>
                    <span className={styles.calloutMetric}>{`${DEFAULT_CONFIG.drawPerQuarter} programs × 2 / yr`}</span>
                  </span>
                </div>
                <p className={styles.calloutLabel}>
                  <C>
                    {`Where most turns happen: Crisis, hidden orders, category resolution, cleanup — then after Q1 and Q3 cleanup each player draws ${DEFAULT_CONFIG.drawPerQuarter} programs (entering Q2 and Q4). No program draw after Q2 or Q4.`}
                  </C>
                </p>
              </div>
              <div className={styles.callout} style={{ borderTopColor: 'var(--color-si)' } as React.CSSProperties}>
                <div className={styles.calloutTop}>
                  <span className={styles.calloutName} style={{ color: 'var(--color-si)' }}>Year-end scoring</span>
                  <span className={styles.calloutMetrics}>
                    <span className={styles.calloutMetric}>contracts</span>
                    <span className={styles.calloutMetric}>theaters</span>
                    <span className={styles.calloutMetric}>{`${THEATER_CONTROL_SCORING.first}/${THEATER_CONTROL_SCORING.second}/${THEATER_CONTROL_SCORING.third} SI`}</span>
                  </span>
                </div>
                <p className={styles.calloutLabel}>
                  <C>
                    {`Resolve year-end sustain text, finish or fail contracts for SI, then score theater control (${THEATER_CONTROL_SCORING.first}/${THEATER_CONTROL_SCORING.second}/${THEATER_CONTROL_SCORING.third} SI per theater).`}
                  </C>
                </p>
              </div>
            </div>

            <div className={styles.quarterBreakdown}>
              <div className={styles.quarterTitle}>Inside each quarter</div>
              <p className={styles.quarterIntro}>Same rhythm every quarter — these four moments always happen in this order.</p>
              <div className={styles.quarterSteps}>
                {[
                  { tag: 'Crisis', label: 'Crisis pulse', desc: 'Reveal the quarter Crisis. Immediate effects apply; quarter-start sustain effects may fire.' },
                  { tag: 'Commit', label: 'Plan orders', desc: 'Every player selects 2 orders face-down, then reveals together.' },
                  { tag: 'Resolve', label: 'Resolve orders', desc: 'Resolve in order: Influence → Procure → Deploy → Sustain (Intel Focus can spend 1I to shift timing).' },
                  { tag: 'Cleanup', label: 'Cleanup', desc: `Discard to hand limit (${DEFAULT_CONFIG.handLimit}), clear orders, then advance. After Q1 and Q3 only, each player draws ${DEFAULT_CONFIG.drawPerQuarter} programs before the next quarter.` },
                ].map(step => (
                  <div key={step.tag} className={styles.quarterStep}>
                    <div className={styles.quarterStepTag}>{step.tag}</div>
                    <div>
                      <div className={styles.quarterStepLabel}>{step.label}</div>
                      <div className={styles.quarterStepDesc}><C>{step.desc}</C></div>
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
              <C>
                Budget lines (A S E X U) fund domains; secondary resources (M L I PC) pay for orders and tempo.
                Each track has current stock and production rates.
              </C>
            </p>
            <p className={styles.sectionDesc}>
              <C>
                Year-start production refills everyone; orders, contracts, agendas, and sustain effects add more during the year.
              </C>
            </p>

            <h3 className={styles.subTitle}>Budget Lines</h3>
            <div className={styles.resourceGrid}>
              {BUDGET_LINES.map(r => (
                <div key={r.key} className={styles.resourceCard} style={{ '--res-color': r.color } as React.CSSProperties}>
                  <div className={styles.resourceKey}>{r.key}</div>
                  <div className={styles.resourceName}>{r.name}</div>
                  <div className={styles.resourceDesc}><C>{r.desc}</C></div>
                </div>
              ))}
            </div>

            <h3 className={styles.subTitle} style={{ marginTop: '1.5rem' }}>Secondary Resources</h3>
            <div className={styles.resourceGrid}>
              {SECONDARY_RESOURCES.map(r => (
                <div key={r.key} className={styles.resourceCard} style={{ '--res-color': r.color } as React.CSSProperties}>
                  <div className={styles.resourceKey}>{r.key}</div>
                  <div className={styles.resourceName}>{r.name}</div>
                  <div className={styles.resourceDesc}><C>{r.desc}</C></div>
                </div>
              ))}
            </div>

            <div className={styles.tip}>
              <C>
                Reprogramming: moving budget between lines is effect-driven (directorates, agendas, cards). PC remains the main currency for politics and votes.
              </C>
            </div>
          </section>

        {/* === THE 12 ORDERS === */}
        <section id="orders" className={styles.section}>
          <h2 className={styles.sectionTitle}>The 12 Orders</h2>
          <p className={styles.sectionDesc}>
            <C>
              Each quarter pick exactly 2 orders. Resolve Influence → Procure → Deploy → Sustain. Intel Focus can spend 1I to shift your slot in that order.
            </C>
          </p>

          {(['Influence', 'Procure', 'Deploy', 'Sustain'] as OrderCategory[]).map(cat => (
            <div key={cat} className={styles.categoryBlock}>
              <div className={styles.categoryHeader} style={{ '--cat-color': CATEGORY_INFO[cat].color } as React.CSSProperties}>
                <span className={styles.categoryName}>{cat}</span>
                <span className={styles.categoryDesc}><C>{CATEGORY_INFO[cat].desc}</C></span>
              </div>
              <div className={styles.orderGrid}>
                {(ordersByCategory[cat] ?? []).map(order => (
                  <div key={order.id} className={styles.orderCard} style={{ '--cat-color': CATEGORY_INFO[cat].color } as React.CSSProperties}>
                    <div className={styles.orderName}>{order.name}</div>
                    <div className={styles.orderDesc}><C>{order.description}</C></div>
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
            <C>Programs drive SI, theater strength, and production. Pipeline → Active → Mothball timing is the core puzzle.</C>
          </p>

          <div className={styles.portfolioSlots}>
            <div className={styles.portfolioSlot}>
              <div className={styles.portfolioSlotHeader} style={{ color: 'var(--color-info)' }}>Pipeline</div>
              <div className={styles.portfolioSlotCount}>3 slots</div>
              <div className={styles.portfolioSlotDesc}>
                <C>
                  In development. Pay pipeline cost and use Start Program. No effects until activated.
                </C>
              </div>
              <div className={styles.portfolioSlotTip}>Tip: Fill your pipeline early to prep activations for later quarters.</div>
            </div>
            <div className={styles.portfolioSlotArrow}>→</div>
            <div className={styles.portfolioSlot}>
              <div className={styles.portfolioSlotHeader} style={{ color: 'var(--color-success)' }}>Active</div>
              <div className={styles.portfolioSlotCount}>6 slots</div>
              <div className={styles.portfolioSlotDesc}>
                <C>
                  Pay activate cost with Activate Program. Immediate effects, sustain text, and stationing all apply from here.
                </C>
              </div>
              <div className={styles.portfolioSlotTip}>Tip: Active slots are scarce — prioritize programs with strong Sustain effects or high station strength.</div>
            </div>
            <div className={styles.portfolioSlotArrow}>→</div>
            <div className={styles.portfolioSlot}>
              <div className={styles.portfolioSlotHeader} style={{ color: 'var(--color-sustain)' }}>Mothball</div>
              <div className={styles.portfolioSlotCount}>Unlimited</div>
              <div className={styles.portfolioSlotDesc}>
                <C>
                  Refit / Mothball from Active: gain +1U. Reactivate for 1U + 1 domain line (e.g. 1A for an AIR program).
                </C>
              </div>
              <div className={styles.portfolioSlotTip}>Tip: Mothball programs that aren&apos;t contributing to free up Active slots and recover U.</div>
            </div>
          </div>
        </section>

        {/* === THEATERS === */}
        <section id="theaters" className={styles.section}>
          <h2 className={styles.sectionTitle}>Theaters</h2>
          <p className={styles.sectionDesc}>
            <C>
              {`Theater control scores at year end: 1st gains ${THEATER_CONTROL_SCORING.first} SI, 2nd ${THEATER_CONTROL_SCORING.second} SI, 3rd ${THEATER_CONTROL_SCORING.third} SI (3rd place only with 4+ players).`}
            </C>
          </p>

          <div className={styles.strengthTable}>
            <div className={styles.strengthTitle}>Strength Sources</div>
            <div className={styles.strengthRows}>
              <div className={styles.strengthRow}>
                <span className={styles.strengthLabel}>Base</span>
                <span className={styles.strengthValue}>+{STRENGTH_VALUES.base} strength</span>
                <span className={styles.strengthDesc}><C>Build Base: 2U + 1A (or any budget line). 2 Base slots per theater.</C></span>
              </div>
              <div className={styles.strengthRow}>
                <span className={styles.strengthLabel}>Alliance</span>
                <span className={styles.strengthValue}>+{STRENGTH_VALUES.alliance} strength</span>
                <span className={styles.strengthDesc}><C>Negotiate: needs a Base in theater, or 1 PC to place anywhere. 2 Alliance slots per theater.</C></span>
              </div>
              <div className={styles.strengthRow}>
                <span className={styles.strengthLabel}>Forward Ops</span>
                <span className={styles.strengthValue}>+{STRENGTH_VALUES.forwardOps} strength</span>
                <span className={styles.strengthDesc}><C>Forward Ops: 1L + 2U, requires Base in that theater. 1 slot per theater.</C></span>
              </div>
              <div className={styles.strengthRow}>
                <span className={styles.strengthLabel}>Stationed</span>
                <span className={styles.strengthValue}>+ card value</span>
                <span className={styles.strengthDesc}><C>Station Programs order: strength equals each program&apos;s station value.</C></span>
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
          <p className={styles.sectionDesc}><C>Four card types — same coloring as in-game card text for costs and SI.</C></p>

          <div className={styles.cardTypeGrid}>
            {CARD_TYPES.map(ct => (
              <div key={ct.name} className={styles.cardTypeCard} style={{ '--ct-color': ct.color } as React.CSSProperties}>
                <div className={styles.cardTypeHeader}>
                  <span className={styles.cardTypeIcon}>{ct.icon}</span>
                  <span className={styles.cardTypeName}>{ct.name}</span>
                </div>
                <p className={styles.cardTypeDesc}><C>{ct.desc}</C></p>
                <ul className={styles.cardTypeTips}>
                  {ct.tips.map((tip, i) => (
                    <li key={i}><C>{tip}</C></li>
                  ))}
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
                    <div className={styles.abilityDesc}><C>{d.passiveDescription}</C></div>
                  </div>
                  <div className={styles.ability}>
                    <div className={styles.abilityLabel}>Once / Year</div>
                    <div className={styles.abilityDesc}><C>{d.oncePerYearDescription}</C></div>
                  </div>
                </div>
                {(Object.keys(d.startBonusBudgetProduction).length > 0 || Object.keys(d.startBonusSecondaryProduction).length > 0 || Object.keys(d.startBonusTokens).length > 0) && (
                  <div className={styles.directorateBonus}>
                    <C>
                      {`Starting bonus: ${[
                        ...Object.entries(d.startBonusBudgetProduction).map(([k, v]) => `+${v} ${k} production`),
                        ...Object.entries(d.startBonusSecondaryProduction).map(([k, v]) => `+${v} ${k} production`),
                        ...Object.entries(d.startBonusTokens).map(([k, v]) => `+${v} ${k}`),
                      ].join(', ')}`}
                    </C>
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
    </div>
  );
}
