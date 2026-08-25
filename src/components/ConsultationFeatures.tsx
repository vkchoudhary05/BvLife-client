/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, Award, Sparkles, CheckCircle2, Clock, 
  Activity, Users, FileText, Heart, Check, 
  ArrowRight, Stethoscope, Zap, BookOpen, AlertCircle
} from 'lucide-react';

interface ConsultationFeaturesProps {
  onSelectHealthConcern?: (concern: string) => void;
  onBookClick: () => void;
  doctorFee: number;
}

export const ConsultationFeatures: React.FC<ConsultationFeaturesProps> = ({
  onSelectHealthConcern,
  onBookClick,
  doctorFee
}) => {
  const [selectedConcernIndex, setSelectedConcernIndex] = useState<number | null>(null);

  const healthConcerns = [
    {
      id: 'digestion',
      title: 'Digestion & Gut Health',
      subtitle: 'Acidity, GERD, IBS, Bloating & Constipation',
      icon: '🌿',
      tag: 'Most Common',
      description: 'Heal hyperacidity, sluggish digestion (Mandagni), and chronic inflammation by restoring metabolic fire and eliminating Ama.'
    },
    {
      id: 'women-health',
      title: 'Women’s Health & Hormones',
      subtitle: 'PCOS/PCOD, Thyroid, Irregular Cycles & Menopause',
      icon: '🌸',
      tag: 'Root-Cause Care',
      description: 'Balance endocrine channels naturally with specialized rasayanas and cyclical herbs that regulate hormonal rhythms.'
    },
    {
      id: 'stress-sleep',
      title: 'Stress, Sleep & Mental Agility',
      subtitle: 'Chronic Insomnia, Anxiety, Fatigue & Burnout',
      icon: '🧘',
      tag: 'Nootropic Herbs',
      description: 'Soothe the central nervous system (Majja Dhatu), induce deep restorative sleep, and enhance mental focus without dependence.'
    },
    {
      id: 'joints-arthritis',
      title: 'Joint, Spine & Bone Care',
      subtitle: 'Osteoarthritis, Sciatica, Cervical & Stiffness',
      icon: '🦴',
      tag: 'Mobility Restored',
      description: 'Pacify aggravated Vata dosha, lubricate synovial joints (Sleshaka Kapha), and rebuild cartilage tissue naturally.'
    },
    {
      id: 'skin-hair',
      title: 'Skin & Hair Rejuvenation',
      subtitle: 'Acne, Melasma, Psoriasis, Eczema & Hair Fall',
      icon: '✨',
      tag: 'Blood Purification',
      description: 'Purify the bloodstream (Rakta Dhatu) to eliminate deep dermatological toxins and nourish hair follicles from root.'
    },
    {
      id: 'metabolism-weight',
      title: 'Metabolism & Weight Balance',
      subtitle: 'Stubborn Fat, Fatty Liver, Diabetes & Energy Lags',
      icon: '⚡',
      tag: 'Ama Pachana',
      description: 'Stimulate cellular metabolism (Dhatu Agni) to burn visceral fat and balance post-meal glucose spikes.'
    },
    {
      id: 'immunity-respiratory',
      title: 'Immunity & Respiratory',
      subtitle: 'Chronic Cough, Sinusitis, Allergies & Low Ojas',
      icon: '🫁',
      tag: 'Ojas Enhancement',
      description: 'Strengthen lung parenchyma (Pranavaha Srotas) and build resilient bio-immunity (Vyadhikshamatva) across seasons.'
    },
    {
      id: 'vitality-rejuvenation',
      title: 'Vitality & Anti-Aging',
      subtitle: 'Chronic Exhaustion, Stamina & Cellular Detox',
      icon: '🌟',
      tag: 'Rasayana Therapy',
      description: 'Experience deep tissue regeneration with gold-grade Rasayanas that replenish vital energy (Prana & Ojas).'
    }
  ];

  const steps = [
    {
      step: '01',
      title: 'Book Your 1-on-1 Slot',
      desc: 'Select your preferred time, consultation mode (Video/Audio/WhatsApp), and share your current health symptoms.',
      badge: 'Takes 2 Mins'
    },
    {
      step: '02',
      title: 'Deep Classical Consultation',
      desc: '25-minute comprehensive private session with Dr. Arundhati Sharma covering Nadi, tongue, Agni, and root causes.',
      badge: '25 Mins Session'
    },
    {
      step: '03',
      title: 'Digital Prescription & Diet Chart',
      desc: 'Receive an official AYUSH e-prescription, bespoke herbal formulations, and personalized Ahar-Vihar meal guidelines.',
      badge: 'Within 30 Mins'
    },
    {
      step: '04',
      title: '7 Days Free Follow-Up Support',
      desc: 'Connect with our clinical Vaidya team over WhatsApp for dosage guidance, diet adjustments, and healing tracking.',
      badge: '100% Complimentary'
    }
  ];

  const benefits = [
    {
      title: 'Prakriti & Dosha Mapping',
      desc: 'Comprehensive analysis of your unique mind-body constitution (Vata, Pitta, Kapha) and current imbalances (Vikriti).',
      icon: Sparkles
    },
    {
      title: 'Root-Cause Agni Diagnostics',
      desc: 'Targeting deep-seated metabolic toxins (Ama) and weak digestive fire rather than merely silencing surface symptoms.',
      icon: Activity
    },
    {
      title: 'Bespoke Classical Herbal Plan',
      desc: 'Precision formulations using Shastric Kashayams, Rasayanas, and single-herb concentrates tailored to your biology.',
      icon: Stethoscope
    },
    {
      title: 'Customized Ahar (Diet) Chart',
      desc: 'Clear, actionable roadmap of healing foods to favor (Pathya) and inflammatory foods to avoid (Apathya).',
      icon: Heart
    },
    {
      title: 'Dinacharya Lifestyle Blueprint',
      desc: 'Guidance on circadian sleep rhythms, therapeutic breathwork (Pranayama), and daily rituals for sustained wellness.',
      icon: Zap
    },
    {
      title: 'Official AYUSH e-Prescription',
      desc: 'Legally valid, certified digital medical prescription delivered straight to your WhatsApp and registered email.',
      icon: FileText
    }
  ];

  return (
    <div className="space-y-16 py-4">
      
      {/* 1. TOP VALUE PROPOSITION STRIP (MAHARISHI STYLE) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5 hover:border-brand-gold-400 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-brand-green-50 text-brand-green-800 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">100% Confidential</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Private 1-on-1 Video/Audio</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5 hover:border-brand-gold-400 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-brand-green-50 text-brand-green-800 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">BHU Gold Medalist</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">22+ Yrs Clinical Mastery</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5 hover:border-brand-gold-400 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-brand-green-50 text-brand-green-800 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">Diet & Herbal Plan</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Bespoke Ahar & Herbs</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5 hover:border-brand-gold-400 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-brand-green-50 text-brand-green-800 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">7 Days Free Follow-Up</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">WhatsApp Vaidya Support</p>
          </div>
        </div>
      </div>

      {/* 2. HOW ONLINE CONSULTATION WORKS: 4-STEP HEALING ROADMAP */}
      <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-green-700">Simple & Seamless Process</span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
              How Your Online Vaidya Consultation Works
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              Experience the ancient art of Ayurvedic diagnosis from the comfort of your home in four structured steps.
            </p>
          </div>
          <button
            type="button"
            onClick={onBookClick}
            className="px-5 py-2.5 rounded-xl bg-brand-green-800 hover:bg-brand-green-900 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-transform hover:scale-105 shrink-0"
          >
            <span>Book Consultation (₹{doctorFee})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((s, idx) => (
            <div key={idx} className="bg-brand-cream-50/70 p-5 rounded-2xl border border-slate-200 relative group hover:border-brand-green-600/30 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="w-8 h-8 rounded-xl bg-brand-green-800 text-brand-gold-300 font-bold text-xs flex items-center justify-center shadow-xs">
                  {s.step}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {s.badge}
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-900 mb-1.5">{s.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. WHAT YOUR CONSULTATION INCLUDES: 6-CARD GRID */}
      <section className="bg-gradient-to-br from-brand-green-950 via-[#072d1a] to-[#04190e] text-brand-cream-50 rounded-3xl p-6 sm:p-10 border border-brand-gold-500/25 shadow-xl space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-brand-gold-400">Comprehensive Clinical Care</span>
          <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
            What Your Consultation Includes
          </h3>
          <p className="text-xs sm:text-sm text-brand-cream-200/90">
            A deeply personalized, root-cause healing protocol designed around your biological constitution
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div key={idx} className="bg-white/5 border border-white/10 hover:border-brand-gold-400/40 rounded-2xl p-5 backdrop-blur-md transition-all duration-300 space-y-3 group hover:bg-white/10">
                <div className="w-10 h-10 rounded-xl bg-brand-gold-400/20 text-brand-gold-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="font-serif font-bold text-base text-white">{b.title}</h4>
                <p className="text-xs text-brand-cream-200/80 leading-relaxed">{b.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onBookClick}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-gold-500 via-brand-gold-400 to-amber-500 hover:from-brand-gold-400 hover:to-amber-400 text-brand-green-950 font-bold text-sm shadow-xl transition-all hover:scale-105 inline-flex items-center gap-2"
          >
            <Stethoscope className="w-4 h-4" />
            <span>Schedule Session with Dr. Arundhati (₹{doctorFee})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 4. HEALTH CONCERNS WE TREAT: INTERACTIVE GRID */}
      <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-green-700">Holistic Specialties</span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
              Health Concerns We Treat & Reverse
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              Select your primary health concern to understand how Dr. Arundhati Sharma’s classical protocols address the root cause.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-medium">Click any card to select for booking</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {healthConcerns.map((concern, idx) => {
            const isSelected = selectedConcernIndex === idx;
            return (
              <div 
                key={concern.id}
                onClick={() => {
                  setSelectedConcernIndex(idx);
                  if (onSelectHealthConcern) onSelectHealthConcern(concern.title);
                  onBookClick();
                }}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  isSelected 
                    ? 'border-brand-green-800 bg-brand-green-50 shadow-md ring-1 ring-brand-green-800' 
                    : 'border-slate-200 hover:border-brand-gold-400/80 bg-white hover:shadow-md'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{concern.icon}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {concern.tag}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 leading-tight">{concern.title}</h4>
                    <p className="text-[11px] text-brand-green-800 font-semibold mt-0.5">{concern.subtitle}</p>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pt-1">
                    {concern.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-brand-green-800 group">
                  <span>Book for this concern</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. WHY CONSULT OUR VAIDYA: TRUST PILLARS */}
      <section className="bg-brand-cream-100/60 rounded-3xl p-6 sm:p-10 border border-brand-gold-500/20 shadow-xs space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-brand-green-800">The Classical Difference</span>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
            Why Consult With Vaidya Ratna Dr. Arundhati Sharma?
          </h3>
          <p className="text-xs sm:text-sm text-slate-600">
            Experience unadulterated Ayurvedic healthcare backed by 22+ years of hospital and clinical excellence
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-2">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-green-800 text-brand-gold-300 flex items-center justify-center font-bold text-sm">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">BHU Gold Medalist</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Top honor graduate in Ayurvedic Medicine and Surgery from Banaras Hindu University, following a 4-generation family parampara.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-green-800 text-brand-gold-300 flex items-center justify-center font-bold text-sm">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">18,500+ Patients Healed</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Trusted by patients across 24+ countries seeking true root-cause recovery from long-standing chronic conditions.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-green-800 text-brand-gold-300 flex items-center justify-center font-bold text-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">Pure Shastric Herbs</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every recommended formula uses authenticated classical methods, certified heavy-metal-free, and prepared under strict AYUSH norms.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-green-800 text-brand-gold-300 flex items-center justify-center font-bold text-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">End-to-End Care</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              From diagnosis to diet charting and dedicated 7-day post-consultation WhatsApp guidance, you are fully supported throughout.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};
