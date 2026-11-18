-- ==============================================================================
-- JOTNO (GLUCOVISION) - COMPLETE SUPABASE MIGRATION SCRIPT
-- Combined: Phase 1 Schema & RLS + Multimodal RAG Pricing + Docs Module
-- Fully Secured with Row Level Security (RLS) on ALL tables
-- ==============================================================================

-- ==============================================================================
-- PART 1: Core Extensions & Phase 1 Schema
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Clinical Baselines & Disclaimer)
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

-- 2. Food Scans Table (Multimodal Vision Extractions)
CREATE TABLE IF NOT EXISTS public.food_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    scan_type TEXT CHECK (scan_type IN ('bazaar_grocery', 'restaurant_menu', 'cooked_meal')),
    image_url TEXT,
    raw_ai_response JSONB NOT NULL,
    detected_items JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.food_scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own scans" ON public.food_scans;
CREATE POLICY "Users can manage own scans" 
    ON public.food_scans FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3. Generated Recipes Table (Plate Sequencer & Nutrition)
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

ALTER TABLE public.generated_recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own recipes" ON public.generated_recipes;
CREATE POLICY "Users can manage own recipes" 
    ON public.generated_recipes FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. Blood Glucose Telemetry Logs Table
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

ALTER TABLE public.glucose_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own glucose logs" ON public.glucose_logs;
CREATE POLICY "Users can manage own glucose logs" 
    ON public.glucose_logs FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 5. Storage Bucket for Image Uploads
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


-- ==============================================================================
-- PART 2: Multimodal RAG, Price Benchmarks & Voice Interaction Logs
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- 6. Nutrition Knowledge Nodes & Embeddings
CREATE TABLE IF NOT EXISTS public.nutrition_knowledge_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL CHECK (source IN ('usda', 'edamam', 'open_food_facts', 'nutritics', 'cloudcamp', 'clinical_baseline')),
    external_id TEXT,
    food_name TEXT NOT NULL,
    brand_or_category TEXT,
    serving_size_g NUMERIC(6,2) DEFAULT 100,
    calories NUMERIC(6,2),
    protein_g NUMERIC(6,2),
    carbs_g NUMERIC(6,2),
    fat_g NUMERIC(6,2),
    fiber_g NUMERIC(6,2),
    sugars_g NUMERIC(6,2),
    sodium_mg NUMERIC(6,2),
    glycemic_index NUMERIC(4,1),
    glycemic_load NUMERIC(4,1),
    micronutrients JSONB DEFAULT '{}'::jsonb,
    content_vector vector(768),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nutrition_vector ON public.nutrition_knowledge_nodes 
USING ivfflat (content_vector vector_cosine_ops) WITH (lists = 100);

ALTER TABLE public.nutrition_knowledge_nodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for nutrition nodes" ON public.nutrition_knowledge_nodes;
CREATE POLICY "Public read access for nutrition nodes" 
    ON public.nutrition_knowledge_nodes FOR SELECT 
    USING (true);

-- 7. Ingredient Price Benchmarks
CREATE TABLE IF NOT EXISTS public.ingredient_price_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_key TEXT NOT NULL UNIQUE,
    standard_unit TEXT DEFAULT 'kg' CHECK (standard_unit IN ('kg', 'g', 'liter', 'piece', 'bunch')),
    price_currency TEXT DEFAULT 'USD',
    average_unit_price NUMERIC(8,2) NOT NULL,
    market_region TEXT DEFAULT 'Global',
    source TEXT DEFAULT 'kaggle_food_prices',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed benchmark price reference points
INSERT INTO public.ingredient_price_benchmarks (ingredient_key, standard_unit, price_currency, average_unit_price, market_region, source)
VALUES
    ('red lentils', 'kg', 'USD', 1.80, 'Global', 'kaggle_food_prices'),
    ('lentils', 'kg', 'USD', 1.75, 'Global', 'kaggle_food_prices'),
    ('bitter gourd', 'kg', 'USD', 1.40, 'Global', 'kaggle_food_prices'),
    ('spinach', 'kg', 'USD', 1.20, 'Global', 'kaggle_food_prices'),
    ('potatoes', 'kg', 'USD', 0.85, 'Global', 'kaggle_food_prices'),
    ('white rice', 'kg', 'USD', 1.10, 'Global', 'kaggle_food_prices'),
    ('brown rice', 'kg', 'USD', 1.60, 'Global', 'kaggle_food_prices'),
    ('green chilies', 'kg', 'USD', 2.10, 'Global', 'kaggle_food_prices'),
    ('onion', 'kg', 'USD', 0.90, 'Global', 'kaggle_food_prices'),
    ('garlic', 'kg', 'USD', 3.20, 'Global', 'kaggle_food_prices'),
    ('ginger', 'kg', 'USD', 2.80, 'Global', 'kaggle_food_prices'),
    ('chicken breast', 'kg', 'USD', 4.50, 'Global', 'kaggle_food_prices'),
    ('eggs', 'piece', 'USD', 0.20, 'Global', 'kaggle_food_prices'),
    ('mustard oil', 'liter', 'USD', 2.40, 'Global', 'kaggle_food_prices'),
    ('olive oil', 'liter', 'USD', 6.50, 'Global', 'kaggle_food_prices'),
    ('okra', 'kg', 'USD', 1.50, 'Global', 'kaggle_food_prices'),
    ('cucumber', 'kg', 'USD', 0.95, 'Global', 'kaggle_food_prices'),
    ('tomatoes', 'kg', 'USD', 1.30, 'Global', 'kaggle_food_prices'),
    ('fish', 'kg', 'USD', 5.20, 'Global', 'kaggle_food_prices')
ON CONFLICT (ingredient_key) DO UPDATE
SET average_unit_price = EXCLUDED.average_unit_price,
    updated_at = NOW();

ALTER TABLE public.ingredient_price_benchmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for price benchmarks" ON public.ingredient_price_benchmarks;
CREATE POLICY "Public read access for price benchmarks" 
    ON public.ingredient_price_benchmarks FOR SELECT 
    USING (true);

-- Upgrade Food Scans for Multimodal Interaction
ALTER TABLE public.food_scans 
    ADD COLUMN IF NOT EXISTS scan_mode TEXT CHECK (scan_mode IN ('grocery_bazaar', 'restaurant_menu', 'prepared_food')),
    ADD COLUMN IF NOT EXISTS voice_prompt_transcript TEXT,
    ADD COLUMN IF NOT EXISTS rag_sources_retrieved JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS cost_estimate JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS health_risk_alerts JSONB DEFAULT '[]'::jsonb;

-- 8. Voice Audio Logs
CREATE TABLE IF NOT EXISTS public.voice_interaction_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    scan_id UUID REFERENCES public.food_scans(id) ON DELETE SET NULL,
    user_query TEXT NOT NULL,
    ai_response_text TEXT NOT NULL,
    ai_audio_latency_ms INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.voice_interaction_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own voice logs" ON public.voice_interaction_logs;
CREATE POLICY "Users can manage own voice logs" 
    ON public.voice_interaction_logs FOR ALL 
    USING (auth.uid() = user_id);


-- ==============================================================================
-- PART 3: Documentation & Admin Module
-- ==============================================================================

-- 9. Docs Settings Table (Window Scheduling & Timezone)
CREATE TABLE IF NOT EXISTS public.docs_settings (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    time_zone TEXT NOT NULL DEFAULT 'Asia/Dhaka',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by TEXT,
    CONSTRAINT docs_window_order CHECK (start_at IS NULL OR end_at IS NULL OR end_at > start_at)
);

-- Default judging window: 18 Nov 00:00 -> 18 Dec 23:59, Dhaka time
INSERT INTO public.docs_settings (id, enabled, start_at, end_at)
VALUES (1, TRUE, '2026-11-18T00:00:00+06:00', '2026-12-18T23:59:59+06:00')
ON CONFLICT (id) DO NOTHING;

-- 10. Docs Content Table (Draft & Published Content)
CREATE TABLE IF NOT EXISTS public.docs_content (
    id TEXT PRIMARY KEY CHECK (id IN ('draft', 'published')),
    content JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by TEXT
);

-- 11. Docs Version History Table
CREATE TABLE IF NOT EXISTS public.docs_versions (
    id BIGSERIAL PRIMARY KEY,
    content JSONB NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT
);

ALTER TABLE public.docs_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.docs_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.docs_versions ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- ALL MIGRATIONS COMPLETE
-- ==============================================================================
