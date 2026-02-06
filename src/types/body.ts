// Body Analysis Types

import { PhotoQuality, Lever, OverallScore } from './face';

export type ProportionStatus = 'ideal' | 'good' | 'moderate' | 'off';

export interface ProportionMetric {
  value: number;
  band: [number, number];
  status: ProportionStatus;
  confidence: number;
}

export type FrameSize = 'small' | 'medium' | 'large' | 'unknown';
export type VerticalLine = 'short' | 'medium' | 'long';

export interface Proportions {
  shoulderToWaist: ProportionMetric;
  waistToHip: ProportionMetric;
  shoulderToHip: ProportionMetric;
  legToTorso: ProportionMetric;
  frameEstimate: {
    size: FrameSize;
    confidence: number;
  };
  verticalLine: {
    line: VerticalLine;
    confidence: number;
  };
}

export type PostureSeverity = 'none' | 'mild' | 'moderate' | 'significant';

export interface PostureSignal {
  severity: PostureSeverity;
  confidence: number;
}

export interface PostureSignals {
  forwardHead?: PostureSignal;
  roundedShoulders?: PostureSignal;
  pelvicTilt?: PostureSignal;
  ribFlare?: PostureSignal;
}

export type DevelopmentLevel = 'underdeveloped' | 'balanced' | 'developed' | 'overdeveloped';

export interface MuscleBalance {
  upperBody: {
    level: DevelopmentLevel;
    confidence: number;
  };
  lowerBody: {
    level: DevelopmentLevel;
    confidence: number;
  };
}

export type FatDistribution = 'android' | 'gynoid' | 'balanced' | 'unknown';
export type BodySharpness = 'soft' | 'moderate' | 'sharp';

export interface BodyComposition {
  leannessPresentationScore: number; // 0-10
  fatDistribution: FatDistribution;
  sharpness: BodySharpness;
  confidence: number;
}

// Kibbe Body Types
export type KibbeType = 
  | 'Dramatic'
  | 'Soft Dramatic'
  | 'Romantic'
  | 'Theatrical Romantic'
  | 'Natural'
  | 'Soft Natural'
  | 'Flamboyant Natural'
  | 'Classic'
  | 'Soft Classic'
  | 'Dramatic Classic'
  | 'Gamine'
  | 'Soft Gamine'
  | 'Flamboyant Gamine';

export interface KibbeProbability {
  type: KibbeType;
  probability: number;
}

export interface KibbeResult {
  probabilities: KibbeProbability[];
  primaryType?: KibbeType; // only if confidence >= 0.6
  tendencies?: string;
  stylingNotes: string[];
  silhouetteRules: string[];
}

export interface BodyAnalysisResult {
  photoQuality: PhotoQuality;
  proportions: Proportions;
  postureSignals?: PostureSignals; // only if side photo provided
  muscleBalance: MuscleBalance;
  composition: BodyComposition;
  kibbe: KibbeResult;
  overall: OverallScore;
  topLevers: [Lever, Lever, Lever]; // exactly 3
}

// Action Plan Types
export type FitnessGoal = 'get_leaner' | 'build_muscle' | 'recomp' | 'maintain';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export interface UserStats {
  heightCm: number;
  weightKg: number;
  goal: FitnessGoal;
  experienceLevel: ExperienceLevel;
  age?: number;
}

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string; // e.g., "8-12" or "12-15"
  notes?: string;
}

export interface WorkoutDay {
  name: string;
  focus: string;
  exercises: Exercise[];
}

export interface WorkoutPlan {
  split: string;
  daysPerWeek: number;
  emphasis: string[];
  days: WorkoutDay[];
  notes: string[];
}

export interface ActionPlan {
  nutrition: MacroTargets;
  workout: WorkoutPlan;
  priorityAreas: string[];
  timeline: string;
}
