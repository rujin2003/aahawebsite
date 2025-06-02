"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, X, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "./cart-provider";
import { cn } from "@/lib/utils";

export default function CartDropdown() {
  const { items, removeItem, updateQuantity, totalPrice } = useCart();
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
    <div className="relative">
      <div
        ref={buttonRef}
        className="relative cursor-pointer"
        onMouseEnter={() => setIsOpen(true)}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="relative bg-primary/10 p-2 rounded-full hover:bg-primary/20 transition-colors">
          <ShoppingCart className="w-5 h-5" />
          {items.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-4 h-4 flex items-center justify-center rounded-full">
              {items.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </div>
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={cn(
            "absolute right-0 mt-2 w-80 bg-background rounded-xl shadow-lg z-50",
            "border border-border animate-fade-down animate-duration-200",
            "overflow-hidden"
          )}
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="p-4 border-b border-border">
            <h3 className="font-medium">Your Cart</h3>
          </div>

          {items.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <p>Your cart is empty</p>
              <Button
                asChild
                variant="outline"
                className="mt-4 rounded-full"
                onClick={() => setIsOpen(false)}
              >
                <Link href="/shop">Continue Shopping</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="max-h-[320px] overflow-y-auto p-2">
                {items.map((item) => (
                  <div
                    key={`${item.id}-${item.size || ""}-${item.color || ""}`}
                    className="flex items-center py-3 px-2 hover:bg-muted/50 rounded-lg group transition-colors"
                  >
                    <div className="h-16 w-16 bg-muted/50 rounded-lg overflow-hidden flex items-center justify-center p-2 mr-3">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={50}
                        height={50}
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
                        <span className="text-sm font-medium">${item.price.toFixed(2)}</span>
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
                ))}
              </div>

              <div className="p-4 border-t border-border">
                <div className="flex justify-between mb-4">
                  <span className="font-medium">Total:</span>
                  <span className="font-medium">${totalPrice.toFixed(2)}</span>
                </div>
                <Button
                  asChild
                  className="w-full rounded-full"
                  onClick={() => setIsOpen(false)}
                >
                  <Link href="/cart">Checkout</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
