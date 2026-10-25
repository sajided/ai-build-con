"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Utensils, Clock, Check } from "lucide-react";
import type { GlucoseLog, MeasurementContext } from "@/lib/validations/telemetry";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const val = parseFloat(glucoseValue);
    if (isNaN(val) || val < 30 || val > 600) {
      setError("Please enter a valid glucose reading between 30 and 600 mg/dL.");
      return;
    }

    const newLog: GlucoseLog = {
      id: "log-" + Date.now(),
      glucose_value: Number(val.toFixed(0)),
      context,
      measured_at: new Date().toISOString(),
      notes: notes.trim() || undefined,
      linked_meal_title: mealTitle.trim() || undefined,
      day_offset: dayOffset,
    };

    onSave(newLog);
    setGlucoseValue("");
    setNotes("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Log Blood Glucose</h3>
              <p className="text-[10px] text-slate-400">Update Telemetry & Trajectory</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-[11px]">
              {error}
            </div>
          )}

          {/* Reading Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">
              Glucose Level (mg/dL)
            </label>
            <div className="relative">
              <input
                type="number"
                step="1"
                min="30"
                max="600"
                autoFocus
                required
                value={glucoseValue}
                onChange={(e) => setGlucoseValue(e.target.value)}
                placeholder="e.g. 115"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-lg font-bold text-emerald-400 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
              <span className="absolute right-3.5 top-3 text-[11px] font-medium text-slate-500">
                mg/dL
              </span>
            </div>
          </div>

          {/* Context Chips */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300 flex items-center space-x-1">
              <Clock className="w-3 h-3 text-teal-400" />
              <span>Measurement Context</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: "fasting", label: "Fasting (FBS)" },
                { id: "post_meal", label: "2hr Post-Meal" },
                { id: "bedtime", label: "Bedtime" },
                { id: "random", label: "Random Check" },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setContext(c.id as MeasurementContext)}
                  className={`p-2 rounded-xl text-left border transition-all ${
                    context === c.id
                      ? "bg-emerald-950/70 border-emerald-500 text-emerald-300 font-bold"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <div className="text-[11px] truncate">{c.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Linked Meal */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300 flex items-center space-x-1">
              <Utensils className="w-3 h-3 text-amber-400" />
              <span>Associated Meal (Optional)</span>
            </label>
            <input
              type="text"
              value={mealTitle}
              onChange={(e) => setMealTitle(e.target.value)}
              placeholder="e.g. Tandoori Grilled Fish, Dal Stew..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Day Offset */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-300">
                Clinical Timeline Day
              </label>
              <span className="text-[10px] text-teal-400 font-mono">Day {dayOffset}</span>
            </div>
            <input
              type="number"
              min="0"
              max="84"
              value={dayOffset}
              onChange={(e) => setDayOffset(parseInt(e.target.value) || 0)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold hover:brightness-110 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Reading</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
