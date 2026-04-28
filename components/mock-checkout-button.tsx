"use client";

import type { ComponentProps } from "react";
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

type MockCheckoutTriggerButtonProps = ComponentProps<typeof Button> & {
  label: string;
};

type MockCheckoutDialogContentProps = {
  productName: string;
  price: string;
};

export function MockCheckoutTriggerButton({
  label,
  ...props
}: MockCheckoutTriggerButtonProps) {
  return (
    <Button type="button" {...props}>
      {label}
      <ArrowRight className="h-4 w-4" aria-hidden />
    </Button>
  );
}

export function MockCheckoutDialogContent({
  productName,
  price
}: MockCheckoutDialogContentProps) {
  return (
    <DialogContent
      className="max-w-md p-0 text-foreground"
      showCloseButton={false}
    >
      <div className="flex items-center justify-between gap-4 border-b px-5 py-4">
        <DialogHeader className="gap-1 text-left">
          <DialogDescription className="text-xs font-black text-muted-foreground">
            Secure checkout
          </DialogDescription>
          <DialogTitle className="text-xl">Checkout preview</DialogTitle>
        </DialogHeader>
        <DialogClose asChild>
          <Button
            aria-label="Close checkout"
            className="shrink-0"
            size="icon"
            type="button"
            variant="outline"
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </DialogClose>
      </div>

      <div className="space-y-5 p-5">
        <div className="flex items-start justify-between gap-4 rounded-md bg-muted/60 p-4">
          <div className="min-w-0">
            <p className="break-words text-sm font-black [overflow-wrap:anywhere]">
              {productName}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              One-time mock order
            </p>
          </div>
          <span className="shrink-0 text-sm font-black">{price}</span>
        </div>

        <div className="space-y-3">
          <div className="rounded-md border p-3 text-sm text-muted-foreground">
            email@example.com
          </div>
          <div className="flex items-center gap-2 rounded-md border p-3 text-sm text-muted-foreground">
            <CreditCard className="h-4 w-4" aria-hidden />
            4242 4242 4242 4242
          </div>
        </div>

        <Button className="w-full whitespace-normal" size="lg" type="button">
          <Lock className="h-4 w-4" aria-hidden />
          Mock checkout only
        </Button>
      </div>
    </DialogContent>
  );
}

export function MockCheckoutButton({
  label,
  productName,
  price
}: MockCheckoutButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <MockCheckoutTriggerButton label={label} size="lg" />
      </DialogTrigger>
      <MockCheckoutDialogContent productName={productName} price={price} />
    </Dialog>
  );
}
