/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, Grid, List, RotateCcw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Language, t, translateProductAttr } from '../lib/translations';

interface ShopProps {
  products: Product[];
  onNavigate: (page: string, params?: any) => void;
  onAddToCart: (product: Product, qty: number) => void;
  onQuickView: (product: Product) => void;
  wishlist: string[];
  onToggleWishlist: (product: Product) => void;
  searchQuery?: string;
  categoryFilter?: string;
  language: Language;
  onBuyNow?: (product: Product, qty: number) => void;
}

export const Shop: React.FC<ShopProps> = ({
  products,
  onNavigate,
  onAddToCart,
  onQuickView,
  wishlist,
  onToggleWishlist,
  searchQuery = '',
  categoryFilter = '',
  language,
  onBuyNow
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryFilter);
  const [priceRange, setPriceRange] = useState<number>(2500);
  const [search, setSearch] = useState<string>(searchQuery);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  // Synchronize incoming search queries and category filters from URL/navigation params
  React.useEffect(() => {
    setSearch(searchQuery);
  }, [searchQuery]);

  React.useEffect(() => {
    setSelectedCategory(categoryFilter);
  }, [categoryFilter]);

  // Categories list
  const categoriesList = [
    "Immunity", "Skin Care", "Hair Care", "Digestion", "Diabetes", "Joint Care", "Women's Health", "Men's Health",
    "Brain & Memory", "Sleep & Stress", "Sexual Wellness", "Liver & Detox", "Heart Health", "Respiratory Care"
  ];

  // Reset filters
  const handleResetFilters = () => {
    setSelectedCategory('');
    setPriceRange(2500);
    setSearch('');
    setSortBy('featured');
  };

  // Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search query filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory) {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Price range filter
    result = result.filter(p => p.price <= priceRange);

    // Sorting
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'alphabetical') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [products, search, selectedCategory, priceRange, sortBy]);

  return (
    <div id="shop-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Title */}
      <div className="border-b border-brand-green-600/10 pb-4 mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-brand-gold-600 font-bold">
            {language === 'hi' ? 'आयुर्वेदिक औषधालय' : 'Apothecary Dispensary'}
          </span>
          <h2 className="font-serif text-3xl font-bold text-brand-green-900">
            {language === 'hi' ? 'आयुर्वेदिक औषधालय स्टोर' : 'Ayurvedic Apothecary Shop'}
          </h2>
          <p className="text-xs text-brand-green-600/70 mt-1">
            {language === 'hi' ? 'हमारे नैदानिक ​​सूत्र, कल्याण टॉनिक और लक्जरी स्किनकेयर बॉटनिकल ब्राउज़ करें।' : 'Browse our clinical formulations, wellness tonics, and luxury skincare botanicals.'}
          </p>
        </div>
        <div className="text-xs text-brand-green-600 font-medium">
          {language === 'hi' 
            ? `कुल ${products.length} में से ${filteredProducts.length} उपचार प्रदर्शित` 
            : `Showing ${filteredProducts.length} of ${products.length} formulations`
          }
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* 1. FILTER SIDEBAR (Desktop) */}
        <div className="hidden lg:block lg:col-span-1 space-y-6 bg-white border border-brand-green-600/5 p-6 rounded-2xl h-fit">
          <div className="flex justify-between items-center pb-4 border-b border-brand-green-600/10">
            <h4 className="font-serif text-sm font-bold text-brand-green-800 flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-brand-gold-600" />
              <span>{language === 'hi' ? 'उपचार परिष्कृत करें' : 'Refine Remedies'}</span>
            </h4>
            <button 
              onClick={handleResetFilters}
              className="text-[10px] text-brand-green-700 hover:text-red-500 font-semibold flex items-center gap-0.5 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{language === 'hi' ? 'रीसेट' : 'Reset'}</span>
            </button>
          </div>

          {/* Search bar inside filters */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-brand-green-800 uppercase tracking-wider">
              {language === 'hi' ? 'दुकान में खोजें' : 'Search Shop'}
            </span>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder={language === 'hi' ? 'दवाइयाँ या सत्व खोजें...' : 'Search compounds...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-3 pr-8 py-2 rounded-xl bg-brand-green-50/50 border border-brand-green-200 text-xs focus:outline-none focus:border-brand-green-700 placeholder-brand-green-600/30"
              />
              <Search className="absolute right-2.5 w-3.5 h-3.5 text-brand-green-600/50" />
            </div>
          </div>

          {/* Categories Radio Filter */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-brand-green-800 uppercase tracking-wider">
              {language === 'hi' ? 'स्वास्थ्य आवश्यकताएं' : 'Health Needs'}
            </span>
            <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
              <label className="flex items-center gap-2 text-xs font-medium text-brand-green-800 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  checked={selectedCategory === ''}
                  onChange={() => setSelectedCategory('')}
                  className="accent-brand-green-700 cursor-pointer"
                />
                <span>{language === 'hi' ? 'सभी आवश्यकताएं' : 'All Needs'}</span>
              </label>
              {categoriesList.map((cat, i) => (
                <label key={i} className="flex items-center gap-2 text-xs font-medium text-brand-green-800 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === cat}
                    onChange={() => setSelectedCategory(cat)}
                    className="accent-brand-green-700 cursor-pointer"
                  />
                  <span>{translateProductAttr(cat, language)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range Slider Filter */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-bold text-brand-green-800 uppercase tracking-wider">
                {language === 'hi' ? 'अधिकतम मूल्य' : 'Maximum Budget'}
              </span>
              <span className="font-mono text-xs font-bold text-brand-green-900">₹{priceRange}</span>
            </div>
            <input
              type="range"
              min="100"
              max="2500"
              step="50"
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full accent-brand-green-700 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-brand-green-600/40 font-mono">
              <span>₹100</span>
              <span>₹2,500</span>
            </div>
          </div>

        </div>

        {/* 2. SHOP DISPLAY AREA */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Sorting / View controls Row */}
          <div className="bg-white border border-brand-green-600/5 p-3 rounded-2xl flex flex-row justify-between items-center gap-4 w-full">
            
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-start">
              {/* Mobile Filter Trigger Button */}
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-brand-green-800 hover:bg-brand-green-900 active:scale-95 text-brand-cream-50 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-brand-gold-400" />
                <span>
                  {language === 'hi' ? 'फ़िल्टर' : 'Filters'} {selectedCategory || priceRange < 2500 ? "•" : ""}
                </span>
              </button>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5 sm:gap-2 max-w-[200px] xs:max-w-none flex-1 sm:flex-initial">
                <span className="text-[10px] sm:text-xs text-brand-green-600 font-medium shrink-0">
                  {language === 'hi' ? 'क्रम:' : 'Sort:'}
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-brand-green-50 border border-brand-green-200/50 rounded-xl px-2.5 py-2 text-[11px] sm:text-xs font-semibold text-brand-green-800 focus:outline-none focus:border-brand-green-700 w-full"
                >
                  <option value="featured">
                    {language === 'hi' ? 'वैदिक सिफारिशें' : 'Vedic Recommendations'}
                  </option>
                  <option value="price-low">
                    {language === 'hi' ? 'मूल्य: निम्न से उच्च' : 'Price: Low to High'}
                  </option>
                  <option value="price-high">
                    {language === 'hi' ? 'मूल्य: उच्च से निम्न' : 'Price: High to Low'}
                  </option>
                  <option value="rating">
                    {language === 'hi' ? 'सर्वोच्च रेटेड उपचार' : 'Top Rated Remedies'}
                  </option>
                  <option value="alphabetical">
                    {language === 'hi' ? 'नाम (A-Z)' : 'Remedy Name (A-Z)'}
                  </option>
                </select>
              </div>
            </div>

            {/* View Mode layout buttons */}
            <div className="hidden sm:flex items-center gap-2">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg border cursor-pointer ${viewMode === 'grid' ? 'bg-brand-green-700 text-brand-cream-100 border-brand-green-700' : 'border-brand-green-200 text-brand-green-600 hover:bg-brand-green-50'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg border cursor-pointer ${viewMode === 'list' ? 'bg-brand-green-700 text-brand-cream-100 border-brand-green-700' : 'border-brand-green-200 text-brand-green-600 hover:bg-brand-green-50'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Empty State */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white border border-brand-green-600/5 rounded-3xl space-y-4">
              <SlidersHorizontal className="w-12 h-12 text-brand-gold-500/55 mx-auto animate-pulse" />
              <h4 className="font-serif text-lg font-bold text-brand-green-800">
                {language === 'hi' ? 'कोई संतुलित उपचार नहीं मिला' : 'No Balancing Remedies Found'}
              </h4>
              <p className="text-xs text-brand-green-600/70 max-w-sm mx-auto leading-relaxed">
                {language === 'hi' 
                  ? 'हमें आपके सटीक फ़िल्टर से मेल खाने वाला कोई नुस्खा नहीं मिला। प्रश्नों को साफ़ करने या व्यापक मूल्य सीमा निर्धारित करने का प्रयास करें।' 
                  : "We couldn't find any formulations matching your exact filters. Try clearing queries or setting a broader price range."
                }
              </p>
              <button 
                onClick={handleResetFilters}
                className="bg-brand-green-700 hover:bg-brand-green-800 text-brand-cream-100 text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer"
              >
                {language === 'hi' ? 'फ़िल्टर हटाएं और सभी देखें' : 'Clear Filters & View All'}
              </button>
            </div>
          ) : (
            /* Products Grid or List */
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6" 
              : "space-y-4"
            }>
              {filteredProducts.map(p => {
                const isWishlisted = wishlist.includes(p.id);

                if (viewMode === 'grid') {
                  return (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onNavigate={onNavigate}
                      onAddToCart={onAddToCart}
                      onQuickView={onQuickView}
                      isWishlisted={isWishlisted}
                      onToggleWishlist={onToggleWishlist}
                      onBuyNow={onBuyNow}
                    />
                  );
                } else {
                  // List Layout
                  const discountPercent = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
                  return (
                    <div key={p.id} className="bg-white border border-brand-green-600/5 rounded-2xl p-4 flex flex-col sm:flex-row gap-5 hover:shadow-md transition-shadow">
                      <div 
                        className="w-full sm:w-44 aspect-square rounded-xl overflow-hidden bg-brand-green-50/20 relative cursor-pointer flex-shrink-0"
                        onClick={() => onNavigate('product', { id: p.id })}
                      >
                        <img src={p.mainImage} alt={p.name} className="w-full h-full object-cover" />
                        {discountPercent > 0 && (
                          <span className="absolute top-2 left-2 bg-brand-gold-500 text-brand-green-950 text-[9px] font-bold px-1.5 py-0.5 rounded">
                            {discountPercent}% OFF
                          </span>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase text-brand-gold-700">
                            {translateProductAttr(p.category, language)}
                          </span>
                          <h4 
                            onClick={() => onNavigate('product', { id: p.id })}
                            className="font-serif text-base font-bold text-brand-green-900 hover:text-brand-gold-600 cursor-pointer"
                          >
                            {p.name}
                          </h4>
                          <p className="text-xs text-brand-green-800/80 leading-relaxed line-clamp-2">{p.description}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pt-4 border-t border-brand-green-600/5">
                          <div className="flex items-baseline gap-2 font-serif text-sm">
                            <span className="font-bold text-brand-green-900 text-lg">₹{p.price}</span>
                            {p.originalPrice > p.price && (
                              <span className="text-xs text-brand-green-600/50 line-through">₹{p.originalPrice}</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => onQuickView(p)}
                              className="px-3 py-1.5 rounded-lg border border-brand-green-600/20 text-brand-green-800 text-xs font-bold hover:bg-brand-green-50 cursor-pointer"
                            >
                              {t('btn_quick_view', language)}
                            </button>
                            <button
                              onClick={() => onAddToCart(p, 1)}
                              className="px-4 py-1.5 bg-brand-green-700 hover:bg-brand-green-800 text-brand-cream-100 rounded-lg text-xs font-bold cursor-pointer"
                            >
                              {t('btn_add_to_cart', language)}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          )}

        </div>

      </div>

      {/* Mobile filter sliding drawer */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFilterOpen(false)}
              className="fixed inset-0 bg-brand-green-950/60 backdrop-blur-xs z-50 lg:hidden"
            />

            {/* Drawer container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col lg:hidden border-l border-brand-green-600/10"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-brand-green-600/10 flex justify-between items-center bg-brand-green-950 text-brand-cream-100">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-brand-gold-400" />
                  <span className="font-serif font-bold text-base">
                    {language === 'hi' ? 'फ़िल्टर उपचार' : 'Filter Remedies'}
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-brand-cream-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body - Scrollable filters list */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                
                {/* Search Bar */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-brand-green-800 uppercase tracking-wider block">
                    {language === 'hi' ? 'दवाइयाँ खोजें' : 'Search Compounds'}
                  </span>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder={language === 'hi' ? 'नुस्खे खोजें...' : 'Search remedies...'}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-3 pr-8 py-3 rounded-xl bg-brand-green-50/50 border border-brand-green-200 text-xs focus:outline-none focus:border-brand-green-700 placeholder-brand-green-600/30"
                    />
                    <Search className="absolute right-3 w-4 h-4 text-brand-green-600/50" />
                  </div>
                </div>

                {/* Categories Radio Filter */}
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-brand-green-800 uppercase tracking-wider block">
                    {language === 'hi' ? 'स्वास्थ्य आवश्यकताएं' : 'Health Needs'}
                  </span>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    <label className="flex items-center gap-3 text-xs font-semibold text-brand-green-800 cursor-pointer p-2 rounded-lg hover:bg-brand-green-50/50">
                      <input
                        type="radio"
                        name="mobile-category"
                        checked={selectedCategory === ''}
                        onChange={() => setSelectedCategory('')}
                        className="w-4 h-4 accent-brand-green-700 cursor-pointer"
                      />
                      <span>{language === 'hi' ? 'सभी आवश्यकताएं' : 'All Needs'}</span>
                    </label>
                    {categoriesList.map((cat, i) => (
                      <label key={i} className="flex items-center gap-3 text-xs font-semibold text-brand-green-800 cursor-pointer p-2 rounded-lg hover:bg-brand-green-50/50">
                        <input
                          type="radio"
                          name="mobile-category"
                          checked={selectedCategory === cat}
                          onChange={() => setSelectedCategory(cat)}
                          className="w-4 h-4 accent-brand-green-700 cursor-pointer"
                        />
                        <span>{translateProductAttr(cat, language)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range Slider Filter */}
                <div className="space-y-3 pt-4 border-t border-brand-green-600/5">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-bold text-brand-green-800 uppercase tracking-wider block">
                      {language === 'hi' ? 'अधिकतम मूल्य' : 'Maximum Budget'}
                    </span>
                    <span className="font-mono text-sm font-bold text-brand-green-900">₹{priceRange}</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="2500"
                    step="50"
                    value={priceRange}
                    onChange={(e) => setPriceRange(Number(e.target.value))}
                    className="w-full h-2 bg-brand-green-100 rounded-lg appearance-none accent-brand-green-700 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-brand-green-600/50 font-mono font-medium">
                    <span>₹100</span>
                    <span>₹2,500</span>
                  </div>
                </div>

              </div>

              {/* Drawer Footer Buttons */}
              <div className="p-4 border-t border-brand-green-600/10 bg-brand-cream-50/50 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    handleResetFilters();
                  }}
                  className="flex-1 py-3 border border-brand-green-800/20 hover:bg-brand-green-50 text-brand-green-800 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
                >
                  {language === 'hi' ? 'सभी रीसेट करें' : 'Reset All'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="flex-1 py-3 bg-brand-green-800 hover:bg-brand-green-900 text-brand-cream-100 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer text-center shadow-md shadow-brand-green-800/15"
                >
                  {language === 'hi' ? `लागू करें (${filteredProducts.length})` : `Apply (${filteredProducts.length})`}
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};
