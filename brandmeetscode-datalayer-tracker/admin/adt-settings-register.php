<?php
/**
 * DataLayer Tracker - Settings Registration
 * 
 * @package    DataLayer_Tracker
 * @subpackage Admin
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
defined('ABSPATH') || exit;

// ─────────────────────────────────────────────
// Builder iframe detection helper
// ─────────────────────────────────────────────
function adt_is_builder_iframe() {
    $referer = isset( $_SERVER['HTTP_REFERER'] )
        ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_REFERER'] ) )
        : '';
    return (
        defined('IFRAME_REQUEST') && IFRAME_REQUEST ||
        strpos($referer, 'breakdance') !== false ||
        strpos($referer, 'elementor') !== false ||
        strpos($referer, 'oxygen') !== false ||
        strpos($referer, 'bricks') !== false
    );
}

add_action('admin_init', function () {
    if (!current_user_can('manage_options')) return;
    // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- export is gated by wp_verify_nonce() on the next lines.
    if (!isset($_GET['adt_export_defaults'])) return;

    // Dev helper: append _wpnonce from wp_nonce_url( admin_url(), 'adt_export_defaults' ) (action name matches second arg).
    $export_nonce = isset( $_GET['_wpnonce'] ) ? sanitize_text_field( wp_unslash( $_GET['_wpnonce'] ) ) : '';
    if ( ! wp_verify_nonce( $export_nonce, 'adt_export_defaults' ) ) {
        wp_die( esc_html__( 'Invalid export request.', 'brandmeetscode-datalayer-tracker' ), '', 403 );
    }

    global $adt_field_map;

    if (!is_array($adt_field_map)) {
        wp_die('⚠️ $adt_field_map not available. Make sure this runs after it is defined.');
    }

    $defaults = [];

    foreach ($adt_field_map as $section => $fields) {
        foreach ($fields as $key => $config) {

            // Normalize numeric format: ['include_post_id']
            if (is_int($key)) {
                $key    = $config;
                $config = [ 'type' => 'checkbox', 'default' => 0 ];
            }

            // Normalize string shortcut: 'debug_mode' => 'Enable Debug Mode'
            if (is_string($config)) {
                $config = [ 'label' => $config, 'type' => 'checkbox', 'default' => 0 ];
            }

			if (($config['type'] ?? '') === 'group' && !empty($config['fields'])) {
			    $groupDefaults = [];
			    foreach ($config['fields'] as $subKey => $subConfig) {
			        $groupDefaults[$subKey] = $subConfig['default'] ?? '';
			    }
			    $defaults[$key] = $groupDefaults;
			} else {
			    $defaults[$key] = $config['default'] ?? 0;
			}
        }
    }

    // Merge in static and known global keys
	$defaults = array_merge($defaults, [
	    // Engagement & Content Intelligence
	    'include_scroll_back_up'          => 1,
	    'include_video_progress'          => 1,
	    'include_hover_intent'            => 1,
	    'include_last_engaged_section'    => 0,
	    'include_last_content_type_viewed'=> 0,
	    'include_active_time'             => 1,
	    //'include_time_on_page'            => 1,
	    'include_focus_blur'              => 1,
	    'include_field_tracking'          => 1,
	    'include_click_metadata'          => 0,
	    // Page & Environment Context
	    'include_page_type'               => 1,
	    'include_post_id'                 => 1,
	    'include_page_title'              => 1,
	    'include_page_url'                => 1,
	    'include_slug'                    => 1,
	    'include_path'                    => 1,
	    'include_template'                => 0,
	    'include_user'                    => 1,
	    'include_user_hash'               => 1,
	    'user_hash_mode'                  => 'none',
	    'include_wp_flags'                => 1,
	    'include_categories'              => 1,
	    'include_tags'                    => 1,
	    'include_referrer'                => 1,
	    'include_utm'                     => 1,
	    'include_cookies'                 => 0,
	    'cookieMatchRegex'                => '^(utm_|ga|adt_|wp_|_gcl_|_fbp|sbjs_|_tt_|_pin_)',
	    'cookie_list'                     => '',
	    'include_scroll_depth'            => 1,
	    'scroll_event_mode'               => 'depth',
	    'include_screen_resolution'       => 1,
	    'include_browser_lang'            => 1,
	    'include_timezone_offset'         => 1,
	    // CMP & Consent Handling
	    'delay_until_consent'             => 0,
	    'fallback_track_without_cmp'      => 1,
	    // Ecommerce
	    'enable_ecommerce_tracking'       => 0,
	    'formVendorTracking'              => 0,
	    'formVendorTracking_mode'         => 'map',
	    // Export & UI Settings
	    'export_summary_mode'             => 'csv',
	    // Debug
	    'debug_mode'                      => 1,
	    'debug_level'                     => 'quiet',
	    'enable_debug_overlay'            => 1,
	    'overlay_min_role'                => 'administrator',
	    'set_dataLayerBlocked_flag'       => 0,
	    'clear_datalayer_on_load'         => 0,
	    'show_blocked_events_overlay'     => 1,
		'exclude_ips'                     => '',
		'exclude_admin_ips'               => 0,
	    // Misc
	    'custom_events_json'              => '',
	    'regex_exclude'                   => '',
	    'session_timeout_minutes'         => 30,
	    'max_event_history'               => 50,
	    'enforce_tcf_for_multiple_platforms' => 0,
	    'preferred_cmp'                   => 'auto',
	    'cmp_detection_timeout'           => 5,
	]);
	
});


// Register settings and fields
add_action('admin_init', 'adt_register_settings', 5);
function adt_register_settings() {
	// Skip the full Settings API setup during AJAX requests — the AJAX save handler
	// uses update_option() directly and removes the sanitize filter itself.
	// Building the full $adt_field_map on every AJAX request wastes significant memory.
	if ( wp_doing_ajax() ) {
		return;
	}

    $current_settings = get_option('adt_settings', false);
    if ($current_settings === false || empty($current_settings)) {
        $defaults = adt_get_default_settings();
        update_option('adt_settings', $defaults);
    }
	
    register_setting('adt_settings_group', 'adt_settings', [
        'sanitize_callback' => 'adt_validate_settings'
    ]);

    $sections = [
        'adt_page_context'          => esc_html__('Page Context', 'brandmeetscode-datalayer-tracker'),
        'adt_device'                => esc_html__('Device Info', 'brandmeetscode-datalayer-tracker'),
        'adt_user_info'             => esc_html__('User & Identity', 'brandmeetscode-datalayer-tracker'),
        'adt_metadata'              => esc_html__('Metadata Tracking', 'brandmeetscode-datalayer-tracker'),
        'adt_behavior'              => esc_html__('Interaction Tracking', 'brandmeetscode-datalayer-tracker'),
        'adt_engagement'            => esc_html__('Engagement Signals', 'brandmeetscode-datalayer-tracker'),
        'adt_integrations'          => esc_html__('Integrations', 'brandmeetscode-datalayer-tracker'),
        'adt_advanced'              => esc_html__('Advanced Options', 'brandmeetscode-datalayer-tracker'),
        'adt_general'               => esc_html__('Debug Options', 'brandmeetscode-datalayer-tracker'),
        // 'adt_pixel_manager'         => esc_html__('Pixel Manager', 'brandmeetscode-datalayer-tracker'),
        // 'adt_export_history'        => esc_html__('Export History', 'brandmeetscode-datalayer-tracker'),
        // 'adt_help_support'          => esc_html__('Help & Support', 'brandmeetscode-datalayer-tracker'),
    ];

    foreach ($sections as $id => $title) {
        add_settings_section($id, $title, function () {}, 'adt-settings');
    }

    $adt_field_map = [
		'adt_page_context' => [
    
		    'page_identifiers_header' => [
		        'type' => 'header',
		        'label' => __('BASIC PAGE IDENTIFIERS', 'brandmeetscode-datalayer-tracker'),
		        //'description' => __('Core WordPress page information for content classification and tracking.', 'brandmeetscode-datalayer-tracker')
		    ],
    
		    'include_page_type' => [
		        'type'        => 'checkbox',
		        'label'       => __('Include Page Type', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Adds the current page type (e.g., single, archive, front_page) to the dataLayer.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 1
		    ],
    
		    'include_post_id' => [
		        'type'        => 'checkbox',
		        'label'       => __('Include Post ID', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Adds the WordPress post ID to the dataLayer when available.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 1
		    ],
    
		    'include_page_title' => [
		        'type'        => 'checkbox',
		        'label'       => __('Include Page Title', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Includes the document title (from `document.title`) in the dataLayer.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 1
		    ],
    
		    'include_template' => [
		        'type'        => 'checkbox',
		        'label'       => __('Include Template', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Includes the active WordPress page template (e.g., `page-home.php`) if available.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 0
		    ],
    
		    'url_components_header' => [
		        'type' => 'header',
		        'label' => __('URL COMPONENTS', 'brandmeetscode-datalayer-tracker'),
		        //'description' => __('Track different parts of the page URL for advanced segmentation and analysis.', 'brandmeetscode-datalayer-tracker')
		    ],
    
		    'include_page_url' => [
		        'type'        => 'checkbox',
		        'label'       => __('Include Page URL', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Includes the full canonical URL of the current page.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 1
		    ],
    
		    'include_slug' => [
		        'type'        => 'checkbox',
		        'label'       => __('Include Slug', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Adds the post/page slug (last part of the URL) to the dataLayer.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 1
		    ],
    
		    'include_path' => [
		        'type'        => 'checkbox',
		        'label'       => __('Include Path', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Adds the path portion of the URL (e.g., `/products/shoes`) to the dataLayer.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 1
		    ],
    
		    'content_taxonomy_header' => [
		        'type' => 'header',
		        'label' => __('CONTENT TAXONOMY', 'brandmeetscode-datalayer-tracker'),
		        //'description' => __('Include WordPress categories and tags for content-based audience building.', 'brandmeetscode-datalayer-tracker')
		    ],
    
		    'include_categories' => [
		        'type'        => 'checkbox',
		        'label'       => __('Include Post Categories', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Adds a list of post categories (if any) to the dataLayer.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 1
		    ],
    
		    'include_tags' => [
		        'type'        => 'checkbox',
		        'label'       => __('Include Post Tags', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Adds post tags to the dataLayer for content classification.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 1
		    ],
    
		    'traffic_source_header' => [
		        'type' => 'header',
		        'label' => __('Traffic Source', 'brandmeetscode-datalayer-tracker'),
		        //'description' => __('Track where visitors came from for attribution analysis.', 'brandmeetscode-datalayer-tracker')
		    ],
    
		    'include_referrer' => [
		        'type'        => 'checkbox',
		        'label'       => __('Include Referrer URL', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Includes the `document.referrer` value for attribution tracking.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 1
		    ]
    
		],

		'adt_device' => [
    
		    'display_info_header' => [
		        'type' => 'header',
		        'label' => __('Display Information', 'brandmeetscode-datalayer-tracker'),
		        //'description' => __('Track screen and viewport dimensions for responsive design analysis and device segmentation.', 'brandmeetscode-datalayer-tracker')
		    ],
    
		    'include_screen_resolution' => [
		        'type'        => 'checkbox',
		        'label'       => __('Screen Resolution', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Include the user\'s screen width and height in the dataLayer.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 1
		    ],
    
		    'locale_info_header' => [
		        'type' => 'header',
		        'label' => __('Location & Language', 'brandmeetscode-datalayer-tracker'),
		        //'description' => __('Capture timezone and language preferences to understand your global audience.', 'brandmeetscode-datalayer-tracker')
		    ],
    
		    'include_timezone_offset' => [
		        'type'        => 'checkbox',
		        'label'       => __('Timezone Offset', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Track the user\'s timezone offset from UTC to help infer region.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 1
		    ],
    
		    'include_browser_lang' => [
		        'type'        => 'checkbox',
		        'label'       => __('Browser Language', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Capture the preferred browser language of the user (e.g., en-US).', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 1
		    ]
    
		],

		'adt_user_info' => [
    
		    'basic_user_info_header' => [
		        'type' => 'header',
		        'label' => __('Basic User Information', 'brandmeetscode-datalayer-tracker'),
		        //'description' => __('Track WordPress user login status, role, and permissions for audience segmentation.', 'brandmeetscode-datalayer-tracker')
		    ],
    
		    'include_user' => [
		        'type'        => 'checkbox',
		        'label'       => __('Include User Info', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Adds basic WordPress user data like login status, ID, and role.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 1
		    ],
    
		    'include_wp_flags' => [
		        'type'        => 'checkbox',
		        'label'       => __('Include WordPress Flags', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Tracks WordPress-specific flags like whether the current user is an admin or editor.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 1
		    ],
    
		    'anonymous_tracking_header' => [
		        'type' => 'header',
		        'label' => __('Anonymous User Identification', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Privacy-safe user tracking using hashed IDs instead of personally identifiable information.', 'brandmeetscode-datalayer-tracker')
		    ],
    
		    'include_user_hash' => [
		        'type'        => 'checkbox',
		        'label'       => __('Include Hashed User ID', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Adds a non-reversible hashed version of the user ID for anonymous tracking.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 1
		    ],
    
		    'user_hash_mode' => [
		        'type'        => 'select',
		        'label'       => __('User Hashing Mode', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Choose how user IDs are hashed when included. Salted modes enhance privacy.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 'none',
		        'options'     => [
		            'none'          => __('None (do not include user hash)', 'brandmeetscode-datalayer-tracker'),
		            'deterministic' => __('Deterministic (same hash across sessions)', 'brandmeetscode-datalayer-tracker'),
		            'daily'         => __('Salted Daily', 'brandmeetscode-datalayer-tracker'),
		            'session'       => __('Salted Per Session', 'brandmeetscode-datalayer-tracker')
		        ]
		    ],
    
		    'persist_user_hash_cookie' => [
		        'type'        => 'checkbox',
		        'label'       => __('Persist hashed ID in cookie', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Store hashed user ID in a cookie (adt_hashed_id) for cross-domain reuse.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 0
		    ]
    
		],
	
		'adt_metadata' => [
    
		    'campaign_attribution_header' => [
		        'type' => 'header',
		        'label' => __('Campaign Attribution', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Track UTM parameters and campaign data for marketing attribution analysis.', 'brandmeetscode-datalayer-tracker')
		    ],
    
		    'include_utm' => [
		        'type'        => 'checkbox',
		        'label'       => __('Capture UTM Parameters', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Automatically captures and stores UTM parameters for campaign attribution.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 1,
		    ],
    
		    'cookie_tracking_header' => [
		        'type' => 'header',
		        'label' => __('Cookie Tracking', 'brandmeetscode-datalayer-tracker'),
		        //'description' => __('Include specific browser cookies in the dataLayer for cross-platform tracking and enrichment.', 'brandmeetscode-datalayer-tracker')
		    ],
    
		    'include_cookies' => [
		        'type'        => 'checkbox',
		        'label'       => __('Include Specific Cookies', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Lets you expose selected cookies to the dataLayer using the `cookie_list` field.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 0
		    ],
    
		    'cookieMatchRegex' => [
		        'type'        => 'text',
		        'label'       => __('Cookie Name Regex', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Only cookie names matching this JavaScript RegExp will be included (used for auto-discovery and enrichment).', 'brandmeetscode-datalayer-tracker'),
		        'default'     => '^(utm_|ga|adt_|wp_|_gcl_|_fbp|sbjs_|_tt_|_pin_)',
		    ],
    
		    'cookie_list' => [
		        'type'        => 'textarea',
		        'label'       => __('Cookie Names to Include', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Comma-separated list of cookie names to expose in the dataLayer if enabled.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => ''
		    ]
    
		],

		'adt_behavior' => [
    
		    'click_tracking_header' => [
		        'type' => 'header',
		        'label' => __('Click Tracking', 'brandmeetscode-datalayer-tracker'),
		        //'description' => __('Track user clicks on links, buttons, and interactive elements across your site.', 'brandmeetscode-datalayer-tracker')
		    ],
    
		    'track_default_clicks' => [
		        'type'        => 'checkbox',
		        'label'       => __('Track Default Clicks', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Automatically track clicks on links, buttons, and inputs.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 1
		    ],
    
		    'include_click_metadata' => [
		        'type'        => 'checkbox',
		        'label'       => __('Include Click Metadata', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Adds metadata like element ID, tag name, and text to click events.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 0,
		    ],
    
		    'form_interaction_header' => [
		        'type' => 'header',
		        'label' => __('Form Interaction Tracking', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Track user engagement with form fields to identify friction points and optimize conversion.', 'brandmeetscode-datalayer-tracker')
		    ],
    
			'include_field_tracking' => [
			    'type'        => 'checkbox',
			    'label'       => __('Enable Field Tracking', 'brandmeetscode-datalayer-tracker'),
			    'description' => __('Tracks field-level interactions: form_field_start (when focused), form_field_complete (when filled), and form_field_abandon (when left empty). Automatically detects and excludes PII fields (email, password, phone, address, credit card, SSN, etc.) - sensitive fields are never tracked or sent to analytics. Only captures field_id, field_type, and timing data for non-sensitive fields.', 'brandmeetscode-datalayer-tracker'),
			    'default'     => 1,
			],
    
			'include_field_interaction' => [
			    'label' => 'Track Field Interactions',
			    'type' => 'checkbox',
			    'default' => 0,
			    'description' => 'Track time spent and interaction count per field (fires on blur >1 second). Provides deeper engagement metrics but increases event volume.',
			],
    
		    'form_vendor_detection_header' => [
		        'type' => 'header',
		        'label' => __('Form Vendor Detection', 'brandmeetscode-datalayer-tracker'),
		        //'description' => __('Automatically detect and track submissions from popular form platforms like Marketo, HubSpot, and Gravity Forms.', 'brandmeetscode-datalayer-tracker')
		    ],
    
		    'formVendorTracking' => [
		        'type'        => 'checkbox',
		        'label'       => __('Track Marketo, HubSpot, and Gravity Forms', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Automatically pushes form_submit events for supported vendor forms using built-in selectors.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 0,
		    ],
    
		    'formVendorTracking_mode' => [
		        'type'        => 'select',
		        'label'       => __('Form Vendor Tracking Mode', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Static Map uses predefined CSS selectors for known form vendors (Marketo, HubSpot, Gravity Forms). Auto-Detect analyzes form attributes to identify vendors dynamically.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 'map',
		        'options'     => [
		            'map'  => __('Static Map (Recommended)', 'brandmeetscode-datalayer-tracker'),
		            'auto' => __('Auto-Detect (Beta)', 'brandmeetscode-datalayer-tracker')
		        ],
		    ]
    
		],
		
		'adt_engagement' => [
    
		    'scroll_tracking_header' => [
		        'type' => 'header',
		        'label' => __('Scroll Tracking', 'brandmeetscode-datalayer-tracker'),
		        //'description' => __('Measure content consumption by tracking how far users scroll and whether they return to previous sections.', 'brandmeetscode-datalayer-tracker')
		    ],
    
		    'include_scroll_depth' => [
		        'type'        => 'checkbox',
		        'label'       => __('Track Scroll Depth', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Pushes maximum scroll percentage reached during the session.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 1
		    ],
    
		    'scroll_event_mode' => [
		        'type'        => 'select',
		        'label'       => __('Scroll Event Mode', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Choose how scroll events are dispatched. "Depth" mode is recommended for GTM users.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 'depth',
		        'options'     => [
		            'depth'                => __('Single Event: scroll_depth (Recommended)', 'brandmeetscode-datalayer-tracker'),
		            'custom'               => __('Custom Events: scroll_25, scroll_50 (Legacy)', 'brandmeetscode-datalayer-tracker'),
		            'intersectionObserver' => __('IntersectionObserver (Advanced)', 'brandmeetscode-datalayer-tracker')
		        ]
		    ],
    
		    'include_scroll_back_up' => [
		        'type'        => 'checkbox',
		        'label'       => __('Track scrollBackUp', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Detect when users scrollBackUp the page.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 1
		    ],
    
		    'time_tracking_header' => [
		        'type' => 'header',
		        'label' => __('Time & Activity Tracking', 'brandmeetscode-datalayer-tracker'),
		        //'description' => __('Measure true engagement by tracking active interaction time and tab visibility changes.', 'brandmeetscode-datalayer-tracker')
		    ],
			
			'include_time_on_page' => [
			    'type'        => 'checkbox',
			    'label'       => __('Time on Page (Total Time)', 'brandmeetscode-datalayer-tracker'),
			    'description' => __('Tracks total elapsed time on page, including idle time. Fires every 30 seconds. This event is always active and cannot be disabled.', 'brandmeetscode-datalayer-tracker'),
			    'default'     => 1,
			    'disabled'    => true,
			    'note'        => __('This is a core event required for session tracking.', 'brandmeetscode-datalayer-tracker')
			],
    
		    'include_active_time' => [
		        'label'       => __('Active Time (no idle)', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Tracks time while user is actively interacting (scrolling, moving mouse, typing).', 'brandmeetscode-datalayer-tracker'),
		        'type'        => 'checkbox',
		        'default'     => 1,
		    ],
    
		    'include_focus_blur' => [
		        'type'        => 'checkbox',
		        'label'       => __('Track Tab Focus/Blur', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Track when users switch away from the tab.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 1
		    ],
    
		    'hover_intent_header' => [
		        'type' => 'header',
		        'label' => __('Hover Intent Tracking', 'brandmeetscode-datalayer-tracker'),
		        //'description' => __('Detect when users show interest by hovering over key elements like CTAs and buttons.', 'brandmeetscode-datalayer-tracker')
		    ],
    
		    'include_hover_intent' => [
		        'type'        => 'checkbox',
		        'label'       => __('Track Hover Intent', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Detect when users hover over key elements.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 1,
		    ],
    
		    'hover_intent_cooldown' => [
		        'type'        => 'number',
		        'label'       => __('Hover Intent Cooldown (seconds)', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Minimum time between hover intent events.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 30,
		    ]
    
		],
				
		'adt_integrations' => [

		    'video_tracking_header' => [
		        'type' => 'header',
		        'label' => __('Video Tracking', 'brandmeetscode-datalayer-tracker'),
		    ],

		    'include_video_progress' => [
		        'type'        => 'checkbox',
		        'label'       => __('Track Video Progress', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Track video playback milestones.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 1,
		    ],

		    'ecommerce_tracking_header' => [
		        'type' => 'header',
		        'label' => __('WooCommerce Ecommerce Tracking', 'brandmeetscode-datalayer-tracker'),
		    ],

		    'enable_ecommerce_tracking' => [
		        'type'        => 'checkbox',
		        'label'       => __('Enable WooCommerce Ecommerce Tracking', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Fires GA4-compatible ecommerce events like view_item, add_to_cart, purchase, etc. WooCommerce must be active.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 0,
		    ],

		    'gtm_integration_header' => [
		        'type' => 'header',
		        'label' => __('Google Tag Manager Integration', 'brandmeetscode-datalayer-tracker'),
				'description' => __('Configure GTM container deployment and automatic tag generation.', 'brandmeetscode-datalayer-tracker')
		    ],

		    'enable_gtm_snippet' => [
		        'type'        => 'checkbox',
		        'label'       => __('Enable GTM Snippet', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Automatically inject the Google Tag Manager snippet into your site.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 0
		    ],

		    'gtm_container_id' => [
		        'type'        => 'text',
		        'label'       => __('GTM Container ID', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Your Google Tag Manager container ID (GTM-XXXXXX).', 'brandmeetscode-datalayer-tracker'),
		        'default'     => ''
		    ],

		    'allow_multi_container' => [
		        'type'        => 'checkbox',
		        'label'       => __('Allow Multiple GTM Containers', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Allow multiple GTM containers on the same page.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 0
		    ],


		],

		'adt_advanced' => [

			'session_management_header' => [
			    'type' => 'header',
			    'label' => __('Session Management', 'brandmeetscode-datalayer-tracker'),
			    'description' => __('Configure how long sessions last and how many events to track in memory.', 'brandmeetscode-datalayer-tracker')  // ✅ Not immediately obvious
			],


		    'session_timeout_minutes' => [
		        'type'        => 'number',
		        'label'       => __('Session Timeout (Minutes)', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Controls how long a session lasts before session-based values reset. Defaults to 30 minutes.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 30,
		        'min'         => 1,
		        'max'         => 120,
		        'step'        => 5
		    ],
			

		    'max_event_history' => [
		        'type'        => 'number',
		        'label'       => __('Event History Limit', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Maximum number of events to keep in memory for overlay rehydration.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 50,
		        'min'         => 10,
		        'max'         => 500,
		        'step'        => 10,
		    ],
			
			'testing_exclusion_header' => [
			    'type' => 'header',
			    'label' => __('Testing & IP Exclusion', 'brandmeetscode-datalayer-tracker'),
			    'description' => __('Exclude specific IP addresses from all tracking to test without polluting analytics data.', 'brandmeetscode-datalayer-tracker'),
			],

			'exclude_ips' => [
			    'type'        => 'textarea',
			    'label'       => __('Excluded IP Addresses', 'brandmeetscode-datalayer-tracker'),
			    'description' => __('Enter IP addresses to exclude from tracking (one per line). Supports IPv4, IPv6, and CIDR notation.', 'brandmeetscode-datalayer-tracker') . '
			    <details style="margin-top:12px;padding:12px;background:#f9f9f9;border-left:3px solid #2271b1;border-radius:4px;">
			        <summary style="cursor:pointer;font-weight:600;color:#2271b1;user-select:none;">
			            📋 ' . esc_html__('Supported Formats & Examples', 'brandmeetscode-datalayer-tracker') . '
			        </summary>
			        <div style="margin-top:12px;font-size:13px;line-height:1.6;">
			            <p style="margin-top:0;color:#666;"><strong>' . esc_html__('Single IP Addresses:', 'brandmeetscode-datalayer-tracker') . '</strong></p>
			            <pre style="background:#fff;padding:8px;border:1px solid #ddd;font-size:12px;margin:8px 0;">192.168.1.100
			2001:db8::1</pre>
            
			            <p style="color:#666;margin-top:12px;"><strong>' . esc_html__('IP Ranges (CIDR Notation):', 'brandmeetscode-datalayer-tracker') . '</strong></p>
			            <pre style="background:#fff;padding:8px;border:1px solid #ddd;font-size:12px;margin:8px 0;">192.168.1.0/24    # Excludes 192.168.1.0 - 192.168.1.255
			10.0.0.0/8        # Excludes entire 10.x.x.x range
			172.16.0.0/12     # Excludes 172.16.0.0 - 172.31.255.255
			2001:db8::/32     # IPv6 range</pre>
            
			            <p style="margin-top:12px;color:#666;"><strong>' . esc_html__('Common Use Cases:', 'brandmeetscode-datalayer-tracker') . '</strong></p>
			            <ul style="margin:8px 0;padding-left:20px;color:#666;">
			                <li>' . esc_html__('Exclude office/corporate networks from analytics', 'brandmeetscode-datalayer-tracker') . '</li>
			                <li>' . esc_html__('Block VPN IP ranges', 'brandmeetscode-datalayer-tracker') . '</li>
			                <li>' . esc_html__('Filter development/staging environments', 'brandmeetscode-datalayer-tracker') . '</li>
			                <li>' . esc_html__('Prevent internal traffic from skewing data', 'brandmeetscode-datalayer-tracker') . '</li>
			            </ul>
            
			            <p style="margin-bottom:0;font-size:12px;color:#666;">
			                <strong>' . esc_html__('Note:', 'brandmeetscode-datalayer-tracker') . '</strong> ' . esc_html__('Changes take effect immediately. Excluded IPs will not trigger any tracking events.', 'brandmeetscode-datalayer-tracker') . '
			            </p>
			        </div>
			    </details>',
			    'default'     => '',
			],
			
			'ip_exclusion_buttons' => [
			    'type'        => 'custom',
			    'label'       => __('IP-Based Tracking Exclusion', 'brandmeetscode-datalayer-tracker'),
			    'callback'    => 'adt_render_ip_exclusion_buttons',
			    'description' => __('Exclude your current IP address from all tracking. Works with all cache plugins.', 'brandmeetscode-datalayer-tracker')
			],
			
			'exclude_admin_ips' => [
			    'type'        => 'checkbox',
			    'label'       => __('Exclude Administrator IPs', 'brandmeetscode-datalayer-tracker'),
			    'description' => __('Automatically exclude all logged-in administrators from tracking. When enabled, any user with administrator role will not have their actions tracked.', 'brandmeetscode-datalayer-tracker'),
			    'default'     => 0,
			],

			'consent_management_header' => [
			    'type' => 'header',
			    'label' => __('Consent Management (GDPR/CCPA)', 'brandmeetscode-datalayer-tracker'),
			    'description' => __('Configure privacy compliance settings and integrate with consent management platforms.', 'brandmeetscode-datalayer-tracker')  // ✅ Explains scope
			],

		    'preferred_cmp' => [
		        'type'        => 'select',
		        'label'       => __('Preferred CMP Platform', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Choose your consent management platform.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 'auto',
		        'options'     => [
		            'auto'        => __('Auto-detect', 'brandmeetscode-datalayer-tracker'),
		            'cookiesyes'  => __('CookieYes', 'brandmeetscode-datalayer-tracker'),
		            'cookiebot'   => __('Cookiebot', 'brandmeetscode-datalayer-tracker'),
		            'klaro'       => __('Klaro', 'brandmeetscode-datalayer-tracker'),
		            'complianz'   => __('Complianz', 'brandmeetscode-datalayer-tracker'),
		        ]
		    ],

		    'cmp_detection_timeout' => [
		        'type'        => 'number',
		        'label'       => __('CMP Detection Timeout (seconds)', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('How long to wait for consent management platforms to load before using fallback.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 5,
		        'min'         => 1,
		        'max'         => 30,
		        'step'        => 1
		    ],

		    'delay_until_consent' => [
		        'type'        => 'checkbox',
		        'label'       => __('Delay Tracking Until Consent', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('(GDPR/CCPA Safe Mode) Prevents tracking until user consent is granted. Integrates with OneTrust or Cookiebot.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 0
		    ],

		    'fallback_track_without_cmp' => [
		        'type'        => 'checkbox',
		        'label'       => __('Track if No CMP Detected', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Allow tracking when no consent platform is found. <strong>Note:</strong> Automatically disabled when "Delay until consent" is enabled.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 1
		    ],

		    'enforce_tcf_for_multiple_platforms' => [
		        'type'        => 'checkbox',
		        'label'       => __('Require TCF Consent', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Only run tracking if TCF consent is granted for every detected vendor (Google, Meta, TikTok, etc.).', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 0
		    ],

			'custom_events_filters_header' => [
			    'type' => 'header',
			    'label' => __('Custom Events & Filters', 'brandmeetscode-datalayer-tracker'),
			    'description' => __('Define custom tracking events and exclude specific pages from tracking.', 'brandmeetscode-datalayer-tracker')
			],

		    'custom_events_json' => [
		        'type'        => 'textarea',
		        'label'       => __('Custom Events (JSON)', 'brandmeetscode-datalayer-tracker'),
		        //'description' => __('Define additional custom events using JSON (CSS selectors, triggers, etc).', 'brandmeetscode-datalayer-tracker'),
		        'default'     => '',
		    ],

		    'regex_exclude' => [
		        'type'        => 'textarea',
		        'label'       => __('Regex Exclude Pattern', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Exclude pages matching this regex pattern (overrides include). Example: <code>/checkout/|/cart/|/admin/</code>', 'brandmeetscode-datalayer-tracker'),
		        'default'     => ''
		    ] 
		],
		
		'adt_general' => [
    
		    'debug_console_header' => [
		        'type' => 'header',
		        'label' => __('Console Debugging', 'brandmeetscode-datalayer-tracker'),
		        //'description' => __('Control browser console logging for troubleshooting and development.', 'brandmeetscode-datalayer-tracker')
		    ],
    
		    'debug_mode' => [
		        'type'        => 'checkbox',
		        'label'       => __('Enable Debug Mode', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Show console logs when active.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 1
		    ],
    
		    'debug_level' => [
		        'type'        => 'select',
		        'label'       => __('Console Log Verbosity', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Control how much detail appears in browser console. Quiet = errors only, Normal = grouped summaries, Verbose = everything.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 'normal',
		        'options'     => [
		            'quiet'   => __('Quiet (Errors Only)', 'brandmeetscode-datalayer-tracker'),
		            'normal'  => __('Normal (Grouped)', 'brandmeetscode-datalayer-tracker'),
		            'verbose' => __('Verbose (All Logs)', 'brandmeetscode-datalayer-tracker')
		        ]
		    ],
    
		    'debug_overlay_header' => [
		        'type' => 'header',
		        'label' => __('Debug Overlay', 'brandmeetscode-datalayer-tracker'),
		        //'description' => __('Visual on-screen debugging interface for inspecting events in real-time.', 'brandmeetscode-datalayer-tracker')
		    ],
    
		    'enable_debug_overlay' => [
		        'type'        => 'checkbox',
		        'label'       => __('Show Debug Overlay', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Adds a floating overlay for inspecting event activity.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 1
		    ],
    
		    'overlay_min_role' => [
		        'type'        => 'select',
		        'label'       => __('Minimum Role for Overlay', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Only users with this role or higher can see the debug overlay.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 'administrator',
		        'options'     => [
		            'administrator' => __('Administrator', 'brandmeetscode-datalayer-tracker'),
		            'editor'        => __('Editor', 'brandmeetscode-datalayer-tracker'),
		            'author'        => __('Author', 'brandmeetscode-datalayer-tracker'),
		            'contributor'   => __('Contributor', 'brandmeetscode-datalayer-tracker'),
		            'subscriber'    => __('Subscriber', 'brandmeetscode-datalayer-tracker')
		        ]
		    ],
    
		    'show_blocked_events_overlay' => [
		        'type'        => 'checkbox',
		        'label'       => __('Blocked Events in Overlay', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Display events that are blocked by consent in the overlay (marked with 🚫)', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 1
		    ],
    
		    'show_event_filters' => [
		        'type'        => 'checkbox',
		        'label'       => __('Show Event Filters', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Display the event filters interface in the debug overlay.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 0
		    ],
    
	
		    'show_simulator' => [
		        'type'        => 'checkbox',
		        'label'       => __('Show Event Simulator', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Display the event simulator interface in the debug overlay.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 0,
		    ],
    
		    'advanced_debug_header' => [
		        'type' => 'header',
		        'label' => __('Advanced Debug Options', 'brandmeetscode-datalayer-tracker'),
		        //'description' => __('Technical settings for troubleshooting specific tracking scenarios.', 'brandmeetscode-datalayer-tracker')
		    ],
    
		    'set_dataLayerBlocked_flag' => [
		        'type'        => 'checkbox',
		        'label'       => __('Expose `dataLayerBlocked` Global Flag', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('When enabled, a `window.dataLayerBlocked` boolean will be set to indicate if consent blocks tracking.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 0
		    ],
    
		    'clear_datalayer_on_load' => [
		        'type'        => 'checkbox',
		        'label'       => __('Clear dataLayer on Page Load', 'brandmeetscode-datalayer-tracker'),
		        'description' => __('Prevents duplicate events by clearing the dataLayer array on each full page load.', 'brandmeetscode-datalayer-tracker'),
		        'default'     => 0
		    ]
    
		],
		
	];
		
    /**
     * --------------------------------------------------------------------
     * Auto-assign categories to each $adt_field_map item
     * --------------------------------------------------------------------
     */
    $adt_category_lookup = [
        'adt_page_context'         => 'context',
        'adt_device'               => 'device',
        'adt_user_info'            => 'user',
        'adt_metadata'             => 'metadata',
        'adt_behavior'             => 'behavior',
        'adt_engagement'           => 'engagement',
        'adt_stage_options'        => 'stage',
        'adt_advanced'             => 'advanced',
        'adt_integrations'         => 'integrations',
        'adt_general'              => 'debug',
    ];

    foreach ($adt_field_map as $section_key => &$fields) {
        $default_cat = $adt_category_lookup[$section_key] ?? $section_key;
        foreach ($fields as &$field_def) {
            if (empty($field_def['category'])) {
                $field_def['category'] = $default_cat;
            }
        }
    }
    unset($fields, $field_def);

	// Expose for tools if you need it
	$GLOBALS["adt_field_map"] = $adt_field_map;

	// 2) Register field_map fields with WP Settings API
	foreach ($adt_field_map as $section_id => $fields) {
	    foreach ($fields as $field_key => $config) {

	        // Handle numeric-indexed format like ['include_post_id']
	        if (is_int($field_key)) {
	            $field_key = $config;
	            $config = [
	                'label'       => ucwords(str_replace('_', ' ', $field_key)),
	                'type'        => 'checkbox',
	                'default'     => 0,
	                'description' => ''
	            ];
	        }

	        // Handle string-based shortcut: 'debug_mode' => 'Enable Debug Mode'
	        if (is_string($config)) {
	            $config = [
	                'label'       => $config,
	                'type'        => 'checkbox',
	                'default'     => 0,
	                'description' => ''
	            ];
	        }

	        // SPECIAL HANDLING FOR HEADERS - Full width, no label column
	        if (!empty($config['type']) && $config['type'] === 'header') {
	            add_settings_field(
	                $field_key,
	                '', // Empty label for left column
	                function () use ($field_key, $config) {
	                    render_adt_field_callback($field_key, $config, null);
	                },
	                'adt-settings',
	                $section_id
	            );
	            continue; // Skip normal field registration
	        }
			
	        // Pass full config to the renderer
			add_settings_field(
			    $field_key,
			    $config['label'] ?? '',
			    function () use ($field_key, $config) {  // Remove $settings from use()
			        render_adt_field_callback($field_key, $config, null);  // Pass null, function will get settings itself
			    },
			    'adt-settings',
			    $section_id
			);
	    }
	}

} // end adt_register_settings

function adt_validate_settings( $input ) {

    global $adt_field_map;

    $output = [];
    $errors = [];

    // 1) Sanitize each submitted field
    foreach ( $adt_field_map as $section => $fields ) {
        foreach ( $fields as $key => $config ) {
            // Normalize shorthand
            if ( is_int( $key ) ) {
                $key    = $config;
                $config = [ 'type' => 'checkbox', 'default' => 0 ];
            } elseif ( is_string( $config ) ) {
                $config = [ 'label' => $config, 'type' => 'checkbox', 'default' => 0 ];
            }

            $type = $config['type'] ?? 'checkbox';

            // Handle groups
            if ( $type === 'group' && ! empty( $config['fields'] ) ) {
                $submitted = $input[ $key ] ?? [];
                $output[ $key ] = [];

                foreach ( $config['fields'] as $subKey => $subConfig ) {
                    $rawVal = $submitted[ $subKey ] ?? '';
                    $output[ $key ][ $subKey ] = sanitize_text_field( $rawVal );
                }

                continue;
            }

            // Skip non-checkbox fields that weren't submitted
            if ( $type !== 'checkbox' && ! isset( $input[ $key ] ) ) {
                continue;
            }

            switch ( $type ) {
                case 'number':
                    $raw = $input[ $key ] ?? $config['default'] ?? 0;
                    $output[ $key ] = intval( $raw );
                    break;

                case 'text':
                    $output[ $key ] = sanitize_text_field( $input[ $key ] ?? '' );
                    break;

                case 'textarea':
                    $output[ $key ] = sanitize_textarea_field( $input[ $key ] ?? '' );
                    break;

                case 'select':
                case 'radio':
                    $valid = array_keys( $config['options'] ?? [] );
                    $val   = $input[ $key ] ?? '';
                    $output[ $key ] = in_array( $val, $valid, true )
                        ? $val
                        : ( $config['default'] ?? '' );
                    break;

                case 'multi-checkbox':
                    $valid    = array_keys( $config['options'] ?? [] );
                    $selected = isset( $input[ $key ] ) ? (array) $input[ $key ] : [];
                    $output[ $key ] = implode(
                        ',',
                        array_intersect( $selected, $valid )
                    );
                    break;
				
				case 'custom':
				    // Custom field types - call the callback function
				    if (isset($config['callback']) && function_exists($config['callback'])) {
				        call_user_func($config['callback'], $config);
				    }
				    break;

				case 'checkbox':
				default:
				    // Handle checkbox values properly with type coercion
				    if (isset($input[$key])) {
				        // Normalize to integer 0 or 1, handling string, int, and boolean types
				        $output[$key] = ($input[$key] === '1' || $input[$key] === 1 || $input[$key] === true) ? 1 : 0;
				    } else {
				        // Checkbox field not in submitted form (different tab)
				        // Preserve existing database value
				        $existing = get_option('adt_settings', []);
				        if (isset($existing[$key])) {
				            $output[$key] = $existing[$key];
				        } else {
				            // New field - use default
				            $defaults = adt_get_default_settings();
				            $output[$key] = $defaults[$key] ?? 0;
				        }
				    }
				    break;
		}
        }
    }

	// 2) JSON validation for custom_events_json
	if (!empty($input['custom_events_json'])) {
	    $decoded = json_decode($input['custom_events_json'], true);

	    if (json_last_error() !== JSON_ERROR_NONE) {
	        $errors[] = sprintf(
	            /* translators: %s: JSON error message from json_last_error_msg(). */
	            __('Custom Events JSON is invalid: %s', 'brandmeetscode-datalayer-tracker'),
	            esc_html(json_last_error_msg())
	        );
	        unset($output['custom_events_json']);
	    } else {
	        // Sanitize all values recursively
	        $sanitized = adt_sanitize_json_recursive($decoded);
	        $output['custom_events_json'] = wp_json_encode($sanitized);
	    }
	}

	// 3) Regex validation for regex_exclude
	if (!empty($input['regex_exclude'])) {
	    $pattern = sanitize_textarea_field($input['regex_exclude']);

	    // Validate regex safely (no set_error_handler; invalid patterns throw in PHP 8+).
	    $isValid = false;
	    if ( strlen( $pattern ) <= 500 && substr_count( $pattern, '*' ) <= 10 ) {
	        try {
	            $test = preg_match( '/' . str_replace( '/', '\\/', $pattern ) . '/', '' );
	            if ( false !== $test ) {
	                $isValid = true;
	            }
	        } catch ( \Throwable $e ) {
	            $isValid = false;
	        }
	    }

	    if (!$isValid) {
	        $errors[] = __('Regex pattern is invalid or potentially dangerous. Please simplify your pattern.', 'brandmeetscode-datalayer-tracker');
	        unset($output['regex_exclude']);
	    } else {
	        $output['regex_exclude'] = $pattern;
	    }
	}	

	// 4) IP exclusion now handled via direct URL (see template_redirect hook in adt-core-init.php)

    // 5) Only merge defaults for fields that are missing from output
    // Do NOT merge defaults wholesale as that re-adds removed fields
    $defaults = adt_get_default_settings();

    // Get existing settings to preserve fields from other tabs
    $existing = get_option('adt_settings', []);

    // Merge: existing settings first, then validated output (overrides), then only NEW defaults
    foreach ($defaults as $key => $default_value) {
        if (!isset($output[$key]) && !isset($existing[$key])) {
            // Only add default if field doesn't exist in output OR existing settings
            $output[$key] = $default_value;
        }
    }

    // Preserve existing settings for fields not in current submission
    foreach ($existing as $key => $value) {
        if (!isset($output[$key])) {
            $output[$key] = $value;
        }
    }

    // 6) Push validation errors
    foreach ( $errors as $error ) {
        add_settings_error( 'adt_settings', 'adt_settings_error', $error, 'error' );
    }

    return $output;
}

// Helper function for recursive JSON sanitization
if (!function_exists('adt_sanitize_json_recursive')) {
    function adt_sanitize_json_recursive($data) {
        if (is_array($data)) {
            return array_map('adt_sanitize_json_recursive', $data);
        } elseif (is_string($data)) {
            return sanitize_text_field($data);
        }
        return $data;
    }
}

// Clear cache when settings are updated
function adt_clear_features_summary_cache($new_settings) {
    global $wpdb;
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- intentional transient purge on settings save.
	$wpdb->query(
	    $wpdb->prepare(
	        "DELETE FROM {$wpdb->options} 
	         WHERE option_name LIKE %s 
	         OR option_name LIKE %s",
	        $wpdb->esc_like('_transient_adt_active_features_summary_') . '%',
	        $wpdb->esc_like('_transient_timeout_adt_active_features_summary_') . '%'
	    )
	);
}
add_action('update_option_adt_settings', 'adt_clear_features_summary_cache', 10, 1);

// Manual IP Save Helper - Admin Notice
add_action('admin_notices', function() {
    // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- one-off admin notice after intentional GET action.
    if (current_user_can('manage_options') && isset($_GET['adt_manual_ip_save'])) {
        $raw_ip = isset( $_SERVER['REMOTE_ADDR'] ) ? wp_unslash( $_SERVER['REMOTE_ADDR'] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- raw IP string; sanitized on next line.
        $current_ip = is_string( $raw_ip ) ? sanitize_text_field( $raw_ip ) : '';
        $excluded_ips = get_option('adt_excluded_admin_ips', []);
        
        if (!is_array($excluded_ips)) {
            $excluded_ips = [];
        }
        
        if (!in_array($current_ip, $excluded_ips)) {
            $excluded_ips[] = $current_ip;
            update_option('adt_excluded_admin_ips', $excluded_ips);
            echo '<div class="notice notice-success"><p>✅ IP ' . esc_html($current_ip) . ' added to exclusion list!</p></div>';
        } else {
            echo '<div class="notice notice-info"><p>ℹ️ IP ' . esc_html($current_ip) . ' already in list.</p></div>';
        }
        
        echo '<div class="notice notice-info"><p>Current excluded IPs: <pre>' . esc_html( wp_json_encode( $excluded_ips, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES ) ) . '</pre></p></div>';
    }
});

/**
 * Render IP exclusion buttons
 */
function adt_render_ip_exclusion_buttons($args) {
    $current_ip = function_exists( 'adt_get_client_ip' )
        ? adt_get_client_ip()
        : ( isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : 'unknown' );
    $excluded_ips = get_option('adt_excluded_admin_ips', []);
    $is_excluded = is_array($excluded_ips) && in_array($current_ip, $excluded_ips);
    
    $exclude_url = wp_nonce_url( add_query_arg( 'adt_exclude_ip', '1', home_url( '/' ) ), 'adt_exclude_ip' );
    $include_url = wp_nonce_url( add_query_arg( 'adt_include_ip', '1', home_url( '/' ) ), 'adt_include_ip' );
    
    ?>
    <div class="adt-ip-exclusion-panel">
        <div class="adt-ip-current">
            <strong><?php esc_html_e( 'Your Current IP:', 'brandmeetscode-datalayer-tracker' ); ?></strong>
            <code><?php echo esc_html($current_ip); ?></code>
            <?php if ($is_excluded): ?>
                <span class="adt-status-excluded">⛔ Excluded</span>
            <?php else: ?>
                <span class="adt-status-active">✅ Active</span>
            <?php endif; ?>
        </div>
        
        <div class="adt-button-group">
            <?php if (!$is_excluded): ?>
                <a href="<?php echo esc_url($exclude_url); ?>" class="button button-primary" target="_blank">
                    🚫 <?php esc_html_e( 'Exclude My IP', 'brandmeetscode-datalayer-tracker' ); ?>
                </a>
            <?php else: ?>
                <a href="<?php echo esc_url($include_url); ?>" class="button button-primary" target="_blank">
                    ✅ <?php esc_html_e( 'Re-enable Tracking', 'brandmeetscode-datalayer-tracker' ); ?>
                </a>
            <?php endif; ?>
        </div>
        
        <p class="description">
            <?php esc_html_e( 'Click the button to exclude your IP. Opens in new tab with confirmation. Works with all cache plugins including LiteSpeed.', 'brandmeetscode-datalayer-tracker' ); ?>
        </p>
    </div>
    <?php
}