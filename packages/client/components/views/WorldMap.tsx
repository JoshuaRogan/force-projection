'use client';

import { useState, useRef } from 'react';
import type { GameState, TheaterId, DirectorateId } from '@fp/shared';
import { THEATER_NAMES, calcStrength } from '@fp/shared';
import styles from './WorldMap.module.css';

// ── Color maps ─────────────────────────────────────────────────────────────

const DIR_COLOR: Record<DirectorateId, string> = {
  NAVSEA: 'var(--color-navsea)',
  AIRCOM: 'var(--color-aircom)',
  MARFOR: 'var(--color-marfor)',
  SPACECY: 'var(--color-spacecy)',
  TRANSCOM: 'var(--color-transcom)',
};

// Hex values for SVG fills (CSS vars don't work in SVG fill attribute directly)
const DIR_HEX: Record<DirectorateId, string> = {
  NAVSEA: '#34d399',
  AIRCOM: '#60a5fa',
  MARFOR: '#f59e0b',
  SPACECY: '#a78bfa',
  TRANSCOM: '#94a3b8',
};

// ── Theater zone geometry ──────────────────────────────────────────────────

interface ZoneDef {
  points: string;
  labelX: number;
  labelY: number;
  centroidX: number;
  centroidY: number;
  labelAnchor?: 'middle' | 'start' | 'end';
}

// viewBox: 0 0 1000 500
const ZONES: Record<Exclude<TheaterId, 'spaceCyber'>, ZoneDef> = {
  arctic: {
    points: '0,0 1000,0 1000,88 0,88',
    labelX: 500, labelY: 56,
    centroidX: 500, centroidY: 44,
  },
  homeland: {
    points: '15,88 278,88 272,175 255,365 228,462 40,468 15,340',
    labelX: 152, labelY: 148,
    centroidX: 162, centroidY: 285,
  },
  northAtlantic: {
    points: '278,88 496,82 516,195 506,385 272,375 272,175',
    labelX: 392, labelY: 145,
    centroidX: 392, centroidY: 245,
  },
  middleEast: {
    points: '516,148 712,136 732,440 492,445 506,285',
    labelX: 614, labelY: 182,
    centroidX: 614, centroidY: 302,
  },
  indoPacific: {
    points: '712,88 1000,88 1000,468 712,468',
    labelX: 856, labelY: 148,
    centroidX: 856, centroidY: 288,
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────

function getLeader(
  gameState: GameState,
  theaterId: TheaterId
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

// ── Tooltip content ────────────────────────────────────────────────────────

function TheaterTooltip({
  theaterId,
  gameState,
  humanPlayerId,
  pos,
}: {
  theaterId: TheaterId;
  gameState: GameState;
  humanPlayerId: string;
  pos: { x: number; y: number };
}) {
  const name = THEATER_NAMES[theaterId];
  const entries = gameState.turnOrder.map(pid => {
    const p = gameState.players[pid];
    const pr = p.theaterPresence[theaterId];
    const str = calcStrength(pr);
    return { pid, name: p.name, directorate: p.directorate as DirectorateId, pr, str };
  }).sort((a, b) => b.str - a.str);

  const flipX = pos.x > 75;
  const flipY = pos.y > 60;

  return (
    <div
      className={styles.tooltip}
      style={{
        left: flipX ? undefined : `${pos.x}%`,
        right: flipX ? `${100 - pos.x}%` : undefined,
        top: flipY ? undefined : `${pos.y}%`,
        bottom: flipY ? `${100 - pos.y}%` : undefined,
      }}
    >
      <div className={styles.tooltipTitle}>{name}</div>
      {entries.map(e => (
        <div key={e.pid} className={styles.tooltipRow} style={{ '--dir-color': DIR_COLOR[e.directorate] } as React.CSSProperties}>
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

// ── Grid lines ─────────────────────────────────────────────────────────────

function GridLines() {
  const lines: React.ReactNode[] = [];
  for (let x = 0; x <= 1000; x += 50) {
    lines.push(
      <line key={`v${x}`} x1={x} y1={0} x2={x} y2={500}
        stroke="rgba(255,255,255,0.035)" strokeWidth="0.8" />
    );
  }
  for (let y = 0; y <= 500; y += 50) {
    lines.push(
      <line key={`h${y}`} x1={0} y1={y} x2={1000} y2={y}
        stroke="rgba(255,255,255,0.035)" strokeWidth="0.8" />
    );
  }
  return <g>{lines}</g>;
}

// ── Continent decoration ───────────────────────────────────────────────────

function ContinentDecor() {
  return (
    <g opacity="0.07" fill="rgba(200,220,255,0.5)" stroke="rgba(200,220,255,0.6)" strokeWidth="0.8">
      {/* North America */}
      <path d="M30,90 L195,90 L235,115 L260,155 L270,210 L265,295 L242,375
               L205,435 L165,460 L110,455 L60,415 L32,345 L18,225 Z" />
      {/* South America */}
      <path d="M175,310 L250,298 L278,370 L262,470 L215,500 L170,488
               L153,432 L150,358 Z" />
      {/* Europe */}
      <path d="M370,88 L490,84 L504,128 L492,172 L460,188 L418,182
               L386,152 L368,118 Z" />
      {/* Africa */}
      <path d="M398,192 L524,180 L542,234 L548,302 L530,395 L482,452
               L420,450 L378,398 L368,298 L378,228 Z" />
      {/* Middle East / Arabian Peninsula */}
      <path d="M540,182 L652,172 L682,252 L652,314 L592,322 L542,272 Z" />
      {/* Asia (simplified) */}
      <path d="M620,88 L782,88 L844,128 L872,202 L850,282 L800,332
               L730,342 L680,292 L652,202 L632,130 Z" />
      {/* Australia */}
      <path d="M812,362 L912,352 L942,402 L922,442 L840,452 L808,412 Z" />
    </g>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

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

  const handleEnter = (tid: TheaterId, e: React.MouseEvent) => {
    setHovered(tid);
    updateTooltipPos(e);
  };

  const updateTooltipPos = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTooltipPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const handleLeave = () => setHovered(null);

  // Space & Cyber badges
  const spaceBadges = getBadges(gameState, 'spaceCyber', humanPlayerId);
  const spaceLeader = getLeader(gameState, 'spaceCyber');

  return (
    <div className={styles.container} ref={containerRef}>
      <svg
        viewBox="0 0 1000 500"
        className={styles.svg}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background */}
        <rect width="1000" height="500" fill="#070a10" />

        {/* Grid */}
        <GridLines />

        {/* Continent decoration */}
        <ContinentDecor />

        {/* Theater zones */}
        {(Object.entries(ZONES) as [Exclude<TheaterId, 'spaceCyber'>, ZoneDef][]).map(([tid, zone]) => {
          const leader = getLeader(gameState, tid);
          const isHovered = hovered === tid;
          const fillHex = leader ? DIR_HEX[leader.directorate] : '#4a5580';
          const badges = getBadges(gameState, tid, humanPlayerId);

          return (
            <g key={tid}>
              <polygon
                points={zone.points}
                fill={fillHex}
                fillOpacity={isHovered ? 0.14 : 0.07}
                stroke={fillHex}
                strokeOpacity={isHovered ? 0.55 : 0.22}
                strokeWidth={isHovered ? 1.5 : 1}
                className={styles.zone}
                onMouseEnter={e => handleEnter(tid, e)}
                onMouseMove={updateTooltipPos}
                onMouseLeave={handleLeave}
              />

              {/* Theater label */}
              <text
                x={zone.labelX}
                y={zone.labelY}
                textAnchor={zone.labelAnchor ?? 'middle'}
                className={styles.zoneLabel}
                fill={isHovered ? fillHex : 'rgba(232,236,244,0.55)'}
                style={{ pointerEvents: 'none' }}
              >
                {THEATER_NAMES[tid].toUpperCase()}
              </text>

              {/* Presence badges at centroid */}
              {badges.filter(b => b.strength > 0).map((badge, i, arr) => {
                const r = Math.min(4 + badge.strength * 1.2, 11);
                const totalW = arr.filter(b => b.strength > 0).length;
                const offsetX = (i - (totalW - 1) / 2) * (r * 2 + 4);
                const isLeader = i === 0 && arr[0].strength > (arr[1]?.strength ?? -1);
                return (
                  <g key={badge.playerId} style={{ pointerEvents: 'none' }}>
                    <circle
                      cx={zone.centroidX + offsetX}
                      cy={zone.centroidY + 22}
                      r={r}
                      fill={DIR_HEX[badge.directorate]}
                      opacity={0.88}
                      className={isLeader ? styles.leaderBadge : undefined}
                    />
                    {badge.isHuman && (
                      <circle
                        cx={zone.centroidX + offsetX}
                        cy={zone.centroidY + 22}
                        r={r + 2.5}
                        fill="none"
                        stroke={DIR_HEX[badge.directorate]}
                        strokeWidth="1"
                        opacity={0.5}
                      />
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Space & Cyber — abstract domain panel at bottom */}
        <g>
          <rect
            x="10" y="478" width="980" height="20"
            fill={spaceLeader ? DIR_HEX[spaceLeader.directorate] : '#4a5580'}
            fillOpacity={hovered === 'spaceCyber' ? 0.14 : 0.07}
            stroke={spaceLeader ? DIR_HEX[spaceLeader.directorate] : '#4a5580'}
            strokeOpacity={hovered === 'spaceCyber' ? 0.55 : 0.22}
            strokeWidth="1"
            strokeDasharray="6 3"
            rx="2"
            className={styles.zone}
            onMouseEnter={e => handleEnter('spaceCyber', e)}
            onMouseMove={updateTooltipPos}
            onMouseLeave={handleLeave}
          />
          <text x="500" y="491.5" textAnchor="middle"
            className={styles.zoneLabel}
            fill={hovered === 'spaceCyber'
              ? (spaceLeader ? DIR_HEX[spaceLeader.directorate] : '#4a5580')
              : 'rgba(232,236,244,0.45)'}
            style={{ pointerEvents: 'none' }}
          >
            SPACE &amp; CYBER DOMAIN
          </text>
          {/* Space & Cyber badges */}
          {spaceBadges.filter(b => b.strength > 0).map((badge, i, arr) => {
            const r = Math.min(4 + badge.strength * 1.2, 9);
            const offsetX = (i - (arr.filter(b => b.strength > 0).length - 1) / 2) * (r * 2 + 4);
            const isLeader = i === 0 && arr[0].strength > (arr[1]?.strength ?? -1);
            return (
              <circle
                key={badge.playerId}
                cx={500 + offsetX}
                cy={488}
                r={r}
                fill={DIR_HEX[badge.directorate]}
                opacity={0.88}
                className={isLeader ? styles.leaderBadge : undefined}
                style={{ pointerEvents: 'none' }}
              />
            );
          })}
        </g>

        {/* Scanline overlay */}
        <rect width="1000" height="500"
          fill="url(#scanlines)"
          style={{ pointerEvents: 'none' }}
        />
        <defs>
          <pattern id="scanlines" width="1" height="3" patternUnits="userSpaceOnUse">
            <rect width="1" height="1" y="0" fill="rgba(0,0,0,0.18)" />
            <rect width="1" height="2" y="1" fill="transparent" />
          </pattern>
        </defs>
      </svg>

      {/* Tooltip */}
      {hovered && (
        <TheaterTooltip
          theaterId={hovered}
          gameState={gameState}
          humanPlayerId={humanPlayerId}
          pos={tooltipPos}
        />
      )}
    </div>
  );
}
