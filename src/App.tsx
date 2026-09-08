/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AIConsultantModal } from './components/AIConsultantModal';
import { QuickViewModal } from './components/QuickViewModal';
import { AdminGatewayLogin } from './components/AdminGatewayLogin';
import { BuyNowModal } from './components/BuyNowModal';

// Pages
import { CustomerHome } from './pages/CustomerHome';
import { Shop } from './pages/Shop';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { Dashboard } from './pages/Dashboard';
import { StaticPages } from './pages/StaticPages';
import { TrackOrder } from './pages/TrackOrder';
import { Wishlist } from './pages/Wishlist';
import { Login } from './pages/Login';
import { DoctorConsultation } from './pages/DoctorConsultation';
import { DoctorDashboard } from './pages/DoctorDashboard';

// Types & Custom Hooks
import { Product, ProductVariant } from './types';
import { Language } from './lib/translations';
import { getPageFromUrl } from './utils/navigation';
import { useAuth } from './hooks/useAuth';
import { useCartAndWishlist } from './hooks/useCartAndWishlist';
import { useAppData } from './hooks/useAppData';

export default function App() {
  // Navigation states
  const [currentPage, setCurrentPage] = useState<string>(() => {
    return getPageFromUrl().page;
  });
  const [pageParams, setPageParams] = useState<any>(() => {
    return getPageFromUrl().params;
  });

  // Language configuration
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('gramslife_lang') as Language) || 'en';
    }
    return 'en';
  });

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('gramslife_lang', lang);
  };

  // Modular Hooks
  const {
    authToken,
    setAuthToken,
    currentUser,
    setCurrentUser,
    handleLogin,
    handleRegister,
    handleLogout,
    handleLoginSuccess
  } = useAuth();

  const {
    cart,
    wishlist,
    appliedCoupon,
    setAppliedCoupon,
    handleAddToCart,
    handleUpdateCartQty,
    handleRemoveFromCart,
    handleToggleWishlist,
    clearCart
  } = useCartAndWishlist();

  const {
    products,
    blogs,
    faqs,
    coupons,
    reviews,
    activeSettings,
    orders,
    fetchBlogs,
    fetchFaqs,
    fetchCoupons,
    fetchReviews,
    fetchProducts,
    fetchOrders,
    handlePostReview,
    handleAddAddress,
    handlePlaceOrder,
    handleAdminUpdateOrderStatus,
    handleAdminAddProduct,
    handleAdminEditProduct,
    handleAdminDeleteProduct,
    handleAdminAddCoupon,
    handleUpdateSettings
  } = useAppData(authToken, currentUser, setCurrentUser);

  // Floating modals states
  const [isConsultantOpen, setIsConsultantOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [buyNowProduct, setBuyNowProduct] = useState<Product | null>(null);
  const [buyNowQty, setBuyNowQty] = useState<number>(1);
  const [buyNowVariant, setBuyNowVariant] = useState<ProductVariant | undefined>(undefined);

  // Fetch contextual data lazily based on active page route
  useEffect(() => {
    if (currentPage === 'static') {
      if (pageParams?.page === 'blog') fetchBlogs();
      if (pageParams?.page === 'faq') fetchFaqs();
    } else if (currentPage === 'cart' || currentPage === 'checkout') {
      fetchCoupons();
    } else if (currentPage === 'product') {
      fetchReviews();
    }
  }, [currentPage, pageParams, fetchBlogs, fetchFaqs, fetchCoupons, fetchReviews]);

  // Navigation Handler
  const handleNavigate = (page: string, params: any = null, pushHistory = true) => {
    setCurrentPage(page);
    setPageParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (pushHistory) {
      let path = '/';
      if (page === 'shop') {
        const searchParams = new URLSearchParams();
        if (params?.search) searchParams.set('search', params.search);
        if (params?.category) searchParams.set('category', params.category);
        const q = searchParams.toString();
        path = q ? `/shop?${q}` : '/shop';
      } else if (page === 'product') {
        path = `/product?id=${params?.id || ''}`;
      } else if (page === 'static') {
        path = `/${params?.page || 'faq'}`;
      } else if (page === 'admin') {
        path = '/admin';
      } else if (page === 'order-confirmation' || page === 'order-success') {
        path = params?.id ? `/order-confirmation?id=${params.id}` : '/order-confirmation';
      } else if (page !== 'home') {
        path = `/${page}`;
      }
      window.history.pushState({ page, params }, '', path);
    }
  };

  // Sync with browser History API (popstate)
  useEffect(() => {
    if (!window.history.state) {
      const initialRoute = getPageFromUrl();
      const currentPath = window.location.pathname + window.location.search;
      window.history.replaceState({ page: initialRoute.page, params: initialRoute.params }, '', currentPath);
    }

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.page) {
        handleNavigate(event.state.page, event.state.params, false);
      } else {
        const initialRoute = getPageFromUrl();
        handleNavigate(initialRoute.page, initialRoute.params, false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Wrap logout to also trigger navigate home
  const onLogoutUser = () => {
    handleLogout();
    handleNavigate('home');
  };

  // Wrap place order to pass cart and clear cart
  const onPlaceOrder = (orderData: any) => {
    return handlePlaceOrder(orderData, cart, clearCart);
  };

  return (
    <div className="bg-brand-cream-50 min-h-screen text-brand-green-950 font-sans selection:bg-brand-gold-500/30 flex flex-col justify-between">
      
      {/* Header Navigation Bar */}
      {currentPage !== 'admin' && (
        <Navbar 
          currentUser={currentUser}
          onNavigate={handleNavigate}
          cart={cart}
          wishlist={wishlist}
          onOpenConsultant={() => setIsConsultantOpen(true)}
          onLogout={onLogoutUser}
          onSearch={(query) => handleNavigate('shop', { search: query })}
          language={language}
          onLanguageChange={handleLanguageChange}
          searchQuery={currentPage === 'shop' ? (pageParams?.search || '') : ''}
          settings={activeSettings}
          products={products}
        />
      )}

      {/* Main Routing Layout Viewport */}
      <main className="flex-grow">
        
        {/* Customer Home */}
        {currentPage === 'home' && (
          <CustomerHome
            products={products}
            blogs={blogs}
            onNavigate={handleNavigate}
            onOpenConsultant={() => setIsConsultantOpen(true)}
            onAddToCart={handleAddToCart}
            onQuickView={(p) => setQuickViewProduct(p)}
            wishlist={wishlist}
            onToggleWishlist={handleToggleWishlist}
            language={language}
            onBuyNow={(prod, qty, variant) => {
              setBuyNowProduct(prod);
              setBuyNowQty(qty);
              setBuyNowVariant(variant);
            }}
          />
        )}

        {/* Shop Page */}
        {currentPage === 'shop' && (
          <Shop
            products={products}
            onNavigate={handleNavigate}
            onAddToCart={handleAddToCart}
            onQuickView={(p) => setQuickViewProduct(p)}
            wishlist={wishlist}
            onToggleWishlist={handleToggleWishlist}
            searchQuery={pageParams?.search || ''}
            categoryFilter={pageParams?.category || ''}
            language={language}
            onBuyNow={(prod, qty, variant) => {
              setBuyNowProduct(prod);
              setBuyNowQty(qty);
              setBuyNowVariant(variant);
            }}
          />
        )}

        {/* Product Details page */}
        {currentPage === 'product' && (
          <ProductDetail
            productId={pageParams?.id || ''}
            products={products}
            reviews={reviews}
            orders={orders}
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onAddToCart={handleAddToCart}
            onQuickView={(p) => setQuickViewProduct(p)}
            onBuyNow={(prod, qty, variant) => {
              setBuyNowProduct(prod);
              setBuyNowQty(qty);
              setBuyNowVariant(variant);
            }}
            wishlist={wishlist}
            onToggleWishlist={handleToggleWishlist}
            onPostReview={handlePostReview}
            language={language}
          />
        )}

        {/* Shopping Cart Bag */}
        {currentPage === 'cart' && (
          <Cart
            cart={cart}
            onUpdateQty={handleUpdateCartQty}
            onRemoveItem={handleRemoveFromCart}
            onNavigate={handleNavigate}
            coupons={coupons}
            settings={activeSettings}
            onApplyCoupon={setAppliedCoupon}
            appliedCoupon={appliedCoupon}
            language={language}
          />
        )}

        {/* Wishlist Page */}
        {currentPage === 'wishlist' && (
          <Wishlist
            wishlist={wishlist}
            products={products}
            onNavigate={handleNavigate}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            onQuickView={(p) => setQuickViewProduct(p)}
            language={language}
            onBuyNow={(prod, qty, variant) => {
              setBuyNowProduct(prod);
              setBuyNowQty(qty);
              setBuyNowVariant(variant);
            }}
          />
        )}

        {/* Secure Checkout & Order Confirmation */}
        {(currentPage === 'checkout' || currentPage === 'order-confirmation' || currentPage === 'order-success') && (
          <Checkout
            cart={cart}
            userAddresses={currentUser?.addresses || []}
            onAddAddress={handleAddAddress}
            onNavigate={handleNavigate}
            appliedCoupon={appliedCoupon}
            settings={activeSettings}
            onPlaceOrder={onPlaceOrder}
            onPostReview={handlePostReview}
            language={language}
            currentUser={currentUser}
            onLoginSuccess={handleLoginSuccess}
            authToken={authToken}
            initialCompletedOrderId={pageParams?.id}
          />
        )}

        {/* Track Order Portal */}
        {currentPage === 'track-order' && (
          <TrackOrder
            onNavigate={handleNavigate}
            language={language}
            currentUser={currentUser}
            authToken={authToken}
            onPostReview={handlePostReview}
          />
        )}

        {/* Consult with a Doctor Portal */}
        {(currentPage === 'consult-doctor' || currentPage === 'consultation') && (
          <DoctorConsultation
            currentUser={currentUser}
            onNavigate={handleNavigate}
            language={language}
          />
        )}

        {/* Doctor Dashboard Portal */}
        {(currentPage === 'doctor-dashboard' || currentPage === 'doctor') && (
          <DoctorDashboard
            currentUser={currentUser}
            onNavigate={handleNavigate}
            language={language}
            onLoginSuccess={(user, token) => {
              setCurrentUser(user);
              if (token) {
                handleLoginSuccess(token, true);
              }
            }}
          />
        )}

        {/* User Dashboard */}
        {currentPage === 'dashboard' && (
          <Dashboard
            user={currentUser}
            orders={orders}
            products={products}
            coupons={coupons}
            settings={activeSettings}
            onUpdateStatus={handleAdminUpdateOrderStatus}
            onAddProduct={handleAdminAddProduct}
            onEditProduct={handleAdminEditProduct}
            onDeleteProduct={handleAdminDeleteProduct}
            onAddCoupon={handleAdminAddCoupon}
            onAddAddress={handleAddAddress}
            onNavigate={handleNavigate}
            onLogout={onLogoutUser}
            isAdminPanel={false}
            onUpdateSettings={handleUpdateSettings}
            onLoginSuccess={handleLoginSuccess}
            onPostReview={handlePostReview}
            initialTab={pageParams?.tab}
          />
        )}

        {/* Secret Admin Panel Route */}
        {currentPage === 'admin' && (
          (currentUser && (
            currentUser.role === 'admin' ||
            ['iamvivekbaliyan07@gmail.com', 'vkchoudhary050607@gmail.com', 'admin@gramslife.com', 'care@gramslife.com', 'doctor@gramslife.com'].includes((currentUser.email || '').toLowerCase()) ||
            ['7451050607', '9425011088'].includes((currentUser.phone || '').replace(/\D/g, '').slice(-10))
          )) ? (
            <Dashboard
              user={{ ...currentUser, role: 'admin' }}
              orders={orders}
              products={products}
              coupons={coupons}
              settings={activeSettings}
              onUpdateStatus={handleAdminUpdateOrderStatus}
              onAddProduct={handleAdminAddProduct}
              onEditProduct={handleAdminEditProduct}
              onDeleteProduct={handleAdminDeleteProduct}
              onAddCoupon={handleAdminAddCoupon}
              onAddAddress={handleAddAddress}
              onNavigate={handleNavigate}
              onLogout={onLogoutUser}
              isAdminPanel={true}
              onUpdateSettings={handleUpdateSettings}
              onFetchCoupons={fetchCoupons}
              onRefreshOrders={fetchOrders}
              onRefreshProducts={fetchProducts}
            />
          ) : (
            <AdminGatewayLogin 
              onNavigate={handleNavigate}
              onLoginSuccess={(token, user) => {
                const confirmedAdmin = {
                  ...(user || {}),
                  role: 'admin'
                };
                setCurrentUser(confirmedAdmin as any);
                if (token) {
                  handleLoginSuccess(token, true);
                }
                fetchOrders();
                fetchProducts();
                fetchCoupons();
                setCurrentPage('admin');
              }}
              handleLogin={handleLogin}
            />
          )
        )}

        {/* Static Policies, FAQS, Blogs Chronicles */}
        {currentPage === 'static' && (
          <StaticPages
            pageType={pageParams?.page || 'faq'}
            params={pageParams}
            blogs={blogs}
            faqs={faqs}
            onNavigate={handleNavigate}
            language={language}
          />
        )}

        {/* Login & Register Portal */}
        {currentPage === 'login' && (
          <Login
            onNavigate={handleNavigate}
            handleLogin={handleLogin}
            handleRegister={handleRegister}
          />
        )}

      </main>

      {/* Footer */}
      {currentPage !== 'admin' && (
        <Footer 
          onNavigate={handleNavigate}
          onOpenConsultant={() => setIsConsultantOpen(true)}
          language={language}
          settings={activeSettings}
        />
      )}

      {/* FLOATING QUICK VIEW POPUP */}
      {currentPage !== 'admin' && quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onAddToCart={handleAddToCart}
          onNavigate={handleNavigate}
          onBuyNow={(prod, qty, variant) => {
            setBuyNowProduct(prod);
            setBuyNowQty(qty);
            setBuyNowVariant(variant);
          }}
        />
      )}

      {/* FLOATING VEDIC AI CONSULTANT MODAL */}
      {currentPage !== 'admin' && isConsultantOpen && (
        <AIConsultantModal
          onClose={() => setIsConsultantOpen(false)}
          products={products}
          onAddToCart={handleAddToCart}
          onNavigate={handleNavigate}
          language={language}
          currentUser={currentUser}
          authToken={authToken}
        />
      )}

      {/* FLOATING EXPRESS BUY NOW MODAL */}
      {currentPage !== 'admin' && buyNowProduct && (
        <BuyNowModal
          product={buyNowProduct}
          selectedVariant={buyNowVariant}
          quantity={buyNowQty}
          onClose={() => {
            setBuyNowProduct(null);
            setBuyNowQty(1);
            setBuyNowVariant(undefined);
          }}
          onPlaceOrder={onPlaceOrder}
          onPostReview={handlePostReview}
          onNavigate={handleNavigate}
          language={language}
          currentUser={currentUser}
          onAddAddress={handleAddAddress}
          onLoginSuccess={(token) => {
            localStorage.setItem('grams_auth_token', token);
            setAuthToken(token);
          }}
        />
      )}

    </div>
  );
}
