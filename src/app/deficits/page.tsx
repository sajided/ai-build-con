'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ShoppingBag,
  Sparkles,
  Sliders,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { useBazaarCart } from '@/lib/cart/bazaar-cart';
import { DeficienciesResponse } from '@/lib/validations/deficits';
import { NutrientProgressMeter } from '@/components/deficits/NutrientProgressMeter';
import { BazaarStapleCard } from '@/components/deficits/BazaarStapleCard';
import { BazaarCartDrawer } from '@/components/deficits/BazaarCartDrawer';

type BenchmarkPreset = 'deficit_14' | 'optimal_32' | 'custom';

export default function DeficitsPage() {
  const {
    cart,
    totalItemCount,
    estimatedTotalCost,
    toastMessage,
    isDrawerOpen,
    setIsDrawerOpen,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getExportText,
  } = useBazaarCart();

  const [activePreset, setActivePreset] = useState<BenchmarkPreset>('deficit_14');
  const [sliderFiber, setSliderFiber] = useState<number>(14);
  const [analysis, setAnalysis] = useState<DeficienciesResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch analysis based on current preset or slider value
  const loadAnalysis = useCallback(async (preset: BenchmarkPreset, customFiber?: number) => {
    setIsLoading(true);
    try {
      let url = '/api/analytics/deficiencies';
      if (preset === 'deficit_14') {
        url += '?preset=deficit_14';
      } else if (preset === 'optimal_32') {
        url += '?preset=optimal_32';
      } else if (preset === 'custom' && typeof customFiber === 'number') {
        // Send POST with custom fiber
        const res = await fetch('/api/analytics/deficiencies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fiberGrams: customFiber,
            magnesiumMg: customFiber >= 30 ? 410 : 220,
            proteinGrams: customFiber >= 30 ? 65 : 48,
            carbGrams: customFiber >= 30 ? 95 : 145,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setAnalysis(data);
        }
        setIsLoading(false);
        return;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setAnalysis(data);
      }
    } catch (e) {
      console.error('Failed to load nutritional deficits analysis:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadAnalysis('deficit_14');
  }, [loadAnalysis]);

  const handlePresetSelect = (preset: BenchmarkPreset) => {
    setActivePreset(preset);
    if (preset === 'deficit_14') {
      setSliderFiber(14);
      loadAnalysis('deficit_14');
    } else if (preset === 'optimal_32') {
      setSliderFiber(32);
      loadAnalysis('optimal_32');
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSliderFiber(val);
    setActivePreset('custom');
    loadAnalysis('custom', val);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28">
      {/* Toast Notification (TC-P6-02 verification) */}
      {toastMessage && (
        <div
          role="status"
          data-testid="bazaar-toast"
          className="fixed top-4 left-1/2 z-50 -translate-x-1/2 w-11/12 max-w-md animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/40 bg-slate-900/95 px-4 py-3.5 shadow-2xl backdrop-blur-xl">
            <div className="rounded-full bg-emerald-500/20 p-1.5 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <p className="flex-1 text-sm font-semibold text-slate-100">
              {toastMessage}
            </p>
          </div>
        </div>
      )}

      {/* Mobile Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3.5">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-slate-900 hover:text-slate-100"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-xs font-medium">Dashboard</span>
          </Link>

          <div className="text-center">
            <h1 className="text-base font-bold text-slate-100">Nutritional Deficits</h1>
            <p className="text-[10px] text-slate-400">7-Day Gap Sourcing Engine</p>
          </div>

          {/* Cart Icon with Counter Badge */}
          <button
            type="button"
            data-testid="open-cart-button"
            onClick={() => setIsDrawerOpen(true)}
            className="relative flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition-all hover:bg-slate-850 hover:border-emerald-500/40"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>List</span>
            {totalItemCount > 0 && (
              <span
                data-testid="cart-badge-count"
                className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-bold text-slate-950"
              >
                {totalItemCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-3xl px-4 pt-5 space-y-6">
        {/* Benchmark Scenario Selector (TC-P6-01 verification buttons) */}
        <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-950 p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Sliders className="h-4 w-4 text-emerald-400" />
              <span>Clinical Test Benchmark Scenarios</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">TC-P6-01 Matrix</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {/* Benchmark A: 14g Deficit */}
            <button
              type="button"
              data-testid="preset-deficit-14"
              onClick={() => handlePresetSelect('deficit_14')}
              className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                activePreset === 'deficit_14'
                  ? 'border-rose-500/60 bg-rose-500/10 shadow-lg shadow-rose-950/30'
                  : 'border-slate-800 bg-slate-900/60 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs font-bold text-slate-200">Benchmark A</span>
                <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                  -16g Deficit
                </span>
              </div>
              <span className="text-xs text-slate-400">
                Logged Fiber: <strong className="text-rose-400 font-mono">14 g/day</strong>
              </span>
              <span className="text-[10px] text-slate-500 mt-1">
                Triggers high-mucilage staples (Okra, Flax, Isabgol)
              </span>
            </button>

            {/* Benchmark B: 32g Optimal */}
            <button
              type="button"
              data-testid="preset-optimal-32"
              onClick={() => handlePresetSelect('optimal_32')}
              className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                activePreset === 'optimal_32'
                  ? 'border-emerald-500/60 bg-emerald-500/10 shadow-lg shadow-emerald-950/30'
                  : 'border-slate-800 bg-slate-900/60 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs font-bold text-slate-200">Benchmark B</span>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  +2g Optimal
                </span>
              </div>
              <span className="text-xs text-slate-400">
                Logged Fiber: <strong className="text-emerald-400 font-mono">32 g/day</strong>
              </span>
              <span className="text-[10px] text-slate-500 mt-1">
                Displays &quot;Fiber Shield Adequate&quot; badge
              </span>
            </button>
          </div>

          {/* Custom Interactive Slider */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-medium">Interactive Daily Fiber Intake:</span>
              <span className="font-mono text-sm font-bold text-emerald-400">
                {sliderFiber} g/day{' '}
                <span className="text-slate-500 text-xs font-normal">
                  (Target: 30g)
                </span>
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="45"
              step="1"
              value={sliderFiber}
              onChange={handleSliderChange}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>5g (Critical Deficit)</span>
              <span className="font-semibold text-emerald-500">30g (Target)</span>
              <span>45g (High Barrier)</span>
            </div>
          </div>
        </section>

        {/* Nutritional Deficit Meters */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              7-Day Metabolic Progress Meters
            </h2>
            {isLoading && (
              <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" />
            )}
          </div>

          {analysis ? (
            <NutrientProgressMeter metrics={analysis.metrics} />
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-500">
              Loading metabolic telemetry...
            </div>
          )}
        </section>

        {/* Clinical Summary Insight */}
        {analysis && (
          <section
            data-testid="deficits-summary-card"
            className="rounded-2xl border border-slate-800 bg-gradient-to-r from-emerald-950/20 via-slate-900/60 to-purple-950/20 p-4 shadow-lg"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20 mt-0.5">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 mb-1">
                  Clinical Synthesis & Metabolic Pivot
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {analysis.summaryStatement}
                </p>
                <div className="mt-2.5 flex items-center gap-3 text-xs">
                  <Link
                    href="/telemetry"
                    className="inline-flex items-center gap-1 font-semibold text-emerald-400 hover:underline"
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>View Glucose Trajectory</span>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Bridge the Gap Bazaar Recommendation Cards */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Bridge the Gap: Local Bazaar Recommendations
              </h2>
              <p className="text-xs text-slate-500">
                Clinically matched low-GI South Asian staples with verified market pricing
              </p>
            </div>
          </div>

          {analysis?.recommendations && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {analysis.recommendations.map((item) => (
                <BazaarStapleCard
                  key={item.id}
                  item={item}
                  onAddToCart={addToCart}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Slide-out Bazaar Shopping List Drawer */}
      <BazaarCartDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        cart={cart}
        totalItemCount={totalItemCount}
        estimatedTotalCost={estimatedTotalCost}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
        getExportText={getExportText}
      />
    </div>
  );
}
