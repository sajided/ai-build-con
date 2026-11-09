"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  Utensils,
  ScanLine,
  Camera,
  ShieldCheck,
  AlertTriangle,
  CircleAlert,
  Copy,
  Check,
  RefreshCw,
  Maximize2,
  X,
  Search,
} from "lucide-react";
import type { MenuItem, MenuScanResponse } from "@/lib/validations/menusafe";
import PageHeader from "@/components/app/PageHeader";
import { toBanglaDigits } from "@/lib/assistant/bangla";

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
        throw new Error(data.message || data.error || "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      }

      setScanResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।");
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

  const renderDish = (item: MenuItem) => {
    const selected = selectedMealId === item.id;
    const copied = copiedScriptId === item.id;
    // Style each dish by its own audited risk, not by which list it sits in
    const tone = item.risk_category;
    const risky = tone !== "green";
    const chips = risky ? item.flagged_traps : item.safe_elements;
    const riskBg = tone === "red" ? "bg-risk-danger" : tone === "yellow" ? "bg-risk-caution" : "bg-risk-safe";
    const riskInk =
      tone === "red" ? "text-risk-dangerInk" : tone === "yellow" ? "text-risk-cautionInk" : "text-risk-safeInk";
    const RiskIcon = tone === "red" ? AlertTriangle : tone === "yellow" ? CircleAlert : ShieldCheck;
    const riskLabel = tone === "red" ? "এড়িয়ে চলুন" : tone === "yellow" ? "অল্প খান" : "ভালো";

    return (
      <div key={item.id} className="card space-y-3 p-4">
        <div className="flex items-center gap-3">
          <span className={`icon-badge ${riskBg} ${riskInk}`}>
            <RiskIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold leading-snug text-ink">{item.dish_name}</p>
            <p className={`text-base font-bold ${riskInk}`}>{riskLabel}</p>
          </div>
        </div>

        {chips && chips.length > 0 && (
          <div className="space-y-1.5">
            <p className="section-title text-base">{risky ? "লুকানো চিনি ও শর্করা" : "কেন এটা ভালো"}</p>
            <div className="flex flex-wrap gap-1.5">
              {chips.map((chip, idx) => (
                <span key={idx} className={`rounded-full px-3 py-1 text-sm font-bold ${riskBg} ${riskInk}`}>
                  {risky ? "⚠ " : "✓ "}
                  {chip}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="text-base leading-relaxed text-ink-soft">{item.clinical_rationale}</p>

        {/* Waiter script (TC-P4-02) */}
        <div className="space-y-2.5 rounded-2xl bg-pastel-blue/50 p-3.5 text-pastel-blue-ink">
          <p className="text-base font-bold">{risky ? "ওয়েটারকে বলুন" : "ওয়েটারকে বলতে পারেন"}</p>
          <p lang="en" className="text-base font-semibold italic leading-relaxed">&ldquo;{item.waiter_script}&rdquo;</p>

          {risky && item.suggested_side_swap && (
            <p className="text-base">
              <span className="font-bold">বদলে নিন: </span>
              {item.suggested_side_swap}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleCopyScript(item)}
              className="flex h-12 items-center justify-center gap-1.5 rounded-full bg-white text-base font-bold text-ink active:bg-canvas"
            >
              {copied ? (
                <>
                  <Check className="h-5 w-5 text-risk-safeInk" />
                  <span className="text-risk-safeInk">কপি হয়েছে</span>
                </>
              ) : (
                <>
                  <Copy className="h-5 w-5" />
                  কপি করুন
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowWaiterModalItem(item)}
              className="flex h-12 items-center justify-center gap-1.5 rounded-full bg-white text-base font-bold text-ink active:bg-canvas"
            >
              <Maximize2 className="h-5 w-5" />
              ওয়েটারকে দেখান
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleSelectCurrentMeal(item)}
          aria-pressed={selected}
          className={selected ? "btn-primary" : "btn-secondary"}
        >
          {selected ? (
            <>
              <Check className="h-5 w-5" /> এটা খাচ্ছি
            </>
          ) : (
            "আমি এটা খাব"
          )}
        </button>
      </div>
    );
  };

  return (
    <>
      <PageHeader title="স্ক্যান" subtitle="কেনা বা অর্ডারের আগে খাবার দেখে নিন" />

      <main lang="bn" className="px-4 py-4 space-y-5">
        {/* Live scan / Restaurant menu segmented control */}
        <div className="grid grid-cols-2 gap-1 rounded-full bg-white p-1 shadow-soft">
          <Link
            href="/scanner"
            className="flex h-12 items-center justify-center gap-2 rounded-full px-3 text-base font-semibold text-ink-soft active:bg-canvas"
          >
            <ScanLine className="h-5 w-5 shrink-0" />
            লাইভ স্ক্যান
          </Link>
          <span
            aria-current="page"
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-3 text-base font-bold text-white"
          >
            <Utensils className="h-5 w-5 shrink-0" />
            রেস্তোরাঁর মেনু
          </span>
        </div>

        {/* Photo upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileUpload}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning}
          className="tile flex w-full flex-col items-center justify-center gap-3 bg-pastel-peach p-5 text-center text-pastel-peach-ink active:brightness-95 disabled:opacity-50"
        >
          {imagePreview ? (
            <span className="block h-36 w-full overflow-hidden rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="মেনুর ছবি" className="h-full w-full object-cover" />
            </span>
          ) : (
            <span className="fab h-16 w-16 bg-pastel-peach-strong">
              <Camera className="h-7 w-7" />
            </span>
          )}
          <span>
            <span className="block text-lg font-extrabold">
              {imagePreview ? "অন্য ছবি তুলুন" : "মেনুর ছবি তুলুন"}
            </span>
            {!imagePreview && (
              <span className="mt-1 block text-base font-semibold opacity-80">
                কোন খাবারে লুকানো চিনি বা শর্করা আছে, আমরা দেখিয়ে দেব
              </span>
            )}
          </span>
        </button>

        {/* Text input */}
        <div className="space-y-2">
          <label htmlFor="menu-text" className="section-title text-base">
            অথবা খাবারের নাম লিখুন
          </label>
          <div className="flex gap-2">
            <input
              id="menu-text"
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && textInput.trim()) {
                  e.preventDefault();
                  executeScan({ text: textInput });
                }
              }}
              placeholder="যেমন: কাচ্চি বিরিয়ানি"
              className="input min-w-0 flex-1"
            />
            <button
              type="button"
              onClick={() => textInput.trim() && executeScan({ text: textInput })}
              disabled={isScanning || !textInput.trim()}
              aria-label="খাবারটি দেখুন"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink text-white active:bg-black disabled:opacity-40"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Example dishes (TC-P4-01 presets) */}
        <div className="space-y-2">
          <p className="section-title text-base">উদাহরণ দেখুন</p>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            <button
              type="button"
              onClick={() => handlePreset("Crispy Honey Glazed Chicken in Sweet Corn Gravy")}
              className="chip-toggle h-12 shrink-0 text-base"
            >
              <AlertTriangle className="h-5 w-5 text-pastel-coral-strong" />
              মধু-চিকেন
            </button>
            <button
              type="button"
              onClick={() => handlePreset("Tandoori Grilled Fish with Mint Yoghurt & Steamed Broccoli")}
              className="chip-toggle h-12 shrink-0 text-base"
            >
              <ShieldCheck className="h-5 w-5 text-pastel-lime-strong" />
              তন্দুরি মাছ
            </button>
          </div>
        </div>

        {isScanning && (
          <div className="card flex items-center justify-center gap-3 p-4 text-base font-bold text-ink">
            <RefreshCw className="h-5 w-5 animate-spin text-pastel-peach-strong" />
            <span>একটু অপেক্ষা করুন…</span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-2xl bg-risk-danger p-4 text-base font-semibold text-risk-dangerInk">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Results */}
        {scanResult && !isScanning && (
          <section className="space-y-5 pt-1">
            <div className="card space-y-2 p-4">
              <div className="flex items-center gap-3">
                <span className="icon-badge bg-pastel-blue text-pastel-blue-ink">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold text-ink">সারসংক্ষেপ</p>
                  <p className="truncate text-sm font-semibold text-ink-muted">{scanResult.restaurant_type}</p>
                </div>
              </div>
              <p className="text-base leading-relaxed text-ink-soft">{scanResult.overall_menu_verdict}</p>
            </div>

            {scanResult.risky_traps.length > 0 && (
              <div className="space-y-3">
                <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
                  <AlertTriangle className="h-5 w-5 text-pastel-coral-strong" />
                  এড়িয়ে চলুন ({toBanglaDigits(scanResult.risky_traps.length)})
                </h2>
                {scanResult.risky_traps.map((item) => renderDish(item))}
              </div>
            )}

            {scanResult.caution_items.length > 0 && (
              <div className="space-y-3">
                <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
                  <CircleAlert className="h-5 w-5 text-pastel-peach-strong" />
                  অল্প খান ({toBanglaDigits(scanResult.caution_items.length)})
                </h2>
                {scanResult.caution_items.map((item) => renderDish(item))}
              </div>
            )}

            {scanResult.safe_selections.length > 0 && (
              <div className="space-y-3">
                <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
                  <ShieldCheck className="h-5 w-5 text-pastel-lime-strong" />
                  ভালো ({toBanglaDigits(scanResult.safe_selections.length)})
                </h2>
                {scanResult.safe_selections.map((item) => renderDish(item))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* "Show to waiter" high-contrast bottom sheet for loud/dim restaurants */}
      {showWaiterModalItem && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 animate-in fade-in"
          onClick={() => setShowWaiterModalItem(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="ওয়েটারকে দেখান"
            lang="bn"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md space-y-5 rounded-t-[32px] bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-ink shadow-float animate-in slide-in-from-bottom"
          >
            <div className="mx-auto h-1.5 w-12 rounded-full bg-line" />
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-ink-muted">ওয়েটারকে এটা দেখান</span>
              <button
                type="button"
                onClick={() => setShowWaiterModalItem(null)}
                aria-label="বন্ধ করুন"
                className="flex h-12 w-12 items-center justify-center rounded-full text-ink active:bg-canvas"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-base font-bold text-ink-soft">{showWaiterModalItem.dish_name}</p>
              <p lang="en" className="text-2xl font-extrabold leading-snug text-ink">
                &ldquo;{showWaiterModalItem.waiter_script}&rdquo;
              </p>
            </div>

            <p lang="en" className="border-t border-line pt-3 text-base text-ink-muted">
              I&apos;m diabetic — thank you for helping me order safely!
            </p>

            <button type="button" onClick={() => setShowWaiterModalItem(null)} className="btn-primary">
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}
    </>
  );
}
