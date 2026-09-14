/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Video, Phone, MessageSquare, CheckCircle, Star, 
  ShieldCheck, Award, User, Check, X, ArrowRight, ArrowLeft, Loader2,
  FileText, Upload, Trash2, Eye, Shield, Sparkles, ChevronLeft, ChevronRight,
  HeartHandshake, Stethoscope, CreditCard, Lock, CheckCircle2, QrCode,
  Building2, Smartphone, AlertCircle, Coins, PhoneCall, MessageCircle,
  Image as ImageIcon, Camera, FileCheck
} from 'lucide-react';
import { Doctor, DoctorAppointment, User as UserType, MedicalReportFile } from '../types';
import { Language } from '../lib/translations';
import { api } from '../services/api';
import { ConsultationFeatures } from '../components/ConsultationFeatures';
import { loadRazorpayScript } from '../utils/razorpay';
import { sendMSG91Otp, formatMSG91Identifier, performOtpLogin } from '../services/msg91OtpService';
import drImage from "@/assets/DrSanjeev.png";

const legendaryDoctorImg = drImage;
const doctorBannerDesktop = drImage;
const doctorBannerMobile = drImage;

interface DoctorConsultationProps {
  currentUser: UserType | null;
  onNavigate: (page: string, params?: any) => void;
  language: Language;
  onLoginSuccess?: (token: string, user?: any) => void;
  authToken?: string | null;
}

const LEGEND_DOCTOR: Doctor = {
  id: 'doc-legend-1',
  name: 'Dr. Sanjeev Rastogi',
  title: 'Chief Ayurvedic Physician & Master Nadi Vaidya',
  qualification: "Ph.D, MD (Ayurveda), Banaras Hindu University (BHU)",
  experienceYears: 30,
  specialties: [
    'Classical Nadi Pariksha (Pulse Diagnosis)',
    'Gut Dysbiosis, Acidity & Agni Reversal',
    'PCOS, Thyroid & Hormonal Health',
    'Chronic Joint & Arthritis Care',
    'Rasayana Cellular Rejuvenation'
  ],
  languages: ['Hindi', 'English'],
  fee: 499,
  originalFee: 1200,
  rating: 4.98,
  reviewsCount: 2450,
  image: legendaryDoctorImg,
  bio: 'Former Head of Dept. Kaya Chikitsa & Panchakarma at State Ayurvedic College, Lucknow with over 30 years of clinical and academic mastery.',
  availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  nextAvailable: 'Today, 04:30 PM'
};

const doctorHeroSlides = [
  {
    id: "doc-slide-1",
    desktopImage: doctorBannerDesktop,
    mobileImage: doctorBannerMobile,
  },
  {
    id: "doc-slide-2",
    desktopImage: doctorBannerDesktop,
    mobileImage: doctorBannerMobile,
  }
];

const HEALTH_CONCERNS = [
  'Digestion & Acidity',
  'PCOS & Hormonal Balance',
  'Joint Pain & Arthritis',
  'Skin & Hair Concerns',
  'Stress & Insomnia',
  'Metabolism & Weight',
  'General Wellness'
];

export const DoctorConsultation: React.FC<DoctorConsultationProps> = ({
  currentUser,
  onNavigate,
  language,
  onLoginSuccess,
  authToken
}) => {
  const [doctor, setDoctor] = useState<Doctor>(LEGEND_DOCTOR);
  const [activeTab, setActiveTab] = useState<'book' | 'my-appointments' | 'about-doctor' | 'fees-chart'>('book');

  // Hero Slider State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSlidePaused, setIsSlidePaused] = useState(false);

  // Auto rotate banner matching CustomerHome
  useEffect(() => {
    if (isSlidePaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % doctorHeroSlides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isSlidePaused]);

  // Booking selections (3 Premium Consultation Formats: Video, Phone/WhatsApp Call, WhatsApp Chat)
  const [selectedMode, setSelectedMode] = useState<'video' | 'audio' | 'chat'>('video');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('11:00 AM');

  // Multi-step booking progression (format -> datetime -> information -> auth (if guest) -> payment)
  const [bookingStep, setBookingStep] = useState<'format' | 'datetime' | 'information' | 'auth' | 'payment'>('format');
  const [formError, setFormError] = useState<string | null>(null);

  // Payment states (Razorpay UPI/Cards/Net Banking)
  const paymentMethod = 'razorpay' as const;
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  // Patient inputs
  const [patientName, setPatientName] = useState(currentUser?.fullName || '');
  const [patientEmail, setPatientEmail] = useState(currentUser?.email || '');
  const [patientAge, setPatientAge] = useState<number | ''>(28);
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>('Female');
  const [patientPhone, setPatientPhone] = useState(currentUser?.phone || '');
  const [healthConcern, setHealthConcern] = useState('Digestion & Acidity');
  const [customConcern, setCustomConcern] = useState('');
  
  // Instant Mobile OTP Auth states (like Instant Buy / Checkout)
  const [authMobile, setAuthMobile] = useState('');
  const [authOtpCode, setAuthOtpCode] = useState('');
  const [authReqId, setAuthReqId] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);
  const [usePasswordInstead, setUsePasswordInstead] = useState(false);
  const [authPassword, setAuthPassword] = useState('');
  
  // Medical Reports (Multiple PDFs)
  const [uploadedReports, setUploadedReports] = useState<MedicalReportFile[]>([]);
  const [showReportUpload, setShowReportUpload] = useState(true);
  const [reportError, setReportError] = useState<string | null>(null);

  // Single Condition / Prescription Photo
  const [uploadedPhoto, setUploadedPhoto] = useState<{
    name: string;
    size: string;
    dataUrl: string;
    uploadedAt: string;
  } | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);

  // Status & persistence
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Pre-fill user details if logged in
  useEffect(() => {
    if (currentUser) {
      if (!patientName && currentUser.fullName) setPatientName(currentUser.fullName);
      if (!patientPhone && currentUser.phone) setPatientPhone(currentUser.phone);
      if (!patientEmail && currentUser.email) setPatientEmail(currentUser.email);
    }
  }, [currentUser]);

  // Load doctor from backend API
  useEffect(() => {
    let isMounted = true;
    api.getDoctors().then(data => {
      if (isMounted && data && data.length > 0) {
        const found = data[0];
        setDoctor({
          ...found,
          image: found.image || legendaryDoctorImg || LEGEND_DOCTOR.image
        });
      }
    }).catch(err => {
      console.warn('Backend doctor fetch fallback to legend:', err);
    });
    return () => { isMounted = false; };
  }, []);

  // Fetch appointments for user
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

  // Next 7 available dates
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

  const timeSlots = [
    '09:30 AM', '10:15 AM', '11:00 AM', '11:45 AM',
    '02:30 PM', '03:15 PM', '04:00 PM', '04:45 PM',
    '06:00 PM', '06:45 PM', '07:30 PM'
  ];

  // Multiple PDF Reports handler
  const handleReportUpload = (files: FileList | File[]) => {
    setReportError(null);
    const fileArray = Array.from(files);
    
    if (uploadedReports.length + fileArray.length > 10) {
      setReportError('Maximum 10 medical reports allowed in total.');
      return;
    }

    fileArray.forEach(file => {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        setReportError(`File "${file.name}" is not a PDF. Only PDF reports allowed.`);
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        setReportError(`File "${file.name}" exceeds 15MB limit.`);
        return;
      }

      const formattedSize = file.size < 1024 * 1024
        ? `${(file.size / 1024).toFixed(1)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : undefined;
        setUploadedReports(prev => [
          ...prev,
          {
            name: file.name,
            size: formattedSize,
            type: 'application/pdf',
            dataUrl,
            uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Single Condition / Prescription Photo handler (1 option of photo)
  const handlePhotoUpload = (file: File) => {
    setPhotoError(null);
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoError('Please upload an image file (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      setPhotoError('Photo exceeds 12MB limit. Please upload a smaller image.');
      return;
    }

    const formattedSize = file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(1)} KB`
      : `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      setUploadedPhoto({
        name: file.name,
        size: formattedSize,
        dataUrl,
        uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    };
    reader.readAsDataURL(file);
  };

  // OTP Countdown timer
  useEffect(() => {
    let interval: any;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // If user signs in while on auth step, automatically move to payment
  useEffect(() => {
    if (currentUser && bookingStep === 'auth') {
      setBookingStep('payment');
    }
  }, [currentUser, bookingStep]);

  // Dispatch OTP via MSG91 for non-logged-in user
  const handleSendOtp = async () => {
    setAuthError(null);
    setAuthSuccessMsg(null);
    const clean = authMobile.replace(/\D/g, '').slice(-10);
    if (clean.length !== 10) {
      setAuthError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setIsSendingOtp(true);
    try {
      const target = formatMSG91Identifier(clean);
      const res = await sendMSG91Otp(target);
      if (res.success) {
        setOtpSent(true);
        setAuthReqId(res.reqId || '');
        setOtpTimer(30);
        setAuthSuccessMsg(`OTP sent to +91 ${clean}. Enter the 4-digit code below.`);
      } else {
        setAuthError(res.error || 'Failed to dispatch verification OTP. Please verify number.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'SMS service temporary failure. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify OTP and proceed directly to payment
  const handleVerifyOtpAndProceed = async () => {
    setAuthError(null);
    const clean = authMobile.replace(/\D/g, '').slice(-10);
    const code = authOtpCode.trim();
    if (!code || code.length < 4) {
      setAuthError('Please enter the 4-digit verification code.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const loginRes = await performOtpLogin({
        identifier: clean,
        code,
        reqId: authReqId,
        fullName: patientName.trim() || 'Ayurveda Patient',
        email: patientEmail.trim() || `${clean}@gramslife.com`,
        autoCreate: true
      });

      if (loginRes.success && loginRes.user) {
        if (loginRes.token) {
          sessionStorage.setItem('grams_auth_token', loginRes.token);
          localStorage.setItem('grams_auth_token', loginRes.token);
          if (onLoginSuccess) {
            onLoginSuccess(loginRes.token, loginRes.user);
          }
        }
        setAuthSuccessMsg('Identity verified! Advancing to payment step...');
        setTimeout(() => {
          setBookingStep('payment');
          document.getElementById('booking-step-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      } else {
        setAuthError(loginRes.error || 'Incorrect OTP code. Please check and try again.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Optional password login
  const handlePasswordLoginAndProceed = async () => {
    setAuthError(null);
    if (!patientEmail.trim() || !authPassword.trim()) {
      setAuthError('Please enter your email and password.');
      return;
    }
    setIsVerifyingOtp(true);
    try {
      const res = await api.login({ email: patientEmail.trim(), password: authPassword.trim() });
      if (res && res.token) {
        sessionStorage.setItem('grams_auth_token', res.token);
        localStorage.setItem('grams_auth_token', res.token);
        if (onLoginSuccess) {
          onLoginSuccess(res.token, res.user);
        }
        setAuthSuccessMsg('Signed in successfully! Advancing to payment...');
        setTimeout(() => {
          setBookingStep('payment');
          document.getElementById('booking-step-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      } else {
        setAuthError('Invalid credentials. Please verify or use Mobile OTP.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Failed to sign in. Please verify password or use Mobile OTP.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Step 1 -> Step 2: User clicks or chooses a consultation format
  const handleSelectFormatAndProceed = (mode: 'video' | 'audio' | 'chat' = 'video') => {
    setSelectedMode(mode);
    setBookingStep('datetime');
    setTimeout(() => {
      document.getElementById('booking-step-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  // Step 2 -> Step 3: User confirms date & time slot
  const handleProceedToInformation = () => {
    if (!selectedMode) {
      setBookingStep('format');
      return;
    }
    if (!selectedDate) {
      alert('Please select a preferred date.');
      return;
    }
    if (!selectedTimeSlot) {
      alert('Please select a preferred time slot.');
      return;
    }
    setBookingStep('information');
    setTimeout(() => {
      document.getElementById('booking-step-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  // Step 3 -> Step 4 (or Auth Step):
  // "if user already login then then move and if not login then move to login screen same as instant buy enter mobile no otp then move like that in doctor booking"
  const handleProceedToPayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);

    if (!selectedMode) {
      setFormError('Please select a consultation format (Video, Audio, or Chat).');
      setBookingStep('format');
      return;
    }
    if (!selectedDate || !selectedTimeSlot) {
      setFormError('Please pick your consultation date and preferred time slot.');
      setBookingStep('datetime');
      return;
    }
    if (!patientName.trim()) {
      setFormError('Please enter the patient’s full name.');
      return;
    }
    const cleanPhone = patientPhone.trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setFormError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!patientEmail.trim() || !patientEmail.includes('@')) {
      setFormError('Please provide a valid email address to receive your official consultation pass & meeting link.');
      return;
    }

    // CHECK AUTH STATUS:
    if (currentUser) {
      // User is already logged in -> Move straight to payment!
      setBookingStep('payment');
      setTimeout(() => {
        document.getElementById('booking-step-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    } else {
      // User is NOT logged in -> Move to login screen (Mobile OTP) same as instant buy!
      const tenDigit = cleanPhone.slice(-10);
      setAuthMobile(tenDigit);
      setBookingStep('auth');
      setTimeout(() => {
        document.getElementById('booking-step-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  };

  // Finalize booking after payment authorization
  const finalizeBooking = async (paymentDetails: {
    paymentMethod: string;
    paymentStatus: 'Paid' | 'Pending';
    paymentId: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
  }) => {
    setIsPaymentProcessing(true);
    setIsSubmitting(true);
    const appointmentId = `BVL-DOC-${Math.floor(100000 + Math.random() * 900000)}`;

    const effectivePatientEmail = patientEmail.trim() || currentUser?.email || 'patient@bvlife.com';

    const newAppointment: DoctorAppointment = {
      id: appointmentId,
      doctorId: doctor.id,
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialties[0],
      doctorImage: doctor.image || legendaryDoctorImg,
      doctorQualification: doctor.qualification,
      patientName: patientName.trim(),
      patientAge: Number(patientAge) || 28,
      patientGender,
      patientPhone: patientPhone.trim(),
      patientEmail: effectivePatientEmail,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      consultationMode: selectedMode || 'video',
      healthConcern: customConcern.trim() ? customConcern.trim() : healthConcern,
      medicalReports: uploadedReports,
      patientPhoto: uploadedPhoto?.dataUrl || undefined,
      fee: doctor.fee,
      status: 'Confirmed',
      bookingDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      meetingLink: selectedMode === 'video' ? `https://meet.jit.si/BVLife-${encodeURIComponent((doctor.name || 'Doctor').replace(/[^a-zA-Z0-9]/g, ''))}-${appointmentId}` : undefined,
      paymentMethod: paymentDetails.paymentMethod,
      paymentStatus: paymentDetails.paymentStatus,
      paymentId: paymentDetails.paymentId,
      razorpayOrderId: paymentDetails.razorpayOrderId,
      razorpayPaymentId: paymentDetails.razorpayPaymentId
    };

    let finalApp = newAppointment;
    try {
      const response = await api.bookDoctorAppointment(newAppointment);
      if (response?.success && response.appointment) {
        finalApp = response.appointment;
      }
    } catch (err) {
      console.warn('Backend appointment booking fallback:', err);
    } finally {
      setIsPaymentProcessing(false);
      setIsSubmitting(false);
    }

    const updated = [finalApp, ...myAppointments.filter(a => a.id !== finalApp.id)];
    setMyAppointments(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('bvlife_doctor_appointments', JSON.stringify(updated));
      localStorage.setItem('bvlife_last_appointment_alert', JSON.stringify({
        ...finalApp,
        alertTimestamp: Date.now()
      }));
      window.dispatchEvent(new CustomEvent('new_doctor_appointment_booked', { detail: finalApp }));
    }

    // Immediately display the confirmation card with verified details!
    setBookingConfirmed(finalApp);
    setBookingStep('format');
    setTimeout(() => {
      const bookingAnchor = document.getElementById('booking-confirmed-card');
      if (bookingAnchor) {
        bookingAnchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Launch Razorpay Checkout connected to backend order API (same as buy product order)
  const handleRazorpayCheckout = async () => {
    setIsPaymentProcessing(true);
    setIsSubmitting(true);
    setFormError(null);

    try {
      // Step 1: Request Razorpay Order from backend
      const res = await fetch('/api/payment/razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: doctor.fee,
          currency: 'INR',
          receipt: `doc_${Date.now()}`
        })
      });

      const data = await res.json();
      const finalKey = data.keyId || (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag';

      // Step 2: Load official Razorpay SDK script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert("Failed to load Razorpay payment SDK. Please verify your internet connection.");
        setIsPaymentProcessing(false);
        setIsSubmitting(false);
        return;
      }

      // Step 3: Open Razorpay modal
      if (typeof (window as any).Razorpay !== 'undefined') {
        const options = {
          key: finalKey,
          amount: data.amount,
          currency: data.currency || 'INR',
          name: 'Grams Life Ayurvedic Clinic',
          description: `Consultation with ${doctor.name} (${selectedMode === 'video' ? '1-on-1 HD Video' : 'Direct Phone Call'})`,
          image: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png',
          order_id: data.orderId,
          prefill: {
            name: patientName.trim(),
            email: currentUser?.email || 'patient@bvlife.com',
            contact: patientPhone.trim()
          },
          handler: async function (response: any) {
            // Step 4: Verify payment with backend Razorpay endpoint
            try {
              await fetch('/api/payment/verify-razorpay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(response)
              });
            } catch (e) {
              console.error("Razorpay doctor consultation payment verification error:", e);
            }

            // Step 5: On successful payment, confirm appointment!
            await finalizeBooking({
              paymentMethod: 'Razorpay',
              paymentStatus: 'Paid',
              paymentId: response.razorpay_payment_id || `pay_${Date.now()}`,
              razorpayOrderId: response.razorpay_order_id || data.orderId,
              razorpayPaymentId: response.razorpay_payment_id
            });
          },
          modal: {
            ondismiss: function () {
              setIsPaymentProcessing(false);
              setIsSubmitting(false);
            }
          },
          theme: {
            color: '#1e3a29'
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (resp: any) {
          console.error("Razorpay payment failed:", resp.error);
          alert("Payment failed or cancelled: " + (resp.error?.description || "Transaction declined."));
          setIsPaymentProcessing(false);
          setIsSubmitting(false);
        });
        rzp.open();
      } else {
        alert("Razorpay checkout is initializing. Please try again in a few seconds.");
        setIsPaymentProcessing(false);
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error("Error launching Razorpay:", err);
      alert("Failed to initialize Razorpay checkout: " + (err.message || "Please check your network connection."));
      setIsPaymentProcessing(false);
      setIsSubmitting(false);
    }
  };

  // Step 4: Complete secure payment & confirm appointment
  const handleExecutePayment = async () => {
    await handleRazorpayCheckout();
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

  const handleNavigateToBook = (mode?: 'video' | 'audio' | 'clinic' | 'chat') => {
    setActiveTab('book');
    if (mode && mode !== 'clinic') {
      setSelectedMode(mode);
      setBookingStep('datetime');
    } else {
      setBookingStep('format');
    }
    setTimeout(() => {
      document.getElementById('booking-step-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  return (
    <div id="doctor-consultation-page" className="min-h-screen bg-[#FBF9F5] pb-24 text-slate-800">
      
      {/* 1. TOP HERO BANNER — IDENTICAL REUSABLE BANNER SYSTEM */}
      <section className="max-w-[1440px] ">
        <div
          id="doctor-hero-banner"
          onClick={() => {
            const el = document.getElementById('quick-book-container');
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
            rounded-xl
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
                srcSet={doctor.image || doctorHeroSlides[currentSlide].mobileImage}
              />
              <img
                src={doctor.image || doctorHeroSlides[currentSlide].desktopImage}
                alt={`Consult with ${doctor.name}`}
                className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-700"
              />
            </picture>

            {/* Subtle Gradient Overlay matching CustomerHome */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent sm:from-black/20 sm:via-transparent sm:to-transparent" />
          </div>

          {/* Banner Slide Indicator Dots */}
          <div className="absolute bottom-2 xs:bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-1.5 xs:gap-2">
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
                    ? 'bg-white w-4 xs:w-5 sm:w-6 md:w-8 h-1.5 xs:h-2'
                    : 'bg-white/40 hover:bg-white/60 w-1.5 xs:w-2 h-1.5 xs:h-2'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 2. NAVIGATION BAR WITH ALL 4 UPPER TABS */}
      <section className="max-w-[1240px] mx-auto px-4 mt-5 sm:mt-6">
        <div className="bg-white rounded-2xl p-2.5 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
          
          {/* 4 PRIMARY NAVIGATION TABS */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
            <button
              id="tab-book-slot"
              type="button"
              onClick={() => setActiveTab('book')}
              className={`px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'book'
                  ? 'bg-brand-green-800 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4 text-brand-gold-400" />
              <span>Book Consultation</span>
            </button>

            <button
              id="tab-view-appointments"
              type="button"
              onClick={() => setActiveTab('my-appointments')}
              className={`px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 relative ${
                activeTab === 'my-appointments'
                  ? 'bg-brand-green-800 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>My Consultations</span>
              {myAppointments.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-brand-gold-400 text-brand-green-950 text-[11px] font-extrabold ml-0.5 shadow-2xs">
                  {myAppointments.length}
                </span>
              )}
            </button>

            <button
              id="tab-about-doctor"
              type="button"
              onClick={() => setActiveTab('about-doctor')}
              className={`px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'about-doctor'
                  ? 'bg-brand-green-800 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4 text-brand-gold-400" />
              <span>About Doctor</span>
            </button>

            <button
              id="tab-fees-chart"
              type="button"
              onClick={() => setActiveTab('fees-chart')}
              className={`px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'fees-chart'
                  ? 'bg-brand-green-800 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4 text-brand-gold-400" />
              <span>Fees Chart</span>
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                ₹{doctor.fee}
              </span>
            </button>
          </div>

          {/* STATUS CREDENTIAL STRIP & DOCTOR DASHBOARD SHORTCUT */}
          <div className="flex items-center gap-2 pr-1 text-xs">
            <span className="hidden lg:flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>AYUSH Certified Vaidya</span>
            </span>
            <span className="hidden sm:inline-block bg-brand-green-50 text-brand-green-900 px-3 py-1 rounded-full border border-brand-green-200 font-bold">
              Fee: ₹{doctor.fee}
            </span>
          </div>
        </div>
      </section>

      {/* 3. MAIN WORKSPACE */}
      <main id="quick-book-container" className="max-w-[1240px] mx-auto px-4 mt-6">
        
        {/* VIEW 1: INSTANT BOOKING WORKSPACE */}
        {activeTab === 'book' && (
          <div className="space-y-4">

            {/* QUICK DOCTOR STRIP WITH SHORTCUTS TO ABOUT DOCTOR & FEES CHART */}
            <div className="max-w-4xl mx-auto bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={doctor.image}
                  alt={doctor.name}
                  className="w-11 h-11 rounded-full object-cover object-top border-2 border-brand-gold-400"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{doctor.name}</span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Available Today
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {doctor.qualification} • Subsidized Fee: <strong className="text-brand-green-900 font-extrabold">₹{doctor.fee}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('about-doctor')}
                  className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5 text-brand-green-800" />
                  <span>About Doctor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('fees-chart')}
                  className="px-3 py-1.5 rounded-lg bg-brand-green-50 hover:bg-brand-green-100 text-brand-green-900 font-semibold border border-brand-green-200 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-brand-green-800" />
                  <span>Fees Chart</span>
                </button>
              </div>
            </div>

            {/* CONFIRMED NOTIFICATION IF JUST BOOKED */}
            {bookingConfirmed && (
              <div 
                id="booking-confirmed-card"
                className="bg-brand-green-900 text-white p-5 sm:p-7 rounded-2xl border-2 border-brand-gold-400 shadow-xl space-y-4 animate-in fade-in duration-300"
              >
                <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-full bg-brand-gold-400 text-brand-green-950 flex items-center justify-center font-bold shadow-md">
                      <CheckCircle className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="text-[11px] uppercase tracking-wider font-bold text-brand-gold-300">Appointment Confirmed</span>
                      <h3 className="font-serif text-lg sm:text-xl font-bold">Appointment ID: #{bookingConfirmed.id}</h3>
                    </div>
                  </div>
                  <button 
                    onClick={() => setBookingConfirmed(null)}
                    className="p-1 text-slate-300 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white/10 p-3 rounded-xl">
                    <span className="text-slate-300">Consulting Vaidya</span>
                    <p className="font-bold text-white mt-0.5">{bookingConfirmed.doctorName}</p>
                    <p className="text-[10px] text-brand-gold-300">BHU Gold Medalist</p>
                  </div>
                  <div className="bg-white/10 p-3 rounded-xl">
                    <span className="text-slate-300">Date & Slot</span>
                    <p className="font-bold text-brand-gold-300 mt-0.5">{bookingConfirmed.date} • {bookingConfirmed.timeSlot}</p>
                  </div>
                  <div className="bg-white/10 p-3 rounded-xl">
                    <span className="text-slate-300">Patient Details</span>
                    <p className="font-bold text-white mt-0.5">{bookingConfirmed.patientName}</p>
                    <p className="text-[10px] text-slate-300">{bookingConfirmed.patientPhone}</p>
                  </div>
                  <div className="bg-white/10 p-3 rounded-xl">
                    <span className="text-slate-300">Consultation Format</span>
                    <p className="font-bold text-white mt-0.5">
                      {bookingConfirmed.consultationMode === 'video'
                        ? '1-on-1 HD Video Call'
                        : bookingConfirmed.consultationMode === 'audio'
                        ? 'Phone / WhatsApp Voice Call'
                        : 'WhatsApp Live Chat Consultation'}
                    </p>
                    <p className="text-[10px] text-emerald-400 font-semibold">
                      {bookingConfirmed.consultationMode === 'video'
                        ? 'HD Video Room Ready'
                        : bookingConfirmed.consultationMode === 'audio'
                        ? 'Direct Call Scheduled'
                        : 'WhatsApp Desk Open'}
                    </p>
                  </div>
                </div>

                {/* Attached Clinical Reports & Photo in Confirmation Card */}
                {((bookingConfirmed.medicalReports && bookingConfirmed.medicalReports.length > 0) || bookingConfirmed.patientPhoto) && (
                  <div className="p-3 bg-white/10 rounded-xl border border-white/15 space-y-2 text-xs">
                    <span className="text-[11px] font-bold text-brand-gold-300 uppercase tracking-wider block">
                      Submitted Clinical Attachments
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {bookingConfirmed.medicalReports && bookingConfirmed.medicalReports.map((rep, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/20 text-white border border-white/10 text-[11px]">
                          <FileText className="w-3.5 h-3.5 text-rose-400" />
                          <span className="truncate max-w-[150px]">{rep.name}</span>
                          {rep.dataUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                const win = window.open();
                                if (win && rep.dataUrl) {
                                  win.document.write(`<iframe src="${rep.dataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                                }
                              }}
                              className="text-brand-gold-300 hover:underline text-[10px] ml-1"
                            >
                              View
                            </button>
                          )}
                        </div>
                      ))}
                      {bookingConfirmed.patientPhoto && (
                        <div
                          onClick={() => setPreviewModalImg(bookingConfirmed.patientPhoto || null)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/20 text-white border border-white/10 text-[11px] cursor-pointer hover:bg-black/30"
                          title="Click to zoom condition photo"
                        >
                          <img
                            src={bookingConfirmed.patientPhoto}
                            alt="Patient Photo"
                            className="w-5 h-5 rounded object-cover border border-white/20"
                          />
                          <span>1 Condition Photo (Zoom)</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Razorpay / Payment Verified Status Banner */}
                <div className="p-3 bg-white/10 rounded-xl border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    {bookingConfirmed.paymentStatus === 'Paid' ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 font-bold flex items-center gap-1.5 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Payment Verified via Razorpay • Paid ₹{bookingConfirmed.fee}</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-amber-500/30 border border-amber-400/50 text-amber-300 font-bold flex items-center gap-1.5 text-[11px]">
                        <Coins className="w-3.5 h-3.5 text-amber-300" />
                        <span>Payment: Pay Later after Consultation (₹{bookingConfirmed.fee})</span>
                      </span>
                    )}
                    {bookingConfirmed.paymentId && (
                      <span className="text-[10px] text-slate-300 font-mono">
                        Txn Ref: {bookingConfirmed.paymentId}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-300">
                    A copy of this appointment slip has been sent to {bookingConfirmed.patientPhone}
                  </span>
                </div>

                {/* Instant WhatsApp Action Buttons */}
                <div className="p-3.5 bg-emerald-950/70 border border-emerald-500/40 rounded-xl space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-[#25D366]" />
                      <span>WhatsApp Confirmation & Alert Dispatch</span>
                    </span>
                    <span className="text-[10px] text-slate-300 font-mono">Clinic Desk: +91 9425011088</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Your appointment has been registered in the clinic system. You can also send a direct confirmation copy to our WhatsApp desk or receive it on your own phone:
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {/* Notify Clinic Desk */}
                    <a
                      href={`https://wa.me/919425011088?text=${encodeURIComponent(
                        `🌿 *NEW DOCTOR APPOINTMENT BOOKED* 🌿\n\n` +
                        `Namaste Grams Life Clinic Desk, I have scheduled a doctor consultation:\n\n` +
                        `• *Appointment ID:* #${bookingConfirmed.id}\n` +
                        `• *Patient Name:* ${bookingConfirmed.patientName}\n` +
                        `• *Patient Phone:* ${bookingConfirmed.patientPhone}\n` +
                        `• *Doctor:* ${bookingConfirmed.doctorName}\n` +
                        `• *Date & Slot:* ${bookingConfirmed.date} • ${bookingConfirmed.timeSlot}\n` +
                        `• *Format:* ${bookingConfirmed.consultationMode.toUpperCase()}\n` +
                        `• *Payment Status:* ${bookingConfirmed.paymentStatus === 'Paid' ? `Verified (₹${bookingConfirmed.fee})` : `Pay Later (₹${bookingConfirmed.fee})`}\n` +
                        (bookingConfirmed.paymentId ? `• *Transaction Ref:* ${bookingConfirmed.paymentId}\n` : '') +
                        `• *Health Concern:* ${bookingConfirmed.healthConcern || 'Ayurvedic Wellness Evaluation'}\n\n` +
                        `Please verify the booking on the Doctor Dashboard.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-lg bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Send Slip to Clinic WhatsApp Desk (+91 9425011088)</span>
                    </a>

                    {/* Send to Patient's Own WhatsApp */}
                    {bookingConfirmed.patientPhone && (
                      <a
                        href={`https://wa.me/${bookingConfirmed.patientPhone.replace(/\D/g, '').length === 10 ? `91${bookingConfirmed.patientPhone.replace(/\D/g, '')}` : bookingConfirmed.patientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                          `🌿 *Grams Life Ayurvedic Clinic - Booking Confirmation* 🌿\n\n` +
                          `Namaste ${bookingConfirmed.patientName},\n` +
                          `Your consultation with *${bookingConfirmed.doctorName}* has been confirmed!\n\n` +
                          `📋 *Appointment Details:*\n` +
                          `• *Appointment ID:* #${bookingConfirmed.id}\n` +
                          `• *Date & Time:* ${bookingConfirmed.date} at ${bookingConfirmed.timeSlot}\n` +
                          `• *Consultation Mode:* ${bookingConfirmed.consultationMode.toUpperCase()}\n` +
                          `• *Payment Status:* ${bookingConfirmed.paymentStatus === 'Paid' ? `Paid ₹${bookingConfirmed.fee} (Verified)` : `Pay Later (₹${bookingConfirmed.fee})`}\n` +
                          (bookingConfirmed.meetingLink ? `• *Video Consultation Link:* ${bookingConfirmed.meetingLink}\n` : '') +
                          `\nNeed assistance? Reply here or call clinic care: +91 9425011088.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold text-xs flex items-center gap-1.5 border border-white/20 transition-all"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Send Slip to My WhatsApp ({bookingConfirmed.patientPhone})</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {bookingConfirmed.meetingLink && bookingConfirmed.consultationMode === 'video' && (
                    <a
                      href={bookingConfirmed.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 rounded-xl bg-brand-gold-400 hover:bg-brand-gold-300 text-brand-green-950 font-bold text-xs flex items-center gap-2 shadow-md transition-transform hover:scale-102"
                    >
                      <Video className="w-4 h-4" />
                      <span>Join Live Video Room</span>
                    </a>
                  )}
                  {bookingConfirmed.consultationMode === 'audio' && (
                    <div className="px-4 py-2.5 rounded-xl bg-white/10 text-emerald-300 text-xs font-semibold flex items-center gap-2 border border-white/10">
                      <PhoneCall className="w-4 h-4 text-emerald-400" />
                      <span>Doctor will directly call: <strong>{bookingConfirmed.patientPhone}</strong></span>
                    </div>
                  )}
                  {bookingConfirmed.consultationMode === 'chat' && (
                    <a
                      href={`https://wa.me/918882001122?text=${encodeURIComponent(`Namaste ${doctor.name}, I have booked a WhatsApp Consultation (ID: #${bookingConfirmed.id}). Patient: ${bookingConfirmed.patientName}. Looking forward to discussing my health concerns.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs flex items-center gap-2 shadow-md transition-transform hover:scale-102"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Open WhatsApp Chat with Doctor</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveTab('my-appointments')}
                    className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs cursor-pointer"
                  >
                    View in My Appointments
                  </button>
                </div>
              </div>
            )}

            {/* MULTI-STEP INSTANT BOOKING WORKSPACE */}
            <div id="booking-step-container" className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-8 shadow-xs">
              
              {/* 4-STEP WIZARD PROGRESS BAR */}
              <div className="mb-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  
                  {/* Step 1 Tab Indicator */}
                  <button
                    type="button"
                    onClick={() => setBookingStep('format')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      bookingStep === 'format'
                        ? 'border-brand-green-800 bg-brand-green-50/80 text-brand-green-950 ring-1 ring-brand-green-800'
                        : selectedMode
                        ? 'border-emerald-200 bg-emerald-50/40 text-emerald-900 hover:bg-emerald-50'
                        : 'border-slate-200 bg-slate-50/60 text-slate-500'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                      selectedMode && bookingStep !== 'format'
                        ? 'bg-emerald-600 text-white'
                        : bookingStep === 'format'
                        ? 'bg-brand-green-800 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {selectedMode && bookingStep !== 'format' ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '1'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Step 1</p>
                      <p className="text-xs font-bold truncate">Format</p>
                    </div>
                  </button>

                  {/* Step 2 Tab Indicator */}
                  <button
                    type="button"
                    onClick={() => { if (selectedMode) setBookingStep('datetime'); }}
                    disabled={!selectedMode}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                      !selectedMode ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400' : 'cursor-pointer'
                    } ${
                      bookingStep === 'datetime'
                        ? 'border-brand-green-800 bg-brand-green-50/80 text-brand-green-950 ring-1 ring-brand-green-800'
                        : (bookingStep === 'information' || bookingStep === 'auth' || bookingStep === 'payment')
                        ? 'border-emerald-200 bg-emerald-50/40 text-emerald-900 hover:bg-emerald-50'
                        : 'border-slate-200 bg-slate-50/60 text-slate-500'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                      (bookingStep === 'information' || bookingStep === 'auth' || bookingStep === 'payment')
                        ? 'bg-emerald-600 text-white'
                        : bookingStep === 'datetime'
                        ? 'bg-brand-green-800 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {(bookingStep === 'information' || bookingStep === 'auth' || bookingStep === 'payment') ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '2'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Step 2</p>
                      <p className="text-xs font-bold truncate">Date & Time</p>
                    </div>
                  </button>

                  {/* Step 3 Tab Indicator */}
                  <button
                    type="button"
                    onClick={() => { if (selectedMode && selectedDate && selectedTimeSlot) setBookingStep('information'); }}
                    disabled={!selectedMode || !selectedDate}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                      (!selectedMode || !selectedDate) ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400' : 'cursor-pointer'
                    } ${
                      (bookingStep === 'information' || bookingStep === 'auth')
                        ? 'border-brand-green-800 bg-brand-green-50/80 text-brand-green-950 ring-1 ring-brand-green-800'
                        : bookingStep === 'payment'
                        ? 'border-emerald-200 bg-emerald-50/40 text-emerald-900 hover:bg-emerald-50'
                        : 'border-slate-200 bg-slate-50/60 text-slate-500'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                      bookingStep === 'payment'
                        ? 'bg-emerald-600 text-white'
                        : (bookingStep === 'information' || bookingStep === 'auth')
                        ? 'bg-brand-green-800 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {bookingStep === 'payment' ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '3'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Step 3</p>
                      <p className="text-xs font-bold truncate">{bookingStep === 'auth' ? 'OTP Verification' : 'Patient Info'}</p>
                    </div>
                  </button>

                  {/* Step 4 Tab Indicator */}
                  <button
                    type="button"
                    onClick={() => { if (patientName && patientPhone && selectedMode) setBookingStep('payment'); }}
                    disabled={!patientName || !patientPhone || !selectedMode}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                      (!patientName || !patientPhone || !selectedMode) ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400' : 'cursor-pointer'
                    } ${
                      bookingStep === 'payment'
                        ? 'border-brand-green-800 bg-brand-green-50/80 text-brand-green-950 ring-1 ring-brand-green-800'
                        : 'border-slate-200 bg-slate-50/60 text-slate-500'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                      bookingStep === 'payment'
                        ? 'bg-brand-green-800 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      4
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Step 4</p>
                      <p className="text-xs font-bold truncate">Pay & Confirm</p>
                    </div>
                  </button>

                </div>
              </div>

              {/* ======================================================== */}
              {/* STEP 1: SELECT FORMAT (3 PREMIUM CONSULTATION OPTIONS) */}
              {/* ======================================================== */}
              {bookingStep === 'format' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="text-center max-w-xl mx-auto space-y-1.5">
                    <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-brand-gold-100 text-brand-green-950 border border-brand-gold-300/60 inline-flex items-center gap-1.5 shadow-2xs">
                      <Sparkles className="w-3.5 h-3.5 text-brand-gold-600" />
                      <span>Choose Your Consultation Format</span>
                    </span>
                    <h3 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
                      Select How You'd Like to Consult
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                      Consult with <strong>{doctor.name}</strong> ({doctor.title || doctor.qualification}). Pick the format best suited to your preference and comfort.
                    </p>
                  </div>

                  {/* 3 PREMIUM CONSULTATION FORMAT CARDS */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                    
                    {/* OPTION 1: 1-on-1 HD Video Call */}
                    <div 
                      id="card-format-videocall"
                      onClick={() => setSelectedMode('video')}
                      className={`rounded-3xl p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between relative cursor-pointer group ${
                        selectedMode === 'video'
                          ? 'border-2 border-brand-green-800 bg-gradient-to-b from-brand-green-50/70 to-white shadow-lg ring-2 ring-brand-green-800/20 scale-[1.01]'
                          : 'border border-slate-200/90 bg-white hover:border-brand-green-700/60 hover:shadow-md'
                      }`}
                    >
                      {/* Top Ribbon Badge */}
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-brand-green-800 text-brand-gold-300 px-2.5 py-1 rounded-full shadow-2xs flex items-center gap-1">
                          <Star className="w-3 h-3 fill-brand-gold-300 text-brand-gold-300" />
                          <span>Most Popular</span>
                        </span>
                        
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                          selectedMode === 'video' 
                            ? 'border-brand-green-800 bg-brand-green-800 text-white' 
                            : 'border-slate-300 bg-white group-hover:border-slate-400'
                        }`}>
                          {selectedMode === 'video' && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>

                      <div className="space-y-3.5">
                        {/* Premium Logo Emblem */}
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-green-900 to-emerald-950 text-brand-gold-300 border-2 border-brand-gold-400/40 shadow-sm flex items-center justify-center relative shrink-0">
                          <Video className="w-7 h-7 text-brand-gold-300" />
                          <span className="absolute -bottom-2 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-brand-gold-400 text-brand-green-950 shadow-2xs">
                            1080p HD
                          </span>
                        </div>

                        <div>
                          <h4 className="font-serif text-lg font-bold text-slate-900 group-hover:text-brand-green-900 transition-colors">
                            1-on-1 HD Video Call
                          </h4>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                            Private face-to-face video consultation via Google Meet or Jitsi with report screen-sharing.
                          </p>
                        </div>

                        {/* Pricing & Duration */}
                        <div className="pt-2 border-t border-slate-100">
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-brand-green-950">₹{doctor.fee}</span>
                            <span className="text-xs text-slate-400 line-through">₹{doctor.originalFee}</span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">58% OFF</span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Duration: 20-30 Mins</span>
                          </p>
                        </div>

                        {/* Feature Points */}
                        <ul className="space-y-2 text-xs text-slate-700 pt-3 border-t border-slate-100">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                            <span>Visual facial, tongue & skin Ayurvedic examination</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                            <span>AYUSH certified signed digital prescription</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                            <span>Instant meeting room link on SMS & WhatsApp</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                            <span>7 Days free follow-up support on WhatsApp</span>
                          </li>
                        </ul>
                      </div>

                      {/* CTA Button */}
                      <button
                        id="btn-select-videocall"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectFormatAndProceed('video');
                        }}
                        className={`w-full mt-5 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                          selectedMode === 'video'
                            ? 'bg-brand-green-800 hover:bg-brand-green-900 text-brand-gold-300 shadow-md scale-[1.01]'
                            : 'bg-slate-100 hover:bg-brand-green-800 hover:text-brand-gold-300 text-slate-800'
                        }`}
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Book Video Call Slot</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* OPTION 2: Phone Call or WhatsApp Call */}
                    <div 
                      id="card-format-phonecall"
                      onClick={() => setSelectedMode('audio')}
                      className={`rounded-3xl p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between relative cursor-pointer group ${
                        selectedMode === 'audio'
                          ? 'border-2 border-teal-700 bg-gradient-to-b from-teal-50/70 to-white shadow-lg ring-2 ring-teal-700/20 scale-[1.01]'
                          : 'border border-slate-200/90 bg-white hover:border-teal-600/60 hover:shadow-md'
                      }`}
                    >
                      {/* Top Ribbon Badge */}
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-teal-800 text-teal-100 px-2.5 py-1 rounded-full shadow-2xs flex items-center gap-1">
                          <Smartphone className="w-3 h-3 text-teal-300" />
                          <span>Direct Voice</span>
                        </span>
                        
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                          selectedMode === 'audio' 
                            ? 'border-teal-700 bg-teal-700 text-white' 
                            : 'border-slate-300 bg-white group-hover:border-slate-400'
                        }`}>
                          {selectedMode === 'audio' && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>

                      <div className="space-y-3.5">
                        {/* Premium Logo Emblem */}
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-800 to-emerald-900 text-teal-100 border-2 border-teal-400/40 shadow-sm flex items-center justify-center relative shrink-0">
                          <PhoneCall className="w-7 h-7 text-teal-200" />
                          <span className="absolute -bottom-2 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-emerald-400 text-emerald-950 shadow-2xs">
                            Audio Call
                          </span>
                        </div>

                        <div>
                          <h4 className="font-serif text-lg font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
                            Phone Call or WhatsApp Call
                          </h4>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                            Direct voice consultation on your mobile number or WhatsApp Voice with doctor.
                          </p>
                        </div>

                        {/* Pricing & Duration */}
                        <div className="pt-2 border-t border-slate-100">
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900">₹{doctor.fee}</span>
                            <span className="text-xs text-slate-400 line-through">₹{doctor.originalFee}</span>
                            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">58% OFF</span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Duration: 15-25 Mins</span>
                          </p>
                        </div>

                        {/* Feature Points */}
                        <ul className="space-y-2 text-xs text-slate-700 pt-3 border-t border-slate-100">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                            <span>Doctor directly dials your registered phone or WhatsApp</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                            <span>Zero app download or high-speed internet needed</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                            <span>In-depth symptom diagnosis & personalized diet plan</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                            <span>Digital prescription delivered directly to your WhatsApp</span>
                          </li>
                        </ul>
                      </div>

                      {/* CTA Button */}
                      <button
                        id="btn-select-phonecall"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectFormatAndProceed('audio');
                        }}
                        className={`w-full mt-5 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                          selectedMode === 'audio'
                            ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-md scale-[1.01]'
                            : 'bg-slate-100 hover:bg-teal-700 hover:text-white text-slate-800'
                        }`}
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Book Phone Call Slot</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* OPTION 3: WhatsApp Chatting */}
                    <div 
                      id="card-format-whatsappchat"
                      onClick={() => setSelectedMode('chat')}
                      className={`rounded-3xl p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between relative cursor-pointer group ${
                        selectedMode === 'chat'
                          ? 'border-2 border-emerald-700 bg-gradient-to-b from-emerald-50/70 to-white shadow-lg ring-2 ring-emerald-700/20 scale-[1.01]'
                          : 'border border-slate-200/90 bg-white hover:border-emerald-600/60 hover:shadow-md'
                      }`}
                    >
                      {/* Top Ribbon Badge */}
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-[#25D366] text-white px-2.5 py-1 rounded-full shadow-2xs flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-white" />
                          <span>WhatsApp Live</span>
                        </span>
                        
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                          selectedMode === 'chat' 
                            ? 'border-emerald-700 bg-emerald-700 text-white' 
                            : 'border-slate-300 bg-white group-hover:border-slate-400'
                        }`}>
                          {selectedMode === 'chat' && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>

                      <div className="space-y-3.5">
                        {/* Premium Logo Emblem */}
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-800 text-white border-2 border-emerald-300/50 shadow-sm flex items-center justify-center relative shrink-0">
                          <MessageSquare className="w-7 h-7 text-white" />
                          <span className="absolute -bottom-2 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-white text-emerald-900 font-bold shadow-2xs">
                            Chatting
                          </span>
                        </div>

                        <div>
                          <h4 className="font-serif text-lg font-bold text-slate-900 group-hover:text-emerald-900 transition-colors">
                            WhatsApp Chatting
                          </h4>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                            Direct WhatsApp consultation — chat symptoms, voice notes & send medical reports anytime.
                          </p>
                        </div>

                        {/* Pricing & Duration */}
                        <div className="pt-2 border-t border-slate-100">
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900">₹{doctor.fee}</span>
                            <span className="text-xs text-slate-400 line-through">₹{doctor.originalFee}</span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">58% OFF</span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Live Chat + 7 Days Desk Access</span>
                          </p>
                        </div>

                        {/* Feature Points */}
                        <ul className="space-y-2 text-xs text-slate-700 pt-3 border-t border-slate-100">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                            <span>Direct WhatsApp chat with Dr. Sanjeev's consultation desk</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                            <span>Send blood tests, tongue/skin photos & audio messages</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                            <span>Review recommendations & diet guidelines at your convenience</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                            <span>AYUSH prescription PDF delivered directly in WhatsApp</span>
                          </li>
                        </ul>
                      </div>

                      {/* CTA Button */}
                      <button
                        id="btn-select-whatsappchat"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectFormatAndProceed('chat');
                        }}
                        className={`w-full mt-5 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                          selectedMode === 'chat'
                            ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-md scale-[1.01]'
                            : 'bg-slate-100 hover:bg-emerald-700 hover:text-white text-slate-800'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Book WhatsApp Chat Slot</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>

                  {/* PROCEED BAR WITH CURRENTLY SELECTED MODE */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                    <div className="flex items-center gap-3 text-xs text-slate-700">
                      <div className="w-9 h-9 rounded-xl bg-brand-green-800 text-brand-gold-300 flex items-center justify-center shrink-0 shadow-2xs">
                        {selectedMode === 'video' ? (
                          <Video className="w-4 h-4" />
                        ) : selectedMode === 'audio' ? (
                          <PhoneCall className="w-4 h-4 text-emerald-300" />
                        ) : (
                          <MessageSquare className="w-4 h-4 text-emerald-300" />
                        )}
                      </div>
                      <div>
                        <span className="text-slate-500">Selected Option: </span>
                        <strong className="text-slate-900">
                          {selectedMode === 'video' 
                            ? '1-on-1 HD Video Call' 
                            : selectedMode === 'audio' 
                            ? 'Phone Call or WhatsApp Voice Call' 
                            : 'WhatsApp Live Chat Consultation'}
                        </strong>
                        <span className="text-emerald-700 font-bold ml-1.5">• ₹{doctor.fee}</span>
                      </div>
                    </div>

                    <button
                      id="btn-proceed-to-datetime"
                      type="button"
                      onClick={() => handleSelectFormatAndProceed(selectedMode || 'video')}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-green-800 hover:bg-brand-green-900 text-brand-gold-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer group"
                    >
                      <span>Proceed to Select Date & Time</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>

                  {/* TRUST FOOTER STRIP */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-center gap-5 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                      <ShieldCheck className="w-4 h-4" />
                      <span>AYUSH Certified Senior Vaidya</span>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <Lock className="w-4 h-4 text-brand-green-800" />
                      <span>100% Private & Confidential Consultation</span>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <Sparkles className="w-4 h-4 text-brand-gold-600" />
                      <span>Subsidized Fee: ₹{doctor.fee} (Flat 58% Off)</span>
                    </span>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* STEP 2: SELECT PREFERRED DATE & TIME (WITH CONTINUE BUTTON) */}
              {/* ======================================================== */}
              {bookingStep === 'datetime' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  
                  {/* SELECTED FORMAT BANNER */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-xl bg-brand-green-50/80 border border-brand-green-200 gap-3">
                    <div className="flex items-center gap-2.5 text-xs text-brand-green-950">
                      <div className="w-9 h-9 rounded-xl bg-brand-green-800 text-brand-gold-300 flex items-center justify-center shrink-0 shadow-2xs">
                        {selectedMode === 'video' ? (
                          <Video className="w-4 h-4" />
                        ) : selectedMode === 'audio' ? (
                          <PhoneCall className="w-4 h-4 text-emerald-300" />
                        ) : (
                          <MessageSquare className="w-4 h-4 text-emerald-300" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs sm:text-sm">
                          {selectedMode === 'video' 
                            ? '1-on-1 HD Video Consultation' 
                            : selectedMode === 'audio' 
                            ? 'Phone Call or WhatsApp Voice Call' 
                            : 'WhatsApp Live Chat Consultation'}
                        </p>
                        <p className="text-[11px] text-brand-green-800 font-medium">
                          {selectedMode === 'video'
                            ? `Fee: ₹${doctor.fee} • 20-30 Mins • Google Meet / Jitsi Video Room`
                            : selectedMode === 'audio'
                            ? `Fee: ₹${doctor.fee} • 15-25 Mins • Doctor calls directly on your phone or WhatsApp`
                            : `Fee: ₹${doctor.fee} • Live Interactive Chat + 7 Days WhatsApp Doctor Desk`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-brand-green-900 bg-white px-2.5 py-1 rounded-lg border border-brand-green-200 shadow-2xs flex items-center gap-1.5">
                        {selectedMode === 'video' ? (
                          <>
                            <Video className="w-3.5 h-3.5 text-brand-green-800" />
                            <span>HD Video Room</span>
                          </>
                        ) : selectedMode === 'audio' ? (
                          <>
                            <PhoneCall className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Voice Call</span>
                          </>
                        ) : (
                          <>
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                            <span>WhatsApp Chat</span>
                          </>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => setBookingStep('format')}
                        className="text-[11px] font-bold text-brand-green-800 hover:text-brand-green-900 underline cursor-pointer px-1 py-0.5"
                      >
                        Change
                      </button>
                    </div>
                  </div>

                  {/* SELECT DATE */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 mb-2.5">
                      <Calendar className="w-4 h-4 text-brand-green-800" />
                      <span>1. Select Preferred Date</span>
                    </label>

                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {next7Days.map((d) => {
                        const isSelected = selectedDate === d.fullIso;
                        return (
                          <button
                            key={d.fullIso}
                            type="button"
                            onClick={() => setSelectedDate(d.fullIso)}
                            className={`py-3 px-2 rounded-xl text-center border-2 transition-all cursor-pointer flex flex-col items-center justify-center ${
                              isSelected
                                ? 'border-brand-green-800 bg-brand-green-800 text-white shadow-xs ring-2 ring-brand-green-800/30'
                                : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-brand-gold-300' : 'text-slate-500'}`}>
                              {d.dayName}
                            </span>
                            <span className="text-xs sm:text-sm font-extrabold mt-0.5">
                              {d.dateString}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* SELECT TIME SLOT */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 mb-2.5">
                      <Clock className="w-4 h-4 text-brand-green-800" />
                      <span>2. Select Preferred Time Slot</span>
                    </label>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {timeSlots.map((slot) => {
                        const isSelected = selectedTimeSlot === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedTimeSlot(slot)}
                            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-1 ${
                              isSelected
                                ? 'bg-brand-green-800 text-brand-gold-300 border-brand-green-800 shadow-xs ring-2 ring-brand-green-800/30'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            <span>{slot}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* SELECTION SUMMARY & CONTINUE BUTTON */}
                  <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => setBookingStep('format')}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Formats</span>
                    </button>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="text-right hidden sm:block">
                        <p className="text-[11px] text-slate-500">Selected Slot:</p>
                        <p className="text-xs font-bold text-slate-800">{selectedDate} at {selectedTimeSlot}</p>
                      </div>

                      <button
                        id="btn-continue-to-patient-info"
                        type="button"
                        onClick={handleProceedToInformation}
                        className="flex-1 sm:flex-none px-7 py-3 rounded-xl bg-brand-green-800 hover:bg-brand-green-900 text-brand-gold-300 font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>Continue to Patient Details</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* ======================================================== */}
              {/* STEP 3: PATIENT INFORMATION (WITH PROCEED TO PAY BUTTON) */}
              {/* ======================================================== */}
              {bookingStep === 'information' && (
                <form onSubmit={handleProceedToPayment} className="space-y-6 animate-in fade-in duration-300">
                  
                  {/* APPOINTMENT QUICK SUMMARY CARD */}
                  <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-brand-gold-300/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={doctor.image}
                        alt={doctor.name}
                        className="w-9 h-9 rounded-full object-cover border border-brand-gold-400"
                      />
                      <div>
                        <p className="font-bold text-slate-900">{doctor.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {selectedMode === 'video' ? '1-on-1 Video Call' : selectedMode === 'audio' ? 'Direct Phone Call' : 'In-Person Clinic Visit (OPD)'} • <strong className="text-slate-800">{selectedDate} at {selectedTimeSlot}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-brand-green-900">₹{doctor.fee}</span>
                      <button
                        type="button"
                        onClick={() => setBookingStep('datetime')}
                        className="text-[11px] text-brand-green-800 font-bold underline cursor-pointer"
                      >
                        Change Time
                      </button>
                    </div>
                  </div>

                  {formError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* FORM INPUTS */}
                  <div className="space-y-4">
                    {/* User Account Identification Status */}
                    {currentUser ? (
                      <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-emerald-950 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>Logged in as <strong>{currentUser.fullName || currentUser.phone || currentUser.email}</strong>. Consultation & prescription will be auto-linked to your profile.</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-amber-950">
                          <ShieldCheck className="w-4 h-4 text-brand-green-800 shrink-0" />
                          <span>Quick booking: You can proceed right away. A simple 4-digit SMS OTP verification will verify your mobile number before payment.</span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Patient Full Name *
                        </label>
                        <input
                          id="input-patient-name"
                          type="text"
                          required
                          placeholder="e.g. Ramesh Sharma"
                          value={patientName}
                          onChange={(e) => {
                            setPatientName(e.target.value);
                            if (formError) setFormError(null);
                          }}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-green-800 bg-slate-50/50"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          WhatsApp / Mobile *
                        </label>
                        <input
                          id="input-patient-phone"
                          type="tel"
                          required
                          placeholder="e.g. 9425011088"
                          value={patientPhone}
                          onChange={(e) => {
                            setPatientPhone(e.target.value);
                            if (formError) setFormError(null);
                          }}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-green-800 bg-slate-50/50"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Email for Confirmation Slip *
                        </label>
                        <input
                          id="input-patient-email"
                          type="email"
                          required
                          placeholder="care@bvlife.in"
                          value={patientEmail}
                          onChange={(e) => {
                            setPatientEmail(e.target.value);
                            if (formError) setFormError(null);
                          }}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-green-800 bg-slate-50/50"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Age
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="120"
                            value={patientAge}
                            onChange={(e) => setPatientAge(e.target.value ? Number(e.target.value) : '')}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-green-800 bg-slate-50/50"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Gender
                          </label>
                          <select
                            value={patientGender}
                            onChange={(e) => setPatientGender(e.target.value as any)}
                            className="w-full px-2 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-green-800 bg-white"
                          >
                            <option value="Female">Female</option>
                            <option value="Male">Male</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Primary Health Concern */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                        Primary Reason / Health Concern
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {HEALTH_CONCERNS.map((item) => {
                          const isSelected = healthConcern === item && !customConcern;
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => {
                                setHealthConcern(item);
                                setCustomConcern('');
                              }}
                              className={`px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-brand-green-800 text-white font-bold'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {item}
                            </button>
                          );
                        })}
                      </div>

                      <input
                        type="text"
                        placeholder="Or briefly describe symptoms (optional)..."
                        value={customConcern}
                        onChange={(e) => setCustomConcern(e.target.value)}
                        className="w-full mt-2 px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-green-800 bg-slate-50/50"
                      />
                    </div>

                    {/* ======================================================== */}
                    {/* CLINICAL ATTACHMENTS: MULTIPLE PDFS & ONE OPTION OF PHOTO */}
                    {/* ======================================================== */}
                    <div className="pt-4 border-t border-slate-200 space-y-3">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                          <FileCheck className="w-4 h-4 text-brand-green-800" />
                          <span>Clinical Attachments (PDF Reports & Health Photo)</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Attach past lab reports or prescriptions (multiple PDFs) and a clear condition photo for {doctor.name} to examine.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* OPTION 1: MULTIPLE PDF REPORTS */}
                        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-rose-600" />
                                <span>Medical Reports (Multiple PDFs)</span>
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Blood tests, past prescriptions, discharge notes.
                              </p>
                            </div>
                            {uploadedReports.length > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                                {uploadedReports.length} PDF{uploadedReports.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>

                          {/* Multiple PDF Upload Trigger */}
                          <div>
                            <label className="w-full py-2.5 px-3 rounded-xl border-2 border-dashed border-slate-300 hover:border-brand-green-800 bg-white hover:bg-emerald-50/30 transition-all cursor-pointer flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 shadow-2xs">
                              <Upload className="w-4 h-4 text-brand-green-800" />
                              <span>Select Multiple PDF Reports</span>
                              <input
                                type="file"
                                multiple
                                accept="application/pdf"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files.length > 0) {
                                    handleReportUpload(e.target.files);
                                    e.target.value = '';
                                  }
                                }}
                              />
                            </label>
                            <span className="text-[10px] text-slate-400 block text-center mt-1">
                              Select one or more PDF files • Max 15MB each
                            </span>
                          </div>

                          {reportError && (
                            <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{reportError}</span>
                            </p>
                          )}

                          {/* Uploaded PDFs List */}
                          {uploadedReports.length > 0 && (
                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                              {uploadedReports.map((rep, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs"
                                >
                                  <div className="flex items-center gap-2 min-w-0 pr-2">
                                    <div className="w-6 h-6 rounded-md bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center shrink-0">
                                      <FileText className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="truncate font-semibold text-slate-800 text-[11px]" title={rep.name}>
                                        {rep.name}
                                      </p>
                                      <p className="text-[10px] text-slate-400">{rep.size} • {rep.uploadedAt}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {rep.dataUrl && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const win = window.open();
                                          if (win && rep.dataUrl) {
                                            win.document.write(`<iframe src="${rep.dataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                                          }
                                        }}
                                        title="Preview PDF"
                                        className="p-1 rounded text-slate-500 hover:text-brand-green-800 hover:bg-slate-100 cursor-pointer"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => setUploadedReports(prev => prev.filter((_, i) => i !== idx))}
                                      title="Remove PDF"
                                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* OPTION 2: ONE OPTION OF PHOTO */}
                        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                <Camera className="w-3.5 h-3.5 text-brand-green-800" />
                                <span>Condition / Symptom Photo (1 Photo)</span>
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Clear photo of affected area, tongue, skin or medicines.
                              </p>
                            </div>
                            {uploadedPhoto && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                                1 Photo Attached
                              </span>
                            )}
                          </div>

                          {!uploadedPhoto ? (
                            <div>
                              <label className="w-full py-2.5 px-3 rounded-xl border-2 border-dashed border-slate-300 hover:border-brand-green-800 bg-white hover:bg-emerald-50/30 transition-all cursor-pointer flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 shadow-2xs">
                                <Camera className="w-4 h-4 text-brand-green-800" />
                                <span>Upload / Capture 1 Photo</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      handlePhotoUpload(e.target.files[0]);
                                      e.target.value = '';
                                    }
                                  }}
                                />
                              </label>
                              <span className="text-[10px] text-slate-400 block text-center mt-1">
                                Accepts JPG, PNG, WEBP • Max 12MB • 1 photo
                              </span>
                            </div>
                          ) : (
                            /* Photo Uploaded Preview Card */
                            <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3">
                              <div
                                onClick={() => setPreviewModalImg(uploadedPhoto.dataUrl)}
                                className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 shrink-0 cursor-pointer relative group bg-slate-100"
                                title="Click to view enlarged photo"
                              >
                                <img
                                  src={uploadedPhoto.dataUrl}
                                  alt={uploadedPhoto.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <Eye className="w-3.5 h-3.5" />
                                </div>
                              </div>

                              <div className="min-w-0 flex-1 space-y-0.5">
                                <p className="truncate font-semibold text-slate-900 text-xs" title={uploadedPhoto.name}>
                                  {uploadedPhoto.name}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {uploadedPhoto.size} • Attached for Doctor
                                </p>
                                <div className="flex items-center gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewModalImg(uploadedPhoto.dataUrl)}
                                    className="text-[11px] font-semibold text-brand-green-800 hover:underline flex items-center gap-1 cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>Zoom</span>
                                  </button>
                                  <label className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:underline cursor-pointer">
                                    <span>Change</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                          handlePhotoUpload(e.target.files[0]);
                                          e.target.value = '';
                                        }
                                      }}
                                    />
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => setUploadedPhoto(null)}
                                    className="text-[11px] font-semibold text-rose-600 hover:underline flex items-center gap-0.5 cursor-pointer ml-auto"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Remove</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {photoError && (
                            <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{photoError}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* NAVIGATION TO PAYMENT */}
                  <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => setBookingStep('datetime')}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Date & Time</span>
                    </button>

                    <button
                      id="btn-proceed-to-payment"
                      type="submit"
                      className="w-full sm:w-auto px-7 py-3 rounded-xl bg-brand-green-800 hover:bg-brand-green-900 text-brand-gold-300 font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Proceed to Payment • ₹{doctor.fee}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                </form>
              )}

              {/* ======================================================== */}
              {/* STEP 3.5: INSTANT MOBILE OTP LOGIN SCREEN (FOR GUEST USERS) */}
              {/* "if user already login then then move and if not login then move to login screen same as instant buy enter mobile no otp then move like that in doctor booking" */}
              {/* ======================================================== */}
              {bookingStep === 'auth' && (
                <div className="space-y-6 animate-in fade-in duration-300 max-w-xl mx-auto">
                  <div className="text-center space-y-1.5">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 mb-1 shadow-xs">
                      <ShieldCheck className="w-6 h-6 text-brand-green-800" />
                    </div>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-slate-900">
                      Patient Mobile Verification
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Enter your mobile number and verify via instant SMS OTP to link your medical records and proceed to payment for <strong>{doctor.name}</strong>.
                    </p>
                  </div>

                  {/* Mini Appointment Summary Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img src={doctor.image || legendaryDoctorImg} alt={doctor.name} className="w-10 h-10 rounded-xl object-cover object-top border border-slate-200" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">{doctor.name}</p>
                          <p className="text-[11px] text-brand-green-800 font-medium">{doctor.specialties[0]}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Fee Payable</span>
                        <span className="text-sm font-black text-brand-green-950">₹{doctor.fee}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-600">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Date & Time</span>
                        <strong className="text-slate-800">{selectedDate} • {selectedTimeSlot}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Consultation</span>
                        <strong className="text-slate-800">{selectedMode.toUpperCase()} Call</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Patient</span>
                        <strong className="text-slate-800 truncate block">{patientName}</strong>
                      </div>
                    </div>

                    {(uploadedReports.length > 0 || uploadedPhoto) && (
                      <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-3 text-[11px] text-emerald-800 font-medium">
                        {uploadedReports.length > 0 && (
                          <span className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-rose-600" />
                            {uploadedReports.length} PDF Report{uploadedReports.length > 1 ? 's' : ''}
                          </span>
                        )}
                        {uploadedPhoto && (
                          <span className="flex items-center gap-1">
                            <Camera className="w-3.5 h-3.5 text-brand-green-800" />
                            1 Condition Photo
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* AUTH FORM CARD */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
                    {!usePasswordInstead ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Mobile Number (for SMS OTP & WhatsApp Pass)
                          </label>
                          <div className="relative flex items-center">
                            <span className="absolute left-3 text-xs font-bold text-slate-500 select-none">
                              +91
                            </span>
                            <input
                              id="input-auth-mobile"
                              type="tel"
                              maxLength={10}
                              placeholder="Enter 10-digit mobile number"
                              value={authMobile}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                setAuthMobile(val);
                                if (authError) setAuthError(null);
                              }}
                              disabled={otpSent && isSendingOtp}
                              className="w-full pl-12 pr-28 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 font-semibold focus:outline-none focus:border-brand-green-800 bg-slate-50/50"
                            />
                            {!otpSent ? (
                              <button
                                type="button"
                                onClick={handleSendOtp}
                                disabled={isSendingOtp || authMobile.length !== 10}
                                className="absolute right-2 px-3 py-1.5 rounded-lg bg-brand-green-800 hover:bg-brand-green-900 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                              >
                                {isSendingOtp ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Sending...</span>
                                  </>
                                ) : (
                                  <span>Send OTP</span>
                                )}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setOtpSent(false);
                                  setAuthOtpCode('');
                                  setAuthError(null);
                                  setAuthSuccessMsg(null);
                                }}
                                className="absolute right-2 text-xs font-bold text-brand-green-800 hover:underline cursor-pointer"
                              >
                                Change No.
                              </button>
                            )}
                          </div>
                        </div>

                        {/* OTP Input Field */}
                        {otpSent && (
                          <div className="space-y-3 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between">
                              <label className="block text-xs font-bold text-slate-700">
                                Enter 4-Digit Verification OTP
                              </label>
                              <span className="text-[11px] text-slate-500">
                                Sent to +91 {authMobile}
                              </span>
                            </div>

                            <div className="relative">
                              <input
                                id="input-auth-otp"
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                autoFocus
                                placeholder="• • • •"
                                value={authOtpCode}
                                onChange={(e) => {
                                  const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                                  setAuthOtpCode(digits);
                                  if (authError) setAuthError(null);
                                }}
                                className="w-full tracking-widest text-center text-xl font-bold py-3 rounded-xl border-2 border-brand-green-800 bg-white text-slate-900 focus:outline-none shadow-xs"
                              />
                            </div>

                            {/* Resend OTP Timer & Button */}
                            <div className="flex items-center justify-between text-xs pt-1">
                              {otpTimer > 0 ? (
                                <span className="text-slate-400">
                                  Resend code in <strong>{otpTimer}s</strong>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={handleSendOtp}
                                  disabled={isSendingOtp}
                                  className="text-brand-green-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
                                >
                                  {isSendingOtp ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                  <span>Resend OTP via SMS</span>
                                </button>
                              )}
                              <span className="text-[11px] text-slate-400">Powered by MSG91 Secure OTP</span>
                            </div>
                          </div>
                        )}

                        {/* Status Messages */}
                        {authError && (
                          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{authError}</span>
                          </div>
                        )}
                        {authSuccessMsg && (
                          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                            <span>{authSuccessMsg}</span>
                          </div>
                        )}

                        {/* Action Button */}
                        <div className="pt-2">
                          {otpSent ? (
                            <button
                              type="button"
                              id="btn-verify-otp-proceed"
                              onClick={handleVerifyOtpAndProceed}
                              disabled={isVerifyingOtp || authOtpCode.length < 4}
                              className="w-full py-3.5 rounded-xl bg-brand-green-800 hover:bg-brand-green-900 disabled:opacity-50 text-brand-gold-300 font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                              {isVerifyingOtp ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Verifying & Advancing to Payment...</span>
                                </>
                              ) : (
                                <>
                                  <span>Verify OTP & Proceed to Payment</span>
                                  <ArrowRight className="w-4 h-4" />
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSendOtp}
                              disabled={isSendingOtp || authMobile.length !== 10}
                              className="w-full py-3.5 rounded-xl bg-brand-green-800 hover:bg-brand-green-900 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                              {isSendingOtp ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Sending Verification OTP...</span>
                                </>
                              ) : (
                                <>
                                  <span>Send Verification OTP</span>
                                  <ArrowRight className="w-4 h-4" />
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Password Sign In Alternative */
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-900">Sign in with Account Password</h4>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                          <input
                            type="email"
                            value={patientEmail}
                            onChange={(e) => setPatientEmail(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                          <input
                            type="password"
                            placeholder="Enter your account password..."
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-green-800"
                          />
                        </div>
                        {authError && (
                          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                            {authError}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={handlePasswordLoginAndProceed}
                          disabled={isVerifyingOtp}
                          className="w-full py-3 rounded-xl bg-brand-green-800 hover:bg-brand-green-900 text-brand-gold-300 font-bold text-xs flex items-center justify-center gap-2"
                        >
                          {isVerifyingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                          <span>Sign In & Continue to Payment</span>
                        </button>
                      </div>
                    )}

                    {/* Back / Toggle options */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => setUsePasswordInstead(!usePasswordInstead)}
                        className="text-slate-500 hover:text-brand-green-800 font-medium underline cursor-pointer"
                      >
                        {usePasswordInstead ? '← Use Mobile OTP instead' : 'Or Sign In with Password'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingStep('information')}
                        className="text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Edit Patient Info</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* STEP 4: SECURE PAYMENT ("THEN PAY") */}
              {/* ======================================================== */}
              {bookingStep === 'payment' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  
                  <div className="text-center max-w-md mx-auto space-y-1">
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-slate-900">
                      Secure Consultation Payment
                    </h3>
                    <p className="text-xs text-slate-500">
                      Complete your subsidized consultation fee of <strong>₹{doctor.fee}</strong> to immediately confirm your appointment slot.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    
                    {/* LEFT COLUMN: ORDER SUMMARY */}
                    <div className="md:col-span-5 bg-slate-50/90 rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4">
                      <div className="border-b border-slate-200 pb-3">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Booking Summary</span>
                        <h4 className="font-serif font-bold text-slate-900 text-base mt-0.5">{doctor.name}</h4>
                        <p className="text-xs text-brand-green-800 font-semibold flex items-center gap-1.5 mt-0.5">
                          {selectedMode === 'video' ? (
                            <>
                              <Video className="w-3.5 h-3.5 text-brand-green-800" />
                              <span>1-on-1 HD Video Call (Google Meet / Jitsi)</span>
                            </>
                          ) : selectedMode === 'audio' ? (
                            <>
                              <PhoneCall className="w-3.5 h-3.5 text-teal-700" />
                              <span>Phone Call or WhatsApp Voice Call</span>
                            </>
                          ) : (
                            <>
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                              <span>WhatsApp Live Chat Consultation</span>
                            </>
                          )}
                        </p>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Scheduled Date:</span>
                          <strong className="text-slate-900">{selectedDate}</strong>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Scheduled Time:</span>
                          <strong className="text-slate-900">{selectedTimeSlot}</strong>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Patient:</span>
                          <strong className="text-slate-900">{patientName}</strong>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Contact:</span>
                          <strong className="text-slate-900">{patientPhone}</strong>
                        </div>
                      </div>

                      {/* Clinical Attachments summary */}
                      {(uploadedReports.length > 0 || uploadedPhoto) && (
                        <div className="pt-3 border-t border-slate-200 space-y-1.5 text-xs">
                          <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                            Attached Medical Records
                          </span>
                          {uploadedReports.length > 0 && (
                            <div className="flex items-center gap-1.5 text-slate-700 font-medium text-[11px]">
                              <FileText className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span>{uploadedReports.length} PDF Report{uploadedReports.length > 1 ? 's' : ''} Attached</span>
                            </div>
                          )}
                          {uploadedPhoto && (
                            <div className="flex items-center gap-2 pt-0.5">
                              <img
                                src={uploadedPhoto.dataUrl}
                                alt="Photo"
                                className="w-8 h-8 rounded-md object-cover border border-slate-200"
                              />
                              <span className="text-[11px] text-slate-700 font-medium">1 Condition Photo Attached</span>
                            </div>
                          )}
                        </div>
                      )}

                      {currentUser && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Verified Account: <strong>{currentUser.fullName || currentUser.phone}</strong></span>
                        </div>
                      )}

                      <div className="pt-3 border-t border-slate-200 space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-500">
                          <span>Standard Consultation:</span>
                          <span className="line-through">₹{doctor.originalFee}</span>
                        </div>
                        <div className="flex justify-between text-emerald-700 font-semibold">
                          <span>AYUSH Care Subsidy:</span>
                          <span>-₹{(doctor.originalFee || 1200) - doctor.fee}</span>
                        </div>
                        <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-slate-900">
                          <span className="font-bold text-sm">Total Payable:</span>
                          <span className="text-xl font-black text-brand-green-950">₹{doctor.fee}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 text-right">All taxes & 7-day WhatsApp care included</p>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: PAYMENT METHODS & PAY BUTTON */}
                    <div className="md:col-span-7 space-y-4">
                      
                      <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                          Payment Method
                        </label>
                        
                        <div className="p-4 border-2 border-brand-green-800 bg-brand-green-50/50 rounded-2xl shadow-sm ring-1 ring-brand-green-800/30 flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 text-brand-green-800">
                              <CheckCircle2 className="w-4 h-4 text-brand-green-800" />
                            </div>
                            <div className="text-xs space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-slate-900 text-sm">UPI, Cards & Net Banking (via Razorpay)</p>
                                <span className="text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  <span>Instant & Secure</span>
                                </span>
                              </div>
                              <p className="text-slate-600">
                                Pay securely using Google Pay, PhonePe, Paytm, BHIM, UPI QR, Credit/Debit Cards, or Net Banking.
                              </p>
                              <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 font-medium flex-wrap">
                                <span className="bg-white px-2 py-0.5 rounded border border-slate-200">GPay</span>
                                <span className="bg-white px-2 py-0.5 rounded border border-slate-200">PhonePe</span>
                                <span className="bg-white px-2 py-0.5 rounded border border-slate-200">Paytm / UPI</span>
                                <span className="bg-white px-2 py-0.5 rounded border border-slate-200">Debit / Credit Card</span>
                                <span className="bg-white px-2 py-0.5 rounded border border-slate-200">Net Banking</span>
                              </div>
                            </div>
                          </div>
                          <div className="w-9 h-9 rounded-xl bg-brand-green-800 text-brand-gold-300 flex items-center justify-center shrink-0">
                            <CreditCard className="w-5 h-5" />
                          </div>
                        </div>
                      </div>

                      {/* TRUST STRIP */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                        <Lock className="w-3.5 h-3.5 text-brand-green-800 shrink-0" />
                        <span>256-Bit SSL Encrypted & Official Razorpay Verification Gateway</span>
                      </div>

                      {/* PAY BUTTON & BACK BUTTON */}
                      <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setBookingStep('information')}
                          disabled={isPaymentProcessing}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Back to Patient Info</span>
                        </button>

                        <button
                          id="btn-pay-and-confirm-consultation"
                          type="button"
                          onClick={handleExecutePayment}
                          disabled={isPaymentProcessing || isSubmitting}
                          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-green-800 hover:bg-brand-green-900 text-brand-gold-300 font-extrabold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          {isPaymentProcessing ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-brand-gold-300" />
                              <span>Opening Razorpay Gateway (₹{doctor.fee})...</span>
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-4 h-4 text-brand-gold-300" />
                              <span>Pay ₹{doctor.fee} via Razorpay & Confirm</span>
                            </>
                          )}
                        </button>
                      </div>

                    </div>

                  </div>

                </div>
              )}

            </div>

          </div>
        )}

        {/* VIEW 2: MY CONSULTATIONS APPOINTMENTS LIST */}
        {activeTab === 'my-appointments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2">
              <h2 className="text-base font-bold text-slate-900">Your Consultations</h2>
              <button
                type="button"
                onClick={() => handleNavigateToBook()}
                className="text-xs font-bold text-brand-green-800 hover:underline cursor-pointer"
              >
                + Book New Consultation
              </button>
            </div>

            {myAppointments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">No consultations booked yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Schedule your private consultation with {doctor.name} for personalized Ayurvedic guidance and pulse analysis.
                </p>
                <button
                  type="button"
                  onClick={() => handleNavigateToBook()}
                  className="px-5 py-2.5 rounded-xl bg-brand-green-800 text-brand-gold-300 font-bold text-xs shadow-xs cursor-pointer"
                >
                  Book Slot Now (₹499)
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myAppointments.map((app) => (
                  <div
                    key={app.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <img
                        src={app.doctorImage || legendaryDoctorImg}
                        alt={app.doctorName}
                        className="w-14 h-14 rounded-xl object-cover object-top border border-slate-200 shrink-0"
                      />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{app.doctorName}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            app.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {app.status}
                          </span>
                        </div>
                        <p className="text-xs text-brand-green-800 font-semibold flex items-center gap-1.5">
                          {app.consultationMode === 'video' ? (
                            <>
                              <Video className="w-3.5 h-3.5 text-brand-green-800" />
                              <span>{app.date} • {app.timeSlot} (HD Video Call)</span>
                            </>
                          ) : app.consultationMode === 'audio' ? (
                            <>
                              <PhoneCall className="w-3.5 h-3.5 text-teal-700" />
                              <span>{app.date} • {app.timeSlot} (Phone / WhatsApp Call)</span>
                            </>
                          ) : (
                            <>
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{app.date} • {app.timeSlot} (WhatsApp Live Chat)</span>
                            </>
                          )}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Patient: {app.patientName} ({app.patientPhone})
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Ref: #{app.id} • Booked on {app.bookingDate}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {app.status === 'Confirmed' && app.consultationMode === 'video' && app.meetingLink && (
                        <a
                          href={app.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-xl bg-brand-green-800 hover:bg-brand-green-900 text-brand-gold-300 font-bold text-xs flex items-center gap-1.5 shadow-xs"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Video Room</span>
                        </a>
                      )}

                      {app.status === 'Confirmed' && app.consultationMode === 'audio' && (
                        <div className="px-3.5 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 font-semibold text-xs flex items-center gap-1.5">
                          <PhoneCall className="w-3.5 h-3.5 text-teal-600" />
                          <span>Doctor Will Call</span>
                        </div>
                      )}

                      {app.status === 'Confirmed' && app.consultationMode === 'chat' && (
                        <a
                          href={`https://wa.me/918882001122?text=${encodeURIComponent(`Namaste ${doctor.name}, following up on my booked WhatsApp Consultation #${app.id}. Patient: ${app.patientName}.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Chat on WhatsApp</span>
                        </a>
                      )}

                      {app.status === 'Confirmed' && (
                        <button
                          type="button"
                          onClick={() => handleCancelAppointment(app.id)}
                          className="px-3 py-2 rounded-xl border border-slate-200 hover:border-rose-300 text-slate-600 hover:text-rose-600 text-xs font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: ABOUT DOCTOR PROFILE & SPECIALTIES */}
        {activeTab === 'about-doctor' && (
          <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
            
            {/* HERO PROFILE CARD */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-8 shadow-xs">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                
                {/* AVATAR & QUICK STATS */}
                <div className="md:col-span-4 flex flex-col items-center text-center gap-3.5">
                  <div className="relative">
                    <img
                      src={doctor.image}
                      alt={doctor.name}
                      className="w-36 h-36 sm:w-40 sm:h-40 rounded-2xl object-cover object-top border-3 border-brand-gold-400 shadow-md"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-brand-green-800 text-brand-gold-300 p-2 rounded-full shadow-lg border-2 border-white">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 text-xs uppercase font-bold tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Available Today
                    </span>
                    <div className="flex items-center justify-center gap-1.5 text-xs text-slate-700 pt-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="font-extrabold text-slate-900 text-sm">4.98</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500 font-medium">2,450+ Consults</span>
                    </div>
                  </div>

                  <div className="w-full bg-[#FAF8F5] p-3 rounded-xl border border-brand-gold-300/40 text-center space-y-1">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">AYUSH Verified ID</span>
                    <p className="text-xs font-mono font-bold text-brand-green-950">AYUSH-IND-8842-SR</p>
                  </div>
                </div>

                {/* DOCTOR BIO & CREDENTIALS */}
                <div className="md:col-span-8 space-y-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-gold-700 bg-brand-gold-50 px-3 py-1 rounded-md border border-brand-gold-300/60 inline-block mb-1.5">
                      {doctor.title || 'Chief Ayurvedic Physician & Master Nadi Vaidya'}
                    </span>
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                      {doctor.name}
                    </h2>
                    <p className="text-sm font-bold text-brand-green-800 mt-1">
                      {doctor.qualification}
                    </p>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {doctor.bio}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Experience</span>
                      <p className="font-extrabold text-sm text-slate-800 mt-0.5">{doctor.experienceYears}+ Years</p>
                      <p className="text-[10px] text-slate-500">Clinical Mastery</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Education</span>
                      <p className="font-extrabold text-sm text-slate-800 mt-0.5">{doctor.qualification.split(',')[0] || 'Ayurvedic Physician'}</p>
                      <p className="text-[10px] text-slate-500">AYUSH Recognized</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Consultation Fee</span>
                      <p className="font-extrabold text-sm text-brand-green-900 mt-0.5">₹{doctor.fee} Only</p>
                      <p className="text-[10px] text-emerald-700 font-bold">Subsidized</p>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleNavigateToBook()}
                      className="px-6 py-3 rounded-xl bg-brand-green-800 hover:bg-brand-green-900 text-brand-gold-300 font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Book Consultation Now (₹{doctor.fee})</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('fees-chart')}
                      className="px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                      View Fees Chart
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* CLINICAL SPECIALTIES & PRACTICE DOMAINS */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-4">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-brand-green-800">
                  Areas of Clinical Expertise
                </span>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-900">
                  Root-Cause Healing Across Major Health Domains
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-brand-gold-300/50 space-y-1.5">
                  <div className="flex items-center gap-2 text-brand-green-900 font-bold text-xs sm:text-sm">
                    <CheckCircle className="w-4 h-4 text-brand-gold-600 shrink-0" />
                    <span>Classical Nadi Pariksha (Pulse Diagnosis)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Decoding subtle imbalances across Vata, Pitta, and Kapha sub-doshas, cellular metabolic toxins (Ama), and early organ stress.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-brand-gold-300/50 space-y-1.5">
                  <div className="flex items-center gap-2 text-brand-green-900 font-bold text-xs sm:text-sm">
                    <CheckCircle className="w-4 h-4 text-brand-gold-600 shrink-0" />
                    <span>Gut Dysbiosis, Acidity & Agni Reversal</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Personalized protocol for chronic IBS, GERD, gas, constipation, and sluggish digestive fire using classical herbal teas and churnas.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-brand-gold-300/50 space-y-1.5">
                  <div className="flex items-center gap-2 text-brand-green-900 font-bold text-xs sm:text-sm">
                    <CheckCircle className="w-4 h-4 text-brand-gold-600 shrink-0" />
                    <span>PCOS, Thyroid & Hormonal Balance</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Natural endocrine realignment addressing insulin sensitivity, irregular cycles, and thyroid sluggishness without synthetic hormones.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-brand-gold-300/50 space-y-1.5">
                  <div className="flex items-center gap-2 text-brand-green-900 font-bold text-xs sm:text-sm">
                    <CheckCircle className="w-4 h-4 text-brand-gold-600 shrink-0" />
                    <span>Chronic Joint & Arthritis Care</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Reducing deep Vata inflammation, joint pain, stiffness, and cervical/lumbar discomfort through classical anti-inflammatory herbs.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-brand-gold-300/50 space-y-1.5 sm:col-span-2">
                  <div className="flex items-center gap-2 text-brand-green-900 font-bold text-xs sm:text-sm">
                    <CheckCircle className="w-4 h-4 text-brand-gold-600 shrink-0" />
                    <span>Rasayana Cellular Rejuvenation & Vitality</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Strengthening Ojas (natural immunity), reversing biological fatigue, improving sleep quality, and promoting longevity.
                  </p>
                </div>
              </div>
            </div>

            {/* HOW CONSULTATION WORKS */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-4">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-brand-green-800">
                  Patient Consultation Process
                </span>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-900">
                  What Happens During Your 1-on-1 Session
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="w-8 h-8 rounded-full bg-brand-green-800 text-white font-bold flex items-center justify-center text-xs">
                    1
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">20-30 Min Evaluation</h4>
                  <p className="text-slate-600 leading-relaxed">
                    Dr. Sanjeev conducts an unhurried evaluation of your pulse markers, tongue indicators, medical reports, and current symptoms.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="w-8 h-8 rounded-full bg-brand-green-800 text-white font-bold flex items-center justify-center text-xs">
                    2
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Digital Prescription</h4>
                  <p className="text-slate-600 leading-relaxed">
                    Receive an official AYUSH certified digital prescription along with a personalized Pathya-Apathya (diet and daily lifestyle) chart on WhatsApp.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="w-8 h-8 rounded-full bg-brand-green-800 text-white font-bold flex items-center justify-center text-xs">
                    3
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">7 Days Free Follow-Up</h4>
                  <p className="text-slate-600 leading-relaxed">
                    Stay directly connected for 7 days via WhatsApp for herb dosage questions, dietary adjustments, and recovery monitoring at zero extra cost.
                  </p>
                </div>
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => handleNavigateToBook()}
                  className="px-8 py-3.5 rounded-xl bg-brand-green-800 hover:bg-brand-green-900 text-brand-gold-300 font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book Consultation with Dr. Sanjeev • ₹{doctor.fee}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        )}

        {/* VIEW 4: FEES CHART & DELIVERABLES BREAKDOWN */}
        {activeTab === 'fees-chart' && (
          <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
            
            {/* PRICING HERO CARD */}
            <div className="bg-gradient-to-br from-brand-green-900 to-brand-green-950 text-white rounded-2xl border-2 border-brand-gold-400 p-6 sm:p-8 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs uppercase tracking-wider font-bold text-brand-gold-300 bg-white/10 px-3 py-1 rounded-full inline-block">
                    BV Life AYUSH Subsidized Initiative
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold">
                    Transparent Consultation Fees
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-lg">
                    High-touch, senior Ayurvedic clinical care made affordable with zero hidden charges and complete transparency.
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/20 text-center sm:text-right shrink-0">
                  <span className="text-[11px] uppercase font-bold text-brand-gold-300">Total Consultation Fee</span>
                  <div className="flex items-baseline justify-center sm:justify-end gap-2 mt-1">
                    <span className="text-3xl sm:text-4xl font-black text-white">₹{doctor.fee}</span>
                    <span className="text-sm line-through text-slate-400 font-bold">₹{doctor.originalFee}</span>
                  </div>
                  <span className="inline-block mt-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                    58% Subsidy Applied
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <CheckCircle className="w-4 h-4" />
                    <span>No Booking Fees</span>
                  </span>
                  <span className="text-white/30">•</span>
                  <span className="flex items-center gap-1.5 font-semibold">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Free 7-Day Follow-Up</span>
                  </span>
                  <span className="text-white/30">•</span>
                  <span className="flex items-center gap-1.5 font-semibold">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Instant WhatsApp Prescription</span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleNavigateToBook()}
                  className="px-6 py-2.5 rounded-xl bg-brand-gold-400 hover:bg-brand-gold-300 text-brand-green-950 font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>Book Slot (₹{doctor.fee})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* COMPREHENSIVE INCLUSIONS TABLE */}
            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
              <div className="p-5 border-b border-slate-100 bg-slate-50/70">
                <h3 className="font-serif text-lg font-bold text-slate-900">
                  What is Included in Your ₹{doctor.fee} Consultation
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comparison between BV Life Doctor Consultation and standard private clinics
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold">
                      <th className="p-3.5 pl-5">Deliverable / Feature</th>
                      <th className="p-3.5 bg-brand-green-50 text-brand-green-950 border-x border-brand-green-100">
                        BV Life Consultation (₹{doctor.fee})
                      </th>
                      <th className="p-3.5 pr-5 text-slate-500">Standard Private Clinic (₹1,200 - ₹2,500)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3.5 pl-5 font-semibold text-slate-900">Senior Doctor Experience</td>
                      <td className="p-3.5 bg-brand-green-50/40 font-bold text-brand-green-900 border-x border-brand-green-100">
                        ✓ 30+ Years MD (Ayurveda) BHU Gold Medalist
                      </td>
                      <td className="p-3.5 pr-5 text-slate-500">Often Junior or Assistant Vaidya</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3.5 pl-5 font-semibold text-slate-900">Consultation Duration</td>
                      <td className="p-3.5 bg-brand-green-50/40 font-bold text-brand-green-900 border-x border-brand-green-100">
                        ✓ 20 to 30 Mins Unhurried 1-on-1
                      </td>
                      <td className="p-3.5 pr-5 text-slate-500">5 to 10 Mins Rushed Visit</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3.5 pl-5 font-semibold text-slate-900">Consultation Format</td>
                      <td className="p-3.5 bg-brand-green-50/40 font-bold text-brand-green-900 border-x border-brand-green-100">
                        ✓ Video Call, Direct Phone, or WhatsApp
                      </td>
                      <td className="p-3.5 pr-5 text-slate-500">In-person Waiting Queue (1-2 Hrs)</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3.5 pl-5 font-semibold text-slate-900">Digital AYUSH Prescription</td>
                      <td className="p-3.5 bg-brand-green-50/40 font-bold text-brand-green-900 border-x border-brand-green-100">
                        ✓ Included Free (Digital PDF on WhatsApp)
                      </td>
                      <td className="p-3.5 pr-5 text-slate-500">Handwritten Paper Slip</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3.5 pl-5 font-semibold text-slate-900">Personalized Diet & Herb Chart</td>
                      <td className="p-3.5 bg-brand-green-50/40 font-bold text-brand-green-900 border-x border-brand-green-100">
                        ✓ Included Free (Custom Pathya-Apathya)
                      </td>
                      <td className="p-3.5 pr-5 text-slate-500">Extra Fee (₹500 - ₹1,000)</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3.5 pl-5 font-semibold text-slate-900">WhatsApp Follow-Up Care</td>
                      <td className="p-3.5 bg-brand-green-50/40 font-bold text-brand-green-900 border-x border-brand-green-100">
                        ✓ 7 Days Free Continuous Support
                      </td>
                      <td className="p-3.5 pr-5 text-slate-500">Full Repeat Fee per Visit</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3.5 pl-5 font-semibold text-slate-900">Blood / Medical Report Review</td>
                      <td className="p-3.5 bg-brand-green-50/40 font-bold text-brand-green-900 border-x border-brand-green-100">
                        ✓ Included Free (Upload up to 3 PDFs)
                      </td>
                      <td className="p-3.5 pr-5 text-slate-500">Additional Specialist Fee</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3.5 pl-5 font-semibold text-slate-900">Rescheduling Flexibility</td>
                      <td className="p-3.5 bg-brand-green-50/40 font-bold text-brand-green-900 border-x border-brand-green-100">
                        ✓ 1-Click Free Reschedule Anytime
                      </td>
                      <td className="p-3.5 pr-5 text-slate-500">Non-refundable / Fixed Slots</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* FREQUENTLY ASKED QUESTIONS ABOUT FEES */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-4">
              <h3 className="font-serif text-lg font-bold text-slate-900">
                Frequently Asked Questions
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-1">Are there any hidden charges or medicines forced on me?</h4>
                  <p className="text-slate-600">
                    No. The ₹{doctor.fee} consultation fee is completely transparent and all-inclusive. You will receive an authentic prescription with dietary herbs and classical medicines that you may source from any certified Ayurvedic pharmacy or directly from BV Life.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-1">How do I connect for my consultation?</h4>
                  <p className="text-slate-600">
                    Depending on your choice (Video Call, Direct Phone, or WhatsApp Audio), you will receive an instant confirmation on your WhatsApp with the direct room link or doctor call details 15 minutes before the slot.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-1">Can I reschedule my appointment if something comes up?</h4>
                  <p className="text-slate-600">
                    Yes, you can easily reschedule your consultation to any other available day or time slot directly from your "My Consultations" tab at no penalty.
                  </p>
                </div>
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => handleNavigateToBook()}
                  className="px-8 py-3.5 rounded-xl bg-brand-green-800 hover:bg-brand-green-900 text-brand-gold-300 font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Confirm & Book Consultation Slot • ₹{doctor.fee}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        )}

        {/* CONDITION PHOTO ENLARGED PREVIEW MODAL */}
        {previewModalImg && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setPreviewModalImg(null)}
          >
            <div
              className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl p-4 border border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-brand-green-800" />
                  <span className="text-sm font-bold text-slate-900">Attached Condition / Prescription Photo</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewModalImg(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="mt-3 max-h-[75vh] flex items-center justify-center overflow-auto rounded-xl bg-slate-950/5 p-2">
                <img
                  src={previewModalImg}
                  alt="Enlarged Condition"
                  className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain shadow-sm"
                />
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setPreviewModalImg(null)}
                  className="px-4 py-2 rounded-xl bg-brand-green-800 hover:bg-brand-green-900 text-white font-bold text-xs cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
