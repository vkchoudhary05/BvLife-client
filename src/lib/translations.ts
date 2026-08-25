
/**
 * Simple Indian Ayurvedic Translation Dictionary for Bv's Life
 */

export type Language = 'en' | 'hi';

export const translations: Record<Language, Record<string, string>> = {
  en: {

    // Top Banner & Navbar
    "promoBanner": "✨ FREE SHIPPING ON AYURVEDIC ORDERS OVER ₹999 | USE CODE: AYUR15 FOR 15% OFF",
    "navHome": "Home",
    "navShop": "Shop Now",
    "navBlogs": "Ayurveda Blogs",
    "navHeritage": "Our Heritage",
    "navContact": "Contact Us",
    "navAskAcharya": "Ask an Expert",
    "navSearchPlaceholder": "Search Chyawanprash, Ashwagandha...",
    "navWishlist": "Wishlist",
    "navCart": "Cart",
    "navProfile": "My Account",
    "navLogout": "Log Out",
    "btnAskAcharya": "Ask Ayurvedic Expert ✦ Free Consultation",
    "navLogin": "Sign In",
    "navRegister": "Create Account",
    "organicWellbeing": "Natural Wellbeing",

    // Hero Section / Slide 1
    "hero_s1_subtitle": "Pure Ayurvedic Care",
    "hero_s1_title": "Natural Care For Everyday Health.",
    "hero_s1_desc": "We prepare small-batch Ayurvedic products using quality natural ingredients like Kashmiri Saffron, organic Ghee, and natural mountain honey, following traditional Ayurvedic practices.",
    "hero_s1_action": "Shop Now",
    "hero_s1_prod_desc": "Seasonal Immunity Support",

    // Hero Section / Slide 2
    "hero_s2_subtitle": "Traditional Strength & Energy",
    "hero_s2_title": "BVLife Himalayan Shilajit Gold Resin",
    "hero_s2_desc": "Pure Himalayan Shilajit resin prepared using traditional Ayurvedic purification methods. Enriched with Swarna Bhasma and Safed Musli to support energy, strength, and overall vitality.",
    "hero_s2_action": "Shop Now",
    "hero_s2_prod_desc": "Pure Himalayan Shilajit Resin",

    // Hero Section / Slide 3
    "hero_s3_subtitle": "Natural Skin Care",
    "hero_s3_title": "Kumkumadi Radiance Face Oil",
    "hero_s3_desc": "A traditional Ayurvedic face oil made with Kashmiri Saffron and other natural ingredients. Helps nourish the skin and support a healthy, natural glow.",
    "hero_s3_action": "Shop Now",
    "hero_s3_prod_desc": "Saffron & Sandalwood Face Oil",

    // Categories
    "cat_immunity": "Immunity",
    "cat_skin_care": "Skin Care",
    "cat_digestion": "Digestion",
    "cat_hair_care": "Hair Care",
    "cat_oils": "Oils",
    "cat_brain_memory": "Brain & Memory",
    "cat_sleep_stress": "Sleep & Stress",
    "cat_sexual_wellness": "Men's Wellness",
    "cat_all": "All Products",
    "formulations_suffix": "Products",

    // Category Section
    "section_cat_subtitle": "Traditional Ayurveda",
    "section_cat_title": "Shop Ayurveda For Your Needs",
    "section_cat_desc": "Explore natural Ayurvedic products made with carefully selected herbs and ingredients.",

    // Featured Products
    "section_feat_subtitle": "Ayurvedic Favorites",
    "section_feat_title": "Our Recommended Products",
    "section_feat_browse": "View All Products",

    // Top Selling
    "section_top_subtitle": "Customer Favorites",
    "section_top_title": "Best Selling Products",
    "section_top_browse": "View Best Sellers",

    // Exclusive Offer
    "exclusive_offer_tag": "Special Ayurvedic Offer",
    "exclusive_offer_title": "Ayurvedic Wellness Combo",
    "exclusive_offer_subtitle": "Complete 30-Day Wellness Kit",
    "exclusive_offer_desc": "A carefully selected combination of Golden Saffron Chyawanprash, Ashwagandha KSM-66 capsules, and Triphala powder to support immunity, energy, digestion, and everyday wellness.",
    "exclusive_offer_save": "SAVE ₹440",
    "exclusive_offer_btn": "Shop This Combo",

    // Testimonials
    "section_test_subtitle": "Trusted by 50,000+ Customers",
    "section_test_title": "What Our Customers Say",

    "test_1_comment": "\"The Kumkumadi face oil has become part of my daily skin care routine. My skin feels soft, nourished, and naturally brighter. I really enjoy the gentle saffron fragrance.\"",
    "test_1_author": "Aradhana Nair",
    "test_1_role": "Verified Customer",

    "test_2_comment": "\"I started using Ashwagandha capsules for better sleep and everyday energy. After using them regularly, I feel more refreshed in the morning.\"",
    "test_2_author": "Kartik Sharma",
    "test_2_role": "Verified Customer",

    "test_3_comment": "\"I have been using Triphala powder as part of my daily routine. It has helped me maintain better digestion and I feel lighter and more comfortable.\"",
    "test_3_author": "Samyuktha Reddy",
    "test_3_role": "Verified Customer",

    // Blogs
    "section_blog_subtitle": "Ayurveda Knowledge",
    "section_blog_title": "Ayurveda & Healthy Living",
    "section_blog_browse": "Read All Articles",

    // Cart & Checkout Buttons
    "btn_add_to_cart": "Add to Cart",
    "btn_buy_now": "Buy Now",
    "btn_quick_view": "Quick View",
    "btn_adding": "Adding...",
    "btn_out_of_stock": "Out of Stock",
    "original_price": "Original Price",
    "our_price": "Our Price",
    "discount_applied": "Discount Applied",

    // Cart Page
    "cart_title": "Your Cart",
    "cart_empty": "Your cart is empty.",
    "cart_start_shopping": "Start Shopping",
    "cart_summary": "Order Summary",
    "cart_subtotal": "Subtotal",
    "cart_shipping": "Shipping",
    "cart_tax": "GST",
    "cart_discount": "Discount",
    "cart_total": "Total Amount",
    "cart_checkout_btn": "Proceed to Checkout",
    "cart_promo_label": "Have a Coupon Code?",
    "cart_promo_placeholder": "e.g. AYUR15",
    "cart_promo_btn": "Apply",

    // Checkout Page
    "checkout_title": "Checkout",
    "checkout_shipping_details": "Shipping Details",
    "checkout_fullname": "Full Name",
    "checkout_address1": "Address Line 1",
    "checkout_address2": "Address Line 2 (Optional)",
    "checkout_city": "City",
    "checkout_state": "State",
    "checkout_zip": "PIN Code",
    "checkout_phone": "Phone Number",

    "checkout_payment_method": "Payment Method",
    "checkout_cod": "Cash on Delivery (COD)",
    "checkout_cards": "Credit / Debit Card",
    "checkout_upi": "UPI (GPay / PhonePe)",
    "checkout_netbanking": "Net Banking",
    "checkout_place_order": "Place Order",
    "checkout_submitting": "Processing Order...",

    // Product Detail Page
    "prod_sku": "Product Code",
    "prod_benefits": "Benefits",
    "prod_ingredients": "Ingredients",
    "prod_dosage": "Dosage",
    "prod_instructions": "How to Use",
    "prod_reviews": "Customer Reviews",
    "prod_write_review": "Write a Review",
    "review_placeholder": "Tell us about your experience with this product.",
    "review_submit": "Submit Review",
    "review_approved_alert": "Thank you! Your review has been submitted and will be published after approval.",

    // AI Consultant
    "ai_consultant_title": "Ask Our Ayurvedic Expert",
    "ai_consultant_subtitle": "Get simple guidance based on traditional Ayurvedic knowledge.",
    "ai_placeholder": "Ask about digestion, stress, skin care, joint care...",
    "ai_btn_ask": "Ask Expert",
    "ai_btn_thinking": "Thinking...",
    "ai_greetings": "Namaste! I am your Ayurvedic wellness assistant. Ask me about Ayurveda, daily wellness, herbs, diet, or traditional Ayurvedic practices.",

    // Login Portal
    "login_verify_title": "Verify Your Mobile Number",
    "login_otp_msg": "Enter the OTP sent to your mobile number.",
    "login_passcode": "OTP",
    "login_back": "Back",
    "login_verify_submit": "Verify & Continue",
    "login_name": "Full Name",
    "login_phone": "Phone Number",
    "login_email": "Email Address",
    "login_password": "Password",
    "login_confirm": "Confirm Password",
    "login_req_verification": "Get OTP",
    "login_forgot": "Forgot Password?",
    "login_registry_email": "Email Address",
    "login_registry_pass": "Password",
    "login_welcome_back": "Welcome Back",
    "login_staff_access": "Staff Login ➔",
    "login_quick_autofill": "Quick Login",
    "login_one_tap": "One-Tap Login",

    // Dashboard
    "dash_my_profile": "My Profile",
    "dash_history": "My Orders",
    "dash_wishlist": "My Wishlist",
    "dash_address": "Saved Addresses",
    "dash_no_orders": "No orders found.",
    "dash_status": "Order Status",
    "dash_tracking": "Tracking Number",
    "dash_action_shop": "Shop Now"
  },

  hi: {} as Record<string, string>
};

/**
 * Returns English translation.
 */
export const t = (key: string, lang: Language = 'en'): string => {
  return translations['en'][key] || key;
};

/**
 * Product / Ingredient names remain unchanged.
 */
export const translateProductAttr = (
  text: string,
  lang: Language
): string => {
  return text;
};
