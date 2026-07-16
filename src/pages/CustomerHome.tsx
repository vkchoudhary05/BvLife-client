
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Sparkles, 
  Award, 
  Star, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Leaf,
  Shield,
  Clock,
  Users,
  ShoppingBag,
  Droplets,
  Zap,
  HeartPulse
} from 'lucide-react';
import { Product, Blog } from '../types';
import { ProductCard } from '../components/ProductCard';
import productImage from "@/assets/banner.png"
import productImage2 from "@/assets/banner.png"
import productImage3 from "@/assets/banner.png"

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
}

const heroSlides = [
{
    id: "slide-1",
    productImage: productImage,
    productId: "prod-2",
  },
{
    id: "slide-2",
    productImage: productImage2,
    productId: "prod-12",
  },
{
    id: "slide-3",
    productImage: productImage3,
    productId: "prod-4",
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
  compareList
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const SLIDE_DURATION = 6000;

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [isPaused]);

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

  const slide = heroSlides[currentSlide];

  const handleHeroClick = () => {
    window.location.href = '/shop';
  };

  return (
    <div id="customer-home-page" className="space-y-16 pb-16">

      {/* ===== HERO BANNER — Full Image Background, Reduced Height ===== */}
      <section
        id="hero-banner"
        onClick={handleHeroClick}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
             className="relative w-full h-[200px] xs:h-[280px] sm:h-[350px] md:h-[420px] lg:h-[500px] xl:h-[560px] overflow-hidden flex items-center justify-center cursor-pointer group"
      >
        <div className="absolute inset-0">
          <img
            src={slide.productImage}
            alt="Product"
            className="w-full h-full object-cover object-center"
          />
          {/* Dark overlay for better visibility of navigation buttons */}
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* ===== NAVIGATION BUTTONS ===== */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
          }}
          className="absolute left-2 xs:left-3 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 z-30 p-1.5 xs:p-2 sm:p-2.5 md:p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm border border-white/20 hover:border-white/40 text-white transition-all duration-300 hover:scale-110"
        >
          <ChevronLeft className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
          }}
          className="absolute right-2 xs:right-3 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 z-30 p-1.5 xs:p-2 sm:p-2.5 md:p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm border border-white/20 hover:border-white/40 text-white transition-all duration-300 hover:scale-110"
        >
          <ChevronRight className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
        </button>

        {/* ===== SLIDE INDICATOR DOTS ===== */}
        <div className="absolute bottom-2 xs:bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-1.5 xs:gap-2">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSlide(i);
              }}
              className={`transition-all duration-300 rounded-full ${
                currentSlide === i 
                  ? 'bg-white w-4 xs:w-5 sm:w-6 md:w-8 h-1.5 xs:h-2' 
                  : 'bg-white/40 hover:bg-white/60 w-1.5 xs:w-2 h-1.5 xs:h-2'
              }`}
            />
          ))}
        </div>
      </section>

      {/* 2. CATEGORY BROWSE SECTION */}
      <section id="category-browse" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-12">
          <span className="text-xs uppercase tracking-widest text-brand-gold-600 font-bold">Organic Heritage</span>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-brand-green-900">Shop Organic Remedies By Need</h3>
          <p className="text-xs text-brand-green-600/70 max-w-md mx-auto">Target biological imbalances using pure herbs extracted ethically.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-5 justify-center">
          {categories.map((cat, i) => (
            <div
              key={i}
              onClick={() => onNavigate('shop', { category: cat.name })}
              className="group bg-white border border-brand-green-600/5 hover:border-brand-green-600/15 p-5 rounded-2xl text-center cursor-pointer hover:shadow-md transition-all duration-300"
            >
              <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 border-2 border-brand-cream-200 group-hover:border-brand-gold-500 transition-colors">
                <img src={cat.img} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <h4 className="font-serif text-sm font-bold text-brand-green-800 group-hover:text-brand-gold-600 transition-colors">{cat.name}</h4>
              <p className="text-[10px] text-brand-green-600/50 mt-0.5">{cat.count}+ Formulations</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS GRID */}
      <section id="featured-products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-baseline gap-4 mb-10 border-b border-brand-green-600/10 pb-5">
          <div>
            <span className="text-xs uppercase tracking-widest text-brand-gold-600 font-bold">Apothecary Curations</span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-brand-green-900">Our Premium Recommendations</h3>
          </div>
          <button
            onClick={() => onNavigate('shop', { featured: true })}
            className="text-sm text-brand-green-800 hover:text-brand-gold-600 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Browse Recommendations</span>
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
              />
            );
          })}
        </div>
      </section>

      {/* 3.5. TOP SELLING PRODUCTS SECTION */}
      <section id="top-selling-products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-baseline gap-4 mb-10 border-b border-brand-green-600/10 pb-5">
          <div>
            <span className="text-xs uppercase tracking-widest text-brand-gold-600 font-bold">Vedic Favorites</span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-brand-green-900">Top Selling Products</h3>
          </div>
          <button
            onClick={() => onNavigate('shop', { bestSeller: true })}
            className="text-sm text-brand-green-800 hover:text-brand-gold-600 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Browse Best Sellers</span>
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
              />
            );
          })}
        </div>
      </section>

      {/* 4. EXCLUSIVE OFFERS */}
      <section id="exclusive-offers" className="bg-brand-cream-100/50 py-16 border-t border-b border-brand-green-600/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs uppercase tracking-widest text-brand-gold-700 font-bold bg-brand-gold-500/10 px-3 py-1 rounded-md">Seasonal Compound Offer</span>
            <h3 className="font-serif text-3xl font-bold text-brand-green-900 leading-tight">
              Aacharya Recharging Trio <br/>
              <span className="text-brand-gold-600 font-sans italic font-normal text-2xl">Complete 30-Day Rejuvenation Kit</span>
            </h3>
            <p className="text-sm text-brand-green-800/80 leading-relaxed">
              Consisting of Golden Saffron Chyawanprash (1 jar), stress-busting Pure Ashwagandha KSM-66 capsules (1 pack), and colon digestive-cleansing Triphala powder (1 box). Synergized together to optimize cellular recovery, digest stomach toxins (Ama), and eliminate brain fog.
            </p>
            <div className="flex gap-6 items-baseline font-serif">
              <span className="text-3xl font-bold text-brand-green-900">₹1,390</span>
              <span className="text-sm text-brand-green-600/50 line-through">₹1,830</span>
              <span className="text-xs font-sans text-brand-gold-700 font-bold">SAVE ₹440 INSTANTLY</span>
            </div>
            <div>
              <button
                onClick={() => onNavigate('shop')}
                className="bg-brand-green-700 hover:bg-brand-green-800 text-brand-cream-100 font-bold px-8 py-3.5 rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Secure Seasonal Compound Offer
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
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-brand-green-900">Over 50,000 Lives Revitalized</h3>
          <p className="text-xs text-brand-green-600/70">Verified logs of customers who integrated Vedic health into daily routines.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white border border-brand-green-600/5 p-6 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-4">
              <div className="flex text-amber-400 gap-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-xs text-brand-green-800 italic leading-relaxed">
                "The Kumkumadi face elixir is pure gold! Yes, the pricing feels premium, but my dark circles and pigmentation marks have completely faded in less than a month. Pure bliss!"
              </p>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-brand-green-600/5 mt-4">
              <div className="w-10 h-10 rounded-full bg-brand-gold-500/20 text-brand-green-800 font-serif flex items-center justify-center font-bold text-sm">AN</div>
              <div>
                <h5 className="font-serif text-xs font-bold text-brand-green-900">Aradhana Nair</h5>
                <span className="text-[10px] text-brand-green-600/50 uppercase font-semibold">Verified Practitioner</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-brand-green-600/5 p-6 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-4">
              <div className="flex text-amber-400 gap-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-xs text-brand-green-800 italic leading-relaxed">
                "As a software engineer, constant coding burnt out my energy. Ashwagandha root capsules changed my sleep entirely. I wake up completely rested. Truly the gold-standard adaptogen."
              </p>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-brand-green-600/5 mt-4">
              <div className="w-10 h-10 rounded-full bg-brand-gold-500/20 text-brand-green-800 font-serif flex items-center justify-center font-bold text-sm">KS</div>
              <div>
                <h5 className="font-serif text-xs font-bold text-brand-green-900">Kartik Sharma</h5>
                <span className="text-[10px] text-brand-green-600/50 uppercase font-semibold">Verified Tech Lead</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-brand-green-600/5 p-6 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-4">
              <div className="flex text-amber-400 gap-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-xs text-brand-green-800 italic leading-relaxed">
                "I suffered chronic bloating for 5 years. BVLife Triphala powder cured my digestive agni in exactly 12 days. I take it before bedtime and felt lighter immediately!"
              </p>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-brand-green-600/5 mt-4">
              <div className="w-10 h-10 rounded-full bg-brand-gold-500/20 text-brand-green-800 font-serif flex items-center justify-center font-bold text-sm">SR</div>
              <div>
                <h5 className="font-serif text-xs font-bold text-brand-green-900">Samyuktha Reddy</h5>
                <span className="text-[10px] text-brand-green-600/50 uppercase font-semibold">Verified Yoga Acharya</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. RECENT WELLNESS BLOGS */}
      <section id="recent-blogs" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-baseline gap-4 mb-10 border-b border-brand-green-600/10 pb-5">
          <div>
            <span className="text-xs uppercase tracking-widest text-brand-gold-600 font-bold">Vedic Chronicles</span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-brand-green-900">Ayurvedic Chronicles & Living</h3>
          </div>
          <button
            onClick={() => onNavigate('static', { page: 'blog' })}
            className="text-sm text-brand-green-800 hover:text-brand-gold-600 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Read All Chronicles</span>
            <BookOpen className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {blogs.map((blog) => (
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


      
      {/* Floating Action Button for AI Acharya Consultant - Highly Compact, Elegant & Eye-catching */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] pointer-events-none">
        {/* Inject CSS styles directly for perfectly smooth, non-blurry, jitter-free floating */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes premium-acharya-float {
            0%, 100% {
              transform: translateY(0) translateZ(0);
            }
            50% {
              transform: translateY(-6px) translateZ(0);
            }
          }
          .premium-acharya-btn-container {
            animation: premium-acharya-float 3.5s ease-in-out infinite;
            will-change: transform;
            transform: translateZ(0);
            backface-visibility: hidden;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
        `}} />

        <div className="premium-acharya-btn-container relative group pointer-events-auto">
          {/* External golden ambient pulse ring to draw attention elegantly */}
          <div className="absolute inset-0 rounded-full bg-brand-gold-500/25 blur-md animate-pulse pointer-events-none scale-105" />
          <div className="absolute -inset-[3px] rounded-full bg-gradient-to-r from-brand-gold-500 via-brand-gold-400 to-brand-gold-600 opacity-70 blur-xs group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          <button
            onClick={onOpenConsultant}
            className="relative flex items-center gap-1.5 sm:gap-2.5 px-3.5 py-2.5 sm:px-4.5 sm:py-3.5 rounded-full bg-gradient-to-r from-brand-green-800 via-brand-green-900 to-brand-green-800 text-brand-cream-400 hover:text-brand-gold-500 font-bold transition-all duration-300 shadow-[0_8px_25px_rgba(0,0,0,0.45)] hover:scale-105 active:scale-95 cursor-pointer border border-brand-gold-100 shrink-0 overflow-hidden"
            // title={t('btnAskAcharya', language)}
          >
            {/* Shimmer line effect across the button */}
            <div className="absolute inset-0 bg-gradient-to-r from-brand-gold-500/0 via-brand-gold-500/15 to-brand-gold-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />

            {/* Glowing sparkle icon */}
            <div className="relative flex items-center justify-center bg-brand-gold-500/20 p-1 sm:p-1.5 rounded-full border border-brand-gold-400/30">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-gold-300 animate-pulse" />
            </div>

            <div className="flex flex-col items-start leading-tight text-left">
              <span className="text-[8px] sm:text-[9px] tracking-widest uppercase font-sans font-extrabold text-brand-gold-400">
                AI Consult
              </span>
              <span className="text-[11px] sm:text-xs tracking-wide font-serif font-bold text-brand-cream-50 group-hover:text-brand-gold-200 transition-colors">
                Ask Acharya
              </span>
            </div>
          </button>
        </div>
      </div>

      



      

    </div>
  );
};

