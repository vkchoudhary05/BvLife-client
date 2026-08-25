/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShoppingCart, Star, Eye, Layers } from 'lucide-react';
import { Product, ProductVariant } from '../types';
import { Language, translateProductAttr } from '../lib/translations';
import { getVariantImage } from '../utils/variantImages';

interface ProductCardProps {
  product: Product;
  onNavigate: (page: string, params?: any) => void;
  onAddToCart: (product: Product, qty: number, selectedVariant?: ProductVariant) => void;
  onQuickView: (product: Product) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
  language?: Language;
  onBuyNow?: (product: Product, qty: number, selectedVariant?: ProductVariant) => void;
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
  const defaultVariant = product.variants && product.variants.length > 0
    ? (product.variants.find(v => v.isDefault) || product.variants[0])
    : undefined;

  const [activeVariant, setActiveVariant] = useState<ProductVariant | undefined>(defaultVariant);

  const currentVariant = activeVariant || defaultVariant;
  const displayPrice = currentVariant ? currentVariant.price : product.price;
  const displayOriginalPrice = currentVariant ? (currentVariant.originalPrice || displayPrice) : product.originalPrice;
  const displayImage = currentVariant ? getVariantImage(currentVariant, product) : product.mainImage;

  const discountPercent = Math.round(
    ((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100
  );

  const hasVariants = Boolean(product.variants && product.variants.length > 1);

  return (
    <div
      id={`product-card-${product.id}`}
      className="group relative bg-white border border-brand-green-700/10 rounded-2xl overflow-hidden
                 shadow-[0_1px_2px_rgba(20,60,40,0.06)]
                 hover:shadow-[0_16px_32px_-12px_rgba(20,83,45,0.25)]
                 hover:border-brand-green-600/30 hover:-translate-y-0.5
                 transition-all duration-300 flex flex-col justify-between h-full"
    >

      {/* Image Layer */}
      <div className="relative pt-[110%] bg-gradient-to-b from-brand-green-50 to-brand-green-100/40 overflow-hidden shrink-0">

        {/* Product Image */}
        <img
          src={displayImage}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-500 cursor-pointer"
          onClick={() => onNavigate('product', { id: product.id })}
          referrerPolicy="no-referrer"
        />

        {/* Bottom fade so the sage backdrop reads as one surface with the image */}
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-brand-green-950/10 to-transparent pointer-events-none" />

        {/* Floating Badges */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1 z-10 pointer-events-none">
          {discountPercent > 0 && (
            <span className="inline-flex items-center gap-1 bg-brand-green-900 text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide shadow-xs">
              {discountPercent}% OFF
            </span>
          )}
          {hasVariants && (
            <span className="inline-flex items-center gap-1 bg-brand-cream-100/90 border border-brand-green-600/20 text-brand-green-900 text-[8px] sm:text-[9px] font-extrabold px-1.5 py-0.5 rounded-md tracking-tight backdrop-blur-xs">
              <Layers className="w-2.5 h-2.5 text-brand-gold-700" />
              <span>{product.variants?.length} Options</span>
            </span>
          )}
        </div>

        {/* Hover Quick Actions Rail */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-green-950/35 via-brand-green-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center gap-2">
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
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-brand-gold-700 font-bold">
              {translateProductAttr(product.category, language as Language)}
            </span>
            {defaultVariant && (
              <span className="text-[9px] font-semibold text-brand-green-700/80 bg-brand-green-50 px-1.5 py-0.2 rounded border border-brand-green-200/50">
                {defaultVariant.size || defaultVariant.name}
              </span>
            )}
          </div>

          {/* Title */}
          <h4
            className="font-medium text-[11px] sm:text-sm text-brand-green-950 hover:text-brand-gold-600 cursor-pointer line-clamp-2 leading-tight sm:leading-snug min-h-[2.2rem] sm:min-h-[2.5rem]"
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
            <span className="text-[9px] sm:text-[11px] font-medium text-brand-green-700">{product.rating}</span>
          </div>
        </div>

        {/* Pricing and Action Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-1.5 sm:pt-2 border-t border-brand-green-600/10 gap-2">
          <div className="flex flex-row sm:flex-col items-baseline sm:items-start gap-1.5 sm:gap-0">
            {displayOriginalPrice > displayPrice && (
              <span className="text-[9px] sm:text-[11px] text-brand-green-600/50 line-through">
                ₹{displayOriginalPrice}
              </span>
            )}
            <div className="flex items-baseline gap-1">
              {hasVariants && <span className="text-[10px] text-brand-green-700 font-medium">from</span>}
              <span className="font-semibold text-xs sm:text-base text-brand-green-950">
                ₹{displayPrice}
              </span>
            </div>
          </div>

          {product.stock > 0 ? (
            <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart(product, 1, currentVariant);
                }}
                className="h-9 w-9 flex items-center justify-center rounded-xl border border-brand-green-700/30 text-brand-green-800 bg-brand-green-50/40 hover:bg-brand-green-100 hover:border-brand-green-700 transition-all cursor-pointer active:scale-90 shrink-0"
                title={language === 'hi' ? 'कार्ट में जोड़ें' : 'Add to Cart'}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onBuyNow) {
                    onBuyNow(product, 1, currentVariant);
                  } else {
                    onAddToCart(product, 1, currentVariant);
                    onNavigate('checkout');
                  }
                }}
                className="h-9 px-3.5 flex-1 sm:flex-none flex items-center justify-center gap-1 bg-brand-green-800 hover:bg-brand-green-900 text-brand-cream-50 rounded-xl text-[10px] sm:text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
                title={language === 'hi' ? 'अभी खरीदें' : 'Buy Now'}
              >
                <span className="whitespace-nowrap font-sans font-bold uppercase tracking-wider">{language === 'hi' ? 'खरीदें' : 'Buy Now'}</span>
              </button>
            </div>
          ) : (
            <span className="text-[9px] sm:text-[10px] bg-brand-green-50 border border-brand-green-200 text-brand-green-700 font-bold px-1.5 py-1 rounded-md uppercase text-center w-full sm:w-auto">
              {language === 'hi' ? 'स्टॉक समाप्त' : 'Out of Stock'}
            </span>
          )}
        </div>

      </div>

    </div>
  );
};
