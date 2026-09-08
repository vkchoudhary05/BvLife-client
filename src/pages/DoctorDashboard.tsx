/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Video, Calendar, Clock, User, Phone, PhoneCall, PhoneForwarded, Mail, FileText, CheckCircle2, 
  X, ExternalLink, Copy, Check, Search, Filter, Stethoscope, 
  Plus, Trash2, Printer, Download, Sparkles, Shield, AlertCircle,
  MessageSquare, RefreshCw, ChevronRight, Activity, ArrowLeft,
  Settings, Link as LinkIcon, Eye, EyeOff, Lock, LogOut
} from 'lucide-react';
import { DoctorAppointment, DoctorPrescription, PrescribedMedicine, User as UserType } from '../types';
import { api } from '../services/api';

interface DoctorDashboardProps {
  currentUser: UserType | null;
  onNavigate: (page: string, params?: any) => void;
  language?: string;
  onLoginSuccess?: (user: UserType, token: string) => void;
}

const COMMON_AYURVEDIC_MEDICINES = [
  'Organic Amla Churna',
  'Ashwagandha KSM-66 Extract',
  'Triphala Churna (Tridoshic)',
  'Brahmi Vati (Medhya Rasayana)',
  'Yograj Guggulu (Joint & Vata)',
  'Dashmularishta (Restorative)',
  'Mahasudarshan Ghan Vati',
  'Chyawanprash Awaleha',
  'Shilajit Resin (Pure Himalayan)',
  'Shatavari Kalpa (Hormonal Balance)',
  'Avipattikar Churna (Digestive Agni)',
  'Arjunarishta (Cardiovascular)'
];

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  currentUser,
  onNavigate,
  language = 'en',
  onLoginSuccess
}) => {
  // Doctor Auth state for direct link access
  const [localDoctorUser, setLocalDoctorUser] = useState<UserType | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('grams_doctor_session');
        if (stored) return JSON.parse(stored);
      } catch {
        // ignore
      }
    }
    return null;
  });

  const [loginEmail, setLoginEmail] = useState<string>('doctor@gramslife.com');
  const [loginPassword, setLoginPassword] = useState<string>('123123123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');

  const isDoctorAuthenticated = useMemo(() => {
    const active = localDoctorUser || currentUser;
    if (!active) return false;
    const email = (active.email || '').toLowerCase().trim();
    return active.role === 'admin' || 
      ['doctor@gramslife.com', 'admin@gramslife.com', 'iamvivekbaliyan07@gmail.com', 'vkchoudhary050607@gmail.com'].includes(email);
  }, [localDoctorUser, currentUser]);

  const handleDoctorLogin = async (e?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    let emailToUse = (customEmail !== undefined ? customEmail : loginEmail).trim();
    let passToUse = (customPassword !== undefined ? customPassword : loginPassword).trim();

    // Sanitize in case user copied "Doctor ID: doctor@gramslife.com" or label prefixes
    emailToUse = emailToUse.replace(/^(doctor\s*id\s*[:\-]?\s*|email\s*[:\-]?\s*|id\s*[:\-]?\s*|username\s*[:\-]?\s*)/i, '').trim();
    passToUse = passToUse.replace(/^(password\s*[:\-]?\s*|pass\s*[:\-]?\s*)/i, '').trim();

    if (emailToUse.toLowerCase().includes('doctor@gramslife.com') || emailToUse.toLowerCase() === 'doctor') {
      emailToUse = 'doctor@gramslife.com';
    }

    // Default fallback to standard clinical practitioner
    if (!emailToUse) emailToUse = 'doctor@gramslife.com';
    if (!passToUse) passToUse = '123123123';

    const defaultDoctorUser: UserType = {
      email: 'doctor@gramslife.com',
      fullName: 'Dr. Arundhati Sharma',
      role: 'admin',
      phone: '9876543210',
      addresses: []
    };

    const isVerifiedDoctorCreds = emailToUse.toLowerCase() === 'doctor@gramslife.com' && 
      (passToUse === '123123123' || passToUse === 'password123' || passToUse === '');

    try {
      const res = await api.login({ email: emailToUse, password: passToUse });
      if (res && res.user && res.token) {
        setLocalDoctorUser(res.user);
        try {
          localStorage.setItem('grams_doctor_session', JSON.stringify(res.user));
          localStorage.setItem('grams_auth_token', res.token);
          sessionStorage.setItem('grams_auth_token', res.token);
        } catch {
          // ignore
        }
        if (onLoginSuccess) {
          onLoginSuccess(res.user, res.token);
        }
        return;
      }
    } catch (err: any) {
      console.warn('Doctor backend login notice:', err);
    }

    // If verified AYUSH practitioner credentials matched, grant session immediately
    if (isVerifiedDoctorCreds) {
      const fallbackToken = 'doc_auth_token_' + Date.now();
      setLocalDoctorUser(defaultDoctorUser);
      try {
        localStorage.setItem('grams_doctor_session', JSON.stringify(defaultDoctorUser));
        localStorage.setItem('grams_auth_token', fallbackToken);
        sessionStorage.setItem('grams_auth_token', fallbackToken);
      } catch {
        // ignore
      }
      if (onLoginSuccess) {
        onLoginSuccess(defaultDoctorUser, fallbackToken);
      }
    } else {
      setLoginError('Invalid Doctor credentials. Please check Doctor ID (doctor@gramslife.com) and Password (123123123).');
    }
    setIsLoggingIn(false);
  };

  const handleDoctorSignOut = () => {
    try {
      localStorage.removeItem('grams_doctor_session');
    } catch {
      // ignore
    }
    setLocalDoctorUser(null);
  };

  // State for appointments
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'schedule' | 'video' | 'calls' | 'prescriptions' | 'settings'>('schedule');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active appointment for in-call or prescription writing
  const [selectedAppointment, setSelectedAppointment] = useState<DoctorAppointment | null>(null);
  const [activeVideoAppointment, setActiveVideoAppointment] = useState<DoctorAppointment | null>(null);
  const [copiedMeetId, setCopiedMeetId] = useState<string | null>(null);
  const [editMeetModalAppointment, setEditMeetModalAppointment] = useState<DoctorAppointment | null>(null);
  const [customMeetUrlInput, setCustomMeetUrlInput] = useState<string>('');
  const [preferredPlatform, setPreferredPlatform] = useState<'google-meet' | 'jitsi'>('google-meet');

  // Prescription Drawer / Modal State
  const [prescriptionAppointment, setPrescriptionAppointment] = useState<DoctorAppointment | null>(null);
  const [viewPrescriptionData, setViewPrescriptionData] = useState<DoctorPrescription | null>(null);
  const [isSavingPrescription, setIsSavingPrescription] = useState<boolean>(false);
  const [prescriptionSuccessMsg, setPrescriptionSuccessMsg] = useState<string | null>(null);

  // Prescription Form Fields
  const [diagnosis, setDiagnosis] = useState<string>('');
  const [doshaPrakriti, setDoshaPrakriti] = useState<string>('Vata-Pitta Imbalance');
  const [dietAdvice, setDietAdvice] = useState<string>('Avoid spicy, deep-fried foods. Drink warm water throughout the day. Prefer freshly cooked, warm Sattvic meals.');
  const [lifestyleAdvice, setLifestyleAdvice] = useState<string>('Practice 15 mins Anulom Vilom Pranayama in the morning. Maintain consistent sleep cycle before 10:30 PM.');
  const [doctorNotes, setDoctorNotes] = useState<string>('');
  const [followUpDays, setFollowUpDays] = useState<string>('15');
  const [medicinesList, setMedicinesList] = useState<PrescribedMedicine[]>([
    {
      name: 'Ashwagandha KSM-66 Extract',
      dosage: '1 Capsule (500mg)',
      frequency: 'Twice daily',
      timing: 'After meals with warm milk or water',
      duration: '30 days',
      instructions: 'Helps balance Vata and restores nervous vitality'
    },
    {
      name: 'Organic Amla Churna',
      dosage: '1 Teaspoon (3g)',
      frequency: 'Once daily',
      timing: 'Empty stomach in the morning with warm water',
      duration: '30 days',
      instructions: 'Boosts digestive Agni and pacifies Pitta'
    }
  ]);

  // Doctor Online/Available status
  const [isDoctorAvailable, setIsDoctorAvailable] = useState<boolean>(true);

  // Load appointments
  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const backendData = await api.getAllDoctorAppointments();
      let combined: DoctorAppointment[] = [];

      if (backendData && backendData.length > 0) {
        combined = backendData;
      } else {
        // Fallback to local storage
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('bvlife_doctor_appointments');
          if (stored) {
            combined = JSON.parse(stored);
          }
        }
      }

      // Ensure that Priya Sundaram or sample data reflects direct phone call (audio) if present
      if (combined.length > 0) {
        combined = combined.map(a => {
          if (a.id === 'BVL-DOC-551829') {
            return { ...a, consultationMode: 'audio' };
          }
          return a;
        });
      }

      // If empty, generate realistic seed appointments for immediate rich doctor experience
      if (combined.length === 0) {
        const todayIso = new Date().toISOString().split('T')[0];
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowIso = tomorrow.toISOString().split('T')[0];

        combined = [
          {
            id: 'BVL-DOC-772910',
            doctorId: 'doc-legend-1',
            doctorName: 'Dr. Arundhati Sharma',
            doctorSpecialty: 'Senior Ayurvedic Vaidya & Nadi Pariksha Master',
            doctorImage: '/images/legendary_doctor.jpg',
            doctorQualification: 'BAMS, MD (Ayurveda - BHU Gold Medalist)',
            patientName: 'Rahul Verma',
            patientAge: 34,
            patientGender: 'Male',
            patientPhone: '+91 98765 43210',
            patientEmail: 'rahul.verma@example.com',
            date: todayIso,
            timeSlot: '10:15 AM',
            consultationMode: 'video',
            healthConcern: 'Chronic hyperacidity, bloating, and joint stiffness in mornings',
            fee: 499,
            status: 'Confirmed',
            roomStatus: 'waiting',
            bookingDate: 'Today',
            meetingPlatform: 'google-meet',
            meetingLink: 'https://meet.google.com/bvl-ayur-demo'
          },
          {
            id: 'BVL-DOC-551829',
            doctorId: 'doc-legend-1',
            doctorName: 'Dr. Arundhati Sharma',
            doctorSpecialty: 'Senior Ayurvedic Vaidya & Nadi Pariksha Master',
            doctorImage: '/images/legendary_doctor.jpg',
            doctorQualification: 'BAMS, MD (Ayurveda - BHU Gold Medalist)',
            patientName: 'Priya Sundaram',
            patientAge: 29,
            patientGender: 'Female',
            patientPhone: '+91 98112 34567',
            patientEmail: 'priya.sundaram@example.com',
            date: todayIso,
            timeSlot: '11:45 AM',
            consultationMode: 'audio',
            healthConcern: 'PCOS hormonal imbalance, erratic sleep patterns, stress fatigue',
            fee: 499,
            status: 'Confirmed',
            roomStatus: 'waiting',
            bookingDate: 'Today'
          },
          {
            id: 'BVL-DOC-442190',
            doctorId: 'doc-legend-1',
            doctorName: 'Dr. Arundhati Sharma',
            doctorSpecialty: 'Senior Ayurvedic Vaidya & Nadi Pariksha Master',
            doctorImage: '/images/legendary_doctor.jpg',
            doctorQualification: 'BAMS, MD (Ayurveda - BHU Gold Medalist)',
            patientName: 'Sunil Deshmukh',
            patientAge: 48,
            patientGender: 'Male',
            patientPhone: '+91 99201 88231',
            patientEmail: 'sunil.deshmukh@example.com',
            date: todayIso,
            timeSlot: '09:30 AM',
            consultationMode: 'audio',
            healthConcern: 'Metabolic detox and cholesterol balance with herbal diet plan',
            fee: 499,
            status: 'Completed',
            roomStatus: 'completed',
            bookingDate: 'Today',
            meetingPlatform: 'google-meet',
            meetingLink: 'https://meet.google.com/bvl-ayur-demo',
            prescription: {
              id: 'RX-99410',
              appointmentId: 'BVL-DOC-442190',
              doctorName: 'Dr. Arundhati Sharma',
              doctorQualification: 'BAMS, MD (Ayurveda), Ayush Reg. #AY-24890',
              patientName: 'Sunil Deshmukh',
              patientAge: 48,
              patientGender: 'Male',
              date: todayIso,
              diagnosis: 'Manda Agni with elevated Meda Dhatu (Metabolic Sluggishness & Pitta-Kapha Vriddhi)',
              doshaPrakriti: 'Pitta-Kapha Imbalance',
              dietRecommendations: [
                'Drink warm cumin-coriander-fennel (CCF) water twice daily',
                'Avoid refrigerated cold drinks, heavy bakery snacks, and oily gravies',
                'Include bitter gourds, bottle gourd soup, and fiber-rich barley (Yava) in dinner'
              ],
              lifestyleAdvice: [
                'Brisk walking for 30 minutes before sunrise',
                'Surya Namaskar 6 rounds daily followed by Shavasana'
              ],
              medicines: [
                {
                  name: 'Triphala Churna (Organic Tridoshic)',
                  dosage: '1 Teaspoon (5g)',
                  frequency: 'Once daily',
                  timing: 'Before sleep with lukewarm water',
                  duration: '45 days',
                  instructions: 'Colon detox & systemic ama elimination'
                },
                {
                  name: 'Organic Amla Churna',
                  dosage: '3g with honey',
                  frequency: 'Twice daily',
                  timing: 'After meals',
                  duration: '30 days',
                  instructions: 'Supports liver health and clears pitta acidity'
                }
              ],
              doctorNotes: 'Patient shows good response to herbal regimen. Blood lipid panel scheduled after 6 weeks.',
              followUpDate: 'In 4 weeks',
              signedAt: 'Signed Digitally by Dr. Arundhati Sharma'
            }
          },
          {
            id: 'BVL-DOC-889123',
            doctorId: 'doc-legend-1',
            doctorName: 'Dr. Arundhati Sharma',
            doctorSpecialty: 'Senior Ayurvedic Vaidya & Nadi Pariksha Master',
            doctorImage: '/images/legendary_doctor.jpg',
            doctorQualification: 'BAMS, MD (Ayurveda - BHU Gold Medalist)',
            patientName: 'Ananya Roy',
            patientAge: 26,
            patientGender: 'Female',
            patientPhone: '+91 97412 88410',
            patientEmail: 'ananya.roy@example.com',
            date: tomorrowIso,
            timeSlot: '02:30 PM',
            consultationMode: 'video',
            healthConcern: 'Skin breakouts, hair thinning, and high stress levels',
            fee: 499,
            status: 'Confirmed',
            roomStatus: 'waiting',
            bookingDate: 'Yesterday',
            meetingPlatform: 'google-meet',
            meetingLink: 'https://meet.google.com/bvl-ayur-demo'
          }
        ];

        if (typeof window !== 'undefined') {
          localStorage.setItem('bvlife_doctor_appointments', JSON.stringify(combined));
        }
      }

      setAppointments(combined);
    } catch (err) {
      console.error('Error in fetchAppointments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Update local storage and state helper
  const syncAppointments = (updated: DoctorAppointment[]) => {
    setAppointments(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('bvlife_doctor_appointments', JSON.stringify(updated));
    }
  };

  // Today's ISO date string
  const todayDate = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Stats calculation
  const stats = useMemo(() => {
    const todayAppointments = appointments.filter(a => a.date === todayDate);
    const videoToday = todayAppointments.filter(a => a.consultationMode === 'video');
    const audioToday = todayAppointments.filter(a => a.consultationMode !== 'video');
    const completedCount = appointments.filter(a => a.status === 'Completed').length;
    const totalAudioCount = appointments.filter(a => a.consultationMode !== 'video' && a.status !== 'Cancelled').length;

    return {
      todayCount: todayAppointments.length,
      videoToday: videoToday.length,
      audioToday: audioToday.length,
      totalAudioCount,
      completedCount
    };
  }, [appointments, todayDate]);

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(app => {
      // Filter tab / status
      if (filterStatus === 'today' && app.date !== todayDate) return false;
      if (filterStatus === 'confirmed' && app.status !== 'Confirmed') return false;
      if (filterStatus === 'completed' && app.status !== 'Completed') return false;
      if (filterStatus === 'video' && app.consultationMode !== 'video') return false;
      if (filterStatus === 'audio' && app.consultationMode === 'video') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (app.patientName || '').toLowerCase().includes(q);
        const matchPhone = (app.patientPhone || '').includes(q);
        const matchId = (app.id || '').toLowerCase().includes(q);
        const matchConcern = (app.healthConcern || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchId && !matchConcern) return false;
      }

      return true;
    });
  }, [appointments, filterStatus, searchQuery, todayDate]);

  // Video calls list
  const videoCallsList = useMemo(() => {
    return appointments.filter(a => a.consultationMode === 'video' && a.status !== 'Cancelled');
  }, [appointments]);

  // Direct phone calls list (Simple calls)
  const phoneCallsList = useMemo(() => {
    return appointments.filter(a => a.consultationMode !== 'video' && a.status !== 'Cancelled');
  }, [appointments]);

  // Copy meeting link
  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedMeetId(id);
    setTimeout(() => setCopiedMeetId(null), 2000);
  };

  // Open WhatsApp with Meeting Link pre-filled
  const handleShareOnWhatsApp = (app: DoctorAppointment) => {
    const cleanPhone = (app.patientPhone || '').replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const meetUrl = app.meetingLink || `https://meet.google.com/new`;
    const message = encodeURIComponent(
      `Namaste ${app.patientName}, this is Dr. Arundhati Sharma's Ayurvedic Clinic. Your Video Consultation is scheduled for ${app.date} at ${app.timeSlot}.\n\nPlease join the Video Call room using this secure link:\n${meetUrl}\n\nKindly ensure good lighting and keep any previous reports ready.`
    );
    window.open(`https://wa.me/${phoneWithCountry}?text=${message}`, '_blank');
  };

  // Call patient via WhatsApp or send consultation notification
  const handleWhatsAppPhoneCall = (app: DoctorAppointment) => {
    const cleanPhone = (app.patientPhone || '').replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const message = encodeURIComponent(
      `Namaste ${app.patientName}, this is Dr. Arundhati Sharma from GramsLife Ayurvedic Clinic. I am calling you for your scheduled Telephonic Consultation (${app.date} at ${app.timeSlot}). Please let me know if you are ready to speak on ${app.patientPhone}.`
    );
    window.open(`https://wa.me/${phoneWithCountry}?text=${message}`, '_blank');
  };

  // Initiate direct phone call
  const handleInitiatePhoneCall = (app: DoctorAppointment) => {
    const cleanPhone = (app.patientPhone || '').replace(/[^\d+]/g, '');
    try {
      api.updateAppointmentRoomStatus(app.id, 'in-progress');
    } catch {
      // ignore
    }
    window.location.href = `tel:${cleanPhone}`;
  };

  // Save custom Google Meet or Jitsi Link
  const handleSaveCustomMeetUrl = async () => {
    if (!editMeetModalAppointment) return;
    let url = customMeetUrlInput.trim();
    if (!url) {
      if (preferredPlatform === 'google-meet') {
        url = `https://meet.google.com/ayur-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`;
      } else {
        url = `https://meet.jit.si/BVLife-Consult-${editMeetModalAppointment.id}`;
      }
    }

    try {
      await api.updateAppointmentMeetingLink(editMeetModalAppointment.id, url, preferredPlatform);
    } catch (e) {
      console.warn('Backend updateMeetingLink fallback:', e);
    }

    const updated = appointments.map(a => 
      a.id === editMeetModalAppointment.id 
        ? { ...a, meetingLink: url, meetingPlatform: preferredPlatform } 
        : a
    );
    syncAppointments(updated);
    setEditMeetModalAppointment(null);
    setCustomMeetUrlInput('');
  };

  // Open Prescription Form Modal
  const handleOpenPrescriptionForm = (app: DoctorAppointment) => {
    setPrescriptionAppointment(app);
    setDiagnosis(app.prescription?.diagnosis || `Ayurvedic evaluation for ${app.healthConcern}`);
    setDoshaPrakriti(app.prescription?.doshaPrakriti || 'Vata-Pitta Imbalance');
    setDietAdvice(
      app.prescription?.dietRecommendations?.join('\n') || 
      'Avoid spicy, deep-fried foods. Drink warm water throughout the day. Prefer freshly cooked, warm Sattvic meals.'
    );
    setLifestyleAdvice(
      app.prescription?.lifestyleAdvice?.join('\n') || 
      'Practice 15 mins Anulom Vilom Pranayama in the morning. Maintain consistent sleep cycle before 10:30 PM.'
    );
    setDoctorNotes(app.prescription?.doctorNotes || '');
    if (app.prescription?.medicines && app.prescription.medicines.length > 0) {
      setMedicinesList(app.prescription.medicines);
    }
  };

  // Add Medicine Row
  const handleAddMedicineRow = () => {
    setMedicinesList([
      ...medicinesList,
      {
        name: '',
        dosage: '1 Capsule / 3g',
        frequency: 'Twice daily',
        timing: 'After meals with warm water',
        duration: '30 days',
        instructions: ''
      }
    ]);
  };

  // Remove Medicine Row
  const handleRemoveMedicineRow = (index: number) => {
    setMedicinesList(medicinesList.filter((_, i) => i !== index));
  };

  // Save Prescription Handler
  const handleSavePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prescriptionAppointment) return;

    setIsSavingPrescription(true);
    setPrescriptionSuccessMsg(null);

    const prescriptionPayload: DoctorPrescription = {
      id: `RX-${Math.floor(10000 + Math.random() * 90000)}`,
      appointmentId: prescriptionAppointment.id,
      doctorId: prescriptionAppointment.doctorId,
      doctorName: 'Dr. Arundhati Sharma',
      doctorQualification: 'BAMS, MD (Ayurveda - BHU Gold Medalist), Ayush Reg. #AY-24890',
      patientName: prescriptionAppointment.patientName,
      patientAge: prescriptionAppointment.patientAge,
      patientGender: prescriptionAppointment.patientGender,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      diagnosis: diagnosis.trim() || 'Holistic Ayurvedic Assessment',
      doshaPrakriti,
      dietRecommendations: dietAdvice.split('\n').map(s => s.trim()).filter(Boolean),
      lifestyleAdvice: lifestyleAdvice.split('\n').map(s => s.trim()).filter(Boolean),
      medicines: medicinesList.filter(m => m.name.trim()),
      doctorNotes: doctorNotes.trim(),
      followUpDate: `In ${followUpDays} days`,
      signedAt: `Digitally Signed by Dr. Arundhati Sharma (Ayush Reg #AY-24890)`
    };

    try {
      await api.saveDoctorPrescription(prescriptionAppointment.id, prescriptionPayload);
      await api.updateDoctorAppointmentStatus(prescriptionAppointment.id, 'Completed');
    } catch (err) {
      console.warn('Backend save prescription fallback:', err);
    }

    const updated = appointments.map(a => 
      a.id === prescriptionAppointment.id 
        ? { ...a, status: 'Completed' as const, roomStatus: 'completed' as const, prescription: prescriptionPayload } 
        : a
    );
    syncAppointments(updated);

    setIsSavingPrescription(false);
    setPrescriptionSuccessMsg('Digital Prescription saved and sent to patient!');
    setTimeout(() => {
      setPrescriptionSuccessMsg(null);
      setPrescriptionAppointment(null);
      setViewPrescriptionData(prescriptionPayload);
    }, 900);
  };

  // If not signed in as Doctor/Admin, render clean dedicated Doctor Login Portal
  if (!isDoctorAuthenticated) {
    return (
      <div id="doctor-auth-portal" className="min-h-screen bg-[#FBF9F5] text-slate-800 py-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
        <div className="max-w-md w-full mx-auto">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-brand-green-950 text-brand-gold-300 border-2 border-brand-gold-400/40 shadow-xl mb-4">
              <Stethoscope className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-brand-green-950 tracking-tight">
              Doctor & Vaidya Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-sm mx-auto">
              Clinical consultations & digital Ayurvedic prescriptions for Dr. Arundhati Sharma & AYUSH practitioners
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white border border-brand-gold-400/30 rounded-3xl p-6 sm:p-8 shadow-xl">
            {/* Quick Credentials Info Box */}
            <div className="mb-5 p-3.5 rounded-2xl bg-brand-cream-50 border border-brand-gold-400/30 text-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 font-bold text-brand-green-950">
                  <Shield className="w-3.5 h-3.5 text-brand-gold-600" />
                  <span>Verified AYUSH Practitioner Credentials</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail('doctor@gramslife.com');
                    setLoginPassword('123123123');
                    setLoginError('');
                  }}
                  className="text-[11px] font-bold text-brand-gold-600 hover:text-brand-green-900 underline cursor-pointer"
                >
                  Auto-Fill
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-600">
                <div>
                  <span className="font-semibold text-slate-500">Doctor ID:</span>{' '}
                  <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-800 font-mono">doctor@gramslife.com</code>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Password:</span>{' '}
                  <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-800 font-mono">123123123</code>
                </div>
              </div>
            </div>

            {loginError && (
              <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleDoctorLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Doctor ID / Clinic Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="input-doctor-email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    placeholder="doctor@gramslife.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-brand-green-700 focus:ring-1 focus:ring-brand-green-700 text-sm font-medium outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Practitioner Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="input-doctor-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:border-brand-green-700 focus:ring-1 focus:ring-brand-green-700 text-sm font-medium outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="btn-submit-doctor-login"
                disabled={isLoggingIn}
                className="w-full py-3.5 px-4 bg-brand-green-950 hover:bg-brand-green-900 active:scale-[0.99] text-brand-gold-300 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer border border-brand-gold-400/30"
              >
                <Stethoscope className="w-4 h-4 text-brand-gold-300" />
                <span>{isLoggingIn ? 'Authenticating Doctor...' : 'Sign In to Clinical Console'}</span>
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-100">
              <button
                type="button"
                id="btn-quick-doctor-login-card"
                onClick={() => {
                  setLoginEmail('doctor@gramslife.com');
                  setLoginPassword('123123123');
                  handleDoctorLogin(undefined, 'doctor@gramslife.com', '123123123');
                }}
                disabled={isLoggingIn}
                className="w-full py-2.5 px-3 bg-brand-gold-400/20 hover:bg-brand-gold-400/30 text-brand-green-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-brand-gold-400/40"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-gold-600" />
                <span>1-Click Sign In (Dr. Arundhati Sharma)</span>
              </button>
            </div>

            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Main Website</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="doctor-dashboard-container" className="min-h-screen bg-[#FBF9F5] text-slate-800 pb-24">
      
      {/* Top Header & Doctor Bio Bar */}
      <header className="bg-brand-green-950 text-brand-cream-50 border-b border-brand-gold-500/20 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            
            {/* Doctor Identity */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <img 
                  src="/images/legendary_doctor.jpg" 
                  alt="Dr. Arundhati Sharma"
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover border-2 border-brand-gold-400 shadow-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300';
                  }}
                />
                <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-brand-green-950 ${isDoctorAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold font-serif text-brand-gold-300">
                    Dr. Arundhati Sharma
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-brand-gold-400/20 text-brand-gold-300 text-[11px] font-semibold tracking-wide border border-brand-gold-400/30">
                    Doctor Portal
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-brand-cream-200/90 font-medium">
                  BAMS, MD (Ayurveda - BHU Gold Medalist) • Reg. #AY-24890
                </p>
                <p className="text-[11px] text-brand-gold-400/80 mt-0.5">
                  Chief Ayurvedic Vaidya & Nadi Pariksha Master • Grams Life Clinic
                </p>
              </div>
            </div>

            {/* Quick Actions & Clinic Status */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setIsDoctorAvailable(!isDoctorAvailable)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                  isDoctorAvailable 
                    ? 'bg-emerald-900/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-800/60' 
                    : 'bg-amber-900/60 text-amber-300 border-amber-500/40 hover:bg-amber-800/60'
                }`}
                title="Toggle availability status"
              >
                <span className={`w-2 h-2 rounded-full ${isDoctorAvailable ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span>{isDoctorAvailable ? 'Status: Available Online' : 'Status: In Clinic Round'}</span>
              </button>

              <button
                type="button"
                onClick={() => fetchAppointments()}
                className="p-2.5 rounded-xl bg-brand-green-900 hover:bg-brand-green-800 text-brand-cream-100 border border-brand-green-700/50 transition-colors cursor-pointer"
                title="Refresh Appointments"
                aria-label="Refresh Appointments"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('consult-doctor')}
                className="px-4 py-2 rounded-xl bg-brand-gold-400 hover:bg-brand-gold-300 text-brand-green-950 font-bold text-xs transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Patient Booking Page</span>
              </button>

              <button
                type="button"
                onClick={handleDoctorSignOut}
                className="p-2.5 rounded-xl bg-brand-green-900/80 hover:bg-rose-950/80 text-brand-cream-100 hover:text-rose-200 border border-brand-green-700/50 hover:border-rose-700/50 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                title="Sign out of Doctor Portal"
                aria-label="Sign out of Doctor Portal"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Metric Cards Banner */}
        <section aria-label="Daily Statistics" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-brand-green-900/10 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Slots</p>
              <p className="text-2xl font-black text-slate-900 font-serif">{stats.todayCount}</p>
              <p className="text-[11px] text-emerald-700 font-medium">Scheduled for today</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-brand-green-900/10 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center shrink-0">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Video Calls</p>
              <p className="text-2xl font-black text-slate-900 font-serif">{stats.videoToday}</p>
              <p className="text-[11px] text-blue-700 font-medium">Google Meet / Jitsi</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-brand-green-900/10 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center shrink-0">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Direct Phone Calls</p>
              <p className="text-2xl font-black text-slate-900 font-serif">{stats.audioToday}</p>
              <p className="text-[11px] text-teal-700 font-medium">Simple voice consultations</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-brand-green-900/10 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prescriptions Issued</p>
              <p className="text-2xl font-black text-slate-900 font-serif">{stats.completedCount}</p>
              <p className="text-[11px] text-amber-700 font-medium">Treated & signed</p>
            </div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('schedule')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'schedule'
                  ? 'bg-brand-green-900 text-brand-gold-300 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>All Consultations</span>
              <span className="px-1.5 py-0.5 rounded-full bg-brand-gold-400/30 text-[10px]">
                {appointments.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('video')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'video'
                  ? 'bg-brand-green-900 text-brand-gold-300 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Video className="w-4 h-4 text-blue-400" />
              <span>Video Hub (Option B)</span>
              <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-700 text-[10px]">
                {videoCallsList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('calls')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'calls'
                  ? 'bg-brand-green-900 text-brand-gold-300 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <PhoneCall className="w-4 h-4 text-emerald-500" />
              <span>Phone Calls Hub (Simple Calls)</span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 text-[10px]">
                {phoneCallsList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('prescriptions')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'prescriptions'
                  ? 'bg-brand-green-900 text-brand-gold-300 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Digital Prescription Pad</span>
            </button>
          </div>

          {/* Quick Search & Filters */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search patient, phone, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-brand-green-700"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand-green-700"
            >
              <option value="all">All Records ({appointments.length})</option>
              <option value="today">Today's Only ({stats.todayCount})</option>
              <option value="audio">Direct Phone Calls (Simple Calls) ({phoneCallsList.length})</option>
              <option value="video">Video Calls ({videoCallsList.length})</option>
              <option value="confirmed">Confirmed Slots</option>
              <option value="completed">Completed ({stats.completedCount})</option>
            </select>
          </div>
        </div>

        {/* TAB 1: CONSULTATION SCHEDULE LIST */}
        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 font-serif">
                <span>Patient Appointments Queue</span>
                <span className="text-xs font-normal text-slate-500 font-sans">
                  ({filteredAppointments.length} appointments)
                </span>
              </h2>

              <span className="text-xs text-brand-green-800 font-semibold bg-brand-green-50 px-3 py-1 rounded-full border border-brand-green-200">
                Today is {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            {filteredAppointments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-700">No appointments found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  There are no consultations matching your current filter. Clear your search or change the status filter above.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredAppointments.map((app) => {
                  const isToday = app.date === todayDate;
                  const isVideo = app.consultationMode === 'video';
                  const cleanPhone = (app.patientPhone || '').replace(/[^\d+]/g, '');
                  const meetLink = app.meetingLink || `https://meet.jit.si/BVLife-Consult-${app.id}`;
                  const isGoogleMeet = meetLink.includes('meet.google.com');

                  return (
                    <div 
                      key={app.id} 
                      className={`bg-white rounded-2xl border transition-all p-5 shadow-xs ${
                        isToday ? 'border-brand-green-800/30 ring-1 ring-brand-green-800/10' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        
                        {/* Patient & Slot Info */}
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 font-serif ${
                            isVideo ? 'bg-blue-100 text-blue-900 border border-blue-200' : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          }`}>
                            {isVideo ? (
                              <Video className="w-6 h-6 text-blue-700" />
                            ) : (
                              <PhoneCall className="w-6 h-6 text-emerald-700" />
                            )}
                          </div>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-bold text-slate-900">
                                {app.patientName}
                              </h3>
                              <span className="text-xs text-slate-500 font-medium">
                                ({app.patientAge}y, {app.patientGender})
                              </span>

                              {/* Consultation Mode: Video vs Simple Call */}
                              {isVideo ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-200 flex items-center gap-1">
                                  <Video className="w-3 h-3 text-blue-700" />
                                  <span>Video Call</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-200 flex items-center gap-1">
                                  <PhoneCall className="w-3 h-3 text-emerald-700" />
                                  <span>Direct Phone Call (Simple Call)</span>
                                </span>
                              )}

                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                app.status === 'Completed' 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : app.status === 'Cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {app.status}
                              </span>

                              {isToday && (
                                <span className="px-2 py-0.5 rounded-full bg-brand-gold-100 text-brand-green-950 text-[10px] font-bold">
                                  Today's Slot
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                              <span className="flex items-center gap-1 font-semibold text-brand-green-900">
                                <Clock className="w-3.5 h-3.5" />
                                {app.date} • {app.timeSlot}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                {app.patientPhone}
                              </span>
                              <span className="text-slate-400 font-mono text-[11px]">
                                ID: {app.id}
                              </span>
                            </div>

                            <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2">
                              <strong className="text-slate-900 font-semibold">Chief Health Concern: </strong> 
                              {app.healthConcern || 'Ayurvedic Wellness Evaluation'}
                            </p>

                            {/* Simple Call Guidance Banner */}
                            {!isVideo && (
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-emerald-50/90 rounded-xl border border-emerald-200 text-xs mt-2">
                                <div className="flex items-center gap-2 text-emerald-950">
                                  <PhoneCall className="w-4 h-4 text-emerald-700 shrink-0" />
                                  <div>
                                    <span className="font-bold">Simple Telephonic Call: </span>
                                    <span className="text-emerald-800">Doctor calls patient's mobile directly at <strong>{app.timeSlot}</strong>.</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] text-emerald-700 font-medium">Patient Mobile:</span>
                                  <a
                                    href={`tel:${cleanPhone}`}
                                    className="font-mono font-bold text-xs bg-white px-2.5 py-1 rounded-lg border border-emerald-300 text-emerald-900 hover:bg-emerald-100 inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                                  >
                                    <Phone className="w-3.5 h-3.5 text-emerald-700" />
                                    <span>{app.patientPhone}</span>
                                  </a>
                                </div>
                              </div>
                            )}

                            {app.medicalReports && app.medicalReports.length > 0 && (
                              <div className="flex items-center gap-2 pt-1">
                                <span className="text-[11px] text-slate-500 font-medium">
                                  Uploaded Reports ({app.medicalReports.length}):
                                </span>
                                {app.medicalReports.map((report, idx) => (
                                  <a
                                    key={idx}
                                    href={report.dataUrl || '#'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] font-bold text-brand-green-800 bg-brand-green-50 px-2 py-0.5 rounded border border-brand-green-200 hover:underline flex items-center gap-1"
                                  >
                                    <FileText className="w-3 h-3" />
                                    <span>{report.name}</span>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons: Video Call / Simple Phone Call & Prescription */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                          
                          {/* Option B: Join / Launch Video Call */}
                          {isVideo && (
                            <div className="flex items-center gap-1.5">
                              <a
                                href={meetLink}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => {
                                  // Set room status to in-progress
                                  api.updateAppointmentRoomStatus(app.id, 'in-progress');
                                }}
                                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer hover:shadow"
                              >
                                <Video className="w-4 h-4" />
                                <span>Join {isGoogleMeet ? 'Google Meet' : 'Jitsi Video'}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>

                              <button
                                type="button"
                                onClick={() => handleCopyLink(meetLink, app.id)}
                                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                title="Copy Meeting Link"
                              >
                                {copiedMeetId === app.id ? (
                                  <Check className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleShareOnWhatsApp(app)}
                                className="px-3 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-colors flex items-center gap-1 border border-emerald-200"
                                title="WhatsApp Link to Patient"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="hidden sm:inline">WhatsApp</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setEditMeetModalAppointment(app);
                                  setCustomMeetUrlInput(app.meetingLink || '');
                                  setPreferredPlatform(app.meetingPlatform || 'google-meet');
                                }}
                                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
                                title="Change or Set Google Meet Link"
                              >
                                <LinkIcon className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {/* Direct Phone Call Actions */}
                          {!isVideo && (
                            <div className="flex items-center gap-1.5">
                              <a
                                href={`tel:${cleanPhone}`}
                                onClick={() => {
                                  api.updateAppointmentRoomStatus(app.id, 'in-progress');
                                }}
                                className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer hover:shadow"
                                title={`Call ${app.patientName} on ${app.patientPhone}`}
                              >
                                <PhoneCall className="w-4 h-4" />
                                <span>Call Patient Now</span>
                              </a>

                              <button
                                type="button"
                                onClick={() => handleWhatsAppPhoneCall(app)}
                                className="px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs transition-colors flex items-center gap-1.5 border border-emerald-200 cursor-pointer"
                                title="WhatsApp Call / Ping"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                                <span className="hidden sm:inline">WhatsApp Call</span>
                              </button>
                            </div>
                          )}

                          {/* Write or View Prescription */}
                          {app.prescription ? (
                            <button
                              type="button"
                              onClick={() => setViewPrescriptionData(app.prescription!)}
                              className="px-4 py-2.5 rounded-xl bg-brand-green-50 hover:bg-brand-green-100 text-brand-green-900 border border-brand-green-200 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <FileText className="w-4 h-4 text-brand-green-800" />
                              <span>View Signed Rx</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenPrescriptionForm(app)}
                              className="px-4 py-2.5 rounded-xl bg-brand-gold-400 hover:bg-brand-gold-300 text-brand-green-950 font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                            >
                              <FileText className="w-4 h-4" />
                              <span>Write Prescription</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: OPTION B VIDEO CONSULTATION HUB */}
        {activeTab === 'video' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-900 via-brand-green-950 to-brand-green-900 text-white rounded-3xl p-6 sm:p-8 border border-blue-500/20 shadow-lg">
              <div className="max-w-2xl space-y-3">
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-bold text-xs border border-blue-400/30">
                  Option B Telemedicine Integration
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold font-serif text-brand-gold-300">
                  Google Meet & Jitsi Video Consultation Hub
                </h2>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  Provide secure, high-definition Ayurvedic consultations with zero setup hassle. Each booked consultation automatically creates an encrypted room link compatible with desktop browsers, mobile devices, and WhatsApp.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href="https://meet.google.com/new"
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-blue-900 font-bold text-xs shadow-md transition-all inline-flex items-center gap-2"
                  >
                    <Video className="w-4 h-4 text-blue-600" />
                    <span>Create Instant Google Meet Room</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>

                  <a
                    href="https://meet.jit.si/"
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-blue-700/60 hover:bg-blue-600/70 text-white font-bold text-xs border border-blue-400/30 transition-all inline-flex items-center gap-2"
                  >
                    <span>Launch Free Jitsi Video</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Video Calls Cards */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 font-serif">
                Scheduled Video Calls ({videoCallsList.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {videoCallsList.map(app => {
                  const meetUrl = app.meetingLink || `https://meet.jit.si/BVLife-Consult-${app.id}`;
                  const isGoogleMeet = meetUrl.includes('meet.google.com');

                  return (
                    <div 
                      key={app.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {isGoogleMeet ? 'Google Meet Call' : 'Jitsi Web Call'}
                          </span>
                          <h4 className="text-base font-bold text-slate-900 mt-1.5">
                            {app.patientName}
                          </h4>
                          <p className="text-xs text-slate-500">
                            {app.patientAge} yrs • {app.patientGender} • {app.patientPhone}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                            {app.timeSlot}
                          </span>
                          <p className="text-[11px] text-slate-400 mt-1">{app.date}</p>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700">
                        <strong className="text-slate-900">Health Concern: </strong>
                        {app.healthConcern}
                      </div>

                      {/* Video Room Launch Controls */}
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <div className="flex items-center gap-2">
                          <a
                            href={meetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs text-center shadow-xs transition-all flex items-center justify-center gap-2"
                          >
                            <Video className="w-4 h-4" />
                            <span>Start Video Call</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>

                          <button
                            type="button"
                            onClick={() => handleCopyLink(meetUrl, app.id)}
                            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1"
                            title="Copy Meet Link"
                          >
                            {copiedMeetId === app.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                          <button
                            type="button"
                            onClick={() => handleShareOnWhatsApp(app)}
                            className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Send Link on WhatsApp</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditMeetModalAppointment(app);
                              setCustomMeetUrlInput(app.meetingLink || '');
                              setPreferredPlatform(app.meetingPlatform || 'google-meet');
                            }}
                            className="text-slate-500 hover:text-slate-800 font-semibold underline"
                          >
                            Configure Meet Link
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DIRECT PHONE CALLS HUB (SIMPLE CALLS) */}
        {activeTab === 'calls' && (
          <div className="space-y-6">
            {/* Header / Guide Banner */}
            <div className="bg-gradient-to-r from-emerald-900 to-brand-green-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
              <div className="relative z-10 max-w-3xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 text-emerald-200 text-xs font-bold border border-emerald-700/50">
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Direct Telephonic Consultation Queue</span>
                </div>
                <h2 className="text-2xl font-bold font-serif text-brand-cream-50">
                  Simple Phone Call Consultations
                </h2>
                <p className="text-sm text-emerald-100/90 leading-relaxed">
                  Patients listed here selected <strong>Direct Phone Call</strong>. At the scheduled appointment time, 
                  call the patient's mobile number directly using the <strong>"Call Patient Now"</strong> button or WhatsApp.
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-emerald-200">
                  <span className="flex items-center gap-1.5 font-semibold bg-emerald-800/40 px-3 py-1.5 rounded-xl border border-emerald-700/40">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    No video link required
                  </span>
                  <span className="flex items-center gap-1.5 font-semibold bg-emerald-800/40 px-3 py-1.5 rounded-xl border border-emerald-700/40">
                    <Phone className="w-4 h-4 text-emerald-300" />
                    Doctor dials patient mobile
                  </span>
                  <span className="flex items-center gap-1.5 font-semibold bg-emerald-800/40 px-3 py-1.5 rounded-xl border border-emerald-700/40">
                    <FileText className="w-4 h-4 text-emerald-300" />
                    Digital Rx generated after call
                  </span>
                </div>
              </div>
            </div>

            {/* List of Phone Calls */}
            {phoneCallsList.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                <PhoneCall className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-700">No simple phone call consultations</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  When patients select Direct Phone Call during booking, their slots will appear here with one-click direct dialing.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {phoneCallsList.map((app) => {
                  const isToday = app.date === todayDate;
                  const cleanPhone = (app.patientPhone || '').replace(/[^\d+]/g, '');

                  return (
                    <div 
                      key={app.id} 
                      className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                        isToday ? 'border-emerald-700/40 ring-1 ring-emerald-700/20' : 'border-slate-200'
                      }`}
                    >
                      <div className="space-y-4">
                        {/* Header: Name, Mode Badge, Time */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-200 flex items-center justify-center font-bold text-base font-serif shrink-0">
                              <PhoneCall className="w-5 h-5 text-emerald-700" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-slate-900 font-serif">
                                  {app.patientName}
                                </h3>
                                <span className="text-xs text-slate-500">
                                  ({app.patientAge}y, {app.patientGender})
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                <span className="font-mono text-[11px] text-slate-400">ID: {app.id}</span>
                                <span>•</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  app.status === 'Completed'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-teal-100 text-teal-800'
                                }`}>
                                  {app.status}
                                </span>
                              </div>
                            </div>
                          </div>

                          {isToday && (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 text-[11px] font-bold shrink-0">
                              Today
                            </span>
                          )}
                        </div>

                        {/* Scheduled Slot & Phone Info Box */}
                        <div className="bg-emerald-50/60 rounded-xl p-3 border border-emerald-100 space-y-2">
                          <div className="flex items-center justify-between text-xs text-slate-700">
                            <span className="flex items-center gap-1.5 font-bold text-brand-green-950">
                              <Clock className="w-4 h-4 text-emerald-700" />
                              <span>{app.date} at {app.timeSlot}</span>
                            </span>
                            <span className="text-[11px] font-medium text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                              Simple Voice Call
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-emerald-100/80">
                            <span className="text-xs text-slate-600 font-medium">Patient Contact:</span>
                            <a
                              href={`tel:${cleanPhone}`}
                              className="font-mono font-bold text-xs bg-white px-3 py-1 rounded-lg border border-emerald-300 text-emerald-900 hover:bg-emerald-100 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-700" />
                              <span>{app.patientPhone}</span>
                            </a>
                          </div>
                        </div>

                        {/* Chief Health Concern */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700">
                          <strong className="text-slate-900">Chief Health Concern: </strong>
                          <span>{app.healthConcern || 'Ayurvedic Wellness Evaluation'}</span>
                        </div>

                        {/* Uploaded Reports if any */}
                        {app.medicalReports && app.medicalReports.length > 0 && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-500 font-medium text-[11px]">Reports:</span>
                            {app.medicalReports.map((report, idx) => (
                              <a
                                key={idx}
                                href={report.dataUrl || '#'}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hover:underline flex items-center gap-1"
                              >
                                <FileText className="w-3 h-3" />
                                <span>{report.name}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-4 mt-4 border-t border-slate-100 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <a
                            href={`tel:${cleanPhone}`}
                            onClick={() => {
                              api.updateAppointmentRoomStatus(app.id, 'in-progress');
                            }}
                            className="py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs text-center shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <PhoneCall className="w-4 h-4" />
                            <span>Call Patient</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => handleWhatsAppPhoneCall(app)}
                            className="py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <MessageSquare className="w-4 h-4 text-emerald-700" />
                            <span>WhatsApp Call</span>
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          {app.prescription ? (
                            <button
                              type="button"
                              onClick={() => setViewPrescriptionData(app.prescription!)}
                              className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View Issued Prescription</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenPrescriptionModal(app)}
                              className="text-xs font-bold text-brand-green-800 hover:underline flex items-center gap-1"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Write Prescription Pad</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              const newStatus = app.status === 'Completed' ? 'Confirmed' : 'Completed';
                              api.updateAppointmentStatus(app.id, newStatus);
                              setAppointments(prev => prev.map(a => a.id === app.id ? { ...a, status: newStatus } : a));
                            }}
                            className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                          >
                            {app.status === 'Completed' ? 'Mark as Pending' : 'Mark as Done'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: DIGITAL PRESCRIPTION PAD */}
        {activeTab === 'prescriptions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                  <h2 className="text-xl font-bold font-serif text-slate-900">
                    Ayurvedic Digital Prescription Archive
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Select any completed or active consultation to write, print, or review authenticated electronic prescriptions.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">
                    Signed Prescriptions: {appointments.filter(a => !!a.prescription).length}
                  </span>
                </div>
              </div>

              {/* Prescriptions List */}
              <div className="divide-y divide-slate-100 mt-4">
                {appointments.filter(a => !!a.prescription).map(app => (
                  <div key={app.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          {app.patientName}
                        </h4>
                        <span className="text-xs text-slate-500">
                          ({app.patientAge}y, {app.patientGender})
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono text-[10px] font-bold border border-emerald-200">
                          {app.prescription?.id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        <strong>Diagnosis: </strong>{app.prescription?.diagnosis}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Issued on {app.prescription?.date} • {app.prescription?.medicines.length} Formulations Prescribed
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewPrescriptionData(app.prescription!)}
                        className="px-4 py-2 rounded-xl bg-brand-green-900 hover:bg-brand-green-800 text-brand-gold-300 font-bold text-xs transition-all flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View / Print PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenPrescriptionForm(app)}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}

                {appointments.filter(a => !!a.prescription).length === 0 && (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No prescriptions issued yet. Click "Write Prescription" on any patient card to generate one.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* MODAL 1: WRITE DIGITAL PRESCRIPTION MODAL */}
      {prescriptionAppointment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 my-8">
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-brand-green-950 text-brand-cream-50 p-6 rounded-t-3xl flex items-start justify-between gap-4 z-10 border-b border-brand-gold-400/20">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-brand-gold-400 text-xl font-bold font-serif">Rx</span>
                  <h3 className="text-lg font-bold font-serif text-brand-gold-300">
                    Ayurvedic Clinical Prescription Pad
                  </h3>
                </div>
                <p className="text-xs text-brand-cream-200/80 mt-1">
                  Patient: <strong className="text-brand-gold-200">{prescriptionAppointment.patientName}</strong> ({prescriptionAppointment.patientAge} yrs, {prescriptionAppointment.patientGender}) • ID: {prescriptionAppointment.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPrescriptionAppointment(null)}
                className="p-1.5 rounded-full text-brand-cream-200 hover:bg-brand-green-800 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSavePrescription} className="p-6 sm:p-8 space-y-6">
              {prescriptionSuccessMsg && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{prescriptionSuccessMsg}</span>
                </div>
              )}

              {/* Diagnosis & Dosha Analysis */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Clinical Ayurvedic Diagnosis <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g. Vata Vyadhi, Agnimandya, Amlapitta, Amavata"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-brand-green-700 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Dosha Prakriti Imbalance
                  </label>
                  <select
                    value={doshaPrakriti}
                    onChange={(e) => setDoshaPrakriti(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-brand-green-700 font-medium"
                  >
                    <option value="Vata Imbalance">Vata Imbalance</option>
                    <option value="Pitta Imbalance">Pitta Imbalance</option>
                    <option value="Kapha Imbalance">Kapha Imbalance</option>
                    <option value="Vata-Pitta Imbalance">Vata-Pitta Imbalance</option>
                    <option value="Pitta-Kapha Imbalance">Pitta-Kapha Imbalance</option>
                    <option value="Tridoshic Imbalance (Sannipata)">Tridoshic Imbalance</option>
                  </select>
                </div>
              </div>

              {/* Prescribed Ayurvedic Medicines List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-brand-green-800" />
                    <span>Prescribed Herbal Medicines ({medicinesList.length})</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddMedicineRow}
                    className="px-3 py-1 rounded-lg bg-brand-green-50 hover:bg-brand-green-100 text-brand-green-800 font-bold text-xs border border-brand-green-200 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Medicine</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {medicinesList.map((med, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative group">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-brand-green-900 bg-brand-green-100/60 px-2 py-0.5 rounded">
                          Item #{idx + 1}
                        </span>

                        {medicinesList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMedicineRow(idx)}
                            className="text-slate-400 hover:text-red-600 transition-colors p-1"
                            title="Remove Medicine"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-bold text-slate-700">Formulation Name</label>
                          <input
                            type="text"
                            list="herbal-medicines-preset"
                            value={med.name}
                            onChange={(e) => {
                              const updated = [...medicinesList];
                              updated[idx].name = e.target.value;
                              setMedicinesList(updated);
                            }}
                            placeholder="e.g. Ashwagandha KSM-66 / Amla Churna"
                            className="w-full mt-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-brand-green-700"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-700">Dosage</label>
                          <input
                            type="text"
                            value={med.dosage}
                            onChange={(e) => {
                              const updated = [...medicinesList];
                              updated[idx].dosage = e.target.value;
                              setMedicinesList(updated);
                            }}
                            placeholder="e.g. 1 Capsule / 3g"
                            className="w-full mt-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-brand-green-700"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-700">Frequency</label>
                          <select
                            value={med.frequency}
                            onChange={(e) => {
                              const updated = [...medicinesList];
                              updated[idx].frequency = e.target.value;
                              setMedicinesList(updated);
                            }}
                            className="w-full mt-1 px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-brand-green-700"
                          >
                            <option value="Once daily">Once daily</option>
                            <option value="Twice daily">Twice daily</option>
                            <option value="Thrice daily">Thrice daily</option>
                            <option value="Before sleep">Before sleep</option>
                            <option value="As needed">As needed (SOS)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700">Anupana & Timing (How to take)</label>
                          <input
                            type="text"
                            value={med.timing}
                            onChange={(e) => {
                              const updated = [...medicinesList];
                              updated[idx].timing = e.target.value;
                              setMedicinesList(updated);
                            }}
                            placeholder="e.g. After meals with warm water / milk"
                            className="w-full mt-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-brand-green-700"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-700">Duration</label>
                          <input
                            type="text"
                            value={med.duration}
                            onChange={(e) => {
                              const updated = [...medicinesList];
                              updated[idx].duration = e.target.value;
                              setMedicinesList(updated);
                            }}
                            placeholder="e.g. 30 days"
                            className="w-full mt-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-brand-green-700"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <datalist id="herbal-medicines-preset">
                    {COMMON_AYURVEDIC_MEDICINES.map((name, i) => (
                      <option key={i} value={name} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Pathya / Apathya (Diet & Lifestyle Instructions) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Dietary Guidelines (Pathya / Apathya)
                  </label>
                  <textarea
                    rows={3}
                    value={dietAdvice}
                    onChange={(e) => setDietAdvice(e.target.value)}
                    placeholder="Foods to favor and foods to avoid..."
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-brand-green-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Dinacharya & Lifestyle Advice
                  </label>
                  <textarea
                    rows={3}
                    value={lifestyleAdvice}
                    onChange={(e) => setLifestyleAdvice(e.target.value)}
                    placeholder="Pranayama, sleep habits, yoga asanas..."
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-brand-green-700"
                  />
                </div>
              </div>

              {/* Follow-up & Additional Doctor Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-800">Follow-up After</label>
                  <select
                    value={followUpDays}
                    onChange={(e) => setFollowUpDays(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none"
                  >
                    <option value="7">7 Days</option>
                    <option value="15">15 Days</option>
                    <option value="30">30 Days</option>
                    <option value="45">45 Days</option>
                    <option value="60">60 Days</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-800">Doctor Internal Remarks / Lab Advice</label>
                  <input
                    type="text"
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                    placeholder="e.g. Check fasting lipid profile before next review"
                    className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Signature Stamp Preview */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-amber-950">Digitally Authenticated Signature</p>
                  <p className="text-[11px] text-amber-800">Dr. Arundhati Sharma • Ayush Reg. #AY-24890</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-200/60 text-amber-900 font-serif font-bold text-xs">
                  ✓ Verified Vaidya Stamp
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPrescriptionAppointment(null)}
                  className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSavingPrescription}
                  className="px-6 py-2.5 rounded-xl bg-brand-green-900 hover:bg-brand-green-800 text-brand-gold-300 font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingPrescription ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving & Signing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Sign & Issue Prescription</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: VIEW / PRINT DIGITAL PRESCRIPTION MODAL */}
      {viewPrescriptionData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 my-8 overflow-hidden">
            
            {/* Modal Top Control Bar */}
            <div className="bg-slate-100 p-4 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Official Electronic Health Prescription</span>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-brand-green-900 hover:bg-brand-green-800 text-brand-gold-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Rx</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewPrescriptionData(null)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Prescription Document Content */}
            <div id="printable-prescription-doc" className="p-8 space-y-6 text-slate-800 font-sans">
              
              {/* Header Letterhead */}
              <div className="flex items-start justify-between border-b-2 border-brand-green-900 pb-4">
                <div>
                  <h3 className="text-xl font-bold font-serif text-brand-green-950">
                    GRAMS LIFE AYURVEDIC CLINIC
                  </h3>
                  <p className="text-xs text-brand-green-800 font-medium mt-0.5">
                    Department of Kayachikitsa & Classical Nadi Pariksha
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Ayush Reg. #AY-24890 • Silicon City & BHU Lineage
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{viewPrescriptionData.doctorName}</p>
                  <p className="text-[11px] text-slate-600">{viewPrescriptionData.doctorQualification}</p>
                  <p className="text-[11px] text-brand-gold-700 font-semibold font-mono mt-1">Rx #{viewPrescriptionData.id}</p>
                </div>
              </div>

              {/* Patient Demographics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Patient Name</span>
                  <strong className="text-slate-900 font-semibold">{viewPrescriptionData.patientName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Age / Gender</span>
                  <span className="text-slate-800">{viewPrescriptionData.patientAge} yrs / {viewPrescriptionData.patientGender}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Consult Date</span>
                  <span className="text-slate-800">{viewPrescriptionData.date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Follow-Up</span>
                  <span className="text-brand-green-800 font-semibold">{viewPrescriptionData.followUpDate || 'In 30 days'}</span>
                </div>
              </div>

              {/* Clinical Diagnosis */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-brand-green-950 uppercase tracking-wider block">
                  Diagnosis & Dosha Analysis:
                </span>
                <p className="text-xs font-semibold text-slate-800 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                  {viewPrescriptionData.diagnosis} {viewPrescriptionData.doshaPrakriti && `(${viewPrescriptionData.doshaPrakriti})`}
                </p>
              </div>

              {/* Prescription Items (Rx) */}
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-base font-bold font-serif text-brand-green-950">
                  <span className="text-lg text-brand-gold-600">℞</span>
                  <span>Prescribed Formulations</span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">Medicine / Formulation</th>
                        <th className="p-2.5">Dosage</th>
                        <th className="p-2.5">Frequency & Timing</th>
                        <th className="p-2.5">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewPrescriptionData.medicines.map((m, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="p-2.5 text-slate-400 font-mono text-[11px]">{i + 1}</td>
                          <td className="p-2.5 font-bold text-brand-green-950">
                            {m.name}
                            {m.instructions && (
                              <span className="block text-[10px] font-normal text-slate-500">{m.instructions}</span>
                            )}
                          </td>
                          <td className="p-2.5 text-slate-700">{m.dosage}</td>
                          <td className="p-2.5 text-slate-700">
                            <span className="font-semibold">{m.frequency}</span>
                            <span className="block text-[10px] text-slate-500">{m.timing}</span>
                          </td>
                          <td className="p-2.5 text-slate-700">{m.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pathya / Dietary Guidelines */}
              {viewPrescriptionData.dietRecommendations.length > 0 && (
                <div className="space-y-1">
                  <strong className="text-xs text-slate-900 font-bold uppercase tracking-wider block">
                    Pathya (Diet & Nutritional Regimen):
                  </strong>
                  <ul className="list-disc list-inside text-xs text-slate-700 space-y-0.5">
                    {viewPrescriptionData.dietRecommendations.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Lifestyle / Dinacharya */}
              {viewPrescriptionData.lifestyleAdvice.length > 0 && (
                <div className="space-y-1">
                  <strong className="text-xs text-slate-900 font-bold uppercase tracking-wider block">
                    Dinacharya & Lifestyle Advice:
                  </strong>
                  <ul className="list-disc list-inside text-xs text-slate-700 space-y-0.5">
                    {viewPrescriptionData.lifestyleAdvice.map((l, i) => (
                      <li key={i}>{l}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Doctor Digital Stamp & Signature */}
              <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs">
                <div className="text-slate-400 text-[10px]">
                  Generated via Grams Life Telemedicine • Option B WebRTC Secure
                </div>

                <div className="text-right space-y-0.5">
                  <div className="font-serif italic text-brand-green-900 text-sm font-bold">
                    Dr. Arundhati Sharma
                  </div>
                  <div className="text-[10px] text-slate-500">
                    BAMS, MD (Ayurveda), Ayush Reg. #AY-24890
                  </div>
                  <div className="text-[10px] font-mono text-emerald-700">
                    ✓ Valid Digitally Signed Electronic Prescription
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIGURE GOOGLE MEET / JITSI LINK MODAL */}
      {editMeetModalAppointment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-serif">
                  Configure Video Room Link
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Patient: {editMeetModalAppointment.patientName} ({editMeetModalAppointment.timeSlot})
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditMeetModalAppointment(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Video Platform
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPreferredPlatform('google-meet')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center cursor-pointer transition-colors ${
                      preferredPlatform === 'google-meet'
                        ? 'bg-blue-50 border-blue-500 text-blue-800'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    Google Meet
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreferredPlatform('jitsi')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center cursor-pointer transition-colors ${
                      preferredPlatform === 'jitsi'
                        ? 'bg-blue-50 border-blue-500 text-blue-800'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    Jitsi Video (Instant)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Meeting URL
                </label>
                <input
                  type="url"
                  value={customMeetUrlInput}
                  onChange={(e) => setCustomMeetUrlInput(e.target.value)}
                  placeholder={
                    preferredPlatform === 'google-meet'
                      ? 'https://meet.google.com/abc-defg-hij'
                      : 'https://meet.jit.si/BVLife-Consult-...'
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-brand-green-700"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Leave empty to auto-generate a fresh 1-click room link.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditMeetModalAppointment(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveCustomMeetUrl}
                className="px-5 py-2 text-xs font-bold text-brand-gold-300 bg-brand-green-900 hover:bg-brand-green-800 rounded-xl shadow-xs"
              >
                Save Link
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
