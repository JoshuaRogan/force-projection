import React from 'react';
import type { BudgetLine, SecondaryResource } from '@fp/shared';
import { resourceColor } from '../components/ui/ResourceToken';

/**
 * Colorize resource references in description/effect text.
 * Matches optional sign+number prefix and renders compactly: "+2U", "1M", "2PC".
 * Also highlights bare "SI" (victory points) and "5 SI" style counts.
 * Word boundaries prevent false matches inside words (e.g. "SIX", "Intel").
 */
export function colorizeDesc(text: string): React.ReactNode {
  // Order matters:
  //   [1] optional sign+number then SI (e.g. "+1 SI", "3 SI")
  //   [2] bare SI (not the S in SEA codes — (?![a-zA-Z]) blocks "SIX")
  //   [3] resource codes: optional sign+number then PC | A S E X U M L I
  // Use (?<![a-zA-Z]) before single-letter codes so "1S"/"+1S" still matches,
  // (?![a-zA-Z]) after to prevent matching inside words like "SUSTAIN".
  const TOKEN_RE =
    /([+-]?\d+\s*SI\b)|(?<![a-zA-Z])(SI)(?![a-zA-Z])|([+-]?\d+\s*)?(?<![a-zA-Z])(PC|[ASEXUMLI])(?![a-zA-Z])/g;
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = TOKEN_RE.exec(text)) !== null) {
    if (m[1] !== undefined) {
      // Number + SI
      if (m.index > last) nodes.push(text.slice(last, m.index));
      nodes.push(
        <span key={m.index} style={{ color: 'var(--color-si)', fontWeight: 800, letterSpacing: '0.02em' }}>
          {m[1]}
        </span>
      );
      last = m.index + m[0].length;
    } else if (m[2] !== undefined) {
      // Bare SI
      if (m.index > last) nodes.push(text.slice(last, m.index));
      nodes.push(
        <span key={m.index} style={{ color: 'var(--color-si)', fontWeight: 800, letterSpacing: '0.02em' }}>
          {m[2]}
        </span>
      );
      last = m.index + m[0].length;
    } else {
      // Resource code match
      const code = m[4] as BudgetLine | SecondaryResource;
      const color = resourceColor(code);
      if (!color) continue;
      if (m.index > last) nodes.push(text.slice(last, m.index));
      const prefix = (m[3] ?? '').trim();
      nodes.push(
        <span key={m.index} style={{ color, fontWeight: 800, letterSpacing: '0.02em' }}>
          {prefix}{m[4]}
        </span>
      );
      last = m.index + m[0].length;
    }
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}
