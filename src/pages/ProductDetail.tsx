/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Star, ShieldCheck, Heart, Sparkles, Share2, Info, ChevronRight, MessageSquare } from 'lucide-react';
import { Product, Review } from '../types';
import { Language, t, translateProductAttr } from '../lib/translations';

interface ProductDetailProps {
  productId: string;
  products: Product[];
  reviews: Review[];
  onNavigate: (page: string, params?: any) => void;
  onAddToCart: (product: Product, qty: number) => void;
  wishlist: string[];
  onToggleWishlist: (product: Product) => void;
  onPostReview: (reviewData: { productId: string, rating: number, comment: string }) => void;
  language: Language;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({
  productId,
  products,
  reviews,
  onNavigate,
  onAddToCart,
  wishlist,
  onToggleWishlist,
  onPostReview,
  language
}) => {
  const [activeTab, setActiveTab] = useState<'ingredients' | 'benefits' | 'dosage' | 'faqs' | 'reviews'>('ingredients');
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);

  // Review Form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Get current product
  const product = useMemo(() => {
    const p = products.find(prod => prod.id === productId);
    if (p && !selectedImage) {
      setSelectedImage(p.mainImage);
    }
    return p;
  }, [products, productId]);

  // Filter reviews for this product
  const productReviews = useMemo(() => {
    return reviews.filter(r => r.productId === productId && r.isApproved);
  }, [reviews, productId]);

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

  // Handle Review submission
  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPostReview({
      productId: product.id,
      rating: reviewRating,
      comment: reviewComment
    });
    setReviewComment('');
    setReviewSubmitted(true);
    setTimeout(() => setReviewSubmitted(false), 4000);
  };

  // Find related products (same category, different ID)
  const relatedProducts = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 3);

  return (
    <div id="product-detail-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-brand-green-600/60 font-medium">
        <button onClick={() => onNavigate('home')} className="hover:text-brand-gold-600">
          {language === 'hi' ? 'मुख्य पृष्ठ' : 'Home'}
        </button>
                <button onClick={() => onNavigate('shop', { category: product.category })} className="hover:text-brand-gold-600">
          {translateProductAttr(product.category, language)}
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-brand-green-800 font-bold truncate">{product.name}</span>
      </div>

      {/* Main product showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        
        {/* Left Column: Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square bg-white border border-brand-green-600/10 rounded-2xl p-6 flex items-center justify-center overflow-hidden shadow-sm relative">
            <img 
              src={selectedImage || product.mainImage} 
              alt={product.name} 
              className="max-h-[420px] object-contain hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
            {discountPercent > 0 && (
              <span className="absolute top-4 left-4 bg-brand-gold-500 text-brand-green-950 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
                {discountPercent}% {language === 'hi' ? 'छूट' : 'OFF'}
              </span>
            )}
          </div>

          {/* Thumbnails row */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-20 bg-white border-2 rounded-xl overflow-hidden flex items-center justify-center p-2.5 flex-shrink-0 cursor-pointer transition-all ${
                    (selectedImage || product.mainImage) === img 
                      ? 'border-brand-green-700 shadow-sm' 
                      : 'border-brand-green-600/5 hover:border-brand-green-600/20'
                  }`}
                >
                  <img src={img} alt={`${product.name} gallery ${i}`} className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Key Details */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-brand-gold-700 font-bold bg-brand-gold-500/10 px-2.5 py-1 rounded-md">
                {translateProductAttr(product.category, language)}
              </span>
              <span className="text-[10px] font-semibold text-brand-green-600/50 uppercase tracking-widest">SKU: {product.sku}</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-green-900 leading-tight">
              {product.name}
            </h1>
            
            {/* Rating */}
            <div className="flex items-center gap-2 pt-1">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-current' : 'text-gray-200'}`} />
                ))}
              </div>
              <span className="text-xs font-bold text-brand-green-700">
                {language === 'hi' ? `${product.rating} / 5.0 रेटिंग` : `${product.rating} / 5.0 Rating`}
              </span>
              <span className="text-brand-green-600/40 text-xs">•</span>
              <button onClick={() => setActiveTab('reviews')} className="text-xs text-brand-gold-700 font-semibold hover:underline">
                {language === 'hi' 
                  ? `(${productReviews.length} सत्यापित समीक्षाएं)` 
                  : `(${productReviews.length} verified reviews)`
                }
              </button>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="p-4 rounded-2xl bg-brand-cream-100 border border-brand-green-600/10 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-[10px] text-brand-green-600/50 font-medium uppercase tracking-wide">
                {language === 'hi' ? 'प्रीमियम फॉर्मूलेशन मूल्य' : 'Premium Formulation Price'}
              </span>
              <div className="flex items-baseline gap-2.5">
                <span className="font-serif font-bold text-3xl text-brand-green-950">₹{product.price}</span>
                {product.originalPrice > product.price && (
                  <span className="text-sm text-brand-green-600/50 line-through">₹{product.originalPrice}</span>
                )}
              </div>
            </div>
            <div className="text-right space-y-0.5">
              <span className="text-[10px] text-brand-green-600/50 font-medium uppercase tracking-wide">
                {language === 'hi' ? 'ब्रांड' : 'Label'}
              </span>
              <p className="text-xs font-bold text-brand-green-800">{product.brand}</p>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-brand-green-800/95 leading-relaxed">
            {product.description}
          </p>

          {/* Fast Highlights List */}
          <div className="space-y-2 pb-4 border-b border-brand-green-600/10">
            <span className="text-[10px] uppercase tracking-widest text-brand-gold-700 font-bold">
              {language === 'hi' ? 'गारंटी और गुणवत्ता' : 'Guarantees'}
            </span>
            <div className="grid grid-cols-2 gap-3 text-xs text-brand-green-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4.5 h-4.5 text-brand-green-700 flex-shrink-0" />
                <span>{language === 'hi' ? 'GMP गुणवत्ता प्रमाणित' : 'GMP Quality Certified'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-brand-gold-600 flex-shrink-0" />
                <span>{language === 'hi' ? '100% कीटनाशक मुक्त' : '100% Pesticide Free'}</span>
              </div>
            </div>
          </div>

          {/* Buy actions */}
          <div className="pt-2 space-y-4">
            {product.stock > 0 ? (
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Quantity input */}
                <div className="flex items-center border border-brand-green-200 rounded-xl bg-white overflow-hidden max-w-[130px] mx-auto sm:mx-0">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-3 text-brand-green-800 font-bold hover:bg-brand-green-50"
                  >
                    -
                  </button>
                  <span className="px-4 font-semibold text-sm text-brand-green-900">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-4 py-3 text-brand-green-800 font-bold hover:bg-brand-green-50"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => onAddToCart(product, quantity)}
                  className="flex-1 bg-brand-green-700 hover:bg-brand-green-800 text-brand-cream-100 font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {t('btn_add_to_cart', language)}
                </button>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 text-red-600 font-bold text-center py-3.5 rounded-xl">
                {language === 'hi' 
                  ? 'वर्तमान में आउट ऑफ स्टॉक (छोटा बैच तैयार किया जा रहा है)' 
                  : 'Currently Out of Stock (Undergoing Small-Batch Preparation)'
                }
              </div>
            )}

            {/* Wishlist & Share controls */}
            <div className="flex justify-between items-center text-xs text-brand-green-800 pt-2 font-semibold">
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

      {/* Structured tabs for Ingredients, dosage, usage, reviews */}
      <section id="remedy-deep-tabs" className="bg-white border border-brand-green-600/5 rounded-2xl overflow-hidden shadow-sm">
        
        {/* Tab triggers */}
        <div className="flex flex-row overflow-x-auto whitespace-nowrap border-b border-brand-green-600/10 bg-brand-cream-100/30 scrollbar-none snap-x">
          {[
            { id: 'ingredients', label: language === 'hi' ? 'वैदिक जड़ी-बूटियाँ' : 'Vedic Botanicals' },
            { id: 'benefits', label: language === 'hi' ? 'चिकित्सीय लाभ' : 'Health Benefits' },
            { id: 'dosage', label: language === 'hi' ? 'खुराक और निर्देश' : 'Dosage & Directions' },
            { id: 'faqs', label: language === 'hi' ? 'पूछे जाने वाले प्रश्न' : 'Remedy FAQs' },
            { id: 'reviews', label: language === 'hi' ? `समीक्षाएं (${productReviews.length})` : `Reviews (${productReviews.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`shrink-0 snap-start px-5 py-4 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-colors ${
                activeTab === tab.id 
                  ? 'border-brand-green-700 text-brand-green-900 bg-white' 
                  : 'border-transparent text-brand-green-600 hover:text-brand-green-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Panels */}
        <div className="p-6 md:p-8">
          
          {/* Ingredients tab */}
          {activeTab === 'ingredients' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-brand-green-600/5">
                <Sparkles className="w-4 h-4 text-brand-gold-600" />
                <h4 className="font-serif text-base font-bold text-brand-green-900">
                  {language === 'hi' ? 'चिकित्सीय वनस्पति संरचना' : 'Therapeutic Botanical Composition'}
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {product.ingredients.map((ing, i) => (
                  <div key={i} className="p-4 bg-brand-cream-100/40 rounded-xl border border-brand-green-600/5 space-y-1">
                    <h5 className="font-serif text-sm font-bold text-brand-green-900">
                      {translateProductAttr(ing.name, language)}
                    </h5>
                    <p className="text-xs text-brand-green-800/80 leading-relaxed">{ing.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Benefits tab */}
          {activeTab === 'benefits' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-brand-green-600/5">
                <Info className="w-4 h-4 text-brand-gold-600" />
                <h4 className="font-serif text-base font-bold text-brand-green-900">
                  {language === 'hi' ? 'प्रमाणित स्वास्थ्य लाभ' : 'Proven Health Benefits'}
                </h4>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {product.benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-brand-green-800 leading-relaxed bg-brand-green-50/20 p-3 rounded-lg border border-brand-green-600/5">
                    <ChevronRight className="w-4 h-4 text-brand-gold-600 flex-shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Dosage tab */}
          {activeTab === 'dosage' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-brand-green-600/5">
                <Sparkles className="w-4 h-4 text-brand-gold-600" />
                <h4 className="font-serif text-base font-bold text-brand-green-900">
                  {language === 'hi' ? 'खुराक और उपयोग के निर्देश' : 'Dosage & Directions for Use'}
                </h4>
              </div>
              <div className="space-y-4">
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-brand-green-800 uppercase tracking-wider text-[10px]">
                    {language === 'hi' ? 'अनुशंसित खुराक:' : 'Recommended Dosage:'}
                  </span>
                  <p className="text-brand-green-900 bg-brand-cream-100/30 p-3.5 rounded-xl border border-brand-green-600/5 font-medium italic">{product.dosage}</p>
                </div>
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-brand-green-800 uppercase tracking-wider text-[10px]">
                    {language === 'hi' ? 'उपयोग / उपभोग निर्देश:' : 'Application / Consumption Instructions:'}
                  </span>
                  <p className="text-brand-green-900 leading-relaxed">{product.usageInstructions}</p>
                </div>
              </div>
            </div>
          )}

          {/* FAQs tab */}
          {activeTab === 'faqs' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-brand-green-600/5">
                <Info className="w-4 h-4 text-brand-gold-600" />
                <h4 className="font-serif text-base font-bold text-brand-green-900">
                  {language === 'hi' ? 'अक्सर पूछे जाने वाले प्रश्न' : 'Frequently Asked Questions'}
                </h4>
              </div>
              {product.faqs && product.faqs.length > 0 ? (
                <div className="space-y-4">
                  {product.faqs.map((faq, i) => (
                    <div key={i} className="space-y-1.5 text-xs bg-brand-cream-100/10 border border-brand-green-600/10 p-4 rounded-xl">
                      <h5 className="font-bold text-brand-green-900 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-brand-gold-500/15 text-brand-gold-700 flex items-center justify-center font-bold text-[10px]">Q</span>
                        <span>{faq.question}</span>
                      </h5>
                      <p className="text-brand-green-800/80 leading-relaxed pl-6">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-brand-green-600">No specific FAQs compiled for this formulation yet.</p>
              )}
            </div>
          )}

          {/* Reviews tab */}
          {activeTab === 'reviews' && (
            <div className="space-y-8">
              
              {/* Reviews Header & List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-brand-green-600/5">
                  <h4 className="font-serif text-base font-bold text-brand-green-900">Customer Reviews & Ratings</h4>
                  <span className="text-xs font-bold text-brand-green-700">{productReviews.length} Verified Reviews</span>
                </div>

                {productReviews.length === 0 ? (
                  <p className="text-xs text-brand-green-600 italic">No reviews yet. Be the first to verify this Ayurvedic formulation!</p>
                ) : (
                  <div className="space-y-4">
                    {productReviews.map(rev => (
                      <div key={rev.id} className="bg-brand-cream-100/15 border border-brand-green-600/10 p-4.5 rounded-xl space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-current' : 'text-gray-200'}`} />
                            ))}
                          </div>
                          <span className="text-[10px] text-brand-green-600/50">{rev.date}</span>
                        </div>
                        <p className="text-xs text-brand-green-800 italic">"{rev.comment}"</p>
                        <p className="text-[10px] font-bold text-brand-green-700">— {rev.userName}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Review Entry Form */}
              <div className="bg-brand-cream-100/40 p-6 rounded-2xl border border-brand-green-600/10 space-y-4">
                <div className="flex items-center gap-1.5 pb-2 border-b border-brand-green-600/5">
                  <MessageSquare className="w-5 h-5 text-brand-gold-600" />
                  <h5 className="font-serif text-sm font-bold text-brand-green-800">Add Your Experience</h5>
                </div>

                {reviewSubmitted ? (
                  <div className="bg-brand-green-100/50 border border-brand-green-600/10 text-brand-green-900 text-xs p-4 rounded-xl text-center font-medium">
                    🎉 Thank you! Your review has been recorded and compiled.
                  </div>
                ) : (
                  <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
                    
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-brand-green-800">Your Remedy Rating:</span>
                      <div className="flex gap-1 text-amber-400">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setReviewRating(star)}
                            className="p-1 hover:scale-115 transition-transform cursor-pointer"
                          >
                            <Star className={`w-5 h-5 ${star <= reviewRating ? 'fill-current' : 'text-gray-200'}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-brand-green-800">Share Your Wellness Journal Details (Review Comment)</label>
                      <textarea
                        required
                        placeholder="Detail how this compound affected your body, your favorite time to consume it, or dosage effects..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        rows={3}
                        className="w-full bg-white border border-brand-green-200 focus:outline-none focus:border-brand-green-700 p-3 rounded-xl"
                      />
                    </div>

                    <button
                      type="submit"
                      className="bg-brand-green-700 hover:bg-brand-green-800 text-brand-cream-100 font-bold px-6 py-2 rounded-xl cursor-pointer"
                    >
                      Publish Verified Experience
                    </button>

                  </form>
                )}
              </div>

            </div>
          )}

        </div>

      </section>

      {/* Related Products row */}
      {relatedProducts.length > 0 && (
        <section id="related-compounds" className="space-y-6">
          <h3 className="font-serif text-xl font-bold text-brand-green-900 pb-3 border-b border-brand-green-600/10">
            🌿 Synergetic Related Remedies
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {relatedProducts.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-brand-green-600/5 p-4 flex flex-col justify-between hover:shadow-md">
                <div 
                  className="aspect-square bg-brand-green-50/10 rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => onNavigate('product', { id: p.id })}
                >
                  <img src={p.mainImage} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <div className="pt-3 space-y-1">
                  <h4 
                    onClick={() => onNavigate('product', { id: p.id })}
                    className="font-serif text-sm font-bold text-brand-green-800 line-clamp-1 hover:text-brand-gold-600 cursor-pointer"
                  >
                    {p.name}
                  </h4>
                  <span className="font-serif font-bold text-xs text-brand-green-900">₹{p.price}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
};
