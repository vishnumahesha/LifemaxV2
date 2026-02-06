import { z } from 'zod';

// Photo Quality Schema
export const photoQualitySchema = z.object({
  score: z.number().min(0).max(1),
  issues: z.array(z.string()),
});

// Appearance Profile Schema
export const appearanceProfileSchema = z.object({
  presentation: z.enum(['male-presenting', 'female-presenting', 'ambiguous']),
  confidence: z.number().min(0).max(1),
  ageRange: z.object({
    min: z.number().int().positive(),
    max: z.number().int().positive(),
  }).optional(),
  ageConfidence: z.number().min(0).max(1).optional(),
  dimorphismScore10: z.number().min(0).max(10).optional(),
  masculinityFemininity: z.object({
    masculinity: z.number().min(0).max(100),
    femininity: z.number().min(0).max(100),
  }).optional(),
});

// Face Shape Schema
export const faceShapeSchema = z.object({
  label: z.enum(['oval', 'round', 'square', 'heart', 'diamond', 'oblong']),
  confidence: z.number().min(0).max(1),
});

// Ratio Signal Schema
export const ratioSignalSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.number(),
  band: z.tuple([z.number(), z.number()]),
  status: z.enum(['good', 'ok', 'off']),
  confidence: z.number().min(0).max(1),
});

// Golden Ratio Harmony Schema
export const goldenRatioHarmonySchema = z.object({
  harmonyIndex10: z.number().min(0).max(10),
  ratioSignals: z.array(ratioSignalSchema).max(6),
});

// Feature Score Schema
export const featureScoreSchema = z.object({
  score: z.number().min(0).max(10),
  confidence: z.number().min(0).max(1),
});

// Feature Scores Schema
export const featureScoresSchema = z.object({
  eyes: featureScoreSchema,
  brows: featureScoreSchema,
  nose: featureScoreSchema,
  lips: featureScoreSchema,
  cheekbones: featureScoreSchema,
  jawChin: featureScoreSchema,
  skin: featureScoreSchema,
  hair: featureScoreSchema,
});

// Overall Score Schema
export const overallScoreSchema = z.object({
  currentScore10: z.number().min(0).max(10),
  potentialRange: z.object({
    min: z.number().min(0).max(10),
    max: z.number().min(0).max(10),
  }),
  confidence: z.number().min(0).max(1),
  summary: z.string(),
});

// Lever Schema
export const leverSchema = z.object({
  name: z.string(),
  deltaRange: z.object({
    min: z.number(),
    max: z.number(),
  }),
  timeline: z.string(),
  explanation: z.string(),
  steps: z.array(z.string()),
});

// Haircut Recommendation Schema
export const haircutRecommendationSchema = z.object({
  style: z.string(),
  description: z.string(),
  suitability: z.string(),
});

// Styling Recommendations Schema
export const stylingRecommendationsSchema = z.object({
  haircuts: z.object({
    casualTextured: haircutRecommendationSchema,
    cleanProfessional: haircutRecommendationSchema,
    safeDefault: haircutRecommendationSchema,
  }),
  glassesFrames: z.array(z.string()),
  groomingTips: z.array(z.string()),
});

// Complete Face Analysis Result Schema
export const faceAnalysisResultSchema = z.object({
  photoQuality: photoQualitySchema,
  appearanceProfile: appearanceProfileSchema,
  faceShape: faceShapeSchema,
  goldenRatioHarmony: goldenRatioHarmonySchema,
  symmetryIndex10: z.number().min(0).max(10),
  thirdsBalance10: z.number().min(0).max(10),
  thirdsNotes: z.string(),
  featureScores: featureScoresSchema,
  overall: overallScoreSchema,
  topLevers: z.tuple([leverSchema, leverSchema, leverSchema]),
  stylingRecommendations: stylingRecommendationsSchema,
});

// Preview Options Schema
export const previewOptionsSchema = z.object({
  hairstyleCategory: z.enum(['short', 'medium', 'long']),
  hairstyleTexture: z.enum(['textured', 'clean', 'wavy']),
  glassesStyle: z.enum(['none', 'rectangular', 'round', 'aviator', 'browline']),
  enhancementLevel: z.enum(['subtle', 'moderate']),
});

// Preview Result Schema
export const previewResultSchema = z.object({
  images: z.array(z.object({
    url: z.string().url(),
    description: z.string(),
  })).min(1).max(3),
  disclaimer: z.string(),
  isRestricted: z.boolean(),
});

// Request Schemas for API endpoints
export const faceScanRequestSchema = z.object({
  frontPhotoBase64: z.string().min(1, 'Front photo is required'),
  sidePhotoBase64: z.string().optional(),
});

export const facePreviewRequestSchema = z.object({
  faceScanId: z.string().uuid(),
  options: previewOptionsSchema,
});

// Type exports for inferred types
export type FaceScanRequest = z.infer<typeof faceScanRequestSchema>;
export type FacePreviewRequest = z.infer<typeof facePreviewRequestSchema>;
export type FaceAnalysisResultValidated = z.infer<typeof faceAnalysisResultSchema>;
export type PreviewResultValidated = z.infer<typeof previewResultSchema>;
