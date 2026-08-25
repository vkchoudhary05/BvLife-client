/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, ShoppingCart, User, Sparkles, LogOut, LayoutDashboard, 
  Menu, X, Home, Package, BookOpen, Info, Phone, ChevronDown, 
  ChevronRight, ArrowLeft, Stethoscope, Layers, ShieldCheck, Flame, 
  Activity, Moon, Users, HeartPulse, Sparkle, Wind, Grid, Heart
} from 'lucide-react';
import { User as UserType, CartItem, WebsiteSettings, Product } from '../types';
import { Language, t } from '../lib/translations';
import { Logo } from './Logo';

// Canonical mapping for database categories with icons and translations
export interface CategoryMeta {
  key: string;
  name: string;
  hindiName: string;
  iconName: string;
  badge?: string;
}

const KNOWN_CATEGORIES_META: Record<string, { hindiName: string; iconName: string; badge?: string }> = {
  'Immunity': { hindiName: 'रोग प्रतिरोधक क्षमता', iconName: 'ShieldCheck', badge: 'Popular' },
  'Skin Care': { hindiName: 'त्वचा की देखभाल', iconName: 'Sparkles' },
  'Hair Care': { hindiName: 'बालों की देखभाल', iconName: 'Sparkle' },
  'Digestion': { hindiName: 'पाचन स्वास्थ्य', iconName: 'Flame' },
  "Women's Health": { hindiName: 'महिला स्वास्थ्य', iconName: 'Users' },
  "Men's Health": { hindiName: 'पुरुष स्वास्थ्य', iconName: 'Activity' },
  'Diabetes': { hindiName: 'मधुमेह नियंत्रण', iconName: 'HeartPulse' },
  'Joint Care': { hindiName: 'संधिवात व दर्द निवारक', iconName: 'Activity' },
  'Brain & Memory': { hindiName: 'स्मृति एवं एकाग्रता', iconName: 'BookOpen' },
  'Sleep & Stress': { hindiName: 'तनाव व अनिद्रा', iconName: 'Moon' },
  'Sexual Wellness': { hindiName: 'पौरुष व ऊर्जा', iconName: 'Flame' },
  'Liver & Detox': { hindiName: 'यकृत शोधन', iconName: 'ShieldCheck' },
  'Heart Health': { hindiName: 'हृदय स्वास्थ्य', iconName: 'Heart' },
  'Respiratory Care': { hindiName: 'श्वसन तंत्र', iconName: 'Wind' },
};

const DEFAULT_DATABASE_CATEGORIES = [
  'Immunity',
  'Skin Care',
  'Hair Care',
  'Digestion',
  "Women's Health",
  'Diabetes',
  'Joint Care',
  'Brain & Memory',
  'Sleep & Stress',
  'Sexual Wellness',
  'Liver & Detox',
  'Heart Health',
  'Respiratory Care'
];

interface NavbarProps {
  currentUser: UserType | null;
  onNavigate: (page: string, params?: any) => void;
  cart: CartItem[];
  wishlist: string[]; // product IDs
  onOpenConsultant: () => void;
  onLogout: () => void;
  onSearch: (query: string) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  searchQuery?: string;
  settings?: WebsiteSettings;
  products?: Product[];
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onNavigate,
  cart,
  wishlist,
  onOpenConsultant,
  onLogout,
  onSearch,
  language,
  onLanguageChange,
  searchQuery = '',
  settings,
  products = []
}) => {
  const [searchVal, setSearchVal] = useState(searchQuery);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Mobile drawer state and view mode ('main' menu vs 'categories' only view)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [drawerView, setDrawerView] = useState<'main' | 'categories'>('main');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // Derive exact distinct categories that exist in database
  const availableCategories: CategoryMeta[] = useMemo(() => {
    let rawCategoryKeys: string[] = [];
    if (products && products.length > 0) {
      const set = new Set<string>();
      products.forEach(p => {
        if (p.category && p.category.trim()) {
          set.add(p.category.trim());
        }
      });
      rawCategoryKeys = Array.from(set);
    }
    
    // Fallback if products not loaded yet
    if (rawCategoryKeys.length === 0) {
      rawCategoryKeys = DEFAULT_DATABASE_CATEGORIES;
    }

    return rawCategoryKeys.map(key => {
      const meta = KNOWN_CATEGORIES_META[key] || {
        hindiName: key,
        iconName: 'Layers'
      };
      return {
        key,
        name: key,
        hindiName: meta.hindiName,
        iconName: meta.iconName,
        badge: meta.badge
      };
    });
  }, [products]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
        setIsMobileSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setSearchVal(searchQuery);
  }, [searchQuery]);

  // Lock body scroll and listen for Escape when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsMobileMenuOpen(false);
          setDrawerView('main');
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = original;
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      // Reset view to 'main' when drawer closes
      setDrawerView('main');
    }
  }, [isMobileMenuOpen]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = searchVal.trim().toLowerCase();
    if (
      cleanQuery.includes('admin') || 
      cleanQuery.includes('apothecary') || 
      cleanQuery.includes('director') || 
      cleanQuery.includes('staff') ||
      ['healer', 'control panel', 'gateway'].includes(cleanQuery)
    ) {
      setSearchVal('');
      onSearch('');
      onNavigate('admin');
      setIsMobileMenuOpen(false);
      setIsMobileSearchOpen(false);
      return;
    }
    onSearch(searchVal);
    setIsMobileSearchOpen(false);
  };

  const handleSelectCategory = (categoryKey: string) => {
    setShowCategoryDropdown(false);
    setIsMobileMenuOpen(false);
    setDrawerView('main');
    onNavigate('shop', { category: categoryKey });
  };

  const renderCategoryIcon = (iconName: string, className = "w-4 h-4") => {
    switch (iconName) {
      case 'ShieldCheck': return <ShieldCheck className={className} />;
      case 'Flame': return <Flame className={className} />;
      case 'Sparkles': return <Sparkles className={className} />;
      case 'Sparkle': return <Sparkle className={className} />;
      case 'BookOpen': return <BookOpen className={className} />;
      case 'Activity': return <Activity className={className} />;
      case 'Moon': return <Moon className={className} />;
      case 'Users': return <Users className={className} />;
      case 'HeartPulse': return <HeartPulse className={className} />;
      case 'Heart': return <Heart className={className} />;
      case 'Wind': return <Wind className={className} />;
      default: return <Layers className={className} />;
    }
  };

  return (
    <>
    <header id="site-header" className="sticky top-0 z-40 w-full bg-white backdrop-blur-md border-b border-brand-green-600/10">
      {/* Top Banner Alert - Running Marquee Line */}
      <div id="top-promo-banner" className="bg-gradient-to-br from-brand-green-800 via-brand-green-700 to-emerald-700 text-white text-[11px] sm:text-xs py-1.5 sm:py-2 px-0 overflow-hidden whitespace-nowrap border-b border-brand-gold-500/20 font-bold uppercase tracking-widest">
        <div className="flex animate-marquee select-none">
          <div className="flex shrink-0 items-center gap-10 sm:gap-16 px-4">
            <span className="text-white">|</span>
            <span>100% Pure Natural Herbs</span>
            <span className="text-white">|</span>
            <span>Authentic Ayurvedic Wellness</span>
            <span className="text-white">|</span>
            <span>Rich in Herbal Extracts</span>
            <span className="text-white">|</span>
            <span>No Synthetic Additives</span>
            <span className="text-white">|</span>
            <span>Traditionally Crafted</span>
            <span className="text-white">|</span>
            <span>Daily Holistic Health Support</span>
          </div>
          <div className="flex shrink-0 items-center gap-10 sm:gap-16 px-4" aria-hidden="true">
            <span className="text-white">|</span>
            <span>100% Pure Natural Herbs</span>
            <span className="text-white">|</span>
            <span>Authentic Ayurvedic Wellness</span>
            <span className="text-white">|</span>
            <span>Rich in Herbal Extracts</span>
            <span className="text-white">|</span>
            <span>No Synthetic Additives</span>
            <span className="text-white">|</span>
            <span>Traditionally Crafted</span>
            <span className="text-white">|</span>
            <span>Daily Holistic Health Support</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-18 gap-2 sm:gap-4">
          
          {/* Left Corner: Mobile Menu Button + Grams Life Logo */}
          <div className="flex items-center gap-1.5 sm:gap-2 mr-auto md:mr-0 shrink-0">
            {/* Mobile Menu Button - In LEFT Corner next to logo */}
            <button 
              onClick={() => {
                setIsMobileSearchOpen(false);
                setShowProfileMenu(false);
                setIsMobileMenuOpen(prev => !prev);
                setDrawerView('main');
              }}
              className="lg:hidden p-1.5 text-black-950 hover:text-brand-gold-600 active:scale-90 transition-transform focus:outline-none cursor-pointer flex items-center justify-center rounded-lg hover:bg-brand-green-50/70 shrink-0 touch-manipulation"
              aria-label={isMobileMenuOpen ? "Close Navigation Menu" : "Open Navigation Menu"}
              id="mobile-menu-trigger-left"
            >
              <Menu className="w-6.5 h-6.5 sm:w-7 sm:h-7" strokeWidth={2.2} />
            </button>

            {/* Brand Logo */}
            <div 
              id="brand-logo-container" 
              className="cursor-pointer flex items-center"
              onClick={() => onNavigate('home')}
            >
              <Logo variant="dark" />
            </div>
          </div>

          {/* Primary Navigation Links */}
          <nav className="hidden lg:flex items-center gap-3.5 xl:gap-5 text-[15px] font-medium text-black-950">
            <button 
              onClick={() => onNavigate('home')} 
              className="hover:text-brand-gold-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              {t('navHome', language)}
            </button>

            {/* Shop by Category - Desktop Dropdown (Shows ONLY database categories, no products) */}
            <div 
              ref={categoryDropdownRef} 
              className="relative"
              onMouseEnter={() => setShowCategoryDropdown(true)}
              onMouseLeave={() => setShowCategoryDropdown(false)}
            >
              <button 
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className={`flex items-center gap-1 hover:text-brand-gold-600 transition-colors cursor-pointer whitespace-nowrap py-2 ${showCategoryDropdown ? 'text-brand-gold-600 font-bold' : ''}`}
                aria-expanded={showCategoryDropdown}
              >
                <span>{language === 'hi' ? 'श्रेणियाँ' : 'Shop by Category'}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showCategoryDropdown ? 'rotate-180 text-brand-gold-600' : 'text-black-700'}`} />
              </button>

              {/* Desktop Categories-Only Dropdown (Clean grid of DB categories) */}
              {showCategoryDropdown && (
                <div 
                  className="absolute left-0 top-full mt-0 w-[420px] xl:w-[480px] bg-white rounded-2xl shadow-2xl border border-brand-green-600/15 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-brand-green-600/10">
                    <span className="text-xs uppercase font-bold tracking-wider text-black-800 flex items-center gap-1.5">
                      <Grid className="w-3.5 h-3.5 text-black-700" />
                      <span>{language === 'hi' ? 'आयुर्वेदिक श्रेणियाँ' : 'All Categories'}</span>
                    </span>
                    <span className="text-[11px] font-semibold text-black-600 bg-brand-green-50 px-2 py-0.5 rounded-full border border-brand-green-200/60">
                      {availableCategories.length} {language === 'hi' ? 'श्रेणियाँ उपलब्ध' : 'Categories in Store'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 max-h-[360px] overflow-y-auto pr-1">
                    {availableCategories.map((cat) => (
                      <button
                        key={cat.key}
                        onClick={() => handleSelectCategory(cat.key)}
                        className="group flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-left text-black-950 hover:bg-brand-green-50 hover:text-brand-gold-700 transition-all border border-transparent hover:border-brand-green-200/50"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="p-1.5 rounded-lg bg-brand-green-50 group-hover:bg-brand-green-700 group-hover:text-white text-black-800 transition-colors shrink-0">
                            {renderCategoryIcon(cat.iconName, "w-3.5 h-3.5")}
                          </span>
                          <span className="truncate">{language === 'hi' ? cat.hindiName : cat.name}</span>
                        </div>
                        <ChevronRight className="w-3 h-3 text-black-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-brand-green-600/10 mt-2.5 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setShowCategoryDropdown(false);
                        onNavigate('shop');
                      }}
                      className="text-xs font-bold text-black-800 hover:text-brand-gold-600 transition-colors flex items-center gap-1"
                    >
                      <span>{language === 'hi' ? 'सभी उत्पाद देखें' : 'View All Formulations'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => onNavigate('static', { page: 'blog' })} 
              className="hover:text-brand-gold-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              {t('navBlogs', language)}
            </button>

            <button 
              onClick={() => onNavigate('static', { page: 'about' })} 
              className="hover:text-brand-gold-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              {t('About', language)}
            </button>

            <button 
              onClick={() => onNavigate('static', { page: 'contact' })} 
              className="hover:text-brand-gold-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              {t('navContact', language)}
            </button>

            {/* Consult with Doctor in Nav - Positioned LAST */}
            <button 
              onClick={() => onNavigate('consult-doctor')} 
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-800 to-brand-green-900 text-brand-cream-50 hover:from-emerald-700 hover:to-brand-green-800 font-semibold text-xs shadow-sm hover:shadow transition-all border border-emerald-500/30 whitespace-nowrap cursor-pointer hover:scale-[1.02]"
              title="Book 1-on-1 Appointment with Ayurvedic Doctors"
            >
              <Stethoscope className="w-3.5 h-3.5 text-emerald-300 group-hover:rotate-12 transition-transform" />
              <span>{language === 'hi' ? 'डॉक्टर परामर्श' : 'Consult with Doctor'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>
          </nav>

          {/* Desktop & Mobile Action Icons (Search, Track Order, My Account, Cart) */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-2.5 shrink-0">
            
            {/* Search Icon & Dropdown Popover (Icon-only on both Desktop & Mobile) */}
            <div ref={mobileSearchRef} className="relative flex">
              <button 
                onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                className="p-1.5 sm:p-2 text-black-950 hover:text-brand-gold-600 transition-colors cursor-pointer shrink-0 rounded-lg sm:rounded-full hover:bg-brand-green-50"
                aria-label="Search Formulations"
                title="Search"
              >
                <Search className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-black-900" strokeWidth={2} />
              </button>

              {/* Search Dropdown/Popover */}
              {isMobileSearchOpen && (
                <div className="absolute right-0 top-full mt-2 w-[300px] sm:w-[360px] bg-white rounded-2xl shadow-2xl border border-brand-green-600/15 p-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <form onSubmit={handleSearchSubmit} className="relative">
                    <input
                      type="text"
                      placeholder={t('navSearchPlaceholder', language)}
                      value={searchVal}
                      onChange={(e) => setSearchVal(e.target.value)}
                      className="w-full pl-4 pr-10 py-2.5 rounded-full bg-brand-green-50/90 border border-brand-green-200 focus:outline-none focus:border-brand-green-700 text-xs sm:text-sm text-slate-900 placeholder-brand-green-600/50 shadow-inner"
                      autoFocus
                    />
                    <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-black-800 hover:text-brand-gold-600 transition-colors cursor-pointer p-1" aria-label="Submit Search">
                      <Search className="w-4 h-4" />
                    </button>
                  </form>
                  <div className="mt-2.5 flex items-center justify-between px-1 text-[11px] text-slate-500">
                    <span>Popular:</span>
                    <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                      {['Chyawanprash', 'Shilajit', 'Kumkumadi', 'Triphala'].map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => {
                            setSearchVal(term);
                            onSearch(term);
                            setIsMobileSearchOpen(false);
                          }}
                          className="px-2 py-0.5 rounded-full bg-brand-green-50 text-black-800 hover:bg-brand-green-100 font-medium text-[10px] transition-colors cursor-pointer whitespace-nowrap"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Track Order Icon - Present on both Desktop and Mobile */}
            <button 
              onClick={() => onNavigate('track-order')}
              className="p-1.5 sm:p-2 text-black-950 hover:text-brand-gold-600 transition-colors cursor-pointer shrink-0 rounded-lg sm:rounded-full hover:bg-brand-green-50"
              aria-label="Track Order"
              title="Track Order"
            >
              <Package className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-black-900" strokeWidth={2} />
            </button>

            {/* My Account Profile Icon */}
            <div ref={profileMenuRef} className="relative shrink-0">
              <button 
                onClick={() => {
                  if (currentUser) {
                    onNavigate('dashboard');
                  } else {
                    onNavigate('login');
                  }
                }}
                onMouseEnter={() => setShowProfileMenu(true)}
                className="p-1.5 sm:p-2 text-black-950 hover:text-brand-gold-600 transition-colors cursor-pointer flex items-center justify-center rounded-lg sm:rounded-full hover:bg-brand-green-50"
                aria-label="My Account"
                title={currentUser ? `Account: ${currentUser.fullName}` : "Sign In / My Account"}
              >
                <User className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-black-900" strokeWidth={2} />
              </button>

              {showProfileMenu && (
                <div 
                  className="absolute right-0 mt-2 w-64 bg-white border border-brand-green-600/10 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onMouseLeave={() => setShowProfileMenu(false)}
                >
                  {currentUser ? (
                    <>
                      <div className="px-4 py-2 border-b border-brand-green-600/10 flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-black-600 font-medium">My Account</p>
                          <p className="text-sm font-bold truncate text-black-800">{currentUser.fullName}</p>
                          <p className="text-[10px] text-black-600/70 truncate">{currentUser.email}</p>
                        </div>
                        <button
                          onClick={() => setShowProfileMenu(false)}
                          className="p-1 rounded-full text-black-600 hover:bg-brand-green-100/50 hover:text-black-800 transition-colors shrink-0"
                          aria-label="Close Profile Menu"
                        >
                          <X className="w-4.5 h-4.5" />
                        </button>
                      </div>
                      <button 
                        onClick={() => { setShowProfileMenu(false); onNavigate('dashboard'); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-black-800 hover:bg-brand-green-50 flex items-center gap-2 font-medium"
                      >
                        <LayoutDashboard className="w-4 h-4 text-black-600" />
                        <span>Customer Dashboard</span>
                      </button>

                      <button 
                        onClick={() => { setShowProfileMenu(false); onNavigate('dashboard', { tab: 'orders' }); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-black-800 hover:bg-brand-green-50 flex items-center gap-2 font-medium"
                      >
                        <Package className="w-4 h-4 text-black-600" />
                        <span>My Orders</span>
                      </button>

                      <button 
                        onClick={() => { setShowProfileMenu(false); onNavigate('consult-doctor'); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-emerald-800 hover:bg-emerald-50 flex items-center gap-2 font-medium"
                      >
                        <Stethoscope className="w-4 h-4 text-emerald-600" />
                        <span>Doctor Consultations</span>
                      </button>

                      <button 
                        onClick={() => { setShowProfileMenu(false); onLogout(); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="px-4 py-2 border-b border-brand-green-600/10 flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-black-900">My Account</p>
                          <p className="text-xs text-black-600/80">Sign in to manage orders, addresses & health consultations.</p>
                        </div>
                        <button
                          onClick={() => setShowProfileMenu(false)}
                          className="p-1 rounded-full text-black-600 hover:bg-brand-green-100/50 hover:text-black-800 transition-colors shrink-0 mt-0.5"
                          aria-label="Close Profile Menu"
                        >
                          <X className="w-4.5 h-4.5" />
                        </button>
                      </div>
                      <button 
                        onClick={() => { setShowProfileMenu(false); onNavigate('login'); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-black-900 hover:bg-brand-green-50 font-bold flex items-center gap-2"
                      >
                        <User className="w-4 h-4 text-black-700" />
                        <span>Sign In / My Account</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Cart - Visible on all screens */}
            <button 
              onClick={() => onNavigate('cart')}
              className="relative p-1.5 sm:p-2 text-black-950 hover:text-brand-gold-600 transition-colors cursor-pointer shrink-0 rounded-lg sm:rounded-full hover:bg-brand-green-50"
              aria-label="Shopping Cart"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5 sm:w-5.5 sm:h-5.5" strokeWidth={2} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-brand-green-700 text-white flex items-center justify-center text-[9px] font-bold">
                  {cartCount}
                </span>
              )}
            </button>

          </div>

        </div>

      </div>

    </header>

    {/* Mobile Navigation Drawer - Hardware Accelerated Silky Smooth Slide In & Out */}
    <div
      className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${
        isMobileMenuOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
      }`}
      aria-hidden={!isMobileMenuOpen}
    >
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 ease-in-out cursor-pointer touch-manipulation ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          setIsMobileMenuOpen(false);
          setDrawerView('main');
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
          setIsMobileMenuOpen(false);
          setDrawerView('main');
        }}
        aria-label="Close menu backdrop"
      />

      {/* Drawer panel on Left side with ultra-smooth cubic-bezier transition */}
      <div
        className={`fixed top-0 left-0 h-full w-[300px] sm:w-[340px] max-w-[85vw] bg-white shadow-2xl overflow-y-auto flex flex-col justify-between z-50 transform transition-transform duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ willChange: 'transform' }}
      >
        {/* Top Header of Drawer */}
        <div>
          <div className="relative bg-gradient-to-br from-brand-green-800 via-brand-green-700 to-emerald-700 px-5 pt-5 pb-5 overflow-hidden text-white">
            {/* Decorative soft glow - pointer-events-none so it NEVER blocks clicks */}
            <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/10 blur-2xl pointer-events-none select-none" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-emerald-400/20 blur-2xl pointer-events-none select-none" />

            {/* Prominent, touch-friendly Close / Cross Button */}
            <button
              type="button"
              id="mobile-drawer-close-button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMobileMenuOpen(false);
                setDrawerView('main');
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                setIsMobileMenuOpen(false);
                setDrawerView('main');
              }}
              className="absolute top-3.5 right-3.5 w-10 h-10 flex items-center justify-center text-white bg-white/20 hover:bg-white/30 active:scale-90 border border-white/25 transition-all cursor-pointer rounded-full z-30 pointer-events-auto touch-manipulation shadow-md focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Close menu"
              title="Close Navigation Menu"
            >
              <X className="w-5 h-5 text-white stroke-[2.5]" />
            </button>

            <div className="relative z-10 flex flex-col items-start gap-1.5 pr-8">
              <div className="bg-white rounded-xl px-3 py-1.5 shadow-md">
                <Logo variant="dark" />
              </div>
              <p className="text-white font-bold text-sm leading-tight mt-1">
                100% Pure Natural Herbs
              </p>
              <p className="text-white/80 text-[11px] leading-snug">
                Authentic Ayurvedic Formulations & Consultations
              </p>
            </div>
          </div>

          {/* Seamless Category / Main View Switching with AnimatePresence */}
          <AnimatePresence mode="wait" initial={false}>
            {drawerView === 'main' ? (
              <motion.div 
                key="mobile-main-view"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col p-3 space-y-1"
              >
                {/* Home */}
                <button 
                  onClick={() => { onNavigate('home'); setIsMobileMenuOpen(false); }} 
                  className="group text-left px-3 py-2.5 text-sm font-semibold text-black-950 hover:bg-brand-green-50 rounded-xl transition-all cursor-pointer flex items-center gap-3"
                >
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-green-50 group-hover:bg-brand-green-800 group-hover:text-white transition-all shrink-0">
                    <Home className="w-4 h-4 text-black-700 group-hover:text-white transition-colors" strokeWidth={2} />
                  </span>
                  <span>{t('navHome', language)}</span>
                </button>

                {/* 🔥 Shop by Category Trigger: When clicked, HIDES all main menu and shows ONLY categories */}
                <button
                  onClick={() => setDrawerView('categories')}
                  className="group w-full text-left px-3 py-2.5 text-sm font-bold text-black-950 hover:bg-brand-green-50 bg-brand-green-50/50 rounded-xl transition-all cursor-pointer flex items-center justify-between border border-brand-green-600/15"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-green-700 text-white shrink-0">
                      <Layers className="w-4 h-4" strokeWidth={2} />
                    </span>
                    <span>{language === 'hi' ? 'श्रेणी अनुसार खरीदें' : 'Shop by Category'}</span>
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-black-700">
                    <span className="bg-brand-green-100 px-1.5 py-0.5 rounded-full text-[10px]">{availableCategories.length}</span>
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </button>

                {/* Consult with Doctor */}
                <button 
                  onClick={() => { onNavigate('consult-doctor'); setIsMobileMenuOpen(false); }} 
                  className="group text-left px-3 py-2.5 text-sm font-bold text-emerald-950 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-300/60 rounded-xl transition-all cursor-pointer flex items-center justify-between"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-800 text-white shrink-0">
                      <Stethoscope className="w-4 h-4" strokeWidth={2} />
                    </span>
                    <span>{language === 'hi' ? 'डॉक्टर से परामर्श लें' : 'Consult with Doctor'}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-700 text-white text-[9px] font-bold uppercase tracking-wider">
                    {language === 'hi' ? 'लाइव' : '1-on-1'}
                  </span>
                </button>

                {/* Track Order */}
                <button 
                  onClick={() => { onNavigate('track-order'); setIsMobileMenuOpen(false); }} 
                  className="group text-left px-3 py-2.5 text-sm font-semibold text-black-950 hover:bg-brand-green-50 rounded-xl transition-all cursor-pointer flex items-center gap-3"
                >
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-green-50 group-hover:bg-brand-green-800 group-hover:text-white transition-all shrink-0">
                    <Package className="w-4 h-4 text-black-700 group-hover:text-white transition-colors" strokeWidth={2} />
                  </span>
                  <span>Track Order</span>
                </button>

                {/* Blogs */}
                <button 
                  onClick={() => { onNavigate('static', { page: 'blog' }); setIsMobileMenuOpen(false); }} 
                  className="group text-left px-3 py-2.5 text-sm font-semibold text-black-950 hover:bg-brand-green-50 rounded-xl transition-all cursor-pointer flex items-center gap-3"
                >
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-green-50 group-hover:bg-brand-green-800 group-hover:text-white transition-all shrink-0">
                    <BookOpen className="w-4 h-4 text-black-700 group-hover:text-white transition-colors" strokeWidth={2} />
                  </span>
                  <span>{t('navBlogs', language)}</span>
                </button>

                {/* About */}
                <button 
                  onClick={() => { onNavigate('static', { page: 'about' }); setIsMobileMenuOpen(false); }} 
                  className="group text-left px-3 py-2.5 text-sm font-semibold text-black-950 hover:bg-brand-green-50 rounded-xl transition-all cursor-pointer flex items-center gap-3"
                >
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-green-50 group-hover:bg-brand-green-800 group-hover:text-white transition-all shrink-0">
                    <Info className="w-4 h-4 text-black-700 group-hover:text-white transition-colors" strokeWidth={2} />
                  </span>
                  <span>{t('About', language)}</span>
                </button>

                {/* Contact */}
                <button 
                  onClick={() => { onNavigate('static', { page: 'contact' }); setIsMobileMenuOpen(false); }} 
                  className="group text-left px-3 py-2.5 text-sm font-semibold text-black-950 hover:bg-brand-green-50 rounded-xl transition-all cursor-pointer flex items-center gap-3"
                >
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-green-50 group-hover:bg-brand-green-800 group-hover:text-white transition-all shrink-0">
                    <Phone className="w-4 h-4 text-black-700 group-hover:text-white transition-colors" strokeWidth={2} />
                  </span>
                  <span>{t('navContact', language)}</span>
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="mobile-categories-view"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col p-3"
              >
                {/* Back to Main Menu Button */}
                <button
                  onClick={() => setDrawerView('main')}
                  className="flex items-center gap-2 px-3 py-2 mb-3 rounded-xl bg-brand-green-100/70 hover:bg-brand-green-200/80 text-black-900 font-bold text-xs transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-black-800" />
                  <span>{language === 'hi' ? '← मुख्य मेनू पर वापस जाएँ' : '← Back to Main Menu'}</span>
                </button>

                {/* Header info */}
                <div className="px-2 pb-2 mb-2 border-b border-brand-green-600/10 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-black-800">
                    {language === 'hi' ? 'सभी श्रेणियाँ' : 'Select Category'}
                  </span>
                  <span className="text-[11px] text-black-600 font-semibold">
                    {availableCategories.length} {language === 'hi' ? 'श्रेणियाँ' : 'Categories'}
                  </span>
                </div>

                {/* List of ONLY categories from database (No products inside) */}
                <div className="space-y-1.5 max-h-[calc(100vh-270px)] overflow-y-auto pr-1">
                  {availableCategories.map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => handleSelectCategory(cat.key)}
                      className="group w-full flex items-center justify-between p-2.5 rounded-xl text-left bg-brand-cream-50/70 hover:bg-brand-green-50 border border-brand-green-600/10 hover:border-brand-green-300 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="p-1.5 rounded-lg bg-brand-green-100 text-black-800 group-hover:bg-brand-green-700 group-hover:text-white transition-colors shrink-0">
                          {renderCategoryIcon(cat.iconName, "w-4 h-4")}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-black-950 truncate">
                            {language === 'hi' ? cat.hindiName : cat.name}
                          </p>
                          {language !== 'hi' && (
                            <p className="text-[10px] text-black-600 truncate">{cat.hindiName}</p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-black-400 group-hover:text-black-800 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  ))}
                </div>

                {/* View all products in shop */}
                <div className="pt-3 mt-2 border-t border-brand-green-600/10">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setDrawerView('main');
                      onNavigate('shop');
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-brand-green-800 hover:bg-brand-green-900 text-white text-xs font-bold text-center transition-colors shadow-sm"
                  >
                    {language === 'hi' ? 'सभी उत्पाद देखें' : 'View All Store Products'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile User Section - Labelled "My Account" */}
        <div className="border-t border-brand-green-600/15 p-4 bg-brand-cream-50/60">
          {currentUser ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 py-1 px-1">
                <div className="w-8 h-8 rounded-full bg-brand-green-800 flex items-center justify-center text-white font-bold text-xs">
                  {currentUser.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-black-600 font-bold uppercase tracking-wider">My Account</p>
                  <p className="text-xs font-bold text-black-900 truncate">{currentUser.fullName}</p>
                </div>
              </div>

              <button 
                onClick={() => { setIsMobileMenuOpen(false); onNavigate('dashboard'); }}
                className="w-full text-left py-2 px-3 text-xs font-bold text-black-900 hover:text-brand-gold-700 flex items-center gap-2 rounded-lg bg-white border border-brand-green-600/10 shadow-sm"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-black-700" />
                <span>Customer Dashboard</span>
              </button>

              <button 
                onClick={() => { setIsMobileMenuOpen(false); onLogout(); }}
                className="w-full text-left py-1.5 px-3 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-lg"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={() => { setIsMobileMenuOpen(false); onNavigate('login'); }}
              className="w-full py-2.5 px-4 bg-brand-green-800 text-white rounded-xl text-center text-xs font-bold shadow-sm hover:bg-brand-green-900 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4 text-brand-gold-400" />
              <span>My Account (Sign In)</span>
            </button>
          )}
        </div>
      </div>
    </div>
    </>
  );
};
