"use client";

import { useState } from "react";
import { ArrowRight, CreditCard, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";

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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className="bg-[var(--sf-primary)] text-[var(--sf-on-primary)] hover:bg-[var(--sf-primary)] hover:brightness-95"
          size="lg"
          type="button"
        >
          {label}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-md p-0 text-slate-950"
        showCloseButton={false}
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <DialogHeader className="gap-1 text-left">
            <DialogDescription className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Secure checkout
            </DialogDescription>
            <DialogTitle className="text-xl">
              Checkout preview
            </DialogTitle>
          </DialogHeader>
          <DialogClose asChild>
            <Button
              aria-label="Close checkout"
              className="shrink-0"
              size="icon-sm"
              type="button"
              variant="outline"
            >
              <X className="h-4 w-4" aria-hidden />
            </Button>
          </DialogClose>
        </div>

        <div className="space-y-5 p-5">
          <div className="flex items-start justify-between gap-4 rounded-md bg-muted/60 p-4">
            <div>
              <p className="text-sm font-black">{productName}</p>
              <p className="mt-1 text-sm text-slate-500">
                One-time mock order
              </p>
            </div>
            <span className="text-sm font-black">{price}</span>
          </div>

          <div className="space-y-3">
            <div className="rounded-md border p-3 text-sm text-slate-500">
              email@example.com
            </div>
            <div className="flex items-center gap-2 rounded-md border p-3 text-sm text-slate-500">
              <CreditCard className="h-4 w-4" aria-hidden />
              4242 4242 4242 4242
            </div>
          </div>

          <Button className="w-full" size="lg" type="button">
            <Lock className="h-4 w-4" aria-hidden />
            Mock checkout only
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
