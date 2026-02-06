-- ============================================
-- CALORIE TRACKER SCHEMA
-- ============================================

-- Foods table (shared reference for all food items)
CREATE TABLE IF NOT EXISTS public.foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'custom' CHECK (source IN ('open_food_facts', 'custom', 'usda', 'manual')),
  external_id TEXT,
  name TEXT NOT NULL,
  brand TEXT,
  serving_size_g NUMERIC,
  calories_per_100g NUMERIC,
  protein_per_100g NUMERIC,
  carbs_per_100g NUMERIC,
  fats_per_100g NUMERIC,
  fiber_per_100g NUMERIC,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source, external_id)
);

-- Barcode cache for fast lookups
CREATE TABLE IF NOT EXISTS public.barcode_cache (
  barcode TEXT PRIMARY KEY,
  food_id UUID REFERENCES public.foods(id) ON DELETE CASCADE,
  raw_json JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meals table (main meal records)
CREATE TABLE IF NOT EXISTS public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  consumed_at TIMESTAMPTZ DEFAULT NOW(),
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  source TEXT NOT NULL CHECK (source IN ('photo', 'barcode', 'search', 'quick_add', 'recipe')),
  photo_url TEXT,
  scan_hash TEXT,
  notes_hash TEXT,
  combined_hash TEXT,
  refined_from_hash TEXT,
  ai_confidence NUMERIC CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
  user_notes TEXT,
  notes TEXT
);

-- Meal items (individual food items within a meal)
CREATE TABLE IF NOT EXISTS public.meal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  food_id UUID REFERENCES public.foods(id),
  name TEXT NOT NULL,
  portion_g NUMERIC,
  portion_unit TEXT,
  portion_qty NUMERIC,
  calories_est_min NUMERIC NOT NULL DEFAULT 0,
  calories_est_max NUMERIC NOT NULL DEFAULT 0,
  protein_est_min NUMERIC NOT NULL DEFAULT 0,
  protein_est_max NUMERIC NOT NULL DEFAULT 0,
  carbs_est_min NUMERIC NOT NULL DEFAULT 0,
  carbs_est_max NUMERIC NOT NULL DEFAULT 0,
  fats_est_min NUMERIC NOT NULL DEFAULT 0,
  fats_est_max NUMERIC NOT NULL DEFAULT 0,
  fiber_est_min NUMERIC NOT NULL DEFAULT 0,
  fiber_est_max NUMERIC NOT NULL DEFAULT 0,
  confidence NUMERIC DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  method TEXT NOT NULL CHECK (method IN ('ai', 'barcode', 'db', 'manual')),
  user_override BOOLEAN DEFAULT FALSE,
  refinement_source TEXT CHECK (refinement_source IN ('photo_only', 'photo_plus_notes', 'manual')),
  raw_json JSONB
);

-- Recipes table
CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  servings NUMERIC NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipe items (ingredients)
CREATE TABLE IF NOT EXISTS public.recipe_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES public.foods(id),
  portion_g NUMERIC NOT NULL
);

-- Daily summaries for fast dashboard loading
CREATE TABLE IF NOT EXISTS public.daily_summaries (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  calories_min NUMERIC DEFAULT 0,
  calories_max NUMERIC DEFAULT 0,
  protein_min NUMERIC DEFAULT 0,
  protein_max NUMERIC DEFAULT 0,
  carbs_min NUMERIC DEFAULT 0,
  carbs_max NUMERIC DEFAULT 0,
  fats_min NUMERIC DEFAULT 0,
  fats_max NUMERIC DEFAULT 0,
  fiber_min NUMERIC DEFAULT 0,
  fiber_max NUMERIC DEFAULT 0,
  confidence NUMERIC DEFAULT 0.5,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, date)
);

-- Scan cache for deterministic results
CREATE TABLE IF NOT EXISTS public.scan_cache (
  combined_hash TEXT PRIMARY KEY,
  photo_url TEXT,
  scan_hash TEXT NOT NULL,
  notes_hash TEXT,
  result_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favorite foods per user
CREATE TABLE IF NOT EXISTS public.favorite_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, food_id)
);

-- Meal templates (saved meals for quick re-logging)
CREATE TABLE IF NOT EXISTS public.meal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  items_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_meals_user_consumed ON public.meals(user_id, consumed_at);
CREATE INDEX IF NOT EXISTS idx_meals_combined_hash ON public.meals(combined_hash);
CREATE INDEX IF NOT EXISTS idx_meal_items_meal ON public.meal_items(meal_id);
CREATE INDEX IF NOT EXISTS idx_foods_name ON public.foods(name);
CREATE INDEX IF NOT EXISTS idx_foods_source ON public.foods(source);
CREATE INDEX IF NOT EXISTS idx_recipes_user ON public.recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_date ON public.daily_summaries(user_id, date);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barcode_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_templates ENABLE ROW LEVEL SECURITY;

-- Foods: public read for non-custom, user manages own custom foods
CREATE POLICY "Foods public read" ON public.foods
  FOR SELECT USING (source != 'custom' OR created_by = auth.uid());

CREATE POLICY "Foods user insert" ON public.foods
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Foods user update" ON public.foods
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Foods user delete" ON public.foods
  FOR DELETE USING (created_by = auth.uid());

-- Barcode cache: public read, service role write
CREATE POLICY "Barcode cache public read" ON public.barcode_cache
  FOR SELECT USING (true);

-- Meals: users access only their own
CREATE POLICY "Meals user access" ON public.meals
  FOR ALL USING (user_id = auth.uid());

-- Meal items: users access only their meal items
CREATE POLICY "Meal items user access" ON public.meal_items
  FOR ALL USING (
    meal_id IN (SELECT id FROM public.meals WHERE user_id = auth.uid())
  );

-- Recipes: users access only their own
CREATE POLICY "Recipes user access" ON public.recipes
  FOR ALL USING (user_id = auth.uid());

-- Recipe items: users access only their recipe items
CREATE POLICY "Recipe items user access" ON public.recipe_items
  FOR ALL USING (
    recipe_id IN (SELECT id FROM public.recipes WHERE user_id = auth.uid())
  );

-- Daily summaries: users access only their own
CREATE POLICY "Daily summaries user access" ON public.daily_summaries
  FOR ALL USING (user_id = auth.uid());

-- Scan cache: public read for caching
CREATE POLICY "Scan cache public read" ON public.scan_cache
  FOR SELECT USING (true);

-- Favorite foods: users access only their own
CREATE POLICY "Favorite foods user access" ON public.favorite_foods
  FOR ALL USING (user_id = auth.uid());

-- Meal templates: users access only their own
CREATE POLICY "Meal templates user access" ON public.meal_templates
  FOR ALL USING (user_id = auth.uid());

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update daily summary when meals change
CREATE OR REPLACE FUNCTION update_daily_summary()
RETURNS TRIGGER AS $$
DECLARE
  summary_date DATE;
  target_user_id UUID;
BEGIN
  -- Determine the date and user based on operation
  IF TG_OP = 'DELETE' THEN
    summary_date := DATE(OLD.consumed_at);
    target_user_id := OLD.user_id;
  ELSE
    summary_date := DATE(NEW.consumed_at);
    target_user_id := NEW.user_id;
  END IF;

  -- Recalculate and upsert daily summary
  INSERT INTO public.daily_summaries (
    user_id, date,
    calories_min, calories_max,
    protein_min, protein_max,
    carbs_min, carbs_max,
    fats_min, fats_max,
    fiber_min, fiber_max,
    confidence, updated_at
  )
  SELECT
    target_user_id,
    summary_date,
    COALESCE(SUM(mi.calories_est_min), 0),
    COALESCE(SUM(mi.calories_est_max), 0),
    COALESCE(SUM(mi.protein_est_min), 0),
    COALESCE(SUM(mi.protein_est_max), 0),
    COALESCE(SUM(mi.carbs_est_min), 0),
    COALESCE(SUM(mi.carbs_est_max), 0),
    COALESCE(SUM(mi.fats_est_min), 0),
    COALESCE(SUM(mi.fats_est_max), 0),
    COALESCE(SUM(mi.fiber_est_min), 0),
    COALESCE(SUM(mi.fiber_est_max), 0),
    COALESCE(AVG(mi.confidence), 0.5),
    NOW()
  FROM public.meals m
  JOIN public.meal_items mi ON mi.meal_id = m.id
  WHERE m.user_id = target_user_id
    AND DATE(m.consumed_at) = summary_date
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    calories_min = EXCLUDED.calories_min,
    calories_max = EXCLUDED.calories_max,
    protein_min = EXCLUDED.protein_min,
    protein_max = EXCLUDED.protein_max,
    carbs_min = EXCLUDED.carbs_min,
    carbs_max = EXCLUDED.carbs_max,
    fats_min = EXCLUDED.fats_min,
    fats_max = EXCLUDED.fats_max,
    fiber_min = EXCLUDED.fiber_min,
    fiber_max = EXCLUDED.fiber_max,
    confidence = EXCLUDED.confidence,
    updated_at = NOW();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update daily summaries
DROP TRIGGER IF EXISTS trigger_update_daily_summary ON public.meals;
CREATE TRIGGER trigger_update_daily_summary
  AFTER INSERT OR UPDATE OR DELETE ON public.meals
  FOR EACH ROW EXECUTE FUNCTION update_daily_summary();
