<?php
/**
 * DataLayer Tracker - Admin Assets Handler
 * 
 * @package    DataLayer_Tracker
 * @subpackage Admin
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
if (!defined('ABSPATH')) exit;

add_action( 'admin_enqueue_scripts', 'adt_enqueue_assets' );
function adt_enqueue_assets( $hook ) {
    // Only load on ADT admin pages
    $is_adt_page = (
        strpos($hook, 'adt') !== false ||
        $hook === 'toplevel_page_adt-settings' ||
        $hook === 'settings_page_adt-settings'
    );
    
    if (!$is_adt_page) return;

    // Shared admin styles first; adt-admin loads after so settings overrides win.
    $shared_css = plugin_dir_path( __DIR__ ) . 'assets/css/adt-shared.css';
    if ( file_exists( $shared_css ) ) {
        wp_enqueue_style(
            'adt-shared',
            plugin_dir_url( __DIR__ ) . 'assets/css/adt-shared.css',
            [],
            (string) filemtime( $shared_css )
        );
    }

    $admin_css = plugin_dir_path( __DIR__ ) . 'assets/css/adt-admin.css';
    wp_enqueue_style(
        'adt-admin',
        plugin_dir_url( __DIR__ ) . 'assets/css/adt-admin.css',
        file_exists( $shared_css ) ? [ 'adt-shared' ] : [],
        file_exists( $admin_css ) ? (string) filemtime( $admin_css ) : ( defined( 'ADT_VERSION' ) ? ADT_VERSION : '1.0' )
    );

    // Paths
    $base_path = plugin_dir_path(__DIR__) . 'assets/js/';
    $base_url  = plugin_dir_url(__DIR__) . 'assets/js/';
    $settings  = get_option('adt_settings', []);
    $ajax_url  = admin_url('admin-ajax.php');
    $user      = wp_get_current_user();
    
    // 🧹 Dequeue unnecessary WordPress noise - sanitize GET parameter
    $page = isset( $_GET['page'] ) ? sanitize_text_field( wp_unslash( $_GET['page'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only admin screen detection.
    if (!empty($page) && strpos($page, 'adt_') === 0) {
        wp_dequeue_script('wp-auth-check');
        wp_dequeue_script('heartbeat');
    }
    
    // User context
    $is_logged_in = is_user_logged_in();
    $user_role    = $is_logged_in ? ($user->roles[0] ?? 'user') : 'guest';
    
    // Debug mode logic
    $is_debug_mode     = !empty($settings['debug_mode']);
    $has_required_role = $is_logged_in && function_exists('adt_user_has_min_role') && adt_user_has_min_role('editor');
    $debug_enabled     = $is_debug_mode && $has_required_role;
    
    $full_features = function_exists( 'adt_all_features_enabled' ) && adt_all_features_enabled();
    
    // BUILD ADTData ARRAY WITH FRESH NONCE
    $adt_data = [
        'ajax_url'       => $ajax_url,
        'nonce'          => wp_create_nonce('adt_admin_action'),
        'currentUser'    => $user->display_name ?: 'guest',
        'debug'          => $debug_enabled,
        'debug_mode'     => $debug_enabled ? '1' : '0',
		'debug_level'    => $settings['debug_level'] ?? 'normal',
        'is_logged_in'   => $is_logged_in,
        'userRole'       => $user_role,
        'fullFeatures'   => $full_features,
        'isPremiumUser'  => $full_features, // Legacy key for admin scripts.
        'canUsePremium'  => $full_features, // Legacy key for admin scripts.
        'enrich_GAtags'  => false,
        'show_blocked_events_overlay' => (int)($settings['show_blocked_events_overlay'] ?? 1),
        'i18n'           => [
            'custom_events_title'  => esc_html__('Need a template for Custom Events?', 'brandmeetscode-datalayer-tracker'),
            'load_example'         => esc_html__('Load Example Events', 'brandmeetscode-datalayer-tracker'),
            'clear'                => esc_html__('Clear', 'brandmeetscode-datalayer-tracker'),
            'toast_loaded'         => esc_html__('Example events loaded', 'brandmeetscode-datalayer-tracker'),
            'toast_cleared'        => esc_html__('Custom events cleared', 'brandmeetscode-datalayer-tracker'),
            'toggle_raw'           => esc_html__('Raw JSON', 'brandmeetscode-datalayer-tracker'),
            'toggle_styled'        => esc_html__('Visual Summary', 'brandmeetscode-datalayer-tracker'),
            'label_tags'           => esc_html__('Tags', 'brandmeetscode-datalayer-tracker'),
            'label_triggers'       => esc_html__('Triggers', 'brandmeetscode-datalayer-tracker'),
            'label_variables'      => esc_html__('Variables', 'brandmeetscode-datalayer-tracker'),
            'label_mode'           => esc_html__('Mode', 'brandmeetscode-datalayer-tracker'),
            'label_features'       => esc_html__('Included Features', 'brandmeetscode-datalayer-tracker'),
            'label_export_time'    => esc_html__('Export Time', 'brandmeetscode-datalayer-tracker'),
            'label_tag_count'      => esc_html__('Tags', 'brandmeetscode-datalayer-tracker'),
            'label_trigger_count'  => esc_html__('Triggers', 'brandmeetscode-datalayer-tracker'),
            'label_variable_count' => esc_html__('Variables', 'brandmeetscode-datalayer-tracker'),
            'no_export_history'    => esc_html__('📂 No export history found.', 'brandmeetscode-datalayer-tracker'),
            'label_pro'            => esc_html__('Pro', 'brandmeetscode-datalayer-tracker'),
            'label_free'           => esc_html__('Free', 'brandmeetscode-datalayer-tracker'),
            'label_debug_on'       => esc_html__('Debug ON', 'brandmeetscode-datalayer-tracker'),
            'label_debug_off'      => esc_html__('Debug OFF', 'brandmeetscode-datalayer-tracker'),
            'label_export_id'      => esc_html__('Export ID', 'brandmeetscode-datalayer-tracker'),
            'label_user'           => esc_html__('User', 'brandmeetscode-datalayer-tracker'),
            'label_you'            => esc_html__('You', 'brandmeetscode-datalayer-tracker'),
        ],
    ];

    // STEP 0: Load log manager FIRST (before adt-utils)
    $log_manager_file = $base_path . 'adt-log-manager.js';
    if (file_exists($log_manager_file)) {
        wp_register_script(
            'adt-log-manager',
            $base_url . 'adt-log-manager.js',
            [],
            filemtime($log_manager_file),
            true
        );
        wp_enqueue_script('adt-log-manager');
        
        // Pass debug level to log manager
        // wp_add_inline_script('adt-log-manager',
        //     'window.ADTData = window.ADTData || {}; ADTData.debugLevel = "' .
        //     esc_js($settings['debug_level'] ?? 'normal') . '";',
        //     'before'
        // );
    }

    // STEP 1. Register and enqueue adt-utils SECOND (depends on log manager)
    $utils_file = $base_path . 'adt-utils.js';
    if (file_exists($utils_file)) {
        wp_register_script(
            'adt-utils',
            $base_url . 'adt-utils.js',
            ['adt-log-manager'], // Add dependency
            filemtime($utils_file),
            true
        );
        wp_enqueue_script('adt-utils');
        
        // LOCALIZE ADTData to adt-utils (makes it available to ALL dependent scripts)
        wp_localize_script('adt-utils', 'ADTData', $adt_data);
        
        // Stub out removed GTM export utilities so dependent JS doesn't throw ReferenceErrors.
        // These objects were defined in deleted GTM-export/pixel/server-side scripts.
        wp_add_inline_script('adt-utils', '
            // GTM export stubs
            window.ADTPreviewUtils = window.ADTPreviewUtils || {
                waitForLatestExport: function() {}
            };
            window.ADTExportUtils = window.ADTExportUtils || {
                waitForADTExportHistory: function() {},
                bindExportButtons: function() {},
                renderStyledJSON: function() { return ""; }
            };
            window.ADTExportHistory = window.ADTExportHistory || {
                render: function() {},
                refresh: function() {},
                init: function() {}
            };
            // Loader spinner stub (show/hide a loading indicator — safe no-ops)
            window.ADTLoader = window.ADTLoader || {
                show: function() {},
                hide: function() {}
            };
            // AJAX helper — posts to ADTData.ajax_url with optional retry logic.
            // Called as: await adtPostWithRetry(action, dataObject, maxRetries)
            // Always resolves (never rejects); returns {success, data} WordPress-style objects.
            window.adtPostWithRetry = window.adtPostWithRetry || async function adtPostWithRetry(action, data, maxRetries) {
                maxRetries = (typeof maxRetries === "number") ? maxRetries : 0;
                var lastMsg = "Network error";
                for (var i = 0; i <= maxRetries; i++) {
                    try {
                        var params = { action: action };
                        if (window.ADTData && window.ADTData.nonce) {
                            params.security = window.ADTData.nonce;
                            params.nonce    = window.ADTData.nonce;
                        }
                        if (data) { Object.assign(params, data); }
                        var resp = await fetch(window.ADTData.ajax_url, {
                            method: "POST",
                            headers: { "Content-Type": "application/x-www-form-urlencoded" },
                            credentials: "same-origin",
                            body: new URLSearchParams(params)
                        });
                        var json = await resp.json();
                        return json;
                    } catch(e) {
                        lastMsg = e && e.message ? e.message : "Network error";
                        if (i < maxRetries) {
                            await new Promise(function(r){ setTimeout(r, 200 * (i + 1)); });
                        }
                    }
                }
                return { success: false, data: { message: lastMsg } };
            };
        ', 'before');

        // Dispatch ADTDataReady event after localization
        wp_add_inline_script('adt-utils', '
            (function() {
                if (typeof ADTData !== "undefined" && ADTData.nonce) {
                    window.adtDebug("✅ ADTData initialized with nonce:", ADTData.nonce.substring(0, 10) + "...");
                    document.dispatchEvent(new Event("ADTDataReady"));
                } else {
                    console.error("[ADT] ❌ ADTData.nonce is missing - AJAX requests will fail!");
                }
            })();
        ', 'after');
    } else {
        if (function_exists('adt_debug_log')) {
            adt_debug_log('❌ Missing critical asset: adt-utils.js');
        }
        return; // Don't load other scripts if utils is missing
    }

	// STEP 2. Register dependent scripts
	$scripts = [
	    'adt-admin-ajax' => [
	        'file' => 'adt-admin-ajax.js',
	        'deps' => ['adt-utils']
	    ],
	    'adt-event-mapping' => [
	        'file' => 'adt-event-mapping.js',
	        'deps' => ['adt-utils']
	    ],
	];

    // Event Mapping page conditional - use enhanced version
    $adt_admin_page = isset( $_GET['page'] ) ? sanitize_text_field( wp_unslash( $_GET['page'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
    if ( 'adt-event-mapping' === $adt_admin_page ) {
        $scripts['adt-event-mapping-enhanced'] = [
            'file' => 'adt-event-mapping-enhanced.js',
            'deps' => ['adt-utils']
        ];
    }
	
	// Setup Wizard (submenu under DataLayer Tracker uses hook like adt-settings_page_adt-setup-wizard).
	$is_adt_setup_wizard = (
		strpos((string) $hook, 'adt-setup-wizard') !== false
		|| $hook === 'adt-settings_page_adt-setup-wizard'
	);
	if ( $is_adt_setup_wizard ) {
		$wiz_base_url  = plugin_dir_url(dirname(__FILE__)) . 'assets/';
		$wiz_base_path = plugin_dir_path(dirname(__FILE__)) . 'assets/';
		$wiz_is_pro    = function_exists( 'adt_all_features_enabled' ) && adt_all_features_enabled();

		wp_enqueue_style(
			'adt-setup-wizard',
			$wiz_base_url . 'css/adt-setup-wizard.css',
			[],
			file_exists($wiz_base_path . 'css/adt-setup-wizard.css') ?
				filemtime($wiz_base_path . 'css/adt-setup-wizard.css') : null
		);

		wp_enqueue_script(
			'adt-setup-wizard',
			$wiz_base_url . 'js/adt-setup-wizard.js',
			['jquery', 'adt-utils'],
			file_exists($wiz_base_path . 'js/adt-setup-wizard.js') ?
				filemtime($wiz_base_path . 'js/adt-setup-wizard.js') : null,
			true
		);

		wp_localize_script('adt-setup-wizard', 'adtWizard', [
			'nonce'            => wp_create_nonce('adt_admin_action'),
			'settingsUrl'      => admin_url('admin.php?page=adt-settings'),
			'dashboardUrl'     => admin_url('admin.php?page=adt-settings'),
			'docsUrl'          => 'https://datalayer-tracker.com/knowledge-base/',
			'isPro'            => $wiz_is_pro ? '1' : '0',
			'pricingUrl'       => admin_url('admin.php?page=adt-pricing'),
			'customerAreaUrl'  => admin_url('admin.php?page=adt-settings-account'),
		]);

		$wiz_free_js = $wiz_base_path . 'js/adt-setup-wizard-free-flow.js';
		if ( ! $wiz_is_pro && file_exists($wiz_free_js) ) {
			wp_enqueue_script(
				'adt-setup-wizard-free-flow',
				$wiz_base_url . 'js/adt-setup-wizard-free-flow.js',
				['adt-setup-wizard'],
				filemtime($wiz_free_js),
				true
			);
		}
	}

    // STEP 3: Register and enqueue all scripts
    foreach ($scripts as $handle => $meta) {
        $file_path = $base_path . $meta['file'];
        if (file_exists($file_path)) {
            wp_register_script(
                $handle,
                $base_url . $meta['file'],
                $meta['deps'],
                filemtime($file_path),
                true
            );
            wp_enqueue_script($handle);
        } else {
            if (function_exists('adt_debug_log')) {
                adt_debug_log("❌ Missing admin asset: {$meta['file']}");
            }
        }
    }

    // Feature carousel dismiss/cycle — only needed on the main settings page.
    if ( strpos( $hook, 'adt-settings' ) !== false || $hook === 'toplevel_page_adt-settings' ) {
        $carousel_nonce = wp_create_nonce( 'adt_carousel_action' );
        wp_add_inline_script( 'jquery', '(function($){"use strict";
$(document).on("click","#adt-dismiss-carousel",function(){
    var dur=$("#adt-dismiss-duration").val();
    $.post(ajaxurl,{action:"adt_dismiss_feature_carousel",duration:dur,security:' . wp_json_encode( $carousel_nonce ) . '},function(){$(".adt-feature-carousel").fadeOut();});
});
$(document).on("click",".adt-feature-nav",function(e){
    e.preventDefault();
    var dir=$(this).data("direction");
    var $c=$(".adt-feature-carousel");
    $c.css("opacity","0.5");
    $.post(ajaxurl,{action:"adt_cycle_feature",direction:dir,security:' . wp_json_encode( $carousel_nonce ) . '},function(r){
        if(r.success&&r.data&&r.data.html){$c.fadeOut(200,function(){$(this).replaceWith(r.data.html);$(".adt-feature-carousel").hide().fadeIn(200);});}
        else{$c.css("opacity","1");}
    }).fail(function(){$c.css("opacity","1");});
});
})(jQuery);', 'after' );
    }

    // Field mapping debug toggle — only needed on the field mapping page.
    if ( strpos( $hook, 'adt-field-mapping' ) !== false ) {
        wp_add_inline_script( 'adt-utils', '
        document.addEventListener("DOMContentLoaded", function() {
            var dbgBtn  = document.getElementById("adt-debug-fields-btn");
            var dbgPane = document.getElementById("adt-debug-fields-output");
            if (dbgBtn && dbgPane) {
                dbgBtn.addEventListener("click", function() {
                    var open = dbgPane.style.display === "block";
                    dbgPane.style.display = open ? "none" : "block";
                    var slotId = "adt-last-form-snapshot";
                    var slot = document.getElementById(slotId);
                    if (!slot) {
                        slot = document.createElement("pre");
                        slot.id = slotId;
                        slot.style.marginTop = "1em";
                        dbgPane.appendChild(slot);
                    }
                    try {
                        var json = localStorage.getItem("adt_last_form_submit");
                        slot.textContent = json
                            ? "\uD83D\uDD0D Last form_submit payload\n" + json
                            : "No form_submit events captured in this browser yet.";
                    } catch (err) {
                        slot.textContent = "Unable to read localStorage: " + err;
                    }
                });
            }
        });
        ', 'after' );
    }
}

/**
 * @deprecated 1.2.6 Use adt_enqueue_assets().
 * @param string $hook Admin screen hook suffix.
 * @return void
 */
function enqueue_adt_assets( $hook ) {
	adt_enqueue_assets( $hook );
}