"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button, ButtonProps } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ShoppingCart, LogIn, UserPlus } from 'lucide-react';
import { useCart } from './cart-provider';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { useCountryStore } from '@/lib/countryStore';

interface AddToCartButtonProps extends Omit<ButtonProps, 'onClick'> {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    stock: number;
    minQuantity?: number;
  };
  productSize?: string;
  color?: string;
  quantity?: number;
  buttonVariant?: "icon" | "full";
  onAddedToCart?: () => void;
  disabled?: boolean;
}

function SignInToCartPopover({
  children,
  buttonVariant,
}: {
  children: React.ReactNode;
  buttonVariant: "icon" | "full";
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-64 p-4"
        align={buttonVariant === "icon" ? "end" : "start"}
        side="bottom"
        sideOffset={8}
      >
        <p className="text-sm font-medium mb-1">Sign in to add to cart</p>
        <p className="text-xs text-muted-foreground mb-3">
          Create an account or sign in to save items to your cart.
        </p>
        <div className="flex flex-col gap-2">
          <Button size="sm" className="w-full" asChild>
            <Link href="/signin" onClick={() => setOpen(false)}>
              <LogIn className="w-3.5 h-3.5 mr-2" />
              Sign in
            </Link>
          </Button>
          <Button size="sm" variant="outline" className="w-full" asChild>
            <Link href="/signup" onClick={() => setOpen(false)}>
              <UserPlus className="w-3.5 h-3.5 mr-2" />
              Create account
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function AddToCartButton({
  product,
  productSize,
  color,
  quantity = 1,
  buttonVariant = "full",
  onAddedToCart,
  disabled,
  ...props
}: AddToCartButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const isSupportedCountry = useCountryStore(s => s.isSupportedCountry);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSupportedCountry) {
      toast.error("Shopping is not available in your country");
      return;
    }

    if (!productSize) {
      toast.error("Please select a size");
      return;
    }

    setIsAdding(true);

    setTimeout(() => {
      addItem(
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          size: productSize,
          color,
          stock: product.stock,
          minQuantity: product.minQuantity
        },
        quantity
      );

      setIsAdding(false);
      if (onAddedToCart) onAddedToCart();
    }, 500);
  };

  const addButtonDisabled = isAdding || disabled || !isSupportedCountry;
  const showSignInPrompt = !isAuthenticated && isSupportedCountry;

  const addToCartButtonIcon = (
    <Button
      size="icon"
      onClick={handleAddToCart}
      disabled={addButtonDisabled}
      {...props}
    >
      {isAdding ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <ShoppingCart className="h-4 w-4" />
      )}
      <span className="sr-only">Add to cart</span>
    </Button>
  );

  const addToCartButtonFull = (
    <Button
      onClick={handleAddToCart}
      disabled={addButtonDisabled}
      {...props}
    >
      {isAdding ? (
        <span className="flex items-center">
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Adding...
        </span>
      ) : !isSupportedCountry ? (
        "Shopping not available"
      ) : disabled ? (
        "Select Size"
      ) : (
        <>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </>
      )}
    </Button>
  );

  if (showSignInPrompt) {
    if (buttonVariant === "icon") {
      return (
        <SignInToCartPopover buttonVariant="icon">
          <Button size="icon" variant="outline" {...props}>
            <ShoppingCart className="h-4 w-4" />
            <span className="sr-only">Add to cart</span>
          </Button>
        </SignInToCartPopover>
      );
    }
    return (
      <SignInToCartPopover buttonVariant="full">
        <Button
          disabled={!isSupportedCountry}
          variant="outline"
          {...props}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </Button>
      </SignInToCartPopover>
    );
  }

  if (buttonVariant === "icon") {
    return addToCartButtonIcon;
  }

  return addToCartButtonFull;
}
