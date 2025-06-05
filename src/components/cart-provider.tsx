"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size: string;
  color?: string;
  stock: number;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  totalPrice: number;
};

const defaultCartContext: CartContextType = {
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  itemCount: 0,
  totalPrice: 0
};

const CartContext = createContext<CartContextType>(defaultCartContext);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // Initialize cart from localStorage on client side only
  useEffect(() => {
    setMounted(true);
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      try {
        setItems(JSON.parse(storedCart));
      } catch (e) {
        console.error('Failed to parse cart data from localStorage');
        localStorage.removeItem('cart');
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, mounted]);

  // Calculate total item count
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  // Calculate total price
  const totalPrice = items.reduce((total, item) => total + (item.price * item.quantity), 0);

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
    totalPrice
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

