import { type ClassValue, clsx } from 'clsx';

// Simple cn utility without tailwind-merge for now
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Format score to 1 decimal place
export function formatScore(score: number): string {
  return score.toFixed(1);
}

// Get status color based on score
export function getScoreColor(score: number): string {
  if (score >= 7) return 'text-green-400';
  if (score >= 5) return 'text-yellow-400';
  return 'text-orange-400';
}

// Get confidence label
export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return 'High';
  if (confidence >= 0.6) return 'Moderate';
  if (confidence >= 0.4) return 'Low';
  return 'Very Low';
}

// Get confidence color
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'text-green-400';
  if (confidence >= 0.6) return 'text-yellow-400';
  if (confidence >= 0.4) return 'text-orange-400';
  return 'text-red-400';
}

// Format range
export function formatRange(min: number, max: number): string {
  return `${formatScore(min)} - ${formatScore(max)}`;
}

// Truncate text
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

// Generate hash for caching
export async function generateHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

// Safe JSON parse
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

// Delay utility
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Clamp number to range
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
