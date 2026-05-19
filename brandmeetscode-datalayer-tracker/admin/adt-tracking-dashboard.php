<?php
/**
 * ADT Event Mapping Page
 * Admin page for visualizing GTM container analytics and event relationships
 * 
 * @package DataLayer_Tracker
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

if (!current_user_can('manage_options')) {
    wp_die(esc_html__('You do not have sufficient permissions to access this page.', 'brandmeetscode-datalayer-tracker'));
}

// Get plugin settings
$settings = get_option('adt_settings', []);

// Build comprehensive event data from active settings
$active_events = [];

// === ENGAGEMENT EVENTS ===
if (!empty($settings['include_scroll_depth'])) {
    $active_events['scroll_depth'] = ['category' => 'engagement', 'label' => 'Scroll Depth', 'milestones' => ['25%', '50%', '75%', '100%']];
}
if (!empty($settings['include_scroll_25'])) {
    $active_events['scroll_25'] = ['category' => 'engagement', 'label' => 'Scroll 25%'];
}
if (!empty($settings['include_scroll_50'])) {
    $active_events['scroll_50'] = ['category' => 'engagement', 'label' => 'Scroll 50%'];
}
if (!empty($settings['include_scroll_75'])) {
    $active_events['scroll_75'] = ['category' => 'engagement', 'label' => 'Scroll 75%'];
}
if (!empty($settings['include_scroll_100'])) {
    $active_events['scroll_100'] = ['category' => 'engagement', 'label' => 'Scroll 100%'];
}
if (!empty($settings['include_scroll_back_up'])) {
    $active_events['scroll_back_up'] = ['category' => 'engagement', 'label' => 'Scroll Back Up'];
}
if (!empty($settings['include_active_time'])) {
    $active_events['active_time'] = ['category' => 'engagement', 'label' => 'Active Time', 'milestones' => ['30s', '60s', '120s', '300s']];
}
if (!empty($settings['include_time_on_page'])) {
    $active_events['time_on_page'] = ['category' => 'engagement', 'label' => 'Time on Page', 'milestones' => ['30s', '60s', '120s']];
}
if (!empty($settings['include_focus_blur'])) {
    $active_events['focus_blur'] = ['category' => 'engagement', 'label' => 'Tab Focus/Blur'];
}
if (!empty($settings['include_hover_intent'])) {
    $active_events['hover_intent'] = ['category' => 'engagement', 'label' => 'Hover Intent'];
}
if (!empty($settings['include_click_metadata'])) {
    $active_events['click_metadata'] = ['category' => 'engagement', 'label' => 'Click Metadata'];
}
if (!empty($settings['track_default_clicks'])) {
    $active_events['default_clicks'] = ['category' => 'engagement', 'label' => 'Default Click Tracking'];
}
if (!empty($settings['include_outbound_links'])) {
    $active_events['outbound_click'] = ['category' => 'engagement', 'label' => 'Outbound Link Click'];
}
if (!empty($settings['include_download_tracking'])) {
    $active_events['file_download'] = ['category' => 'engagement', 'label' => 'File Download'];
}
if (!empty($settings['include_mailto_tracking'])) {
    $active_events['mailto_click'] = ['category' => 'engagement', 'label' => 'Email Link Click'];
}
if (!empty($settings['include_tel_tracking'])) {
    $active_events['tel_click'] = ['category' => 'engagement', 'label' => 'Phone Link Click'];
}

// === CONTENT INTELLIGENCE ===
if (!empty($settings['include_content_intelligence'])) {
    $active_events['content_intelligence'] = ['category' => 'content', 'label' => 'Content Intelligence'];
}
if (!empty($settings['include_section_engagement'])) {
    $active_events['section_engagement'] = ['category' => 'content', 'label' => 'Section Engagement'];
}
if (!empty($settings['include_last_engaged_section'])) {
    $active_events['last_engaged_section'] = ['category' => 'content', 'label' => 'Last Engaged Section'];
}
if (!empty($settings['include_last_content_type_viewed'])) {
    $active_events['last_content_type_viewed'] = ['category' => 'content', 'label' => 'Last Content Type Viewed'];
}
if (!empty($settings['include_cta_exposure'])) {
    $active_events['cta_exposure'] = ['category' => 'content', 'label' => 'CTA Exposure'];
}

// === FORM EVENTS ===
if (!empty($settings['include_form_vendor_tracking']) || !empty($settings['formVendorTracking'])) {
    $active_events['form_start'] = ['category' => 'forms', 'label' => 'Form Start'];
    $active_events['form_submit'] = ['category' => 'forms', 'label' => 'Form Submit'];
    $active_events['form_abandon'] = ['category' => 'forms', 'label' => 'Form Abandon'];
}
if (!empty($settings['include_field_tracking'])) {
    $active_events['form_field_interaction'] = ['category' => 'forms', 'label' => 'Field Interaction'];
}

// === VIDEO EVENTS ===
if (!empty($settings['include_video_progress'])) {
    $active_events['video_start'] = ['category' => 'video', 'label' => 'Video Start'];
    $active_events['video_progress'] = ['category' => 'video', 'label' => 'Video Progress', 'milestones' => ['25%', '50%', '75%']];
    $active_events['video_complete'] = ['category' => 'video', 'label' => 'Video Complete'];
    $active_events['video_pause'] = ['category' => 'video', 'label' => 'Video Pause'];
}

// === ECOMMERCE EVENTS ===
$ecommerce_enabled = !empty($settings['enable_ecommerce_tracking']);
if ($ecommerce_enabled) {
    $active_events['view_item'] = ['category' => 'ecommerce', 'label' => 'View Item'];
    $active_events['view_item_list'] = ['category' => 'ecommerce', 'label' => 'View Item List'];
    $active_events['select_item'] = ['category' => 'ecommerce', 'label' => 'Select Item'];
    if (!empty($settings['include_add_to_cart']) || $ecommerce_enabled) {
        $active_events['add_to_cart'] = ['category' => 'ecommerce', 'label' => 'Add to Cart'];
    }
    if (!empty($settings['include_remove_from_cart']) || $ecommerce_enabled) {
        $active_events['remove_from_cart'] = ['category' => 'ecommerce', 'label' => 'Remove from Cart'];
    }
    if (!empty($settings['include_view_cart']) || $ecommerce_enabled) {
        $active_events['view_cart'] = ['category' => 'ecommerce', 'label' => 'View Cart'];
    }
    if (!empty($settings['include_begin_checkout']) || $ecommerce_enabled) {
        $active_events['begin_checkout'] = ['category' => 'ecommerce', 'label' => 'Begin Checkout'];
    }
    if (!empty($settings['include_add_payment_info']) || $ecommerce_enabled) {
        $active_events['add_payment_info'] = ['category' => 'ecommerce', 'label' => 'Add Payment Info'];
    }
    if (!empty($settings['include_add_shipping_info']) || $ecommerce_enabled) {
        $active_events['add_shipping_info'] = ['category' => 'ecommerce', 'label' => 'Add Shipping Info'];
    }
    $active_events['purchase'] = ['category' => 'ecommerce', 'label' => 'Purchase'];
    if (!empty($settings['include_refund'])) {
        $active_events['refund'] = ['category' => 'ecommerce', 'label' => 'Refund'];
    }
}

// === CONSENT EVENTS ===
if (!empty($settings['include_consent'])) {
    $active_events['consent_change'] = ['category' => 'consent', 'label' => 'Consent Change'];
}
if (!empty($settings['include_consent_loaded'])) {
    $active_events['consent_loaded'] = ['category' => 'consent', 'label' => 'Consent Manager Loaded'];
}
if (!empty($settings['include_consent_granted'])) {
    $active_events['consent_granted'] = ['category' => 'consent', 'label' => 'Consent Granted'];
}
if (!empty($settings['include_consent_revoked'])) {
    $active_events['consent_revoked'] = ['category' => 'consent', 'label' => 'Consent Revoked'];
}

// === SESSION SUMMARY EVENTS ===
if (!empty($settings['include_session_engagement_summary'])) {
    $active_events['session_engagement_summary'] = ['category' => 'session', 'label' => 'Session Engagement Summary', 'description' => 'Cross-page engagement metrics'];
}
if (!empty($settings['include_session_content_summary'])) {
    $active_events['session_content_summary'] = ['category' => 'session', 'label' => 'Session Content Summary', 'description' => 'Content consumption patterns'];
}
if (!empty($settings['include_session_attribution_summary'])) {
    $active_events['session_attribution_summary'] = ['category' => 'session', 'label' => 'Session Attribution Summary', 'description' => 'Multi-touch attribution data'];
}
if (!empty($settings['include_session_page_summary'])) {
    $active_events['session_page_summary'] = ['category' => 'session', 'label' => 'Session Page Summary', 'description' => 'Page-level session metrics'];
}
if (!empty($settings['include_session_video_summary'])) {
    $active_events['session_video_summary'] = ['category' => 'session', 'label' => 'Session Video Summary', 'description' => 'Video engagement across session'];
}

// === CORE SESSION EVENTS ===
$active_events['page_view'] = ['category' => 'session', 'label' => 'Page View'];
$active_events['session_start'] = ['category' => 'session', 'label' => 'Session Start'];
$active_events['user_engagement'] = ['category' => 'session', 'label' => 'User Engagement'];
if (!empty($settings['include_session_engagement_milestone'])) {
    $active_events['session_engagement_milestone'] = ['category' => 'session', 'label' => 'Session Engagement Milestone', 'milestones' => ['30s', '60s', '120s', '300s']];
}

// Session configuration
$session_config = [
    'timeout_minutes' => !empty($settings['session_timeout_minutes']) ? (int)$settings['session_timeout_minutes'] : 30,
    'ping_interval' => !empty($settings['session_ping_interval']) ? (int)$settings['session_ping_interval'] : 30,
    'engagement_milestones' => [30, 60, 120, 300],
    'tracks_cross_page' => true,
    'tracks_exit' => true
];

// Feature status
$full_features = function_exists( 'adt_all_features_enabled' ) && adt_all_features_enabled();
$feature_status = [
    'ga4_mp' => !empty($settings['ga4_mp_enabled']) && 
                !empty($settings['ga4_measurement_id']) && 
                !empty($settings['ga4_api_secret']) && 
                $full_features,
    'meta_pixel' => !empty($settings['meta_pixel_enabled']),
    'tiktok_pixel' => !empty($settings['tiktok_pixel_enabled']),
    'google_ads' => !empty($settings['google_ads_enabled']),
    'pinterest_pixel' => !empty($settings['pinterest_pixel_enabled']),
    'linkedin_pixel' => !empty($settings['linkedin_pixel_enabled']),
    'consent_mode' => !empty($settings['delay_until_consent']),
    'debug_mode' => !empty($settings['debug_mode']),
    'debug_overlay' => !empty($settings['enable_debug_overlay']),
    'session_manager' => true,
    'ecommerce_base' => !empty($settings['enable_ecommerce_tracking']),
    'ecommerce_view_item' => !empty($settings['enable_ecommerce_tracking']),
    'ecommerce_add_to_cart' => !empty($settings['enable_ecommerce_tracking']) && !isset($settings['include_add_to_cart']) || !empty($settings['include_add_to_cart']),
    'ecommerce_view_cart' => !empty($settings['enable_ecommerce_tracking']) && !isset($settings['include_view_cart']) || !empty($settings['include_view_cart']),
    'ecommerce_checkout' => !empty($settings['enable_ecommerce_tracking']) && !isset($settings['include_begin_checkout']) || !empty($settings['include_begin_checkout']),
    'ecommerce_purchase' => !empty($settings['enable_ecommerce_tracking']),
    'ecommerce_refund' => !empty($settings['include_refund']),
];

// Get IP filtering status
$is_ip_excluded = function_exists('adt_is_ip_excluded') ? adt_is_ip_excluded() : false;
$current_ip = function_exists('adt_get_client_ip') ? adt_get_client_ip() : '';

$adt_shared_css_path = dirname( __DIR__ ) . '/assets/css/adt-shared.css';
$adt_shared_css_ver  = file_exists( $adt_shared_css_path ) ? (string) filemtime( $adt_shared_css_path ) : '1';
wp_enqueue_style( 'adt-shared', plugins_url( 'assets/css/adt-shared.css', dirname( __FILE__ ) ), array(), $adt_shared_css_ver );
wp_enqueue_script('adt-dashboard', plugins_url('assets/js/adt-dashboard.js', dirname(__FILE__)), [], '2.0.0', true);
wp_localize_script('adt-dashboard', 'adtDashboardData', [
    'events' => $active_events,
    'session' => $session_config,
    'features' => $feature_status,
    'settings' => $settings,
    'ajaxUrl' => admin_url('admin-ajax.php'),
    'siteUrl' => home_url(),
    'is_ip_excluded' => $is_ip_excluded,
    'current_ip' => $current_ip
]);
$adt_dash_logo_url = ADT_PLUGIN_URL . 'logo.svg';
$adt_dash_logo_ver = file_exists( ADT_PLUGIN_DIR . 'logo.svg' ) ? (string) filemtime( ADT_PLUGIN_DIR . 'logo.svg' ) : '1';
?>

<div class="wrap adt-event-mapping-page">
    
    <div class="adt-page-header">
        <div class="adt-header-content">
            <div class="adt-header-icon">
                <!-- <span class="dashicons dashicons-networking"></span> -->
				<img src="<?php echo esc_url( $adt_dash_logo_url . '?ver=' . rawurlencode( $adt_dash_logo_ver ) ); ?>" width="75" height="75" alt="<?php echo esc_attr__( 'DataLayer Tracker Dashboard', 'brandmeetscode-datalayer-tracker' ); ?>" style="width: 75px; height: 75px; object-fit: contain;" />
            </div>
            <div class="adt-header-text">
                <h1>DataLayer Tracker Dashboard</h1>
                <p class="adt-header-description">
                    Real-time overview of your active tracking events and session configuration
                </p>
            </div>
        </div>
    </div>

    <div id="adt-analytics-dashboard"></div>

</div>
