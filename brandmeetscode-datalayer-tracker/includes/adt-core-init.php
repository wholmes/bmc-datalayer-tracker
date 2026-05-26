<?php
/**
 * DataLayer Tracker - Core Initialization
 * 
 * @package    DataLayer_Tracker
 * @subpackage Core
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
defined('ABSPATH') || exit;

// Constants
if (!defined('ADT_PLUGIN_FILE')) {
	define('ADT_PLUGIN_FILE', __FILE__);
	define('ADT_PLUGIN_DIR', plugin_dir_path(__FILE__));
	define('ADT_PLUGIN_URL', plugin_dir_url(__FILE__));
}

add_action('init', function () {
	if (
		function_exists('WC') &&
		class_exists('WC_Session') &&
		( ! WC()->session || ! WC()->session->has_session() )
	) {
		WC()->initialize_session(); // Full session hydration
	}
}, 1);

/**
 * Handle IP exclusion via URL (requires manage_options + per-action nonce).
 */
add_action('template_redirect', function() {
    // phpcs:disable WordPress.Security.NonceVerification.Recommended -- Nonces verified below per action.
    $exclude_on = isset( $_GET['adt_exclude_ip'] ) && '1' === sanitize_text_field( wp_unslash( $_GET['adt_exclude_ip'] ) );
    $include_on = isset( $_GET['adt_include_ip'] ) && '1' === sanitize_text_field( wp_unslash( $_GET['adt_include_ip'] ) );
    // phpcs:enable WordPress.Security.NonceVerification.Recommended

    if ( ! $exclude_on && ! $include_on ) {
        return;
    }

    if ( ! is_user_logged_in() || ! current_user_can( 'manage_options' ) ) {
        return;
    }

    $nonce = isset( $_GET['_wpnonce'] ) ? sanitize_text_field( wp_unslash( $_GET['_wpnonce'] ) ) : '';
    if ( $exclude_on && ! wp_verify_nonce( $nonce, 'adt_exclude_ip' ) ) {
        return;
    }
    if ( $include_on && ! wp_verify_nonce( $nonce, 'adt_include_ip' ) ) {
        return;
    }

    $current_ip = function_exists( 'adt_get_client_ip' )
        ? adt_get_client_ip()
        : ( isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '' ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized

    // Exclude IP
    if ( $exclude_on ) {
        if ( ! empty( $current_ip ) ) {
            $excluded_ips = get_option( 'adt_excluded_admin_ips', [] );
            if ( ! is_array( $excluded_ips ) ) {
                $excluded_ips = [];
            }

            if ( ! in_array( $current_ip, $excluded_ips, true ) ) {
                $excluded_ips[] = $current_ip;
                update_option( 'adt_excluded_admin_ips', $excluded_ips );
            }

            adt_show_ip_exclusion_page( $current_ip, true );
            exit;
        }
    }

    // Include IP
    if ( $include_on ) {
        if ( ! empty( $current_ip ) ) {
            $excluded_ips = get_option( 'adt_excluded_admin_ips', [] );
            if ( is_array( $excluded_ips ) ) {
                $excluded_ips = array_diff( $excluded_ips, [ $current_ip ] );
                update_option( 'adt_excluded_admin_ips', array_values( $excluded_ips ) );
            }

            adt_show_ip_exclusion_page( $current_ip, false );
            exit;
        }
    }
}, 1);

/**
 * Show IP exclusion confirmation page
 */
function adt_show_ip_exclusion_page( $ip, $excluded = true ) {
    // Store result in a transient so the admin notice and localStorage script can use it.
    set_transient( 'adt_ip_exclusion_result', [
        'ip'       => $ip,
        'excluded' => $excluded,
    ], 60 );

    wp_safe_redirect( admin_url( 'admin.php?page=adt-settings&adt_ip_exclusion=1' ) );
    exit;
}

/**
 * Show IP exclusion admin notice and set localStorage flag via enqueued inline script.
 */
add_action( 'admin_notices', function () {
    $result = get_transient( 'adt_ip_exclusion_result' );
    if ( ! $result ) {
        return;
    }
    delete_transient( 'adt_ip_exclusion_result' );

    $ip       = sanitize_text_field( $result['ip'] );
    $excluded = (bool) $result['excluded'];
    $label    = $excluded
        ? __( 'Tracking disabled — your IP has been excluded from tracking.', 'brandmeetscode-datalayer-tracker' )
        : __( 'Tracking enabled — your IP is no longer excluded from tracking.', 'brandmeetscode-datalayer-tracker' );
    $type = $excluded ? 'notice-warning' : 'notice-success';

    echo '<div class="notice ' . esc_attr( $type ) . ' is-dismissible">';
    echo '<p><strong>' . esc_html( $label ) . '</strong> <code>' . esc_html( $ip ) . '</code></p>';
    echo '</div>';

    // Set or clear the localStorage/sessionStorage flag via an inline script on an enqueued handle.
    $js = $excluded
        ? "try{localStorage.setItem('adt_exclude_tracking'," . wp_json_encode( $ip ) . ");sessionStorage.setItem('adt_exclude_tracking'," . wp_json_encode( $ip ) . ");}catch(e){}"
        : "try{localStorage.removeItem('adt_exclude_tracking');sessionStorage.removeItem('adt_exclude_tracking');}catch(e){}";
    wp_add_inline_script( 'jquery', $js, 'after' );
} );

/**
 * Check if current IP is excluded from tracking
 * 
 * @return bool True if IP is excluded
 */
if (!function_exists('adt_is_ip_excluded')) {
    function adt_is_ip_excluded() {
        $current_ip = function_exists( 'adt_get_client_ip' )
            ? adt_get_client_ip()
            : ( isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '' ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
        
        if (empty($current_ip)) {
            return false;
        }
        
        $excluded_ips = get_option('adt_excluded_admin_ips', []);
        
        if (!is_array($excluded_ips)) {
            return false;
        }
        
        return in_array($current_ip, $excluded_ips);
    }
}

// Add IP exclusion check to the tracking decision hook
add_filter('adt_should_track', function($should_track) {
    if (!$should_track) {
        return false; // Already blocked for other reasons
    }
    
    // Check IP exclusion
    if (function_exists('adt_is_ip_excluded') && adt_is_ip_excluded()) {
        $settings = get_option('adt_settings', []);
        if (!empty($settings['debug_mode'])) {
            // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
            error_log('[ADT] Tracking blocked - IP excluded: ' . (function_exists('adt_get_client_ip') ? adt_get_client_ip() : 'unknown'));
        }
        return false;
    }
    
    return $should_track;
}, 10, 1);

// 🔧 Core bootstrapping: Woo session setup, REST routes, data localization

if (!defined('ADT_VERSION')) {
    define('ADT_VERSION', '1.2.6');
}

// Translations load automatically on WordPress 4.6+ for plugins hosted on WordPress.org (Requires at least: 5.8).
// Register the debug stub as a proper enqueued script (no raw <script> tags).
add_action('wp_enqueue_scripts', function() {
    $ip_excluded = adt_is_ip_excluded();

    $excluded_warning = '';
    if ( $ip_excluded ) {
        $excluded_warning = "console.warn('%c\xF0\x9F\x9A\xAB ADT TRACKING DISABLED %c\\nYour IP address is excluded from tracking.\\nNo analytics data will be collected for this session.\\nTo re-enable: Go to ADT Settings > Debug Options > Testing & IP Exclusion','background: #ff6b35; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;','color: #ff6b35;');";
    }

    $js = "(function(){
if(typeof window.adtDebug==='undefined'){window.adtDebug=function(){var a=Array.prototype.slice.call(arguments);if(window.ADTData&&(window.ADTData.debug==='1'||window.ADTData.debug_mode==='1')){console.log.apply(console,['[ADT]'].concat(a));}};}
if(typeof window.adtError==='undefined'){window.adtError=function(){var a=Array.prototype.slice.call(arguments);console.error.apply(console,['[ADT]'].concat(a));};}
if(typeof window.adtWarn==='undefined'){window.adtWarn=function(){var a=Array.prototype.slice.call(arguments);console.warn.apply(console,['[ADT]'].concat(a));};}
" . $excluded_warning . "})();";

    $adt_asset_ver = defined( 'ADT_VERSION' ) ? ADT_VERSION : '1.2.5';
    wp_register_script( 'adt-debug-stub', false, [], $adt_asset_ver, false );
    wp_add_inline_script( 'adt-debug-stub', $js );
    wp_enqueue_script( 'adt-debug-stub' );
}, 1);

// ──────────────────────────────────────────────
// Determine the correct localization payload for current view
// ──────────────────────────────────────────────
function adt_get_localization_payload_for_view(): array {
    $is_full = false;

    // Determine if full payload is required
    // phpcs:disable WordPress.Security.NonceVerification.Recommended -- Read-only routing hints for localization (no mutations).
    $adt_ajax_action = isset( $_GET['action'] ) ? sanitize_text_field( wp_unslash( $_GET['action'] ) ) : '';
    $adt_preview_on  = isset( $_GET['adt_preview'] );
    // phpcs:enable WordPress.Security.NonceVerification.Recommended

    if ( is_admin() ||
         ( function_exists( 'adt_is_builder_iframe' ) && adt_is_builder_iframe() ) ||
         ( defined( 'DOING_AJAX' ) && DOING_AJAX && $adt_ajax_action !== '' && strpos( $adt_ajax_action, 'adt_' ) === 0 ) ||
         $adt_preview_on ||
         get_user_meta( get_current_user_id(), 'adt_preview_mode', true )
    ) {
        $is_full = true;
    }

    // Always start with the core payload
    $data = adt_build_localization_data($is_full);

    // 🔍 Ensure ecommerce flag is always present
    if (!isset($data['enable_ecommerce_tracking'])) {
        $settings = wp_parse_args(get_option('adt_settings', []), adt_get_default_settings());
        $data['enable_ecommerce_tracking'] = ! empty($settings['enable_ecommerce_tracking']) ? '1' : '0';
    }

    return $data;
}

// Define adt_get_settings() once (safe ordering)
if (!function_exists('adt_get_settings')) {
    function adt_get_settings() {
        global $adt_field_map;

        $saved = get_option('adt_settings', false);
        $defaults = adt_get_default_settings();

		// If option doesn't exist, create it with defaults
		if ($saved === false) {
		    adt_debug_log('Creating new adt_settings with defaults');
		    update_option('adt_settings', $defaults);
		    return $defaults;
		}

		// If option exists but is empty, reset to defaults
		if (empty($saved) || !is_array($saved)) {
		    adt_debug_log('Resetting empty/invalid adt_settings to defaults');
		    update_option('adt_settings', $defaults);
		    return $defaults;
		}

        // SMART MERGE: Add missing keys from defaults, preserve saved values
        $settings = [];
        
        // First pass: Use defaults for any missing keys
        foreach ($defaults as $key => $default_value) {
            if (array_key_exists($key, $saved)) {
                // CRITICAL FIX: Normalize checkbox values to string '1' or '0'
                $saved_value = $saved[$key];
                
                // If default is a checkbox (0 or 1), normalize saved value
                if ($default_value === 0 || $default_value === 1 || $default_value === '0' || $default_value === '1') {
                    // Convert to string '1' or '0' for consistency
                    $settings[$key] = ($saved_value === '1' || $saved_value === 1 || $saved_value === true) ? '1' : '0';
                } else {
                    // Keep other types as-is
                    $settings[$key] = $saved_value;
                }
            } else {
                // Missing key - use default
                $settings[$key] = $default_value;
            }
        }
        
        // Second pass: Keep any extra saved keys not in defaults (orphaned fields)
        foreach ($saved as $key => $value) {
            if (!array_key_exists($key, $settings)) {
                $settings[$key] = $value;
            }
        }

        // All settings are honoured regardless of Pro status in the .org build.
		
		// error_log('fallback_track_without_cmp loaded as: ' . print_r($settings['fallback_track_without_cmp'] ?? 'NOT SET', true));

        return $settings;
    }
}

// ──────────────────────────────────────────────
// Enqueue main ADT datalayer + localized settings
// ──────────────────────────────────────────────
add_action( 'wp_enqueue_scripts', function () {
	
	if (adt_is_builder_editor_page()) return;

    wp_enqueue_script( 'adt-datalayer' );

}, 20 ); // Priority 20 to ensure it runs after other plugins might enqueue their scripts


// 5. REST API route
// HOOK. Register ADT REST routes
add_action( 'rest_api_init', function() {
    register_rest_route( 'adt/v1', '/cart-summary', [
        'methods'             => WP_REST_Server::READABLE,
        'callback'            => 'adt_get_cart_summary',
        // __return_true is intentional: this endpoint returns only the current visitor's
        // own WooCommerce cart (session-scoped, no cross-user data), so no auth is required.
        // Using a stricter permission_callback would break unauthenticated cart tracking.
        'permission_callback' => '__return_true',
    ] );
} );

// HOOK. Ensure Woo session is written to disk before REST depends on it
add_action( 'template_redirect', function() {
    if ( function_exists('WC') && WC()->session ) {
        if ( is_cart() || is_checkout() || is_product() ) {
            WC()->session->save_data();
        }
    }
}, 99 );

// Cart summary REST callback with session + cart hydration - REST handler to return hydrated Woo cart
function adt_get_cart_summary( \WP_REST_Request $req ) {
    try {
        if ( ! function_exists( 'WC' ) ) {
            return rest_ensure_response([
                'error'   => 'woocommerce_inactive',
                'message' => 'WooCommerce is not active',
            ]);
        }

        WC()->frontend_includes();

        if ( ! WC()->session || ! WC()->session->has_session() ) {
            WC()->initialize_session();
        }

        if ( ! WC()->customer ) {
            WC()->customer = new \WC_Customer( get_current_user_id(), true );
        }

        if ( ! WC()->cart ) {
            WC()->cart = new \WC_Cart();
        }

        if ( function_exists( 'wc_load_cart' ) ) {
            wc_load_cart();
        } elseif ( method_exists( WC()->cart, 'maybe_load_cart' ) ) {
            WC()->cart->maybe_load_cart();
        } elseif ( empty( WC()->cart->get_cart() ) && WC()->session && WC()->session->get( 'cart' ) ) {
            WC()->cart->cart_contents = WC()->session->get( 'cart' );
        }

        $cart  = WC()->cart;
        $items = [];

        foreach ( $cart->get_cart() as $key => $item ) {
            $product_id   = $item['product_id'];
            $variation_id = $item['variation_id'] ?? 0;

            $product      = wc_get_product( $variation_id ?: $product_id );
            $base_product = wc_get_product( $product_id );

            if ( ! $product ) {
                continue;
            }

            $variation_data = [];
            if ( $product->is_type( 'variation' ) ) {
                $attributes = $product->get_variation_attributes();
                foreach ( $attributes as $attr_key => $val ) {
                    $clean_key = str_replace( 'attribute_', '', $attr_key );
                    $label     = wc_attribute_label( $clean_key );
                    $variation_data[] = "$label: $val";
                }
            }

            $items[] = [
                'item_id'               => $variation_id ?: $product_id,
                'product_id'            => $product_id,
                'variation_id'          => $variation_id,
                'name'                  => $product->get_name(),
                'brand'                 => $product->get_attribute( 'brand' ) ?? '',
                'category'              => wc_get_product_category_list( $product_id, ',', '', '' ),
                'price'                 => (float) $product->get_price(),
                'quantity'              => (int) $item['quantity'],
                'item_variant'          => $variation_id ? $product->get_name() : '',
                'item_variant_label'    => $variation_id ? $base_product->get_name() . ' (ID: ' . $product_id . ') Variation' : '',
                'item_variant_value'    => $variation_id ? implode( ', ', $product->get_variation_attributes() ) : '',
                'item_variant_friendly' => implode( ', ', $variation_data ),
                'subtotal'              => (float) $item['line_subtotal'],
            ];
        }

        return rest_ensure_response([
            'cart_total' => (float) $cart->get_total( '' ),
            'item_count' => $cart->get_cart_contents_count(),
            'currency'   => get_woocommerce_currency(),
            'items'      => $items,
        ]);

    } catch ( \Throwable $e ) {
		adt_debug_log('cart-summary error: ' . $e->getMessage());

        return rest_ensure_response([
            'error'   => 'server_error',
            'message' => 'Cart summary failed',
            'debug'   => $e->getMessage(),
        ]);
    }
}


// ------------------------------
// 9. Admin Script Enqueue - Delegate to adt-admin-assets.php
// ------------------------------
// All admin asset enqueuing is now handled in admin/adt-admin-assets.php
// This ensures ADTData is properly localized to all scripts
// No code needed here - just the require statement below

// Shared ADT CSS — loads everywhere (frontend + backend)
function adt_enqueue_shared_styles() {
    $css_file = plugin_dir_path(__FILE__) . '../assets/css/adt-shared.css';
    $css_url  = plugin_dir_url(__FILE__) . '../assets/css/adt-shared.css';

    if (file_exists($css_file)) {
        wp_register_style(
            'adt-shared',
            $css_url,
            [],
            filemtime($css_file)
        );
        wp_enqueue_style('adt-shared');
    } else {
        adt_debug_log('[ADT] ❌ Missing shared CSS: assets/css/adt-shared.css');
    }
}
add_action('wp_enqueue_scripts', 'adt_enqueue_shared_styles');  // frontend
add_action('admin_enqueue_scripts', 'adt_enqueue_shared_styles'); // backend

add_action('wp_enqueue_scripts', function () {
	// Skip on admin or builder pages
	if (is_admin() || (function_exists('adt_is_builder_editor_page') && adt_is_builder_editor_page())) {
	    return;
	}
	$settings = get_option('adt_settings', []);
	// Step up from /includes/ to the plugin root
	$plugin_root_url  = plugin_dir_url( dirname( __FILE__ ) );
	$plugin_root_path = plugin_dir_path( dirname( __FILE__ ) );
	$base_url  = $plugin_root_url . 'assets/js/';
	$base_path = $plugin_root_path . 'assets/js/';
	// Helper with filemtime versioning
	$enqueue = function ($handle, $file, $deps = [], $in_footer = true) use ($base_url, $base_path) {
	    $src = $base_url . $file;
	    $ver = file_exists($base_path . $file) ? filemtime($base_path . $file) : null;
	    wp_enqueue_script($handle, $src, $deps, $ver, $in_footer);
	};
	
	// === 1) Add ADTData configuration ===
	// Safely get frontend config with error handling
	$frontend_config = [];
	if (function_exists('adt_get_frontend_config')) {
	    $frontend_config = adt_get_frontend_config();
		
		// WordPress.org build: full feature set, no license gate.
		$frontend_config['full_features'] = 1;
		$frontend_config['isPremiumUser'] = 1; // Legacy key for minified bundles.
		$frontend_config['is_premium'] = 1; // Legacy key for minified bundles.
    
	    // Ensure it's an array
		if (!is_array($frontend_config)) {
		    adt_debug_log('Warning: adt_get_frontend_config() returned non-array: ' . gettype($frontend_config));
		    $frontend_config = [];
		}
	}

	// Inline config attached to wp-polyfill so it appears in <head> before any
	// tracking scripts, without emitting a raw <script> tag directly.
	wp_add_inline_script(
	    'wp-polyfill',
	    'window.ADTData = window.ADTData || {}; Object.assign(ADTData, ' . wp_json_encode( $frontend_config ) . ');',
	    'after'
	);

	// Add event filtering helper - IMMEDIATELY AFTER ADTData
	wp_add_inline_script(
	    'wp-polyfill',
	    '(function() {
	        window.adtShouldTrackEvent = function(eventName) {
	            // ALWAYS allow overlay/debug events regardless of page exclusion
	            if (eventName && (
	                eventName.startsWith("adt_overlay_") || 
	                eventName.startsWith("adt_debug_") ||
	                eventName.startsWith("adt_test_") ||
	                eventName === "adt_consent_loaded" ||
	                eventName === "adt_consent_updated" ||
	                eventName === "overlay_init" ||
	                eventName === "debug_init"
	            )) {
	                return true;
	            }

	            // Block pageview if shouldTrackPage is false
	            if (eventName === "page_view" && window.ADTData && window.ADTData.shouldTrackPage === false) {
	                if (window.ADTData.debug) {
	                    console.warn("[ADT] Pageview blocked by regex exclusion:", window.location.href);
	                }
	                return false;
	            }

	            // Check shouldTrackPage flag for all other tracking events
	            if (window.ADTData && window.ADTData.shouldTrackPage === false) {
	                if (window.ADTData.debug) {
	                    console.warn("[ADT] Event blocked by regex filter:", eventName);
	                }
	                return false;
	            }

	            return true;
	        };
    
	        if (window.ADTData && window.ADTData.shouldTrackPage === false && window.ADTData.debug) {
	            console.warn("[ADT] Page excluded from tracking (overlay remains active for admins)");
	        }
	    })();',
	    'after'
	);

	// === 1.5) Runtime flags FIRST (right after wp-polyfill) ===
	$enqueue('adt-runtime-flags', 'adt-runtime-flags.js', ['wp-polyfill']);

	// === 2) Core Dependencies ===
	$enqueue('adt-utils-lite', 'adt-utils-lite.js', ['adt-runtime-flags']);

	// === 2.5) Event Queue Manager (loads before consent for early event capture) ===
	$enqueue('adt-event-queue', 'adt-event-queue.js', ['adt-utils-lite']);
	
	// === 3) Consent Manager (MUST load before everything else) ===
	$enqueue('adt-consent', 'adt-consent-manager.js', ['adt-utils-lite', 'adt-event-queue'], false);

	// === 3.5) Integration Coordinator - load when ecommerce or pixels are enabled ===
	$ecommerce_enabled = !empty($settings['enable_ecommerce_tracking']);
	$pixels_enabled = !empty($settings['pixel_tracking_enabled']);

	if ($ecommerce_enabled || $pixels_enabled) {
	    $enqueue('adt-integration-coordinator', 'adt-integration-coordinator.js', [
	        'adt-utils-lite',
	        'adt-consent'
	    ]);
	}

	// Add consent helper and CMP bindings
	wp_add_inline_script('adt-consent', <<<'JS'
	// Fallback hasConsent() shim
	if (typeof hasConsent !== 'function') {
	  window.hasConsent = function(purpose = 'analytics') {
	    const gtmOk = window.__gtmPolicy?.analytics_storage === 'granted';
	    const cmp   = window.ADTConsent?.[purpose];
	    if (cmp === false) return false;
	    if (cmp === true)  return true;
	    return !!ADTData?.fallback_track_without_cmp || gtmOk;
	  };
	}
	
	// CMP Bindings
	(function(){
	  function updateConsent(granted){
	    window.ADTConsent = window.ADTConsent || {};
	    window.ADTConsent.analytics = granted;
	    window.dataLayer = window.dataLayer || [];
	    dataLayer.push({ event: 'adt_consent_updated', analytics: granted });
	  }
	  // Cookiebot
	  if (typeof Cookiebot !== 'undefined') {
	    window.addEventListener('CookieConsentDeclaration', function(){
	      updateConsent(!!Cookiebot.consents.statistics);
	    });
	  }
	  // OneTrust
	  if (typeof OneTrust !== 'undefined' && typeof OneTrust.OnConsentChanged === 'function') {
	    OneTrust.OnConsentChanged(function(){
	      updateConsent(OneTrust.IsConsentGiven('C0002'));
	    });
	  }
	})();
	JS
	, 'after');

	    // === 3.5) Log Manager - Controls debug verbosity ===
		//$enqueue('adt-log-manager', 'adt-log-manager.js', ['adt-utils-lite']);
		$enqueue('adt-log-manager', 'adt-log-manager.js', []);

		// Pass debug level setting to frontend
		wp_add_inline_script('adt-log-manager', 
		    'window.ADTData = window.ADTData || {}; ADTData.debugLevel = "' . 
		    esc_js($settings['debug_level'] ?? 'normal') . '";', 
		    'before'
		);

		// === 4) After consent manager ===
		// $enqueue('adt-integration', 'adt-integration-coordinator.js', ['adt-consent']);


		// Add this temporarily above the enqueue
		// error_log('Session file exists: ' . (file_exists($base_path . 'adt-session-manager.js') ? 'YES' : 'NO'));
		// error_log('Session file path: ' . $base_path . 'adt-session-manager.js');
	
		// === 5) Session Manager ===
		wp_enqueue_script(
		    'adt-session',
		    $base_url . 'adt-session-manager.js',
		    ['adt-utils-lite', 'adt-consent', 'adt-runtime-flags'],
		    file_exists($base_path . 'adt-session-manager.js') ? filemtime($base_path . 'adt-session-manager.js') : null,
		    false  // Load in header
		);

		// Localize session validation data - Use unique name
		wp_localize_script('adt-session', 'ADTSessionValidation', [
		    'session_nonce' => wp_create_nonce('adt_session_nonce'),
		    'ajax_url' => admin_url('admin-ajax.php')
		]);
	
		// wp_add_inline_script('adt-session',
		//     'window.ADTData = window.ADTData || {}; ' .
		//     'ADTData.session_nonce = "' . wp_create_nonce('adt_session_nonce') . '"; ' .
		//     'ADTData.ajax_url = "' . admin_url('admin-ajax.php') . '";',
		//     'before'
		// );
		
		// === 6) Core ===
		$enqueue('adt-core-lite', 'adt-core-lite.js', ['adt-utils-lite', 'adt-consent']);

		// === 7) Pageview (loads early, after consent) ===
		$enqueue('adt-pageview', 'adt-pageview.js', [
		    'adt-utils-lite',
		    'adt-consent',
		    'adt-core-lite'
		]);

		// === 7) UTM Tracking (loads early for attribution) ===
		$enqueue('adt-utm', 'adt-utm-tracking.js', ['adt-utils-lite']);

		// === 8) Cookie Tracking ===
		if (!empty($settings['include_cookies'])) {
		    $enqueue('adt-cookies', 'adt-cookie-tracking.js', [
		        'adt-utils-lite',
		        'adt-utm'
		    ]);
		} 
    
	    // === 9) Engagement Tracking ===
	    $enqueue('adt-engagement', 'adt-engagement-tracking.js', ['adt-utils-lite']);
	
		// === 10) Video Tracking (always load to capture session summary) ===
		$enqueue('adt-video', 'adt-video-tracking.js', ['adt-utils-lite']);
    
	// === 11) Ecommerce Suite ===
		if (!empty($settings['enable_ecommerce_tracking'])) {
		    // Customer Type Module
		    $enqueue('adt-customer-type', 'adt-customer-type.js', ['adt-utils-lite']);
    
		    // Build dependencies for main ecommerce module
		    $ecom_deps = ['adt-utils-lite', 'adt-core-lite', 'adt-customer-type'];
    
		// Enrichment Module
		$enqueue('adt-ecom-enrich', 'adt-ecommerce-enrichment.js', [
		    'adt-utils-lite',
		    'adt-core-lite',
		    'adt-customer-type'
		]);
		$ecom_deps[] = 'adt-ecom-enrich';
    
		    // Main Ecommerce Tracking
		    $enqueue('adt-ecom-lite', 'adt-ecommerce-lite.js', $ecom_deps);
		}
	
	    // === 13) Form Field Tracker ===
	    if (!empty($settings['formVendorTracking'])) {
	        $enqueue('adt-form-tracker-core', 'adt-form-tracker-core.js', ['adt-utils-lite']);
	    }
    
		// === 16) Debug Overlay (controlled by its own setting) ===
		// More robust checking for overlay enabled status
		$overlay_enabled = (
		    !empty($settings['enable_debug_overlay']) || 
		    !empty($settings['show_debug_overlay']) ||
		    $settings['enable_debug_overlay'] === '1' ||
		    $settings['enable_debug_overlay'] === 1
		);



		if ($overlay_enabled) {
		    // More lenient permission check - allow any logged-in admin by default
		    $min_role = $settings['overlay_min_role'] ?? 'administrator';
		    $has_permission = is_user_logged_in() && (
		        current_user_can('manage_options') || 
		        adt_user_has_min_role($min_role)
		    );

		    if ($has_permission) {
		        // Define version for cache busting
		        $version = get_option('adt_cache_buster', defined('ADT_VERSION') ? ADT_VERSION : time());
    
		        // Load CSS file - fixed path
		        wp_enqueue_style('adt-debug-overlay-styles', 
		            plugin_dir_url(dirname(__FILE__)) . 'assets/css/adt-debug-overlay-styles.css', 
		            [], 
		            $version
		        );
    
		        // Load JavaScript files in dependency order
		        // Note: adt-utils-lite is already enqueued at the top of the file with proper dependencies
		        $enqueue('adt-debug-overlay-markup', 'adt-debug-overlay-markup.js', ['adt-utils-lite']);
		        $enqueue('adt-debug-overlay-simulator', 'adt-debug-overlay-simulator.js', ['adt-debug-overlay-markup']);
		        $enqueue('adt-debug-overlay-core', 'adt-debug-overlay-core.js', ['adt-utils-lite', 'adt-debug-overlay-markup', 'adt-debug-overlay-simulator']);
    
		        // Get fresh settings from database to ensure we have the latest values
		        $fresh_settings = get_option('adt_settings', []);
    
		        // Set up overlay settings with Event Simulator flag
		        // Use string '1'/'0' for all boolean flags to match settings format
		        $overlay_settings = array(
		            'enable_debug_overlay' => 1,
		            'overlayEnabled' => 1,
		            'show_blocked_events_overlay' => !empty($fresh_settings['show_blocked_events_overlay']) ? 1 : 0,
		            'show_event_filters' => !empty($fresh_settings['show_event_filters']) ? 1 : 0,
		            'show_sdk_status' => !empty($fresh_settings['show_sdk_status']) ? 1 : 0,
		            'is_logged_in' => 1,
		            'isPremiumUser' => 1,
		            'is_premium' => 1,
		            'showSimulator' => !empty($fresh_settings['show_simulator']) ? 1 : 0,
				    'is_ip_excluded' => function_exists('adt_is_ip_excluded') ? adt_is_ip_excluded() : false,
				    'tracking_disabled' => function_exists('adt_is_ip_excluded') ? adt_is_ip_excluded() : false,
				    'current_ip' => function_exists('adt_get_client_ip') ? adt_get_client_ip() : ''
		        );
    
		        // Ensure settings are available globally - FORCE overlay regardless of shouldTrackPage
		        wp_add_inline_script('adt-debug-overlay-core', 
		    'window.adt_settings = ' . wp_json_encode($overlay_settings) . ';

		            // Don\'t try to reassign ADTData if it\'s read-only
		            if (typeof window.ADTData === "undefined") {
		                window.ADTData = {};
		            }

		            // Merge settings safely
		            try {
		                Object.assign(window.ADTData, ' . wp_json_encode($overlay_settings) . ');
		            } catch(e) {
		                // If ADTData is read-only, create adt_settings as fallback
		                console.warn("[ADT] Could not merge into ADTData, using adt_settings", e);
		            }

		            // CRITICAL: Ensure is_logged_in is explicitly set
		            if (typeof window.ADTData.is_logged_in === "undefined") {
		                window.ADTData.is_logged_in = 1;
		            }

		            // Debug log to verify
		            console.log("[ADT Overlay] Settings loaded:", {
		                is_logged_in: window.ADTData.is_logged_in,
		                enable_debug_overlay: window.ADTData.enable_debug_overlay,
		                overlayEnabled: window.ADTData.overlayEnabled
		            });

		            // Manually inject regex fields (wp_localize_script doesn\'t handle them properly)
		            window.ADTData.regex_exclude = "' . esc_js($settings['regex_exclude'] ?? '') . '";

		            // Initialize dataLayer
		            window.dataLayer = window.dataLayer || [];

		            window.adtDebug("Overlay enabled. Tracking settings:", {
		                shouldTrackPage: window.ADTData.shouldTrackPage,
		                regex_exclude: window.ADTData.regex_exclude,
		                show_blocked_events_overlay: window.ADTData.show_blocked_events_overlay
		            });

		            setTimeout(function() {
		                if (window.ADTOverlayCore && typeof window.ADTOverlayCore.init === "function") {
		                    window.ADTOverlayCore.init();
		                    window.adtDebug("Overlay manually initialized");
		                }
		            }, 1000);', 
		            'before'
		        );
    
		    } else {
		        adt_debug_log('Overlay not loaded - user permission check failed. Required role: ' . $min_role . ', User roles: ' . implode(', ', wp_get_current_user()->roles));
		    }
		} else {
		    adt_debug_log( 'Overlay not loaded - overlay_enabled setting is false. enable_debug_overlay value: ' . wp_json_encode( $settings['enable_debug_overlay'] ?? 'NOT_SET' ) );
		}
		}, 20);

// In your plugin
add_action('woocommerce_thankyou', function($order_id) {
  if (!$order_id) return;
  $order = wc_get_order($order_id);
  if (!$order) return;

  $items = [];
  foreach ($order->get_items() as $item) {
    $product = $item->get_product();
    $items[] = [
      'item_id'   => $product ? $product->get_id() : $item->get_product_id(),
      'item_name' => $item->get_name(),
      'price'     => floatval($order->get_item_subtotal($item, false, false)),
      'quantity'  => intval($item->get_quantity()),
      'category'  => $product ? wc_get_product_category_list($product->get_id(), ', ') : null,
      'sku'       => $product ? $product->get_sku() : null,
    ];
  }

  // Optimize orders_count + is_new
  $orders_count = 1;
  $is_new       = true;
  if ($order->get_user_id()) {
    $orders_count = count_user_posts($order->get_user_id(), 'shop_order');
    $is_new       = ($orders_count === 1);
  }

  $data = [
    'id'        => (string) $order->get_id(),
    'total'     => floatval($order->get_total()),
    'tax'       => floatval($order->get_total_tax()),
    'shipping'  => floatval($order->get_shipping_total()),
    'coupon'    => implode(',', $order->get_coupon_codes()),
    'items'     => $items,
    'customer'  => [
      'orders_count' => $orders_count,
      'is_new'       => $is_new
    ]
  ];

  // Pass purchase data to JavaScript via inline script on the datalayer handle.
  wp_add_inline_script( 'adt-datalayer', 'window.ADTPurchaseData = ' . wp_json_encode( $data ) . ';', 'before' );
}, 10, 1);


add_action(
	'admin_init',
	static function () {
		if ( ! adt_verify_admin_get_action( 'adt_reset_fresh', 'adt_reset_fresh' ) ) {
			return;
		}
		delete_option( 'adt_settings' );
		delete_option( 'adt_settings_transient' );
		delete_option( 'adt_welcome_dismissed' );
		update_option( 'adt_activation_timestamp', time() );
		wp_safe_redirect( admin_url( 'admin.php?page=adt-settings&reset=success' ) );
		exit;
	}
);

// Debug stub is registered via wp_enqueue_scripts above (search for 'adt-debug-stub').