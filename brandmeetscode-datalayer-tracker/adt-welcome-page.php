<?php
/**
 * DataLayer Tracker - Welcome Page
 * 
 * @package    DataLayer_Tracker
 * @subpackage Admin
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}


$has_dismissed = get_option( 'adt_welcome_dismissed', false );

// Remove automatic admin notices output on this page
remove_all_actions('admin_notices');

// Capture notices manually
ob_start();
do_action('admin_notices');
$notices = ob_get_clean();

?>

<?php echo wp_kses_post( $notices ); ?>

<div class="wrap adt-welcome-page">
    <!-- Empty h1 for WordPress admin notices to latch onto -->
    <h1 style="display: none;"></h1>


    <div class="adt-welcome-header">
        <h2>🎉 Welcome to DataLayer Tracker</h2>
        <p>Your complete solution for professional analytics tracking</p>
    </div>

    <div class="adt-welcome-body">
        <div class="adt-welcome-intro">
            <p>
                Stop losing revenue to ad blockers and bad data. DataLayer Tracker gives you complete visibility into every customer interaction—from first click to final purchase. Get accurate tracking that actually works, with zero code required.
            </p>
        </div>

        <?php 
        // Check if wizard has been completed
        $wizard_completed = get_option('adt_wizard_completed', false);
        ?>
        <div class="adt-welcome-actions">
            <?php if (!$wizard_completed): ?>
                <a href="<?php echo esc_url(admin_url('admin.php?page=adt-setup-wizard')); ?>" class="adt-welcome-btn-primary">
                    🚀 Run Setup Wizard
                </a>
                <div class="adt-welcome-secondary">
                    <div>
                        Already configured? 
                        <a href="<?php echo esc_url(admin_url('admin.php?page=adt-settings')); ?>">Go to Settings</a>
                    </div>
                </div>
            <?php else: ?>
                <a href="<?php echo esc_url(admin_url('admin.php?page=adt-settings')); ?>" class="adt-welcome-btn-primary">
                    → Go to Settings
                </a>
                <div class="adt-welcome-secondary">
                    <div>
                        Need to reconfigure? 
                        <a href="<?php echo esc_url(admin_url('admin.php?page=adt-setup-wizard')); ?>">Run Setup Wizard Again</a>
                    </div>
                </div>
            <?php endif; ?>
        </div>

        <?php $pro_url = esc_url( adt_get_pro_sales_url() ); ?>
        <div class="adt-welcome-features">

            <!-- FREE features -->
            <div class="adt-welcome-feature">
                <div class="adt-welcome-feature-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2271b1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                </div>
                <h4>GTM-Ready dataLayer</h4>
                <p>Structured events pushed to <code>window.dataLayer</code> on every page — page context, visitor hints, engagement, forms. Works with any GTM trigger out of the box.</p>
            </div>
            <div class="adt-welcome-feature">
                <div class="adt-welcome-feature-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2271b1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                </div>
                <h4>Consent-Aware Loading</h4>
                <p>Automatically detects OneTrust, Cookiebot, CookieYes, Complianz, and 10+ CMPs. Blocks tracking until consent is granted. GDPR &amp; CCPA ready.</p>
            </div>
            <div class="adt-welcome-feature">
                <div class="adt-welcome-feature-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2271b1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path><path d="M4.93 4.93a10 10 0 0 0 0 14.14"></path></svg>
                </div>
                <h4>GTM Snippet Output</h4>
                <p>Paste your container ID in settings and the plugin injects the GTM snippet automatically — no theme edits required.</p>
            </div>
            <div class="adt-welcome-feature">
                <div class="adt-welcome-feature-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2271b1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                </div>
                <h4>Engagement Signals</h4>
                <p>Scroll depth, scroll-back-up, tab focus/blur, time-on-page heartbeat, and default click tracking — all included, all configurable.</p>
            </div>
            <div class="adt-welcome-feature">
                <div class="adt-welcome-feature-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2271b1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                </div>
                <h4>Form Lifecycle Events</h4>
                <p>Automatic <code>form_view</code>, <code>form_field_start</code>, <code>form_submit</code>, <code>form_error</code>, and <code>form_abandon</code> when you enable <strong>Field Tracking</strong> or <strong>Form Vendor Detection</strong> in Settings. Optional shortcuts for Gravity Forms, HubSpot, Contact Form 7, WPForms, and more.</p>
            </div>
            <div class="adt-welcome-feature">
                <div class="adt-welcome-feature-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2271b1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                </div>
                <h4>WooCommerce GA4 Events</h4>
                <p>When WooCommerce is active: GA4-style browser events (view_item, add_to_cart, begin_checkout, purchase), cart abandonment, refunds, and customer-type context for your dataLayer.</p>
            </div>
            <div class="adt-welcome-feature">
                <div class="adt-welcome-feature-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2271b1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
                <h4>Debug Overlay</h4>
                <p>Real-time on-page panel shows every dataLayer event as it fires, with filtering and blocked-event visibility. Admin-only, never shown to visitors.</p>
            </div>

            <!-- PRO features (not in WordPress.org build) -->
            <div class="adt-welcome-feature" style="opacity:.85;border:1px dashed #ccc;border-radius:4px;padding:12px;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
                    <div class="adt-welcome-feature-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2271b1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"></path></svg>
                    </div>
                    <span style="background:#09ba65;color:#fff;font-size:11px;padding:2px 7px;border-radius:3px;white-space:nowrap;">PRO</span>
                </div>
                <h4>Advertising Pixels</h4>
                <p>Meta, TikTok, Google Ads, LinkedIn, X, and Pinterest — direct browser pixels, optional dual mode with GTM, and JSON event mapping.</p>
                <a href="<?php echo esc_url( $pro_url ); ?>" target="_blank" rel="noopener noreferrer" style="font-size:12px;">Learn more →</a>
            </div>
            <div class="adt-welcome-feature" style="opacity:.85;border:1px dashed #ccc;border-radius:4px;padding:12px;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
                    <div class="adt-welcome-feature-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2271b1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                    </div>
                    <span style="background:#09ba65;color:#fff;font-size:11px;padding:2px 7px;border-radius:3px;white-space:nowrap;">PRO</span>
                </div>
                <h4>GTM Container Export</h4>
                <p>Generate a ready-to-import GTM JSON container with all tags, triggers, and variables pre-configured. One click, zero manual GTM work.</p>
                <a href="<?php echo esc_url( $pro_url ); ?>" target="_blank" rel="noopener noreferrer" style="font-size:12px;">Learn more →</a>
            </div>
            <div class="adt-welcome-feature" style="opacity:.85;border:1px dashed #ccc;border-radius:4px;padding:12px;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
                    <div class="adt-welcome-feature-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2271b1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect></svg>
                    </div>
                    <span style="background:#09ba65;color:#fff;font-size:11px;padding:2px 7px;border-radius:3px;white-space:nowrap;">PRO</span>
                </div>
                <h4>Server-Side Tracking</h4>
                <p>Meta Conversions API &amp; GA4 Measurement Protocol — bypass ad blockers and iOS restrictions, capturing 30–40% more events than client-side alone.</p>
                <a href="<?php echo esc_url( $pro_url ); ?>" target="_blank" rel="noopener noreferrer" style="font-size:12px;">Learn more →</a>
            </div>

        </div>

        <div class="adt-welcome-steps">
            <h3>🚀 Quick Start Guide</h3>
            <ol>
                <li><strong>Run the Setup Wizard</strong> — guided configuration in under 5 minutes</li>
                <li><strong>Add your GTM container ID</strong> in settings so the snippet is injected automatically</li>
                <li><strong>Test your tracking</strong> using GTM Preview mode or the built-in debug overlay</li>
                <li><strong>Review advanced options</strong> and fine-tune engagement, consent, and URL filters</li>
                <li><strong>Go live</strong> and start collecting clean, structured data</li>
            </ol>
        </div>

        <div class="adt-welcome-footer">
            <a href="https://datalayer-tracker.com/knowledge-base/" target="_blank">📚 Documentation</a>
            <a href="https://datalayer-tracker.com/knowledge-base/quick-start-guide/" target="_blank">⚡ Quick Start</a>
            <a href="<?php echo esc_url(admin_url('admin.php?page=adt-settings')); ?>">⚙️ View Settings</a>
        </div>

        <div class="adt-dismiss-welcome">
            <a href="<?php echo esc_url(wp_nonce_url(admin_url('admin-post.php?action=adt_dismiss_welcome'), 'adt_dismiss_welcome')); ?>">
                <?php echo esc_html__( "Don't show this page again", 'brandmeetscode-datalayer-tracker' ); ?>
            </a>
        </div>
    </div>
</div>