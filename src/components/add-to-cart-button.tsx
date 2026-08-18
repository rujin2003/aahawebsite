"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button, ButtonProps } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ShoppingCart, LogIn, UserPlus, Check } from 'lucide-react';
import { useCart } from './cart-provider';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { useShopAvailability } from '@/lib/shop-availability';
import { EnquireButton } from '@/components/shipping-availability';

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
  const { isPending, canShop } = useShopAvailability();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!productSize) {
      toast.error("Please select a size");
      return;
    }

    // The cart is local state, so this lands immediately. The old version sat
    // on a 500ms setTimeout that made every add feel like a network round-trip.
    setIsAdding(true);
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

    if (onAddedToCart) onAddedToCart();

    // Brief confirmation tick so the button visibly acknowledges the click.
    setTimeout(() => setIsAdding(false), 350);
  };

  const addButtonDisabled = isAdding || disabled || isPending;
  const showSignInPrompt = !isAuthenticated && canShop;

  const addToCartButtonIcon = (
    <Button
      size="icon"
      onClick={handleAddToCart}
      disabled={addButtonDisabled}
      {...props}
    >
      {isAdding ? (
        <Check className="h-4 w-4" />
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
          <Check className="mr-2 h-4 w-4" />
          Added to cart
        </span>
      ) : disabled ? (
        "Select a size"
      ) : (
        <>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </>
      )}
    </Button>
  );

  // Out of delivery range: offer the enquiry path instead of a dead button
  // wearing an error message.
  if (!isPending && !canShop) {
    if (buttonVariant === "icon") {
      return (
        <EnquireButton
          variant="outline"
          size="icon"
          label=""
          className={props.className}
        />
      );
    }
    return <EnquireButton className={props.className} />;
  }

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
        <Button variant="outline" {...props}>
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
