=== BrandMeetsCode DataLayer Tracker ===
Contributors: whittfield
Tags: google tag manager, analytics, woocommerce, tracking, consent
Requires at least: 5.8
Tested up to: 6.9
Stable tag: 1.2.5
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

GTM-ready dataLayer: consent-aware events, engagement, admin debug overlay, optional WooCommerce. Fully free—no license keys or locked settings.

== Description ==

This plugin helps you send **structured data** to `window.dataLayer` so Google Tag Manager or your own tags can consume consistent events and page context.

Listed as **BrandMeetsCode DataLayer Tracker**; commonly referred to as **DataLayer Tracker**.

**WordPress.org compliance:** This repository build is **fully functional** with **no license checks**, **no trial period**, **no usage quotas**, and **no disabled settings** in wp-admin. Every option in Settings works without payment. Marketing screens may link to an optional **DataLayer Tracker Pro** add-on (a **separate plugin** sold and hosted outside WordPress.org); that is not trialware.

= Included in this WordPress.org build =

* **Page & content context** — page type, IDs, title, URL, slug/path, categories/tags, referrer, **UTM parameters**
* **Visitor & device hints** — resolution, timezone offset, browser language; optional cookie exposure rules
* **Logged-in user context** — role-style flags and optional **hashed user id** (modes you configure)
* **Engagement** — scroll depth (modes), scroll back up, focus/blur, time on page, **active time**, **hover intent**, **video progress**, default clicks; optional deeper click/field/section options where listed in Settings
* **Forms** — `form_view`, `form_field_start`, `form_submit`, `form_error`, `form_abandon`; optional form-vendor shortcut mode
* **WooCommerce (when enabled)** — browser **GA4-style ecommerce** events (view_item, add_to_cart, purchase, etc.) when WooCommerce is active
* **Google Tag Manager** — optional container **snippet** output from settings (you configure tags inside GTM)
* **Consent-aware loading** — delay until consent, CMP preference, TCF option, fallbacks
* **Page URL filtering** — regex exclude list
* **Sessions** — client-side session timeout/heartbeat options
* **Debugging** — console logging levels and admin **debug overlay** (core panels)
* **Developer-friendly** — hooks/filters; push custom `window.dataLayer` events from theme or other plugins

= Not included in this build (available only in the separate Pro add-on) =

Advertising **pixels** (Meta, TikTok, Google Ads, etc.), **Meta Conversions API**, **GA4 Measurement Protocol**, **GTM container JSON export**, **content-intelligence** module, **preset library** admin, and related server-side code are **not shipped** in this zip—they are not locked behind a key here; they are omitted entirely. Purchase the standalone Pro plugin from **DataLayer Tracker → Get Pro add-on** if you need those modules.

= Consent Management =

Auto-detection and integration patterns vary by CMP; you remain responsible for correct legal configuration on your site.

= Google Tag Manager =

Optional **snippet** + consistent **dataLayer** pushes. Full **container JSON export** is part of the separate Pro add-on only.

== Installation ==

= Automatic Installation =

1. Log into your WordPress admin dashboard
2. Navigate to **Plugins > Add New**
3. Search for "DataLayer Tracker"
4. Click **Install Now** then **Activate**

= Manual Installation =

1. Download the plugin ZIP file
2. Navigate to **Plugins > Add New > Upload Plugin**
3. Choose the ZIP file and click **Install Now**
4. Click **Activate Plugin**

= Building the free (.org) ZIP from source (maintainers) =

Canonical **free** source lives in **`brandmeetscode-datalayer-tracker/`** at the repository root. From the **repository root**, run **`./build-free-zip.sh`** to create **`brandmeetscode-datalayer-tracker-wporg-<version>.zip`** (same folder name inside the ZIP). Pass a path as the first argument to set the output file; **parent directories are created** if missing (e.g. `../dist/`).

**WordPress.org slug reservation:** After updating code, reply to the Plugin Review email and request slug **`brandmeetscode-datalayer-tracker`**. A temporary Text Domain warning until WordPress updates their side is expected.

= Building the Pro add-on ZIP from source (maintainers) =

Canonical **Pro** source lives in **`datalayer-tracker-pro/`** beside the free tree. Run **`composer install`** inside **`datalayer-tracker-pro/`** so **`vendor/freemius/`** exists, set your Freemius **product id** and **public key** in **`includes/freemius-config.php`**, then from the **repository root** run **`./build-pro-zip.sh`** to emit **`datalayer-tracker-pro-<version>.zip`**. That ZIP is the paid companion only; sites still need the **core** plugin active. The **WordPress.org** build uses **`adt_all_features_enabled()`** (always `true`); licensing lives only in the Pro add-on.

= Quick Setup =

1. Go to **DataLayer Tracker** in the WordPress admin menu
2. Enable the dataLayer options you need (page context, engagement, consent, etc.)
3. Optionally add your **Google Tag Manager** container ID and enable snippet output
4. Use **Regex exclude** under Advanced Options if certain URLs must not emit tracking-related events
5. Turn on **Debug mode** / **Debug overlay** while verifying events in the browser or GTM Preview
6. (Optional) Purchase **DataLayer Tracker Pro**, upload it under Plugins → Upload, activate it alongside this plugin — **Get Pro add-on** in the menu explains status

Optional **Settings import/export** remains available via the UI where provided for backing up JSON configuration.

= Why use this plugin? =

* Sensible defaults for `dataLayer` structure on WordPress
* Consent-aware behavior without replacing your CMP
* Clear split: **everything in this zip works without payment** within the documented free scope; **Pro** adds the advanced modules listed above

== Frequently Asked Questions ==

= Do I need Google Tag Manager? =

No! While ADT integrates seamlessly with GTM, it pushes events to the dataLayer which can be used independently or with any analytics platform.

= Does this work with WooCommerce? =

Yes, when WooCommerce is active you can enable **WooCommerce ecommerce tracking** in Settings for GA4-style browser events. Additional enrichment and server-side paths may exist in the separate **Pro** add-on only.

= Will this slow down my site? =

Impact depends on enabled features and theme; scripts are scoped to frontend behavior typical of analytics tooling.

= Is this GDPR compliant? =

The plugin ships consent delay and CMP-related options. Compliance depends on your legal stance, CMP, and downstream tags—you remain responsible.

= Can I track custom events? =

Yes—as with any dataLayer deployment you may `window.dataLayer.push({ ... })` from themes or scripts.

You can also configure **stored custom events (JSON)** in Settings when that field is present in your build.

= Does this work with page builders? =

Typically yes when frontend output and script loading behave like a normal theme.

= What's the difference between Free and Pro? =

The **repository package** ships a **standalone** tracker: baseline dataLayer, consent controls, snippet-based GTM container output, baseline engagement/forms, regex URL exclude, debugging—usable **without** paying or expiring code paths.

The **optional Pro ZIP** activates advanced settings only when that companion plugin is installed (license **via product sale**, **not** a sandbox timer locking the `.org` build).

Admin **Get Pro add-on / Customer area / Pro status** links use **`adt_get_pro_sales_url()`**, **`adt_get_pro_customer_account_url()`**, **`adt_get_pro_customer_download_url()`** (`ADT_PRO_*` constants or hooks—see Developer Hooks).

= How do I debug tracking issues? =

Enable Debug Mode, use the overlay (role-gated), console logs, inspect `window.dataLayer`, use GTM Preview when applicable.

= Does this track personal data? =

Depends on enabled options (e.g. hashed user id, ecommerce). Respect consent obligations and disclose in your privacy policy.

= Can I exclude certain pages from tracking? =

Yes. Use **Regex exclude** under Advanced Options (included in `.org`).

== Screenshots ==

Upload images in this order as `screenshot-1.png` through `screenshot-6.png` in your WordPress.org SVN `assets/` folder. Full-size admin captures and an interactive preview: [Product screenshots](https://datalayer-tracker.com/screenshots) · [Live debug overlay demo](https://datalayer-tracker.com/debug-overlay-demo).

1. **Live debug overlay (admin-only)** — Real-time `dataLayer` event stream on your site: filter by type, pin events, expand JSON payloads, and verify tracking before GTM Preview. Visible only to logged-in users at or above the role you set in Settings (default: Administrator). [Try the interactive demo](https://datalayer-tracker.com/debug-overlay-demo).
2. **Debug options** — Enable the overlay, console logging, blocked-event visibility, and event filters so your team can QA on real traffic without exposing tools to visitors.
3. **Setup wizard** — Guided first run: GA4/GTM IDs, consent behavior, engagement toggles, and optional WooCommerce—production measurement configured in one flow, not guessed.
4. **Engagement signals** — Scroll depth (single `scroll_depth` or per-milestone modes), active time, scroll back up, tab visibility, hover intent, and related milestones pushed to `dataLayer`.
5. **Interaction tracking** — Clicks, forms, and media mapped to consistent events (`form_view`, `form_submit`, default clicks, video progress, and more) with less one-off GTM wiring.
6. **Consent-aware loading** — CMP preference, delay-until-consent, TCF option, and fallbacks so tags respect your privacy setup; optional overlay display of blocked events for debugging.

**Pro-only features** (separate plugin, not shown above): content intelligence, advertising pixels, GA4 Measurement Protocol, Meta CAPI, and GTM container JSON export. See [screenshots tour](https://datalayer-tracker.com/screenshots) for the full stack.

== Changelog ==

= 1.2.5 - 2026-05-18 =
* WordPress.org naming: distinctive listing **BrandMeetsCode DataLayer Tracker**; slug and text domain **brandmeetscode-datalayer-tracker**; wp-admin UI remains **DataLayer Tracker**
* WordPress.org compliance: remove server-side connection-test AJAX handlers (GA4 MP, Meta CAPI) from setup wizard — these features are not included in this build
* Update External Services documentation to accurately reflect only services this build actually contacts
* Remove all remaining inline `<script>`/`<style>` tags; all JS/CSS now enqueued via wp_enqueue/wp_add_inline_script
* Fix: session_start() restricted to WooCommerce order-received pages only (not all pages)
* Clean up wizard settings field map to remove fields for removed features

= 1.2.4 - 2026-05-18 =
* Fix consent blocking: cast consent-related settings to strings to match JS strict comparisons
* Fix: replace broken adt-ip-exclusion-check.js enqueue with inline script injection
* Remove broken external logo from debug overlay; overlay title uses DataLayer Tracker
* Fix SyntaxError in adt-consent-universal.js and adt-cmp-debug.js (stray </script> tags)
* Fix 502 Bad Gateway: guard adt_register_settings() from running on AJAX requests

= 1.2.3 - 2026-05-18 =
* WordPress.org compliance: remove Pixels, Server-Side Tracking, GTM Exporter, and Content Intelligence modules
* Fix fatal error: add missing `adt_detect_cmp_server_side()` function used by consent status panel
* Rename plugin to BrandMeetsCode DataLayer Tracker; update contributors list and support links

= 1.2.2 - 2026-05-15 =
* Remove Freemius trial/checkout from `.org`-bound **core** build; paid checkout + licensing live in the optional **DataLayer Tracker Pro** companion (Freemius SDK + `adt_user_is_premium`); **`DATALAYER_TRACKER_PRO_ACTIVE`** only marks the companion as loaded
* Add **Customer area** wp-admin screen (`adt-settings-account`) linking **datalayer-tracker.com** pricing, **customer portal** (`/account` → Freemius), downloads, docs
* Add `adt_get_pro_sales_url()`, `adt_get_pro_customer_download_url()`, **`adt_get_pro_customer_account_url()`** with **`ADT_PRO_SALES_URL`**, **`ADT_PRO_CUSTOMER_DOWNLOAD_URL`**, **`ADT_PRO_CUSTOMER_ACCOUNT_URL`**, filters `adt_pro_sales_url`, `adt_pro_customer_download_url`, **`adt_pro_customer_account_url`**
* Let free installs open all ADT wp-admin tabs (welcome wall removed)
* Refresh **readme** so WordPress.org **Description/FAI** reflects free vs **Pro**

= 1.2.1 - 2025-01-15 =
**New Features:**
* Multi-pixel tracking with 6 platform support (Premium)
* Dual pixel mode - GTM + Direct SDK (Premium)
* Cart abandonment tracking with 3 detection methods
* Session-aware ecommerce tracking
* Form vendor auto-detection for 20+ platforms
* Field-level form tracking (Premium)
* Video progress tracking (YouTube/Vimeo)
* Event simulator in debug overlay
* SDK status monitoring
* Export history tracking

**Improvements:**
* Performance: 40% faster event processing
* Consent: Better CMP detection with 5-second timeout
* GTM Export: Category-grouped containers
* Debug Overlay: Event filtering and search
* Settings: Import/Export configuration as JSON

**Bug Fixes:**
* Fixed checkbox save issue in settings
* Fixed AJAX cart tracking timing
* Fixed consent queue not flushing properly
* Fixed duplicate scroll events
* Fixed builder iframe detection

= 1.1.0 - 2024-12-01 =
* Initial public release
* Core engagement tracking
* Basic ecommerce support
* Form tracking
* GTM export functionality
* Debug overlay
* Consent management

== Upgrade Notice ==

= 1.2.2 =
Documents free vs Pro split, optional `wp-config.php` URL overrides, and root build scripts. See changelog for full URLs.

= 1.2.1 =
Major update with multi-pixel support, cart abandonment tracking, and performance improvements. Recommended for installs using the full Pro feature set.

== External Services ==

= Google Tag Manager (optional — only when you configure a container ID) =

This plugin includes an optional feature to inject the Google Tag Manager container snippet on your site's front end. This feature is **disabled by default** and only activates when you enter a GTM Container ID in the plugin settings and enable the snippet toggle.

**What it does:** When enabled, the plugin outputs the standard GTM `<script>` and `<noscript>` tags that load `https://www.googletagmanager.com/gtm.js`. This causes the visitor's browser to contact Google's servers to load the GTM container.

**What data is sent:** When GTM loads, Google receives the visitor's IP address, browser, and the URL being viewed — the same data sent by any website that loads GTM. No additional data is sent by this plugin beyond the standard GTM request. The plugin itself populates `window.dataLayer` in the browser; it is your GTM configuration that determines what analytics data leaves the site.

**When it is sent:** Only on front-end page loads when the visitor's browser downloads the GTM script. If the consent-delay feature is enabled, the snippet is withheld until the visitor grants consent via your CMP.

**Service provider:** Google LLC

* **Terms of Service:** [Google Terms of Service](https://policies.google.com/terms)
* **Privacy Policy:** [Google Privacy Policy](https://policies.google.com/privacy)
* **GTM documentation:** [Google Tag Manager](https://marketingplatform.google.com/about/tag-manager/)

= WordPress Admin AJAX =

All plugin settings saves, the setup wizard, and admin actions use WordPress's built-in `admin-ajax.php` endpoint. All requests go to your own WordPress installation. No data is sent to external servers by these requests.

**Important:** You are responsible for ensuring that any third-party analytics services (GTM, GA4, etc.) you configure on your site comply with applicable data-protection laws (GDPR, CCPA, etc.) and that visitors are properly informed. This plugin provides consent-delay and CMP-detection functionality to help withhold scripts until consent is obtained, but legal compliance remains your responsibility.

== Privacy Policy ==

BrandMeetsCode DataLayer Tracker may expose, depending entirely on which options you enable:

* Page URL, titles, and taxonomy-style context
* Logged-in user fields you choose to surface, including optional **hashed** identifiers
* Engagement signals (scroll depth, timing, generic form interactions)
* WooCommerce-related item data when ecommerce tracking is enabled
* Structured event data pushed to `window.dataLayer` for use by analytics tools you configure

This plugin does not send data to any external server on your behalf. You are responsible for consent, disclosure, and lawful basis for any analytics tools you add to your site. The plugin does not replace legal or DPO review.

Data is exposed to the browser `dataLayer`; downstream tags decide what leaves the site.

== Support ==

= Documentation =
* Full Documentation: [https://datalayer-tracker.com/knowledge-base](https://datalayer-tracker.com/knowledge-base)
* Video Tutorials: [YouTube Channel](https://youtube.com/@whittfieldholmes)

= Community Support =
* Support Forum: [WordPress.org](https://wordpress.org/support/plugin/brandmeetscode-datalayer-tracker)

= Pro customer support =
* Email: support@datalayer-tracker.com
* Documentation: [https://datalayer-tracker.com/knowledge-base](https://datalayer-tracker.com/knowledge-base)

== Developer Hooks ==

= Pro storefront URLs =

URLs for **View plans**, **Customer downloads**, and outbound marketing can be centralized—no need to fork PHP for a domain change:

* Constants (define early in **`wp-config.php`**):

`define( 'ADT_PRO_SALES_URL', 'https://yoursite.com/pricing' );
define( 'ADT_PRO_CUSTOMER_ACCOUNT_URL', 'https://yoursite.com/freemius-portal/' );
define( 'ADT_PRO_CUSTOMER_DOWNLOAD_URL', 'https://yoursite.com/freemius-portal/' );`


* Helpers: **`adt_get_pro_sales_url()`**, **`adt_get_pro_customer_account_url()`**, **`adt_get_pro_customer_download_url()`**

* Filters **`adt_pro_sales_url`**, **`adt_pro_customer_account_url`**, **`adt_pro_customer_download_url`** — final mutators WordPress-aware code calls.

* In the **WordPress.org** build, **`adt_all_features_enabled()`** always returns `true` (no license gate). The separate **Pro** add-on (not hosted on WordPress.org) uses its own Freemius licensing.

= Filters (examples) =
`add_filter(
    'adt_pro_sales_url',
    static fn () => 'https://example.com/buy/'
);
add_filter(
    'adt_pro_customer_download_url',
    static fn () => 'https://example.com/dl/'
);
add_filter(
    'adt_pro_customer_account_url',
    static fn () => 'https://example.com/account/'
);

add_filter(
    'adt_before_push',
    static function ( $event ) {
        $event['custom_field'] = 'value';

        return $event;
    }
);

add_filter(
    'adt_should_track_event',
    static function ( $should_track, $event_name ) {
        if ( 'unwanted_event' === $event_name ) {
            return false;
        }

        return $should_track;
    },
    10,
    2
);`

= Actions =

`// Run code after consent granted
add_action('adt_consent_granted', function($consent_types) {
    // Your code here
});

// Run code after dataLayer push
add_action('adt_after_push', function($event) {
    // Your code here
});`

= JavaScript API =

`// Push custom event
window.dataLayer.push({
    event: 'custom_event',
    custom_param: 'value'
});

// Get session context
const context = window.ADTSession?.getContext();

// Check consent
const hasConsent = window.hasConsent('analytics');`

== Credits ==

Developed by [Brand Meets Code](https://brandmeetscode.com)

Special thanks to the WordPress community, beta testers, and all users who provide feedback and feature requests.