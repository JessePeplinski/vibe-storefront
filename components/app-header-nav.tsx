"use client";

import { useEffect, useState } from "react";
import { Show, useClerk, useUser, UserButton } from "@clerk/nextjs";
import { ChevronRight, LogOut, Menu, UserRound } from "lucide-react";
import Link from "next/link";
import { AuthButtons } from "@/components/auth-buttons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";

const menuId = "signed-in-navigation-menu";

export function AppHeaderNav() {
  const [isOpen, setIsOpen] = useState(false);
  const { openUserProfile, signOut } = useClerk();
  const { user } = useUser();
  const emailAddress = user?.primaryEmailAddress?.emailAddress;
  const accountLabel =
    user?.fullName || user?.username || emailAddress || "Account settings";

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="flex min-w-0 items-center justify-end gap-2">
      <Show when="signed-in">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              aria-controls={menuId}
              aria-label="Open menu"
              className="sm:hidden"
              size="icon"
              type="button"
              variant="outline"
            >
              <Menu className="size-5" aria-hidden />
            </Button>
          </SheetTrigger>
          <SheetContent
            className="top-[65px] h-auto w-full border-t p-0 sm:hidden"
            id={menuId}
            side="top"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
              <SheetDescription>Signed-in navigation menu</SheetDescription>
            </SheetHeader>
            <div className="grid gap-1 px-4 py-4">
              <SheetClose asChild>
                <Link
                  className="rounded-md px-3 py-3 text-sm font-bold text-slate-700 transition hover:bg-accent hover:text-slate-950"
                  href="/dashboard#your-storefronts"
                >
                  Your storefronts
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  className="rounded-md px-3 py-3 text-sm font-bold text-slate-700 transition hover:bg-accent hover:text-slate-950"
                  href="/storefronts"
                >
                  All storefronts
                </Link>
              </SheetClose>
              <div className="mt-2 grid gap-2">
                <Button
                  aria-label="Manage account"
                  className="h-auto w-full justify-between whitespace-normal bg-card px-3 py-3 text-left text-slate-950 shadow-xs hover:bg-accent"
                  onClick={() => {
                    setIsOpen(false);
                    openUserProfile();
                  }}
                  type="button"
                  variant="ghost"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Avatar>
                      {user?.imageUrl ? (
                        <AvatarImage alt="" src={user.imageUrl} />
                      ) : null}
                      <AvatarFallback className="bg-slate-950 text-white">
                        <UserRound className="size-4" aria-hidden />
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black">
                        Manage account
                      </span>
                      <span className="block truncate text-xs font-bold text-muted-foreground">
                        {accountLabel}
                      </span>
                    </span>
                  </span>
                  <ChevronRight className="size-4 shrink-0" aria-hidden />
                </Button>
                <Button
                  className="w-full justify-between px-3"
                  onClick={() => {
                    setIsOpen(false);
                    void signOut({ redirectUrl: "/" });
                  }}
                  type="button"
                  variant="ghost"
                >
                  <span className="flex items-center gap-3">
                    <LogOut className="size-4" aria-hidden />
                    Sign out
                  </span>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <div className="hidden items-center justify-end gap-1 sm:flex">
          <Link
            className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-accent hover:text-slate-950"
            href="/dashboard#your-storefronts"
          >
            Your storefronts
          </Link>
          <Link
            className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-accent hover:text-slate-950"
            href="/storefronts"
          >
            All storefronts
          </Link>
          <div>
            <UserButton />
          </div>
        </div>
      </Show>
      <Show when="signed-out">
        <AuthButtons />
      </Show>
    </div>
  );
}
