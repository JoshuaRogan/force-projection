'use client';

import { useState, useRef } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import type { GameState, TheaterId, DirectorateId } from '@fp/shared';
import { THEATER_NAMES, calcStrength } from '@fp/shared';
import styles from './WorldMap.module.css';

// ── Color maps ──────────────────────────────────────────────────────────────

const DIR_COLOR: Record<DirectorateId, string> = {
  NAVSEA: 'var(--color-navsea)',
  AIRCOM: 'var(--color-aircom)',
  MARFOR: 'var(--color-marfor)',
  SPACECY: 'var(--color-spacecy)',
  TRANSCOM: 'var(--color-transcom)',
};

const DIR_HEX: Record<DirectorateId, string> = {
  NAVSEA: '#34d399',
  AIRCOM: '#60a5fa',
  MARFOR: '#f59e0b',
  SPACECY: '#a78bfa',
  TRANSCOM: '#94a3b8',
};

// ── Theater → ISO 3166-1 numeric country codes ──────────────────────────────

const THEATER_COUNTRIES: Partial<Record<TheaterId, number[]>> = {
  arctic: [
    304,  // Greenland
    352,  // Iceland
  ],
  homeland: [
    840, 124, 484,                             // USA, Canada, Mexico
    320, 84, 340, 222, 558, 188, 591,          // Central America
    192, 388, 332, 214, 780, 44, 52, 659, 308, 662, 670, 28, // Caribbean
    862, 170, 218, 604, 68, 152, 32, 858, 600, 76, 328, 740, // South America
  ],
  northAtlantic: [
    826, 372, 250, 276, 528, 56, 442,          // UK, Ireland, France, Germany, Netherlands, Belgium, Luxembourg
    208, 578, 752, 246,                         // Denmark, Norway, Sweden, Finland
    724, 620, 380, 756, 40, 300,                // Spain, Portugal, Italy, Switzerland, Austria, Greece
    616, 203, 703, 348, 642, 100,               // Poland, Czechia, Slovakia, Hungary, Romania, Bulgaria
    191, 705, 688, 70, 8, 807, 499,             // Croatia, Slovenia, Serbia, Bosnia, Albania, N.Mac, Montenegro
    233, 428, 440,                               // Estonia, Latvia, Lithuania
    504, 12, 788, 434,                           // Morocco, Algeria, Tunisia, Libya
  ],
  middleEast: [
    792, 760, 422, 376, 400, 818,               // Turkey, Syria, Lebanon, Israel, Jordan, Egypt
    682, 784, 414, 48, 634, 512, 887,           // Saudi, UAE, Kuwait, Bahrain, Qatar, Oman, Yemen
    368, 364, 4, 586,                            // Iraq, Iran, Afghanistan, Pakistan
    398, 860, 795, 417, 762,                     // Kazakhstan, Uzbekistan, Turkmenistan, Kyrgyzstan, Tajikistan
    268, 51, 31,                                 // Georgia, Armenia, Azerbaijan
  ],
  indoPacific: [
    643, 156, 496, 408, 410, 392,               // Russia, China, Mongolia, N/S Korea, Japan
    356, 50, 144, 524, 64,                       // India, Bangladesh, Sri Lanka, Nepal, Bhutan
    104, 764, 418, 116, 704,                     // Myanmar, Thailand, Laos, Cambodia, Vietnam
    458, 702, 96, 360, 608, 626,                 // Malaysia, Singapore, Brunei, Indonesia, Philippines, E.Timor
    598, 36, 554,                                 // PNG, Australia, New Zealand
    242, 882, 776, 90, 548, 296, 585, 584, 583, 520, 798, // Pacific islands
  ],
};

// Reverse lookup: ISO numeric → TheaterId
const COUNTRY_THEATER: Record<number, TheaterId> = {};
for (const [tid, codes] of Object.entries(THEATER_COUNTRIES)) {
  for (const code of codes!) {
    COUNTRY_THEATER[code] = tid as TheaterId;
  }
}

// ── Theater geographic centroids [lng, lat] ─────────────────────────────────

const THEATER_COORDS: Partial<Record<TheaterId, [number, number]>> = {
  arctic:        [  -20,  82 ],
  homeland:      [  -95,  40 ],
  northAtlantic: [  -15,  50 ],
  middleEast:    [   45,  28 ],
  indoPacific:   [  128,  18 ],
};

const GEOGRAPHIC_THEATERS: TheaterId[] = [
  'arctic', 'homeland', 'northAtlantic', 'middleEast', 'indoPacific',
];

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Parse a hex color and return it with the given alpha (0-1) */
function hexAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function getLeader(
  gameState: GameState,
  theaterId: TheaterId,
): { directorate: DirectorateId } | null {
  let maxStr = 0;
  let leader: string | null = null;
  let tied = false;
  for (const pid of gameState.turnOrder) {
    const s = calcStrength(gameState.players[pid].theaterPresence[theaterId]);
    if (s > maxStr) { maxStr = s; leader = pid; tied = false; }
    else if (s === maxStr && s > 0) { tied = true; }
  }
  if (!leader || tied || maxStr === 0) return null;
  return { directorate: gameState.players[leader].directorate as DirectorateId };
}

interface Badge {
  playerId: string;
  name: string;
  directorate: DirectorateId;
  strength: number;
  isHuman: boolean;
}

function getBadges(gameState: GameState, theaterId: TheaterId, humanId: string): Badge[] {
  return gameState.turnOrder
    .map(pid => ({
      playerId: pid,
      name: gameState.players[pid].name,
      directorate: gameState.players[pid].directorate as DirectorateId,
      strength: calcStrength(gameState.players[pid].theaterPresence[theaterId]),
      isHuman: pid === humanId,
    }))
    .sort((a, b) => b.strength - a.strength);
}

// ── Tooltip ─────────────────────────────────────────────────────────────────

function TheaterTooltip({
  theaterId,
  gameState,
  pos,
}: {
  theaterId: TheaterId;
  gameState: GameState;
  pos: { x: number; y: number };
}) {
  const entries = gameState.turnOrder.map(pid => {
    const p = gameState.players[pid];
    const pr = p.theaterPresence[theaterId];
    return { pid, name: p.name, directorate: p.directorate as DirectorateId, pr, str: calcStrength(pr) };
  }).sort((a, b) => b.str - a.str);

  const flipX = pos.x > 72;
  const flipY = pos.y > 60;

  return (
    <div
      className={styles.tooltip}
      style={{
        left:   flipX ? undefined : `${pos.x}%`,
        right:  flipX ? `${100 - pos.x}%` : undefined,
        top:    flipY ? undefined : `${pos.y}%`,
        bottom: flipY ? `${100 - pos.y}%` : undefined,
      }}
    >
      <div className={styles.tooltipTitle}>{THEATER_NAMES[theaterId]}</div>
      {entries.map(e => (
        <div
          key={e.pid}
          className={styles.tooltipRow}
          style={{ '--dir-color': DIR_COLOR[e.directorate] } as React.CSSProperties}
        >
          <span className={styles.tooltipName}>{e.name}</span>
          <span className={styles.tooltipDir}>{e.directorate}</span>
          <span className={styles.tooltipStr}>{e.str}</span>
          <div className={styles.tooltipPresence}>
            {e.pr.bases > 0 && <span>{e.pr.bases}B</span>}
            {e.pr.alliances > 0 && <span>{e.pr.alliances}AL</span>}
            {e.pr.forwardOps > 0 && <span>{e.pr.forwardOps}FO</span>}
            {e.pr.stationedStrength > 0 && <span>+{e.pr.stationedStrength}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function WorldMap({
  gameState,
  humanPlayerId,
}: {
  gameState: GameState;
  humanPlayerId: string;
}) {
  const [hovered, setHovered] = useState<TheaterId | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePos = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTooltipPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const spaceBadges = getBadges(gameState, 'spaceCyber', humanPlayerId);
  const spaceLeader = getLeader(gameState, 'spaceCyber');

  return (
    <div className={styles.container} ref={containerRef}>
      <ComposableMap
        projection="geoNaturalEarth1"
        projectionConfig={{ scale: 155, center: [15, 12] }}
        style={{ width: '100%', height: '100%', background: '#070a10' }}
      >
        {/* Country fills */}
        <Geographies geography="/world-atlas/countries-110m.json">
          {({ geographies }) =>
            geographies.map(geo => {
              const tid = COUNTRY_THEATER[Number(geo.id)];
              const leader = tid ? getLeader(gameState, tid) : null;
              const isHov = tid ? hovered === tid : false;

              const fill = leader
                ? hexAlpha(DIR_HEX[leader.directorate], isHov ? 0.22 : 0.11)
                : '#0e1520';
              const stroke = leader
                ? hexAlpha(DIR_HEX[leader.directorate], isHov ? 0.65 : 0.28)
                : '#16213a';

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={0.4}
                  style={{ default: { outline: 'none' }, hover: { outline: 'none' }, pressed: { outline: 'none' } }}
                  onMouseEnter={e => { if (tid) { setHovered(tid); updatePos(e); } }}
                  onMouseMove={e => { if (tid && hovered === tid) updatePos(e); }}
                  onMouseLeave={() => setHovered(null)}
                />
              );
            })
          }
        </Geographies>

        {/* Presence markers at theater centroids */}
        {GEOGRAPHIC_THEATERS.map(tid => {
          const coords = THEATER_COORDS[tid];
          if (!coords) return null;
          const badges = getBadges(gameState, tid, humanPlayerId).filter(b => b.strength > 0);

          return (
            <Marker key={tid} coordinates={coords}>
              {/* Theater label */}
              <text
                y={-18}
                textAnchor="middle"
                className={styles.theaterLabel}
                fill={hovered === tid ? (getLeader(gameState, tid) ? DIR_HEX[getLeader(gameState, tid)!.directorate] : '#e8ecf4') : 'rgba(232,236,244,0.6)'}
              >
                {THEATER_NAMES[tid].toUpperCase()}
              </text>

              {/* Presence dots */}
              {badges.map((b, i) => {
                const r = Math.min(4 + b.strength * 1.2, 10);
                const offsetX = (i - (badges.length - 1) / 2) * (r * 2 + 4);
                const isLeader = i === 0 && (badges[1]?.strength ?? -1) < b.strength;
                return (
                  <g key={b.playerId}>
                    {isLeader && (
                      <circle
                        cx={offsetX}
                        cy={0}
                        r={r + 3}
                        fill="none"
                        stroke={DIR_HEX[b.directorate]}
                        strokeWidth={0.8}
                        opacity={0.4}
                        className={styles.leaderRing}
                      />
                    )}
                    <circle
                      cx={offsetX}
                      cy={0}
                      r={r}
                      fill={DIR_HEX[b.directorate]}
                      opacity={b.isHuman ? 1 : 0.75}
                      className={isLeader ? styles.leaderBadge : undefined}
                    />
                    {b.isHuman && (
                      <circle
                        cx={offsetX}
                        cy={0}
                        r={r + 2}
                        fill="none"
                        stroke={DIR_HEX[b.directorate]}
                        strokeWidth={1}
                        opacity={0.5}
                      />
                    )}
                  </g>
                );
              })}
            </Marker>
          );
        })}
      </ComposableMap>

      {/* Space & Cyber — abstract domain panel at bottom */}
      <div
        className={styles.spaceCyberBar}
        style={{
          borderColor: spaceLeader
            ? hexAlpha(DIR_HEX[spaceLeader.directorate], hovered === 'spaceCyber' ? 0.6 : 0.3)
            : undefined,
          background: spaceLeader
            ? hexAlpha(DIR_HEX[spaceLeader.directorate], hovered === 'spaceCyber' ? 0.1 : 0.05)
            : undefined,
        }}
        onMouseEnter={e => { setHovered('spaceCyber'); updatePos(e); }}
        onMouseMove={updatePos}
        onMouseLeave={() => setHovered(null)}
      >
        <span className={styles.spaceCyberLabel}>SPACE &amp; CYBER DOMAIN</span>
        <div className={styles.spaceCyberBadges}>
          {spaceBadges.filter(b => b.strength > 0).map((b, i, arr) => {
            const isLeader = i === 0 && (arr[1]?.strength ?? -1) < b.strength;
            return (
              <div
                key={b.playerId}
                className={`${styles.spaceBadge} ${isLeader ? styles.spaceLeader : ''}`}
                style={{ background: hexAlpha(DIR_HEX[b.directorate], 0.85) }}
                title={`${b.name} (${b.directorate}): ${b.strength}`}
              />
            );
          })}
        </div>
      </div>

      {/* Scanline overlay */}
      <div className={styles.scanlines} />

      {/* Hover tooltip */}
      {hovered && (
        <TheaterTooltip
          theaterId={hovered}
          gameState={gameState}
          pos={tooltipPos}
        />
      )}
    </div>
  );
}
