import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, Video, Phone, MessageSquare, CheckCircle, Star,
  ShieldCheck, Award, User, Sparkles, AlertCircle, FileText,
  ChevronRight, ChevronLeft, ArrowRight, X, Heart, Stethoscope, RefreshCw, Loader2,
  GraduationCap, Check, BookOpen, MessageCircle, HelpCircle, Shield,
  Activity, Users, MapPin, Zap
} from 'lucide-react';

import { Doctor, DoctorAppointment, User as UserType } from '../types';
import { Language } from '../lib/translations';
import { api } from '../services/api';
import { ConsultationFeatures } from '../components/ConsultationFeatures';

const legendaryDoctorImg = '/assets/DrSanjeev.png';
const doctorBannerDesktop = '/assets/DrSanjeev.png';
const doctorBannerMobile = '/assets/DrSanjeev.png';

interface DoctorConsultationProps {
  currentUser: UserType | null;
  onNavigate: (page: string, params?: any) => void;
  language: Language;
}

// Single Legend Doctor Profile
const LEGEND_DOCTOR: Doctor = {
  id: 'doc-legend-1',
  name: 'Dr. Arundhati Sharma',
  title: 'Chief Ayurvedic Physician & Master Nadi Vaidya',
  qualification: 'BAMS, MD (Ayurveda - BHU Gold Medalist), Ayush Reg. #AY-24890',
  experienceYears: 22,
  specialties: [
    'Classical Nadi Pariksha (Pulse Diagnosis)',
    'Gut Dysbiosis & Metabolic Agni Reversal',
    'PCOS, Thyroid & Women’s Hormonal Harmony',
    'Chronic Joint, Spine & Arthritis Management',
    'Rasayana Cellular Rejuvenation & Detox'
  ],
  languages: ['Hindi', 'English', 'Sanskrit'],
  fee: 499,
  originalFee: 1200,
  rating: 4.98,
  reviewsCount: 2450,
  image: legendaryDoctorImg,
  bio: 'Gold Medalist from Banaras Hindu University (BHU) with over 22 years of clinical excellence in diagnosing and healing chronic lifestyle disorders. Descendant of a four-generation Ayurvedic Vaidya parampara, Dr. Arundhati specializes in precision Nadi Pariksha, bespoke herbal compounding, and personalized Panchakarma protocols that treat the root cause rather than merely suppressing symptoms.',
  availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  nextAvailable: 'Today, 04:30 PM'
};

const doctorHeroSlides = [
  {
    id: "doc-slide-1",
    desktopImage: doctorBannerDesktop,
    mobileImage: doctorBannerMobile,
    badge: "BHU Gold Medalist • AYUSH Certified",
    title: "Vaidya Ratna Dr. Arundhati Sharma",
    subtitle: "India's Foremost Nadi Pariksha & Classical Healing Legend"
  },
  {
    id: "doc-slide-2",
    desktopImage: doctorBannerDesktop,
    mobileImage: doctorBannerMobile,
    badge: "100% Verified Personalized Care",
    title: "Root-Cause Ayurvedic Consultations",
    subtitle: "Bespoke Herbal Prescriptions & Ahar-Vihar Regimens"
  }
];

// Signature motif: a Nadi (pulse) waveform — the literal diagnostic act this
// doctor is known for. Used once, quietly, as the page's visual thesis rather
// than a decorative flourish.
const PulseWaveline: React.FC<{ className?: string; strokeClassName?: string }> = ({
  className = '',
  strokeClassName = 'stroke-brand-gold-400/70'
}) => (
  <svg
    viewBox="0 0 600 60"
    fill="none"
    className={className}
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <path
      d="M0 30 L110 30 L128 8 L146 52 L164 18 L182 30 L230 30 L248 12 L266 48 L284 22 L302 30 L600 30"
      className={strokeClassName}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const DoctorConsultation: React.FC<DoctorConsultationProps> = ({
  currentUser,
  onNavigate,
  language
}) => {
  const [doctor, setDoctor] = useState<Doctor>(LEGEND_DOCTOR);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSlidePaused, setIsSlidePaused] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'video' | 'audio' | 'clinic' | 'chat'>('video');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('10:00 AM');
  const [activeTab, setActiveTab] = useState<'book' | 'my-appointments' | 'doctor-profile'>('book');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  // Auto rotate banner
  useEffect(() => {
    if (isSlidePaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % doctorHeroSlides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isSlidePaused]);

  // Form Fields
  const [patientName, setPatientName] = useState(currentUser?.fullName || '');
  const [patientAge, setPatientAge] = useState<number | ''>(29);
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>('Female');
  const [patientPhone, setPatientPhone] = useState(currentUser?.phone || '');
  const [patientEmail, setPatientEmail] = useState(currentUser?.email || '');
  const [healthConcern, setHealthConcern] = useState('Chronic Digestion / Acidity & Bloating');
  const [previousHistory, setPreviousHistory] = useState('');

  // Booking confirmation state
  const [bookingConfirmed, setBookingConfirmed] = useState<DoctorAppointment | null>(null);
  const [myAppointments, setMyAppointments] = useState<DoctorAppointment[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bvlife_doctor_appointments');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  // Load doctor data from backend API
  useEffect(() => {
    let isMounted = true;
    api.getDoctors().then(data => {
      if (isMounted && data && data.length > 0) {
        const found = data[0];
        setDoctor({
          ...found,
          image: legendaryDoctorImg || found.image || LEGEND_DOCTOR.image
        });
      }
    }).catch(err => {
      console.warn('Backend doctor fetch fallback to legend:', err);
    });
    return () => { isMounted = false; };
  }, []);

  // Load user's appointments from backend
  useEffect(() => {
    if (currentUser?.email) {
      api.getDoctorAppointmentsByUser(currentUser.email).then(backendApps => {
        if (backendApps && backendApps.length > 0) {
          setMyAppointments(prev => {
            const idSet = new Set(backendApps.map(a => a.id));
            const uniqueLocal = prev.filter(a => !idSet.has(a.id));
            const merged = [...backendApps, ...uniqueLocal];
            if (typeof window !== 'undefined') {
              localStorage.setItem('bvlife_doctor_appointments', JSON.stringify(merged));
            }
            return merged;
          });
        }
      }).catch(err => console.warn('Could not fetch backend appointments:', err));
    }
  }, [currentUser]);

  // Generate 7 days starting from today
  const next7Days = React.useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateString = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const fullIso = d.toISOString().split('T')[0];
      days.push({ dayName, dateString, fullIso });
    }
    return days;
  }, []);

  useEffect(() => {
    if (!selectedDate && next7Days.length > 0) {
      setSelectedDate(next7Days[0].fullIso);
    }
  }, [next7Days, selectedDate]);

  useEffect(() => {
    if (currentUser) {
      if (!patientName) setPatientName(currentUser.fullName);
      if (!patientEmail) setPatientEmail(currentUser.email);
      if (!patientPhone && currentUser.phone) setPatientPhone(currentUser.phone);
    }
  }, [currentUser]);

  const morningSlots = ['09:30 AM', '10:15 AM', '11:00 AM', '11:45 AM'];
  const afternoonSlots = ['02:30 PM', '03:15 PM', '04:00 PM', '04:45 PM'];
  const eveningSlots = ['06:00 PM', '06:45 PM', '07:30 PM', '08:15 PM'];

  const handleBookSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !patientPhone.trim()) {
      alert('Please provide patient name and contact phone number.');
      return;
    }

    const appointmentId = `BVL-DOC-${Math.floor(100000 + Math.random() * 900000)}`;

    const newAppointmentPayload: Partial<DoctorAppointment> = {
      id: appointmentId,
      doctorId: doctor.id,
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialties[0],
      doctorImage: doctor.image || legendaryDoctorImg,
      doctorQualification: doctor.qualification,
      patientName,
      patientAge: Number(patientAge) || 30,
      patientGender,
      patientPhone,
      patientEmail: patientEmail || 'patient@bvlife.com',
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      consultationMode: selectedMode,
      healthConcern,
      previousHistory,
      fee: doctor.fee,
      status: 'Confirmed',
      bookingDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      meetingLink: selectedMode === 'video' ? `https://meet.jit.si/BVLife-DrArundhati-${appointmentId}` : undefined
    };

    setIsSubmitting(true);
    let finalAppointment: DoctorAppointment = newAppointmentPayload as DoctorAppointment;

    try {
      const response = await api.bookDoctorAppointment(newAppointmentPayload);
      if (response.success && response.appointment) {
        finalAppointment = response.appointment;
      }
    } catch (err) {
      console.warn('Backend appointment booking fallback:', err);
    } finally {
      setIsSubmitting(false);
    }

    const updated = [finalAppointment, ...myAppointments.filter(a => a.id !== finalAppointment.id)];
    setMyAppointments(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('bvlife_doctor_appointments', JSON.stringify(updated));
    }

    setBookingConfirmed(finalAppointment);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelAppointment = async (id: string) => {
    if (confirm('Are you sure you want to cancel this consultation slot?')) {
      try {
        await api.cancelDoctorAppointment(id);
      } catch (err) {
        console.warn('Backend cancel appointment fallback:', err);
      }
      const updated = myAppointments.map(app => app.id === id ? { ...app, status: 'Cancelled' as const } : app);
      setMyAppointments(updated);
      localStorage.setItem('bvlife_doctor_appointments', JSON.stringify(updated));
    }
  };

  const FAQS = [
    {
      q: 'How does an online Ayurvedic consultation with Dr. Arundhati Sharma work?',
      a: 'During your 25-minute 1-on-1 private video or audio session, Dr. Arundhati evaluates your physical symptoms, conducts a visual Nadi & tongue analysis, examines facial and skin cues, and determines your biological Dosha constitution (Prakriti vs. Vikriti) to diagnose the root cause.'
    },
    {
      q: 'What will I receive immediately after my consultation?',
      a: 'Within 30 minutes of your session, you will receive an official AYUSH-certified digital prescription, personalized Ayurvedic herbal compounding recommendations, a tailored Ahar-Vihar (Diet & Lifestyle) chart, and direct WhatsApp contact for your 7-day follow-up care.'
    },
    {
      q: 'Can Dr. Arundhati treat chronic, long-term health issues?',
      a: 'Yes. With 22+ years of clinical practice, Dr. Arundhati specializes in treating chronic conditions including digestive dysbiosis (GERD/IBS), PCOS/hormonal imbalances, arthritis, stubborn skin issues (psoriasis/eczema), chronic fatigue, and stress disorders.'
    },
    {
      q: 'Is my medical consultation private and confidential?',
      a: '100% confidential. All consultations occur in secure, encrypted 1-on-1 rooms, and your health records are strictly protected under medical compliance guidelines.'
    },
    {
      q: 'What if I need to reschedule or cancel my appointment?',
      a: 'You can easily reschedule or cancel up to 2 hours before your scheduled time directly from the "My Consultations" tab, or via our 24/7 WhatsApp patient support.'
    }
  ];

  return (
    <div id="doctor-consultation-page" className="min-h-screen bg-brand-cream-50/60 pb-20">

      {/* 1. TOP HERO — pulse-wave signature replaces the generic gradient-pill banner */}
      <section className="max-w-[1440px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 pt-3 sm:pt-5">
        <div
          id="doctor-hero-banner"
          onClick={() => {
            const el = document.getElementById('book-slot-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          onMouseEnter={() => setIsSlidePaused(true)}
          onMouseLeave={() => setIsSlidePaused(false)}
          className="
            relative w-full
            h-[210px] xs:h-[290px] sm:h-[340px] md:h-[385px] lg:h-[430px] xl:h-[470px] 2xl:h-[520px]
            rounded-2xl sm:rounded-[28px] overflow-hidden
            flex items-center justify-center
            cursor-pointer group shadow-xl
            border border-brand-gold-500/25
            bg-brand-green-950
          "
        >
          {/* Banner image */}
          <div className="absolute inset-0">
            <picture>
              <source media="(max-width:768px)" srcSet={doctorHeroSlides[currentSlide].mobileImage} />
              <img
                src={doctorHeroSlides[currentSlide].desktopImage}
                alt="Consult with Dr. Arundhati Sharma"
                className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-700"
              />
            </picture>
            <div className="absolute inset-0 bg-gradient-to-t from-brand-green-950/85 via-brand-green-950/25 to-transparent sm:from-brand-green-950/70 sm:via-brand-green-950/10" />
          </div>

          {/* Pulse waveline — the doctor's own diagnostic signature, drawn once
              beneath the headline as the page's visual thesis */}
          <div className="absolute left-0 right-0 bottom-[74px] sm:bottom-[92px] md:bottom-[104px] h-[46px] px-4 sm:px-8 pointer-events-none opacity-80">
            <PulseWaveline className="w-full h-full" />
          </div>

          {/* Eyebrow badge, top left — single, quiet */}
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
            <div className="px-3 py-1.5 rounded-full bg-brand-green-950/70 backdrop-blur-md border border-brand-gold-400/40 text-brand-gold-300 text-[10px] sm:text-xs font-semibold tracking-wide flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              <span>{doctorHeroSlides[currentSlide].badge}</span>
            </div>
          </div>

          {/* Headline block */}
          <div className="absolute bottom-4 left-4 right-4 sm:bottom-7 sm:left-7 sm:right-7 z-20 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-white">
            <div className="max-w-2xl space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-brand-gold-300 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.14em]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Personalized Classical Healing</span>
              </div>
              <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-[42px] font-serif font-bold leading-[1.08] tracking-tight drop-shadow-md">
                {doctorHeroSlides[currentSlide].title}
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-brand-cream-200/95 line-clamp-2">
                {doctorHeroSlides[currentSlide].subtitle}
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <span className="px-5 py-2.5 rounded-xl bg-brand-gold-500 text-brand-green-950 font-bold text-xs md:text-sm shadow-lg flex items-center gap-2 group-hover:gap-3 transition-all">
                <Calendar className="w-4 h-4" />
                <span>Book Slot — ₹{doctor.fee}</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Nav chevrons */}
          <button
            onClick={(e) => { e.stopPropagation(); setCurrentSlide((prev) => (prev - 1 + doctorHeroSlides.length) % doctorHeroSlides.length); }}
            aria-label="Previous banner"
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center p-2 sm:p-2.5 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/15 text-white transition-all duration-200 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrentSlide((prev) => (prev + 1) % doctorHeroSlides.length); }}
            aria-label="Next banner"
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center p-2 sm:p-2.5 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/15 text-white transition-all duration-200 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Slide dots */}
          <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 z-30 flex gap-1.5">
            {doctorHeroSlides.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to slide ${i + 1}`}
                onClick={(e) => { e.stopPropagation(); setCurrentSlide(i); }}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  currentSlide === i ? 'bg-brand-gold-400 w-6 h-1.5' : 'bg-white/45 hover:bg-white/70 w-1.5 h-1.5'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 2. NAVIGATION TABS */}
      <div className="sticky top-14 sm:top-18 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 overflow-x-auto py-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setActiveTab('book')}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'book' ? 'bg-brand-green-800 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Book a slot</span>
              </button>

              <button
                onClick={() => setActiveTab('doctor-profile')}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'doctor-profile' ? 'bg-brand-green-800 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Doctor & lineage</span>
              </button>

              <button
                onClick={() => setActiveTab('my-appointments')}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer relative ${
                  activeTab === 'my-appointments' ? 'bg-brand-green-800 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>My consultations</span>
                {myAppointments.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-brand-gold-500 text-brand-green-950 text-[10px] font-bold min-w-[18px] text-center">
                    {myAppointments.length}
                  </span>
                )}
              </button>
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs shrink-0">
              <span className="text-slate-400">First consult</span>
              <span className="line-through text-slate-300">₹{doctor.originalFee}</span>
              <span className="font-bold text-brand-green-800 text-sm">₹{doctor.fee}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* TAB 1: BOOKING */}
        {activeTab === 'book' && (
          <div id="book-slot-section" className="space-y-10">

            {bookingConfirmed && (
              <div className="bg-brand-green-950 text-white p-6 sm:p-8 rounded-3xl border border-brand-gold-400/60 shadow-xl space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-full bg-brand-gold-500 text-brand-green-950 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] text-brand-gold-300 font-semibold uppercase tracking-[0.14em]">Slot confirmed</span>
                      <h3 className="font-serif text-xl sm:text-2xl font-bold leading-tight">{bookingConfirmed.id}</h3>
                    </div>
                  </div>
                  <button onClick={() => setBookingConfirmed(null)} className="p-2 rounded-full hover:bg-white/10 text-brand-cream-300 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white/5 p-3.5 rounded-2xl">
                    <p className="text-brand-cream-300/70">Vaidya</p>
                    <p className="font-bold text-sm text-brand-gold-300 mt-0.5">{bookingConfirmed.doctorName}</p>
                    <p className="text-[11px] text-brand-cream-300">{bookingConfirmed.doctorQualification}</p>
                  </div>
                  <div className="bg-white/5 p-3.5 rounded-2xl">
                    <p className="text-brand-cream-300/70">Date & time</p>
                    <p className="font-bold text-sm text-white mt-0.5">{bookingConfirmed.date}</p>
                    <p className="text-[11px] text-brand-gold-300 font-semibold">{bookingConfirmed.timeSlot}</p>
                  </div>
                  <div className="bg-white/5 p-3.5 rounded-2xl">
                    <p className="text-brand-cream-300/70">Patient</p>
                    <p className="font-bold text-sm text-white mt-0.5">{bookingConfirmed.patientName} ({bookingConfirmed.patientAge})</p>
                    <p className="text-[11px] text-brand-cream-300">{bookingConfirmed.patientPhone}</p>
                  </div>
                  <div className="bg-white/5 p-3.5 rounded-2xl">
                    <p className="text-brand-cream-300/70">Format</p>
                    <p className="font-bold text-sm text-white capitalize mt-0.5">{bookingConfirmed.consultationMode} call</p>
                    <p className="text-[11px] text-emerald-400 font-semibold">WhatsApp reminder sent</p>
                  </div>
                </div>

                {bookingConfirmed.meetingLink && (
                  <div className="pt-1 flex flex-wrap items-center gap-3">
                    <a
                      href={bookingConfirmed.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 rounded-xl bg-brand-gold-500 hover:bg-brand-gold-400 text-brand-green-950 font-bold text-xs flex items-center gap-2 transition-colors"
                    >
                      <Video className="w-4 h-4" />
                      <span>Join video consultation</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setActiveTab('my-appointments')}
                      className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors"
                    >
                      View in My Consultations
                    </button>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleBookSlot} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              {/* Left: mode + date + time */}
              <div className="lg:col-span-7 space-y-5">

                {/* Doctor plate */}
                <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200">
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      <img
                        src={doctor.image}
                        alt={doctor.name}
                        className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl object-cover border-2 border-brand-gold-400"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-1 border-2 border-white">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-serif text-base sm:text-lg font-bold text-slate-900">{doctor.name}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-green-800 text-white rounded">Gold Medalist</span>
                      </div>
                      <p className="text-xs font-semibold text-brand-green-800">{doctor.title}</p>
                      <div className="flex items-center gap-1.5 pt-0.5 text-[11px] text-amber-600 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{doctor.rating} · {doctor.reviewsCount}+ consultations</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 1: mode */}
                <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-brand-green-800 text-white text-[11px] font-bold flex items-center justify-center shrink-0">1</span>
                    <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900">Choose consultation format</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { key: 'video' as const, icon: Video, label: 'Video call', desc: 'Live Nadi, tongue & skin evaluation', tag: 'Recommended' },
                      { key: 'audio' as const, icon: Phone, label: 'Phone call', desc: 'Direct call to your registered number' },
                      { key: 'clinic' as const, icon: MessageSquare, label: 'WhatsApp & audio', desc: 'Voice session with prescription in chat' },
                    ].map(({ key, icon: Icon, label, desc, tag }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedMode(key)}
                        className={`p-4 rounded-xl border text-left transition-colors cursor-pointer flex flex-col gap-3 ${
                          selectedMode === key
                            ? 'border-brand-green-800 bg-brand-green-50/70 ring-1 ring-brand-green-800'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${selectedMode === key ? 'bg-brand-green-800 text-white' : 'bg-slate-100 text-slate-500'}`}>
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-bold text-xs text-slate-900">{label}</p>
                            {tag && <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded shrink-0">{tag}</span>}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 leading-snug">{desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2: date + time */}
                <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-brand-green-800 text-white text-[11px] font-bold flex items-center justify-center shrink-0">2</span>
                    <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900">Select date & time</h3>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {next7Days.map((d) => {
                      const isSelected = selectedDate === d.fullIso;
                      return (
                        <button
                          key={d.fullIso}
                          type="button"
                          onClick={() => setSelectedDate(d.fullIso)}
                          className={`flex-1 min-w-[76px] py-2.5 px-2 rounded-xl text-center border transition-colors cursor-pointer ${
                            isSelected ? 'border-brand-green-800 bg-brand-green-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-brand-gold-300' : 'text-slate-400'}`}>{d.dayName}</p>
                          <p className="text-xs font-bold mt-0.5">{d.dateString}</p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-4 pt-1">
                    {[
                      { label: 'Morning · 9:30 AM–12:30 PM', slots: morningSlots },
                      { label: 'Afternoon · 2:30 PM–5:30 PM', slots: afternoonSlots },
                      { label: 'Evening · 6:00 PM–8:45 PM', slots: eveningSlots },
                    ].map(({ label, slots }) => (
                      <div key={label}>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">{label}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {slots.map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setSelectedTimeSlot(slot)}
                              className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                                selectedTimeSlot === slot
                                  ? 'bg-brand-green-800 text-white border-brand-green-800'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: patient details + summary */}
              <div className="lg:col-span-5 space-y-5">

                <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-brand-green-800 text-white text-[11px] font-bold flex items-center justify-center shrink-0">3</span>
                    <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900">Patient details & concerns</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Patient full name *</label>
                      <input
                        type="text"
                        required
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="e.g. Radhika Sharma"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-green-800 bg-slate-50 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Age</label>
                        <input
                          type="number"
                          min="1"
                          max="120"
                          value={patientAge}
                          onChange={(e) => setPatientAge(e.target.value ? Number(e.target.value) : '')}
                          placeholder="e.g. 29"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-green-800 bg-slate-50 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Gender</label>
                        <select
                          value={patientGender}
                          onChange={(e: any) => setPatientGender(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-green-800 bg-slate-50 font-medium"
                        >
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Phone (WhatsApp) *</label>
                        <input
                          type="tel"
                          required
                          value={patientPhone}
                          onChange={(e) => setPatientPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-green-800 bg-slate-50 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Email address</label>
                        <input
                          type="email"
                          value={patientEmail}
                          onChange={(e) => setPatientEmail(e.target.value)}
                          placeholder="patient@example.com"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-green-800 bg-slate-50 font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Primary health concern</label>
                      <select
                        value={healthConcern}
                        onChange={(e) => setHealthConcern(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-green-800 bg-slate-50 font-medium"
                      >
                        <option value="Chronic Digestion / Acidity & Bloating">Chronic Digestion / Acidity & Bloating</option>
                        <option value="PCOS / Female Hormonal Imbalance">PCOS / Female Hormonal Imbalance</option>
                        <option value="Hair Fall, Dandruff & Scalp Thinning">Hair Fall, Dandruff & Scalp Thinning</option>
                        <option value="Skin Pigmentation, Melasma & Acne">Skin Pigmentation, Melasma & Acne</option>
                        <option value="Joint Pain, Arthritis & Stiffness">Joint Pain, Arthritis & Stiffness</option>
                        <option value="Stress, Insomnia & Mental Exhaustion">Stress, Insomnia & Mental Exhaustion</option>
                        <option value="Men's Stamina, Energy & Vitality">Men's Stamina, Energy & Vitality</option>
                        <option value="Immunity, Respiratory & Seasonal Allergies">Immunity, Respiratory & Seasonal Allergies</option>
                        <option value="Weight & Metabolic Detox (Ama Pachana)">Weight & Metabolic Detox (Ama Pachana)</option>
                        <option value="General Preventive Ayurveda & Rasayana">General Preventive Ayurveda & Rasayana</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Medical notes & existing medications (optional)</label>
                      <textarea
                        rows={2}
                        value={previousHistory}
                        onChange={(e) => setPreviousHistory(e.target.value)}
                        placeholder="Mention any existing medicines, allergies, or past blood test reports..."
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-green-800 bg-slate-50 font-medium resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-brand-green-950 text-brand-cream-50 rounded-2xl p-6 border border-brand-gold-500/25 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h4 className="font-serif text-base font-bold text-white">Order summary</h4>
                    <span className="text-[10px] text-brand-gold-300 font-semibold uppercase tracking-wide">AYUSH subsidized</span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between text-brand-cream-200">
                      <span>Vaidya</span>
                      <span className="font-bold text-white">{doctor.name}</span>
                    </div>
                    <div className="flex justify-between text-brand-cream-200">
                      <span>Date & time</span>
                      <span className="font-bold text-brand-gold-300">{selectedDate} · {selectedTimeSlot}</span>
                    </div>
                    <div className="flex justify-between text-brand-cream-200">
                      <span>Format</span>
                      <span className="font-bold text-white capitalize">{selectedMode}</span>
                    </div>
                    <div className="flex justify-between text-brand-cream-200">
                      <span>Standard fee</span>
                      <span className="line-through text-brand-cream-300/50">₹{doctor.originalFee}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400">
                      <span>First-time patient grant</span>
                      <span>−₹{doctor.originalFee - doctor.fee}</span>
                    </div>
                    <div className="flex justify-between items-baseline text-white border-t border-white/10 pt-3">
                      <span className="text-sm font-semibold">Total payable</span>
                      <span className="text-lg font-bold text-brand-gold-300">₹{doctor.fee}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-4 rounded-xl bg-brand-gold-500 hover:bg-brand-gold-400 disabled:opacity-60 text-brand-green-950 font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Confirming slot…</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Confirm & book — ₹{doctor.fee}</span>
                      </>
                    )}
                  </button>

                  <p className="flex items-center justify-center gap-1.5 text-[10px] text-brand-cream-300/75 text-center pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-gold-300 shrink-0" />
                    <span>100% satisfaction or full refund · instant WhatsApp confirmation</span>
                  </p>
                </div>
              </div>
            </form>

            <ConsultationFeatures
              doctorFee={doctor.fee}
              onSelectHealthConcern={(concern) => {
                setHealthConcern(concern);
                const el = document.getElementById('book-slot-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onBookClick={() => {
                const el = document.getElementById('book-slot-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {/* TAB 2: DOCTOR PROFILE */}
        {activeTab === 'doctor-profile' && (
          <div className="space-y-10">
            <div className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-4">
                  <div className="relative mx-auto max-w-sm rounded-2xl overflow-hidden border border-brand-gold-400/40 bg-brand-green-950 p-2">
                    <img src={doctor.image} alt={doctor.name} className="w-full aspect-[4/5] object-cover rounded-xl" />
                    <div className="mt-3 text-center text-white pb-1">
                      <h4 className="font-serif text-lg font-bold">{doctor.name}</h4>
                      <p className="text-xs text-brand-gold-300 font-medium">Gold Medalist · Banaras Hindu University</p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-8 space-y-5">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-gold-100 text-brand-green-950 text-xs font-bold">
                      <Award className="w-3.5 h-3.5 text-brand-gold-600" />
                      <span>4-generation classical Vaidya parampara</span>
                    </div>
                    <h3 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                      Meet Vaidya Ratna Dr. Arundhati Sharma
                    </h3>
                    <p className="text-xs text-brand-green-800 font-bold">
                      BAMS, MD (Ayurveda), Fellow of All India Institute of Ayurveda (AIIA), AYUSH Reg. #AY-24890
                    </p>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{doctor.bio}</p>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    Having trained under master Vaidyas across Varanasi, Kerala, and the Himalayan foothills, Dr. Arundhati blends rigorous classical texts (Charaka Samhita, Sushruta Samhita, and Ashtanga Hridaya) with modern clinical precision. She has consulted over 18,500 patients worldwide, helping them reverse lifelong ailments through individualized botanical regimens and circadian rhythm alignment.
                  </p>

                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Core clinical specialties</p>
                    <div className="flex flex-wrap gap-2">
                      {doctor.specialties.map((spec, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-full bg-brand-green-50 text-brand-green-900 border border-brand-green-200 text-xs font-semibold">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab('book')}
                      className="px-6 py-3 bg-brand-green-800 hover:bg-brand-green-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Book a consultation slot</span>
                    </button>
                    <span className="text-xs text-slate-400">25-minute live consultation</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 5 Pillars */}
            <div className="bg-brand-green-950 text-brand-cream-50 rounded-2xl p-6 sm:p-10 border border-brand-gold-500/20 space-y-6">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-brand-gold-400">Dr. Arundhati's clinical framework</span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">The classical pillars of healing</h3>
                <p className="text-xs text-brand-cream-200">Every consultation follows these diagnostic disciplines to address root-cause pathology</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
                {[
                  { icon: Activity, title: 'Classical Nadi Pariksha', desc: 'Reading the deep and superficial arterial pulse waves to detect organ toxicity, sub-dosha imbalances, and impending disease patterns.' },
                  { icon: Zap, title: 'Agni & Deepana therapy', desc: 'Re-igniting the digestive fire (Jatharagni) to break down metabolic toxins (Ama) that clog the tissue channels (Srotas).' },
                  { icon: Sparkles, title: 'Dravyaguna formulation', desc: 'Pairing wild-harvested herbs — Shilajit, Kesar, Ashwagandha, Triphala — with catalytic carriers (Anupanas) for deep cellular absorption.' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-3">
                    <div className="w-9 h-9 rounded-lg bg-brand-gold-500/15 text-brand-gold-300 flex items-center justify-center">
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <h4 className="font-bold text-sm text-white">{title}</h4>
                    <p className="text-xs text-brand-cream-200/75 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MY APPOINTMENTS */}
        {activeTab === 'my-appointments' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="font-serif text-2xl font-bold text-slate-900 tracking-tight">My consultation sessions</h3>
                <p className="text-xs text-slate-500 mt-0.5">Manage your upcoming and past doctor consultation appointments</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('book')}
                className="px-4 py-2 bg-brand-green-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-brand-green-900 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Book new session</span>
              </button>
            </div>

            {myAppointments.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-4 max-w-md mx-auto">
                <div className="w-14 h-14 rounded-full bg-brand-green-50 text-brand-green-800 flex items-center justify-center mx-auto">
                  <Stethoscope className="w-7 h-7" />
                </div>
                <h4 className="font-serif text-lg font-bold text-slate-800">No consultations scheduled yet</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  You haven't scheduled any consultations with Dr. Arundhati Sharma yet. Book a session to get your customized health diagnosis and herbal prescription.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('book')}
                  className="px-6 py-2.5 bg-brand-green-800 text-white rounded-xl text-xs font-bold hover:bg-brand-green-900 cursor-pointer"
                >
                  Schedule your initial session
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {myAppointments.map((app) => (
                  <div key={app.id} className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 space-y-4 hover:border-slate-300 transition-colors">
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <img src={app.doctorImage || doctor.image} alt={app.doctorName} className="w-11 h-11 rounded-xl object-cover border border-brand-gold-400" />
                        <div>
                          <p className="font-bold text-sm text-slate-900">{app.doctorName}</p>
                          <p className="text-[11px] text-brand-green-800 font-medium">{app.doctorSpecialty}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        app.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {app.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-lg">
                        <span className="text-[10px] text-slate-400 block">Date</span>
                        <span className="font-bold text-slate-800">{app.date}</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg">
                        <span className="text-[10px] text-slate-400 block">Time slot</span>
                        <span className="font-bold text-brand-green-800">{app.timeSlot}</span>
                      </div>
                    </div>

                    <div className="text-xs space-y-1 text-slate-600">
                      <p><span className="font-bold text-slate-700">Patient:</span> {app.patientName} ({app.patientAge} yrs, {app.patientGender})</p>
                      <p><span className="font-bold text-slate-700">Concern:</span> {app.healthConcern}</p>
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                      {app.meetingLink && app.status === 'Confirmed' ? (
                        <a
                          href={app.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-lg bg-brand-green-800 hover:bg-brand-green-900 text-white font-bold text-xs flex items-center gap-1.5"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join video room</span>
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">Consultation {app.status}</span>
                      )}
                      {app.status === 'Confirmed' && (
                        <button
                          type="button"
                          onClick={() => handleCancelAppointment(app.id)}
                          className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
                        >
                          Cancel slot
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. TESTIMONIALS */}
        <section className="mt-16 bg-white rounded-2xl p-6 sm:p-10 border border-slate-200 space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-brand-gold-600">Verified patient results</span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Transformative healing stories</h3>
            <p className="text-xs text-slate-500">How patients regained vital health through Dr. Arundhati Sharma's precision Ayurvedic regimens</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "I was suffering from severe chronic acidity, bloating, and IBS for over 4 years. Allopathic antacids only provided 2-hour relief. Dr. Arundhati listened patiently for 30 minutes, explained my Pitta Agni imbalance, and prescribed a simple herbal churnam + warm water routine. In 3 weeks, my digestion is completely normal!",
                name: 'Meenakshi Sundaram', place: 'Bangalore · Gut Health'
              },
              {
                quote: "Struggled with irregular cycles and cystic acne from PCOS. Dr. Arundhati's holistic protocol combined Shatavari Rasayana, Kanchanar Guggulu, and circadian food timings. My cycles normalized naturally within 3 months, and my skin cleared up without any hormones.",
                name: 'Pooja Deshmukh', place: 'Pune · PCOS & Hormones'
              },
              {
                quote: "My 68-year-old mother could barely climb stairs due to knee osteoarthritis. Dr. Arundhati recommended Shallaki Guggul and Mahanarayan oil taila basti. Today she walks in the park every morning without painkillers. True blessing to have a doctor of this stature.",
                name: 'Ravi Shankar Verma', place: 'Delhi NCR · Joint Care'
              },
            ].map((t) => (
              <div key={t.name} className="bg-brand-cream-50/70 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex text-amber-400 gap-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{t.quote}</p>
                </div>
                <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{t.name}</p>
                    <p className="text-[10px] text-slate-500">{t.place}</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Verified</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. FAQ */}
        <section className="mt-16 bg-white rounded-2xl p-6 sm:p-10 border border-slate-200 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-brand-gold-600">Got questions?</span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Doctor consultation FAQs</h3>
            <p className="text-xs text-slate-500">Everything you need to know about scheduling and experiencing your session</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3 pt-2">
            {FAQS.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div key={index} className="rounded-xl border border-slate-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full p-4 sm:p-5 text-left bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-bold text-slate-900">{faq.q}</span>
                    <ChevronRight className={`w-4 h-4 text-brand-green-800 shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="p-4 sm:p-5 bg-white border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};