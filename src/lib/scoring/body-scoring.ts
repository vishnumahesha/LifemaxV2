// Body Scoring Engine
// Implements Section E: View-Dependent, Confidence-Gated

import {
  PillarScore,
  BODY_CALIBRATION,
  BODY_PILLAR_WEIGHTS_WITH_SIDE,
  BODY_PILLAR_WEIGHTS_NO_SIDE,
  BODY_PROPORTION_IDEALS,
  CONFIDENCE_THRESHOLDS,
  BandStatus,
} from './types';
import {
  calibrateScore,
  ratioScore,
  ratioStatus,
  weightedMean,
  roundTo,
  clamp,
} from './math';

/**
 * Body landmarks/measurements structure
 */
export interface BodyMeasurements {
  // Widths (pixels or normalized)
  shoulderWidth: number;
  waistWidth: number;
  hipWidth: number;
  
  // Heights
  totalHeight: number;
  torsoHeight: number; // shoulder to hip
  legHeight: number;   // hip to ankle
  
  // Posture angles (only if side view available)
  headForwardAngle?: number;  // degrees from vertical
  shoulderAngle?: number;     // degrees from vertical
  pelvicTiltAngle?: number;   // degrees
  ribFlareAngle?: number;     // degrees
  
  // Presentation indicators
  presentation: 'male-presenting' | 'female-presenting' | 'ambiguous';
  presentationConfidence: number;
  
  // Quality indicators
  clothingFit: 'tight' | 'fitted' | 'loose' | 'unknown';
  lightingQuality: number; // 0-1
}

export interface ProportionSignal {
  key: string;
  label: string;
  value: number;
  band: [number, number];
  status: BandStatus;
  score: number;
  confidence: number;
}

/**
 * Calculate body proportions scores
 */
export function calculateProportions(
  measurements: BodyMeasurements,
  photoQuality: number
): {
  signals: ProportionSignal[];
  proportionsIndex: number;
  confidence: number;
} {
  const signals: ProportionSignal[] = [];
  const presentation = measurements.presentation;
  const isAmbiguous = presentation === 'ambiguous';
  
  // Use presentation-appropriate ideals
  const idealSet = presentation === 'female-presenting' 
    ? 'female' 
    : 'male';
  
  // 1. Shoulder to Waist ratio
  const swRatio = measurements.shoulderWidth / measurements.waistWidth;
  const swIdeal = BODY_PROPORTION_IDEALS.shoulderToWaist[isAmbiguous ? 'male' : idealSet];
  const swScore = ratioScore(swRatio, swIdeal.mid, swIdeal.sigma);
  signals.push({
    key: 'shoulderToWaist',
    label: 'Shoulder to Waist',
    value: roundTo(swRatio, 2),
    band: swIdeal.band as [number, number],
    status: ratioStatus(swRatio, swIdeal.band as [number, number]),
    score: roundTo(swScore, 2),
    confidence: roundTo(photoQuality * getClothingConfidence(measurements.clothingFit) * 0.85, 2),
  });
  
  // 2. Waist to Hip ratio
  const whRatio = measurements.waistWidth / measurements.hipWidth;
  const whIdeal = BODY_PROPORTION_IDEALS.waistToHip[isAmbiguous ? 'male' : idealSet];
  const whScore = ratioScore(whRatio, whIdeal.mid, whIdeal.sigma);
  signals.push({
    key: 'waistToHip',
    label: 'Waist to Hip',
    value: roundTo(whRatio, 2),
    band: whIdeal.band as [number, number],
    status: ratioStatus(whRatio, whIdeal.band as [number, number]),
    score: roundTo(whScore, 2),
    confidence: roundTo(photoQuality * getClothingConfidence(measurements.clothingFit) * 0.8, 2),
  });
  
  // 3. Shoulder to Hip ratio
  const shRatio = measurements.shoulderWidth / measurements.hipWidth;
  const shIdeal = BODY_PROPORTION_IDEALS.shoulderToHip[isAmbiguous ? 'male' : idealSet];
  const shScore = ratioScore(shRatio, shIdeal.mid, shIdeal.sigma);
  signals.push({
    key: 'shoulderToHip',
    label: 'Shoulder to Hip',
    value: roundTo(shRatio, 2),
    band: shIdeal.band as [number, number],
    status: ratioStatus(shRatio, shIdeal.band as [number, number]),
    score: roundTo(shScore, 2),
    confidence: roundTo(photoQuality * getClothingConfidence(measurements.clothingFit) * 0.85, 2),
  });
  
  // 4. Leg to Torso ratio
  const ltRatio = measurements.legHeight / measurements.torsoHeight;
  const ltIdeal = BODY_PROPORTION_IDEALS.legToTorso.neutral;
  const ltScore = ratioScore(ltRatio, ltIdeal.mid, ltIdeal.sigma);
  signals.push({
    key: 'legToTorso',
    label: 'Leg to Torso',
    value: roundTo(ltRatio, 2),
    band: ltIdeal.band as [number, number],
    status: ratioStatus(ltRatio, ltIdeal.band as [number, number]),
    score: roundTo(ltScore, 2),
    confidence: roundTo(photoQuality * 0.9, 2), // Height ratios more reliable
  });
  
  // Calculate overall proportions index
  const scores = signals.map(s => s.score);
  const weights = [1.2, 1.0, 1.0, 0.8]; // SW slightly more important
  const confidences = signals.map(s => s.confidence);
  
  const proportionsIndex = weightedMean(scores, weights, confidences);
  const avgConfidence = signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length;
  
  return {
    signals,
    proportionsIndex: roundTo(proportionsIndex, 3),
    confidence: roundTo(avgConfidence, 2),
  };
}

/**
 * Calculate posture scores (requires side view)
 */
export function calculatePosture(
  measurements: BodyMeasurements,
  photoQuality: number
): {
  signals: Array<{
    key: string;
    label: string;
    severity: 'none' | 'mild' | 'moderate' | 'significant';
    confidence: number;
  }>;
  postureIndex: number;
  confidence: number;
} | null {
  // Posture requires side view angles
  if (
    measurements.headForwardAngle === undefined &&
    measurements.shoulderAngle === undefined &&
    measurements.pelvicTiltAngle === undefined
  ) {
    return null;
  }
  
  const signals: Array<{
    key: string;
    label: string;
    severity: 'none' | 'mild' | 'moderate' | 'significant';
    confidence: number;
  }> = [];
  
  let totalScore = 0;
  let count = 0;
  
  // Forward head posture
  if (measurements.headForwardAngle !== undefined) {
    const severity = getPostureSeverity(measurements.headForwardAngle, [5, 10, 15]);
    const score = severity === 'none' ? 1 : severity === 'mild' ? 0.75 : severity === 'moderate' ? 0.5 : 0.25;
    signals.push({
      key: 'forwardHead',
      label: 'Forward Head',
      severity,
      confidence: roundTo(photoQuality * 0.7, 2),
    });
    totalScore += score;
    count++;
  }
  
  // Rounded shoulders
  if (measurements.shoulderAngle !== undefined) {
    const severity = getPostureSeverity(measurements.shoulderAngle, [8, 15, 25]);
    const score = severity === 'none' ? 1 : severity === 'mild' ? 0.75 : severity === 'moderate' ? 0.5 : 0.25;
    signals.push({
      key: 'roundedShoulders',
      label: 'Rounded Shoulders',
      severity,
      confidence: roundTo(photoQuality * 0.65, 2),
    });
    totalScore += score;
    count++;
  }
  
  // Pelvic tilt
  if (measurements.pelvicTiltAngle !== undefined) {
    const severity = getPostureSeverity(Math.abs(measurements.pelvicTiltAngle), [5, 10, 15]);
    const score = severity === 'none' ? 1 : severity === 'mild' ? 0.75 : severity === 'moderate' ? 0.5 : 0.25;
    signals.push({
      key: 'pelvicTilt',
      label: 'Pelvic Tilt',
      severity,
      confidence: roundTo(photoQuality * 0.6, 2),
    });
    totalScore += score;
    count++;
  }
  
  // Rib flare
  if (measurements.ribFlareAngle !== undefined) {
    const severity = getPostureSeverity(measurements.ribFlareAngle, [10, 20, 30]);
    const score = severity === 'none' ? 1 : severity === 'mild' ? 0.75 : severity === 'moderate' ? 0.5 : 0.25;
    signals.push({
      key: 'ribFlare',
      label: 'Rib Flare',
      severity,
      confidence: roundTo(photoQuality * 0.55, 2),
    });
    totalScore += score;
    count++;
  }
  
  const postureIndex = count > 0 ? totalScore / count : 0.7;
  const avgConfidence = signals.reduce((sum, s) => sum + s.confidence, 0) / (signals.length || 1);
  
  return {
    signals,
    postureIndex: roundTo(postureIndex, 3),
    confidence: roundTo(avgConfidence, 2),
  };
}

/**
 * Calculate composition presentation score
 * IMPORTANT: Never output body fat %, use ranges
 */
export function calculateComposition(
  _measurements: BodyMeasurements,
  leannessEstimate: number, // 0-1 from visual analysis
  photoQuality: number
): {
  leannessPresentation: { min: number; max: number; score: number };
  sharpness: 'softer' | 'balanced' | 'sharper';
  confidence: number;
} {
  // Convert estimate to range (never precise %)
  const baseScore = leannessEstimate * 10;
  const uncertainty = (1 - photoQuality) * 2; // More uncertainty with lower quality
  
  return {
    leannessPresentation: {
      min: roundTo(Math.max(0, baseScore - uncertainty), 1),
      max: roundTo(Math.min(10, baseScore + uncertainty), 1),
      score: roundTo(baseScore, 1),
    },
    sharpness: leannessEstimate > 0.7 ? 'sharper' : leannessEstimate > 0.4 ? 'balanced' : 'softer',
    confidence: roundTo(photoQuality * getClothingConfidence(_measurements.clothingFit) * 0.5, 2),
  };
}

/**
 * Calculate vertical line score
 */
export function calculateVerticalLine(
  measurements: BodyMeasurements,
  photoQuality: number
): {
  line: 'short' | 'medium' | 'long';
  confidence: number;
} {
  const legToTorsoRatio = measurements.legHeight / measurements.torsoHeight;
  
  let line: 'short' | 'medium' | 'long';
  if (legToTorsoRatio < 0.9) {
    line = 'short';
  } else if (legToTorsoRatio > 1.1) {
    line = 'long';
  } else {
    line = 'medium';
  }
  
  return {
    line,
    confidence: roundTo(photoQuality * 0.85, 2),
  };
}

/**
 * Calculate overall body score with calibration
 */
export function calculateOverallBodyScore(
  proportionsIndex: number,
  postureResult: ReturnType<typeof calculatePosture>,
  compositionScore: number,
  verticalLineScore: number,
  photoQuality: number,
  hasSideView: boolean
): {
  raw: number;
  calibrated10: number;
  confidence: number;
  pillars: PillarScore[];
} {
  const weights = hasSideView 
    ? BODY_PILLAR_WEIGHTS_WITH_SIDE 
    : BODY_PILLAR_WEIGHTS_NO_SIDE;
  
  const pillars: PillarScore[] = [
    {
      name: 'Proportions',
      rawScore: proportionsIndex,
      weight: weights.proportions,
      confidence: photoQuality * 0.85,
      contribution: proportionsIndex * weights.proportions,
    },
    {
      name: 'Composition',
      rawScore: compositionScore / 10,
      weight: weights.composition,
      confidence: photoQuality * 0.5,
      contribution: (compositionScore / 10) * weights.composition,
    },
    {
      name: 'Vertical Line',
      rawScore: verticalLineScore,
      weight: weights.verticalLine,
      confidence: photoQuality * 0.8,
      contribution: verticalLineScore * weights.verticalLine,
    },
  ];
  
  // Add posture pillar if side view available
  if (hasSideView && postureResult) {
    pillars.push({
      name: 'Posture',
      rawScore: postureResult.postureIndex,
      weight: weights.posture,
      confidence: postureResult.confidence,
      contribution: postureResult.postureIndex * weights.posture,
    });
  }
  
  // Calculate weighted raw score
  const scores = pillars.map(p => p.rawScore);
  const pillarWeights = pillars.map(p => p.weight);
  const confidences = pillars.map(p => p.confidence);
  
  const raw = weightedMean(scores, pillarWeights, confidences);
  
  // Calibrate to 0-10 scale
  let calibrated10 = calibrateScore(raw, BODY_CALIBRATION);
  
  // Overall confidence
  const overallConfidence = weightedMean(confidences, pillarWeights, confidences.map(() => 1));
  
  // Apply honest extremes rule
  if (overallConfidence < CONFIDENCE_THRESHOLDS.allowExtremes) {
    calibrated10 = clamp(calibrated10, 2, 8);
  }
  
  return {
    raw: roundTo(raw, 3),
    calibrated10: roundTo(calibrated10, 1),
    confidence: roundTo(overallConfidence, 2),
    pillars,
  };
}

/**
 * Calculate potential range for body (modifiable factors)
 */
export function calculateBodyPotentialRange(
  currentScore: number,
  postureResult: ReturnType<typeof calculatePosture>,
  compositionScore: number,
  confidence: number
): { min: number; max: number } {
  // Modifiable: posture, composition (via training/diet)
  let potentialGain = 0;
  
  // Posture improvement potential
  if (postureResult) {
    const postureRoom = Math.max(0, (1 - postureResult.postureIndex) * 0.8);
    potentialGain += postureRoom;
  }
  
  // Composition improvement potential
  const compositionRoom = Math.max(0, (10 - compositionScore) * 0.15);
  potentialGain += compositionRoom;
  
  // Cap at realistic maximum
  potentialGain = Math.min(potentialGain, 2.0);
  
  // Widen range if confidence is low
  if (confidence < CONFIDENCE_THRESHOLDS.widenRangeBelow) {
    potentialGain *= 1.3;
  }
  
  return {
    min: roundTo(Math.max(currentScore, currentScore + potentialGain * 0.2), 1),
    max: roundTo(Math.min(10, currentScore + potentialGain), 1),
  };
}

// Helper functions

function getClothingConfidence(fit: string): number {
  switch (fit) {
    case 'tight': return 0.95;
    case 'fitted': return 0.85;
    case 'loose': return 0.5;
    default: return 0.6;
  }
}

function getPostureSeverity(
  angle: number,
  thresholds: [number, number, number]
): 'none' | 'mild' | 'moderate' | 'significant' {
  if (angle < thresholds[0]) return 'none';
  if (angle < thresholds[1]) return 'mild';
  if (angle < thresholds[2]) return 'moderate';
  return 'significant';
}
