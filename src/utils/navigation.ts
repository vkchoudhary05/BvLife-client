/**
 * Helper to parse current URL and return initial page + params
 */
export const getPageFromUrl = () => {
  if (typeof window === 'undefined') {
    return { page: 'home', params: null };
  }
  const path = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  
  if (path === '/' || path === '') {
    return { page: 'home', params: null };
  }
  
  const cleanPath = path.substring(1); // remove leading slash
  
  if (cleanPath === 'shop') {
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    return { page: 'shop', params: { search, category } };
  }
  
  if (cleanPath === 'product') {
    const id = searchParams.get('id') || '';
    return { page: 'product', params: { id } };
  }
  
  if (cleanPath === 'admin' || cleanPath === 'admin-login') {
    return { page: 'admin', params: null };
  }
  
  if (cleanPath === 'order-confirmation' || cleanPath === 'order-success') {
    const id = searchParams.get('id') || searchParams.get('orderId') || '';
    return { page: 'order-confirmation', params: { id } };
  }

  // Check if it is a static page or blogs / faqs
  const staticPages = ['blogs', 'faqs', 'about', 'contact', 'terms', 'privacy', 'expert-panel', 'impact', 'shipping-policy'];
  if (staticPages.includes(cleanPath)) {
    return { page: 'static', params: { page: cleanPath } };
  }
  
  // Default match for other pages
  const knownPages = ['cart', 'checkout', 'dashboard', 'login', 'track-order', 'wishlist', 'order-confirmation', 'order-success', 'consult-doctor', 'consultation'];
  if (knownPages.includes(cleanPath)) {
    return { page: cleanPath, params: null };
  }
  
  return { page: 'home', params: null };
};
