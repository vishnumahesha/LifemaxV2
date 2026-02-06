// Database Types for Supabase

export interface Profile {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  height_cm?: number;
  weight_kg?: number;
  goal?: string;
  experience_level?: string;
  preferences?: Record<string, unknown>;
}

export interface FaceScan {
  id: string;
  user_id: string;
  created_at: string;
  front_photo_url: string;
  side_photo_url?: string;
  response_json: Record<string, unknown>;
  overall_score: number;
  confidence: number;
}

export interface BodyScan {
  id: string;
  user_id: string;
  created_at: string;
  front_photo_url: string;
  side_photo_url?: string;
  back_photo_url?: string;
  response_json: Record<string, unknown>;
  overall_score: number;
  confidence: number;
}

export interface DBPreviewImage {
  id: string;
  user_id: string;
  face_scan_id: string;
  created_at: string;
  image_url: string;
  options_json: Record<string, unknown>;
}

export interface SavedWorkoutPlan {
  id: string;
  user_id: string;
  body_scan_id?: string;
  created_at: string;
  plan_json: Record<string, unknown>;
}

export interface NutritionTarget {
  id: string;
  user_id: string;
  created_at: string;
  targets_json: Record<string, unknown>;
}

// For Phase 2: Calorie Tracker
export interface Meal {
  id: string;
  user_id: string;
  created_at: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  photo_url?: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
}

export interface MealItem {
  id: string;
  meal_id: string;
  name: string;
  portion_grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  confidence: number;
}

// Database helper type for table names
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      face_scans: {
        Row: FaceScan;
        Insert: Omit<FaceScan, 'id' | 'created_at'>;
        Update: Partial<Omit<FaceScan, 'id' | 'created_at'>>;
      };
      body_scans: {
        Row: BodyScan;
        Insert: Omit<BodyScan, 'id' | 'created_at'>;
        Update: Partial<Omit<BodyScan, 'id' | 'created_at'>>;
      };
      preview_images: {
        Row: DBPreviewImage;
        Insert: Omit<DBPreviewImage, 'id' | 'created_at'>;
        Update: Partial<Omit<DBPreviewImage, 'id' | 'created_at'>>;
      };
      workout_plans: {
        Row: SavedWorkoutPlan;
        Insert: Omit<SavedWorkoutPlan, 'id' | 'created_at'>;
        Update: Partial<Omit<SavedWorkoutPlan, 'id' | 'created_at'>>;
      };
      nutrition_targets: {
        Row: NutritionTarget;
        Insert: Omit<NutritionTarget, 'id' | 'created_at'>;
        Update: Partial<Omit<NutritionTarget, 'id' | 'created_at'>>;
      };
      meals: {
        Row: Meal;
        Insert: Omit<Meal, 'id' | 'created_at'>;
        Update: Partial<Omit<Meal, 'id' | 'created_at'>>;
      };
      meal_items: {
        Row: MealItem;
        Insert: Omit<MealItem, 'id'>;
        Update: Partial<Omit<MealItem, 'id'>>;
      };
    };
  };
}
