/**
 * Phase 1: Style Exploration
 *
 * Generates images for each style × each test card so the user can
 * review and pick a visual direction.
 *
 * Usage:
 *   npx tsx scripts/card-art/generate-styles.ts [--size 512|1K|2K|4K]
 */

import * as path from 'path';
import {
  generateImage,
  sleep,
  DEFAULT_DELAY_MS,
  PUBLIC_DIR,
  parseArgs,
  getSizeArg,
  resolveOutputPath,
} from './utils';
import { STYLES, TEST_CARDS, buildPrompt } from './style-prompt';

async function main() {
  const args = parseArgs();
  const size = getSizeArg(args);

  const totalImages = STYLES.length * TEST_CARDS.length;
  console.log(`\nStyle Exploration — ${STYLES.length} styles × ${TEST_CARDS.length} test cards = ${totalImages} images`);
  console.log(`Resolution: ${size}\n`);

  let generated = 0;
  let failed = 0;

  for (const style of STYLES) {
    console.log(`\n── ${style.name} (${style.id}) ──`);
    const styleDir = path.join(PUBLIC_DIR, 'styles', style.id);

    for (const card of TEST_CARDS) {
      const outputPath = resolveOutputPath(styleDir, `${card.id}.png`);
      const prompt = buildPrompt(style.directive, card.description);

      process.stdout.write(`  ${card.id}... `);
      const ok = await generateImage({ prompt, outputPath, size });

      if (ok) {
        generated++;
        console.log('done');
      } else {
        failed++;
        console.log('FAILED');
      }

      // Rate limit between calls
      if (generated + failed < totalImages) {
        await sleep(DEFAULT_DELAY_MS);
      }
    }
  }

  console.log(`\n✓ Complete: ${generated} generated, ${failed} failed`);
  console.log(`Output: ${path.join(PUBLIC_DIR, 'styles/')}`);
  console.log('\nBrowse the style folders and pick your favorite.');
  console.log('Then set CHOSEN_STYLE_ID in scripts/card-art/style-prompt.ts');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
