/**
 * Bangla extension of the clinical safety guardrail (src/lib/safety/guardrails.ts),
 * whose patterns are English-only. The assistant runs both on every transcript and reply.
 */

import { evaluateClinicalSafety, containsNumericalDosage } from "@/lib/safety/guardrails";

export const BANGLA_CLINICAL_REFUSAL =
  "ওষুধ বা ইনসুলিনের মাত্রা নিয়ে আমি পরামর্শ দিতে পারি না। আপনার ডাক্তারের দেওয়া নিয়ম মেনে চলুন, আর দরকার হলে ডাক্তারকে ফোন করুন।";

const BN_INSULIN_TERMS = ["ইনসুলিন", "ইন্সুলিন"];

const BN_MEDICATION_TERMS = [
  "ওষুধ",
  "ঔষধ",
  "অষুধ",
  "ট্যাবলেট",
  "বড়ি",
  "মেটফরমিন",
  "মেটফর্মিন",
  "গ্লিক্লাজাইড",
  "গ্লিমেপিরাইড",
  "গ্লিপিজাইড",
];

const BN_DOSING_TERMS = [
  "ইউনিট",
  "ডোজ",
  "মাত্রা",
  "কত নেব",
  "কতটুকু",
  "কয়টা",
  "কটা",
  "বাড়াব",
  "বাড়িয়ে",
  "কমাব",
  "কমিয়ে",
  "বন্ধ",
  "ছেড়ে দেব",
  "বাদ দেব",
  "দ্বিগুণ",
  "ডবল",
  "আরেকটা",
  "বেশি খাব",
  "নেব",
];

/** True when Bangla text asks to dose insulin or change medication. */
export function isBanglaDosingQuery(text: string): boolean {
  if (!text) return false;
  const hasDrug = [...BN_INSULIN_TERMS, ...BN_MEDICATION_TERMS].some((t) => text.includes(t));
  const hasDosing = BN_DOSING_TERMS.some((t) => text.includes(t));
  return hasDrug && hasDosing;
}

/** True when Bangla output contains a numeric unit/dose recommendation. */
export function containsBanglaDosage(text: string): boolean {
  if (!text) return false;
  return /[0-9০-৯]+(\.[0-9০-৯]+)?\s*(ইউনিট|ইউ|মিলিগ্রাম|mg\b)/i.test(text) || /(ইনসুলিন|ইন্সুলিন)[^।.]*[0-9০-৯]/.test(text);
}

/** Checks a user transcript in either language. */
export function isUnsafeRequest(text: string): boolean {
  return evaluateClinicalSafety(text).isBlocked || isBanglaDosingQuery(text);
}

/** Replaces any reply that contains a dosage with the Bangla refusal. */
export function scrubReply(reply: string): string {
  if (containsNumericalDosage(reply) || containsBanglaDosage(reply)) {
    console.warn("[Clinical Safety Guardrail Alert]: Dosage detected in assistant reply. Overriding with refusal.");
    return BANGLA_CLINICAL_REFUSAL;
  }
  return reply;
}
