/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Award, Star, BookOpen, Quote, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Blog } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Language, t, translateProductAttr } from '../lib/translations';

interface CustomerHomeProps {
  products: Product[];
  blogs: Blog[];
  onNavigate: (page: string, params?: any) => void;
  onOpenConsultant: () => void;
  onAddToCart: (product: Product, qty: number) => void;
  onQuickView: (product: Product) => void;
  wishlist: string[];
  onToggleWishlist: (product: Product) => void;
  onAddToCompare: (product: Product) => void;
  compareList: Product[];
  language: Language;
}

const heroSlides = [
  {
    id: "slide-1",
    subtitle: "Restoring Ayurvedic Purity",
    title: "Precious Remedies For Flawless Daily Vitality.",
    description: "We handcraft small-batch, AYUSH certified organic formulations. Utilizing high-altitude Kashmiri Saffron, organic Ghee, and wild mountain forest honey according to sacred Vedic scripts.",
    bgImage: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=1200",
    actionText: "Shop Now",
    actionLink: "product",
    actionParams: { id: "prod-1" },
    productId: "prod-1",
    productName: "Chyawanprash Golden Saffron",
    productDesc: "Highest-Rated Seasonal Immunity Tonic",
    productPrice: "₹850",
    productRating: 4.9,
    productImage: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "slide-2",
    subtitle: "Ancient Wisdom, Peak Stamina",
    title: "BVLife Himalayan Shilajeet Gold Resin",
    description: "100% pure BVLife Himalayan Shilajeet resin purified via classical Ayurvedic Shodhana methods. Infused with Swarna Bhasma (24K Gold) and Safed Musli for cellular energy and maximum physical vitality.",
    bgImage: "https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&q=80&w=1200",
    actionText: "Shop Now",
    actionLink: "product",
    actionParams: { id: "prod-11" },
    productId: "prod-11",
    productName: "BVLife Shilajeet Gold Resin",
    productDesc: "Purified High-Altitude Strength Tonic",
    productPrice: "₹1,450",
    productRating: 4.9,
    productImage: "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "slide-3",
    subtitle: "Saffron Skin Alchemy",
    title: "Kumkumadi Radiance Face Elixir",
    description: "A legendary night beauty oil infused with Kashmiri Saffron and goat milk. Preserved in micro-batches to restore youthfulness, heal pigmentation, and brighten dull skin complexions.",
    bgImage: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&q=80&w=1200",
    actionText: "Shop Now",
    actionLink: "product",
    actionParams: { id: "prod-3" },
    productId: "prod-3",
    productName: "Kumkumadi Radiance Elixir",
    productDesc: "Saffron & Sandalwood Brightening Oil",
    productPrice: "₹1,890",
    productRating: 4.9,
    productImage: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&q=80&w=600"
  }
];

export const CustomerHome: React.FC<CustomerHomeProps> = ({
  products,
  blogs,
  onNavigate,
  onOpenConsultant,
  onAddToCart,
  onQuickView,
  wishlist,
  onToggleWishlist,
  onAddToCompare,
  compareList,
  language
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    } else if (isRightSwipe) {
      setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const featuredProds = products.filter(p => p.featured).slice(0, 4);
  const bestSellers = products.filter(p => p.bestSeller).slice(0, 4);

  const categories = [
    { name: "Immunity", count: 12, img: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=200" },
    { name: "Skin Care", count: 8, img: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&q=80&w=200" },
    { name: "Digestion", count: 15, img: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=200" },
    { name: "Hair Care", count: 9, img: "https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=200" },
    { name: "Oils", count: 14, img: "https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&q=80&w=200" },
    { name: "Brain & Memory", count: 6, img: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=200" },
    { name: "Sleep & Stress", count: 5, img: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=200" },
    { name: "Sexual Wellness", count: 4, img: "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&q=80&w=200" }
  ];

  const translatedHeroSlides = heroSlides.map((slide, index) => {
    const sIndex = index + 1;
    return {
      ...slide,
      subtitle: t(`hero_s${sIndex}_subtitle` as any, language) || slide.subtitle,
      title: t(`hero_s${sIndex}_title` as any, language) || slide.title,
      description: t(`hero_s${sIndex}_desc` as any, language) || slide.description,
      actionText: t(`hero_s${sIndex}_action` as any, language) || slide.actionText,
      productName: translateProductAttr(slide.productName, language),
      productDesc: t(`hero_s${sIndex}_prod_desc` as any, language) || slide.productDesc,
    };
  });

  const translatedCategories = categories.map(cat => {
    const cleanKey = cat.name.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_');
    const key = `cat_${cleanKey}`;
    return {
      ...cat,
      originalName: cat.name,
      name: t(key as any, language) || cat.name
    };
  });

  return (
    <div id="customer-home-page" className="space-y-16 pb-16">
      
      {/* 1. HERO BANNER - Luxury Single-focused E-Commerce layout with absolutely no background image */}
      <section 
        id="hero-banner" 
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="relative min-h-[440px] md:min-h-[580px] bg-gradient-to-br from-brand-green-900 via-brand-green-950 to-[#030e09] overflow-hidden flex items-center py-10 md:py-16 lg:py-24"
      >
        
        {/* Luxury subtle background glow grids */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,163,89,0.08)_0%,transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(212,163,89,0.05)_0%,transparent_40%)] pointer-events-none" />

        {/* Left Side Scroller Button - Visible only on tablet & desktop to avoid mobile clutter */}
        <button 
          onClick={() => setCurrentSlide((prev) => (prev - 1 + translatedHeroSlides.length) % translatedHeroSlides.length)}
          className="hidden md:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 p-2.5 lg:p-3.5 rounded-full bg-brand-green-950/45 hover:bg-brand-gold-500 hover:text-brand-green-950 text-brand-cream-100 backdrop-blur-md transition-all duration-300 border border-brand-cream-100/10 hover:border-brand-gold-400/30 hover:scale-110 active:scale-95 cursor-pointer shadow-xl group"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6 group-hover:-translate-x-0.5 transition-transform duration-300" />
        </button>

        {/* Right Side Scroller Button - Visible only on tablet & desktop */}
        <button 
          onClick={() => setCurrentSlide((prev) => (prev + 1) % translatedHeroSlides.length)}
          className="hidden md:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 p-2.5 lg:p-3.5 rounded-full bg-brand-green-950/45 hover:bg-brand-gold-500 hover:text-brand-green-950 text-brand-cream-100 backdrop-blur-md transition-all duration-300 border border-brand-cream-100/10 hover:border-brand-gold-400/30 hover:scale-110 active:scale-95 cursor-pointer shadow-xl group"
          aria-label="Next Slide"
        >
          <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6 group-hover:translate-x-0.5 transition-transform duration-300" />
        </button>

        {/* Split Content Grid - Premium animated layout */}
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center"
            >
              
              {/* Left/Top Column: Text & CTA */}
              <div className="lg:col-span-7 text-left space-y-4 md:space-y-6 text-brand-cream-50 flex flex-col items-start justify-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-gold-500/10 border border-brand-gold-500/30 rounded-full text-brand-gold-300 text-[10px] md:text-xs font-semibold uppercase tracking-wider backdrop-blur-xs">
                  <Sparkles className="w-3 h-3 text-brand-gold-400 animate-pulse" />
                  <span>{translatedHeroSlides[currentSlide].subtitle}</span>
                </div>
                
                <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-brand-cream-50 leading-tight tracking-tight drop-shadow-md">
                  {translatedHeroSlides[currentSlide].title}
                </h2>
                
                <p className="text-[12px] sm:text-xs md:text-sm lg:text-base text-brand-cream-200/90 leading-relaxed max-w-2xl min-h-[44px] md:min-h-[52px]">
                  {translatedHeroSlides[currentSlide].description}
                </p>

                {/* High-converting luxury Trust Badges built right into the hero banner */}
                <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[10px] sm:text-xs text-brand-gold-300/85 font-medium pt-1">
                  <span className="flex items-center gap-1 bg-brand-gold-500/5 px-2 py-0.5 rounded border border-brand-gold-500/10">
                    <Award className="w-3.5 h-3.5 text-brand-gold-400" />
                    AYUSH Certified Purity
                  </span>
                  <span className="flex items-center gap-1 bg-brand-gold-500/5 px-2 py-0.5 rounded border border-brand-gold-500/10">
                    <Star className="w-3.5 h-3.5 text-brand-gold-400 fill-brand-gold-400" />
                    4.9+ Rated Remedies
                  </span>
                  <span className="flex items-center gap-1 bg-brand-gold-500/5 px-2 py-0.5 rounded border border-brand-gold-500/10">
                    🌱 Kashmiri Saffron & Organic Ghee
                  </span>
                </div>

                {/* CTAs rendered side-by-side on all screens with precise tap targets */}
                <div className="flex flex-row gap-3 pt-2 sm:pt-4 justify-start items-center w-full max-w-md">
                  <button 
                    onClick={() => {
                      onNavigate('product', { id: translatedHeroSlides[currentSlide].productId });
                    }}
                    className="flex-1 sm:flex-initial bg-brand-gold-400 hover:bg-brand-gold-500 text-brand-green-950 font-black px-5 sm:px-8 py-3 rounded-xl transition-all shadow-md hover:shadow-brand-gold-500/15 flex items-center justify-center gap-2 cursor-pointer text-xs md:text-sm active:scale-95 whitespace-nowrap border border-brand-gold-300/30"
                  >
                    <span>{translatedHeroSlides[currentSlide].actionText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  
                  <button 
                    onClick={onOpenConsultant}
                    className="flex-1 sm:flex-initial bg-brand-green-950/80 backdrop-blur-xs border border-brand-cream-300/20 hover:bg-brand-cream-100/10 text-brand-cream-100 font-extrabold px-5 sm:px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-xs md:text-sm active:scale-95 whitespace-nowrap"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-brand-gold-400 animate-pulse" />
                    <span>{t('btnAskAcharya', language)}</span>
                  </button>
                </div>
              </div>

              {/* Right/Bottom Column: Beautifully Clean Product Image Showcase */}
              <div className="lg:col-span-5 flex justify-center items-center relative w-full pt-4 lg:pt-0">
                {/* Elegant spotlight glow behind the product */}
                <div className="absolute w-44 h-44 sm:w-60 sm:h-60 md:w-72 md:h-72 rounded-full bg-brand-gold-500/10 blur-3xl pointer-events-none" />
                
                {/* Soft decorative golden ring background to elevate the product */}
                <div className="absolute w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 rounded-full border border-brand-gold-400/10 pointer-events-none animate-[spin_40s_linear_infinite]" />
                
                <div 
                  onClick={() => onNavigate('product', { id: translatedHeroSlides[currentSlide].productId })}
                  className="relative aspect-square max-w-[180px] sm:max-w-[220px] md:max-w-[320px] lg:max-w-[360px] w-full flex items-center justify-center cursor-pointer group transition-all duration-500"
                >
                  <img 
                    src={translatedHeroSlides[currentSlide].productImage} 
                    alt={translatedHeroSlides[currentSlide].productName} 
                    className="max-h-[140px] sm:max-h-[180px] md:max-h-[280px] lg:max-h-[340px] object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)] md:drop-shadow-[0_20px_45px_rgba(0,0,0,0.5)] transition-transform duration-700 group-hover:scale-105 group-hover:rotate-1"
                    referrerPolicy="no-referrer"
                  />

                  {/* Premium Floating Micro Badge - Quick View & Shop */}
                  <div className="absolute bottom-2 right-2 bg-brand-green-950/80 border border-brand-gold-400/20 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] text-brand-gold-300 font-bold opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-md flex items-center gap-1">
                    <span>View Product</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>

            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Slide Indicator Dots */}
        <div className="absolute bottom-4 md:bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
          {translatedHeroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className="group flex items-center focus:outline-none cursor-pointer"
              aria-label={`Go to slide ${i + 1}`}
            >
              <span className={`h-1.5 md:h-2 rounded-full transition-all duration-300 ${currentSlide === i ? 'bg-brand-gold-400 w-6 md:w-8 ring-2 md:ring-4 ring-brand-gold-500/20' : 'bg-brand-cream-100/40 w-1.5 md:w-2 hover:bg-brand-cream-100/70'}`} />
            </button>
          ))}
        </div>
      </section>

      {/* 2. CATEGORY BROWSE SECTION */}
      <section id="category-browse" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-12">
          <span className="text-xs uppercase tracking-widest text-brand-gold-600 font-bold">{t('section_cat_subtitle', language)}</span>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-brand-green-900">{t('section_cat_title', language)}</h3>
          <p className="text-xs text-brand-green-600/70 max-w-md mx-auto">{t('section_cat_desc', language)}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-5 justify-center">
          {translatedCategories.map((cat, i) => (
            <div 
              key={i}
              onClick={() => onNavigate('shop', { category: cat.originalName })}
              className="group bg-white border border-brand-green-600/5 hover:border-brand-green-600/15 p-5 rounded-2xl text-center cursor-pointer hover:shadow-md transition-all duration-300"
            >
              <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 border-2 border-brand-cream-200 group-hover:border-brand-gold-500 transition-colors">
                <img src={cat.img} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <h4 className="font-serif text-sm font-bold text-brand-green-800 group-hover:text-brand-gold-600 transition-colors">{cat.name}</h4>
              <p className="text-[10px] text-brand-green-600/50 mt-0.5">{cat.count}+ {t('formulations_suffix', language)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS GRID */}
      <section id="featured-products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-baseline gap-4 mb-10 border-b border-brand-green-600/10 pb-5">
          <div>
            <span className="text-xs uppercase tracking-widest text-brand-gold-600 font-bold">{t('section_feat_subtitle', language)}</span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-brand-green-900">{t('section_feat_title', language)}</h3>
          </div>
          <button 
            onClick={() => onNavigate('shop', { featured: true })} 
            className="text-sm text-brand-green-800 hover:text-brand-gold-600 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>{t('section_feat_browse', language)}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {featuredProds.map(p => {
            const isWishlisted = wishlist.includes(p.id);
            const isCompared = compareList.some(item => item.id === p.id);
            return (
              <ProductCard
                key={p.id}
                product={p}
                onNavigate={onNavigate}
                onAddToCart={onAddToCart}
                onQuickView={onQuickView}
                isWishlisted={isWishlisted}
                onToggleWishlist={onToggleWishlist}
                onAddToCompare={onAddToCompare}
                isCompared={isCompared}
                language={language}
              />
            );
          })}
        </div>
      </section>

      {/* 3.5. TOP SELLING PRODUCTS SECTION */}
      <section id="top-selling-products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-baseline gap-4 mb-10 border-b border-brand-green-600/10 pb-5">
          <div>
            <span className="text-xs uppercase tracking-widest text-brand-gold-600 font-bold">{t('section_top_subtitle', language)}</span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-brand-green-900">{t('section_top_title', language)}</h3>
          </div>
          <button 
            onClick={() => onNavigate('shop', { bestSeller: true })} 
            className="text-sm text-brand-green-800 hover:text-brand-gold-600 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>{t('section_top_browse', language)}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {bestSellers.map(p => {
            const isWishlisted = wishlist.includes(p.id);
            const isCompared = compareList.some(item => item.id === p.id);
            return (
              <ProductCard
                key={p.id}
                product={p}
                onNavigate={onNavigate}
                onAddToCart={onAddToCart}
                onQuickView={onQuickView}
                isWishlisted={isWishlisted}
                onToggleWishlist={onToggleWishlist}
                onAddToCompare={onAddToCompare}
                isCompared={isCompared}
                language={language}
              />
            );
          })}
        </div>
      </section>
      <section id="exclusive-offers" className="bg-brand-cream-100/50 py-16 border-t border-b border-brand-green-600/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs uppercase tracking-widest text-brand-gold-700 font-bold bg-brand-gold-500/10 px-3 py-1 rounded-md">{t('exclusive_offer_tag', language)}</span>
            <h3 className="font-serif text-3xl font-bold text-brand-green-900 leading-tight">
              {t('exclusive_offer_title', language)} <br/>
              <span className="text-brand-gold-600 font-sans italic font-normal text-2xl">{t('exclusive_offer_subtitle', language)}</span>
            </h3>
            <p className="text-sm text-brand-green-800/80 leading-relaxed">
              {t('exclusive_offer_desc', language)}
            </p>
            <div className="flex gap-6 items-baseline font-serif">
              <span className="text-3xl font-bold text-brand-green-900">₹1,390</span>
              <span className="text-sm text-brand-green-600/50 line-through">₹1,830</span>
              <span className="text-xs font-sans text-brand-gold-700 font-bold uppercase">{t('exclusive_offer_save', language)}</span>
            </div>
            <div>
              <button 
                onClick={() => onNavigate('shop')}
                className="bg-brand-green-700 hover:bg-brand-green-800 text-brand-cream-100 font-bold px-8 py-3.5 rounded-xl shadow-md transition-colors cursor-pointer"
              >
                {t('exclusive_offer_btn', language)}
              </button>
            </div>
          </div>
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&q=80&w=600" 
              alt="Ayurvedic kit compilation" 
              className="rounded-2xl shadow-xl w-full max-h-[380px] object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* 5. USER TESTIMONIALS */}
      <section id="user-testimonials" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-12">
          <Award className="w-8 h-8 text-brand-gold-500 mx-auto animate-pulse" />
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-brand-green-900">{t('section_test_subtitle', language)}</h3>
          <p className="text-xs text-brand-green-600/70">{t('section_test_title', language)}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-white border border-brand-green-600/5 p-6 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-4">
              <div className="flex text-amber-400 gap-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-xs text-brand-green-800 italic leading-relaxed">
                {t('test_1_comment', language)}
              </p>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-brand-green-600/5 mt-4">
              <div className="w-10 h-10 rounded-full bg-brand-gold-500/20 text-brand-green-800 font-serif flex items-center justify-center font-bold text-sm">AN</div>
              <div>
                <h5 className="font-serif text-xs font-bold text-brand-green-900">{t('test_1_author', language)}</h5>
                <span className="text-[10px] text-brand-green-600/50 uppercase font-semibold">{t('test_1_role', language)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-brand-green-600/5 p-6 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-4">
              <div className="flex text-amber-400 gap-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-xs text-brand-green-800 italic leading-relaxed">
                {t('test_2_comment', language)}
              </p>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-brand-green-600/5 mt-4">
              <div className="w-10 h-10 rounded-full bg-brand-gold-500/20 text-brand-green-800 font-serif flex items-center justify-center font-bold text-sm">KS</div>
              <div>
                <h5 className="font-serif text-xs font-bold text-brand-green-900">{t('test_2_author', language)}</h5>
                <span className="text-[10px] text-brand-green-600/50 uppercase font-semibold">{t('test_2_role', language)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-brand-green-600/5 p-6 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-4">
              <div className="flex text-amber-400 gap-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-xs text-brand-green-800 italic leading-relaxed">
                {t('test_3_comment', language)}
              </p>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-brand-green-600/5 mt-4">
              <div className="w-10 h-10 rounded-full bg-brand-gold-500/20 text-brand-green-800 font-serif flex items-center justify-center font-bold text-sm">SR</div>
              <div>
                <h5 className="font-serif text-xs font-bold text-brand-green-900">{t('test_3_author', language)}</h5>
                <span className="text-[10px] text-brand-green-600/50 uppercase font-semibold">{t('test_3_role', language)}</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 6. RECENT WELLNESS BLOGS */}
      <section id="recent-blogs" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-baseline gap-4 mb-10 border-b border-brand-green-600/10 pb-5">
          <div>
            <span className="text-xs uppercase tracking-widest text-brand-gold-600 font-bold">{t('section_blog_subtitle', language)}</span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-brand-green-900">{t('section_blog_title', language)}</h3>
          </div>
          <button 
            onClick={() => onNavigate('static', { page: 'blog' })} 
            className="text-sm text-brand-green-800 hover:text-brand-gold-600 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>{t('section_blog_browse', language)}</span>
            <BookOpen className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {blogs.map((blog, idx) => (
            <div key={blog.id} className="group flex flex-col sm:flex-row gap-5 bg-white p-4 rounded-2xl border border-brand-green-600/5 hover:shadow-lg transition-all">
              <div className="w-full sm:w-1/3 aspect-[4/3] rounded-xl overflow-hidden flex-shrink-0">
                <img src={blog.image} alt={blog.title} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" />
              </div>
              <div className="flex flex-col justify-between py-1">
                <div className="space-y-1.5">
                  <div className="flex gap-2 text-[10px] text-brand-gold-700 font-bold uppercase">
                    {blog.categories.map((c, i) => <span key={i}>{c}</span>)}
                  </div>
                  <h4 
                    onClick={() => onNavigate('static', { page: 'blog-post', id: blog.id })}
                    className="font-serif text-sm font-bold text-brand-green-900 hover:text-brand-gold-600 cursor-pointer line-clamp-2 leading-snug"
                  >
                    {blog.title}
                  </h4>
                  <p className="text-xs text-brand-green-800/80 line-clamp-2 leading-relaxed">
                    {blog.summary}
                  </p>
                </div>
                <div className="flex justify-between items-center text-[10px] text-brand-green-600/50 pt-2 border-t border-brand-green-600/5">
                  <span>By {blog.author.split(',')[0]}</span>
                  <span>{blog.readTime}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
