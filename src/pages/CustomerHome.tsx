/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Award, Star, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product, Blog, ProductVariant } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Language, t } from '../lib/translations';

import productImage from "@/assets/banner5.png";
import productImage2 from "@/assets/banner5.png";
import productImage3 from "@/assets/banner5.png";
import drImage from "@/assets/Dr6.png"

// Mobile (tall/square, portrait-friendly) hero banners
import productImageMobile from "@/assets/banner009.png";
import productImageMobile2 from "@/assets/banner009.png";
import productImageMobile3 from "@/assets/banner009.png";

interface CustomerHomeProps {
  products: Product[];
  blogs: Blog[];
  onNavigate: (page: string, params?: any) => void;
  onOpenConsultant: () => void;
  onAddToCart: (product: Product, qty: number, selectedVariant?: ProductVariant) => void;
  onQuickView: (product: Product) => void;
  wishlist: string[];
  onToggleWishlist: (product: Product) => void;
  language: Language;
  onBuyNow?: (product: Product, qty: number, selectedVariant?: ProductVariant) => void;
}

const heroSlides = [
  {
    id: "slide-1",
    desktopImage: productImage,
    mobileImage: productImageMobile,
    productId: "prod-2",
  },
  {
    id: "slide-2",
    desktopImage: productImage2,
    mobileImage: productImageMobile2,
    productId: "prod-12",
  },
  {
    id: "slide-3",
    desktopImage: productImage3,
    mobileImage: productImageMobile3,
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
  language,
  onBuyNow
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
    { name: "Immunity", count: 12, img: "https://i.pinimg.com/736x/45/5b/ef/455befde743efeb9efb34a553d8223c1.jpg" },
    { name: "Skin Care", count: 8, img: "https://i.pinimg.com/736x/d8/76/f5/d876f515b9fdca9721332e608ab31efb.jpg" },
    { name: "Digestion", count: 15, img: "https://i.pinimg.com/736x/96/72/f7/9672f71b394e6f9a3eea2a331d31b0d4.jpg" },
    { name: "Hair Care", count: 9, img: "https://i.pinimg.com/736x/ff/c6/e0/ffc6e0b078c922f7bd0a33e73cc8fc4a.jpg" },
    { name: "Oils", count: 14, img: "https://i.pinimg.com/1200x/14/28/02/142802442fd42bc1c1e8deb3af002880.jpg" },
    { name: "Brain & Memory", count: 6, img: "https://i.pinimg.com/1200x/e3/57/7f/e3577fe21b78f8a43bae9431b834d39c.jpg" },
    { name: "Sleep & Stress", count: 5, img: "https://i.pinimg.com/736x/80/7b/73/807b735ec289f936911b302dcde23710.jpg" },
    { name: "Sexual Wellness", count: 4, img: "https://i.pinimg.com/1200x/8e/a6/fa/8ea6fa554150c605a6a2339c65abe97b.jpg" }
  ];

  const slide = heroSlides[currentSlide];

  const handleHeroClick = () => {
    onNavigate('shop');
  };

  return (
    <div id="customar-home-page" className=" space-y-9">

      {/* ===== HERO BANNER — separate mobile / desktop art, fully responsive ===== */}
      <section
        id="hero-banner"
        onClick={handleHeroClick}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="
          relative
          w-full
          h-[195px]
          xs:h-[280px]
          sm:h-[335px]
          md:h-[350px]
          lg:h-[368px]
          xl:h-[400px]
          2xl:h-[550px]
          rounded
          overflow-hidden
          flex
          items-center
          justify-center
          cursor-pointer
          group
          shadow-sm
        "
      >
        <div className="absolute inset-0">
          <picture>
            <source
              media="(max-width:768px)"
              srcSet={slide.mobileImage}
            />
            <img
              src={slide.desktopImage}
              alt="BV Life"
              className="w-full h-full object-cover"
            />
          </picture>
          {/* Gradient overlay: subtle on desktop, stronger on mobile for dot/button contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent sm:from-black/20 sm:via-transparent sm:to-transparent" />
        </div>

        {/* ===== NAVIGATION BUTTONS ===== */}
        {/* <button
          onClick={(e) => {
            e.stopPropagation();
            setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
          }}
          aria-label="Previous slide"
          className="flex absolute left-2 xs:left-3 md:left-4 lg:left-5 top-1/2 -translate-y-1/2 z-30 items-center justify-center p-1.5 xs:p-2 md:p-2.5 lg:p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm border border-white/20 hover:border-white/40 text-white transition-all duration-300 hover:scale-110"
        >
          <ChevronLeft className="w-3.5 h-3.5 xs:w-4 xs:h-4 md:w-5 md:h-5 lg:w-4 lg:h-4" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
          }}
          aria-label="Next slide"
          className="flex absolute right-2 xs:right-3 md:right-4 lg:right-5 top-1/2 -translate-y-1/2 z-30 items-center justify-center p-1.5 xs:p-2 md:p-2.5 lg:p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm border border-white/20 hover:border-white/40 text-white transition-all duration-300 hover:scale-110"
        >
          <ChevronRight className="w-3.5 h-3.5 xs:w-4 xs:h-4 md:w-5 md:h-5 lg:w-4 lg:h-4" />
        </button> */}

        {/* ===== SLIDE INDICATOR DOTS ===== */}
        <div className="absolute bottom-2 xs:bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-1.5 xs:gap-2">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSlide(i);
              }}
              className={`transition-all duration-300 rounded-full ${currentSlide === i
                  ? 'bg-white w-4 xs:w-5 sm:w-6 md:w-8 h-1.5 xs:h-2'
                  : 'bg-white/40 hover:bg-white/60 w-1.5 xs:w-2 h-1.5 xs:h-2'
                }`}
            />
          ))}
        </div>
      </section>

      {/* 2. CATEGORY BROWSE SECTION */}
      <section id="category-browse" className="max-w-7xl mx-auto px-2 sm:px-2 lg:px-8">
        {/* <div className="w-full text-left mb-5">
          <h3 className="text-xl sm:text-xl font-semibold text-black">
            Shop by Concern
          </h3>
        </div> */}

        <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-5">
          {categories.map((cat, i) => (
            <div
              key={i}
              onClick={() => onNavigate("shop", { category: cat.name })}
              className="group bg-gradient-to-br from-green-100 via-white to-sky-100 border border-green-200 hover:border-green-600/20 p-2 lg:p-3 sm:p-4 rounded-xl sm:rounded-2xl text-center cursor-pointer hover:shadow-md transition-all duration-300"
            >
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full overflow-hidden mx-auto mb-2 sm:mb-4 border border-orange-400 group-hover:border-green-500 transition-colors">
                <img
                  src={cat.img}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>

              <h4 className="text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-green-600 transition-colors line-clamp-2">
                {cat.name}
              </h4>
            </div>
          ))}
        </div>
      </section>

  {/* DOCTOR CONSULTATION BANNER */}
<section className="max-w-[1440px] mx-auto px-6 sm:px-4 lg:px-8 ">
  <div
    className="
      w-full
      flex
      flex-col
      lg:flex-row
      lg:h-[350px]
      lg:rounded-2xl
      lg:bg-brand-gold-700
      lg:overflow-visible
      relative
    "
  >

    {/* DOCTOR IMAGE - sits BEHIND the gold card */}
    <div
      className="
        order-1
        lg:order-2
        w-full
        lg:w-[30%]
        flex
        justify-center
        lg:justify-end
        relative
        z-0
        lg:z-0
        lg:h-full
      "
    >
      <img
        src={drImage}
        alt="Consult Ayurvedic Doctor"
        className="
          h-[450px]
          sm:h-[360px]
          md:h-[400px]
          lg:absolute
          lg:h-[415px]
          lg:bottom-0
          lg:right-[-60px]
          w-auto
          max-w-none
          object-contain
          object-bottom
          mb-[-20px]
          sm:mb-[-70px]
          md:mb-[-80px]
          lg:mb-[-55px]
          transition-transform
          duration-500
        "
      />
    </div>
{/* CARD / TEXT */}
<div
  className="
    order-2
    lg:order-1
    w-full
    lg:w-[63%]
    rounded-2xl
    lg:rounded-none
    bg-brand-gold-500
    lg:bg-transparent
    cursor-pointer
    group
    px-6
    sm:px-8
    lg:px-10
    xl:px-16
    pt-7
    sm:pt-8
    md:pt-10
    lg:py-10
    pb-8
    flex
    flex-col
    items-center
    justify-center
    text-center
    relative
    z-10
    -mt-22
    sm:-mt-10
    md:-mt-12
    lg:mt-0
    animate-fade-in-up
  "
  onClick={() => onNavigate("consult-doctor")}
>
  {/* Doctor Name */}
  <h2
    className="
      text-white
      font-serif
      font-normal
      text-[25px]
      sm:text-[29px]
      lg:text-[28px]
      xl:text-[35px]
      leading-[1.15]
      max-w-[650px]
      animate-slide-up
    "
  >
    Consult Dr. Sanjeev Rastogi
    <br />
    <span className="text-[20px] sm:text-[23px] lg:text-[24px] xl:text-[28px]">
      Ayurveda Consultant
    </span>
  </h2>

  {/* Qualifications Badge */}
  <div
    className="
      mt-3
      flex
      flex-wrap
      items-center
      justify-center
      gap-2
      sm:gap-3
      animate-slide-up-delay
    "
  >
    <span className="bg-white/20 backdrop-blur-sm text-white px-3 sm:px-4 py-1 rounded-full text-[11px] sm:text-[12px] font-semibold tracking-wide border border-white/30">
      🎓 Ph.D.
    </span>
    <span className="bg-white/20 backdrop-blur-sm text-white px-3 sm:px-4 py-1 rounded-full text-[11px] sm:text-[12px] font-semibold tracking-wide border border-white/30">
      MD (Ayurveda)
    </span>
    <span className="bg-white/20 backdrop-blur-sm text-white px-3 sm:px-4 py-1 rounded-full text-[11px] sm:text-[12px] font-semibold tracking-wide border border-white/30">
      ⏳ 30+ Years Experience
    </span>
  </div>

  {/* Description */}
  <p
    className="
      mt-4
      text-white
      text-[13px]
      sm:text-[15px]
      lg:text-[15px]
      xl:text-[16px]
      leading-[1.6]
      max-w-[580px]
      animate-fade-in
    "
  >
    Discover personalised Ayurvedic guidance with Dr. Sanjeev Rastogi.
    Understand your concerns from an Ayurvedic perspective and explore
    a personalised approach focused on your individual needs and
    overall wellbeing.
  </p>

  {/* Button */}
 <button
  className="
    mt-6
    inline-flex
    items-center
    justify-center
    bg-[#f5ead9]
    text-black

    px-8
    sm:px-10
    lg:px-9
    xl:px-11

    py-3
    sm:py-3.5
    lg:py-3.5

    rounded-lg

    font-bold
    text-[11px]
    sm:text-[13px]
    lg:text-[13px]
    xl:text-[14px]

    tracking-[1.5px]

    shadow-[0_6px_20px_rgba(0,0,0,0.18)]

    border
    border-[#fff7e8]

    hover:bg-white
    hover:-translate-y-0.5
    hover:scale-[1.02]

    transition-all
    duration-300

    relative
    overflow-hidden
    group/btn
  "
>
  <span className="relative z-10 whitespace-nowrap">
    CONSULT DR. SANJEEV
  </span>

  {/* Shimmer */}
  <span
    className="
      absolute
      inset-0
      -translate-x-full
      group-hover/btn:translate-x-full
      transition-transform
      duration-700
      bg-gradient-to-r
      from-transparent
      via-white/50
      to-transparent
    "
  />
</button>
</div>

  </div>
</section>

      {/* 3. FEATURED PRODUCTS GRID */}
      <section id="featured-products" className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-15">
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
            return (
              <ProductCard
                key={p.id}
                product={p}
                onNavigate={onNavigate}
                onAddToCart={onAddToCart}
                onQuickView={onQuickView}
                isWishlisted={isWishlisted}
                onToggleWishlist={onToggleWishlist}
                language={language}
                onBuyNow={onBuyNow}
              />
            );
          })}
        </div>
      </section>

      {/* 3.5. TOP SELLING PRODUCTS SECTION */}
      <section id="top-selling-products" className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
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
            return (
              <ProductCard
                key={p.id}
                product={p}
                onNavigate={onNavigate}
                onAddToCart={onAddToCart}
                onQuickView={onQuickView}
                isWishlisted={isWishlisted}
                onToggleWishlist={onToggleWishlist}
                language={language}
                onBuyNow={onBuyNow}
              />
            );
          })}
        </div>
      </section>

      {/* 5. USER TESTIMONIALS */}
      <section id="user-testimonials" className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-10">
          <Award className="w-8 h-8 text-brand-gold-500 mx-auto animate-pulse" />
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-brand-green-900">{t('section_test_subtitle', language)}</h3>
          <p className="text-xs text-brand-green-600/70">{t('section_test_title', language)}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      <section id="recent-blogs" className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

      {/* Floating Action Button for AI Acharya Consultant */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] pointer-events-none">
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
          <div className="absolute inset-0 rounded-full bg-brand-gold-500/25 blur-md animate-pulse pointer-events-none scale-105" />
          <div className="absolute -inset-[3px] rounded-full bg-gradient-to-r from-brand-gold-500 via-brand-gold-400 to-brand-gold-600 opacity-70 blur-xs group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          <button
            onClick={onOpenConsultant}
            className="relative flex items-center gap-1.5 sm:gap-2.5 px-3.5 py-2.5 sm:px-4.5 sm:py-3.5 rounded-full bg-gradient-to-r from-brand-green-900 via-brand-green-900 to-brand-green-900 text-brand-cream-50 hover:text-brand-gold-100 font-bold transition-all duration-300 shadow-[0_8px_25px_rgba(0,0,0,0.45)] hover:scale-105 active:scale-95 cursor-pointer border border-brand-gold-400/40 shrink-0 overflow-hidden"
            title={t('btnAskAcharya', language)}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-brand-gold-500/0 via-brand-gold-500/15 to-brand-gold-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />

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
