/*!
 * DataLayer Tracker - Complete Diagnostic Tool
 *
 * Tests ALL plugin functionality including:
 * - Script loading order and timing
 * - Premium values at each stage
 * - ADTData completeness and usefulness
 * - Event tracking
 * - Module initialization
 *
 * Usage: Paste into browser console or save as bookmark
 *
 * @preserve
 * @package    DataLayer_Tracker
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @version    2.1.0
 * @since      2.0.0
 */
(async function ADTCompleteDiagnostic() {
  console.clear();
  console.log(
    "%c🔍 ADT COMPLETE DIAGNOSTIC v2.1 STARTING...",
    "font-size: 16px; font-weight: bold; color: #4CAF50; background: #000; padding: 10px;",
  );
  const adtData = {
    passed: [],
    failed: [],
    warnings: [],
    info: [],
  };
  const config = (payload, eventName = null) => {
    adtData.passed.push({
      test: payload,
      details: eventName,
    });
    console.log("%c✅ PASS: " + payload, "color: #4CAF50;");
    if (eventName) {
      console.log("   ℹ️  " + eventName);
    }
  };
  const detail = (element, target = null) => {
    adtData.failed.push({
      test: element,
      details: target,
    });
    console.log("%c❌ FAIL: " + element, "color: #f44336;");
    if (target) {
      console.log("   💥 " + target);
    }
  };
  const result = (value, flag = null) => {
    adtData.warnings.push({
      test: value,
      details: flag,
    });
    console.log("%c⚠️  WARN: " + value, "color: #ff9800;");
    if (flag) {
      console.log("   ⚡ " + flag);
    }
  };
  const enabled = (url) => {
    adtData.info.push(url);
    console.log("%c📋 INFO: " + url, "color: #2196F3;");
  };
  const pattern = (regex) => {
    console.log(
      "\n%c━━━ " + regex + " ━━━",
      "font-size: 14px; font-weight: bold; background: #333; color: #fff; padding: 5px;",
    );
  };
  pattern("1. SCRIPT LOADING ORDER & TIMING");
  const depth = Array.from(document.querySelectorAll("script"));
  const percent = depth.filter(
    (scrollY) =>
      scrollY.src?.["includes"]("adt-") ||
      scrollY.id?.["includes"]("adt-") ||
      scrollY.innerHTML?.["includes"]("ADTData"),
  );
  enabled("Found " + percent.length + " ADT-related scripts");
  const scrollTop = [
    "wp-polyfill",
    "adt-premium-check",
    "adt-utils-lite",
    "adt-event-queue",
    "adt-consent-manager",
    "adt-log-manager",
  ];
  console.log("\n📦 Script Load Order Analysis:");
  const pageKey = [];
  percent.forEach((firedSet, milestone) => {
    let timerId = "inline";
    let intervalId = "inline";
    if (firedSet.src) {
      timerId = firedSet.src
        .split("/")
        .pop()
        .replace(/\?.*$/, "")
        .replace(".js", "");
      intervalId = "external";
    } else {
      if (firedSet.id) {
        timerId = firedSet.id;
        intervalId = "inline-id";
      } else {
        if (firedSet.innerHTML.includes("Object.assign(window.ADTData")) {
          timerId = "ADTData-config";
        } else {
          if (firedSet.innerHTML.includes("isPremiumUser")) {
            timerId = "premium-config";
          } else if (firedSet.innerHTML.includes("debugLevel")) {
            timerId = "debug-config";
          }
        }
      }
    }
    pageKey.push({
      index: milestone,
      name: timerId,
      type: intervalId,
      element: firedSet,
    });
    console.log(
      "  " + (milestone + 1) + ". [" + intervalId + "] " + timerId,
    );
  });
  const activeSec = pageKey.map((tickCount) => tickCount.name);
  let saveTick = true;
  for (let isActive = 0; isActive < scrollTop.length - 1; isActive++) {
    const lastTick = scrollTop[isActive];
    const milestones = scrollTop[isActive + 1];
    const firedMilestones = activeSec.findIndex((pagePath) =>
      pagePath.includes(lastTick),
    );
    const scrollHeight = activeSec.findIndex((viewportH) =>
      viewportH.includes(milestones),
    );
    if (firedMilestones !== -1 && scrollHeight !== -1) {
      if (firedMilestones < scrollHeight) {
        config(lastTick + " loads before " + milestones, "Correct order");
      } else {
        detail(
          milestones + " loads before " + lastTick,
          "Wrong order! This may cause issues",
        );
        saveTick = false;
      }
    }
  }
  if (saveTick) {
    config("Critical scripts load in correct order");
  }
  pattern("2. PREMIUM VALUE TIMING & PROPAGATION");
  const scrollPct = Array.from(
    document.querySelectorAll("script:not([src])"),
  ).filter(
    (threshold) =>
      threshold.innerHTML.includes("isPremiumUser") ||
      threshold.innerHTML.includes("is_premium"),
  );
  enabled(scrollPct.length + " inline scripts set premium values");
  const tolerance = [];
  scrollPct.forEach((evt, item) => {
    const key = evt.innerHTML;
    const err = key.match(/isPremiumUser["'\s:=]+(\d+|true|false)/);
    const idx = key.match(/is_premium["'\s:=]+(\d+|true|false)/);
    const len = {
      scriptIndex: item + 1,
      isPremiumUser: err ? err[1] : "not found",
      is_premium: idx ? idx[1] : "not found",
      scriptId: evt.id || "inline",
      preview: key.substring(0, 100).replace(/\s+/g, " "),
    };
    tolerance.push(len);
    console.log(
      "\n  Script " + (item + 1) + " (" + len.scriptId + "):",
    );
    console.log("    isPremiumUser: " + len.isPremiumUser);
    console.log("    is_premium: " + len.is_premium);
    if (
      (len.isPremiumUser === "1" || len.isPremiumUser === "true") &&
      (len.is_premium === "1" || len.is_premium === "true")
    ) {
      config(
        "Script " + (item + 1) + " sets premium values correctly",
      );
    } else if (
      len.isPremiumUser !== "not found" ||
      len.is_premium !== "not found"
    ) {
      result(
        "Script " + (item + 1) + " sets premium values to false/0",
        "Check if this is intentional",
      );
    }
  });
  console.log("\n📊 Current Premium State:");
  const mode = {
    isPremiumUser: window.ADTData?.["isPremiumUser"],
    is_premium: window.ADTData?.["is_premium"],
    isADTPremium:
      typeof window.isADTPremium === "function"
        ? window.isADTPremium()
        : undefined,
    canUsePremium: window.ADTData?.["canUsePremium"],
  };
  console.table(mode);
  const typeVal = [
    mode.isPremiumUser,
    mode.is_premium,
    mode.isADTPremium,
  ];
  const nameVal = typeVal.every(
    (opts) => opts === 1 || opts === true || opts === "1",
  );
  const ref = typeVal.every(
    (val) =>
      val === 0 ||
      val === false ||
      val === "0" ||
      val === undefined,
  );
  if (nameVal) {
    config("All premium indicators are TRUE and consistent");
  } else if (ref) {
    result(
      "All premium indicators are FALSE",
      "Premium features will not work",
    );
  } else {
    detail(
      "Premium indicators are INCONSISTENT",
      "Values: " + JSON.stringify(typeVal),
    );
  }
  pattern("3. ADTDATA COMPLETENESS & USEFULNESS");
  if (typeof window.ADTData === "undefined") {
    detail("ADTData object does not exist!", "Plugin failed to load");
    return;
  }
  const obj = Object.keys(window.ADTData);
  const fn = obj.length;
  enabled("ADTData has " + fn + " properties");
  if (fn > 50) {
    config("ADTData has sufficient properties", fn + " keys found");
  } else if (fn > 20) {
    result(
      "ADTData has limited properties",
      "Only " + fn + " keys (expected 50+)",
    );
  } else {
    detail(
      "ADTData is severely incomplete",
      "Only " + fn + " keys found",
    );
  }
  const arg = Object.getOwnPropertyDescriptor(window, "ADTData");
  if (arg && arg.get) {
    detail(
      "ADTData has an active getter trap!",
      "This blocks property assignments and causes premium values to fail",
    );
    console.log(
      "   🚨 Getter function:",
      arg.get.toString().substring(0, 200),
    );
  } else {
    config("No getter trap interfering with ADTData");
  }
  console.log("\n🔑 Essential Properties Check:");
  const tmp = {
    ajax_url: {
      required: true,
      category: "AJAX",
    },
    ajaxUrl: {
      required: true,
      category: "AJAX",
    },
    nonce: {
      required: true,
      category: "AJAX",
    },
    isPremiumUser: {
      required: true,
      category: "Premium",
    },
    is_premium: {
      required: true,
      category: "Premium",
    },
    debug: {
      required: false,
      category: "Debug",
    },
    debug_mode: {
      required: false,
      category: "Debug",
    },
    debugLevel: {
      required: false,
      category: "Debug",
    },
    shouldTrackPage: {
      required: true,
      category: "Tracking",
    },
    enable_ecommerce_tracking: {
      required: false,
      category: "Tracking",
    },
    pixel_tracking_enabled: {
      required: false,
      category: "Tracking",
    },
    fallback_track_without_cmp: {
      required: false,
      category: "Consent",
    },
    delay_until_consent: {
      required: false,
      category: "Consent",
    },
    sessionTimeoutMinutes: {
      required: false,
      category: "Session",
    },
    maxEventHistory: {
      required: false,
      category: "Session",
    },
    gtm_container_id: {
      required: false,
      category: "GTM",
    },
    context: {
      required: false,
      category: "Context",
      type: "object",
    },
    include: {
      required: false,
      category: "Features",
      type: "object",
    },
  };
  const node = {};
  Object.entries(tmp).forEach(([list, entry]) => {
    const state = window.ADTData[list];
    const ctx = state !== undefined && state !== null;
    const data = entry.category;
    if (!node[data]) {
      node[data] = {
        found: [],
        missing: [],
      };
    }
    if (ctx) {
      node[data].found.push(list);
      if (entry.type === "object" && typeof state !== "object") {
        result(
          list + " should be an object",
          "Currently: " + typeof state,
        );
      }
    } else {
      node[data].missing.push(list);
      if (entry.required) {
        detail(
          "Required property missing: " + list,
          "Category: " + data,
        );
      } else {
        result(
          "Optional property missing: " + list,
          "Category: " + data,
        );
      }
    }
  });
  Object.entries(node).forEach(
    ([row, { found: col, missing: mapVal }]) => {
      console.log("\n  📁 " + row + ":");
      console.log(
        "     ✅ Found: " +
          col.length +
          " - " +
          (col.join(", ") || "none"),
      );
      if (mapVal.length > 0) {
        console.log(
          "     ❌ Missing: " + mapVal.length + " - " + mapVal.join(", "),
        );
      }
    },
  );
  const setVal = [
    ["ajax_url", "ajaxUrl"],
    ["debug", "debug_mode"],
    ["is_premium", "isPremiumUser"],
    ["fallback_track_without_cmp", "fallbackTrackWithoutCMP"],
  ];
  console.log("\n🔍 Duplicate Property Check:");
  setVal.forEach(([buf, raw]) => {
    const parsed = window.ADTData[buf];
    const text = window.ADTData[raw];
    if (parsed !== undefined && text !== undefined) {
      if (parsed === text) {
        config(
          buf + " and " + raw + " are consistent",
          "Both: " + parsed,
        );
      } else {
        result(
          buf +
            " (" +
            parsed +
            ") differs from " +
            raw +
            " (" +
            text +
            ")",
          "May cause confusion",
        );
      }
    }
  });
  pattern("4. CORE PLUGIN CHECKS");
  const html = {
    adtPush: "Core push function",
    adtPushDeduped: "Deduped push function",
    isADTPremium: "Premium check function",
    hasConsent: "Consent check function",
    adtDebug: "Debug logging function",
    adtWarn: "Warning logging function",
    adtError: "Error logging function",
    _adtDispatchEvent: "Event dispatcher",
    adtShouldTrackEvent: "Event filter function",
  };
  Object.entries(html).forEach(([cmpName, handler]) => {
    if (typeof window[cmpName] === "function") {
      config(handler + " exists", cmpName);
    } else {
      detail(handler + " missing", cmpName);
    }
  });
  pattern("5. DATALAYER CHECKS");
  if (Array.isArray(window.dataLayer)) {
    config("dataLayer is an array", "Length: " + window.dataLayer.length);
  } else {
    detail("dataLayer is not an array", "Type: " + typeof window.dataLayer);
    return;
  }
  if (window.dataLayer.__originalPush) {
    config("dataLayer.push has been wrapped (consent-aware)");
  } else {
    result(
      "dataLayer.push not wrapped",
      "Consent blocking may not work properly",
    );
  }
  const callback = {};
  const response = new Set();
  window.dataLayer.forEach((request) => {
    if (request.event) {
      response.add(request.event);
      const fields = request.event.split("_")[0];
      callback[fields] = (callback[fields] || 0) + 1;
    }
  });
  console.log("\n📊 DataLayer Event Analysis:");
  console.log("  Total events: " + window.dataLayer.length);
  console.log("  Unique event names: " + response.size);
  console.log("  Events by category:");
  Object.entries(callback)
    .sort((formId, fieldId) => fieldId[1] - formId[1])
    .forEach(([cartAdds, cartRemoves]) => {
      console.log("    " + cartAdds + ": " + cartRemoves);
    });
  const sessionInfo = ["page_view", "gtm.js", "gtm.load"];
  sessionInfo.forEach((hookData) => {
    if (response.has(hookData)) {
      config('Event "' + hookData + '" found in dataLayer');
    } else {
      result(
        'Event "' + hookData + '" not found',
        "May not have fired yet",
      );
    }
  });
  pattern("6. CONSENT MANAGEMENT");
  if (typeof window.hasConsent === "function") {
    config("hasConsent() function exists");
    const pixelEvt = window.hasConsent("analytics");
    enabled("Current consent status: " + pixelEvt);
    if (pixelEvt) {
      config("Analytics consent is GRANTED");
    } else {
      result(
        "Analytics consent is DENIED",
        "Tracking will be blocked or queued",
      );
    }
  } else {
    detail("hasConsent() function missing", "Consent checks will fail");
  }
  if (typeof window.ADTConsent !== "undefined") {
    config("ADTConsent object exists");
    console.log("   Current state:", window.ADTConsent);
  } else {
    result("ADTConsent object not initialized");
  }
  if (window._adtConsentInitialized) {
    config("Consent manager initialized");
  } else {
    result("Consent manager not initialized", "May still be loading");
  }
  if (typeof window.ADTEventQueue !== "undefined") {
    config("Event Queue exists");
    const overlayEvt = window.ADTEventQueue.queue?.["length"] || 0;
    enabled("Queued events: " + overlayEvt);
    if (overlayEvt > 0 && !consentStatus) {
      config(overlayEvt + " events correctly queued (no consent yet)");
    } else if (overlayEvt > 0 && consentStatus) {
      result(
        overlayEvt + " events still queued despite consent",
        "Queue may not be flushing",
      );
    }
  }
  pattern("7. MODULE LOADING & INITIALIZATION");
  const filterEvt = {
    ADTCore: {
      name: "Core module",
      required: true,
      premium: false,
    },
    ADTSession: {
      name: "Session manager",
      required: false,
      premium: true,
    },
    ADTPixelManager: {
      name: "Pixel manager",
      required: false,
      premium: true,
    },
    ADTOverlayCore: {
      name: "Debug overlay",
      required: false,
      premium: false,
    },
    ADTEventQueue: {
      name: "Event queue",
      required: true,
      premium: false,
    },
    ADTIntegration: {
      name: "Integration coordinator",
      required: false,
      premium: false,
      conditional: "ecommerce or pixels",
    },
  };
  const searchParams = [];
  const clickId = [];
  Object.entries(filterEvt).forEach(([utmData, cookieVal]) => {
    const cookieKey = typeof window[utmData] !== "undefined";
    if (cookieKey) {
      searchParams.push(utmData);
      const consentRaw = window[utmData];
      const consentObj = consentRaw.initialized;
      const prevConsent = consentRaw.ready;
      let now = "loaded";
      if (consentObj === true || prevConsent === true) {
        now = "initialized";
        config(cookieVal.name + " is loaded and initialized");
      } else if (consentObj === false || prevConsent === false) {
        now = "loaded but not initialized";
        result(
          cookieVal.name + " is loaded but not initialized",
          "May still be initializing",
        );
      } else {
        config(cookieVal.name + " is loaded");
      }
      console.log("   Status: " + now);
    } else {
      clickId.push({
        moduleVar: utmData,
        config: cookieVal,
      });
      if (cookieVal.required) {
        detail(cookieVal.name + " is missing", "This is a required module!");
      } else {
        if (cookieVal.premium && !window.isADTPremium?.()) {
          enabled(cookieVal.name + " not loaded (not available in this build)");
        } else {
          if (cookieVal.conditional) {
            if (utmData === "ADTIntegration") {
              const last = window.ADTData?.["enable_ecommerce_tracking"];
              const diff = window.ADTData?.["pixel_tracking_enabled"];
              if (!last && !diff) {
                enabled(
                  cookieVal.name +
                    " not loaded (" +
                    cookieVal.conditional +
                    " not enabled - expected)",
                );
              } else {
                result(
                  cookieVal.name +
                    " not loaded despite " +
                    cookieVal.conditional +
                    " being enabled",
                  "May still be loading or waiting for dependencies",
                );
              }
            } else {
              enabled(
                cookieVal.name +
                  " not loaded (conditional: " +
                  cookieVal.conditional +
                  ")",
              );
            }
          } else {
            result(
              cookieVal.name + " not loaded",
              "May be disabled in settings",
            );
          }
        }
      }
    }
  });
  enabled(
    searchParams.length + "/" + Object.keys(filterEvt).length + " modules loaded",
  );
  pattern("8. ECOMMERCE TRACKING");
  if (window.ADTData.enable_ecommerce_tracking) {
    config("Ecommerce tracking is ENABLED");
    const found = !!(
      typeof wc_add_to_cart_params !== "undefined" ||
      document.querySelector(".woocommerce") ||
      document.querySelector('[class*="wc-"]') ||
      window.ADTData.context?.["is_woocommerce"]
    );
    if (found) {
      config("WooCommerce detected on page");
    } else {
      enabled("WooCommerce not detected on this page");
    }
    const detected =
      window.dataLayer?.["filter"]((retryCount) =>
        [
          "add_to_cart",
          "remove_from_cart",
          "view_item",
          "view_item_list",
          "purchase",
          "begin_checkout",
          "add_payment_info",
          "add_shipping_info",
        ].includes(retryCount.event),
      ) || [];
    if (detected.length > 0) {
      config(
        "Found " + detected.length + " ecommerce event(s) in dataLayer",
      );
      console.log(
        "   Events:",
        detected.map((maxRetries) => maxRetries.event).join(", "),
      );
    } else {
      enabled(
        "No ecommerce events in dataLayer yet (may not have triggered)",
      );
    }
    if (window.ADTData.enrich_GAtags) {
      config("GA4 ecommerce enrichment enabled");
    } else {
      enabled("GA4 ecommerce enrichment disabled");
    }
  } else {
    enabled("Ecommerce tracking is DISABLED in settings");
  }
  pattern("9. PIXEL TRACKING");
  const delayMs = window.isADTPremium?.() || false;
  if (window.ADTData.pixel_tracking_enabled) {
    config("Pixel tracking is ENABLED in settings");
    if (!delayMs) {
      detail(
        "Pixel tracking enabled but pixels module not loaded in this build",
        "Pixels will not work without premium",
      );
    }
    const timeoutMs = {
      "Meta (Facebook)": {
        enabled: window.ADTData.meta_pixel_enabled,
        id: window.ADTData.meta_pixel_id,
        sdk: typeof window.fbq === "function",
      },
      TikTok: {
        enabled: window.ADTData.tiktok_pixel_enabled,
        id: window.ADTData.tiktok_pixel_id,
        sdk: typeof window.ttq === "function",
      },
      "Google Ads": {
        enabled: window.ADTData.google_ads_enabled,
        id: window.ADTData.google_ads_id,
        sdk: typeof window.gtag === "function",
      },
      LinkedIn: {
        enabled: window.ADTData.linkedin_pixel_enabled,
        id: window.ADTData.linkedin_partner_id,
        sdk: typeof window.lintrk === "function",
      },
      "X (Twitter)": {
        enabled: window.ADTData.x_pixel_enabled,
        id: window.ADTData.x_pixel_id,
        sdk: typeof window.twq === "function",
      },
    };
    let hasConsent = 0;
    console.log("\n  Individual Pixel Status:");
    Object.entries(timeoutMs).forEach(([blocked, wasBlocked]) => {
      if (wasBlocked.enabled) {
        hasConsent++;
        console.log("    " + blocked + ":");
        console.log("      ✅ Enabled: Yes");
        console.log("      ID: " + (wasBlocked.id || "❌ Not set"));
        console.log(
          "      SDK: " + (wasBlocked.sdk ? "✅ Loaded" : "❌ Not loaded"),
        );
        if (!wasBlocked.id) {
          detail(blocked + " enabled but no ID configured");
        } else if (!wasBlocked.sdk) {
          result(
            blocked + " configured but SDK not loaded",
            "Pixel may not fire",
          );
        } else {
          config(blocked + " fully configured and SDK loaded");
        }
      }
    });
    if (hasConsent === 0) {
      result(
        "Pixel tracking enabled but no individual pixels are enabled",
        "Pixel Manager will not load",
      );
    } else {
      enabled(hasConsent + " pixel(s) enabled");
    }
    if (typeof window.ADTPixelManager !== "undefined") {
      config("Pixel Manager loaded");
      if (window.ADTPixelManager.initialized) {
        config("Pixel Manager initialized");
      }
    } else if (hasConsent > 0) {
      detail(
        "Pixel Manager not loaded despite enabled pixels",
        "Check script loading and console for errors",
      );
    } else {
      enabled(
        "Pixel Manager not loaded (no individual pixels enabled - this is expected)",
      );
      enabled(
        "The Integration Coordinator timeout warning is harmless in this case",
      );
    }
    const analyticsOk = window.ADTData.pixel_dispatch_mode || "plugin_only";
    enabled("Pixel dispatch mode: " + analyticsOk);
  } else {
    enabled("Pixel tracking is DISABLED in settings");
  }
  pattern("10. GA4 MEASUREMENT PROTOCOL");
  if (window.ADTData.ga4_mp_enabled) {
    config("GA4 Measurement Protocol is ENABLED");
    if (!delayMs) {
      detail(
        "GA4 Measurement Protocol enabled but server-side module not in this build",
        "Server-side tracking will not work",
      );
    }
    if (window.ADTData.ga4_measurement_id) {
      config(
        "GA4 Measurement ID configured: " + window.ADTData.ga4_measurement_id,
      );
    } else {
      detail(
        "GA4 Measurement ID not configured",
        "Server-side events cannot be sent",
      );
    }
    if (window.ADTData.ga4_mp_nonce) {
      config("GA4 MP nonce present (AJAX secured)");
    } else {
      detail("GA4 MP nonce missing", "AJAX requests will fail");
    }
    if (window.ADTData.ga4_mp_debug_mode) {
      enabled("GA4 MP debug mode ENABLED (events go to DebugView)");
    }
  } else {
    enabled("GA4 Measurement Protocol is DISABLED");
  }
  pattern("11. SESSION TRACKING");
  const marketingOk =
    typeof window.ADTSession !== "undefined" &&
    typeof window.ADTSession.id === "function";
  if (marketingOk) {
    config("Session Manager loaded");
    const extra = window.ADTSession.id();
    const source = extra === null;
    if (source) {
      result(
        "Session Manager loaded as STUB only",
        "Premium check may have failed during initialization",
      );
    } else {
      config(
        "Session ID generated: " + extra.substring(0, 0x10) + "...",
      );
      if (typeof window.ADTSession.tabId === "function") {
        const granted = window.ADTSession.tabId();
        if (granted) {
          config("Tab ID: " + granted.substring(0, 0x10) + "...");
        }
      }
      if (typeof window.ADTSession.number === "function") {
        const previous = window.ADTSession.number();
        if (previous > 0) {
          config("Session number: " + previous);
        }
      }
      if (typeof window.ADTSession.getActiveTime === "function") {
        const storageErr = window.ADTSession.getActiveTime();
        if (storageErr >= 0) {
          enabled("Active time: " + storageErr + " seconds");
        }
      }
      if (typeof window.ADTSession.isIdle === "function") {
        const isIdle = window.ADTSession.isIdle();
        enabled("User is " + (isIdle ? "idle" : "active"));
      }
    }
    if (window.ADTSession.metrics) {
      config("Session metrics tracking active");
      console.log("   Current metrics:", window.ADTSession.metrics);
    } else {
      enabled("Session metrics not exposed (may be internal)");
    }
  } else if (delayMs) {
    detail(
      "Session Manager not loaded despite premium status",
      "Check script loading order and console for errors",
    );
  } else {
    enabled("Session Manager not loaded (requires premium)");
  }
  pattern("12. DEBUG OVERLAY");
  if (window.ADTData.enable_debug_overlay) {
    config("Debug overlay ENABLED in settings");
    if (typeof window.ADTOverlayCore !== "undefined") {
      config("Debug overlay core loaded");
      if (window.ADTOverlayCore.initialized) {
        config("Debug overlay initialized");
      } else {
        result("Debug overlay not initialized", "May still be loading");
      }
      const overlayEl = document.getElementById("adt-debug-overlay");
      if (overlayEl) {
        config("Debug overlay element exists in DOM");
        const overlayVisible = overlayEl.style.display !== "none";
        enabled("Overlay visible: " + overlayVisible);
      } else {
        result("Debug overlay not in DOM yet", "May not have rendered");
      }
    } else {
      result(
        "Debug overlay core not loaded",
        "Check permissions and script loading",
      );
    }
  } else {
    enabled("Debug overlay is DISABLED in settings");
  }
  pattern("13. GTM CONTAINER");
  if (window.ADTData.gtm_container_id) {
    config(
      "GTM Container ID configured: " + window.ADTData.gtm_container_id,
    );
    if (typeof window.google_tag_manager !== "undefined") {
      config("GTM script loaded");
      const containerId = window.ADTData.gtm_container_id;
      if (window.google_tag_manager[containerId]) {
        config("Container " + containerId + " is active");
        const gtmDataLayer = window.google_tag_manager[containerId].dataLayer;
        if (gtmDataLayer) {
          enabled(
            "Container has " + gtmDataLayer.get("length") + " dataLayer entries",
          );
        }
      } else {
        result(
          "Container " + containerId + " not found in GTM",
          "May still be loading",
        );
      }
    } else {
      result("GTM not detected", "Container script may not have loaded");
    }
  } else {
    enabled("No GTM Container ID configured");
  }
  pattern("14. LIVE EVENT PUSH TESTS");
  enabled("Testing event push functionality with live events...");
  const diagnosticTests = [
    {
      name: "Basic diagnostic event",
      payload: {
        event: "adt_diagnostic_test_basic",
        test_type: "basic",
        timestamp: Date.now(),
      },
    },
    {
      name: "Event with nested data",
      payload: {
        event: "adt_diagnostic_test_data",
        test_type: "nested",
        test_data: {
          string: "test",
          number: 0x7b,
          boolean: true,
          array: [1, 0x2, 3],
        },
        timestamp: Date.now(),
      },
    },
    {
      name: "Ecommerce-style event",
      payload: {
        event: "adt_diagnostic_test_ecommerce",
        test_type: "ecommerce",
        ecommerce: {
          currency: "USD",
          value: 99.99,
          items: [
            {
              item_id: "TEST-001",
              item_name: "Test Product",
              price: 99.99,
              quantity: 1,
            },
          ],
        },
        timestamp: Date.now(),
      },
    },
  ];
  const dlStartLen = window.dataLayer?.["length"] || 0;
  const pushResults = [];
  for (const { name: testName, payload: testPayload } of diagnosticTests) {
    try {
      if (typeof window.adtPush === "function") {
        window.adtPush(testPayload);
        pushResults.push({
          name: testName,
          success: true,
          method: "adtPush",
        });
        config(testName + " pushed successfully with adtPush()");
      } else {
        window.dataLayer.push(testPayload);
        pushResults.push({
          name: testName,
          success: true,
          method: "dataLayer.push",
        });
        config(testName + " pushed successfully with dataLayer.push()");
      }
    } catch (pushErr) {
      pushResults.push({
        name: testName,
        success: false,
        error: pushErr.message,
      });
      detail("Failed to push " + testName, pushErr.message);
    }
  }
  const dlBefore = window.dataLayer?.["length"] || 0;
  const eventsAdded = dlBefore - dlStartLen;
  enabled(
    eventsAdded +
      " of " +
      diagnosticTests.length +
      " test events successfully added to dataLayer",
  );
  if (eventsAdded < diagnosticTests.length) {
    result(
      "Some test events were blocked",
      "May be due to consent or other filters",
    );
  }
  const foundTestEvents = window.dataLayer.filter((evt) =>
    evt.event?.["includes"]("adt_diagnostic_test"),
  );
  if (foundTestEvents.length >= diagnosticTests.length) {
    config("All diagnostic test events found in dataLayer");
  }
  pattern("15. PERFORMANCE & HEALTH CHECKS");
  const foundTests = window.dataLayer?.["length"] || 0;
  if (foundTests < 100) {
    config("DataLayer size is healthy: " + foundTests + " events");
  } else if (foundTests < 200) {
    result(
      "DataLayer is getting large: " + foundTests + " events",
      "Consider periodic cleanup",
    );
  } else {
    detail(
      "DataLayer is too large: " + foundTests + " events",
      "Performance may be impacted",
    );
  }
  const dlSize = performance
    .getEntriesByType("resource")
    .filter(
      (sizeWarn) =>
        sizeWarn.name.includes("adt-") && sizeWarn.transferSize === 0,
    );
  if (dlSize.length === 0) {
    config("All ADT scripts loaded successfully");
  } else {
    detail(
      dlSize.length + " ADT script(s) failed to load",
      dlSize.map((sizeNote) => sizeNote.name.split("/").pop()).join(", "),
    );
  }
  if (performance.memory) {
    const testName = Math.round(performance.memory.usedJSHeapSize / 0x100000);
    const testCfg = Math.round(performance.memory.jsHeapSizeLimit / 0x100000);
    const testResult = Math.round((testName / testCfg) * 100);
    enabled(
      "Memory usage: " +
        testName +
        "MB / " +
        testCfg +
        "MB (" +
        testResult +
        "%)",
    );
    if (testResult < 50) {
      config("Memory usage is healthy");
    } else if (testResult < 0x50) {
      result("Memory usage is elevated", "Monitor for leaks");
    } else {
      detail("Memory usage is very high", "Possible memory leak");
    }
  }
  pattern("16. SETTINGS VALIDATION");
  const stepErr = {
    tracking: ["shouldTrackPage", "regex_exclude", "regex_include"],
    consent: [
      "delay_until_consent",
      "fallback_track_without_cmp",
      "cmp_detection_timeout",
    ],
    session: ["sessionTimeoutMinutes", "maxEventHistory", "push_session_exit"],
    features: [
      "enable_ecommerce_tracking",
      "pixel_tracking_enabled",
      "ga4_mp_enabled",
    ],
  };
  Object.entries(stepErr).forEach(([stepOk, pixelRow]) => {
    console.log("\n  " + stepOk.toUpperCase() + ":");
    pixelRow.forEach((pixelName) => {
      const pixelCfg = window.ADTData[pixelName];
      if (pixelCfg !== undefined) {
        console.log("    ✓ " + pixelName + ": " + JSON.stringify(pixelCfg));
      } else {
        console.log("    ✗ " + pixelName + ": not set");
      }
    });
  });
  pattern("DIAGNOSTIC SUMMARY");
  const totalChecks =
    adtData.passed.length +
    adtData.warnings.length +
    adtData.failed.length;
  const passRate =
    totalChecks > 0
      ? Math.round((adtData.passed.length / totalChecks) * 100)
      : 0;
  console.log(
    "\n%c✅ PASSED: " + adtData.passed.length,
    "color: #4CAF50; font-weight: bold; font-size: 16px;",
  );
  console.log(
    "%c⚠️  WARNINGS: " + adtData.warnings.length,
    "color: #ff9800; font-weight: bold; font-size: 16px;",
  );
  console.log(
    "%c❌ FAILED: " + adtData.failed.length,
    "color: #f44336; font-weight: bold; font-size: 16px;",
  );
  if (adtData.failed.length > 0) {
    console.log(
      "\n%c🔴 CRITICAL FAILURES:",
      "color: #f44336; font-weight: bold; font-size: 14px; background: #ffebee; padding: 5px;",
    );
    adtData.failed.forEach(
      ({ test: testEvents, details: foundTests }, dlSize) => {
        console.log("\n  " + (dlSize + 1) + ". ❌ " + testEvents);
        if (foundTests) {
          console.log("     💥 " + foundTests);
        }
      },
    );
  }
  if (adtData.warnings.length > 0) {
    console.log(
      "\n%c🟡 WARNINGS (non-critical):",
      "color: #ff9800; font-weight: bold; font-size: 14px; background: #fff3e0; padding: 5px;",
    );
    adtData.warnings.forEach(
      ({ test: sizeWarn, details: sizeNote }, testName) => {
        console.log("\n  " + (testName + 1) + ". ⚠️  " + sizeWarn);
        if (sizeNote) {
          console.log("     ⚡ " + sizeNote);
        }
      },
    );
  }
  console.log(
    "\n%c═══════════════════════════════════════════════",
    "font-size: 14px;",
  );
  const scoreColor =
    passRate >= 90 ? "#4CAF50" : passRate >= 70 ? "#ff9800" : "#f44336";
  console.log(
    "%c🎯 OVERALL HEALTH SCORE: " + passRate + "%",
    "font-size: 20px; font-weight: bold; color: " +
      scoreColor +
      "; background: #000; padding: 10px;",
  );
  console.log(
    "%c═══════════════════════════════════════════════",
    "font-size: 14px;",
  );
  if (passRate >= 90) {
    console.log(
      "\n%c🎉 EXCELLENT! Plugin is working perfectly!",
      "color: #4CAF50; font-size: 16px; font-weight: bold; background: #e8f5e9; padding: 10px;",
    );
    console.log(
      "   All critical systems operational. Minor warnings can be addressed as needed.",
    );
  } else {
    if (passRate >= 70) {
      console.log(
        "\n%c✅ GOOD! Plugin is mostly working correctly.",
        "color: #ff9800; font-size: 16px; font-weight: bold; background: #fff3e0; padding: 10px;",
      );
      console.log(
        "   Review warnings and failures above. Most features should work but some optimization recommended.",
      );
    } else if (passRate >= 50) {
      console.log(
        "\n%c⚠️  NEEDS ATTENTION! Several issues detected.",
        "color: #ff9800; font-size: 16px; font-weight: bold; background: #fff3e0; padding: 10px;",
      );
      console.log(
        "   Some features may not work correctly. Address critical failures immediately.",
      );
    } else {
      console.log(
        "\n%c🚨 CRITICAL! Major problems detected!",
        "color: #f44336; font-size: 16px; font-weight: bold; background: #ffebee; padding: 10px;",
      );
      console.log(
        "   Plugin may not be functioning. Address all failures immediately.",
      );
    }
  }
  window._adtDiagnosticResults = {
    version: "2.1.0",
    timestamp: new Date().toISOString(),
    score: passRate,
    summary: {
      passed: adtData.passed.length,
      warnings: adtData.warnings.length,
      failed: adtData.failed.length,
      total: totalChecks,
    },
    details: adtData,
    adtData: {
      keys: obj,
      totalKeys: fn,
      premiumStatus: mode,
      scriptOrder: pageKey.map((testResult) => ({
        name: testResult.name,
        type: testResult.type,
      })),
    },
    performance: {
      dataLayerSize: stepErr,
      scriptErrors: stepOk.length,
      loadedModules: searchParams,
      missingModules: clickId.map((pixelRow) => pixelRow.moduleVar),
    },
  };
  console.log(
    "\n%c💾 Full results saved to: window._adtDiagnosticResults",
    "color: #2196F3; font-size: 14px; background: #e3f2fd; padding: 5px;",
  );
  console.log(
    "%c📋 To view full report: console.table(window._adtDiagnosticResults.details)",
    "color: #2196F3;",
  );
  console.log(
    "%c📊 To export: copy(JSON.stringify(window._adtDiagnosticResults, null, 2))",
    "color: #2196F3;",
  );
  console.log(
    "\n%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "font-size: 14px;",
  );
  console.log(
    "%c🔍 ADT DIAGNOSTIC COMPLETE",
    "font-size: 16px; font-weight: bold; color: #4CAF50;",
  );
  console.log(
    "%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "font-size: 14px;",
  );
  return window._adtDiagnosticResults;
})();
