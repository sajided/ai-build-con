/**
 * Bangla language helpers for the elder voice assistant.
 */

import type { MeasurementContext } from "@/lib/validations/telemetry";

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

/** 160 → "১৬০" */
export function toBanglaDigits(value: number | string): string {
  return String(value).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

/** "১৬০" → "160" (leaves Latin digits untouched) */
export function fromBanglaDigits(value: string): string {
  return value.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
}

export const CONTEXT_LABELS_BN: Record<MeasurementContext, string> = {
  fasting: "খালি পেটে",
  post_meal: "খাওয়ার পরে",
  bedtime: "ঘুমানোর আগে",
  random: "যেকোনো সময়",
};

export type GlucoseLevel = "low" | "good" | "slightly_high" | "high" | "very_high";

export const GLUCOSE_LOW = 70;
export const GLUCOSE_VERY_HIGH = 300;

/** Bands in mg/dL. `low` and `very_high` trigger the help screen. */
export function classifyGlucose(value: number): GlucoseLevel {
  if (value < GLUCOSE_LOW) return "low";
  if (value <= 140) return "good";
  if (value <= 180) return "slightly_high";
  if (value < GLUCOSE_VERY_HIGH) return "high";
  return "very_high";
}

export const LEVEL_LABELS_BN: Record<GlucoseLevel, string> = {
  low: "কম",
  good: "ভালো",
  slightly_high: "একটু বেশি",
  high: "বেশি",
  very_high: "অনেক বেশি",
};

/** Spoken feedback after a reading is saved. Never mentions medication doses. */
export function readingFeedbackBn(value: number): string {
  const n = toBanglaDigits(value);
  switch (classifyGlucose(value)) {
    case "low":
      return `আপনার সুগার ${n}, এটা কম। এখনই আধা গ্লাস ফলের রস বা এক চামচ চিনি পানিতে গুলে খান। ১৫ মিনিট পরে আবার মাপুন।`;
    case "good":
      return `আপনার সুগার ${n}। এটা ভালো আছে। এভাবেই চালিয়ে যান।`;
    case "slightly_high":
      return `আপনার সুগার ${n}, একটু বেশি। পানি খান আর পারলে একটু হাঁটুন।`;
    case "high":
      return `আপনার সুগার ${n}, এটা বেশি। পানি খান, মিষ্টি ও ভাত কম খান। কয়েক ঘণ্টা পরে আবার মাপুন।`;
    case "very_high":
      return `আপনার সুগার ${n}, এটা অনেক বেশি। আজই আপনার ডাক্তার বা পরিবারের কাউকে জানান। বমি বা খুব ঘুম ঘুম লাগলে এখনই ফোন করুন।`;
  }
}

export function greetingBn(hour: number): string {
  if (hour < 12) return "শুভ সকাল";
  if (hour < 17) return "শুভ দুপুর";
  return "শুভ সন্ধ্যা";
}
