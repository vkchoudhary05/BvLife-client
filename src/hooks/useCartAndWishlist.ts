import { useState, useEffect, useCallback } from 'react';
import { CartItem, Product, ProductVariant, Coupon } from '../types';

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

  const handleAddToCart = useCallback((product: Product, qty: number, selectedVariant?: ProductVariant) => {
    // If no variant passed but product has variants, pick default or first variant
    const variantToUse = selectedVariant || (product.variants && product.variants.length > 0
      ? (product.variants.find(v => v.isDefault) || product.variants[0])
      : undefined);

    const maxStock = variantToUse ? variantToUse.stock : product.stock;

    setCart(prev => {
      const existingIndex = prev.findIndex(item => 
        item.product.id === product.id && 
        (item.selectedVariant?.id || '') === (variantToUse?.id || '')
      );

      if (existingIndex > -1) {
        return prev.map((item, idx) => {
          if (idx === existingIndex) {
            return {
              ...item,
              quantity: Math.min(maxStock, item.quantity + qty),
              selectedVariant: variantToUse || item.selectedVariant
            };
          }
          return item;
        });
      }
      return [...prev, { product, quantity: qty, selectedVariant: variantToUse }];
    });
  }, []);

  const handleUpdateCartQty = useCallback((productId: string, qty: number, variantId?: string) => {
    setCart(prev =>
      prev.map(item => {
        const matchesProduct = item.product.id === productId;
        const matchesVariant = variantId ? item.selectedVariant?.id === variantId : true;
        if (matchesProduct && matchesVariant) {
          const maxStock = item.selectedVariant ? item.selectedVariant.stock : item.product.stock;
          return { ...item, quantity: Math.min(maxStock, Math.max(1, qty)) };
        }
        return item;
      })
    );
  }, []);

  const handleRemoveFromCart = useCallback((productId: string, variantId?: string) => {
    setCart(prev => prev.filter(item => {
      if (item.product.id !== productId) return true;
      if (variantId && item.selectedVariant?.id !== variantId) return true;
      return false;
    }));
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
