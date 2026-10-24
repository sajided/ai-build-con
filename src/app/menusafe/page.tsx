"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  Utensils,
  Camera,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  Maximize2,
  X,
  FileText,
  ShoppingBasket,
} from "lucide-react";
import type { MenuItem, MenuScanResponse } from "@/lib/validations/menusafe";

export default function MenuSafePage() {
  const [textInput, setTextInput] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<MenuScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedScriptId, setCopiedScriptId] = useState<string | null>(null);
  const [showWaiterModalItem, setShowWaiterModalItem] = useState<MenuItem | null>(null);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setImagePreview(base64);
      executeScan({ imageBase64: base64 });
    };
    reader.readAsDataURL(file);
  };

  const executeScan = async (payload: { text?: string; imageBase64?: string }) => {
    setIsScanning(true);
    setError(null);

    try {
      const res = await fetch("/api/scan/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Menu scan failed");
      }

      setScanResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to scan menu.");
    } finally {
      setIsScanning(false);
    }
  };

  const handlePreset = (presetText: string) => {
    setTextInput(presetText);
    setImagePreview(null);
    executeScan({ text: presetText });
  };

  const handleCopyScript = (item: MenuItem) => {
    navigator.clipboard.writeText(item.waiter_script);
    setCopiedScriptId(item.id);
    setTimeout(() => {
      setCopiedScriptId(null);
    }, 2000);
  };

  const handleSelectCurrentMeal = (item: MenuItem) => {
    setSelectedMealId(item.id);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("glucovision_current_meal", JSON.stringify(item));
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-3 sm:p-6 pb-24">
      {/* Container restricted to mobile/tablet optimal width */}
      <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl flex flex-col">
        {/* Navigation Header */}
        <header className="p-4 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
          <Link
            href="/scanner"
            className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Scanner</span>
          </Link>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Phase 4: MenuSafe
            </span>
          </div>
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
          >
            Dashboard
          </Link>
        </header>

        {/* Top Mode Switcher Tabs */}
        <div className="p-2 bg-slate-950/80 border-b border-slate-800/80 flex space-x-1.5">
          <Link
            href="/scanner"
            className="flex-1 py-2 rounded-xl text-center text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all flex items-center justify-center space-x-1.5"
          >
            <ShoppingBasket className="w-3.5 h-3.5" />
            <span>Bazaar Groceries</span>
          </Link>
          <button
            type="button"
            className="flex-1 py-2 rounded-xl text-center text-xs font-bold bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 flex items-center justify-center space-x-1.5"
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Restaurant MenuSafe</span>
          </button>
        </div>

        {/* Hero Section */}
        <div className="p-4 sm:p-5 border-b border-slate-800/60 bg-gradient-to-br from-emerald-950/30 via-slate-900 to-teal-950/20">
          <div className="flex items-center space-x-2.5 mb-1.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-100 leading-tight">
                MenuSafe Restaurant Auditor
              </h1>
              <p className="text-[11px] text-slate-400">
                Covert Glycemic Trap Decoder & Polite Waiter Scripts
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Dual Input Area */}
          <div className="space-y-3">
            {/* Camera / Photo Upload Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-800 hover:border-emerald-500/60 rounded-2xl p-4 text-center cursor-pointer transition-all bg-slate-950/40 hover:bg-slate-900/50 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                {imagePreview ? (
                  <div className="relative w-full h-28 rounded-xl overflow-hidden mb-1 border border-slate-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Menu Upload Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <Camera className="w-5 h-5" />
                  </div>
                )}
                <div className="text-xs font-semibold text-slate-200">
                  {imagePreview ? "Change Menu Photo" : "Photograph or Upload Menu"}
                </div>
                <p className="text-[10px] text-slate-400">
                  Instant OCR scans paper menus or digital screens for covert starch thickeners
                </p>
              </div>
            </div>

            {/* Direct Text Input Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-teal-400" />
                <span>Or Paste Dish Names / Menu Text</span>
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && textInput.trim()) {
                      e.preventDefault();
                      executeScan({ text: textInput });
                    }
                  }}
                  placeholder="e.g. Crispy Honey Glazed Chicken in Sweet Corn Gravy..."
                  className="flex-1 bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => textInput.trim() && executeScan({ text: textInput })}
                  disabled={isScanning || !textInput.trim()}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-emerald-600 hover:text-slate-950 text-slate-200 text-xs font-semibold flex items-center space-x-1 transition-all disabled:opacity-50"
                >
                  <span>Audit</span>
                </button>
              </div>
            </div>

            {/* Clinical Test Benchmark Chips */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                Clinical Test Presets:
              </div>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    handlePreset("Crispy Honey Glazed Chicken in Sweet Corn Gravy")
                  }
                  className="p-2 rounded-xl bg-rose-950/30 hover:bg-rose-950/50 border border-rose-900/60 hover:border-rose-700 text-left transition-all text-xs"
                >
                  <div className="font-semibold text-rose-400 flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>TC-P4-01 Risky Trap: Crispy Honey Glazed Chicken</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Tests covert trap detection: honey glaze, sweet corn starch, deep-fry batter.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handlePreset(
                      "Tandoori Grilled Fish with Mint Yoghurt & Steamed Broccoli"
                    )
                  }
                  className="p-2 rounded-xl bg-emerald-950/30 hover:bg-emerald-950/50 border border-emerald-900/60 hover:border-emerald-700 text-left transition-all text-xs"
                >
                  <div className="font-semibold text-emerald-400 flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>TC-P4-01 Safe Selection: Tandoori Grilled Fish</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Tests safe diabetic classification: unbreaded protein, fiber, no added sugars.
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* Loading Indicator */}
          {isScanning && (
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/30 flex items-center justify-center space-x-3 text-xs text-emerald-400 animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Analyzing Menu OCR & Decoding Glycemic Traps...</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Audit Results View */}
          {scanResult && !isScanning && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              {/* Overall Menu Verdict Card */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Overall Menu Audit Verdict</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {scanResult.restaurant_type}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {scanResult.overall_menu_verdict}
                </p>
              </div>

              {/* RISKY TRAPS (RED) */}
              {scanResult.risky_traps.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-rose-400 px-1">
                    <span className="flex items-center space-x-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Risky Traps Detected ({scanResult.risky_traps.length})</span>
                    </span>
                    <span className="text-[10px] text-rose-400/80">Requires Modification</span>
                  </div>

                  {scanResult.risky_traps.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-800/50 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-rose-200">
                            {item.dish_name}
                          </div>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-rose-950 text-rose-400 border border-rose-800">
                            High Spike Risk
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectCurrentMeal(item)}
                          className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                            selectedMealId === item.id
                              ? "bg-emerald-500 text-slate-950 border-emerald-400 font-bold"
                              : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
                          }`}
                        >
                          {selectedMealId === item.id ? "✓ Meal Selected" : "Select Meal"}
                        </button>
                      </div>

                      {/* Flagged Traps Badges */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-rose-300 uppercase tracking-wider">
                          Covert Additives Flagged:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {item.flagged_traps.map((trap, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-rose-950/80 text-rose-300 border border-rose-800/80 text-[10px] font-medium"
                            >
                              ⚠ {trap}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Clinical Rationale */}
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {item.clinical_rationale}
                      </p>

                      {/* Waiter Modification Script Box (TC-P4-02) */}
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 flex items-center space-x-1">
                            <span>Discreet Waiter Modification Script</span>
                          </span>
                          <div className="flex items-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => setShowWaiterModalItem(item)}
                              className="text-[10px] text-slate-400 hover:text-teal-300 flex items-center space-x-0.5 p-1 rounded hover:bg-slate-800 transition-colors"
                              title="Full Screen Display"
                            >
                              <Maximize2 className="w-3 h-3" />
                              <span>Show</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyScript(item)}
                              className="px-2 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-semibold flex items-center space-x-1 transition-all active:scale-95"
                            >
                              {copiedScriptId === item.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400 font-bold">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Script</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="text-xs text-slate-200 italic bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                          &ldquo;{item.waiter_script}&rdquo;
                        </div>

                        {item.suggested_side_swap && (
                          <div className="text-[10px] text-slate-400">
                            <span className="text-amber-400 font-medium">Recommended Swap: </span>
                            <span>{item.suggested_side_swap}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* SAFE SELECTIONS (GREEN) */}
              {scanResult.safe_selections.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400 px-1">
                    <span className="flex items-center space-x-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Safe Selections ({scanResult.safe_selections.length})</span>
                    </span>
                    <span className="text-[10px] text-emerald-400/80">Low Glycemic</span>
                  </div>

                  {scanResult.safe_selections.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-800/50 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-emerald-200">
                            {item.dish_name}
                          </div>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800">
                            Safe Diabetic Choice
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectCurrentMeal(item)}
                          className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                            selectedMealId === item.id
                              ? "bg-emerald-500 text-slate-950 border-emerald-400 font-bold"
                              : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
                          }`}
                        >
                          {selectedMealId === item.id ? "✓ Meal Selected" : "Select Meal"}
                        </button>
                      </div>

                      {/* Safe Elements Badges */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wider">
                          Protective Elements:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {item.safe_elements.map((safe, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 text-[10px] font-medium"
                            >
                              ✓ {safe}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Clinical Rationale */}
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {item.clinical_rationale}
                      </p>

                      {/* Waiter Script Box */}
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                            Sequence Tip for Waitstaff
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyScript(item)}
                            className="px-2 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-semibold flex items-center space-x-1 transition-all active:scale-95"
                          >
                            {copiedScriptId === item.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400 font-bold">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Script</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="text-xs text-slate-200 italic bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                          &ldquo;{item.waiter_script}&rdquo;
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Forward Action to Phase 5 */}
          <div className="pt-2 border-t border-slate-800">
            <Link
              href="/"
              className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center space-x-2 transition-all active:scale-95"
            >
              <span>Back to System Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="p-3.5 border-t border-slate-800/60 bg-slate-950/70 flex items-center justify-between text-xs text-slate-500">
          <Link href="/scanner" className="hover:text-slate-300">
            Bazaar Scanner
          </Link>
          <span className="text-emerald-400 font-medium">Phase 4 Operational</span>
        </footer>
      </div>

      {/* "Show to Waiter" High-Contrast Modal for Loud/Dim Restaurants */}
      {showWaiterModalItem && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-white text-slate-950 rounded-3xl p-6 shadow-2xl space-y-4 border-4 border-slate-300">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Show to Waitstaff
              </span>
              <button
                type="button"
                onClick={() => setShowWaiterModalItem(null)}
                className="p-1 rounded-full hover:bg-slate-200 text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-600">
                Dish: {showWaiterModalItem.dish_name}
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-950 leading-relaxed">
                &ldquo;{showWaiterModalItem.waiter_script}&rdquo;
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-normal border-t pt-2">
              Diabetic Dietary Request: Thank you for helping prepare this meal safely!
            </p>

            <button
              type="button"
              onClick={() => setShowWaiterModalItem(null)}
              className="w-full py-3 bg-slate-900 text-white font-bold rounded-2xl text-xs"
            >
              Close Card
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
