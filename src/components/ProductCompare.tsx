/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Layers, ShoppingCart, Star } from 'lucide-react';
import { Product } from '../types';

interface ProductCompareProps {
  compareList: Product[];
  onRemoveFromCompare: (product: Product) => void;
  onClearCompare: () => void;
  onAddToCart: (product: Product, qty: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductCompare: React.FC<ProductCompareProps> = ({
  compareList,
  onRemoveFromCompare,
  onClearCompare,
  onAddToCart,
  isOpen,
  onClose
}) => {
  if (!isOpen || compareList.length === 0) return null;

  return (
    <div id="product-compare-drawer" className="fixed bottom-0 left-0 right-0 z-40 bg-brand-cream-50 border-t-2 border-brand-green-700 shadow-2xl animate-in slide-in-from-bottom duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        
        {/* Header bar */}
        <div className="flex justify-between items-center pb-4 border-b border-brand-green-600/10 mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-gold-600 animate-bounce" />
            <h3 className="font-serif text-lg font-bold text-brand-green-800">
              Product Ayurvedic Comparison <span className="text-xs text-brand-green-600/70 font-sans font-normal">({compareList.length} / 3 selected)</span>
            </h3>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={onClearCompare} 
              className="text-xs font-semibold text-brand-green-700 hover:text-red-500 transition-colors cursor-pointer"
            >
              Clear All
            </button>
            <button 
              onClick={onClose} 
              className="p-1 rounded-full bg-brand-green-100 hover:bg-brand-green-200 text-brand-green-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Comparison Table Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-brand-green-600/10">
                <th className="py-2.5 font-bold text-brand-green-700 w-1/4 uppercase tracking-wider">Features</th>
                {compareList.map(p => (
                  <th key={p.id} className="py-2.5 px-4 font-serif text-sm font-bold text-brand-green-800 relative w-1/4">
                    <button 
                      onClick={() => onRemoveFromCompare(p)}
                      className="absolute top-1 right-2 text-brand-green-600 hover:text-red-500 cursor-pointer"
                      title="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={p.mainImage} 
                        alt={p.name} 
                        className="w-10 h-10 rounded object-cover border border-brand-green-600/10"
                        referrerPolicy="no-referrer"
                      />
                      <span className="line-clamp-2 leading-tight">{p.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              
              {/* Price */}
              <tr className="border-b border-brand-green-600/5 hover:bg-brand-green-50/20">
                <td className="py-3 font-semibold text-brand-green-800 uppercase tracking-wider">Price</td>
                {compareList.map(p => (
                  <td key={p.id} className="py-3 px-4 font-bold font-serif text-sm text-brand-green-950">
                    ₹{p.price} <span className="text-[10px] text-brand-green-600/50 line-through font-sans">₹{p.originalPrice}</span>
                  </td>
                ))}
              </tr>

              {/* Rating */}
              <tr className="border-b border-brand-green-600/5 hover:bg-brand-green-50/20">
                <td className="py-3 font-semibold text-brand-green-800 uppercase tracking-wider">Dosha Rating</td>
                {compareList.map(p => (
                  <td key={p.id} className="py-3 px-4">
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="font-bold text-brand-green-800">{p.rating} / 5.0</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Category */}
              <tr className="border-b border-brand-green-600/5 hover:bg-brand-green-50/20">
                <td className="py-3 font-semibold text-brand-green-800 uppercase tracking-wider">Category</td>
                {compareList.map(p => (
                  <td key={p.id} className="py-3 px-4 font-medium text-brand-green-700">{p.category}</td>
                ))}
              </tr>

              {/* Key Ingredients */}
              <tr className="border-b border-brand-green-600/5 hover:bg-brand-green-50/20">
                <td className="py-3 font-semibold text-brand-green-800 uppercase tracking-wider">Botanical Herbs</td>
                {compareList.map(p => (
                  <td key={p.id} className="py-3 px-4 text-brand-green-800 max-w-[200px]">
                    <div className="flex flex-wrap gap-1">
                      {p.ingredients.map((ing, i) => (
                        <span key={i} className="text-[9px] bg-white border border-brand-green-600/10 px-1.5 py-0.5 rounded text-brand-green-800 font-medium">
                          {ing.name}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Dosage */}
              <tr className="border-b border-brand-green-600/5 hover:bg-brand-green-50/20">
                <td className="py-3 font-semibold text-brand-green-800 uppercase tracking-wider">Dosage</td>
                {compareList.map(p => (
                  <td key={p.id} className="py-3 px-4 text-brand-green-700 italic leading-snug">{p.dosage}</td>
                ))}
              </tr>

              {/* Primary Benefits */}
              <tr className="border-b border-brand-green-600/5 hover:bg-brand-green-50/20">
                <td className="py-3 font-semibold text-brand-green-800 uppercase tracking-wider">Key Benefits</td>
                {compareList.map(p => (
                  <td key={p.id} className="py-3 px-4 text-brand-green-800">
                    <ul className="list-disc list-inside space-y-1 text-[11px] leading-tight max-w-[200px]">
                      {p.benefits.slice(0, 2).map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>

              {/* Buy Action */}
              <tr>
                <td className="py-3 font-semibold text-brand-green-800"></td>
                {compareList.map(p => (
                  <td key={p.id} className="py-3 px-4">
                    {p.stock > 0 ? (
                      <button
                        onClick={() => onAddToCart(p, 1)}
                        className="bg-brand-green-700 hover:bg-brand-green-800 text-brand-cream-100 font-bold px-4 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm w-full"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Add to Cart</span>
                      </button>
                    ) : (
                      <span className="text-[9px] uppercase font-bold text-red-500">Out of Stock</span>
                    )}
                  </td>
                ))}
              </tr>

            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};
