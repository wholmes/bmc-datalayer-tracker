<?php
/**
 * DataLayer Tracker - Feature Carousel Widget
 * 
 * @package    DataLayer_Tracker
 * @subpackage Admin
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
defined( 'ABSPATH' ) || exit;

function adt_get_carousel_features() {
    /**
     * WordPress.org build: only features included in the free plugin.
     * Pro-only modules (pixels, CAPI, GTM JSON export, content intelligence, presets) are not listed here.
     */
    $features = [
        [
            'title' => __( 'Live Debug Overlay', 'brandmeetscode-datalayer-tracker' ),
            'desc'  => __( 'Admin-only panel on your site shows dataLayer events as they fire—filter by type, expand payloads, and confirm consent or blocked events before you rely on GTM Preview.', 'brandmeetscode-datalayer-tracker' ),
            'icon'  => '🔍',
            'benefit' => __( 'Verify tracking without opening DevTools on every page', 'brandmeetscode-datalayer-tracker' ),
        ],
        [
            'title' => __( 'Consent-Aware Loading', 'brandmeetscode-datalayer-tracker' ),
            'desc'  => __( 'Delay scripts until consent, detect common CMPs (CookieYes, Cookiebot, OneTrust, Complianz, TCF), and choose fallbacks. Optional hashed user IDs when you enable them.', 'brandmeetscode-datalayer-tracker' ),
            'icon'  => '🔒',
            'benefit' => __( 'Align tracking with your privacy setup', 'brandmeetscode-datalayer-tracker' ),
        ],
        [
            'title' => __( 'Google Tag Manager Snippet', 'brandmeetscode-datalayer-tracker' ),
            'desc'  => __( 'Paste your container ID and optionally output the standard GTM snippet. You build tags, triggers, and variables inside GTM—this plugin keeps dataLayer events consistent for them.', 'brandmeetscode-datalayer-tracker' ),
            'icon'  => '📦',
            'benefit' => __( 'Structured dataLayer + GTM on your terms', 'brandmeetscode-datalayer-tracker' ),
        ],
        [
            'title' => __( 'Page & Visitor Context', 'brandmeetscode-datalayer-tracker' ),
            'desc'  => __( 'Push page type, title, URL, path, categories, tags, referrer, device hints, and optional logged-in user flags into dataLayer automatically.', 'brandmeetscode-datalayer-tracker' ),
            'icon'  => '📄',
            'benefit' => __( 'Rich context on every page view', 'brandmeetscode-datalayer-tracker' ),
        ],
        [
            'title' => __( 'Engagement Signals', 'brandmeetscode-datalayer-tracker' ),
            'desc'  => __( 'Scroll depth (per-milestone or single event), active time, focus/blur, scroll back up, hover intent, and video progress—toggle each signal in Settings.', 'brandmeetscode-datalayer-tracker' ),
            'icon'  => '📈',
            'benefit' => __( 'Measure real attention, not just page loads', 'brandmeetscode-datalayer-tracker' ),
        ],
        [
            'title' => __( 'Form Lifecycle Events', 'brandmeetscode-datalayer-tracker' ),
            'desc'  => __( 'Track form_view, form_field_start, form_submit, form_error, and form_abandon. Optional shortcuts for popular form builders when enabled.', 'brandmeetscode-datalayer-tracker' ),
            'icon'  => '📝',
            'benefit' => __( 'See where users start, finish, or drop off', 'brandmeetscode-datalayer-tracker' ),
        ],
        [
            'title' => __( 'WooCommerce Browser Events', 'brandmeetscode-datalayer-tracker' ),
            'desc'  => __( 'When WooCommerce is active, send GA4-style ecommerce events (view_item, add_to_cart, begin_checkout, purchase, and more) to dataLayer from the browser.', 'brandmeetscode-datalayer-tracker' ),
            'icon'  => '🛒',
            'benefit' => __( 'Ecommerce dataLayer without custom theme code', 'brandmeetscode-datalayer-tracker' ),
        ],
        [
            'title' => __( 'Sessions & UTM Parameters', 'brandmeetscode-datalayer-tracker' ),
            'desc'  => __( 'Client-side session timeouts, heartbeats, and campaign parameters (utm_source, medium, etc.) pushed with your events for GTM or GA4 to consume.', 'brandmeetscode-datalayer-tracker' ),
            'icon'  => '🔗',
            'benefit' => __( 'Attribute traffic inside your dataLayer', 'brandmeetscode-datalayer-tracker' ),
        ],
        [
            'title' => __( 'Setup Wizard', 'brandmeetscode-datalayer-tracker' ),
            'desc'  => __( 'Guided first run: enable the signals you need, set consent behavior, add GTM/GA4 IDs, and optionally turn on WooCommerce tracking.', 'brandmeetscode-datalayer-tracker' ),
            'icon'  => '⚡',
            'benefit' => __( 'Go live faster with fewer missed toggles', 'brandmeetscode-datalayer-tracker' ),
        ],
        [
            'title' => __( 'Settings Import & Export', 'brandmeetscode-datalayer-tracker' ),
            'desc'  => __( 'Download your configuration as JSON for backup or staging, then import it on another site. No license required—all settings are available.', 'brandmeetscode-datalayer-tracker' ),
            'icon'  => '💾',
            'benefit' => __( 'Move or restore configs in one step', 'brandmeetscode-datalayer-tracker' ),
        ],
        [
            'title' => __( 'Custom dataLayer Events', 'brandmeetscode-datalayer-tracker' ),
            'desc'  => __( 'Define JSON event templates in Settings to push on page load, or extend from your theme with hooks. Regex exclude URLs you do not want to track.', 'brandmeetscode-datalayer-tracker' ),
            'icon'  => '🧩',
            'benefit' => __( 'Extend tracking without editing core files', 'brandmeetscode-datalayer-tracker' ),
        ],
        [
            'title' => __( 'Optional Pro add-on (separate plugin)', 'brandmeetscode-datalayer-tracker' ),
            'desc'  => __( 'Advertising pixels, Meta CAPI, GA4 Measurement Protocol, GTM container JSON export, content intelligence, and preset library are not in this WordPress.org build. They ship in DataLayer Tracker Pro—a companion plugin from DataLayer Tracker → Get Pro add-on.', 'brandmeetscode-datalayer-tracker' ),
            'icon'  => '➕',
            'benefit' => __( 'Upgrade only if you need those modules', 'brandmeetscode-datalayer-tracker' ),
            'is_pro_teaser' => true,
        ],
    ];

    return apply_filters( 'adt_carousel_features', $features );
}

/**
 * @param array  $feature       Carousel item.
 * @param int    $current_index Zero-based index.
 * @param array  $features      Full list.
 * @return void
 */
function adt_render_feature_carousel_markup( $feature, $current_index, $features ) {
    $is_pro_teaser = ! empty( $feature['is_pro_teaser'] );
    $border_color  = $is_pro_teaser ? '#646970' : '#1d2327';
    ?>
    <div class="notice notice-info adt-feature-carousel" style="position:relative;padding:15px 20px;border-left:4px solid <?php echo esc_attr( $border_color ); ?>;">
        <?php if ( ! $is_pro_teaser ) : ?>
        <p style="margin:0 0 10px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:#646970;">
            <?php esc_html_e( 'Core feature', 'brandmeetscode-datalayer-tracker' ); ?>
        </p>
        <?php endif; ?>
        <div style="display:flex;align-items:center;gap:15px;">
            <div style="font-size:32px;" aria-hidden="true"><?php echo esc_html( $feature['icon'] ); ?></div>
            <div style="flex:1;">
                <h3 style="margin:0 0 5px;font-size:16px;">
                    <?php echo esc_html( $feature['title'] ); ?>
                </h3>
                <p style="margin:0 0 5px;font-size:14px;color:#646970;line-height:1.5;">
                    <?php echo esc_html( $feature['desc'] ); ?>
                </p>
                <?php if ( ! empty( $feature['benefit'] ) ) : ?>
                <p style="margin:0;font-size:12px;color:#09ba65;font-weight:600;">
                    ✓ <?php echo esc_html( $feature['benefit'] ); ?>
                </p>
                <?php endif; ?>
                <?php if ( $is_pro_teaser && function_exists( 'adt_get_pro_sales_url' ) ) : ?>
                <p style="margin:10px 0 0;">
                    <a href="<?php echo esc_url( admin_url( 'admin.php?page=adt-pricing' ) ); ?>" class="button button-secondary">
                        <?php esc_html_e( 'Learn about Pro add-on', 'brandmeetscode-datalayer-tracker' ); ?>
                    </a>
                </p>
                <?php endif; ?>
            </div>
            <div style="display:flex;gap:10px;align-items:center;">
                <select id="adt-dismiss-duration" style="padding:8px 10px;width:165px;font-size:13px;height:38px;line-height:1.4;border:1px solid #8c8f94;border-radius:3px;">
                    <option value="86400"><?php esc_html_e( 'Dismiss for 24 hours', 'brandmeetscode-datalayer-tracker' ); ?></option>
                    <option value="604800"><?php esc_html_e( 'Dismiss for 1 week', 'brandmeetscode-datalayer-tracker' ); ?></option>
                    <option value="1209600"><?php esc_html_e( 'Dismiss for 2 weeks', 'brandmeetscode-datalayer-tracker' ); ?></option>
                    <option value="2592000"><?php esc_html_e( 'Dismiss for 1 month', 'brandmeetscode-datalayer-tracker' ); ?></option>
                    <option value="forever"><?php esc_html_e( 'Dismiss forever', 'brandmeetscode-datalayer-tracker' ); ?></option>
                </select>
                <button type="button" class="button" id="adt-dismiss-carousel" style="white-space:nowrap;height:38px;">
                    <?php esc_html_e( 'Dismiss', 'brandmeetscode-datalayer-tracker' ); ?>
                </button>
            </div>
        </div>
        <div style="margin-top:10px;padding-top:10px;border-top:1px solid #ddd;display:flex;justify-content:space-between;align-items:center;">
            <a href="#" class="adt-feature-nav" data-direction="prev" style="text-decoration:none;font-size:12px;color:#1d2327;">
                ← <?php esc_html_e( 'Previous', 'brandmeetscode-datalayer-tracker' ); ?>
            </a>
            <span style="font-size:12px;color:#646970;">
                <?php
                printf(
                    /* translators: 1: current feature number, 2: total features */
                    esc_html__( 'Feature %1$d of %2$d', 'brandmeetscode-datalayer-tracker' ),
                    ( ( (int) $current_index % count( $features ) ) + 1 ),
                    count( $features )
                );
                ?>
            </span>
            <a href="#" class="adt-feature-nav" data-direction="next" style="text-decoration:none;font-size:12px;color:#1d2327;">
                <?php esc_html_e( 'Next', 'brandmeetscode-datalayer-tracker' ); ?> →
            </a>
        </div>
    </div>
    <?php
}

/**
 * Clear carousel dismiss state for the current user (dev / QA).
 */
function adt_reset_feature_carousel_for_user( $user_id = 0 ) {
    $user_id = $user_id ? (int) $user_id : get_current_user_id();
    if ( ! $user_id ) {
        return;
    }
    delete_user_meta( $user_id, 'adt_feature_carousel_dismissed_until' );
    delete_user_meta( $user_id, 'adt_feature_carousel_index' );
}

add_action(
    'admin_init',
    static function () {
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- capability-gated dev reset; same pattern as adt_show_welcome.
        if ( ! isset( $_GET['adt_reset_feature_carousel'] ) || ! current_user_can( 'manage_options' ) ) {
            return;
        }
        adt_reset_feature_carousel_for_user();
        wp_safe_redirect(
            remove_query_arg(
                'adt_reset_feature_carousel',
                wp_get_referer() ? wp_get_referer() : admin_url( 'admin.php?page=adt-settings' )
            )
        );
        exit;
    }
);

function adt_render_feature_carousel() {
    // ONLY show on page=adt-settings
    if ( ! isset( $_GET['page'] ) || sanitize_text_field( wp_unslash( $_GET['page'] ) ) !== 'adt-settings' ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only admin screen detection.
        return;
    }
    
    // Check if dismissed and when
    $user_id = get_current_user_id();
    $dismissed_until = get_user_meta($user_id, 'adt_feature_carousel_dismissed_until', true);
    
    if ($dismissed_until && time() < $dismissed_until) {
        return; // Still dismissed
    }
    
    // Get current feature index (cycles through features)
    $current_index = get_user_meta($user_id, 'adt_feature_carousel_index', true);
    if (!$current_index) {
        $current_index = 0;
    }
    
    // Get features from shared function
    $features = adt_get_carousel_features();
    
    // Get current feature (cycle through)
    $feature = $features[ $current_index % count( $features ) ];

    adt_render_feature_carousel_markup( $feature, (int) $current_index, $features );
}

// AJAX handler for dismissal
add_action('wp_ajax_adt_dismiss_feature_carousel', function() {
    check_ajax_referer('adt_carousel_action', 'security');
    
    $user_id = get_current_user_id();
    $duration = isset( $_POST['duration'] ) ? sanitize_text_field( wp_unslash( $_POST['duration'] ) ) : '';
    
    if ($duration === 'forever') {
        update_user_meta($user_id, 'adt_feature_carousel_dismissed_until', PHP_INT_MAX);
    } else {
        $seconds = intval($duration);
        update_user_meta($user_id, 'adt_feature_carousel_dismissed_until', time() + $seconds);
    }
    
    wp_send_json_success();
});

// AJAX handler for feature cycling
add_action('wp_ajax_adt_cycle_feature', function() {
    check_ajax_referer('adt_carousel_action', 'security');
    
    $user_id = get_current_user_id();
    $direction = isset( $_POST['direction'] ) ? sanitize_text_field( wp_unslash( $_POST['direction'] ) ) : '';
    $current_index = get_user_meta($user_id, 'adt_feature_carousel_index', true);
    
    if (!$current_index) {
        $current_index = 0;
    }
    
    // Get features from shared function (NO DUPLICATION!)
    $features = adt_get_carousel_features();
    
    // Cycle the index
    if ($direction === 'next') {
        $current_index++;
    } else {
        $current_index--;
        if ($current_index < 0) {
            $current_index = count($features) - 1; // Uses actual feature count
        }
    }
    
    // Save new index
    update_user_meta($user_id, 'adt_feature_carousel_index', $current_index);
    
    // Get new feature
    $feature = $features[ $current_index % count( $features ) ];

    ob_start();
    adt_render_feature_carousel_markup( $feature, (int) $current_index, $features );
    $html = ob_get_clean();

    wp_send_json_success( array( 'html' => $html ) );
});