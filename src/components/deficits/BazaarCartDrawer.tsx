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
      className="fixed inset-0 z-50 flex justify-end overflow-hidden bg-slate-950/70 backdrop-blur-sm transition-opacity"
    >
      {/* Click outside backdrop to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative flex w-full max-w-md flex-col bg-slate-900 border-l border-slate-800 shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-lg">Local Bazaar List</h3>
              <p className="text-xs text-slate-400">
                {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} planned
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {cart.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingBag className="mx-auto h-12 w-12 text-slate-600 mb-3" />
              <p className="text-slate-300 font-medium">Your Bazaar List is empty</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                Add recommended high-mucilage vegetables to fill your 7-day fiber & micronutrient deficit.
              </p>
            </div>
          ) : (
            cart.map((cartItem) => (
              <div
                key={cartItem.item.id}
                data-testid={`cart-row-${cartItem.item.id}`}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3 shadow-sm"
              >
                <div className="flex-1 pr-3">
                  <div className="font-semibold text-sm text-slate-200">
                    {cartItem.item.name}
                  </div>
                  <div className="text-xs text-emerald-400 font-medium">
                    {cartItem.item.priceEstimate}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {cartItem.item.primaryNutrient}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-lg border border-slate-700 bg-slate-900">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() =>
                        onUpdateQuantity(cartItem.item.id, cartItem.quantity - 1)
                      }
                      className="p-1.5 text-slate-400 hover:text-white"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-7 text-center font-mono text-xs font-bold text-slate-100">
                      {cartItem.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() =>
                        onUpdateQuantity(cartItem.item.id, cartItem.quantity + 1)
                      }
                      className="p-1.5 text-slate-400 hover:text-white"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    aria-label="Remove item"
                    onClick={() => onRemoveItem(cartItem.item.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Subtotal & Export */}
        {cart.length > 0 && (
          <div className="border-t border-slate-800 bg-slate-950/80 p-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Estimated Sourcing Total:</span>
              <span className="font-mono text-base font-bold text-emerald-400">
                ~${estimatedTotalCost.toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-emerald-500 active:scale-[0.98]"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-200" />
                    <span>Copied List!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4" />
                    <span>WhatsApp / Share</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-850 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 active:scale-[0.98]"
              >
                <Copy className="h-4 w-4" />
                <span>Copy Text</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClearCart}
              className="w-full text-center text-xs text-slate-500 hover:text-rose-400 pt-1"
            >
              Clear Bazaar List
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
