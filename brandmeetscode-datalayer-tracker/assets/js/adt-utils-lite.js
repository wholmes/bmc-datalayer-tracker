/*!
 * DataLayer Tracker - Utilities Lite
 *
 * Lightweight utility functions for essential operations
 *
 * @preserve
 * @package    DataLayer_Tracker
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
(function () {
  "use strict";

  window.ADTData = window.ADTData || {};
  window.dataLayer = window.dataLayer || [];

  function isDebugEnabled() {
    const flag = window.ADTData?.debug || window.ADTData?.debug_mode;
    return !!(flag && flag !== 0 && flag !== "0" && flag !== false);
  }

  if (typeof window.hasConsent !== "function") {
    window.hasConsent = function hasConsent(category = "analytics", altCategory = null) {
      if (window.ADTConsent && typeof window.ADTConsent[category] === "boolean") {
        return window.ADTConsent[category];
      }
      if (altCategory && window.ADTConsent && typeof window.ADTConsent[altCategory] === "boolean") {
        return window.ADTConsent[altCategory];
      }
      if (typeof window.ADTConsentCheck === "function") {
        return window.ADTConsentCheck(category, altCategory);
      }
      if (
        window.ADTData?.fallback_track_without_cmp === "1" ||
        window.ADTData?.fallback_track_without_cmp === true
      ) {
        return true;
      }
      if (document.body?.dataset?.adtConsent === "granted") {
        return true;
      }
      return false;
    };
  }

  if (typeof window.adtHasConsent !== "function") {
    window.adtHasConsent = function adtHasConsent(category = "analytics", altCategory = null) {
      return window.hasConsent(category, altCategory);
    };
  }

  if (!window.dataLayer.__originalPush) {
    window.dataLayer.__originalPush = window.dataLayer.push.bind(window.dataLayer);
  }

  window._adtProcessEvent = function processAdtEvent(eventData) {
    const processed = { ...eventData };
    if (!processed["gtm.uniqueEventId"]) {
      processed["gtm.uniqueEventId"] = Date.now() + Math.random();
    }
    if (window._adtEventProcessors?.length) {
      for (const processor of window._adtEventProcessors) {
        try {
          processor(processed);
        } catch (err) {
          console.error("[ADT] Processor error:", err);
        }
      }
    }
    return processed;
  };

  window._adtDispatchEvent = function dispatchAdtEvent(payload) {
    const eventName = payload?.event;

    if (payload._fromGA4MP) {
      delete payload._fromGA4MP;
      const pushResult = window.dataLayer.__originalPush(payload);
      window.dispatchEvent(new CustomEvent("adt_datalayer_push", { detail: payload }));
      return pushResult;
    }

    if (eventName && (eventName.startsWith("gtm.") || eventName.includes("consent"))) {
      const pushResult = window.dataLayer.__originalPush(payload);
      window.dispatchEvent(new CustomEvent("adt_datalayer_push", { detail: payload }));
      return pushResult;
    }

    const hasAnalyticsConsent = window.hasConsent("analytics");
    if (!hasAnalyticsConsent) {
      if (isDebugEnabled()) {
        console.warn("[ADT] Blocked (no consent):", eventName);
      }
      if (window.ADTData?.show_blocked_events_overlay === "1") {
        payload._adtBlocked = true;
        payload._adtConsentStatus = "denied";
        const pushResult = window.dataLayer.__originalPush(payload);
        window.dispatchEvent(new CustomEvent("adt_datalayer_push", { detail: payload }));
        return pushResult;
      }
      return;
    }

    const processed = window._adtProcessEvent(payload);
    const engagementEvents = new Set([
      "scroll_depth",
      "scroll_back_up",
      "active_time",
      "tab_visibility",
    ]);
    if (processed.event && engagementEvents.has(processed.event)) {
      const pagePath =
        processed.page_path ||
        (window.location &&
          window.location.pathname + window.location.search) ||
        "/";
      const milestone =
        processed.scroll_percent ??
        processed.scroll_depth ??
        processed.seconds ??
        processed.state ??
        "";
      const dedupeKey =
        "dl_eng_" +
        processed.event +
        "_" +
        pagePath +
        "_" +
        milestone;
      const now = Date.now();
      const dedupeStore = (window._adtDedupe = window._adtDedupe || {});
      const lastHit = dedupeStore[dedupeKey];
      if (lastHit && now - lastHit < 2000) {
        if (isDebugEnabled()) {
          console.log(
            "[ADT-lite] BLOCKED (engagement dedup):",
            processed.event,
            dedupeKey,
          );
        }
        return;
      }
      dedupeStore[dedupeKey] = now;
    }
    const pushResult = window.dataLayer.__originalPush(processed);
    window.dispatchEvent(new CustomEvent("adt_datalayer_push", { detail: processed }));
    window.dispatchEvent(new CustomEvent("adt_track_server", { detail: processed }));
    return pushResult;
  };

  window.dataLayer.push = function dataLayerPush(...args) {
    if (args[0] && typeof args[0] === "object") {
      return window._adtDispatchEvent(args[0]);
    }
    return window.dataLayer.__originalPush.apply(window.dataLayer, args);
  };

  if (typeof window.adtDebug !== "function") {
    window.adtDebug = function adtDebug(...logArgs) {
      if (!isDebugEnabled()) {
        return;
      }
      console.log("[ADT]", ...logArgs);
    };
  }

  window.adtDebug = function adtDebug(...logArgs) {
    if (!isDebugEnabled()) {
      return;
    }
    const level = window.ADTData?.debugLevel || window.ADTData?.debug_level || "normal";
    if (level === "quiet") {
      return;
    }
    if (level === "normal") {
      const joined = ["[ADT]", ...logArgs.map(String)].join(" ").toLowerCase();
      const noisy =
        joined.includes("initializ") ||
        joined.includes("click tracker:") ||
        joined.includes("form tracker]") ||
        joined.includes("init called") ||
        joined.includes("waiting for") ||
        joined.includes("coordinator") ||
        joined.includes("setting up") ||
        joined.includes("bridge") ||
        joined.includes("communication");
      if (noisy) {
        return;
      }
    }
    console.log("[ADT]", ...logArgs);
  };

  window.adtWarn = function adtWarn(...logArgs) {
    if (isDebugEnabled()) {
      console.warn("[ADT]", ...logArgs);
    }
  };

  window.adtError = function adtError(...logArgs) {
    console.error("[ADT]", ...logArgs);
  };

  window.adtInfo = function adtInfo(...logArgs) {
    if (isDebugEnabled()) {
      console.info("[ADT]", ...logArgs);
    }
  };

  window.adtIsDebugEnabled = isDebugEnabled;

  window.adtPush = function adtPush(payload) {
    window.dataLayer.push(payload);
    if (isDebugEnabled()) {
      console.log("[ADT-lite] push", payload);
    }
  };

  window.adtPushDeduped = function adtPushDeduped(payload, dedupeKey, windowMs = 1500) {
    if (isDebugEnabled()) {
      console.log("[ADT] adtPushDeduped called:", payload?.event, "key:", dedupeKey);
    }
    if (!dedupeKey) {
      window._adtDispatchEvent(payload);
      if (isDebugEnabled()) {
        console.log("[ADT-lite] push(no-key)", payload.event, payload);
      }
      return;
    }

    const now = Date.now();
    const dedupeStore = (window._adtDedupe = window._adtDedupe || {});
    const lastHit = dedupeStore[dedupeKey];

    if (isDebugEnabled()) {
      console.log(
        "[ADT-lite] Dedup check:",
        dedupeKey,
        "hit:",
        lastHit,
        "now:",
        now,
        "diff:",
        lastHit ? now - lastHit : "N/A",
      );
    }

    if (lastHit && now - lastHit < windowMs) {
      if (isDebugEnabled()) {
        console.log("[ADT-lite] BLOCKED (deduped):", payload.event, "within", windowMs, "ms");
      }
      return;
    }

    dedupeStore[dedupeKey] = now;
    window._adtDispatchEvent(payload);
    if (isDebugEnabled()) {
      console.log("[ADT-lite] PUSHED:", payload.event, payload);
    }
  };

  window._adtEventProcessors = window._adtEventProcessors || [];

  window.adtRegisterProcessor = function adtRegisterProcessor(name, fn) {
    if (typeof fn !== "function") {
      console.error("[ADT] Invalid processor:", name);
      return;
    }
    if (window._adtEventProcessors.find((existing) => existing._name === name)) {
      if (isDebugEnabled()) {
        console.warn("[ADT] Processor already registered:", name);
      }
      return;
    }
    fn._name = name;
    window._adtEventProcessors.push(fn);
    if (isDebugEnabled()) {
      console.log("[ADT] Registered processor:", name);
    }
  };

  // Capability helpers: adt-runtime-flags.js (loaded before this file).
})();
