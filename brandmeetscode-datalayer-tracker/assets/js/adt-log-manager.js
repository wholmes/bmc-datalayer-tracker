/*!
 * DataLayer Tracker - Log Manager
 *
 * Centralized logging system for tracking and debugging
 *
 * @preserve
 * @package    DataLayer_Tracker
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
(function () {
  "use strict";

  window.adtDebugLog =
    window.adtDebugLog ||
    function (...adtData) {
      if (window.ADTData?.["debug_mode"] || window.ADTData?.["debug"]) {
        console.log(...adtData);
      }
    };
  const config = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    group: console.group,
    groupEnd: console.groupEnd,
  };
  function payload() {
    const eventName =
      window.ADTData?.["debug"] || window.ADTData?.["debug_mode"];
    return !!(
      eventName &&
      eventName !== 0 &&
      eventName !== "0" &&
      eventName !== false
    );
  }
  function detail(element, ...target) {
    const result = String(element);
    const value = [result, ...target.map(String)]
      .join(" ")
      .toLowerCase();
    if (!payload()) {
      if (
        value.includes("❌".toLowerCase()) ||
        value.includes("critical".toLowerCase()) ||
        value.includes("[adt] error".toLowerCase())
      ) {
        return false;
      }
      if (value.includes("[adt".toLowerCase())) {
        return true;
      }
      return false;
    }
    if (
      (window.ADTData?.["debugLevel"] ||
        window.ADTData?.["debug_level"] ||
        "normal") === "quiet"
    ) {
      if (
        value.includes("error".toLowerCase()) ||
        value.includes("failed".toLowerCase()) ||
        value.includes("❌".toLowerCase()) ||
        value.includes("critical".toLowerCase())
      ) {
        return false;
      }
      if (
        value.includes("form_submit".toLowerCase()) ||
        value.includes("purchase".toLowerCase()) ||
        value.includes("add_to_cart".toLowerCase()) ||
        value.includes("begin_checkout".toLowerCase())
      ) {
        return false;
      }
      if (
        value.includes("[adt".toLowerCase()) ||
        value.includes("[ci debug]".toLowerCase()) ||
        value.includes("debug tools".toLowerCase())
      ) {
        return true;
      }
      return value.includes("[adt".toLowerCase());
    }
    if (
      (window.ADTData?.["debugLevel"] ||
        window.ADTData?.["debug_level"] ||
        "normal") === "normal"
    ) {
      if (value.includes("module loading".toLowerCase())) {
        return true;
      }
      if (value.includes("module initializing".toLowerCase())) {
        return true;
      }
      if (value.includes("module initialized".toLowerCase())) {
        return true;
      }
      if (value.includes("file loaded and executing".toLowerCase())) {
        return true;
      }
      if (value.includes("init called".toLowerCase())) {
        return true;
      }
      if (value.includes("initializing".toLowerCase())) {
        return true;
      }
      if (value.includes("already initialized".toLowerCase())) {
        return true;
      }
      if (
        value.includes("registered".toLowerCase()) &&
        value.includes("hook".toLowerCase())
      ) {
        return true;
      }
      if (value.includes("processor already registered".toLowerCase())) {
        return true;
      }
      if (value.includes("setting up".toLowerCase())) {
        return true;
      }
      if (value.includes("restored".toLowerCase())) {
        return true;
      }
      if (value.includes("debug tools available".toLowerCase())) {
        return true;
      }
      if (value.includes("new video elements detected".toLowerCase())) {
        return true;
      }
      if (value.includes("rescanning".toLowerCase())) {
        return true;
      }
      if (value.includes("waiting for it to load".toLowerCase())) {
        return true;
      }
      if (value.includes("no youtube videos found".toLowerCase())) {
        return true;
      }
      if (value.includes("wistia api not found".toLowerCase())) {
        return true;
      }
      if (value.includes("[adt overlay debug]".toLowerCase())) {
        return true;
      }
      if (
        value.includes("overlay:".toLowerCase()) &&
        value.includes("will skip?".toLowerCase())
      ) {
        return true;
      }
      if (value.includes("skipping duplicate".toLowerCase())) {
        return true;
      }
      if (value.includes("adding listeners to field".toLowerCase())) {
        return true;
      }
      if (value.includes("listeners successfully added".toLowerCase())) {
        return true;
      }
      if (value.includes("processing form".toLowerCase())) {
        return true;
      }
      if (value.includes("enrichment: skipped enrichment".toLowerCase())) {
        return true;
      }
      if (value.includes("will enrich these events".toLowerCase())) {
        return true;
      }
      if (value.includes("adtcidebug".toLowerCase())) {
        return true;
      }
      if (value.includes("testdetection".toLowerCase())) {
        return true;
      }
      if (value.includes("inspect(".toLowerCase())) {
        return true;
      }
      if (value.includes("testsectionengagement".toLowerCase())) {
        return true;
      }
      if (value.includes("testviewcartenrichment".toLowerCase())) {
        return true;
      }
      if (value.includes("eventstoEnrich".toLowerCase())) {
        return true;
      }
      if (value.includes("- test".toLowerCase())) {
        return true;
      }
      if (value.includes("check what ci detected".toLowerCase())) {
        return true;
      }
      if (value.includes("module ready:".toLowerCase())) {
        return true;
      }
      if (value.includes("module exposed as".toLowerCase())) {
        return true;
      }
      if (value.includes("module loaded".toLowerCase())) {
        return true;
      }
      if (value.includes("pixel manager ready".toLowerCase())) {
        return true;
      }
      if (value.includes("ecommerce listener setup".toLowerCase())) {
        return true;
      }
      if (value.includes("session integration complete".toLowerCase())) {
        return true;
      }
      if (value.includes("initialized successfully".toLowerCase())) {
        return true;
      }
      if (value.includes("ga4 mp] module ready".toLowerCase())) {
        return true;
      }
      if (value.includes("listening to adt_track_server".toLowerCase())) {
        return true;
      }
      if (value.includes("dual tracking mode:".toLowerCase())) {
        return true;
      }
      if (value.includes("adtcidebug.status()".toLowerCase())) {
        return true;
      }
      if (value.includes("adtcidebug.testdetection".toLowerCase())) {
        return true;
      }
      if (value.includes("adtcidebug.testall()".toLowerCase())) {
        return true;
      }
      if (value.includes("adtcidebug.inspect".toLowerCase())) {
        return true;
      }
      if (value.includes("testsectionengagement".toLowerCase())) {
        return true;
      }
      if (value.includes("testviewcartenrichment".toLowerCase())) {
        return true;
      }
      if (value.includes("adtenrichment.eventstoEnrich".toLowerCase())) {
        return true;
      }
      if (value.includes("found product elements".toLowerCase())) {
        return true;
      }
      if (value.includes("products array".toLowerCase())) {
        return true;
      }
      if (value.includes("product parsed".toLowerCase())) {
        return true;
      }
      if (value.includes("track products with".toLowerCase())) {
        return true;
      }
      if (value.includes("pushevent called".toLowerCase())) {
        return true;
      }
      if (value.includes("dedup check".toLowerCase())) {
        return true;
      }
      if (value.includes("adtpushdeduped called".toLowerCase())) {
        return true;
      }
      if (value.includes("body classes:".toLowerCase())) {
        return true;
      }
      if (value.includes("banner elements found".toLowerCase())) {
        return true;
      }
      if (value.includes("banner rotation".toLowerCase())) {
        return true;
      }
      if (value.includes("banner initialized".toLowerCase())) {
        return true;
      }
      if (value.includes("adt banner".toLowerCase())) {
        return true;
      }
      if (value.includes("initpagecontext called".toLowerCase())) {
        return true;
      }
      if (value.includes("loaded cart state".toLowerCase())) {
        return true;
      }
      if (value.includes("settings loaded".toLowerCase())) {
        return true;
      }
      if (value.includes("localized adtdata".toLowerCase())) {
        return true;
      }
      if (value.includes("cart sync".toLowerCase())) {
        return true;
      }
      if (value.includes("debug mode active".toLowerCase())) {
        return true;
      }
      if (value.includes("simulator".toLowerCase())) {
        return true;
      }
      if (value.includes("module monitoring complete".toLowerCase())) {
        return true;
      }
      if (value.includes("registered processor:".toLowerCase())) {
        return true;
      }
      if (value.includes("content intelligence] pushed:".toLowerCase())) {
        return true;
      }
      if (value.includes("consent granted, notifying".toLowerCase())) {
        return true;
      }
      if (
        value.includes(
          "export not ready after maximum retries".toLowerCase(),
        )
      ) {
        return true;
      }
      return false;
    }
    return false;
  }
  console.log = function (...flag) {
    if (detail(...flag)) {
      return;
    }
    return config.log.apply(console, flag);
  };
  console.warn = function (...enabled) {
    if (detail(...enabled)) {
      return;
    }
    return config.warn.apply(console, enabled);
  };
  console.error = function (...url) {
    return config.error.apply(console, url);
  };
  window.adtDebug = function (...pattern) {
    if (detail("[ADT]", ...pattern)) {
      return;
    }
    config.log("[ADT]", ...pattern);
  };
  window.adtWarn = function (...regex) {
    if (detail("[ADT Warning]", ...regex)) {
      return;
    }
    config.warn("[ADT Warning]", ...regex);
  };
  window.adtError = function (...depth) {
    config.error("[ADT Error]", ...depth);
  };
  window.adtLog = function (percent, scrollY) {
    if (detail("[ADT]", percent)) {
      return;
    }
    config.group("[ADT] " + percent);
    config.log(scrollY);
    config.groupEnd();
  };
  function scrollTop() {
    const pageKey = {
      enabled: payload(),
      level:
        window.ADTData?.["debugLevel"] ||
        window.ADTData?.["debug_level"] ||
        "normal",
      batchInit: true,
      groupSimilar: true,
      patterns: {
        initialization: /initiali|loading|loaded|setting up|ready/i,
        tracking: /pushed|tracked|firing|dispatched/i,
        engagement: /scroll|time|hover|click/i,
        ecommerce: /product|cart|checkout|purchase/i,
      },
    };
    let firedSet = [];
    function milestone(timerId) {
      const intervalId = String(timerId);
      for (const [activeSec, tickCount] of Object.entries(pageKey.patterns)) {
        if (tickCount.test(intervalId)) {
          return activeSec;
        }
      }
      return null;
    }
    function saveTick() {
      if (firedSet.length === 0) {
        return;
      }
      const isActive = {};
      const lastTick = [];
      firedSet.forEach(({ message: milestones, args: firedMilestones }) => {
        const pagePath = milestone(milestones);
        if (pagePath && true) {
          if (!isActive[pagePath]) {
            isActive[pagePath] = [];
          }
          isActive[pagePath].push({
            message: milestones,
            args: firedMilestones,
          });
        } else {
          lastTick.push({
            message: milestones,
            args: firedMilestones,
          });
        }
      });
      Object.entries(isActive).forEach(([scrollHeight, viewportH]) => {
        if (viewportH.length > 1) {
          config.group(
            "[ADT] " +
              (scrollHeight.charAt(0).toUpperCase() + scrollHeight.slice(1)) +
              " (" +
              viewportH.length +
              " events)",
          );
          viewportH.forEach(({ message: scrollPct, args: threshold }) => {
            config.log(scrollPct, ...threshold);
          });
          config.groupEnd();
        } else {
          viewportH.forEach(({ message: tolerance, args: evt }) => {
            config.log(tolerance, ...evt);
          });
        }
      });
      lastTick.forEach(({ message: item, args: key }) => {
        config.log(item, ...key);
      });
      firedSet = [];
    }
    setTimeout(() => {
      if (pageKey.level !== "verbose" && firedSet.length > 0) {
        saveTick();
      }
      if (pageKey.enabled && pageKey.level === "normal") {
        config.log(
          "%c[ADT] ✅ Initialization Complete",
          "color: #4CAF50; font-weight: bold",
          "- Debug: " + (pageKey.enabled ? "ON" : "OFF"),
          "- Level: " + pageKey.level,
          "- Premium: " +
            (window.adtAllFeaturesEnabled ? window.adtAllFeaturesEnabled() : "Unknown"),
        );
      }
    }, 0x9c4);
    window.ADTLogManager = {
      setLevel: (err) => {
        pageKey.level = err;
        config.log("[ADT] Log level set to: " + err);
      },
      getStatus: () => ({
        enabled: pageKey.enabled,
        level: pageKey.level,
        fullBuild: window.adtAllFeaturesEnabled ? window.adtAllFeaturesEnabled() : true,
      }),
      showSummary: () => {
        const idx = window.dataLayer || [];
        const len = idx
          .filter((mode) => mode.event)
          .map((typeVal) => typeVal.event);
        const nameVal = [...new Set(len)];
        config.group("[ADT] Current Status Summary");
        config.log("Debug enabled:", pageKey.enabled);
        config.log("Verbosity:", pageKey.level);
        config.log("Events tracked:", nameVal.length);
        config.log("Event types:", nameVal);
        config.log(
          "Session ID:",
          window.ADTSession?.["getSessionId"]?.() || "N/A",
        );
        config.log(
          "Page views:",
          idx.filter((opts) => opts.event === "page_view")
            .length,
        );
        config.groupEnd();
      },
      quiet: () => window.ADTLogManager.setLevel("quiet"),
      normal: () => window.ADTLogManager.setLevel("normal"),
      verbose: () => window.ADTLogManager.setLevel("verbose"),
    };
    if (pageKey.enabled && pageKey.level !== "quiet") {
      config.log(
        "%c[ADT] Log Manager Active",
        "color: #2196F3",
        "\nCommands:",
        "\n  ADTLogManager.getStatus()   - Show current settings",
        "\n  ADTLogManager.quiet()       - Minimal output",
        "\n  ADTLogManager.normal()      - Default output",
        "\n  ADTLogManager.verbose()     - All output",
        "\n  ADTLogManager.showSummary() - Show tracking summary",
      );
    }
    window.ADTLogManager.showGrouped = function () {
      const ref = window.dataLayer || [];
      const val = {
        "GTM System": [],
        Consent: [],
        Session: [],
        Engagement: [],
        Ecommerce: [],
        Forms: [],
        Other: [],
      };
      ref.forEach((obj) => {
        if (!obj.event) {
          return;
        }
        if (obj.event.startsWith("gtm.")) {
          val["GTM System"].push(obj);
        } else {
          if (obj.event.includes("consent")) {
            val.Consent.push(obj);
          } else {
            if (obj.event.includes("session")) {
              val.Session.push(obj);
            } else {
              if (
                ["timeOnPage", "scroll", "page_view", "page_exit"].includes(
                  obj.event,
                )
              ) {
                val.Engagement.push(obj);
              } else {
                if (
                  [
                    "add_to_cart",
                    "purchase",
                    "view_cart",
                    "begin_checkout",
                  ].includes(obj.event)
                ) {
                  val.Ecommerce.push(obj);
                } else if (obj.event.includes("form")) {
                  val.Forms.push(obj);
                } else {
                  val.Other.push(obj);
                }
              }
            }
          }
        }
      });
      config.group("📊 DataLayer Events (Grouped)");
      Object.entries(val).forEach(([fn, arg]) => {
        if (arg.length > 0) {
          config.group(fn + " (" + arg.length + ")");
          arg.forEach((tmp) =>
            config.log(tmp.event, tmp),
          );
          config.groupEnd();
        }
      });
      config.groupEnd();
    };
  }
  if (typeof window.ADTData !== "undefined") {
    scrollTop();
  } else {
    document.addEventListener("ADTDataReady", scrollTop);
    setTimeout(() => {
      if (typeof window.ADTData !== "undefined" && !window.ADTLogManager) {
        scrollTop();
      }
    }, 100);
  }
})();
