<?php
/**
 * DataLayer Tracker - Settings menu and admin page registration
 *
 * @package    DataLayer_Tracker
 * @subpackage Admin/Functions
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
defined('ABSPATH') || exit;

add_action('admin_menu', function () {
    // Main menu
    add_menu_page(
        esc_html__('DataLayer Tracker Settings', 'brandmeetscode-datalayer-tracker'),
        esc_html__('DataLayer Tracker', 'brandmeetscode-datalayer-tracker'),
        'manage_options',
        'adt-settings',
        'adt_render_settings_page',
        'dashicons-chart-area',
        60
    );
    
    // Welcome page (hidden from menu — empty string parent hides it without PHP 8.1 null deprecations)
    add_submenu_page(
        '',
        'Welcome to DataLayer Tracker',
        'Welcome',
        'read',
        'adt-welcome',
        'adt_render_welcome_page'
    );
    
    // Setup Wizard — onboarding (available without Pro).
    add_submenu_page(
        'adt-settings',
        'Setup Wizard',
        'Setup Wizard',
        'manage_options',
        'adt-setup-wizard',
        'adt_render_setup_wizard'
    );

    // Analytics Dashboard — optional; off by default while the screen is WIP. Core slug stays
    // `adt-analytics-dashboard` so enabling does not break bookmarks when you ship it.
    if ( apply_filters( 'adt_register_analytics_dashboard_submenu', false )
        && function_exists( 'adt_all_features_enabled' )
        && adt_all_features_enabled()
    ) {
        add_submenu_page(
            'adt-settings',
            'Analytics Dashboard',
            'Dashboard',
            'manage_options',
            'adt-analytics-dashboard',
            'adt_render_analytics_dashboard_page'
        );
    }

    // Upsell / Pro download (hosted product; guideline 11: keep restrained)
    add_submenu_page(
        'adt-settings',
        esc_html__( 'DataLayer Tracker Pro', 'brandmeetscode-datalayer-tracker' ),
        esc_html__( 'Get Pro add-on', 'brandmeetscode-datalayer-tracker' ),
        'manage_options',
        'adt-pricing',
        'adt_render_pricing_page'
    );

    add_submenu_page(
        'adt-settings',
        esc_html__( 'Customer area', 'brandmeetscode-datalayer-tracker' ),
        esc_html__( 'Customer area', 'brandmeetscode-datalayer-tracker' ),
        'manage_options',
        'adt-settings-account',
        'adt_render_customer_account_page'
    );
    
    // Field Mapping (Premium only)
    // if (function_exists('user_is_premium') && user_is_premium()) {
    //     add_submenu_page(
    //         'adt-settings',
    //         'Field Mapping',
    //         'Field Mapping',
    //         'manage_options',
    //         'adt-field-mapping',
    //         'adt_render_field_mapping_page'
    //     );
    // }
		
}, 5 );

add_action(
	'admin_menu',
	static function () {
		global $submenu;

		if ( ! isset( $submenu['adt-settings'] ) || ! is_array( $submenu['adt-settings'] ) ) {
			return;
		}

		$rows       = $submenu['adt-settings'];
		$settings   = null;
		$reindexed  = array();

		foreach ( $rows as $item ) {
			if ( null === $settings && isset( $item[2] ) && 'adt-settings' === $item[2] ) {
				$settings = $item;
				continue;
			}
			$reindexed[] = $item;
		}

		if ( null === $settings ) {
			// Some installs never get the mirrored `adt-settings` row; prepend an explicit first item
			// so the top-level menu opens the local settings screen.
			array_unshift(
				$reindexed,
				array(
					esc_html__( 'Plugin settings', 'brandmeetscode-datalayer-tracker' ),
					'manage_options',
					'adt-settings',
					esc_html__( 'DataLayer Tracker Settings', 'brandmeetscode-datalayer-tracker' ),
				)
			);
			// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- intentional submenu order fix.
			$submenu['adt-settings'] = array_values( $reindexed );
			return;
		}

		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- intentional submenu order fix.
		$submenu['adt-settings'] = array_values( array_merge( array( $settings ), $reindexed ) );
	},
	1000000000
);

function adt_render_pro_status_page() {
	// Redirect legacy bookmarks for adt-pro-info to the features overview page.
	wp_safe_redirect( admin_url( 'admin.php?page=adt-pricing' ) );
	exit;
}




function adt_render_welcome_page() {
    $file = dirname(__DIR__) . '/adt-welcome-page.php';
    if (file_exists($file)) {
        require $file;
    } else {
        echo '<div class="wrap"><h1>Welcome page file not found</h1><p>File should be at: ' . esc_html($file) . '</p></div>';
    }
}

function adt_render_pricing_page() {
    $file = dirname(__DIR__) . '/adt-pricing-page.php';
    if (file_exists($file)) {
        require $file;
    } else {
        echo '<div class="wrap"><h1>Pricing page file not found</h1><p>File should be at: ' . esc_html($file) . '</p></div>';
    }
}

function adt_render_customer_account_page() {
	$file = dirname( __DIR__ ) . '/adt-customer-account-page.php';
	if ( file_exists( $file ) ) {
		require $file;
	} else {
		echo '<div class="wrap"><h1>Customer area file not found</h1><p>File should be at: ' . esc_html( $file ) . '</p></div>';
	}
}


function adt_render_analytics_dashboard_page() {
    $file = __DIR__ . '/adt-tracking-dashboard.php';
    if (file_exists($file)) {
        require $file;
    } else {
        echo '<div class="wrap"><h1>Event Mapping page file not found</h1><p>File should be at: ' . esc_html($file) . '</p></div>';
    }
}


function adt_render_field_mapping_page() {
    if (!current_user_can('manage_options')) {
        wp_die(esc_html__('You do not have sufficient permissions to access this page.', 'brandmeetscode-datalayer-tracker'));
    }
    
    // Suppress all ADT admin notices on this page
    remove_all_actions('admin_notices');
    
    ?>
    <div class="wrap">
        <h1><?php echo esc_html__('Field Mapping Debug Tool', 'brandmeetscode-datalayer-tracker'); ?></h1>
        <p><?php echo esc_html__('This tool helps verify your Marketo, HubSpot, and other form-field mappings.', 'brandmeetscode-datalayer-tracker'); ?></p>

        <div style="background:#fff;border:1px solid #ddd;padding:24px;border-radius:4px;margin-top:20px;">
            <button id="adt-debug-fields-btn" class="button button-primary">
                <?php echo esc_html__('Run Field Debug', 'brandmeetscode-datalayer-tracker'); ?>
            </button>

            <div id="adt-debug-fields-output" style="display:none;margin-top:1em;">
                <?php adt_dump_field_map_summary(); ?>
            </div>
        </div>
    </div>
    <?php
}

// Handle welcome page dismissal
add_action('admin_post_adt_dismiss_welcome', function() {
    check_admin_referer('adt_dismiss_welcome');
    
    // Set site-wide option
    update_option('adt_welcome_dismissed', true);
    
    // Set user-specific meta (in case option gets reset)
    update_user_meta(get_current_user_id(), 'adt_welcome_dismissed', 1);
    
    // Mark as seen with transient
    set_transient('adt_has_seen_welcome', true, 7 * DAY_IN_SECONDS);
    
    wp_safe_redirect(admin_url('admin.php?page=adt-settings'));
    exit;
});


// function adt_render_settings_page() {
//     require plugin_dir_path(__FILE__) . 'adt-settings-page.php';
// }

function adt_render_settings_page() {
    require plugin_dir_path(__FILE__) . 'adt-settings-page.php';
}

// function adt_render_setup_wizard() {
//     require plugin_dir_path(__FILE__) . 'adt-setup-wizard.php';
// }


/**
 * Get the whitelist of allowed safety net fields
 * These fields are used internally but don't have UI controls in field_map
 * 
 * @return array List of allowed safety field keys
 */
function adt_get_allowed_safety_fields(): array {
    return [
        // System configuration
        'session_timeout_minutes',
        'user_hash_mode',
        'scroll_event_mode',
        'overlay_min_role',
        'export_summary_mode',
        'cookieMatchRegex',
        
        // Consent management
        'preferred_cmp',
        'auto_init_cmp',
        'cmp_detection_timeout',
        'delay_until_consent',
        'fallback_track_without_cmp',
        'track_if_no_cmp',
        'enforce_tcf_for_multiple_platforms',
        
        // Internal/debug
        'export_history_log',
        'overlay_pin_mode_start',
        'disable_overlay_in_builder',
        
        // GTM-only features (no UI controls needed)
        'scroll25',
        'scroll50',
        'scroll75',
        'scroll100',
        
        // Core events (always enabled)
        'pageView',
        'sessionEngagementMilestone',
        
        // Consent events (always enabled)
        'consent',
        'consentLoaded',
        'consentGranted',
        'consentRevoked',
		'time_on_page',
		'include_time_on_page'
    ];
}