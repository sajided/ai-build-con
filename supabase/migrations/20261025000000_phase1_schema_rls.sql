-- ==============================================================================
-- Jotno Phase 1 Database Migration: Schema, RLS & Storage
-- Conforms to Section 5 of PRD and Phase 1 Implementation Roadmap
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (Clinical Baselines & Mandatory Disclaimer)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    age INT NOT NULL CHECK (age > 0 AND age <= 120),
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    height_cm NUMERIC(5,2) NOT NULL CHECK (height_cm >= 50 AND height_cm <= 250),
    current_weight_kg NUMERIC(5,2) NOT NULL CHECK (current_weight_kg > 20 AND current_weight_kg <= 300),
    target_weight_kg NUMERIC(5,2) CHECK (target_weight_kg > 20 AND target_weight_kg <= 300),
    diabetes_type TEXT CHECK (diabetes_type IN ('type_1', 'type_2', 'pre_diabetes', 'gestational')),
    medication_regimen TEXT CHECK (medication_regimen IN ('diet_only', 'oral_meds', 'insulin', 'combination')),
    baseline_hba1c NUMERIC(4,2) CHECK (baseline_hba1c >= 4.0 AND baseline_hba1c <= 18.0),
    target_fasting_glucose NUMERIC(5,2) DEFAULT 110,
    glucose_unit TEXT DEFAULT 'mg/dL' CHECK (glucose_unit IN ('mg/dL', 'mmol/L')),
    disclaimer_accepted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles Row-Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile" 
    ON public.profiles FOR DELETE 
    USING (auth.uid() = id);

-- 3. Food Scans Table (Multimodal Vision Extractions)
CREATE TABLE IF NOT EXISTS public.food_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    scan_type TEXT CHECK (scan_type IN ('bazaar_grocery', 'restaurant_menu', 'cooked_meal')),
    image_url TEXT,
    raw_ai_response JSONB NOT NULL,
    detected_items JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Food Scans RLS
ALTER TABLE public.food_scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own scans" ON public.food_scans;
CREATE POLICY "Users can manage own scans" 
    ON public.food_scans FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. Generated Recipes Table (Plate Sequencer & Nutrition)
CREATE TABLE IF NOT EXISTS public.generated_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID REFERENCES public.food_scans(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    ingredients JSONB NOT NULL,
    instructions JSONB NOT NULL,
    eating_sequence JSONB NOT NULL,
    net_carbs_grams NUMERIC(5,2),
    glycemic_index_rating TEXT CHECK (glycemic_index_rating IN ('low', 'medium', 'high')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated Recipes RLS
ALTER TABLE public.generated_recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own recipes" ON public.generated_recipes;
CREATE POLICY "Users can manage own recipes" 
    ON public.generated_recipes FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 5. Blood Glucose Telemetry Logs Table
CREATE TABLE IF NOT EXISTS public.glucose_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    reading_type TEXT CHECK (reading_type IN ('fasting', 'post_prandial_1h', 'post_prandial_2h', 'bedtime', 'random')),
    glucose_value NUMERIC(5,2) NOT NULL,
    unit TEXT DEFAULT 'mg/dL' CHECK (unit IN ('mg/dL', 'mmol/L')),
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    associated_scan_id UUID REFERENCES public.food_scans(id) ON DELETE SET NULL
);

-- Glucose Logs RLS (Strict Cross-User Isolation for TC-P1-01)
ALTER TABLE public.glucose_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own glucose logs" ON public.glucose_logs;
CREATE POLICY "Users can manage own glucose logs" 
    ON public.glucose_logs FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 6. Storage Bucket for Image Uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('meal-scans', 'meal-scans', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload their own scans" ON storage.objects;
CREATE POLICY "Users can upload their own scans" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'meal-scans' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Users can read their own scans" ON storage.objects;
CREATE POLICY "Users can read their own scans" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'meal-scans' AND auth.uid() = owner);
