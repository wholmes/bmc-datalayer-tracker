<?php
/**
 * DataLayer Tracker - Frontend Scripts Enqueuer
 * 
 * @package    DataLayer_Tracker
 * @subpackage Frontend
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
if (!defined('ABSPATH')) {
    exit;
}

add_action('wp_enqueue_scripts', function () {
	
    add_action('wp_print_scripts', function() {
        global $wp_scripts;
        if (isset($wp_scripts->queue) && in_array('adt-form-tracker-core', $wp_scripts->queue)) {
            // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
            error_log('[ADT] Form tracker IS in queue - IP excluded: ' . (function_exists('adt_is_ip_excluded') && adt_is_ip_excluded() ? 'YES' : 'NO'));
        }
    }, 999);
    
    if (adt_is_builder_editor_page() || is_admin()) return;
	
    $settings   = get_option('adt_settings', []);
    $base_url   = plugin_dir_url(__FILE__) . '../assets/js/';
    $base_path  = plugin_dir_path(__FILE__) . '../assets/js/';
    
    // Check if IP is excluded
    $is_ip_excluded = function_exists('adt_is_ip_excluded') && adt_is_ip_excluded();
		

    $full_features = true;

	// Inject IP exclusion flag into <head> before any tracking scripts load.
	// Uses a no-src registered script so wp_add_inline_script can target it.
	$adt_asset_ver = defined( 'ADT_VERSION' ) ? ADT_VERSION : '1.2.5';
	wp_register_script( 'adt-ip-exclusion-check', false, [], $adt_asset_ver, false );
	wp_enqueue_script( 'adt-ip-exclusion-check' );
	wp_add_inline_script(
		'adt-ip-exclusion-check',
		'window.adtIPExcluded = ' . ( $is_ip_excluded ? 'true' : 'false' ) . ';'
	);
	
	// Global Utilities - Enqueue BOTH files
	wp_enqueue_script(
	    'adt-utils',
	    $base_url . 'adt-utils.js',
	    [],
	    filemtime($base_path . 'adt-utils.js'),
	    true
	);

	// ------------------------------
	// Localize ADTData to BOTH scripts
	// ------------------------------
	if (function_exists('adt_build_localization_data')) {
	    // Define $should_track BEFORE using it
	    $should_track = function_exists('adt_should_track_current_page') 
	        ? adt_should_track_current_page() 
	        : true;

	    // Get the full frontend config (includes GA4 MP)
	    $adt_data = adt_get_frontend_config();

	    // Normalize consent flags to strings: the JS consent manager uses strict
	    // === '1' comparisons, but the config cache may store them as integers.
	    foreach ( [ 'fallback_track_without_cmp', 'fallbackTrackWithoutCMP', 'delay_until_consent' ] as $_ck ) {
	        if ( isset( $adt_data[ $_ck ] ) ) {
	            $adt_data[ $_ck ] = $adt_data[ $_ck ] ? '1' : '0';
	        }
	    }
    
	    // Add additional properties
	    $adt_data['shouldTrackPage'] = $should_track;
	    $adt_data['regex_exclude'] = $settings['regex_exclude'] ?? '';
	    $adt_data['regex_include'] = $settings['regex_include'] ?? '';
	    $adt_data['enable_ecommerce_tracking'] = !empty($settings['enable_ecommerce_tracking']) ? 1 : 0;
	    $adt_data['full_features'] = 1;
	    $adt_data['is_premium'] = $full_features ? 1 : 0;
	    $adt_data['isPremiumUser'] = $full_features ? 1 : 0;
	    $adt_data['overlayEnabled'] =
	        !empty($settings['enable_debug_overlay']) &&
	        is_user_logged_in() &&
	        adt_user_has_min_role($settings['overlay_min_role'] ?? 'administrator');
    
	    // ADD PIXEL DISPATCH MODE HERE:
	    $adt_data['pixel_dispatch_mode'] = $settings['pixel_dispatch_mode'] ?? 'plugin_only';
	    
	    // Add click tracking setting
	    $adt_data['enable_click_tracking'] = $settings['enable_click_tracking'] ?? '1';
    
	    // Stub removed-feature globals so frontend JS doesn't throw ReferenceErrors.
	    $frontend_stubs = '
	        window.ADTPixelManager = window.ADTPixelManager || {
	            handleEvent: function() {},
	            fireDirect: function() {},
	            getStatus: function() { return {}; }
	        };
	        window.ADTContentIntel = window.ADTContentIntel || { init: function() {} };
	    ';
	    wp_add_inline_script( 'adt-utils-lite', $frontend_stubs, 'before' );

	    // Localize to both handles
		wp_add_inline_script('adt-utils', 
		    'window.ADTData = window.ADTData || {}; Object.assign(window.ADTData, ' . wp_json_encode($adt_data) . ');',
		    'before'
		);

		wp_add_inline_script('adt-utils-lite', 
		    'window.ADTData = window.ADTData || {}; Object.assign(window.ADTData, ' . wp_json_encode($adt_data) . ');',
		    'before'
		);
		
	    wp_localize_script('adt-utils', 'ADTSessionValidation', [
	        'ajax_url' => admin_url('admin-ajax.php'),
	        'session_nonce' => wp_create_nonce('adt_session_nonce')
	    ]);
			    
	    wp_localize_script('adt-utils', 'ADTAdmin', [
	        'ajaxurl' => admin_url('admin-ajax.php'),
	        'ga4_test_nonce' => wp_create_nonce('adt_ga4_test'),
	        'ga4_stats_nonce' => wp_create_nonce('adt_ga4_stats')
	    ]);

	    // Debug log injection via wp_add_inline_script (avoids raw <script> tags).
	    wp_add_inline_script(
	        'adt-utils',
	        '(function(){window.ADTData=window.ADTData||{};var DEBUG=[\'1\',1,true,\'true\'].includes(window.ADTData.debug);if(!DEBUG)return;console.log(\'[ADT-debug] Localized ADTData on load:\',JSON.parse(JSON.stringify(window.ADTData)));})();'
	    );
	}

	// ======================================================================
	// STOP HERE if IP is excluded - Allow overlay to load but prevent tracking
	// ======================================================================
	
	if ($is_ip_excluded) {
	    // Only load debug overlay scripts, skip all tracking scripts
    
	    // Also dequeue any scripts that might have been enqueued elsewhere
	    add_action('wp_print_scripts', function() {
	        wp_dequeue_script('adt-form-tracker-core');
	        wp_dequeue_script('adt-form-vendors');
	        wp_dequeue_script('adt-click-tracking');
	        wp_dequeue_script('adt-formidable-bridge');
	        wp_dequeue_script('adt-event-queue');
	    }, 999);
    
	    return;
	}

	// ------------------------------
	// Click Tracking
	// ------------------------------
	$click_file = $base_path . 'adt-click-tracking.js';
	if (file_exists($click_file)) {
	    wp_enqueue_script(
	        'adt-click-tracking',
	        $base_url . 'adt-click-tracking.js',
	        ['adt-utils'],
	        filemtime($click_file),
	        true
	    );
	}

	// ------------------------------
	// Form Tracking
	// ------------------------------
	// Load field tracking if EITHER setting is enabled
	if (!empty($settings['include_field_tracking']) || !empty($settings['formVendorTracking'])) {
	    // Field-level tracking
	    wp_enqueue_script(
	        'adt-form-tracker-core',
	        $base_url . 'adt-form-tracker-core.js',
	        ['adt-utils'],
	        filemtime($base_path . 'adt-form-tracker-core.js'),
	        true
	    );
	}

	// Only load vendor detection if specifically enabled
	if (!empty($settings['formVendorTracking'])) {
	    wp_enqueue_script(
	        'adt-vendor-forms',
	        $base_url . 'adt-form-vendors.js',
	        ['adt-utils'],
	        filemtime($base_path . 'adt-form-vendors.js'),
	        true
	    );
	}
	
	// ------------------------------
	// Formidable Forms Bridge
	// ------------------------------
	wp_enqueue_script(
	    'adt-formidable-bridge',
	    $base_url . 'adt-formidable-bridge.js',
	    ['jquery', 'adt-utils', 'adt-form-tracker-core', 'adt-form-submit'],
	    filemtime($base_path . 'adt-formidable-bridge.js'),
	    true
	);
	
	// Event Queue (for tracking history)
	wp_enqueue_script(
	    'adt-event-queue',
	    $base_url . 'adt-event-queue.js',
	    ['adt-utils-lite'],
	    filemtime($base_path . 'adt-event-queue.js'),
	    true
	);

}, 15);
 

// WooCommerce → localStorage cart sync
function adt_enqueue_cart_sync() {
	if ( ! function_exists( 'is_woocommerce' ) || ! is_woocommerce() ) {
		return;
	}
	$path = plugin_dir_path( ADT_PLUGIN_FILE ) . 'assets/js/adt-wc-cart-sync.js';
	if ( ! is_readable( $path ) ) {
		return;
	}
	wp_enqueue_script(
		'adt-wc-cart-sync',
		plugins_url( 'assets/js/adt-wc-cart-sync.js', ADT_PLUGIN_FILE ),
		array( 'jquery-core' ),
		(string) filemtime( $path ),
		true
	);
}
add_action('wp_enqueue_scripts', 'adt_enqueue_cart_sync', 30);