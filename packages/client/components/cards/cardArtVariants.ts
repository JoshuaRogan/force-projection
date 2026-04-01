/**
 * Maps card IDs to the variant number that should be displayed in the UI.
 * Any card not listed here defaults to variant 1.
 *
 * Change a value here to swap which generated image is shown for a card,
 * e.g. set 'prog-f22': 2 to show prog-f22-v2.png instead of prog-f22-v1.png.
 */
export const CARD_ART_VARIANTS: Record<string, number> = {
  // Programs — add overrides as needed
  // 'prog-f22': 2,
  'prog-b52': 2,

  // Contracts
  // 'con-air-dom': 2,

  // Agendas
  // 'agenda-pivot-pacific': 2,

  // Crises
  // 'crisis-cyber-attack': 2,
};
