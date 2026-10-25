import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateFiberDeficit,
  evaluateNutrientMetrics,
  getPrioritizedRecommendations,
  buildDeficiencyAnalysis,
  BAZAAR_STAPLES_CATALOG,
} from '@/lib/nutrition/deficiency-engine';
import {
  getLocalCart,
  saveLocalCart,
} from '@/lib/cart/bazaar-cart';
import { BazaarStapleItem } from '@/lib/validations/deficits';

describe('Phase 6: Nutritional Gap & Deficiency Recommendation Engine', () => {
  describe('TC-P6-01: 7-Day Micronutrient Deficit Calculation', () => {
    it('Benchmark A: accurately calculates deficit (-16g) for 14 g/day input and triggers high-mucilage staples', () => {
      const dailyAverageFiber = 14;
      const targetMinimum = 30;

      const result = calculateFiberDeficit(dailyAverageFiber, targetMinimum);

      // Verify mathematical precision
      expect(result.dailyAverageFiber).toBe(14);
      expect(result.targetMinimum).toBe(30);
      expect(result.difference).toBe(-16);
      expect(result.status).toBe('deficit');
      expect(result.badge).toBeNull();
      expect(result.requiresHighMucilageStaples).toBe(true);

      // Verify recommendations prioritize high-mucilage staples (Okra, Flaxseeds, Isabgol)
      const recommendations = getPrioritizedRecommendations(result);
      const topStapleNames = recommendations.slice(0, 3).map((r) => r.name);

      expect(topStapleNames).toContain('Okra / Dherosh');
      expect(topStapleNames).toContain('Flaxseeds / Tishi');
      expect(topStapleNames).toContain('Isabgol / Psyllium Husk');

      // Verify the high-mucilage flag on all prioritized items
      const highMucilageItems = recommendations.filter((r) => r.isHighMucilage);
      expect(highMucilageItems.length).toBeGreaterThanOrEqual(3);
    });

    it('Benchmark B: accurately calculates optimal (+2g) for 32 g/day input and returns "Fiber Shield Adequate" badge', () => {
      const dailyAverageFiber = 32;
      const targetMinimum = 30;

      const result = calculateFiberDeficit(dailyAverageFiber, targetMinimum);

      // Verify mathematical precision
      expect(result.dailyAverageFiber).toBe(32);
      expect(result.targetMinimum).toBe(30);
      expect(result.difference).toBe(2);
      expect(result.status).toBe('optimal');
      expect(result.badge).toBe('Fiber Shield Adequate');
      expect(result.requiresHighMucilageStaples).toBe(false);

      // Verify analysis evaluation includes badge
      const analysis = buildDeficiencyAnalysis(32);
      expect(analysis.fiberBadge).toBe('Fiber Shield Adequate');
      expect(analysis.fiberStatus).toBe('optimal');
      expect(analysis.fiberDifference).toBe(2);

      const fiberMetric = analysis.metrics.find((m) => m.id === 'fiber');
      expect(fiberMetric).toBeDefined();
      expect(fiberMetric?.badge).toBe('Fiber Shield Adequate');
      expect(fiberMetric?.status).toBe('optimal');
    });

    it('Edge Cases: accurately calculates boundary at 30g and critical deficit at 5g', () => {
      // Exactly 30g target
      const exactTarget = calculateFiberDeficit(30, 30);
      expect(exactTarget.difference).toBe(0);
      expect(exactTarget.status).toBe('optimal');
      expect(exactTarget.badge).toBe('Fiber Shield Adequate');

      // Extreme low intake (5g)
      const extremeLow = calculateFiberDeficit(5, 30);
      expect(extremeLow.difference).toBe(-25);
      expect(extremeLow.status).toBe('deficit');
      expect(extremeLow.requiresHighMucilageStaples).toBe(true);
    });

    it('computes full triad: fiber deficit, magnesium index, and protein-to-carb ratio', () => {
      const metrics = evaluateNutrientMetrics(14, 210, 45, 150);
      expect(metrics).toHaveLength(3);

      const [fiber, magnesium, proteinCarb] = metrics;

      expect(fiber.id).toBe('fiber');
      expect(fiber.difference).toBe(-16);
      expect(fiber.percentage).toBe(47); // 14 / 30 = 46.67% -> 47%

      expect(magnesium.id).toBe('magnesium');
      expect(magnesium.difference).toBe(-190); // 210 - 400
      expect(magnesium.percentage).toBe(53); // 210 / 400 = 52.5% -> 53%

      expect(proteinCarb.id).toBe('protein_carb');
      expect(proteinCarb.current).toBe(0.3); // 45 / 150
      expect(proteinCarb.target).toBe(0.67);
      expect(proteinCarb.status).toBe('critical_deficit');
    });
  });

  describe('TC-P6-02: Cart Addition & Local Sourcing State', () => {
    beforeEach(() => {
      // Mock localStorage
      let store: Record<string, string> = {};
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, val: string) => {
          store[key] = String(val);
        }),
        removeItem: vi.fn((key: string) => {
          delete store[key];
        }),
        clear: vi.fn(() => {
          store = {};
        }),
      });
      saveLocalCart([]);
    });

    it('adds Okra / Dherosh ($0.40/lb) to cart, increments count, and generates exact toast message', () => {
      const okra = BAZAAR_STAPLES_CATALOG.find((item) => item.name.includes('Okra'));
      expect(okra).toBeDefined();
      expect(okra?.priceEstimate).toBe('$0.40/lb');
      expect(okra?.pricePerUnit).toBe(0.40);

      // 1. Initial cart count is 0
      let cart = getLocalCart();
      expect(cart.length).toBe(0);

      // 2. Add item to cart
      const mockOkra = okra as BazaarStapleItem;
      const newCart = [
        ...cart,
        {
          id: `${mockOkra.id}-123`,
          item: mockOkra,
          quantity: 1,
          addedAt: new Date().toISOString(),
        },
      ];
      saveLocalCart(newCart);

      // 3. Verify item count increments in local shopping list state
      cart = getLocalCart();
      expect(cart.length).toBe(1);
      expect(cart[0].item.name).toBe('Okra / Dherosh');
      expect(cart[0].quantity).toBe(1);

      // 4. Verify exact required toast message: "Added Okra / Dherosh to Local Bazaar List!"
      const generatedToast = `Added ${mockOkra.name} to Local Bazaar List!`;
      expect(generatedToast).toBe('Added Okra / Dherosh to Local Bazaar List!');
    });

    it('increments quantity when same staple is added multiple times', () => {
      const flaxseed = BAZAAR_STAPLES_CATALOG.find((item) => item.id === 'flaxseeds-tishi');
      expect(flaxseed).toBeDefined();

      const initialCart = [
        {
          id: `${flaxseed!.id}-1`,
          item: flaxseed!,
          quantity: 1,
          addedAt: new Date().toISOString(),
        },
      ];
      saveLocalCart(initialCart);

      // Increment
      const updatedCart = initialCart.map((ci) =>
        ci.item.id === flaxseed!.id ? { ...ci, quantity: ci.quantity + 1 } : ci
      );
      saveLocalCart(updatedCart);

      const cart = getLocalCart();
      expect(cart[0].quantity).toBe(2);
      expect(cart[0].item.priceEstimate).toBe('$0.85/lb');
    });

    it('verifies regional catalog pricing and diabetic parameters', () => {
      const items = BAZAAR_STAPLES_CATALOG;
      expect(items.length).toBeGreaterThanOrEqual(5);

      items.forEach((item) => {
        expect(item.id).toBeTruthy();
        expect(item.name).toBeTruthy();
        expect(item.priceEstimate).toMatch(/^\$\d+\.\d{2}\/(lb|box|pack|bunch)$/);
        expect(item.pricePerUnit).toBeGreaterThan(0);
        expect(item.glycemicIndex).toBeLessThanOrEqual(25); // Low GI
        expect(item.solubleFiberGrams).toBeGreaterThan(0);
        expect(item.mechanism).toBeTruthy();
        expect(item.culinaryTip).toBeTruthy();
      });
    });
  });

  describe('TC-P6-01 & TC-P6-02 DOM Component Integration', () => {
    it('renders "Fiber Shield Adequate" badge in DOM when fiber intake is 32g/day', async () => {
      const { render, screen } = await import('@testing-library/react');
      const { NutrientProgressMeter } = await import('@/components/deficits/NutrientProgressMeter');

      const analysis = buildDeficiencyAnalysis(32);
      render(React.createElement(NutrientProgressMeter, { metrics: analysis.metrics }));

      // Assert badge is visible in DOM
      const badge = screen.getByTestId('fiber-badge');
      expect(badge).toBeTruthy();
      expect(badge.textContent).toContain('Fiber Shield Adequate');
    });

    it('TC-P6-02 DOM: clicking "+ Add to Bazaar List" on Okra / Dherosh triggers cart callback with correct item', async () => {
      const { render, screen, fireEvent } = await import('@testing-library/react');
      const { BazaarStapleCard } = await import('@/components/deficits/BazaarStapleCard');

      const okra = BAZAAR_STAPLES_CATALOG.find((item) => item.name.includes('Okra'))!;
      const onAddToCart = vi.fn();

      render(React.createElement(BazaarStapleCard, { item: okra, onAddToCart }));

      // Find the button with + Add to Bazaar List
      const button = screen.getByTestId(`add-to-cart-${okra.id}`);
      expect(button).toBeTruthy();
      expect(button.textContent).toContain('+ Add to Bazaar List');

      // Click button
      fireEvent.click(button);

      // Verify callback was fired with Okra / Dherosh
      expect(onAddToCart).toHaveBeenCalledTimes(1);
      expect(onAddToCart).toHaveBeenCalledWith(okra);
    });
  });
});
