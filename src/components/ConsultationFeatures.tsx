/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ShieldCheck, Award, Sparkles, Clock, 
  Activity, Users, FileText, Heart, 
  ArrowRight, Stethoscope, Zap
} from 'lucide-react';

interface ConsultationFeaturesProps {
  onBookClick: () => void;
  doctorFee: number;
}

export const ConsultationFeatures: React.FC<ConsultationFeaturesProps> = ({
  onBookClick,
  doctorFee
}) => {
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

      {/* 2. WHAT YOUR CONSULTATION INCLUDES: 6-CARD GRID */}
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
            <span>Schedule Session with Dr. Sanjeev Rastogi (₹{doctorFee})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 4. WHY CONSULT OUR VAIDYA: TRUST PILLARS */}
      <section className="bg-brand-cream-100/60 rounded-3xl p-6 sm:p-10 border border-brand-gold-500/20 shadow-xs space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-brand-green-800">The Classical Difference</span>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
            Why Consult With Vaidya Ratna Dr. Sanjeev Rastogi?
          </h3>
          <p className="text-xs sm:text-sm text-slate-600">
            Experience unadulterated Ayurvedic healthcare backed by 30+ years of hospital and academic excellence
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
