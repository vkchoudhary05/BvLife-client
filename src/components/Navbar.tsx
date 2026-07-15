/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Heart, ShoppingBag, User, Sparkles, LogOut, LayoutDashboard, Shield, Menu, X } from 'lucide-react';
import { User as UserType, CartItem } from '../types';
import { Language, t } from '../lib/translations';

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
  searchQuery = ''
}) => {
  const [searchVal, setSearchVal] = useState(searchQuery);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  React.useEffect(() => {
    setSearchVal(searchQuery);
  }, [searchQuery]);

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
      return;
    }
    onSearch(searchVal);
  };

  return (
    <header id="site-header" className="sticky top-0 z-40 w-full bg-brand-cream-50/90 backdrop-blur-md border-b border-brand-green-600/10">
      {/* Top Banner Alert */}
      <div id="top-promo-banner" className="bg-brand-green-800 text-brand-cream-100 text-[11px] sm:text-xs py-2 px-4 text-center font-medium tracking-wide">
        {t('promoBanner', language)}
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-1.5 sm:gap-4">
          
          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-1.5 sm:p-2 text-brand-green-800 hover:text-brand-gold-600 transition-colors focus:outline-none cursor-pointer flex items-center justify-center rounded-lg hover:bg-brand-green-50/50"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5.5 h-5.5 sm:w-6 sm:h-6" /> : <Menu className="w-5.5 h-5.5 sm:w-6 sm:h-6" />}
          </button>

          {/* Brand Logo */}
          <div 
            id="brand-logo-container" 
            className="flex-shrink-0 cursor-pointer flex items-center gap-1.5 sm:gap-2"
            onClick={() => onNavigate('home')}
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-brand-green-700 flex items-center justify-center text-brand-cream-100 font-serif text-base sm:text-xl font-bold shadow-sm shrink-0">
              G
            </div>
            <div className="min-w-0">
              <h1 className="font-serif text-base sm:text-2xl font-bold tracking-tight text-brand-green-800 leading-none">
                Grams <span className="text-brand-gold-600 font-sans font-normal italic text-sm sm:text-lg">Life</span>
              </h1>
              <p className="text-[8px] sm:text-[9px] uppercase tracking-widest text-brand-green-600 font-medium mt-0.5 sm:-mt-1 truncate">
                Organic Wellbeing
              </p>
            </div>
          </div>

          {/* Desktop Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center flex-1 max-w-xs lg:max-w-md relative">
            <input
              type="text"
              placeholder={t('searchPlaceholder', language)}
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 rounded-full bg-brand-green-50 border border-brand-green-200 focus:outline-none focus:border-brand-green-700 text-sm placeholder-brand-green-600/50"
            />
            <button type="submit" className="absolute right-3 text-brand-green-700 hover:text-brand-gold-600 transition-colors">
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Primary Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-medium text-brand-green-800">
            <button onClick={() => onNavigate('home')} className="hover:text-brand-gold-600 transition-colors cursor-pointer">{t('navHome', language)}</button>
            <button onClick={() => onNavigate('shop')} className="hover:text-brand-gold-600 transition-colors cursor-pointer">{t('navShop', language)}</button>
            <button onClick={() => onNavigate('static', { page: 'blog' })} className="hover:text-brand-gold-600 transition-colors cursor-pointer">{t('navBlogs', language)}</button>
            <button onClick={() => onNavigate('static', { page: 'about' })} className="hover:text-brand-gold-600 transition-colors cursor-pointer">{t('navAbout', language)}</button>
            <button onClick={() => onNavigate('static', { page: 'contact' })} className="hover:text-brand-gold-600 transition-colors cursor-pointer">{t('navContact', language)}</button>
          </nav>

          {/* User & Checkout Quick Icons */}
          <div className="flex items-center gap-1 sm:gap-2.5 md:gap-4">
            

            {/* AI consultant button */}
            <button 
              onClick={onOpenConsultant}
              className="flex items-center justify-center gap-1 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-brand-green-700 hover:bg-brand-green-800 text-brand-cream-100 text-[11px] sm:text-sm font-semibold transition-all duration-300 shadow-sm cursor-pointer border border-brand-gold-500/30 group animate-pulse shrink-0"
              title={t('btnAskAcharya', language)}
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-gold-300 group-hover:rotate-12 transition-transform shrink-0" />
              <span className="hidden sm:inline">{t('btnAskAcharya', language)}</span>
            </button>

            {/* Wishlist */}
            <button 
              onClick={() => onNavigate('dashboard', { tab: 'wishlist' })}
              className="relative p-1.5 sm:p-2.5 text-brand-green-800 hover:text-brand-gold-600 transition-colors cursor-pointer shrink-0"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-brand-gold-600 text-brand-cream-100 flex items-center justify-center text-[9px] font-bold">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Cart */}
            <button 
              onClick={() => onNavigate('cart')}
              className="relative p-1.5 sm:p-2.5 text-brand-green-800 hover:text-brand-gold-600 transition-colors cursor-pointer shrink-0"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-brand-green-700 text-brand-cream-100 flex items-center justify-center text-[9px] font-bold">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Profile / Admin Switch */}
            <div className="relative shrink-0">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="p-1.5 sm:p-2.5 text-brand-green-800 hover:text-brand-gold-600 transition-colors cursor-pointer flex items-center gap-1"
                aria-label="User Profile"
              >
                <User className="w-5 h-5" />
                {currentUser && <span className="hidden md:inline text-xs font-semibold">{currentUser.fullName.split(' ')[0]}</span>}
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-brand-cream-50 border border-brand-green-600/10 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {currentUser ? (
                    <>
                      <div className="px-4 py-2 border-b border-brand-green-600/10">
                        <p className="text-xs text-brand-green-600 font-medium">Logged in as</p>
                        <p className="text-sm font-bold truncate text-brand-green-800">{currentUser.fullName}</p>
                        <p className="text-[10px] text-brand-green-600/70 truncate">{currentUser.email}</p>
                      </div>
                      <button 
                        onClick={() => { setShowProfileMenu(false); onNavigate('dashboard'); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-brand-green-800 hover:bg-brand-green-50 flex items-center gap-2"
                      >
                        <LayoutDashboard className="w-4 h-4 text-brand-green-600" />
                        <span>Customer Dashboard</span>
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
                      <div className="px-4 py-2 border-b border-brand-green-600/10">
                        <p className="text-sm font-semibold text-brand-green-800">Welcome to Grams Life</p>
                        <p className="text-xs text-brand-green-600/70">Connect to synchronize your holistic cart & health logs.</p>
                      </div>
                      <button 
                        onClick={() => { setShowProfileMenu(false); onNavigate('login'); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-brand-green-800 hover:bg-brand-green-50 font-bold"
                      >
                        Sign In / Register
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Mobile Navigation Links and Search */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 px-4 border-t border-brand-green-600/10 flex flex-col gap-4 bg-brand-cream-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Search Bar integrated within the Mobile Menu */}
            <div className="pb-1">
              <form onSubmit={handleSearchSubmit} className="flex items-center relative w-full">
                <input
                  type="text"
                  placeholder={t('searchPlaceholder', language)}
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-brand-green-50 border border-brand-green-200 focus:outline-none focus:border-brand-green-700 text-sm placeholder-brand-green-600/50 shadow-sm"
                />
                {searchVal && (
                  <button 
                    type="button" 
                    onClick={() => { setSearchVal(''); onSearch(''); }}
                    className="absolute right-10 p-1 text-brand-green-600/40 hover:text-brand-green-800 focus:outline-none cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button type="submit" className="absolute right-3 text-brand-green-700 hover:text-brand-gold-600 transition-colors focus:outline-none cursor-pointer">
                  <Search className="w-4 h-4" />
                </button>
              </form>
            </div>

            <div className="flex flex-col gap-1">
              <button 
                onClick={() => { onNavigate('home'); setIsMobileMenuOpen(false); }} 
                className="text-left px-4 py-2.5 text-sm font-semibold text-brand-green-800 hover:text-brand-gold-600 hover:bg-brand-green-50/50 rounded-xl transition-all cursor-pointer"
              >
                {t('navHome', language)}
              </button>
              <button 
                onClick={() => { onNavigate('shop'); setIsMobileMenuOpen(false); }} 
                className="text-left px-4 py-2.5 text-sm font-semibold text-brand-green-800 hover:text-brand-gold-600 hover:bg-brand-green-50/50 rounded-xl transition-all cursor-pointer"
              >
                {t('navShop', language)}
              </button>
              <button 
                onClick={() => { onNavigate('static', { page: 'blog' }); setIsMobileMenuOpen(false); }} 
                className="text-left px-4 py-2.5 text-sm font-semibold text-brand-green-800 hover:text-brand-gold-600 hover:bg-brand-green-50/50 rounded-xl transition-all cursor-pointer"
              >
                {t('navBlogs', language)}
              </button>
              <button 
                onClick={() => { onNavigate('static', { page: 'about' }); setIsMobileMenuOpen(false); }} 
                className="text-left px-4 py-2.5 text-sm font-semibold text-brand-green-800 hover:text-brand-gold-600 hover:bg-brand-green-50/50 rounded-xl transition-all cursor-pointer"
              >
                {t('navAbout', language)}
              </button>
              <button 
                onClick={() => { onNavigate('static', { page: 'contact' }); setIsMobileMenuOpen(false); }} 
                className="text-left px-4 py-2.5 text-sm font-semibold text-brand-green-800 hover:text-brand-gold-600 hover:bg-brand-green-50/50 rounded-xl transition-all cursor-pointer"
              >
                {t('navContact', language)}
              </button>
            </div>

            {/* Mobile User Profile Section */}
            <div className="border-t border-brand-green-600/10 mt-2 pt-3 px-2">
              {currentUser ? (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 py-1.5 px-2">
                    <div className="w-9 h-9 rounded-full bg-brand-green-700 flex items-center justify-center text-brand-cream-100 font-bold text-sm">
                      {currentUser.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-brand-green-600 font-medium">Logged in as</p>
                      <p className="text-sm font-bold text-brand-green-800 truncate">{currentUser.fullName}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => { setIsMobileMenuOpen(false); onNavigate('dashboard'); }}
                    className="w-full text-left py-2 px-2 text-sm font-semibold text-brand-green-800 hover:text-brand-gold-600 flex items-center gap-2 rounded-lg hover:bg-brand-green-50/50"
                  >
                    <LayoutDashboard className="w-4 h-4 text-brand-green-600" />
                    <span>Customer Dashboard</span>
                  </button>

                  <button 
                    onClick={() => { setIsMobileMenuOpen(false); onLogout(); }}
                    className="w-full text-left py-2 px-2 text-sm font-semibold text-red-600 flex items-center gap-2 rounded-lg hover:bg-red-50/50"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => { setIsMobileMenuOpen(false); onNavigate('login'); }}
                  className="w-full py-2.5 px-4 bg-brand-green-700 text-brand-cream-100 rounded-xl text-center text-sm font-bold shadow-sm hover:bg-brand-green-800 transition-colors cursor-pointer"
                >
                  Sign In / Register
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </header>
  );
};
