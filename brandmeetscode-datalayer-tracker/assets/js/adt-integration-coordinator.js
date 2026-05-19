/*!
 * DataLayer Tracker - Integration Coordinator
 *
 * Ensures proper initialization order and communication between
 * Consent Manager, E-commerce, and Pixel Manager
 *
 * IMPORTANT: Load AFTER consent manager but BEFORE other modules
 *
 * @preserve
 * @package    DataLayer_Tracker
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
(function () {
  "use strict";

  if (window._adtIntegrationInitialized) {
    return;
  }
  window._adtIntegrationInitialized = true;
  const adtData =
    window.adtDebug ||
    function (...args) {
      if (window.adtIsDebugEnabled && window.adtIsDebugEnabled()) {
        console.log("[ADT Integration]", ...args);
      }
    };
  adtData("Integration: coordinator loading...");
  const payload = {
    modules: {
      consent: false,
      ecommerce: false,
      pixels: false,
      session: false,
    },
    callbacks: {
      onAllReady: [],
      onConsentReady: [],
      onEcommerceReady: [],
      onPixelsReady: [],
    },
    moduleReady(eventName) {
      if (!this.modules.hasOwnProperty(eventName)) {
        adtData("Integration: Unknown module: " + eventName);
        return;
      }
      this.modules[eventName] = true;
      adtData("Integration: Module ready: " + eventName);
      const detail =
        this.callbacks[
          "on" +
            (eventName.charAt(0).toUpperCase() + eventName.slice(1)) +
            "Ready"
        ];
      if (detail) {
        detail.forEach((element) => {
          try {
            element();
          } catch (target) {
            window.adtError(
              "Integration: Callback error for " + eventName + ":",
              target,
            );
          }
        });
      }
      this.checkAllReady();
    },
    checkAllReady() {
      const result = ["consent"];
      if (window.ADTData && window.ADTData.enable_ecommerce_tracking === "1") {
        result.push("ecommerce");
      }
      if (window.ADTData && window.ADTData.pixel_tracking_enabled === "1") {
        result.push("pixels");
      }
      const value = result.every((flag) => this.modules[flag]);
      if (value && this.callbacks.onAllReady.length > 0) {
        adtData("Integration: All required modules ready");
        this.callbacks.onAllReady.forEach((enabled) => {
          try {
            enabled();
          } catch (url) {
            window.adtError(
              "Integration: onAllReady callback error:",
              url,
            );
          }
        });
        this.callbacks.onAllReady = [];
      }
    },
    onReady(pattern, regex) {
      if (typeof regex !== "function") {
        return;
      }
      if (pattern === "all") {
        this.callbacks.onAllReady.push(regex);
        this.checkAllReady();
      } else if (
        this.callbacks[
          "on" +
            (pattern.charAt(0).toUpperCase() + pattern.slice(1)) +
            "Ready"
        ]
      ) {
        this.callbacks[
          "on" +
            (pattern.charAt(0).toUpperCase() + pattern.slice(1)) +
            "Ready"
        ].push(regex);
        if (this.modules[pattern]) {
          regex();
        }
      }
    },
    setupCommunication() {
      adtData("Integration: Setting up cross-module communication");
      if (
        window.ADTData &&
        window.ADTData.enable_ecommerce_tracking === "1" &&
        window.ADTData &&
        window.ADTData.pixel_tracking_enabled === "1"
      ) {
        this.setupEcommercePixelBridge();
      }
      this.setupConsentBridge();
      if (window.ADTData && window.ADTData.enable_ecommerce_tracking === "1") {
        this.setupSessionEcommerceBridge();
      }
    },
    setupEcommercePixelBridge() {
      adtData("Integration: Setting up ecommerce-pixel bridge");
      this.onReady("all", () => {
        if (!window.ADTEcommerce || !window.ADTPixelManager) {
          return;
        }
        if (window._adtEcomPixelBridgeActive) {
          adtData(
            "Integration: Ecommerce-pixel bridge already active, skipping",
          );
          return;
        }
        window._adtEcomPixelBridgeActive = true;
        const depth = window.dataLayer.push;
        window.dataLayer.push = function (...percent) {
          try {
            percent.forEach((scrollY) => {
              if (scrollY && scrollY.event && scrollY.ecommerce) {
                const scrollTop = [
                  "add_to_cart",
                  "remove_from_cart",
                  "view_cart",
                  "begin_checkout",
                  "add_shipping_info",
                  "add_payment_info",
                  "purchase",
                  "view_item",
                  "view_item_list",
                  "select_item",
                  "cart_abandonment",
                  "cart_abandonment_exit",
                  "refund",
                ];
                if (
                  scrollTop.includes(scrollY.event) &&
                  window.ADTPixelManager &&
                  window.ADTPixelManager.trackEvent
                ) {
                  adtData(
                    "Integration: Forwarding " +
                      scrollY.event +
                      " to pixel manager",
                  );
                  const pageKey = {
                    currency:
                      scrollY.ecommerce.currency ||
                      (window.ADTData && window.ADTData.currency) ||
                      "USD",
                    value: parseFloat(
                      scrollY.ecommerce.value ||
                        scrollY.ecommerce.total ||
                        0,
                    ),
                    items: Array.isArray(scrollY.ecommerce.items)
                      ? scrollY.ecommerce.items
                      : [],
                  };
                  switch (scrollY.event) {
                    case "purchase":
                      pageKey.transaction_id =
                        scrollY.ecommerce.transaction_id ||
                        scrollY.ecommerce.id;
                      pageKey.tax = parseFloat(
                        scrollY.ecommerce.tax || 0,
                      );
                      pageKey.shipping = parseFloat(
                        scrollY.ecommerce.shipping || 0,
                      );
                      pageKey.coupon = scrollY.ecommerce.coupon;
                      break;
                    case "refund":
                      pageKey.transaction_id =
                        scrollY.ecommerce.transaction_id;
                      break;
                    case "view_item":
                    case "select_item":
                      pageKey.item_id =
                        scrollY.ecommerce.items &&
                        scrollY.ecommerce.items[0]
                          ? scrollY.ecommerce.items[0].item_id
                          : undefined;
                      pageKey.item_name =
                        scrollY.ecommerce.items &&
                        scrollY.ecommerce.items[0]
                          ? scrollY.ecommerce.items[0].item_name
                          : undefined;
                      break;
                    case "begin_checkout":
                    case "add_shipping_info":
                    case "add_payment_info":
                      pageKey.checkout_step =
                        scrollY.ecommerce.checkout_step;
                      pageKey.checkout_option =
                        scrollY.ecommerce.checkout_option;
                      break;
                    case "view_item_list":
                      pageKey.item_list_id = scrollY.ecommerce.item_list_id;
                      pageKey.item_list_name =
                        scrollY.ecommerce.item_list_name;
                      break;
                  }
                  if (
                    pageKey.value > 0 ||
                    pageKey.items.length > 0 ||
                    scrollY.event === "view_item"
                  ) {
                    window.ADTPixelManager.trackEvent(
                      scrollY.event,
                      pageKey,
                    );
                  } else {
                    adtData(
                      "Integration: Skipping " +
                        scrollY.event +
                        " - no value or items",
                    );
                  }
                }
              }
            });
          } catch (firedSet) {
            adtData(
              "Integration: Error in ecommerce-pixel bridge:",
              firedSet,
            );
          }
          return depth.apply(window.dataLayer, percent);
        };
        adtData("Integration: Ecommerce-pixel bridge active");
      });
    },
    setupConsentBridge() {
      adtData("Integration: Setting up consent bridge");
      window.addEventListener("adt_consent_granted", (milestone) => {
        adtData("Integration: Consent granted, notifying modules");
        if (window.ADTEcommerce && window.ADTEcommerce.onConsentGranted) {
          window.ADTEcommerce.onConsentGranted();
        }
        if (window.ADTPixelManager && window.ADTPixelManager.onConsentGranted) {
          window.ADTPixelManager.onConsentGranted();
        }
      });
      window.addEventListener("adt_consent_revoked", (timerId) => {
        adtData("Integration: Consent revoked, notifying modules");
        if (window.ADTEcommerce && window.ADTEcommerce.onConsentRevoked) {
          window.ADTEcommerce.onConsentRevoked();
        }
        if (window.ADTPixelManager && window.ADTPixelManager.onConsentRevoked) {
          window.ADTPixelManager.onConsentRevoked();
        }
      });
    },
    setupSessionEcommerceBridge() {
      adtData("Integration: Setting up session-ecommerce bridge");
      this.onReady("all", () => {
        if (!window.ADTSession || !window.ADTEcommerce) {
          return;
        }
        if (window.ADTSession.registerHook) {
          window.ADTSession.registerHook("exit", (intervalId) => {
            if (window.ADTEcommerce && window.ADTEcommerce.getCartState) {
              const activeSec = window.ADTEcommerce.getCartState();
              if (
                activeSec.items &&
                activeSec.items.length > 0 &&
                !activeSec.purchaseCompleted
              ) {
                adtData(
                  "Integration: Session exit with items in cart - triggering abandonment",
                );
                window.dataLayer.push({
                  event: "cart_abandonment",
                  reason: "session_exit",
                  ecommerce: {
                    currency: activeSec.currency,
                    value: activeSec.value,
                    items: activeSec.items,
                  },
                });
              }
            }
          });
        }
      });
    },
    init() {
      adtData("Integration: Initializing integration coordinator");
      this.modules.consent = window.ADTConsentReady === true;
      this.modules.ecommerce = typeof window.ADTEcommerce !== "undefined";
      this.modules.pixels = typeof window.ADTPixelManager !== "undefined";
      this.modules.session = typeof window.ADTSession !== "undefined";
      this.setupCommunication();
      this.monitorModules();
      adtData("Integration: Coordinator initialized", this.modules);
    },
    monitorModules() {
      let tickCount = 0;
      const saveTick = Date.now();
      const isActive =
        ((window.ADTData && window.ADTData.cmp_detection_timeout) || 0x5) *
        1000;
      const lastTick = setInterval(() => {
        tickCount++;
        const milestones = Date.now() - saveTick;
        if (!this.modules.consent) {
          if (window.ADTConsentReady === true) {
            this.moduleReady("consent");
          } else if (milestones >= isActive) {
            adtData(
              "Integration: CMP detection timeout (" +
                isActive +
                "ms) - using fallback settings",
            );
            this.moduleReady("consent");
          }
        }
        if (
          !this.modules.ecommerce &&
          typeof window.ADTEcommerce !== "undefined"
        ) {
          this.moduleReady("ecommerce");
        }
        if (
          !this.modules.pixels &&
          (typeof window.ADTPixelManager !== "undefined" ||
            typeof window.ADTPixels !== "undefined")
        ) {
          this.moduleReady("pixels");
        }
        if (!this.modules.session) {
          if (typeof window.ADTSession !== "undefined") {
            if (window.ADTSession._isStub === true) {
              adtData("Integration: Session Manager is a stub (non-premium)");
              this.moduleReady("session");
            } else {
              if (window._adtSessionInitialized === true) {
                adtData("Integration: Session Manager initialized");
                this.moduleReady("session");
              } else if (milestones < 0xbb8) {
                if (tickCount % 0x1e === 0) {
                  adtData(
                    "Integration: Waiting for Session Manager initialization...",
                  );
                }
              } else {
                adtData(
                  "Integration: Session Manager timeout after 3s, marking as ready",
                );
                this.moduleReady("session");
              }
            }
          } else if (milestones >= 0x7d0) {
            adtData("Integration: No Session Manager detected after 2s");
            this.moduleReady("session");
          }
        }
        const firedMilestones =
          this.modules.consent &&
          ((window.ADTData &&
            window.ADTData.enable_ecommerce_tracking !== "1") ||
            this.modules.ecommerce) &&
          ((window.ADTData && window.ADTData.pixel_tracking_enabled !== "1") ||
            this.modules.pixels);
        if (tickCount >= 0x46 || firedMilestones) {
          clearInterval(lastTick);
          const pagePath = Object.entries(this.modules)
            .filter(([scrollHeight, viewportH]) => viewportH)
            .map(([scrollPct]) => scrollPct);
          const threshold = Object.entries(this.modules)
            .filter(([tolerance, evt]) => !evt)
            .map(([item]) => item);
          if (
            threshold.length > 0 &&
            threshold.some((key) => key !== "session")
          ) {
            adtData(
              "Integration: Timeout after " +
                (milestones / 1000).toFixed(1) +
                "s. Missing: " +
                threshold.join(", "),
            );
          } else {
            adtData("Integration: Module monitoring complete", {
              duration: milestones + "ms",
              checks: tickCount,
              loaded: pagePath,
            });
          }
          this.checkAllReady();
        }
      }, 100);
    },
  };
  payload.init();
  window.ADTIntegration = {
    moduleReady: (err) => payload.moduleReady(err),
    onReady: (idx, len) => payload.onReady(idx, len),
    getStatus: () => ({
      ...payload.modules,
    }),
    withConsent: function (mode, typeVal = 5000) {
      if (
        typeof window.hasConsent === "function" &&
        window.hasConsent("analytics")
      ) {
        mode();
        return;
      }
      if (window.ADTData && window.ADTData.fallback_track_without_cmp === "1") {
        mode();
        return;
      }
      const nameVal = Date.now();
      const opts = setInterval(() => {
        const ref = window.hasConsent && window.hasConsent("analytics");
        const val = Date.now() - nameVal;
        if (ref) {
          clearInterval(opts);
          mode();
        } else if (val >= typeVal) {
          clearInterval(opts);
          if (
            window.ADTData &&
            window.ADTData.fallback_track_without_cmp === "1"
          ) {
            mode();
          }
        }
      }, 100);
    },
    test: function () {
      console.group("ADT Module Integration Status");
      console.log("Modules:", payload.modules);
      console.log("Settings:", {
        consentDelay: window.ADTData && window.ADTData.delay_until_consent,
        fallbackTrack:
          window.ADTData && window.ADTData.fallback_track_without_cmp,
        ecommerceEnabled:
          window.ADTData && window.ADTData.enable_ecommerce_tracking,
        pixelsEnabled: window.ADTData && window.ADTData.pixel_tracking_enabled,
        dualPixelMode: window.ADTData && window.ADTData.dual_pixel_mode,
      });
      console.log("Consent:", {
        hasFunction: typeof window.hasConsent === "function",
        analytics:
          typeof window.hasConsent === "function"
            ? window.hasConsent("analytics")
            : undefined,
        marketing:
          typeof window.hasConsent === "function"
            ? window.hasConsent("marketing")
            : undefined,
      });
      console.groupEnd();
    },
  };
  adtData(
    "Integration: coordinator ready. Use ADTIntegration.test() to check status.",
  );
})();
