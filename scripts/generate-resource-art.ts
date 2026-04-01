/**
 * Generates illustration art for each resource type (budget + secondary).
 * Images are saved to packages/client/public/resources/{slug}.png
 *
 * Usage:
 *   npx tsx scripts/generate-resource-art.ts [options]
 *
 * Options:
 *   --resume           Skip resources that already have an image on disk
 *   --size 512|1K|2K   Image resolution (default: 512)
 *   --delay 4000       Delay between API calls in ms (default: 4000)
 */

import * as path from 'path';
import * as fs from 'fs';
import {
  generateImage,
  sleep,
  DEFAULT_DELAY_MS,
  PUBLIC_DIR,
  parseArgs,
  getSizeArg,
  resolveOutputPath,
  type ImageSize,
} from './card-art/utils';
import { getChosenStyle, buildPrompt } from './card-art/style-prompt';

// ── Resource definitions ───────────────────────────────────────────────

interface ResourceEntry {
  slug: string;
  name: string;
  subject: string;
}

const RESOURCES: ResourceEntry[] = [
  {
    slug: 'air',
    name: 'Air Budget',
    subject:
      'Air power budget — a tight diamond formation of four stealth fighter jets seen from below against a vivid sky, ' +
      'contrails tracing a geometric pattern, sense of speed and dominance. Abstract and iconic.',
  },
  {
    slug: 'sea',
    name: 'Sea Budget',
    subject:
      'Naval budget — a carrier strike group viewed from directly above, aircraft carrier centered with destroyers ' +
      'and a submarine wake arranged in a protective formation, deep blue ocean.',
  },
  {
    slug: 'expeditionary',
    name: 'Expeditionary Budget',
    subject:
      'Expeditionary forces budget — marines fast-roping from a transport helicopter onto a rocky coastline at dawn, ' +
      'amphibious assault vehicle in the surf zone, bold action composition.',
  },
  {
    slug: 'space-cyber',
    name: 'Space / Cyber Budget',
    subject:
      'Space and cyber budget — a satellite constellation in low Earth orbit seen from space, signal beams ' +
      'forming a luminous grid over a dark digital Earth below, circuit-board landmasses, cosmic and precise.',
  },
  {
    slug: 'sustain',
    name: 'Sustain Budget',
    subject:
      'Sustainment budget — a military logistics depot at dusk, rows of fuel trucks and supply pallets, ' +
      'a C-17 transport aircraft being loaded in the background, methodical and industrial.',
  },
  {
    slug: 'manpower',
    name: 'Manpower',
    subject:
      'Military manpower resource — dense aerial view of a uniformed troop formation on a parade ground, ' +
      'soldiers arranged in precise geometric blocks, human capital and organized strength.',
  },
  {
    slug: 'logistics',
    name: 'Logistics',
    subject:
      'Logistics resource — global supply chain visualization: cargo aircraft over a world map with arcing ' +
      'route lines connecting military bases across continents, nodes glowing at major hubs.',
  },
  {
    slug: 'intel',
    name: 'Intel',
    subject:
      'Intelligence resource — a high-altitude surveillance drone in profile against a dark sky, ' +
      'targeting reticles and data overlays projected onto terrain below, precise and watchful.',
  },
  {
    slug: 'political-capital',
    name: 'Political Capital',
    subject:
      'Political capital resource — a grand legislative chamber from above, circular seating with flags ' +
      'of allied nations, a podium at the center under dramatic spotlights, power and diplomacy.',
  },
];

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs();
  const size: ImageSize = getSizeArg(args);
  const resume = args.resume === 'true';
  const delayMs = parseInt(args.delay ?? String(DEFAULT_DELAY_MS), 10);

  const style = getChosenStyle();
  const outputDir = path.join(PUBLIC_DIR, '..', 'resources');

  const toGenerate = resume
    ? RESOURCES.filter(r => !fs.existsSync(path.join(outputDir, `${r.slug}.png`)))
    : RESOURCES;

  console.log(`\nResource Art Generation — ${style.name}`);
  console.log(`Resources: ${toGenerate.length} (${RESOURCES.length - toGenerate.length} skipped by --resume)`);
  console.log(`Resolution: ${size} | Output: ${outputDir}\n`);

  let generated = 0;
  let failed = 0;

  for (let i = 0; i < toGenerate.length; i++) {
    const resource = toGenerate[i];
    const filename = `${resource.slug}.png`;
    const outputPath = resolveOutputPath(outputDir, filename);
    const prompt = buildPrompt(style.directive, resource.subject);

    process.stdout.write(`[${i + 1}/${toGenerate.length}] ${filename}... `);
    const ok = await generateImage({ prompt, outputPath, size });

    if (ok) {
      generated++;
      console.log('done');
    } else {
      failed++;
      console.log('FAILED');
    }

    if (i < toGenerate.length - 1) {
      await sleep(delayMs);
    }
  }

  console.log(`\n✓ Complete: ${generated} generated, ${failed} failed`);
  console.log(`Output: ${outputDir}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
