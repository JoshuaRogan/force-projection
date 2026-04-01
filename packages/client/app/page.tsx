import Link from 'next/link';
import styles from './Home.module.css';

export default function Home() {
  return (
    <div className={styles.root}>
      {/* Corner bracket decoration */}
      <div className={styles.corners} />

      {/* Domain color accent strip */}
      <div className={styles.domainStrip}>
        <span style={{ background: 'var(--color-air)' }} />
        <span style={{ background: 'var(--color-sea)' }} />
        <span style={{ background: 'var(--color-exp)' }} />
        <span style={{ background: 'var(--color-space)' }} />
        <span style={{ background: 'var(--color-sustain)' }} />
      </div>

      {/* Top system bar */}
      <div className={styles.sysBar}>
        <div className={styles.sysBarLeft}>
          <span className={styles.sysDot} />
          <span>// Force Projection Command Network</span>
          <span className={styles.sysSep}>|</span>
          <span>FPJC-REFORGED</span>
        </div>
        <div className={styles.sysBarRight}>
          <span>AUTH LEVEL: UNRESTRICTED</span>
          <span className={styles.sysSep}>|</span>
          <span>NODE: PENTAGON-7</span>
        </div>
      </div>

      {/* Main content */}
      <main className={styles.main}>
        <div className={styles.classif}>// Operational Simulation — Reforged Edition</div>

        <div className={styles.titleBlock}>
          <span className={styles.titleLine1}>Force Projection</span>
          <div className={styles.titleDivider}>
            <div className={styles.titleDividerLine} />
            <div className={styles.titleDividerDiamond} />
            <div className={styles.titleDividerLine} />
          </div>
          <span className={styles.titleLine2}>Joint Command</span>
        </div>

        <span className={styles.edition}>— Reforged Edition —</span>

        <p className={styles.tagline}>
          Command joint military operations across <em>six theaters</em>.
          Build programs, project force, outmaneuver rival directorates.
          <br />Every order shapes the balance of power.
        </p>

        <div className={styles.actions}>
          <Link href="/game" className={styles.btnPrimary}>
            New Game
          </Link>
          <Link href="/tutorial" className={styles.btnSecondary}>
            How to Play
          </Link>
          <Link href="/gallery" className={styles.btnSecondary}>
            Card Gallery
          </Link>
        </div>

        {/* Flavor status row */}
        <div className={styles.statusGrid}>
          {[
            { label: 'Theaters', value: '6', color: 'var(--color-air)' },
            { label: 'Players', value: '1–4', color: 'var(--color-sea)' },
            { label: 'Directorates', value: '5', color: 'var(--color-exp)' },
            { label: 'Domains', value: '4', color: 'var(--color-space)' },
            { label: 'Years', value: '4', color: 'var(--color-sustain)' },
          ].map(({ label, value, color }) => (
            <div key={label} className={styles.statusItem}>
              <span className={styles.statusLabel}>{label}</span>
              <span className={styles.statusValue} style={{ color }}>{value}</span>
              <span className={styles.statusDot} style={{ color }} />
            </div>
          ))}
        </div>
      </main>

      {/* Footer bar */}
      <div className={styles.footer}>
        <span>SYS READY — AWAITING COMMANDER INPUT<span className={styles.cursor} /></span>
        <span>© FORCE PROJECTION SYSTEMS</span>
      </div>
    </div>
  );
}
