# Product Requirement Document (PRD)
## Project: GlucoVision – AI Diabetic Nutrition & Metabolic Assistant
**Target Platform:** Mobile-First Web Application (Progressive Web App - PWA)  
**Version:** 1.0 (MVP)  
**Status:** Draft / Approved for Scoping  

---

## 1. Executive Summary & Problem Statement

### 1.1 Problem Statement
Diabetic and pre-diabetic patients struggle with daily dietary compliance due to three friction points:
1. **Ambiguity in Raw Ingredients:** When shopping at local markets, grocery stores, or bazaars, users struggle to identify the glycemic impact, starch content, and proper portion limits of raw ingredients.
2. **Dining Out & Menu Traps:** Restaurant menus rarely disclose hidden starches, added sugars, or cooking mediums that trigger acute postprandial glucose spikes.
3. **Disconnected Metrics:** Blood glucose readings (fasting, post-meal, HbA1c) are logged in isolation without directly connecting spikes to dietary habits or showing a projected trajectory toward health targets.

### 1.2 Solution
**GlucoVision** is an AI-powered visual metabolic companion. Users can snap photos of raw groceries or restaurant menus to instantly view a traffic-light risk rating, generate personalized low-GI recipes from available items, track glucose trends against an AI-projected target baseline, and receive targeted meal suggestions for nutritional deficits (e.g., fiber, lean protein).

---

## 2. User Personas

### Persona A: Pre-Diabetic / Newly Diagnosed Type 2 ("The Overwhelmed Planner")
* **Profile:** 42-year-old professional diagnosed with an HbA1c of 7.1%.
* **Pain Point:** Doesn't understand glycemic index/load; cooking separate meals from the family is frustrating and confusing.
* **Goal:** Wants quick, visual confirmation of what foods are safe to buy at the bazaar and wants realistic recipes using those exact ingredients.

### Persona B: Long-Term Type 2 Patient ("The Routine Maintainer")
* **Profile:** 58-year-old on oral hypoglycemic agents (e.g., Metformin).
* **Pain Point:** Periodic spikes when eating out; finds manual carbohydrate counting tedious.
* **Goal:** Wants to scan restaurant menus to pick the safest options and track weekly glucose trends against their quarterly HbA1c targets.

---

## 3. Product Scope & Functional Requirements

```
                       +---------------------------------------+
                       |          User Onboarding              |
                       | (Biometrics, Diabetes Type, HbA1c)    |
                       +-------------------+-------------------+
                                           |
         +---------------------------------+---------------------------------+
         |                                 |                                 |
         v                                 v                                 v
+------------------+             +-------------------+             +------------------+
| Visual Scanner   |             | Metabolic Tracker |             | Nutrition Engine |
| - Raw Bazaar/Food|             | - Glucose Logging |             | - Gap Detection  |
| - Menu Auditor   |             | - Actual vs Pred. |             | - Meal Recomms   |
| - Recipe Builder |             |   Trend Graph     |             |                  |
+------------------+             +-------------------+             +------------------+
```

### Module 1: User Onboarding & Clinical Profile Setup
* **REQ-1.1:** Collect mandatory biometrics:
  * Age, gender, height ($cm$), current weight ($kg$), target weight ($kg$).
* **REQ-1.2:** Collect diabetes diagnosis context:
  * Type: Pre-diabetes, Type 2, Type 1, Gestational Diabetes.
  * Medical management: Lifestyle/Diet-only, Oral medication (e.g., Metformin, Sulfonylureas), Insulin-dependent.
* **REQ-1.3:** Collect metabolic baselines:
  * Most recent HbA1c (percentage, e.g., $7.4\%$).
  * Typical Fasting Blood Sugar ($mg/dL$ or $mmol/L$).
  * Target Blood Sugar range (default: $80-130\text{ }mg/dL$ fasting, $<180\text{ }mg/dL$ postprandial unless configured).
* **REQ-1.4:** Mandatory non-diagnostic clinical disclaimer checkbox ("GlucoVision is an educational and supportive tool, not a diagnostic or insulin dosing calculator").

---

### Module 2: Visual Scanner – Bazaar & Grocery Food Risk Classifier
* **REQ-2.1:** Native camera access or file upload supporting single or multi-item photos (bazaar stalls, grocery carts, pantry/refrigerator).
* **REQ-2.2:** Multi-object extraction pipeline identifying each edible ingredient with estimated quantity and state (raw, ripe, processed).
* **REQ-2.3 (Traffic-Light Risk Scoring):**
  * 🟢 **Green (Safe):** Glycemic Index $< 55$, high dietary fiber, low refined sugar.
  * 🟡 **Yellow (Moderate):** Glycemic Index $56 - 69$, acceptable with strict portion bounds.
  * 🔴 **Red (High Risk):** Glycemic Index $\ge 70$, high glycemic load ($GL > 20$), or simple sugars likely to induce rapid glycemic excursions.
* **REQ-2.4:** Provide dietary pairing advice for flagged items (e.g., *"Potatoes detected: Pair with fiber-rich greens and avoid mashing/pureeing to lower glycemic velocity"*).

---

### Module 3: Available-Item Recipe Generator
* **REQ-3.1:** Automatically populate a pantry list from detected food items in the scanned image.
* **REQ-3.2:** Allow users to manually toggle items on/off or add basic pantry staples (oil, salt, garlic, basic spices).
* **REQ-3.3:** Generate 2–3 diabetic-friendly recipes strictly using the confirmed ingredients.
* **REQ-3.4:** Display per-recipe nutritional estimates:
  * Estimated prep/cook time.
  * Net Carbs ($Total\text{ }Carbohydrates - Dietary\text{ }Fiber$).
  * Estimated Glycemic Impact (Low / Medium).
  * Step-by-step preparation with cooking tips to preserve fiber and avoid starch gelatinization.

---

### Module 4: Restaurant Menu Safe & Risk Detector
* **REQ-4.1:** OCR and Vision-based menu parser capable of reading standard printed and digital restaurant menus.
* **REQ-4.2:** Classify menu entries into:
  * **Safe Selections:** Clear broths, grilled/steamed proteins, cruciferous vegetables, whole grains.
  * **Risky Traps:** Glazed dishes (corn syrup/honey), deep-fried batters, high-sugar dressings, refined grain bases.
* **REQ-4.3:** Generate customized order modification requests (e.g., *"Ask for dressing on the side," "Substitute white rice with sautéed seasonal greens"*).

---

### Module 5: Glucose Tracking & Actual vs. Predicted Analytics
* **REQ-5.1:** Allow manual logging of:
  * Fasting Blood Sugar (FBS).
  * Postprandial Blood Sugar (PPBS, 2 hours post-meal).
  * Periodic HbA1c updates.
* **REQ-5.2 (Dual-Trajectory Graph):**
  * **Actual Line:** Historic plot of recorded glucose readings over time ($mg/dL$ or $mmol/L$).
  * **Predicted/Target Line:** An idealized health trajectory calculated from the onboarding baseline toward target HbA1c over a rolling 12-week horizon, dynamically adjusted based on log adherence.
* **REQ-5.3:** Highlight spike occurrences and correlate with logged meal tags or scanner activity.

---

### Module 6: Nutritional Gap & Deficiency Recommendation Engine
* **REQ-6.1:** Analyze user scan history and logged meals to detect macro and micronutrient deficits:
  * Insufficient soluble/insoluble dietary fiber ($< 25-30g/\text{day}$).
  * Deficits in magnesium, potassium, or lean protein relative to carbohydrate volume.
* **REQ-6.2:** Recommend tailored foods and snacks to address deficiencies without raising glucose (e.g., chia seeds, bitter melon, fenugreek, leafy greens, unsweetened yogurt).

---

## 4. Technical Architecture & Tech Stack

```text
[ Client Layer ]
  └── Next.js 14+ (App Router, PWA, Tailwind CSS, Lucide Icons, Recharts)
        │
[ API / Edge Layer ]
  ├── Next.js Serverless Route Handlers
  └── Auth & Data Access via Supabase Client
        │
[ AI / Computer Vision Pipeline ]
  ├── Multimodal Vision LLM (e.g., Gemini 1.5 Flash / Pro)
  │     ├── Task A: Bazaar item segmentation & Glycemic tagging (Structured JSON)
  │     ├── Task B: OCR Menu audit & modification advice
  │     └── Task C: Constraint-based Recipe Synthesizer
  │
[ Data & Storage Layer ]
  ├── Supabase (PostgreSQL with Row Level Security)
  └── Supabase Storage (Presigned URLs for uploaded meal/menu images)
```

### 4.1 System Tech Stack
| Component | Technology | Selection Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js (React) + PWA Manifest | Fast camera integration, mobile app-like experience, zero app-store friction. |
| **UI Components** | Tailwind CSS + Shadcn UI | Accessible, clean, lightweight responsive layout. |
| **Charts** | Recharts | Canvas/SVG dual-line visualization with target band overlays. |
| **Database & Auth** | Supabase (PostgreSQL) | Robust relational structures, native JSONB support, built-in Auth and RLS. |
| **Vision & Reasoning** | Multimodal Vision API | High spatial reasoning for unstructured multi-ingredient scans; structured JSON output mode. |

---

## 5. Data Modeling & Database Schema (PostgreSQL)

```sql
-- 1. Profiles & Clinical Baselines
CREATE TABLE profiles (
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
    glucose_unit TEXT DEFAULT 'mg/dL' CHECK (glucose_unit IN ('mg/dL', 'mmol/L')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Food & Menu Scans
CREATE TABLE food_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    scan_type TEXT CHECK (scan_type IN ('bazaar_grocery', 'restaurant_menu', 'cooked_meal')),
    image_url TEXT NOT NULL,
    raw_ai_response JSONB NOT NULL,
    detected_items JSONB NOT NULL, -- Array of { name, risk_level, gi_estimate, notes }
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Generated Recipes
CREATE TABLE generated_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID REFERENCES food_scans(id) ON DELETE SET NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    ingredients JSONB NOT NULL,
    instructions JSONB NOT NULL,
    net_carbs_grams NUMERIC(5,2),
    glycemic_index_rating TEXT CHECK (glycemic_index_rating IN ('low', 'medium', 'high')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Blood Glucose Tracking Logs
CREATE TABLE glucose_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reading_type TEXT CHECK (reading_type IN ('fasting', 'post_prandial_1h', 'post_prandial_2h', 'bedtime', 'random')),
    glucose_value NUMERIC(5,2) NOT NULL,
    unit TEXT DEFAULT 'mg/dL' CHECK (unit IN ('mg/dL', 'mmol/L')),
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    associated_scan_id UUID REFERENCES food_scans(id) ON DELETE SET NULL
);
```

---

## 6. AI Prompt Contracts & Structured Schemas

### 6.1 Bazaar Food Risk Extraction Schema
```json
{
  "scanned_items": [
    {
      "item_name": "String",
      "detected_quantity_estimate": "String",
      "risk_category": "green | yellow | red",
      "glycemic_index_estimate": "low | medium | high",
      "clinical_rationale": "String explaining glycemic impact",
      "pairing_advice": "Actionable rule to lower glucose response"
    }
  ],
  "overall_basket_assessment": "String",
  "missing_vital_groups": ["fiber", "lean_protein", "healthy_fats"]
}
```

### 6.2 Menu Auditor Schema
```json
{
  "menu_items": [
    {
      "dish_name": "String",
      "risk_level": "safe | caution | risky",
      "hidden_sugars_or_starches": ["cornstarch", "glazed honey", "white flour base"],
      "recommended_substitutions": "String"
    }
  ],
  "top_diabetic_picks": ["List of best 2-3 dishes"]
}
```

---

## 7. Non-Functional Requirements & Security

1. **Performance:** Image inference and structured parsing must complete within $\le 4.5\text{ seconds}$ on standard 4G mobile networks.
2. **Medical Privacy & Data Governance:** 
   * Strict adherence to health data protections (HIPAA / GDPR compliance patterns).
   * Images stored in private object storage buckets accessed only via short-lived pre-signed URLs.
   * Full database row-level security (RLS) isolating each patient's biometrics and glucose logs.
3. **Accessibility:** WCAG 2.1 AA compliance; clear color-blind friendly cues (icons + text accompanying green/yellow/red badges).
4. **Clinical Safety Guardrails:** Clear disclaimer that recommendations are educational. The system must explicitly reject prompts requesting calculated insulin dosages or immediate adjustments to prescription regimens.

---

## 8. Release Roadmap & Success Metrics

### 8.1 Roadmap
* **Phase 1 (MVP - Weeks 1–4):** Onboarding, Mobile PWA camera capture, Bazaar/Grocery item risk classifier, Basic low-GI recipe generator.
* **Phase 2 (Weeks 5–8):** Restaurant menu safe/risk scanner, Manual blood glucose logging, Dual-trajectory Recharts graph (Actual vs. Goal).
* **Phase 3 (Weeks 9–12):** Deficiency & nutritional gap analyzer, CSV export for endocrinologist visits, offline-first PWA caching.

### 8.2 Key Performance Indicators (KPIs)
* **Engagement:** Daily Active Scans per User ($\ge 1.8$ scans/day).
* **Adherence:** $\ge 65\%$ of weekly active users recording at least 4 glucose data points per week.
* **Inference Accuracy:** $\ge 92\%$ validation accuracy on food identification across standard local produce markets.