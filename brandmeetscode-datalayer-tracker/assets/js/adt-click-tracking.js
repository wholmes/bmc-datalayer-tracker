/*!
 * DataLayer Tracker - Click Tracking
 * 
 * Professional-grade click tracking with intelligent classification
 * 
 * Features:
 * - External/Internal link detection
 * - Download tracking with file type detection
 * - Outbound link classification
 * - Navigation intent detection
 * - Click context analysis
 * - Comprehensive filtering rules
 * - Deduplication
 * - Session integration
 * 
 * @preserve
 * @package    DataLayer_Tracker
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @version    1.0.0
 * @since      1.0.0
 */
(function () {
  'use strict';

  if (window._adtClickTrackerInitialized) {
    window.adtDebug("Click Tracker: Already initialized, skipping...");
    return;
  }
  window._adtClickTrackerInitialized = true;
  if (window.ADTData?.["track_default_clicks"] === 0) {
    window.adtDebug("Click Tracker: Disabled via settings");
    return;
  }
  const adtData = window.adtDebug || function () {};
  adtData("Click Tracker: Initializing...");
  window._adtSessionClicks = window._adtSessionClicks || 0;
  function saveSessionClickCount() {
    try {
      sessionStorage.setItem('adt_session_clicks', window._adtSessionClicks.toString());
    } catch (payload) {
      adtData("Click Tracker: Failed to save click count (storage quota or disabled)");
    }
  }
  function eventName() {
    try {
      const detail = sessionStorage.getItem('adt_session_clicks');
      if (detail) {
        window._adtSessionClicks = parseInt(detail, 10) || 0;
        adtData("Click Tracker: Restored session clicks:", window._adtSessionClicks);
      }
    } catch (element) {
      adtData("Click Tracker: Could not restore click count, starting fresh");
    }
  }
  eventName();
  const target = {
    'dedupWindow': 500,
    'maxTextLength': 0x96,
    'downloadExtensions': ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", 'odt', "ods", "odp", "zip", "rar", '7z', "tar", 'gz', "bz2", "mp3", "mp4", "avi", "mov", "wmv", "flv", "wav", "m4a", "psd", 'ai', "eps", "svg", 'tiff', 'raw', 'csv', "json", 'xml', "sql", 'dmg', "exe", "apk", "ipa"],
    'partnerDomains': [],
    'socialDomains': ["facebook.com", "twitter.com", "x.com", 'linkedin.com', 'instagram.com', "youtube.com", "pinterest.com", 'tiktok.com', "snapchat.com", "reddit.com", 'medium.com', "tumblr.com", "whatsapp.com", "telegram.org"],
    'excludeSelectors': ['#wpadminbar', "#adt-debug-overlay", ".adt-no-track", '[data-adt-no-track]', ".wp-block-navigation"],
    'trackNavigation': true,
    'trackPagination': true,
    'trackFormButtons': false
  };
  const result = new Map();
  const value = {
    'total': 0,
    'tracked': window._adtSessionClicks || 0,
    'filtered': 0,
    'deduped': 0
  };
  function flag(enabled) {
    try {
      const url = new URL(enabled, window.location.origin);
      return url.hostname.replace(/^www\./, '');
    } catch (pattern) {
      return '';
    }
  }
  function regex(depth) {
    if (!depth || depth.startsWith('#') || depth.startsWith("javascript:") || depth.startsWith("mailto:") || depth.startsWith("tel:")) {
      return false;
    }
    const percent = flag(depth);
    const scrollY = window.location.hostname.replace(/^www\./, '');
    return percent && percent !== scrollY;
  }
  function scrollTop(pageKey) {
    try {
      const firedSet = new URL(pageKey, window.location.origin);
      const milestone = firedSet.pathname;
      const timerId = milestone.match(/\.([a-zA-Z0-9]+)$/);
      return timerId ? timerId[1].toLowerCase() : null;
    } catch (intervalId) {
      return null;
    }
  }
  function activeSec(tickCount) {
    const saveTick = scrollTop(tickCount);
    return saveTick && target.downloadExtensions.includes(saveTick);
  }
  function isActive(lastTick, milestones) {
    if (!lastTick || lastTick.startsWith('#')) {
      return "anchor";
    }
    if (lastTick.startsWith("mailto:")) {
      return 'email';
    }
    if (lastTick.startsWith("tel:")) {
      return 'phone';
    }
    if (activeSec(lastTick)) {
      return "download";
    }
    if (regex(lastTick)) {
      const firedMilestones = flag(lastTick);
      if (target.socialDomains.some(pagePath => firedMilestones.includes(pagePath))) {
        return "social";
      }
      if (target.partnerDomains.some(scrollHeight => firedMilestones.includes(scrollHeight))) {
        return "partner";
      }
      return 'external';
    }
    return "internal";
  }
  function viewportH(scrollPct) {
    if (scrollPct.closest("nav") || scrollPct.closest("[role=\"navigation\"]") || scrollPct.closest(".menu")) {
      return "navigation";
    }
    if (scrollPct.closest(".pagination") || scrollPct.closest(".wp-pagenavi") || scrollPct.matches(".page-numbers")) {
      return "pagination";
    }
    if (scrollPct.closest(".breadcrumb") || scrollPct.closest("[aria-label*=\"breadcrumb\"]")) {
      return "breadcrumb";
    }
    if (scrollPct.closest('footer') || scrollPct.closest("[role=\"contentinfo\"]")) {
      return 'footer';
    }
    if (scrollPct.closest("aside") || scrollPct.closest(".sidebar") || scrollPct.closest(".widget")) {
      return "sidebar";
    }
    if (scrollPct.closest("main") || scrollPct.closest("[role=\"main\"]") || scrollPct.closest('article')) {
      return 'content';
    }
    if (scrollPct.closest("header") || scrollPct.closest("[role=\"banner\"]")) {
      return "header";
    }
    return "unknown";
  }
  function threshold(tolerance) {
    const evt = tolerance.className.toLowerCase();
    const item = key(tolerance).toLowerCase();
    if (evt.includes("cta") || evt.includes("primary") || evt.includes("btn-primary")) {
      return 'primary_cta';
    }
    if (evt.includes("secondary") || evt.includes("btn-secondary")) {
      return "secondary_cta";
    }
    if (item.includes("buy") || item.includes("purchase") || item.includes("add to cart")) {
      return "purchase";
    }
    if (item.includes("sign up") || item.includes("register") || item.includes("join")) {
      return "signup";
    }
    if (item.includes("login") || item.includes("sign in")) {
      return "login";
    }
    if (item.includes("download")) {
      return 'download';
    }
    if (item.includes("subscribe")) {
      return "subscribe";
    }
    if (item.includes('contact') || item.includes("get in touch")) {
      return "contact";
    }
    if (item.includes("learn more") || item.includes("read more")) {
      return "learn_more";
    }
    return "button";
  }
  function key(err) {
    let idx = err.innerText?.["trim"]() || err.textContent?.["trim"]() || err.value?.["trim"]() || err.getAttribute("aria-label") || err.getAttribute("title") || err.alt || '';
    if (!idx) {
      const len = err.querySelector("img");
      if (len) {
        idx = len.alt || len.title || '';
      }
    }
    if (!idx) {
      const mode = err.querySelector("[class*=\"icon\"]");
      if (mode) {
        idx = "[icon]";
      }
    }
    if (idx.length > 0x96) {
      idx = idx.substring(0, 0x96) + "...";
    }
    return idx;
  }
  function typeVal(nameVal) {
    for (const opts of target.excludeSelectors) {
      if (nameVal.matches(opts) || nameVal.closest(opts)) {
        adtData("Click excluded by selector:", opts);
        return true;
      }
    }
    if (true && nameVal.closest("form")) {
      adtData("Click excluded: form button");
      return true;
    }
    return false;
  }
  function ref(val) {
    const obj = val.tagName?.['toLowerCase']();
    if (obj === 'a') {
      return true;
    }
    if (obj === "button") {
      return true;
    }
    if (obj === "input") {
      const fn = val.getAttribute("type")?.["toLowerCase"]();
      return ["button", "submit"].includes(fn);
    }
    if (val.getAttribute('role') === "button") {
      return true;
    }
    return false;
  }
  function arg(tmp) {
    const node = Date.now();
    const list = result.get(tmp);
    if (list && node - list < 500) {
      return true;
    }
    result.set(tmp, node);
    if (result.size > 100) {
      const entry = node - 500;
      for (const [state, ctx] of result.entries()) {
        if (ctx < entry) {
          result["delete"](state);
        }
      }
    }
    return false;
  }
  function data(row) {
    const col = row.target;
    if (!ref(col)) {
      return;
    }
    if (typeVal(col)) {
      return;
    }
    const mapVal = key(col);
    const setVal = col.href || col.getAttribute('data-href') || col.closest('a')?.["href"] || '';
    const buf = col.className || '';
    const raw = col.id || '';
    const parsed = col.tagName?.["toLowerCase"]();
    const text = (setVal || "no-url") + '_' + (mapVal || "no-text") + '_' + col.className;
    if (arg(text)) {
      adtData("Click deduped:", mapVal || setVal);
      return;
    }
    const html = isActive(setVal, col);
    const cmpName = viewportH(col);
    const handler = parsed === "button" ? threshold(col) : null;
    const callback = {
      'event': "default_click",
      'element_text': mapVal,
      'element_url': setVal,
      'element_class': buf,
      'element_id': raw,
      'element_type': parsed,
      'link_type': html,
      'navigation_context': cmpName,
      'is_external': html === "external" || html === "social" || html === "partner",
      'is_download': html === 'download',
      'timestamp': new Date().toISOString()
    };
    if (handler) {
      callback.button_context = handler;
    }
    if (html === "download") {
      callback.file_extension = scrollTop(setVal);
    }
    if (callback.is_external) {
      callback.external_domain = flag(setVal);
    }
    if (window.ADTSession?.['id']) {
      callback.session_id = window.ADTSession.id();
      callback.session_number = window.ADTSession.number();
    }
    callback.page_url = window.location.href;
    callback.page_path = window.location.pathname;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(callback);
    value.tracked++;
    window._adtSessionClicks++;
    saveSessionClickCount();
    adtData("Click tracked:", {
      'text': mapVal,
      'url': setVal,
      'type': html,
      'context': cmpName,
      'sessionClicks': window._adtSessionClicks
    });
  }
  function response() {
    if (!window.ADTSession || typeof window.ADTSession.registerHook !== 'function') {
      return;
    }
    window.ADTSession.registerHook("onExit", 'clicks', function (request) {
      return {
        'total_clicks': window._adtSessionClicks
      };
    });
    adtData("Click Tracker: Session integration complete");
    adtData("Click Tracker: Session will report", window._adtSessionClicks, "total clicks");
  }
  function fields() {
    document.addEventListener("click", data, true);
    if (window._adtSessionInitialized) {
      response();
    } else {
      const formId = setInterval(() => {
        if (window._adtSessionInitialized) {
          clearInterval(formId);
          response();
        }
      }, 500);
      setTimeout(() => clearInterval(formId), 0x2710);
    }
    adtData("Click Tracker: Initialized successfully");
    if (window.ADTData?.["debug_mode"] === '1') {
      window.ADTClickTracker = {
        'getStats': () => value,
        'getRecentClicks': () => Array.from(result.entries()),
        'config': target
      };
      adtData("Click Tracker: Debug API available at window.ADTClickTracker");
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener('DOMContentLoaded', fields);
  } else {
    fields();
  }
})();