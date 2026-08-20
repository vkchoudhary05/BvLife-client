/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Star, 
  ShieldCheck, 
  Heart, 
  Sparkles, 
  Sparkle,
  Share2, 
  Info, 
  ChevronRight, 
  ChevronLeft, 
  MessageSquare, 
  ShoppingCart,
  CheckCircle2,
  HelpCircle,
  Clock,
  Leaf,
  Layers,
  LogIn,
  PackageCheck,
  Truck,
  ArrowRight
} from 'lucide-react';
import { Product, Review, User, Order } from '../types';
import { Language, t, translateProductAttr } from '../lib/translations';
import { ProductCard } from '../components/ProductCard';

interface ProductDetailProps {
  productId: string;
  products: Product[];
  reviews: Review[];
  orders?: Order[];
  currentUser?: User | null;
  onNavigate: (page: string, params?: any) => void;
  onAddToCart: (product: Product, qty: number) => void;
  onQuickView?: (product: Product) => void;
  wishlist: string[];
  onToggleWishlist: (product: Product) => void;
  onPostReview: (reviewData: { productId: string, rating: number, comment: string }) => void;
  language: Language;
  onBuyNow?: (product: Product, qty: number) => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({
  productId,
  products,
  reviews,
  orders = [],
  currentUser = null,
  onNavigate,
  onAddToCart,
  onQuickView,
  wishlist,
  onToggleWishlist,
  onPostReview,
  language,
  onBuyNow
}) => {
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('ingredients');

  // Section refs for smooth scrolling
  const ingredientsRef = useRef<HTMLDivElement>(null);
  const benefitsRef = useRef<HTMLDivElement>(null);
  const dosageRef = useRef<HTMLDivElement>(null);
  const faqsRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);

  // Get current product
  const product = useMemo(() => {
    return products.find(prod => prod.id === productId);
  }, [products, productId]);

  // Combine and deduplicate all product images, guaranteeing mainImage is always index 0
  const allImages = useMemo(() => {
    if (!product) return [];
    const list: string[] = [];
    if (product.mainImage) list.push(product.mainImage);
    if (Array.isArray(product.images)) {
      product.images.forEach(img => {
        if (img && typeof img === 'string' && !list.includes(img)) {
          list.push(img);
        }
      });
    }
    return list.length > 0 ? list : [product.mainImage || ''];
  }, [product]);

  // Check if current user has an order for this product (Delivered vs In Transit)
  const { matchedDeliveredOrder, matchedActiveOrder, isAlreadyReviewed } = useMemo(() => {
    let deliveredOrder: any = null;
    let activeOrder: any = null;

    // 1. Check current user against all orders in state
    if (orders && orders.length > 0) {
      for (const order of orders) {
        const isUserMatch = currentUser
          ? ((order.userEmail && currentUser.email && order.userEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
             (order.shippingAddress?.phone && currentUser.phone && order.shippingAddress.phone.replace(/\D/g, '') === currentUser.phone.replace(/\D/g, '')))
          : true;

        if (isUserMatch && order.items?.some((item: any) => item.productId === productId)) {
          if (order.status === 'Delivered') {
            deliveredOrder = order;
          } else if (order.status !== 'Cancelled') {
            activeOrder = order;
          }
        }
      }
    }

    // 2. Check local stored orders
    try {
      const lastCompleted = localStorage.getItem('grams_last_completed_order');
      if (lastCompleted) {
        const orderObj = JSON.parse(lastCompleted);
        if (orderObj.items?.some((it: any) => it.productId === productId)) {
          if (orderObj.status === 'Delivered') {
            deliveredOrder = deliveredOrder || orderObj;
          } else {
            activeOrder = activeOrder || orderObj;
          }
        }
      }
      const allLocalOrders = localStorage.getItem('grams_orders');
      if (allLocalOrders) {
        const orderList = JSON.parse(allLocalOrders);
        if (Array.isArray(orderList)) {
          for (const ord of orderList) {
            if (ord.items?.some((it: any) => it.productId === productId)) {
              if (ord.status === 'Delivered') {
                deliveredOrder = deliveredOrder || ord;
              } else if (ord.status !== 'Cancelled') {
                activeOrder = activeOrder || ord;
              }
            }
          }
        }
      }
    } catch {}

    // Check if already reviewed
    let reviewed = false;
    try {
      const storedReviewed = localStorage.getItem('grams_reviewed_products');
      if (storedReviewed) {
        const ids = JSON.parse(storedReviewed);
        if (Array.isArray(ids) && ids.includes(productId)) {
          reviewed = true;
        }
      }
    } catch {}

    if (!reviewed && reviews && currentUser) {
      reviewed = reviews.some(r => r.productId === productId && (
        (currentUser.email && r.userEmail && r.userEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
        (currentUser.fullName && r.userName && r.userName.toLowerCase() === currentUser.fullName.toLowerCase())
      ));
    }

    return {
      matchedDeliveredOrder: deliveredOrder,
      matchedActiveOrder: activeOrder,
      isAlreadyReviewed: reviewed
    };
  }, [currentUser, orders, productId, reviews]);

  // Automatically reset selected image whenever product changes or loads
  useEffect(() => {
    if (product?.mainImage) {
      setSelectedImage(product.mainImage);
    }
  }, [productId, product?.mainImage]);

  // Current active image displayed in the main preview
  const currentImage = selectedImage && allImages.includes(selectedImage)
    ? selectedImage
    : (allImages[0] || product?.mainImage || '');

  const activeImageIndex = Math.max(0, allImages.indexOf(currentImage));

  const handlePrevImage = () => {
    if (allImages.length <= 1) return;
    const prevIdx = (activeImageIndex - 1 + allImages.length) % allImages.length;
    setSelectedImage(allImages[prevIdx]);
  };

  const handleNextImage = () => {
    if (allImages.length <= 1) return;
    const nextIdx = (activeImageIndex + 1) % allImages.length;
    setSelectedImage(allImages[nextIdx]);
  };

  const scrollToSection = (sectionId: string, ref: React.RefObject<HTMLDivElement | null>) => {
    setActiveSection(sectionId);
    if (ref.current) {
      const yOffset = -80; // offset for fixed headers
      const element = ref.current;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Filter reviews for this product
  const productReviews = useMemo(() => {
    if (!reviews || reviews.length === 0) return [];
    return reviews.filter(r => {
      if (!r.isApproved && r.isApproved !== undefined) return false;
      const matchesId = r.productId === productId;
      const matchesName = product?.name && r.productName && (
        r.productName.toLowerCase().trim() === product.name.toLowerCase().trim() ||
        product.name.toLowerCase().includes(r.productName.toLowerCase().trim()) ||
        r.productName.toLowerCase().includes(product.name.toLowerCase().trim())
      );
      return matchesId || matchesName;
    });
  }, [reviews, productId, product?.name]);

  // Dynamically calculate average rating based on all reviews
  const dynamicRating = useMemo(() => {
    if (productReviews.length === 0) return product?.rating || 5.0;
    const total = productReviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
    return Number((total / productReviews.length).toFixed(1));
  }, [productReviews, product?.rating]);

  if (!product) {
    return (
      <div className="text-center py-20 max-w-sm mx-auto space-y-4">
        <h3 className="font-serif text-xl font-bold text-brand-green-800">
          {language === 'hi' ? 'सूत्रीकरण नहीं मिला' : 'Formulation Not Found'}
        </h3>
        <p className="text-xs text-brand-green-600/70">
          {language === 'hi' 
            ? 'वह आयुर्वेदिक उत्पाद जिसे आप देखने का प्रयास कर रहे हैं उसका अस्तित्व नहीं है या उसकी पुष्टि की जा रही है।' 
            : "The Ayurvedic compound you are trying to view doesn't exist or is undergoing validation."
          }
        </p>
        <button onClick={() => onNavigate('shop')} className="bg-brand-green-700 text-brand-cream-100 font-bold px-6 py-2 rounded-xl text-xs cursor-pointer">
          {language === 'hi' ? 'दुकान पर वापस जाएं' : 'Return to Apothecary'}
        </button>
      </div>
    );
  }

  // Calculate discount percentage
  const discountPercent = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  // Handle share click
  const handleShare = () => {
    setCopied(true);
    navigator.clipboard.writeText(window.location.href);
    setTimeout(() => setCopied(false), 2000);
  };

  // Find related products (same category, different ID)
  const relatedProducts = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  return (
    <div id="product-detail-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-8 sm:space-y-10">
      
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-brand-green-600/60 font-medium overflow-x-auto whitespace-nowrap pb-1">
        <button onClick={() => onNavigate('home')} className="hover:text-brand-gold-600 transition-colors cursor-pointer">
          {language === 'hi' ? 'मुख्य पृष्ठ' : 'Home'}
        </button>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <button onClick={() => onNavigate('shop', { category: product.category })} className="hover:text-brand-gold-600 transition-colors cursor-pointer">
          {translateProductAttr(product.category, language)}
        </button>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <span className="text-brand-green-800 font-bold truncate">{product.name}</span>
      </div>

      {/* Main product showcase (Images + Primary Purchase Info) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Column: Image Gallery with Matching Sage Backdrop & Polygon Sparkle Badge */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative aspect-square bg-gradient-to-b from-brand-green-50 to-brand-green-100/40 border border-brand-green-700/10 rounded-3xl p-6 sm:p-8 flex items-center justify-center overflow-hidden shadow-[0_1px_2px_rgba(20,60,40,0.06)] group select-none">
            <img 
              src={currentImage} 
              alt={`${product.name} - View ${activeImageIndex + 1}`} 
              className="max-h-[420px] w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />

            {/* Bottom fade so the sage backdrop reads as one unified surface with the hero image */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-brand-green-950/10 to-transparent pointer-events-none" />
            
            {/* Floating Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10 pointer-events-none">
              {discountPercent > 0 && (
                <span className="inline-flex items-center gap-1 bg-brand-green-900 text-white text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wide shadow-xs">
                  {discountPercent}% {language === 'hi' ? 'छूट' : 'OFF'}
                </span>
              )}
            </div>

            {/* Image Counter Badge */}
            {allImages.length > 1 && (
              <span className="absolute bottom-4 right-4 bg-brand-green-950/80 backdrop-blur-sm text-brand-gold-300 text-[11px] font-bold px-3 py-1 rounded-full shadow-md">
                {activeImageIndex + 1} / {allImages.length}
              </span>
            )}

            {/* Left/Right Arrow Navigation Buttons */}
            {allImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-brand-green-900 shadow-md border border-brand-green-600/10 flex items-center justify-center transition-all opacity-80 hover:opacity-100 hover:scale-110 cursor-pointer active:scale-95 z-10"
                  title="Previous Image"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-brand-green-900 shadow-md border border-brand-green-600/10 flex items-center justify-center transition-all opacity-80 hover:opacity-100 hover:scale-110 cursor-pointer active:scale-95 z-10"
                  title="Next Image"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails row (Includes Main Image at #1 and all additional images) */}
          {allImages.length > 1 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-brand-green-700 px-1">
                <span>{language === 'hi' ? 'गैलरी छवियाँ' : 'Product Gallery'} ({allImages.length})</span>
                <span className="text-[10px] text-brand-green-600/70 font-normal">
                  {language === 'hi' ? 'बदलने के लिए किसी भी छवि पर क्लिक करें' : 'Click any thumbnail to preview'}
                </span>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 px-1 custom-scrollbar">
                {allImages.map((img, i) => {
                  const isActive = currentImage === img;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedImage(img)}
                      className={`relative w-18 h-18 sm:w-20 sm:h-20 bg-white rounded-2xl overflow-hidden flex items-center justify-center p-1.5 flex-shrink-0 cursor-pointer transition-all duration-200 ${
                        isActive 
                          ? 'border-2 border-brand-green-700 shadow-md ring-2 ring-brand-gold-500/40 scale-102 bg-brand-cream-50' 
                          : 'border border-slate-200 hover:border-brand-green-400 opacity-75 hover:opacity-100'
                      }`}
                      title={i === 0 ? 'Main Image' : `Product Angle ${i + 1}`}
                    >
                      <img 
                        src={img} 
                        alt={`${product.name} thumbnail ${i + 1}`} 
                        className="w-full h-full object-contain" 
                        referrerPolicy="no-referrer"
                      />
                      {i === 0 && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 bg-brand-green-800 text-[8px] font-bold text-white px-1.5 py-0.2 rounded-full uppercase tracking-tighter">
                          Main
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Key Details & Purchasing Actions */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-brand-gold-700 font-bold bg-brand-gold-500/10 px-2.5 py-1 rounded-md">
                {translateProductAttr(product.category, language)}
              </span>
              <span className="text-[10px] font-semibold text-brand-green-600/50 uppercase tracking-widest">SKU: {product.sku}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-brand-green-950 leading-tight">
              {product.name}
            </h1>
            
            {/* Rating & Fast Navigation to Reviews */}
            <div className="flex items-center gap-2 pt-1">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.floor(dynamicRating) ? 'fill-current' : 'text-gray-200'}`} />
                ))}
              </div>
              <span className="text-xs font-semibold text-brand-green-800">
                {language === 'hi' ? `${dynamicRating} / 5.0 रेटिंग` : `${dynamicRating} / 5.0 Rating`}
              </span>
              <span className="text-brand-green-600/40 text-xs">•</span>
              <button 
                onClick={() => scrollToSection('reviews', reviewsRef)} 
                className="text-xs text-brand-gold-700 font-semibold hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>{language === 'hi' ? `(${productReviews.length} सत्यापित समीक्षाएं)` : `(${productReviews.length} verified reviews)`}</span>
              </button>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-brand-cream-100/70 border border-brand-green-600/10 flex items-center justify-between gap-4 shadow-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] text-brand-green-700 font-bold uppercase tracking-wider">
                {language === 'hi' ? 'मूल्य' : 'Price'}
              </span>
              <div className="flex items-baseline gap-2.5">
                <span className="font-bold text-3xl sm:text-4xl text-brand-green-950">₹{product.price}</span>
                {product.originalPrice > product.price && (
                  <span className="text-sm sm:text-base text-brand-green-600/50 line-through">₹{product.originalPrice}</span>
                )}
              </div>
            </div>
            <div className="text-right space-y-0.5">
              <span className="text-[10px] text-brand-green-700 font-bold uppercase tracking-wider">
                {language === 'hi' ? 'ब्रांड' : 'Brand'}
              </span>
              <p className="text-xs sm:text-sm font-bold text-brand-green-800">{product.brand}</p>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-brand-green-800/95 leading-relaxed">
            {product.description}
          </p>

          {/* Fast Highlights List */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-white rounded-2xl border border-brand-green-600/10 text-xs text-brand-green-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4.5 h-4.5 text-brand-green-700 flex-shrink-0" />
              <span className="font-medium">{language === 'hi' ? 'GMP गुणवत्ता प्रमाणित' : 'GMP Quality Certified'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-brand-gold-600 flex-shrink-0" />
              <span className="font-medium">{language === 'hi' ? '100% शुद्ध वनस्पति' : '100% Pure Botanical'}</span>
            </div>
          </div>

          {/* Buy actions */}
          <div className="space-y-4 pt-1">
            {product.stock > 0 ? (
              <div className="flex flex-col gap-3 max-w-md">
                {/* Row 1: Quantity Selector + Add to Cart */}
                <div className="flex flex-row items-center gap-3 w-full">
                  {/* Quantity input */}
                  <div className="flex items-center justify-between border-2 border-brand-green-700/20 rounded-2xl bg-white overflow-hidden w-28 sm:w-32 h-13 shrink-0 shadow-xs focus-within:border-brand-green-700 transition-all">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-full flex items-center justify-center text-brand-green-800 font-bold hover:bg-brand-green-50 transition-colors cursor-pointer select-none text-base font-sans"
                    >
                      -
                    </button>
                    <span className="font-bold text-sm text-brand-green-950 tabular-nums">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="w-10 h-full flex items-center justify-center text-brand-green-800 font-bold hover:bg-brand-green-50 transition-colors cursor-pointer select-none text-base font-sans"
                    >
                      +
                    </button>
                  </div>

                  {/* Add to Cart button */}
                  <button
                    onClick={() => onAddToCart(product, quantity)}
                    className="flex-1 h-13 border-2 border-brand-green-700 hover:bg-brand-green-50 text-brand-green-800 font-extrabold rounded-2xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] text-sm tracking-wider"
                  >
                    <ShoppingCart className="w-4 h-4 text-brand-green-700 shrink-0" />
                    <span>{t('btn_add_to_cart', language)}</span>
                  </button>
                </div>

                {/* Row 2: Express Direct Buy Now Button */}
                <button
                  onClick={() => {
                    if (onBuyNow) {
                      onBuyNow(product, quantity);
                    } else {
                      onAddToCart(product, quantity);
                      onNavigate('checkout');
                    }
                  }}
                  className="w-full h-13 bg-brand-green-800 hover:bg-brand-green-900 text-brand-cream-50 font-bold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] text-sm uppercase tracking-wider"
                >
                  <span>{language === 'hi' ? 'अभी खरीदें' : 'Buy Now'}</span>
                </button>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 text-red-600 font-bold text-center py-3.5 rounded-2xl text-xs sm:text-sm">
                {language === 'hi' 
                  ? 'वर्तमान में आउट ऑफ स्टॉक (छोटा बैच तैयार किया जा रहा है)' 
                  : 'Currently Out of Stock (Undergoing Small-Batch Preparation)'
                }
              </div>
            )}

            {/* Wishlist & Share controls */}
            <div className="flex justify-between items-center text-xs text-brand-green-800 pt-1 font-semibold max-w-md">
              <button 
                onClick={() => onToggleWishlist(product)}
                className="flex items-center gap-1.5 hover:text-brand-gold-600 cursor-pointer"
              >
                <Heart className={`w-4 h-4 ${wishlist.includes(product.id) ? 'fill-current text-red-500' : ''}`} />
                <span>
                  {wishlist.includes(product.id) 
                    ? (language === 'hi' ? 'इच्छा-सूची से निकालें' : 'Remove From Wishlist') 
                    : (language === 'hi' ? 'इच्छा-सूची में जोड़ें' : 'Add To Wishlist')
                  }
                </span>
              </button>
              
              <button 
                onClick={handleShare}
                className="flex items-center gap-1.5 hover:text-brand-gold-600 cursor-pointer relative"
              >
                <Share2 className="w-4 h-4 text-brand-gold-600" />
                <span>
                  {copied 
                    ? (language === 'hi' ? 'लिंक कॉपी हो गया!' : 'Link Copied!') 
                    : (language === 'hi' ? 'उपचार लिंक साझा करें' : 'Share Remedy Link')
                  }
                </span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* QUICK JUMP STICKY NAVIGATION BAR (Allows 1-Click scrolling to any product section) */}
      <div className="sticky top-16 z-20 bg-white/95 backdrop-blur-md border-y border-brand-green-600/10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
          <span className="text-[11px] font-bold text-brand-green-600/70 uppercase tracking-wider hidden md:inline shrink-0 mr-1">
            Jump to:
          </span>
          <button
            type="button"
            onClick={() => scrollToSection('ingredients', ingredientsRef)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'ingredients'
                ? 'bg-brand-green-800 text-brand-cream-50 shadow-xs'
                : 'bg-brand-cream-100/60 text-brand-green-900 hover:bg-brand-cream-100'
            }`}
          >
            <Leaf className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'वैदिक जड़ी-बूटियाँ' : 'Vedic Botanicals'}</span>
          </button>

          <button
            type="button"
            onClick={() => scrollToSection('benefits', benefitsRef)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'benefits'
                ? 'bg-brand-green-800 text-brand-cream-50 shadow-xs'
                : 'bg-brand-cream-100/60 text-brand-green-900 hover:bg-brand-cream-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'चिकित्सीय लाभ' : 'Health Benefits'}</span>
          </button>

          <button
            type="button"
            onClick={() => scrollToSection('dosage', dosageRef)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'dosage'
                ? 'bg-brand-green-800 text-brand-cream-50 shadow-xs'
                : 'bg-brand-cream-100/60 text-brand-green-900 hover:bg-brand-cream-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'खुराक और निर्देश' : 'Dosage & Directions'}</span>
          </button>

          <button
            type="button"
            onClick={() => scrollToSection('faqs', faqsRef)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'faqs'
                ? 'bg-brand-green-800 text-brand-cream-50 shadow-xs'
                : 'bg-brand-cream-100/60 text-brand-green-900 hover:bg-brand-cream-100'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'पूछे जाने वाले प्रश्न' : 'Remedy FAQs'}</span>
          </button>

          <button
            type="button"
            onClick={() => scrollToSection('reviews', reviewsRef)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'reviews'
                ? 'bg-brand-green-800 text-brand-cream-50 shadow-xs'
                : 'bg-brand-cream-100/60 text-brand-green-900 hover:bg-brand-cream-100'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{language === 'hi' ? `समीक्षाएं (${productReviews.length})` : `Reviews (${productReviews.length})`}</span>
          </button>
        </div>
      </div>

      {/* ALL PRODUCT DETAILS VISIBLE ON A SINGLE UNIFIED PAGE */}
      <div className="space-y-8 sm:space-y-12">
        
        {/* SECTION 1: VEDIC BOTANICALS & INGREDIENTS */}
        <section 
          ref={ingredientsRef} 
          id="section-ingredients" 
          className="bg-white border border-brand-green-600/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs"
        >
          <div className="flex items-center gap-2.5 pb-3 border-b border-brand-green-600/10">
            <div className="w-8 h-8 rounded-xl bg-brand-green-100 text-brand-green-800 flex items-center justify-center">
              <Leaf className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-brand-green-900">
                {language === 'hi' ? 'वैदिक जड़ी-बूटियाँ और वनस्पति संरचना' : 'Vedic Botanicals & Herbal Composition'}
              </h3>
              <p className="text-xs text-brand-green-600/70">
                {language === 'hi' ? 'शुद्ध पारंपरिक आयुर्वेदिक अर्क और उनका प्रभाव' : 'Authentic classical extracts carefully measured for potency.'}
              </p>
            </div>
          </div>

          {product.ingredients && product.ingredients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {product.ingredients.map((ing, i) => (
                <div key={i} className="p-4 sm:p-5 bg-brand-cream-100/40 rounded-2xl border border-brand-green-600/10 space-y-1.5 hover:border-brand-green-600/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-gold-600 shrink-0" />
                    <h4 className="text-sm sm:text-base font-bold text-brand-green-900">
                      {translateProductAttr(ing.name, language)}
                    </h4>
                  </div>
                  <p className="text-xs text-brand-green-800/85 leading-relaxed pl-4">
                    {ing.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-brand-green-600">Standard Vedic botanical extract compound.</p>
          )}
        </section>

        {/* SECTION 2: HEALTH BENEFITS */}
        <section 
          ref={benefitsRef} 
          id="section-benefits" 
          className="bg-white border border-brand-green-600/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs"
        >
          <div className="flex items-center gap-2.5 pb-3 border-b border-brand-green-600/10">
            <div className="w-8 h-8 rounded-xl bg-brand-gold-500/15 text-brand-gold-700 flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-brand-green-900">
                {language === 'hi' ? 'प्रमाणित स्वास्थ्य और कल्याण लाभ' : 'Key Health & Wellness Benefits'}
              </h3>
              <p className="text-xs text-brand-green-600/70">
                {language === 'hi' ? 'नैदानिक रूप से मान्य परिणाम और लाभ' : 'Holistic therapeutic advantages of this daily Ayurvedic compound.'}
              </p>
            </div>
          </div>

          {product.benefits && product.benefits.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {product.benefits.map((b, i) => (
                <div key={i} className="flex items-start gap-3 text-xs sm:text-sm text-brand-green-900 leading-relaxed bg-brand-green-50/40 p-4 rounded-2xl border border-brand-green-600/10">
                  <CheckCircle2 className="w-4.5 h-4.5 text-brand-green-700 flex-shrink-0 mt-0.5" />
                  <span className="font-medium">{b}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-brand-green-600">Formulated for overall wellness and balance.</p>
          )}
        </section>

        {/* SECTION 3: DOSAGE & DIRECTIONS */}
        <section 
          ref={dosageRef} 
          id="section-dosage" 
          className="bg-white border border-brand-green-600/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs"
        >
          <div className="flex items-center gap-2.5 pb-3 border-b border-brand-green-600/10">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Clock className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-brand-green-900">
                {language === 'hi' ? 'खुराक और उपयोग के निर्देश' : 'Dosage & Directions for Use'}
              </h3>
              <p className="text-xs text-brand-green-600/70">
                {language === 'hi' ? 'सर्वोत्तम परिणामों के लिए सही समय और अनुशंसित मात्रा' : 'Follow the recommended guidelines for optimal holistic results.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="p-5 rounded-2xl bg-brand-cream-100/50 border border-brand-green-600/10 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-gold-800 bg-brand-gold-500/15 px-2.5 py-1 rounded-md inline-block">
                {language === 'hi' ? 'अनुशंसित खुराक' : 'Recommended Dosage'}
              </span>
              <p className="text-sm font-bold text-brand-green-950">
                {product.dosage || (language === 'hi' ? '1-2 गोलियाँ या 1 चम्मच प्रतिदिन' : '1-2 units daily or as advised by physician')}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-brand-cream-100/50 border border-brand-green-600/10 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-green-800 bg-brand-green-100 px-2.5 py-1 rounded-md inline-block">
                {language === 'hi' ? 'उपभोग का समय और विधि' : 'Application & Consumption Method'}
              </span>
              <p className="text-xs sm:text-sm text-brand-green-900 leading-relaxed">
                {product.usageInstructions || (language === 'hi' ? 'गुनगुने पानी या दूध के साथ लें।' : 'Consume with warm water or milk after meals.')}
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 4: FREQUENTLY ASKED QUESTIONS (FAQs) */}
        <section 
          ref={faqsRef} 
          id="section-faqs" 
          className="bg-white border border-brand-green-600/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs"
        >
          <div className="flex items-center gap-2.5 pb-3 border-b border-brand-green-600/10">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
              <HelpCircle className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-brand-green-900">
                {language === 'hi' ? 'अक्सर पूछे जाने वाले प्रश्न (FAQs)' : 'Remedy FAQs & Common Inquiries'}
              </h3>
              <p className="text-xs text-brand-green-600/70">
                {language === 'hi' ? 'इस उत्पाद के बारे में सामान्य प्रश्न और उत्तर' : 'Clear answers regarding consumption, safety, and shelf life.'}
              </p>
            </div>
          </div>

          {product.faqs && product.faqs.length > 0 ? (
            <div className="space-y-3.5">
              {product.faqs.map((faq, i) => (
                <div key={i} className="p-4 sm:p-5 rounded-2xl bg-brand-cream-100/25 border border-brand-green-600/10 space-y-2">
                  <h4 className="font-bold text-xs sm:text-sm text-brand-green-950 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-brand-gold-500/20 text-brand-gold-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      Q
                    </span>
                    <span>{faq.question}</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-brand-green-800/90 leading-relaxed pl-7">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-brand-cream-50 border border-brand-green-600/10 text-xs text-brand-green-700">
              {language === 'hi' ? 'इस फॉर्मूलेशन के लिए कोई प्रश्न उपलब्ध नहीं है।' : '100% natural herbal product. Safe for prolonged use when consumed according to directions.'}
            </div>
          )}
        </section>

        {/* SECTION 5: CUSTOMER REVIEWS & RATINGS WITH VERIFIED PURCHASE FLOW */}
        <section 
          ref={reviewsRef} 
          id="section-reviews" 
          className="bg-white border border-brand-green-600/10 rounded-3xl p-6 sm:p-8 space-y-8 shadow-xs"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-green-600/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Star className="w-4.5 h-4.5 fill-amber-500 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-brand-green-900">
                  {language === 'hi' ? 'ग्राहक समीक्षाएं और अनुभव' : 'Customer Reviews & Ratings'}
                </h3>
                <p className="text-xs text-brand-green-600/70">
                  {language === 'hi' ? `${productReviews.length} सत्यापित उपयोगकर्ताओं से प्रतिक्रिया` : `Verified feedback from ${productReviews.length} customers.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.floor(dynamicRating) ? 'fill-current' : 'text-gray-200'}`} />
                ))}
              </div>
              <span className="font-bold text-sm text-brand-green-950">{dynamicRating} / 5.0</span>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {productReviews.length === 0 ? (
              <div className="p-6 bg-brand-cream-100/20 border border-brand-green-600/10 rounded-2xl text-center space-y-1">
                <p className="text-xs sm:text-sm font-bold text-brand-green-900">
                  {language === 'hi' ? 'अभी तक कोई समीक्षा नहीं है।' : 'No verified reviews written yet.'}
                </p>
                <p className="text-xs text-brand-green-600/70">
                  {language === 'hi' ? 'डिलीवरी के बाद ऑर्डर हिस्ट्री से पहली समीक्षा साझा करें।' : 'Reviews appear here as verified customers receive and rate this formulation.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {productReviews.map(rev => (
                  <div key={rev.id} className="bg-brand-cream-100/20 border border-brand-green-600/10 p-5 rounded-2xl space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-current' : 'text-gray-200'}`} />
                        ))}
                      </div>
                      <span className="text-[10px] text-brand-green-600/60 font-mono">{rev.date}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-brand-green-900 italic leading-relaxed">
                      "{rev.comment}"
                    </p>
                    <div className="flex items-center gap-1.5 pt-1 text-[11px] font-bold text-brand-green-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{rev.userName} (Verified Purchase)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Verified Purchaser Reviews Policy & Order History Rating Gate */}
          <div className="bg-brand-cream-100/60 p-6 sm:p-7 rounded-3xl border border-brand-green-600/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-brand-green-600/10 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand-gold-700 shrink-0" />
                <h4 className="font-serif text-sm sm:text-base font-bold text-brand-green-900">
                  {language === 'hi' ? 'सत्यापित खरीदार समीक्षा नीति' : 'Verified Buyer Review Policy'}
                </h4>
              </div>
              
              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{language === 'hi' ? '100% प्रामाणिक समीक्षा' : '100% Verified Purchases'}</span>
              </span>
            </div>

            {/* Case 1: User has already reviewed this product */}
            {isAlreadyReviewed ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-emerald-950">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-emerald-900 text-xs sm:text-sm">
                      {language === 'hi' ? 'आपकी सत्यापित समीक्षा प्रकाशित हो चुकी है!' : 'Your Verified Review is Live!'}
                    </p>
                    <p className="text-[11px] text-emerald-800/80">
                      {language === 'hi'
                        ? 'अपना अनुभव साझा करने के लिए धन्यवाद। आपकी समीक्षा ऊपर प्रकाशित है।'
                        : 'Thank you for sharing your wellness journey. Your review is featured above.'}
                    </p>
                  </div>
                </div>
              </div>
            ) : matchedDeliveredOrder ? (
              /* Case 2: User has purchased & received the product, can rate in Order History */
              <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-emerald-950">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
                    <PackageCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-emerald-900 text-xs sm:text-sm">
                        {language === 'hi' ? 'आपने यह उत्पाद प्राप्त कर लिया है!' : 'You received this formulation!'}
                      </p>
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 font-mono px-2 py-0.5 rounded font-bold">
                        Order #{matchedDeliveredOrder.id}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800/80 mt-0.5">
                      {language === 'hi'
                        ? 'अपने ऑर्डर सेक्शन में जाकर इस उत्पाद के लिए अपनी स्टार रेटिंग और समीक्षा सबमिट करें।'
                        : 'Rate your delivered remedies in your Order History to share your results with fellow seekers.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('dashboard', { tab: 'orders' })}
                  className="inline-flex items-center gap-1.5 bg-brand-green-800 hover:bg-brand-green-900 text-brand-cream-50 font-bold px-4 py-2.5 rounded-xl text-xs shadow-xs transition-all cursor-pointer shrink-0 active:scale-95"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{language === 'hi' ? 'ऑर्डर हिस्ट्री में समीक्षा दें' : 'Rate in Order History'}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-brand-gold-400" />
                </button>
              </div>
            ) : matchedActiveOrder ? (
              /* Case 3: Order is currently placed / in transit */
              <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-950">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 shadow-xs">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-amber-900 text-xs sm:text-sm">
                      {language === 'hi' ? 'आपका पैकेज रास्ते में है!' : 'Your package is on its way!'}
                    </p>
                    <p className="text-[11px] text-amber-800/80 mt-0.5">
                      {language === 'hi'
                        ? `ऑर्डर #${matchedActiveOrder.id} अभी ट्रांजिट में है। डिलीवरी पूरी होने के बाद आप ऑर्डर हिस्ट्री से समीक्षा लिख सकेंगे।`
                        : `Order #${matchedActiveOrder.id} is currently in transit. You will be able to review this formulation once delivered.`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('track-order')}
                  className="inline-flex items-center gap-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-xs transition-all cursor-pointer shrink-0"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'ऑर्डर ट्रैक करें' : 'Track Order'}</span>
                </button>
              </div>
            ) : (
              /* Case 4: Default authentic customer assurance note */
              <div className="bg-white/80 border border-brand-green-600/10 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <p className="font-bold text-brand-green-950 text-xs sm:text-sm">
                    {language === 'hi' ? 'केवल सत्यापित डिलीवरी समीक्षाएं' : 'Post-Delivery Verified Reviews'}
                  </p>
                  <p className="text-[11px] text-brand-green-700/80 leading-relaxed max-w-xl">
                    {language === 'hi'
                      ? 'आयुर्वेदिक प्रामाणिकता और सत्यता बनाए रखने के लिए, समीक्षाएं केवल उन ग्राहकों द्वारा अपनी ऑर्डर हिस्ट्री से दी जा सकती हैं जिन्हें उत्पाद सफलतापूर्वक डिलीवर हो चुका है।'
                      : 'To ensure clinical authenticity and trust, reviews on GRAMS are exclusively submitted by verified customers after successful package delivery in their Order History.'}
                  </p>
                </div>

                {!currentUser && (
                  <button
                    type="button"
                    onClick={() => onNavigate('login')}
                    className="inline-flex items-center gap-1.5 bg-brand-green-800 hover:bg-brand-green-900 text-brand-cream-50 font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-xs cursor-pointer shrink-0"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{language === 'hi' ? 'लॉगिन करें' : 'Sign In'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

      </div>

      {/* Synergetic Related Remedies Section (Rendered with the exact ProductCard component design) */}
      {relatedProducts.length > 0 && (
        <section id="related-compounds" className="space-y-6 pt-6">
          <div className="flex items-center justify-between border-b border-brand-green-600/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-green-100 text-brand-green-800 flex items-center justify-center">
                <Leaf className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-brand-green-900">
                  {language === 'hi' ? 'संबंधित आयुर्वेदिक उपचार' : 'Synergetic Related Remedies'}
                </h3>
                <p className="text-xs text-brand-green-600/70">
                  {language === 'hi' ? 'समान श्रेणी और पूरक स्वास्थ्य लाभ वाले उत्पाद' : 'Explore complementary herbal formulations for balanced wellness.'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => onNavigate('shop', { category: product.category })}
              className="text-xs font-bold text-brand-gold-700 hover:text-brand-green-900 hover:underline cursor-pointer flex items-center gap-1 transition-colors"
            >
              <span>{language === 'hi' ? 'सभी देखें' : 'View All'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                onNavigate={onNavigate}
                onAddToCart={onAddToCart}
                onQuickView={onQuickView || (() => {})}
                isWishlisted={wishlist.includes(p.id)}
                onToggleWishlist={onToggleWishlist}
                language={language}
                onBuyNow={onBuyNow}
              />
            ))}
          </div>
        </section>
      )}

    </div>
  );
};
