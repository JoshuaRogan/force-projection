import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

// ── Constants ──────────────────────────────────────────────────────────

export const MODEL = 'gemini-3.1-flash-image-preview';
export const ENRICHMENT_MODEL = 'gemini-3.1-flash-lite-preview';

export type ImageSize = '512' | '1K' | '2K' | '4K';

export const PUBLIC_DIR = path.resolve(
  __dirname,
  '../../packages/client/public/cards',
);

// ── API Client ─────────────────────────────────────────────────────────

let _ai: GoogleGenAI | null = null;

export function getClient(): GoogleGenAI {
  if (_ai) return _ai;
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    console.error(
      'Missing GOOGLE_AI_API_KEY. Copy .env.example to .env and add your key.',
    );
    process.exit(1);
  }
  _ai = new GoogleGenAI({ apiKey });
  return _ai;
}

// ── Prompt Enrichment ──────────────────────────────────────────────────

const ENRICHMENT_SYSTEM = `You are an expert military hardware consultant helping generate accurate card art prompts for a strategic defense board game.

Given an image generation prompt, your job is to add precise visual identifying details about the specific platform or subject — things like exact silhouette characteristics, number of engines, wing shape, distinctive features — so the image model draws the RIGHT thing, not a generic stand-in.

Rules:
- Keep the art style directive exactly as written, do not soften or change it
- Add identifying visual details inline into the subject description
- Be specific: "twin canted tail fins, diamond-shaped delta wings, two afterburning engines with rectangular inlets" not "a military jet"
- If the subject is not a specific recognizable platform (e.g. a generic policy concept), return the prompt unchanged
- Return only the enhanced prompt text, no commentary`;

/**
 * Runs the prompt through a text LLM to inject accurate identifying details
 * for the specific platform before sending to the image model.
 */
export async function enrichPrompt(prompt: string): Promise<string> {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: ENRICHMENT_MODEL,
      contents: prompt,
      config: { systemInstruction: ENRICHMENT_SYSTEM } as any,
    });
    const text = (response as any).candidates?.[0]?.content?.parts?.[0]?.text;
    return text?.trim() ?? prompt;
  } catch (err: any) {
    // Non-fatal: fall back to original prompt
    console.error(`  Enrichment failed, using original prompt: ${err.message}`);
    return prompt;
  }
}

// ── Image Generation ───────────────────────────────────────────────────

export interface GenerateImageOpts {
  prompt: string;
  outputPath: string;
  size?: ImageSize;
  aspectRatio?: string;
}

/**
 * Generate a single image and save it to disk.
 * Returns true on success, false on failure.
 */
export async function generateImage(opts: GenerateImageOpts): Promise<boolean> {
  const { prompt, outputPath, size = '512', aspectRatio = '1:1' } = opts;
  const ai = getClient();

  try {
    const enriched = await enrichPrompt(prompt);
    console.log(enriched)
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: enriched,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: { aspectRatio },
      } as any,
    });

    const candidates = (response as any).candidates ?? [];
    if (candidates.length === 0) {
      console.error(`  No candidates returned for: ${path.basename(outputPath)}`);
      return false;
    }

    for (const part of candidates[0].content.parts) {
      if (part.inlineData) {
        const buffer = Buffer.from(part.inlineData.data, 'base64');
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, buffer);
        savePromptRecord(outputPath, enriched);
        return true;
      }
    }

    console.error(`  No image data in response for: ${path.basename(outputPath)}`);
    return false;
  } catch (err: any) {
    console.error(`  Error generating ${path.basename(outputPath)}: ${err.message}`);
    return false;
  }
}

// ── Prompt Log ────────────────────────────────────────────────────────

export const PROMPT_LOG = path.join(PUBLIC_DIR, 'prompts.json');

/**
 * Appends an enriched prompt to prompts.json, keyed by the image's path
 * relative to PUBLIC_DIR (e.g. "programs/f22-v1.png").
 * Never overwrites an existing key — if it somehow exists, skips silently.
 */
export function savePromptRecord(outputPath: string, enrichedPrompt: string): void {
  const key = path.relative(PUBLIC_DIR, outputPath);
  let records: Record<string, string> = {};
  if (fs.existsSync(PROMPT_LOG)) {
    try {
      records = JSON.parse(fs.readFileSync(PROMPT_LOG, 'utf8'));
    } catch {
      // Corrupted file — start fresh
    }
  }
  if (key in records) return;
  records[key] = enrichedPrompt;
  fs.mkdirSync(path.dirname(PROMPT_LOG), { recursive: true });
  fs.writeFileSync(PROMPT_LOG, JSON.stringify(records, null, 2));
}

// ── Path Helpers ───────────────────────────────────────────────────────

/**
 * Returns a path that doesn't exist yet.
 * If `base/name.png` exists, tries `base/name-2.png`, `base/name-3.png`, etc.
 */
export function resolveOutputPath(dir: string, basename: string): string {
  const candidate = path.join(dir, basename);
  if (!fs.existsSync(candidate)) return candidate;

  const ext = path.extname(basename);
  const stem = path.basename(basename, ext);
  let n = 2;
  while (true) {
    const next = path.join(dir, `${stem}-${n}${ext}`);
    if (!fs.existsSync(next)) return next;
    n++;
  }
}

// ── Rate Limiting ──────────────────────────────────────────────────────

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Default delay between API calls (ms).
 * Free tier is ~15 RPM → 4s between calls is safe.
 */
export const DEFAULT_DELAY_MS = 4000;

// ── CLI Arg Parsing ────────────────────────────────────────────────────

export function parseArgs(argv: string[] = process.argv.slice(2)) {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = 'true';
      }
    }
  }
  return args;
}

export function getSizeArg(args: Record<string, string>): ImageSize {
  const val = args.size;
  if (val && ['512', '1K', '2K', '4K'].includes(val)) return val as ImageSize;
  return '512';
}
