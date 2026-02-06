// Caching module for deterministic results
// Same image hash + config version = same cached result

import crypto from 'crypto';

// Config version - bump when scoring logic changes
export const SCORING_CONFIG_VERSION = '1.0.0';

// Cache entry type
export interface CacheEntry<T> {
  hash: string;
  configVersion: string;
  endpointVersion: string;
  timestamp: number;
  data: T;
}

// In-memory cache (would be Redis/Supabase in production)
const memoryCache = new Map<string, CacheEntry<unknown>>();

/**
 * Compute SHA-256 hash of image bytes
 * This is the primary key for caching
 */
export function computeImageHash(imageBase64: string): string {
  // Remove data URL prefix if present
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  
  const hash = crypto.createHash('sha256');
  hash.update(base64Data);
  return hash.digest('hex');
}

/**
 * Get seed from image hash (for deterministic RNG)
 */
export function getSeedFromHash(hash: string): number {
  // Use first 8 hex characters as seed
  return parseInt(hash.slice(0, 8), 16) >>> 0;
}

/**
 * Generate cache key from hash + versions
 */
export function getCacheKey(
  imageHash: string,
  endpointVersion: string
): string {
  return `${imageHash}:${SCORING_CONFIG_VERSION}:${endpointVersion}`;
}

/**
 * Get cached result if available
 */
export function getCachedResult<T>(
  imageHash: string,
  endpointVersion: string
): T | null {
  const key = getCacheKey(imageHash, endpointVersion);
  const entry = memoryCache.get(key) as CacheEntry<T> | undefined;
  
  if (entry && entry.configVersion === SCORING_CONFIG_VERSION) {
    return entry.data;
  }
  
  return null;
}

/**
 * Store result in cache
 */
export function setCachedResult<T>(
  imageHash: string,
  endpointVersion: string,
  data: T
): void {
  const key = getCacheKey(imageHash, endpointVersion);
  
  memoryCache.set(key, {
    hash: imageHash,
    configVersion: SCORING_CONFIG_VERSION,
    endpointVersion,
    timestamp: Date.now(),
    data,
  });
}

/**
 * Clear cache entry
 */
export function clearCachedResult(
  imageHash: string,
  endpointVersion: string
): void {
  const key = getCacheKey(imageHash, endpointVersion);
  memoryCache.delete(key);
}

/**
 * Clear all cache
 */
export function clearAllCache(): void {
  memoryCache.clear();
}

/**
 * Get cache stats
 */
export function getCacheStats(): {
  entries: number;
  configVersion: string;
} {
  return {
    entries: memoryCache.size,
    configVersion: SCORING_CONFIG_VERSION,
  };
}

/**
 * Check if result is cached
 */
export function isCached(
  imageHash: string,
  endpointVersion: string
): boolean {
  const key = getCacheKey(imageHash, endpointVersion);
  return memoryCache.has(key);
}

// Supabase cache functions (for persistent caching)
// These would connect to the database in production

export interface SupabaseCacheRow {
  id: string;
  image_hash: string;
  config_version: string;
  endpoint_version: string;
  endpoint: string;
  result_json: string;
  created_at: string;
}

/**
 * Store result in Supabase (for persistent caching)
 * This would be called after computing results
 */
export async function storeInSupabase(
  supabase: { from: (table: string) => unknown } | null,
  imageHash: string,
  endpointVersion: string,
  endpoint: string,
  data: unknown
): Promise<boolean> {
  if (!supabase) return false;
  
  try {
    // Would insert into scan_cache table
    // const { error } = await supabase.from('scan_cache').upsert({
    //   image_hash: imageHash,
    //   config_version: SCORING_CONFIG_VERSION,
    //   endpoint_version: endpointVersion,
    //   endpoint,
    //   result_json: JSON.stringify(data),
    // });
    // return !error;
    return true;
  } catch {
    return false;
  }
}

/**
 * Retrieve from Supabase cache
 */
export async function getFromSupabase<T>(
  supabase: { from: (table: string) => unknown } | null,
  imageHash: string,
  endpointVersion: string,
  endpoint: string
): Promise<T | null> {
  if (!supabase) return null;
  
  try {
    // Would query scan_cache table
    // const { data, error } = await supabase
    //   .from('scan_cache')
    //   .select('result_json')
    //   .eq('image_hash', imageHash)
    //   .eq('config_version', SCORING_CONFIG_VERSION)
    //   .eq('endpoint_version', endpointVersion)
    //   .eq('endpoint', endpoint)
    //   .single();
    // 
    // if (error || !data) return null;
    // return JSON.parse(data.result_json) as T;
    return null;
  } catch {
    return null;
  }
}
