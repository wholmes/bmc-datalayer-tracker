<?php

/**
 * Plugin Name:       BrandMeetsCode DataLayer Tracker
 * Plugin URI:        https://datalayer-tracker.com/knowledge-base/
 * Description:       Professional dataLayer implementation with engagement, ecommerce, and content intelligence tracking
 * Version:           1.2.5
 * Requires at least: 5.8
 * Requires PHP:      7.4
 * Author:            Brand Meets Code
 * Author URI:        https://brandmeetscode.com/
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       brandmeetscode-datalayer-tracker
 * Domain Path:       /languages
 * 
 * Copyright (c) 2024-2026 Brand Meets Code
 * 
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 */
defined( 'ABSPATH' ) || exit;
// ============================================
// HELPER FUNCTIONS - Must be defined FIRST
// ============================================
if ( !function_exists( 'adt_debug_log' ) ) {
    function adt_debug_log(  $message, $data = null  ) {
        $settings = get_option( 'adt_settings', [] );
        if ( defined( 'WP_DEBUG' ) && WP_DEBUG && !empty( $settings['debug_mode'] ) ) {
            $output = '[ADT] ' . $message;
            if ( $data !== null ) {
                $output .= ': ' . print_r( $data, true ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_print_r -- Debug helper; never calls error_log.
            }
            // error_log($output);
        }
    }

}
if ( !function_exists( 'adt_log_always' ) ) {
    function adt_log_always(  $message  ) {
        // error_log('[ADT] ' . $message);
    }

}
if ( !defined( 'ADT_DEBUG' ) ) {
    define( 'ADT_DEBUG', true );
}
if ( !function_exists( 'adt_get_default_settings' ) ) {
    function adt_get_default_settings() {
        return [
            'include_page_type'                  => 1,
            'include_post_id'                    => 1,
            'include_page_title'                 => 1,
            'include_page_url'                   => 1,
            'include_slug'                       => 1,
            'include_path'                       => 1,
            'include_template'                   => 0,
            'include_screen_resolution'          => 1,
            'include_timezone_offset'            => 1,
            'include_browser_lang'               => 1,
            'include_user'                       => 1,
            'include_user_hash'                  => 1,
            'user_hash_mode'                     => 'none',
            'persist_user_hash_cookie'           => 0,
            'include_wp_flags'                   => 1,
            'include_categories'                 => 1,
            'include_tags'                       => 1,
            'include_referrer'                   => 1,
            'include_utm'                        => 1,
            'include_cookies'                    => 0,
            'cookieMatchRegex'                   => '^(utm_|ga|adt_|wp_|_gcl_|_fbp|sbjs_|_tt_|_pin_)',
            'cookie_list'                        => '',
            'include_time_on_page'               => 1,
            'include_active_time'                => 1,
            'include_scroll_depth'               => 1,
            'scroll_event_mode'                  => 'depth',
            'scroll25'                           => 0,
            'scroll50'                           => 0,
            'scroll75'                           => 0,
            'scroll100'                          => 0,
            'hover_intent_cooldown'              => 30,
            'include_hover_intent'               => 1,
            'include_scroll_back_up'             => 1,
            'include_focus_blur'                 => 1,
            'include_video_progress'             => 1,
            'include_content_intelligence'       => 0,
            'include_last_engaged_section'       => 0,
            'include_last_content_type_viewed'   => 0,
            'track_default_clicks'               => 0,
            'include_click_metadata'             => 0,
            'include_field_tracking'             => 0,
            'include_field_interaction'          => 0,
            'include_section_engagement'         => 0,
            'custom_events_json'                 => '',
            'pageView'                           => 0,
            'sessionEngagementMilestone'         => 0,
            'enable_gtm_snippet'                 => 0,
            'gtm_container_id'                   => '',
            'allow_multi_container'              => 0,
            'exclude_ips'                        => '',
            'exclude_current_user_ip'            => 0,
            'enable_ecommerce_tracking'          => 0,
            'formVendorTracking_mode'            => 'map',
            'formVendorTracking'                 => 0,
            'consent'                            => 0,
            'consentLoaded'                      => 0,
            'consentGranted'                     => 0,
            'consentRevoked'                     => 0,
            'preferred_cmp'                      => 'auto',
            'cmp_detection_timeout'              => 5,
            'delay_until_consent'                => 0,
            'fallback_track_without_cmp'         => 1,
            'enforce_tcf_for_multiple_platforms' => 0,
            'max_event_history'                  => 50,
            'session_timeout_minutes'            => 30,
            'regex_exclude'                      => '',
            'debug_mode'                         => 1,
            'debug_level'                        => 'quiet',
            'enable_debug_overlay'               => 1,
            'show_blocked_events_overlay'        => 1,
            'overlay_min_role'                   => 'administrator',
            'show_event_filters'                 => 0,
            'show_simulator'                     => 0,
            'set_dataLayerBlocked_flag'          => 0,
            'clear_datalayer_on_load'            => 0,
        ];
    }

}
/**
 * Deprecated: retained so legacy code calling adt_fs() does not fatal.
 *
 * @return null
 */
if ( ! function_exists( 'adt_fs' ) ) {
    function adt_fs() {
        return null;
    }
}
// Hide WP-generated "Documentation" duplicate menu item via enqueued style.
add_action( 'admin_enqueue_scripts', function() {
    wp_add_inline_style( 'adt-admin', '#toplevel_page_adt-settings .wp-submenu a[href*="documentation"] { display: none !important; }' );
} );
// Add documentation link that opens in a new tab.
add_action( 'admin_menu', function () {
    add_submenu_page(
        'adt-settings',
        'Documentation',
        'Documentation',
        'read',
        'adt-documentation',
        function () {
            // Redirect to docs via inline script attached to the enqueued admin handle.
            $js = "window.open('https://datalayer-tracker.com/knowledge-base/','_blank');window.history.back();";
            wp_add_inline_script( 'adt-utils', $js, 'after' );
        }
    );
}, 999 );
// ============================================
// ALL YOUR PLUGIN CODE STARTS HERE
// ============================================
ob_start();
// TEMPORARY: Clear legacy option cache (manage_options).
// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Intentional admin-only GET utility; capability enforced below.
if ( isset( $_GET['adt_force_clear_cache'] ) && current_user_can( 'manage_options' ) ) {
	delete_option( 'adt_is_premium' ); // Legacy option from older builds.
	wp_die(
		wp_kses_post(
			sprintf(
				/* translators: %s: Pricing admin URL */
				__( 'Caches cleared. <a href="%s">Open plans &amp; Pro</a>', 'brandmeetscode-datalayer-tracker' ),
				esc_url( admin_url( 'admin.php?page=adt-pricing' ) )
			)
		)
	);
}
// ---------------------------------------------------------
// 0. PHP Session — only start on WooCommerce order pages
// ---------------------------------------------------------
// Calling session_start() globally bypasses server-level page caches (Nginx,
// Varnish). We limit it to the WooCommerce order-received endpoint where the
// adt_output_ecommerce_data() function reads session-stored purchase payloads.
add_action( 'template_redirect', function () {
    if (
        session_status() !== PHP_SESSION_NONE
        || is_admin()
        || ( defined( 'DOING_CRON' ) && DOING_CRON )
        || ( defined( 'REST_REQUEST' ) && REST_REQUEST )
    ) {
        return;
    }
    // Only start a session on WooCommerce order-confirmation pages so that
    // regular frontend pages remain fully cacheable.
    if (
        function_exists( 'is_wc_endpoint_url' ) && is_wc_endpoint_url( 'order-received' )
        || ( function_exists( 'is_order_received_page' ) && is_order_received_page() )
    ) {
        session_start();
    }
}, 1 );
// ---------------------------------------------------------
// 1. Plugin Version and Path Definitions
// ---------------------------------------------------------
if ( !defined( 'ADT_VERSION' ) ) {
    $plugin_data = get_file_data( __FILE__, [
        'Version' => 'Version',
    ], false );
    define( 'ADT_VERSION', $plugin_data['Version'] );
}
define( 'ADT_PLUGIN_FILE', __FILE__ );
if ( !defined( 'ADT_PLUGIN_DIR' ) ) {
    define( 'ADT_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
}
define( 'ADT_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

/**
 * Public storefront / plans URL shown in WP Admin (“Get Pro add-on”).
 * Override in wp-config.php (loaded before wp-settings.php), if needed:
 *   define( 'ADT_PRO_SALES_URL', 'https://example.com/plans/' );
 * Filter: adt_pro_sales_url
 *
 * Customer download area when different from plans (Freemius: use customer portal or direct file link):
 *   define( 'ADT_PRO_CUSTOMER_DOWNLOAD_URL', 'https://example.com/account/' );
 * Filter: adt_pro_customer_download_url
 *
 * Customer portal (billing, license, downloads). For datalayer-tracker.com this redirects to Freemius:
 *   define( 'ADT_PRO_CUSTOMER_ACCOUNT_URL', 'https://example.com/account/' );
 * Filter: adt_pro_customer_account_url
 *
 * @return string
 */
function adt_get_pro_sales_url() {
	$fallback = 'https://datalayer-tracker.com/pricing';
	$url      = $fallback;

	if ( defined( 'ADT_PRO_SALES_URL' ) && '' !== constant( 'ADT_PRO_SALES_URL' ) ) {
		$url = constant( 'ADT_PRO_SALES_URL' );
	}

	return apply_filters( 'adt_pro_sales_url', $url );
}

/**
 * @return string
 */
function adt_get_pro_customer_download_url() {
	if ( defined( 'ADT_PRO_CUSTOMER_DOWNLOAD_URL' ) && '' !== constant( 'ADT_PRO_CUSTOMER_DOWNLOAD_URL' ) ) {
		$url = constant( 'ADT_PRO_CUSTOMER_DOWNLOAD_URL' );
	} else {
		$url = adt_get_pro_customer_account_url();
	}

	return apply_filters( 'adt_pro_customer_download_url', $url );
}

/**
 * Customer portal URL (Freemius-hosted for datalayer-tracker.com — site path `/account` redirects there).
 *
 * @return string
 */
function adt_get_pro_customer_account_url() {
	if ( defined( 'ADT_PRO_CUSTOMER_ACCOUNT_URL' ) && '' !== constant( 'ADT_PRO_CUSTOMER_ACCOUNT_URL' ) ) {
		$url = constant( 'ADT_PRO_CUSTOMER_ACCOUNT_URL' );
	} else {
		$url = 'https://datalayer-tracker.com/account';
	}

	return apply_filters( 'adt_pro_customer_account_url', $url );
}

/**
 * Sanitize inline SVG fragments for safe echo in admin (tab icons, toolbar).
 *
 * @param string $svg HTML/SVG markup from trusted static sources only.
 * @return string
 */
function adt_kses_inline_svg( $svg ) {
	static $allowed = null;

	if ( null === $allowed ) {
		$allowed = array(
			'svg'      => array(
				'xmlns'           => true,
				'width'           => true,
				'height'          => true,
				'viewbox'         => true,
				'fill'            => true,
				'stroke'          => true,
				'style'           => true,
				'class'           => true,
				'role'            => true,
				'aria-hidden'     => true,
				'stroke-width'    => true,
				'stroke-linecap'  => true,
				'stroke-linejoin' => true,
			),
			'path'     => array(
				'd'               => true,
				'fill'            => true,
				'stroke'          => true,
				'stroke-width'    => true,
				'stroke-linecap'  => true,
				'stroke-linejoin' => true,
			),
			'circle'   => array(
				'cx'           => true,
				'cy'           => true,
				'r'            => true,
				'fill'         => true,
				'stroke'       => true,
				'stroke-width' => true,
			),
			'rect'     => array(
				'x'            => true,
				'y'            => true,
				'width'        => true,
				'height'       => true,
				'rx'           => true,
				'ry'           => true,
				'stroke'       => true,
				'fill'         => true,
				'stroke-width' => true,
			),
			'polyline' => array(
				'points'       => true,
				'stroke'       => true,
				'stroke-width' => true,
				'fill'         => true,
			),
			'line'     => array(
				'x1'           => true,
				'y1'           => true,
				'x2'           => true,
				'y2'           => true,
				'stroke'       => true,
				'stroke-width' => true,
			),
		);
	}

	return wp_kses( (string) $svg, $allowed );
}

// ---------------------------------------------------------
// 2. Core Helper Functions
// ---------------------------------------------------------
function adt_user_has_min_role(  $min_role = 'administrator'  ) {
    if ( !is_user_logged_in() ) {
        return false;
    }
    $user = wp_get_current_user();
    $roles = array_map( 'strtolower', (array) $user->roles );
    $role_ranks = [
        'subscriber'    => 0,
        'contributor'   => 1,
        'author'        => 2,
        'editor'        => 3,
        'administrator' => 4,
    ];
    $user_rank = max( array_map( fn( $r ) => $role_ranks[$r] ?? 0, $roles ) );
    $min_rank = $role_ranks[strtolower( $min_role )] ?? 4;
    return $user_rank >= $min_rank;
}

if ( !function_exists( 'adt_log' ) ) {
    function adt_log(  $message, $data = null, $type = 'info'  ) {
        if ( !defined( 'WP_DEBUG' ) || !WP_DEBUG ) {
            return;
        }
        $prefix = '[ADT]';
        $formatted = ( is_string( $message ) ? $message : print_r( $message, true ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_print_r
        if ( $data !== null ) {
            $formatted .= ' ' . print_r( $data, true ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_print_r
        }
    }

}
// ---------------------------------------------------------
// 2.1 Feature capability (.org build — no license gate)
// ---------------------------------------------------------
function adt_all_features_enabled() {
	return true;
}

/**
 * @deprecated 1.2.6 Use adt_all_features_enabled().
 * @return bool
 */
function user_is_premium() {
	return adt_all_features_enabled();
}

/**
 * @deprecated 1.2.6 Use adt_all_features_enabled().
 * @return bool
 */
function adt_user_can_use_premium() {
	return adt_all_features_enabled();
}

// ---------------------------------------------------------
// 3. Core Includes
// ---------------------------------------------------------
require_once ADT_PLUGIN_DIR . 'includes/adt-debug-tools.php';
require_once ADT_PLUGIN_DIR . 'includes/adt-integration.php';
require_once ADT_PLUGIN_DIR . 'includes/adt-core-init.php';
require_once ADT_PLUGIN_DIR . 'includes/ajax/adt-ajax-handlers.php';
require_once ADT_PLUGIN_DIR . 'includes/ajax/adt-cart-endpoints.php';
require_once ADT_PLUGIN_DIR . 'admin/adt-settings-import-export.php';
require_once ADT_PLUGIN_DIR . 'includes/integrations/adt-woocommerce-refunds.php';
require_once ADT_PLUGIN_DIR . 'includes/adt-knowledge-base.php';
require_once ADT_PLUGIN_DIR . 'includes/adt-session-validation.php';
require_once ADT_PLUGIN_DIR . 'includes/ajax/adt-setup-wizard-ajax.php';
require_once ADT_PLUGIN_DIR . 'admin/adt-setup-wizard.php';
// URL parameter to trigger welcome notice
add_action( 'admin_init', function () {
    // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Intentional admin routing flag; capability enforced below.
    if ( isset( $_GET['adt_show_welcome'] ) && current_user_can( 'manage_options' ) ) {
        update_user_meta( get_current_user_id(), 'adt_show_welcome', 1 );
        wp_safe_redirect( remove_query_arg( 'adt_show_welcome' ) );
        exit;
    }
} );
// ---------------------------------------------------------
// 5.1 Legacy option cleanup & admin-only includes
// ---------------------------------------------------------
add_action( 'plugins_loaded', function () {

	if ( ! get_option( 'adt_cleared_legacy_premium_opt_122' ) ) {
		delete_option( 'adt_is_premium' );
		update_option( 'adt_cleared_legacy_premium_opt_122', true );
	}

}, 5 );

add_action( 'plugins_loaded', function () {
    // Load admin consent panel (check if file exists first)
    if ( ! is_admin() ) {
        return;
    }

    $consent_panel_file = ADT_PLUGIN_DIR . 'admin/adt-consent-status-panel.php';

    if ( file_exists( $consent_panel_file ) ) {

        require_once $consent_panel_file;

    } else {

        adt_debug_log( 'Consent panel file not found at: ' . $consent_panel_file );

    }

    $feature_carousel_file = ADT_PLUGIN_DIR . 'admin/adt-feature-carousel.php';

    if ( file_exists( $feature_carousel_file ) ) {

        require_once $feature_carousel_file;

    }
}, 20 );
// ---------------------------------------------------------
// 7.2 Check if plugin was updated and needs migration
// ---------------------------------------------------------
add_action( 'admin_init', function () {
    $current_version = '1.2.3';
    // Update this when you release new versions
    $saved_version = get_option( 'adt_plugin_version', '0.0.0' );
    // First install or version changed
    if ( version_compare( $saved_version, $current_version, '<' ) ) {
        // Get current settings
        $settings = get_option( 'adt_settings', [] );
        // Get fresh defaults
        $defaults = adt_get_default_settings();
        // Merge: keep user's saved values, add new defaults for missing keys
        foreach ( $defaults as $key => $default_value ) {
            if ( !array_key_exists( $key, $settings ) ) {
                $settings[$key] = $default_value;
            }
        }
        // Save merged settings
        update_option( 'adt_settings', $settings );
        // Update version
        update_option( 'adt_plugin_version', $current_version );
        // Log for debugging
        adt_log_always( 'Plugin updated to version ' . $current_version );
    }
}, 5 );
// ---------------------------------------------------------
// 8. Admin Nonce Verification Helper
// ---------------------------------------------------------
function adt_verify_admin_nonce_or_die(  $context = ''  ) {
    $ok = check_ajax_referer( 'adt_admin_action', 'security', false );
    if ( !$ok ) {
        wp_send_json_error( [
            'error'   => 'invalid_nonce',
            'message' => 'Your session has expired or the security token is invalid.',
        ], 403 );
        exit;
    }
}

// ---------------------------------------------------------
// 9. Fallback Consent Function
// ---------------------------------------------------------
if ( !function_exists( 'has_consent' ) ) {
    function has_consent(  $type = 'analytics'  ) {
        return true;
    }

}
// ---------------------------------------------------------
// 10. Tracking Filter
// ---------------------------------------------------------
add_filter(
    'adt_should_track',
    function ( $should_track ) {
        $settings = get_option( 'adt_settings', [] );
        $fallback_track_without_cmp = !empty( $settings['fallback_track_without_cmp'] );
        if ( $fallback_track_without_cmp ) {
            $should_track = true;
        }
        return $should_track;
    },
    10,
    1
);
// ---------------------------------------------------------
// 11. Frontend Configuration and Scripts
// ---------------------------------------------------------
require_once ADT_PLUGIN_DIR . 'includes/adt-frontend-config.php';
require_once ADT_PLUGIN_DIR . 'includes/integrations/adt-ecommerce-export.php';
// Check for legacy frontend scripts
$frontend_scripts = ADT_PLUGIN_DIR . 'includes/adt-frontend-scripts.php';
$frontend_hooks = ADT_PLUGIN_DIR . 'includes/adt-frontend-hooks.php';
if ( file_exists( $frontend_scripts ) ) {
    require_once $frontend_scripts;
}
if ( file_exists( $frontend_hooks ) ) {
    require_once $frontend_hooks;
}
// ---------------------------------------------------------
// 12. Admin UI Includes
// ---------------------------------------------------------
require_once ADT_PLUGIN_DIR . 'admin/adt-settings-register.php';
require_once ADT_PLUGIN_DIR . 'admin/adt-settings-fields.php';
require_once ADT_PLUGIN_DIR . 'admin/adt-settings-functions.php';
require_once ADT_PLUGIN_DIR . 'admin/adt-admin-assets.php';
require_once ADT_PLUGIN_DIR . 'admin/adt-smart-notices.php';
// ---------------------------------------------------------
// 14.1 WooCommerce Blocks Integration
// ---------------------------------------------------------
add_action( 'woocommerce_blocks_loaded', function () {
    if ( class_exists( 'WooCommerce' ) && function_exists( 'register_block_type' ) ) {
        add_filter(
            'woocommerce_blocks_cart_item_data',
            function ( $data, $cart_item, $cart_item_key ) {
                if ( !empty( $cart_item['product_id'] ) ) {
                    $data['data-product_id'] = (string) $cart_item['product_id'];
                }
                return $data;
            },
            10,
            3
        );
    }
} );
// ---------------------------------------------------------
// 16. WooCommerce Fragment Support
// ---------------------------------------------------------
add_filter(
    'woocommerce_get_script_data',
    function ( $params, $handle ) {
        if ( $handle === 'wc-cart-fragments' ) {
            if ( empty( $params['fragments']['notices'] ) ) {
                $params['fragments']['notices'] = '';
            }
        }
        return $params;
    },
    10,
    2
);
// Add admin bar indicator for detected CMP with debug info
add_action( 'admin_bar_menu', function ( $wp_admin_bar ) {
    // Only show on frontend, not in admin area
    if ( is_admin() ) {
        return;
    }
    if ( !current_user_can( 'manage_options' ) ) {
        return;
    }
    $settings = get_option( 'adt_settings', [] );
    if ( empty( $settings['debug_mode'] ) ) {
        return;
    }
    // Main node
    $wp_admin_bar->add_node( [
        'id'    => 'adt-cmp-status',
        'title' => '<span class="ab-icon dashicons dashicons-shield"></span> CMP: <span id="adt-detected-cmp">Detecting...</span>',
        'href'  => '#',
    ] );
    // Dropdown with debug info
    $wp_admin_bar->add_node( [
        'parent' => 'adt-cmp-status',
        'id'     => 'adt-cmp-details',
        'title'  => '<div id="adt-cmp-info" style="padding: 10px; min-width: 280px; font-size: 12px; color: #ccc;">Checking...</div>',
    ] );
}, 999 );
/**
 * Complete Activation Hook
 * This replaces your current activation hook entirely
 */
register_activation_hook( __FILE__, function () {
    // Set activation timestamp for welcome notice
    if ( !get_option( 'adt_activation_timestamp' ) ) {
        update_option( 'adt_activation_timestamp', time() );
    }
    // Initialize settings if they don't exist
    if ( !get_option( 'adt_settings' ) ) {
        // Get defaults from your settings register
        $defaults = adt_get_default_settings();
        update_option( 'adt_settings', $defaults );
        adt_debug_log( 'Plugin activated - initialized settings with defaults' );
    } else {
        // Settings exist, merge in any new defaults
        $settings = get_option( 'adt_settings', [] );
        $defaults = adt_get_default_settings();
        // Add any missing keys from defaults
        $updated = false;
        foreach ( $defaults as $key => $default_value ) {
            if ( !array_key_exists( $key, $settings ) ) {
                $settings[$key] = $default_value;
                $updated = true;
            }
        }
        if ( $updated ) {
            update_option( 'adt_settings', $settings );
            adt_debug_log( 'Plugin activated - merged new default settings' );
        }
    }
    // Set plugin version for migration tracking
    $current_version = ( defined( 'ADT_VERSION' ) ? ADT_VERSION : '1.2.3' );
    update_option( 'adt_plugin_version', $current_version );
    // Clear any caches
    if ( function_exists( 'wp_cache_flush' ) ) {
        wp_cache_flush();
    }
    adt_debug_log( "Plugin activated successfully - Version: {$current_version}" );
} );

add_action( 'wp_enqueue_scripts', function () {
    if ( ! current_user_can( 'manage_options' ) ) {
        return;
    }
    $settings = get_option( 'adt_settings', [] );
    if ( empty( $settings['debug_mode'] ) ) {
        return;
    }
    wp_enqueue_script(
        'adt-cmp-toolbar',
        plugins_url( 'assets/js/adt-cmp-toolbar.js', __FILE__ ),
        [],
        ADT_VERSION,
        true
    );
    wp_add_inline_style( 'adt-admin', '#wp-admin-bar-adt-cmp-status .ab-icon:before{content:"\f332";top:2px;}#wp-admin-bar-adt-cmp-details{background:#32373c!important;}' );
} );

// The CMP toolbar logic is now fully handled by the wp_enqueue_scripts action above.
/**
 * ADT Reset Handler - Add to brandmeetscode-datalayer-tracker.php or adt-ajax-handlers.php
 * 
 * This handler processes the "Reset to Defaults" form submission
 */
if ( !defined( 'ABSPATH' ) ) {
    exit;
}
/**
 * Handle reset to defaults form submission
 */
add_action( 'admin_init', 'adt_handle_reset_defaults' );
function adt_handle_reset_defaults() {
    // Check if this is a reset request
    if ( !isset( $_POST['adt_action'] ) || $_POST['adt_action'] !== 'reset_defaults' ) {
        return;
    }
    // Security checks
    if ( !current_user_can( 'manage_options' ) ) {
        wp_die( esc_html__( 'You do not have sufficient permissions to perform this action.', 'brandmeetscode-datalayer-tracker' ) );
    }
    // Verify nonce
    if ( ! isset( $_POST['adt_reset_defaults_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['adt_reset_defaults_nonce'] ) ), 'adt_reset_defaults' ) ) {
        wp_die( esc_html__( 'Security check failed. Please try again.', 'brandmeetscode-datalayer-tracker' ) );
    }
    // Get fresh defaults
    $defaults = ( function_exists( 'adt_get_default_settings' ) ? adt_get_default_settings() : [] );
    if ( empty( $defaults ) ) {
        wp_die( esc_html__( 'Error: Could not load default settings.', 'brandmeetscode-datalayer-tracker' ) );
    }
    // Reset settings to defaults
    update_option( 'adt_settings', $defaults );
    // Reset all notice dismissal
    delete_option( 'adt_welcome_dismissed' );
    delete_option( 'adt_notice_dismissed_welcome' );
    // Reset user-specific dismissals
    $user_id = get_current_user_id();
    delete_user_meta( $user_id, 'adt_cmp_notice_dismissed_at' );
    // Reset Activation Timestamp so welcome notice shows again
    update_option( 'adt_activation_timestamp', time() );
    // Clear any WordPress caches
    wp_cache_delete( 'adt_settings', 'options' );
    wp_cache_delete( 'alloptions', 'options' );
    // Log the reset
    if ( function_exists( 'adt_debug_log' ) ) {
        adt_debug_log( 'Settings reset to defaults by user ' . $user_id );
    }
    // Safe redirect with validated parameters
    $redirect_url = add_query_arg( [
        'page'  => 'adt-settings',
        'reset' => 'success',
        'tab'   => 'debug',
    ], admin_url( 'admin.php' ) );
    // Validate it's an admin URL
    if ( wp_validate_redirect( $redirect_url, admin_url() ) ) {
        wp_safe_redirect( $redirect_url );
        exit;
    }
}
