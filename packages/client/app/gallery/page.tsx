'use client';

import { PROGRAM_CARDS, CONTRACT_CARDS, AGENDA_CARDS, CRISIS_CARDS } from '@fp/shared';
import { ProgramCard, ContractCard, AgendaCard, CrisisCard } from '@/components/cards';

export default function GalleryPage() {
  return (
    <main style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Card Gallery</h1>

      <Section title="Program Cards">
        {PROGRAM_CARDS.slice(0, 8).map(card => (
          <ProgramCard key={card.id} card={card} />
        ))}
      </Section>

      <Section title="Contract Cards">
        {CONTRACT_CARDS.slice(0, 4).map(card => (
          <ContractCard key={card.id} card={card} />
        ))}
      </Section>

      <Section title="Agenda Cards">
        {AGENDA_CARDS.slice(0, 4).map(card => (
          <AgendaCard key={card.id} card={card} />
        ))}
      </Section>

      <Section title="Crisis Cards">
        {CRISIS_CARDS.slice(0, 4).map(card => (
          <CrisisCard key={card.id} card={card} />
        ))}
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '2rem' }}>
      <h2 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>{title}</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        {children}
      </div>
    </section>
  );
}
