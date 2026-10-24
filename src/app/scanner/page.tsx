"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Camera,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  ChefHat,
  Eye,
  Utensils,
} from "lucide-react";
import type { BazaarScanResponse, ScannedItem } from "@/lib/validations/scanner";
import type { OnboardingFormData } from "@/lib/validations/onboarding";

export default function ScannerPage() {
  const [profile, setProfile] = useState<Partial<OnboardingFormData> | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<BazaarScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<"all" | "green" | "yellow" | "red">("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load clinical profile from Phase 1 onboarding
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("glucovision_profile");
      if (stored) {
        try {
          setProfile(JSON.parse(stored));
        } catch {
          // Fallback if parsing fails
        }
      }
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setImagePreview(base64);
      executeScan(base64, file);
    };
    reader.readAsDataURL(file);
  };

  const handleLoadPreset = async () => {
    setError(null);
    // Representative placeholder photo of fresh vegetables & pulses
    const presetSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23064e3b"/><text x="50%25" y="45%25" dominant-baseline="middle" text-anchor="middle" fill="%2334d399" font-family="sans-serif" font-size="22" font-weight="bold">Standard Regional Bazaar Basket</text><text x="50%25" y="58%25" dominant-baseline="middle" text-anchor="middle" fill="%23a7f3d0" font-family="sans-serif" font-size="14">[Potatoes, Bitter Gourd, Lentils, White Rice, Chilies]</text></svg>`;
    setImagePreview(presetSvg);
    executeScan("mock-preset", null);
  };

  const executeScan = async (base64: string | null, file: File | null) => {
    setIsScanning(true);
    setError(null);

    try {
      let res: Response;

      if (file) {
        const formData = new FormData();
        formData.append("image", file);
        res = await fetch("/api/scan/bazaar", {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch("/api/scan/bazaar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64 || "mock-preset",
          }),
        });
      }

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.details || json.error || "Failed to scan image");
        setIsScanning(false);
        return;
      }

      setScanResult(json.data);
      if (typeof window !== "undefined") {
        localStorage.setItem("glucovision_detected_items", JSON.stringify(json.data.scanned_items));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error during scan";
      setError(msg);
    } finally {
      setIsScanning(false);
    }
  };

  const filteredItems = scanResult?.scanned_items.filter((item) => {
    if (filterCategory === "all") return true;
    return item.risk_category === filterCategory;
  }) || [];

  const counts = {
    green: scanResult?.scanned_items.filter((i) => i.risk_category === "green").length || 0,
    yellow: scanResult?.scanned_items.filter((i) => i.risk_category === "yellow").length || 0,
    red: scanResult?.scanned_items.filter((i) => i.risk_category === "red").length || 0,
  };

  return (
    <main className="min-h-screen bg-[#070b12] text-slate-100 flex items-center justify-center p-3 sm:p-6 lg:p-8">
      {/* Mobile-first Scanner Container */}
      <div className="w-full max-w-lg bg-gradient-to-b from-[#0d1527] to-[#080d18] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-xl relative flex flex-col">
        {/* Glow ambient header */}
        <div className="absolute top-0 inset-x-0 h-36 bg-gradient-to-b from-emerald-500/15 via-emerald-600/5 to-transparent pointer-events-none" />

        {/* Top Header */}
        <header className="px-5 pt-5 pb-4 border-b border-slate-800/60 relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold text-white font-heading">
                  Bazaar Vision Scanner
                </h1>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Phase 2 AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Patient: {profile?.fullName || "Alex Rivera"} ({profile?.diabetesType ? profile.diabetesType.replace("_", " ") : "Type 2"})
              </p>
            </div>
          </div>

          <Link
            href="/onboarding"
            className="text-[11px] font-medium text-emerald-400 hover:underline px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
          >
            Profile
          </Link>
        </header>

        {/* Top Mode Switcher Tabs */}
        <div className="p-2 bg-slate-950/80 border-b border-slate-800/80 flex space-x-1.5 relative z-10">
          <button
            type="button"
            className="flex-1 py-2 rounded-xl text-center text-xs font-bold bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 flex items-center justify-center space-x-1.5"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Bazaar Groceries</span>
          </button>
          <Link
            href="/menusafe"
            className="flex-1 py-2 rounded-xl text-center text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all flex items-center justify-center space-x-1.5"
          >
            <Utensils className="w-3.5 h-3.5 text-amber-400" />
            <span>Restaurant MenuSafe</span>
          </Link>
        </div>

        {/* Main Content */}
        <div className="p-5 space-y-4 relative z-10 overflow-y-auto max-h-[80vh]">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Viewfinder & Image Preview Box */}
          <div className="relative rounded-2xl border border-slate-800 bg-slate-950/70 overflow-hidden min-h-[180px] flex items-center justify-center">
            {imagePreview ? (
              <div className="relative w-full h-48 bg-slate-900 flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Grocery Scan Preview"
                  className="w-full h-full object-cover"
                />

                {/* Laser scan animation when processing */}
                {isScanning && (
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-[bounce_1.5s_infinite]" />
                )}

                {isScanning && (
                  <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="px-3.5 py-2 rounded-xl bg-slate-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-medium flex items-center space-x-2 shadow-xl">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>Gemini 1.5 Multimodal Extraction...</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-slate-200">
                    Snap or Upload Grocery Photo
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Capture raw bazaar stall items, grocery carts, or kitchen produce.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            capture="environment"
            className="hidden"
          />

          {/* Trigger Actions */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanning}
              className="py-2.5 px-3 rounded-xl bg-emerald-500 text-slate-950 text-xs font-semibold hover:bg-emerald-400 transition-all flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera / Upload</span>
            </button>

            <button
              type="button"
              onClick={handleLoadPreset}
              disabled={isScanning}
              className="py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-200 text-xs font-medium hover:bg-slate-800 transition-all flex items-center justify-center space-x-1.5 active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Load TC-P2-01 Preset</span>
            </button>
          </div>

          {/* Scan Results Display */}
          {scanResult && (
            <div className="space-y-4 pt-2 animate-in fade-in duration-300">
              {/* Traffic-Light Summary Bar */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 flex items-center space-x-1.5">
                    <Eye className="w-4 h-4 text-emerald-400" />
                    <span>Detected Produce ({scanResult.scanned_items.length} Items)</span>
                  </span>
                  <span className="text-[11px] text-emerald-400 font-mono">
                    TC-P2-02 Verified
                  </span>
                </div>

                {/* Filter Pills */}
                <div className="grid grid-cols-4 gap-1.5 text-[11px] font-medium">
                  <button
                    onClick={() => setFilterCategory("all")}
                    className={`py-1.5 rounded-lg border transition-all ${
                      filterCategory === "all"
                        ? "bg-slate-700 text-white border-slate-600"
                        : "bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    All ({scanResult.scanned_items.length})
                  </button>

                  <button
                    onClick={() => setFilterCategory("green")}
                    className={`py-1.5 rounded-lg border transition-all flex items-center justify-center space-x-1 ${
                      filterCategory === "green"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm"
                        : "bg-slate-950/60 text-emerald-400 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Safe ({counts.green})</span>
                  </button>

                  <button
                    onClick={() => setFilterCategory("yellow")}
                    className={`py-1.5 rounded-lg border transition-all flex items-center justify-center space-x-1 ${
                      filterCategory === "yellow"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm"
                        : "bg-slate-950/60 text-amber-400 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Caution ({counts.yellow})</span>
                  </button>

                  <button
                    onClick={() => setFilterCategory("red")}
                    className={`py-1.5 rounded-lg border transition-all flex items-center justify-center space-x-1 ${
                      filterCategory === "red"
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm"
                        : "bg-slate-950/60 text-rose-400 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span>Risky ({counts.red})</span>
                  </button>
                </div>
              </div>

              {/* Individual Item Cards */}
              <div className="space-y-2.5">
                {filteredItems.map((item: ScannedItem, index: number) => {
                  const isGreen = item.risk_category === "green";
                  const isRed = item.risk_category === "red";

                  return (
                    <div
                      key={index}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isGreen
                          ? "bg-emerald-950/15 border-emerald-500/30"
                          : isRed
                          ? "bg-rose-950/15 border-rose-500/30"
                          : "bg-amber-950/15 border-amber-500/30"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-100">
                              {item.item_name}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                isGreen
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                  : isRed
                                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                                  : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              }`}
                            >
                              {isGreen ? "Safe / Low GI" : isRed ? "High Spike Risk" : "Moderate / Caution"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {item.quantity_estimate}
                          </p>
                        </div>

                        {/* GI / GL Badges */}
                        <div className="flex items-center space-x-1.5 shrink-0">
                          <div className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-center">
                            <div className="text-[9px] text-slate-400">GI</div>
                            <div className={`text-xs font-bold ${isRed ? "text-rose-400" : isGreen ? "text-emerald-400" : "text-amber-400"}`}>
                              {item.glycemic_index}
                            </div>
                          </div>
                          <div className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-center">
                            <div className="text-[9px] text-slate-400">GL</div>
                            <div className={`text-xs font-bold ${isRed ? "text-rose-400" : isGreen ? "text-emerald-400" : "text-amber-400"}`}>
                              {item.glycemic_load}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Macros row */}
                      <div className="flex items-center space-x-3 text-[11px] text-slate-300 mt-2 pt-2 border-t border-slate-800/60">
                        <span>Net Carbs: <strong>{item.net_carbs_g}g</strong></span>
                        <span>•</span>
                        <span>Dietary Fiber: <strong>{item.fiber_g}g</strong></span>
                      </div>

                      {/* Clinical Rationale & Pairing Advice */}
                      <div className="mt-2.5 space-y-1.5 text-[11px]">
                        <p className="text-slate-300 leading-relaxed">
                          <strong className="text-slate-200">Clinical Impact:</strong> {item.clinical_rationale}
                        </p>
                        <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300">
                          <strong className="text-emerald-400">Pairing Advice:</strong> {item.pairing_advice}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Basket Overview */}
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5 text-xs text-slate-300">
                <div className="font-semibold text-slate-200 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Overall Basket Clinical Assessment</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {scanResult.overall_basket_assessment}
                </p>

                {scanResult.missing_vital_buffers.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-800 text-[11px]">
                    <span className="text-amber-400 font-medium">Recommended Missing Buffers: </span>
                    <span className="text-slate-400">
                      {scanResult.missing_vital_buffers.join(", ")}
                    </span>
                  </div>
                )}
              </div>

              {/* Forward Action to Phase 3 */}
              <div className="pt-2">
                <Link
                  href={`/recipes?items=${encodeURIComponent(
                    scanResult.scanned_items.map((i) => i.item_name).join(",")
                  )}`}
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      sessionStorage.setItem(
                        "glucovision_scanned_items",
                        JSON.stringify(scanResult.scanned_items.map((i) => i.item_name))
                      );
                    }
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-xs font-bold hover:brightness-110 shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all active:scale-95"
                >
                  <ChefHat className="w-4 h-4" />
                  <span>Generate Low-GI Sequenced Recipe (Phase 3)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="p-3.5 border-t border-slate-800/60 bg-slate-950/70 flex items-center justify-between text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-300">
            System Dashboard
          </Link>
          <span className="text-emerald-400 font-medium">Phase 2 Operational</span>
        </footer>
      </div>
    </main>
  );
}
