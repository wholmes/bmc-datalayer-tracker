/*!
 * DataLayer Tracker - UTM Parameter Tracking
 *
 * Captures, stores, and manages UTM parameters for attribution tracking
 *
 * @preserve
 * @package    DataLayer_Tracker
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @version    1.0.0
 * @since      1.0.0
 */
(function () {
  "use strict";

  if (typeof window === "undefined") {
    return;
  }
  const adtData = function (...args) {
    window.adtDebug("UTM:", ...args);
  };
  const payload = window.ADTData?.["include"]?.["utm"];
  if (!payload) {
    adtData("UTM tracking disabled, but monitoring for session summary");
    const eventName = window.ADTUtmTracker;
    if (eventName && typeof eventName.initSessionIntegration === "function") {
      eventName.initSessionIntegration();
    }
    return;
  }
  window._adtConversionEvents = window._adtConversionEvents || [];
  adtData("Module initializing...");
  const detail = {
    utmParams: [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "utm_id",
    ],
    clickIds: [
      "gclid",
      "fbclid",
      "msclkid",
      "ttclid",
      "li_fat_id",
      "gbraid",
      "wbraid",
    ],
    extractFromUrl(element) {
      try {
        const target = new URL(element || window.location.href);
        const result = new URLSearchParams(target.search);
        const value = {};
        this.utmParams.forEach((flag) => {
          const enabled = result.get(flag);
          if (enabled) {
            const url = flag.replace("utm_", "");
            value[url] = decodeURIComponent(enabled);
          }
        });
        this.clickIds.forEach((pattern) => {
          const regex = result.get(pattern);
          if (regex) {
            value[pattern] = regex;
          }
        });
        return Object.keys(value).length > 0 ? value : null;
      } catch (depth) {
        adtData("Error extracting from URL:", depth);
        return null;
      }
    },
    storeUtm(percent, scrollY = "session") {
      if (!percent || typeof percent !== "object") {
        return false;
      }
      try {
        const scrollTop = scrollY === "local" ? localStorage : sessionStorage;
        const pageKey = Date.now();
        scrollTop.setItem("_adt_test", "1");
        scrollTop.removeItem("_adt_test");
        scrollTop.setItem("adt_utm_current", JSON.stringify(percent));
        scrollTop.setItem("adt_utm_timestamp", pageKey.toString());
        if (!scrollTop.getItem("adt_utm_initial")) {
          scrollTop.setItem("adt_utm_initial", JSON.stringify(percent));
          scrollTop.setItem("adt_utm_initial_timestamp", pageKey.toString());
        }
        this.updateHistory(percent);
        adtData("Stored UTM:", percent, "(storage:", scrollY, ")");
        return true;
      } catch (firedSet) {
        adtData("Storage failed, using memory fallback:", firedSet);
        window._adtUtmMemory = window._adtUtmMemory || {};
        window._adtUtmMemory.current = percent;
        window._adtUtmMemory.timestamp = Date.now();
        if (!window._adtUtmMemory.initial) {
          window._adtUtmMemory.initial = percent;
          window._adtUtmMemory.initial_timestamp = Date.now();
        }
        return false;
      }
    },
    updateHistory(milestone) {
      try {
        const timerId = sessionStorage.getItem("adt_utm_history");
        const intervalId = timerId ? JSON.parse(timerId) : [];
        intervalId.push({
          utm: milestone,
          timestamp: Date.now(),
          url: window.location.href,
        });
        if (intervalId.length > 0x5) {
          intervalId.shift();
        }
        sessionStorage.setItem("adt_utm_history", JSON.stringify(intervalId));
      } catch (activeSec) {
        adtData("History update failed:", activeSec);
      }
    },
    getStoredUtm(tickCount = "current", saveTick = "session") {
      try {
        const isActive = saveTick === "local" ? localStorage : sessionStorage;
        const lastTick =
          tickCount === "initial" ? "adt_utm_initial" : "adt_utm_current";
        const milestones = isActive.getItem(lastTick);
        if (milestones) {
          return JSON.parse(milestones);
        }
      } catch (firedMilestones) {
        adtData(
          "Error reading from storage, checking memory fallback:",
          firedMilestones,
        );
      }
      if (window._adtUtmMemory) {
        return tickCount === "initial"
          ? window._adtUtmMemory.initial
          : window._adtUtmMemory.current;
      }
      return null;
    },
    getHistory() {
      try {
        const pagePath = sessionStorage.getItem("adt_utm_history");
        return pagePath ? JSON.parse(pagePath) : [];
      } catch (scrollHeight) {
        return [];
      }
    },
    setCookie(viewportH) {
      if (!window.ADTData?.["persist_utm_cookie"]) {
        return;
      }
      try {
        const scrollPct = {
          utm: viewportH,
          timestamp: Date.now(),
        };
        const threshold = btoa(JSON.stringify(scrollPct));
        const tolerance = this.getCookieDomain();
        const evt = new Date(Date.now() + 7776000000).toUTCString();
        document.cookie =
          "adt_utm=" +
          threshold +
          "; expires=" +
          evt +
          "; path=/; domain=" +
          tolerance +
          "; SameSite=Lax";
        adtData("Cookie set for domain:", tolerance);
      } catch (item) {
        adtData("Cookie setting failed:", item);
      }
    },
    getCookieDomain() {
      const key = window.location.hostname;
      if (
        key === "localhost" ||
        key.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)
      ) {
        return key;
      }
      const err = key.split(".");
      if (err.length >= 0x2) {
        return "." + err.slice(-0x2).join(".");
      }
      return key;
    },
    getFromCookie() {
      const idx = document.cookie.match(/adt_utm=([^;]+)/);
      if (idx) {
        try {
          const len = JSON.parse(atob(idx[1]));
          return len.utm || null;
        } catch (mode) {
          return null;
        }
      }
      return null;
    },
    buildAttribution() {
      const typeVal = this.getStoredUtm("current");
      const nameVal = this.getStoredUtm("initial");
      const opts = this.extractFromUrl();
      return {
        current: typeVal || opts,
        initial: nameVal,
        session: opts,
        attribution_model: this.getAttributionString(
          typeVal || opts || nameVal,
        ),
      };
    },
    getAttributionString(ref) {
      if (!ref) {
        return "direct / none";
      }
      const val = [];
      if (ref.source) {
        val.push(ref.source);
      }
      if (ref.medium) {
        val.push(ref.medium);
      }
      if (ref.campaign) {
        val.push(ref.campaign);
      }
      return val.length > 0 ? val.join(" / ") : "direct / none";
    },
    pushUtmEvent(obj, fn) {
      const arg = {
        event: "utm_" + obj,
        utm_parameters: fn,
        utm_attribution: this.getAttributionString(fn),
        utm_timestamp: Date.now(),
      };
      if (obj === "captured") {
        arg.attribution = this.buildAttribution();
      }
      if (typeof window.adtPushDeduped === "function") {
        window.adtPushDeduped(arg, "utm_" + obj, 0);
      } else {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(arg);
      }
      adtData("Event pushed: utm_" + obj, arg);
    },
    init() {
      if (!window.hasConsent("analytics")) {
        adtData("UTM tracking blocked - no consent");
        return;
      }
      adtData("Initializing UTM tracking");
      const tmp = this.extractFromUrl();
      if (tmp) {
        this.storeUtm(tmp);
        this.setCookie(tmp);
        this.pushUtmEvent("captured", tmp);
        adtData("New UTM parameters captured:", tmp);
      } else {
        const node = this.getStoredUtm("current") || this.getFromCookie();
        if (node) {
          this.pushUtmEvent("restored", node);
          adtData("Restored UTM parameters:", node);
        } else {
          adtData("No UTM parameters found (direct traffic)");
        }
      }
      window.ADTUtm = {
        get: () => this.getStoredUtm(),
        getInitial: () => this.getStoredUtm("initial"),
        getHistory: () => this.getHistory(),
        getAttribution: () => this.buildAttribution(),
        extract: (list) => this.extractFromUrl(list),
      };
      this.initSessionIntegration();
      adtData("UTM tracking initialized. API available at window.ADTUtm");
    },
    initSessionIntegration() {
      if (this._sessionIntegrated) {
        adtData("Session already integrated");
        return;
      }
      if (this._sessionRetryTimeout) {
        clearTimeout(this._sessionRetryTimeout);
        this._sessionRetryTimeout = null;
      }
      if (!window.ADTSession) {
        if (!this._sessionRetryCount) {
          this._sessionRetryCount = 0;
        }
        if (this._sessionRetryCount < 10) {
          this._sessionRetryCount++;
          this._sessionRetryTimeout = setTimeout(
            () => this.initSessionIntegration(),
            500,
          );
          adtData("Session manager not ready, retrying...");
        } else {
          adtData("Session manager not available after retries");
        }
        return;
      }
      if (typeof window.ADTSession.registerHook !== "function") {
        adtData("Session manager is a stub (hooks unavailable)");
        return;
      }
      if (!window._adtSessionInitialized) {
        if (!this._sessionRetryCount) {
          this._sessionRetryCount = 0;
        }
        if (this._sessionRetryCount < 10) {
          this._sessionRetryCount++;
          this._sessionRetryTimeout = setTimeout(
            () => this.initSessionIntegration(),
            500,
          );
          adtData(
            "[ADT UTM] Session exists but not initialized, retrying...",
          );
          return;
        }
      }
      this._sessionIntegrated = true;
      adtData("Integrating with session manager");
      const entry = this;
      try {
        window.ADTSession.registerHook("start", function (state) {
          const ctx = entry.buildAttribution();
          if (ctx.current || ctx.initial) {
            const data = {
              event: "session_attribution",
              session_id: state.sessionId,
              session_start_reason: state.reason,
              utm_current: ctx.current,
              utm_initial: ctx.initial,
              attribution_model: ctx.attribution_model,
              attribution_source: ctx.current ? "current" : "initial",
              timestamp: new Date().toISOString(),
            };
            const row = sessionStorage.getItem("adt_last_session_utm");
            if (row) {
              try {
                const col = JSON.parse(row);
                if (
                  JSON.stringify(ctx.current) !==
                  JSON.stringify(col)
                ) {
                  data.attribution_changed = true;
                  data.previous_attribution = col;
                }
              } catch (mapVal) {}
            }
            if (ctx.current) {
              sessionStorage.setItem(
                "adt_last_session_utm",
                JSON.stringify(ctx.current),
              );
            }
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push(data);
            adtData("Session attribution pushed:", data);
          } else {
            const setVal = {
              event: "session_attribution",
              session_id: state.sessionId,
              attribution_model: "direct / none",
              attribution_source: "direct",
              timestamp: new Date().toISOString(),
            };
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push(setVal);
            adtData("Direct traffic session started");
          }
        });
        window.ADTSession.registerHook("ping", function (buf) {
          const raw = entry.buildAttribution();
          if (raw.current || raw.initial) {
            const parsed = {
              event: "session_attribution_ping",
              session_id: buf.sessionId,
              ping_number: buf.pingNumber,
              has_current_utm: !!raw.current,
              has_initial_utm: !!raw.initial,
              attribution_model: raw.attribution_model,
              timestamp: new Date().toISOString(),
            };
            if (typeof window.adtPushDeduped === "function") {
              window.adtPushDeduped(
                parsed,
                "utm_ping_" + buf.sessionId,
                30000,
              );
            } else {
              window.dataLayer = window.dataLayer || [];
              window.dataLayer.push(parsed);
            }
            adtData("Attribution ping sent");
          }
        });
        window.ADTSession.registerHook("exit", function (text) {
          const html = entry.buildAttribution();
          const cmpName = entry.getHistory();
          const handler = {
            event: "session_attribution_summary",
            session_id: text.sessionId,
            exit_reason: text.reason,
            attribution_current: html.current,
            attribution_initial: html.initial,
            attribution_model: html.attribution_model,
            attribution_touchpoints: cmpName.length,
            session_duration: text.duration || 0,
            timestamp: new Date().toISOString(),
          };
          if (
            window._adtConversionEvents &&
            window._adtConversionEvents.length > 0
          ) {
            handler.converting_session = true;
            handler.conversion_events = window._adtConversionEvents;
            handler.attribution_credit =
              entry.calculateAttributionCredit();
          }
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push(handler);
          adtData("Attribution summary sent on exit:", handler);
        });
        window.ADTSession.registerHook("idle", function (callback) {
          const response = entry.buildAttribution();
          if (response.current || response.initial) {
            const request = {
              event: "attribution_idle",
              session_id: callback.sessionId,
              attribution_at_idle: response.attribution_model,
              utm_source:
                response.current?.["source"] || response.initial?.["source"],
              timestamp: new Date().toISOString(),
            };
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push(request);
            adtData(
              "User became idle with attribution:",
              response.attribution_model,
            );
          }
        });
      } catch (fields) {
        adtData("Error registering session hooks:", fields);
      }
      adtData("Session integration complete");
    },
    calculateAttributionCredit() {
      const formId = this.getStoredUtm("current");
      const fieldId = this.getStoredUtm("initial");
      const cartAdds = {
        first_touch: fieldId ? 100 : 0,
        last_touch: formId ? 100 : 0,
        linear:
          formId &&
          fieldId &&
          JSON.stringify(formId || {}) !== JSON.stringify(fieldId || {})
            ? 50
            : 100,
        time_decay: this.calculateTimeDecayCredit(),
      };
      return cartAdds;
    },
    calculateTimeDecayCredit() {
      const cartRemoves = this.getHistory();
      if (!cartRemoves || cartRemoves.length === 0) {
        return 0;
      }
      const sessionInfo = Date.now();
      const hookData = cartRemoves[cartRemoves.length - 1];
      if (!hookData || !hookData.timestamp) {
        return 0;
      }
      const pixelEvt = (sessionInfo - hookData.timestamp) / 3600000;
      const overlayEvt = pixelEvt / 0x18;
      const filterEvt = 100 * Math.pow(0.5, overlayEvt);
      return Math.round(filterEvt);
    },
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => detail.init());
  } else {
    detail.init();
  }
})();
