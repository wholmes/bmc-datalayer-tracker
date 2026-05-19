/*!
 * DataLayer Tracker - Smart Diagnostic Tool
 *
 * CONTEXT-AWARE HEALTH SCORING
 * This version understands:
 * - Which features are enabled/disabled
 * - Premium vs Free tier
 * - What SHOULD work vs what's optional
 * - Scores only what's relevant to your configuration
 *
 * KEY IMPROVEMENTS:
 * - Tests are categorized by relevance (required/optional/not-applicable)
 * - Score only includes tests that SHOULD pass for your config
 * - Clear explanation of why tests are skipped
 * - Smart warnings vs actual errors
 *
 * Usage: Paste into browser console or save as bookmark
 *
 * @preserve
 * @package    DataLayer_Tracker
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @version    3.0.0
 * @since      3.0.0
 */
(async function ADTSmartDiagnostic() {
  console.clear();
  console.log(
    "%c🔍 ADT SMART DIAGNOSTIC v3.0 STARTING...",
    "font-size: 16px; font-weight: bold; color: #4CAF50; background: #000; padding: 10px;",
  );
  console.log(
    "%c✨ Context-Aware Scoring - Only tests what matters for YOUR configuration",
    "color: #2196F3; font-style: italic;",
  );
  const adtData = {
    required_passed: [],
    required_failed: [],
    optional_passed: [],
    optional_warned: [],
    skipped: [],
    info: [],
  };
  const config = (payload, eventName = null, detail = true) => {
    const element = detail ? "required_passed" : "optional_passed";
    adtData[element].push({
      test: payload,
      details: eventName,
    });
    const target = detail ? "✅" : "✔️";
    console.log(
      "%c" +
        target +
        " " +
        (detail ? "PASS" : "OPTIONAL PASS") +
        ": " +
        payload,
      "color: " + (detail ? "#4CAF50" : "#81C784") + ";",
    );
    if (eventName) {
      console.log("   ℹ️  " + eventName);
    }
  };
  const result = (value, flag = null, enabled = true) => {
    const url = enabled ? "required_failed" : "optional_warned";
    adtData[url].push({
      test: value,
      details: flag,
    });
    const pattern = enabled ? "❌" : "⚠️";
    console.log(
      "%c" +
        pattern +
        " " +
        (enabled ? "FAIL" : "OPTIONAL ISSUE") +
        ": " +
        value,
      "color: " + (enabled ? "#f44336" : "#ff9800") + ";",
    );
    if (flag) {
      console.log("   💥 " + flag);
    }
  };
  const regex = (depth, percent) => {
    adtData.skipped.push({
      test: depth,
      reason: percent,
    });
    console.log("%c⏭️  SKIP: " + depth, "color: #9E9E9E;");
    console.log("   💡 " + percent);
  };
  const scrollY = (scrollTop) => {
    adtData.info.push(scrollTop);
    console.log("%c📋 INFO: " + scrollTop, "color: #2196F3;");
  };
  const pageKey = (firedSet) => {
    console.log(
      "\n%c━━━ " + firedSet + " ━━━",
      "font-size: 14px; font-weight: bold; background: #333; color: #fff; padding: 5px;",
    );
  };
  pageKey("0. CONFIGURATION DETECTION");
  const milestone = {
    isPremium: false,
    features: {
      ecommerce: false,
      pixels: false,
      ga4mp: false,
      sessionManager: false,
      debugOverlay: false,
      contentIntelligence: false,
      videoTracking: false,
      formTracking: false,
      clickTracking: false,
      engagement: false,
      consentManagement: false,
    },
    gtmConfigured: false,
    hasWooCommerce: false,
  };
  if (window.ADTData) {
    const timerId =
      typeof window.isADTPremium === "function"
        ? window.isADTPremium()
        : window.isADTPremium;
    milestone.isPremium = !!(
      window.ADTData.isPremiumUser ||
      window.ADTData.is_premium ||
      timerId
    );
    milestone.features.ecommerce = !!window.ADTData.enable_ecommerce_tracking;
    milestone.features.pixels = !!window.ADTData.pixel_tracking_enabled;
    milestone.features.ga4mp = !!window.ADTData.ga4_mp_enabled;
    milestone.features.debugOverlay = !!window.ADTData.enable_debug_overlay;
    milestone.features.contentIntelligence =
      !!window.ADTData.include?.["content_intelligence"];
    milestone.features.videoTracking =
      !!window.ADTData.include?.["video_tracking"];
    milestone.features.formTracking =
      !!window.ADTData.include?.["form_tracking"];
    milestone.features.clickTracking =
      !!window.ADTData.include?.["click_tracking"];
    milestone.features.engagement =
      !!window.ADTData.include?.["engagement_tracking"];
    milestone.features.consentManagement = !!window.ADTData.delay_until_consent;
    milestone.features.sessionManager = false;
    milestone.gtmConfigured = !!(
      window.ADTData.gtm_container_id &&
      window.ADTData.gtm_container_id.length > 0
    );
    milestone.hasWooCommerce = !!(
      window.wc || document.body.classList.contains("woocommerce")
    );
  }
  console.log("\n📊 DETECTED CONFIGURATION:");
  console.table({
    "Premium Status": "🆓 Free",
    "Ecommerce Tracking": milestone.features.ecommerce
      ? "✅ Enabled"
      : "❌ Disabled",
    "Pixel Tracking": milestone.features.pixels ? "✅ Enabled" : "❌ Disabled",
    "GA4 Measurement Protocol": milestone.features.ga4mp
      ? "✅ Enabled"
      : "❌ Disabled",
    "Session Manager": milestone.features.sessionManager
      ? "✅ Available"
      : "🔒 Premium Only",
    "Debug Overlay": milestone.features.debugOverlay
      ? "✅ Enabled"
      : "❌ Disabled",
    "Content Intelligence": milestone.features.contentIntelligence
      ? "✅ Enabled"
      : "❌ Disabled",
    "Video Tracking": milestone.features.videoTracking
      ? "✅ Enabled"
      : "❌ Disabled",
    "Form Tracking": milestone.features.formTracking
      ? "✅ Enabled"
      : "❌ Disabled",
    "Click Tracking": milestone.features.clickTracking
      ? "✅ Enabled"
      : "❌ Disabled",
    "Engagement Tracking": milestone.features.engagement
      ? "✅ Enabled"
      : "❌ Disabled",
    "GTM Container": "❌ Not Set",
    WooCommerce: "❌ Not Found",
  });
  scrollY("This diagnostic will test FREE features");
  pageKey("1. CORE REQUIREMENTS");
  if (typeof window.ADTData !== "undefined") {
    config("ADTData object exists", "Core configuration loaded");
  } else {
    result("ADTData object missing", "Plugin may not be loaded correctly");
    console.log(
      "\n%c🚨 CRITICAL: Cannot continue without ADTData",
      "color: #f44336; font-size: 16px; font-weight: bold;",
    );
    return;
  }
  if (
    typeof window.dataLayer !== "undefined" &&
    Array.isArray(window.dataLayer)
  ) {
    config("dataLayer exists", window.dataLayer.length + " events");
  } else {
    result("dataLayer missing or invalid", "Core tracking cannot function");
  }
  if (typeof window.adtPush === "function") {
    config("Core push function exists", "adtPush");
  } else {
    result("Core push function missing", "Events cannot be tracked");
  }
  const intervalId = window.dataLayer.some(
    (activeSec) => activeSec.event === "page_view",
  );
  if (intervalId) {
    config("Initial page_view event fired", "Core tracking operational");
  } else {
    result("No page_view event found", "Core tracking may not be working");
  }
  pageKey("2. SCRIPT LOADING");
  const tickCount = [
    {
      name: "adt-utils-lite",
      required: true,
    },
    {
      name: "adt-event-queue",
      required: true,
    },
    {
      name: "adt-consent-manager",
      required: milestone.features.consentManagement,
    },
    {
      name: "adt-session-manager",
      required: milestone.features.sessionManager,
    },
    {
      name: "adt-core-lite",
      required: true,
    },
    {
      name: "adt-pageview",
      required: true,
    },
  ];
  const saveTick = Array.from(document.querySelectorAll("script"));
  const isActive = saveTick.filter(
    (lastTick) =>
      lastTick.src?.["includes"]("adt-") || lastTick.id?.["includes"]("adt-"),
  );
  scrollY("Found " + isActive.length + " ADT-related scripts");
  tickCount.forEach(({ name: milestones, required: firedMilestones }) => {
    const pagePath = isActive.some(
      (scrollHeight) =>
        scrollHeight.src?.["includes"](milestones) ||
        scrollHeight.id?.["includes"](milestones),
    );
    if (pagePath) {
      config(milestones + " loaded", null, firedMilestones);
    } else if (firedMilestones) {
      result(milestones + " not loaded", "Required script missing");
    } else {
      regex(milestones + " not loaded", "Feature disabled in settings");
    }
  });
  pageKey("3. PREMIUM STATUS & FEATURES");
  scrollY("Free tier - Premium features not expected");
  regex("Session Manager", "Premium feature not available on free tier");
  pageKey("4. CONSENT MANAGEMENT");
  if (milestone.features.consentManagement) {
    if (typeof window.ADTConsent !== "undefined") {
      config("Consent manager initialized", null, true);
      if (typeof window.hasConsent === "function") {
        const viewportH = window.hasConsent();
        scrollY("Current consent status: " + viewportH);
        if (viewportH) {
          config("Analytics consent granted", "Tracking can proceed", true);
        } else {
          scrollY("Analytics consent not granted yet - events may be queued");
        }
      }
    } else {
      result(
        "Consent manager not loaded",
        "Consent features enabled but module missing",
        true,
      );
    }
  } else {
    regex("Consent Management", "delay_until_consent is disabled");
    scrollY("Tracking proceeds without consent checks");
  }
  pageKey("5. ECOMMERCE TRACKING");
  if (milestone.features.ecommerce) {
    config("Ecommerce tracking is ENABLED", null, true);
    result(
      "WooCommerce not detected",
      "Ecommerce tracking enabled but WooCommerce not found",
      false,
    );
  } else {
    regex("Ecommerce Tracking", "enable_ecommerce_tracking is disabled");
  }
  pageKey("6. PIXEL TRACKING");
  if (milestone.features.pixels) {
    if (typeof window.ADTPixelManager !== "undefined") {
      config("Pixel Manager loaded", null, true);
      const scrollPct = window.ADTData.pixel_platforms || {};
      const threshold = Object.keys(scrollPct).filter(
        (tolerance) => scrollPct[tolerance],
      );
      if (threshold.length > 0) {
        config(
          threshold.length + " pixel platform(s) configured",
          threshold.join(", "),
          true,
        );
      } else {
        result(
          "No pixel platforms configured",
          "Pixel tracking enabled but no platforms set",
          false,
        );
      }
    } else {
      result(
        "Pixel Manager not loaded",
        "Pixel tracking enabled but module missing",
        true,
      );
    }
  } else {
    regex("Pixel Tracking", "pixel_tracking_enabled is disabled");
  }
  pageKey("7. GA4 MEASUREMENT PROTOCOL");
  if (milestone.features.ga4mp) {
    config("GA4 Measurement Protocol is ENABLED", null, true);
    if (window.ADTData.ga4_measurement_id) {
      config(
        "GA4 Measurement ID configured",
        window.ADTData.ga4_measurement_id,
        true,
      );
    } else {
      result(
        "GA4 Measurement ID not configured",
        "MP enabled but no measurement ID",
        true,
      );
    }
    if (window.ADTData.ga4_mp_nonce) {
      config("GA4 MP nonce present", "AJAX secured", true);
    } else {
      result("GA4 MP nonce missing", "AJAX calls may fail", true);
    }
  } else {
    regex("GA4 Measurement Protocol", "ga4_mp_enabled is disabled");
  }
  pageKey("8. DEBUG OVERLAY");
  if (milestone.features.debugOverlay) {
    config("Debug overlay ENABLED in settings", null, true);
    if (typeof window.ADTOverlayCore !== "undefined") {
      config("Debug overlay core loaded", null, true);
      const evt = document.getElementById("adt-debug-overlay");
      if (evt) {
        config("Debug overlay element in DOM", null, true);
      } else {
        result(
          "Debug overlay element not found",
          "May not have rendered yet",
          false,
        );
      }
    } else {
      result(
        "Debug overlay core not loaded",
        "Check permissions and script loading",
        true,
      );
    }
  } else {
    regex("Debug Overlay", "enable_debug_overlay is disabled");
  }
  pageKey("9. GTM CONTAINER");
  regex("GTM Container", "No container ID configured");
  scrollY("Plugin will work without GTM, but events won't reach GA4");
  pageKey("10. FEATURE MODULES");
  const item = [
    {
      name: "Content Intelligence",
      enabled: milestone.features.contentIntelligence,
      module: "ADTContentIntelligence",
    },
    {
      name: "Video Tracking",
      enabled: milestone.features.videoTracking,
      module: "ADTVideoTracking",
    },
    {
      name: "Form Tracking",
      enabled: milestone.features.formTracking,
      module: "ADTFormTracker",
    },
    {
      name: "Click Tracking",
      enabled: milestone.features.clickTracking,
      module: "ADTClickTracking",
    },
    {
      name: "Engagement Tracking",
      enabled: milestone.features.engagement,
      module: "ADTEngagement",
    },
  ];
  item.forEach(
    ({ name: key, enabled: err, module: idx }) => {
      if (err) {
        if (typeof window[idx] !== "undefined") {
          config(key + " module loaded", null, true);
        } else {
          result(
            key + " module not loaded",
            "Feature enabled but " + idx + " missing",
            true,
          );
        }
      } else {
        regex(key, "Feature disabled in settings");
      }
    },
  );
  pageKey("11. PERFORMANCE & HEALTH");
  const len = window.dataLayer?.["length"] || 0;
  if (len < 100) {
    config(
      "DataLayer size is healthy: " + len + " events",
      null,
      true,
    );
  } else if (len < 200) {
    result(
      "DataLayer is getting large: " + len + " events",
      "Consider periodic cleanup",
      false,
    );
  } else {
    result(
      "DataLayer is too large: " + len + " events",
      "Performance may be impacted",
      true,
    );
  }
  const mode = performance
    .getEntriesByType("resource")
    .filter(
      (typeVal) =>
        typeVal.name.includes("adt-") && typeVal.transferSize === 0,
    );
  if (mode.length === 0) {
    config("All ADT scripts loaded successfully", null, true);
  } else {
    scrollY(mode.length + " script(s) may be cached (304 responses)");
    config(
      "Script loading appears normal",
      "Diagnostic running successfully",
      true,
    );
  }
  if (performance.memory) {
    const nameVal = Math.round(performance.memory.usedJSHeapSize / 0x100000);
    const opts = Math.round(performance.memory.jsHeapSizeLimit / 0x100000);
    const ref = Math.round((nameVal / opts) * 100);
    scrollY(
      "Memory usage: " +
        nameVal +
        "MB / " +
        opts +
        "MB (" +
        ref +
        "%)",
    );
    if (ref < 50) {
      config("Memory usage is healthy", null, true);
    } else if (ref < 0x50) {
      result("Memory usage is elevated", "Monitor for leaks", false);
    } else {
      result("Memory usage is very high", "Possible memory leak", true);
    }
  }
  pageKey("SMART DIAGNOSTIC SUMMARY");
  const val =
    adtData.required_passed.length + adtData.required_failed.length;
  const obj =
    adtData.optional_passed.length + adtData.optional_warned.length;
  const fn =
    val > 0
      ? Math.round((adtData.required_passed.length / val) * 100)
      : 0;
  console.log(
    "\n%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "font-size: 14px;",
  );
  console.log("\n📊 TEST RESULTS:");
  console.table({
    "Required Tests Passed": "✅ " + adtData.required_passed.length,
    "Required Tests Failed": "❌ " + adtData.required_failed.length,
    "Optional Tests Passed": "✔️  " + adtData.optional_passed.length,
    "Optional Issues": "⚠️  " + adtData.optional_warned.length,
    "Tests Skipped": "⏭️  " + adtData.skipped.length,
  });
  const arg =
    fn >= 0x5a ? "#4CAF50" : fn >= 0x46 ? "#ff9800" : "#f44336";
  console.log(
    "\n%c🎯 CONFIGURATION HEALTH SCORE: " + fn + "%",
    "font-size: 20px; font-weight: bold; color: " +
      arg +
      "; background: #000; padding: 10px;",
  );
  console.log(
    "%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "font-size: 14px;",
  );
  console.log("\n💡 INTERPRETATION:");
  if (fn >= 0x5f) {
    console.log(
      "%c🎉 EXCELLENT! Your configuration is working perfectly!",
      "color: #4CAF50; font-size: 16px; font-weight: bold; background: #e8f5e9; padding: 10px;",
    );
    console.log("   All enabled features are operational. You're good to go!");
  } else {
    if (fn >= 0x50) {
      console.log(
        "%c✅ GOOD! Your configuration is mostly working correctly.",
        "color: #4CAF50; font-size: 16px; font-weight: bold; background: #e8f5e9; padding: 10px;",
      );
      console.log(
        "   Minor issues detected but core functionality is operational.",
      );
    } else if (fn >= 0x3c) {
      console.log(
        "%c⚠️  NEEDS ATTENTION! Some required features have issues.",
        "color: #ff9800; font-size: 16px; font-weight: bold; background: #fff3e0; padding: 10px;",
      );
      console.log("   Review failures above and address critical issues.");
    } else {
      console.log(
        "%c🚨 CRITICAL! Major problems detected!",
        "color: #f44336; font-size: 16px; font-weight: bold; background: #ffebee; padding: 10px;",
      );
      console.log(
        "   Core functionality may not work. Address failures immediately.",
      );
    }
  }
  if (adtData.required_failed.length > 0) {
    console.log(
      "\n%c🔴 REQUIRED FEATURES WITH ISSUES:",
      "color: #f44336; font-weight: bold; font-size: 14px; background: #ffebee; padding: 5px;",
    );
    adtData.required_failed.forEach(
      ({ test: tmp, details: node }, list) => {
        console.log("\n  " + (list + 1) + ". ❌ " + tmp);
        if (node) {
          console.log("     💥 " + node);
        }
      },
    );
  }
  if (adtData.optional_warned.length > 0) {
    console.log(
      "\n%c🟡 OPTIONAL FEATURES WITH ISSUES:",
      "color: #ff9800; font-weight: bold; font-size: 14px; background: #fff3e0; padding: 5px;",
    );
    adtData.optional_warned.forEach(
      ({ test: entry, details: state }, ctx) => {
        console.log("\n  " + (ctx + 1) + ". ⚠️  " + entry);
        if (state) {
          console.log("     ⚡ " + state);
        }
      },
    );
    console.log("\n   💡 These issues won't affect your enabled features.");
  }
  if (adtData.skipped.length > 0) {
    console.log(
      "\n%c⏭️  SKIPPED TESTS (Not Applicable):",
      "color: #9E9E9E; font-weight: bold; font-size: 14px; background: #f5f5f5; padding: 5px;",
    );
    console.log(
      "   " +
        adtData.skipped.length +
        " test(s) skipped because features are disabled",
    );
    console.log("   💡 This is normal and doesn't affect your score");
  }
  window._adtSmartDiagnosticResults = {
    version: "3.0.0",
    timestamp: new Date().toISOString(),
    score: fn,
    configuration: milestone,
    summary: {
      required_passed: adtData.required_passed.length,
      required_failed: adtData.required_failed.length,
      optional_passed: adtData.optional_passed.length,
      optional_warned: adtData.optional_warned.length,
      skipped: adtData.skipped.length,
      total_tested: val + obj,
    },
    details: adtData,
  };
  console.log(
    "\n%c💾 Full results saved to: window._adtSmartDiagnosticResults",
    "color: #2196F3; font-size: 14px; background: #e3f2fd; padding: 5px;",
  );
  console.log(
    "%c📋 To view full report: console.table(window._adtSmartDiagnosticResults.details)",
    "color: #2196F3;",
  );
  console.log(
    "%c📊 To export: copy(JSON.stringify(window._adtSmartDiagnosticResults, null, 2))",
    "color: #2196F3;",
  );
  console.log(
    "\n%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "font-size: 14px;",
  );
  console.log(
    "%c🔍 SMART DIAGNOSTIC COMPLETE",
    "font-size: 16px; font-weight: bold; color: #4CAF50;",
  );
  console.log(
    "%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "font-size: 14px;",
  );
  return window._adtSmartDiagnosticResults;
})();
