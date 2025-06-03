"use client";

import React, { useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useCart } from './cart-provider';
import { toast } from 'sonner';

interface AddToCartButtonProps extends Omit<ButtonProps, 'onClick'> {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
  };
  productSize?: string;
  color?: string;
  quantity?: number;
  buttonVariant?: "icon" | "full";
  onAddedToCart?: () => void;
  disabled?: boolean;
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

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!productSize) {
      toast.error("Please select a size");
      return;
    }

    setIsAdding(true);

    // Simulate a slight delay to show loading state
    setTimeout(() => {
      addItem(
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          size: productSize,
          color
        },
        quantity
      );

      toast.success(`Added ${product.name} to cart`);
      setIsAdding(false);
      if (onAddedToCart) onAddedToCart();
    }, 500);
  };

  if (buttonVariant === "icon") {
    return (
      <Button
        size="icon"
        onClick={handleAddToCart}
        disabled={isAdding || disabled}
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
  }

  return (
    <Button
      onClick={handleAddToCart}
      disabled={isAdding || disabled}
      {...props}
    >
      {isAdding ? (
        <span className="flex items-center">
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Adding...
        </span>
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
}
