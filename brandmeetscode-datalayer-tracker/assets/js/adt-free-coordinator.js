(function() {
    'use strict';
    
    // Ensure proper initialization order
    //window.addEventListener('DOMContentLoaded', function() {
        
			
			// ============================================================
			// 2. ROBUST MODULE COORDINATION SYSTEM
			// ============================================================

			// Maximum time to wait before forcing completion
			const ADT_MAX_INIT_TIME = 10000; // 10 seconds

			// Module initialization with comprehensive dependency management
			const initializeModules = function() {

			    // Initialize state tracking
			    if (!window._adtIntegrationState) {
			        window._adtIntegrationState = {
			            attempts: 0,
			            startTime: Date.now(),
			            maxAttempts: 50, // 5 seconds for module checks
			            initialized: false,
			            modulesChecked: {},
			            bridgesInstalled: {}
			        };
			    }

			    const state = window._adtIntegrationState;
			    state.attempts++;

			    // Prevent re-initialization
			    if (state.initialized) {
			        return;
			    }
				
			window.adtDebug('Integration: coordinator loading...');

			    // Define all modules with their load checks and requirements
				const moduleConfig = {
				    utils: {
				        check: () => typeof window.ADTUtils !== 'undefined',
				        required: true,
				        name: 'Utils Lite'
				    },
				    consent: {
				        check: () => typeof window.hasConsent === 'function' || typeof window.ADTConsentCheck === 'function',
				        required: true,
				        name: 'Consent Manager'
				    },
					session: {
					    check: () => typeof window.ADTSession !== 'undefined' && window._adtSessionInitialized === true,
					    required: true,
					    name: 'Session Manager'
					},
				    core: {
				        check: () => typeof window.ADTCore !== 'undefined',
				        required: true,
				        name: 'Core Lite'
				    },
				    eventQueue: {
				        check: () => typeof window.ADTEventQueue !== 'undefined',
				        required: window.ADTData?.delay_until_consent === 1,
				        name: 'Event Queue'
				    },
				    ecommerce: {
				        check: () => typeof window.ADTEcommerce !== 'undefined',
				        required: window.ADTData?.enable_ecommerce_tracking === 1,
				        name: 'Ecommerce Module'
				    },
				    customerType: {
				        check: () => typeof window.ADTCustomerType !== 'undefined',
				        required: window.ADTData?.enable_ecommerce_tracking === 1,
				        name: 'Customer Type'
				    },
				    pixels: {
				        check: () => typeof window.ADTPixelManager !== 'undefined',
				        required: window.ADTData?.pixel_tracking_enabled === 1,
				        name: 'Pixel Manager'
				    },
				    forms: {
				        check: () => typeof window.ADTFormTracker !== 'undefined',
				        required: window.ADTData?.formVendorTracking === 1,
				        name: 'Form Tracker'
				    },
				    contentIntel: {
				        check: () => typeof window.ADTContentIntel !== 'undefined',
				        required: window.ADTData?.include_content_intelligence === 1,
				        name: 'Content Intelligence'
				    },
				    overlay: {
				        check: () => typeof window.ADTDebugOverlay !== 'undefined',
				        required: window.ADTData?.enable_debug_overlay === 1 && window.ADTData?.is_logged_in,
				        name: 'Debug Overlay'
				    }
				};

			    // Check module status
			    const status = {
			        loaded: [],
			        pending: [],
			        optional: []
			    };

			    for (const [key, config] of Object.entries(moduleConfig)) {
			        const isLoaded = config.check();
			        state.modulesChecked[key] = isLoaded;
    
			        if (isLoaded) {
			            status.loaded.push(config.name);
			        } else if (config.required) {
			            status.pending.push(config.name);
			        } else {
			            status.optional.push(config.name);
			        }
			    }

			    window.adtDebugLog('Loaded: ' + (status.loaded.length ? status.loaded.join(', ') : 'none'));
			    if (status.pending.length) {
			        adtDebugLog('Waiting for: ' + status.pending.join(', '));
			    }

			    // If required modules pending and not timed out, wait
			    if (status.pending.length > 0 && state.attempts < state.maxAttempts) {
			        setTimeout(initializeModules, 100);
			        return;
			    }

				// Timeout warning if modules still missing
				if (status.pending.length > 0) {
				    const elapsed = ((Date.now() - state.startTime) / 1000).toFixed(1);
				    adtDebugLog('[ADT Integration] Timeout after ' + elapsed + 's. Missing: ' + status.pending.join(', '));
				}
				
			    // Mark as initialized
			    state.initialized = true;

			    // ========================================
			    // SETUP INTEGRATION BRIDGES
			    // ========================================
			    adtDebugLog('Setting up integrations...');

				// 1. GTM DATALAYER BRIDGE (ALWAYS ACTIVE FOR ECOMMERCE)
				if (state.modulesChecked.ecommerce && !state.bridgesInstalled.dataLayerBridge) {
				    state.bridgesInstalled.dataLayerBridge = true;  // FIX: Use correct variable
				    adtDebugLog('Installing GTM dataLayer bridge');

				    const originalPush = window.dataLayer.push;
				    window.dataLayer.push = function(...args) {
				        // IMPORTANT: Call original FIRST so GTM sees it
				        const result = originalPush.apply(window.dataLayer, args);
    
				        // Then optionally notify pixels
				        args.forEach(arg => {
				            if (arg && arg.event && arg.ecommerce && window.ADTPixelManager) {
				                const ecommerceEvents = [
				                    'add_to_cart', 'remove_from_cart', 'view_cart',
				                    'begin_checkout', 'add_shipping_info', 'add_payment_info',
				                    'purchase', 'view_item', 'view_item_list'
				                ];
            
				                if (ecommerceEvents.includes(arg.event) && typeof window.ADTPixelManager.handleEvent === 'function') {
				                    window.ADTPixelManager.handleEvent(arg.event, arg.ecommerce);
				                }
				            }
				        });
    
				        return result;
				    };
				}

			    // 2. CUSTOMER TYPE - ECOMMERCE INTEGRATION
			    if (state.modulesChecked.customerType && state.modulesChecked.ecommerce) {
			        adtDebugLog('Customer type integrated with ecommerce');
			    }

			    // 3. CONTENT INTELLIGENCE - CORE INTEGRATION
			    if (state.modulesChecked.contentIntel && state.modulesChecked.core) {
			        adtDebugLog('Content intelligence integrated with core');
			    }

			    // 4. EVENT QUEUE - CONSENT INTEGRATION
			    if (state.modulesChecked.eventQueue && state.modulesChecked.consent) {
			        adtDebugLog('Event queue respecting consent delays');
			    }

			    // 5. OVERLAY - ALL MODULES MONITORING
			    if (state.modulesChecked.overlay) {
			        adtDebugLog('Debug overlay monitoring all modules');
			    }

			    // 6. FORMS - ECOMMERCE INTEGRATION
			    if (state.modulesChecked.forms && state.modulesChecked.ecommerce) {
			        adtDebugLog('Form tracker can access ecommerce data');
			    }

			    adtDebugLog('Integration complete. Active: ' + status.loaded.join(', '));

			    // Dispatch completion event
			    window.dispatchEvent(new CustomEvent('adt_integration_complete', {
			        detail: {
			            loaded: status.loaded,
			            missing: status.pending,
			            optional: status.optional,
			            elapsed: ((Date.now() - state.startTime) / 1000).toFixed(2) + 's'
			        }
			    }));
			};

			// ========================================
			// INITIALIZATION TRIGGER
			// ========================================
			function startIntegrationCheck() {
			    if (window.ADTData?.delay_until_consent === '1') {
			        // Wait for consent before initializing
			        if (window.hasConsent && window.hasConsent('analytics')) {
			            initializeModules();
			        } else {
			            // Listen for consent granted event
			            window.addEventListener('adt_consent_granted', function() {
			                initializeModules();
			            });
			        }
			    } else {
			        initializeModules();
			    }
			}
			
			// Start on DOM ready or immediately if already loaded
			if (document.readyState === 'loading') {
			    document.addEventListener('DOMContentLoaded', startIntegrationCheck);
			} else {
			    // DOM already loaded (late script execution or caching)
			    startIntegrationCheck();
			}

			// Absolute failsafe - force completion after max time
			setTimeout(function() {
			    if (!window._adtIntegrationState || !window._adtIntegrationState.initialized) {
			        console.warn('[ADT Integration] Force completing after ' + (ADT_MAX_INIT_TIME/1000) + 's timeout');
			        if (window._adtIntegrationState) {
			            window._adtIntegrationState.initialized = true;
			            window._adtIntegrationState.attempts = 999;
			        }
			        window.dispatchEvent(new CustomEvent('adt_integration_complete', {
			            detail: { forced: true, reason: 'timeout' }
			        }));
			    }
			}, ADT_MAX_INIT_TIME);

			// ========================================
			// END MODULE COORDINATION
			// ========================================
			

        // GTM DATALAYER BRIDGE (INDEPENDENT OF PIXELS)
        if (window.ADTData?.enable_ecommerce_tracking === '1') {
            adtDebugLog('Installing GTM dataLayer bridge');
            
            // Store original push
            const originalPush = window.dataLayer.push;
            
            // Wrap dataLayer.push
            window.dataLayer.push = function(...args) {
                // Call original push first so GTM sees it
                const result = originalPush.apply(window.dataLayer, args);
                
                // Then notify pixel manager if it exists (for dual pixel mode)
                args.forEach(arg => {
                    if (arg && arg.event && arg.ecommerce && window.ADTPixelManager) {
                        const ecommerceEvents = [
                            'add_to_cart', 'remove_from_cart', 'view_cart',
                            'begin_checkout', 'add_shipping_info', 'add_payment_info',
                            'purchase', 'view_item', 'view_item_list'
                        ];
                        
                        if (ecommerceEvents.includes(arg.event) && typeof window.ADTPixelManager.handleEvent === 'function') {
                            window.ADTPixelManager.handleEvent(arg.event, arg.ecommerce);
                        }
                    }
                });
                
                return result;
            };
            
            adtDebugLog('GTM dataLayer bridge installed');
        }
        
        // 4. DUAL PIXEL MODE COORDINATION
        if (window.ADTData?.dual_pixel_mode === '1') {
            window.ADTDualPixelBridge = {
                firePixel: function(platform, event, data) {
                    // Fire through both GTM and direct SDK
                    if (window.ADTPixelManager) {
                        window.ADTPixelManager.fireDirect(platform, event, data);
                    }
                    // Also push to dataLayer for GTM
                    window.dataLayer.push({
                        event: 'adt_pixel_event',
                        pixel_platform: platform,
                        pixel_event: event,
                        pixel_data: data
                    });
                }
            };
        }
		//});
})();
