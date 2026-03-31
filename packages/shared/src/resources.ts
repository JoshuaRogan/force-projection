// === Budget Lines ===
// The 5 distinct budget pools that fund programs and deployments

export type BudgetLine = 'A' | 'S' | 'E' | 'X' | 'U';

export const BUDGET_LINES: readonly BudgetLine[] = ['A', 'S', 'E', 'X', 'U'] as const;

export const BUDGET_LINE_NAMES: Record<BudgetLine, string> = {
  A: 'Air',
  S: 'Sea',
  E: 'Expeditionary',
  X: 'Space/Cyber',
  U: 'Sustain',
};

// === Secondary Resources ===

export type SecondaryResource = 'M' | 'L' | 'I' | 'PC';

export const SECONDARY_RESOURCES: readonly SecondaryResource[] = ['M', 'L', 'I', 'PC'] as const;

export const SECONDARY_RESOURCE_NAMES: Record<SecondaryResource, string> = {
  M: 'Manpower',
  L: 'Logistics',
  I: 'Intel',
  PC: 'Political Capital',
};

// === Combined resource types ===

export type ResourceType = BudgetLine | SecondaryResource;

/** A bag of budget tokens — how costs and pools are represented */
export interface BudgetPool {
  A: number;
  S: number;
  E: number;
  X: number;
  U: number;
}

/** Secondary resource pool */
export interface SecondaryPool {
  M: number;
  L: number;
  I: number;
  PC: number;
}

/** Full resource state for a player: current tokens + production rates */
export interface PlayerResources {
  budget: BudgetPool;
  secondary: SecondaryPool;
  production: {
    budget: BudgetPool;
    secondary: SecondaryPool;
  };
}

/** A cost specification — what you need to pay for something */
export interface Cost {
  budget: Partial<BudgetPool>;
  secondary?: Partial<SecondaryPool>;
}

// === Helpers ===

export function emptyBudgetPool(): BudgetPool {
  return { A: 0, S: 0, E: 0, X: 0, U: 0 };
}

export function emptySecondaryPool(): SecondaryPool {
  return { M: 0, L: 0, I: 0, PC: 0 };
}

export function startingResources(): PlayerResources {
  return {
    budget: { A: 2, S: 2, E: 2, X: 2, U: 2 },
    secondary: { M: 2, L: 2, I: 1, PC: 1 },
    production: {
      budget: { A: 1, S: 1, E: 1, X: 1, U: 1 },
      secondary: { M: 1, L: 1, I: 0, PC: 0 },
    },
  };
}

/** Check if a player can afford a cost */
export function canAfford(resources: PlayerResources, cost: Cost): boolean {
  for (const line of BUDGET_LINES) {
    if ((cost.budget[line] ?? 0) > resources.budget[line]) return false;
  }
  if (cost.secondary) {
    for (const res of SECONDARY_RESOURCES) {
      if ((cost.secondary[res] ?? 0) > resources.secondary[res]) return false;
    }
  }
  return true;
}

/** Subtract a cost from resources. Mutates in place. Caller must check canAfford first. */
export function payCost(resources: PlayerResources, cost: Cost): void {
  for (const line of BUDGET_LINES) {
    resources.budget[line] -= cost.budget[line] ?? 0;
  }
  if (cost.secondary) {
    for (const res of SECONDARY_RESOURCES) {
      resources.secondary[res] -= cost.secondary[res] ?? 0;
    }
  }
}
