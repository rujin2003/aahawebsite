"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";

interface CartSignInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartSignInDialog({ open, onOpenChange }: CartSignInDialogProps) {
  const redirect = "/cart";
  const signInUrl = `/signin?redirect=${encodeURIComponent(redirect)}`;
  const signUpUrl = `/signup?redirect=${encodeURIComponent(redirect)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign in to checkout</DialogTitle>
          <DialogDescription>
            Please sign in or create an account to proceed with your order.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-2">
          <Button className="w-full" asChild>
            <Link href={signInUrl}>
              <LogIn className="w-4 h-4 mr-2" />
              Sign in
            </Link>
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <Link href={signUpUrl}>
              <UserPlus className="w-4 h-4 mr-2" />
              Create account
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
