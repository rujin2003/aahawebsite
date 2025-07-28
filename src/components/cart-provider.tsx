"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size: string;
  color?: string;
  stock: number;
  minQuantity?: number;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  totalPrice: number;
  promoCode: string | null;
  promoDiscount: number;
  applyPromoCode: (code: string) => Promise<boolean>;
  removePromoCode: () => void;
};

const defaultCartContext: CartContextType = {
  items: [],
  addItem: () => { },
  removeItem: () => { },
  updateQuantity: () => { },
  clearCart: () => { },
  itemCount: 0,
  totalPrice: 0,
  promoCode: null,
  promoDiscount: 0,
  applyPromoCode: async () => false,
  removePromoCode: () => { }
};

const CartContext = createContext<CartContextType>(defaultCartContext);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);

  // Initialize cart from localStorage on client side only
  useEffect(() => {
    setMounted(true);
    const storedCart = localStorage.getItem('cart');
    const storedPromoCode = localStorage.getItem('promoCode');
    const storedPromoDiscount = localStorage.getItem('promoDiscount');

    if (storedCart) {
      try {
        setItems(JSON.parse(storedCart));
      } catch (e) {
        console.error('Failed to parse cart data from localStorage');
        localStorage.removeItem('cart');
      }
    }

    if (storedPromoCode) {
      setPromoCode(storedPromoCode);
    }

    if (storedPromoDiscount) {
      setPromoDiscount(parseFloat(storedPromoDiscount));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('cart', JSON.stringify(items));
      if (promoCode) {
        localStorage.setItem('promoCode', promoCode);
        localStorage.setItem('promoDiscount', promoDiscount.toString());
      } else {
        localStorage.removeItem('promoCode');
        localStorage.removeItem('promoDiscount');
      }
    }
  }, [items, mounted, promoCode, promoDiscount]);

  // Calculate total item count
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  // Calculate total price with discount
  const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  const totalPrice = promoDiscount > 0 ? subtotal - promoDiscount : subtotal;

  // Apply promo code
  const applyPromoCode = async (code: string): Promise<boolean> => {
    if (!mounted) return false;

    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        toast.error('Invalid or inactive promo code');
        return false;
      }

      const discount = data.discount_type === 'percentage'
        ? (subtotal * data.discount) / 100
        : data.discount;

      setPromoCode(code);
      setPromoDiscount(discount);
      toast.success('Promo code applied successfully!');
      return true;
    } catch (error) {
      console.error('Error applying promo code:', error);
      toast.error('Failed to apply promo code');
      return false;
    }
  };

  // Remove promo code
  const removePromoCode = () => {
    if (!mounted) return;
    setPromoCode(null);
    setPromoDiscount(0);
    toast.info('Promo code removed');
  };

  // Add item to cart
  const addItem = (newItem: Omit<CartItem, 'quantity'>, quantity = 1) => {
    if (!mounted) return;

    setItems(prevItems => {
      const existingItem = prevItems.find(item =>
        item.id === newItem.id &&
        item.size === newItem.size &&
        item.color === newItem.color
      );

      if (existingItem) {
        // Check if adding more would exceed stock
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > existingItem.stock) {
          toast.error(`Cannot add more items. Only ${existingItem.stock} available in stock for size ${existingItem.size}`);
          return prevItems;
        }
        // Item already exists, update quantity
        return prevItems.map(item =>
          (item.id === newItem.id &&
            item.size === newItem.size &&
            item.color === newItem.color)
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        // Check if initial quantity exceeds stock
        if (quantity > newItem.stock) {
          toast.error(`Cannot add more items. Only ${newItem.stock} available in stock for size ${newItem.size}`);
          return prevItems;
        }

        if (quantity < (newItem.minQuantity || 1)) {
          toast.error(`Minimum quantity for this item is ${newItem.minQuantity || 1}`);
          return prevItems;
        }
        // Add new item
        return [...prevItems, { ...newItem, quantity }];
      }
    });
  };

  // Remove item from cart
  const removeItem = (id: string) => {
    if (!mounted) return;

    setItems(prevItems => {
      const itemToRemove = prevItems.find(item => item.id === id);
      if (itemToRemove) {
        toast.info(`Removed ${itemToRemove.name} (Size: ${itemToRemove.size}) from cart`);
      }
      return prevItems.filter(item => item.id !== id);
    });
  };

  // Update item quantity
  const updateQuantity = (id: string, quantity: number) => {
    if (!mounted) return;

    if (quantity < 1) {
      removeItem(id);
      return;
    }

    setItems(prevItems => {
      const item = prevItems.find(item => item.id === id);
      if (!item) return prevItems;

      // Check if new quantity exceeds stock
      if (quantity > item.stock) {
        toast.error(`Cannot add more items. Only ${item.stock} available in stock for size ${item.size}`);
        return prevItems;
      }

      if (quantity < (item.minQuantity || 1)) {
        toast.error(`Minimum quantity for this item is ${item.minQuantity || 1}`);
        return prevItems;
      }

      return prevItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      );
    });
  };

  // Clear entire cart
  const clearCart = () => {
    if (!mounted) return;

    setItems([]);
    toast.info('Cart cleared');
  };

  const value = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    itemCount,
    totalPrice,
    promoCode,
    promoDiscount,
    applyPromoCode,
    removePromoCode
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}
export function useCart() {
  const context = useContext(CartContext);
  return context;
}

