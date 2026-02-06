// Face Scoring Engine
// Implements Section D: Science/Analytics, Tolerance Bands, Confidence

import {
  RatioSignal,
  FeatureScore,
  PillarScore,
  FACE_PILLAR_WEIGHTS,
  FACE_CALIBRATION,
  FACE_RATIO_IDEALS,
  CONFIDENCE_THRESHOLDS,
  GOLDEN_RATIO,
} from './types';
import {
  calibrateScore,
  ratioScore,
  ratioStatus,
  weightedMean,
  symmetryScore,
  thirdsBalanceScore,
  roundTo,
  clamp,
} from './math';

/**
 * Face landmarks structure (simplified)
 * In production, this would come from ML model
 */
export interface FaceLandmarks {
  // Key points
  leftEye: { x: number; y: number };
  rightEye: { x: number; y: number };
  nose: { x: number; y: number };
  leftMouth: { x: number; y: number };
  rightMouth: { x: number; y: number };
  chin: { x: number; y: number };
  
  // Face bounds
  faceWidth: number;
  faceHeight: number;
  
  // Thirds measurements
  hairlineToEyebrow: number;
  eyebrowToNose: number;
  noseToChín: number;
  
  // Feature widths
  leftEyeWidth: number;
  rightEyeWidth: number;
  noseWidth: number;
  mouthWidth: number;
  interEyeDistance: number;
  
  // Jaw/chin
  jawWidth: number;
  chinWidth: number;
  
  // Symmetry pairs
  leftFaceWidth: number;
  rightFaceWidth: number;
  leftCheekHeight: number;
  rightCheekHeight: number;
  leftBrowHeight: number;
  rightBrowHeight: number;
}

/**
 * Calculate golden ratio harmony score
 * This is the PRIMARY scoring pillar (42% weight)
 */
export function calculateGoldenRatioHarmony(
  landmarks: FaceLandmarks,
  photoQuality: number
): {
  harmonyIndex: number; // 0-1
  ratioSignals: RatioSignal[];
  confidence: number;
} {
  const signals: RatioSignal[] = [];
  let totalScore = 0;
  let totalWeight = 0;
  
  // 1. Face width to length ratio
  const faceWLRatio = landmarks.faceWidth / landmarks.faceHeight;
  const faceWLIdeal = FACE_RATIO_IDEALS.faceWidthToLength;
  const faceWLScore = ratioScore(faceWLRatio, faceWLIdeal.mid, faceWLIdeal.sigma);
  signals.push({
    key: 'faceWidthToLength',
    label: faceWLIdeal.label,
    value: roundTo(faceWLRatio, 3),
    idealMid: faceWLIdeal.mid,
    band: [faceWLIdeal.mid * 0.9, faceWLIdeal.mid * 1.1],
    status: ratioStatus(faceWLRatio, [faceWLIdeal.mid * 0.9, faceWLIdeal.mid * 1.1]),
    score: roundTo(faceWLScore, 2),
    confidence: photoQuality * 0.9,
  });
  totalScore += faceWLScore * 1.5; // Higher weight for golden ratio
  totalWeight += 1.5;
  
  // 2. Inter-eye spacing relative to eye width
  const avgEyeWidth = (landmarks.leftEyeWidth + landmarks.rightEyeWidth) / 2;
  const interEyeRatio = landmarks.interEyeDistance / avgEyeWidth;
  const interEyeIdeal = FACE_RATIO_IDEALS.eyeSpacing;
  const interEyeScore = ratioScore(interEyeRatio, interEyeIdeal.mid, interEyeIdeal.sigma);
  signals.push({
    key: 'interEyeSpacing',
    label: interEyeIdeal.label,
    value: roundTo(interEyeRatio, 3),
    idealMid: interEyeIdeal.mid,
    band: [interEyeIdeal.mid * 0.92, interEyeIdeal.mid * 1.08],
    status: ratioStatus(interEyeRatio, [interEyeIdeal.mid * 0.92, interEyeIdeal.mid * 1.08]),
    score: roundTo(interEyeScore, 2),
    confidence: photoQuality * 0.95, // Very stable measurement
  });
  totalScore += interEyeScore * 1.2;
  totalWeight += 1.2;
  
  // 3. Nose width to eye width
  const noseToEyeRatio = landmarks.noseWidth / avgEyeWidth;
  const noseToEyeIdeal = FACE_RATIO_IDEALS.noseToEyeWidth;
  const noseToEyeScore = ratioScore(noseToEyeRatio, noseToEyeIdeal.mid, noseToEyeIdeal.sigma);
  signals.push({
    key: 'noseToEyeWidth',
    label: noseToEyeIdeal.label,
    value: roundTo(noseToEyeRatio, 3),
    idealMid: noseToEyeIdeal.mid,
    band: [noseToEyeIdeal.mid * 0.85, noseToEyeIdeal.mid * 1.15],
    status: ratioStatus(noseToEyeRatio, [noseToEyeIdeal.mid * 0.85, noseToEyeIdeal.mid * 1.15]),
    score: roundTo(noseToEyeScore, 2),
    confidence: photoQuality * 0.85,
  });
  totalScore += noseToEyeScore;
  totalWeight += 1;
  
  // 4. Mouth width to nose width (close to golden ratio)
  const mouthToNoseRatio = landmarks.mouthWidth / landmarks.noseWidth;
  const mouthToNoseIdeal = FACE_RATIO_IDEALS.mouthToNoseWidth;
  const mouthToNoseScore = ratioScore(mouthToNoseRatio, mouthToNoseIdeal.mid, mouthToNoseIdeal.sigma);
  signals.push({
    key: 'mouthToNoseWidth',
    label: mouthToNoseIdeal.label,
    value: roundTo(mouthToNoseRatio, 3),
    idealMid: mouthToNoseIdeal.mid,
    band: [mouthToNoseIdeal.mid * 0.85, mouthToNoseIdeal.mid * 1.15],
    status: ratioStatus(mouthToNoseRatio, [mouthToNoseIdeal.mid * 0.85, mouthToNoseIdeal.mid * 1.15]),
    score: roundTo(mouthToNoseScore, 2),
    confidence: photoQuality * 0.8,
  });
  totalScore += mouthToNoseScore;
  totalWeight += 1;
  
  // 5. Eye width to face width
  const eyeToFaceRatio = avgEyeWidth / landmarks.faceWidth;
  const eyeToFaceIdeal = FACE_RATIO_IDEALS.eyeToFaceWidth;
  const eyeToFaceScore = ratioScore(eyeToFaceRatio, eyeToFaceIdeal.mid, eyeToFaceIdeal.sigma);
  signals.push({
    key: 'eyeToFaceWidth',
    label: eyeToFaceIdeal.label,
    value: roundTo(eyeToFaceRatio, 3),
    idealMid: eyeToFaceIdeal.mid,
    band: [eyeToFaceIdeal.mid * 0.9, eyeToFaceIdeal.mid * 1.1],
    status: ratioStatus(eyeToFaceRatio, [eyeToFaceIdeal.mid * 0.9, eyeToFaceIdeal.mid * 1.1]),
    score: roundTo(eyeToFaceScore, 2),
    confidence: photoQuality * 0.85,
  });
  totalScore += eyeToFaceScore;
  totalWeight += 1;
  
  // 6. Jaw to face width (phi ratio ideal)
  const jawToFaceRatio = landmarks.jawWidth / landmarks.faceWidth;
  const jawIdealRatio = 1 / GOLDEN_RATIO; // ~0.618
  const jawScore = ratioScore(jawToFaceRatio, jawIdealRatio, 0.1);
  signals.push({
    key: 'jawToFaceWidth',
    label: 'Jaw width to face width',
    value: roundTo(jawToFaceRatio, 3),
    idealMid: jawIdealRatio,
    band: [jawIdealRatio * 0.85, jawIdealRatio * 1.15],
    status: ratioStatus(jawToFaceRatio, [jawIdealRatio * 0.85, jawIdealRatio * 1.15]),
    score: roundTo(jawScore, 2),
    confidence: photoQuality * 0.75, // Jaw harder to measure
  });
  totalScore += jawScore * 0.8;
  totalWeight += 0.8;
  
  const harmonyIndex = totalWeight > 0 ? totalScore / totalWeight : 0;
  const avgConfidence = signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length;
  
  return {
    harmonyIndex: roundTo(harmonyIndex, 3),
    ratioSignals: signals.slice(0, 6), // Max 6 signals
    confidence: roundTo(avgConfidence, 2),
  };
}

/**
 * Calculate symmetry score
 */
export function calculateSymmetry(
  landmarks: FaceLandmarks,
  photoQuality: number
): {
  symmetryIndex: number; // 0-1
  confidence: number;
} {
  const leftValues = [
    landmarks.leftFaceWidth,
    landmarks.leftCheekHeight,
    landmarks.leftBrowHeight,
    landmarks.leftEyeWidth,
  ];
  
  const rightValues = [
    landmarks.rightFaceWidth,
    landmarks.rightCheekHeight,
    landmarks.rightBrowHeight,
    landmarks.rightEyeWidth,
  ];
  
  const score = symmetryScore(leftValues, rightValues, 0.08);
  
  return {
    symmetryIndex: roundTo(score, 3),
    confidence: roundTo(photoQuality * 0.85, 2), // Symmetry is moderately reliable
  };
}

/**
 * Calculate thirds balance score
 */
export function calculateThirdsBalance(
  landmarks: FaceLandmarks,
  photoQuality: number
): {
  thirdsIndex: number; // 0-1
  notes: string;
  confidence: number;
} {
  const { hairlineToEyebrow, eyebrowToNose, noseToChín } = landmarks;
  const total = hairlineToEyebrow + eyebrowToNose + noseToChín;
  
  if (total <= 0) {
    return {
      thirdsIndex: 0.5,
      notes: 'Unable to measure facial thirds',
      confidence: 0,
    };
  }
  
  const upperRatio = hairlineToEyebrow / total;
  const middleRatio = eyebrowToNose / total;
  const lowerRatio = noseToChín / total;
  
  const score = thirdsBalanceScore(hairlineToEyebrow, eyebrowToNose, noseToChín);
  
  // Generate notes
  const notes: string[] = [];
  const ideal = 1 / 3;
  
  if (upperRatio < ideal - 0.05) notes.push('Shorter forehead');
  if (upperRatio > ideal + 0.05) notes.push('Longer forehead');
  if (middleRatio < ideal - 0.05) notes.push('Shorter midface');
  if (middleRatio > ideal + 0.05) notes.push('Longer midface');
  if (lowerRatio < ideal - 0.05) notes.push('Shorter lower face');
  if (lowerRatio > ideal + 0.05) notes.push('Longer lower face');
  
  const noteText = notes.length > 0 
    ? notes.join(', ') 
    : 'Well-balanced facial proportions';
  
  return {
    thirdsIndex: roundTo(score, 3),
    notes: noteText,
    confidence: roundTo(photoQuality * 0.8, 2), // Hairline can be hard to detect
  };
}

/**
 * Calculate individual feature scores
 */
export function calculateFeatureScores(
  landmarks: FaceLandmarks,
  photoQuality: number,
  _textureScores?: { skin: number; hair: number } // From image analysis
): Record<string, FeatureScore> {
  // Eyes - very geometry-dependent, high confidence
  const eyeScore = Math.min(
    ratioScore(landmarks.leftEyeWidth / landmarks.rightEyeWidth, 1.0, 0.05),
    ratioScore((landmarks.leftEyeWidth + landmarks.rightEyeWidth) / 2 / landmarks.faceWidth, 0.23, 0.04)
  );
  
  // Brows - geometry-based
  const browScore = Math.min(
    ratioScore(landmarks.leftBrowHeight / landmarks.rightBrowHeight, 1.0, 0.08),
    0.85 // Default good if symmetric
  );
  
  // Nose - proportion-based
  const noseScore = ratioScore(
    landmarks.noseWidth / landmarks.faceWidth,
    0.25,
    0.04
  );
  
  // Lips/Mouth - width proportion
  const lipsScore = ratioScore(
    landmarks.mouthWidth / landmarks.faceWidth,
    0.38,
    0.06
  );
  
  // Cheekbones - harder to measure from 2D
  const cheekbonesScore = 0.7; // Conservative default
  
  // Jaw/Chin - proportion-based
  const jawChinScore = ratioScore(
    landmarks.jawWidth / landmarks.faceWidth,
    0.618,
    0.08
  );
  
  // Skin and hair - texture-dependent, lower confidence from photos
  const skinScore = _textureScores?.skin ?? 0.6;
  const hairScore = _textureScores?.hair ?? 0.6;
  
  return {
    eyes: {
      score10: roundTo(eyeScore * 10, 1),
      confidence: roundTo(photoQuality * 0.9, 2),
    },
    brows: {
      score10: roundTo(browScore * 10, 1),
      confidence: roundTo(photoQuality * 0.85, 2),
    },
    nose: {
      score10: roundTo(noseScore * 10, 1),
      confidence: roundTo(photoQuality * 0.8, 2),
    },
    lips: {
      score10: roundTo(lipsScore * 10, 1),
      confidence: roundTo(photoQuality * 0.75, 2),
    },
    cheekbones: {
      score10: roundTo(cheekbonesScore * 10, 1),
      confidence: roundTo(photoQuality * 0.5, 2), // Low confidence from 2D
    },
    jawChin: {
      score10: roundTo(jawChinScore * 10, 1),
      confidence: roundTo(photoQuality * 0.7, 2),
    },
    skin: {
      score10: roundTo(skinScore * 10, 1),
      confidence: roundTo(photoQuality * 0.5, 2), // Very context-dependent
    },
    hair: {
      score10: roundTo(hairScore * 10, 1),
      confidence: roundTo(photoQuality * 0.4, 2), // Highly style-dependent
    },
  };
}

/**
 * Calculate overall face score with calibration
 */
export function calculateOverallFaceScore(
  harmonyIndex: number,
  symmetryIndex: number,
  thirdsIndex: number,
  featureScores: Record<string, FeatureScore>,
  photoQuality: number
): {
  raw: number;
  calibrated10: number;
  confidence: number;
  pillars: PillarScore[];
} {
  // Calculate feature pillar (average of geometry features)
  const geometryFeatures = ['eyes', 'brows', 'nose', 'lips', 'jawChin'];
  const featureAvg = geometryFeatures.reduce((sum, key) => {
    return sum + (featureScores[key]?.score10 ?? 5) / 10;
  }, 0) / geometryFeatures.length;
  
  // Calculate presentation pillar (skin/hair)
  const presentationAvg = (
    (featureScores.skin?.score10 ?? 5) / 10 +
    (featureScores.hair?.score10 ?? 5) / 10
  ) / 2;
  
  // Build pillars
  const pillars: PillarScore[] = [
    {
      name: 'Golden Ratio Harmony',
      rawScore: harmonyIndex,
      weight: FACE_PILLAR_WEIGHTS.harmony,
      confidence: photoQuality * 0.9,
      contribution: harmonyIndex * FACE_PILLAR_WEIGHTS.harmony,
    },
    {
      name: 'Symmetry',
      rawScore: symmetryIndex,
      weight: FACE_PILLAR_WEIGHTS.symmetry,
      confidence: photoQuality * 0.85,
      contribution: symmetryIndex * FACE_PILLAR_WEIGHTS.symmetry,
    },
    {
      name: 'Thirds Balance',
      rawScore: thirdsIndex,
      weight: FACE_PILLAR_WEIGHTS.thirds,
      confidence: photoQuality * 0.8,
      contribution: thirdsIndex * FACE_PILLAR_WEIGHTS.thirds,
    },
    {
      name: 'Feature Geometry',
      rawScore: featureAvg,
      weight: FACE_PILLAR_WEIGHTS.features,
      confidence: photoQuality * 0.75,
      contribution: featureAvg * FACE_PILLAR_WEIGHTS.features,
    },
    {
      name: 'Presentation',
      rawScore: presentationAvg,
      weight: FACE_PILLAR_WEIGHTS.presentation,
      confidence: photoQuality * 0.5,
      contribution: presentationAvg * FACE_PILLAR_WEIGHTS.presentation,
    },
  ];
  
  // Calculate weighted raw score
  const scores = pillars.map(p => p.rawScore);
  const weights = pillars.map(p => p.weight);
  const confidences = pillars.map(p => p.confidence);
  
  const raw = weightedMean(scores, weights, confidences);
  
  // Calibrate to 0-10 scale
  let calibrated10 = calibrateScore(raw, FACE_CALIBRATION);
  
  // Overall confidence
  const overallConfidence = weightedMean(confidences, weights, confidences.map(() => 1));
  
  // Apply honest extremes rule
  if (overallConfidence < CONFIDENCE_THRESHOLDS.allowExtremes) {
    // Don't allow extreme scores with low confidence
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
 * Calculate potential range (modifiable factors only)
 */
export function calculatePotentialRange(
  currentScore: number,
  featureScores: Record<string, FeatureScore>,
  confidence: number
): { min: number; max: number } {
  // Modifiable factors: skin, hair, grooming (presentation pillar)
  const skinRoom = Math.max(0, (10 - (featureScores.skin?.score10 ?? 5)) * 0.15);
  const hairRoom = Math.max(0, (10 - (featureScores.hair?.score10 ?? 5)) * 0.1);
  
  // Max potential from modifiable factors
  let maxPotential = currentScore + skinRoom + hairRoom;
  
  // Cap at realistic maximum
  maxPotential = Math.min(maxPotential, currentScore + 1.5);
  maxPotential = Math.min(maxPotential, 9.5);
  
  // Widen range if confidence is low
  let rangeWidth = maxPotential - currentScore;
  if (confidence < CONFIDENCE_THRESHOLDS.widenRangeBelow) {
    rangeWidth *= 1.5;
  }
  
  return {
    min: roundTo(Math.max(currentScore, currentScore + rangeWidth * 0.3), 1),
    max: roundTo(Math.min(10, currentScore + rangeWidth), 1),
  };
}
