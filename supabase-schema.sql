-- LifeMAX Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    height_cm DECIMAL,
    weight_kg DECIMAL,
    goal TEXT,
    experience_level TEXT,
    preferences JSONB DEFAULT '{}'::jsonb
);

-- Face scans table
CREATE TABLE IF NOT EXISTS public.face_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    front_photo_url TEXT,
    side_photo_url TEXT,
    response_json JSONB NOT NULL,
    overall_score DECIMAL NOT NULL,
    confidence DECIMAL NOT NULL
);

-- Body scans table
CREATE TABLE IF NOT EXISTS public.body_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    front_photo_url TEXT,
    side_photo_url TEXT,
    back_photo_url TEXT,
    response_json JSONB NOT NULL,
    overall_score DECIMAL NOT NULL,
    confidence DECIMAL NOT NULL
);

-- Preview images table
CREATE TABLE IF NOT EXISTS public.preview_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    face_scan_id UUID REFERENCES public.face_scans(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    image_url TEXT,
    options_json JSONB NOT NULL
);

-- Workout plans table
CREATE TABLE IF NOT EXISTS public.workout_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    body_scan_id UUID REFERENCES public.body_scans(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    plan_json JSONB NOT NULL
);

-- Nutrition targets table
CREATE TABLE IF NOT EXISTS public.nutrition_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    targets_json JSONB NOT NULL
);

-- Meals table (for Phase 2 calorie tracker)
CREATE TABLE IF NOT EXISTS public.meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    photo_url TEXT,
    total_calories INTEGER NOT NULL,
    total_protein INTEGER NOT NULL,
    total_carbs INTEGER NOT NULL,
    total_fats INTEGER NOT NULL
);

-- Meal items table (for Phase 2 calorie tracker)
CREATE TABLE IF NOT EXISTS public.meal_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meal_id UUID REFERENCES public.meals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    portion_grams INTEGER NOT NULL,
    calories INTEGER NOT NULL,
    protein INTEGER NOT NULL,
    carbs INTEGER NOT NULL,
    fats INTEGER NOT NULL,
    confidence DECIMAL NOT NULL
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.face_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preview_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Face scans policies
CREATE POLICY "Users can view own face scans" ON public.face_scans
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own face scans" ON public.face_scans
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own face scans" ON public.face_scans
    FOR DELETE USING (auth.uid() = user_id);

-- Body scans policies
CREATE POLICY "Users can view own body scans" ON public.body_scans
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own body scans" ON public.body_scans
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own body scans" ON public.body_scans
    FOR DELETE USING (auth.uid() = user_id);

-- Preview images policies
CREATE POLICY "Users can view own preview images" ON public.preview_images
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preview images" ON public.preview_images
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own preview images" ON public.preview_images
    FOR DELETE USING (auth.uid() = user_id);

-- Workout plans policies
CREATE POLICY "Users can view own workout plans" ON public.workout_plans
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workout plans" ON public.workout_plans
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workout plans" ON public.workout_plans
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workout plans" ON public.workout_plans
    FOR DELETE USING (auth.uid() = user_id);

-- Nutrition targets policies
CREATE POLICY "Users can view own nutrition targets" ON public.nutrition_targets
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own nutrition targets" ON public.nutrition_targets
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own nutrition targets" ON public.nutrition_targets
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own nutrition targets" ON public.nutrition_targets
    FOR DELETE USING (auth.uid() = user_id);

-- Meals policies
CREATE POLICY "Users can view own meals" ON public.meals
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meals" ON public.meals
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meals" ON public.meals
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meals" ON public.meals
    FOR DELETE USING (auth.uid() = user_id);

-- Meal items policies (access through meals table relationship)
CREATE POLICY "Users can view meal items through meals" ON public.meal_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.meals
            WHERE meals.id = meal_items.meal_id
            AND meals.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can insert meal items for own meals" ON public.meal_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.meals
            WHERE meals.id = meal_items.meal_id
            AND meals.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can update meal items for own meals" ON public.meal_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.meals
            WHERE meals.id = meal_items.meal_id
            AND meals.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can delete meal items for own meals" ON public.meal_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.meals
            WHERE meals.id = meal_items.meal_id
            AND meals.user_id = auth.uid()
        )
    );

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_face_scans_user_id ON public.face_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_face_scans_created_at ON public.face_scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_body_scans_user_id ON public.body_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_body_scans_created_at ON public.body_scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meals_user_id_date ON public.meals(user_id, created_at DESC);
