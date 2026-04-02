'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { PROGRAM_CARDS, CONTRACT_CARDS, AGENDA_CARDS, CRISIS_CARDS } from '@fp/shared';
import type { ProgramDomain } from '@fp/shared';
import { ProgramCard, ContractCard, AgendaCard, CrisisCard } from '@/components/cards';
import styles from './gallery.module.css';

type Tab = 'programs' | 'contracts' | 'agendas' | 'crises';

const DOMAIN_OPTIONS: { value: ProgramDomain | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Domains' },
  { value: 'AIR', label: 'Air' },
  { value: 'SEA', label: 'Sea' },
  { value: 'EXP', label: 'Expeditionary' },
  { value: 'SPACE_CYBER', label: 'Space/Cyber' },
];

export default function GalleryPage() {
  const [tab, setTab] = useState<Tab>('programs');
  const [search, setSearch] = useState('');
  const [domain, setDomain] = useState<ProgramDomain | 'ALL'>('ALL');

  const filteredPrograms = useMemo(() => {
    let cards = PROGRAM_CARDS;
    if (domain !== 'ALL') cards = cards.filter(c => c.domain === domain);
    if (search) {
      const q = search.toLowerCase();
      cards = cards.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.subtags.some(t => t.toLowerCase().includes(q)) ||
        c.domain.toLowerCase().includes(q)
      );
    }
    return cards;
  }, [search, domain]);

  const filteredContracts = useMemo(() => {
    if (!search) return CONTRACT_CARDS;
    const q = search.toLowerCase();
    return CONTRACT_CARDS.filter(c => c.name.toLowerCase().includes(q));
  }, [search]);

  const filteredAgendas = useMemo(() => {
    if (!search) return AGENDA_CARDS;
    const q = search.toLowerCase();
    return AGENDA_CARDS.filter(c =>
      c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    );
  }, [search]);

  const filteredCrises = useMemo(() => {
    if (!search) return CRISIS_CARDS;
    const q = search.toLowerCase();
    return CRISIS_CARDS.filter(c =>
      c.name.toLowerCase().includes(q) || c.immediateRule.toLowerCase().includes(q)
    );
  }, [search]);

  const counts: Record<Tab, number> = {
    programs: filteredPrograms.length,
    contracts: filteredContracts.length,
    agendas: filteredAgendas.length,
    crises: filteredCrises.length,
  };

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
          <span>// Force Projection Card Intelligence</span>
          <span className={styles.sysSep}>|</span>
          <span>ARCHIVE: LIVE</span>
        </div>
        <div className={styles.sysBarRight}>
          <Link href="/" className={styles.sysLink}>Main Menu</Link>
          <span className={styles.sysSep}>|</span>
          <Link href="/tutorial" className={styles.sysLink}>How to Play</Link>
          <span className={styles.sysSep}>|</span>
          <Link href="/game" className={styles.sysLink}>New Game</Link>
        </div>
      </div>

      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Card Gallery</h1>
          <input
            className={styles.search}
            type="search"
            placeholder="Search cards…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.tabs}>
          {(['programs', 'contracts', 'agendas', 'crises'] as Tab[]).map(t => (
            <button
              key={t}
              className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              <span className={styles.tabCount}>{counts[t]}</span>
            </button>
          ))}
          {tab === 'programs' && (
            <select
              className={styles.domainFilter}
              value={domain}
              onChange={e => setDomain(e.target.value as ProgramDomain | 'ALL')}
            >
              {DOMAIN_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}
        </div>

        <div className={styles.grid}>
          {tab === 'programs' && filteredPrograms.map(card => (
            <ProgramCard key={card.id} card={card} />
          ))}
          {tab === 'contracts' && filteredContracts.map(card => (
            <ContractCard key={card.id} card={card} />
          ))}
          {tab === 'agendas' && filteredAgendas.map(card => (
            <AgendaCard key={card.id} card={card} />
          ))}
          {tab === 'crises' && filteredCrises.map(card => (
            <CrisisCard key={card.id} card={card} />
          ))}
          {counts[tab] === 0 && (
            <p className={styles.empty}>No cards match your search.</p>
          )}
        </div>
      </main>
    </div>
  );
}
