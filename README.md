# BrandMeetsCode DataLayer Tracker (free / WordPress.org)

> **Consent-aware dataLayer for WordPress — GTM-ready events, engagement signals, WooCommerce browser ecommerce, and an admin debug overlay.**

**Repository:** [github.com/wholmes/bmc-datalayer-tracker](https://github.com/wholmes/bmc-datalayer-tracker)

```bash
git clone git@github.com:wholmes/bmc-datalayer-tracker.git
```

## Repository layout (developers)

| Artifact | Folder (repo, WordPress, and ZIP) | Build |
|----------|-----------------------------------|-------|
| **Free** (WordPress.org) | `brandmeetscode-datalayer-tracker/` | `./build-free-zip.sh` from repo root |

- **WordPress.org slug / text domain:** `brandmeetscode-datalayer-tracker`
- **Current release:** `1.2.5`
- **Buyer-facing readme:** `brandmeetscode-datalayer-tracker/README.txt`
- **wp-admin menu label:** DataLayer Tracker
- **This `README.md`:** developer documentation only
- **Author:** [Brand Meets Code](https://brandmeetscode.com/) — [Whittfield Holmes](https://brandmeetscode.com/)

The **Pro add-on** is a separate product (not in this repository).

**Local WordPress:** point `wp-content/plugins/` at **only** the two folders above—not the repo root:

```bash
./dev-link-wp-plugins.sh /path/to/wordpress/wp-content/plugins
# Full directory copy instead of symlinks:
# COPY=1 ./dev-link-wp-plugins.sh /path/to/wordpress/wp-content/plugins
```

---

## 🚀 Overview

**DataLayer Tracker** (WordPress.org listing: *BrandMeetsCode DataLayer Tracker*) is the free WordPress plugin from **[Brand Meets Code](https://brandmeetscode.com/)**, created by **[Whittfield Holmes](https://brandmeetscode.com/)**. It injects a structured, consent-aware `dataLayer` for Google Tag Manager, engagement signals, forms, sessions, and optional WooCommerce browser ecommerce—without license gates or disabled settings.

**Product site & docs:** [datalayer-tracker.com](https://datalayer-tracker.com) · [Knowledge base](https://datalayer-tracker.com/knowledge-base)

### What Makes This Build Different?

- **🎯 Structured dataLayer** — Page context, engagement, forms, and sessions pushed consistently for GTM
- **🔒 Consent-aware** — CMP detection (CookieYes, Cookiebot, OneTrust, Complianz, TCF, and more)
- **🛍️ WooCommerce** — GA4-style browser ecommerce events when WooCommerce is active
- **📦 GTM-ready** — Optional container snippet; you configure tags inside Tag Manager
- **🔍 Debug overlay** — Admin-only live event inspector on your site
- **➕ Optional Pro add-on** — Pixels, server-side (GA4 MP, Meta CAPI), GTM JSON export, and more ship in a **separate** plugin ([datalayer-tracker.com](https://datalayer-tracker.com))

---

## 📋 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Core Features](#-core-features)
  - [Engagement Tracking](#1-engagement-tracking)
  - [Ecommerce Tracking](#2-ecommerce-tracking-woocommerce)
  - [Form Tracking](#3-form-tracking)
  - [Pixel Manager](#4-multi-pixel-tracking-premium)
  - [Consent Management](#5-consent-management)
  - [Content Intelligence](#6-content-intelligence)
- [Configuration](#-configuration)
- [GTM Integration](#-gtm-integration)
- [Developer Guide](#-developer-guide)
- [Premium Features](#-premium-features)
- [Troubleshooting](#-troubleshooting)
- [Changelog](#-changelog)
- [Support](#-support)

---

## ✨ Features

### 🎯 **Engagement Tracking**
- **Scroll Depth** - Track 25%, 50%, 75%, 90% milestones
- **scroll_back_up** - Detect when users scroll_back_up (re-engagement)
- **Time on Page** - Accurate time tracking (10s, 30s, 60s, 120s+)
- **Active Time** - Real active engagement (excluding idle time)
- **Focus/Blur** - Tab visibility and window focus tracking
- **Hover Intent** - Track meaningful hover interactions
- **CTA Exposure** - Button/link visibility tracking
- **Last Engaged Section** - Know where users spend time
- **Video Progress** - YouTube, Vimeo tracking (25%, 50%, 75%, 95%, 100%)

### 🛍️ **Ecommerce (WooCommerce)**
- **GA4 Full Spec** - Complete GA4 ecommerce implementation
- **Cart Abandonment** - 30min inactivity + 10min tab away + exit intent
- **Session Context** - Every event includes session data
- **Purchase Verification** - Multiple fallbacks ensure tracking
- **Events Tracked:**
  - `view_item` - Product page views
  - `view_item_list` - Category/shop pages
  - `add_to_cart` - Cart additions (AJAX-aware)
  - `remove_from_cart` - Cart removals
  - `view_cart` - Cart page views
  - `begin_checkout` - Checkout initiation
  - `add_payment_info` - Payment method selection
  - `add_shipping_info` - Shipping details
  - `purchase` - Order completion
  - `refund` - Order refunds

### 📝 **Form Tracking**
- **Universal Detection** - Works with any form
- **Vendor Support:**
  - Gravity Forms
  - Contact Form 7
  - Formidable Forms
  - WPForms
  - Ninja Forms
  - HubSpot Forms
  - Marketo Forms
  - Pardot
  - Mailchimp
  - ActiveCampaign
  - TypeForm (embedded)
- **Field-Level Tracking** - Monitor individual field interactions
- **Events:**
  - `form_view` - Form visibility
  - `form_field_start` - First interaction
  - `form_submit` - Successful submission
  - `form_error` - Validation errors
  - `form_abandon` - Incomplete submissions
  - `field_interaction` - Per-field tracking

### 🎨 **Multi-Pixel Tracking** *(Premium)*
- **Platforms Supported:**
  - Meta (Facebook) Pixel
  - TikTok Pixel
  - Google Ads (gtag)
  - LinkedIn Insight Tag
  - X (Twitter) Pixel
  - Pinterest Tag
- **Dual Pixel Mode** - Fire directly to SDKs + GTM simultaneously
- **Event Mapping** - Map dataLayer events to specific pixels
- **Consent-Aware** - Automatic blocking until consent granted
- **SDK Auto-Loading** - Manages pixel script injection

### 🔒 **Consent Management**
- **CMP Support:**
  - OneTrust
  - Cookiebot
  - Complianz
  - iubenda
  - TCF v2.2 (IAB Framework)
  - Custom implementations
- **Auto-Detection** - 5-second timeout with fallback
- **Graceful Degradation** - Track without consent if configured
- **Consent Events:**
  - `consent_granted`
  - `consent_denied`
  - `consent_updated`

### 🧠 **Content Intelligence**
- **Last Content Type Viewed** - Post, page, product, category
- **Reading Progress** - Scroll-based article completion
- **Content Interaction** - Links, buttons, media engagement
- **Dynamic Detection** - Adapts to any theme/builder

### 🔧 **Developer Tools**
- **Debug Overlay** - Visual event inspector
- **Event Simulator** - Test events without triggering actions
- **Event Filters** - Real-time event filtering in overlay
- **SDK Status** - See which pixels loaded successfully
- **Blocked Events** - View consent-blocked events
- **Export History** - Track all GTM exports
- **Settings Import/Export** - JSON configuration backup

---

## 📦 Installation

### Automatic Installation

1. Log into your WordPress admin dashboard
2. Navigate to **Plugins > Add New**
3. Search for **"DataLayer Tracker"** or **"BrandMeetsCode DataLayer Tracker"**
4. Click **Install Now** → **Activate**

### Manual Installation

1. Download the plugin ZIP file
2. Navigate to **Plugins > Add New > Upload Plugin**
3. Choose the ZIP file and click **Install Now**
4. Click **Activate Plugin**

### Via FTP

1. Build or download the ZIP (`./build-free-zip.sh` → `brandmeetscode-datalayer-tracker-wporg-*.zip`)
2. Extract it — you should get a **`brandmeetscode-datalayer-tracker`** folder
3. Upload that folder to `/wp-content/plugins/`
4. Activate via **Plugins** in WordPress

**Local development:** from this repo root, run `./dev-link-wp-plugins.sh /path/to/wp-content/plugins` (symlinks dev sources as `brandmeetscode-datalayer-tracker`).

---

## 🚀 Quick Start

### 1. **Enable Core Features**

Open **DataLayer Tracker** in the WordPress admin sidebar

**Recommended Initial Setup:**
```
✅ Engagement Tracking
  ✓ Scroll Depth
  ✓ Time on Page
  ✓ Active Time
  
✅ Content Intelligence
  ✓ Last Content Type Viewed
  ✓ Last Engaged Section

✅ Form Tracking
  ✓ Form Submit
  ✓ Form Vendor Detection

✅ WooCommerce (if installed)
  ✓ Enable Ecommerce Tracking
```

### 2. **Configure GTM**

**Option A: Use ADT's GTM Export** *(Recommended)*
1. Go to **GTM Export** tab
2. Select features to include
3. Click **Download GTM Container JSON**
4. Import into your GTM container

**Option B: Manual GTM Setup**
1. Create a trigger for each ADT event (e.g., `scroll_depth_75`)
2. Use built-in variables from dataLayer
3. Configure your tags

### 3. **Enable Debug Mode** *(Development)*

```
✅ Debug Settings
  ✓ Enable Debug Mode
  ✓ Enable Debug Overlay
  ✓ Show Event Filters
  ✓ Show Blocked Events
```

The overlay appears in bottom-right corner (admins only).

### 4. **Test Your Setup**

1. Open your site in a new tab
2. Open browser console (F12)
3. Type: `window.dataLayer` to see all events
4. Or use the visual Debug Overlay

---

## 🎯 Core Features

### 1. Engagement Tracking

#### **Scroll Depth**
Tracks scroll milestones automatically:

```javascript
// Fired events:
{
  event: 'scroll_depth_25',
  scroll_depth: 25,
  page_url: '/about-us',
  session_id: 'sess_abc123',
  ...
}
```

**Configuration:**
- Settings → Engagement → Scroll Depth
- Milestones: 25%, 50%, 75%, 90%

#### **Active Time Tracking**
Measures real user engagement (pauses when idle):

```javascript
{
  event: 'active_time_30',
  active_seconds: 30,
  total_time: 45,  // includes idle
  is_idle: false,
  ...
}
```

#### **Video Tracking**
Automatic YouTube & Vimeo detection:

```javascript
{
  event: 'video_progress_50',
  video_url: 'https://youtube.com/watch?v=...',
  video_title: 'Product Demo',
  video_percent: 50,
  video_provider: 'youtube'
}
```

---

### 2. Ecommerce Tracking (WooCommerce)

#### **Setup**
1. Install WooCommerce
2. Enable: Settings → WooCommerce → Enable Ecommerce Tracking
3. Events fire automatically

#### **Product View**
```javascript
{
  event: 'view_item',
  ecommerce: {
    currency: 'USD',
    value: 29.99,
    items: [{
      item_id: 'SKU123',
      item_name: 'Blue T-Shirt',
      item_category: 'Apparel',
      item_brand: 'YourBrand',
      price: 29.99,
      quantity: 1
    }]
  }
}
```

#### **Add to Cart**
AJAX-aware with mini-cart support:

```javascript
{
  event: 'add_to_cart',
  ecommerce: {
    currency: 'USD',
    value: 29.99,
    items: [...]
  },
  cart_total_items: 3,
  cart_total_value: 89.97
}
```

#### **Purchase Tracking**
Multiple fallback methods ensure 100% capture:

```javascript
{
  event: 'purchase',
  ecommerce: {
    transaction_id: 'ORDER-123',
    affiliation: 'Your Store',
    value: 89.97,
    tax: 7.20,
    shipping: 5.00,
    currency: 'USD',
    coupon: 'SAVE10',
    items: [...]
  }
}
```

#### **Cart Abandonment**
Tracks abandonment via:
- 30 minutes of inactivity
- 10 minutes with tab not visible
- Exit intent (mouse leave)

```javascript
{
  event: 'cart_abandoned',
  abandonment_reason: 'inactivity_30min',
  cart_value: 89.97,
  items_count: 3,
  session_duration: 1847  // seconds
}
```

---

### 3. Form Tracking

#### **Universal Form Detection**
Works with any HTML form + major vendors:

```javascript
{
  event: 'form_submit',
  form_id: 'contact-form-7',
  form_name: 'Contact Us',
  form_vendor: 'contact_form_7',
  form_fields: ['name', 'email', 'message'],
  submission_time: 45  // seconds to complete
}
```

#### **Field-Level Tracking** *(Premium)*
```javascript
{
  event: 'field_interaction',
  form_id: 'gform_1',
  field_name: 'email',
  field_type: 'email',
  field_value_length: 24,  // privacy-safe
  time_spent: 8  // seconds
}
```

#### **Form Abandonment**
```javascript
{
  event: 'form_abandon',
  form_id: 'gform_1',
  fields_started: 4,
  fields_completed: 2,
  abandoned_at: 'phone',
  time_on_form: 67
}
```

---

### 4. Multi-Pixel Tracking *(Premium)*

#### **Configuration**

**1. Enable Pixels**
Settings → Pixel Tracking → Enable Pixel Tracking

**2. Configure Platforms**
```
Meta Pixel:
  ✓ Enabled
  Pixel ID: 1234567890
  
TikTok Pixel:
  ✓ Enabled  
  Pixel ID: ABCD1234
  
Google Ads:
  ✓ Enabled
  Conversion ID: AW-123456
```

**3. Event Mapping**
Map dataLayer events to pixel events:

```json
{
  "form_submit": ["meta", "google"],
  "purchase": ["meta", "tiktok", "google", "linkedin"],
  "add_to_cart": ["meta", "tiktok"],
  "view_item": ["meta", "pinterest"]
}
```

#### **Dual Pixel Mode**
Fire events to both GTM dataLayer AND directly to pixel SDKs:

- **Single Mode**: Events → GTM only
- **Dual Mode**: Events → GTM + Direct SDK calls

**When to use Dual Mode:**
- Need real-time pixel firing (no GTM delay)
- Server-side GTM with client-side pixels
- A/B testing tracking methods

#### **Automatic SDK Loading**
ADT loads pixel scripts automatically:

```javascript
// Meta Pixel
!function(f,b,e,v,n,t,s){...}(window,document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');

// TikTok Pixel  
!function(w,d,t){...}(window,document,'ttq');

// Etc...
```

#### **Consent Integration**
Pixels blocked until consent granted:

```javascript
// Automatically managed:
if (hasConsent('marketing')) {
  fbq('track', 'AddToCart', {...});
}
```

---

### 5. Consent Management

#### **Supported CMPs**
- OneTrust
- Cookiebot  
- Complianz
- iubenda
- TCF v2.2 (IAB)
- Custom (via filters)

#### **Configuration**

```php
// Settings → Consent Management
Preferred CMP: Auto-detect
Detection Timeout: 5 seconds
Delay Until Consent: Yes
Fallback Track Without CMP: Yes  // Safe default
```

#### **How It Works**

1. **Detection** - ADT scans for CMP (5s timeout)
2. **Wait** - If "Delay Until Consent" enabled, events queued
3. **Release** - On consent, queued events fire
4. **Block** - Without consent, only essential events fire

#### **Event Queue**
```javascript
// Before consent:
window._adtEventQueue = [
  {event: 'page_view', ...},
  {event: 'scroll_depth_25', ...},
  // ... queued
];

// After consent granted:
// Queue automatically flushed to dataLayer
```

#### **Custom CMP Integration**

```javascript
// Your CMP:
window.MyCMP.onConsentChange(function(consent) {
  if (consent.analytics) {
    window.dispatchEvent(new Event('adt_consent_granted'));
  }
});
```

Or via WordPress filter:

```php
add_filter('adt_has_consent', function($has_consent, $purpose) {
  return my_cmp_check($purpose);
}, 10, 2);
```

---

### 6. Content Intelligence

#### **Last Content Type Viewed**
```javascript
{
  event: 'content_view',
  content_type: 'product',  // post, page, product, category
  content_id: 123,
  content_title: 'Blue T-Shirt',
  content_category: 'Apparel > Shirts'
}
```

#### **Last Engaged Section**
Detects which page section users focus on:

```javascript
{
  event: 'section_engagement',
  section_id: 'features',
  section_title: 'Key Features',
  time_in_section: 45,
  scroll_depth_in_section: 80
}
```

#### **Reading Progress**
For blog posts/articles:

```javascript
{
  event: 'reading_progress_75',
  article_title: 'How to Use ADT',
  words_read: 750,
  estimated_read_time: 180,  // seconds
  actual_read_time: 145
}
```

---

## ⚙️ Configuration

### Essential Settings

#### **1. General Settings**

```
Plugin Status:
  ✓ Enable DataLayer Tracker

Debug Settings:
  ✓ Debug Mode (dev only)
  ✓ Enable Debug Overlay (dev only)
  Overlay Minimum Role: Administrator
```

#### **2. Engagement Settings**

```
Scroll Tracking:
  ✓ Enable Scroll Depth
  ✓ Enable scroll_back_up
  
Time Tracking:
  ✓ Time on Page
  ✓ Active Time (idle-aware)
  
Interaction:
  ✓ Focus/Blur
  ✓ Hover Intent
  Hover Delay: 500ms
```

#### **3. Ecommerce Settings** *(WooCommerce)*

```
WooCommerce:
  ✓ Enable Ecommerce Tracking
  Currency: USD
  ✓ Include GA4 Item Metadata
  ✓ Track Cart Abandonment
  
Abandonment Triggers:
  ✓ 30 min inactivity
  ✓ 10 min tab not visible
  ✓ Exit intent
```

#### **4. Form Settings**

```
Form Tracking:
  ✓ Form Submit Events
  ✓ Form Vendor Detection
  ✓ Form Field Tracking (Premium)
  ✓ Form Abandonment (Premium)
```

#### **5. Pixel Settings** *(Premium)*

```
Pixel Manager:
  ✓ Enable Pixel Tracking
  Pixel Mode: Dual (GTM + Direct)
  
Meta Pixel:
  ✓ Enabled
  Pixel ID: [your-id]
  
TikTok Pixel:
  ✓ Enabled
  Pixel ID: [your-id]
  
Event Mapping: [JSON editor]
```

#### **6. Consent Settings**

```
Consent Management:
  Preferred CMP: Auto-detect
  Detection Timeout: 5 seconds
  ✓ Delay Until Consent
  ✓ Fallback Track Without CMP
  ✓ Enforce TCF for Multiple Platforms
```

#### **7. Advanced Settings**

```
Session:
  Session Timeout: 30 minutes
  Max Event History: 50
  
GTM Export:
  ✓ Enable GTM Export
  ✓ Category Grouping
  Summary Mode: CSV
  
Page Exclusion:
  Regex Exclude: ^/wp-admin/|^/checkout/private
```

---

## 🏷️ GTM Integration

### Method 1: One-Click Export *(Recommended)*

1. Navigate to **GTM Export** tab
2. Select features to include:
   - ✅ Scroll Depth
   - ✅ Time on Page  
   - ✅ Ecommerce
   - ✅ Form Submit
   - ✅ Video Progress
3. Choose export mode:
   - **Filtered**: Only selected features
   - **Settings**: Active features from settings
   - **Fallback**: All available features
4. Click **Download GTM Container JSON**
5. In GTM: **Admin** → **Import Container** → Upload JSON
6. Choose merge strategy (usually "Merge")
7. **Submit** → **Publish**

### Method 2: Manual Setup

#### **Required Variables**

Create these DataLayer Variables in GTM:

```
Variable Name          | DataLayer Variable Name
-----------------------|------------------------
DL - Event             | event
DL - Scroll Depth      | scroll_depth
DL - Session ID        | session_id
DL - Active Time       | active_seconds
DL - Form ID           | form_id
DL - Ecommerce Object  | ecommerce
```

#### **Required Triggers**

Create Custom Event triggers:

```
Trigger Name              | Event Name
--------------------------|------------------
CE - Scroll Depth 25      | scroll_depth_25
CE - Scroll Depth 50      | scroll_depth_50
CE - Scroll Depth 75      | scroll_depth_75
CE - Time on Page 30s     | time_on_page_30
CE - Active Time 60s      | active_time_60
CE - Form Submit          | form_submit
CE - Add to Cart          | add_to_cart
CE - Purchase             | purchase
```

#### **Sample Tag - GA4 Scroll Event**

```
Tag Type: Google Analytics: GA4 Event
Configuration Tag: [Your GA4 CONFIG]
Event Name: scroll_depth
Event Parameters:
  - depth: {{DL - Scroll Depth}}
  - session_id: {{DL - Session ID}}
  - page_location: {{Page URL}}
Triggering: CE - Scroll Depth 25/50/75
```

### Method 3: Server-Side GTM

#### **1. Client-Side Setup**
ADT works normally, pushing to dataLayer

#### **2. Server Container**
- Create server-side tags
- Use dataLayer variables from client
- ADT session data available server-side

#### **3. Pixel Manager Integration** *(Premium)*
- Use Dual Pixel Mode
- Client-side: ADT pushes to dataLayer + direct pixels
- Server-side: GTM processes dataLayer events

---

## 👨‍💻 Developer Guide

### Hooks & Filters

#### **Action Hooks**

```php
// After ADT initializes
do_action('adt_initialized');

// After settings save
do_action('adt_settings_saved', $settings);

// Before event push (modify event data)
do_action('adt_before_event_push', $event_data);

// After event push
do_action('adt_after_event_push', $event_data);
```

#### **Filter Hooks**

```php
// Modify settings before save
add_filter('adt_settings', function($settings) {
  $settings['custom_field'] = 'custom_value';
  return $settings;
});

// Control consent check
add_filter('adt_has_consent', function($has_consent, $purpose) {
  return my_custom_consent_check($purpose);
}, 10, 2);

// Modify event data
add_filter('adt_event_data', function($data, $event_name) {
  $data['custom_param'] = 'value';
  return $data;
}, 10, 2);

// Control tracking on current page
add_filter('adt_should_track', function($should_track) {
  if (is_page('private')) {
    return false;
  }
  return $should_track;
});

// Add custom ecommerce data
add_filter('adt_ecommerce_item', function($item, $product) {
  $item['custom_field'] = get_post_meta($product->get_id(), '_custom', true);
  return $item;
}, 10, 2);
```

### JavaScript API

#### **Global Objects**

```javascript
// Check premium status
if (window.isADTPremium()) {
  // Premium features
}

// Check consent
if (window.hasConsent('analytics')) {
  // Track event
}

// Push to dataLayer (with deduplication)
window.adt_push_deduped({
  event: 'custom_event',
  custom_param: 'value'
}, 'unique_key');

// Enrich event with session data
const enriched = window.enrichPayload({
  event: 'my_event'
});

// Get session info
const sessionId = window.ADTSession?.id();
const tabId = window.ADTSession?.tabId();
```

#### **Custom Events**

```javascript
// Simple custom event
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  event: 'custom_button_click',
  button_id: 'cta_primary',
  button_text: 'Get Started'
});

// With enrichment
if (typeof window.enrichPayload === 'function') {
  const payload = window.enrichPayload({
    event: 'custom_event',
    custom_data: 'value'
  });
  window.dataLayer.push(payload);
}
```

#### **Form Tracking Integration**

```javascript
// Manually track form
if (window.ADTFormTracker) {
  window.ADTFormTracker.trackFormSubmit(formElement, {
    form_id: 'custom_form',
    form_name: 'Newsletter Signup'
  });
}
```

#### **Debug Helpers**

```javascript
// View dataLayer
console.table(window.dataLayer);

// Log manager controls
window.ADTLogManager.quiet();    // Minimal logs
window.ADTLogManager.normal();   // Default logs
window.ADTLogManager.verbose();  // All logs
window.ADTLogManager.showSummary();  // Tracking summary
window.ADTLogManager.showGrouped();  // Grouped view
```

### Custom Pixel Integration

```php
// Register custom pixel
add_filter('adt_available_pixels', function($pixels) {
  $pixels['custom'] = [
    'name' => 'Custom Pixel',
    'sdk_url' => 'https://cdn.custompixel.com/pixel.js',
    'init_function' => 'customPixel.init',
    'track_function' => 'customPixel.track'
  ];
  return $pixels;
});

// Map events to custom pixel
add_filter('adt_pixel_event_map', function($map) {
  $map['purchase'][] = 'custom';
  return $map;
});
```

### Session Management

```javascript
// Register hook for session events
if (window.ADTSession) {
  window.ADTSession.registerHook('start', function(data) {
    console.log('Session started:', data.session_id);
  });
  
  window.ADTSession.registerHook('end', function(data) {
    console.log('Session ended:', data.duration);
  });
}

// Get session context
const context = window.ADTSession?.getContext();
// Returns: { session_id, tab_id, session_number, active_seconds }
```

---

## 💎 Premium Features

### What's Included

**🎯 Multi-Pixel Tracking**
- Fire to 6+ advertising platforms simultaneously
- Dual pixel mode (GTM + Direct SDK)
- Custom event mapping
- Auto SDK loading

**📊 Advanced Ecommerce**
- Cart abandonment tracking
- Session-aware metrics
- Customer journey tracking
- Refund tracking

**📝 Advanced Form Tracking**
- Field-level interaction tracking
- Form abandonment detection
- Vendor-specific integrations (20+ platforms)
- Form analytics dashboard

**🔧 Developer Tools**
- Event simulator
- Advanced debug overlay with filters
- SDK status monitoring
- Export history tracking

**💼 Premium Support**
- Priority email support
- Setup assistance
- Custom implementation help
- Regular feature updates

---

## 🐛 Troubleshooting

### Events Not Firing

**Check 1: Debug Mode**
```
Settings → Debug → Enable Debug Mode
```
Open console, look for `[ADT]` prefixed logs

**Check 2: Consent**
```javascript
// Check consent status
console.log('Has consent:', window.hasConsent('analytics'));
```

**Check 3: Page Exclusion**
Settings → Advanced → Regex Exclude
Make sure current page isn't excluded

**Check 4: Builder/Admin**
ADT automatically disables in builder editors and wp-admin

### GTM Not Receiving Events

**Verify DataLayer**
```javascript
// In console:
window.dataLayer
// Should show array of events
```

**Check GTM Preview**
1. Enable GTM Preview mode
2. Visit your site
3. Look for ADT events in Summary

**Verify GTM Container ID**
Settings → GTM Settings → Container ID should match your GTM account

### WooCommerce Events Missing

**Check 1: WooCommerce Active**
Plugin requires WooCommerce to be installed and active

**Check 2: Ecommerce Enabled**
Settings → WooCommerce → Enable Ecommerce Tracking

**Check 3: AJAX Caching**
Some cache plugins block AJAX. Test with cache disabled.

**Check 4: Mini Cart**
Check browser console for errors when adding to cart

### Pixels Not Firing *(Premium)*

**Check 1: Pixel IDs**
Settings → Pixel Tracking → Verify all IDs are correct

**Check 2: Event Mapping**
Ensure events are mapped to desired pixels

**Check 3: Consent**
Pixels require consent. Check: `window.hasConsent('marketing')`

**Check 4: SDK Loading**
```javascript
// Check if SDKs loaded:
console.log('Meta:', typeof fbq);  // Should be 'function'
console.log('TikTok:', typeof ttq);  // Should be 'object'
```

### Debug Overlay Not Showing

**Check 1: Enabled**
Settings → Debug → Enable Debug Overlay

**Check 2: User Role**
Settings → Debug → Overlay Minimum Role
You must meet minimum role requirement

**Check 3: Not in Builder**
Overlay disabled in page builders (Elementor, etc.)

**Check 4: CSS Conflict**
Check if overlay exists but hidden:
```javascript
// In console:
document.querySelector('.adt-debug-overlay')
```

### Performance Issues

**Check 1: Event History Limit**
Settings → Advanced → Max Event History
Lower this value (default: 50)

**Check 2: Disable Unused Features**
Only enable features you actually use

**Check 3: Console Logging**
Set log level to quiet:
```javascript
window.ADTLogManager.quiet();
```

**Check 4: Cache**
Clear WordPress cache after changing settings

---

## 📝 Changelog

See [`brandmeetscode-datalayer-tracker/README.txt`](brandmeetscode-datalayer-tracker/README.txt) for the full WordPress.org changelog. Highlights:

### Version 1.2.5 (Current)
**Released:** 2026-05-18

- WordPress.org naming: **BrandMeetsCode DataLayer Tracker**; slug/text domain `brandmeetscode-datalayer-tracker`; wp-admin UI **DataLayer Tracker**
- Compliance: remove server-side connection-test handlers (GA4 MP, Meta CAPI) from the free setup wizard
- External Services docs reflect only what this build contacts
- All JS/CSS enqueued (no stray inline script/style blocks)
- `session_start()` limited to WooCommerce order-received pages
- Wizard settings map cleaned up for removed Pro-only modules

### Version 1.2.4 – 1.2.2
**Released:** 2026-05-15 – 2026-05-18

- Consent fixes, overlay cleanup, AJAX/settings guards
- Free vs Pro split; Freemius/licensing moved to optional Pro companion
- Customer area links to datalayer-tracker.com pricing, account, and docs

### Version 1.2.1
**Released:** 2025-01-15

- Major feature expansion (many items later moved to the separate Pro add-on)

### Version 1.1.0
**Released:** 2024-12-01

- Initial public release — core engagement, ecommerce, forms, GTM integration

---

## 🤝 Support

### Documentation
- **Knowledge base & guides**: [https://datalayer-tracker.com/knowledge-base](https://datalayer-tracker.com/knowledge-base)
- **Video tutorials**: [YouTube Channel](https://youtube.com/@whittfieldholmes)

### Community (free plugin)
- **Help, bugs & ideas:** [WordPress.org support forum](https://wordpress.org/support/plugin/brandmeetscode-datalayer-tracker) — preferred for installs from WordPress.org
- **Contact:** [datalayer-tracker.com](https://datalayer-tracker.com) (product questions, Pro add-on)
- **Repo (developers):** [GitHub](https://github.com/wholmes/bmc-datalayer-tracker) — code discussion; [open an issue](https://github.com/wholmes/bmc-datalayer-tracker/issues/new) only for bugs/features tied to this repository

### Pro add-on support
- **Email:** support@datalayer-tracker.com (Pro customers)
- **Docs:** [Knowledge base](https://datalayer-tracker.com/knowledge-base)

### Brand Meets Code
Custom implementation, consulting, or agency work?

- **Studio**: [https://brandmeetscode.com](https://brandmeetscode.com)
- **Product**: [https://datalayer-tracker.com](https://datalayer-tracker.com)
- **Email**: hello@datalayer-tracker.com

---

## 📄 License

This plugin is licensed under the GPLv2 or later.

```
BrandMeetsCode DataLayer Tracker (DataLayer Tracker)
Copyright (C) 2024-2026 Brand Meets Code

Author: Whittfield Holmes (Brand Meets Code)

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.
```

---

## 🙏 Credits

**Developed by:** [Brand Meets Code](https://brandmeetscode.com/) — [Whittfield Holmes](https://brandmeetscode.com/)

**Product & documentation:** [datalayer-tracker.com](https://datalayer-tracker.com) · [Knowledge base](https://datalayer-tracker.com/knowledge-base)

**Contributors:**
- Community feedback and feature requests
- Beta testers
- Translators

**Built With:**
- WordPress
- Google Tag Manager (optional container snippet; tags configured in GTM)
- `window.dataLayer` event pushes (engagement, forms, sessions, optional WooCommerce)

*Advertising pixels (Meta, TikTok, Google Ads, etc.) are part of the separate Pro add-on, not this free build.*

---

## 🌟 Show Your Support

If you find this plugin helpful:

1. ⭐ **Star** this repository
2. 📝 **Leave a review** on [WordPress.org](https://wordpress.org/support/plugin/brandmeetscode-datalayer-tracker/reviews/)
3. 🐛 **Get help or report bugs** on the [WordPress.org forum](https://wordpress.org/support/plugin/brandmeetscode-datalayer-tracker)
4. 📢 **Share** with your network

---

## 📊 Stats

![WordPress Plugin Downloads](https://img.shields.io/wordpress/plugin/dt/brandmeetscode-datalayer-tracker)
![WordPress Plugin Rating](https://img.shields.io/wordpress/plugin/rating/brandmeetscode-datalayer-tracker)
![WordPress Plugin Version](https://img.shields.io/wordpress/plugin/v/brandmeetscode-datalayer-tracker)
![GitHub Stars](https://img.shields.io/github/stars/wholmes/bmc-datalayer-tracker)

---

**Made with ❤️ by [Brand Meets Code](https://brandmeetscode.com/)** — [Whittfield Holmes](https://brandmeetscode.com/)

[datalayer-tracker.com](https://datalayer-tracker.com) · [Documentation](https://datalayer-tracker.com/knowledge-base)

*Consent-aware dataLayer for WordPress, without enterprise complexity.*
