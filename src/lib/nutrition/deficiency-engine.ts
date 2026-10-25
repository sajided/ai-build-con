import {
  BazaarStapleItem,
  NutrientMetric,
  DeficienciesResponse,
} from '@/lib/validations/deficits';

/**
 * Pre-curated diabetic-safe regional bazaar catalog with verified South Asian pricing
 */
export const BAZAAR_STAPLES_CATALOG: BazaarStapleItem[] = [
  {
    id: 'okra-dherosh',
    name: 'Okra / Dherosh',
    localNameBengali: 'ঢেঁড়শ / ভেন্ডি',
    priceEstimate: '$0.40/lb',
    pricePerUnit: 0.40,
    unit: 'lb',
    category: 'vegetable',
    primaryNutrient: 'Viscous Mucilage Fiber',
    solubleFiberGrams: 3.2,
    magnesiumMg: 57,
    glycemicIndex: 15,
    mechanism: 'Forms viscous pectin gel retarding carbohydrate absorption in the proximal jejunum',
    culinaryTip: 'Lightly sauté with turmeric or steam whole; do not over-fry to preserve active mucilage.',
    badge: 'High Mucilage',
    isHighMucilage: true,
  },
  {
    id: 'flaxseeds-tishi',
    name: 'Flaxseeds / Tishi',
    localNameBengali: 'তিসি বীজ',
    priceEstimate: '$0.85/lb',
    pricePerUnit: 0.85,
    unit: 'lb',
    category: 'seed',
    primaryNutrient: 'Alpha-Linolenic Acid (ALA) & Soluble Lignans',
    solubleFiberGrams: 7.6,
    magnesiumMg: 392,
    glycemicIndex: 10,
    mechanism: 'Soluble gum mucilage blunts postprandial glycemic excursions and enhances insulin receptor sensitivity',
    culinaryTip: 'Coarsely grind fresh; sprinkle 1 tbsp over dal, yogurt, or salad immediately before consuming.',
    badge: 'High Mucilage',
    isHighMucilage: true,
  },
  {
    id: 'isabgol-psyllium',
    name: 'Isabgol / Psyllium Husk',
    localNameBengali: 'ইসবগুলের ভুষি',
    priceEstimate: '$1.20/box',
    pricePerUnit: 1.20,
    unit: 'box',
    category: 'supplement',
    primaryNutrient: 'Viscous Arabinoxylan Fiber',
    solubleFiberGrams: 5.0,
    magnesiumMg: 12,
    glycemicIndex: 0,
    mechanism: 'Produces an expansive non-fermentable gel matrix trapping simple sugars to prevent acute spikes',
    culinaryTip: 'Stir 1 spoonful into water and drink immediately 15 minutes before lunch or dinner.',
    badge: 'High Mucilage',
    isHighMucilage: true,
  },
  {
    id: 'bitter-gourd-korola',
    name: 'Bitter Gourd / Korola',
    localNameBengali: 'করলা / উচ্ছে',
    priceEstimate: '$0.75/lb',
    pricePerUnit: 0.75,
    unit: 'lb',
    category: 'vegetable',
    primaryNutrient: 'Charantin, Polypeptide-p & Vicine',
    solubleFiberGrams: 2.6,
    magnesiumMg: 36,
    glycemicIndex: 15,
    mechanism: 'Insulin-mimetic compounds stimulate peripheral glucose uptake via AMPK pathway phosphorylation',
    culinaryTip: 'Thinly slice and stir-fry with a pinch of salt and mustard seeds as the opening sequence course.',
    badge: 'Metabolic Primer',
    isHighMucilage: false,
  },
  {
    id: 'spinach-palak',
    name: 'Spinach / Palak',
    localNameBengali: 'পালং শাক',
    priceEstimate: '$0.50/bunch',
    pricePerUnit: 0.50,
    unit: 'bunch',
    category: 'leafy_green',
    primaryNutrient: 'Magnesium Buffer & Chlorophyll',
    solubleFiberGrams: 2.2,
    magnesiumMg: 79,
    glycemicIndex: 15,
    mechanism: 'Essential cofactor for tyrosine kinase autophosphorylation of insulin receptors',
    culinaryTip: 'Lightly wilt with garlic and cold-pressed oil; serve as the first fiber-barrier plate.',
    badge: 'Magnesium Buffer',
    isHighMucilage: false,
  },
  {
    id: 'fenugreek-methi',
    name: 'Fenugreek Seeds / Methi',
    localNameBengali: 'মেথি দানা',
    priceEstimate: '$0.60/pack',
    pricePerUnit: 0.60,
    unit: 'pack',
    category: 'seed',
    primaryNutrient: '4-Hydroxyisoleucine & Galactomannan',
    solubleFiberGrams: 4.8,
    magnesiumMg: 60,
    glycemicIndex: 15,
    mechanism: 'Stimulates glucose-dependent insulin secretion from pancreatic beta cells',
    culinaryTip: 'Soak 1 tsp overnight in water; drink water and chew seeds on an empty stomach.',
    badge: 'Beta-Cell Support',
    isHighMucilage: true,
  },
];

export interface FiberCalculationResult {
  dailyAverageFiber: number;
  targetMinimum: number;
  difference: number; // e.g. -16 or +2
  status: 'deficit' | 'optimal';
  badge: string | null;
  requiresHighMucilageStaples: boolean;
}

/**
 * Computes 7-Day Fiber Intake Deficit (Adheres strictly to TC-P6-01)
 * 14 g/day -> Deficit (-16g), Triggers high-mucilage local staples (Okra, Flaxseeds, Isabgol)
 * 32 g/day -> Optimal (+2g), Displays positive reinforcement badge ("Fiber Shield Adequate")
 */
export function calculateFiberDeficit(
  dailyAverageFiber: number,
  targetMinimum: number = 30
): FiberCalculationResult {
  const diff = Number((dailyAverageFiber - targetMinimum).toFixed(1));
  const isOptimal = diff >= 0;

  return {
    dailyAverageFiber,
    targetMinimum,
    difference: diff,
    status: isOptimal ? 'optimal' : 'deficit',
    badge: isOptimal ? 'Fiber Shield Adequate' : null,
    requiresHighMucilageStaples: !isOptimal,
  };
}

/**
 * Evaluates full 7-day micronutrient and macronutrient balance
 */
export function evaluateNutrientMetrics(
  fiberGrams: number,
  magnesiumMg: number = 240,
  proteinGrams: number = 55,
  carbGrams: number = 135
): NutrientMetric[] {
  // 1. Soluble Viscous Fiber (Target >= 30g)
  const fiberResult = calculateFiberDeficit(fiberGrams, 30);
  const fiberPercentage = Math.min(100, Math.round((fiberGrams / 30) * 100));

  const fiberMetric: NutrientMetric = {
    id: 'fiber',
    name: 'Soluble Viscous Fiber',
    current: fiberGrams,
    target: 30,
    unit: 'g/day',
    status: fiberResult.status === 'optimal' ? 'optimal' : (fiberGrams < 18 ? 'critical_deficit' : 'mild_deficit'),
    difference: fiberResult.difference,
    percentage: fiberPercentage,
    clinicalImpact: fiberResult.status === 'optimal'
      ? 'Optimal gut gel formation blunts glucose uptake by up to 35%.'
      : 'Severe deficiency diminishes intestinal viscosity, causing acute postprandial glucose spikes.',
    badge: fiberResult.badge,
  };

  // 2. Magnesium & Chromium Buffer (Target 400 mg)
  const magnesiumTarget = 400;
  const magDiff = Number((magnesiumMg - magnesiumTarget).toFixed(0));
  const magPercentage = Math.min(100, Math.round((magnesiumMg / magnesiumTarget) * 100));
  const magStatus = magDiff >= 0 ? 'optimal' : (magnesiumMg < 250 ? 'critical_deficit' : 'mild_deficit');

  const magnesiumMetric: NutrientMetric = {
    id: 'magnesium',
    name: 'Magnesium Buffer Index',
    current: magnesiumMg,
    target: magnesiumTarget,
    unit: 'mg/day',
    status: magStatus,
    difference: magDiff,
    percentage: magPercentage,
    clinicalImpact: magStatus === 'optimal'
      ? 'Cellular insulin receptor phosphorylation functioning at peak capacity.'
      : 'Low magnesium impairs intracellular GLUT4 translocation, worsening peripheral insulin resistance.',
    badge: magStatus === 'optimal' ? 'Electrolyte Protected' : null,
  };

  // 3. Protein-to-Carbohydrate Ratio (Target 1 : 1.5 -> ~0.67)
  const currentRatio = carbGrams > 0 ? Number((proteinGrams / carbGrams).toFixed(2)) : 0;
  const targetRatio = 0.67; // 1g protein per 1.5g carb
  const ratioDiff = Number((currentRatio - targetRatio).toFixed(2));
  const ratioPercentage = Math.min(100, Math.round((currentRatio / targetRatio) * 100));
  const ratioStatus = currentRatio >= 0.60 ? 'optimal' : (currentRatio < 0.45 ? 'critical_deficit' : 'mild_deficit');

  const proteinCarbMetric: NutrientMetric = {
    id: 'protein_carb',
    name: 'Protein-to-Carb Ratio',
    current: currentRatio,
    target: targetRatio,
    unit: 'ratio',
    status: ratioStatus,
    difference: ratioDiff,
    percentage: ratioPercentage,
    clinicalImpact: ratioStatus === 'optimal'
      ? 'Balanced gastric emptying pace provides sustained glucose release.'
      : 'Excess unbuffered carbohydrates induce rapid hepatic portal glucose flooding.',
    badge: ratioStatus === 'optimal' ? 'Macro Balanced' : null,
  };

  return [fiberMetric, magnesiumMetric, proteinCarbMetric];
}

/**
 * Returns prioritized bazaar staple recommendations based on deficit status
 */
export function getPrioritizedRecommendations(
  fiberDeficitResult: FiberCalculationResult
): BazaarStapleItem[] {
  if (fiberDeficitResult.requiresHighMucilageStaples) {
    // Return high-mucilage staples first to bridge the gap (Okra, Flaxseeds, Isabgol)
    return [
      ...BAZAAR_STAPLES_CATALOG.filter((item) => item.isHighMucilage),
      ...BAZAAR_STAPLES_CATALOG.filter((item) => !item.isHighMucilage),
    ];
  }

  // When optimal, return maintenance staples
  return BAZAAR_STAPLES_CATALOG;
}

/**
 * Builds the complete DeficienciesResponse DTO
 */
export function buildDeficiencyAnalysis(
  fiberGrams: number,
  magnesiumMg?: number,
  proteinGrams?: number,
  carbGrams?: number
): DeficienciesResponse {
  const fiberResult = calculateFiberDeficit(fiberGrams, 30);
  const metrics = evaluateNutrientMetrics(fiberGrams, magnesiumMg, proteinGrams, carbGrams);
  const recommendations = getPrioritizedRecommendations(fiberResult);

  let summaryStatement = '';
  if (fiberResult.status === 'optimal') {
    summaryStatement = 'Your 7-day fiber barrier is adequate. Continue maintaining high-viscosity vegetable consumption.';
  } else {
    summaryStatement = `Detected 7-day fiber deficit (${fiberResult.difference}g/day). Adding high-mucilage staples like Okra, Flaxseeds, and Isabgol will normalize postprandial glucose surges.`;
  }

  return {
    timeframe: 'Rolling 7-Day Average',
    dailyAverageFiber: fiberResult.dailyAverageFiber,
    fiberTarget: fiberResult.targetMinimum,
    fiberStatus: fiberResult.status,
    fiberDifference: fiberResult.difference,
    fiberBadge: fiberResult.badge,
    metrics,
    recommendations,
    summaryStatement,
  };
}
