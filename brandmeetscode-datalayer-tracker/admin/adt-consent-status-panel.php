<?php
/**
 * ADT Consent Management Status Panel
 * Admin panel for displaying CMP detection and consent status
 * 
 * @package DataLayer_Tracker
 * @subpackage Admin/Consent
 */
// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

if ( ! function_exists( 'adt_detect_cmp_server_side' ) ) {
    /**
     * Server-side detection of installed Consent Management Platform plugins.
     *
     * @return array { detected: bool, name: string }
     */
    function adt_detect_cmp_server_side() {
        $cmps = [
            'Cookiebot'     => [ 'class' => 'Cookiebot_WP',          'function' => null ],
            'CookieYes'     => [ 'class' => 'Cookie_Law_Info',        'function' => null ],
            'Complianz'     => [ 'class' => 'COMPLIANZ',              'function' => null ],
            'OneTrust'      => [ 'class' => 'OT_Cookies',             'function' => null ],
            'Real Cookie Banner' => [ 'class' => 'DevOwl\\RealCookieBanner\\Core', 'function' => null ],
            'GDPR Cookie Consent' => [ 'class' => 'GDPRCookieConsent', 'function' => null ],
            'Usercentrics'  => [ 'class' => null, 'function' => 'usercentrics_enqueue' ],
            'Borlabs Cookie' => [ 'class' => 'BorlabsCookie\\System\\BorlabsCookie', 'function' => null ],
            'iubenda'       => [ 'class' => 'iubenda',                'function' => null ],
        ];

        foreach ( $cmps as $name => $check ) {
            if ( $check['class'] && class_exists( $check['class'] ) ) {
                return [ 'detected' => true, 'name' => $name ];
            }
            if ( $check['function'] && function_exists( $check['function'] ) ) {
                return [ 'detected' => true, 'name' => $name ];
            }
        }

        return [ 'detected' => false, 'name' => '' ];
    }
}

// Runtime flags are injected via admin_enqueue_scripts in adt-admin-assets.php.

// =====================
// Enhanced CMP Detection & Status Dashboard
// =====================
add_action('admin_notices', function() {
    if (!current_user_can('manage_options')) return;
    
    // ONLY show on page=adt-settings - SANITIZE GET parameter
    $current_page = isset( $_GET['page'] ) ? sanitize_text_field( wp_unslash( $_GET['page'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
    if ($current_page !== 'adt-settings-DISABLED') {
        return;
    }
    
    $settings = get_option('adt_settings', []);
    
    // Only show if GTM is enabled or consent features are configured
    $should_show = !empty($settings['enable_gtm_snippet']) || 
                   !empty($settings['delay_until_consent']) ||
                   !empty($settings['pixel_tracking_enabled']);
                   
    if (!$should_show) return;
	
	// Check if dismissed (24 hour cooldown)
	$dismissed_at = get_user_meta(get_current_user_id(), 'adt_cmp_notice_dismissed_at', true);
	if ($dismissed_at && (time() - $dismissed_at) < 86400) {
	    return; // Don't show if dismissed in last 24 hours
	}
	
    // Server-side CMP detection (expanded)
    $server_cmp = adt_detect_cmp_server_side();
    $initial_class = $server_cmp['detected'] ? 'notice-success' : 'notice-info';

    ?>
<div id="adt-cmp-notice" style="margin-bottom:5px" class="notice <?php echo esc_attr($initial_class); ?> is-dismissible adt-cmp-notice" data-dismissible="adt-cmp-notice" data-nonce="<?php echo esc_attr(wp_create_nonce('adt-dismiss-cmp-notice')); ?>" style="position:relative;">
    <div style="display:flex; align-items:center; justify-content:space-between; gap:15px;">
        <div style="flex:1;">
            <p style="margin:0;">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2271b1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                <strong>Consent Management:</strong>
                <span id="adt-cmp-status-inline">
                    <?php if ($server_cmp['detected']): ?>
                        <span style="color:#46b450;">âœ“</span> <?php echo esc_html($server_cmp['name']); ?> detected
                    <?php else: ?>
                        Scanning...
                    <?php endif; ?>
                </span>
            </p>
        </div>
        <a href="#" id="adt-cmp-details-toggle" style="font-size:12px; white-space:nowrap;">View Details â†’</a>
    </div>
    
    <!-- Collapsible details -->
    <div id="adt-cmp-details" style="display:none; margin-top:12px; padding-top:12px; border-top:1px solid #ddd;">
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:10px; font-size:12px;">
            <div><strong>Analytics:</strong> <span id="adt-consent-analytics">-</span></div>
            <div><strong>Marketing:</strong> <span id="adt-consent-marketing">-</span></div>
            <div><strong>Integration:</strong> <span id="adt-integration-status">-</span></div>
        </div>
    </div>
</div>

<?php ob_start(); ?>
document.addEventListener('DOMContentLoaded', function() {
    // Toggle details
    document.getElementById('adt-cmp-details-toggle')?.addEventListener('click', function(e) {
        e.preventDefault();
        const details = document.getElementById('adt-cmp-details');
        const visible = details.style.display !== 'none';
        details.style.display = visible ? 'none' : 'block';
        this.textContent = visible ? 'View Details â†’' : 'Hide Details â†';
    });

    // CMP Detection
    const startTime = performance.now();
    
    class CMPDetector {
        constructor() {
            this.results = {
                detected: false,
                platform: null,
                version: null,
                method: 'none',
                analytics: null,
                marketing: null,
                tcfSupport: false,
                adtIntegration: false,
                warnings: [],
                raw: {}
            };
        }

        async detect() {
            this.checkADTIntegration();
            if (this.detectCookieYes()) return this.results;
            if (this.detectCookiebot()) return this.results;
            if (this.detectOneTrust()) return this.results;
            if (this.detectTCF()) return this.results;
            if (this.detectBorlabs()) return this.results;
            if (this.detectComplianz()) return this.results;
            if (this.detectGDPRCC()) return this.results;
            this.detectGeneric();
            return this.results;
        }

        checkADTIntegration() {
            if (typeof window.ADTConsentManager !== 'undefined') {
                this.results.adtIntegration = true;
                if (window.ADTConsent) {
                    this.results.raw.adtConsent = window.ADTConsent;
                }
            }
        }

        detectCookieYes() {
            const hasAPI = typeof window.cookieyes !== 'undefined';
            const hasUI = document.querySelector('.cky-consent-container, #cookie-law-info-bar');
            const hasCookie = document.cookie.includes('cookieyes-consent');
            
            if (!hasAPI && !hasUI && !hasCookie) return false;
            
            this.results.detected = true;
            this.results.platform = 'CookieYes';
            this.results.method = hasAPI ? 'API' : (hasCookie ? 'Cookie' : 'UI');
            
            if (hasAPI && window.cookieyes?.consent) {
                const consent = window.cookieyes.consent;
                this.results.version = window.cookieyes.version || 'Pro';
                this.results.analytics = consent.accepted?.includes('analytics') || consent.accepted?.includes('performance');
                this.results.marketing = consent.accepted?.includes('advertisement') || consent.accepted?.includes('marketing');
                this.results.raw = consent;
            } else if (hasCookie) {
                const match = document.cookie.match(/cookieyes-consent=([^;]+)/);
                if (match) {
                    try {
                        const decoded = decodeURIComponent(match[1]);
                        if (decoded.includes('consent:')) {
                            const parts = {};
                            decoded.split(',').forEach(pair => {
                                const [k, v] = pair.split(':');
                                if (k && v) parts[k.trim()] = v.trim();
                            });
                            this.results.analytics = parts.analytics === 'yes' || parts.performance === 'yes';
                            this.results.marketing = parts.advertisement === 'yes' || parts.marketing === 'yes';
                            this.results.raw = parts;
                        } else {
                            const parsed = JSON.parse(decoded);
                            this.results.analytics = parsed.analytics === 'yes';
                            this.results.marketing = parsed.advertisement === 'yes';
                            this.results.raw = parsed;
                        }
                    } catch(e) {
                        this.results.warnings.push('CookieYes cookie parsing failed');
                    }
                }
            }
            
            if (!hasAPI) {
                this.results.version = 'Free';
                this.results.warnings.push('Consider upgrading to CookieYes Pro for better event handling');
            }
            
            return true;
        }

        detectCookiebot() {
            if (typeof window.Cookiebot === 'undefined') return false;
            
            this.results.detected = true;
            this.results.platform = 'Cookiebot';
            this.results.method = 'API';
            this.results.analytics = window.Cookiebot.consent?.statistics;
            this.results.marketing = window.Cookiebot.consent?.marketing;
            this.results.version = window.Cookiebot.version;
            this.results.raw = window.Cookiebot.consent;
            
            return true;
        }

        detectOneTrust() {
            if (typeof window.OneTrust === 'undefined' && typeof window.OnetrustActiveGroups === 'undefined') return false;
            
            this.results.detected = true;
            this.results.platform = 'OneTrust';
            this.results.method = 'API';
            
            const groups = window.OnetrustActiveGroups || '';
            this.results.analytics = groups.includes('C0002');
            this.results.marketing = groups.includes('C0004');
            this.results.raw = { groups, OneTrust: window.OneTrust };
            
            return true;
        }

        detectTCF() {
            if (typeof window.__tcfapi !== 'function') return false;
            
            this.results.detected = true;
            this.results.platform = 'TCF 2.0 CMP';
            this.results.method = 'TCF API';
            this.results.tcfSupport = true;
            
            window.__tcfapi('getTCData', 2, (tcData, success) => {
                if (success && tcData) {
                    this.results.analytics = tcData.purpose?.consents?.[1];
                    this.results.marketing = tcData.purpose?.consents?.[2];
                    this.results.raw = tcData;
                }
            });
            
            return true;
        }

        detectBorlabs() {
            if (typeof window.BorlabsCookie === 'undefined') return false;
            
            this.results.detected = true;
            this.results.platform = 'Borlabs Cookie';
            this.results.method = 'API';
            this.results.analytics = window.BorlabsCookie.checkCookieConsent('analytics');
            this.results.marketing = window.BorlabsCookie.checkCookieConsent('marketing');
            this.results.raw = window.BorlabsCookie;
            
            return true;
        }

        detectComplianz() {
            if (typeof window.complianz === 'undefined') return false;
            
            this.results.detected = true;
            this.results.platform = 'Complianz';
            this.results.method = 'API';
            this.results.raw = window.complianz;
            
            return true;
        }

        detectGDPRCC() {
            const hasPlugin = document.querySelector('[data-cli-script-type]');
            if (!hasPlugin) return false;
            
            this.results.detected = true;
            this.results.platform = 'GDPR Cookie Compliance';
            this.results.method = 'DOM';
            
            return true;
        }

        detectGeneric() {
            const selectors = [
                '.cookie-consent', '.cookie-banner', '.gdpr-consent',
                '#cookie-notice', '#gdpr-notice', '[class*="consent"]'
            ];
            
            for (const sel of selectors) {
                if (document.querySelector(sel)) {
                    this.results.detected = true;
                    this.results.platform = 'Unknown CMP';
                    this.results.method = 'Generic DOM';
                    this.results.warnings.push('CMP detected but not recognized. ADT may not integrate properly.');
                    return true;
                }
            }
            
            return false;
        }
    }

    async function runDetection() {
        const detector = new CMPDetector();
        const results = await detector.detect();
        updateUI(results);
    }

    function updateUI(results) {
        const notice = document.getElementById('adt-cmp-notice');
        const statusInline = document.getElementById('adt-cmp-status-inline');
        const analyticsEl = document.getElementById('adt-consent-analytics');
        const marketingEl = document.getElementById('adt-consent-marketing');
        const integrationEl = document.getElementById('adt-integration-status');
        
        if (!notice || !statusInline) return;
        
        if (results.detected) {
            statusInline.innerHTML = `<span style="color:#46b450;">âœ“</span> ${results.platform} detected${results.version ? ' (v' + results.version + ')' : ''}`;
            notice.className = 'notice notice-success is-dismissible adt-cmp-notice';
        } else {
            statusInline.innerHTML = `<span style="color:#ffb900;">âš ï¸</span> No CMP detected`;
            notice.className = 'notice notice-warning is-dismissible adt-cmp-notice';
        }
        
        if (analyticsEl) {
            analyticsEl.innerHTML = 
                results.analytics === true ? '✅ Granted' : 
                results.analytics === false ? 'âŒ Denied' : 'â¸ï¸ Pending';
        }
        
        if (marketingEl) {
            marketingEl.innerHTML = 
                results.marketing === true ? '✅ Granted' : 
                results.marketing === false ? 'âŒ Denied' : 'â¸ï¸ Pending';
        }
        
        if (integrationEl) {
            const delaySettingChecked = <?php echo !empty($settings['delay_until_consent']) ? 'true' : 'false'; ?>;
            if (results.adtIntegration || delaySettingChecked) {
                integrationEl.innerHTML = '✅ Active';
            } else {
                integrationEl.innerHTML = 'âš ï¸ <a href="<?php echo esc_url(admin_url('admin.php?page=adt-settings&tab=adt_integrations')); ?>">Configure</a>';
            }
        }
    }

    setTimeout(runDetection, 500);
});
<?php wp_add_inline_script( 'adt-utils', ob_get_clean(), 'after' ); ?>
<?php
});
// Callable function - duplicates the admin_notices rendering but with custom styling
function adt_render_cmp_status_panel() {
    if (!current_user_can('manage_options')) return;
    
    $settings = get_option('adt_settings', []);
    
    // Only show if GTM is enabled or consent features are configured
    $should_show = !empty($settings['enable_gtm_snippet']) || 
                   !empty($settings['delay_until_consent']) ||
                   !empty($settings['pixel_tracking_enabled']);
                   
    if (!$should_show) return;
    
    // Check if dismissed in last 24 hours
    $dismissed_at = get_user_meta(get_current_user_id(), 'adt_cmp_notice_dismissed_at', true);
    if ($dismissed_at && (time() - $dismissed_at) < 86400) {
        return;
    }
    
    // Server-side CMP detection
    $server_cmp = adt_detect_cmp_server_side();
    $bg_color = $server_cmp['detected'] ? '#f0fdf4' : '#f0f6fc';
    $border_color = $server_cmp['detected'] ? '#86efac' : '#c3dafe';
    $border_left_color = $server_cmp['detected'] ? '#22c55e' : '#2271b1';

    ?>
<div id="adt-cmp-notice" class="adt-cmp-info-box" data-dismissible="adt-cmp-notice" data-nonce="<?php echo esc_attr(wp_create_nonce('adt-dismiss-cmp-notice')); ?>" style="position: relative; margin: 0px 0 20px 0; padding: 16px 40px 16px 20px; background: <?php echo esc_attr($bg_color); ?>; border: 1px solid <?php echo esc_attr($border_color); ?>; border-radius: 6px; border-left: 4px solid <?php echo esc_attr($border_left_color); ?>;">
    <button type="button" class="notice-dismiss" style="position: absolute; top: 0; right: 0; padding: 9px; background: none; border: none; cursor: pointer; color: #787c82; text-decoration: none;">
        <span class="screen-reader-text">Dismiss</span>
    </button>
    <div style="display:flex; align-items:center; justify-content:space-between; gap:15px;">
        <div style="flex:1;">
            <p style="margin:0; color: #2d3748;">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2271b1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                <strong>Consent Management:</strong>
                <span id="adt-cmp-status-inline">
                    <?php if ($server_cmp['detected']): ?>
                        <span style="color:#22c55e;">✓</span> <?php echo esc_html($server_cmp['name']); ?> detected
                    <?php else: ?>
                        Scanning...
                    <?php endif; ?>
                </span>
            </p>
        </div>
        <a href="#" id="adt-cmp-details-toggle" style="font-size:12px; white-space:nowrap; color: #2271b1; text-decoration: none; font-weight: 500;">View Details ↓</a>
    </div>
    
    <!-- Collapsible details -->
    <div id="adt-cmp-details" style="display:none; margin-top:12px; padding-top:12px; border-top:1px solid rgba(0,0,0,0.1);">
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:10px; font-size:12px;">
            <div><strong>Analytics:</strong> <span id="adt-consent-analytics">-</span></div>
            <div><strong>Marketing:</strong> <span id="adt-consent-marketing">-</span></div>
            <div><strong>Integration:</strong> <span id="adt-integration-status">-</span></div>
        </div>
    </div>
</div>
<?php ob_start(); ?>
document.addEventListener('DOMContentLoaded', function() {
    // Toggle details
    document.getElementById('adt-cmp-details-toggle')?.addEventListener('click', function(e) {
        e.preventDefault();
        const details = document.getElementById('adt-cmp-details');
        const visible = details.style.display !== 'none';
        details.style.display = visible ? 'none' : 'block';
        this.textContent = visible ? 'View Details ↓’' : 'Hide Details ↑';
    });

    // CMP Detection
    const startTime = performance.now();
    
    class CMPDetector {
        constructor() {
            this.results = {
                detected: false,
                platform: null,
                version: null,
                method: 'none',
                analytics: null,
                marketing: null,
                tcfSupport: false,
                adtIntegration: false,
                warnings: [],
                raw: {}
            };
        }

        async detect() {
            this.checkADTIntegration();
            if (this.detectCookieYes()) return this.results;
            if (this.detectCookiebot()) return this.results;
            if (this.detectOneTrust()) return this.results;
            if (this.detectTCF()) return this.results;
            if (this.detectBorlabs()) return this.results;
            if (this.detectComplianz()) return this.results;
            if (this.detectGDPRCC()) return this.results;
            this.detectGeneric();
            return this.results;
        }

        checkADTIntegration() {
            if (typeof window.ADTConsentManager !== 'undefined') {
                this.results.adtIntegration = true;
                if (window.ADTConsent) {
                    this.results.raw.adtConsent = window.ADTConsent;
                }
            }
        }

        detectCookieYes() {
            const hasAPI = typeof window.cookieyes !== 'undefined';
            const hasUI = document.querySelector('.cky-consent-container, #cookie-law-info-bar');
            const hasCookie = document.cookie.includes('cookieyes-consent');
            
            if (!hasAPI && !hasUI && !hasCookie) return false;
            
            this.results.detected = true;
            this.results.platform = 'CookieYes';
            this.results.method = hasAPI ? 'API' : (hasCookie ? 'Cookie' : 'UI');
            
            if (hasAPI && window.cookieyes?.consent) {
                const consent = window.cookieyes.consent;
                this.results.version = window.cookieyes.version || 'Pro';
                this.results.analytics = consent.accepted?.includes('analytics') || consent.accepted?.includes('performance');
                this.results.marketing = consent.accepted?.includes('advertisement') || consent.accepted?.includes('marketing');
                this.results.raw = consent;
            } else if (hasCookie) {
                const match = document.cookie.match(/cookieyes-consent=([^;]+)/);
                if (match) {
                    try {
                        const decoded = decodeURIComponent(match[1]);
                        if (decoded.includes('consent:')) {
                            const parts = {};
                            decoded.split(',').forEach(pair => {
                                const [k, v] = pair.split(':');
                                if (k && v) parts[k.trim()] = v.trim();
                            });
                            this.results.analytics = parts.analytics === 'yes' || parts.performance === 'yes';
                            this.results.marketing = parts.advertisement === 'yes' || parts.marketing === 'yes';
                            this.results.raw = parts;
                        } else {
                            const parsed = JSON.parse(decoded);
                            this.results.analytics = parsed.analytics === 'yes';
                            this.results.marketing = parsed.advertisement === 'yes';
                            this.results.raw = parsed;
                        }
                    } catch(e) {
                        this.results.warnings.push('CookieYes cookie parsing failed');
                    }
                }
            }
            
            if (!hasAPI) {
                this.results.version = 'Free';
                this.results.warnings.push('Consider upgrading to CookieYes Pro for better event handling');
            }
            
            return true;
        }

        detectCookiebot() {
            if (typeof window.Cookiebot === 'undefined') return false;
            
            this.results.detected = true;
            this.results.platform = 'Cookiebot';
            this.results.method = 'API';
            this.results.analytics = window.Cookiebot.consent?.statistics;
            this.results.marketing = window.Cookiebot.consent?.marketing;
            this.results.version = window.Cookiebot.version;
            this.results.raw = window.Cookiebot.consent;
            
            return true;
        }

        detectOneTrust() {
            if (typeof window.OneTrust === 'undefined' && typeof window.OnetrustActiveGroups === 'undefined') return false;
            
            this.results.detected = true;
            this.results.platform = 'OneTrust';
            this.results.method = 'API';
            
            const groups = window.OnetrustActiveGroups || '';
            this.results.analytics = groups.includes('C0002');
            this.results.marketing = groups.includes('C0004');
            this.results.raw = { groups, OneTrust: window.OneTrust };
            
            return true;
        }

        detectTCF() {
            if (typeof window.__tcfapi !== 'function') return false;
            
            this.results.detected = true;
            this.results.platform = 'TCF 2.0 CMP';
            this.results.method = 'TCF API';
            this.results.tcfSupport = true;
            
            window.__tcfapi('getTCData', 2, (tcData, success) => {
                if (success && tcData) {
                    this.results.analytics = tcData.purpose?.consents?.[1];
                    this.results.marketing = tcData.purpose?.consents?.[2];
                    this.results.raw = tcData;
                }
            });
            
            return true;
        }

        detectBorlabs() {
            if (typeof window.BorlabsCookie === 'undefined') return false;
            
            this.results.detected = true;
            this.results.platform = 'Borlabs Cookie';
            this.results.method = 'API';
            this.results.analytics = window.BorlabsCookie.checkCookieConsent('analytics');
            this.results.marketing = window.BorlabsCookie.checkCookieConsent('marketing');
            this.results.raw = window.BorlabsCookie;
            
            return true;
        }

        detectComplianz() {
            if (typeof window.complianz === 'undefined') return false;
            
            this.results.detected = true;
            this.results.platform = 'Complianz';
            this.results.method = 'API';
            this.results.raw = window.complianz;
            
            return true;
        }

        detectGDPRCC() {
            const hasPlugin = document.querySelector('[data-cli-script-type]');
            if (!hasPlugin) return false;
            
            this.results.detected = true;
            this.results.platform = 'GDPR Cookie Compliance';
            this.results.method = 'DOM';
            
            return true;
        }

        detectGeneric() {
            const selectors = [
                '.cookie-consent', '.cookie-banner', '.gdpr-consent',
                '#cookie-notice', '#gdpr-notice', '[class*="consent"]'
            ];
            
            for (const sel of selectors) {
                if (document.querySelector(sel)) {
                    this.results.detected = true;
                    this.results.platform = 'Unknown CMP';
                    this.results.method = 'Generic DOM';
                    this.results.warnings.push('CMP detected but not recognized. ADT may not integrate properly.');
                    return true;
                }
            }
            
            return false;
        }
    }

    async function runDetection() {
        const detector = new CMPDetector();
        const results = await detector.detect();
        updateUI(results);
    }

    function updateUI(results) {
        const notice = document.getElementById('adt-cmp-notice');
        const statusInline = document.getElementById('adt-cmp-status-inline');
        const analyticsEl = document.getElementById('adt-consent-analytics');
        const marketingEl = document.getElementById('adt-consent-marketing');
        const integrationEl = document.getElementById('adt-integration-status');
        
        if (!notice || !statusInline) return;
        
        if (results.detected) {
            statusInline.innerHTML = `<span style="color:#46b450;">✓</span> ${results.platform} detected${results.version ? ' (v' + results.version + ')' : ''}`;
            notice.className = 'notice notice-success is-dismissible adt-cmp-notice';
        } else {
            statusInline.innerHTML = `<span style="color:#ffb900;">⚠️</span> No CMP detected`;
            notice.className = 'notice notice-warning is-dismissible adt-cmp-notice';
        }
        
        if (analyticsEl) {
            analyticsEl.innerHTML = 
                results.analytics === true ? '✅ Granted' : 
                results.analytics === false ? '❌ Denied' : '⏸️ Pending';
        }
        
        if (marketingEl) {
            marketingEl.innerHTML = 
                results.marketing === true ? '✅ Granted' : 
                results.marketing === false ? '❌ Denied' : '⏸️ Pending';
        }
        
        if (integrationEl) {
            const delaySettingChecked = <?php echo !empty($settings['delay_until_consent']) ? 'true' : 'false'; ?>;
            if (results.adtIntegration || delaySettingChecked) {
                integrationEl.innerHTML = '✅ Active';
            } else {
                integrationEl.innerHTML = '⚠️ <a href="<?php echo esc_url(admin_url('admin.php?page=adt-settings&tab=adt_integrations')); ?>">Configure</a>';
            }
        }
    }

    setTimeout(runDetection, 500);
});
<?php wp_add_inline_script( 'adt-utils', ob_get_clean(), 'after' ); ?>

<?php
}