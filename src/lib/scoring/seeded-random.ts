// Deterministic seeded pseudo-random number generator
// Uses Mulberry32 algorithm for fast, high-quality PRNG
// IMPORTANT: This ensures same seed = same sequence of random numbers

/**
 * Create a seeded random number generator
 * Returns a function that produces deterministic "random" numbers
 */
export function createSeededRng(seed: number): () => number {
  let state = seed >>> 0; // Ensure unsigned 32-bit integer
  
  return function mulberry32(): number {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Convert hash bytes to seed number
 */
export function hashToSeed(hashHex: string): number {
  // Use first 8 characters (4 bytes) of hash as seed
  return parseInt(hashHex.slice(0, 8), 16) >>> 0;
}

/**
 * Generate deterministic jitter values for stability sampling
 * Same seed always produces same jitter sequence
 */
export interface JitterParams {
  rotation: number;    // degrees
  scale: number;       // factor (1.0 = no change)
  cropX: number;       // fraction of image width
  cropY: number;       // fraction of image height
  brightness: number;  // factor (1.0 = no change)
}

export function generateJitterParams(
  seed: number,
  count: number = 16
): JitterParams[] {
  const rng = createSeededRng(seed);
  const params: JitterParams[] = [];
  
  for (let i = 0; i < count; i++) {
    params.push({
      rotation: (rng() - 0.5) * 4,       // ±2 degrees
      scale: 0.97 + rng() * 0.06,        // 0.97 to 1.03
      cropX: (rng() - 0.5) * 0.04,       // ±2%
      cropY: (rng() - 0.5) * 0.04,       // ±2%
      brightness: 0.97 + rng() * 0.06,   // ±3%
    });
  }
  
  return params;
}

/**
 * Deterministic shuffle using Fisher-Yates with seeded RNG
 */
export function seededShuffle<T>(array: T[], seed: number): T[] {
  const rng = createSeededRng(seed);
  const result = [...array];
  
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  
  return result;
}

/**
 * Generate deterministic noise values
 */
export function generateNoise(seed: number, count: number, magnitude: number = 0.1): number[] {
  const rng = createSeededRng(seed);
  const noise: number[] = [];
  
  for (let i = 0; i < count; i++) {
    noise.push((rng() - 0.5) * 2 * magnitude);
  }
  
  return noise;
}
