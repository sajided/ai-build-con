import type { MenuItem, MenuItemRisk } from "@/lib/validations/menusafe";

/**
 * Covert Culinary Traps known to trigger rapid postprandial glucose spikes.
 */
export const COVERT_TRAPS_DICTIONARY = [
  { keyword: "honey", label: "Honey glaze / added sugar", severity: "high" },
  { keyword: "sweet corn", label: "Sweet corn starch / high glycemic starch", severity: "high" },
  { keyword: "cornstarch", label: "Cornstarch thickener", severity: "high" },
  { keyword: "corn starch", label: "Cornstarch gravy thickener", severity: "high" },
  { keyword: "gravy", label: "Starch-thickened sauce", severity: "medium" },
  { keyword: "crispy", label: "Deep-fry flour batter", severity: "high" },
  { keyword: "batter", label: "Refined flour batter", severity: "high" },
  { keyword: "battered", label: "Refined flour batter", severity: "high" },
  { keyword: "deep-fried", label: "Deep-fried preparation (oxidized lipids & batter)", severity: "high" },
  { keyword: "deep fried", label: "Deep-fried preparation", severity: "high" },
  { keyword: "tempura", label: "Refined flour tempura batter", severity: "high" },
  { keyword: "glaze", label: "Concentrated sugar/honey glaze", severity: "high" },
  { keyword: "glazed", label: "Sugar/honey glaze", severity: "high" },
  { keyword: "teriyaki", label: "High-sugar teriyaki reduction", severity: "high" },
  { keyword: "sweet and sour", label: "High-fructose sweet & sour sauce", severity: "high" },
  { keyword: "caramel", label: "Caramelized sugar", severity: "high" },
  { keyword: "syrup", label: "Concentrated sugar syrup", severity: "high" },
];

export const SAFE_ELEMENTS_DICTIONARY = [
  { keyword: "tandoori", label: "Tandoori high-heat clay oven (unbreaded)" },
  { keyword: "grilled", label: "Char-grilled lean preparation" },
  { keyword: "steamed", label: "Steamed preparation" },
  { keyword: "broccoli", label: "High-fiber steamed broccoli" },
  { keyword: "spinach", label: "Duodenal-coating dark leafy greens" },
  { keyword: "fish", label: "Lean protein & omega-3 fatty acids" },
  { keyword: "yoghurt", label: "Probiotic fermented dairy (mint yoghurt)" },
  { keyword: "yogurt", label: "Probiotic fermented dairy" },
  { keyword: "salad", label: "Raw vegetable soluble fiber" },
  { keyword: "greens", label: "Soluble & insoluble plant fiber" },
  { keyword: "clear soup", label: "Low-glycemic clear broth" },
];

/**
 * Audits a single dish name or description for hidden traps and generates
 * deterministic classification and polite waiter modification scripts.
 */
export function auditMenuItem(
  rawDish: string,
  existingItem?: Partial<MenuItem>
): MenuItem {
  const textLower = rawDish.toLowerCase();

  // 1. Detect Traps
  const detectedTraps: string[] = [];
  let hasHighSeverityTrap = false;

  for (const trap of COVERT_TRAPS_DICTIONARY) {
    if (textLower.includes(trap.keyword)) {
      if (!detectedTraps.includes(trap.label)) {
        detectedTraps.push(trap.label);
      }
      if (trap.severity === "high") {
        hasHighSeverityTrap = true;
      }
    }
  }

  // 2. Detect Safe Elements
  const detectedSafe: string[] = [];
  for (const safe of SAFE_ELEMENTS_DICTIONARY) {
    if (textLower.includes(safe.keyword)) {
      if (!detectedSafe.includes(safe.label)) {
        detectedSafe.push(safe.label);
      }
    }
  }

  // 3. Clinical Category Classification (TC-P4-01)
  let risk: MenuItemRisk = "yellow";
  let impact: "low" | "medium" | "high" = "medium";

  if (hasHighSeverityTrap || detectedTraps.length >= 2) {
    risk = "red";
    impact = "high";
  } else if (detectedSafe.length >= 2 && detectedTraps.length === 0) {
    risk = "green";
    impact = "low";
  } else if (detectedTraps.length === 0) {
    risk = "green";
    impact = "low";
  }

  // Mandatory Clinical Override: Any dish with honey or sweet corn gravy must be Red
  if (
    textLower.includes("honey") ||
    textLower.includes("sweet corn") ||
    (textLower.includes("crispy") && textLower.includes("glazed"))
  ) {
    risk = "red";
    impact = "high";
  }

  // Mandatory Clinical Override: Tandoori fish / grilled meat with greens and no sugar must be Green
  if (
    (textLower.includes("tandoori") || textLower.includes("grilled")) &&
    (textLower.includes("fish") || textLower.includes("chicken")) &&
    !hasHighSeverityTrap
  ) {
    risk = "green";
    impact = "low";
  }

  // 4. Formulate Waiter Modification Script (TC-P4-02)
  const scriptParts: string[] = [];

  if (textLower.includes("crispy") || textLower.includes("deep-fried") || textLower.includes("batter")) {
    scriptParts.push("prepare the protein grilled or pan-seared instead of deep-fried");
  }
  if (textLower.includes("gravy") || textLower.includes("sauce") || textLower.includes("sweet corn")) {
    scriptParts.push("serve sauce/gravy on the side with no cornstarch thickener");
  }
  if (textLower.includes("honey") || textLower.includes("glaze") || textLower.includes("glazed") || textLower.includes("sweet")) {
    scriptParts.push("omit the honey or sweet sugar glaze");
  }

  let waiterScript = "";
  if (risk === "red") {
    const formattedSubstitutions =
      scriptParts.length > 0
        ? scriptParts.join(", ")
        : "omit sweet glazes and request sauces on the side";
    waiterScript = `Please ${formattedSubstitutions}. Could I also have steamed vegetables or a side salad first?`;
  } else if (risk === "yellow") {
    waiterScript =
      "Please serve sauces or dressings on the side, and replace any white rice or potatoes with steamed vegetables.";
  } else {
    waiterScript =
      "This dish is naturally diabetic-friendly! Please serve the vegetable salad first as an opening fiber shield.";
  }

  // 5. Build Clinical Rationale
  let rationale = "";
  if (risk === "red") {
    rationale = `High glycemic spike risk. Contains covert starches/sugars: ${detectedTraps.join(
      ", "
    )}. These rapidly breakdown into free glucose in the upper digestive tract.`;
  } else if (risk === "green") {
    rationale = `Safe diabetic selection. High protein and fiber content with no covert sugars. Low glycemic impact on postprandial glucose.`;
  } else {
    rationale = `Moderate glycemic impact. Can be made safe by requesting dressings/sauces on the side.`;
  }

  return {
    id: existingItem?.id || "dish-" + Math.random().toString(36).substring(2, 8),
    dish_name: existingItem?.dish_name || rawDish.trim(),
    risk_category: risk,
    glycemic_impact: impact,
    flagged_traps: detectedTraps.length > 0 ? detectedTraps : existingItem?.flagged_traps || [],
    safe_elements: detectedSafe.length > 0 ? detectedSafe : existingItem?.safe_elements || [],
    clinical_rationale: rationale,
    waiter_script: waiterScript,
    suggested_side_swap:
      risk === "red" || risk === "yellow"
        ? "Swap white rice/potatoes for extra steamed greens or fresh salad"
        : undefined,
  };
}
