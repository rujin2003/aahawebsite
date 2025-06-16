"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, X, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "./cart-provider";
import { cn } from "@/lib/utils";
import { useUserCountry } from '@/lib/useCountry';

export default function CartDropdown() {
  const { items, removeItem, updateQuantity, totalPrice } = useCart();
  const { isSupportedCountry } = useUserCountry();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleQuantityChange = (id: string, delta: number, currentQty: number) => {
    const newQty = Math.max(1, currentQty + delta);
    updateQuantity(id, newQty);
  };

  return (
    <div className="relative" ref={buttonRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-muted rounded-full transition-colors"
        aria-label="Cart"
      >
        <ShoppingCart className="w-6 h-6" />
        {items.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 flex items-center justify-center rounded-full">
            {items.reduce((sum, item) => sum + item.quantity, 0)}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-border z-50"
        >
          {items.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              Your cart is empty
            </div>
          ) : (
            <>
              <div className="max-h-[60vh] overflow-y-auto">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 border-b border-border last:border-0 group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 bg-muted/50 rounded-lg overflow-hidden flex items-center justify-center">
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        {(item.size || item.color) && (
                          <p className="text-xs text-muted-foreground">
                            {item.size && `Size: ${item.size}`}
                            {item.size && item.color && " | "}
                            {item.color && `Color: ${item.color}`}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-1">
                          {isSupportedCountry ? (
                            <span className="text-sm font-medium">${item.price.toFixed(2)}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Contact us for pricing</span>
                          )}
                          <div className="flex items-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuantityChange(item.id, -1, item.quantity);
                              }}
                              className="text-foreground/60 hover:text-foreground p-1"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs mx-2">{item.quantity}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuantityChange(item.id, 1, item.quantity);
                              }}
                              className="text-foreground/60 hover:text-foreground p-1"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(item.id);
                        }}
                        className="ml-2 text-destructive/60 hover:text-destructive p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove item"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-border">
                <div className="flex justify-between mb-4">
                  <span className="font-medium">Total:</span>
                  {isSupportedCountry ? (
                    <span className="font-medium">${totalPrice.toFixed(2)}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Contact us for pricing</span>
                  )}
                </div>
                <Button
                  asChild
                  className="w-full rounded-full"
                  onClick={() => setIsOpen(false)}
                  disabled={!isSupportedCountry}
                >
                  <Link href="/cart">
                    {isSupportedCountry ? 'Checkout' : 'Shopping not available'}
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
