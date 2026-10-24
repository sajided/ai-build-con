# GlucoVision – Phase-by-Phase Development & Execution Roadmap

This implementation roadmap translates the **GlucoVision Product Requirement Document (PRD v1.0)** into clear, modular, and incremental engineering phases. Designed for rapid execution in **Antigravity / AI Agent IDEs**, each phase defines prerequisites, database updates, backend API specifications, frontend UI components, and testing milestones.

---

## High-Level Architecture Overview

```
[ Client: Next.js 14 App Router + PWA + Tailwind CSS + Recharts ]
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
[ Supabase Backend ]           [ AI Multimodal Pipeline ]
 ├── Auth & RLS                 ├── Gemini 1.5 Flash (Bazaar Vision)
 ├── PostgreSQL Tables          ├── Gemini 1.5 Flash (Menu Auditor)
 └── Image Storage Bucket       └── Gemini 1.5 Pro (Recipe Generator)
```

---

## Phase 0: Project Scaffolding & Environment Setup

### Objective
Initialize the base repository, configure dependencies, set up styling, and prepare the cloud database/storage infrastructure.

### Tasks
1. **Initialize Next.js Project:**
   ```bash
   npx create-next-app@latest glucovision --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
   cd glucovision
   ```
2. **Install Core Dependencies:**
   ```bash
   npm install @supabase/supabase-js @supabase/ssr @google/genai lucide-react recharts clsx tailwind-merge next-pwa
   npm install -D @types/node
   ```
3. **Environment Configuration (`.env.local`):**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   GEMINI_API_KEY=your_gemini_api_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
4. **PWA & Mobile Viewport Setup:**
   * Configure `manifest.json` with theme color `#059669` (Emerald/Brand).
   * Update `src/app/layout.tsx` with mobile viewport meta tags (`maximum-scale=1, user-scalable=no`).

### Milestone
* Dev server running on `localhost:3000` with Tailwind CSS, Lucide icons, and responsive mobile-first shell.

---

## Phase 1: Database Setup, Security (RLS) & Onboarding Flow

### Objective
Implement the PostgreSQL database schema according to Section 5 of the PRD, enforce Row-Level Security, and build the clinical onboarding flow.

### 1. Database Migrations (Run in Supabase SQL Editor)
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    age INT NOT NULL,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    height_cm NUMERIC(5,2) NOT NULL,
    current_weight_kg NUMERIC(5,2) NOT NULL,
    target_weight_kg NUMERIC(5,2),
    diabetes_type TEXT CHECK (diabetes_type IN ('type_1', 'type_2', 'pre_diabetes', 'gestational')),
    medication_regimen TEXT CHECK (medication_regimen IN ('diet_only', 'oral_meds', 'insulin', 'combination')),
    baseline_hba1c NUMERIC(4,2),
    target_fasting_glucose NUMERIC(5,2) DEFAULT 110,
    glucose_unit TEXT DEFAULT 'mg/dL' CHECK (glucose_unit IN ('mg/dL', 'mmol/L')),
    disclaimer_accepted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR ALL USING (auth.uid() = id);

-- 2. Food Scans Table
CREATE TABLE public.food_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    scan_type TEXT CHECK (scan_type IN ('bazaar_grocery', 'restaurant_menu', 'cooked_meal')),
    image_url TEXT,
    raw_ai_response JSONB NOT NULL,
    detected_items JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.food_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own scans" ON public.food_scans FOR ALL USING (auth.uid() = user_id);

-- 3. Generated Recipes Table
CREATE TABLE public.generated_recipes (
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
CREATE POLICY "Users can manage own recipes" ON public.generated_recipes FOR ALL USING (auth.uid() = user_id);

-- 4. Blood Glucose Tracking Logs
CREATE TABLE public.glucose_logs (
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
CREATE POLICY "Users can manage own glucose logs" ON public.glucose_logs FOR ALL USING (auth.uid() = user_id);

-- Storage bucket for image uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('meal-scans', 'meal-scans', false)
ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Users can upload their own scans" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'meal-scans' AND auth.uid() = owner);
CREATE POLICY "Users can read their own scans" ON storage.objects FOR SELECT USING (bucket_id = 'meal-scans' AND auth.uid() = owner);
```

### 2. Frontend Onboarding Flow (`/onboarding`)
* **Step 1:** Biometrics (Age, Gender, Height, Weight).
* **Step 2:** Clinical Background (Diabetes Type, Current Medication, HbA1c, Target Fasting).
* **Step 3:** Medical Disclaimer Agreement (Non-diagnostic checkbox, mandatory).
* **Route Protection:** Middleware checking if authenticated user has a completed profile row in `profiles`.

---

## Phase 2: Visual Scanner – Bazaar & Grocery Risk Classifier

### Objective
Implement camera capture, image upload to Supabase Storage, and the Multimodal AI risk extraction pipeline for raw bazaar and grocery items.

### 1. Multimodal AI API Route (`/api/scan/bazaar`)
* **Model:** Gemini 1.5 Flash (for rapid image parsing $\le 3.5\text{s}$).
* **Prompt Contract & Strict JSON Schema:**
```typescript
// System Prompt Instruction:
`You are an expert clinical diabetic nutritionist specializing in raw produce, regional groceries, and glycemic biochemistry.
Analyze the provided image of grocery/bazaar items.
For every distinct edible item:
1. Estimate item name and quantity.
2. Classify glycemic risk:
   - Green: GI < 55, high soluble fiber, low refined carbs.
   - Yellow: GI 56-69, acceptable with strict portion limits.
   - Red: GI >= 70, high glycemic load (GL > 20), or high simple sugars.
3. Provide glycemic index (GI), glycemic load (GL), estimated net carbs (g), and dietary fiber (g).
4. Provide pairing advice (how to cook/pair this to blunt spikes).

Return ONLY valid JSON matching this schema:
{
  "scanned_items": [
    {
      "item_name": "string",
      "quantity_estimate": "string",
      "risk_category": "green" | "yellow" | "red",
      "glycemic_index": number,
      "glycemic_load": number,
      "net_carbs_g": number,
      "fiber_g": number,
      "clinical_rationale": "string",
      "pairing_advice": "string"
    }
  ],
  "overall_basket_assessment": "string",
  "missing_vital_buffers": ["string"]
}`
```

### 2. Frontend Scanner UI (`/scanner`)
* Native camera trigger (`<input type="file" accept="image/*" capture="environment">`) or desktop drag-and-drop.
* **Animated Scanner View:** Pulse line animation across the preview image during API loading.
* **Traffic-Light Risk Grid:**
  * 🟢 Green cards for fiber-rich vegetables, pulses, and lean proteins.
  * 🟡 Amber cards with portion control alerts.
  * 🔴 Red alert cards highlighting spike triggers (e.g., white potatoes, overripe fruits).
* Action button: *"Generate Safe Recipe from These Items"*.

---

## Phase 3: Available-Item Recipe Generator & Plate Sequencer

### Objective
Generate low-glycemic recipes using *strictly* the ingredients confirmed from the photo, plus standard pantry staples, enforcing the clinical eating sequence.

### 1. Recipe Generation API (`/api/recipes/generate`)
* Ingests `detected_items` array + user allergies/preferences.
* Uses Gemini 1.5 Flash/Pro with rules:
  1. No new high-carb ingredients allowed.
  2. Cooking techniques must avoid starch gelatinization (e.g., avoid overcooking, puree, or high-sugar frying).
  3. Include the **3-Tier Eating Sequence**:
     * **Step 1:** Soluble Fiber Shield (first 10 mins).
     * **Step 2:** Protein & Lipids (stimulate GLP-1).
     * **Step 3:** Controlled Carbohydrates (eaten last).

### 2. UI Components (`/recipes/[id]`)
* **Ingredient Checklist:** Users can toggle detected items on/off or add basic pantry staples (oil, salt, garlic).
* **Recipe Cards:** Prep time, Net Carbs, Estimated Glycemic Load, and Step-by-Step Cooking Guide.
* **Interactive Plate Sequencer UI:** Visual 3-stage countdown badge for meal execution.
* **Localized Market Pivot:** 1–2 missing regional buffer ingredients (e.g., lime, fenugreek, okra) with cost estimates.

---

## Phase 4: MenuSafe – Restaurant Menu Auditor & Waiter Scripts

### Objective
Allow diabetic patients to photograph restaurant menus, decode hidden carbohydrates/starches, and get discreet waiter modification scripts.

### 1. Menu Parsing API (`/api/scan/menu`)
* OCR + Vision prompt to extract:
  * Safe dining items (clear soups, tandoori/grilled meats, leafy salads).
  * Risky traps (cornstarch gravies, honey/sugar glazes, battered deep fry).
  * **Waiter Script:** Polite, discreet verbal script for kitchen modifications.

### 2. UI Components
* Menu Scanner tab on the scanner screen.
* **Categorized Menu View:** Safe vs. Traps.
* **Waiter Script Box:** Distinct visual card with a single-click **"Copy Script"** button (e.g., *"Please serve the salad 10 minutes before the meal; gravy on the side; replace white rice with sautéed vegetables"*).

---

## Phase 5: Blood Glucose Telemetry & Dual-Trajectory Analytics

### Objective
Provide comprehensive glucose logging (FBS, PPBS) and render an interactive **Actual vs. AI Predicted Trend** chart using Recharts.

### 1. Telemetry Math Engine
* **Target Line Formulation:**
  $$\text{Target Glucose}(t) = \text{Baseline FBS} - \left(\frac{\text{Baseline FBS} - \text{Target FBS}}{84}\right) \times t$$
  *(Linear progression over an 84-day / 12-week horizon).*
* **Time in Range (TIR) Calculation:**
  $$\text{TIR} = \left(\frac{\text{Readings within } [70, 140]\text{ mg/dL}}{\text{Total Readings}}\right) \times 100\%$$
* **Estimated HbA1c (eAG formula):**
  $$\text{eHbA1c} = \frac{\text{Mean Glucose (mg/dL)} + 46.7}{28.7}$$

### 2. Chart Component (`src/components/telemetry/GlucoseChart.tsx`)
* Built with `Recharts` (`ResponsiveContainer`, `LineChart`, `ReferenceArea`).
* **Visual Elements:**
  * Target Safe Zone overlay: Green shaded reference area between $70\text{--}140\text{ mg/dL}$.
  * **Line 1 (Emerald Solid):** Actual patient logs with tooltip tags for linked meal scans.
  * **Line 2 (Purple Dashed):** AI Predicted Target Trajectory.
* **Quick Log Modal:** Inputs for glucose value ($mg/dL$), measurement context (Fasting, 2hr Post-Meal, Bedtime), and optional meal photo link.

---

## Phase 6: Nutritional Gap & Deficiency Recommendation Engine

### Objective
Analyze past scans and logged meals to detect micronutrient and fiber deficits that degrade insulin sensitivity, recommending localized foods to bridge the gap.

### 1. Gap Analysis Logic (`/api/analytics/deficiencies`)
* Analyzes rolling 7-day logged meals against diabetic guidelines:
  * **Soluble Viscous Fiber:** Target $\ge 30\text{g/day}$.
  * **Magnesium & Chromium Buffer:** Assesses intake of green leafy vegetables, seeds, and unpolished pulses.
  * **Protein-to-Carbohydrate Ratio:** Target $1 : 1.5$.

### 2. UI Components (`/deficits`)
* Visual horizontal progress bars: Fiber Deficit, Magnesium Index, Protein-Carb Balance.
* **"Bridge the Gap" Bazaar List:** Quick cards of local market staples (e.g., Okra/Dherosh, Flaxseeds, Lime) with a 1-tap **"+ Add to Shopping List"** button.

---

## Phase 7: PWA Polish, Safety Guardrails, QA & Deployment

### Objective
Harden application security, configure PWA offline caching, verify clinical disclaimers, and deploy to production.

### 1. Clinical Guardrails & Disclaimers
* Implement middleware/prompt safeguards: Any user query or prompt asking for specific insulin dosing units must be programmatically rejected:
  > *"GlucoVision is an educational lifestyle tool. We cannot calculate insulin dosages or adjust prescription regimens. Please consult your physician."*

### 2. Testing & Validation Checklist
| Test Area | Expected Outcome |
| :--- | :--- |
| **Bazaar Scanner** | Correctly identifies at least 4 out of 5 vegetables in a standard basket image within 4 seconds. |
| **MenuSafe** | Accurately flags dishes with cornstarch or sugar syrup dressings. |
| **Telemetry Graph** | Dynamically updates upon submitting a new glucose log entry without full page refresh. |
| **RLS Security** | User A cannot query or read image scans or glucose logs of User B. |
| **PWA Installability** | Passes Lighthouse PWA audit; launches in standalone mode on iOS/Android. |

### 3. Deployment
* Deploy Next.js frontend to **Vercel** with environment variables linked to Supabase and Gemini API keys.
* Configure custom domain and SSL.

---

## Phase-by-Phase Prompting Guide for Antigravity

When executing this roadmap inside Antigravity or with an AI coding agent, run the tasks using these structured prompt directives:

1. **Phase 0:** *"Initialize Next.js 14 App Router project with TypeScript, Tailwind CSS, Lucide React, Recharts, and Supabase SSR client. Setup layout.tsx for mobile-first PWA."*
2. **Phase 1:** *"Implement the Supabase database migrations for profiles, food_scans, generated_recipes, and glucose_logs with Row Level Security. Build the multi-step onboarding wizard at /onboarding with clinical disclaimer acceptance."*
3. **Phase 2:** *"Create the camera scanner interface and the /api/scan/bazaar API route using Gemini 1.5 Flash with strict JSON output schema. Render the traffic-light risk cards for detected items."*
4. **Phase 3:** *"Build the recipe generation API and plate sequencer UI that creates low-GI recipes strictly using detected bazaar ingredients, enforcing the 3-step eating sequence."*
5. **Phase 4:** *"Build the restaurant menu scanner tab and /api/scan/menu route to categorize dishes into Safe vs Traps and generate a copyable Waiter Script."*
6. **Phase 5:** *"Implement the glucose logging form and Recharts dual-line graph displaying actual logs vs. AI predicted target trajectory with the 70-140 mg/dL green safe zone."*
7. **Phase 6:** *"Build the nutritional deficit tracker and localized bazaar gap-bridging recommendation engine."*
8. **Phase 7:** *"Apply PWA manifest, clinical safety guardrails against insulin dose calculation, and prepare production deployment."*