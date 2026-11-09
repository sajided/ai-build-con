"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";
import { toBanglaDigits } from "@/lib/assistant/bangla";
import {
  step1BiometricsSchema,
  step2ClinicalSchema,
  type OnboardingFormData,
} from "@/lib/validations/onboarding";

const inputClass = "input";
const labelClass = "mb-1.5 block text-base font-bold text-ink-soft";

// Plain Bangla messages shown per field; validation itself (and its English messages) is unchanged
const FIELD_ERRORS_BN: Record<string, string> = {
  fullName: "নাম অন্তত ২ অক্ষরের লিখুন।",
  age: "সঠিক বয়স লিখুন (১ থেকে ১২০ বছর)।",
  gender: "একটি বেছে নিন।",
  heightCm: "উচ্চতা ৫০ থেকে ২৫০ সেমি-র মধ্যে লিখুন।",
  currentWeightKg: "ওজন ২০ থেকে ৩০০ কেজির মধ্যে লিখুন।",
  targetWeightKg: "লক্ষ্য ওজন ২০ থেকে ৩০০ কেজির মধ্যে লিখুন।",
  diabetesType: "আপনার ডায়াবেটিসের ধরন বেছে নিন।",
  medicationRegimen: "আপনি কী ওষুধ খান, বেছে নিন।",
  baselineHba1c: "HbA1c ৪ থেকে ১৮-এর মধ্যে লিখুন।",
  targetFastingGlucose: "লক্ষ্য ৫০ থেকে ৩০০ mg/dL-এর মধ্যে লিখুন।",
  glucoseUnit: "একক বেছে নিন।",
};

function FieldError({ field, message }: { field: string; message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-base font-semibold text-risk-dangerInk">{FIELD_ERRORS_BN[field] ?? message}</p>;
}

/** Large selectable option used for single-choice fields */
function OptionButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`min-h-12 rounded-2xl px-4 py-3 text-left text-base font-bold transition-colors ${
        selected ? "bg-ink text-white shadow-soft" : "bg-white text-ink shadow-soft active:bg-canvas"
      }`}
    >
      {children}
    </button>
  );
}

const STEP_TITLES = ["আপনার কথা", "আপনার স্বাস্থ্য", "শুরু করার আগে"];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState<Partial<OnboardingFormData>>({
    fullName: "",
    age: 42,
    gender: "male",
    heightCm: 175,
    currentWeightKg: 78,
    targetWeightKg: 72,
    diabetesType: "type_2",
    medicationRegimen: "oral_meds",
    baselineHba1c: 7.2,
    targetFastingGlucose: 110,
    glucoseUnit: "mg/dL",
    disclaimerAccepted: false,
  });

  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  // Prefill from a previously saved profile so this screen doubles as profile editing
  useEffect(() => {
    try {
      const stored = localStorage.getItem("glucovision_profile");
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<OnboardingFormData>;
        setFormData((prev) => ({ ...prev, ...parsed }));
        setIsEditing(true);
      }
    } catch {
      // Ignore corrupt stored profile
    }
  }, []);

  const updateField = (field: keyof OnboardingFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for field upon editing
    if (stepErrors[field]) {
      setStepErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateStep1 = (): boolean => {
    const res = step1BiometricsSchema.safeParse({
      fullName: formData.fullName,
      age: Number(formData.age),
      gender: formData.gender,
      heightCm: Number(formData.heightCm),
      currentWeightKg: Number(formData.currentWeightKg),
      targetWeightKg: formData.targetWeightKg ? Number(formData.targetWeightKg) : undefined,
    });

    if (!res.success) {
      const errMap: Record<string, string> = {};
      res.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errMap[issue.path[0].toString()] = issue.message;
        }
      });
      setStepErrors(errMap);
      return false;
    }
    setStepErrors({});
    return true;
  };

  const validateStep2 = (): boolean => {
    const res = step2ClinicalSchema.safeParse({
      diabetesType: formData.diabetesType,
      medicationRegimen: formData.medicationRegimen,
      baselineHba1c: Number(formData.baselineHba1c),
      targetFastingGlucose: Number(formData.targetFastingGlucose),
      glucoseUnit: formData.glucoseUnit,
    });

    if (!res.success) {
      const errMap: Record<string, string> = {};
      res.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errMap[issue.path[0].toString()] = issue.message;
        }
      });
      setStepErrors(errMap);
      return false;
    }
    setStepErrors({});
    return true;
  };

  const handleNext = () => {
    setApiError(null);
    if (currentStep === 1) {
      if (validateStep1()) setCurrentStep(2);
    } else if (currentStep === 2) {
      if (validateStep2()) setCurrentStep(3);
    }
  };

  const handleBack = () => {
    setApiError(null);
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    // Disclaimer must be explicitly checked
    if (!formData.disclaimerAccepted) {
      setStepErrors({
        disclaimerAccepted: "এগিয়ে যেতে উপরের ঘরে টিক দিন।",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: OnboardingFormData = {
        fullName: formData.fullName || "",
        age: Number(formData.age),
        gender: formData.gender as "male" | "female" | "other",
        heightCm: Number(formData.heightCm),
        currentWeightKg: Number(formData.currentWeightKg),
        targetWeightKg: formData.targetWeightKg ? Number(formData.targetWeightKg) : undefined,
        diabetesType: formData.diabetesType as "type_1" | "type_2" | "pre_diabetes" | "gestational",
        medicationRegimen: formData.medicationRegimen as "diet_only" | "oral_meds" | "insulin" | "combination",
        baselineHba1c: Number(formData.baselineHba1c),
        targetFastingGlucose: Number(formData.targetFastingGlucose || 110),
        glucoseUnit: (formData.glucoseUnit as "mg/dL" | "mmol/L") || "mg/dL",
        disclaimerAccepted: true,
      };

      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setApiError("আপনার তথ্য রাখা যায়নি। আবার চেষ্টা করুন।");
        setIsSubmitting(false);
        return;
      }

      // Store profile state in localStorage for client persistence
      if (typeof window !== "undefined") {
        localStorage.setItem("glucovision_profile", JSON.stringify(payload));
      }

      // The API still returns redirectUrl "/scanner" (TC-P1-02E); in the app shell we land on Home
      router.push("/dashboard");
    } catch (err: unknown) {
      console.error("Onboarding submit failed", err);
      setApiError("ইন্টারনেট সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      setIsSubmitting(false);
    }
  };

  const canSubmit = Boolean(formData.disclaimerAccepted) && !isSubmitting;

  return (
    <form lang="bn" onSubmit={handleSubmit} className="flex min-h-dvh flex-col bg-canvas">
      {/* Top bar: back, progress */}
      <header className="sticky top-0 z-30 bg-canvas/90 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
        <div className="flex h-16 items-center gap-2 px-4">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              aria-label="ফিরে যান"
              className="-ml-2 flex h-12 w-12 items-center justify-center rounded-full text-ink active:bg-black/5"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          ) : (
            <Link
              href="/dashboard"
              aria-label="ফিরে যান"
              className="-ml-2 flex h-12 w-12 items-center justify-center rounded-full text-ink active:bg-black/5"
            >
              <ChevronLeft className="h-6 w-6" />
            </Link>
          )}
          <p className="flex-1 text-center text-base font-bold text-ink-muted">ধাপ {toBanglaDigits(currentStep)} / ৩</p>
          <div className="w-12" />
        </div>
        <div className="grid grid-cols-3 gap-1.5 px-4 pb-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`h-1.5 rounded-full transition-colors duration-300 ${currentStep >= n ? "bg-ink" : "bg-line"}`}
            />
          ))}
        </div>
      </header>

      <main className="flex-1 space-y-6 px-4 py-5">
        <div>
          <h1 className="text-3xl font-bold text-ink">
            {currentStep === 1 ? (isEditing ? "আপনার তথ্য" : "স্বাগতম") : STEP_TITLES[currentStep - 1]}
          </h1>
          <p className="mt-1 text-lg text-ink-soft">
            {currentStep === 1 && "নিজের সম্পর্কে একটু বলুন, তাহলে পরামর্শ আপনার মতো হবে।"}
            {currentStep === 2 && "এতে আপনার জন্য ঠিকঠাক সুগারের লক্ষ্য ঠিক করা যাবে।"}
            {currentStep === 3 && "যত্ন কীভাবে কাজ করে, সে বিষয়ে একটা জরুরি কথা।"}
          </p>
        </div>

        {apiError && (
          <div className="flex items-start gap-2 rounded-2xl bg-risk-danger p-4 text-base font-semibold text-risk-dangerInk">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        {/* STEP 1: Biometrics */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div>
              <label htmlFor="fullName" className={labelClass}>পুরো নাম</label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                value={formData.fullName || ""}
                onChange={(e) => updateField("fullName", e.target.value)}
                placeholder="আপনার নাম"
                className={inputClass}
              />
              <FieldError field="fullName" message={stepErrors.fullName} />
            </div>

            <div>
              <label htmlFor="age" className={labelClass}>বয়স (বছর)</label>
              <input
                id="age"
                type="number"
                inputMode="numeric"
                value={formData.age ?? ""}
                onChange={(e) => updateField("age", e.target.value ? Number(e.target.value) : "")}
                placeholder="42"
                className={inputClass}
              />
              <FieldError field="age" message={stepErrors.age} />
            </div>

            <div>
              <span className={labelClass}>লিঙ্গ</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "male", label: "পুরুষ" },
                  { id: "female", label: "মহিলা" },
                  { id: "other", label: "অন্যান্য" },
                ].map((item) => (
                  <OptionButton
                    key={item.id}
                    selected={(formData.gender || "male") === item.id}
                    onClick={() => updateField("gender", item.id)}
                  >
                    <span className="block text-center">{item.label}</span>
                  </OptionButton>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="heightCm" className={labelClass}>উচ্চতা (সেমি)</label>
                <input
                  id="heightCm"
                  type="number"
                  inputMode="numeric"
                  value={formData.heightCm ?? ""}
                  onChange={(e) => updateField("heightCm", e.target.value ? Number(e.target.value) : "")}
                  placeholder="175"
                  className={inputClass}
                />
                <FieldError field="heightCm" message={stepErrors.heightCm} />
              </div>

              <div>
                <label htmlFor="currentWeightKg" className={labelClass}>ওজন (কেজি)</label>
                <input
                  id="currentWeightKg"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={formData.currentWeightKg ?? ""}
                  onChange={(e) => updateField("currentWeightKg", e.target.value ? Number(e.target.value) : "")}
                  placeholder="78"
                  className={inputClass}
                />
                <FieldError field="currentWeightKg" message={stepErrors.currentWeightKg} />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Clinical Background */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <span className={labelClass}>কোন ধরনের ডায়াবেটিস</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "type_2", label: "টাইপ ২" },
                  { id: "pre_diabetes", label: "প্রি-ডায়াবেটিস (শুরুর দিকে)" },
                  { id: "type_1", label: "টাইপ ১" },
                  { id: "gestational", label: "গর্ভকালীন" },
                ].map((item) => (
                  <OptionButton
                    key={item.id}
                    selected={formData.diabetesType === item.id}
                    onClick={() => updateField("diabetesType", item.id)}
                  >
                    {item.label}
                  </OptionButton>
                ))}
              </div>
            </div>

            <div>
              <span className={labelClass}>এখন কী ওষুধ খান</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "diet_only", label: "ওষুধ নেই, শুধু খাবার ও হাঁটা" },
                  { id: "oral_meds", label: "ট্যাবলেট (যেমন মেটফরমিন)" },
                  { id: "insulin", label: "ইনসুলিন" },
                  { id: "combination", label: "ট্যাবলেট + ইনসুলিন" },
                ].map((item) => (
                  <OptionButton
                    key={item.id}
                    selected={(formData.medicationRegimen || "oral_meds") === item.id}
                    onClick={() => updateField("medicationRegimen", item.id)}
                  >
                    <span className="text-base leading-snug">{item.label}</span>
                  </OptionButton>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="baselineHba1c" className={labelClass}>শেষ HbA1c (%)</label>
                <input
                  id="baselineHba1c"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={formData.baselineHba1c ?? ""}
                  onChange={(e) => updateField("baselineHba1c", e.target.value ? Number(e.target.value) : "")}
                  placeholder="7.2"
                  className={inputClass}
                />
                <FieldError field="baselineHba1c" message={stepErrors.baselineHba1c} />
                <p className="mt-1.5 text-base text-ink-muted">৩ মাসের গড় সুগার পরীক্ষা</p>
              </div>

              <div>
                <label htmlFor="targetFastingGlucose" className={labelClass}>খালি পেটে সুগারের লক্ষ্য (mg/dL)</label>
                <input
                  id="targetFastingGlucose"
                  type="number"
                  inputMode="numeric"
                  value={formData.targetFastingGlucose ?? 110}
                  onChange={(e) => updateField("targetFastingGlucose", e.target.value ? Number(e.target.value) : "")}
                  placeholder="110"
                  className={inputClass}
                />
                <FieldError field="targetFastingGlucose" message={stepErrors.targetFastingGlucose} />
                {Number(formData.targetFastingGlucose) > 0 && (
                  <p className="mt-1.5 text-base text-ink-muted">
                    = {toBanglaDigits(Number((Number(formData.targetFastingGlucose) / 18).toFixed(1)))} mmol/L
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Clinical Disclaimer (TC-P1-02D) */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="tile space-y-3 bg-pastel-peach p-5 text-base leading-relaxed text-pastel-peach-ink">
              <span className="chip text-base">
                <ShieldAlert className="h-5 w-5" />
                যত্ন ডাক্তার নয়
              </span>
              <p>
                আমরা খাবার বুঝতে আর সুগারের ধরন খেয়াল করতে সাহায্য করি। আমরা <strong>কখনো</strong> ইনসুলিনের মাত্রা
                হিসাব করি না, ওষুধ বদলাই না, রোগও ঠিক করি না।
              </p>
              <p>ইনসুলিন বা অন্য কোনো ওষুধ বদলানোর আগে সবসময় ডাক্তারের সাথে কথা বলুন।</p>
            </div>

            <label className="card flex cursor-pointer items-start gap-3 p-4 active:bg-canvas">
              <input
                type="checkbox"
                id="disclaimer-checkbox"
                checked={Boolean(formData.disclaimerAccepted)}
                onChange={(e) => updateField("disclaimerAccepted", e.target.checked)}
                className="mt-0.5 h-6 w-6 shrink-0 cursor-pointer rounded-md accent-ink"
              />
              <span className="text-lg font-semibold leading-snug text-ink">
                আমি বুঝেছি, যত্ন শুধু খাবার ও অভ্যাস নিয়ে পরামর্শ দেয়, চিকিৎসার পরামর্শ দেয় না।
              </span>
            </label>
            <FieldError field="disclaimerAccepted" message={stepErrors.disclaimerAccepted} />
          </div>
        )}
      </main>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 z-30 bg-canvas/95 px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-xl">
        {currentStep < 3 ? (
          <button type="button" onClick={handleNext} className="btn-primary h-14 text-lg">
            এগিয়ে যান
          </button>
        ) : (
          <button type="submit" id="submit-onboarding-btn" disabled={!canSubmit} className="btn-primary h-14 text-lg">
            {isSubmitting ? (
              <span>একটু অপেক্ষা করুন…</span>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5" />
                <span>{isEditing ? "রাখুন" : "শেষ করুন"}</span>
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
}
