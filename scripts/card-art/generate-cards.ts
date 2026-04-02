/**
 * Phase 3: Batch Card Art Generation
 *
 * Generates card art for all cards (or a filtered subset) using the
 * chosen style from style-prompt.ts.
 *
 * Usage:
 *   npx tsx scripts/card-art/generate-cards.ts [options]
 *
 * Options:
 *   --type programs|contracts|agendas|crises   Generate only one card type
 *   --variants 3                               Number of variants per card (default: 3)
 *   --size 512|1K|2K|4K                        Image resolution (default: 512)
 *   --resume                                   Skip cards that already have images on disk
 *   --delay 4000                               Delay between API calls in ms (default: 4000)
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  generateImage,
  sleep,
  DEFAULT_DELAY_MS,
  PUBLIC_DIR,
  parseArgs,
  getSizeArg,
  resolveOutputPath,
  type ImageSize,
} from './utils';
import {
  getChosenStyle,
  buildPrompt,
  programSubject,
  contractSubject,
  agendaSubject,
  crisisSubject,
  directorateSubject,
} from './style-prompt';

// Import card data directly from source (tsx resolves .ts imports)
import { PROGRAM_CARDS } from '../../packages/shared/src/data/programs';
import { CONTRACT_CARDS } from '../../packages/shared/src/data/contracts';
import { AGENDA_CARDS } from '../../packages/shared/src/data/agendas';
import { CRISIS_CARDS } from '../../packages/shared/src/data/crises';
import { DIRECTORATES } from '../../packages/shared/src/directorates';

// ── Card → prompt mapping ──────────────────────────────────────────────

interface CardEntry {
  id: string;
  subject: string;
  type: 'programs' | 'contracts' | 'agendas' | 'crises' | 'directorates';
}

function buildCardList(typeFilter?: string): CardEntry[] {
  const entries: CardEntry[] = [];

  if (!typeFilter || typeFilter === 'programs') {
    for (const c of PROGRAM_CARDS) {
      entries.push({ id: c.id, subject: programSubject(c), type: 'programs' });
    }
  }
  if (!typeFilter || typeFilter === 'contracts') {
    for (const c of CONTRACT_CARDS) {
      entries.push({ id: c.id, subject: contractSubject(c), type: 'contracts' });
    }
  }
  if (!typeFilter || typeFilter === 'agendas') {
    for (const c of AGENDA_CARDS) {
      entries.push({ id: c.id, subject: agendaSubject(c), type: 'agendas' });
    }
  }
  if (!typeFilter || typeFilter === 'crises') {
    for (const c of CRISIS_CARDS) {
      entries.push({ id: c.id, subject: crisisSubject(c), type: 'crises' });
    }
  }
  if (!typeFilter || typeFilter === 'directorates') {
    for (const d of Object.values(DIRECTORATES)) {
      entries.push({ id: d.id, subject: directorateSubject(d), type: 'directorates' });
    }
  }

  return entries;
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs();
  const size: ImageSize = getSizeArg(args);
  const variants = parseInt(args.variants ?? '3', 10);
  const resume = args.resume === 'true';
  const delayMs = parseInt(args.delay ?? String(DEFAULT_DELAY_MS), 10);
  const typeFilter = args.type;

  const style = getChosenStyle();
  const cards = buildCardList(typeFilter);
  const totalImages = cards.length * variants;

  console.log(`\nCard Art Generation — ${style.name}`);
  console.log(`Cards: ${cards.length} | Variants: ${variants} | Total images: ${totalImages}`);
  console.log(`Resolution: ${size} | Resume: ${resume}\n`);

  let generated = 0;
  let skipped = 0;
  let failed = 0;
  let current = 0;

  for (const card of cards) {
    for (let v = 1; v <= variants; v++) {
      current++;
      const filename = variants === 1 ? `${card.id}.png` : `${card.id}-v${v}.png`;
      const typeDir = path.join(PUBLIC_DIR, card.type);

      // Resume: skip if the base filename already exists
      if (resume && fs.existsSync(path.join(typeDir, filename))) {
        skipped++;
        continue;
      }

      const outputPath = resolveOutputPath(typeDir, filename);

      const prompt = buildPrompt(style.directive, card.subject);
      const progress = `[${current}/${totalImages}]`;

      process.stdout.write(`${progress} ${card.type}/${filename}... `);
      const ok = await generateImage({ prompt, outputPath, size });

      if (ok) {
        generated++;
        console.log('done');
      } else {
        failed++;
        console.log('FAILED');
      }

      // Rate limit
      if (current < totalImages) {
        await sleep(delayMs);
      }
    }
  }

  console.log(`\n✓ Complete: ${generated} generated, ${skipped} skipped, ${failed} failed`);
  console.log(`Output: ${PUBLIC_DIR}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
