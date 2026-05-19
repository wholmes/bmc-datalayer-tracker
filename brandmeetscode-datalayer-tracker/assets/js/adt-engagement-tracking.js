/*!
 * DataLayer Tracker - Engagement Tracking
 *
 * Tracks user engagement signals: scroll depth, time on page, tab visibility, scroll_back_up
 *
 * @preserve
 * @package    DataLayer_Tracker
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @version    1.0.5
 * @since      1.0.0
 *
 */
(function () {
  "use strict";

  if (typeof window === "undefined") {
    return;
  }
  if (window._adtEngagementInitialized) {
    console.warn("[ADT Engagement] Already initialized, skipping");
    return;
  }
  window._adtEngagementInitialized = true;
  window.dataLayer = window.dataLayer || [];
  const adtData = window.ADTData || {};
  const engLog = function (...args) {
    if (
      adtData.debug_mode === "1" ||
      adtData.debug_mode === true ||
      adtData.debug === "1"
    ) {
      console.log(...args);
    }
  };
  engLog("[ADT Engagement] Module loading...", adtData);

  function normalizeSessionId(sessionId) {
    if (typeof window.adtNormalizeSessionId === "function") {
      return window.adtNormalizeSessionId(sessionId);
    }
    if (sessionId == null || sessionId === "") {
      return sessionId;
    }
    if (typeof sessionId === "object" && sessionId.value) {
      return String(sessionId.value);
    }
    if (typeof sessionId !== "string") {
      return String(sessionId);
    }
    const trimmed = sessionId.trim();
    if (trimmed.charAt(0) === "{" && trimmed.indexOf('"value"') !== -1) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && parsed.value) {
          return String(parsed.value);
        }
      } catch (parseErr) {
        /* keep raw */
      }
    }
    return trimmed;
  }

  function appendSessionContext(target) {
    if (!window._adtSessionInitialized || !window.ADTSession) {
      return target;
    }
    try {
      if (typeof window.ADTSession.id === "function") {
        target.session_id = normalizeSessionId(window.ADTSession.id());
      }
      if (typeof window.ADTSession.number === "function") {
        target.session_number = window.ADTSession.number();
      }
      if (typeof window.ADTSession.tabId === "function") {
        target.tab_id = window.ADTSession.tabId();
      }
      if (typeof window.ADTSession.getActiveTime === "function") {
        target.active_seconds = window.ADTSession.getActiveTime();
      }
    } catch (sessionErr) {
      engLog("[ADT Engagement] Error adding session context:", sessionErr);
    }
    return target;
  }

  /** Single push path for engagement events (avoids duplicate minimal + enriched pushes). */
  function pushEngagementEvent(eventPayload, dedupeKey, dedupeMs = 60000) {
    const enriched = appendSessionContext({
      ...eventPayload,
      page_path: window.location.pathname + window.location.search,
    });
    if (
      enriched.scroll_percent != null &&
      enriched.scroll_percent !== ""
    ) {
      const depthNum = parseInt(enriched.scroll_percent, 10);
      if (!Number.isNaN(depthNum)) {
        enriched.scroll_percent = depthNum;
      }
    }
    if (typeof window.adtPushDeduped === "function") {
      window.adtPushDeduped(enriched, dedupeKey, dedupeMs);
    } else {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(enriched);
    }
    return enriched;
  }

  function loadEngagementMetrics() {
    try {
      const raw = sessionStorage.getItem("adt_engagement_metrics");
      if (raw) {
        const parsed = JSON.parse(raw);
        window._adtScrollDepths = new Set(parsed.scrollDepths || []);
        window._adtTimeOnPage = parsed.timeOnPage || 0;
        window._adtActiveTime = parsed.activeTime || 0;
        window._adtTabSwitches = parsed.tabSwitches || 0;
        window._adtScrollBacks = parsed.scrollBacks || 0;
        engLog("[ADT Engagement] Loaded metrics:", parsed);
      } else {
        window._adtTimeOnPage = 0;
        window._adtTabSwitches = 0;
        window._adtScrollBacks = 0;
        window._adtActiveTime = 0;
        window._adtScrollDepths = new Set();
      }
    } catch (err) {
      engLog("[ADT Engagement] Error loading metrics:", err);
      window._adtTimeOnPage = 0;
      window._adtTabSwitches = 0;
      window._adtScrollBacks = 0;
      window._adtActiveTime = 0;
      window._adtScrollDepths = new Set();
    }
  }
  function saveEngagementMetrics() {
    try {
      const snapshot = {
        scrollDepths: Array.from(window._adtScrollDepths || []),
        timeOnPage: window._adtTimeOnPage || 0,
        activeTime: window._adtActiveTime || 0,
        tabSwitches: window._adtTabSwitches || 0,
        scrollBacks: window._adtScrollBacks || 0,
      };
      sessionStorage.setItem(
        "adt_engagement_metrics",
        JSON.stringify(snapshot),
      );
    } catch (err) {
      engLog("[ADT Engagement] Error saving metrics:", err);
    }
  }
  loadEngagementMetrics();
  window._adtEngagedReaderFired = false;
  window._adtDeepEngagementFired = false;
  window._adtTimeInterval = null;
  function initScrollTracking() {
    const payload = adtData?.["include"]?.["engagement"]?.["scrollDepth"];
    const eventName = adtData?.["include"]?.["engagement"]?.["scrollBackUp"];
    if (!payload && !eventName) {
      engLog("[ADT Engagement] All scroll tracking disabled");
      return;
    }
    if (window.ADTData?.["regex_exclude"]) {
      const detail = window.location.href;
      try {
        const element = new RegExp(window.ADTData.regex_exclude);
        if (element.test(detail)) {
          console.log("[ADT Scroll] Blocked - URL matches regex_exclude");
          return;
        }
      } catch (target) {
        console.error("[ADT Scroll] Invalid regex pattern:", target);
      }
    }
    if (payload) {
      const result = [25, 50, 75, 100];
      let value = window.location.pathname + window.location.search;
      let flag = new Set();
      function enabled() {
        const url = window.location.pathname + window.location.search;
        if (url !== value) {
          engLog(
            "[ADT Engagement] Page changed: " + value + " → " + url,
          );
          value = url;
          flag.clear();
          pattern();
        }
      }
      function regex(depth) {
        if (flag.has(depth)) {
          return;
        }
        flag.add(depth);
        if (!window._adtScrollDepths) {
          window._adtScrollDepths = new Set();
        }
        window._adtScrollDepths.add(depth);
        saveEngagementMetrics();
        const percent =
          adtData?.["include"]?.["engagement"]?.["scrollEventMode"] ||
          "depth";
        let scrollY;
        let scrollTop;
        if (percent === "custom") {
          scrollY = "scroll_" + depth;
          scrollTop = {
            event: scrollY,
            scroll_depth: String(depth),
          };
        } else {
          scrollY = "scroll_depth";
          scrollTop = {
            event: scrollY,
            scroll_percent: String(depth),
          };
        }
        const scrollDedupeKey =
          scrollY +
          "_" +
          depth +
          "_" +
          (window.location.pathname + window.location.search);
        pushEngagementEvent(scrollTop, scrollDedupeKey);
        if (
          window.ADTData?.dual_pixel_mode === "1" &&
          window.ADTPixels?.["trackEvent"]
        ) {
          window.ADTPixels.trackEvent(
            scrollY,
            percent === "custom"
              ? {
                  scroll_depth: depth,
                }
              : {
                  scroll_percent: depth,
                },
          );
        }
        engLog(
          "[ADT Engagement] ✅ Fired: " + scrollY + " on " + value,
        );
      }
      function pattern() {
        enabled();
        const pageKey =
          window.pageYOffset || document.documentElement.scrollTop;
        const firedSet = document.documentElement.scrollHeight;
        const milestone = window.innerHeight;
        if (firedSet <= milestone) {
          regex(100);
          return;
        }
        const timerId = Math.round(
          (pageKey / (firedSet - milestone)) * 100,
        );
        result.forEach((intervalId) => {
          const activeSec = intervalId === 100 ? 0x2 : 0;
          if (timerId >= intervalId - activeSec) {
            regex(intervalId);
          }
        });
      }
      let tickCount = null;
      function saveTick() {
        if (tickCount) {
          return;
        }
        tickCount = setTimeout(() => {
          pattern();
          tickCount = null;
        }, 100);
      }
      window.addEventListener("scroll", saveTick, {
        passive: true,
      });
      const isActive = history.pushState;
      const lastTick = history.replaceState;
      history.pushState = function () {
        isActive.apply(this, arguments);
        enabled();
      };
      history.replaceState = function () {
        lastTick.apply(this, arguments);
        enabled();
      };
      window.addEventListener("popstate", enabled);
      pattern();
      engLog(
        "[ADT Engagement] Scroll depth tracking initialized for: " + value,
      );
    }
    if (eventName) {
      let milestones = window.scrollY || 0;
      let firedMilestones = milestones;
      let pagePath = window.location.pathname + window.location.search;
      let scrollHeight = 0;
      function viewportH() {
        const scrollPct = window.location.pathname + window.location.search;
        if (scrollPct !== pagePath) {
          pagePath = scrollPct;
          milestones = window.scrollY || 0;
          firedMilestones = milestones;
          scrollHeight = 0;
          engLog("[ADT Engagement] Scroll back tracking reset for new page");
        }
      }
      function threshold() {
        viewportH();
        const tolerance = window.scrollY || 0;
        if (tolerance > firedMilestones) {
          firedMilestones = tolerance;
        }
        const evt = firedMilestones - tolerance;
        if (evt >= 150) {
          const item = Date.now();
          if (item - scrollHeight >= 5000) {
            scrollHeight = item;
            window._adtScrollBacks = (window._adtScrollBacks || 0) + 1;
            saveEngagementMetrics();
            pushEngagementEvent(
              {
                event: "scroll_back_up",
                scroll_distance: Math.round(evt),
              },
              "scroll_back_up_" +
                pagePath +
                "_" +
                Math.round(evt),
              5000,
            );
            if (
              window.ADTData?.dual_pixel_mode === "1" &&
              window.ADTPixels?.["trackEvent"]
            ) {
              window.ADTPixels.trackEvent("scroll_back_up", {
                scroll_distance: Math.round(evt),
              });
            }
            engLog(
              "[ADT Engagement] Scroll back up: " +
                evt +
                "px on " +
                pagePath,
            );
            firedMilestones = tolerance;
          }
        }
        milestones = tolerance;
      }
      let err = null;
      function idx() {
        if (err) {
          return;
        }
        err = setTimeout(() => {
          threshold();
          err = null;
        }, 100);
      }
      window.addEventListener("scroll", idx, {
        passive: true,
      });
      const len = history.pushState;
      const mode = history.replaceState;
      history.pushState = function () {
        len.apply(this, arguments);
        viewportH();
      };
      history.replaceState = function () {
        mode.apply(this, arguments);
        viewportH();
      };
      window.addEventListener("popstate", viewportH);
      engLog("[ADT Engagement] Scroll back up tracking initialized");
    }
  }
  function initTimeOnPage() {
    console.log("[ADT Engagement] trackTimeOnPage called");
    const nameVal =
      adtData?.["include"]?.["engagement"]?.["timeOnPage"] !== false;
    console.log("[ADT Engagement] Time on page enabled check:", nameVal);
    if (!nameVal) {
      engLog("[ADT Engagement] Time on page explicitly disabled");
      return;
    }
    if (window.ADTData?.["regex_exclude"]) {
      const opts = window.location.href;
      try {
        const ref = new RegExp(window.ADTData.regex_exclude);
        if (ref.test(opts)) {
          console.log("[ADT Time On Page] Blocked - URL matches regex_exclude");
          return;
        }
      } catch (val) {
        console.error("[ADT Time On Page] Invalid regex pattern:", val);
      }
    }
    console.log("[ADT Engagement] Starting time on page timer...");
    let obj = 0;
    let fn = 0;
    const arg = setInterval(() => {
      if (!document.hidden) {
        obj++;
        window._adtTimeOnPage++;
        fn++;
        if (fn >= 5) {
          saveEngagementMetrics();
          fn = 0;
        }
      }
    }, 1000);
    window._adtTimeInterval = arg;
    console.log("[ADT Engagement] Timer created:", arg);
    window.addEventListener("beforeunload", () => {
      saveEngagementMetrics();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        saveEngagementMetrics();
      }
    });
    console.log("[ADT Engagement] Time on page tracking fully initialized");
  }
  function initActiveTimeTracking() {
    window._adtActiveTime = window._adtActiveTime || 0;
    if (!adtData?.["include"]?.["engagement"]?.["activeTime"]) {
      engLog("[ADT Engagement] Active time disabled");
      return;
    }
    if (window.ADTData?.["regex_exclude"]) {
      const node = window.location.href;
      try {
        const list = new RegExp(window.ADTData.regex_exclude);
        if (list.test(node)) {
          console.log("[ADT Active Time] Blocked - URL matches regex_exclude");
          return;
        }
      } catch (entry) {
        console.error("[ADT Active Time] Invalid regex pattern:", entry);
      }
    }
    let state = window.location.pathname + window.location.search;
    let ctx = 0;
    let data = Date.now();
    let row = !document.hidden;
    let col = null;
    const mapVal = [30, 60, 120, 300];
    const setVal = new Set();
    function buf() {
      if (col) {
        return;
      }
      let text = 0;
      col = setInterval(() => {
        const html = Date.now();
        const cmpName = html - data;
        if (cmpName < 30000 && !document.hidden) {
          ctx++;
          window._adtActiveTime = ctx;
          text++;
          if (text >= 5) {
            saveEngagementMetrics();
            text = 0;
          }
          if (!row) {
            row = true;
            engLog(
              "[ADT Engagement] ✅ User active again at",
              ctx,
              "seconds",
            );
          }
          mapVal.forEach((handler) => {
            if (ctx === handler && !setVal.has(handler)) {
              setVal.add(handler);
              callback(handler);
            }
          });
        } else if (row) {
          row = false;
          saveEngagementMetrics();
          engLog("[ADT Engagement] ⏸️ User idle at", ctx, "seconds");
        }
      }, 1000);
      engLog("[ADT Engagement] Active timer started");
    }
    function response() {
      if (col) {
        clearInterval(col);
        col = null;
        engLog("[ADT Engagement] Active timer stopped");
      }
    }
    function request() {
      const fields = window.location.pathname + window.location.search;
      if (fields !== state) {
        engLog(
          "[ADT Engagement] Page changed: " + state + " → " + fields,
        );
        if (ctx > 0) {
          callback(ctx, true);
        }
        state = fields;
        ctx = 0;
        setVal.clear();
        data = Date.now();
        row = !document.hidden;
      }
    }
    function callback(formId, fieldId = false) {
      const activeDedupeKey =
        "active_time_" +
        formId +
        "_" +
        state +
        (fieldId ? "_final" : "");
      pushEngagementEvent(
        {
          event: "active_time",
          seconds: formId,
          is_final: fieldId,
          timestamp: new Date().toISOString(),
        },
        fieldId ? activeDedupeKey + "_final_" + Date.now() : activeDedupeKey,
        fieldId ? 1000 : 60000,
      );
      if (
        window.ADTData?.dual_pixel_mode === "1" &&
        window.ADTPixels?.["trackEvent"]
      ) {
        window.ADTPixels.trackEvent("active_time", {
          seconds: formId,
          is_final: fieldId,
        });
      }
      engLog(
        "[ADT Engagement] ✅ Active time " +
          (fieldId ? "final" : "milestone") +
          ": " +
          formId +
          "s on " +
          state,
      );
    }
    function sessionInfo() {
      response();
      if (ctx > 0) {
        callback(ctx, true);
        engLog(
          "[ADT Engagement] Final active time sent:",
          ctx,
          "seconds",
        );
      }
    }
    function hookData() {
      data = Date.now();
      if (!row && !document.hidden) {
        row = true;
      }
    }
    const pixelEvt = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];
    pixelEvt.forEach((overlayEvt) => {
      document.addEventListener(overlayEvt, hookData, {
        passive: true,
      });
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        row = false;
        engLog("[ADT Engagement] Tab hidden - pausing timer");
      } else {
        data = Date.now();
        row = true;
        engLog("[ADT Engagement] Tab visible - resuming timer");
      }
    });
    const filterEvt = history.pushState;
    const searchParams = history.replaceState;
    history.pushState = function () {
      filterEvt.apply(this, arguments);
      request();
    };
    history.replaceState = function () {
      searchParams.apply(this, arguments);
      request();
    };
    window.addEventListener("popstate", request);
    window.addEventListener("beforeunload", sessionInfo);
    window.addEventListener("pagehide", sessionInfo);
    buf();
    engLog(
      "[ADT Engagement] Active time tracking initialized for:",
      state,
    );
  }
  function initTabVisibility() {
    if (!adtData?.["include"]?.["engagement"]?.["focusBlur"]) {
      engLog("[ADT Engagement] Tab visibility disabled");
      return;
    }
    if (window.ADTData?.["regex_exclude"]) {
      const utmData = window.location.href;
      try {
        const cookieVal = new RegExp(window.ADTData.regex_exclude);
        if (cookieVal.test(utmData)) {
          console.log(
            "[ADT Tab Visibility] Blocked - URL matches regex_exclude",
          );
          return;
        }
      } catch (cookieKey) {
        console.error("[ADT Tab Visibility] Invalid regex pattern:", cookieKey);
      }
    }
    window._adtTabSwitches = window._adtTabSwitches || 0;
    document.addEventListener("visibilitychange", () => {
      const consentRaw = document.hidden ? "hidden" : "visible";
      if (document.hidden) {
        window._adtTabSwitches++;
        saveEngagementMetrics();
      }
      const consentObj = {
        event: "tab_visibility",
        state: consentRaw,
        tab_switches: window._adtTabSwitches,
        timestamp: new Date().toISOString(),
      };
      pushEngagementEvent(
        consentObj,
        "tab_visibility_" + consentRaw + "_" + window._adtTabSwitches,
        2000,
      );
      if (
        window.ADTData?.dual_pixel_mode === "1" &&
        window.ADTPixels?.["trackEvent"]
      ) {
        window.ADTPixels.trackEvent("tab_visibility", {
          state: consentRaw,
          tab_switches: window._adtTabSwitches,
        });
      }
      engLog(
        "[ADT Engagement] ✅ Tab visibility: " +
          consentRaw +
          " (switches: " +
          window._adtTabSwitches +
          ")",
      );
    });
    engLog("[ADT Engagement] Tab visibility tracking initialized");
  }
  function bootstrapEngagement() {
    try {
      engLog("[ADT Engagement] Initializing...", {
        "include.engagement.scrollDepth":
          adtData?.["include"]?.["engagement"]?.["scrollDepth"],
        "include.engagement.timeOnPage":
          adtData?.["include"]?.["engagement"]?.["timeOnPage"],
        "include.engagement.activeTime":
          adtData?.["include"]?.["engagement"]?.["activeTime"],
        "include.engagement.scrollBackUp":
          adtData?.["include"]?.["engagement"]?.["scrollBackUp"],
        "include.engagement.focusBlur":
          adtData?.["include"]?.["engagement"]?.["focusBlur"],
        scrollEventMode:
          adtData?.["include"]?.["engagement"]?.["scrollEventMode"],
      });
      initScrollTracking();
      initTimeOnPage();
      initActiveTimeTracking();
      initTabVisibility();
      setTimeout(() => {
        integrateEngagementWithSession();
      }, 100);
      engLog("[ADT Engagement] All trackers initialized");
    } catch (last) {
      console.error("[ADT Engagement] Init error:", last);
    }
  }
  function integrateEngagementWithSession() {
    if (window._adtEngagementSessionIntegrated) {
      engLog("[ADT Engagement] Already integrated with session manager");
      return;
    }
    if (!window.ADTSession) {
      if (!window._adtEngagementRetryCount) {
        window._adtEngagementRetryCount = 0;
      }
      if (window._adtEngagementRetryCount < 10) {
        window._adtEngagementRetryCount++;
        setTimeout(integrateEngagementWithSession, 500);
        engLog(
          "[ADT Engagement] Session manager not ready, retrying...",
          window._adtEngagementRetryCount,
        );
      } else {
        engLog(
          "[ADT Engagement] Session manager not available after retries",
        );
      }
      return;
    }
    if (typeof window.ADTSession.registerHook !== "function") {
      engLog(
        "[ADT Engagement] Session manager is a stub (session hooks unavailable)",
      );
      return;
    }
    window._adtEngagementSessionIntegrated = true;
    engLog("[ADT Engagement] Integrating with session manager");
    const diff = function () {
      const found = window._adtScrollDepths
        ? Array.from(window._adtScrollDepths)
        : [];
      const detected = found.length > 0 ? Math.max(...found) : 0;
      const retryCount = window._adtTimeOnPage || 0;
      const maxRetries = window._adtTabSwitches || 0;
      const delayMs = window._adtScrollBacks || 0;
      let timeoutMs = 0;
      timeoutMs += (detected / 100) * 30;
      timeoutMs += Math.min(40, (retryCount / 300) * 40);
      timeoutMs += Math.max(0, 20 - maxRetries * 5);
      timeoutMs += Math.min(10, delayMs * 5);
      return {
        maxScrollDepth: detected,
        scrollMilestones: found,
        timeOnPageSeconds: retryCount,
        tabSwitches: maxRetries,
        scrollBacks: delayMs,
        attentionScore: Math.round(timeoutMs),
        engagementLevel:
          timeoutMs >= 70 ? "high" : timeoutMs >= 40 ? "medium" : "low",
      };
    };
    const hasConsent = function (blocked) {
      let wasBlocked = 0;
      if (
        blocked.maxScrollDepth >= 75 &&
        blocked.timeOnPageSeconds >= 60
      ) {
        wasBlocked += 40;
      } else {
        if (
          blocked.maxScrollDepth >= 50 &&
          blocked.timeOnPageSeconds >= 30
        ) {
          wasBlocked += 25;
        } else if (blocked.maxScrollDepth >= 25) {
          wasBlocked += 10;
        }
      }
      if (blocked.tabSwitches <= 1) {
        wasBlocked += 30;
      } else if (blocked.tabSwitches <= 3) {
        wasBlocked += 15;
      }
      if (blocked.scrollBacks > 0) {
        wasBlocked += Math.min(20, blocked.scrollBacks * 10);
      }
      if (blocked.attentionScore >= 70) {
        wasBlocked += 10;
      }
      return Math.min(100, wasBlocked);
    };
    const analyticsOk = function () {
      const marketingOk = diff();
      if (
        marketingOk.maxScrollDepth >= 50 &&
        marketingOk.timeOnPageSeconds >= 30 &&
        !window._adtEngagedReaderFired
      ) {
        window._adtEngagedReaderFired = true;
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          session_id: window.ADTSession.id(),
          milestone: "deep_engagement",
          engagement_metrics: marketingOk,
          timestamp: new Date().toISOString(),
        });
        window.dataLayer.push({
          event: "session_engagement_milestone",
        });
        engLog("[ADT Engagement] Engaged reader milestone reached");
      }
      if (
        marketingOk.maxScrollDepth >= 75 &&
        marketingOk.timeOnPageSeconds >= 120 &&
        !window._adtDeepEngagementFired
      ) {
        window._adtDeepEngagementFired = true;
        const extra = {
          event: "session_engagement_milestone",
          session_id: window.ADTSession.id(),
          milestone: "deep_engagement",
          engagement_metrics: marketingOk,
          timestamp: new Date().toISOString(),
        };
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(extra);
        engLog("[ADT Engagement] Deep engagement milestone reached");
      }
    };
    try {
      window.ADTSession.registerHook(
        "onExit",
        "engagement",
        function (source) {
          try {
            const granted = diff();
            analyticsOk();
            return {
              engagement_metrics: granted,
              page_quality_score: hasConsent(granted),
            };
          } catch (previous) {
            console.error("[ADT Engagement] Error in exit hook:", previous);
            return {};
          }
        },
      );
      window.ADTSession.registerHook(
        "idle",
        "engagement",
        function (storageErr) {
          try {
            const localA = diff();
            const localB = {
              event: "engagement_idle",
              session_id: storageErr.sessionId,
              metrics_at_idle: localA,
              timestamp: new Date().toISOString(),
            };
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push(localB);
            engLog(
              "[ADT Engagement] User became idle with metrics:",
              localA,
            );
          } catch (localC) {
            console.error("[ADT Engagement] Error in idle hook:", localC);
          }
        },
      );
      window.ADTSession.registerHook(
        "active",
        "engagement",
        function (localD) {
          try {
            analyticsOk();
            const localE = {
              event: "engagement_reactivated",
              session_id: localD.sessionId,
              time_on_page: window._adtTimeOnPage || 0,
              timestamp: new Date().toISOString(),
            };
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push(localE);
            engLog("[ADT Engagement] User reactivated");
          } catch (localF) {
            console.error("[ADT Engagement] Error in active hook:", localF);
          }
        },
      );
      engLog("[ADT Engagement] All session hooks registered successfully");
    } catch (localG) {
      console.error(
        "[ADT Engagement] Error registering session hooks:",
        localG,
      );
    }
    engLog("[ADT Engagement] Session integration complete");
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrapEngagement);
  } else {
    bootstrapEngagement();
  }
  if (
    adtData.debug_mode === "1" ||
    adtData.debug_mode === true ||
    adtData.debug === "1"
  ) {
    window.ADTEngagement = {
      status: function () {
        console.log("=== ADT Engagement Status ===");
        console.log("Metrics:", {
          "Scroll depths triggered": Array.from(window._adtScrollDepths || []),
          "Time on page (seconds)": window._adtTimeOnPage || 0,
          "Tab switches": window._adtTabSwitches || 0,
          "Scroll backs": window._adtScrollBacks || 0,
        });
        console.log(
          "Session integrated:",
          window._adtEngagementSessionIntegrated || false,
        );
      },
      getMetrics: function () {
        const maxScroll = window._adtScrollDepths
          ? Array.from(window._adtScrollDepths)
          : [];
        const maxDepth = maxScroll.length > 0 ? Math.max(...maxScroll) : 0;
        const timeOnPageSec = window._adtTimeOnPage || 0;
        const tabSwitches = window._adtTabSwitches || 0;
        const scrollBacks = window._adtScrollBacks || 0;
        let attentionScore = 0;
        attentionScore += (maxDepth / 100) * 30;
        attentionScore += Math.min(40, (timeOnPageSec / 300) * 40);
        attentionScore += Math.max(0, 20 - tabSwitches * 5);
        attentionScore += Math.min(10, scrollBacks * 5);
        return {
          maxScrollDepth: maxDepth,
          timeOnPageSeconds: timeOnPageSec,
          tabSwitches: tabSwitches,
          scrollBacks: scrollBacks,
          attentionScore: Math.round(attentionScore),
          engagementLevel:
            attentionScore >= 70 ? "high" : attentionScore >= 40 ? "medium" : "low",
        };
      },
      save: saveEngagementMetrics,
      load: loadEngagementMetrics,
    };
  }
})();
