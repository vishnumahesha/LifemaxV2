// Deterministic Scoring Engine Types
// Following spec: strict validation, honest scoring, no fake precision

export type ViewType =
  | 'face_front'
  | 'face_side'
  | 'body_front'
  | 'body_side'
  | 'body_back';

export type BandStatus = 'good' | 'ok' | 'off';

// Pose estimation for view classification
export interface PoseEstimate {
  yaw: number;    // rotation around vertical axis (-180 to 180)
  pitch: number;  // rotation around horizontal axis (-90 to 90)
  roll: number;   // rotation around front-back axis (-180 to 180)
  confidence: number;
}

// Photo validation result
export interface PhotoValidation {
  isValid: boolean;
  detectedView: ViewType | 'unknown' | 'rejected';
  pose: PoseEstimate;
  qualityScore: number; // 0-1
  issues: string[];
  warnings: string[];
  rejectionReason?: string;
}

// Stability sampling result
export interface StabilityStats {
  median: number;
  iqr: number;        // interquartile range
  stability: number;  // 0-1, higher = more stable
  samples: number[];
}

// Ratio signal with tolerance bands
export interface RatioSignal {
  key: string;
  label: string;
  value: number;
  idealMid: number;
  band: [number, number];
  status: BandStatus;
  score: number;      // 0-1
  confidence: number; // 0-1
}

// Feature score with confidence
export interface FeatureScore {
  score10: number;
  confidence: number;
  stability?: number;
}

// Scoring pillar contribution
export interface PillarScore {
  name: string;
  rawScore: number;   // 0-1
  weight: number;
  confidence: number;
  contribution: number; // rawScore * weight * confidence
}

// Calibration config for sigmoid mapping
export interface CalibrationConfig {
  a: number;  // steepness
  b: number;  // midpoint
}

// Default calibration (avg ~5.5)
export const FACE_CALIBRATION: CalibrationConfig = {
  a: 7.5,
  b: 0.58,
};

export const BODY_CALIBRATION: CalibrationConfig = {
  a: 7.0,
  b: 0.58,
};

// Face pillar weights (golden ratio is biggest)
export const FACE_PILLAR_WEIGHTS = {
  harmony: 0.42,      // H - golden ratio harmony
  symmetry: 0.18,     // Y - symmetry
  thirds: 0.15,       // T - thirds/fifths balance
  features: 0.15,     // F - feature geometry
  presentation: 0.10, // P - skin/hair/grooming
} as const;

// Body pillar weights (with side photo)
export const BODY_PILLAR_WEIGHTS_WITH_SIDE = {
  proportions: 0.40,  // R
  posture: 0.25,      // Po
  composition: 0.25,  // C
  verticalLine: 0.10, // V
} as const;

// Body pillar weights (without side photo)
export const BODY_PILLAR_WEIGHTS_NO_SIDE = {
  proportions: 0.50,  // R
  composition: 0.30,  // C
  verticalLine: 0.20, // V
  posture: 0.00,      // Po - not available
} as const;

// View classification thresholds
export const VIEW_THRESHOLDS = {
  face: {
    front: {
      maxYaw: 12,
      maxPitch: 10,
      maxRoll: 10,
    },
    side: {
      minYaw: 75,
      maxYaw: 105,
    },
  },
  body: {
    front: {
      maxRotation: 15, // shoulder/hip rotation
    },
    side: {
      minRotation: 70,
      maxRotation: 110,
    },
  },
} as const;

// Quality thresholds
export const QUALITY_THRESHOLDS = {
  minAcceptable: 0.50,      // below this = reject
  minGood: 0.70,            // below this = warn
  minConfident: 0.75,       // needed for extreme scores
  blurThreshold: 0.30,      // Laplacian variance threshold
  minResolution: 256,       // minimum face/body dimension
} as const;

// Confidence thresholds for honest scoring
export const CONFIDENCE_THRESHOLDS = {
  allowExtremes: 0.70,      // overall confidence needed for scores <2 or >8
  stabilityMin: 0.70,       // stability needed for confident results
  widenRangeBelow: 0.60,    // widen potential range if below this
} as const;

// Golden ratio and facial proportion ideal values
export const GOLDEN_RATIO = 1.618;

export const FACE_RATIO_IDEALS = {
  // Width ratios
  eyeSpacing: { mid: 1.0, sigma: 0.08, label: 'Inter-eye spacing' },
  noseToEyeWidth: { mid: 0.618, sigma: 0.10, label: 'Nose width to eye width' },
  mouthToNoseWidth: { mid: 1.5, sigma: 0.12, label: 'Mouth width to nose width' },
  
  // Height ratios (thirds)
  upperThird: { mid: 0.33, sigma: 0.05, label: 'Upper third proportion' },
  middleThird: { mid: 0.33, sigma: 0.05, label: 'Middle third proportion' },
  lowerThird: { mid: 0.33, sigma: 0.05, label: 'Lower third proportion' },
  
  // Golden ratios
  faceWidthToLength: { mid: 0.618, sigma: 0.08, label: 'Face width to length' },
  lipToNose: { mid: GOLDEN_RATIO, sigma: 0.15, label: 'Lip to nose ratio' },
  eyeToFaceWidth: { mid: 0.46, sigma: 0.06, label: 'Eye width to face width' },
} as const;

// Body proportion ideal values
export const BODY_PROPORTION_IDEALS = {
  shoulderToWaist: {
    male: { mid: 1.45, sigma: 0.12, band: [1.3, 1.6] },
    female: { mid: 1.25, sigma: 0.10, band: [1.15, 1.35] },
  },
  waistToHip: {
    male: { mid: 0.9, sigma: 0.08, band: [0.8, 1.0] },
    female: { mid: 0.75, sigma: 0.08, band: [0.65, 0.85] },
  },
  shoulderToHip: {
    male: { mid: 1.3, sigma: 0.10, band: [1.2, 1.4] },
    female: { mid: 1.0, sigma: 0.08, band: [0.9, 1.1] },
  },
  legToTorso: {
    neutral: { mid: 1.0, sigma: 0.10, band: [0.9, 1.15] },
  },
} as const;
