<?php
/**
 * DataLayer Tracker - Configuration Presets
 * 
 * @package    DataLayer_Tracker
 * @subpackage Admin
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
if (!defined('ABSPATH')) exit;

/**
 * Get all available presets
 */
function adt_get_presets() {
    return [
        'essential' => [
            'name' => __('Essential Tracking', 'brandmeetscode-datalayer-tracker'),
            'description' => __('Perfect for blogs, portfolios, and simple websites', 'brandmeetscode-datalayer-tracker'),
            'icon' => '📝',
            'events_per_session' => '5-10',
            'difficulty' => 'beginner',
            'settings' => [
                'include_scroll_depth' => '1',
                'scroll_event_mode' => 'depth',
                'include_active_time' => '1',
                'include_focus_blur' => '1',
                'formVendorTracking' => '1',
                'formVendorTracking_mode' => 'map',
                'include_page_type' => '1',
                'include_post_id' => '1',
                'include_page_title' => '1',
                'include_page_url' => '1',
                'include_slug' => '1',
                'include_user' => '1',
                'include_referrer' => '1',
                'include_utm' => '1',
                'include_screen_resolution' => '1',
                'include_browser_lang' => '1',
                'delay_until_consent' => '1',
                'debug_mode' => '0',
                'debug_level' => 'quiet',
                'export_gtm_enabled' => '1'
            ]
        ],
        'publisher' => [
            'name' => __('Content Publisher', 'brandmeetscode-datalayer-tracker'),
            'description' => __('News sites, blogs, and content-heavy websites', 'brandmeetscode-datalayer-tracker'),
            'icon' => '📰',
            'requires_pro' => true,
            'events_per_session' => '15-25',
            'difficulty' => 'intermediate',
            'settings' => [
                'include_scroll_depth' => '1',
                'scroll_event_mode' => 'depth',
                'include_scroll_back_up' => '1',
                'include_active_time' => '1',
                'include_time_on_page' => '1',
                'include_focus_blur' => '1',
                'include_video_progress' => '1',
                'include_hover_intent' => '1',
                'include_content_intelligence' => '1',
                'include_last_engaged_section' => '1',
                'include_last_content_type_viewed' => '1',
                'formVendorTracking' => '1',
                'formVendorTracking_mode' => 'map',
                'include_page_type' => '1',
                'include_post_id' => '1',
                'include_page_title' => '1',
                'include_page_url' => '1',
                'include_slug' => '1',
                'include_path' => '1',
                'include_categories' => '1',
                'include_tags' => '1',
                'include_user' => '1',
                'include_referrer' => '1',
                'include_utm' => '1',
                'include_screen_resolution' => '1',
                'include_browser_lang' => '1',
                'include_timezone_offset' => '1',
                'delay_until_consent' => '1',
                'debug_mode' => '0',
                'debug_level' => 'quiet',
                'export_gtm_enabled' => '1'
            ]
        ],
        'leadgen' => [
            'name' => __('Lead Generation', 'brandmeetscode-datalayer-tracker'),
            'description' => __('B2B SaaS, agencies, and lead-focused businesses', 'brandmeetscode-datalayer-tracker'),
            'icon' => '🎯',
            'requires_pro' => true,
            'events_per_session' => '20-30',
            'difficulty' => 'intermediate',
            'settings' => [
                'include_scroll_depth' => '1',
                'scroll_event_mode' => 'depth',
                'include_active_time' => '1',
                'include_time_on_page' => '1',
                'include_focus_blur' => '1',
                'include_hover_intent' => '1',
                'include_cta_exposure' => '1',
                'include_content_intelligence' => '1',
                'formVendorTracking' => '1',
                'formVendorTracking_mode' => 'map',
                'include_field_tracking' => '1',
                'track_default_clicks' => '1',
                'include_click_metadata' => '1',
                'include_page_type' => '1',
                'include_post_id' => '1',
                'include_page_title' => '1',
                'include_page_url' => '1',
                'include_slug' => '1',
                'include_path' => '1',
                'include_user' => '1',
                'include_user_hash' => '1',
                'user_hash_mode' => 'sha256',
                'include_referrer' => '1',
                'include_utm' => '1',
                'include_cookies' => '1',
                'cookieMatchRegex' => '^(utm_|ga|adt_|_gcl_|_fbp)',
                'include_screen_resolution' => '1',
                'include_browser_lang' => '1',
                'include_timezone_offset' => '1',
                'delay_until_consent' => '1',
                'debug_mode' => '0',
                'debug_level' => 'quiet',
                'export_gtm_enabled' => '1'
            ]
        ],
        'ecommerce' => [
            'name' => __('E-Commerce', 'brandmeetscode-datalayer-tracker'),
            'description' => __('WooCommerce stores with product catalogs', 'brandmeetscode-datalayer-tracker'),
            'icon' => '🛒',
            'requires_pro' => true,
            'events_per_session' => '30-50',
            'difficulty' => 'advanced',
            'settings' => [
                'include_scroll_depth' => '1',
                'scroll_event_mode' => 'depth',
                'include_active_time' => '1',
                'include_hover_intent' => '1',
                'formVendorTracking' => '1',
                'formVendorTracking_mode' => 'map',
                'enable_ecommerce_tracking' => '1',
                'include_ecommerce_view_item' => '1',
                'include_ecommerce_add_to_cart' => '1',
                'include_ecommerce_view_cart' => '1',
                'include_ecommerce_begin_checkout' => '1',
                'include_ecommerce_checkout_step' => '1',
                'include_ecommerce_purchase' => '1',
                'include_ga4_item_metadata' => '1',
                'track_default_clicks' => '1',
                'include_page_type' => '1',
                'include_post_id' => '1',
                'include_page_title' => '1',
                'include_page_url' => '1',
                'include_slug' => '1',
                'include_user' => '1',
                'include_user_hash' => '1',
                'user_hash_mode' => 'sha256',
                'include_referrer' => '1',
                'include_utm' => '1',
                'include_cookies' => '1',
                'cookieMatchRegex' => '^(utm_|ga|adt_|_gcl_|_fbp|woocommerce_)',
                'include_screen_resolution' => '1',
                'include_browser_lang' => '1',
                'delay_until_consent' => '1',
                'debug_mode' => '0',
                'debug_level' => 'quiet',
                'export_gtm_enabled' => '1'
            ]
        ],
        'marketing' => [
            'name' => __('Performance Marketing', 'brandmeetscode-datalayer-tracker'),
            'description' => __('Sites with paid ads and pixel integration', 'brandmeetscode-datalayer-tracker'),
            'icon' => '📊',
            'requires_pro' => true,
            'events_per_session' => '50+',
            'difficulty' => 'advanced',
            'settings' => [
                'include_scroll_depth' => '1',
                'scroll_event_mode' => 'depth',
                'include_scroll_back_up' => '1',
                'include_active_time' => '1',
                'include_time_on_page' => '1',
                'include_focus_blur' => '1',
                'include_hover_intent' => '1',
                'include_cta_exposure' => '1',
                'include_content_intelligence' => '1',
                'include_last_engaged_section' => '1',
                'include_video_progress' => '1',
                'formVendorTracking' => '1',
                'formVendorTracking_mode' => 'map',
                'include_field_tracking' => '1',
                'enable_ecommerce_tracking' => '1',
                'include_ecommerce_view_item' => '1',
                'include_ecommerce_add_to_cart' => '1',
                'include_ecommerce_view_cart' => '1',
                'include_ecommerce_begin_checkout' => '1',
                'include_ecommerce_purchase' => '1',
                'pixel_tracking_enabled' => '1',
                'pixel_dispatch_mode' => 'plugin_only',
                'dual_pixel_mode' => '0',
                'track_default_clicks' => '1',
                'include_click_metadata' => '1',
                'include_page_type' => '1',
                'include_post_id' => '1',
                'include_page_title' => '1',
                'include_page_url' => '1',
                'include_slug' => '1',
                'include_path' => '1',
                'include_categories' => '1',
                'include_tags' => '1',
                'include_user' => '1',
                'include_user_hash' => '1',
                'user_hash_mode' => 'sha256',
                'include_referrer' => '1',
                'include_utm' => '1',
                'include_cookies' => '1',
                'cookieMatchRegex' => '^(utm_|ga|adt_|_gcl_|_fbp|_tt_|_pin_|sbjs_)',
                'include_screen_resolution' => '1',
                'include_browser_lang' => '1',
                'include_timezone_offset' => '1',
                'delay_until_consent' => '1',
                'debug_mode' => '0',
                'debug_level' => 'quiet',
                'export_gtm_enabled' => '1',
                'include_ga4_item_metadata' => '1'
            ]
        ],
        'gdpr' => [
            'name' => __('GDPR Strict', 'brandmeetscode-datalayer-tracker'),
            'description' => __('Privacy-first configuration for EU compliance', 'brandmeetscode-datalayer-tracker'),
            'icon' => '🔒',
            'events_per_session' => '10-20',
            'difficulty' => 'intermediate',
            'settings' => [
                'include_scroll_depth' => '1',
                'scroll_event_mode' => 'depth',
                'include_active_time' => '1',
                'include_focus_blur' => '1',
                'formVendorTracking' => '1',
                'formVendorTracking_mode' => 'map',
                'include_page_type' => '1',
                'include_page_title' => '1',
                'include_slug' => '1',
                'include_user' => '0',
                'include_user_hash' => '0',
                'user_hash_mode' => 'none',
                'include_referrer' => '1',
                'include_utm' => '1',
                'include_cookies' => '0',
                'include_screen_resolution' => '1',
                'include_browser_lang' => '1',
                'delay_until_consent' => '1',
                'fallback_track_without_cmp' => '0',
                'enforce_tcf_for_multiple_platforms' => '1',
                'preferred_cmp' => 'auto',
                'cmp_detection_timeout' => '5',
                'debug_mode' => '0',
                'debug_level' => 'quiet',
                'export_gtm_enabled' => '1'
            ]
        ],
		/**
		 * ADD THIS PRESET TO THE adt_get_presets() FUNCTION
		 * Insert after the 'gdpr' preset and before the closing ];
		 */

		'custom_events' => [
		    'name' => __('Custom Events & Tracking', 'brandmeetscode-datalayer-tracker'),
		    'description' => __('Template for sites with custom business events and milestones', 'brandmeetscode-datalayer-tracker'),
		    'icon' => '⚡',
		    'requires_pro' => true,
		    'events_per_session' => '15-30',
		    'difficulty' => 'advanced',
		    'settings' => [
		        // Basic tracking
		        'include_scroll_depth' => '1',
		        'scroll_event_mode' => 'depth',
		        'include_active_time' => '1',
		        'include_focus_blur' => '1',
        
		        // Forms and clicks
		        'formVendorTracking' => '1',
		        'formVendorTracking_mode' => 'map',
		        'track_default_clicks' => '1',
		        'include_click_metadata' => '1',
        
		        // Custom event examples
		        'custom_events_json' => '[
		  {
		    "event": "user_registered",
		    "user_type": "subscriber",
		    "registration_source": "homepage",
		    "value": 5
		  },
		  {
		    "event": "content_download",
		    "file_type": "pdf",
		    "category": "whitepaper",
		    "content_name": "Getting Started Guide"
		  },
		  {
		    "event": "newsletter_signup",
		    "list_name": "weekly_digest",
		    "source": "blog_sidebar"
		  },
		  {
		    "event": "feature_interaction",
		    "feature_name": "pricing_calculator",
		    "interaction_type": "engaged"
		  },
		  {
		    "event": "custom_milestone",
		    "milestone_type": "engagement",
		    "milestone_name": "power_user",
		    "threshold": 60
		  }
		]',
        
		        // Page context
		        'include_page_type' => '1',
		        'include_post_id' => '1',
		        'include_page_title' => '1',
		        'include_page_url' => '1',
		        'include_slug' => '1',
		        'include_path' => '1',
        
		        // User tracking
		        'include_user' => '1',
		        'include_user_hash' => '1',
		        'user_hash_mode' => 'sha256',
        
		        // Attribution
		        'include_referrer' => '1',
		        'include_utm' => '1',
        
		        // Technical
		        'include_screen_resolution' => '1',
		        'include_browser_lang' => '1',
        
		        // Privacy
		        'delay_until_consent' => '1',
        
		        // Debug
		        'debug_mode' => '0',
		        'debug_level' => 'quiet',
        
		        // GTM
		        'export_gtm_enabled' => '1'
		    ]
		],

		/**
		 * ALSO ADD THE DEBUG PRESET (which was missing from the PHP file)
		 */
		'debug' => [
		    'name' => __('Debug & Testing', 'brandmeetscode-datalayer-tracker'),
		    'description' => __('Development environment with verbose logging - DO NOT USE IN PRODUCTION', 'brandmeetscode-datalayer-tracker'),
		    'icon' => '🔧',
		    'requires_pro' => true,
		    'events_per_session' => '100+',
		    'difficulty' => 'advanced',
		    'settings' => [
		        'include_scroll_depth' => '1',
		        'scroll_event_mode' => 'depth',
		        'include_scroll_back_up' => '1',
		        'include_active_time' => '1',
		        'include_time_on_page' => '1',
		        'include_focus_blur' => '1',
		        'include_hover_intent' => '1',
		        'include_cta_exposure' => '1',
		        'include_content_intelligence' => '1',
		        'include_video_progress' => '1',
		        'formVendorTracking' => '1',
		        'formVendorTracking_mode' => 'map',
		        'include_field_tracking' => '1',
		        'track_default_clicks' => '1',
		        'include_click_metadata' => '1',
		        'enable_ecommerce_tracking' => '1',
		        'include_page_type' => '1',
		        'include_post_id' => '1',
		        'include_page_title' => '1',
		        'include_page_url' => '1',
		        'include_slug' => '1',
		        'include_path' => '1',
		        'include_template' => '1',
		        'include_user' => '1',
		        'include_user_hash' => '1',
		        'include_wp_flags' => '1',
		        'include_categories' => '1',
		        'include_tags' => '1',
		        'include_referrer' => '1',
		        'include_utm' => '1',
		        'include_cookies' => '1',
		        'cookieMatchRegex' => '.*',
		        'include_screen_resolution' => '1',
		        'include_browser_lang' => '1',
		        'include_timezone_offset' => '1',
		        'delay_until_consent' => '0',
		        'debug_mode' => '1',
		        'debug_level' => 'verbose',
		        'enable_debug_overlay' => '1',
		        'overlay_min_role' => 'editor',
		        'set_dataLayerBlocked_flag' => '1',
		        'show_blocked_events_overlay' => '1',
		        'export_gtm_enabled' => '1'
		    ]
		]
    ];
}

/**
 * Catalog presets from adt_get_presets() that require the Pro add-on to apply.
 *
 * @param string $preset_id Preset key (e.g. ecommerce, publisher).
 */
function adt_preset_catalog_requires_pro( $preset_id ) {
    $all = adt_get_presets();
    return ! empty( $all[ $preset_id ]['requires_pro'] );
}

/**
 * Setup Wizard step-2 presets (recommended / ecommerce / content / minimal).
 *
 * @param string $slug config_preset value.
 */
function adt_wizard_builtin_preset_requires_pro( $slug ) {
    return in_array( $slug, [ 'ecommerce', 'content' ], true );
}

/**
 * Render the presets page
 */
function adt_render_presets_page() {
    if (!current_user_can('manage_options')) {
        wp_die(esc_html__('You do not have sufficient permissions to access this page.', 'brandmeetscode-datalayer-tracker'));
    }
    
    $presets = adt_get_presets();
    $current_settings = get_option('adt_settings', []);
    $adt_pricing_url   = admin_url( 'admin.php?page=adt-pricing' );
    ?>
    
    <div class="wrap adt-presets-page" style="border: 1px solid #dfe4ec;">
        <!-- Empty h1 for WordPress admin notices to latch onto -->
        <h1 style="display: none;"></h1>
		
			<div class="adt-wizard-header">
                <div class="adt-header-content">
                    <h2 class="adt-wizard-title"><?php echo esc_html__('Configuration Presets', 'brandmeetscode-datalayer-tracker'); ?></h2>
                    <p class="adt-wizard-subtitle"><?php echo esc_html__('Choose a preset configuration to quickly set up tracking for your use case. You can customize settings after applying a preset.', 'brandmeetscode-datalayer-tracker'); ?></p>
                </div>
            </div>
		<div class="adt-wizard-container" style="padding: 0 30px 30px  30px;">
	        <div class="adt-info-box" style="margin: 20px 0; padding: 16px 20px; background: #f0f6fc; border: 1px solid #c3dafe; border-radius: 6px; border-left: 4px solid #2271b1;">
	            <p style="margin: 0; font-size: 14px; color: #2d3748;">
	                <span class="dashicons dashicons-info" style="color: #2271b1; vertical-align: middle;"></span>
	                <strong>First time here?</strong> 
	                Try the <a href="<?php echo esc_url(admin_url('admin.php?page=adt-setup-wizard')); ?>" style="color: #2271b1; text-decoration: none; font-weight: 500;">Setup Wizard</a> 
	                for guided configuration with our most popular presets.
	            </p>
	        </div>
        
	        <div class="adt-presets-grid">
	            <?php foreach ($presets as $preset_id => $preset): ?>
	                <?php
	                $preset_needs_pro = false; // All presets are available in the free build.
	                $preset_locked    = false;
	                ?>
	                <div class="adt-preset-card<?php echo esc_attr( ( $preset_locked ? ' adt-preset-card-locked' : '' ) . ( $preset_needs_pro ? ' adt-preset-card-pro' : '' ) ); ?>" data-preset="<?php echo esc_attr( $preset_id ); ?>">
	                    <div class="preset-header">
	                        <div class="preset-icon"><?php echo esc_html( $preset['icon'] ); ?></div>
	                        <h3><?php echo esc_html($preset['name']); ?></h3>
	                        <?php if ( $preset_needs_pro ) : ?>
	                            <span class="adt-preset-pro-badge"><?php echo esc_html__( 'Pro', 'brandmeetscode-datalayer-tracker' ); ?></span>
	                        <?php endif; ?>
	                    </div>
                    
	                    <p class="preset-description"><?php echo esc_html($preset['description']); ?></p>
                    
	                    <div class="preset-meta">
	                        <div class="meta-item">
	                            <span class="meta-label"><?php echo esc_html__('Events:', 'brandmeetscode-datalayer-tracker'); ?></span>
	                            <span class="meta-value"><?php echo esc_html($preset['events_per_session']); ?></span>
	                        </div>
	                        <div class="meta-item">
	                            <span class="meta-label"><?php echo esc_html__('Level:', 'brandmeetscode-datalayer-tracker'); ?></span>
	                            <span class="meta-value meta-<?php echo esc_attr($preset['difficulty']); ?>">
	                                <?php echo esc_html(ucfirst($preset['difficulty'])); ?>
	                            </span>
	                        </div>
	                    </div>
                    
	                    <div class="preset-actions">
	                        <button type="button" 
	                                class="button button-secondary adt-preview-preset" 
	                                data-preset="<?php echo esc_attr($preset_id); ?>">
	                            <?php echo esc_html__('Preview Changes', 'brandmeetscode-datalayer-tracker'); ?>
	                        </button>
	                        <?php if ( $preset_locked ) : ?>
	                            <a class="button button-primary adt-apply-preset-pro-cta" href="<?php echo esc_url( $adt_pricing_url ); ?>">
	                                <?php echo esc_html__( 'Get Pro add-on', 'brandmeetscode-datalayer-tracker' ); ?>
	                            </a>
	                        <?php else : ?>
	                        <button type="button" 
	                                class="button button-primary adt-apply-preset" 
	                                data-preset="<?php echo esc_attr($preset_id); ?>">
	                            <?php echo esc_html__('Apply Preset', 'brandmeetscode-datalayer-tracker'); ?>
	                        </button>
	                        <?php endif; ?>
	                    </div>
	                </div>
	            <?php endforeach; ?>
	        </div>
		</div>
        
        <!-- Preview Modal -->
        <div id="adt-preset-preview-modal" class="adt-modal" style="display: none;">
            <div class="adt-modal-overlay"></div>
            <div class="adt-modal-content">
                <div class="adt-modal-header">
                    <h2><?php echo esc_html__('Preview Preset Changes', 'brandmeetscode-datalayer-tracker'); ?></h2>
                    <button type="button" class="adt-modal-close">&times;</button>
                </div>
                <div class="adt-modal-body">
                    <div id="adt-preset-preview-content"></div>
                </div>
				<div class="adt-modal-footer">
				    <button type="button" class="button button-secondary adt-modal-close" style="min-width: 100px; white-space: nowrap;">
				        <?php echo esc_html__('Cancel', 'brandmeetscode-datalayer-tracker'); ?>
				    </button>
				    <button type="button" class="button button-primary" id="adt-confirm-apply-preset" style="white-space: nowrap;">
				        <?php echo esc_html__('Apply This Preset', 'brandmeetscode-datalayer-tracker'); ?>
				    </button>
				</div>
            </div>
        </div>
    </div>

    
    <?php
    wp_add_inline_script(
        'jquery',
        adt_capture_inline_script(
            static function () use ( $presets, $current_settings, $adt_pricing_url ) {
                ?>
    jQuery(document).ready(function($) {
        const presets = <?php echo wp_json_encode( $presets ); ?>;
        const currentSettings = <?php echo wp_json_encode( $current_settings ); ?>;
        const adtPresetUi = {
            isPro: true,
            pricingUrl: <?php echo wp_json_encode( $adt_pricing_url ); ?>
        };
        let selectedPresetId = null;
        
        // Preview preset
        $('.adt-preview-preset').on('click', function() {
            const presetId = $(this).data('preset');
            selectedPresetId = presetId;
            const preset = presets[presetId];
            
            // Generate preview HTML
            let changesHtml = '<h3>' + preset.name + '</h3>';
            changesHtml += '<p>' + preset.description + '</p>';
            changesHtml += '<h4><?php echo esc_js(__('Changes that will be applied:', 'brandmeetscode-datalayer-tracker')); ?></h4>';
            changesHtml += '<div class="changes-list">';
            
            let changeCount = 0;
            for (const [key, value] of Object.entries(preset.settings)) {
                const currentValue = currentSettings[key] || '0';
                if (currentValue != value) {
                    changeCount++;
                    const isEnable = value === '1' || value === 1;
                    const changeClass = isEnable ? 'will-enable' : 'will-disable';
                    const action = isEnable ? '<?php echo esc_js(__('Enable', 'brandmeetscode-datalayer-tracker')); ?>' : '<?php echo esc_js(__('Disable', 'brandmeetscode-datalayer-tracker')); ?>';
                    changesHtml += `<div class="change-item ${changeClass}">`;
                    changesHtml += `<div class="change-label">${action}: ${key}</div>`;
                    changesHtml += `<div class="change-value">${currentValue} → ${value}</div>`;
                    changesHtml += '</div>';
                }
            }
            
            if (changeCount === 0) {
                changesHtml += '<p><em><?php echo esc_js(__('No changes needed - your current settings match this preset.', 'brandmeetscode-datalayer-tracker')); ?></em></p>';
            }
            
            changesHtml += '</div>';
            
            $('#adt-preset-preview-content').html(changesHtml);
            $('#adt-preset-preview-modal').fadeIn(200);

            const sel = presets[presetId];
            const locked = sel && sel.requires_pro && !adtPresetUi.isPro;
            const $apply = $('#adt-confirm-apply-preset');
            if (locked) {
                $apply.prop('disabled', true).text('<?php echo esc_js( __( 'Pro add-on required', 'brandmeetscode-datalayer-tracker' ) ); ?>');
            } else {
                $apply.prop('disabled', false).text('<?php echo esc_js( __( 'Apply This Preset', 'brandmeetscode-datalayer-tracker' ) ); ?>');
            }
        });
        
        // Apply preset directly
        $('.adt-apply-preset').on('click', function() {
            if (!confirm('<?php echo esc_js(__('Apply this preset? Your current settings will be overwritten.', 'brandmeetscode-datalayer-tracker')); ?>')) {
                return;
            }
            
            const presetId = $(this).data('preset');
            applyPreset(presetId);
        });
        
        // Apply from preview modal
        $('#adt-confirm-apply-preset').on('click', function() {
            if (selectedPresetId) {
                const p = presets[selectedPresetId];
                if (p && p.requires_pro && !adtPresetUi.isPro) {
                    window.location.href = adtPresetUi.pricingUrl;
                    return;
                }
                applyPreset(selectedPresetId);
                $('#adt-preset-preview-modal').fadeOut(200);
            }
        });
        
        // Close modal
        $('.adt-modal-close, .adt-modal-overlay').on('click', function() {
            $('#adt-preset-preview-modal').fadeOut(200);
        });
        
        // Apply preset function
        function applyPreset(presetId) {
            const preset = presets[presetId];
            if (preset && preset.requires_pro && !adtPresetUi.isPro) {
                window.location.href = adtPresetUi.pricingUrl;
                return;
            }
            const $button = $('.adt-apply-preset[data-preset="' + presetId + '"]');
            
            $button.prop('disabled', true).text('<?php echo esc_js(__('Applying...', 'brandmeetscode-datalayer-tracker')); ?>');
            
            $.ajax({
                url: ajaxurl,
                method: 'POST',
                data: {
                    action: 'adt_apply_preset',
                    preset_id: presetId,
                    security: '<?php echo esc_js( wp_create_nonce( 'adt_apply_preset' ) ); ?>'
                },
                success: function(response) {
                    if (response.success) {
                        alert('<?php echo esc_js(__('Preset applied successfully!', 'brandmeetscode-datalayer-tracker')); ?>');
                        location.reload();
                    } else {
                        alert('<?php echo esc_js(__('Error applying preset: ', 'brandmeetscode-datalayer-tracker')); ?>' + response.data);
                        $button.prop('disabled', false).text('<?php echo esc_js(__('Apply Preset', 'brandmeetscode-datalayer-tracker')); ?>');
                    }
                },
                error: function() {
                    alert('<?php echo esc_js(__('AJAX error applying preset', 'brandmeetscode-datalayer-tracker')); ?>');
                    $button.prop('disabled', false).text('<?php echo esc_js(__('Apply Preset', 'brandmeetscode-datalayer-tracker')); ?>');
                }
            });
        }
    });
                <?php
            }
        ),
        'after'
    );
    ?>

    
    <?php
}

/**
 * AJAX handler to apply a preset
 */
add_action('wp_ajax_adt_apply_preset', 'adt_apply_preset_ajax');
function adt_apply_preset_ajax() {
    check_ajax_referer('adt_apply_preset', 'security');
    
    if (!current_user_can('manage_options')) {
        wp_send_json_error(__('Insufficient permissions', 'brandmeetscode-datalayer-tracker'));
    }
    
    $preset_id = isset( $_POST['preset_id'] ) ? sanitize_text_field( wp_unslash( $_POST['preset_id'] ) ) : '';
    $presets = adt_get_presets();
    
    if (!isset($presets[$preset_id])) {
        wp_send_json_error(__('Invalid preset ID', 'brandmeetscode-datalayer-tracker'));
    }
    
    $preset = $presets[$preset_id];

    if ( ! empty( $preset['requires_pro'] ) && ( ! function_exists( 'adt_all_features_enabled' ) || ! adt_all_features_enabled() ) ) {
        wp_send_json_error( __( 'This preset requires the Pro add-on.', 'brandmeetscode-datalayer-tracker' ) );
    }
    
    $current_settings = get_option('adt_settings', []);
    
    // Merge preset settings with current settings
    $new_settings = array_merge($current_settings, $preset['settings']);
    
    // Update settings
    update_option('adt_settings', $new_settings);
    
    wp_send_json_success([
        'message' => sprintf(
            /* translators: %s: Preset display name. */
            __('Preset "%s" applied successfully', 'brandmeetscode-datalayer-tracker'),
            esc_html( $preset['name'] )
        )
    ]);
}