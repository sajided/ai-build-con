"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { GlucoseLog, MeasurementContext } from "@/lib/validations/telemetry";
import { CONTEXT_LABELS_BN, toBanglaDigits } from "@/lib/assistant/bangla";

interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (log: GlucoseLog) => void;
  currentDayOffset?: number;
}

export default function QuickLogModal({
  isOpen,
  onClose,
  onSave,
  currentDayOffset = 7,
}: QuickLogModalProps) {
  const [glucoseValue, setGlucoseValue] = useState<string>("");
  const [context, setContext] = useState<MeasurementContext>("fasting");
  const [mealTitle, setMealTitle] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [dayOffset, setDayOffset] = useState<number>(currentDayOffset);
  const [error, setError] = useState<string | null>(null);

  // Check if a recent meal was saved from MenuSafe or Recipes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("glucovision_current_meal");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.dish_name) {
            setMealTitle(parsed.dish_name);
            setContext("post_meal");
          } else if (parsed.title) {
            setMealTitle(parsed.title);
            setContext("post_meal");
          }
        } catch {
          // ignore
        }
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Live feedback: if the reading looks like mg/dL, show the mmol/L equivalent
  const typedVal = parseFloat(glucoseValue);
  const mmolPreview =
    !isNaN(typedVal) && typedVal > 35 && typedVal <= 600 ? Number((typedVal / 18).toFixed(1)) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const val = parseFloat(glucoseValue);
    if (isNaN(val) || val < 1.5 || val > 600) {
      setError("সঠিক সুগার লিখুন: ১.৫ থেকে ৩৫ mmol/L এর মধ্যে।");
      return;
    }

    const mgValue = val <= 35 ? Math.round(val * 18.0182) : Math.round(val);
    const newLog: GlucoseLog = {
      id: "log-" + Date.now(),
      glucose_value: mgValue,
      context,
      measured_at: new Date().toISOString(),
      notes: notes.trim() || (val <= 35 ? `${val} mmol/L` : undefined),
      linked_meal_title: mealTitle.trim() || undefined,
      day_offset: dayOffset,
    };

    onSave(newLog);
    setGlucoseValue("");
    setNotes("");
    onClose();
  };

  return (
    <div lang="bn" className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="বন্ধ করুন"
        onClick={onClose}
        className="absolute inset-0 bg-black/30 animate-in fade-in duration-200"
      />

      {/* Bottom sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="log-sheet-title"
        className="relative w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-t-[32px] bg-white px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-float animate-in slide-in-from-bottom duration-300"
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />

        <div className="mb-4 flex items-center justify-between">
          <h3 id="log-sheet-title" className="text-xl font-bold text-ink">
            সুগার লিখুন
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="-mr-2 flex h-12 w-12 items-center justify-center rounded-full text-ink-muted active:bg-canvas"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-2xl bg-risk-danger p-3 text-base font-semibold text-risk-dangerInk">{error}</div>
          )}

          {/* Reading Input */}
          <div className="flex flex-col items-center justify-center rounded-[28px] bg-pastel-blue px-4 py-6">
            <p className="mb-1 text-base font-bold text-pastel-blue-ink">সুগার কত? (mmol/L)</p>
            <div className="flex items-end justify-center gap-2">
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min="1.5"
                max="600"
                autoFocus
                required
                aria-label="সুগারের মাপ, mmol/L"
                value={glucoseValue}
                onChange={(e) => setGlucoseValue(e.target.value)}
                placeholder="6.5"
                className="w-44 bg-transparent text-center text-6xl font-extrabold text-pastel-blue-ink placeholder:text-pastel-blue-strong/60 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <span className="mb-3 text-base font-bold text-pastel-blue-ink">mmol/L</span>
            </div>
            {mmolPreview !== null ? (
              <p className="mt-1 text-base font-bold text-pastel-blue-ink">
                = {toBanglaDigits(mmolPreview)} mmol/L
              </p>
            ) : (
              <p className="mt-1 text-center text-base font-semibold text-pastel-blue-ink/80">
                মেশিনে mg/dL দেখালে সেটাও লিখতে পারেন
              </p>
            )}
          </div>

          {/* Context Chips */}
          <div className="space-y-2">
            <p className="section-title text-base">কখন মেপেছেন?</p>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "fasting", label: CONTEXT_LABELS_BN.fasting },
                { id: "post_meal", label: "খাওয়ার ২ ঘণ্টা পরে" },
                { id: "bedtime", label: CONTEXT_LABELS_BN.bedtime },
                { id: "random", label: "অন্য সময়" },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setContext(c.id as MeasurementContext)}
                  aria-pressed={context === c.id}
                  className="chip-toggle h-12 text-base"
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Linked Meal */}
          <label className="block space-y-2">
            <span className="section-title block text-base">কী খেয়েছিলেন? (না লিখলেও চলবে)</span>
            <input
              type="text"
              value={mealTitle}
              onChange={(e) => setMealTitle(e.target.value)}
              placeholder="যেমন: মাছ, ডাল"
              className="input"
            />
          </label>

          {/* Day Offset */}
          <label className="flex items-center justify-between gap-4">
            <span className="section-title text-base">পরিকল্পনার কত নম্বর দিন</span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              max="84"
              value={dayOffset}
              onChange={(e) => setDayOffset(parseInt(e.target.value) || 0)}
              className="input w-24 text-center"
            />
          </label>

          <button type="submit" className="btn-primary h-14 text-lg">
            রাখুন
          </button>
        </form>
      </div>
    </div>
  );
}
