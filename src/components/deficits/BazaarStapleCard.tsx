'use client';

import React from 'react';
import { BazaarStapleItem } from '@/lib/validations/deficits';
import { Plus, ShoppingBag, Sparkles, ChefHat, Tag } from 'lucide-react';

interface BazaarStapleCardProps {
  item: BazaarStapleItem;
  onAddToCart: (item: BazaarStapleItem) => void;
}

export function BazaarStapleCard({ item, onAddToCart }: BazaarStapleCardProps) {
  return (
    <div
      data-testid={`staple-card-${item.id}`}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-4 shadow-xl backdrop-blur-md transition-all duration-200 hover:border-emerald-500/50 hover:shadow-emerald-500/5"
    >
      {/* Top row: Name, Local Name & Price */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div>
            <h4 className="font-bold text-slate-100 text-base group-hover:text-emerald-400 transition-colors">
              {item.name}
            </h4>
            {item.localNameBengali && (
              <span className="text-xs font-medium text-emerald-500/90">
                {item.localNameBengali}
              </span>
            )}
          </div>

          <div className="flex flex-col items-end">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-500/30">
              <Tag className="h-3 w-3" />
              {item.priceEstimate}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">Local Bazaar Rate</span>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5 my-2">
          <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-300">
            GI: {item.glycemicIndex}
          </span>
          <span className="rounded-md bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[11px] font-medium text-purple-300">
            {item.primaryNutrient}
          </span>
          {item.isHighMucilage && (
            <span className="rounded-md bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-[11px] font-semibold text-cyan-300">
              High Mucilage
            </span>
          )}
        </div>

        {/* Mechanism */}
        <p className="text-xs text-slate-400 leading-relaxed mb-2.5 flex items-start gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
          <span>{item.mechanism}</span>
        </p>

        {/* Culinary Tip */}
        <div className="rounded-xl bg-slate-850/60 border border-slate-800/80 p-2 text-xs text-slate-300 flex items-start gap-1.5 mb-4">
          <ChefHat className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
          <span className="leading-snug">{item.culinaryTip}</span>
        </div>
      </div>

      {/* Button: + Add to Bazaar List (TC-P6-02) */}
      <button
        type="button"
        data-testid={`add-to-cart-${item.id}`}
        onClick={() => onAddToCart(item)}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-900/30 transition-all hover:bg-emerald-500 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900"
      >
        <Plus className="h-4 w-4" />
        <span>+ Add to Bazaar List</span>
        <ShoppingBag className="h-4 w-4 ml-auto opacity-70" />
      </button>
    </div>
  );
}
