// Re-export all types from a single entry point
export * from './api';
export * from './face';
export * from './body';
export * from './database';

// Tracker types - selectively export to avoid conflicts with database.ts
export {
  type MealType,
  type MealSource,
  type ItemMethod,
  type RefinementSource,
  type FoodSource,
  type MacroRange,
  type MacroRanges,
  type Food,
  type MealItemDraft,
  type MealDraft,
  type DailySummary,
  type RecipeItem,
  type Recipe,
  type NutritionTargets,
  type ConfidenceLevel,
  type PhotoScanResponse,
  type BarcodeLookupResponse,
  type FoodSearchResponse,
  type DailyMealsResponse,
  MealTypeSchema,
  MealSourceSchema,
  ItemMethodSchema,
  RefinementSourceSchema,
  MacroRangeSchema,
  MealItemInputSchema,
  CreateMealSchema,
  PhotoScanRequestSchema,
  BarcodeLookupSchema,
  FoodSearchSchema,
  CreateCustomFoodSchema,
  CreateRecipeSchema,
  LogRecipeSchema,
  getConfidenceLevel,
  getConfidenceColor,
  getConfidenceBgColor,
} from './tracker';

// Re-export tracker Meal types with different names to avoid conflicts
export { 
  type Meal as TrackerMeal, 
  type MealItem as TrackerMealItem 
} from './tracker';
