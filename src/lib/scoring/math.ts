// Mathematical functions for deterministic scoring
// No randomness - all calculations are reproducible

import { CalibrationConfig, StabilityStats } from './types';

/**
 * Sigmoid function for score calibration
 * Maps raw 0-1 score to calibrated 0-10 score
 */
export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Calibrate raw score (0-1) to final score (0-10)
 * Uses sigmoid with configurable steepness and midpoint
 */
export function calibrateScore(raw: number, config: CalibrationConfig): number {
  const mapped = sigmoid(config.a * (raw - config.b));
  return Math.round(mapped * 100) / 10; // Round to 1 decimal
}

/**
 * Gaussian-based ratio scoring
 * Score decreases exponentially as value deviates from ideal
 */
export function ratioScore(value: number, idealMid: number, sigma: number): number {
  if (value <= 0 || idealMid <= 0) return 0;
  const logDistance = Math.abs(Math.log(value / idealMid));
  return Math.exp(-Math.pow(logDistance / sigma, 2));
}

/**
 * Determine ratio status based on tolerance bands
 */
export function ratioStatus(
  value: number,
  band: [number, number],
  margin: number = 0.05
): 'good' | 'ok' | 'off' {
  const [min, max] = band;
  
  if (value >= min && value <= max) {
    return 'good';
  }
  
  const expandedMin = min * (1 - margin);
  const expandedMax = max * (1 + margin);
  
  if (value >= expandedMin && value <= expandedMax) {
    return 'ok';
  }
  
  return 'off';
}

/**
 * Calculate median of an array (deterministic)
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Calculate interquartile range (IQR)
 */
export function iqr(values: number[]): number {
  if (values.length < 4) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  
  return sorted[q3Index] - sorted[q1Index];
}

/**
 * Calculate stability score from IQR
 * Higher stability = lower variance = more reliable
 */
export function calculateStability(values: number[], expectedRange: number): number {
  const iqrValue = iqr(values);
  return 1 - Math.min(iqrValue / expectedRange, 1);
}

/**
 * Compute stability stats for a set of measurements
 */
export function computeStabilityStats(
  values: number[],
  expectedRange: number = 1
): StabilityStats {
  return {
    median: median(values),
    iqr: iqr(values),
    stability: calculateStability(values, expectedRange),
    samples: values,
  };
}

/**
 * Weighted mean with confidence weighting
 */
export function weightedMean(
  scores: number[],
  weights: number[],
  confidences: number[]
): number {
  if (scores.length === 0 || scores.length !== weights.length || scores.length !== confidences.length) {
    return 0;
  }
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < scores.length; i++) {
    const effectiveWeight = weights[i] * confidences[i];
    numerator += scores[i] * effectiveWeight;
    denominator += effectiveWeight;
  }
  
  return denominator > 0 ? numerator / denominator : 0;
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Round to specified decimal places
 */
export function roundTo(value: number, decimals: number = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Calculate Euclidean distance between two points
 */
export function distance(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Calculate angle between two points (in degrees)
 */
export function angleBetween(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
}

/**
 * Normalize angle to -180 to 180 range
 */
export function normalizeAngle(angle: number): number {
  while (angle > 180) angle -= 360;
  while (angle < -180) angle += 360;
  return angle;
}

/**
 * Calculate symmetry score from paired measurements
 * Lower difference = higher symmetry
 */
export function symmetryScore(
  leftValues: number[],
  rightValues: number[],
  tolerance: number = 0.1
): number {
  if (leftValues.length !== rightValues.length || leftValues.length === 0) {
    return 0;
  }
  
  let totalDiff = 0;
  
  for (let i = 0; i < leftValues.length; i++) {
    const avg = (leftValues[i] + rightValues[i]) / 2;
    if (avg > 0) {
      const normalizedDiff = Math.abs(leftValues[i] - rightValues[i]) / avg;
      totalDiff += normalizedDiff;
    }
  }
  
  const avgDiff = totalDiff / leftValues.length;
  return Math.exp(-Math.pow(avgDiff / tolerance, 2));
}

/**
 * Calculate thirds balance score
 * Perfect thirds = 0.33 each
 */
export function thirdsBalanceScore(
  upper: number,
  middle: number,
  lower: number
): number {
  const ideal = 1 / 3;
  const total = upper + middle + lower;
  
  if (total <= 0) return 0;
  
  const upperRatio = upper / total;
  const middleRatio = middle / total;
  const lowerRatio = lower / total;
  
  const upperDev = Math.abs(upperRatio - ideal);
  const middleDev = Math.abs(middleRatio - ideal);
  const lowerDev = Math.abs(lowerRatio - ideal);
  
  const avgDeviation = (upperDev + middleDev + lowerDev) / 3;
  
  // Max deviation is ~0.33, map to 0-1 score
  return Math.max(0, 1 - avgDeviation * 3);
}
