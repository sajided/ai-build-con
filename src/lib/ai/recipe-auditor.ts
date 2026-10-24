import type { Recipe } from "@/lib/validations/recipe";

/**
 * Standard neutral kitchen seasonings allowed alongside photographed ingredients.
 */
export const ALLOWED_PANTRY_STAPLES = [
  "water",
  "salt",
  "black pepper",
  "pepper",
  "olive oil",
  "mustard oil",
  "cooking oil",
  "oil",
  "garlic",
  "ginger",
  "turmeric",
  "cumin",
  "coriander",
  "lemon",
  "lime",
  "curry leaves",
  "cilantro",
  "onion",
  "red chili powder",
  "paprika",
];

/**
 * Forbidden unphotographed high-carb starches and refined sugars (TC-P3-01).
 * These must NEVER be injected unless explicitly present in the photographed basket.
 */
export const FORBIDDEN_HIGH_CARB_STARCHES = [
  "flour",
  "white flour",
  "wheat flour",
  "maida",
  "atta",
  "sugar",
  "cane sugar",
  "brown sugar",
  "honey",
  "jaggery",
  "cornstarch",
  "corn starch",
  "potato",
  "potatoes",
  "pasta",
  "bread",
  "noodle",
  "noodles",
  "rice",
  "white rice",
  "sweet corn",
  "corn syrup",
];

export function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Verifies that the recipe contains zero unphotographed high-carb starches.
 * Strictly adheres to TC-P3-01.
 */
export function auditRecipeIngredients(
  recipe: Recipe,
  allowedIngredients: string[]
): Recipe {
  const allowedNorm = allowedIngredients.map((i) => normalizeName(i));
  const staplesNorm = ALLOWED_PANTRY_STAPLES.map((i) => normalizeName(i));

  // Filter out any unauthorized starches
  const cleanedIngredients = recipe.ingredients.filter((ing) => {
    const ingNorm = normalizeName(ing.name);

    // If ingredient is in photographed items or neutral pantry staples, it is permitted
    const isPhotographed = allowedNorm.some((a) => ingNorm.includes(a) || a.includes(ingNorm));
    const isStaple = staplesNorm.some((s) => ingNorm.includes(s) || s.includes(ingNorm));

    if (isPhotographed || isStaple) {
      return true;
    }

    // Check if ingredient matches forbidden high-carb list
    const isForbiddenStarch = FORBIDDEN_HIGH_CARB_STARCHES.some((f) =>
      ingNorm.includes(normalizeName(f))
    );

    if (isForbiddenStarch && !isPhotographed) {
      console.warn(
        `[TC-P3-01 Anti-Hallucination Guard] Blocked unauthorized starch: "${ing.name}" from recipe "${recipe.title}".`
      );
      return false;
    }

    return true;
  });

  // Calculate Net Carbs formula mathematically: Net Carbs = Total Carbs - Dietary Fiber
  const totalCarbs = recipe.macros.total_carbs_g;
  const fiber = recipe.macros.fiber_g;
  const verifiedNetCarbs = Number(Math.max(0, totalCarbs - fiber).toFixed(1));

  return {
    ...recipe,
    ingredients: cleanedIngredients,
    macros: {
      ...recipe.macros,
      net_carbs_g: verifiedNetCarbs,
    },
  };
}

/**
 * Clinical eating sequence auditor ensuring 3-tier structure (TC-P3-02):
 * Step 1: Fiber Shield (vegetables/greens first)
 * Step 2: Protein & Lipids (stimulate GLP-1)
 * Step 3: Starch portioned last
 */
export function auditEatingSequence(
  recipe: Recipe,
  inputIngredients: string[]
): Recipe {
  // Detect which category inputs belong to
  const greens = inputIngredients.filter((i) => {
    const l = i.toLowerCase();
    return l.includes("spinach") || l.includes("gourd") || l.includes("greens") || l.includes("chili") || l.includes("broccoli") || l.includes("cabbage");
  });

  const proteins = inputIngredients.filter((i) => {
    const l = i.toLowerCase();
    return l.includes("egg") || l.includes("dal") || l.includes("lentil") || l.includes("fish") || l.includes("chicken") || l.includes("tofu") || l.includes("paneer");
  });

  const starches = inputIngredients.filter((i) => {
    const l = i.toLowerCase();
    return l.includes("potato") || l.includes("rice") || l.includes("corn") || l.includes("bread");
  });

  const seq = { ...recipe.eating_sequence };

  // Enforce Step 1: Fiber Shield
  if (greens.length > 0 && (!seq.step_1.items || seq.step_1.items.length === 0)) {
    seq.step_1.items = greens;
  }

  // Enforce Step 2: Protein & Lipids
  if (proteins.length > 0 && (!seq.step_2.items || seq.step_2.items.length === 0)) {
    seq.step_2.items = proteins;
  }

  // Enforce Step 3: Starch Last
  if (starches.length > 0 && (!seq.step_3.items || seq.step_3.items.length === 0)) {
    seq.step_3.items = starches;
  }

  return {
    ...recipe,
    eating_sequence: seq,
  };
}
