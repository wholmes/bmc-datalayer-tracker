/*!
 * DataLayer Tracker - Pageview Module
 *
 * Assembles and pushes pageview event with configured parameters
 * Production hardened with session manager integration
 *
 * @preserve
 * @package    DataLayer_Tracker
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @version    1.2.0
 * @since      1.0.0
 */
(function () {
  "use strict";

  if (typeof window === "undefined") {
    return;
  }
  const pvLog = function (...args) {
    if (
      window.ADTData?.["debug_mode"] === "1" ||
      window.ADTData?.["debug"] === "1"
    ) {
      console.log("[ADT Pageview]", ...args);
    }
  };
  const pvError = function (...args) {
    if (
      window.ADTData?.["debug_mode"] === "1" ||
      window.ADTData?.["debug"] === "1"
    ) {
      console.error("[ADT Pageview ERROR]", ...args);
    }
  };
  function tryFirePageview() {
    if (
      typeof window.hasConsent === "function" &&
      !window.hasConsent("analytics")
    ) {
      pvLog("No analytics consent, pageview blocked");
      return;
    }
    if (window._adtPageviewFired) {
      pvLog("Pageview already fired");
      return;
    }
    pageviewModule.init();
  }
  const pageviewModule = {
    buildPageContext() {
      const out = {};
      const adtData = window.ADTData || {};
      const flags = adtData.include || {};
      try {
        if (flags.pageType) {
          out.page_type = adtData.pageType || this.detectPageType();
        }
        if (flags.postId && adtData.postId) {
          out.post_id = adtData.postId;
        }
        if (flags.pageTitle) {
          out.page_title = document.title || "";
        }
        if (flags.pageURL) {
          try {
            out.page_url = window.location.href;
          } catch (err) {
            out.page_url = "unknown";
          }
        }
        if (flags.path) {
          try {
            out.page_path = window.location.pathname;
          } catch (err) {
            out.page_path = "/";
          }
        }
        if (flags.slug) {
          try {
            const parts = window.location.pathname
              .split("/")
              .filter(Boolean);
            out.page_slug = parts[parts.length - 1] || "home";
          } catch (err) {
            out.page_slug = "home";
          }
        }
        if (flags.template && adtData.template) {
          out.template = adtData.template;
        }
      } catch (err) {
        pvError("Error building page context:", err);
      }
      return out;
    },
    buildUserContext() {
      const out = {};
      const adtData = window.ADTData || {};
      const flags = adtData.include || {};
      try {
        if (flags.user) {
          if (adtData.userId) {
            out.user_id = adtData.userId;
          }
          if (adtData.userRole) {
            out.user_role = adtData.userRole;
          }
          out.logged_in = adtData.is_logged_in || false;
        }
        if (flags.userHash && adtData.userHash) {
          out.user_hash = adtData.userHash;
        }
        if (flags.wpFlags) {
          out.is_admin = adtData.isAdmin || false;
          out.is_editor = adtData.isEditor || false;
        }
      } catch (err) {
        pvError("Error building user context:", err);
      }
      return out;
    },
    buildContentMetadata() {
      const out = {};
      const adtData = window.ADTData || {};
      const flags = adtData.include || {};
      try {
        if (flags.categories && adtData.categories) {
          out.categories = Array.isArray(adtData.categories)
            ? adtData.categories
            : [adtData.categories];
        }
        if (flags.tags && adtData.tags) {
          out.tags = Array.isArray(adtData.tags)
            ? adtData.tags
            : [adtData.tags];
        }
        if (adtData.author) {
          out.author = adtData.author;
        }
        if (adtData.publishedDate) {
          out.published_date = adtData.publishedDate;
        }
      } catch (err) {
        pvError("Error building content metadata:", err);
      }
      return out;
    },
    buildDeviceContext() {
      const out = {};
      const adtData = window.ADTData || {};
      const flags = adtData.include || {};
      try {
        if (flags.screenResolution) {
          out.screen_width =
            (window.screen && window.screen.width) || 0;
          out.screen_height =
            (window.screen && window.screen.height) || 0;
          out.viewport_width = window.innerWidth || 0;
          out.viewport_height = window.innerHeight || 0;
        }
        if (flags.browserLang) {
          out.browser_language =
            navigator.language || navigator.userLanguage || "unknown";
        }
        if (flags.timezoneOffset) {
          try {
            out.timezone_offset = new Date().getTimezoneOffset();
          } catch (err) {
            out.timezone_offset = 0;
          }
        }
      } catch (err) {
        pvError("Error building device context:", err);
      }
      return out;
    },
    buildTrafficSource() {
      const out = {};
      const adtData = window.ADTData || {};
      const flags = adtData.include || {};
      try {
        if (flags.referrer) {
          out.referrer = document.referrer || "direct";
        }
        if (flags.utm && window.ADTUtm) {
          const utm = window.ADTUtm.get?.();
          if (utm) {
            out.utm_source = utm.source;
            out.utm_medium = utm.medium;
            out.utm_campaign = utm.campaign;
            out.utm_term = utm.term;
            out.utm_content = utm.content;
          }
        }
        try {
          const params = new URLSearchParams(window.location.search);
          const clickIds = ["gclid", "fbclid", "msclkid", "ttclid"];
          clickIds.forEach((key) => {
            const val = params.get(key);
            if (val) {
              out[key] = val;
            }
          });
        } catch (err) {
          pvLog("Could not parse URL parameters:", err);
        }
      } catch (err) {
        pvError("Error building traffic source context:", err);
      }
      return out;
    },
    detectPageType() {
      try {
        const bodyClass = (document.body && document.body.className) || "";
        if (bodyClass.includes("home")) {
          return "home";
        }
        if (bodyClass.includes("single-product")) {
          return "product";
        }
        if (bodyClass.includes("single")) {
          return "article";
        }
        if (bodyClass.includes("page")) {
          return "page";
        }
        if (bodyClass.includes("archive")) {
          return "archive";
        }
        if (bodyClass.includes("category")) {
          return "category";
        }
        if (bodyClass.includes("search")) {
          return "search";
        }
        if (bodyClass.includes("error404")) {
          return "404";
        }
        try {
          if (window.location.pathname === "/") {
            return "home";
          }
          if (window.location.pathname.includes("/product")) {
            return "product";
          }
          if (window.location.pathname.includes("/category")) {
            return "category";
          }
        } catch (err) {}
        return "page";
      } catch (err) {
        pvError("Error detecting page type:", err);
        return "page";
      }
    },
    addSessionContext(payload) {
      if (!payload || typeof payload !== "object") {
        pvError("Invalid payload passed to addSessionContext");
        return payload || {};
      }
      if (
        window._adtSessionInitialized &&
        window.ADTSession &&
        typeof window.ADTSession.id === "function"
      ) {
        try {
          const sessionId = window.ADTSession.id();
          const sessionNumber = window.ADTSession.number();
          const tabId = window.ADTSession.tabId();
          if (sessionId) {
            payload.session_id = sessionId;
            payload.session_number = sessionNumber;
            payload.tab_id = tabId;
            pvLog("Session context added to pageview:", {
              session_id: sessionId,
              session_number: sessionNumber,
              tab_id: tabId,
            });
          } else {
            payload.session_id = null;
            payload.session_number = 0;
            payload.tab_id = null;
            pvLog("Session not started yet, using null values");
          }
        } catch (err) {
          pvError("Error adding session context:", err);
          payload.session_id = null;
          payload.session_number = 0;
          payload.tab_id = null;
        }
      } else {
        payload.session_id = null;
        payload.session_number = 0;
        payload.tab_id = null;
        pvLog("Session manager not initialized yet:", {
          initialized: window._adtSessionInitialized,
          hasAPI: !!window.ADTSession,
          hasIdFunction: typeof window.ADTSession?.["id"] === "function",
        });
      }
      return payload;
    },
    safeTimestamp() {
      try {
        return new Date().toISOString();
      } catch (err) {
        return Date.now().toString();
      }
    },
    safePushToDataLayer(payload) {
      try {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(payload);
      } catch (err) {
        pvError("Failed to push to dataLayer:", err);
        window._adtPageviewFallback = window._adtPageviewFallback || [];
        window._adtPageviewFallback.push(payload);
      }
    },
    dispatchCustomEvent(payload) {
      try {
        if (typeof window.CustomEvent === "function") {
          window.dispatchEvent(
            new CustomEvent("adt_pageview_fired", {
              detail: payload,
            }),
          );
        } else {
          if (document.createEvent) {
            const evt = document.createEvent("Event");
            evt.initEvent("adt_pageview_fired", true, true);
            evt.detail = payload;
            window.dispatchEvent(evt);
          }
        }
      } catch (err) {
        pvLog("Could not dispatch custom event:", err);
      }
    },
    pushPageview() {
      if (window.ADTData && window.ADTData.shouldTrackPage === false) {
        window.adtDebug(
          "❌ Page excluded by regex rules, pageview tracking blocked",
        );
        return;
      }
      if (window._adtPageviewFired) {
        window.adtDebug("Pageview already fired, skipping");
        return;
      }
      window.adtDebug("[DEBUG] pushPageview called:", {
        sessionInitialized: window._adtSessionInitialized,
        hasSessionAPI: !!window.ADTSession,
        sessionId: window.ADTSession?.["id"]?.(),
      });
      if (!window._adtSessionInitialized) {
        const blockedByConsent =
          window.ADTData?.["delay_until_consent"] === "1" &&
          typeof window.hasConsent === "function" &&
          !window.hasConsent("analytics");
        if (blockedByConsent) {
          window.adtDebug(
            "Session blocked by consent, firing pageview without session",
          );
        } else {
          if (!window._adtPageviewWaitCount) {
            window._adtPageviewWaitCount = 0;
          }
          if (window._adtPageviewWaitCount < 3) {
            window._adtPageviewWaitCount++;
            window.adtDebug(
              "Waiting for session manager... attempt:",
              window._adtPageviewWaitCount,
            );
            setTimeout(() => pageviewModule.pushPageview(), 100);
            return;
          } else {
            pvLog(
              "Session manager not available after 3 attempts, continuing without session",
            );
          }
        }
      }
      window._adtPageviewFired = true;
      try {
        let payload = {
          event: "page_view",
          timestamp: this.safeTimestamp(),
          page: this.buildPageContext(),
          user: this.buildUserContext(),
          content: this.buildContentMetadata(),
          device: this.buildDeviceContext(),
          traffic_source: this.buildTrafficSource(),
        };
        payload = this.addSessionContext(payload);
        Object.keys(payload).forEach((key) => {
          if (
            payload[key] &&
            typeof payload[key] === "object" &&
            Object.keys(payload[key]).length === 0
          ) {
            delete payload[key];
          }
        });
        this.safePushToDataLayer(payload);
        window.adtDebug("Pageview pushed:", payload);
        this.dispatchCustomEvent(payload);
      } catch (err) {
        pvError("Critical error pushing pageview:", err);
        window._adtPageviewFired = false;
        if (!window._adtPageviewRetryAttempted) {
          window._adtPageviewRetryAttempted = true;
          setTimeout(() => {
            pageviewModule.pushPageview();
          }, 1000);
        }
      }
    },
    init() {
      window.adtDebug("Initializing pageview tracking");
      setTimeout(() => {
        this.pushPageview();
      }, 100);
    },
  };
  function integrateWithSession() {
    if (window._adtPageviewSessionIntegrated) {
      return;
    }
    if (window._adtPageviewSessionTimeout) {
      clearTimeout(window._adtPageviewSessionTimeout);
      window._adtPageviewSessionTimeout = null;
    }
    if (!window.ADTSession) {
      if (typeof window._adtPageviewRetryCount !== "number") {
        window._adtPageviewRetryCount = 0;
      }
      if (window._adtPageviewRetryCount < 10) {
        window._adtPageviewRetryCount++;
        window._adtPageviewSessionTimeout = setTimeout(
          () => integrateWithSession(),
          500,
        );
        window.adtDebug("Pageview: Session manager not ready, retrying...");
      } else {
        window.adtDebug(
          "Pageview: Session manager not available after retries",
        );
        delete window._adtPageviewRetryCount;
      }
      return;
    }
    if (typeof window.ADTSession.registerHook !== "function") {
      pvLog("Session manager API not available (registerHook missing)");
      if (window._adtPageviewRetryCount) {
        delete window._adtPageviewRetryCount;
      }
      return;
    }
    if (!window._adtSessionInitialized) {
      if (typeof window._adtPageviewRetryCount !== "number") {
        window._adtPageviewRetryCount = 0;
      }
      if (window._adtPageviewRetryCount < 10) {
        window._adtPageviewRetryCount++;
        window._adtPageviewSessionTimeout = setTimeout(
          () => integrateWithSession(),
          500,
        );
        window.adtDebug(
          "Pageview: Session exists but not initialized, retrying...",
        );
        return;
      }
    }
    window._adtPageviewSessionIntegrated = true;
    if (window._adtPageviewRetryCount) {
      delete window._adtPageviewRetryCount;
    }
    window.adtDebug("Pageview: Integrating with session manager");
    try {
      window.ADTSession.registerHook("start", function (sessionInfo) {
        setTimeout(() => {
          const pageCtx = pageviewModule.buildPageContext();
          if (pageCtx.page_type) {
            const evt = {
              event: "session_pageview_context",
              session_id: sessionInfo.sessionId,
              session_start_reason: sessionInfo.reason,
              page_type: pageCtx.page_type,
              page_path:
                pageCtx.page_path ||
                (window.location && window.location.pathname) ||
                "/",
              page_title: pageCtx.page_title || document.title || "",
              timestamp: pageviewModule.safeTimestamp(),
            };
            if (typeof window.adtPushDeduped === "function") {
              window.adtPushDeduped(
                evt,
                "session_pageview_" + sessionInfo.sessionId,
                5000,
              );
            } else {
              pageviewModule.safePushToDataLayer(evt);
            }
            window.adtDebug(
              "Pageview: Session pageview context pushed:",
              evt,
            );
          }
        }, 200);
      });
      window.ADTSession.registerHook("ping", function (pingInfo) {
        const pageCtx = pageviewModule.buildPageContext();
        if (pageCtx.page_type) {
          const evt = {
            event: "session_page_ping",
            session_id: pingInfo.sessionId,
            ping_number: pingInfo.pingNumber,
            page_type: pageCtx.page_type,
            page_path: (window.location && window.location.pathname) || "/",
            timestamp: pageviewModule.safeTimestamp(),
          };
          if (typeof window.adtPushDeduped === "function") {
            window.adtPushDeduped(
              evt,
              "page_ping_" + pingInfo.sessionId,
              30000,
            );
          } else {
            pageviewModule.safePushToDataLayer(evt);
          }
          window.adtDebug("Pageview: Page ping sent with session context");
        }
      });
      window.ADTSession.registerHook("exit", function (exitInfo) {
        const pageCtx = pageviewModule.buildPageContext();
        const evt = {
          event: "session_page_summary",
          session_id: exitInfo.sessionId,
          exit_reason: exitInfo.reason,
          final_page_type: pageCtx.page_type,
          final_page_path: (window.location && window.location.pathname) || "/",
          final_page_title: document.title || "",
          session_duration: exitInfo.duration || 0,
          timestamp: pageviewModule.safeTimestamp(),
        };
        pageviewModule.safePushToDataLayer(evt);
        pvLog("Page summary sent on session exit:", evt);
      });
    } catch (err) {
      window.adtError("Pageview: Error registering session hooks:", err);
    }
    window.adtDebug("Pageview: Session integration complete");
  }
  function bootstrapPageview() {
    try {
      if (
        typeof window.adtShouldTrackEvent === "function" &&
        !window.adtShouldTrackEvent("pageview")
      ) {
        window.adtDebug("Pageview: ❌ Pageview blocked by regex rules");
        return;
      }
      if (!window.ADTData) {
        if (!window._adtPageviewInitRetries) {
          window._adtPageviewInitRetries = 0;
        }
        if (window._adtPageviewInitRetries < 20) {
          window._adtPageviewInitRetries++;
          setTimeout(bootstrapPageview, 50);
          return;
        }
      }
      integrateWithSession();
      if (window.ADTConsentReady) {
        tryFirePageview();
      } else {
        if (window.ADTConsentManager) {
          window.addEventListener("adt_consent_loaded", tryFirePageview);
        } else {
          const adtData = window.ADTData || {};
          if (
            adtData.fallback_track_without_cmp === "1" ||
            adtData.fallback_track_without_cmp === "1"
          ) {
            pageviewModule.init();
          }
        }
      }
    } catch (err) {
      window.adtError("Pageview: Error in initPageview:", err);
    }
  }
  try {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", bootstrapPageview);
    } else {
      bootstrapPageview();
    }
  } catch (err) {
    setTimeout(bootstrapPageview, 100);
  }
  window.ADTPageview = {
    getContext: () => {
      try {
        return {
          page: pageviewModule.buildPageContext(),
          user: pageviewModule.buildUserContext(),
          content: pageviewModule.buildContentMetadata(),
          device: pageviewModule.buildDeviceContext(),
          traffic: pageviewModule.buildTrafficSource(),
        };
      } catch (err) {
        window.adtError("Pageview: Error getting context:", err);
        return {};
      }
    },
    fire: () => pageviewModule.pushPageview(),
    sessionIntegrated: () => window._adtPageviewSessionIntegrated || false,
    status: () => ({
      fired: window._adtPageviewFired || false,
      sessionIntegrated: window._adtPageviewSessionIntegrated || false,
      retryCount: window._adtPageviewRetryCount || 0,
      fallbackEvents: (window._adtPageviewFallback || []).length,
    }),
  };
})();
