import type { MenuItem, MenuItemRisk } from "@/lib/validations/menusafe";

type Severity = "high" | "medium";
type TrapKind = "starch" | "sugar" | "fried" | "sauce";

interface TrapRule {
  keyword: string;
  label: string;
  severity: Severity;
  kind: TrapKind;
}

/**
 * Covert Culinary Traps known to trigger rapid postprandial glucose spikes.
 */
export const COVERT_TRAPS_DICTIONARY: TrapRule[] = [
  { keyword: "honey", label: "Honey glaze / added sugar", severity: "high", kind: "sugar" },
  { keyword: "sweet corn", label: "Sweet corn starch / high glycemic starch", severity: "high", kind: "sauce" },
  { keyword: "cornstarch", label: "Cornstarch thickener", severity: "high", kind: "sauce" },
  { keyword: "corn starch", label: "Cornstarch gravy thickener", severity: "high", kind: "sauce" },
  { keyword: "gravy", label: "Starch-thickened sauce", severity: "medium", kind: "sauce" },
  { keyword: "crispy", label: "Deep-fry flour batter", severity: "high", kind: "fried" },
  { keyword: "batter", label: "Refined flour batter", severity: "high", kind: "fried" },
  { keyword: "battered", label: "Refined flour batter", severity: "high", kind: "fried" },
  { keyword: "deep-fried", label: "Deep-fried preparation (oxidized lipids & batter)", severity: "high", kind: "fried" },
  { keyword: "deep fried", label: "Deep-fried preparation", severity: "high", kind: "fried" },
  { keyword: "tempura", label: "Refined flour tempura batter", severity: "high", kind: "fried" },
  { keyword: "glaze", label: "Concentrated sugar/honey glaze", severity: "high", kind: "sugar" },
  { keyword: "glazed", label: "Sugar/honey glaze", severity: "high", kind: "sugar" },
  { keyword: "teriyaki", label: "High-sugar teriyaki reduction", severity: "high", kind: "sugar" },
  { keyword: "sweet and sour", label: "High-fructose sweet & sour sauce", severity: "high", kind: "sugar" },
  { keyword: "caramel", label: "Caramelized sugar", severity: "high", kind: "sugar" },
  { keyword: "syrup", label: "Concentrated sugar syrup", severity: "high", kind: "sugar" },
];

/**
 * Bangladeshi / South Asian staples with high glycemic load. Without these, everyday dishes
 * like biryani or naan matched no trap and were classified as safe.
 */
export const LOCAL_STAPLE_TRAPS: TrapRule[] = [
  // Refined rice dishes
  { keyword: "rice", label: "White rice (high GI starch)", severity: "high", kind: "starch" },
  { keyword: "bhat", label: "White rice / bhat (high GI starch)", severity: "high", kind: "starch" },
  { keyword: "biryani", label: "Biryani rice (high GI starch + fat)", severity: "high", kind: "starch" },
  { keyword: "biriyani", label: "Biryani rice (high GI starch + fat)", severity: "high", kind: "starch" },
  { keyword: "kacchi", label: "Kacchi biryani rice (high GI starch + fat)", severity: "high", kind: "starch" },
  { keyword: "tehari", label: "Tehari rice (high GI starch + fat)", severity: "high", kind: "starch" },
  { keyword: "polao", label: "Polao rice (high GI starch + ghee)", severity: "high", kind: "starch" },
  { keyword: "pulao", label: "Pulao rice (high GI starch + ghee)", severity: "high", kind: "starch" },
  { keyword: "pilaf", label: "Pilaf rice (high GI starch)", severity: "high", kind: "starch" },
  { keyword: "khichuri", label: "Khichuri (rice-heavy)", severity: "medium", kind: "starch" },
  { keyword: "khichdi", label: "Khichdi (rice-heavy)", severity: "medium", kind: "starch" },
  // Refined flour breads & snacks
  { keyword: "naan", label: "Naan (refined maida flour)", severity: "high", kind: "starch" },
  { keyword: "nan ", label: "Naan (refined maida flour)", severity: "high", kind: "starch" },
  { keyword: "porota", label: "Porota (refined flour + oil)", severity: "high", kind: "starch" },
  { keyword: "paratha", label: "Paratha (refined flour + oil)", severity: "high", kind: "starch" },
  { keyword: "luchi", label: "Luchi (deep-fried refined flour)", severity: "high", kind: "fried" },
  { keyword: "puri", label: "Puri (deep-fried refined flour)", severity: "high", kind: "fried" },
  { keyword: "bhatura", label: "Bhatura (deep-fried refined flour)", severity: "high", kind: "fried" },
  { keyword: "kulcha", label: "Kulcha (refined flour)", severity: "high", kind: "starch" },
  { keyword: "singara", label: "Singara (fried flour + potato)", severity: "high", kind: "fried" },
  { keyword: "samosa", label: "Samosa (fried flour + potato)", severity: "high", kind: "fried" },
  { keyword: "noodle", label: "Refined flour noodles", severity: "high", kind: "starch" },
  { keyword: "chowmein", label: "Chowmein (refined flour noodles)", severity: "high", kind: "starch" },
  { keyword: "chow mein", label: "Chow mein (refined flour noodles)", severity: "high", kind: "starch" },
  { keyword: "pasta", label: "Refined pasta", severity: "medium", kind: "starch" },
  { keyword: "pizza", label: "Refined flour pizza base", severity: "high", kind: "starch" },
  { keyword: "burger", label: "Refined flour burger bun", severity: "medium", kind: "starch" },
  // Potato
  { keyword: "potato", label: "Potato (high GI starch)", severity: "high", kind: "starch" },
  { keyword: "aloo", label: "Aloo / potato (high GI starch)", severity: "high", kind: "starch" },
  { keyword: "fries", label: "French fries (fried high GI starch)", severity: "high", kind: "fried" },
  // Sweets & desserts
  { keyword: "mishti", label: "Mishti (sugar-based sweet)", severity: "high", kind: "sugar" },
  { keyword: "misti", label: "Mishti (sugar-based sweet)", severity: "high", kind: "sugar" },
  { keyword: "rasgulla", label: "Rasgulla (sugar syrup)", severity: "high", kind: "sugar" },
  { keyword: "roshogolla", label: "Roshogolla (sugar syrup)", severity: "high", kind: "sugar" },
  { keyword: "rasmalai", label: "Rasmalai (sugar + sweetened milk)", severity: "high", kind: "sugar" },
  { keyword: "roshmalai", label: "Roshmalai (sugar + sweetened milk)", severity: "high", kind: "sugar" },
  { keyword: "chomchom", label: "Chomchom (sugar syrup)", severity: "high", kind: "sugar" },
  { keyword: "jilapi", label: "Jilapi (fried + sugar syrup)", severity: "high", kind: "sugar" },
  { keyword: "jalebi", label: "Jalebi (fried + sugar syrup)", severity: "high", kind: "sugar" },
  { keyword: "gulab jamun", label: "Gulab jamun (fried + sugar syrup)", severity: "high", kind: "sugar" },
  { keyword: "kalojam", label: "Kalojam (fried + sugar syrup)", severity: "high", kind: "sugar" },
  { keyword: "sandesh", label: "Sandesh (sugar + milk)", severity: "high", kind: "sugar" },
  { keyword: "shondesh", label: "Shondesh (sugar + milk)", severity: "high", kind: "sugar" },
  { keyword: "payesh", label: "Payesh (rice + sugar + milk)", severity: "high", kind: "sugar" },
  { keyword: "kheer", label: "Kheer (rice + sugar + milk)", severity: "high", kind: "sugar" },
  { keyword: "firni", label: "Firni (rice + sugar)", severity: "high", kind: "sugar" },
  { keyword: "halwa", label: "Halwa (sugar + ghee)", severity: "high", kind: "sugar" },
  { keyword: "halua", label: "Halua (sugar + ghee)", severity: "high", kind: "sugar" },
  { keyword: "zorda", label: "Zorda (sweet rice)", severity: "high", kind: "sugar" },
  { keyword: "falooda", label: "Falooda (sugar syrup + noodles)", severity: "high", kind: "sugar" },
  { keyword: "faluda", label: "Faluda (sugar syrup + noodles)", severity: "high", kind: "sugar" },
  { keyword: "pitha", label: "Pitha (rice flour + jaggery/sugar)", severity: "high", kind: "sugar" },
  { keyword: "dessert", label: "Dessert (added sugar)", severity: "high", kind: "sugar" },
  { keyword: "cake", label: "Cake (sugar + refined flour)", severity: "high", kind: "sugar" },
  { keyword: "ice cream", label: "Ice cream (added sugar)", severity: "high", kind: "sugar" },
  { keyword: "sweet", label: "Sweetened / added sugar", severity: "high", kind: "sugar" },
  { keyword: "sugar", label: "Added sugar", severity: "high", kind: "sugar" },
  { keyword: "jaggery", label: "Jaggery / gur (sugar)", severity: "high", kind: "sugar" },
  { keyword: "gur", label: "Gur / jaggery (sugar)", severity: "high", kind: "sugar" },
  // Sugary drinks
  { keyword: "lassi", label: "Lassi (usually sweetened)", severity: "high", kind: "sugar" },
  { keyword: "juice", label: "Fruit juice (liquid sugar)", severity: "high", kind: "sugar" },
  { keyword: "soda", label: "Soft drink (liquid sugar)", severity: "high", kind: "sugar" },
  { keyword: "cola", label: "Soft drink (liquid sugar)", severity: "high", kind: "sugar" },
  { keyword: "soft drink", label: "Soft drink (liquid sugar)", severity: "high", kind: "sugar" },
  { keyword: "milkshake", label: "Milkshake (added sugar)", severity: "high", kind: "sugar" },
  { keyword: "shake", label: "Shake (added sugar)", severity: "high", kind: "sugar" },
  { keyword: "mango", label: "Mango (high natural sugar)", severity: "medium", kind: "sugar" },
];

const ALL_TRAPS: TrapRule[] = [...COVERT_TRAPS_DICTIONARY, ...LOCAL_STAPLE_TRAPS];

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
  { keyword: "dal", label: "Lentil protein & soluble fiber" },
  { keyword: "shak", label: "Leafy greens (shak)" },
  { keyword: "vegetable", label: "Vegetable fiber" },
];

const RISK_RANK: Record<MenuItemRisk, number> = { green: 0, yellow: 1, red: 2 };
const IMPACT: Record<MenuItemRisk, "low" | "medium" | "high"> = { green: "low", yellow: "medium", red: "high" };

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Matches a keyword at the START of a word ("rice" matches "fried rice" and "rices",
 * but not "price"; "gur" does not match "burger").
 */
function hasKeyword(text: string, keyword: string): boolean {
  return new RegExp(`(^|[^a-z])${escapeRegExp(keyword)}`, "i").test(text);
}

/**
 * Audits a single dish name or description for hidden traps and generates
 * deterministic classification and polite waiter modification scripts.
 *
 * Safety rule: keywords can only RAISE the risk given by the model (existingItem),
 * never lower it. Keywords alone can never mark an unknown dish as safe, because
 * no dictionary covers every dish; with no model verdict the default is caution.
 */
export function auditMenuItem(rawDish: string, existingItem?: Partial<MenuItem>): MenuItem {
  // Audit the dish name plus any description the model gave us.
  const text = `${rawDish} ${existingItem?.dish_name ?? ""}`.toLowerCase();

  // 1. Detect Traps
  const detectedTraps: string[] = [];
  const trapKinds = new Set<TrapKind>();
  let hasHighSeverityTrap = false;

  for (const trap of ALL_TRAPS) {
    if (hasKeyword(text, trap.keyword)) {
      if (!detectedTraps.includes(trap.label)) detectedTraps.push(trap.label);
      trapKinds.add(trap.kind);
      if (trap.severity === "high") hasHighSeverityTrap = true;
    }
  }

  // 2. Detect Safe Elements
  const detectedSafe: string[] = [];
  for (const safe of SAFE_ELEMENTS_DICTIONARY) {
    if (hasKeyword(text, safe.keyword) && !detectedSafe.includes(safe.label)) {
      detectedSafe.push(safe.label);
    }
  }

  // 3. Clinical Category Classification (TC-P4-01)
  let keywordRisk: MenuItemRisk;
  if (hasHighSeverityTrap || detectedTraps.length >= 2) {
    keywordRisk = "red";
  } else if (detectedTraps.length === 1) {
    keywordRisk = "yellow";
  } else if (
    // Unbreaded grilled/tandoori protein with no traps is a known-safe pattern
    (hasKeyword(text, "tandoori") || hasKeyword(text, "grilled")) &&
    (hasKeyword(text, "fish") || hasKeyword(text, "chicken"))
  ) {
    keywordRisk = "green";
  } else if (detectedSafe.length >= 2) {
    keywordRisk = "green";
  } else {
    keywordRisk = "yellow"; // unknown dish: caution, never "safe" by default
  }

  const modelRisk = existingItem?.risk_category;
  const risk: MenuItemRisk =
    modelRisk && RISK_RANK[modelRisk] > RISK_RANK[keywordRisk] ? modelRisk : keywordRisk;
  const impact = IMPACT[risk];

  // 4. Formulate Waiter Modification Script (TC-P4-02)
  const scriptParts: string[] = [];
  if (hasKeyword(text, "crispy") || hasKeyword(text, "deep-fried") || hasKeyword(text, "batter")) {
    scriptParts.push("prepare the protein grilled or pan-seared instead of deep-fried");
  }
  if (hasKeyword(text, "gravy") || hasKeyword(text, "sauce") || hasKeyword(text, "sweet corn")) {
    scriptParts.push("serve sauce/gravy on the side with no cornstarch thickener");
  }
  if (hasKeyword(text, "honey") || hasKeyword(text, "glaze") || hasKeyword(text, "sweet corn")) {
    scriptParts.push("omit the honey or sweet sugar glaze");
  }
  if (trapKinds.has("starch")) {
    scriptParts.push("give me only a small portion of rice or bread, with extra vegetables or salad instead");
  }
  if (trapKinds.has("sugar") && !hasKeyword(text, "honey") && !hasKeyword(text, "glaze")) {
    scriptParts.push("skip the sweet or sugary drink — plain water or unsweetened tea is fine");
  }

  let waiterScript: string;
  if (risk === "red") {
    waiterScript =
      scriptParts.length > 0
        ? `Please ${scriptParts.join(", ")}. Could I also have steamed vegetables or a side salad first?`
        : existingItem?.waiter_script ||
          "Please omit sweet glazes and serve sauces on the side. Could I also have steamed vegetables or a side salad first?";
  } else if (risk === "yellow") {
    waiterScript =
      scriptParts.length > 0
        ? `Please ${scriptParts.join(", ")}.`
        : existingItem?.waiter_script ||
          "Please serve sauces or dressings on the side, and replace any white rice or potatoes with steamed vegetables.";
  } else {
    waiterScript =
      "This dish is naturally diabetic-friendly! Please serve the vegetable salad first as an opening fiber shield.";
  }

  // 5. Build Clinical Rationale
  let rationale: string;
  if (risk === "red") {
    rationale =
      detectedTraps.length > 0
        ? `High glycemic spike risk. Contains covert starches/sugars: ${detectedTraps.join(
            ", "
          )}. These rapidly breakdown into free glucose in the upper digestive tract.`
        : existingItem?.clinical_rationale || "High glycemic spike risk. Eat only a very small portion, last.";
  } else if (risk === "green") {
    rationale = `Safe diabetic selection. High protein and fiber content with no covert sugars. Low glycemic impact on postprandial glucose.`;
  } else {
    rationale =
      detectedTraps.length > 0
        ? `Moderate glycemic impact (${detectedTraps.join(", ")}). Keep the portion small and eat it after vegetables and protein.`
        : existingItem?.clinical_rationale ||
          `Moderate glycemic impact. Can be made safe by requesting dressings/sauces on the side.`;
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

/** Sorts audited dishes into the lists by their FINAL (audited) risk, not the model's list. */
export function bucketByRisk(items: MenuItem[]) {
  return {
    safe_selections: items.filter((i) => i.risk_category === "green"),
    caution_items: items.filter((i) => i.risk_category === "yellow"),
    risky_traps: items.filter((i) => i.risk_category === "red"),
  };
}
