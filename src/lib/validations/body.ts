import { z } from 'zod';
import { photoQualitySchema, overallScoreSchema, leverSchema } from './face';

// Proportion Metric Schema
export const proportionMetricSchema = z.object({
  value: z.number(),
  band: z.tuple([z.number(), z.number()]),
  status: z.enum(['ideal', 'good', 'moderate', 'off']),
  confidence: z.number().min(0).max(1),
});

// Proportions Schema
export const proportionsSchema = z.object({
  shoulderToWaist: proportionMetricSchema,
  waistToHip: proportionMetricSchema,
  shoulderToHip: proportionMetricSchema,
  legToTorso: proportionMetricSchema,
  frameEstimate: z.object({
    size: z.enum(['small', 'medium', 'large', 'unknown']),
    confidence: z.number().min(0).max(1),
  }),
  verticalLine: z.object({
    line: z.enum(['short', 'medium', 'long']),
    confidence: z.number().min(0).max(1),
  }),
});

// Posture Signal Schema
export const postureSignalSchema = z.object({
  severity: z.enum(['none', 'mild', 'moderate', 'significant']),
  confidence: z.number().min(0).max(1),
});

// Posture Signals Schema
export const postureSignalsSchema = z.object({
  forwardHead: postureSignalSchema.optional(),
  roundedShoulders: postureSignalSchema.optional(),
  pelvicTilt: postureSignalSchema.optional(),
  ribFlare: postureSignalSchema.optional(),
});

// Muscle Balance Schema
export const muscleBalanceSchema = z.object({
  upperBody: z.object({
    level: z.enum(['underdeveloped', 'balanced', 'developed', 'overdeveloped']),
    confidence: z.number().min(0).max(1),
  }),
  lowerBody: z.object({
    level: z.enum(['underdeveloped', 'balanced', 'developed', 'overdeveloped']),
    confidence: z.number().min(0).max(1),
  }),
});

// Body Composition Schema
export const bodyCompositionSchema = z.object({
  leannessPresentationScore: z.number().min(0).max(10),
  fatDistribution: z.enum(['android', 'gynoid', 'balanced', 'unknown']),
  sharpness: z.enum(['soft', 'moderate', 'sharp']),
  confidence: z.number().min(0).max(1),
});

// Kibbe Types
export const kibbeTypeSchema = z.enum([
  'Dramatic',
  'Soft Dramatic',
  'Romantic',
  'Theatrical Romantic',
  'Natural',
  'Soft Natural',
  'Flamboyant Natural',
  'Classic',
  'Soft Classic',
  'Dramatic Classic',
  'Gamine',
  'Soft Gamine',
  'Flamboyant Gamine',
]);

// Kibbe Probability Schema
export const kibbeProbabilitySchema = z.object({
  type: kibbeTypeSchema,
  probability: z.number().min(0).max(1),
});

// Kibbe Result Schema
export const kibbeResultSchema = z.object({
  probabilities: z.array(kibbeProbabilitySchema),
  primaryType: kibbeTypeSchema.optional(),
  tendencies: z.string().optional(),
  stylingNotes: z.array(z.string()),
  silhouetteRules: z.array(z.string()),
});

// Complete Body Analysis Result Schema
export const bodyAnalysisResultSchema = z.object({
  photoQuality: photoQualitySchema,
  proportions: proportionsSchema,
  postureSignals: postureSignalsSchema.optional(),
  muscleBalance: muscleBalanceSchema,
  composition: bodyCompositionSchema,
  kibbe: kibbeResultSchema,
  overall: overallScoreSchema,
  topLevers: z.tuple([leverSchema, leverSchema, leverSchema]),
});

// User Stats Schema
export const userStatsSchema = z.object({
  heightCm: z.number().positive().min(100).max(250),
  weightKg: z.number().positive().min(30).max(300),
  goal: z.enum(['get_leaner', 'build_muscle', 'recomp', 'maintain']),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  age: z.number().int().positive().min(13).max(100).optional(),
});

// Macro Targets Schema
export const macroTargetsSchema = z.object({
  calories: z.number().int().positive(),
  protein: z.number().int().positive(),
  carbs: z.number().int().positive(),
  fats: z.number().int().positive(),
  fiber: z.number().int().positive(),
});

// Exercise Schema
export const exerciseSchema = z.object({
  name: z.string(),
  sets: z.number().int().positive(),
  reps: z.string(),
  notes: z.string().optional(),
});

// Workout Day Schema
export const workoutDaySchema = z.object({
  name: z.string(),
  focus: z.string(),
  exercises: z.array(exerciseSchema),
});

// Workout Plan Schema
export const workoutPlanSchema = z.object({
  split: z.string(),
  daysPerWeek: z.number().int().min(1).max(7),
  emphasis: z.array(z.string()),
  days: z.array(workoutDaySchema),
  notes: z.array(z.string()),
});

// Action Plan Schema
export const actionPlanSchema = z.object({
  nutrition: macroTargetsSchema,
  workout: workoutPlanSchema,
  priorityAreas: z.array(z.string()),
  timeline: z.string(),
});

// Request Schemas
export const bodyScanRequestSchema = z.object({
  frontPhotoBase64: z.string().min(1, 'Front photo is required'),
  sidePhotoBase64: z.string().optional(),
  backPhotoBase64: z.string().optional(),
});

export const actionPlanRequestSchema = z.object({
  bodyScanId: z.string().uuid().optional(),
  userStats: userStatsSchema,
});

// Type exports
export type BodyScanRequest = z.infer<typeof bodyScanRequestSchema>;
export type ActionPlanRequest = z.infer<typeof actionPlanRequestSchema>;
export type BodyAnalysisResultValidated = z.infer<typeof bodyAnalysisResultSchema>;
export type ActionPlanValidated = z.infer<typeof actionPlanSchema>;
