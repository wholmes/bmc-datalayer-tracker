<?php
/**
 * DataLayer Tracker - Smart Notices System
 * 
 * @package    DataLayer_Tracker
 * @subpackage Admin
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
if (!defined('ABSPATH')) exit;

/**
 * Display welcome notice on first activation with feature overview
 */
add_action('admin_notices', 'adt_show_welcome_notice');
function adt_show_welcome_notice() {
    // Only show once - check BOTH old and new option names for backwards compatibility
	// Check if dismissed - use type-based check to match the AJAX handler
	if (get_option('adt_notice_dismissed_welcome')) {
	    return;
	}
    
    // Only on ADT settings pages, but NOT on welcome or pricing pages
    $screen = get_current_screen();
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only admin UI routing (page slug).
	$adt_page = isset( $_GET['page'] ) ? sanitize_text_field( wp_unslash( $_GET['page'] ) ) : '';
	if ( 'adt-settings' !== $adt_page ) {
	    return;
	}
    
    // Don't show on welcome, pricing, or account pages (defensive; slug above is already adt-settings).
    if ( in_array( $adt_page, [ 'adt-welcome', 'adt-pricing', 'adt-settings-account' ], true ) ) {
        return;
    }
    
    // Check and set activation timestamp if missing (handles database resets)
    $activation_time = get_option('adt_activation_timestamp', 0);
    if (!$activation_time) {
        // Timestamp missing - set it now (this handles database resets)
        $activation_time = time();
        update_option('adt_activation_timestamp', $activation_time);
        
        // Log for debugging
        if (function_exists('adt_debug_log')) {
            adt_debug_log('ADT: Activation timestamp was missing, set to now. This likely means database was reset.');
        }
    }
    
    // Extended from 24 hours to 7 days to give users more time to see the notice
    if ((time() - $activation_time) > (7 * 86400)) {
        return; // More than 7 days old
    }
    
    // Get current settings to show what's active
    $settings = get_option('adt_settings', []);
	
    // Determine active features
    $active_features = [];
    if (!empty($settings['enable_page_context']))    { $active_features[] = 'Page Context Tracking'; }
    if (!empty($settings['enable_scroll_depth']))    { $active_features[] = 'Scroll Depth'; }
    if (!empty($settings['enable_video_tracking']))  { $active_features[] = 'Video Tracking'; }
    if (!empty($settings['enable_form_tracking']))   { $active_features[] = 'Form Tracking'; }
    if (!empty($settings['enable_link_tracking']))   { $active_features[] = 'Link Tracking'; }
    if (!empty($settings['enable_error_tracking']))  { $active_features[] = 'Error Tracking'; }
    if (!empty($settings['enable_engagement_intent'])){ $active_features[] = 'Engagement Intent'; }
    if (!empty($settings['enable_woocommerce']))     { $active_features[] = 'WooCommerce Integration'; }
    if (!empty($settings['enable_cmp_detection']))   { $active_features[] = 'Consent Management'; }
	?>
    <div class="notice notice-success is-dismissible adt-admin-notice"
         data-dismissible="adt-welcome-notice"
         data-nonce="<?php echo esc_attr(wp_create_nonce('adt-dismiss-welcome-notice')); ?>"
         style="border-left-color: #09ba65; padding: 15px 20px;">
        <div style="display: flex; align-items: flex-start; gap: 15px;">
            <div style="font-size: 32px; line-height: 1;">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#09ba65" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
            </div>
            <div style="flex: 1;">
                <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #1d2327;">
                    <?php esc_html_e( 'Welcome to DataLayer Tracker!', 'brandmeetscode-datalayer-tracker' ); ?>
                </h2>
                <p style="margin: 0 0 15px 0; font-size: 14px;">
                    <strong><?php esc_html_e( 'Your plugin is configured and ready to track.', 'brandmeetscode-datalayer-tracker' ); ?></strong>
                    <?php esc_html_e( 'All features are included and available.', 'brandmeetscode-datalayer-tracker' ); ?>
                </p>
                <?php if (!empty($active_features)): ?>
                <div style="margin: 15px 0; padding: 12px; background: #f8f9fa; border-radius: 4px;">
                    <h4 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #2c3338;"><?php esc_html_e( 'Active Features:', 'brandmeetscode-datalayer-tracker' ); ?></h4>
                    <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #50575e;">
                        <?php foreach ($active_features as $feature): ?>
                            <li><?php echo esc_html($feature); ?></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
                <?php endif; ?>
                <div style="margin-top: 15px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">
                    <?php esc_html_e( 'All features are active and ready to use.', 'brandmeetscode-datalayer-tracker' ); ?>
                </div>
            </div>
        </div>
    </div>
	    <?php
	}

/**
 * SIMPLIFIED: Handle welcome notice dismissal
 * Main dismissal is now in adt-ajax-handlers.php
 * This is kept for backward compatibility only
 */
add_action('wp_ajax_adt_dismiss_notice', 'adt_handle_notice_dismissal');
function adt_handle_notice_dismissal() {
    // Verify nonce
    check_ajax_referer('adt_admin_action', 'security');
    
    // Check permissions
    if (!current_user_can('manage_options')) {
        wp_send_json_error(['message' => 'Insufficient permissions']);
    }
    
    // Get notice type
    $notice_type = isset( $_POST['which'] ) ? sanitize_text_field( wp_unslash( $_POST['which'] ) ) : '';
    
    if (empty($notice_type)) {
        wp_send_json_error(['message' => 'Invalid notice type']);
    }
	
    if ( defined( 'WP_DEBUG' ) && WP_DEBUG && defined( 'WP_DEBUG_LOG' ) && WP_DEBUG_LOG ) {
        // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- gated debug only.
        error_log( 'ADT Dismiss Request - Notice Type: ' . $notice_type );
    }
    
    // Handle different notice types
    switch ($notice_type) {
        case 'welcome':
            // Set both option names for full compatibility
            update_option('adt_welcome_dismissed', true);
            update_option('adt_notice_dismissed_welcome', true);
            wp_send_json_success(['message' => 'Welcome notice dismissed']);
            break;
            
        case 'dual_pixel':
            update_option('adt_notice_dismissed_dual_pixel', true);
            wp_send_json_success(['message' => 'Dual pixel notice dismissed']);
            break;
            
        case 'cmp':
            update_user_meta(get_current_user_id(), 'adt_cmp_notice_dismissed_at', time());
            wp_send_json_success(['message' => 'CMP notice dismissed']);
            break;
            
        default:
            // Generic dismissal pattern: adt_notice_dismissed_{type}
            $option_key = 'adt_notice_dismissed_' . $notice_type;
            update_option($option_key, true);
            wp_send_json_success(['message' => ucfirst($notice_type) . ' notice dismissed']);
            break;
    }
}

/**
 * Display feature update notices (for new features)
 */
add_action('admin_notices', 'adt_show_feature_update_notices');
function adt_show_feature_update_notices() {
    // ONLY show on page=adt-settings
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only admin UI routing (page slug).
	$adt_page = isset( $_GET['page'] ) ? sanitize_text_field( wp_unslash( $_GET['page'] ) ) : '';
    if ( 'adt-settings' !== $adt_page ) {
        return;
    }
    
    // Example: Dual Pixel notice (already in adt-settings-page.php, but shown here for reference)
    if (current_user_can('manage_options') && !get_option('adt_notice_dismissed_dual_pixel')) {
        // This is already rendered in adt-settings-page.php, so we skip it here to avoid duplication
        // Keeping this function for future feature announcements
    }
}

/**
 * Reset all ADT notice dismissals - Admin utility
 * Only accessible to administrators
 */
add_action('admin_post_adt_reset_notices', 'adt_admin_reset_notices');
function adt_admin_reset_notices() {
    // Security checks
    if (!current_user_can('manage_options')) {
        wp_die( esc_html__( 'Unauthorized access', 'brandmeetscode-datalayer-tracker' ) );
    }
    
    check_admin_referer('adt_reset_notices');
    
    // Reset all dismissals
    delete_option('adt_welcome_dismissed');
    delete_option('adt_notice_dismissed_welcome');
    delete_option('adt_notice_dismissed_dual_pixel');
    
    $user_id = get_current_user_id();
    delete_user_meta($user_id, 'adt_cmp_notice_dismissed_at');
    if ( function_exists( 'adt_reset_feature_carousel_for_user' ) ) {
        adt_reset_feature_carousel_for_user( $user_id );
    } else {
        delete_user_meta( $user_id, 'adt_feature_carousel_dismissed_until' );
        delete_user_meta( $user_id, 'adt_feature_carousel_index' );
    }
    
    // Reset activation time to NOW so welcome notice appears again
    update_option('adt_activation_timestamp', time());
    
    // âœ… IMPROVED: Add success message
    wp_safe_redirect(add_query_arg([
        'notices_reset' => '1',
        'message' => 'notices_reset'
    ], admin_url('admin.php?page=adt-settings')));
    exit;
}

add_action('wp_ajax_adt_dismiss_welcome_notice', 'adt_dismiss_welcome_notice_handler');
function adt_dismiss_welcome_notice_handler() {
    check_ajax_referer('adt-dismiss-welcome-notice', 'nonce');
    
    if (!current_user_can('manage_options')) {
        wp_send_json_error();
    }
    
    update_option('adt_notice_dismissed_welcome', true);
    wp_send_json_success();
}

add_action('wp_ajax_adt_dismiss_cmp_notice', 'adt_dismiss_cmp_notice_handler');
function adt_dismiss_cmp_notice_handler() {
    check_ajax_referer('adt-dismiss-cmp-notice', 'nonce');
    if (!current_user_can('manage_options')) {
        wp_send_json_error();
    }
    update_user_meta(get_current_user_id(), 'adt_cmp_notice_dismissed_at', time());
    wp_send_json_success();
}