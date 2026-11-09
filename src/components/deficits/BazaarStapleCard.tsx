'use client';

import React from 'react';
import { BazaarStapleItem } from '@/lib/validations/deficits';
import { Plus, Sparkles, ChefHat, Leaf } from 'lucide-react';
import { toBanglaDigits } from '@/lib/assistant/bangla';

interface BazaarStapleCardProps {
  item: BazaarStapleItem;
  onAddToCart: (item: BazaarStapleItem) => void;
}

/** Plain-Bangla display copy per catalog id (engine data stays English) */
const STAPLE_COPY_BN: Record<string, { nutrient: string; mechanism: string; tip: string }> = {
  'okra-dherosh': {
    nutrient: 'পিচ্ছিল আঁশ',
    mechanism: 'ঢেঁড়শের পিচ্ছিল আঁশ পেটে জেলির মতো হয়ে যায়, তাই ভাতের সুগার ধীরে ধীরে রক্তে যায়।',
    tip: 'হলুদ দিয়ে হালকা ভাজুন বা ভাপে রান্না করুন। বেশি ভাজবেন না।',
  },
  'flaxseeds-tishi': {
    nutrient: 'ভালো তেল আর আঁশ',
    mechanism: 'তিসির আঁশ খাওয়ার পরে সুগার হঠাৎ বেড়ে যাওয়া কমায়।',
    tip: 'তাজা তিসি গুঁড়ো করে ১ টেবিল চামচ ডাল, দই বা সালাদের ওপর ছিটিয়ে খান।',
  },
  'isabgol-psyllium': {
    nutrient: 'পিচ্ছিল আঁশ',
    mechanism: 'ইসবগুল পেটে জেলির মতো হয়ে চিনি আটকে রাখে, তাই সুগার হঠাৎ বাড়ে না।',
    tip: 'দুপুর বা রাতের খাবারের ১৫ মিনিট আগে ১ চামচ পানিতে গুলে সঙ্গে সঙ্গে খেয়ে নিন।',
  },
  'bitter-gourd-korola': {
    nutrient: 'করলার তেতো উপাদান',
    mechanism: 'করলা শরীরকে রক্তের সুগার কাজে লাগাতে সাহায্য করে।',
    tip: 'পাতলা করে কেটে অল্প লবণ আর সরিষা দিয়ে ভেজে খাবারের শুরুতে খান।',
  },
  'spinach-palak': {
    nutrient: 'ম্যাগনেসিয়াম',
    mechanism: 'পালং শাকের ম্যাগনেসিয়াম ইনসুলিনকে ভালোভাবে কাজ করতে সাহায্য করে।',
    tip: 'রসুন আর অল্প তেলে হালকা রান্না করুন। খাবারের শুরুতে খান।',
  },
  'fenugreek-methi': {
    nutrient: 'মেথির আঁশ',
    mechanism: 'মেথি শরীরে দরকার মতো ইনসুলিন তৈরিতে সাহায্য করে।',
    tip: 'রাতে ১ চা চামচ মেথি পানিতে ভিজিয়ে রাখুন। সকালে খালি পেটে পানিটা খান আর দানা চিবিয়ে খান।',
  },
};

const UNIT_BN: Record<string, string> = {
  lb: 'আধা কেজি',
  bunch: 'আঁটি',
  box: 'বাক্স',
  pack: 'প্যাকেট',
};

/** Bangla display name: local name first, falls back to the catalog name */
export function stapleNameBn(item: BazaarStapleItem): string {
  return item.localNameBengali || item.name;
}

export function stapleNutrientBn(item: BazaarStapleItem): string {
  return STAPLE_COPY_BN[item.id]?.nutrient ?? item.primaryNutrient;
}

/** "৳৪৮ / আধা কেজি" — taka price per unit (same ×120 conversion as before) */
export function staplePriceBn(item: BazaarStapleItem, quantity = 1): string {
  const unit = UNIT_BN[item.unit] ?? item.unit;
  const taka = toBanglaDigits(Math.round(item.pricePerUnit * quantity * 120));
  return quantity === 1 ? `৳${taka} / ${unit}` : `৳${taka}`;
}

export function stapleUnitBn(item: BazaarStapleItem): string {
  return UNIT_BN[item.unit] ?? item.unit;
}

export function BazaarStapleCard({ item, onAddToCart }: BazaarStapleCardProps) {
  const copy = STAPLE_COPY_BN[item.id];
  const name = stapleNameBn(item);

  return (
    <div lang="bn" data-testid={`staple-card-${item.id}`} className="card p-4">
      {/* Header row: icon badge, name, price */}
      <div className="flex items-center gap-3">
        <div className="icon-badge bg-pastel-lime text-pastel-lime-ink">
          <Leaf className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-lg font-bold text-ink">{name}</h4>
          {item.localNameBengali && <p className="text-sm text-ink-muted">{item.name}</p>}
        </div>
        <div className="text-right">
          <p className="text-base font-bold text-ink">{staplePriceBn(item)}</p>
          <p className="text-sm text-ink-muted">বাজারের দাম (আনুমানিক)</p>
        </div>
      </div>

      {/* Badges */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-canvas px-3 py-1 text-base font-bold text-ink-soft">
          GI {toBanglaDigits(item.glycemicIndex)} · {item.glycemicIndex <= 55 ? 'সুগার ধীরে বাড়ায়' : 'সুগার দ্রুত বাড়ায়'}
        </span>
        <span className="rounded-full bg-pastel-lilac px-3 py-1 text-base font-bold text-pastel-lilac-ink">
          {stapleNutrientBn(item)}
        </span>
        {item.isHighMucilage && (
          <span className="rounded-full bg-pastel-blue px-3 py-1 text-base font-bold text-pastel-blue-ink">
            আঁশ বেশি
          </span>
        )}
      </div>

      {/* How it helps */}
      <p className="mt-3 flex items-start gap-2 text-base leading-relaxed text-ink-soft">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-pastel-peach-strong" />
        <span>{copy?.mechanism ?? item.mechanism}</span>
      </p>

      {/* Cooking tip */}
      <div className="mt-3 flex items-start gap-2 rounded-2xl bg-canvas p-3 text-base text-ink-soft">
        <ChefHat className="mt-0.5 h-5 w-5 shrink-0 text-pastel-lime-ink" />
        <span className="leading-snug">{copy?.tip ?? item.culinaryTip}</span>
      </div>

      {/* Button: add to bazaar list (TC-P6-02) — label text is asserted by tests */}
      <button
        type="button"
        data-testid={`add-to-cart-${item.id}`}
        onClick={() => onAddToCart(item)}
        aria-label={`${name} বাজারের তালিকায় যোগ করুন`}
        className="mt-4 flex h-14 w-full items-center justify-between rounded-full bg-pastel-lime pl-5 pr-1.5 text-lg font-bold text-pastel-lime-ink transition-colors active:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-pastel-lime-strong"
      >
        <span>+ বাজারের তালিকায় যোগ করুন</span>
        <span className="fab h-11 w-11 bg-pastel-lime-strong" aria-hidden="true">
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </span>
      </button>
    </div>
  );
}
