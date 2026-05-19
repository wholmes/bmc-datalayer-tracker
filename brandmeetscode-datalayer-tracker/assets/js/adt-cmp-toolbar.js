(function() {
    // Define detection function inline if it doesn't exist
    function detectCMP() {
        const detected = [];
        if (typeof window.Cookiebot !== 'undefined') detected.push('Cookiebot');
        if (typeof window.CookieConsent !== 'undefined') detected.push('CookieConsent');
        if (typeof window.OneTrust !== 'undefined') detected.push('OneTrust');
        if (typeof window.klaro !== 'undefined') detected.push('Klaro');
        if (typeof window.Osano !== 'undefined') detected.push('Osano');
        if (typeof window.__tcfapi !== 'undefined') detected.push('TCF 2.0');
        if (typeof window.complianz !== 'undefined') detected.push('Complianz');
        if (typeof window.cmplz_cookiebanner !== 'undefined') detected.push('Complianz');
        if (typeof window.BorlabsCookie !== 'undefined') detected.push('Borlabs');
        if (typeof window.borlabs !== 'undefined') detected.push('Borlabs');
        if (typeof window.Termly !== 'undefined') detected.push('Termly');
        if (typeof window.CookieYes !== 'undefined') detected.push('CookieYes');
        if (typeof window.cookieyes !== 'undefined') detected.push('CookieYes');
        if (document.querySelector('.cky-consent-container')) detected.push('CookieYes');
        if (window.UC_UI) detected.push('Usercentrics');
        return detected.length ? detected : ['No CMP detected'];
    }

    let attempts = 0;
    const maxAttempts = 20;

    function checkCMP() {
        attempts++;

        let detected = detectCMP();

        if (window.ADTConsentReady === true && window.ADTConsentAudit) {
            const audit = window.ADTConsentAudit || [];
            const sources = [...new Set(audit.map(a => a.source).filter(Boolean))];
            const cmps = sources.filter(s =>
                s && !['manual', 'no_cmp_override', 'no_cmp_fallback', 'default'].includes(s)
            );
            if (cmps.length > 0) {
                detected = cmps;
            }
        }

        const hasConsentFn = typeof window.hasConsent === 'function';
        let consentStatus = {};
        if (hasConsentFn) {
            try {
                consentStatus = {
                    analytics: window.hasConsent('analytics'),
                    marketing: window.hasConsent('marketing')
                };
            } catch(e) {}
        }

        if (!window._lastConsentState) {
            window._lastConsentState = JSON.stringify(consentStatus);
        }

        const currentState = JSON.stringify(consentStatus);
        if (currentState !== window._lastConsentState) {
            window._lastConsentState = currentState;
            setTimeout(() => checkCMP(), 100);
        }

        if (!window._consentListenerAdded) {
            window._consentListenerAdded = true;
            ['adt_consent_granted', 'adt_consent_revoked', 'consent_update'].forEach(event => {
                window.addEventListener(event, () => {
                    setTimeout(() => checkCMP(), 100);
                });
            });
        }

        const trackingActive = window.dataLayer && !window.dataLayerBlocked;
        const eventsInDataLayer = window.dataLayer ? window.dataLayer.length : 0;

        const mainEl = document.getElementById('adt-detected-cmp');
        if (mainEl) {
            mainEl.textContent = detected[0];
            mainEl.style.color = detected[0] === 'No CMP detected' ? '#ff6b6b' : '#51cf66';
        }

        const infoEl = document.getElementById('adt-cmp-info');
        if (infoEl) {
            let html = '<div>';

            const cmpStatus = detected[0] === 'No CMP detected' ? 'status-bad' : 'status-good';
            html += '<strong>ADT:</strong> <span class="' + cmpStatus + '">' + detected.join(', ') + '</span><br>';
            html += '<strong>Consent API:</strong> ' + (hasConsentFn ? '<span class="status-good">✅ Ready</span>' : '<span class="status-bad">❌ Missing</span>') + '<br>';

            if (hasConsentFn && Object.keys(consentStatus).length) {
                html += '<strong>Consent Status:</strong>';
                html += '<div class="sub-item">Analytics: ' + (consentStatus.analytics ? '<span class="status-good">✅ Granted</span>' : '<span class="status-bad">❌ Denied</span>') + '</div>';
                html += '<div class="sub-item">Marketing: ' + (consentStatus.marketing ? '<span class="status-good">✅ Granted</span>' : '<span class="status-bad">❌ Denied</span>') + '</div>';
            }

            html += '<div class="section-divider"></div>';
            html += '<strong>Pixel Mode:</strong> ';

            const pixelEnabled = window.ADTData && window.ADTData.pixel_tracking_enabled === '1';
            const dualMode = window.ADTData && window.ADTData.dual_pixel_mode === '1';

            if (!pixelEnabled) {
                html += '<span class="status-neutral">GTM Only</span><br>';
            } else if (dualMode) {
                html += '<span class="status-good">🚀 Dual (GTM + SDK)</span><br>';
            } else {
                html += '<span class="status-good">GTM Priority</span><br>';
            }

            html += '<strong>Pixels:</strong> ';
            const activePixels = [];
            const pixelChecks = {
                'Meta':     { enabled: window.ADTData && window.ADTData.meta_pixel_enabled === '1',     sdk: typeof window.fbq === 'function',                         color: '#1877f2' },
                'TikTok':   { enabled: window.ADTData && window.ADTData.tiktok_pixel_enabled === '1',   sdk: typeof window.ttq === 'object',                           color: '#000' },
                'Google':   { enabled: window.ADTData && window.ADTData.google_ads_enabled === '1',     sdk: typeof window.gtag === 'function',                        color: '#4285f4' },
                'LinkedIn': { enabled: window.ADTData && window.ADTData.linkedin_pixel_enabled === '1', sdk: typeof window._linkedin_data_partner_id !== 'undefined',  color: '#0077b5' },
                'X':        { enabled: window.ADTData && window.ADTData.x_pixel_enabled === '1',        sdk: typeof window.twq === 'function',                         color: '#1da1f2' },
                'Pinterest':{ enabled: window.ADTData && window.ADTData.pinterest_pixel_enabled === '1',sdk: typeof window.pintrk === 'function',                      color: '#bd081c' }
            };

            Object.entries(pixelChecks).forEach(([name, config]) => {
                if (config.enabled) {
                    const sdkStatus = config.sdk ? '✅' : '⚠️';
                    activePixels.push('<span style="color:' + config.color + '">' + name + sdkStatus + '</span>');
                }
            });

            if (activePixels.length > 0) {
                html += activePixels.join(' ');
                html += '<div class="sub-item" style="font-size:10px;color:#999;margin-top:2px;">✅=SDK loaded ⚠️=SDK pending/missing</div>';
            } else {
                html += '<span class="status-neutral">None configured</span>';
            }
            html += '<br>';

            if (window.ADTData && window.ADTData.pixel_event_map_json) {
                try {
                    const eventMap = JSON.parse(window.ADTData.pixel_event_map_json);
                    if (Object.keys(eventMap).length > 0) {
                        html += '<strong>Event Map:</strong> <span class="status-good">✅ Configured</span><br>';
                        const mappings = Object.entries(eventMap).slice(0, 3);
                        if (mappings.length > 0) {
                            html += '<div class="sub-item" style="font-size:11px;">';
                            mappings.forEach(([event, platforms]) => {
                                html += event + ' → ' + (Array.isArray(platforms) ? platforms.join(',') : platforms) + '<br>';
                            });
                            if (Object.keys(eventMap).length > 3) {
                                html += '<em>...and ' + (Object.keys(eventMap).length - 3) + ' more</em>';
                            }
                            html += '</div>';
                        }
                    }
                } catch(e) {}
            }

            html += '<div class="section-divider"></div>';
            html += '<strong>Tracking:</strong> ' + (trackingActive ? '<span class="status-good">✅ Active</span>' : '<span class="status-bad">🚫 Blocked</span>') + '<br>';
            html += '<strong>Events:</strong> <span class="status-neutral">' + eventsInDataLayer + ' in dataLayer</span><br>';

            html += '<div class="section-divider"></div>';
            if (typeof window.ADTSession !== 'undefined' && typeof window.ADTSession.id === 'function') {
                try {
                    const sessionId = window.ADTSession.id();
                    if (sessionId && sessionId !== 'null') {
                        html += '<strong>Session:</strong> <span class="status-good">✅ ' + sessionId.substring(0, 8) + '...</span><br>';
                    } else {
                        html += '<strong>Session:</strong> <span class="status-warning">⚠️ Not initialized</span><br>';
                    }
                } catch(e) {
                    html += '<strong>Session:</strong> <span class="status-bad">❌ Error</span><br>';
                }
            } else {
                html += '<strong>Session:</strong> <span class="status-bad">❌ Not loaded</span><br>';
            }

            html += '<strong>Full build:</strong> ' + ((window.adtAllFeaturesEnabled && window.adtAllFeaturesEnabled()) || (window.isADTPremium && window.isADTPremium()) ? '<span class="status-good">✅ Yes</span>' : '<span class="status-bad">❌ No</span>') + '<br>';

            if (pixelEnabled) {
                html += '<div class="section-divider"></div>';
                html += '<strong>Pixels Fired:</strong> ';
                if (window.ADTPixelManager && window.ADTPixelManager.getStatus) {
                    const status = window.ADTPixelManager.getStatus();
                    html += '<span class="status-neutral">' + (status.fired ? status.fired.length : 0) + ' events</span>';
                    if (status.fired && status.fired.length > 0) {
                        const lastEvent = status.fired[status.fired.length - 1];
                        html += '<div class="sub-item" style="font-size:11px;">Last: ' + lastEvent + '</div>';
                    }
                } else {
                    html += '<span class="status-warning">Manager not loaded</span>';
                }
                html += '<br>';
            }

            if (!window.ADTSession || detected[0] === 'No CMP detected') {
                html += '<div class="section-divider"></div>';
                html += '<strong>Debug:</strong><br>';
                html += '<div class="sub-item">Session init: ' + (window._adtSessionInitialized ? 'Yes' : 'No') + '</div>';
                if (window.ADTData) {
                    html += '<div class="sub-item">isPremium: ' + window.ADTData.isPremiumUser + '</div>';
                    html += '<div class="sub-item">Dual mode: ' + (window.ADTData.dual_pixel_mode === '1' ? 'Yes' : 'No') + '</div>';
                }
            }

            html += '</div>';
            infoEl.innerHTML = html;
        }

        if (detected[0] === 'No CMP detected' && attempts < maxAttempts) {
            setTimeout(checkCMP, 500);
        }
    }

    setTimeout(checkCMP, 1000);
})();
