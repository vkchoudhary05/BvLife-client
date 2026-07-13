/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { Star, Clock, User, ArrowLeft, HelpCircle, Mail, Phone, MapPin, Sparkles, ShieldCheck, Sprout } from 'lucide-react';
import { Blog, FAQ } from '../types';

interface StaticPagesProps {
  pageType: 'shipping' | 'refund' | 'privacy' | 'terms' | 'faq' | 'blog' | 'blog-post' | 'about' | 'contact';
  params?: any;
  blogs: Blog[];
  faqs: FAQ[];
  onNavigate: (page: string, params?: any) => void;
}

export const StaticPages: React.FC<StaticPagesProps> = ({
  pageType,
  params,
  blogs,
  faqs,
  onNavigate
}) => {
  const [contactForm, setContactForm] = useState({ name: '', email: '', dosha: 'General Consultation', message: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [activeDoshaTab, setActiveDoshaTab] = useState<'vata' | 'pitta' | 'kapha'>('vata');

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    // Auto reset after 5 seconds
    setTimeout(() => {
      setContactSubmitted(false);
    }, 5000);
  };

  // Retrieve individual blog post if matching ID
  const selectedBlog = useMemo(() => {
    if (pageType === 'blog-post' && params?.id) {
      return blogs.find(b => b.id === params.id);
    }
    return null;
  }, [blogs, pageType, params]);

  return (
    <div id="static-pages" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* SHIPPING POLICY */}
      {pageType === 'shipping' && (
        <div className="space-y-6">
          <h2 className="font-serif text-3xl font-bold text-brand-green-900 border-b border-brand-green-600/10 pb-4">
            Shipping, Delivery, and Transport Policies
          </h2>
          <div className="prose prose-brand text-xs sm:text-sm text-brand-green-800 space-y-4 leading-relaxed">
            <p>
              At <strong className="font-bold">Grams Life</strong>, we believe that the transport of therapeutic herbs is a sacred ritual. Every formulation, root capsule, and skincare elixir is packaged in premium protective containers to guard biochemical potency during shipment.
            </p>
            <h4 className="font-serif text-base font-bold text-brand-green-900 pt-2">1. Shipping Logistics & Coverage</h4>
            <p>
              We provide delivery services to over 19,000 postal pin codes across India, plus select international botanical wellness regions. Most domestic orders placed before 2:00 PM IST are handed to our delivery partners on the same calendar day.
            </p>
            <h4 className="font-serif text-base font-bold text-brand-green-900 pt-2">2. Processing Times & Delivery Speeds</h4>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Metropolitan Regions (Mumbai, Delhi-NCR, Bangalore, Chennai):</strong> Delivered within 2 to 3 business days.</li>
              <li><strong>Tier 2 & 3 Cities:</strong> Delivered within 3 to 5 business days.</li>
              <li><strong>High-Altitude & North East regions:</strong> Delivered within 5 to 7 business days.</li>
            </ul>
            <h4 className="font-serif text-base font-bold text-brand-green-900 pt-2">3. Shipping Rates</h4>
            <p>
              We offer free standard shipping on orders exceeding ₹999. For orders below this threshold, a flat transport and logistics handling charge of ₹50 is added at checkout.
            </p>
          </div>
        </div>
      )}

      {/* CANCELLATION & REFUND POLICY */}
      {pageType === 'refund' && (
        <div className="space-y-6">
          <h2 className="font-serif text-3xl font-bold text-brand-green-900 border-b border-brand-green-600/10 pb-4">
            Cancellation & Refund Policies
          </h2>
          <div className="prose prose-brand text-xs sm:text-sm text-brand-green-800 space-y-4 leading-relaxed">
            <p>
              Our pledge of wellness is founded on complete trust. If you are unsatisfied with any Ayurvedic compound, we strive to make refunds simple.
            </p>
            <h4 className="font-serif text-base font-bold text-brand-green-900 pt-2">1. 14-Day Wellness Guarantee</h4>
            <p>
              We offer a flexible 14-day return window from the day of delivery. If a remedy does not balance your body constitution, you can initiate a return.
            </p>
            <h4 className="font-serif text-base font-bold text-brand-green-900 pt-2">2. Returns Conditions</h4>
            <p>
              To claim a full refund, items should ideally be in original, unused, sealed containers. However, for wellness supplements (such as tablets or powders), we accept returns with up to 25% of the content consumed, acknowledging that personal bio-evaluations are necessary.
            </p>
            <h4 className="font-serif text-base font-bold text-brand-green-900 pt-2">3. Processing Refunds</h4>
            <p>
              Refunds are processed back to your original payment method (Bank account, Credit Card, UPI, or Wallet) within 5 to 7 working days once returned herbs are verified at our central processing warehouse.
            </p>
          </div>
        </div>
      )}

      {/* PRIVACY POLICY */}
      {pageType === 'privacy' && (
        <div className="space-y-6">
          <h2 className="font-serif text-3xl font-bold text-brand-green-900 border-b border-brand-green-600/10 pb-4">
            Privacy Guard & Cookies Policy
          </h2>
          <div className="prose prose-brand text-xs sm:text-sm text-brand-green-800 space-y-4 leading-relaxed">
            <p>
              Grams Life values the security of your Ayurvedic personal biological health logs. We never trade, rent, or sell user personal identifiers, health symptoms, or order histories.
            </p>
            <h4 className="font-serif text-base font-bold text-brand-green-900 pt-2">1. Data Collected</h4>
            <p>
              We collect information provided explicitly during user account registration, checkouts, and AI consultation chats (e.g., body constitution, symptoms, lifestyle details). This data is purely processed to recommend synergetic Ayurvedic wellness products.
            </p>
            <h4 className="font-serif text-base font-bold text-brand-green-900 pt-2">2. Cookie Policy</h4>
            <p>
              We utilize technical cookies to store active session authentication tokens, remember cart items, and optimize page load speeds in your local browser cache.
            </p>
          </div>
        </div>
      )}

      {/* TERMS OF SERVICE */}
      {pageType === 'terms' && (
        <div className="space-y-6">
          <h2 className="font-serif text-3xl font-bold text-brand-green-900 border-b border-brand-green-600/10 pb-4">
            Terms & Conditions of Service
          </h2>
          <div className="prose prose-brand text-xs sm:text-sm text-brand-green-800 space-y-4 leading-relaxed">
            <p>
              Welcome to the Grams Life digital platform. By accessing our wellness shop and interacting with our AI Acharya consultant, you agree to comply with the terms documented below.
            </p>
            <h4 className="font-serif text-base font-bold text-brand-green-900 pt-2">1. Medical Disclaimer</h4>
            <p>
              The digital formulations, wellness guides, and AI biological evaluations provided are for educational and traditional reference purposes only. They are not intended as official medical advice or diagnostic plans for chronic clinical illnesses. Always consult with certified medical experts.
            </p>
            <h4 className="font-serif text-base font-bold text-brand-green-900 pt-2">2. Pricing & Payments</h4>
            <p>
              Grams Life reserves the right to modify prices, discontinue limited botanical batches, or alter discount coupons depending on high-altitude herb sourcing availability. All transactions are securely audited.
            </p>
          </div>
        </div>
      )}

      {/* FAQS PAGE */}
      {pageType === 'faq' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="border-b border-brand-green-600/10 pb-4">
            <h2 className="font-serif text-3xl font-bold text-brand-green-900">
              General Help Centers & FAQs
            </h2>
            <p className="text-xs text-brand-green-600/70 mt-1">Understanding Ayurvedic life balancing, dosage rules, and shipping.</p>
          </div>

          <div className="space-y-4">
            {faqs.map(faq => (
              <div key={faq.id} className="bg-white border border-brand-green-600/15 p-5 rounded-2xl space-y-2">
                <h4 className="font-serif text-base font-bold text-brand-green-900 flex items-start gap-2.5">
                  <HelpCircle className="w-5 h-5 text-brand-gold-600 flex-shrink-0 mt-0.5" />
                  <span>{faq.question}</span>
                </h4>
                <p className="text-xs text-brand-green-800/80 leading-relaxed pl-7">{faq.answer}</p>
                <div className="pl-7 pt-1">
                  <span className="text-[10px] bg-brand-green-50 text-brand-green-700 font-bold px-2 py-0.5 rounded uppercase">
                    Category: {faq.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ALL BLOGS PAGE */}
      {pageType === 'blog' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="border-b border-brand-green-600/10 pb-4">
            <h2 className="font-serif text-3xl font-bold text-brand-green-900">
              Vedic Wellness Chronicles
            </h2>
            <p className="text-xs text-brand-green-600/70 mt-1">Ancient wisdom, seasonal regimens, and clinical research updates.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {blogs.map(blog => (
              <div key={blog.id} className="group bg-white rounded-2xl border border-brand-green-600/5 hover:shadow-lg overflow-hidden transition-all flex flex-col justify-between">
                <div className="aspect-[16/10] overflow-hidden relative">
                  <img src={blog.image} alt={blog.title} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300" />
                  <div className="absolute top-3 left-3 flex gap-1">
                    {blog.categories.map((c, i) => (
                      <span key={i} className="bg-brand-green-900/90 text-brand-cream-100 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <h3 
                      onClick={() => onNavigate('static', { page: 'blog-post', id: blog.id })}
                      className="font-serif text-base font-bold text-brand-green-900 hover:text-brand-gold-600 cursor-pointer line-clamp-2 leading-snug"
                    >
                      {blog.title}
                    </h3>
                    <p className="text-xs text-brand-green-800/85 line-clamp-3 leading-relaxed">
                      {blog.summary}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-brand-green-600/50 pt-3 border-t border-brand-green-600/5">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      <span>By {blog.author}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{blog.readTime}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INDIVIDUAL BLOG POST READER */}
      {pageType === 'blog-post' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {selectedBlog ? (
            <article className="space-y-6">
              
              {/* Back to blogs */}
              <button 
                onClick={() => onNavigate('static', { page: 'blog' })}
                className="flex items-center gap-1 text-xs text-brand-green-700 hover:text-brand-gold-600 font-bold cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Wellness Chronicles</span>
              </button>

              <div className="space-y-3">
                <div className="flex gap-2 text-xs text-brand-gold-700 font-bold uppercase">
                  {selectedBlog.categories.map((c, i) => <span key={i}>{c}</span>)}
                </div>
                <h1 className="font-serif text-2xl sm:text-4xl font-bold text-brand-green-900 leading-tight">
                  {selectedBlog.title}
                </h1>
                
                {/* Meta row */}
                <div className="flex items-center gap-4 text-xs text-brand-green-600/60 pb-4 border-b border-brand-green-600/10">
                  <span className="font-medium">Published: {selectedBlog.publishedAt}</span>
                  <span>•</span>
                  <span>By {selectedBlog.author}</span>
                  <span>•</span>
                  <span>{selectedBlog.readTime} read time</span>
                </div>
              </div>

              {/* Main Banner */}
              <div className="aspect-[21/9] rounded-2xl overflow-hidden shadow-sm">
                <img src={selectedBlog.image} alt={selectedBlog.title} className="w-full h-full object-cover" />
              </div>

              {/* Rich Content body */}
              <div className="prose prose-brand max-w-none text-brand-green-900 text-sm sm:text-base space-y-4 leading-relaxed">
                {selectedBlog.content.split('\n').map((para, idx) => {
                  if (para.startsWith('###')) {
                    return <h3 key={idx} className="font-serif text-lg sm:text-xl font-bold text-brand-green-900 pt-4 pb-1 border-b border-brand-green-600/5">{para.replace('###', '')}</h3>;
                  } else if (para.trim() === '') {
                    return <div key={idx} className="h-2" />;
                  } else {
                    return <p key={idx} className="leading-relaxed">{para}</p>;
                  }
                })}
              </div>

            </article>
          ) : (
            <div className="text-center py-16 space-y-4 max-w-sm mx-auto">
              <h3 className="font-serif text-xl font-bold text-brand-green-800">Chronicle Post Not Found</h3>
              <p className="text-xs text-brand-green-600/70">The Ayurvedic wellness guide you are looking for has been archived or does not exist.</p>
              <button onClick={() => onNavigate('static', { page: 'blog' })} className="bg-brand-green-700 text-brand-cream-100 font-bold px-6 py-2 rounded-xl text-xs">
                Back to Blogs
              </button>
            </div>
          )}
        </div>
      )}

      {/* OUR HERITAGE PAGE */}
      {pageType === 'about' && (
        <div className="space-y-16 animate-in fade-in duration-500">
          
          {/* Header Banner Section */}
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-[10px] bg-brand-gold-50 border border-brand-gold-200 text-brand-gold-700 px-3.5 py-1.5 rounded-full font-bold uppercase tracking-widest shadow-sm">
              Our Heritage & Legacy
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl font-medium tracking-tight text-brand-green-900 mt-3">
              The Chronicles of <span className="font-serif italic text-brand-gold-600">Samskara</span>
            </h1>
            <div className="w-16 h-[1.5px] bg-brand-gold-500/40 mx-auto my-4" />
            <p className="text-xs sm:text-sm text-brand-green-800/80 leading-relaxed">
              We bridge the profound silence of ancestral Himalayan sanctuaries with modern high-performance computational chromatography. Every grain carries a chronicle of balance.
            </p>
          </div>

          {/* Majestic Hero Cover Card with Side Quote */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-7 bg-brand-green-950 rounded-[2.5rem] p-8 sm:p-12 text-brand-cream-100 flex flex-col justify-between shadow-xl relative overflow-hidden min-h-[360px]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green-800/20 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-gold-600/10 rounded-full blur-3xl -ml-16 -mb-16" />
              
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-1.5">
                  <span className="h-[1px] w-8 bg-brand-gold-500" />
                  <span className="text-[10px] uppercase tracking-widest text-brand-gold-400 font-bold">The Core Mandate</span>
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl font-medium text-brand-cream-50 leading-tight">
                  Prana preserved in the <br />
                  <span className="italic text-brand-gold-400">exact weight of wellness</span>.
                </h3>
              </div>

              <div className="relative z-10 pt-8 border-t border-brand-cream-100/10 space-y-3">
                <p className="text-xs text-brand-cream-100/80 leading-relaxed max-w-md">
                  Historically, master healers measured extracts not in standardized volumes, but in precise ratios tailored to the local atmosphere and biological soil cycles. <strong>Grams Life</strong> honors this micro-accuracy down to the milligram.
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-brand-gold-500/20 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-brand-gold-400" />
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-brand-gold-400 font-bold">Uttarakhand Sourcing</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white border border-brand-green-600/10 rounded-[2.5rem] p-8 flex flex-col justify-center space-y-6 shadow-sm">
              <span className="text-brand-gold-600 text-3xl font-serif">“</span>
              <p className="font-serif text-sm sm:text-base text-brand-green-900 leading-relaxed italic">
                "Ayurveda is not a static list of physical remedies, but a living sanctuary. It is the perfect orchestration of physical elements, cosmic energy, and human biology."
              </p>
              <div className="space-y-1 pt-4 border-t border-brand-green-600/5">
                <p className="text-xs font-bold text-brand-green-900 uppercase tracking-wider">The Charaka Samhita</p>
                <p className="text-[10px] text-brand-green-600/60 font-medium">Sutra Sthana, Chapter I, Circa 300 BCE</p>
              </div>
            </div>
          </div>

          {/* Interactive Segment: The Triple Dosha Alchemical Sourcing */}
          <div className="bg-white border border-brand-green-600/10 rounded-[2.5rem] p-8 sm:p-12 space-y-8 shadow-sm">
            <div className="text-center space-y-2 max-w-md mx-auto">
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-brand-green-900">
                Alchemical Customizations (Samskara)
              </h3>
              <p className="text-xs text-brand-green-600/80">
                Ayurvedic processing changes depending on the elemental energy (Dosha) targeted. Click below to explore our custom heritage techniques:
              </p>
            </div>

            {/* Dosha Selector Tabs */}
            <div className="flex justify-center border-b border-brand-green-600/5 pb-2">
              <div className="flex bg-brand-green-50 p-1.5 rounded-2xl gap-1">
                <button
                  onClick={() => setActiveDoshaTab('vata')}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-250 cursor-pointer ${
                    activeDoshaTab === 'vata'
                      ? 'bg-brand-green-700 text-brand-cream-100 shadow-md'
                      : 'text-brand-green-700/70 hover:text-brand-green-900 hover:bg-brand-green-100/40'
                  }`}
                >
                  Vata (Wind & Ether)
                </button>
                <button
                  onClick={() => setActiveDoshaTab('pitta')}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-250 cursor-pointer ${
                    activeDoshaTab === 'pitta'
                      ? 'bg-brand-green-700 text-brand-cream-100 shadow-md'
                      : 'text-brand-green-700/70 hover:text-brand-green-900 hover:bg-brand-green-100/40'
                  }`}
                >
                  Pitta (Fire & Water)
                </button>
                <button
                  onClick={() => setActiveDoshaTab('kapha')}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-250 cursor-pointer ${
                    activeDoshaTab === 'kapha'
                      ? 'bg-brand-green-700 text-brand-cream-100 shadow-md'
                      : 'text-brand-green-700/70 hover:text-brand-green-900 hover:bg-brand-green-100/40'
                  }`}
                >
                  Kapha (Earth & Water)
                </button>
              </div>
            </div>

            {/* Dynamic Content Cards */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center pt-4">
              
              <div className="md:col-span-7 space-y-4">
                {activeDoshaTab === 'vata' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <span className="text-[9px] font-bold uppercase tracking-widest bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full">
                      Prana-Samskara (Anchoring & Restorative)
                    </span>
                    <h4 className="font-serif text-2xl font-bold text-brand-green-900">
                      Unctuous Slow Infusions for Scattered Energies
                    </h4>
                    <p className="text-xs text-brand-green-800/80 leading-relaxed">
                      Vata is governed by air and movement, meaning it is naturally light, dry, and cold. To balance these qualities, our heritage process uses heavy, slow-absorbing organic lipid carriers (such as A2 Gir Cow Ghee) heated slowly in thick clay pots.
                    </p>
                    <div className="p-4 bg-brand-green-50 rounded-xl border border-brand-green-100 space-y-2">
                      <p className="text-xs font-bold text-brand-green-900">Primary Botanical Alchemies:</p>
                      <ul className="text-xs text-brand-green-800/80 list-disc list-inside space-y-1">
                        <li><strong>Ashwagandha Roots:</strong> Grown in high-altitude dry soil for extreme adaptogenic strength.</li>
                        <li><strong>Shankhpushpi:</strong> Handpicked at sunrise to preserve nervous system calming compounds.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {activeDoshaTab === 'pitta' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <span className="text-[9px] font-bold uppercase tracking-widest bg-red-50 text-red-800 border border-red-200 px-2.5 py-1 rounded-full">
                      Tejas-Samskara (Cooling & Tempering)
                    </span>
                    <h4 className="font-serif text-2xl font-bold text-brand-green-900">
                      Cold Silver-Purified Extraction for Internal Fire
                    </h4>
                    <p className="text-xs text-brand-green-800/80 leading-relaxed">
                      Pitta controls digestion, heat, and transformational metabolic processes. Excess Pitta creates systemic inflammation. We utilize copper vessels paired with cold infusions (Sheeta-Kalpana), cooling formulas overnight in moonlight.
                    </p>
                    <div className="p-4 bg-brand-green-50 rounded-xl border border-brand-green-100 space-y-2">
                      <p className="text-xs font-bold text-brand-green-900">Primary Botanical Alchemies:</p>
                      <ul className="text-xs text-brand-green-800/80 list-disc list-inside space-y-1">
                        <li><strong>Shatavari:</strong> Wild-crafted water-retaining roots to rehydrate dry, burnt tissue.</li>
                        <li><strong>Gotu Kola (Brahmi):</strong> Extracted under 35°C to protect delicate neurological enzymes.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {activeDoshaTab === 'kapha' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <span className="text-[9px] font-bold uppercase tracking-widest bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-full">
                      Ojas-Samskara (Stimulating & Cleansing)
                    </span>
                    <h4 className="font-serif text-2xl font-bold text-brand-green-900">
                      Copper-Catalyzed Botanical Ashes to Ignite Metabolism
                    </h4>
                    <p className="text-xs text-brand-green-800/80 leading-relaxed">
                      Kapha embodies earth, water, and static stability. Excess leads to heavy lymphatic congestion and metabolic blocks. We apply high-heat copper crystallization and sun-baked drying (Putas) to produce light, bio-available ashes.
                    </p>
                    <div className="p-4 bg-brand-green-50 rounded-xl border border-brand-green-100 space-y-2">
                      <p className="text-xs font-bold text-brand-green-900">Primary Botanical Alchemies:</p>
                      <ul className="text-xs text-brand-green-800/80 list-disc list-inside space-y-1">
                        <li><strong>Triphala:</strong> Wood-fire smoked botanical skins to scrape stagnant digestive plaque.</li>
                        <li><strong>Pippali (Long Pepper):</strong> High-potency piperine extracts that stimulate metabolic flame.</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              <div className="md:col-span-5 bg-brand-green-50 rounded-2xl p-6 border border-brand-green-200/30 flex flex-col justify-between h-full space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-brand-gold-700 tracking-wider">Method of Extraction</span>
                  <h5 className="font-serif text-sm font-bold text-brand-green-900">Ancient Texts + Chromatographic Safety</h5>
                </div>
                <p className="text-xs text-brand-green-700 leading-relaxed">
                  Every extraction has been double-verified. While we preserve the strict spiritual timing and physical slow heating rules, our modern laboratories confirm the exact molecular active ingredients and total absence of heavy metals.
                </p>
                <div className="flex items-center gap-2 pt-2 border-t border-brand-green-600/5 text-[10px] text-brand-green-600/80 font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4.5 h-4.5 text-brand-green-700" />
                  <span>100% Sourced with Accountability</span>
                </div>
              </div>

            </div>
          </div>

          {/* The Ancestral Timeline Section */}
          <div className="space-y-8">
            <div className="text-center space-y-2 max-w-md mx-auto">
              <span className="text-[9px] bg-brand-gold-50 border border-brand-gold-100 text-brand-gold-700 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                Our Timeline
              </span>
              <h3 className="font-serif text-2xl font-bold text-brand-green-900 mt-2">
                The Heritage Chronicles
              </h3>
              <p className="text-xs text-brand-green-600/80">
                Tracing our spiritual, agricultural, and technological evolution through history.
              </p>
            </div>

            <div className="relative max-w-3xl mx-auto px-4 sm:px-6">
              {/* Center line (hidden on small mobile, visible on tablet+) */}
              <div className="absolute left-1/2 transform -translate-x-1/2 top-4 bottom-4 w-0.5 bg-brand-green-600/10 hidden md:block" />

              <div className="space-y-12">
                
                {/* Milestone 1 */}
                <div className="relative flex flex-col md:flex-row md:items-center">
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full border-2 border-brand-gold-500 bg-white z-10 hidden md:block" />
                  <div className="md:w-1/2 md:pr-10 md:text-right space-y-2">
                    <span className="font-serif text-3xl font-bold text-brand-gold-600 leading-none">5000 BCE</span>
                    <h4 className="font-serif text-base font-bold text-brand-green-900">The Himalayan Origins</h4>
                    <p className="text-xs text-brand-green-800/80 leading-relaxed">
                      The core principles of internal balance and botanical synergy are scribed into the Rigveda and later formulated into the legendary treatises of Charaka and Sushruta in northern India.
                    </p>
                  </div>
                  <div className="md:w-1/2 md:pl-10" />
                </div>

                {/* Milestone 2 */}
                <div className="relative flex flex-col md:flex-row md:items-center">
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full border-2 border-brand-gold-500 bg-white z-10 hidden md:block" />
                  <div className="md:w-1/2" />
                  <div className="md:w-1/2 md:pl-10 space-y-2">
                    <span className="font-serif text-3xl font-bold text-brand-gold-600 leading-none">1948</span>
                    <h4 className="font-serif text-base font-bold text-brand-green-900">The Shastri Family Farm</h4>
                    <p className="text-xs text-brand-green-800/80 leading-relaxed">
                      Our founding family opens a humble clay-pot apothecary near the Ganga river in Rishikesh, servicing local yogic communities and compiling hand-indexed logbooks of botanical weights.
                    </p>
                  </div>
                </div>

                {/* Milestone 3 */}
                <div className="relative flex flex-col md:flex-row md:items-center">
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full border-2 border-brand-gold-500 bg-white z-10 hidden md:block" />
                  <div className="md:w-1/2 md:pr-10 md:text-right space-y-2">
                    <span className="font-serif text-3xl font-bold text-brand-gold-600 leading-none">2012</span>
                    <h4 className="font-serif text-base font-bold text-brand-green-900">HPLC Scientific Integration</h4>
                    <p className="text-xs text-brand-green-800/80 leading-relaxed">
                      Integrating chemical chromatography. We partnered with organic agricultural cooperatives to ensure completely metal-free, pesticide-free roots with fully standardized bio-active percentages.
                    </p>
                  </div>
                  <div className="md:w-1/2 md:pl-10" />
                </div>

                {/* Milestone 4 */}
                <div className="relative flex flex-col md:flex-row md:items-center">
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full border-2 border-brand-gold-500 bg-brand-green-700 z-10 hidden md:block" />
                  <div className="md:w-1/2" />
                  <div className="md:w-1/2 md:pl-10 space-y-2">
                    <span className="font-serif text-3xl font-bold text-brand-green-700 leading-none">Present Day</span>
                    <h4 className="font-serif text-base font-bold text-brand-green-900">Grams Life Biological Sanctuary</h4>
                    <p className="text-xs text-brand-green-800/80 leading-relaxed">
                      We bring this 5,000-year legacy into an interactive digital age. By linking ancient diagnostic principles with dynamic smart tracking, we help you trace every gram of our formula and align your elements.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Sourcing Transparency Certification Banner */}
          <div className="bg-brand-green-50 border border-brand-green-600/10 rounded-[2.5rem] p-8 sm:p-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-brand-green-100 flex items-center justify-center text-brand-green-700">
                <Sprout className="w-5 h-5 text-brand-green-700" />
              </div>
              <h4 className="font-serif text-base font-bold text-brand-green-900">80+ Family Farms</h4>
              <p className="text-xs text-brand-green-800/70">
                We work directly with Himalayan smallholder farmers. We pay 35% above fair-market rates, securing premium lunar-harvested roots.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-brand-green-100 flex items-center justify-center text-brand-green-700">
                <ShieldCheck className="w-5 h-5 text-brand-green-700" />
              </div>
              <h4 className="font-serif text-base font-bold text-brand-green-900">Zero Synthetic Fillers</h4>
              <p className="text-xs text-brand-green-800/70">
                Our powders are completely pure. We do not incorporate magnesium stearate, silicon dioxide, or artificial preservation chemistry.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-brand-green-100 flex items-center justify-center text-brand-green-700">
                <Sparkles className="w-5 h-5 text-brand-gold-600" />
              </div>
              <h4 className="font-serif text-base font-bold text-brand-green-900">Batch-Level Logs</h4>
              <p className="text-xs text-brand-green-800/70">
                We standard-test every batch. Enter your bottle ID to trace origin altitudes, harvest dates, and active heavy-metal analyses.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* CONTACT PAGE */}
      {pageType === 'contact' && (
        <div className="space-y-12 animate-in fade-in duration-300">
          
          {/* Header */}
          <div className="border-b border-brand-green-600/10 pb-6 text-center space-y-2">
            <span className="text-[10px] bg-brand-green-50 text-brand-green-700 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              Reach Out to Us
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-brand-green-900 mt-2">
              Connect with Our Sanctuary
            </h2>
            <p className="text-xs sm:text-sm text-brand-green-600/80 max-w-xl mx-auto">
              Our master herbalists, Ayurvedic advisors, and support guides are here to address your queries.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Contact Details Column */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="bg-white border border-brand-green-600/10 rounded-2xl p-6 space-y-4 shadow-sm">
                <h3 className="font-serif text-lg font-bold text-brand-green-900 border-b border-brand-green-600/5 pb-2">
                  Direct Channels
                </h3>
                
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-brand-green-50 flex items-center justify-center flex-shrink-0 text-brand-green-700">
                    <Mail className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-brand-green-900 uppercase tracking-wider">Email Correspondence</h4>
                    <p className="text-sm font-semibold text-brand-gold-700 mt-0.5">care@gramslife.com</p>
                    <p className="text-[10px] text-brand-green-600/60 mt-0.5">For queries, order tracking, and custom botanical mixtures.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-brand-green-50 flex items-center justify-center flex-shrink-0 text-brand-green-700">
                    <Phone className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-brand-green-900 uppercase tracking-wider">Direct Hotline</h4>
                    <p className="text-sm font-semibold text-brand-gold-700 mt-0.5">+1 (800) 555-GRAM</p>
                    <p className="text-[10px] text-brand-green-600/60 mt-0.5">Toll-free. Monday – Friday, 9:00 AM – 6:00 PM IST.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-brand-green-50 flex items-center justify-center flex-shrink-0 text-brand-green-700">
                    <MapPin className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-brand-green-900 uppercase tracking-wider">Apothecary Headquarters</h4>
                    <p className="text-xs text-brand-green-800 font-medium mt-0.5">
                      108 Sacred Valley Road, Rishikesh,<br />
                      Uttarakhand, PIN 249201, India
                    </p>
                  </div>
                </div>

              </div>

              {/* Consultation Teaser */}
              <div className="bg-brand-green-900 rounded-2xl p-6 text-brand-cream-100 space-y-3 shadow-md relative overflow-hidden">
                <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
                  <Sparkles className="w-32 h-32 text-brand-cream-100" />
                </div>
                <h4 className="font-serif text-base font-bold text-brand-gold-400 flex items-center gap-1.5">
                  <Sparkles className="w-4.5 h-4.5 text-brand-gold-400" />
                  Looking for dynamic bio-consultation?
                </h4>
                <p className="text-xs text-brand-cream-100/80 leading-relaxed">
                  Engage our live <strong>AI Acharya biological assistant</strong> on the main explorer dashboard to diagnose your exact Dosha (Vata, Pitta, Kapha) and assemble immediate botanical remedies.
                </p>
              </div>

            </div>

            {/* Interactive Form Column */}
            <div className="lg:col-span-7">
              <div className="bg-white border border-brand-green-600/10 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                
                <div className="space-y-1">
                  <h3 className="font-serif text-xl font-bold text-brand-green-900">
                    Send a Correspondence
                  </h3>
                  <p className="text-xs text-brand-green-600/70">
                    Fill in your details below and a master practitioner will respond with balance.
                  </p>
                </div>

                {contactSubmitted ? (
                  <div className="p-6 bg-brand-green-50 border border-brand-green-200/50 rounded-2xl text-center space-y-3 animate-in zoom-in-95 duration-300">
                    <div className="w-12 h-12 rounded-full bg-brand-green-700 flex items-center justify-center text-brand-cream-100 font-serif text-xl font-bold mx-auto">
                      ✓
                    </div>
                    <h4 className="font-serif text-base font-bold text-brand-green-900">Correspondence Synchronized</h4>
                    <p className="text-xs text-brand-green-800/80 max-w-sm mx-auto leading-relaxed">
                      Thank you. Your wellness inquiry has been dispatched to our Rishikesh Sanctuary. Our herbalist healers will respond in 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-brand-green-700">Your Full Name</label>
                        <input 
                          type="text" 
                          required
                          placeholder="Anjali Sharma"
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-brand-green-50 border border-brand-green-100 focus:outline-none focus:border-brand-green-700 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-brand-green-700">Email Address</label>
                        <input 
                          type="email" 
                          required
                          placeholder="anjali@example.com"
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-brand-green-50 border border-brand-green-100 focus:outline-none focus:border-brand-green-700 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider font-bold text-brand-green-700">Consultation Focus</label>
                      <select 
                        value={contactForm.dosha}
                        onChange={(e) => setContactForm({ ...contactForm, dosha: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-brand-green-50 border border-brand-green-100 focus:outline-none focus:border-brand-green-700 text-xs text-brand-green-800"
                      >
                        <option>General Consultation / Inquiries</option>
                        <option>Vata Balance Advice</option>
                        <option>Pitta Cooling Formulations</option>
                        <option>Kapha Energizing Roots</option>
                        <option>Wholesale & Distribution Partnerships</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider font-bold text-brand-green-700">Inquiry / Message</label>
                      <textarea 
                        required
                        rows={4}
                        placeholder="Please describe your physical constitution (Prakriti), sleep patterns, digestive fire, or specific concerns..."
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-brand-green-50 border border-brand-green-100 focus:outline-none focus:border-brand-green-700 text-xs resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-brand-green-700 hover:bg-brand-green-800 text-brand-cream-100 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-brand-gold-400" />
                      <span>Transmit Message</span>
                    </button>

                  </form>
                )}

              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
