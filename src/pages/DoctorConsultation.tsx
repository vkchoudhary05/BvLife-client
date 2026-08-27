
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Video, Phone, MessageSquare, CheckCircle, Star, 
  ShieldCheck, Award, User, Sparkles, AlertCircle, FileText, 
  ChevronRight, ChevronLeft, ArrowRight, X, Heart, Stethoscope, RefreshCw, Loader2,
  GraduationCap, Check, BookOpen, MessageCircle, HelpCircle, Shield,
  Activity, Users, MapPin, Zap, ChevronDown, ChevronUp, Upload, Trash2, Eye, Paperclip
} from 'lucide-react';
import { Doctor, DoctorAppointment, User as UserType, MedicalReportFile } from '../types';
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
    // badge: "BHU Gold Medalist • AYUSH Certified",
    // title: "Vaidya Ratna Dr. Arundhati Sharma",
    // subtitle: "India's Foremost Nadi Pariksha & Classical Healing Legend"
  },
  {
    id: "doc-slide-2",
    desktopImage: doctorBannerDesktop,
    mobileImage: doctorBannerMobile,
    // badge: "100% Verified Personalized Care",
    // title: "Root-Cause Ayurvedic Consultations",
    // subtitle: "Bespoke Herbal Prescriptions & Ahar-Vihar Regimens"
  }
];

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
  const [bookingStep, setBookingStep] = useState<number>(1);
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
  
  // Previous Medical Reports PDF State
  const [uploadedReports, setUploadedReports] = useState<MedicalReportFile[]>([]);
  const [isDraggingReports, setIsDraggingReports] = useState(false);
  const [reportUploadError, setReportUploadError] = useState<string | null>(null);
  
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

  // PDF Medical Reports Upload Handler
  const handleReportUpload = (files: FileList | File[]) => {
    setReportUploadError(null);
    const fileArray = Array.from(files);
    
    if (uploadedReports.length + fileArray.length > 5) {
      setReportUploadError('You can upload a maximum of 5 PDF medical reports.');
      return;
    }

    fileArray.forEach(file => {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        setReportUploadError('Please upload files in PDF format only (e.g., BloodTest.pdf, DoctorPrescription.pdf).');
        return;
      }

      if (file.size > 15 * 1024 * 1024) {
        setReportUploadError(`File "${file.name}" exceeds maximum allowed size of 15MB.`);
        return;
      }

      const formattedSize = file.size < 1024 * 1024
        ? `${(file.size / 1024).toFixed(1)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : undefined;
        const newReport: MedicalReportFile = {
          name: file.name,
          size: formattedSize,
          type: 'application/pdf',
          dataUrl,
          uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setUploadedReports(prev => [...prev, newReport]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveReport = (index: number) => {
    setUploadedReports(prev => prev.filter((_, idx) => idx !== index));
  };

  const openPdfPreview = (report: MedicalReportFile) => {
    if (report.dataUrl) {
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(
          `<iframe src="${report.dataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
        );
        newWindow.document.title = report.name;
      } else {
        const a = document.createElement('a');
        a.href = report.dataUrl;
        a.download = report.name;
        a.click();
      }
    }
  };

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
      medicalReports: uploadedReports,
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
      
      {/* 1. TOP HERO BANNER — HOMEPAGE-STYLE RESPONSIVE BANNER SLIDER */}
      <section className="max-w-[1440px] mx-auto  ">
        <div
          id="doctor-hero-banner"
          onClick={() => {
            const el = document.getElementById('book-slot-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          onMouseEnter={() => setIsSlidePaused(true)}
          onMouseLeave={() => setIsSlidePaused(false)}
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
          {/* Banner Picture with Responsive Mobile & Desktop Assets */}
          <div className="absolute inset-0">
            <picture>
              <source
                media="(max-width:768px)"
                srcSet={doctorHeroSlides[currentSlide].mobileImage}
              />
              <img
                src={doctorHeroSlides[currentSlide].desktopImage}
                alt="Consult with Dr. Arundhati Sharma"
                className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-700"
              />
            </picture>

            {/* Gradient Overlay for Pristine Contrast & Luxury Feel */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent sm:from-black/50 sm:via-transparent sm:to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-green-950/70 via-transparent to-brand-green-950/40 hidden md:block" />
          </div>

          {/* Banner Navigation Chevron Left */}

          {/* Banner Slide Indicator Dots */}
          <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 z-30 flex gap-1.5 sm:gap-2">
            {doctorHeroSlides.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to slide ${i + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlide(i);
                }}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  currentSlide === i
                    ? 'bg-brand-gold-400 w-6 sm:w-8 h-1.5 sm:h-2'
                    : 'bg-white/50 hover:bg-white/80 w-1.5 sm:w-2 h-1.5 sm:h-2'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 2. NAVIGATION TABS BAR */}
      <div className="sticky top-14 sm:top-18 z-30 bg-white border-b border-brand-green-600/10 shadow-xs">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 overflow-x-auto py-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => setActiveTab('book')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'book'
                    ? 'bg-brand-green-800 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Book Slot with Dr. Arundhati</span>
              </button>

              <button
                onClick={() => setActiveTab('doctor-profile')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'doctor-profile'
                    ? 'bg-brand-green-800 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Doctor Lineage & Credentials</span>
              </button>

              <button
                onClick={() => setActiveTab('my-appointments')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer relative ${
                  activeTab === 'my-appointments'
                    ? 'bg-brand-green-800 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>My Consultations</span>
                {myAppointments.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-brand-gold-500 text-brand-green-950 text-[10px] font-bold">
                    {myAppointments.length}
                  </span>
                )}
              </button>
            </div>

            {/* Quick Fee Callout */}
            <div className="hidden md:flex items-center gap-2 text-xs">
              <span className="text-slate-500">First Consult:</span>
              <span className="line-through text-slate-400">₹{doctor.originalFee}</span>
              <span className="font-bold text-brand-green-800 text-sm">₹{doctor.fee}</span>
              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold text-[10px]">58% OFF</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE CONTENT */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* TAB 1: BOOKING WORKSPACE */}
        {activeTab === 'book' && (
          <div id="book-slot-section" className="space-y-10">
            
            {/* Booking Confirmed Banner */}
            {bookingConfirmed && (
              <div className="bg-gradient-to-br from-brand-green-900 to-brand-green-950 text-white p-6 sm:p-8 rounded-3xl border-2 border-brand-gold-400 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-brand-gold-500/30 pb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-full bg-brand-gold-500 text-brand-green-950 flex items-center justify-center font-bold shadow-md">
                      <CheckCircle className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="text-xs text-brand-gold-300 font-bold uppercase tracking-wider">Slot Confirmed & Scheduled</span>
                      <h3 className="font-serif text-xl sm:text-2xl font-bold">Appointment ID: {bookingConfirmed.id}</h3>
                    </div>
                  </div>
                  <button 
                    onClick={() => setBookingConfirmed(null)}
                    className="p-2 rounded-full hover:bg-white/10 text-brand-cream-300 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
                    <p className="text-brand-cream-300/80">Assigned Vaidya</p>
                    <p className="font-bold text-sm text-brand-gold-300 mt-0.5">{bookingConfirmed.doctorName}</p>
                    <p className="text-[11px] text-brand-cream-300">{bookingConfirmed.doctorQualification}</p>
                  </div>

                  <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
                    <p className="text-brand-cream-300/80">Scheduled Date & Time</p>
                    <p className="font-bold text-sm text-white mt-0.5">{bookingConfirmed.date}</p>
                    <p className="text-[11px] text-brand-gold-300 font-semibold">{bookingConfirmed.timeSlot}</p>
                  </div>

                  <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
                    <p className="text-brand-cream-300/80">Patient Details</p>
                    <p className="font-bold text-sm text-white mt-0.5">{bookingConfirmed.patientName} ({bookingConfirmed.patientAge} yrs)</p>
                    <p className="text-[11px] text-brand-cream-300">{bookingConfirmed.patientPhone}</p>
                  </div>

                  <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
                    <p className="text-brand-cream-300/80">Consultation Mode</p>
                    <p className="font-bold text-sm text-white capitalize mt-0.5">{bookingConfirmed.consultationMode} Call</p>
                    <p className="text-[11px] text-emerald-400 font-semibold">WhatsApp reminder sent</p>
                  </div>
                </div>

                {bookingConfirmed.medicalReports && bookingConfirmed.medicalReports.length > 0 && (
                  <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 space-y-2">
                    <p className="text-brand-cream-300 font-bold text-xs flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-brand-gold-400" />
                      <span>Uploaded Medical Reports ({bookingConfirmed.medicalReports.length} PDF{bookingConfirmed.medicalReports.length > 1 ? 's' : ''}):</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {bookingConfirmed.medicalReports.map((rep, rIdx) => (
                        <div key={rIdx} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs border border-white/10">
                          <span className="font-semibold truncate max-w-[200px]">{rep.name}</span>
                          <span className="text-[10px] text-brand-cream-300">({rep.size})</span>
                          {rep.dataUrl && (
                            <button
                              type="button"
                              onClick={() => openPdfPreview(rep)}
                              className="text-[10px] text-brand-gold-300 hover:underline font-bold ml-1 cursor-pointer flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View PDF</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {bookingConfirmed.meetingLink && (
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <a
                      href={bookingConfirmed.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 rounded-xl bg-brand-gold-500 hover:bg-brand-gold-400 text-brand-green-950 font-bold text-xs flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
                    >
                      <Video className="w-4 h-4" />
                      <span>Join Live Video Consultation Room</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setActiveTab('my-appointments')}
                      className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-colors"
                    >
                      View in My Appointments
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Booking Wizard Section */}
            <div className="space-y-8">
              
              {/* Step Progress Tracker */}
              <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between gap-2 max-w-3xl mx-auto">
                  
                  {/* Step 1 Pill */}
                  <button
                    type="button"
                    onClick={() => setBookingStep(1)}
                    className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 py-2.5 px-2 sm:px-3 rounded-2xl transition-all cursor-pointer text-center ${
                      bookingStep === 1
                        ? 'bg-brand-green-800 text-white shadow-sm ring-2 ring-brand-green-800/20'
                        : bookingStep > 1
                        ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80 border border-emerald-200'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      bookingStep === 1
                        ? 'bg-brand-gold-400 text-brand-green-950'
                        : bookingStep > 1
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {bookingStep > 1 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '1'}
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-[10px] uppercase tracking-wider font-semibold opacity-75">Step 1</p>
                      <p className="text-xs font-bold truncate">Format</p>
                    </div>
                  </button>

                  <div className={`w-4 sm:w-8 h-0.5 rounded-full ${bookingStep > 1 ? 'bg-emerald-500' : 'bg-slate-200'}`} />

                  {/* Step 2 Pill */}
                  <button
                    type="button"
                    onClick={() => setBookingStep(2)}
                    className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 py-2.5 px-2 sm:px-3 rounded-2xl transition-all cursor-pointer text-center ${
                      bookingStep === 2
                        ? 'bg-brand-green-800 text-white shadow-sm ring-2 ring-brand-green-800/20'
                        : bookingStep > 2
                        ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80 border border-emerald-200'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      bookingStep === 2
                        ? 'bg-brand-gold-400 text-brand-green-950'
                        : bookingStep > 2
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {bookingStep > 2 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '2'}
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-[10px] uppercase tracking-wider font-semibold opacity-75">Step 2</p>
                      <p className="text-xs font-bold truncate">Date & Time</p>
                    </div>
                  </button>

                  <div className={`w-4 sm:w-8 h-0.5 rounded-full ${bookingStep > 2 ? 'bg-emerald-500' : 'bg-slate-200'}`} />

                  {/* Step 3 Pill */}
                  <button
                    type="button"
                    onClick={() => setBookingStep(3)}
                    className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 py-2.5 px-2 sm:px-3 rounded-2xl transition-all cursor-pointer text-center ${
                      bookingStep === 3
                        ? 'bg-brand-green-800 text-white shadow-sm ring-2 ring-brand-green-800/20'
                        : bookingStep > 3
                        ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80 border border-emerald-200'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      bookingStep === 3
                        ? 'bg-brand-gold-400 text-brand-green-950'
                        : bookingStep > 3
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {bookingStep > 3 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '3'}
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-[10px] uppercase tracking-wider font-semibold opacity-75">Step 3</p>
                      <p className="text-xs font-bold truncate">Patient Details</p>
                    </div>
                  </button>

                  <div className={`w-4 sm:w-8 h-0.5 rounded-full ${bookingStep > 3 ? 'bg-emerald-500' : 'bg-slate-200'}`} />

                  {/* Step 4 Pill */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!patientName.trim() || !patientPhone.trim()) {
                        setBookingStep(3);
                      } else {
                        setBookingStep(4);
                      }
                    }}
                    className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 py-2.5 px-2 sm:px-3 rounded-2xl transition-all cursor-pointer text-center ${
                      bookingStep === 4
                        ? 'bg-brand-green-800 text-white shadow-sm ring-2 ring-brand-green-800/20'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      bookingStep === 4
                        ? 'bg-brand-gold-400 text-brand-green-950'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      4
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-[10px] uppercase tracking-wider font-semibold opacity-75">Step 4</p>
                      <p className="text-xs font-bold truncate">Confirm & Pay</p>
                    </div>
                  </button>

                </div>
              </div>

              {/* Step Content Form */}
              <form onSubmit={handleBookSlot}>
                
                {/* STEP 1: CHOOSE FORMAT */}
                {bookingStep === 1 && (
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-200">
                    
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-green-800 bg-brand-green-50 px-2.5 py-1 rounded-full border border-brand-green-200">
                          Step 1 of 4
                        </span>
                        <h3 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 mt-2">
                          Select Your Consultation Format
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Choose how you would like to connect with Dr. Arundhati Shekhar
                        </p>
                      </div>
                      
                      {/* Doctor mini-tag */}
                      <div className="flex items-center gap-3 bg-brand-cream-50 p-2.5 rounded-2xl border border-brand-gold-300/40">
                        <img 
                          src={doctor.image} 
                          alt={doctor.name} 
                          className="w-10 h-10 rounded-xl object-cover border border-brand-gold-400" 
                        />
                        <div className="text-xs">
                          <p className="font-bold text-slate-900">{doctor.name}</p>
                          <p className="text-[10px] text-brand-green-800 font-semibold">{doctor.title}</p>
                        </div>
                      </div>
                    </div>

                    {/* Formats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedMode('video')}
                        className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                          selectedMode === 'video'
                            ? 'border-brand-green-800 bg-brand-green-50/80 shadow-md ring-2 ring-brand-green-800/20'
                            : 'border-slate-200 hover:border-brand-gold-400 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedMode === 'video' ? 'bg-brand-green-800 text-brand-gold-300' : 'bg-slate-100 text-slate-700'}`}>
                            <Video className="w-6 h-6" />
                          </div>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Recommended</span>
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900">1-on-1 Video Call</p>
                          <p className="text-xs text-slate-600 mt-1">High-definition face-to-face video consultation. Best for visual pulse, tongue analysis, skin and scalp evaluation.</p>
                          <p className="text-[11px] text-brand-green-800 font-bold mt-2 flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" /> Private encrypted room
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedMode('audio')}
                        className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                          selectedMode === 'audio'
                            ? 'border-brand-green-800 bg-brand-green-50/80 shadow-md ring-2 ring-brand-green-800/20'
                            : 'border-slate-200 hover:border-brand-gold-400 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedMode === 'audio' ? 'bg-brand-green-800 text-brand-gold-300' : 'bg-slate-100 text-slate-700'}`}>
                            <Phone className="w-6 h-6" />
                          </div>
                          <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full">Voice Only</span>
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900">Direct Phone Call</p>
                          <p className="text-xs text-slate-600 mt-1">Direct private phone call to your mobile number. Ideal for patients with low internet bandwidth or on the go.</p>
                          <p className="text-[11px] text-brand-green-800 font-bold mt-2 flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" /> No app required
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedMode('clinic')}
                        className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                          selectedMode === 'clinic'
                            ? 'border-brand-green-800 bg-brand-green-50/80 shadow-md ring-2 ring-brand-green-800/20'
                            : 'border-slate-200 hover:border-brand-gold-400 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedMode === 'clinic' ? 'bg-brand-green-800 text-brand-gold-300' : 'bg-slate-100 text-slate-700'}`}>
                            <MessageSquare className="w-6 h-6" />
                          </div>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">WhatsApp</span>
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900">WhatsApp & Audio</p>
                          <p className="text-xs text-slate-600 mt-1">WhatsApp audio consultation with instant prescription and diet charts delivered directly to your chat.</p>
                          <p className="text-[11px] text-brand-green-800 font-bold mt-2 flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" /> Direct chat support
                          </p>
                        </div>
                      </button>
                    </div>

                    {/* Step 1 Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="text-xs text-slate-500">
                        Selected: <strong className="text-brand-green-800 font-bold capitalize">{selectedMode === 'video' ? '1-on-1 Video Call' : selectedMode === 'audio' ? 'Direct Phone Call' : 'WhatsApp & Audio'}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBookingStep(2)}
                        className="px-6 py-3 rounded-xl bg-brand-green-800 hover:bg-brand-green-900 text-brand-gold-300 font-bold text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                      >
                        <span>Continue to Date & Time</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: CHOOSE DATE & TIME */}
                {bookingStep === 2 && (
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-200">
                    
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-green-800 bg-brand-green-50 px-2.5 py-1 rounded-full border border-brand-green-200">
                          Step 2 of 4
                        </span>
                        <h3 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 mt-2">
                          Select Consultation Date & Time Slot
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Slots are reserved exclusively for 45 minutes of detailed Ayurvedic analysis
                        </p>
                      </div>

                      {/* Live Selected Pill */}
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-gold-50 border border-brand-gold-300 text-brand-green-950 text-xs font-bold self-start sm:self-auto">
                        <Calendar className="w-3.5 h-3.5 text-brand-green-800" />
                        <span>{selectedDate || 'Today'}</span>
                        <span className="text-slate-400">•</span>
                        <Clock className="w-3.5 h-3.5 text-brand-green-800" />
                        <span>{selectedTimeSlot}</span>
                      </div>
                    </div>

                    {/* Date Selector */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        1. Select Preferred Date
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-7 gap-2.5">
                        {next7Days.map((d) => {
                          const isSelected = selectedDate === d.fullIso;
                          return (
                            <button
                              key={d.fullIso}
                              type="button"
                              onClick={() => setSelectedDate(d.fullIso)}
                              className={`py-3.5 px-2 rounded-2xl text-center border-2 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                                isSelected
                                  ? 'border-brand-green-800 bg-brand-green-800 text-white shadow-md ring-2 ring-brand-green-800/30'
                                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-brand-gold-400 hover:bg-brand-cream-50'
                              }`}
                            >
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-brand-gold-300' : 'text-slate-500'}`}>
                                {d.dayName}
                              </span>
                              <span className="text-sm font-extrabold">
                                {d.dateString}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom Date Input for Future Dates */}
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                        <span>Or select a later calendar date:</span>
                        <input
                          type="date"
                          value={selectedDate}
                          min={next7Days[0]?.fullIso}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 font-medium focus:outline-none focus:border-brand-green-800 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Time Slots Section */}
                    <div className="space-y-4 pt-2 border-t border-slate-100">
                      <label className="block text-xs font-bold text-slate-700">
                        2. Select Time Slot
                      </label>

                      {/* Morning */}
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                          <span>🌅 Morning Sessions (09:30 AM – 12:30 PM)</span>
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {morningSlots.map((slot) => {
                            const isSelected = selectedTimeSlot === slot;
                            return (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setSelectedTimeSlot(slot)}
                                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
                                  isSelected
                                    ? 'bg-brand-green-800 text-brand-gold-300 border-brand-green-800 shadow-sm ring-1 ring-brand-green-800'
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-brand-cream-50 hover:border-brand-gold-300'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                <span>{slot}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Afternoon */}
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                          <span>☀️ Afternoon Sessions (02:30 PM – 05:30 PM)</span>
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {afternoonSlots.map((slot) => {
                            const isSelected = selectedTimeSlot === slot;
                            return (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setSelectedTimeSlot(slot)}
                                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
                                  isSelected
                                    ? 'bg-brand-green-800 text-brand-gold-300 border-brand-green-800 shadow-sm ring-1 ring-brand-green-800'
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-brand-cream-50 hover:border-brand-gold-300'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                <span>{slot}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Evening */}
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                          <span>🌙 Evening Sessions (06:00 PM – 08:45 PM)</span>
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {eveningSlots.map((slot) => {
                            const isSelected = selectedTimeSlot === slot;
                            return (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setSelectedTimeSlot(slot)}
                                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
                                  isSelected
                                    ? 'bg-brand-green-800 text-brand-gold-300 border-brand-green-800 shadow-sm ring-1 ring-brand-green-800'
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-brand-cream-50 hover:border-brand-gold-300'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                <span>{slot}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Step 2 Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setBookingStep(1)}
                        className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Back to Format</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBookingStep(3)}
                        className="px-6 py-3 rounded-xl bg-brand-green-800 hover:bg-brand-green-900 text-brand-gold-300 font-bold text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                      >
                        <span>Continue to Patient Details</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: PATIENT DETAILS & HEALTH CONCERN */}
                {bookingStep === 3 && (
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-200">
                    
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-green-800 bg-brand-green-50 px-2.5 py-1 rounded-full border border-brand-green-200">
                          Step 3 of 4
                        </span>
                        <h3 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 mt-2">
                          Patient Information & Health Concerns
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Please provide accurate details so Dr. Arundhati can review prior to your session
                        </p>
                      </div>

                      <div className="text-xs bg-brand-green-50 text-brand-green-800 font-bold px-3 py-1.5 rounded-xl border border-brand-green-200">
                        100% Confidential
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Patient Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input 
                          type="text" 
                          required 
                          value={patientName} 
                          onChange={(e) => setPatientName(e.target.value)}
                          placeholder="e.g. Radhika Sharma" 
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-green-800 bg-slate-50 font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Age</label>
                          <input 
                            type="number" 
                            min="1" 
                            max="120"
                            value={patientAge} 
                            onChange={(e) => setPatientAge(e.target.value ? Number(e.target.value) : '')}
                            placeholder="e.g. 29" 
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-green-800 bg-slate-50 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Gender</label>
                          <select
                            value={patientGender}
                            onChange={(e: any) => setPatientGender(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-green-800 bg-slate-50 font-medium cursor-pointer"
                          >
                            <option value="Female">Female</option>
                            <option value="Male">Male</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            WhatsApp Mobile Number <span className="text-rose-500">*</span>
                          </label>
                          <input 
                            type="tel" 
                            required 
                            value={patientPhone} 
                            onChange={(e) => setPatientPhone(e.target.value)}
                            placeholder="+91 98765 43210" 
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-green-800 bg-slate-50 font-medium"
                          />
                          <p className="text-[10px] text-slate-500 mt-1">Consultation link and reminders will be sent to this WhatsApp number</p>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
                          <input 
                            type="email" 
                            value={patientEmail} 
                            onChange={(e) => setPatientEmail(e.target.value)}
                            placeholder="patient@example.com" 
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-green-800 bg-slate-50 font-medium"
                          />
                          <p className="text-[10px] text-slate-500 mt-1">Digital prescription will be emailed after call</p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Primary Health Concern</label>
                        <select
                          value={healthConcern}
                          onChange={(e) => setHealthConcern(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-green-800 bg-slate-50 font-medium cursor-pointer"
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
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Medical Notes & Existing Medications (Optional)</label>
                        <textarea
                          rows={2}
                          value={previousHistory}
                          onChange={(e) => setPreviousHistory(e.target.value)}
                          placeholder="Mention any ongoing treatments, blood reports, allergies, or questions..."
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-green-800 bg-slate-50 font-medium resize-none"
                        />
                      </div>

                      {/* PDF Medical Report Upload Section */}
                      <div className="pt-2 border-t border-slate-100 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div>
                            <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <FileText className="w-4 h-4 text-rose-600" />
                              <span>Previous Medical Reports & Prescriptions (PDF)</span>
                              <span className="text-[10px] font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">Optional</span>
                            </label>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Upload previous doctor prescriptions, blood tests, ultrasound/MRI, or lab reports for Dr. Arundhati's review.
                            </p>
                          </div>
                          {uploadedReports.length > 0 && (
                            <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full self-start sm:self-auto flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>{uploadedReports.length} PDF{uploadedReports.length > 1 ? 's' : ''} Attached</span>
                            </span>
                          )}
                        </div>

                        {/* Drag & Drop or Click Upload Box */}
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDraggingReports(true);
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            setIsDraggingReports(false);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDraggingReports(false);
                            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                              handleReportUpload(e.dataTransfer.files);
                            }
                          }}
                          className={`relative border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center transition-all cursor-pointer ${
                            isDraggingReports
                              ? 'border-brand-green-800 bg-brand-green-50/80 scale-[1.01]'
                              : 'border-slate-300 hover:border-brand-gold-400 bg-slate-50/70 hover:bg-brand-cream-50/40'
                          }`}
                        >
                          <input
                            id="pdf-report-upload-input"
                            type="file"
                            multiple
                            accept=".pdf,application/pdf"
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                handleReportUpload(e.target.files);
                              }
                            }}
                            className="hidden"
                          />

                          <label htmlFor="pdf-report-upload-input" className="cursor-pointer block space-y-2">
                            <div className="w-10 h-10 mx-auto rounded-full bg-brand-green-100 text-brand-green-800 flex items-center justify-center shadow-xs">
                              <Upload className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">
                                <span className="text-brand-green-800 underline underline-offset-2">Click to browse</span> or drag & drop PDF files
                              </p>
                              <p className="text-[10px] text-slate-500 mt-1">
                                Supported: <strong>.PDF format</strong> (Max 5 files, 15MB each) • 100% Medical Privacy Guaranteed
                              </p>
                            </div>
                          </label>
                        </div>

                        {/* Error Message */}
                        {reportUploadError && (
                          <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{reportUploadError}</span>
                          </p>
                        )}

                        {/* Uploaded PDF List */}
                        {uploadedReports.length > 0 && (
                          <div className="space-y-2 pt-1">
                            <p className="text-[11px] font-bold text-slate-700">Uploaded PDF Documents ({uploadedReports.length}):</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {uploadedReports.map((report, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-brand-gold-400 transition-colors"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center font-bold text-[10px] shrink-0">
                                      PDF
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-bold text-slate-800 truncate" title={report.name}>
                                        {report.name}
                                      </p>
                                      <p className="text-[10px] text-slate-500">
                                        {report.size} • {report.uploadedAt}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0 ml-2">
                                    {report.dataUrl && (
                                      <button
                                        type="button"
                                        onClick={() => openPdfPreview(report)}
                                        title="View PDF"
                                        className="p-1.5 rounded-lg text-slate-500 hover:text-brand-green-800 hover:bg-slate-100 transition-colors cursor-pointer"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveReport(idx)}
                                      title="Remove File"
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Step 3 Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setBookingStep(2)}
                        className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Back to Date & Time</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!patientName.trim()) {
                            alert('Please enter the patient full name.');
                            return;
                          }
                          if (!patientPhone.trim()) {
                            alert('Please enter your WhatsApp mobile number.');
                            return;
                          }
                          setBookingStep(4);
                        }}
                        className="px-6 py-3 rounded-xl bg-brand-green-800 hover:bg-brand-green-900 text-brand-gold-300 font-bold text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                      >
                        <span>Continue to Review & Pay</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 4: REVIEW & CONFIRM BOOKING */}
                {bookingStep === 4 && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-200">
                    
                    {/* Left 7 cols: Appointment Summary Details */}
                    <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
                      
                      {/* Header */}
                      <div className="border-b border-slate-100 pb-4">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-green-800 bg-brand-green-50 px-2.5 py-1 rounded-full border border-brand-green-200">
                          Step 4 of 4
                        </span>
                        <h3 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 mt-2">
                          Review Consultation Summary
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Please verify your appointment information before final confirmation
                        </p>
                      </div>

                      {/* Doctor Profile Mini Card */}
                      <div className="bg-brand-cream-50/80 p-4 sm:p-5 rounded-2xl border border-brand-green-600/15 flex items-center gap-4">
                        <img 
                          src={doctor.image} 
                          alt={doctor.name} 
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-brand-gold-400 shadow-sm" 
                        />
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-serif text-base font-bold text-slate-900 truncate">{doctor.name}</h4>
                            <span className="text-[9px] font-bold px-2 py-0.5 bg-brand-green-800 text-brand-gold-300 rounded">
                              BHU Gold Medalist
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-brand-green-800">{doctor.title}</p>
                          <p className="text-[11px] text-slate-500">{doctor.qualification}</p>
                        </div>
                      </div>

                      {/* Review Table / Key Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                          <p className="text-slate-500 font-medium">Consultation Format</p>
                          <p className="font-bold text-sm text-slate-900 capitalize flex items-center gap-1.5">
                            {selectedMode === 'video' ? <Video className="w-4 h-4 text-brand-green-800" /> : <Phone className="w-4 h-4 text-brand-green-800" />}
                            {selectedMode === 'video' ? '1-on-1 Video Call' : selectedMode === 'audio' ? 'Direct Phone Call' : 'WhatsApp & Audio'}
                          </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                          <p className="text-slate-500 font-medium">Scheduled Date & Time</p>
                          <p className="font-bold text-sm text-brand-green-950 flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-brand-green-800" />
                            {selectedDate || 'Today'} @ {selectedTimeSlot}
                          </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                          <p className="text-slate-500 font-medium">Patient Information</p>
                          <p className="font-bold text-sm text-slate-900">
                            {patientName} {patientAge ? `(${patientAge} yrs, ${patientGender})` : ''}
                          </p>
                          <p className="text-[11px] text-slate-600">{patientPhone}</p>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                          <p className="text-slate-500 font-medium">Primary Health Concern</p>
                          <p className="font-bold text-xs text-brand-green-900">
                            {healthConcern}
                          </p>
                        </div>
                      </div>

                      {/* Attached Medical Reports Summary in Step 4 */}
                      {uploadedReports.length > 0 && (
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <FileText className="w-4 h-4 text-rose-600" />
                              <span>Attached Medical Reports ({uploadedReports.length} PDF{uploadedReports.length > 1 ? 's' : ''})</span>
                            </p>
                            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                              PDF Uploaded
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {uploadedReports.map((r, i) => (
                              <div
                                key={i}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 shadow-2xs"
                              >
                                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                <span className="font-semibold truncate max-w-[160px]">{r.name}</span>
                                <span className="text-[10px] text-slate-500">({r.size})</span>
                                {r.dataUrl && (
                                  <button
                                    type="button"
                                    onClick={() => openPdfPreview(r)}
                                    className="text-brand-green-800 hover:underline font-bold text-[10px] ml-1 flex items-center gap-0.5 cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>Preview</span>
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Included Benefits Strip */}
                      <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2">
                        <p className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-700" />
                          <span>Included in your Consultation:</span>
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-emerald-900">
                          <span className="flex items-center gap-1.5">✓ 45-Min Live Deep-Root Consultation</span>
                          <span className="flex items-center gap-1.5">✓ Digital Ayurvedic Rx (BHU Verified)</span>
                          <span className="flex items-center gap-1.5">✓ Personalized Diet & Ahar-Vihar Chart</span>
                          <span className="flex items-center gap-1.5">✓ 7 Days Free Follow-Up over WhatsApp</span>
                        </div>
                      </div>

                      {/* Back button */}
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setBookingStep(3)}
                          className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Edit Patient Info</span>
                        </button>
                      </div>
                    </div>

                    {/* Right 5 cols: Payment Box & Direct Confirm */}
                    <div className="lg:col-span-5 bg-gradient-to-br from-brand-green-950 via-brand-green-900 to-brand-green-950 text-brand-cream-50 rounded-3xl p-6 sm:p-8 border-2 border-brand-gold-500/30 shadow-xl space-y-5">
                      
                      <div className="flex items-center justify-between border-b border-brand-gold-500/20 pb-3">
                        <h4 className="font-serif text-base font-bold text-white">
                          Final Price Breakdown
                        </h4>
                        <span className="text-[10px] text-brand-gold-300 font-bold uppercase tracking-wider bg-brand-gold-500/20 px-2 py-0.5 rounded-full">
                          AYUSH Subsidized
                        </span>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="flex justify-between text-brand-cream-200">
                          <span>Standard Consultation Fee:</span>
                          <span className="line-through text-brand-cream-300/60">₹{doctor.originalFee}</span>
                        </div>
                        <div className="flex justify-between text-emerald-400 font-semibold">
                          <span>First-time Patient Grant:</span>
                          <span>-₹{doctor.originalFee - doctor.fee}</span>
                        </div>
                        <div className="flex justify-between text-brand-cream-200">
                          <span>Digital Prescription & Diet Plan:</span>
                          <span className="text-emerald-400 font-bold">FREE</span>
                        </div>
                        <div className="flex justify-between text-brand-cream-200">
                          <span>7-Day WhatsApp Follow-up:</span>
                          <span className="text-emerald-400 font-bold">FREE</span>
                        </div>
                        <div className="flex justify-between text-brand-cream-200 border-t border-white/15 pt-4 font-bold text-white">
                          <span className="text-sm">Total Payable:</span>
                          <span className="text-2xl text-brand-gold-300">₹{doctor.fee}</span>
                        </div>
                      </div>

                      {/* Confirm & Book Button */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-brand-gold-500 to-brand-gold-600 hover:from-brand-gold-400 hover:to-brand-gold-500 disabled:opacity-70 text-brand-green-950 font-bold text-sm shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-brand-green-950" />
                            <span>Confirming Slot with Dr. Arundhati...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 text-brand-green-950" />
                            <span>Confirm & Book Consultation (₹{doctor.fee})</span>
                          </>
                        )}
                      </button>

                      <div className="pt-2 flex items-center justify-center gap-4 text-[11px] text-brand-cream-300/80">
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-brand-gold-400" />
                          100% Safe & Encrypted
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <RefreshCw className="w-3.5 h-3.5 text-brand-gold-400" />
                          Reschedule anytime
                        </span>
                      </div>

                    </div>

                  </div>
                )}

              </form>
            </div>

            {/* 4. VALUE PROPOSITIONS, 4-STEP ROADMAP, INCLUSIONS */}
            <ConsultationFeatures
              doctorFee={doctor.fee}
              onBookClick={() => {
                const el = document.getElementById('book-slot-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {/* TAB 2: DOCTOR PROFILE & LINEAGE DEEP-DIVE */}
        {activeTab === 'doctor-profile' && (
          <div className="space-y-10">
            
            {/* Spotlight Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                
                <div className="lg:col-span-4">
                  <div className="relative mx-auto max-w-sm rounded-2xl overflow-hidden border-2 border-brand-gold-400/50 shadow-xl bg-brand-green-950 p-2">
                    <img 
                      src={doctor.image} 
                      alt={doctor.name} 
                      className="w-full aspect-[4/5] object-cover rounded-xl"
                    />
                    <div className="mt-3 text-center text-white pb-1">
                      <h4 className="font-serif text-lg font-bold">{doctor.name}</h4>
                      <p className="text-xs text-brand-gold-300 font-medium">Gold Medalist • Banaras Hindu University</p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-8 space-y-5">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-gold-100 text-brand-green-950 text-xs font-bold">
                      <Award className="w-3.5 h-3.5 text-brand-gold-600" />
                      <span>4-Generation Classical Vaidya Parampara</span>
                    </div>
                    <h3 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
                      Meet Vaidya Ratna Dr. Arundhati Sharma
                    </h3>
                    <p className="text-xs text-brand-green-800 font-bold">
                      BAMS, MD (Ayurveda), Fellow of All India Institute of Ayurveda (AIIA), AYUSH Reg. #AY-24890
                    </p>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {doctor.bio}
                  </p>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    Having trained under master Vaidyas across Varanasi, Kerala, and the Himalayan foothills, Dr. Arundhati blends rigorous classical texts (Charaka Samhita, Sushruta Samhita, and Ashtanga Hridaya) with modern clinical precision. She has successfully consulted over 18,500 patients worldwide, helping them reverse lifelong ailments through individualized botanical regimens and circadian rhythm alignment.
                  </p>

                  {/* Core Clinical Specialties */}
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Core Clinical Specialties</p>
                    <div className="flex flex-wrap gap-2">
                      {doctor.specialties.map((spec, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-full bg-brand-green-50 text-brand-green-900 border border-brand-green-200 text-xs font-bold">
                          ✓ {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab('book')}
                      className="px-6 py-3 bg-brand-green-800 hover:bg-brand-green-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Book Consultation Slot with Dr. Arundhati</span>
                    </button>
                    <span className="text-xs text-slate-500">
                      Standard slot: 25 minutes live consultation
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* 5 Pillars of Healing */}
            <div className="bg-brand-green-950 text-brand-cream-50 rounded-3xl p-6 sm:p-10 border border-brand-gold-500/20 shadow-xl space-y-6">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-brand-gold-400">Dr. Arundhati's Clinical Framework</span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                  The 5 Classical Pillars of Healing
                </h3>
                <p className="text-xs text-brand-cream-200">
                  Every consultation is guided by these sacred diagnostic disciplines to eliminate root-cause pathology
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-gold-500/20 text-brand-gold-300 flex items-center justify-center font-bold">
                    <Activity className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-white">1. Classical Nadi Pariksha</h4>
                  <p className="text-xs text-brand-cream-200/80 leading-relaxed">
                    Reading the deep and superficial arterial pulse waves to detect organ toxicity, sub-dosha imbalances, and impending disease patterns.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-gold-500/20 text-brand-gold-300 flex items-center justify-center font-bold">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-white">2. Agni & Deepana Therapy</h4>
                  <p className="text-xs text-brand-cream-200/80 leading-relaxed">
                    Re-igniting the digestive fire (Jatharagni) to completely break down metabolic toxins (Ama) that clog tissue channels (Srotas).
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-gold-500/20 text-brand-gold-300 flex items-center justify-center font-bold">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-white">3. Dravyaguna Botanical Formulation</h4>
                  <p className="text-xs text-brand-cream-200/80 leading-relaxed">
                    Pairing potent wild-harvested herbs (like Shilajit, Kesar, Ashwagandha, and Triphala) with natural catalytic carriers (Anupanas) for deep cell absorption.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: MY APPOINTMENTS */}
        {activeTab === 'my-appointments' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="font-serif text-2xl font-bold text-slate-900">My Consultation Sessions</h3>
                <p className="text-xs text-slate-500 mt-0.5">Manage your upcoming and past doctor consultation appointments</p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('book')}
                className="px-4 py-2 bg-brand-green-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-brand-green-900 cursor-pointer shadow-xs"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Book New Session</span>
              </button>
            </div>

            {myAppointments.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4 max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full bg-brand-green-50 text-brand-green-800 flex items-center justify-center mx-auto">
                  <Stethoscope className="w-8 h-8" />
                </div>
                <h4 className="font-serif text-lg font-bold text-slate-800">No Consultations Scheduled Yet</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  You haven't scheduled any consultations with Dr. Arundhati Sharma yet. Book a session to get your customized health diagnosis and herbal prescription.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('book')}
                  className="px-6 py-2.5 bg-brand-green-800 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-brand-green-900 cursor-pointer"
                >
                  Schedule Your Initial Session
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {myAppointments.map((app) => (
                  <div 
                    key={app.id}
                    className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={app.doctorImage || doctor.image} 
                          alt={app.doctorName} 
                          className="w-12 h-12 rounded-2xl object-cover border border-brand-gold-400" 
                        />
                        <div>
                          <p className="font-bold text-sm text-slate-900">{app.doctorName}</p>
                          <p className="text-[11px] text-brand-green-800 font-medium">{app.doctorSpecialty} • {app.doctorQualification}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        app.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {app.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-xl">
                        <span className="text-[10px] text-slate-400 block">Appointment Date</span>
                        <span className="font-bold text-slate-800">{app.date}</span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl">
                        <span className="text-[10px] text-slate-400 block">Time Slot</span>
                        <span className="font-bold text-brand-green-800">{app.timeSlot}</span>
                      </div>
                    </div>

                    <div className="text-xs space-y-1 text-slate-600">
                      <p><span className="font-bold text-slate-700">Patient:</span> {app.patientName} ({app.patientAge} yrs, {app.patientGender})</p>
                      <p><span className="font-bold text-slate-700">Concern:</span> {app.healthConcern}</p>
                    </div>

                    {/* Attached Medical Reports */}
                    {app.medicalReports && app.medicalReports.length > 0 && (
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-1.5">
                        <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-rose-600" />
                          <span>Attached Reports ({app.medicalReports.length} PDF{app.medicalReports.length > 1 ? 's' : ''}):</span>
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {app.medicalReports.map((r, i) => (
                            <div key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-medium text-slate-800">
                              <span className="truncate max-w-[130px]">{r.name}</span>
                              {r.dataUrl && (
                                <button
                                  type="button"
                                  onClick={() => openPdfPreview(r)}
                                  className="text-brand-green-800 hover:underline font-bold text-[10px] cursor-pointer"
                                >
                                  View
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                      {app.meetingLink && app.status === 'Confirmed' ? (
                        <a
                          href={app.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-xl bg-brand-green-800 hover:bg-brand-green-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Live Video Room</span>
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
                          Cancel Slot
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. REAL PATIENT TESTIMONIALS FOR DR. ARUNDHATI */}
        <section className="mt-16 bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-gold-600">Verified Patient Results</span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
              Transformative Healing Stories
            </h3>
            <p className="text-xs text-slate-500">
              Read how patients regained vital health through Dr. Arundhati Sharma’s precision Ayurvedic regimens
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-brand-cream-50/70 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex text-amber-400 gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-xs text-slate-700 italic leading-relaxed">
                  "I was suffering from severe chronic acidity, bloating, and IBS for over 4 years. Allopathic antacids only provided 2-hour relief. Dr. Arundhati listened patiently for 30 minutes, explained my Pitta Agni imbalance, and prescribed a simple herbal churnam + warm water routine. In 3 weeks, my digestion is completely normal!"
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">Meenakshi Sundaram</p>
                  <p className="text-[10px] text-slate-500">Bangalore • Gut Health</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Verified</span>
              </div>
            </div>

            <div className="bg-brand-cream-50/70 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex text-amber-400 gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-xs text-slate-700 italic leading-relaxed">
                  "Struggled with irregular cycles and cystic acne from PCOS. Dr. Arundhati’s holistic protocol combined Shatavari Rasayana, Kanchanar Guggulu, and circadian food timings. My cycles normalized naturally within 3 months, and my skin cleared up without any hormones."
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">Pooja Deshmukh</p>
                  <p className="text-[10px] text-slate-500">Pune • PCOS & Hormones</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Verified</span>
              </div>
            </div>

            <div className="bg-brand-cream-50/70 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex text-amber-400 gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-xs text-slate-700 italic leading-relaxed">
                  "My 68-year-old mother could barely climb stairs due to knee osteoarthritis. Dr. Arundhati recommended Shallaki Guggul and Mahanarayan oil taila basti. Today she walks in the park every morning without painkillers. True blessing to have a doctor of this stature."
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">Ravi Shankar Verma</p>
                  <p className="text-[10px] text-slate-500">Delhi NCR • Joint Care</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Verified</span>
              </div>
            </div>
          </div>
        </section>

        {/* 5. FREQUENTLY ASKED QUESTIONS */}
        <section className="mt-16 bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-gold-600">Got Questions?</span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
              Doctor Consultation FAQs
            </h3>
            <p className="text-xs text-slate-500">
              Everything you need to know about scheduling and experiencing your session
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3 pt-2">
            {FAQS.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div 
                  key={index}
                  className="rounded-2xl border border-slate-200 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full p-4 sm:p-5 text-left bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-bold text-slate-900">{faq.q}</span>
                    <span className={`w-6 h-6 rounded-full bg-brand-green-800 text-white flex items-center justify-center text-xs font-bold shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                      ↓
                    </span>
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
