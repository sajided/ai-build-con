'use client';

import React, { useState } from 'react';
import { BazaarCartItem } from '@/lib/validations/deficits';
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Copy,
  Check,
  Share2,
} from 'lucide-react';
import { toBanglaDigits } from '@/lib/assistant/bangla';
import { stapleNameBn, stapleNutrientBn, staplePriceBn, stapleUnitBn } from '@/components/deficits/BazaarStapleCard';

interface BazaarCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: BazaarCartItem[];
  totalItemCount: number;
  estimatedTotalCost: number;
  onUpdateQuantity: (itemId: string, qty: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  getExportText: () => string;
}

export function BazaarCartDrawer({
  isOpen,
  onClose,
  cart,
  totalItemCount,
  estimatedTotalCost,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  getExportText,
}: BazaarCartDrawerProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      const text = getExportText();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy to clipboard:', e);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="bazaar-cart-drawer"
      aria-label="বাজারের তালিকা"
      lang="bn"
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/30"
    >
      {/* Tap backdrop to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Bottom sheet */}
      <div className="relative mx-auto flex max-h-[85dvh] w-full max-w-md flex-col rounded-t-[32px] bg-white shadow-float animate-in slide-in-from-bottom">
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-line" aria-hidden="true" />
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="icon-badge bg-pastel-lime text-pastel-lime-ink">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-ink">বাজারের তালিকা</h3>
              <p className="text-base text-ink-muted">
                মোট {toBanglaDigits(totalItemCount)}টি জিনিস
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-canvas text-ink-soft active:bg-line"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 space-y-2 overflow-y-auto px-5 pb-4 pt-1">
          {cart.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingBag className="mx-auto mb-3 h-12 w-12 text-ink-muted" />
              <p className="text-lg font-bold text-ink">তালিকা খালি</p>
              <p className="mx-auto mt-1 max-w-xs text-base text-ink-muted">
                নিচের খাবারগুলো থেকে যোগ করুন।
              </p>
            </div>
          ) : (
            cart.map((cartItem) => (
              <div
                key={cartItem.item.id}
                data-testid={`cart-row-${cartItem.item.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-canvas p-3"
              >
                <div className="min-w-[150px] flex-1 pr-2">
                  <div className="text-lg font-bold text-ink">
                    {stapleNameBn(cartItem.item)}
                  </div>
                  <div className="text-base font-semibold text-ink-soft">
                    {staplePriceBn(cartItem.item)}
                  </div>
                  <div className="mt-0.5 text-sm text-ink-muted">
                    {stapleNutrientBn(cartItem.item)}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-full bg-white shadow-sm">
                    <button
                      type="button"
                      aria-label="একটি কমান"
                      onClick={() =>
                        onUpdateQuantity(cartItem.item.id, cartItem.quantity - 1)
                      }
                      className="flex h-12 w-12 items-center justify-center rounded-full text-ink-soft active:bg-canvas"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <span
                      className="w-8 text-center text-lg font-bold text-ink"
                      aria-label={`${toBanglaDigits(cartItem.quantity)} ${stapleUnitBn(cartItem.item)}`}
                    >
                      {toBanglaDigits(cartItem.quantity)}
                    </span>
                    <button
                      type="button"
                      aria-label="একটি বাড়ান"
                      onClick={() =>
                        onUpdateQuantity(cartItem.item.id, cartItem.quantity + 1)
                      }
                      className="flex h-12 w-12 items-center justify-center rounded-full text-ink-soft active:bg-canvas"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    aria-label="তালিকা থেকে সরান"
                    onClick={() => onRemoveItem(cartItem.item.id)}
                    className="flex h-12 w-12 items-center justify-center rounded-full text-ink-muted active:bg-risk-danger active:text-risk-dangerInk"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Subtotal & Export */}
        {cart.length > 0 && (
          <div className="space-y-3 border-t border-line px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between">
              <span className="text-base text-ink-muted">মোট খরচ (আনুমানিক)</span>
              <span className="text-xl font-bold text-ink">
                ৳{toBanglaDigits(Math.round(estimatedTotalCost * 120))}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="btn-primary h-14"
              >
                {copied ? (
                  <>
                    <Check className="h-5 w-5" />
                    <span>কপি হয়েছে</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-5 w-5" />
                    <span>পাঠান</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="btn-secondary h-14"
              >
                <Copy className="h-5 w-5" />
                <span>কপি করুন</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClearCart}
              className="h-12 w-full text-center text-base font-semibold text-ink-muted active:text-risk-dangerInk"
            >
              তালিকা খালি করুন
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
