import React from 'react';
import type { BudgetLine, SecondaryResource } from '@fp/shared';
import { resourceColor } from '../components/ui/ResourceToken';

/**
 * Colorize resource references in description/effect text.
 * Matches optional sign+number prefix and renders compactly: "+2U", "1M", "2PC".
 * Word boundaries on both sides prevent false matches inside words (e.g. "SI", "Intel").
 */
export function colorizeDesc(text: string): React.ReactNode {
  // Two alternations:
  //   [1] SI references: optional sign+number then " SI" as a whole word
  //   [2] resource codes: optional sign+number then a single-letter/PC code
  // SI must come first so the "S" in "SI" isn't consumed as a resource code.
  // Use (?<![a-zA-Z]) before code so "1S"/"+1S" still matches,
  // (?![a-zA-Z]) after to prevent matching inside words like "SUSTAIN".
  const TOKEN_RE = /([+-]?\d+\s*SI\b)|([+-]?\d+\s*)?(?<![a-zA-Z])(PC|[ASEXUMLI])(?![a-zA-Z])/g;
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = TOKEN_RE.exec(text)) !== null) {
    if (m[1] !== undefined) {
      // SI match
      if (m.index > last) nodes.push(text.slice(last, m.index));
      nodes.push(
        <span key={m.index} style={{ color: 'var(--color-si)', fontWeight: 800, letterSpacing: '0.02em' }}>
          {m[1]}
        </span>
      );
      last = m.index + m[0].length;
    } else {
      // Resource code match
      const code = m[3] as BudgetLine | SecondaryResource;
      const color = resourceColor(code);
      if (!color) continue;
      if (m.index > last) nodes.push(text.slice(last, m.index));
      const prefix = (m[2] ?? '').trim();
      nodes.push(
        <span key={m.index} style={{ color, fontWeight: 800, letterSpacing: '0.02em' }}>
          {prefix}{m[3]}
        </span>
      );
      last = m.index + m[0].length;
    }
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}
