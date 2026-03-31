/**
 * Seeded pseudo-random number generator (mulberry32).
 * Deterministic: same seed always produces the same sequence.
 */
export class SeededRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  /** Returns a float in [0, 1) */
  next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns an integer in [min, max] inclusive */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** Shuffle an array in place (Fisher-Yates) */
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /** Pick n random elements from an array (without modifying it) */
  pick<T>(arr: readonly T[], n: number): T[] {
    const copy = [...arr];
    this.shuffle(copy);
    return copy.slice(0, n);
  }

  /** Draw n from the top of an array (mutates — removes from front) */
  draw<T>(deck: T[], n: number): T[] {
    return deck.splice(0, Math.min(n, deck.length));
  }
}
