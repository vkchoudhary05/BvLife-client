/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { X, Star, ShieldCheck, ShoppingCart, Info, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product, ProductVariant } from '../types';
import { getVariantImage, getVariantGalleryImages } from '../utils/variantImages';
import { api } from '../services/api';

interface QuickViewModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product, qty: number, selectedVariant?: ProductVariant) => void;
  onNavigate: (page: string, params?: any) => void;
  onBuyNow?: (product: Product, qty: number, selectedVariant?: ProductVariant) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onNavigate,
  onBuyNow
}) => {
  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
  const [selectedImage, setSelectedImage] = useState<string>(product.mainImage);

  // Initialize selected variant
  useEffect(() => {
    if (product.variants && product.variants.length > 0) {
      const defaultVar = product.variants.find(v => v.isDefault) || product.variants[0];
      setSelectedVariant(defaultVar);
      setSelectedImage(getVariantImage(defaultVar, product));
    } else {
      setSelectedVariant(undefined);
      setSelectedImage(product.mainImage);
    }
  }, [product]);

  const activePrice = selectedVariant ? selectedVariant.price : product.price;
  const activeOriginalPrice = selectedVariant ? (selectedVariant.originalPrice || activePrice) : product.originalPrice;
  const activeStock = selectedVariant ? selectedVariant.stock : product.stock;

  // Combine and deduplicate all images tailored to the active variant
  const allImages = useMemo(() => {
    if (selectedVariant?.allImages && Array.isArray(selectedVariant.allImages) && selectedVariant.allImages.length > 0) {
      return selectedVariant.allImages;
    }
    return getVariantGalleryImages(selectedVariant, product);
  }, [product, selectedVariant]);

  const handleSelectVariant = async (variant: ProductVariant) => {
    setSelectedVariant(variant);
    const variantThumb = getVariantImage(variant, product);
    setSelectedImage(variantThumb);
    if (qty > variant.stock && variant.stock > 0) setQty(variant.stock);

    try {
      if (product?.id) {
        const backendVariantData = await api.getProductVariant(product.id, variant.id);
        if (backendVariantData?.variant && backendVariantData?.resolvedDetails) {
          const resolved = backendVariantData.resolvedDetails;
          setSelectedVariant(prev => ({
            ...prev,
            ...backendVariantData.variant,
            ...resolved
          }));
          if (resolved.image) {
            setSelectedImage(resolved.image);
          }
        }
      }
    } catch {
      // Fallback to local variant representation
    }
  };

  const currentImage = selectedImage && allImages.includes(selectedImage)
    ? selectedImage
    : (allImages[0] || product.mainImage);

  const activeIdx = Math.max(0, allImages.indexOf(currentImage));

  const handlePrev = () => {
    if (allImages.length <= 1) return;
    const prev = (activeIdx - 1 + allImages.length) % allImages.length;
    setSelectedImage(allImages[prev]);
  };

  const handleNext = () => {
    if (allImages.length <= 1) return;
    const next = (activeIdx + 1) % allImages.length;
    setSelectedImage(allImages[next]);
  };

  return (
    <div id="quick-view-modal" className="fixed inset-0 z-50 overflow-y-auto bg-brand-green-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-brand-cream-50 w-full max-w-3xl rounded-3xl shadow-2xl border border-brand-green-600/10 overflow-hidden flex flex-col md:flex-row relative">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-brand-cream-100/90 hover:bg-brand-green-100 text-brand-green-800 cursor-pointer shadow-sm transition-colors"
          title="Close Preview"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image Section */}
        <div className="w-full md:w-1/2 bg-white/60 relative p-6 flex flex-col items-center justify-center min-h-[320px] border-b md:border-b-0 md:border-r border-brand-green-600/10">
          <div className="relative w-full flex-1 flex items-center justify-center min-h-[220px]">
            <img 
              src={currentImage} 
              alt={product.name} 
              className="max-h-[280px] w-full object-contain rounded-2xl"
              referrerPolicy="no-referrer"
            />
            {allImages.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-md text-brand-green-900 flex items-center justify-center cursor-pointer hover:bg-white transition-all"
                  title="Previous image"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-md text-brand-green-900 flex items-center justify-center cursor-pointer hover:bg-white transition-all"
                  title="Next image"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* QuickView Thumbnails */}
          {allImages.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto py-1 px-1">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(img)}
                  className={`w-12 h-12 rounded-xl bg-white border-2 overflow-hidden p-1 flex-shrink-0 cursor-pointer transition-all ${
                    currentImage === img 
                      ? 'border-brand-green-700 shadow-xs ring-2 ring-brand-gold-500/30' 
                      : 'border-slate-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="thumb" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details Section */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between space-y-4">
          
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-widest text-brand-gold-700 font-bold bg-brand-gold-500/10 px-2 py-0.5 rounded-md">
              {product.category}
            </span>
            <h3 className="text-xl font-bold text-brand-green-950 leading-tight">
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

            <p className="text-xs text-brand-green-800/80 leading-relaxed line-clamp-3 pt-1">
              {selectedVariant?.description ? `${product.description} ${selectedVariant.description}` : product.description}
            </p>

            {selectedVariant?.dosage && (
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-brand-green-900 bg-brand-green-50/80 px-2.5 py-1 rounded-lg border border-brand-green-600/10">
                <Sparkles className="w-3 h-3 text-brand-gold-600 shrink-0" />
                <span className="truncate">Dosage: {selectedVariant.dosage}</span>
              </div>
            )}
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

          {/* Product Variants Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] uppercase tracking-wider text-brand-green-800 font-bold">
                Select Formulation / Packaging Option:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                {product.variants.map(variant => {
                  const isSelected = selectedVariant?.id === variant.id;
                  const isOutOfStock = variant.stock <= 0;
                  const variantThumb = getVariantImage(variant, product);
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => handleSelectVariant(variant)}
                      className={`p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-2.5 text-left ${
                        isSelected 
                          ? 'border-brand-green-700 bg-brand-green-50 ring-2 ring-brand-green-600/30 text-brand-green-950 shadow-xs' 
                          : isOutOfStock 
                            ? 'border-gray-200 text-gray-400 bg-gray-50 opacity-60 cursor-not-allowed' 
                            : 'border-brand-green-600/20 text-brand-green-900 bg-white hover:border-brand-green-600/50 hover:bg-brand-cream-50/50'
                      }`}
                    >
                      <img
                        src={variantThumb}
                        alt={variant.name}
                        className="w-9 h-9 rounded-lg object-cover bg-white border border-slate-100 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-[11px] truncate">{variant.name}</span>
                          <span className="text-brand-green-900 font-bold text-[11px] shrink-0">₹{variant.price}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                          {variant.size && <span className="font-mono">{variant.size}</span>}
                          {variant.form && <span className="uppercase text-[9px] font-semibold text-brand-gold-800">({variant.form})</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pricing, Quantity, and Cart */}
          <div className="pt-3 border-t border-brand-green-600/10 space-y-3">
            <div className="flex justify-between items-baseline">
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-2xl text-brand-green-950">₹{activePrice}</span>
                {activeOriginalPrice > activePrice && (
                  <span className="text-sm text-brand-green-600/50 line-through">₹{activeOriginalPrice}</span>
                )}
              </div>
              <span className={`text-xs font-bold uppercase ${activeStock > 0 ? 'text-brand-green-700' : 'text-red-500'}`}>
                {activeStock > 0 ? `In Stock (${activeStock} left)` : 'Out of Stock'}
              </span>
            </div>

            {activeStock > 0 ? (
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
                      onClick={() => setQty(Math.min(activeStock, qty + 1))}
                      className="w-9 h-full flex items-center justify-center text-brand-green-800 font-semibold hover:bg-brand-green-50 cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => { onAddToCart(product, qty, selectedVariant); onClose(); }}
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
                      onBuyNow(product, qty, selectedVariant);
                    } else {
                      onAddToCart(product, qty, selectedVariant); 
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
