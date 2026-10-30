'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ShoppingBag, Sparkles, CheckCircle2, RefreshCw, TrendingUp } from 'lucide-react';
import PageHeader from '@/components/app/PageHeader';
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
    <>
      {/* Toast Notification (TC-P6-02 verification) — sits just above the bottom nav */}
      {toastMessage && (
        <div
          role="status"
          data-testid="bazaar-toast"
          className="fixed inset-x-0 bottom-[calc(6.25rem+env(safe-area-inset-bottom))] z-50 mx-auto flex w-full max-w-md justify-center px-4"
        >
          <div className="flex items-center gap-2.5 rounded-full bg-ink py-3 pl-3 pr-5 shadow-float animate-in fade-in">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-pastel-lime" />
            <p className="text-sm font-bold text-white">{toastMessage}</p>
          </div>
        </div>
      )}

      <PageHeader
        title="Nutrition"
        subtitle="Last 7 days"
        actions={
          <button
            type="button"
            data-testid="open-cart-button"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Shopping list"
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink shadow-soft active:bg-canvas"
          >
            <ShoppingBag className="h-5 w-5" />
            {totalItemCount > 0 && (
              <span
                data-testid="cart-badge-count"
                className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-pastel-coral-strong px-1.5 text-xs font-bold text-white"
              >
                {totalItemCount}
              </span>
            )}
          </button>
        }
      />

      <main className="space-y-6 px-4 pb-5 pt-2">
        {/* Sample data selector (TC-P6-01 verification buttons) */}
        <section className="space-y-3">
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            <button
              type="button"
              data-testid="preset-deficit-14"
              onClick={() => handlePresetSelect('deficit_14')}
              aria-pressed={activePreset === 'deficit_14'}
              className="chip-toggle shrink-0"
            >
              Sample: low-fibre week
            </button>
            <button
              type="button"
              data-testid="preset-optimal-32"
              onClick={() => handlePresetSelect('optimal_32')}
              aria-pressed={activePreset === 'optimal_32'}
              className="chip-toggle shrink-0"
            >
              Sample: balanced week
            </button>
          </div>

          <div className="card p-4">
            <div className="flex items-baseline justify-between">
              <label htmlFor="fiber-slider" className="text-sm font-bold text-ink">
                Daily fibre
              </label>
              <span className="text-base font-extrabold text-ink">
                {sliderFiber} g <span className="text-sm font-semibold text-ink-muted">/ 30 g goal</span>
              </span>
            </div>
            <input
              id="fiber-slider"
              type="range"
              min="5"
              max="45"
              step="1"
              value={sliderFiber}
              onChange={handleSliderChange}
              className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-pastel-lime accent-ink"
            />
            <div className="mt-2 flex justify-between text-xs font-semibold text-ink-muted">
              <span>5 g</span>
              <span className="text-pastel-lime-ink">30 g goal</span>
              <span>45 g</span>
            </div>
          </div>
        </section>

        {/* Nutritional Deficit Meters */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Your intake vs goals</h2>
            {isLoading && <RefreshCw className="h-4 w-4 animate-spin text-ink-muted" />}
          </div>

          {analysis ? (
            <NutrientProgressMeter metrics={analysis.metrics} />
          ) : (
            <div className="card p-8 text-center text-sm text-ink-muted">
              Loading your nutrition…
            </div>
          )}
        </section>

        {/* Summary */}
        {analysis && (
          <section
            data-testid="deficits-summary-card"
            className="tile bg-pastel-peach p-5 text-pastel-peach-ink"
          >
            <div className="flex items-start gap-3">
              <div className="icon-badge bg-white/85 text-pastel-peach-ink">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="mb-1 text-base font-extrabold">What this means</h3>
                <p className="text-sm font-medium leading-relaxed">{analysis.summaryStatement}</p>
                <Link
                  href="/telemetry"
                  className="chip mt-3 h-11 px-4"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>See your glucose trend</span>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Recommendations */}
        <section className="space-y-3">
          <div>
            <h2 className="section-title">Foods to add</h2>
            <p className="text-sm text-ink-soft">Low-GI local staples that help close the gap</p>
          </div>

          {analysis?.recommendations && (
            <div className="grid grid-cols-1 gap-3">
              {analysis.recommendations.map((item) => (
                <BazaarStapleCard key={item.id} item={item} onAddToCart={addToCart} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Shopping list bottom sheet */}
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
    </>
  );
}
