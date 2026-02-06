// Deterministic hashing utilities for calorie tracker
import crypto from 'crypto';

/**
 * Compute SHA256 hash of data
 */
export function sha256(data: string | Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Normalize user notes for consistent hashing
 * - Trim whitespace
 * - Convert to lowercase
 * - Collapse multiple spaces
 * - Sort words alphabetically for order-independence
 */
export function normalizeNotes(notes: string | undefined | null): string {
  if (!notes) return '';
  return notes
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .sort()
    .join(' ');
}

/**
 * Compute hash for normalized notes
 */
export function computeNotesHash(notes: string | undefined | null): string {
  const normalized = normalizeNotes(notes);
  if (!normalized) return '';
  return sha256(normalized);
}

/**
 * Compute combined hash from scan hash and notes hash
 */
export function computeCombinedHash(scanHash: string, notesHash: string | undefined): string {
  const notesComponent = notesHash || '';
  return sha256(`${scanHash}:${notesComponent}`);
}

/**
 * Compute hash for image bytes (for scan hash)
 */
export function computeImageHash(imageBase64: string): string {
  // Remove data URL prefix if present
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  return sha256(Buffer.from(base64Data, 'base64'));
}
