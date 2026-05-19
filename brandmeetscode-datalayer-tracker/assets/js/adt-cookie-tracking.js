/*!
 * DataLayer Tracker - Cookie Tracking
 *
 * Comprehensive cookie discovery, parsing, and tracking for attribution
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
  if (!window.ADTData?.include?.cookies) {
    return;
  }
  const adtData = function (...args) {
    window.adtDebug("Cookies:", ...args);
  };
  window.adtDebug("Module initializing...");
  const payload = {
    defaultPatterns: {
      google: /^(_ga|_gid|_gcl_|_gac_|__utm)/,
      meta: /^(_fbp|_fbc|fbclid)/,
      microsoft: /^(_uetsid|_uetvid|MUID)/,
      utm: /^(utm_|initial_utm_)/,
      source: /^(sbjs_|adt_source|ref_)/,
      tiktok: /^(_tt_|_ttp)/,
      pinterest: /^(_pin_|_pinterest_)/,
      linkedin: /^(li_|LinkedInAds)/,
      session: /^(adt_session|adt_user|wp_)/,
    },
    parseCookie(eventName) {
      if (!eventName) {
        return {};
      }
      const detail = {};
      const element = eventName.split(";");
      for (const target of element) {
        const [result, ...value] = target.split("=");
        if (!result) {
          continue;
        }
        const flag = result.trim();
        const enabled = value.join("=").trim();
        detail[flag] = {
          name: flag,
          rawValue: enabled,
          value: this.decodeCookieValue(enabled),
          category: this.categorizeCookie(flag),
          timestamp: Date.now(),
        };
      }
      return detail;
    },
    decodeCookieValue(url) {
      if (!url) {
        return "";
      }
      try {
        const pattern = decodeURIComponent(url);
        try {
          return JSON.parse(pattern);
        } catch {
          try {
            const regex = atob(pattern);
            return JSON.parse(regex);
          } catch {
            return pattern;
          }
        }
      } catch {
        return url;
      }
    },
    categorizeCookie(depth) {
      for (const [percent, scrollY] of Object.entries(
        this.defaultPatterns,
      )) {
        if (scrollY.test(depth)) {
          return percent;
        }
      }
      return "other";
    },
    discoverCookies(scrollTop = {}) {
      const {
        matchRegex = null,
        includeAll = false,
        categories = null,
      } = scrollTop;
      const pageKey = this.parseCookie(document.cookie);
      const firedSet = {};
      for (const [milestone, timerId] of Object.entries(pageKey)) {
        let intervalId = false;
        if (includeAll) {
          intervalId = true;
        } else {
          if (matchRegex && matchRegex.test(milestone)) {
            intervalId = true;
          } else {
            if (categories && categories.includes(timerId.category)) {
              intervalId = true;
            } else {
              if (!matchRegex && !categories) {
                const activeSec = this.getDefaultRegex();
                intervalId = activeSec.test(milestone);
              }
            }
          }
        }
        if (intervalId) {
          firedSet[milestone] = timerId;
        }
      }
      return firedSet;
    },
    getDefaultRegex() {
      if (window.ADTData?.["cookieMatchRegex"]) {
        try {
          return new RegExp(window.ADTData.cookieMatchRegex);
        } catch (tickCount) {
          adtData("Invalid regex in settings:", tickCount);
        }
      }
      return /^(utm_|ga|adt_|wp_|_gcl_|_fbp|sbjs_|_tt_|_pin_|_ga|_gid|initial_)/;
    },
    extractAttribution(saveTick) {
      const isActive = {
        source: null,
        medium: null,
        campaign: null,
        term: null,
        content: null,
        gclid: null,
        fbclid: null,
        ttclid: null,
      };
      for (const [lastTick, milestones] of Object.entries(saveTick)) {
        const firedMilestones = milestones.value;
        if (lastTick === "utm_source" || lastTick === "initial_utm_source") {
          isActive.source = firedMilestones;
        } else {
          if (
            lastTick === "utm_medium" ||
            lastTick === "initial_utm_medium"
          ) {
            isActive.medium = firedMilestones;
          } else {
            if (
              lastTick === "utm_campaign" ||
              lastTick === "initial_utm_campaign"
            ) {
              isActive.campaign = firedMilestones;
            } else {
              if (
                lastTick === "utm_term" ||
                lastTick === "initial_utm_term"
              ) {
                isActive.term = firedMilestones;
              } else {
                if (
                  lastTick === "utm_content" ||
                  lastTick === "initial_utm_content"
                ) {
                  isActive.content = firedMilestones;
                } else {
                  if (
                    lastTick.includes("gclid") ||
                    lastTick.includes("_gcl_")
                  ) {
                    isActive.gclid = firedMilestones;
                  } else {
                    if (lastTick.includes("fbclid") || lastTick === "_fbc") {
                      isActive.fbclid = firedMilestones;
                    } else if (lastTick.includes("ttclid")) {
                      isActive.ttclid = firedMilestones;
                    }
                  }
                }
              }
            }
          }
        }
      }
      return isActive;
    },
    getUserIdentifiers(pagePath) {
      const scrollHeight = {};
      for (const [viewportH, scrollPct] of Object.entries(pagePath)) {
        if (viewportH === "_ga") {
          const threshold = scrollPct.value.split(".");
          if (threshold.length >= 0x4) {
            scrollHeight.ga_client_id = threshold.slice(0x2).join(".");
          }
        } else {
          if (viewportH === "_fbp") {
            scrollHeight.fb_browser_id = scrollPct.value;
          } else {
            if (viewportH === "_uetsid") {
              scrollHeight.bing_session_id = scrollPct.value;
            } else {
              if (viewportH === "_uetvid") {
                scrollHeight.bing_user_id = scrollPct.value;
              } else if (viewportH === "adt_user_id") {
                scrollHeight.adt_user_id = scrollPct.value;
              }
            }
          }
        }
      }
      return scrollHeight;
    },
    pushCookieEvent(tolerance = "discovery") {
      const evt = this.discoverCookies();
      const item = Object.keys(evt).length;
      if (item === 0) {
        adtData("No matching cookies found");
        return;
      }
      const key = {
        event: "cookie_" + tolerance,
        cookie_count: item,
        cookie_categories: this.getCategoryCount(evt),
        attribution: this.extractAttribution(evt),
        user_identifiers: this.getUserIdentifiers(evt),
      };
      if (window.ADTData?.["debug_mode"] === "1") {
        key.cookie_details = evt;
      }
      if (typeof window.adtPushDeduped === "function") {
        window.adtPushDeduped(key, "cookie_discovery", 0x2710);
      } else {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(key);
      }
      adtData("Cookie event pushed:", key);
    },
    getCategoryCount(err) {
      const idx = {};
      for (const len of Object.values(err)) {
        idx[len.category] =
          (idx[len.category] || 0) + 1;
      }
      return idx;
    },
    monitorChanges() {
      let mode = document.cookie;
      setInterval(() => {
        if (document.cookie !== mode) {
          adtData("Cookies changed");
          mode = document.cookie;
          this.pushCookieEvent("change");
        }
      }, 5000);
    },
    init() {
      if (!window.hasConsent("analytics")) {
        adtData("Cookie tracking blocked - no consent");
        return;
      }
      adtData("Initializing cookie tracking");
      this.pushCookieEvent("discovery");
      if (window.ADTData?.["monitor_cookie_changes"]) {
        this.monitorChanges();
      }
      window.addEventListener("beforeunload", () => {
        this.pushCookieEvent("final");
      });
    },
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => payload.init());
  } else {
    payload.init();
  }
  window.ADTCookies = {
    discover: (typeVal) => payload.discoverCookies(typeVal),
    parse: (nameVal) => payload.parseCookie(nameVal),
    attribution: () =>
      payload.extractAttribution(payload.discoverCookies()),
    identifiers: () =>
      payload.getUserIdentifiers(payload.discoverCookies()),
    push: () => payload.pushCookieEvent("manual"),
    categories: payload.defaultPatterns,
  };
  window.adtDebug(
    "Cookies: Debug API available:\n  ADTCookies.discover()    - Discover all matching cookies\n  ADTCookies.attribution() - Get attribution data\n  ADTCookies.identifiers() - Get user IDs\n  ADTCookies.push()        - Manually push event",
  );
})();
