<?php
/**
 * DataLayer Tracker - Frontend Configuration
 * 
 * @package    DataLayer_Tracker
 * @subpackage Frontend
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
defined('ABSPATH') || exit;
$settings = get_option('adt_settings', []);

/**
 * Build the JS config object for ADTData on the frontend.
 * Optimized for performance and reduced redundancy
 * @return array
 */

/**
 * Check if current page URL should load tracking based on regex patterns
 * 
 * @return bool True if should load, false if excluded
 */
if (!function_exists('adt_should_track_current_page')) {
    function adt_should_track_current_page() {
        $settings = get_option('adt_settings', []);
		
        if (isset($_COOKIE['adt_exclude_tracking'])) {
            if (!empty($settings['debug_mode'])) {
                // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
                error_log('[ADT] Tracking blocked - IP exclusion cookie present');
            }
            return false;
        }
        
        // Check IP exclusion (highest priority)
        if (function_exists('adt_is_ip_excluded') && adt_is_ip_excluded()) {
            if (!empty($settings['debug_mode'])) {
                // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
                error_log('[ADT] Page tracking blocked - IP excluded');
            }
            return false;
        }
        
        // If no regex patterns are set, allow tracking
        if (empty($settings['regex_exclude'])) {
            return true;
        }
        
        // Get current URL
        $protocol    = isset( $_SERVER['HTTPS'] ) && 'on' === $_SERVER['HTTPS'] ? 'https' : 'http';
        $http_host   = isset( $_SERVER['HTTP_HOST'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_HOST'] ) ) : '';
        $request_uri = isset( $_SERVER['REQUEST_URI'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';
        $current_url = $protocol . '://' . $http_host . $request_uri;
        
        // Check regex_exclude
        if (!empty($settings['regex_exclude'])) {
            $pattern = '#' . trim($settings['regex_exclude']) . '#';
            $excluded = false;
            try {
                $excluded = (bool) preg_match( $pattern, $current_url );
            } catch ( \Throwable $e ) {
                $excluded = false;
            }
            
            if ($excluded) {
                if (!empty($settings['debug_mode'])) {
                    adt_debug_log('[ADT] Page excluded by regex_exclude: ' . $current_url);
                }
                return false; // Excluded
            }
        }
        
        // If we get here: not excluded by IP or regex
        return true;
    }
}



/**
 * Build the JS config object for ADTData on the frontend.
 * Optimized for performance and reduced redundancy
 * @return array
 */
// =============================================================================
// PART 1: Fix adt_get_frontend_config() - Ensure it ALWAYS returns an array
// =============================================================================

if (!function_exists('adt_get_frontend_config')) {
    function adt_get_frontend_config() {
		
        // Clear cache FIRST, before static check
		wp_cache_delete('adt_settings', 'options');

		$is_ip_excluded = function_exists('adt_is_ip_excluded') ? adt_is_ip_excluded() : false;
		$current_ip = function_exists('adt_get_client_ip') ? adt_get_client_ip() : '';

        
        $config = [];
        
        try {
            $settings = wp_parse_args(get_option('adt_settings', []), adt_get_default_settings());
            $full_features = true;
            $is_logged_in = is_user_logged_in();
            
            // Build hashed user ID if needed
            $hashedUserId = null;
            $userHashMode = $settings['user_hash_mode'] ?? 'none';
            
            if (!empty($settings['include_user_hash']) && $is_logged_in && $userHashMode !== 'none') {
                $hashedUserId = adt_get_user_hash($userHashMode, $settings);
            }
            
            // Build pixel configuration once
            $pixel_config = adt_get_pixel_config($settings);
			
			$config = [
			    // AJAX endpoints
			    'ajax_url' => admin_url('admin-ajax.php'),
			    'ajaxUrl' => admin_url('admin-ajax.php'),
			    'nonce' => wp_create_nonce('adt_nonce'),
    
			    // Premium status (both formats for compatibility)
			    'full_features' => $full_features ? 1 : 0,
			    'isPremiumUser' => $full_features ? 1 : 0,
			    'is_premium' => $full_features ? 1 : 0,

			    // Core tracking settings
			    'debug' => !empty($settings['debug_mode']) ? 1 : 0,
			    'debug_mode' => !empty($settings['debug_mode']) ? 1 : 0,
			    'enable_debug_overlay' => !empty($settings['enable_debug_overlay']) ? 1 : 0,
			    'show_blocked_events_overlay' => (int)($settings['show_blocked_events_overlay'] ?? 1),
			    'shouldTrackPage' => function_exists('adt_should_track_current_page') ? adt_should_track_current_page() : true,
			    'regex_exclude' => trim($settings['regex_exclude'] ?? ''),

			    // IP Filtering
			    'is_ip_excluded' => $is_ip_excluded,
			    'tracking_disabled' => $is_ip_excluded,
			    'current_ip' => $current_ip,

			    'overlay_min_role' => $settings['overlay_min_role'] ?? 'administrator',
			    'is_logged_in' => $is_logged_in,
			    'clearOnLoad' => !empty($settings['clear_datalayer_on_load']) ? 1 : 0,
			    'clear_datalayer_on_load' => !empty($settings['clear_datalayer_on_load']) ? 1 : 0,
			    'sessionTimeoutMinutes' => (int)($settings['session_timeout_minutes'] ?? 30),
			    'session_timeout_minutes' => (int)($settings['session_timeout_minutes'] ?? 30),
			    'maxEventHistory' => (int)($settings['max_event_history'] ?? 50),
			    'max_event_history' => (int)($settings['max_event_history'] ?? 50),

			    // Consent Management — values must be strings because the JS consent
			    // manager uses strict === '1' / === '0' comparisons.
			    'delay_until_consent'              => !empty($settings['delay_until_consent']) ? '1' : '0',
			    'fallback_track_without_cmp'       => !empty($settings['fallback_track_without_cmp']) ? '1' : '0',
			    'fallbackTrackWithoutCMP'           => !empty($settings['fallback_track_without_cmp']) ? '1' : '0',
			    'set_dataLayerBlocked_flag'         => !empty($settings['set_dataLayerBlocked_flag']) ? '1' : '0',
			    'enforce_tcf_for_multiple_platforms'=> !empty($settings['enforce_tcf_for_multiple_platforms']) ? '1' : '0',
			    'cmp_detection_timeout'             => (int)($settings['cmp_detection_timeout'] ?? 5),
    
			    // Session Manager Config
			    'push_session_pings' => 1,
			    'session_heartbeat_minutes' => 0.5,
			    'session_timeout_minutes' => 30,
			    'push_session_exit' => 1,
		    'enable_server_validation' => 0,
    

		    // User tracking
			    'hashedUserId' => $hashedUserId,
			    'userHashMode' => $userHashMode,
			    'user_hash_mode' => $userHashMode,
			    'persist_user_hash_cookie' => !empty($settings['persist_user_hash_cookie']) ? 1 : 0,

		    // Ecommerce settings
		    'enable_ecommerce_tracking' => !empty($settings['enable_ecommerce_tracking']) ? 1 : 0,
		    'include_ga4_item_metadata' => 0,
		    'enrich_GAtags' => 0,

		    // Pixel Manager (not available in free version)
		    'pixel_tracking_enabled' => 0,
		    'dual_pixel_mode' => 0,
		    'pixel_event_map_json' => '{}',
		    'meta_pixel_enabled' => 0,
		    'meta_pixel_id' => '',
		    'tiktok_pixel_enabled' => 0,
		    'tiktok_pixel_id' => '',
		    'google_ads_enabled' => 0,
		    'google_ads_id' => '',
		    'linkedin_pixel_enabled' => 0,
		    'linkedin_partner_id' => '',
		    'linkedin_conversion_id_form_submit' => 0,
		    'linkedin_conversion_id_purchase' => 0,
		    'x_pixel_enabled' => 0,
		    'x_pixel_id' => '',
		    'pinterest_pixel_enabled' => 0,
		    'pinterest_pixel_id' => '',
    
		    // Server-Side (not available in free version)
		    'meta_capi_enabled' => 0,
		    'meta_capi_nonce' => '',
		    'ga4_mp_enabled' => 0,
		    'ga4_mp_nonce' => '',
		    'ga4_measurement_id' => '',
		    'ga4_mp_debug_mode' => 0,
		    'ga4_mp_dual_tracking' => 0,
    
			    // Form tracking (CONVERTED TO INTEGERS)
			    'formVendorTracking' => !empty($settings['formVendorTracking']) ? 1 : 0,
			    'formVendorTracking_mode' => $settings['formVendorTracking_mode'] ?? 'map',

			    // Engagement settings (CONVERTED TO INTEGERS)
			    'hoverCooldownMs' => (int)($settings['hover_intent_cooldown'] ?? 30) * 1000,
			    'include_scroll_depth' => !empty($settings['include_scroll_depth']) ? 1 : 0,
			    'scroll_event_mode' => $settings['scroll_event_mode'] ?? 'simple',
			    // 'include_time_on_page' => !empty($settings['include_time_on_page']) ? 1 : 0,
			    'include_active_time' => !empty($settings['include_active_time']) ? 1 : 0,

			    // Click tracking (CONVERTED TO INTEGERS)
			    'track_default_clicks' => !empty($settings['track_default_clicks']) ? 1 : 0,
			    'include_click_metadata' => !empty($settings['include_click_metadata']) ? 1 : 0,

			    // UI settings (CONVERTED TO INTEGERS)
			    'show_simulator' => !empty($settings['show_simulator']) ? 1 : 0,
			    'show_event_filters' => !empty($settings['show_event_filters']) ? 1 : 0,
			    'show_sdk_status' => 0,

			    // GTM Container (CONVERTED TO INTEGERS)
			    'gtm_container_id' => $settings['gtm_container_id'] ?? '',
			    'allow_multi_container' => !empty($settings['allow_multi_container']) ? 1 : 0,

			    // Feature flags (organized by category)
			    'include' => adt_get_feature_flags( $settings, $full_features ),

			    // Page context (only what's needed on frontend)
			    'context' => adt_get_page_context(),

			    // Pixel configuration
			    'pixels' => $pixel_config,

			    // Currency for ecommerce
			    'currency' => function_exists('get_woocommerce_currency') ? get_woocommerce_currency() : 'USD',
			];
			
			 return $config;
			
        } catch (Exception $e) {
            adt_debug_log('[ADT] Error in adt_get_frontend_config: ' . $e->getMessage());
        }
        
        // Always return an array, never null or false
        return is_array($config) ? $config : [];
    }
	
} 

/**
 * Get user hash based on mode
 */
if (!function_exists('adt_get_user_hash')) {
    function adt_get_user_hash($mode, $settings) {
        $current_user = wp_get_current_user();
        if (!$current_user->user_email) return null;
        
        $email = strtolower(trim($current_user->user_email));
        $hashSource = '';
        
        switch ($mode) {
            case 'deterministic':
                $hashSource = $email;
                break;
                
            case 'daily':
                $hashSource = $email . gmdate('Y-m-d');
                break;
                
            case 'session':
                $sessionSalt = isset( $_COOKIE['adt_session_salt'] ) ? sanitize_text_field( wp_unslash( $_COOKIE['adt_session_salt'] ) ) : null;
                if (!$sessionSalt) {
                    $sessionSalt = bin2hex(random_bytes(8));
                    setcookie('adt_session_salt', $sessionSalt, 0, '/', '', true, true); // Secure + HttpOnly
                }
                $hashSource = $email . $sessionSalt;
                break;
        }
        
        return $hashSource ? hash('sha256', $hashSource) : null;
    }
}

/**
 * Get consolidated pixel configuration
 */
if (!function_exists('adt_get_pixel_config')) {
    function adt_get_pixel_config($settings) {
        $pixels = [];
        
        // Only include enabled pixels with IDs
        if (!empty($settings['meta_pixel_enabled']) && !empty($settings['meta_pixel_id'])) {
            $pixels['meta'] = [
                'enabled' => true,
                'id' => $settings['meta_pixel_id']
            ];
        }
        
        if (!empty($settings['tiktok_pixel_enabled']) && !empty($settings['tiktok_pixel_id'])) {
            $pixels['tiktok'] = [
                'enabled' => true,
                'id' => $settings['tiktok_pixel_id']
            ];
        }
        
        if (!empty($settings['pinterest_pixel_enabled']) && !empty($settings['pinterest_pixel_id'])) {
            $pixels['pinterest'] = [
                'enabled' => true,
                'id' => $settings['pinterest_pixel_id']
            ];
        }
        
        if (!empty($settings['linkedin_pixel_enabled']) && !empty($settings['linkedin_partner_id'])) {
            $pixels['linkedin'] = [
                'enabled' => true,
                'id' => $settings['linkedin_partner_id'],
                'form_conversion' => $settings['linkedin_conversion_id_form_submit'] ?? '',
                'purchase_conversion' => $settings['linkedin_conversion_id_purchase'] ?? ''
            ];
        }
        
        if (!empty($settings['google_ads_enabled']) && !empty($settings['google_ads_id'])) {
            $pixels['google_ads'] = [
                'enabled' => true,
                'id' => $settings['google_ads_id']
            ];
        }
        
        if (!empty($settings['x_pixel_enabled']) && !empty($settings['x_pixel_id'])) {
            $pixels['x'] = [
                'enabled' => true,
                'id' => $settings['x_pixel_id']
            ];
        }
        
        return $pixels;
    }
}

/**
 * Get organized feature flags
 */
if (!function_exists('adt_get_feature_flags')) {
    function adt_get_feature_flags( $settings, $full_features = true ) {
        $flags = [
            // Page data
            'page' => [
                'type' => !empty($settings['include_page_type']),
                'id' => !empty($settings['include_post_id']),
                'title' => !empty($settings['include_page_title']),
                'url' => !empty($settings['include_page_url']),
                'slug' => !empty($settings['include_slug']),
                'path' => !empty($settings['include_path']),
                'template' => !empty($settings['include_template']),
                'categories' => !empty($settings['include_categories']),
                'tags' => !empty($settings['include_tags']),
            ],
            
            // User data
            'user' => [
                'basic' => !empty($settings['include_user']),
                'hash' => !empty($settings['include_user_hash']),
                'wpFlags' => !empty($settings['include_wp_flags']),
            ],
            
            // Traffic data
            'traffic' => [
                'referrer' => !empty($settings['include_referrer']),
                'utm' => !empty($settings['include_utm']),
                'cookies' => !empty($settings['include_cookies']),
            ],
            
            // Engagement tracking
            'engagement' => [
                'scrollDepth' => !empty($settings['include_scroll_depth']),
                'scrollEventMode' => $settings['scroll_event_mode'] ?? 'depth',
                // GTM-only features - default to enabled (no frontend tracking required)
                'scroll25' => $settings['scroll25'] ?? true,
                'scroll50' => $settings['scroll50'] ?? true,
                'scroll75' => $settings['scroll75'] ?? true,
                'scroll100' => $settings['scroll100'] ?? true,
                'scrollBackUp' => !empty($settings['include_scroll_back_up']),
                // 'timeOnPage' => !empty($settings['include_time_on_page']),
                'activeTime' => !empty($settings['include_active_time']),
                'focusBlur' => !empty($settings['include_focus_blur']),
                'clickMetadata' => !empty($settings['include_click_metadata']),
                'hoverIntent' => !empty($settings['include_hover_intent']),
                'lastEngagedSection' => !empty($settings['include_last_engaged_section']),
            ],
            
            // Content tracking
            'content' => [
                'videoProgress' => !empty($settings['include_video_progress']),
                'fieldTracking' => !empty($settings['include_field_tracking']),
				'fieldInteraction' => !empty($settings['include_field_interaction']),
                'formVendorTracking' => !empty($settings['formVendorTracking']),
                'contentIntelligence' => !empty($settings['include_content_intelligence']),
                'lastContentTypeViewed' => !empty($settings['include_last_content_type_viewed']),
            ],
            
            // Browser data
            'browser' => [
                'screenResolution' => !empty($settings['include_screen_resolution']),
                'timezoneOffset' => !empty($settings['include_timezone_offset']),
                'browserLang' => !empty($settings['include_browser_lang']),
            ],
            
            // Core events
            'events' => [
                'pageView' => $settings['pageView'] ?? true,
                'sessionEngagementMilestone' => $settings['sessionEngagementMilestone'] ?? true,
            ],
            
            // Consent events
            'consent' => [
                'change' => $settings['consent'] ?? true,
                'loaded' => $settings['consentLoaded'] ?? true,
                'granted' => $settings['consentGranted'] ?? true,
                'revoked' => $settings['consentRevoked'] ?? true,
            ],
            
            // Custom events (parsed once)
            'customEvents' => json_decode($settings['custom_events_json'] ?? '[]', true) ?: [],
        ];
        
        // Add flat mappings for backward compatibility
        // Engagement
        $flags['scrollDepth'] = $flags['engagement']['scrollDepth'];
        $flags['scrollEventMode'] = $flags['engagement']['scrollEventMode'];
        $flags['scroll25'] = $flags['engagement']['scroll25'];
        $flags['scroll50'] = $flags['engagement']['scroll50'];
        $flags['scroll75'] = $flags['engagement']['scroll75'];
        $flags['scroll100'] = $flags['engagement']['scroll100'];
        $flags['scrollBackUp'] = $flags['engagement']['scrollBackUp'];
        // $flags['timeOnPage'] = $flags['engagement']['timeOnPage'];
        $flags['activeTime'] = $flags['engagement']['activeTime'];
        $flags['focusBlur'] = $flags['engagement']['focusBlur'];
        $flags['clickMetadata'] = $flags['engagement']['clickMetadata'];
        $flags['hoverIntent'] = $flags['engagement']['hoverIntent'];
        $flags['lastEngagedSection'] = $flags['engagement']['lastEngagedSection'];
        
        // Content
        $flags['videoProgress'] = $flags['content']['videoProgress'];
        $flags['fieldTracking'] = $flags['content']['fieldTracking'];
        $flags['formVendorTracking'] = $flags['content']['formVendorTracking'];
        $flags['contentIntelligence'] = $flags['content']['contentIntelligence'];
        $flags['lastContentTypeViewed'] = $flags['content']['lastContentTypeViewed'];
        
        // Events
        $flags['pageView'] = $flags['events']['pageView'];
        $flags['sessionEngagementMilestone'] = $flags['events']['sessionEngagementMilestone'];
        
        // Consent
        $flags['consentChange'] = $flags['consent']['change'];
        $flags['consentLoaded'] = $flags['consent']['loaded'];
        $flags['consentGranted'] = $flags['consent']['granted'];
        $flags['consentRevoked'] = $flags['consent']['revoked'];
        
        // Page
        $flags['pageType'] = $flags['page']['type'];
        $flags['postId'] = $flags['page']['id'];
        $flags['pageTitle'] = $flags['page']['title'];
        $flags['pageURL'] = $flags['page']['url'];
        $flags['slug'] = $flags['page']['slug'];
        $flags['path'] = $flags['page']['path'];
        $flags['template'] = $flags['page']['template'];
        $flags['categories'] = $flags['page']['categories'];
        $flags['tags'] = $flags['page']['tags'];

        // User - Extract nested values BEFORE overwriting parent
        $userBasic = $flags['user']['basic'];
        $userHash = $flags['user']['hash'];
        $userWpFlags = $flags['user']['wpFlags'];
        $flags['user'] = $userBasic;
        $flags['userHash'] = $userHash;
        $flags['wpFlags'] = $userWpFlags;

        // Traffic
        $flags['referrer'] = $flags['traffic']['referrer'];
        $flags['utm'] = $flags['traffic']['utm'];
        $flags['cookies'] = $flags['traffic']['cookies'];

        // Browser
        $flags['screenResolution'] = $flags['browser']['screenResolution'];
        $flags['timezoneOffset'] = $flags['browser']['timezoneOffset'];
        $flags['browserLang'] = $flags['browser']['browserLang'];

        return $flags;
    }
}

/**
 * Get minimal page context needed on frontend
 */
if (!function_exists('adt_get_page_context')) {
    function adt_get_page_context() {
        static $context = null;
        if ($context !== null) return $context;
        
        global $wp;
        
        $context = [
            'slug' => basename(get_permalink() ?: ''),
            'path' => trim( (string) wp_parse_url( sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ?? '' ) ), PHP_URL_PATH ), '/' ),
            'postId' => get_the_ID() ?: 0,
            'template' => get_page_template_slug() ?: 'default',
            'pageType' => adt_determine_page_type(),
            'isOrderReceived' => adt_is_order_received_page(),
        ];
        
        return $context;
    }
}

/**
 * Determine page type more accurately
 */
if (!function_exists('adt_determine_page_type')) {
    function adt_determine_page_type() {
        if (is_front_page()) return 'home';
        if (is_home()) return 'blog';
        if (is_singular('product')) return 'product';
        if (is_singular('post')) return 'post';
        if (is_page()) return 'page';
        if (is_category() || is_tag()) return 'archive';
        if (is_search()) return 'search';
        if (is_404()) return '404';
        if (function_exists('is_cart') && is_cart()) return 'cart';
        if (function_exists('is_checkout') && is_checkout()) return 'checkout';
        if (function_exists('is_account_page') && is_account_page()) return 'account';
        return 'other';
    }
}

/**
 * Check if order received page
 */
if (!function_exists('adt_is_order_received_page')) {
    function adt_is_order_received_page() {
        global $wp;
        
        if (function_exists('is_order_received_page') && is_order_received_page()) {
            return true;
        }
        
        if (!empty($wp->query_vars['order-received'])) {
            return true;
        }
        
        // Sanitize REQUEST_URI before checking
        $uri = isset( $_SERVER['REQUEST_URI'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';
        return (strpos($uri, 'order-received') !== false);
    }
}

/**
 * Build admin localization data (for backward compatibility)
 */
// =============================================================================
// PART 2: Fix adt_build_localization_data() - Handle any return type safely
// =============================================================================
if (!function_exists('adt_build_localization_data')) {
    function adt_build_localization_data($full = true) {
        $settings = wp_parse_args(get_option('adt_settings', []), adt_get_default_settings());
        $full_features = true;
        $current_user = wp_get_current_user();
        
        $base = [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'ajax_url' => admin_url('admin-ajax.php'), // Keep for backward compat
            'nonce' => wp_create_nonce('adt_admin_action'),
            'debug' => !empty($settings['debug_mode']) ? 1 : 0,
            'full_features' => 1,
            'isPremiumUser' => $full_features,
			'shouldTrackPage' => function_exists('adt_should_track_current_page') ? adt_should_track_current_page() : true,
		    'regex_exclude' => isset($settings['regex_exclude']) ? trim($settings['regex_exclude']) : '',
            'currentUser' => is_user_logged_in() ? $current_user->display_name : 'Guest',
            'userRole' => is_user_logged_in() ? ($current_user->roles[0] ?? 'guest') : 'guest',
        ];
        
        // Add full settings only in admin context
        if ($full && is_admin()) {
            $base['settings'] = $settings;
            $base['previewMode'] = get_user_meta(get_current_user_id(), 'adt_preview_mode', true) ?: null;
            $base['i18n'] = function_exists('adt_get_i18n_strings') ? adt_get_i18n_strings() : [];
        }
        
        // CRITICAL: Set default values BEFORE trying to get frontend config
        $base['enable_debug_overlay'] = !empty($settings['enable_debug_overlay']) ? 1 : 0;
        $base['clearOnLoad'] = !empty($settings['clear_datalayer_on_load']) ? 1 : 0;
        $base['fallback_track_without_cmp'] = !empty($settings['fallback_track_without_cmp']) ? '1' : '0';
        $base['fallbackTrackWithoutCMP'] = !empty($settings['fallback_track_without_cmp']) ? '1' : '0';
        $base['enable_ecommerce_tracking'] = !empty($settings['enable_ecommerce_tracking']) ? 1 : 0;
        $base['dual_pixel_mode'] = !empty($settings['dual_pixel_mode']) ? 1 : 0;
        $base['maxEventHistory'] = (int)($settings['max_event_history'] ?? 50);
        $base['enrich_GAtags'] = !empty($settings['enrich_GAtags']) ? 1 : 0;
        $base['include'] = [];
        $base['is_order_received_page'] = false;
        
        // Use frontend config for consistency - but check if function exists
        if (function_exists('adt_get_frontend_config')) {
            $frontend_config = adt_get_frontend_config();
    
            // STOP if not an array - use settings instead
            if (!is_array($frontend_config)) {
                adt_debug_log('[ADT] adt_get_frontend_config() returned ' . gettype($frontend_config));
        
                $base['enable_debug_overlay'] = !empty($settings['enable_debug_overlay']) ? 1 : 0;
                $base['clearOnLoad'] = !empty($settings['clear_datalayer_on_load']) ? 1 : 0;
                $base['fallback_track_without_cmp'] = !empty($settings['fallback_track_without_cmp']) ? '1' : '0';
                $base['fallbackTrackWithoutCMP'] = !empty($settings['fallback_track_without_cmp']) ? '1' : '0';
                $base['enrich_GAtags'] = !empty($settings['enrich_GAtags']) ? 1 : 0;
                $base['maxEventHistory'] = (int)($settings['max_event_history'] ?? 50);
                $base['enable_ecommerce_tracking'] = !empty($settings['enable_ecommerce_tracking']) ? 1 : 0;
                $base['dual_pixel_mode'] = !empty($settings['dual_pixel_mode']) ? 1 : 0;
                $base['include'] = [];
                $base['is_order_received_page'] = false;
        
            } else {
                // It IS an array - safe to use
                $base = array_merge($base, [
                    'enable_debug_overlay' => $frontend_config['enable_debug_overlay'] ?? 0,
                    'clearOnLoad' => $frontend_config['clearOnLoad'] ?? 0,
                    'fallback_track_without_cmp' => !empty($frontend_config['fallbackTrackWithoutCMP']) ? '1' : '0',
                    'fallbackTrackWithoutCMP' => !empty($frontend_config['fallbackTrackWithoutCMP']) ? '1' : '0',
                    'enrich_GAtags' => $frontend_config['enrich_GAtags'] ?? 0,
                    'maxEventHistory' => $frontend_config['maxEventHistory'] ?? 50,
                    'enable_ecommerce_tracking' => $frontend_config['enable_ecommerce_tracking'] ?? 0,
                    'dual_pixel_mode' => $frontend_config['dual_pixel_mode'] ?? 0,
                    'include' => $frontend_config['include'] ?? [],
                ]);
        
                // Only runs when $frontend_config IS an array
                if (isset($frontend_config['context']) && is_array($frontend_config['context'])) {
                    $base['is_order_received_page'] = !empty($frontend_config['context']['isOrderReceived']);
                } else {
                    $base['is_order_received_page'] = false;
                }
        
                // Only runs when $frontend_config IS an array
                if (isset($frontend_config['pixels']) && is_array($frontend_config['pixels'])) {
                    foreach ($frontend_config['pixels'] as $platform => $config) {
                        if (is_array($config)) {
                            $base['enable_' . $platform . '_pixel'] = isset($config['enabled']) ? 
                                ($config['enabled'] ? 1 : 0) : 0;
                            $base[$platform . 'PixelId'] = $config['id'] ?? '';
                    
                            if ($platform === 'linkedin') {
                                $base['linkedin_form_conversion'] = $config['form_conversion'] ?? '';
                                $base['linkedin_purchase_conversion'] = $config['purchase_conversion'] ?? '';
                            }
                        }
                    }
                }
            }
        } else {
            // Fallback if function doesn't exist
            $base['enable_debug_overlay'] = !empty($settings['enable_debug_overlay']) ? 1 : 0;
            $base['clearOnLoad'] = !empty($settings['clear_datalayer_on_load']) ? 1 : 0;
            $base['fallback_track_without_cmp'] = !empty($settings['fallback_track_without_cmp']) ? '1' : '0';
            $base['fallbackTrackWithoutCMP'] = !empty($settings['fallback_track_without_cmp']) ? '1' : '0';
            $base['enable_ecommerce_tracking'] = !empty($settings['enable_ecommerce_tracking']) ? 1 : 0;
            $base['dual_pixel_mode'] = !empty($settings['dual_pixel_mode']) ? 1 : 0;
            $base['maxEventHistory'] = (int)($settings['max_event_history'] ?? 50);
            $base['include'] = [];
            $base['is_order_received_page'] = false;
        }

        // Add WooCommerce context if available
        if (function_exists('is_order_received_page')) {
            $base['is_order_received_page'] = is_order_received_page();
        }

        return $base;
    }
}

/**
 * Get i18n strings (separated for organization)
 */
if (!function_exists('adt_get_i18n_strings')) {
    function adt_get_i18n_strings() {
        $strings = [
            // UI Labels
            'custom_events_title' => esc_html__('Need a template for Custom Events?', 'brandmeetscode-datalayer-tracker'),
            'load_example' => esc_html__('Load Example Events', 'brandmeetscode-datalayer-tracker'),
            'clear' => esc_html__('Clear', 'brandmeetscode-datalayer-tracker'),
            'toggle_raw' => esc_html__('Raw JSON', 'brandmeetscode-datalayer-tracker'),
            'toggle_styled' => esc_html__('Visual Summary', 'brandmeetscode-datalayer-tracker'),
            
            // Toast Messages
            'toast_loaded' => esc_html__('Example events loaded', 'brandmeetscode-datalayer-tracker'),
            'toast_cleared' => esc_html__('Custom events cleared', 'brandmeetscode-datalayer-tracker'),
            
            // Field Labels
            'label_tags' => esc_html__('Tags', 'brandmeetscode-datalayer-tracker'),
            'label_triggers' => esc_html__('Triggers', 'brandmeetscode-datalayer-tracker'),
            'label_variables' => esc_html__('Variables', 'brandmeetscode-datalayer-tracker'),
            'label_mode' => esc_html__('Mode', 'brandmeetscode-datalayer-tracker'),
            'label_features' => esc_html__('Features', 'brandmeetscode-datalayer-tracker'),
            'label_version' => esc_html__('Version', 'brandmeetscode-datalayer-tracker'),
            'label_generated' => esc_html__('Generated', 'brandmeetscode-datalayer-tracker'),
            
            // Status Messages
            'no_export_history' => esc_html__('🗂️ No export history found.', 'brandmeetscode-datalayer-tracker'),
        ];
        
        /**
         * Filter i18n strings for customization
         * @param array $strings The internationalization strings
         */
        return apply_filters('adt_i18n_strings', $strings);
    }
}