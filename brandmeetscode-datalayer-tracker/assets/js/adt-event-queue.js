/*!
 * DataLayer Tracker - Event Queue Manager
 *
 * Handles consent-aware event pushing for all modules
 *
 * @preserve
 * @package    DataLayer_Tracker
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
(function () {
  "use strict";

  window.ADTEventQueue = {
    queue: [],
    history: [],
    consentGranted: false,
    initialized: false,

    init() {
      if (this.initialized) {
        return;
      }
      this.initialized = true;

      setTimeout(() => {
        this.consentGranted = window.hasConsent?.("analytics") || false;
        if (this.consentGranted && this.queue.length > 0) {
          console.log(
            "[ADT EventQueue] Consent already granted, flushing " +
              this.queue.length +
              " queued events",
          );
          this.flush();
        }
      }, 100);

      window.addEventListener("adt_consent_granted", () => {
        this.consentGranted = true;
        this.flush();
      });
    },

    push(payload, dedupKey, dedupTime) {
      const hasConsent = window.hasConsent?.("analytics") || false;
      if (hasConsent) {
        this.consentGranted = true;
        this.send(payload, dedupKey, dedupTime);
      } else {
        this.queue.push({ payload, dedupKey, dedupTime });
        console.log("[ADT EventQueue] Queued: " + payload.event);
      }
    },

    send(payload, dedupKey, dedupTime) {
      if (payload?.event) {
        this.history.push({
          event: payload.event,
          timestamp: Date.now(),
          data: payload,
        });
        if (this.history.length > 50) {
          this.history = this.history.slice(-50);
        }
      }

      if (typeof window.adtPushDeduped === "function" && dedupKey) {
        window.adtPushDeduped(payload, dedupKey, dedupTime);
      } else {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(payload);
      }
    },

    flush() {
      if (this.queue.length > 0) {
        console.log("[ADT EventQueue] Flushing " + this.queue.length + " queued events");
        const pending = [...this.queue];
        this.queue = [];
        pending.forEach((item) => {
          this.send(item.payload, item.dedupKey, item.dedupTime);
        });
      }
    },

    getHistory(limit = 20) {
      return this.history.slice(-limit).reverse();
    },
  };

  window.ADTEventQueue.init();
})();
