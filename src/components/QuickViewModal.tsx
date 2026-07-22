/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Star, ShieldCheck, ShoppingCart, Info, Sparkles } from 'lucide-react';
import { Product } from '../types';

interface QuickViewModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product, qty: number) => void;
  onNavigate: (page: string, params?: any) => void;
  onBuyNow?: (product: Product, qty: number) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onNavigate,
  onBuyNow
}) => {
  const [qty, setQty] = useState(1);

  return (
    <div id="quick-view-modal" className="fixed inset-0 z-50 overflow-y-auto bg-brand-green-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-brand-cream-50 w-full max-w-3xl rounded-2xl shadow-2xl border border-brand-green-600/10 overflow-hidden flex flex-col md:flex-row relative">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-brand-cream-100 hover:bg-brand-green-100 text-brand-green-800 cursor-pointer shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image Section */}
        <div className="w-full md:w-1/2 bg-brand-green-50/10 relative p-6 flex items-center justify-center min-h-[300px]">
          <img 
            src={product.mainImage} 
            alt={product.name} 
            className="w-full h-full max-h-[350px] object-contain rounded-xl"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Product Details Section */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between space-y-4">
          
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-widest text-brand-gold-700 font-bold bg-brand-gold-500/10 px-2 py-0.5 rounded-md">
              {product.category}
            </span>
            <h3 className="font-serif text-xl font-bold text-brand-green-900 leading-tight">
              {product.name}
            </h3>
            
            {/* Rating */}
            <div className="flex items-center gap-1.5">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${
                      i < Math.floor(product.rating) ? 'fill-current' : 'text-gray-200'
                    }`} 
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-brand-green-700">{product.rating} Average Rating</span>
            </div>

            <p className="text-xs text-brand-green-800/80 leading-relaxed line-clamp-4 pt-1">
              {product.description}
            </p>
          </div>

          {/* Core Ingredients Tags */}
          {product.ingredients && product.ingredients.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider text-brand-green-700 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-brand-gold-600" />
                <span>Core Vedic Botanicals</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {product.ingredients.map((ing, i) => (
                  <span key={i} className="text-[10px] bg-white border border-brand-green-600/10 px-2 py-1 rounded-md text-brand-green-800 font-semibold">
                    {ing.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Pricing, Quantity, and Cart */}
          <div className="pt-4 border-t border-brand-green-600/10 space-y-4">
            <div className="flex justify-between items-baseline">
              <div className="flex items-baseline gap-2">
                <span className="font-serif font-bold text-2xl text-brand-green-900">₹{product.price}</span>
                {product.originalPrice > product.price && (
                  <span className="text-sm text-brand-green-600/50 line-through">₹{product.originalPrice}</span>
                )}
              </div>
              <span className={`text-xs font-bold uppercase ${product.stock > 0 ? 'text-brand-green-700' : 'text-red-500'}`}>
                {product.stock > 0 ? `In Stock (${product.stock} left)` : 'Out of Stock'}
              </span>
            </div>

            {product.stock > 0 ? (
              <div className="flex flex-col gap-2.5">
                <div className="flex gap-2.5">
                  {/* Quantity adjustments */}
                  <div className="flex items-center border border-brand-green-200 rounded-xl bg-white overflow-hidden shrink-0 h-11">
                    <button 
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      className="w-9 h-full flex items-center justify-center text-brand-green-800 font-semibold hover:bg-brand-green-50 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-1 font-semibold text-sm text-brand-green-900 w-6 text-center">{qty}</span>
                    <button 
                      onClick={() => setQty(Math.min(product.stock, qty + 1))}
                      className="w-9 h-full flex items-center justify-center text-brand-green-800 font-semibold hover:bg-brand-green-50 cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => { onAddToCart(product, qty); onClose(); }}
                    className="flex-1 h-11 border border-brand-green-700 hover:bg-brand-green-50 text-brand-green-800 font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
                  >
                    <ShoppingCart className="w-4 h-4 text-brand-green-700" />
                    <span>Add To Cart</span>
                  </button>
                </div>

                <button
                  onClick={() => { 
                    onClose(); 
                    if (onBuyNow) {
                      onBuyNow(product, qty);
                    } else {
                      onAddToCart(product, qty); 
                      onNavigate('checkout'); 
                    }
                  }}
                  className="w-full h-11 bg-brand-gold-500 hover:bg-brand-gold-600 text-brand-green-950 font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  <span>Buy Now</span>
                </button>
              </div>
            ) : (
              <button disabled className="w-full bg-gray-200 text-gray-400 font-bold py-2.5 rounded-xl cursor-not-allowed">
                Currently Out of Stock
              </button>
            )}

            <button
              onClick={() => { onClose(); onNavigate('product', { id: product.id }); }}
              className="w-full text-center py-2.5 rounded-xl border border-brand-green-600/20 text-brand-green-800 text-xs font-bold hover:bg-brand-green-50 transition-colors flex items-center justify-center gap-1"
            >
              <Info className="w-4 h-4 text-brand-gold-600" />
              <span>View Full Herb Composition & Reviews</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
