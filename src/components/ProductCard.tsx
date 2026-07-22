/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Heart, ShoppingCart, Star, Eye } from 'lucide-react';
import { Product } from '../types';
import { Language, translateProductAttr } from '../lib/translations';

interface ProductCardProps {
  product: Product;
  onNavigate: (page: string, params?: any) => void;
  onAddToCart: (product: Product, qty: number) => void;
  onQuickView: (product: Product) => void;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
  language?: Language;
  onBuyNow?: (product: Product, qty: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onNavigate,
  onAddToCart,
  onQuickView,
  isWishlisted,
  onToggleWishlist,
  language = 'en',
  onBuyNow
}) => {
  const discountPercent = Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100
  );

  return (
    <div id={`product-card-${product.id}`} className="group relative bg-white border border-brand-green-600/5 rounded-2xl overflow-hidden hover:shadow-lg hover:border-brand-green-600/10 transition-all duration-300 flex flex-col justify-between h-full">
      
      {/* Badges and Actions Layer */}
      <div className="relative pt-[110%] bg-brand-green-50/20 overflow-hidden shrink-0">
        
        {/* Product Image */}
        <img
          src={product.mainImage}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
          onClick={() => onNavigate('product', { id: product.id })}
          referrerPolicy="no-referrer"
        />

        {/* Floating Badges Stack - Stacks vertically on the left */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1 z-10 pointer-events-none">
          {discountPercent > 0 && (
            <span className="bg-brand-gold-500 text-brand-green-950 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md uppercase tracking-wider shadow-sm">
              {discountPercent}% OFF
            </span>
          )}

          {product.bestSeller && (
            <span className="bg-brand-green-700 text-brand-cream-100 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md uppercase tracking-wider shadow-sm">
              {language === 'hi' ? 'सर्वश्रेष्ठ विक्रेता' : 'Best Seller'}
            </span>
          )}
        </div>

        {/* Persistent Top Right Action: Wishlist (Heart) - Highly Visible and Easy to Tap on Mobile */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product);
          }}
          className={`absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2 rounded-full shadow-md backdrop-blur-xs transition-all z-10 cursor-pointer active:scale-90 ${
            isWishlisted 
              ? 'bg-brand-green-700 text-brand-cream-100 hover:bg-brand-green-800' 
              : 'bg-white/90 text-brand-green-800 hover:bg-brand-gold-500 hover:text-brand-green-900'
          }`}
          title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Hover Quick Actions Rail (Only active/visible on larger devices with mouse support) */}
        <div className="absolute inset-0 bg-brand-green-900/10 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center gap-2">
          
          <button
            onClick={() => onQuickView(product)}
            className="p-2 rounded-full bg-brand-cream-50 text-brand-green-800 hover:bg-brand-gold-500 hover:text-brand-green-900 shadow-md transition-all transform translate-y-3 group-hover:translate-y-0 duration-300 cursor-pointer"
            title="Quick View"
          >
            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

        </div>
      </div>

      {/* Content Details Block */}
      <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between gap-2.5 sm:gap-3">
        
        <div className="space-y-0.5 sm:space-y-1">
          {/* Category */}
          <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-brand-gold-700 font-bold">
            {translateProductAttr(product.category, language as Language)}
          </span>

          {/* Title - ensures card alignments are perfect with a clean, restricted height */}
          <h4 
            className="font-serif text-[11px] sm:text-sm font-bold text-brand-green-800 hover:text-brand-gold-600 cursor-pointer line-clamp-2 leading-tight sm:leading-snug min-h-[2.2rem] sm:min-h-[2.5rem]"
            onClick={() => onNavigate('product', { id: product.id })}
          >
            {product.name}
          </h4>

          {/* Rating */}
          <div className="flex items-center gap-1 pt-0.5">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
                    i < Math.floor(product.rating) ? 'fill-current' : 'text-gray-200'
                  }`} 
                />
              ))}
            </div>
            <span className="text-[9px] sm:text-[11px] font-bold text-brand-green-700">{product.rating}</span>
          </div>
        </div>

        {/* Pricing and Action Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-1.5 sm:pt-2 border-t border-brand-green-600/5 gap-2">
          <div className="flex flex-row sm:flex-col items-baseline sm:items-start gap-1.5 sm:gap-0">
            {product.originalPrice > product.price && (
              <span className="text-[9px] sm:text-[11px] text-brand-green-600/50 line-through">
                ₹{product.originalPrice}
              </span>
            )}
            <span className="font-serif font-bold text-xs sm:text-base text-brand-green-900">
              ₹{product.price}
            </span>
          </div>

          {product.stock > 0 ? (
            <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart(product, 1);
                }}
                className="h-9 w-9 flex items-center justify-center rounded-xl border border-brand-green-700/30 text-brand-green-800 hover:bg-brand-green-50 hover:border-brand-green-700 transition-all cursor-pointer active:scale-90 shrink-0"
                title={language === 'hi' ? 'कार्ट में जोड़ें' : 'Add to Cart'}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onBuyNow) {
                    onBuyNow(product, 1);
                  } else {
                    onAddToCart(product, 1);
                    onNavigate('checkout');
                  }
                }}
                className="h-9 px-3.5 flex-1 sm:flex-none flex items-center justify-center gap-1 bg-brand-gold-500 hover:bg-brand-gold-600 text-brand-green-950 rounded-xl text-[10px] sm:text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                title={language === 'hi' ? 'अभी खरीदें' : 'Buy Now'}
              >
                <span className="whitespace-nowrap font-sans font-bold uppercase tracking-wider">{language === 'hi' ? 'खरीदें' : 'Buy Now'}</span>
              </button>
            </div>
          ) : (
            <span className="text-[9px] sm:text-[10px] bg-red-50 border border-red-200 text-red-600 font-bold px-1.5 py-1 rounded-md uppercase text-center w-full sm:w-auto">
              {language === 'hi' ? 'स्टॉक समाप्त' : 'Out of Stock'}
            </span>
          )}
        </div>

      </div>

    </div>
  );
};
