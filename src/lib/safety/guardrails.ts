/**
 * Clinical Safety Guardrail Engine (TC-P7-01 Compliance)
 *
 * Guarantees that Jotno unequivocally refuses to calculate medical insulin doses
 * or adjust pharmaceutical regimens, adhering strictly to medical software safety standards.
 */

export const STANDARDIZED_CLINICAL_REFUSAL =
  'Jotno is an educational lifestyle tool and is strictly prohibited from calculating insulin dosages or modifying medication regimens. Please contact your endocrinologist or emergency healthcare provider immediately.';

export interface SafetyCheckResult {
  isBlocked: boolean;
  category: 'insulin_dosing' | 'medication_adjustment' | 'prescription_alteration' | 'safe';
  reason: string | null;
  refusalMessage: string | null;
  containsNumericalUnits: boolean;
  sanitizedOutput?: string;
}

// 1. High-risk Insulin terms & dose patterns (case-insensitive)
const INSULIN_TERMS = [
  'insulin',
  'humalog',
  'novorapid',
  'novolog',
  'lantus',
  'levemir',
  'tresiba',
  'toujeo',
  'apidra',
  'fiasp',
  'bolus',
  'basal',
  'sliding scale',
  'correction dose',
  'carb ratio',
  'icr',
  'isf',
  'units of',
  'how many units',
  'inject',
  'injection dose',
];

// 2. Prescription oral / injectable diabetes medications
const MEDICATION_TERMS = [
  'metformin',
  'glipizide',
  'glimepiride',
  'glyburide',
  'ozempic',
  'rybelsus',
  'wegovy',
  'mounjaro',
  'tirzepatide',
  'semaglutide',
  'jardiance',
  'farxiga',
  'invokana',
  'januvia',
  'trulicity',
  'victoza',
  'actos',
  'pioglitazone',
];

// 3. Action verbs requesting alteration, titration, or calculation
const ACTION_TERMS = [
  'calculate',
  'how many units',
  'how much',
  'dose',
  'dosage',
  'inject',
  'take',
  'stop taking',
  'skip',
  'double',
  'reduce',
  'increase',
  'titrate',
  'prescribe',
  'adjust',
  'change',
  'discontinue',
];

// Regex patterns targeting dangerous intent
const DANGEROUS_PATTERNS: { regex: RegExp; category: SafetyCheckResult['category']; reason: string }[] = [
  // Insulin dose calculation requests
  {
    regex: /(how many units|how much insulin|calculate.*bolus|calculate.*insulin|inject.*units|units.*should i inject|units.*of.*(?:humalog|novorapid|novolog|insulin))/i,
    category: 'insulin_dosing',
    reason: 'Requesting numerical insulin bolus or basal dosage calculation',
  },
  // Insulin dosing based on carbohydrates or meals (e.g., "ate 80g of rice, tell me how many units")
  {
    regex: /(?:ate|eat|eating|carbs?|rice|potato|meal).*?(?:how many units|insulin.*inject|units.*(?:humalog|novorapid|insulin))/i,
    category: 'insulin_dosing',
    reason: 'Requesting carb-to-insulin bolus ratio execution',
  },
  // Medication discontinuation or dosage alteration (e.g., "should I stop taking my 500mg Metformin")
  {
    regex: /(?:should i|can i|may i)?\s*(?:stop|quit|skip|discontinue|pause|halt)\s*(?:taking\s*)?(?:my\s*)?(?:\d+\s*mg\s*)?(?:metformin|glipizide|glimepiride|ozempic|jardiance|farxiga|januvia|insulin|medication|tablet|pill)/i,
    category: 'medication_adjustment',
    reason: 'Requesting prescription medication cessation or interruption',
  },
  // Doubling or increasing medication/insulin dosage
  {
    regex: /(?:double|increase|reduce|halve|adjust|change)\s*(?:my\s*)?(?:dose|dosage|units)?\s*(?:of\s*)?(?:metformin|glipizide|glimepiride|ozempic|jardiance|insulin|humalog|novorapid)/i,
    category: 'prescription_alteration',
    reason: 'Requesting pharmaceutical dosage alteration without physician consultation',
  },
  // Sliding scale requests
  {
    regex: /(?:sliding scale|correction factor|correction dose|bolus calculator)/i,
    category: 'insulin_dosing',
    reason: 'Requesting clinical sliding scale insulin computation',
  },
  // Adversarial spacing / leetspeak (e.g. "i-n-s-u-l-i-n  d-o-s-e" or "1nsul1n")
  {
    regex: /i[\s\-_.]*n[\s\-_.]*s[\s\-_.]*u[\s\-_.]*l[\s\-_.]*i[\s\-_.]*n[\s\-_.]*(?:d[\s\-_.]*o[\s\-_.]*s[\s\-_.]*e|u[\s\-_.]*n[\s\-_.]*i[\s\-_.]*t)/i,
    category: 'insulin_dosing',
    reason: 'Obfuscated insulin dosing intent detected',
  },
];

/**
 * Checks if a string contains any numerical insulin unit recommendation
 * (e.g., "Take 4 units", "Inject 6 units", "4 units of Humalog")
 */
export function containsNumericalDosage(text: string): boolean {
  if (!text) return false;
  // Matches numbers directly associated with insulin units
  const numericalUnitRegex = /\b\d+(\.\d+)?\s*(?:units?|iu|u)\b/i;
  const injectNumberRegex = /(?:take|inject|administer)\s+\d+(\.\d+)?\b/i;
  return numericalUnitRegex.test(text) || injectNumberRegex.test(text);
}

/**
 * Evaluates an input query against medical software safety guardrails
 */
export function evaluateClinicalSafety(query: string): SafetyCheckResult {
  if (!query || typeof query !== 'string') {
    return {
      isBlocked: false,
      category: 'safe',
      reason: null,
      refusalMessage: null,
      containsNumericalUnits: false,
    };
  }

  const normalized = query.toLowerCase().trim();

  // 1. Check dangerous regex patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.regex.test(normalized)) {
      return {
        isBlocked: true,
        category: pattern.category,
        reason: pattern.reason,
        refusalMessage: STANDARDIZED_CLINICAL_REFUSAL,
        containsNumericalUnits: false, // Refusal strictly contains 0 numerical units
      };
    }
  }

  // 2. Token cross-matching: Action + Insulin Term
  const hasInsulin = INSULIN_TERMS.some((term) => normalized.includes(term));
  const hasAction = ACTION_TERMS.some((term) => normalized.includes(term));
  const hasMedication = MEDICATION_TERMS.some((term) => normalized.includes(term));

  if (hasInsulin && (hasAction || normalized.includes('unit') || normalized.includes('inject') || normalized.includes('calculate') || normalized.includes('how much'))) {
    return {
      isBlocked: true,
      category: 'insulin_dosing',
      reason: 'Combination of insulin reference and dosing action detected',
      refusalMessage: STANDARDIZED_CLINICAL_REFUSAL,
      containsNumericalUnits: false,
    };
  }

  if (hasMedication && (hasAction || normalized.includes('stop') || normalized.includes('skip') || normalized.includes('change') || normalized.includes('double') || normalized.includes('adjust'))) {
    return {
      isBlocked: true,
      category: 'medication_adjustment',
      reason: 'Combination of prescription pharmaceutical and alteration action detected',
      refusalMessage: STANDARDIZED_CLINICAL_REFUSAL,
      containsNumericalUnits: false,
    };
  }

  // Safe educational query
  return {
    isBlocked: false,
    category: 'safe',
    reason: null,
    refusalMessage: null,
    containsNumericalUnits: false,
  };
}

/**
 * Output Scrubber: Guarantees that any text sent to the patient contains ZERO
 * numerical insulin unit recommendations. If detected, sanitizes with the standardized refusal.
 */
export function scrubAIOutput(output: string): string {
  if (!output) return output;

  if (containsNumericalDosage(output)) {
    console.warn('[Clinical Safety Guardrail Alert]: Numerical dosage detected in AI output. Overriding with clinical refusal.');
    return STANDARDIZED_CLINICAL_REFUSAL;
  }

  return output;
}
