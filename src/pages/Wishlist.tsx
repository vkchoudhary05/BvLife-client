/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Heart, ArrowLeft, ShoppingBag, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Language } from '../lib/translations';

interface WishlistProps {
  wishlist: string[];
  products: Product[];
  onNavigate: (page: string, params?: any) => void;
  onAddToCart: (product: Product, qty: number) => void;
  onToggleWishlist: (product: Product) => void;
  onQuickView: (product: Product) => void;
  language?: Language;
  onBuyNow?: (product: Product, qty: number) => void;
}

export const Wishlist: React.FC<WishlistProps> = ({
  wishlist,
  products,
  onNavigate,
  onAddToCart,
  onToggleWishlist,
  onQuickView,
  language = 'en',
  onBuyNow
}) => {
  const wishlistedProducts = React.useMemo(() => {
    return products.filter(p => wishlist.includes(p.id));
  }, [wishlist, products]);

  return (
    <div id="wishlist-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Title Header */}
      <div className="border-b border-brand-green-600/10 pb-5 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500 fill-current animate-pulse" />
            <span className="text-xs uppercase tracking-widest text-brand-gold-600 font-bold">
              {language === 'hi' ? 'आपकी पसंद' : 'Sacred Selections'}
            </span>
          </div>
          <h2 className="font-serif text-3xl font-bold text-brand-green-900 mt-1">
            {language === 'hi' ? 'पसंदीदा उपचार' : 'Your Wishlist'}
          </h2>
          <p className="text-xs text-brand-green-600/70 mt-1">
            {language === 'hi' 
              ? 'आपके चुने हुए स्वास्थ्य और कल्याण उत्पाद जो आपकी संतुलन यात्रा में सहायक हैं।' 
              : 'Your curated wellness rituals and Ayurvedic remedies awaiting your checkout.'}
          </p>
        </div>
        
        <button
          onClick={() => onNavigate('shop')}
          className="flex items-center gap-1.5 text-xs text-brand-green-800 hover:text-brand-green-950 font-bold underline transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{language === 'hi' ? 'दुकान पर वापस जाएं' : 'Continue Shopping'}</span>
        </button>
      </div>

      {wishlistedProducts.length === 0 ? (
        /* EMPTY STATE */
        <div className="max-w-md mx-auto text-center py-16 px-4 bg-brand-cream-50/50 border border-brand-green-100 rounded-[2rem] shadow-sm space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="inline-flex p-4 rounded-full bg-brand-cream-100/80 border border-brand-gold-200">
            <Heart className="w-10 h-10 text-brand-green-600/30" />
          </div>
          <div className="space-y-2">
            <h3 className="font-serif text-lg font-bold text-brand-green-900">
              {language === 'hi' ? 'आपकी इच्छा सूची खाली है' : 'Your Wishlist is Empty'}
            </h3>
            <p className="text-xs text-brand-green-800/70 leading-relaxed max-w-xs mx-auto">
              {language === 'hi'
                ? 'अभी तक कोई पसंदीदा उत्पाद नहीं जोड़ा गया है। जड़ी-बूटियों की खोज शुरू करें।'
                : 'Browse our organic Ayurvedic herbs, formulation oils, and vital wellness blends to begin your selection.'}
            </p>
          </div>
          <button
            onClick={() => onNavigate('shop')}
            className="w-full py-3 bg-brand-green-800 hover:bg-brand-green-900 text-brand-cream-50 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
          >
            <ShoppingBag className="w-4 h-4 text-brand-gold-400" />
            <span>{language === 'hi' ? 'दुकान देखें' : 'Explore Formulations'}</span>
          </button>
        </div>
      ) : (
        /* PRODUCTS GRID */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {wishlistedProducts.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              onNavigate={onNavigate}
              onAddToCart={onAddToCart}
              onQuickView={onQuickView}
              isWishlisted={true}
              onToggleWishlist={onToggleWishlist}
              language={language}
              onBuyNow={onBuyNow}
            />
          ))}
        </div>
      )}
    </div>
  );
};
