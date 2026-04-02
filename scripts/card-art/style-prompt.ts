/**
 * Style definitions and per-card-type prompt builders.
 *
 * Phase 1: All 8 styles are used by generate-styles.ts for exploration.
 * Phase 2: After the user picks a winner, update CHOSEN_STYLE and the
 *          prompt builder functions will use it for all future generations.
 */

// ── Style Definitions ──────────────────────────────────────────────────

export interface StyleDef {
  id: string;
  name: string;
  /** The style directive prepended to every prompt */
  directive: string;
}

export const STYLES: StyleDef[] = [

  {
    id: 'stylized-vector',
    name: 'Stylized Vector',
    directive:
      'Clean flat vector illustration with bold geometric shapes and limited color palette. ' +
      'Inspired by modern infographic and editorial illustration styles. ' +
      'Sharp edges, minimal gradients, strong silhouettes. No text, no labels.',
  },

];

// ── Chosen Style (update after Phase 2) ────────────────────────────────

/** Set this to the chosen style id after reviewing explorations */
export const CHOSEN_STYLE_ID: string | null = 'stylized-vector';

export function getChosenStyle(): StyleDef {
  if (!CHOSEN_STYLE_ID) {
    throw new Error(
      'No style chosen yet. Run generate-styles.ts first, then set CHOSEN_STYLE_ID in style-prompt.ts.',
    );
  }
  const style = STYLES.find(s => s.id === CHOSEN_STYLE_ID);
  if (!style) throw new Error(`Unknown style id: ${CHOSEN_STYLE_ID}`);
  return style;
}

// ── Domain Descriptors ─────────────────────────────────────────────────

const DOMAIN_FLAVOR: Record<string, string> = {
  AIR: 'military aviation, aircraft, aerial operations',
  SEA: 'naval warfare, warships, maritime operations',
  EXP: 'ground forces, expeditionary operations, soldiers and equipment',
  SPACE_CYBER: 'space technology, cyber warfare, satellites, digital networks',
};

// ── Test Cards for Style Exploration ───────────────────────────────────

export interface TestCard {
  id: string;
  type: 'program' | 'contract' | 'agenda' | 'crisis';
  description: string;
}

export const TEST_CARDS: TestCard[] = [
  {
    id: 'prog-f22',
    type: 'program',
    description:
      'F-22 Raptor Squadron — a formation of sleek F-22 stealth fighter jets in flight over a dramatic cloudscape, military aviation',
  },
  {
    id: 'con-air-dom',
    type: 'contract',
    description:
      'Air Dominance Demonstration — a show of aerial military power, multiple fighter jets in formation performing a coordinated display over an aircraft carrier group',
  },
  {
    id: 'agenda-pivot-pacific',
    type: 'agenda',
    description:
      'Pivot to the Pacific — a strategic policy scene showing a globe focused on the Pacific Ocean with military assets repositioning, carrier groups and bases highlighted across the Pacific rim',
  },
  {
    id: 'crisis-cyber-attack',
    type: 'crisis',
    description:
      'Major Cyber Attack — a dramatic crisis scene with digital infrastructure under attack, glowing red warning symbols, network visualization being breached, dark and urgent mood',
  },
];

// ── Prompt Builders (used by generate-cards.ts after style is chosen) ──

export function buildPrompt(styleDirective: string, subject: string): string {
  return (
    `${styleDirective}\n\n` +
    `Subject: ${subject}\n\n` +
    `This is card art for a strategic defense board game. The image should be a single compelling illustration suitable for a playing card. No text, no borders, no card frames.\n\n` +
    `Composition: leave generous negative space around the subject — at least 15–20% clear margin on all sides. The subject should occupy roughly 60–70% of the frame, centered, so the image can be cropped tightly or loosely without cutting into the focal point.\n\n` +
    `IMPORTANT: The specific platform or subject must be visually accurate and identifiable — correct silhouette, distinctive shape, and key identifying features (e.g. an F-22 must look like an F-22, not a generic jet or an F-35). Render it faithfully within the chosen art style; accuracy of form takes priority over stylistic liberties.`
  );
}

/** Build a subject description from a program card's data */
export function programSubject(card: {
  name: string;
  domain: string;
  subtags: string[];
}): string {
  const domainFlavor = DOMAIN_FLAVOR[card.domain] ?? card.domain;
  const tags = card.subtags.join(', ');
  return `${card.name} — ${domainFlavor}. Tags: ${tags}. Depict the military platform or capability described by the name.`;
}

/** Build a subject description from a contract card's data */
export function contractSubject(card: { name: string }): string {
  return `${card.name} — a military defense contract objective. Depict the strategic goal or military exercise described by the name.`;
}

/** Build a subject description from an agenda card's data */
export function agendaSubject(card: {
  name: string;
  description: string;
}): string {
  return `${card.name} — ${card.description}. A political/policy scene related to defense legislation and strategic decision-making.`;
}

/** Build a subject description from a crisis card's data */
export function crisisSubject(card: {
  name: string;
  immediateRule: string;
}): string {
  return `${card.name} — ${card.immediateRule}. A dramatic crisis scene conveying urgency and threat.`;
}

const DIRECTORATE_FLAVOR: Record<string, string> = {
  NAVSEA:   'naval shipyards, fleet operations, warships under construction and at sea',
  AIRCOM:   'air dominance, fighter jets, aerial command and control, sky and clouds',
  MARFOR:   'expeditionary ground forces, amphibious assault, marines in the field',
  SPACECY:  'space operations, satellite networks, cyber command, digital battlespace',
  TRANSCOM: 'strategic airlift, sealift, logistics hubs, global mobility and sustainment',
};

/** Build a subject description from a directorate definition */
export function directorateSubject(directorate: {
  id: string;
  name: string;
  subtitle: string;
}): string {
  const flavor = DIRECTORATE_FLAVOR[directorate.id] ?? directorate.subtitle;
  return `${directorate.name} — ${directorate.subtitle}. Visual theme: ${flavor}. Depict the essence of this military command as a bold emblem or scene.`;
}
