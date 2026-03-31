import Link from 'next/link';

export default function Home() {
  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      gap: '2rem',
    }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Force Projection: Joint Command</h1>
      <p style={{ color: 'var(--text-secondary)' }}>Reforged Edition</p>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          href="/game"
          style={{
            padding: '0.75rem 2rem',
            background: 'var(--color-info)',
            color: 'white',
            borderRadius: 8,
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '1.1rem',
          }}
        >
          New Game
        </Link>
        <Link
          href="/tutorial"
          style={{
            padding: '0.75rem 2rem',
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            borderRadius: 8,
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '1.1rem',
          }}
        >
          How to Play
        </Link>
        <Link
          href="/gallery"
          style={{
            padding: '0.75rem 2rem',
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            borderRadius: 8,
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '1.1rem',
          }}
        >
          Card Gallery
        </Link>
      </div>
    </main>
  );
}
