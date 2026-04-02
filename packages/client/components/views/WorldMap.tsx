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

// ── Presence icons (inlined for WorldMap tooltip use) ────────────────────────

function BaseIcon() {
  return (
    <svg viewBox="0 0 20 20" width={10} height={10} fill="currentColor" aria-hidden="true">
      <rect x="8.5" y="3" width="1.5" height="11" />
      <path d="M10 3.5 L16 6.5 L10 9 Z" />
      <rect x="4" y="15" width="12" height="1.5" rx="0.5" />
    </svg>
  );
}

function FwdOpsIcon() {
  return (
    <svg viewBox="0 0 20 20" width={10} height={10} fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M4 15 A8 8 0 0 1 16 15 L14.5 15 A6.5 6.5 0 0 0 5.5 15 Z" />
      <rect x="9.3" y="9.5" width="1.4" height="5.5" />
      <circle cx="10" cy="9" r="1.5" />
      <path fillRule="evenodd" d="M7 6 A4 4 0 0 1 13 6 L12 6.8 A2.8 2.8 0 0 0 8 6.8 Z" />
    </svg>
  );
}

function AllianceIcon() {
  return (
    <svg viewBox="0 0 20 20" width={10} height={10} fill="currentColor" aria-hidden="true">
      <path d="M2 9 L6 7 L8 8 L8 11 L9 12 L7 13 L5 12 L2 13 Z" />
      <path d="M18 9 L14 7 L12 8 L12 11 L11 12 L13 13 L15 12 L18 13 Z" />
      <path d="M8 8 L12 8 L12 12 L8 12 Z" />
    </svg>
  );
}

function StationedIcon() {
  return (
    <svg viewBox="0 0 20 20" width={10} height={10} fill="currentColor" aria-hidden="true">
      <path d="M10 2 L12.5 7.5 L18 8.2 L14 12 L15 17.5 L10 14.8 L5 17.5 L6 12 L2 8.2 L7.5 7.5 Z" />
    </svg>
  );
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

  const active = entries.filter(e => e.str > 0);
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
      {active.length === 0 ? (
        <div className={styles.tooltipEmpty}>Uncontested</div>
      ) : (
        active.map(e => (
          <div
            key={e.pid}
            className={styles.tooltipRow}
            style={{ '--dir-color': DIR_COLOR[e.directorate] } as React.CSSProperties}
          >
            <span className={styles.tooltipName}>{e.name}</span>
            <span className={styles.tooltipDir}>{e.directorate}</span>
            <span className={styles.tooltipStr}>{e.str}</span>
            <div className={styles.tooltipPresence}>
              {e.pr.bases > 0 && (
                <span className={styles.tooltipChip} title="Bases">
                  <BaseIcon />{e.pr.bases}
                </span>
              )}
              {e.pr.forwardOps > 0 && (
                <span className={styles.tooltipChip} title="Forward Ops">
                  <FwdOpsIcon />{e.pr.forwardOps}
                </span>
              )}
              {e.pr.alliances > 0 && (
                <span className={styles.tooltipChip} title="Alliances">
                  <AllianceIcon />{e.pr.alliances}
                </span>
              )}
              {e.pr.stationedStrength > 0 && (
                <span className={styles.tooltipChip} title="Stationed strength">
                  <StationedIcon />+{e.pr.stationedStrength}
                </span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ── Theater detail panel (shown on click) ────────────────────────────────────

function TheaterDetail({
  theaterId,
  gameState,
  humanPlayerId,
  pos,
  onClose,
}: {
  theaterId: TheaterId;
  gameState: GameState;
  humanPlayerId: string;
  pos: { x: number; y: number };
  onClose: () => void;
}) {
  const entries = gameState.turnOrder.map(pid => {
    const p = gameState.players[pid];
    const pr = p.theaterPresence[theaterId];
    const str = calcStrength(pr);
    return { pid, name: p.name, directorate: p.directorate as DirectorateId, pr, str, isHuman: pid === humanPlayerId };
  }).sort((a, b) => b.str - a.str);

  const active = entries.filter(e => e.str > 0);
  const leader = getLeader(gameState, theaterId);

  // Position near click, flip axes if too close to edges (panel ~300px wide, ~220px tall)
  const flipX = pos.x > 60;
  const flipY = pos.y > 55;
  const panelStyle: React.CSSProperties = {
    left:   flipX ? undefined : `${pos.x}%`,
    right:  flipX ? `${100 - pos.x}%` : undefined,
    top:    flipY ? undefined : `${pos.y}%`,
    bottom: flipY ? `${100 - pos.y}%` : undefined,
  };

  return (
    <div className={styles.detailPanel} style={panelStyle}>
      <div className={styles.detailHeader} style={leader ? { borderLeftColor: DIR_COLOR[leader.directorate] } as React.CSSProperties : undefined}>
        <div>
          <div className={styles.detailTitle}>{THEATER_NAMES[theaterId]}</div>
          {leader && <div className={styles.detailLeader} style={{ color: DIR_COLOR[leader.directorate] }}>Led by {leader.directorate}</div>}
        </div>
        <button className={styles.detailClose} onClick={onClose}>✕</button>
      </div>

      {active.length === 0 ? (
        <div className={styles.detailEmpty}>No forces present — theater uncontested</div>
      ) : (
        <div className={styles.detailRows}>
          {entries.map(e => (
            <div
              key={e.pid}
              className={`${styles.detailRow} ${e.isHuman ? styles.detailRowHuman : ''}`}
              style={{ '--dir-color': DIR_COLOR[e.directorate] } as React.CSSProperties}
            >
              <div className={styles.detailRowLeft}>
                <span className={styles.detailPlayerName} style={{ color: DIR_COLOR[e.directorate] }}>{e.name}</span>
                <span className={styles.detailPlayerDir}>{e.directorate}</span>
              </div>
              <div className={styles.detailAssets}>
                {e.pr.bases > 0 && (
                  <span className={styles.detailChip}>
                    <BaseIcon /> <span>{e.pr.bases}</span> <span className={styles.detailChipLabel}>Base{e.pr.bases > 1 ? 's' : ''}</span>
                  </span>
                )}
                {e.pr.forwardOps > 0 && (
                  <span className={styles.detailChip}>
                    <FwdOpsIcon /> <span>{e.pr.forwardOps}</span> <span className={styles.detailChipLabel}>Fwd Ops</span>
                  </span>
                )}
                {e.pr.alliances > 0 && (
                  <span className={styles.detailChip}>
                    <AllianceIcon /> <span>{e.pr.alliances}</span> <span className={styles.detailChipLabel}>Alliance{e.pr.alliances > 1 ? 's' : ''}</span>
                  </span>
                )}
                {e.pr.stationedStrength > 0 && (
                  <span className={styles.detailChip}>
                    <StationedIcon /> <span>+{e.pr.stationedStrength}</span> <span className={styles.detailChipLabel}>Stationed</span>
                  </span>
                )}
                {e.str === 0 && <span className={styles.detailNone}>No presence</span>}
              </div>
              <span className={styles.detailStr}>{e.str}</span>
            </div>
          ))}
        </div>
      )}
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
  const [selected, setSelected] = useState<TheaterId | null>(null);
  const [selectedPos, setSelectedPos] = useState({ x: 50, y: 50 });
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const getPct = (e: React.MouseEvent) => {
    if (!containerRef.current) return { x: 50, y: 50 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  };

  const updatePos = (e: React.MouseEvent) => setTooltipPos(getPct(e));

  const handleClick = (tid: TheaterId, e?: React.MouseEvent) => {
    if (selected === tid) { setSelected(null); return; }
    setSelected(tid);
    if (e) setSelectedPos(getPct(e));
    setHovered(null);
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
              const isHov = tid ? (hovered === tid || selected === tid) : false;

              const fill = leader
                ? hexAlpha(DIR_HEX[leader.directorate], isHov ? 0.26 : 0.11)
                : '#0e1520';
              const stroke = leader
                ? hexAlpha(DIR_HEX[leader.directorate], isHov ? 0.75 : 0.28)
                : '#16213a';

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={tid ? 0.5 : 0.4}
                  style={{ default: { outline: 'none' }, hover: { outline: 'none', cursor: tid ? 'pointer' : 'default' }, pressed: { outline: 'none' } }}
                  onMouseEnter={e => { if (tid && selected !== tid) { setHovered(tid); updatePos(e); } }}
                  onMouseMove={e => { if (tid && hovered === tid) updatePos(e); }}
                  onMouseLeave={() => setHovered(null)}
                  onClick={e => { if (tid) handleClick(tid, e); }}
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
          const isActive = hovered === tid || selected === tid;

          // Aggregate presence across all players for map icons
          const totals = gameState.turnOrder.reduce((acc, pid) => {
            const pr = gameState.players[pid].theaterPresence[tid];
            acc.bases += pr.bases;
            acc.forwardOps += pr.forwardOps;
            acc.alliances += pr.alliances;
            return acc;
          }, { bases: 0, forwardOps: 0, alliances: 0 });

          const theaterLeader = getLeader(gameState, tid);
          const leaderColor = theaterLeader ? DIR_HEX[theaterLeader.directorate] : 'rgba(232,236,244,0.6)';

          return (
            <Marker key={tid} coordinates={coords}>
              {/* Clickable hit area */}
              <circle
                r={32}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onClick={e => handleClick(tid, e as unknown as React.MouseEvent)}
                onMouseEnter={e => { if (selected !== tid) { setHovered(tid); updatePos(e as unknown as React.MouseEvent); } }}
                onMouseLeave={() => setHovered(null)}
              />

              {/* Theater label */}
              <text
                y={-22}
                textAnchor="middle"
                className={styles.theaterLabel}
                fill={isActive ? leaderColor : 'rgba(232,236,244,0.55)'}
                style={{ cursor: 'pointer' }}
                onClick={e => handleClick(tid, e as unknown as React.MouseEvent)}
              >
                {THEATER_NAMES[tid].toUpperCase()}
              </text>

              {/* Presence dots */}
              {badges.map((b, i) => {
                const r = Math.min(4 + b.strength * 1.2, 10);
                const offsetX = (i - (badges.length - 1) / 2) * (r * 2 + 4);
                const isLeader = i === 0 && (badges[1]?.strength ?? -1) < b.strength;
                return (
                  <g key={b.playerId} style={{ cursor: 'pointer' }} onClick={e => handleClick(tid, e as unknown as React.MouseEvent)}>
                    {isLeader && (
                      <circle cx={offsetX} cy={0} r={r + 3} fill="none"
                        stroke={DIR_HEX[b.directorate]} strokeWidth={0.8} opacity={0.4}
                        className={styles.leaderRing}
                      />
                    )}
                    <circle cx={offsetX} cy={0} r={r}
                      fill={DIR_HEX[b.directorate]}
                      opacity={b.isHuman ? 1 : 0.75}
                      className={isLeader ? styles.leaderBadge : undefined}
                    />
                    {b.isHuman && (
                      <circle cx={offsetX} cy={0} r={r + 2} fill="none"
                        stroke={DIR_HEX[b.directorate]} strokeWidth={1.5} opacity={0.6}
                      />
                    )}
                  </g>
                );
              })}

              {/* Asset summary icons below dots — always visible when there's presence */}
              {(totals.bases > 0 || totals.forwardOps > 0 || totals.alliances > 0) && (
                <g transform="translate(0, 18)" style={{ cursor: 'pointer' }} onClick={e => handleClick(tid, e as unknown as React.MouseEvent)}>
                  {(() => {
                    const chips: React.ReactNode[] = [];
                    let x = 0;
                    const gap = 16;
                    const items: Array<{ icon: React.ReactNode; count: number }> = [];
                    if (totals.bases > 0) items.push({ icon: '⚑', count: totals.bases });
                    if (totals.forwardOps > 0) items.push({ icon: '◎', count: totals.forwardOps });
                    if (totals.alliances > 0) items.push({ icon: '⊕', count: totals.alliances });
                    const totalW = (items.length - 1) * gap;
                    items.forEach((item, idx) => {
                      const cx = -totalW / 2 + idx * gap;
                      chips.push(
                        <g key={idx} transform={`translate(${cx}, 0)`}>
                          <text textAnchor="middle" y={0} fontSize={7} fill={isActive ? leaderColor : 'rgba(232,236,244,0.45)'} fontFamily="IBM Plex Mono, monospace" fontWeight={700}>
                            {item.icon}{item.count}
                          </text>
                        </g>
                      );
                    });
                    return chips;
                  })()}
                </g>
              )}
            </Marker>
          );
        })}
      </ComposableMap>

      {/* Space & Cyber — abstract domain panel at bottom */}
      <div
        className={`${styles.spaceCyberBar} ${selected === 'spaceCyber' ? styles.spaceCyberSelected : ''}`}
        style={{
          borderColor: spaceLeader
            ? hexAlpha(DIR_HEX[spaceLeader.directorate], (hovered === 'spaceCyber' || selected === 'spaceCyber') ? 0.6 : 0.3)
            : undefined,
          background: spaceLeader
            ? hexAlpha(DIR_HEX[spaceLeader.directorate], (hovered === 'spaceCyber' || selected === 'spaceCyber') ? 0.1 : 0.05)
            : undefined,
        }}
        onMouseEnter={e => { if (selected !== 'spaceCyber') { setHovered('spaceCyber'); updatePos(e); } }}
        onMouseMove={updatePos}
        onMouseLeave={() => setHovered(null)}
        onClick={e => handleClick('spaceCyber', e)}
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
              >
                <span className={styles.spaceBadgeLabel}>{b.name}</span>
                <span className={styles.spaceBadgeStr}>{b.strength}</span>
              </div>
            );
          })}
        </div>
        <span className={styles.spaceCyberHint}>click for details</span>
      </div>

      {/* Scanline overlay */}
      <div className={styles.scanlines} />

      {/* Hover tooltip — only when nothing selected */}
      {hovered && !selected && (
        <TheaterTooltip
          theaterId={hovered}
          gameState={gameState}
          pos={tooltipPos}
        />
      )}

      {/* Click detail panel */}
      {selected && (
        <TheaterDetail
          theaterId={selected}
          gameState={gameState}
          humanPlayerId={humanPlayerId}
          pos={selectedPos}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
