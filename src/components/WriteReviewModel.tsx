/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Star, CheckCircle2, ShieldCheck, MessageSquare, Sparkles } from 'lucide-react';
import { Language } from '../lib/translations';

interface WriteReviewModalProps {
  productId: string;
  productName: string;
  productImage?: string;
  onClose: () => void;
  onSubmitReview: (reviewData: { productId: string; rating: number; comment: string; userName?: string; userEmail?: string }) => Promise<void> | void;
  language: Language;
  currentUser?: { fullName?: string; email?: string } | null;
  defaultRating?: number;
}

export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  productId,
  productName,
  productImage,
  onClose,
  onSubmitReview,
  language,
  currentUser,
  defaultRating = 5
}) => {
  const [rating, setRating] = useState<number>(defaultRating);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [reviewerName, setReviewerName] = useState(currentUser?.fullName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setErrorMsg(language === 'hi' ? 'कृपया अपनी समीक्षा लिखें।' : 'Please enter your review feedback.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await onSubmitReview({
        productId,
        rating,
        comment: comment.trim(),
        userName: reviewerName.trim() || currentUser?.fullName || (language === 'hi' ? 'सत्यापित खरीदार' : 'Verified Buyer'),
        userEmail: currentUser?.email
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1600);
    } catch (err) {
      setErrorMsg(language === 'hi' ? 'समीक्षा सबमिट करने में विफल रहा। पुनः प्रयास करें।' : 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-brand-green-950/40 backdrop-blur-xs cursor-pointer"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden z-10 border border-brand-green-600/15 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-brand-green-600/10 flex items-center justify-between bg-brand-cream-50/70">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-brand-green-950 text-sm">
                {language === 'hi' ? 'उत्पाद समीक्षा दें' : 'Rate & Review Product'}
              </h3>
              <p className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>{language === 'hi' ? 'सत्यापित खरीद समीक्षा' : 'Verified Purchase Review'}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-brand-green-100/50 text-brand-green-800/60 hover:text-brand-green-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8 animate-bounce" />
              </div>
              <h4 className="font-bold text-base text-brand-green-950">
                {language === 'hi' ? 'समीक्षा सफलतापूर्वक सबमिट की गई!' : 'Thank You for Your Review!'}
              </h4>
              <p className="text-xs text-brand-green-700 max-w-xs mx-auto">
                {language === 'hi'
                  ? 'आपकी सत्यापित समीक्षा प्रकाशित कर दी गई है।'
                  : 'Your verified purchaser review has been posted and will help other wellness seekers.'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* Product Mini Preview */}
              <div className="flex items-center gap-3 p-3 bg-brand-cream-100/50 border border-brand-green-600/10 rounded-2xl">
                {productImage && (
                  <div className="w-12 h-12 bg-white border border-brand-green-100 rounded-xl p-1 shrink-0 flex items-center justify-center">
                    <img 
                      src={productImage} 
                      alt={productName} 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-xs text-brand-green-950 truncate">{productName}</h4>
                  <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold border border-emerald-200/50 inline-block mt-0.5">
                    {language === 'hi' ? 'हालिया खरीदारी' : 'Verified Order Item'}
                  </span>
                </div>
              </div>

              {/* Interactive Rating Selection */}
              <div className="text-center py-2 space-y-1.5">
                <label className="font-bold text-brand-green-900 block">
                  {language === 'hi' ? 'रेटिंग चुनें:' : 'Select Your Rating:'}
                </label>
                <div className="flex justify-center items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-110 cursor-pointer focus:outline-none"
                    >
                      <Star 
                        className={`w-7 h-7 transition-colors ${
                          star <= (hoverRating || rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-200 hover:text-amber-200'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
                <p className="text-[11px] font-bold text-brand-gold-800">
                  {rating === 5 && (language === 'hi' ? 'उत्कृष्ट (5/5)' : 'Excellent (5/5)')}
                  {rating === 4 && (language === 'hi' ? 'बहुत अच्छा (4/5)' : 'Very Good (4/5)')}
                  {rating === 3 && (language === 'hi' ? 'अच्छा (3/5)' : 'Good (3/5)')}
                  {rating === 2 && (language === 'hi' ? 'औसत (2/5)' : 'Fair (2/5)')}
                  {rating === 1 && (language === 'hi' ? 'सुधार की आवश्यकता (1/5)' : 'Poor (1/5)')}
                </p>
              </div>

              {/* Reviewer Name if not logged in */}
              {!currentUser && (
                <div className="space-y-1">
                  <label className="font-bold text-brand-green-900">
                    {language === 'hi' ? 'आपका नाम:' : 'Your Name:'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={language === 'hi' ? 'अपना नाम दर्ज करें...' : 'Enter your name...'}
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-brand-cream-50 border border-brand-green-200 focus:outline-none focus:border-brand-green-700 text-xs"
                  />
                </div>
              )}

              {/* Review Text Area */}
              <div className="space-y-1">
                <label className="font-bold text-brand-green-900 flex items-center justify-between">
                  <span>{language === 'hi' ? 'आपका अनुभव और समीक्षा:' : 'Your Experience & Thoughts:'}</span>
                  <span className="text-[10px] text-brand-green-600 font-normal">{comment.length}/500</span>
                </label>
                <textarea
                  rows={3}
                  required
                  maxLength={500}
                  placeholder={language === 'hi' 
                    ? 'इस उत्पाद के परिणाम, गुणवत्ता और प्रभाव के बारे में बताएं...' 
                    : 'Share details about the quality, benefits, and results of using this product...'}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-3 rounded-xl bg-brand-cream-50 border border-brand-green-200 focus:outline-none focus:border-brand-green-700 text-xs leading-relaxed"
                />
              </div>

              {errorMsg && (
                <p className="text-red-600 bg-red-50 p-2 rounded-xl border border-red-200 text-center font-bold">
                  {errorMsg}
                </p>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 py-2.5 bg-brand-cream-200 hover:bg-brand-cream-300 text-brand-green-900 font-bold rounded-xl cursor-pointer transition-colors"
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 py-2.5 bg-brand-green-800 hover:bg-brand-green-900 disabled:opacity-50 text-white font-bold rounded-xl uppercase tracking-wider cursor-pointer shadow-md flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-brand-gold-400" />
                  <span>{isSubmitting ? (language === 'hi' ? 'सबमिट हो रहा है...' : 'Posting...') : (language === 'hi' ? 'समीक्षा सबमिट करें' : 'Submit Review')}</span>
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};
