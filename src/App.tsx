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
import { FirstVisitLogin } from './components/FirstVisitLogin';

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
import { updateSeoMetadata } from './utils/seo';

const SITE_URL = 'https://bvlife.in';
const stripMarkup = (value = '') => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

function buildSeo(currentPage: string, params: any, products: Product[], blogs: any[]) {
  const path = window.location.pathname + window.location.search;
  const privatePages = ['admin', 'cart', 'checkout', 'dashboard', 'login', 'track-order', 'wishlist', 'order-confirmation', 'order-success', 'doctor-dashboard', 'doctor'];

  if (currentPage === 'product') {
    const product = products.find(item => item.id === params?.id);
    if (!product) return {
      title: 'Ayurvedic Product | BV Life',
      description: 'Explore natural Ayurvedic products and herbal wellness essentials from BV Life.',
      path,
      noIndex: true
    };
    const description = stripMarkup(product.description) || `Shop ${product.name}, a ${product.category} Ayurvedic product from BV Life.`;
    const productUrl = `${SITE_URL}/product?id=${encodeURIComponent(product.id)}`;
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description,
      sku: product.sku,
      image: product.mainImage,
      brand: { '@type': 'Brand', name: product.brand || 'BV Life' },
      category: product.category,
      offers: {
        '@type': 'Offer',
        url: productUrl,
        priceCurrency: 'INR',
        price: product.currentPrice || product.price,
        availability: (product.currentStock ?? product.stock) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
      }
    };
    return { title: `${product.name} | Ayurvedic ${product.category} | BV Life`, description, path, image: product.currentImage || product.mainImage, structuredData };
  }

  if (currentPage === 'shop') {
    const category = params?.category?.trim();
    const title = category ? `${category} Ayurvedic Products Online | BV Life` : 'Shop Ayurvedic Products Online in India | BV Life';
    const listed = products.filter(item => !category || item.category.toLowerCase() === category.toLowerCase()).slice(0, 20);
    return {
      title,
      description: category ? `Shop natural Ayurvedic ${category.toLowerCase()} products from BV Life. Explore herbal wellness essentials with convenient delivery across India.` : 'Shop authentic Ayurvedic herbs, supplements, hair care and skin care products online from BV Life. Discover natural wellness essentials delivered across India.',
      path,
      noIndex: Boolean(params?.search),
      structuredData: listed.length ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: listed.map((product, index) => ({ '@type': 'ListItem', position: index + 1, name: product.name, url: `${SITE_URL}/product?id=${encodeURIComponent(product.id)}` }))
      } : undefined
    };
  }

  if (currentPage === 'static') {
    const page = params?.page || 'faq';
    const blog = page === 'blog-post' ? blogs.find(item => item.id === params?.id) : undefined;
    if (blog) return {
      title: `${blog.title} | BV Life Ayurvedic Wellness Blog`,
      description: stripMarkup(blog.summary || blog.content).slice(0, 160),
      path,
      image: blog.image,
      structuredData: { '@context': 'https://schema.org', '@type': 'Article', headline: blog.title, description: stripMarkup(blog.summary || blog.content).slice(0, 300), image: blog.image, datePublished: blog.date, author: { '@type': 'Organization', name: blog.author || 'BV Life' }, publisher: { '@type': 'Organization', name: 'BV Life', logo: { '@type': 'ImageObject', url: `${SITE_URL}/Bvlogo.png` } }, mainEntityOfPage: `${SITE_URL}${path}` }
    };
    const pages: Record<string, [string, string]> = {
      about: ['About BV Life | Ayurvedic Wellness', 'Learn about BV Life and our approach to Ayurvedic wellness and natural herbal products.'],
      contact: ['Contact BV Life | Customer Support', 'Contact BV Life for help with Ayurvedic products, orders, delivery, and wellness services.'],
      faq: ['Ayurvedic Product FAQs | BV Life', 'Find answers to common questions about BV Life products, orders, shipping, and Ayurvedic wellness.'],
      faqs: ['Ayurvedic Product FAQs | BV Life', 'Find answers to common questions about BV Life products, orders, shipping, and Ayurvedic wellness.'],
      blog: ['Ayurvedic Wellness Blog | BV Life', 'Read practical articles about Ayurveda, herbs, natural self-care, and everyday wellness.'],
      blogs: ['Ayurvedic Wellness Blog | BV Life', 'Read practical articles about Ayurveda, herbs, natural self-care, and everyday wellness.'],
      terms: ['Terms and Conditions | BV Life', 'Review the terms and conditions for using the BV Life website and services.'],
      privacy: ['Privacy Policy | BV Life', 'Learn how BV Life handles personal information when you use our website and services.'],
      shipping: ['Shipping Policy | BV Life', 'Review BV Life order processing, delivery areas, and shipping timelines.'],
      refund: ['Returns and Refunds | BV Life', 'Review BV Life cancellation, return, and refund information.']
    };
    const [title, description] = pages[page] || ['BV Life | Ayurvedic Wellness', 'Explore Ayurvedic products and natural wellness from BV Life.'];
    return { title, description, path };
  }

  if (currentPage === 'home') {
    return {
      title: 'Ayurvedic Products Online India | Natural Wellness | BV Life',
      description: 'Discover Ayurvedic herbal supplements, natural skin care, hair care, and wellness products at BV Life. Shop online with delivery across India.',
      path: '/',
      structuredData: [
        { '@context': 'https://schema.org', '@type': 'Organization', name: 'BV Life', url: SITE_URL, logo: `${SITE_URL}/Bvlogo.png`, email: 'care@bvlife.in' },
        { '@context': 'https://schema.org', '@type': 'WebSite', name: 'BV Life', url: SITE_URL, potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/shop?search={search_term_string}`, 'query-input': 'required name=search_term_string' } }
      ]
    };
  }

  const generic: Record<string, [string, string]> = {
    'consult-doctor': ['Ayurvedic Doctor Consultation Online | BV Life', 'Book an online Ayurvedic consultation with BV Life and explore personalized wellness guidance.'],
    consultation: ['Ayurvedic Doctor Consultation Online | BV Life', 'Book an online Ayurvedic consultation with BV Life and explore personalized wellness guidance.']
  };
  const [title, description] = generic[currentPage] || ['BV Life | Ayurvedic Products and Natural Wellness', 'Explore Ayurvedic products and natural wellness from BV Life.'];
  return { title, description, path, noIndex: privatePages.includes(currentPage) };
}

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
      return (localStorage.getItem('Bvlife_lang') as Language) || 'en';
    }
    return 'en';
  });

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('Bvlife_lang', lang);
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
  const [showFirstVisitLogin, setShowFirstVisitLogin] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [buyNowProduct, setBuyNowProduct] = useState<Product | null>(null);
  const [buyNowQty, setBuyNowQty] = useState<number>(1);
  const [buyNowVariant, setBuyNowVariant] = useState<ProductVariant | undefined>(undefined);

  useEffect(() => {
    const offerAlreadySeen = localStorage.getItem('bvlife_welcome_offer_seen') || localStorage.getItem('bvlife_mobile_gate_seen');
    const previewOffer = new URLSearchParams(window.location.search).get('welcomeOffer') === '1';
    if (!currentUser && !authToken && (previewOffer || !offerAlreadySeen)) {
      const timer = window.setTimeout(() => setShowFirstVisitLogin(true), previewOffer ? 0 : 30_000);
      return () => window.clearTimeout(timer);
    }
  }, [currentUser, authToken]);

  // Fetch contextual data lazily based on active page route
  useEffect(() => {
    if (currentPage === 'home') {
      fetchBlogs();
    } else if (currentPage === 'static') {
      if (pageParams?.page === 'blog' || pageParams?.page === 'blog-post') fetchBlogs();
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
        if (params?.featured) searchParams.set('featured', 'true');
        if (params?.bestSeller) searchParams.set('bestSeller', 'true');
        const q = searchParams.toString();
        path = q ? `/shop?${q}` : '/shop';
      } else if (page === 'product') {
        path = `/product?id=${params?.id || ''}`;
      } else if (page === 'static') {
        path = `/${params?.page || 'faq'}`;
        if (params?.page === 'blog-post' && params?.id) {
          path += `?id=${encodeURIComponent(params.id)}`;
        }
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

  useEffect(() => {
    updateSeoMetadata(buildSeo(currentPage, pageParams, products, blogs));
  }, [currentPage, pageParams, products, blogs]);

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
            featuredOnly={Boolean(pageParams?.featured)}
            bestSellerOnly={Boolean(pageParams?.bestSeller)}
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
            onLoginSuccess={(token, user) => {
              if (user) setCurrentUser(user);
              if (token) handleLoginSuccess(token, user?.role === 'admin');
            }}
            authToken={authToken}
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
            onLogout={onLogoutUser}
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
            onUserUpdated={(u) => setCurrentUser(u)}
          />
        )}

        {/* Secret Admin Panel Route */}
        {currentPage === 'admin' && (
          (currentUser?.role === 'admin') ? (
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
            pageType={pageParams?.page === 'shipping-policy' ? 'shipping' : pageParams?.page || 'faq'}
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
            onLoginSuccess={(token, user) => {
              handleLoginSuccess(token, user?.role === 'admin');
              setCurrentUser(user);
            }}
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

      {currentPage !== 'admin' && showFirstVisitLogin && (
        <FirstVisitLogin
          onClose={() => {
            localStorage.setItem('bvlife_welcome_offer_seen', 'true');
            setShowFirstVisitLogin(false);
          }}
          onLogin={(token, user) => {
            handleLoginSuccess(token);
            setCurrentUser(user);
            setAppliedCoupon({
              code: 'WELCOME10',
              discountType: 'percentage',
              value: 10,
              minOrderValue: 0,
              expiryDate: '2027-12-31',
              active: true
            });
          }}
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
            localStorage.setItem('Bv_auth_token', token);
            setAuthToken(token);
          }}
        />
      )}

    </div>
  );
}
