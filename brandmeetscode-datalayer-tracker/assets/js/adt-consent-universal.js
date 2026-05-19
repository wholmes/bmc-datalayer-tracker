// Universal consent checking function - supports all major CMPs
window.ADTConsentCheck = function(purpose = 'analytics', vendor = null) {
    // Priority 1 Override settings
    if (window.ADTData?.fallback_track_without_cmp === '1') return true;
    
    // Priority 2 Check vendor-specific consent if provided
    if (vendor && window.ADTConsent?.[vendor] !== undefined) {
        return window.ADTConsent[vendor];
    }
    
    // Priority 3 Check purpose consent (set by ADT Consent Manager)
    if (window.ADTConsent?.[purpose] !== undefined) {
        return window.ADTConsent[purpose];
    }
    
    // Priority 4 Check CookiesYes (FREE)
    if (typeof window.cookieyes !== 'undefined') {
        const consentCookie = document.cookie.match(/cookieyes-consent=([^;]*)/);
        if (consentCookie && consentCookie[1]) {
            try {
                const consent = JSON.parse(decodeURIComponent(consentCookie[1]));
                if (purpose === 'analytics' && (consent.analytics === 'yes' || consent.statistics === 'yes')) {
                    return true;
                }
                if (purpose === 'marketing' && (consent.advertisement === 'yes' || consent.marketing === 'yes')) {
                    return true;
                }
            } catch (e) {}
        }
    }
    
    // Priority 5 Check Cookiebot (FREE tier available)
    if (typeof window.Cookiebot !== 'undefined' && window.Cookiebot.consent) {
        if (purpose === 'analytics' && window.Cookiebot.consent.statistics) return true;
        if (purpose === 'marketing' && window.Cookiebot.consent.marketing) return true;
    }
    
    // Priority 6 Check OneTrust
    if (typeof window.OneTrust !== 'undefined' && typeof window.OnetrustActiveGroups !== 'undefined') {
        const groups = window.OnetrustActiveGroups || '';
        if (purpose === 'analytics' && groups.includes('C0002')) return true;  // Performance/Analytics
        if (purpose === 'marketing' && groups.includes('C0004')) return true;  // Targeting/Marketing
    }
    
    // Priority 7 Check Klaro (FREE/Open Source)
    if (typeof window.klaro !== 'undefined' && window.klaro.getManager) {
        const manager = window.klaro.getManager();
        if (manager && manager.consents) {
            if (purpose === 'analytics' && manager.consents.analytics === true) return true;
            if (purpose === 'marketing' && manager.consents.marketing === true) return true;
        }
    }
    
    // Priority 8 Check Osano (FREE tier)
    if (typeof window.Osano !== 'undefined' && window.Osano.cm) {
        const consent = window.Osano.cm.getConsent();
        if (consent) {
            if (purpose === 'analytics' && consent.ANALYTICS === 'ACCEPT') return true;
            if (purpose === 'marketing' && consent.MARKETING === 'ACCEPT') return true;
        }
    }
    
    // Priority 9 Check Google Consent Mode
    if (window.__gtmPolicy?.analytics_storage === 'granted') {
        return true;
    }
    
    // Priority 10 Check TCF 2.0 (IAB Framework - many CMPs use this)
    if (typeof window.__tcfapi !== 'undefined') {
        let tcfConsent = false;
        window.__tcfapi('getTCData', 2, (tcData, success) => {
            if (success && tcData.purpose && tcData.purpose.consents) {
                // Purpose 1 = Storage, 7 = Measurement, 10 = Product development
                if (purpose === 'analytics' && 
                    (tcData.purpose.consents[1] || tcData.purpose.consents[7] || tcData.purpose.consents[10])) {
                    tcfConsent = true;
                }
                // Purpose 2 = Basic ads, 3 = Ad profiles, 4 = Ad selection
                if (purpose === 'marketing' && 
                    (tcData.purpose.consents[2] || tcData.purpose.consents[3] || tcData.purpose.consents[4])) {
                    tcfConsent = true;
                }
            }
        });
        if (tcfConsent) return true;
    }
    
    // Priority 11 Check Complianz (WordPress plugin - FREE)
    if (typeof window.complianz !== 'undefined' && window.complianz.consents) {
        if (purpose === 'analytics' && window.complianz.consents.statistics === 'allow') return true;
        if (purpose === 'marketing' && window.complianz.consents.marketing === 'allow') return true;
    }
    
    // Priority 12 Check Borlabs Cookie (WordPress)
    if (typeof window.BorlabsCookie !== 'undefined' && window.BorlabsCookie.checkCookieConsent) {
        if (purpose === 'analytics' && window.BorlabsCookie.checkCookieConsent('analytics')) return true;
        if (purpose === 'marketing' && window.BorlabsCookie.checkCookieConsent('marketing')) return true;
    }
    
    // Priority 13 Check Termly (FREE tier)
    if (typeof window.Termly !== 'undefined' && window.Termly.getConsentState) {
        const termlyConsent = window.Termly.getConsentState();
        if (termlyConsent) {
            if (purpose === 'analytics' && termlyConsent.analytics) return true;
            if (purpose === 'marketing' && termlyConsent.advertising) return true;
        }
    }
    
    // Priority 14 Check CookieYes DOM fallback
    const cyBanner = document.querySelector('.cky-consent-container');
    if (cyBanner) {
        const acceptedCategories = cyBanner.getAttribute('data-cky-accepted-categories');
        if (acceptedCategories) {
            if (purpose === 'analytics' && acceptedCategories.includes('analytics')) return true;
            if (purpose === 'marketing' && acceptedCategories.includes('advertisement')) return true;
        }
    }
    
    // Priority 15 Fallback setting
    return window.ADTData?.fallback_track_without_cmp === '1';
};

	// Ensure backward compatibility
	if (typeof window.hasConsent !== 'function' && typeof window.ADTConsentCheck === 'function') {
	    window.hasConsent = window.ADTConsentCheck;
	}
	if (typeof window.adtHasConsent !== 'function') {
	    // Create a wrapper function instead of direct assignment
	    window.adtHasConsent = function(purpose = 'analytics', vendor = null) {
	        if (typeof window.ADTConsentCheck === 'function') {
	            return window.ADTConsentCheck(purpose, vendor);
	        } else if (typeof window.hasConsent === 'function') {
	            return window.hasConsent(purpose, vendor);
	        }
	        // Final fallback
	        return window.ADTData?.fallback_track_without_cmp === '1';
	    };
	}

// Debug helper to see which CMP is detected
window.ADTDetectCMP = function() {
    const detected = [];
    if (typeof window.cookieyes !== 'undefined') detected.push('CookiesYes');
    if (typeof window.Cookiebot !== 'undefined') detected.push('Cookiebot');
    if (typeof window.OneTrust !== 'undefined') detected.push('OneTrust');
    if (typeof window.klaro !== 'undefined') detected.push('Klaro');
    if (typeof window.Osano !== 'undefined') detected.push('Osano');
    if (typeof window.__tcfapi !== 'undefined') detected.push('TCF 2.0');
    if (typeof window.complianz !== 'undefined') detected.push('Complianz');
    if (typeof window.BorlabsCookie !== 'undefined') detected.push('Borlabs');
    if (typeof window.Termly !== 'undefined') detected.push('Termly');
    return detected.length ? detected : ['No CMP detected'];
};
