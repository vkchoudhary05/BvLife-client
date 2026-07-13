/**
 * English-Only Translation Dictionary and Helpers for Gram's Life
 */

export type Language = 'en' | 'hi';

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Top banner & Navbar
    "promoBanner": "✨ FREE SHIPPING ON AUTHENTIC AYURVEDA ORDERS OVER ₹999 | USE CODE: AYUR15 FOR 15% OFF",
    "navHome": "Home",
    "navShop": "Shop Apothecary",
    "navBlogs": "Blogs",
    "navHeritage": "Our Heritage",
    "navContact": "Contact",
    "navAskAcharya": "Ask Acharya",
    "navSearchPlaceholder": "Search Golden Chyawanprash, Ashwagandha...",
    "navWishlist": "Wishlist",
    "navCart": "Cart",
    "navProfile": "Profile",
    "navLogout": "Log Out",
    "navLogin": "Sign In",
    "navRegister": "Register",
    "organicWellbeing": "Organic Wellbeing",

    // Hero Section / Slide 1
    "hero_s1_subtitle": "Restoring Ayurvedic Purity",
    "hero_s1_title": "Precious Remedies For Flawless Daily Vitality.",
    "hero_s1_desc": "We handcraft small-batch, AYUSH certified organic formulations. Utilizing high-altitude Kashmiri Saffron, organic Ghee, and wild mountain forest honey according to sacred Vedic scripts.",
    "hero_s1_action": "Shop Now",
    "hero_s1_prod_desc": "Highest-Rated Seasonal Immunity Tonic",

    // Hero Section / Slide 2
    "hero_s2_subtitle": "Ancient Wisdom, Peak Stamina",
    "hero_s2_title": "BVLife Himalayan Shilajeet Gold Resin",
    "hero_s2_desc": "100% pure BVLife Himalayan Shilajeet resin purified via classical Ayurvedic Shodhana methods. Infused with Swarna Bhasma (24K Gold) and Safed Musli for cellular energy and maximum physical vitality.",
    "hero_s2_action": "Shop Now",
    "hero_s2_prod_desc": "Purified High-Altitude Strength Tonic",

    // Hero Section / Slide 3
    "hero_s3_subtitle": "Saffron Skin Alchemy",
    "hero_s3_title": "Kumkumadi Radiance Face Elixir",
    "hero_s3_desc": "A legendary night beauty oil infused with Kashmiri Saffron and goat milk. Preserved in micro-batches to restore youthfulness, heal pigmentation, and brighten dull skin complexions.",
    "hero_s3_action": "Shop Now",
    "hero_s3_prod_desc": "Saffron & Sandalwood Brightening Oil",

    // Categories
    "cat_immunity": "Immunity",
    "cat_skin_care": "Skin Care",
    "cat_digestion": "Digestion",
    "cat_hair_care": "Hair Care",
    "cat_oils": "Oils",
    "cat_brain_memory": "Brain & Memory",
    "cat_sleep_stress": "Sleep & Stress",
    "cat_sexual_wellness": "Sexual Wellness",
    "cat_all": "All Remedies",
    "formulations_suffix": "Formulations",

    // Category Section Header
    "section_cat_subtitle": "Organic Heritage",
    "section_cat_title": "Shop Organic Remedies By Need",
    "section_cat_desc": "Target biological imbalances using pure herbs extracted ethically.",

    // Featured Products Header
    "section_feat_subtitle": "Apothecary Curations",
    "section_feat_title": "Our Premium Recommendations",
    "section_feat_browse": "Browse Recommendations",

    // Top Selling Header
    "section_top_subtitle": "Vedic Favorites",
    "section_top_title": "Top Selling Products",
    "section_top_browse": "Browse Best Sellers",

    // Exclusive Offer Section
    "exclusive_offer_tag": "Seasonal Compound Offer",
    "exclusive_offer_title": "Aacharya Recharging Trio",
    "exclusive_offer_subtitle": "Complete 30-Day Rejuvenation Kit",
    "exclusive_offer_desc": "Consisting of Golden Saffron Chyawanprash (1 jar), stress-busting Pure Ashwagandha KSM-66 capsules (1 pack), and colon digestive-cleansing Triphala powder (1 box). Synergized together to optimize cellular recovery, digest stomach toxins (Ama), and eliminate brain fog.",
    "exclusive_offer_save": "SAVE ₹440 INSTANTLY",
    "exclusive_offer_btn": "Secure Seasonal Compound Offer",

    // Testimonials
    "section_test_subtitle": "Over 50,000 Lives Revitalized",
    "section_test_title": "Verified logs of customers who integrated Vedic health into daily routines.",
    "test_1_comment": "\"The Kumkumadi face elixir is pure gold! Yes, the pricing feels premium, but my dark circles and pigmentation marks have completely faded in less than a month. It smells of fresh saffron and leaves my skin deeply moisturized when I wake up. Pure bliss!\"",
    "test_1_author": "Aradhana Nair",
    "test_1_role": "Verified Practitioner",
    "test_2_comment": "\"As an software engineer, constant coding burnt out my energy. Ashwagandha root capsules KSM-66 changed my sleep entirely. I wake up completely rested. My daily anxiety has vanished. Truly the gold-standard adaptogen.\"",
    "test_2_author": "Kartik Sharma",
    "test_2_role": "Verified Tech Lead",
    "test_3_comment": "\"I suffered chronic bloating and constipation for 5 years. Tried countless digestion syrups. Grams Life Triphala powder cured my digestive agni in exactly 12 days. I take a teaspoon in warm water before bedtime. Felt lighter immediately!\"",
    "test_3_author": "Samyuktha Reddy",
    "test_3_role": "Verified Yoga Acharya",

    // Blogs Header
    "section_blog_subtitle": "Vedic Chronicles",
    "section_blog_title": "Ayurvedic Chronicles & Living",
    "section_blog_browse": "Read All Chronicles",

    // Cart and Checkout Buttons
    "btn_add_to_cart": "Add to Cart",
    "btn_buy_now": "Buy Now",
    "btn_quick_view": "Quick View",
    "btn_adding": "Adding...",
    "btn_out_of_stock": "Out of Stock",
    "original_price": "Original Price",
    "our_price": "Our Price",
    "discount_applied": "Discount Applied",

    // Cart Page
    "cart_title": "Your Healing Cart",
    "cart_empty": "Your cart is currently empty of remedies.",
    "cart_start_shopping": "Start Shopping Remedies",
    "cart_summary": "Order Summary",
    "cart_subtotal": "Remedies Subtotal",
    "cart_shipping": "Vedic Shipping",
    "cart_tax": "GST & Ayurvedic Cess",
    "cart_discount": "Voucher Discount",
    "cart_total": "Total Amount",
    "cart_checkout_btn": "Proceed to Checkout",
    "cart_promo_label": "Apply Holy Coupon",
    "cart_promo_placeholder": "e.g., AYUR15",
    "cart_promo_btn": "Apply",

    // Checkout Page
    "checkout_title": "Ayurvedic Dispatch Desk",
    "checkout_shipping_details": "Recipient & Shipping Address",
    "checkout_fullname": "Full Name",
    "checkout_address1": "Address Line 1",
    "checkout_address2": "Address Line 2 (Optional)",
    "checkout_city": "City",
    "checkout_state": "State",
    "checkout_zip": "PIN Code",
    "checkout_phone": "Phone Number",
    "checkout_payment_method": "Vedic Payment Channel",
    "checkout_cod": "Cash on Delivery (COD)",
    "checkout_cards": "Credit / Debit Cards",
    "checkout_upi": "UPI Auto-pay (GPay/PhonePe)",
    "checkout_netbanking": "Net Banking",
    "checkout_place_order": "Authenticate & Ship Order",
    "checkout_submitting": "Processing Dispatch...",

    // Product Detail Page
    "prod_sku": "Formulation SKU",
    "prod_benefits": "Therapeutic Benefits",
    "prod_ingredients": "Sacred Botanical Ingredients",
    "prod_dosage": "Prescribed Dosage",
    "prod_instructions": "Usage Instructions",
    "prod_reviews": "Aura Reviews & Ratings",
    "prod_write_review": "Write a Formulation Review",
    "review_placeholder": "How has this formulation impacted your biological vitality?",
    "review_submit": "Submit Review",
    "review_approved_alert": "Review submitted successfully! It will be shown once audited by our staff.",

    // AI Consultant
    "ai_consultant_title": "Consult Our AI Acharya",
    "ai_consultant_subtitle": "Traditional diagnostic engine synchronized with sacred scripts.",
    "ai_placeholder": "Ask about joint pain, digestion, stress, skin remedies...",
    "ai_btn_ask": "Ask Acharya",
    "ai_btn_thinking": "Acharya is meditating...",
    "ai_greetings": "Pranam, seeker of health. I am Acharya, your digital guide to holistic Ayurvedic wellbeing. Tell me about your body constitution (Prakriti), seasonal distress, or symptoms, and I shall provide certified Vedic guidance.",

    // Login Portal
    "login_verify_title": "Verify Identity",
    "login_otp_msg": "Enter the simulated OTP code sent to your mobile device.",
    "login_passcode": "OTP Passcode",
    "login_back": "Back",
    "login_verify_submit": "Verify & Sign Up",
    "login_name": "Full Name",
    "login_phone": "Phone Number",
    "login_email": "Email Address",
    "login_password": "Password",
    "login_confirm": "Confirm Password",
    "login_req_verification": "Request Verification",
    "login_forgot": "Forgot Password?",
    "login_registry_email": "Registry Email",
    "login_registry_pass": "Registry Password",
    "login_welcome_back": "Welcome Back",
    "login_staff_access": "Access Healer / Staff Portal ➔",
    "login_quick_autofill": "Sandbox Quick Profiles (Autofill)",
    "login_one_tap": "One-Tap",

    // Dashboard
    "dash_my_profile": "My Wellness Profile",
    "dash_history": "Order Dispatch History",
    "dash_wishlist": "Saved Healing Wishlist",
    "dash_address": "Saved Locations",
    "dash_no_orders": "No historical orders found.",
    "dash_status": "Status",
    "dash_tracking": "Tracking Number",
    "dash_action_shop": "Explore Formulations"
  },
  hi: {} as Record<string, string>
};

/**
 * Returns translation for a key, always returning English.
 */
export const t = (key: string, lang: Language = 'en'): string => {
  return translations['en'][key] || key;
};

/**
 * Static translation map for Product / Ingredient names (always returns original english text)
 */
export const translateProductAttr = (text: string, lang: Language): string => {
  return text;
};
