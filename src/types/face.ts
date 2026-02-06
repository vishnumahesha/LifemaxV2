// Face Analysis Types

export interface PhotoQuality {
  score: number; // 0-1
  issues: string[];
}

export type Presentation = 'male-presenting' | 'female-presenting' | 'ambiguous';

export interface AppearanceProfile {
  presentation: Presentation;
  confidence: number; // 0-1
  ageRange?: {
    min: number;
    max: number;
  };
  ageConfidence?: number;
  dimorphismScore10?: number;
  masculinityFemininity?: {
    masculinity: number; // 0-100
    femininity: number; // 0-100
  };
}

export type FaceShapeLabel = 'oval' | 'round' | 'square' | 'heart' | 'diamond' | 'oblong';

export interface FaceShape {
  label: FaceShapeLabel;
  confidence: number;
}

export type RatioStatus = 'good' | 'ok' | 'off';

export interface RatioSignal {
  key: string;
  label: string;
  value: number;
  band: [number, number]; // [min, max]
  status: RatioStatus;
  confidence: number;
}

export interface GoldenRatioHarmony {
  harmonyIndex10: number;
  ratioSignals: RatioSignal[]; // max 6
}

export interface FeatureScore {
  score: number; // 0-10
  confidence: number;
}

export interface FeatureScores {
  eyes: FeatureScore;
  brows: FeatureScore;
  nose: FeatureScore;
  lips: FeatureScore;
  cheekbones: FeatureScore;
  jawChin: FeatureScore;
  skin: FeatureScore;
  hair: FeatureScore;
}

export interface OverallScore {
  currentScore10: number;
  potentialRange: {
    min: number;
    max: number;
  };
  confidence: number;
  summary: string;
}

export interface Lever {
  name: string;
  deltaRange: {
    min: number;
    max: number;
  };
  timeline: string;
  explanation: string;
  steps: string[];
}

export interface HaircutRecommendation {
  style: string;
  description: string;
  suitability: string;
}

export interface StylingRecommendations {
  haircuts: {
    casualTextured: HaircutRecommendation;
    cleanProfessional: HaircutRecommendation;
    safeDefault: HaircutRecommendation;
  };
  glassesFrames: string[];
  groomingTips: string[];
}

export interface FaceAnalysisResult {
  photoQuality: PhotoQuality;
  appearanceProfile: AppearanceProfile;
  faceShape: FaceShape;
  goldenRatioHarmony: GoldenRatioHarmony;
  symmetryIndex10: number;
  thirdsBalance10: number;
  thirdsNotes: string;
  featureScores: FeatureScores;
  overall: OverallScore;
  topLevers: [Lever, Lever, Lever]; // exactly 3
  stylingRecommendations: StylingRecommendations;
}

// Preview Generation Types
export type HairstyleCategory = 'short' | 'medium' | 'long';
export type HairstyleTexture = 'textured' | 'clean' | 'wavy';
export type GlassesStyle = 'none' | 'rectangular' | 'round' | 'aviator' | 'browline';
export type EnhancementLevel = 'subtle' | 'moderate';

export interface PreviewOptions {
  hairstyleCategory: HairstyleCategory;
  hairstyleTexture: HairstyleTexture;
  glassesStyle: GlassesStyle;
  enhancementLevel: EnhancementLevel;
}

export interface PreviewImage {
  url: string;
  description: string;
}

export interface PreviewResult {
  images: PreviewImage[];
  disclaimer: string;
  isRestricted: boolean; // true if user appears <18 or low confidence
}
