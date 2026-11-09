'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ShoppingBag, Sparkles, CheckCircle2, RefreshCw, TrendingUp } from 'lucide-react';
import PageHeader from '@/components/app/PageHeader';
import { useBazaarCart } from '@/lib/cart/bazaar-cart';
import { DeficienciesResponse } from '@/lib/validations/deficits';
import { NutrientProgressMeter } from '@/components/deficits/NutrientProgressMeter';
import { BazaarStapleCard, stapleNameBn } from '@/components/deficits/BazaarStapleCard';
import { toBanglaDigits } from '@/lib/assistant/bangla';
import { BazaarCartDrawer } from '@/components/deficits/BazaarCartDrawer';

type BenchmarkPreset = 'deficit_14' | 'optimal_32' | 'custom';

/** Plain-Bangla summary built from the analysis numbers (engine text stays English) */
function summaryBn(analysis: DeficienciesResponse): string {
  if (analysis.fiberStatus === 'optimal') {
    return 'গত ৭ দিনে আপনি যথেষ্ট আঁশ খেয়েছেন। এভাবেই শাক-সবজি খেতে থাকুন।';
  }
  const gap = toBanglaDigits(Math.abs(analysis.fiberDifference));
  return `গত ৭ দিনে রোজ ${gap} গ্রাম আঁশ কম খেয়েছেন। ঢেঁড়শ, তিসি আর ইসবগুল খেলে খাওয়ার পরে সুগার কম বাড়বে।`;
}

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

  // The cart hook emits English toasts; show them in Bangla
  const toastBn = (() => {
    if (!toastMessage) return null;
    const added = toastMessage.match(/^Added (.+) to Local Bazaar List!$/);
    if (added) {
      const item = cart.find((ci) => ci.item.name === added[1])?.item
        ?? analysis?.recommendations.find((r) => r.name === added[1]);
      return `${item ? stapleNameBn(item) : added[1]} বাজারের তালিকায় যোগ হয়েছে`;
    }
    if (toastMessage.startsWith('Cleared')) return 'বাজারের তালিকা খালি করা হয়েছে';
    return toastMessage;
  })();

  return (
    <div lang="bn">
      {/* Toast Notification (TC-P6-02 verification) — sits just above the bottom nav */}
      {toastMessage && (
        <div
          role="status"
          data-testid="bazaar-toast"
          className="fixed inset-x-0 bottom-[calc(6.25rem+env(safe-area-inset-bottom))] z-50 mx-auto flex w-full max-w-md justify-center px-4"
        >
          <div className="flex items-center gap-2.5 rounded-full bg-ink py-3 pl-3 pr-5 shadow-float animate-in fade-in">
            <CheckCircle2 className="h-6 w-6 shrink-0 text-pastel-lime" />
            <p className="text-base font-bold text-white">{toastBn}</p>
          </div>
        </div>
      )}

      <PageHeader
        title="পুষ্টি"
        subtitle="গত ৭ দিন"
        actions={
          <button
            type="button"
            data-testid="open-cart-button"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="বাজারের তালিকা"
            className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white text-ink shadow-soft active:bg-canvas"
          >
            <ShoppingBag className="h-6 w-6" />
            {totalItemCount > 0 && (
              <span
                data-testid="cart-badge-count"
                className="absolute -right-1 -top-1 inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-pastel-coral-strong px-1.5 text-sm font-bold text-white"
              >
                {toBanglaDigits(totalItemCount)}
              </span>
            )}
          </button>
        }
      />

      <main lang="bn" className="space-y-6 px-4 pb-5 pt-2">
        {/* Sample data selector (TC-P6-01 verification buttons) */}
        <section className="space-y-3">
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            <button
              type="button"
              data-testid="preset-deficit-14"
              onClick={() => handlePresetSelect('deficit_14')}
              aria-pressed={activePreset === 'deficit_14'}
              className="chip-toggle h-12 shrink-0 text-base"
            >
              নমুনা: আঁশ কম খাওয়া সপ্তাহ
            </button>
            <button
              type="button"
              data-testid="preset-optimal-32"
              onClick={() => handlePresetSelect('optimal_32')}
              aria-pressed={activePreset === 'optimal_32'}
              className="chip-toggle h-12 shrink-0 text-base"
            >
              নমুনা: ঠিকঠাক খাওয়া সপ্তাহ
            </button>
          </div>

          <div className="card p-4">
            <div className="flex items-baseline justify-between">
              <label htmlFor="fiber-slider" className="text-lg font-bold text-ink">
                রোজ কত আঁশ খান
              </label>
              <span className="text-xl font-bold text-ink">
                {toBanglaDigits(sliderFiber)} গ্রাম <span className="text-base font-semibold text-ink-muted">/ লক্ষ্য ৩০</span>
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
              aria-valuetext={`${toBanglaDigits(sliderFiber)} গ্রাম`}
              className="mt-4 h-12 w-full cursor-pointer accent-ink"
            />
            <div className="mt-1 flex justify-between text-base font-semibold text-ink-muted">
              <span>৫ গ্রাম</span>
              <span className="text-pastel-lime-ink">লক্ষ্য ৩০ গ্রাম</span>
              <span>৪৫ গ্রাম</span>
            </div>
          </div>
        </section>

        {/* Nutritional Deficit Meters */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">আপনি কতটা খাচ্ছেন</h2>
            {isLoading && <RefreshCw className="h-5 w-5 animate-spin text-ink-muted" aria-label="একটু অপেক্ষা করুন…" />}
          </div>

          {analysis ? (
            <NutrientProgressMeter metrics={analysis.metrics} />
          ) : (
            <div className="card p-8 text-center text-base text-ink-muted">
              একটু অপেক্ষা করুন…
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
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="mb-1 text-lg font-bold">এর মানে কী</h3>
                <p className="text-base font-medium leading-relaxed">{summaryBn(analysis)}</p>
                <Link
                  href="/telemetry"
                  className="chip mt-3 h-12 px-4 text-base"
                >
                  <TrendingUp className="h-5 w-5" />
                  <span>সুগার কেমন যাচ্ছে দেখুন</span>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Recommendations */}
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-bold text-ink">এই খাবারগুলো খান</h2>
            <p className="text-base text-ink-soft">দেশি খাবার, সুগার ধীরে বাড়ায়, আঁশের ঘাটতি পূরণ করে</p>
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
    </div>
  );
}
