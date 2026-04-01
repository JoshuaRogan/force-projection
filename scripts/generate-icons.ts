/**
 * Generates SVG icon elements for all 15 program subtags + 4 domain icons
 * using Gemini. Output is a preview HTML page and a paste-ready TypeScript
 * snippet for SubtagIcon.tsx.
 *
 * Usage:
 *   npx tsx scripts/generate-icons.ts [options]
 *
 * Options:
 *   --resume           Skip subtags that already have output saved to disk
 *   --only Fighter,Sub Only regenerate these specific subtags (comma-separated)
 *   --delay 3000       Delay between API calls in ms (default: 2500)
 */

import * as fs from 'fs';
import * as path from 'path';
import { getClient, ENRICHMENT_MODEL, sleep, parseArgs } from './card-art/utils';

// ── Output paths ───────────────────────────────────────────────────────────

const OUT_DIR = path.resolve(__dirname, 'icon-output');
const JSON_PATH = path.join(OUT_DIR, 'icons.json');
const PREVIEW_PATH = path.join(OUT_DIR, 'preview.html');
const COMPONENT_PATH = path.join(OUT_DIR, 'SubtagIconContent.tsx');

// ── Icon specs ─────────────────────────────────────────────────────────────

interface IconSpec {
  id: string;
  label: string;
  domain: 'AIR' | 'SEA' | 'EXP' | 'SPACE_CYBER' | 'CROSS' | 'DOMAIN';
  visual: string; // what to draw — plain English, very specific
  style: string;  // compositional guidance (silhouette style, perspective)
}

const SUBTAG_SPECS: IconSpec[] = [
  // ── AIR ───────────────────────────────────────────────────────────────────
  {
    id: 'Fighter',
    label: 'Fighter',
    domain: 'AIR',
    visual:
      'A supersonic fighter jet in top-down plan view. Narrow pointed nose at top center. Two sharply swept delta wings angling back at ~50°. Narrow twin-engine exhausts at the bottom. The overall silhouette is a long narrow arrowhead with swept-back fins.',
    style:
      'Top-down (plan view) aircraft silhouette. The shape should be clearly narrower and more dart-like than a bomber.',
  },
  {
    id: 'Bomber',
    label: 'Bomber',
    domain: 'AIR',
    visual:
      'A stealth flying-wing bomber (B-2 style) in top-down plan view. Very wide — roughly 3× wider than tall. Smoothly blended, no distinct fuselage. The leading edge is a gentle sweep, the trailing edge is a jagged W-shape or gentle zigzag. No separate tail fins.',
    style:
      'Top-down plan view. Must look obviously wider and flatter than the Fighter. The flying-wing outline is the distinctive feature.',
  },
  {
    id: 'Transport',
    label: 'Transport',
    domain: 'AIR',
    visual:
      'A large military cargo aircraft (C-17 style) in top-down plan view. Very boxy rectangular fuselage body running top-to-bottom. Straight high-mounted wings extending left and right at 90°. T-shaped when seen from above (cross or plus shape with a longer vertical bar).',
    style:
      'Top-down plan view. The straight perpendicular wings are the key distinguisher from Fighter and Bomber.',
  },

  // ── SEA ───────────────────────────────────────────────────────────────────
  {
    id: 'Carrier',
    label: 'Carrier',
    domain: 'SEA',
    visual:
      'Aircraft carrier from directly above — HORIZONTAL ORIENTATION. The deck runs LEFT to RIGHT across the icon (wide, not tall). A wide, flat rectangle spanning most of the width (x: 1 to 19, y: 7 to 14). The LEFT bow end is angled (cut at a diagonal). A small rectangular island superstructure sits on the TOP edge near the right end (about x:13-17, y:5-7).',
    style:
      'CRITICAL: The long axis runs HORIZONTALLY (left-right). Width must be much greater than height. The island tower is a small protrusion on the top edge near the right end.',
  },
  {
    id: 'Sub',
    label: 'Sub',
    domain: 'SEA',
    visual:
      'A submarine in side (profile) view. A long tapered cigar/torpedo shape: rounded bow on the left, tapered stern on the right. A small rectangular conning tower (sail) on the top center, about 1/6 the hull length. Optionally a small fin at the stern.',
    style:
      'Side profile view. The smooth oval hull with the protruding conning tower on top is the defining feature.',
  },
  {
    id: 'Surface',
    label: 'Surface',
    domain: 'SEA',
    visual:
      'A destroyer/frigate in side (profile) view. A tapered hull shape (wider in the middle, tapers at bow and stern). A prominent gun turret circle on the forward deck. A radar mast tower at mid-ship.',
    style:
      'Side profile view. The hull + turret combination distinguishes this from the Sub.',
  },
  {
    id: 'Capital',
    label: 'Capital',
    domain: 'SEA',
    visual:
      'A battleship in side (profile) view. A wide, deep hull — noticeably wider/taller than the destroyer. Two or three large circular gun turrets visible along the top edge. A tall superstructure/bridge in the center.',
    style:
      'Side profile view. More massive and wide than Surface. Multiple turrets are the key recognition feature.',
  },

  // ── EXP ───────────────────────────────────────────────────────────────────
  {
    id: 'Marine',
    label: 'Marine',
    domain: 'EXP',
    visual:
      'A military parachutist. Use ONLY filled solid shapes — NO open line paths (they are invisible). A filled dome/semicircle for the parachute canopy at the top (fill the arc shape solid, not just an outline). Below the dome, a small filled circle for the figure body. Use filled triangles or trapezoids connecting the dome to the body (the suspension lines as filled wedge shapes).',
    style:
      'CRITICAL: Every element must be a FILLED CLOSED SHAPE (not open lines). The dome should be a filled solid half-circle or filled arc segment, not a stroke outline.',
  },
  {
    id: 'SOF',
    label: 'SOF',
    domain: 'EXP',
    visual:
      'A precision targeting crosshair/reticle. A circle with four tick marks at 12, 3, 6, and 9 o\'clock positions extending outward from the ring. A small filled dot at the exact center. The circle should be about 70% of the icon width.',
    style:
      'Pure geometric symbol. The gaps between the ring and the tick marks are essential — they should be clearly separated, not touching.',
  },
  {
    id: 'Ops',
    label: 'Ops',
    domain: 'EXP',
    visual:
      'A military operations target/scope reticle. Two concentric circles (outer ring and inner ring). Four short tick marks at compass points between the rings and outside the outer ring. A small solid circle at center.',
    style:
      'Similar to SOF but with two rings. The double-ring structure makes it distinct from the single-ring SOF crosshair.',
  },

  // ── SPACE_CYBER ───────────────────────────────────────────────────────────
  {
    id: 'Space',
    label: 'Space',
    domain: 'SPACE_CYBER',
    visual:
      'A military reconnaissance satellite. A rectangular central body in the middle. Two wide, flat rectangular solar panel arrays extending left and right (like wings). A short antenna or dish extending from the top center of the body.',
    style:
      'The three-part satellite form (panel — body — panel) with a central antenna is the key silhouette.',
  },
  {
    id: 'Cyber',
    label: 'Cyber',
    domain: 'SPACE_CYBER',
    visual:
      'A cybersecurity shield with a padlock. A solid filled shield shape (tall pentagon / heraldic shield outline). Inside the shield\'s lower half, a simple rectangular padlock body with a small shackle arc on top.',
    style:
      'The shield silhouette with the lock cutout inside it. The lock body should be visually distinct inside the shield.',
  },
  {
    id: 'Network',
    label: 'Network',
    domain: 'SPACE_CYBER',
    visual:
      'Three network nodes connected in a triangle. Three large filled circles (radius 2.5): one at top-center (cx=10, cy=3.5), one at bottom-left (cx=3.5, cy=16), one at bottom-right (cx=16.5, cy=16). Connecting the three pairs with thick FILLED diamond/rhombus shapes or thick filled rectangles (not open paths) representing the network links.',
    style:
      'CRITICAL: Nodes must be large circles (r=2.5+), and connection lines must be thick filled shapes (width 2+), not open paths. At 12px the nodes must be clearly distinct dots.',
  },
  {
    id: 'Classified',
    label: 'Classified',
    domain: 'CROSS',
    visual:
      'A closed eye with a diagonal slash. An almond/lens eye shape (closed — just the outline, no open pupil). A bold diagonal line crossing through the entire icon from bottom-left to top-right, like a "forbidden" slash.',
    style:
      'The combination of the eye shape AND the slash crossing it makes this instantly read as "hidden/secret".',
  },

  // ── Non-platform ──────────────────────────────────────────────────────────
  {
    id: 'Industry',
    label: 'Industry',
    domain: 'CROSS',
    visual:
      'A mechanical gear / cog wheel. 6 to 8 rectangular teeth extending outward around a central circle. A smaller circle hole (cutout) at the center. The teeth should be clearly visible as rectangular protrusions.',
    style:
      'Classic gear cog silhouette. The rectangular teeth evenly spaced around the ring, with a center hole.',
  },
  {
    id: 'Doctrine',
    label: 'Doctrine',
    domain: 'CROSS',
    visual:
      'An open book seen at a slight angle. Two filled rectangular pages meeting at a center spine. The left page angles slightly left, the right page angles slightly right. The center spine is a visible vertical gap or thin strip between the pages.',
    style:
      'The open book split at the spine. The two trapezoidal pages should be clearly distinct left and right shapes.',
  },
  {
    id: 'Politics',
    label: 'Politics',
    domain: 'CROSS',
    visual:
      'Two hands in a handshake, seen from the front. Two simplified hand/fist shapes clasped together in the center of the icon. The wrists/arms extend to the left and right edges.',
    style:
      'The clasped-hands silhouette should read as "agreement/alliance" even at 12px.',
  },
];

const DOMAIN_SPECS: IconSpec[] = [
  {
    id: 'AIR',
    label: 'AIR Domain',
    domain: 'DOMAIN',
    visual: 'A bold upward-pointing chevron or arrowhead — the universal aviation symbol. A thick V-shape pointing upward.',
    style: 'Simple, bold, unmistakably "up/flight".',
  },
  {
    id: 'SEA',
    label: 'SEA Domain',
    domain: 'DOMAIN',
    visual: 'A bold wave or anchor symbol. Three undulating lines stacked vertically suggesting ocean waves, each line curving up-down-up.',
    style: 'Classic wave silhouette. Should read as "ocean" immediately.',
  },
  {
    id: 'EXP',
    label: 'EXP Domain',
    domain: 'DOMAIN',
    visual: 'A five-pointed military star. Bold, solid fill, centered in the 20×20 space.',
    style: 'Simple solid star — the universal military unit symbol.',
  },
  {
    id: 'SPACE_CYBER',
    label: 'SPACE_CYBER Domain',
    domain: 'DOMAIN',
    visual: 'A stylized orbit symbol: one or two elliptical orbital rings around a central filled circle (planet/node). The rings should be visible as outlines, slightly tilted relative to each other.',
    style: 'Classic orbit/space symbol. The tilted elliptical rings around a center point.',
  },
];

const ALL_SPECS = [...SUBTAG_SPECS, ...DOMAIN_SPECS];

// ── Domain colors (must match CSS vars in the client) ──────────────────────

const DOMAIN_HEX: Record<string, string> = {
  AIR:         '#60a5fa',
  SEA:         '#34d399',
  EXP:         '#f59e0b',
  SPACE_CYBER: '#a78bfa',
  CROSS:       '#f59e0b', // uses --color-si (amber)
  DOMAIN:      '#e8ecf4',
};

// ── Prompt builder ─────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert SVG icon designer specializing in compact military/defense icons for UI use.
Your icons must be immediately recognizable silhouettes that work at 12-16 pixels rendered size.

Rules:
- Coordinate space: viewBox "0 0 20 20" (x: 0-20, y: 0-20)
- Maximum 5 SVG elements total (path, rect, circle, ellipse only)
- Use fill="currentColor" on every element — do NOT use stroke attributes at all
- All shapes must be at minimum 2 units wide/tall to survive anti-aliasing at 12px
- Use bold, filled shapes rather than outlines — filled silhouettes are more legible at small sizes
- Do NOT output: <svg> tags, XML declarations, markdown code fences, comments, or any explanation
- Output ONLY the raw SVG elements, nothing else

Technique for "outline rings" without stroke:
- Instead of stroke, use two filled shapes: an outer shape and a slightly smaller inner shape using fill="none" → WRONG
- Correct technique: use CSS evenodd fill rule with nested paths to create filled rings:
  <path fill-rule="evenodd" fill="currentColor" d="[outer shape] [inner shape reversed]" />`;

function buildPrompt(spec: IconSpec): string {
  return `Design a military UI icon for: ${spec.label}

WHAT TO DRAW:
${spec.visual}

COMPOSITIONAL GUIDANCE:
${spec.style}

IMPORTANT: Use bold filled shapes. No strokes. Max 5 elements. 20×20 coordinate space. Output only SVG elements.`;
}

// ── SVG parser ─────────────────────────────────────────────────────────────

function extractSvgElements(raw: string): string {
  // Strip markdown code fences if present
  let cleaned = raw
    .replace(/```[a-z]*\n?/gi, '')
    .replace(/```/g, '')
    .trim();

  // Strip any <svg ...> wrapper
  cleaned = cleaned
    .replace(/<svg[^>]*>/gi, '')
    .replace(/<\/svg>/gi, '')
    .trim();

  // Strip XML declaration
  cleaned = cleaned.replace(/<\?xml[^?]*\?>/g, '').trim();

  return cleaned;
}

// ── Preview HTML generator ─────────────────────────────────────────────────

function buildPreviewHtml(icons: Record<string, string>): string {
  const rows = ALL_SPECS.map(spec => {
    const svg = icons[spec.id] ?? '<circle cx="10" cy="10" r="5" fill="red" />';
    const color = DOMAIN_HEX[spec.domain];

    const sizes = [12, 16, 24, 48].map(s => `
      <div style="display:flex;flex-direction:column;align-items:center;gap:3px">
        <svg viewBox="0 0 20 20" width="${s}" height="${s}" fill="${color}" style="display:block">
          ${svg}
        </svg>
        <span style="font-size:8px;color:#666">${s}px</span>
      </div>`).join('');

    return `
    <div style="display:flex;align-items:center;gap:16px;padding:10px 12px;border-bottom:1px solid #1e2a3a">
      <div style="width:80px;font-size:11px;font-family:monospace;color:#a0b0c0">${spec.id}</div>
      <div style="width:64px;font-size:9px;font-family:monospace;color:${color};text-transform:uppercase;letter-spacing:0.08em">${spec.domain}</div>
      <div style="display:flex;gap:20px;align-items:flex-end">${sizes}</div>
      <div style="flex:1;font-size:10px;font-family:monospace;color:#4a5a6a;word-break:break-all;max-width:500px">${svg.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Icon Preview</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #060d16; color: #e8ecf4; font-family: system-ui, sans-serif; }
    h1 { padding: 16px; font-size: 14px; font-family: monospace; color: #60a5fa; border-bottom: 1px solid #1e2a3a; }
    .note { padding: 8px 12px; font-size: 11px; color: #6b7280; border-bottom: 1px solid #1e2a3a; }
  </style>
</head>
<body>
  <h1>// FORCE PROJECTION — Icon Preview — ${new Date().toISOString()}</h1>
  <div class="note">Colors shown are domain colors. Reload after re-running the script.</div>
  ${rows}
</body>
</html>`;
}

// ── Component output generator ─────────────────────────────────────────────

function buildComponentOutput(icons: Record<string, string>): string {
  const subtags = SUBTAG_SPECS.map(s => {
    const svg = icons[s.id] ?? `<circle cx="10" cy="10" r="5" />`;
    return `  ${s.id}: () => (\n    <>\n      ${svg}\n    </>\n  ),`;
  }).join('\n');

  const domains = DOMAIN_SPECS.map(s => {
    const svg = icons[s.id] ?? `<circle cx="10" cy="10" r="5" />`;
    return `  ${s.id}: () => (\n    <>\n      ${svg}\n    </>\n  ),`;
  }).join('\n');

  return `// Generated by scripts/generate-icons.ts — ${new Date().toISOString()}
// Paste SUBTAG_CONTENT and DOMAIN_CONTENT into SubtagIcon.tsx

const SUBTAG_CONTENT: Record<ProgramSubtag, () => React.ReactElement> = {
${subtags}
};

const DOMAIN_CONTENT: Record<ProgramDomain, () => React.ReactElement> = {
${domains}
};
`;
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs();
  const resume = args.resume === 'true';
  const delayMs = parseInt(args.delay ?? '2500', 10);
  const onlySet = args.only ? new Set(args.only.split(',').map(s => s.trim())) : null;

  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Load existing results if resuming
  let saved: Record<string, string> = {};
  if (resume && fs.existsSync(JSON_PATH)) {
    saved = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    console.log(`Resuming — ${Object.keys(saved).length} icons already saved`);
  }

  const ai = getClient();
  let generated = 0;
  let skipped = 0;
  let failed = 0;

  const specs = onlySet
    ? ALL_SPECS.filter(s => onlySet.has(s.id))
    : ALL_SPECS;

  for (const spec of specs) {
    if (resume && saved[spec.id]) {
      console.log(`  skip  ${spec.id} (already done)`);
      skipped++;
      continue;
    }

    process.stdout.write(`  gen   ${spec.id.padEnd(14)} `);

    try {
      const response = await ai.models.generateContent({
        model: ENRICHMENT_MODEL,
        contents: buildPrompt(spec),
        config: { systemInstruction: SYSTEM_PROMPT } as any,
      });

      const raw = (response as any).candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      if (!raw) {
        console.log('EMPTY RESPONSE');
        failed++;
        continue;
      }

      const elements = extractSvgElements(raw);
      saved[spec.id] = elements;

      // Write incrementally so crashes don't lose progress
      fs.writeFileSync(JSON_PATH, JSON.stringify(saved, null, 2));
      console.log(`✓  (${elements.length} chars)`);
      generated++;
    } catch (err: any) {
      console.log(`✗  ${err.message}`);
      failed++;
    }

    if (generated > 0 || failed > 0) {
      await sleep(delayMs);
    }
  }

  // Build outputs
  console.log('\nBuilding preview and component output...');
  fs.writeFileSync(PREVIEW_PATH, buildPreviewHtml(saved));
  fs.writeFileSync(COMPONENT_PATH, buildComponentOutput(saved));

  console.log(`
Done.
  Generated: ${generated}
  Skipped:   ${skipped}
  Failed:    ${failed}

  Preview:   scripts/icon-output/preview.html
  Component: scripts/icon-output/SubtagIconContent.tsx
  Raw JSON:  scripts/icon-output/icons.json

Open preview.html in a browser to review. For any icons that need work,
run with --only IconName1,IconName2 to regenerate just those.

Once satisfied, copy the SUBTAG_CONTENT and DOMAIN_CONTENT blocks from
SubtagIconContent.tsx into packages/client/components/icons/SubtagIcon.tsx.
`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
