"use client";

import { useState } from "react";
import { ArrowRight, CreditCard, Lock, X } from "lucide-react";

type MockCheckoutButtonProps = {
  label: string;
  productName: string;
  price: string;
};

export function MockCheckoutButton({
  label,
  productName,
  price
}: MockCheckoutButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="inline-flex items-center gap-2 bg-[var(--sf-primary)] px-5 py-3 text-sm font-bold text-[var(--sf-on-primary)] transition hover:brightness-95"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        {label}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-6">
          <div
            aria-labelledby="mock-checkout-title"
            aria-modal="true"
            className="w-full max-w-md bg-white text-slate-950 shadow-2xl"
            role="dialog"
          >
            <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Secure checkout
                </p>
                <h2
                  className="mt-1 text-xl font-black leading-tight"
                  id="mock-checkout-title"
                >
                  Checkout preview
                </h2>
              </div>
              <button
                aria-label="Close checkout"
                className="flex h-9 w-9 items-center justify-center border border-black/10 text-slate-500 transition hover:text-slate-950"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="flex items-start justify-between gap-4 bg-slate-50 p-4">
                <div>
                  <p className="text-sm font-black">{productName}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    One-time mock order
                  </p>
                </div>
                <span className="text-sm font-black">{price}</span>
              </div>

              <div className="space-y-3">
                <div className="border border-black/10 p-3 text-sm text-slate-500">
                  email@example.com
                </div>
                <div className="flex items-center gap-2 border border-black/10 p-3 text-sm text-slate-500">
                  <CreditCard className="h-4 w-4" aria-hidden />
                  4242 4242 4242 4242
                </div>
              </div>

              <button
                className="flex w-full items-center justify-center gap-2 bg-slate-950 px-4 py-3 text-sm font-black text-white"
                type="button"
              >
                <Lock className="h-4 w-4" aria-hidden />
                Mock checkout only
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
