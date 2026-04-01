import type { BudgetLine, SecondaryResource } from '@fp/shared';
import { DomainIcon } from './SubtagIcon';

type ResourceKey = BudgetLine | SecondaryResource;

interface ResourceIconProps {
  resource: ResourceKey;
  size?: number;
  colored?: boolean;
  className?: string;
}

// Icons for secondary resources + Sustain budget line
// 20×20 viewBox, fill-only, readable at 10–16px

function SustainSvg({ size, className }: { size: number; className?: string }) {
  // Circular arrows: resupply / sustainment loop
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="currentColor" className={className} aria-hidden="true">
      <path fillRule="evenodd" d="M10 3a7 7 0 0 1 6.33 4h-2.1A5 5 0 1 0 15 10h2a7 7 0 1 1-7-7z"/>
      <path d="M17 6V2l-4 4 4 4V6z"/>
    </svg>
  );
}

function ManpowerSvg({ size, className }: { size: number; className?: string }) {
  // Person silhouette
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="currentColor" className={className} aria-hidden="true">
      <circle cx="10" cy="5" r="3"/>
      <path d="M4 18c0-4 2.5-7 6-7s6 3 6 7H4z"/>
    </svg>
  );
}

function LogisticsSvg({ size, className }: { size: number; className?: string }) {
  // Cargo container with forward arrow
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="currentColor" className={className} aria-hidden="true">
      <rect x="1" y="6" width="13" height="8" rx="1"/>
      <path d="M14 9h3l2 2-2 2h-3V9z"/>
      <circle cx="4" cy="16" r="1.5"/>
      <circle cx="10" cy="16" r="1.5"/>
    </svg>
  );
}

function IntelSvg({ size, className }: { size: number; className?: string }) {
  // Concentric radar rings with center dot
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="currentColor" className={className} aria-hidden="true">
      <path fillRule="evenodd" d="M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm0-3a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0-3a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
      <rect x="9.5" y="1" width="1" height="3"/>
      <rect x="9.5" y="16" width="1" height="3"/>
      <rect x="1" y="9.5" width="3" height="1"/>
      <rect x="16" y="9.5" width="3" height="1"/>
    </svg>
  );
}

function PolCapSvg({ size, className }: { size: number; className?: string }) {
  // Handshake (political agreement)
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="currentColor" className={className} aria-hidden="true">
      <path d="M2 9 L6 7 L8 8 L8 11 L9 12 L7 13 L5 12 L2 13 Z"/>
      <path d="M18 9 L14 7 L12 8 L12 11 L11 12 L13 13 L15 12 L18 13 Z"/>
      <path d="M8 8 L12 8 L12 12 L8 12 Z"/>
      <rect x="1" y="12.5" width="6" height="1.5" rx="0.5"/>
      <rect x="13" y="12.5" width="6" height="1.5" rx="0.5"/>
    </svg>
  );
}

// Domain key for budget lines (used by DomainIcon)
const BUDGET_DOMAIN: Record<BudgetLine, 'AIR' | 'SEA' | 'EXP' | 'SPACE_CYBER' | null> = {
  A: 'AIR',
  S: 'SEA',
  E: 'EXP',
  X: 'SPACE_CYBER',
  U: null, // handled separately
};

export function ResourceIcon({ resource, size = 14, colored = false, className }: ResourceIconProps) {
  // Budget lines A/S/E/X reuse DomainIcon
  if (resource === 'A' || resource === 'S' || resource === 'E' || resource === 'X') {
    const domain = BUDGET_DOMAIN[resource]!;
    return <DomainIcon domain={domain} size={size} colored={colored} className={className} />;
  }

  // All other icons use currentColor (or colored via CSS variable on parent)
  const props = { size, className };
  switch (resource) {
    case 'U':  return <SustainSvg {...props} />;
    case 'M':  return <ManpowerSvg {...props} />;
    case 'L':  return <LogisticsSvg {...props} />;
    case 'I':  return <IntelSvg {...props} />;
    case 'PC': return <PolCapSvg {...props} />;
    default:   return null;
  }
}
