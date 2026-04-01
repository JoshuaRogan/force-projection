/**
 * Generates one-sentence prose descriptions for all cards using Gemini LLM.
 * Saves to packages/shared/src/data/cardProse.json
 *
 * Usage:
 *   npx tsx scripts/generate-card-prose.ts [options]
 *
 * Options:
 *   --type programs|contracts|agendas|crises   Only generate for one card type
 *   --resume                                   Skip cards that already have prose
 *   --concurrency 10                           Parallel requests (default: 10)
 */

import * as fs from 'fs';
import * as path from 'path';
import { getClient, ENRICHMENT_MODEL, sleep, parseArgs } from './card-art/utils';

import { PROGRAM_CARDS } from '../packages/shared/src/data/programs';
import { CONTRACT_CARDS } from '../packages/shared/src/data/contracts';
import { AGENDA_CARDS } from '../packages/shared/src/data/agendas';
import { CRISIS_CARDS } from '../packages/shared/src/data/crises';

// ── Output ─────────────────────────────────────────────────────────────

const OUTPUT_PATH = path.resolve(__dirname, '../packages/shared/src/data/cardProse.json');

function loadExisting(): Record<string, string> {
  if (!fs.existsSync(OUTPUT_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function save(records: Record<string, string>): void {
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(records, null, 2));
}

// ── Prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are writing flavour text for a strategic defense board game.
For each card, write exactly one sentence (around 100 characters) of factual, engaging prose about the real-world technology, unit, policy, or concept the card represents.
The tone should be informative and authoritative — like a brief encyclopedia entry or a caption in a military history book.
Return only the sentence. No quotes, no bullet points, no extra text.`;

async function generateProse(subject: string, retries = 3): Promise<string | null> {
  const ai = getClient();
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: ENRICHMENT_MODEL,
        contents: subject,
        config: { systemInstruction: SYSTEM_PROMPT } as any,
      });
      const text = (response as any).candidates?.[0]?.content?.parts?.[0]?.text;
      return text?.trim() ?? null;
    } catch (err: any) {
      const is429 = err.message?.includes('429') || err.status === 429;
      if (is429 && attempt < retries) {
        const backoff = attempt * 5000;
        process.stdout.write(` [rate limited, waiting ${backoff / 1000}s]`);
        await sleep(backoff);
      } else {
        process.stdout.write(` [error: ${err.message}]`);
        return null;
      }
    }
  }
  return null;
}

// ── Concurrency pool ───────────────────────────────────────────────────

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const i = index++;
      await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
}

// ── Card subjects ──────────────────────────────────────────────────────

interface CardEntry {
  id: string;
  subject: string;
}

const DOMAIN_LABELS: Record<string, string> = {
  AIR: 'Air', SEA: 'Sea', EXP: 'Expeditionary', SPACE_CYBER: 'Space/Cyber',
};

function buildCardList(typeFilter?: string): CardEntry[] {
  const entries: CardEntry[] = [];

  if (!typeFilter || typeFilter === 'programs') {
    for (const c of PROGRAM_CARDS) {
      entries.push({
        id: c.id,
        subject: `${c.name} — a ${DOMAIN_LABELS[c.domain] ?? c.domain} military program. Tags: ${c.subtags.join(', ')}.`,
      });
    }
  }
  if (!typeFilter || typeFilter === 'contracts') {
    for (const c of CONTRACT_CARDS) {
      entries.push({
        id: c.id,
        subject: `${c.name} — a Congressional defense contract objective.`,
      });
    }
  }
  if (!typeFilter || typeFilter === 'agendas') {
    for (const c of AGENDA_CARDS) {
      entries.push({
        id: c.id,
        subject: `${c.name} — ${c.description}`,
      });
    }
  }
  if (!typeFilter || typeFilter === 'crises') {
    for (const c of CRISIS_CARDS) {
      entries.push({
        id: c.id,
        subject: `${c.name} — ${c.immediateRule}`,
      });
    }
  }

  return entries;
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs();
  const resume = args.resume === 'true';
  const concurrency = parseInt(args.concurrency ?? '10', 10);
  const typeFilter = args.type;

  const cards = buildCardList(typeFilter);
  const records = loadExisting();

  const toGenerate = resume ? cards.filter(c => !(c.id in records)) : cards;

  console.log(`\nCard Prose Generation — ${ENRICHMENT_MODEL}`);
  console.log(`Cards: ${toGenerate.length} (${cards.length - toGenerate.length} skipped by --resume) | Concurrency: ${concurrency}\n`);

  let generated = 0;
  let failed = 0;
  const total = toGenerate.length;

  await runWithConcurrency(toGenerate, concurrency, async (card, i) => {
    process.stdout.write(`[${i + 1}/${total}] ${card.id}... `);
    const prose = await generateProse(card.subject);
    if (prose) {
      records[card.id] = prose;
      save(records);
      generated++;
      console.log('done');
    } else {
      failed++;
      console.log('FAILED');
    }
  });

  console.log(`\n✓ Complete: ${generated} generated, ${failed} failed`);
  console.log(`Output: ${OUTPUT_PATH}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
