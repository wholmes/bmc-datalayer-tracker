window.ADTDebug = window.ADTDebug || {};
window.ADTDebug.testIntegration = function() {
    console.group('ADT Integration Test');
    
    // Check consent
    console.log('Consent Status:', {
        hasFunction: typeof window.hasConsent === 'function',
        analytics: window.hasConsent ? window.hasConsent('analytics') : 'N/A',
        marketing: window.hasConsent ? window.hasConsent('marketing') : 'N/A',
        fallback: window.ADTData?.fallback_track_without_cmp
    });
    
    // Check ecommerce
    console.log('Ecommerce:', {
        enabled: window.ADTData?.enable_ecommerce_tracking,
        moduleLoaded: typeof window.ADTEcommerce !== 'undefined',
        fullFeatures: window.adtAllFeaturesEnabled ? window.adtAllFeaturesEnabled() : (window.isADTPremium ? window.isADTPremium() : 'N/A')
    });
    
    // Check pixels
    console.log('Pixel Manager:', {
        enabled: window.ADTData?.pixel_tracking_enabled,
        moduleLoaded: typeof window.ADTPixelManager !== 'undefined',
        dualMode: window.ADTData?.dual_pixel_mode,
        platforms: {
            meta: window.ADTData?.meta_pixel_enabled,
            tiktok: window.ADTData?.tiktok_pixel_enabled,
            google: window.ADTData?.google_ads_enabled,
            linkedin: window.ADTData?.linkedin_pixel_enabled
        }
    });
    
    // Check settings sync
    console.log('Settings Sync:', {
        delayUntilConsent: window.ADTData?.delay_until_consent,
        trackIfNoCMP: window.ADTData?.fallback_track_without_cmp,
        fallbackTrack: window.ADTData?.fallback_track_without_cmp,
        dataLayerBlocked: window.dataLayerBlocked
    });
    
    console.groupEnd();
};

console.log('[ADT] Debug mode active. Run ADTDebug.testIntegration() to test module integration.');
