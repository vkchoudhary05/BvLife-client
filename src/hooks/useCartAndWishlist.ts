import { useState, useEffect, useCallback } from 'react';
import { CartItem, Product, Coupon } from '../types';

export function useCartAndWishlist() {
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('grams_cart');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('grams_wishlist');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  useEffect(() => {
    localStorage.setItem('grams_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('grams_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const handleAddToCart = useCallback((product: Product, qty: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(product.stock, item.quantity + qty) }
            : item
        );
      }
      return [...prev, { product, quantity: qty }];
    });
  }, []);

  const handleUpdateCartQty = useCallback((productId: string, qty: number) => {
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity: qty } : item
      )
    );
  }, []);

  const handleRemoveFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  }, []);

  const handleToggleWishlist = useCallback((product: Product) => {
    setWishlist(prev =>
      prev.includes(product.id)
        ? prev.filter(id => id !== product.id)
        : [...prev, product.id]
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setAppliedCoupon(null);
  }, []);

  return {
    cart,
    setCart,
    wishlist,
    setWishlist,
    appliedCoupon,
    setAppliedCoupon,
    handleAddToCart,
    handleUpdateCartQty,
    handleRemoveFromCart,
    handleToggleWishlist,
    clearCart
  };
}
