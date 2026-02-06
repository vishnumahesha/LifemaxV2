// ============================================
// CALORIE TRACKER TYPES
// ============================================

import { z } from 'zod';

// ============================================
// BASE TYPES
// ============================================

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type MealSource = 'photo' | 'barcode' | 'search' | 'quick_add' | 'recipe';
export type ItemMethod = 'ai' | 'barcode' | 'db' | 'manual';
export type RefinementSource = 'photo_only' | 'photo_plus_notes' | 'manual';
export type FoodSource = 'open_food_facts' | 'custom' | 'usda' | 'manual';

// ============================================
// MACRO RANGES
// ============================================

export interface MacroRange {
  min: number;
  max: number;
}

export interface MacroRanges {
  calories: MacroRange;
  protein: MacroRange;
  carbs: MacroRange;
  fats: MacroRange;
  fiber: MacroRange;
}

// ============================================
// FOOD
// ============================================

export interface Food {
  id: string;
  source: FoodSource;
  externalId?: string;
  name: string;
  brand?: string;
  servingSizeG?: number;
  caloriesPer100g?: number;
  proteinPer100g?: number;
  carbsPer100g?: number;
  fatsPer100g?: number;
  fiberPer100g?: number;
  createdBy?: string;
  createdAt: string;
}

// ============================================
// MEAL ITEM
// ============================================

export interface MealItem {
  id: string;
  mealId: string;
  foodId?: string;
  name: string;
  portionG?: number;
  portionUnit?: string;
  portionQty?: number;
  caloriesEstMin: number;
  caloriesEstMax: number;
  proteinEstMin: number;
  proteinEstMax: number;
  carbsEstMin: number;
  carbsEstMax: number;
  fatsEstMin: number;
  fatsEstMax: number;
  fiberEstMin: number;
  fiberEstMax: number;
  confidence: number;
  method: ItemMethod;
  userOverride: boolean;
  refinementSource?: RefinementSource;
  rawJson?: unknown;
}

export interface MealItemDraft {
  name: string;
  portionG?: number;
  portionUnit?: string;
  portionQty?: number;
  caloriesRange: MacroRange;
  proteinRange: MacroRange;
  carbsRange: MacroRange;
  fatsRange: MacroRange;
  fiberRange: MacroRange;
  confidence: number;
  method: ItemMethod;
  assumptions?: string[];
  suggestions?: Array<{ name: string; confidence: number }>;
}

// ============================================
// MEAL
// ============================================

export interface Meal {
  id: string;
  userId: string;
  createdAt: string;
  consumedAt: string;
  mealType: MealType;
  source: MealSource;
  photoUrl?: string;
  scanHash?: string;
  notesHash?: string;
  combinedHash?: string;
  refinedFromHash?: string;
  aiConfidence?: number;
  userNotes?: string;
  notes?: string;
  items: MealItem[];
}

export interface MealDraft {
  photoUrl?: string;
  scanHash: string;
  notesHash?: string;
  combinedHash: string;
  mealType: MealType;
  consumedAt: string;
  items: MealItemDraft[];
  mealConfidence: number;
  warnings: string[];
  photoQuality: {
    score: number;
    issues: string[];
  };
}

// ============================================
// DAILY SUMMARY
// ============================================

export interface DailySummary {
  userId: string;
  date: string;
  calories: MacroRange;
  protein: MacroRange;
  carbs: MacroRange;
  fats: MacroRange;
  fiber: MacroRange;
  confidence: number;
  meals: Meal[];
}

// ============================================
// RECIPE
// ============================================

export interface RecipeItem {
  id: string;
  recipeId: string;
  foodId: string;
  food?: Food;
  portionG: number;
}

export interface Recipe {
  id: string;
  userId: string;
  name: string;
  servings: number;
  createdAt: string;
  items: RecipeItem[];
  perServingMacros?: MacroRanges;
}

// ============================================
// NUTRITION TARGETS
// ============================================

export interface NutritionTargets {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  source: 'ai_generated' | 'user_set';
}

// ============================================
// ZOD SCHEMAS
// ============================================

export const MealTypeSchema = z.enum(['breakfast', 'lunch', 'dinner', 'snack']);
export const MealSourceSchema = z.enum(['photo', 'barcode', 'search', 'quick_add', 'recipe']);
export const ItemMethodSchema = z.enum(['ai', 'barcode', 'db', 'manual']);
export const RefinementSourceSchema = z.enum(['photo_only', 'photo_plus_notes', 'manual']);

export const MacroRangeSchema = z.object({
  min: z.number().min(0),
  max: z.number().min(0),
});

export const MealItemInputSchema = z.object({
  foodId: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  portionG: z.number().positive().optional(),
  portionUnit: z.string().max(50).optional(),
  portionQty: z.number().positive().optional(),
  caloriesEstMin: z.number().min(0),
  caloriesEstMax: z.number().min(0),
  proteinEstMin: z.number().min(0),
  proteinEstMax: z.number().min(0),
  carbsEstMin: z.number().min(0),
  carbsEstMax: z.number().min(0),
  fatsEstMin: z.number().min(0),
  fatsEstMax: z.number().min(0),
  fiberEstMin: z.number().min(0),
  fiberEstMax: z.number().min(0),
  confidence: z.number().min(0).max(1),
  method: ItemMethodSchema,
  userOverride: z.boolean().optional(),
  refinementSource: RefinementSourceSchema.optional(),
});

export const CreateMealSchema = z.object({
  photoUrl: z.string().url().optional(),
  scanHash: z.string().optional(),
  notesHash: z.string().optional(),
  combinedHash: z.string().optional(),
  mealType: MealTypeSchema,
  consumedAt: z.string().datetime(),
  source: MealSourceSchema,
  userNotes: z.string().max(1000).optional(),
  items: z.array(MealItemInputSchema).min(1).max(20),
});

export const PhotoScanRequestSchema = z.object({
  mealType: MealTypeSchema.optional(),
  consumedAt: z.string().datetime().optional(),
  userNotes: z.string().max(1000).optional(),
});

export const BarcodeLookupSchema = z.object({
  barcode: z.string().min(8).max(14).regex(/^[0-9]+$/, 'Invalid barcode format'),
});

export const FoodSearchSchema = z.object({
  q: z.string().min(2).max(100),
  limit: z.number().int().min(1).max(50).optional().default(20),
});

export const CreateCustomFoodSchema = z.object({
  name: z.string().min(1).max(200),
  brand: z.string().max(200).optional(),
  servingSizeG: z.number().positive().optional(),
  caloriesPer100g: z.number().min(0).optional(),
  proteinPer100g: z.number().min(0).optional(),
  carbsPer100g: z.number().min(0).optional(),
  fatsPer100g: z.number().min(0).optional(),
  fiberPer100g: z.number().min(0).optional(),
});

export const CreateRecipeSchema = z.object({
  name: z.string().min(1).max(200),
  servings: z.number().positive().min(1).max(100),
  items: z.array(z.object({
    foodId: z.string().uuid(),
    portionG: z.number().positive(),
  })).min(1).max(50),
});

export const LogRecipeSchema = z.object({
  recipeId: z.string().uuid(),
  servings: z.number().positive(),
  mealType: MealTypeSchema,
  consumedAt: z.string().datetime(),
});

// ============================================
// API RESPONSE TYPES
// ============================================

export interface PhotoScanResponse {
  draft: MealDraft;
}

export interface BarcodeLookupResponse {
  food: Food;
  source: string;
  confidence: number;
}

export interface FoodSearchResponse {
  foods: Food[];
  total: number;
}

export interface DailyMealsResponse {
  date: string;
  meals: Meal[];
  totals: MacroRanges;
  dayConfidence: number;
  targets?: NutritionTargets;
}

// ============================================
// CONFIDENCE HELPERS
// ============================================

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.75) return 'high';
  if (confidence >= 0.5) return 'medium';
  return 'low';
}

export function getConfidenceColor(level: ConfidenceLevel): string {
  switch (level) {
    case 'high': return 'text-green-400';
    case 'medium': return 'text-yellow-400';
    case 'low': return 'text-orange-400';
  }
}

export function getConfidenceBgColor(level: ConfidenceLevel): string {
  switch (level) {
    case 'high': return 'bg-green-500/20';
    case 'medium': return 'bg-yellow-500/20';
    case 'low': return 'bg-orange-500/20';
  }
}
