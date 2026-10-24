"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  User,
  HeartPulse,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Ruler,
} from "lucide-react";
import {
  step1BiometricsSchema,
  step2ClinicalSchema,
  type OnboardingFormData,
} from "@/lib/validations/onboarding";

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<OnboardingFormData>>({
    fullName: "Alex Rivera",
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
        disclaimerAccepted: "You must acknowledge and accept the non-diagnostic clinical disclaimer to proceed.",
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
        setApiError(data.error || "Failed to submit onboarding form");
        setIsSubmitting(false);
        return;
      }

      // Store profile state in localStorage for client persistence
      if (typeof window !== "undefined") {
        localStorage.setItem("glucovision_profile", JSON.stringify(payload));
      }

      // Successful onboarding redirects to /scanner (TC-P1-02E)
      router.push(data.redirectUrl || "/scanner");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      setApiError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#070b12] text-slate-100 flex items-center justify-center p-3 sm:p-6 lg:p-8">
      {/* Mobile-first Wizard Container */}
      <div className="w-full max-w-lg bg-gradient-to-b from-[#0d1527] to-[#080d18] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-xl relative flex flex-col">
        {/* Glow ambient header */}
        <div className="absolute top-0 inset-x-0 h-36 bg-gradient-to-b from-emerald-500/15 via-emerald-600/5 to-transparent pointer-events-none" />

        {/* Header & Step Indicator */}
        <header className="px-6 pt-6 pb-4 border-b border-slate-800/60 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Activity className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white tracking-tight font-heading">
                  Clinical Onboarding
                </h1>
                <p className="text-[11px] text-slate-400">Step {currentStep} of 3</p>
              </div>
            </div>

            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Phase 1 Flow
            </span>
          </div>

          {/* Progress Bar */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentStep >= 1 ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" : "bg-slate-800"
              }`}
            />
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentStep >= 2 ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" : "bg-slate-800"
              }`}
            />
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentStep >= 3 ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" : "bg-slate-800"
              }`}
            />
          </div>
        </header>

        {/* Wizard Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 relative z-10 overflow-y-auto max-h-[75vh]">
          {apiError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{apiError}</span>
            </div>
          )}

          {/* STEP 1: Biometrics */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center space-x-2 pb-1 border-b border-slate-800/60">
                <User className="w-4 h-4 text-emerald-400" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Step 1: Patient Biometrics
                </h2>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName || ""}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                {stepErrors.fullName && (
                  <p className="text-[11px] text-rose-400 mt-1">{stepErrors.fullName}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    value={formData.age ?? ""}
                    onChange={(e) => updateField("age", e.target.value ? Number(e.target.value) : "")}
                    placeholder="e.g. 42"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  {stepErrors.age && (
                    <p className="text-[11px] text-rose-400 mt-1">{stepErrors.age}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Gender</label>
                  <select
                    value={formData.gender || "male"}
                    onChange={(e) => updateField("gender", e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center space-x-1">
                    <Ruler className="w-3.5 h-3.5 text-slate-400" />
                    <span>Height (cm)</span>
                  </label>
                  <input
                    type="number"
                    value={formData.heightCm ?? ""}
                    onChange={(e) => updateField("heightCm", e.target.value ? Number(e.target.value) : "")}
                    placeholder="e.g. 175"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                  {stepErrors.heightCm && (
                    <p className="text-[11px] text-rose-400 mt-1">{stepErrors.heightCm}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center space-x-1">
                    <Scale className="w-3.5 h-3.5 text-slate-400" />
                    <span>Weight (kg)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.currentWeightKg ?? ""}
                    onChange={(e) => updateField("currentWeightKg", e.target.value ? Number(e.target.value) : "")}
                    placeholder="e.g. 78"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                  {stepErrors.currentWeightKg && (
                    <p className="text-[11px] text-rose-400 mt-1">{stepErrors.currentWeightKg}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Clinical Background */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center space-x-2 pb-1 border-b border-slate-800/60">
                <HeartPulse className="w-4 h-4 text-emerald-400" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Step 2: Clinical Background
                </h2>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Diabetes Diagnosis
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "type_2", label: "Type 2" },
                    { id: "pre_diabetes", label: "Pre-Diabetes" },
                    { id: "type_1", label: "Type 1" },
                    { id: "gestational", label: "Gestational" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => updateField("diabetesType", item.id)}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border text-left transition-all ${
                        formData.diabetesType === item.id
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/20"
                          : "bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Current Medication Regimen
                </label>
                <select
                  value={formData.medicationRegimen || "oral_meds"}
                  onChange={(e) => updateField("medicationRegimen", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="diet_only">Diet & Lifestyle Only</option>
                  <option value="oral_meds">Oral Medication (e.g. Metformin)</option>
                  <option value="insulin">Insulin Dependent</option>
                  <option value="combination">Combination (Oral + Insulin)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Baseline HbA1c (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.baselineHba1c ?? ""}
                    onChange={(e) => updateField("baselineHba1c", e.target.value ? Number(e.target.value) : "")}
                    placeholder="e.g. 7.2"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                  {stepErrors.baselineHba1c && (
                    <p className="text-[11px] text-rose-400 mt-1">{stepErrors.baselineHba1c}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Target Fasting (mg/dL)
                  </label>
                  <input
                    type="number"
                    value={formData.targetFastingGlucose ?? 110}
                    onChange={(e) => updateField("targetFastingGlucose", e.target.value ? Number(e.target.value) : "")}
                    placeholder="e.g. 110"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Clinical Disclaimer (TC-P1-02D) */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center space-x-2 pb-1 border-b border-slate-800/60">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Step 3: Medical Disclaimer Guard
                </h2>
              </div>

              {/* Legal Non-Diagnostic Notice */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200/90 leading-relaxed space-y-2">
                <div className="font-semibold text-amber-300 flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Mandatory Non-Diagnostic Agreement</span>
                </div>
                <p>
                  GlucoVision is an <strong>educational lifestyle and dietary analysis companion</strong>. 
                  It is <strong>strictly prohibited</strong> from calculating medical insulin doses, prescribing medication adjustments, or providing clinical diagnoses.
                </p>
                <p>
                  Always consult your certified endocrinologist or primary healthcare provider before modifying any insulin regimens or pharmaceutical therapies.
                </p>
              </div>

              {/* Mandatory Acceptance Checkbox */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-colors">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    id="disclaimer-checkbox"
                    checked={Boolean(formData.disclaimerAccepted)}
                    onChange={(e) => updateField("disclaimerAccepted", e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-400 focus:ring-offset-slate-900 shrink-0 cursor-pointer"
                  />
                  <span className="text-xs text-slate-200 leading-normal">
                    I acknowledge that GlucoVision does <strong>not</strong> provide medical diagnoses or calculate insulin doses, and I agree to use this application strictly for dietary education.
                  </span>
                </label>
              </div>
              {stepErrors.disclaimerAccepted && (
                <p className="text-[11px] text-rose-400 font-medium">
                  {stepErrors.disclaimerAccepted}
                </p>
              )}
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-800/80">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800 flex items-center space-x-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-semibold hover:bg-emerald-400 flex items-center space-x-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                id="submit-onboarding-btn"
                disabled={!formData.disclaimerAccepted || isSubmitting}
                className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
                  formData.disclaimerAccepted && !isSubmitting
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/30 hover:brightness-110 active:scale-95 cursor-pointer"
                    : "bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-60"
                }`}
              >
                {isSubmitting ? (
                  <span>Saving Clinical Profile...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete & Launch Scanner</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}
