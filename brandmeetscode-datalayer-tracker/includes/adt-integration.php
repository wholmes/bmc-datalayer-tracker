<?php
/**
 * DataLayer Tracker - Third-Party Integration Handler
 * 
 * @package    DataLayer_Tracker
 * @subpackage Core
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
defined('ABSPATH') || exit; 

// ============================================================
// PART 2: Integration coordinator — enqueued as proper JS file
// ============================================================

/**
 * Enqueue integration coordinator script when advanced features are enabled.
 * JS logic lives in assets/js/adt-free-coordinator.js.
 */
add_action('wp_enqueue_scripts', function() {
    $settings = get_option('adt_settings', []);

    $needs_coordinator = !empty($settings['enable_ecommerce_tracking'])
        || !empty($settings['pixel_tracking_enabled'])
        || !empty($settings['meta_capi_enabled'])
        || !empty($settings['ga4_mp_enabled'])
        || !empty($settings['formVendorTracking'])
        || !empty($settings['include_content_intelligence']);

    if ( ! $needs_coordinator ) return;

    $coordinator_file = plugin_dir_path( __DIR__ ) . 'assets/js/adt-free-coordinator.js';
    if ( file_exists( $coordinator_file ) ) {
        wp_register_script(
            'adt-free-coordinator',
            plugin_dir_url( __DIR__ ) . 'assets/js/adt-free-coordinator.js',
            [ 'adt-utils-lite' ],
            filemtime( $coordinator_file ),
            true
        );
        wp_enqueue_script( 'adt-free-coordinator' );
    }
}, 999);

// ============================================================
// PART 3: Universal consent check — enqueued as proper JS file
// ============================================================

/**
 * Enqueue universal consent check script early in page head.
 * JS logic lives in assets/js/adt-consent-universal.js.
 */
add_action('wp_enqueue_scripts', function() {
    $consent_file = plugin_dir_path( __DIR__ ) . 'assets/js/adt-consent-universal.js';
    if ( file_exists( $consent_file ) ) {
        wp_register_script(
            'adt-consent-universal',
            plugin_dir_url( __DIR__ ) . 'assets/js/adt-consent-universal.js',
            [],
            filemtime( $consent_file ),
            false
        );
        wp_enqueue_script( 'adt-consent-universal' );
    }
}, 1);

/**
 * @deprecated Retained only for remove_action() compatibility.
 * Consent check is now enqueued via wp_enqueue_scripts/wp_register_script above.
 */
function adt_add_universal_consent_check() {
    // No-op: script is enqueued via wp_enqueue_scripts.
}
add_action('wp_head', 'adt_add_universal_consent_check', 1);

// ============================================================
// PART 4: Settings validation to ensure consistency
// ============================================================

/**
 * Validate and fix settings on save
 */
add_filter('pre_update_option_adt_settings', function($new_value, $old_value) {
    // Ensure consent settings are consistent
    if (!empty($new_value['delay_until_consent'])) {
        // If delaying until consent, don't force tracking
        $new_value['fallback_track_without_cmp'] = '0';
    }
    
    // Validate pixel event map JSON
    if (!empty($new_value['pixel_event_map_json'])) {
        $decoded = json_decode($new_value['pixel_event_map_json'], true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            // Invalid JSON, reset to empty object
            $new_value['pixel_event_map_json'] = '{}';
        }
    }
    
    // Ensure dual pixel mode only works with pixels enabled
    if (empty($new_value['pixel_tracking_enabled'])) {
        $new_value['dual_pixel_mode'] = '0';
    }
    
    return $new_value;
}, 10, 2);

// ============================================================
// PART 5: Debug helper — enqueued as proper JS file
// ============================================================

/**
 * Enqueue debug console helper script when debug mode is active.
 * JS logic lives in assets/js/adt-cmp-debug.js.
 */
add_action('wp_enqueue_scripts', function() {
    $settings = get_option('adt_settings', []);
    if ( empty( $settings['debug_mode'] ) ) return;

    $debug_file = plugin_dir_path( __DIR__ ) . 'assets/js/adt-cmp-debug.js';
    if ( file_exists( $debug_file ) ) {
        wp_register_script(
            'adt-cmp-debug',
            plugin_dir_url( __DIR__ ) . 'assets/js/adt-cmp-debug.js',
            [ 'adt-utils-lite' ],
            filemtime( $debug_file ),
            true
        );
        wp_enqueue_script( 'adt-cmp-debug' );
    }
}, 1000);
