'use client';
import type { ContractRequirement, ProgramSubtag, ProgramDomain } from '@fp/shared';
import { SubtagIcon, DomainIcon } from './SubtagIcon';

interface IconProps {
  size?: number;
  className?: string;
}

// ── Generic requirement-type icons (20×20 fill="currentColor") ────────────────

function ReadinessIcon({ size, className }: IconProps) {
  // Gauge / meter: arc + needle + bars
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="currentColor" className={className} aria-hidden="true">
      {/* Gauge arc (half circle) */}
      <path fillRule="evenodd"
        d="M3 13 A7 7 0 0 1 17 13 L15.5 13 A5.5 5.5 0 0 0 4.5 13 Z" />
      {/* Tick marks */}
      <rect x="9.3" y="5.5" width="1.4" height="2.5" />
      <rect x="3.5" y="9.5" width="2.5" height="1.4" />
      <rect x="14" y="9.5" width="2.5" height="1.4" />
      {/* Needle pointing to 2/3 */}
      <path d="M10 13 L6.5 7.5 L8.5 8.5 Z" />
      {/* Center pivot */}
      <circle cx="10" cy="13" r="1.5" />
      {/* Base */}
      <rect x="3" y="13" width="14" height="1.5" rx="0.5" />
    </svg>
  );
}

function BaseIcon({ size, className }: IconProps) {
  // Flag on a post
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="currentColor" className={className} aria-hidden="true">
      {/* Pole */}
      <rect x="8.5" y="3" width="1.5" height="14" />
      {/* Flag */}
      <path d="M10 3.5 L17 6.5 L10 9 Z" />
      {/* Base platform */}
      <rect x="4" y="16" width="12" height="1.5" rx="0.5" />
      <rect x="7" y="17.5" width="6" height="1" rx="0.5" />
    </svg>
  );
}

function ForwardOpsIcon({ size, className }: IconProps) {
  // Radar dish pointing forward
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="currentColor" className={className} aria-hidden="true">
      {/* Dish arc */}
      <path fillRule="evenodd"
        d="M4 15 A8 8 0 0 1 16 15 L14.5 15 A6.5 6.5 0 0 0 5.5 15 Z" />
      {/* Dish stem */}
      <rect x="9.3" y="9.5" width="1.4" height="5.5" />
      {/* Receiver */}
      <circle cx="10" cy="9" r="1.5" />
      {/* Signal arcs */}
      <path fillRule="evenodd"
        d="M7 6 A4 4 0 0 1 13 6 L12 6.8 A2.8 2.8 0 0 0 8 6.8 Z" />
      <path fillRule="evenodd"
        d="M5 3.5 A6.5 6.5 0 0 1 15 3.5 L14.2 4.5 A5.2 5.2 0 0 0 5.8 4.5 Z" />
    </svg>
  );
}

function AllianceIcon({ size, className }: IconProps) {
  // Two clasped hands / handshake
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="currentColor" className={className} aria-hidden="true">
      {/* Left hand */}
      <path d="M2 9 L6 7 L8 8 L8 11 L9 12 L7 13 L5 12 L2 13 Z" />
      {/* Right hand */}
      <path d="M18 9 L14 7 L12 8 L12 11 L11 12 L13 13 L15 12 L18 13 Z" />
      {/* Clasped center */}
      <path d="M8 8 L12 8 L12 12 L8 12 Z" />
      {/* Arms */}
      <rect x="1" y="12.5" width="6" height="1.5" rx="0.5" />
      <rect x="13" y="12.5" width="6" height="1.5" rx="0.5" />
    </svg>
  );
}

function SustainIcon({ size, className }: IconProps) {
  // Circular arrows (resupply loop)
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="currentColor" className={className} aria-hidden="true">
      {/* Top-right arc with arrowhead */}
      <path d="M10 3 A7 7 0 0 1 17 10 L15.5 10 A5.5 5.5 0 0 0 10 4.5 Z" />
      <path d="M15.5 8 L18.5 10.5 L15 11.5 Z" />
      {/* Bottom-left arc with arrowhead */}
      <path d="M10 17 A7 7 0 0 1 3 10 L4.5 10 A5.5 5.5 0 0 0 10 15.5 Z" />
      <path d="M4.5 12 L1.5 9.5 L5 8.5 Z" />
    </svg>
  );
}

function TheaterPresenceIcon({ size, className }: IconProps) {
  // Globe with grid lines
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="currentColor" className={className} aria-hidden="true">
      {/* Globe outline ring */}
      <path fillRule="evenodd"
        d="M10 2 A8 8 0 0 0 10 18 A8 8 0 0 0 10 2 Z M10 3.8 A6.2 6.2 0 0 0 10 16.2 A6.2 6.2 0 0 0 10 3.8 Z" />
      {/* Vertical meridian */}
      <rect x="9.3" y="2" width="1.4" height="16" />
      {/* Horizontal equator */}
      <rect x="2" y="9.3" width="16" height="1.4" />
      {/* Latitude lines */}
      <path fillRule="evenodd"
        d="M5.5 6 A5.5 2 0 0 0 14.5 6 L14.5 7.2 A4.5 1.5 0 0 1 5.5 7.2 Z" />
      <path fillRule="evenodd"
        d="M5.5 14 A5.5 2 0 0 1 14.5 14 L14.5 12.8 A4.5 1.5 0 0 0 5.5 12.8 Z" />
    </svg>
  );
}

function StationIcon({ size, className }: IconProps) {
  // Military pin / location marker
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="currentColor" className={className} aria-hidden="true">
      {/* Pin teardrop */}
      <path fillRule="evenodd"
        d="M10 2 A5.5 5.5 0 0 0 4.5 7.5 C4.5 11.5 10 18 10 18 C10 18 15.5 11.5 15.5 7.5 A5.5 5.5 0 0 0 10 2 Z
           M10 5 A2.5 2.5 0 0 0 10 10 A2.5 2.5 0 0 0 10 5 Z" />
    </svg>
  );
}

function DomainCountIcon({ size, className }: IconProps) {
  // Stacked diamond shapes (multiple domains)
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="currentColor" className={className} aria-hidden="true">
      <path d="M10 2 L14 7 L10 10 L6 7 Z" />
      <path d="M10 8 L14 13 L10 16 L6 13 Z" opacity="0.7" />
      <path d="M10 14 L13 18 L10 20 L7 18 Z" opacity="0.4" />
    </svg>
  );
}

function CustomIcon({ size, className }: IconProps) {
  // Question mark
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 5 Q8 3 10 3 Q12 3 12 5 Q12 7 10 8.5 L10 11 L9 11 L9 8 Q11 7 11 5 Q11 4 10 4 Q9 4 9 5 Z" />
      <circle cx="9.5" cy="13" r="1.3" />
    </svg>
  );
}

// ── RequirementIcon ───────────────────────────────────────────────────────────

export function RequirementIcon({ req, size = 14, className }: { req: ContractRequirement } & IconProps) {
  const p = req.params as Record<string, unknown>;

  switch (req.type) {
    case 'activeProgramTag':
    case 'stationProgram': {
      if (p.subtag) return <SubtagIcon subtag={p.subtag as ProgramSubtag} size={size} className={className} />;
      if (p.domain) return <DomainIcon domain={p.domain as ProgramDomain} size={size} className={className} />;
      if (p.domainCount) return <DomainCountIcon size={size} className={className} />;
      return <StationIcon size={size} className={className} />;
    }
    case 'readinessThreshold':   return <ReadinessIcon size={size} className={className} />;
    case 'baseInTheater':        return <BaseIcon size={size} className={className} />;
    case 'forwardOpsInTheater':  return <ForwardOpsIcon size={size} className={className} />;
    case 'allianceCount':        return <AllianceIcon size={size} className={className} />;
    case 'sustainOrderCount':    return <SustainIcon size={size} className={className} />;
    case 'theaterPresence':      return <TheaterPresenceIcon size={size} className={className} />;
    case 'custom':               return <CustomIcon size={size} className={className} />;
    default:                     return <CustomIcon size={size} className={className} />;
  }
}
