"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  Camera,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  ChefHat,
  Utensils,
  ShoppingBasket,
  CircleCheck,
  CircleAlert,
} from "lucide-react";
import type { BazaarScanResponse, ScannedItem } from "@/lib/validations/scanner";
import PageHeader from "@/components/app/PageHeader";

export default function ScannerPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<BazaarScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<"all" | "green" | "yellow" | "red">("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    // Representative placeholder photo of fresh vegetables & pulses (TC-P2-01 preset)
    const presetSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23CFE0FA"/><text x="50%25" y="45%25" dominant-baseline="middle" text-anchor="middle" fill="%231F3D72" font-family="sans-serif" font-size="22" font-weight="bold">Sample Bazaar Basket</text><text x="50%25" y="58%25" dominant-baseline="middle" text-anchor="middle" fill="%234A4F57" font-family="sans-serif" font-size="14">[Potatoes, Bitter Gourd, Lentils, White Rice, Chilies]</text></svg>`;
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

  const filters = [
    { key: "all" as const, label: "All", count: scanResult?.scanned_items.length || 0, dot: "" },
    { key: "green" as const, label: "Safe", count: counts.green, dot: "bg-pastel-lime-strong" },
    { key: "yellow" as const, label: "Caution", count: counts.yellow, dot: "bg-pastel-peach-strong" },
    { key: "red" as const, label: "Risky", count: counts.red, dot: "bg-pastel-coral-strong" },
  ];

  return (
    <>
      <PageHeader title="Scan" subtitle="Check foods before you buy or order" />

      <main className="px-4 py-4 space-y-5">
        {/* Groceries / Menu segmented control */}
        <div className="grid grid-cols-2 gap-1 rounded-full bg-white p-1 shadow-soft">
          <span
            aria-current="page"
            className="flex h-11 items-center justify-center gap-2 rounded-full bg-ink text-sm font-bold text-white"
          >
            <ShoppingBasket className="h-4 w-4" />
            Groceries
          </span>
          <Link
            href="/menusafe"
            className="flex h-11 items-center justify-center gap-2 rounded-full text-sm font-semibold text-ink-soft active:bg-canvas"
          >
            <Utensils className="h-4 w-4" />
            Restaurant menu
          </Link>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-2xl bg-risk-danger p-4 text-sm font-semibold text-risk-dangerInk">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          capture="environment"
          className="hidden"
        />

        {/* Viewfinder & Image Preview */}
        {imagePreview ? (
          <div className="relative h-56 overflow-hidden rounded-[28px] bg-pastel-blue shadow-soft">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="Grocery photo" className="h-full w-full object-cover" />

            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[2px]">
                <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-ink shadow-float">
                  <RefreshCw className="h-4 w-4 animate-spin text-pastel-blue-strong" />
                  <span>Identifying foods…</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            className="tile flex h-60 w-full flex-col items-center justify-center gap-4 bg-pastel-blue text-center text-pastel-blue-ink active:brightness-95 disabled:opacity-50"
          >
            <span className="fab h-16 w-16 bg-pastel-blue-strong">
              <Camera className="h-7 w-7" />
            </span>
            <span>
              <span className="block text-lg font-extrabold">Take a photo of your groceries</span>
              <span className="mt-1 block text-sm font-semibold opacity-80">
                Market stalls, shopping carts or produce at home
              </span>
            </span>
          </button>
        )}

        {/* Trigger Actions */}
        <div className="space-y-2.5">
          {imagePreview && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanning}
              className="btn-secondary"
            >
              <Camera className="h-5 w-5" />
              Take another photo
            </button>
          )}

          <button type="button" onClick={handleLoadPreset} disabled={isScanning} className="btn-secondary">
            <Sparkles className="h-5 w-5 text-pastel-peach-strong" />
            Try a sample basket
          </button>
        </div>

        {/* Scan Results */}
        {scanResult && (
          <section className="space-y-4 pt-1">
            <div className="space-y-3">
              <h2 className="text-lg font-extrabold text-ink">
                Found {scanResult.scanned_items.length} item{scanResult.scanned_items.length === 1 ? "" : "s"}
              </h2>

              {/* Filter chips */}
              <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
                {filters.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilterCategory(f.key)}
                    aria-pressed={filterCategory === f.key}
                    className="chip-toggle shrink-0"
                  >
                    {f.dot && <span className={`h-2.5 w-2.5 rounded-full ${f.dot}`} />}
                    {f.label} ({f.count})
                  </button>
                ))}
              </div>
            </div>

            {/* Item Cards */}
            <div className="space-y-3">
              {filteredItems.map((item: ScannedItem, index: number) => {
                const isGreen = item.risk_category === "green";
                const isRed = item.risk_category === "red";
                const riskBg = isRed ? "bg-risk-danger" : isGreen ? "bg-risk-safe" : "bg-risk-caution";
                const riskInk = isRed ? "text-risk-dangerInk" : isGreen ? "text-risk-safeInk" : "text-risk-cautionInk";
                const RiskIcon = isRed ? AlertTriangle : isGreen ? CircleCheck : CircleAlert;

                return (
                  <div key={index} className="card p-4">
                    <div className="flex items-center gap-3">
                      <span className={`icon-badge ${riskBg} ${riskInk}`}>
                        <RiskIcon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-bold text-ink">{item.item_name}</p>
                        <p className="truncate text-sm text-ink-muted">{item.quantity_estimate}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${riskBg} ${riskInk}`}>
                        {isGreen ? "Safe · Low GI" : isRed ? "High spike risk" : "Eat with caution"}
                      </span>
                    </div>

                    {/* GI / GL / macros */}
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                      <span className="rounded-full bg-pastel-blue px-3 py-1 text-pastel-blue-ink">GI {item.glycemic_index}</span>
                      <span className="rounded-full bg-pastel-lilac px-3 py-1 text-pastel-lilac-ink">GL {item.glycemic_load}</span>
                      <span className="rounded-full bg-canvas px-3 py-1 text-ink-soft">Net carbs {item.net_carbs_g}g</span>
                      <span className="rounded-full bg-canvas px-3 py-1 text-ink-soft">Fiber {item.fiber_g}g</span>
                    </div>

                    <p className="mt-3 text-sm leading-relaxed text-ink-soft">{item.clinical_rationale}</p>
                    <div className="mt-3 rounded-2xl bg-pastel-lime/60 p-3 text-sm text-pastel-lime-ink">
                      <strong>Pair it with: </strong>
                      {item.pairing_advice}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Basket Overview */}
            <div className="card space-y-2 p-4">
              <div className="flex items-center gap-3">
                <span className="icon-badge bg-pastel-blue text-pastel-blue-ink">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <p className="font-bold text-ink">Your basket overall</p>
              </div>
              <p className="text-sm leading-relaxed text-ink-soft">{scanResult.overall_basket_assessment}</p>

              {scanResult.missing_vital_buffers.length > 0 && (
                <p className="border-t border-line pt-2 text-sm text-ink-soft">
                  <span className="font-bold text-pastel-peach-ink">Consider adding: </span>
                  {scanResult.missing_vital_buffers.join(", ")}
                </p>
              )}
            </div>

            {/* Forward to recipes */}
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
              className="btn-primary"
            >
              <ChefHat className="h-5 w-5" />
              Make a recipe with these
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        )}
      </main>
    </>
  );
}
