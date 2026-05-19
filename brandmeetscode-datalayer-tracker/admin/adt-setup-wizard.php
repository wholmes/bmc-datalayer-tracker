<?php
/**
 * ADT Setup Wizard
 * 
 * A comprehensive setup wizard that guides users through configuring
 * DataLayer Tracker with intelligent defaults and optional customization.
 * 
 * @package AdvancedDataLayerTracker
 * @since 1.3.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Render the Setup Wizard page
 */
function adt_render_setup_wizard() {
    // Scripts/styles load on admin_enqueue_scripts (see admin/adt-admin-assets.php).
    ?>
    <div class="wrap adt-setup-wizard">
        <!-- Empty h1 for WordPress admin notices to latch onto -->
        <h1 style="display: none;"></h1>
        
        <div class="adt-wizard-container">
            
            <!-- Header -->
            <div class="adt-wizard-header">
                <div class="adt-header-content">
                    <h2 class="adt-wizard-title">Setup Wizard</h2>
                    <p class="adt-wizard-subtitle">Let's configure your tracking in just a few minutes</p>
                </div>
            </div>
            
            <!-- Progress Bar -->
            <div class="adt-wizard-progress">
                <div class="adt-progress-bar">
                    <div class="adt-progress-fill" data-progress="0"></div>
                </div>
                <div class="adt-progress-steps">
                    <div class="adt-step-indicator active" data-step="1">
                        <span class="step-number">1</span>
                        <span class="step-label">Welcome</span>
                    </div>
                    <div class="adt-step-indicator" data-step="2">
                        <span class="step-number">2</span>
                        <span class="step-label">Configuration</span>
                    </div>
                    <div class="adt-step-indicator" data-step="3">
                        <span class="step-number">3</span>
                        <span class="step-label">Tracking</span>
                    </div>
                    <div class="adt-step-indicator" data-step="4">
                        <span class="step-number">4</span>
                        <span class="step-label">GTM Setup</span>
                    </div>
                    <div class="adt-step-indicator" data-step="5">
                        <span class="step-number">5</span>
                        <span class="step-label">Consent</span>
                    </div>
                    <div class="adt-step-indicator" data-step="6">
                        <span class="step-number">6</span>
                        <span class="step-label">Review</span>
                    </div>
                </div>
            </div>

            <!-- Wizard Content -->
            <div class="adt-wizard-content">
                
                <!-- Step 1: Welcome -->
                <div class="adt-wizard-step active" data-step="1">
                    <div class="adt-step-header">
                        <h1>Welcome to DataLayer Tracker</h1>
                        <p class="adt-step-description">
                            Let's get your tracking set up in just a few minutes. This wizard will help you configure the plugin based on your needs.
                        </p>
                    </div>
                    
                    <div class="adt-step-content">
                        <div class="adt-welcome-content">
                            <div class="adt-feature-grid" style="grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 30px 0;">
                                <div class="adt-feature-item" style="text-align: left; display: flex; align-items: flex-start; gap: 12px; padding: 16px 20px;">
                                    <span class="dashicons dashicons-chart-area" style="font-size: 28px; width: 28px; height: 28px; flex-shrink: 0; margin: 0;"></span>
                                    <div>
                                        <h3 style="margin: 0 0 4px;"><?php esc_html_e( 'Enhanced Tracking', 'brandmeetscode-datalayer-tracker' ); ?></h3>
                                        <p style="margin: 0;"><?php esc_html_e( 'Scroll depth, video views, hover intent, and engagement signals', 'brandmeetscode-datalayer-tracker' ); ?></p>
                                    </div>
                                </div>
                                <div class="adt-feature-item" style="text-align: left; display: flex; align-items: flex-start; gap: 12px; padding: 16px 20px;">
                                    <span class="dashicons dashicons-shield" style="font-size: 28px; width: 28px; height: 28px; flex-shrink: 0; margin: 0;"></span>
                                    <div>
                                        <h3 style="margin: 0 0 4px;"><?php esc_html_e( 'Privacy First', 'brandmeetscode-datalayer-tracker' ); ?></h3>
                                        <p style="margin: 0;"><?php esc_html_e( 'Built-in consent management and GDPR compliance', 'brandmeetscode-datalayer-tracker' ); ?></p>
                                    </div>
                                </div>
                                <div class="adt-feature-item" style="text-align: left; display: flex; align-items: flex-start; gap: 12px; padding: 16px 20px;">
                                    <span class="dashicons dashicons-networking" style="font-size: 28px; width: 28px; height: 28px; flex-shrink: 0; margin: 0;"></span>
                                    <div>
                                        <h3 style="margin: 0 0 4px;"><?php esc_html_e( 'E-commerce Ready', 'brandmeetscode-datalayer-tracker' ); ?></h3>
                                        <p style="margin: 0;"><?php esc_html_e( 'Full WooCommerce event tracking out of the box', 'brandmeetscode-datalayer-tracker' ); ?></p>
                                    </div>
                                </div>
                                <div class="adt-feature-item" style="text-align: left; display: flex; align-items: flex-start; gap: 12px; padding: 16px 20px;">
                                    <span class="dashicons dashicons-tag" style="font-size: 28px; width: 28px; height: 28px; flex-shrink: 0; margin: 0;"></span>
                                    <div>
                                        <h3 style="margin: 0 0 4px;"><?php esc_html_e( 'GTM Ready', 'brandmeetscode-datalayer-tracker' ); ?></h3>
                                        <p style="margin: 0;"><?php esc_html_e( 'Inject your GTM snippet and container ID in one step', 'brandmeetscode-datalayer-tracker' ); ?></p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="adt-setup-options">
                                <h3>How would you like to set up?</h3>
                                <div class="adt-setup-choice">
                                    <label class="adt-radio-card">
                                        <input type="radio" name="setup_mode" value="recommended" checked>
                                        <div class="adt-card-content">
                                            <span class="adt-card-icon">⚡</span>
                                            <strong>Quick Setup (Recommended)</strong>
                                            <p>Use optimized defaults for most websites. You can customize everything later.</p>
                                        </div>
                                    </label>
                                    
                                    <label class="adt-radio-card">
                                        <input type="radio" name="setup_mode" value="custom">
                                        <div class="adt-card-content">
                                            <span class="adt-card-icon">⚙️</span>
                                            <strong>Custom Setup</strong>
                                            <p>Configure each setting step-by-step to match your specific requirements.</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Step 2: Configuration Preset -->
                <div class="adt-wizard-step" data-step="2">
                    <div class="adt-step-header">
                        <h2>Choose Your Configuration</h2>
                        <p class="adt-step-description">
                            Select a preset that matches your site type, or start with our recommended settings.
                        </p>
                    </div>
                    
                    <div class="adt-step-content">
                        <div class="adt-preset-grid">
                            <label class="adt-preset-card">
                                <input type="radio" name="config_preset" value="recommended" checked>
                                <div class="adt-preset-content">
                                    <div class="adt-preset-header">
                                        <span class="adt-preset-icon">🌟</span>
                                        <h3><?php esc_html_e( 'Recommended', 'brandmeetscode-datalayer-tracker' ); ?></h3>
                                        <span class="adt-badge"><?php esc_html_e( 'Popular', 'brandmeetscode-datalayer-tracker' ); ?></span>
                                    </div>
                                    <p><?php esc_html_e( 'Balanced configuration for most websites with essential tracking enabled', 'brandmeetscode-datalayer-tracker' ); ?></p>
                                    <ul class="adt-preset-features">
                                        <li><?php esc_html_e( 'Core page tracking', 'brandmeetscode-datalayer-tracker' ); ?></li>
                                        <li><?php esc_html_e( 'User engagement metrics', 'brandmeetscode-datalayer-tracker' ); ?></li>
                                        <li><?php esc_html_e( 'Scroll & click tracking', 'brandmeetscode-datalayer-tracker' ); ?></li>
                                        <li><?php esc_html_e( 'Consent management ready', 'brandmeetscode-datalayer-tracker' ); ?></li>
                                    </ul>
                                </div>
                            </label>

                            <label class="adt-preset-card">
                                <input type="radio" name="config_preset" value="ecommerce">
                                <div class="adt-preset-content">
                                    <div class="adt-preset-header">
                                        <span class="adt-preset-icon">🛒</span>
                                        <h3><?php esc_html_e( 'E-commerce', 'brandmeetscode-datalayer-tracker' ); ?></h3>
                                    </div>
                                    <p><?php esc_html_e( 'Optimized for WooCommerce stores with full product and checkout tracking', 'brandmeetscode-datalayer-tracker' ); ?></p>
                                    <ul class="adt-preset-features">
                                        <li><?php esc_html_e( 'All recommended features', 'brandmeetscode-datalayer-tracker' ); ?></li>
                                        <li><?php esc_html_e( 'WooCommerce event tracking', 'brandmeetscode-datalayer-tracker' ); ?></li>
                                        <li><?php esc_html_e( 'Product view & add-to-cart', 'brandmeetscode-datalayer-tracker' ); ?></li>
                                        <li><?php esc_html_e( 'Cart & checkout events', 'brandmeetscode-datalayer-tracker' ); ?></li>
                                    </ul>
                                </div>
                            </label>

                            <label class="adt-preset-card">
                                <input type="radio" name="config_preset" value="minimal">
                                <div class="adt-preset-content">
                                    <div class="adt-preset-header">
                                        <span class="adt-preset-icon">⚡</span>
                                        <h3><?php esc_html_e( 'Minimal', 'brandmeetscode-datalayer-tracker' ); ?></h3>
                                    </div>
                                    <p><?php esc_html_e( 'Lightweight tracking with only essential features for maximum performance', 'brandmeetscode-datalayer-tracker' ); ?></p>
                                    <ul class="adt-preset-features">
                                        <li><?php esc_html_e( 'Basic page tracking', 'brandmeetscode-datalayer-tracker' ); ?></li>
                                        <li><?php esc_html_e( 'Essential user data', 'brandmeetscode-datalayer-tracker' ); ?></li>
                                        <li><?php esc_html_e( 'Pageview events only', 'brandmeetscode-datalayer-tracker' ); ?></li>
                                        <li><?php esc_html_e( 'Minimal overhead', 'brandmeetscode-datalayer-tracker' ); ?></li>
                                    </ul>
                                </div>
                            </label>
                        </div>
                        
                        
                        <div class="adt-custom-toggle" style="display: none;">
                            <div class="adt-notice adt-notice-info">
                                <p>
                                    <span class="dashicons dashicons-info"></span>
                                    <strong>Custom Mode:</strong> You'll be able to fine-tune specific settings in the next steps.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Step 3: Tracking Features -->
                <div class="adt-wizard-step" data-step="3">
                    <div class="adt-step-header">
                        <h2>Tracking Features</h2>
                        <p class="adt-step-description">
                            Enable or disable specific tracking features. These are already optimized based on your preset.
                        </p>
                    </div>
                    
                    <div class="adt-step-content">
                        <div class="adt-feature-sections">
                            
                            <!-- Core Tracking -->
                            <div class="adt-feature-section">
                                <h3>Core Page Tracking</h3>
                                <div class="adt-feature-list">
                                    <label class="adt-toggle-field">
                                        <input type="checkbox" name="include_page_type" checked>
                                        <span class="adt-toggle"></span>
                                        <div class="adt-field-info">
                                            <strong>Page Type</strong>
                                            <p>Track page types (home, product, category, etc.)</p>
                                        </div>
                                    </label>
                                    
                                    <label class="adt-toggle-field">
                                        <input type="checkbox" name="include_page_title" checked>
                                        <span class="adt-toggle"></span>
                                        <div class="adt-field-info">
                                            <strong>Page Title & URL</strong>
                                            <p>Include page title and URL in tracking data</p>
                                        </div>
                                    </label>
                                    
                                    <label class="adt-toggle-field">
                                        <input type="checkbox" name="include_categories" checked>
                                        <span class="adt-toggle"></span>
                                        <div class="adt-field-info">
                                            <strong>Categories & Tags</strong>
                                            <p>Track content categories and tags for better segmentation</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                            
                            <!-- Engagement Tracking -->
                            <div class="adt-feature-section">
                                <h3>User Engagement</h3>
                                <div class="adt-feature-list">
                                    <label class="adt-toggle-field">
                                        <input type="checkbox" name="include_scroll_depth" checked>
                                        <span class="adt-toggle"></span>
                                        <div class="adt-field-info">
                                            <strong>Scroll Tracking</strong>
                                            <p>Monitor how far users scroll down your pages</p>
                                        </div>
                                    </label>
                                    
                                    <label class="adt-toggle-field">
                                        <input type="checkbox" name="include_time_on_page" checked>
                                        <span class="adt-toggle"></span>
                                        <div class="adt-field-info">
                                            <strong>Time on Page</strong>
                                            <p>Track total time and active time spent on each page</p>
                                        </div>
                                    </label>
                                    
                                    <label class="adt-toggle-field">
                                        <input type="checkbox" name="include_video_progress" checked>
                                        <span class="adt-toggle"></span>
                                        <div class="adt-field-info">
                                            <strong>Video Tracking</strong>
                                            <p>Track video plays, progress, and completions</p>
                                        </div>
                                    </label>
                                    
                                    <label class="adt-toggle-field">
                                        <input type="checkbox" name="include_hover_intent" checked>
                                        <span class="adt-toggle"></span>
                                        <div class="adt-field-info">
                                            <strong>Hover Intent</strong>
                                            <p>Detect when users hover over important elements</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                            
                            <!-- E-commerce -->
                            <div class="adt-feature-section" id="ecommerce-section">
                                <h3>E-commerce Tracking</h3>
                                <div class="adt-feature-list">
                                    <label class="adt-toggle-field">
                                        <input type="checkbox" name="enable_ecommerce_tracking">
                                        <span class="adt-toggle"></span>
                                        <div class="adt-field-info">
                                            <strong>Enable E-commerce</strong>
                                            <p>Track product views, add to cart, purchases, and more</p>
                                        </div>
                                    </label>
                                </div>
                                
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Step 4: GTM Setup -->
                <div class="adt-wizard-step" data-step="4">
                    <div class="adt-step-header">
                        <h2><?php esc_html_e( 'Google Tag Manager Setup', 'brandmeetscode-datalayer-tracker' ); ?></h2>
                        <p class="adt-step-description">
                            <?php esc_html_e( 'Optionally inject the GTM snippet directly from this plugin and enter your container ID.', 'brandmeetscode-datalayer-tracker' ); ?>
                        </p>
                    </div>

                    <div class="adt-step-content">
                        <div class="adt-config-section">

                            <div class="adt-integration-card">
                                <div class="adt-integration-header">
                                    <div class="adt-integration-logo" style="background: #246FDB;">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                                    </div>
                                    <div>
                                        <h3><?php esc_html_e( 'Enable GTM Snippet', 'brandmeetscode-datalayer-tracker' ); ?></h3>
                                        <p><?php esc_html_e( 'Automatically inject the GTM snippet into your site', 'brandmeetscode-datalayer-tracker' ); ?></p>
                                    </div>
                                </div>
                                <div class="adt-integration-toggle">
                                    <label class="adt-switch">
                                        <input type="checkbox" name="enable_gtm_snippet" id="enable_gtm_snippet">
                                        <span class="adt-slider"></span>
                                    </label>
                                </div>
                                <div class="adt-integration-config" style="display: none;" data-depends="enable_gtm_snippet">
                                    <div class="adt-form-field">
                                        <label><?php esc_html_e( 'GTM Container ID', 'brandmeetscode-datalayer-tracker' ); ?></label>
                                        <input type="text" name="gtm_container_id" placeholder="GTM-XXXXXX" class="adt-input">
                                        <p class="adt-field-help"><?php esc_html_e( 'Find this in your GTM account under Admin → Container Settings.', 'brandmeetscode-datalayer-tracker' ); ?></p>
                                    </div>
                                    <div class="adt-form-field">
                                        <label class="adt-checkbox-label">
                                            <input type="checkbox" name="allow_multi_container">
                                            <?php esc_html_e( 'Allow multiple GTM containers on the same page', 'brandmeetscode-datalayer-tracker' ); ?>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div class="adt-notice adt-notice-info">
                                <p>
                                    <span class="dashicons dashicons-info"></span>
                                    <?php esc_html_e( 'If GTM is already installed by your theme or another plugin, leave this disabled to avoid duplicating the snippet.', 'brandmeetscode-datalayer-tracker' ); ?>
                                </p>
                            </div>

                        </div>
                    </div>
                </div>

                <!-- Step 5: Consent & Privacy -->
                <div class="adt-wizard-step" data-step="5">
                    <div class="adt-step-header">
                        <h2><?php esc_html_e( 'Consent & Privacy', 'brandmeetscode-datalayer-tracker' ); ?></h2>
                        <p class="adt-step-description">
                            <?php esc_html_e( 'Configure how the plugin behaves with consent management platforms (GDPR/CCPA).', 'brandmeetscode-datalayer-tracker' ); ?>
                        </p>
                    </div>

                    <div class="adt-step-content">
                        <div class="adt-config-section">

                            <div class="adt-integration-card">
                                <div class="adt-integration-header">
                                    <div class="adt-integration-logo" style="background: #2e7d32;">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
                                    </div>
                                    <div>
                                        <h3><?php esc_html_e( 'Delay Tracking Until Consent', 'brandmeetscode-datalayer-tracker' ); ?></h3>
                                        <p><?php esc_html_e( 'GDPR/CCPA safe mode — prevents any tracking until the user grants consent', 'brandmeetscode-datalayer-tracker' ); ?></p>
                                    </div>
                                </div>
                                <div class="adt-integration-toggle">
                                    <label class="adt-switch">
                                        <input type="checkbox" name="delay_until_consent" id="delay_until_consent">
                                        <span class="adt-slider"></span>
                                    </label>
                                </div>
                            </div>

                            <div class="adt-integration-card">
                                <div class="adt-integration-header">
                                    <div class="adt-integration-logo" style="background: #1565c0;">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="24" height="24"><circle cx="12" cy="12" r="10"/><path fill="#1565c0" d="M12 6v6l4 2"/></svg>
                                    </div>
                                    <div>
                                        <h3><?php esc_html_e( 'Track If No CMP Detected', 'brandmeetscode-datalayer-tracker' ); ?></h3>
                                        <p><?php esc_html_e( 'Allow tracking when no consent platform is found on the page', 'brandmeetscode-datalayer-tracker' ); ?></p>
                                    </div>
                                </div>
                                <div class="adt-integration-toggle">
                                    <label class="adt-switch">
                                        <input type="checkbox" name="fallback_track_without_cmp" id="fallback_track_without_cmp" checked>
                                        <span class="adt-slider"></span>
                                    </label>
                                </div>
                            </div>

                            <div class="adt-form-field" style="margin-top: 16px;">
                                <label><?php esc_html_e( 'Preferred CMP Platform', 'brandmeetscode-datalayer-tracker' ); ?></label>
                                <select name="preferred_cmp" class="adt-input">
                                    <option value="auto"><?php esc_html_e( 'Auto-detect (Recommended)', 'brandmeetscode-datalayer-tracker' ); ?></option>
                                    <option value="cookiesyes"><?php esc_html_e( 'CookieYes', 'brandmeetscode-datalayer-tracker' ); ?></option>
                                    <option value="cookiebot"><?php esc_html_e( 'Cookiebot', 'brandmeetscode-datalayer-tracker' ); ?></option>
                                    <option value="klaro"><?php esc_html_e( 'Klaro', 'brandmeetscode-datalayer-tracker' ); ?></option>
                                    <option value="complianz"><?php esc_html_e( 'Complianz', 'brandmeetscode-datalayer-tracker' ); ?></option>
                                </select>
                                <p class="adt-field-help"><?php esc_html_e( 'Select your consent platform or leave on auto-detect.', 'brandmeetscode-datalayer-tracker' ); ?></p>
                            </div>

                            <div class="adt-notice adt-notice-info">
                                <p>
                                    <span class="dashicons dashicons-info"></span>
                                    <?php esc_html_e( 'If you do not use a consent management platform, leave these at their defaults and proceed.', 'brandmeetscode-datalayer-tracker' ); ?>
                                </p>
                            </div>

                        </div>
                    </div>
                </div>

                <!-- Step 6: Review & Complete -->
                <div class="adt-wizard-step" data-step="6">
                    <div class="adt-step-header">
                        <h2>Review Your Configuration</h2>
                        <p class="adt-step-description">
                            Review your settings before completing the setup. You can always change these later.
                        </p>
                    </div>
                    
                    <div class="adt-step-content">
                        <div class="adt-review-sections">
                            
                            <div class="adt-review-card">
                                <h3>Configuration Preset</h3>
                                <div class="adt-review-value" id="review-preset">Recommended</div>
                            </div>
                            
                            <div class="adt-review-card">
                                <h3>Tracking Features</h3>
                                <div class="adt-review-list" id="review-features">
                                    <div class="adt-review-item">Page tracking enabled</div>
                                    <div class="adt-review-item">Engagement tracking enabled</div>
                                    <div class="adt-review-item">Scroll tracking enabled</div>
                                </div>
                            </div>
                            
                            <div class="adt-review-card">
                                <h3><?php esc_html_e( 'GTM Setup', 'brandmeetscode-datalayer-tracker' ); ?></h3>
                                <div class="adt-review-list" id="review-gtm">
                                    <div class="adt-review-item adt-review-disabled"><?php esc_html_e( 'Not configured', 'brandmeetscode-datalayer-tracker' ); ?></div>
                                </div>
                            </div>

                            <div class="adt-review-card">
                                <h3><?php esc_html_e( 'Consent & Privacy', 'brandmeetscode-datalayer-tracker' ); ?></h3>
                                <div class="adt-review-list" id="review-consent">
                                    <div class="adt-review-item"><?php esc_html_e( 'Auto-detect CMP', 'brandmeetscode-datalayer-tracker' ); ?></div>
                                </div>
                            </div>
                            
                            <div class="adt-review-card">
                                <h3>Next Steps</h3>
                                <div class="adt-next-steps">
                                    <div class="adt-next-step">
                                        <span class="dashicons dashicons-admin-generic"></span>
                                        <div>
                                            <strong>Fine-tune your settings</strong>
                                            <p>Visit the settings page to adjust advanced options</p>
                                        </div>
                                    </div>
                                    <div class="adt-next-step">
                                        <span class="dashicons dashicons-admin-plugins"></span>
                                        <div>
                                            <strong><?php esc_html_e( 'Connect to GTM', 'brandmeetscode-datalayer-tracker' ); ?></strong>
                                            <p><?php esc_html_e( 'Use the dataLayer events this plugin pushes to build triggers and tags in GTM', 'brandmeetscode-datalayer-tracker' ); ?></p>
                                        </div>
                                    </div>
                                    <div class="adt-next-step">
                                        <span class="dashicons dashicons-chart-area"></span>
                                        <div>
                                            <strong>Test your tracking</strong>
                                            <p>Use GTM Preview mode to verify events are firing correctly</p>
                                        </div>
                                    </div>
                                    <div class="adt-next-step">
                                        <span class="dashicons dashicons-visibility"></span>
                                        <div>
                                            <strong><?php esc_html_e( 'Enable the debug overlay', 'brandmeetscode-datalayer-tracker' ); ?></strong>
                                            <p><?php esc_html_e( 'Use the live overlay to confirm events are firing correctly on your site', 'brandmeetscode-datalayer-tracker' ); ?></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="adt-completion-actions">
                            <button type="button" class="adt-button adt-button-primary adt-button-large" id="complete-wizard">
                                <span class="dashicons dashicons-yes"></span>
                                Complete Setup
                            </button>
                            <p class="adt-action-note">
                                Don't worry, you can run this wizard again or modify settings anytime.
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            <!-- Navigation -->
            <div class="adt-wizard-navigation">
                <button type="button" class="adt-button adt-button-secondary" id="wizard-prev" style="display: none;">
                    <span class="dashicons dashicons-arrow-left-alt2"></span>
                    Previous
                </button>
                <button type="button" class="adt-button adt-button-secondary" id="wizard-skip" style="display: none;">
                    Skip This Step
                </button>
                <button type="button" class="adt-button adt-button-primary" id="wizard-next">
                    Next
                    <span class="dashicons dashicons-arrow-right-alt2"></span>
                </button>
            </div>
        </div>
    </div>

    <?php
}

/**
 * Get preset configuration based on selection
 */
function adt_get_preset_config($preset) {
    $configs = [
        'recommended' => [
            'include_page_type' => 1,
            'include_post_id' => 1,
            'include_page_title' => 1,
            'include_page_url' => 1,
            'include_slug' => 1,
            'include_path' => 1,
            'include_categories' => 1,
            'include_tags' => 1,
            'include_user' => 1,
            'include_user_hash' => 1,
            'include_referrer' => 1,
            'include_utm' => 1,
            'include_time_on_page' => 1,
            'include_active_time' => 1,
            'include_scroll_depth' => 1,
            'include_hover_intent' => 1,
            'include_video_progress' => 1,
            'include_focus_blur' => 1,
            'delay_until_consent' => 1,
            'enable_ecommerce_tracking' => 0,
            'debug_mode' => 1,
            'enable_debug_overlay' => 1,
        ],
        'ecommerce' => [
            'include_page_type' => 1,
            'include_post_id' => 1,
            'include_page_title' => 1,
            'include_page_url' => 1,
            'include_slug' => 1,
            'include_path' => 1,
            'include_categories' => 1,
            'include_tags' => 1,
            'include_user' => 1,
            'include_user_hash' => 1,
            'include_referrer' => 1,
            'include_utm' => 1,
            'include_time_on_page' => 1,
            'include_active_time' => 1,
            'include_scroll_depth' => 1,
            'include_hover_intent' => 1,
            'include_video_progress' => 1,
            'include_focus_blur' => 1,
            'delay_until_consent' => 1,
            'enable_ecommerce_tracking' => 1,
            'include_ga4_item_metadata' => 1,
            'debug_mode' => 1,
            'enable_debug_overlay' => 1,
        ],
        'content' => [
            'include_page_type' => 1,
            'include_post_id' => 1,
            'include_page_title' => 1,
            'include_page_url' => 1,
            'include_slug' => 1,
            'include_path' => 1,
            'include_categories' => 1,
            'include_tags' => 1,
            'include_user' => 1,
            'include_user_hash' => 1,
            'include_referrer' => 1,
            'include_utm' => 1,
            'include_time_on_page' => 1,
            'include_active_time' => 1,
            'include_scroll_depth' => 1,
            'include_hover_intent' => 1,
            'include_scroll_back_up' => 1,
            'include_video_progress' => 1,
            'include_focus_blur' => 1,
            'include_content_intelligence' => 1,
            'include_last_engaged_section' => 1,
            'delay_until_consent' => 1,
            'enable_ecommerce_tracking' => 0,
            'debug_mode' => 1,
            'enable_debug_overlay' => 1,
        ],
        'minimal' => [
            'include_page_type' => 1,
            'include_post_id' => 1,
            'include_page_title' => 1,
            'include_page_url' => 1,
            'include_user' => 1,
            'delay_until_consent' => 1,
            'enable_ecommerce_tracking' => 0,
            'debug_mode' => 0,
            'enable_debug_overlay' => 0,
        ],
    ];
    
    return $configs[$preset] ?? $configs['recommended'];
}