/*!
 * DataLayer Tracker - Core Lite
 *
 * Lightweight core functionality for essential dataLayer operations
 *
 * @preserve
 * @package    DataLayer_Tracker
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
(function () {
  "use strict";

  if (window.ADTData?.is_ip_excluded || window.ADTData?.tracking_disabled) {
    if (window.ADTData?.debug_mode) {
      console.log(
        "[ADT] Tracking disabled - IP excluded:",
        window.ADTData?.current_ip,
      );
    }
    window.ADTTrackingDisabled = true;
    return;
  }

  if (window.ADTCore) {
    return;
  }

  window.ADTCore = {
    ready: true,
    version: "1.0.0",
    push(payload, dedupeKey = null, windowMs = 5000) {
      if (window.ADTTrackingDisabled) {
        if (window.ADTData?.debug_mode) {
          console.log("[ADT] Event blocked - tracking disabled for this IP");
        }
        return false;
      }
      if (!payload?.event) {
        return false;
      }
      if (dedupeKey) {
        const storageKey = "adt_" + dedupeKey;
        const last = sessionStorage.getItem(storageKey);
        if (last) {
          const lastTs = parseInt(last, 10);
          if (Date.now() - lastTs < windowMs) {
            return false;
          }
        }
        sessionStorage.setItem(storageKey, Date.now().toString());
      }
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(payload);
      return true;
    },
    shouldTrack() {
      if (window.ADTTrackingDisabled) {
        return false;
      }
      return window.ADTData?.shouldTrackPage !== false;
    },
  };
})();
