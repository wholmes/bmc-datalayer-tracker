/*!
 * DataLayer Tracker - Debug Overlay Core
 *
 * Main initialization, event handling, and coordination
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

  window.ADTOverlayCore = {
    initialized: false,
    overlay: null,
    eventQueue: new Map(),
    firedEvents: new Set(),
    eventSet: new Set(),
    lastRenderTime: 0,
    isUnloading: false,
    config: {
      LS_KEY: "adt_overlay_open",
      POS_KEY: "adtDebugOverlayPosition",
      DOCKED_KEY: "adtDebugOverlayDocked",
      CLOSED_KEY: "adtDebugOverlayClosed",
      MAX_EVENTS: 100,
      DEDUPE_WINDOW: 1500,
    },
    init: function () {
      window.adtDebug(
        "Overlay: init called, already initialized?",
        this.initialized,
      );
      if (this.initialized) {
        window.adtDebug("Overlay: Already initialized, skipping");
        return;
      }
      if (!this.shouldInitialize()) {
        return;
      }
      if (window.ADTData?.["show_event_filters"] !== 1) {
        const filterFieldset = document.getElementById("adt-filter-fieldset");
        if (filterFieldset) {
          const legendEl = filterFieldset.querySelector("legend");
          if (legendEl) {
            legendEl.style.display = "none";
          }
          filterFieldset.querySelectorAll("label").forEach((labelEl) => {
            const inputEl = labelEl.querySelector("input");
            if (inputEl && inputEl.id !== "adt-scroll-lock") {
              labelEl.style.display = "none";
            }
          });
          filterFieldset.style.border = "none";
          filterFieldset.style.padding = "4px 6px";
        }
      }
      if (window.ADTData?.["show_event_filters"] !== 1) {
        document.body.setAttribute("data-adt-hide-filters", "true");
      }
      this.setupGlobalState();
      this.createOverlay();
      this.setupEventListeners();
      this.initializeIntegrations();
      this.hookDataLayer();
      this.restoreState();
      this.initialized = true;
      document.dispatchEvent(new CustomEvent("adtOverlayReady"));
      window.adtDebug("Overlay: core initialized");
    },
    shouldInitialize: function () {
      if (
        typeof window.adt_settings === "undefined" &&
        typeof window.ADTData === "undefined"
      ) {
        window.adtWarn("No settings found (ADTData or adt_settings)");
        return false;
      }
      const settings = window.adt_settings || window.ADTData || {};
      window.adtDebug("Overlay settings check:", {
        has_adt_settings: typeof window.adt_settings !== "undefined",
        has_ADTData: typeof window.ADTData !== "undefined",
        enable_debug_overlay: settings.enable_debug_overlay,
        overlayEnabled: settings.overlayEnabled,
        is_logged_in: settings.is_logged_in,
      });
      const overlayEnabled = !!(
        settings.enable_debug_overlay === 1 ||
        settings.enable_debug_overlay === "1" ||
        settings.enable_debug_overlay === true ||
        settings.overlayEnabled === 1 ||
        settings.overlayEnabled === "1" ||
        settings.overlayEnabled === true
      );
      const userLoggedIn =
        settings.is_logged_in === true ||
        settings.is_logged_in === 1 ||
        settings.is_logged_in === "1" ||
        document.getElementById("wpadminbar") !== null ||
        document.body.classList.contains("logged-in");
      if (!userLoggedIn) {
        window.adtWarn("🛑 Overlay suppressed – user not logged in");
        return false;
      }
      if (settings.regex_exclude) {
        const pageUrl = window.location.href;
        let shouldTrack = true;
        try {
          const excludeRegex = new RegExp(settings.regex_exclude);
          if (excludeRegex.test(pageUrl)) {
            shouldTrack = false;
            window.adtWarn(
              "ℹ️ Page excluded from tracking (regex_exclude matched):",
              pageUrl,
            );
            window.adtDebug("Overlay remains active for debugging purposes");
          }
        } catch (regexErr) {
          window.adtError(
            "Invalid regex_exclude pattern:",
            settings.regex_exclude,
            regexErr,
          );
        }
        window.ADTData = window.ADTData || {};
        window.ADTData.shouldTrackPage = shouldTrack;
      }
      if (!overlayEnabled) {
        window.adtWarn("Overlay not enabled in settings");
        window.adtDebug("Debug values:", {
          enable_debug_overlay: settings.enable_debug_overlay,
          overlayEnabled: settings.overlayEnabled,
          isOverlayEnabled: overlayEnabled,
        });
        return false;
      }
      if (document.getElementById("adt-debug-overlay")) {
        window.adtWarn("Overlay already exists");
        return false;
      }
      if (!Array.isArray(window.dataLayer)) {
        window.adtWarn("dataLayer not found");
        return false;
      }
      return true;
    },
    setupGlobalState: function () {
      window.IS_FULL_BUILD = window.adtAllFeaturesEnabled?.() ?? true;
      window.HAS_CONTENT_INTEL = !!(
        window.ADTData?.["include"]?.["contentIntelligence"] ||
        window.ADTData?.["include"]?.["content_intelligence"]
      );
      window._adtIsUnloading = false;
      window.addEventListener("beforeunload", () => {
        window._adtIsUnloading = true;
      });
      window.dataLayer = window.dataLayer || [];
      window._adtLogTrackers = window._adtLogTrackers || {};
      window._adtConversionEvents = window._adtConversionEvents || [];
    },
    createOverlay: function () {
      const overlayEl = document.createElement("div");
      overlayEl.id = "adt-debug-overlay";
      const hasSavedPosition = localStorage.getItem(this.config.POS_KEY) !== null;
      const hasDockedFlag = localStorage.getItem(this.config.DOCKED_KEY) !== null;
      if (localStorage.getItem(this.config.LS_KEY) === null) {
        localStorage.setItem(this.config.LS_KEY, "1");
      }
      if (!hasSavedPosition && !hasDockedFlag) {
        overlayEl.classList.add("docked");
        localStorage.setItem(this.config.DOCKED_KEY, "true");
      }
      const isOpen = localStorage.getItem(this.config.LS_KEY) === "1";
      if (!isOpen) {
        overlayEl.classList.add("closed");
      }
      overlayEl.innerHTML = window.ADTMarkup.createOverlayHTML();
      Object.assign(overlayEl.style, {
        position: "fixed",
        bottom: "0",
        right: "0",
        width: "320px",
        fontFamily: "sans-serif",
        zIndex: "99999",
        boxShadow: "0 0 10px rgba(0,0,0,0.5)",
        borderTopLeftRadius: "4px",
      });
      if (hasSavedPosition) {
        try {
          const { x: posX, y: posY } = JSON.parse(
            localStorage.getItem(this.config.POS_KEY),
          );
          overlayEl.style.left = posX + "px";
          overlayEl.style.top = posY + "px";
          overlayEl.style.bottom = "auto";
          overlayEl.style.right = "auto";
        } catch {
          overlayEl.classList.add("docked");
          localStorage.setItem(this.config.DOCKED_KEY, "true");
        }
      }
      document.body.appendChild(overlayEl);
      this.overlay = overlayEl;
      this.initResize();
      const footerEl = document.createElement("footer");
      footerEl.innerHTML = window.ADTMarkup.createFooterHTML();
      Object.assign(footerEl.style, {
        textAlign: "center",
        padding: "6px 0",
        background: "var(--panel)",
        borderTop: "1px solid #333",
      });
      overlayEl.appendChild(footerEl);
      this.setupPinnedContainer();
      const headerEl = overlayEl.querySelector("header");
      if (headerEl && headerEl.parentNode) {
        const consentBanner = window.ADTMarkup.createConsentBanner();
        headerEl.parentNode.insertBefore(consentBanner, headerEl.nextSibling);
      }
      this.initializeUIComponents();
    },
    initResize: function () {
      const milestone = this.overlay.querySelector(".adt-resize-handle");
      if (!milestone) {
        return;
      }
      let timerId = false;
      let intervalId = 0;
      let activeSec = 0;
      const tickCount = localStorage.getItem("adt_overlay_width");
      if (tickCount) {
        this.overlay.style.width = tickCount + "px";
      }
      milestone.addEventListener("mousedown", (saveTick) => {
        timerId = true;
        intervalId = saveTick.clientX;
        activeSec = this.overlay.offsetWidth;
        saveTick.preventDefault();
      });
      document.addEventListener("mousemove", (isActive) => {
        if (!timerId) {
          return;
        }
        const lastTick = isActive.clientX - intervalId;
        const milestones = activeSec + lastTick;
        const firedMilestones = Math.max(0x140, Math.min(0x320, milestones));
        this.overlay.style.width = firedMilestones + "px";
      });
      document.addEventListener("mouseup", () => {
        if (timerId) {
          localStorage.setItem(
            "adt_overlay_width",
            this.overlay.style.width.replace("px", ""),
          );
        }
        timerId = false;
      });
    },
    setupPinnedContainer: function () {
      const pagePath = this.overlay.querySelector("#adt-ov-body");
      const scrollHeight = this.overlay.querySelector("#adt-ov-events");
      const viewportH = document.createElement("ol");
      viewportH.id = "adt-ov-pinned";
      viewportH.setAttribute("aria-label", "Pinned Events");
      Object.assign(viewportH.style, {
        listStyle: "none",
        margin: "0 0 0px 0",
        padding: "0",
      });
      if (pagePath && scrollHeight && scrollHeight.parentElement === pagePath) {
        pagePath.insertBefore(viewportH, scrollHeight);
      } else if (pagePath) {
        pagePath.appendChild(viewportH);
      }
    },
    initializeUIComponents: function () {
      this.setupToggleButton();
      this.setupDragFunctionality();
      this.setupDockButton();
      this.setupClearButton();
      this.setupSearchBox();
      this.setupEventDropdown();
      this.setupFilters();
      this.setupDownloadButton();
      if (window.IS_PREMIUM && window.HAS_CONTENT_INTEL) {
        window.ADTMarkup.renderSDKStatus();
      }
      const scrollPct = setInterval(() => {
        if (window.ADTData?.["slug"]) {
          clearInterval(scrollPct);
          window.ADTMarkup.renderPageContext();
        }
      }, 100);
    },
    setupToggleButton: function () {
      const threshold = this.overlay.querySelector("#adt-ov-toggle");
      if (!threshold) {
        return;
      }
      threshold.addEventListener("click", (tolerance) => {
        tolerance.stopPropagation();
        const evt = !this.overlay.classList.contains("closed");
        this.overlay.classList.toggle("closed");
        localStorage.setItem(this.config.LS_KEY, evt ? "0" : "1");
      });
    },
    setupDragFunctionality: function () {
      const item = this.overlay.querySelector("header");
      if (!item) {
        return;
      }
      let key = 0;
      let err = 0;
      let idx = false;
      const len = (mode) => {
        if (
          mode.target.closest("button") ||
          mode.target.closest('span[id*="toggle"]')
        ) {
          return;
        }
        if (this.overlay.classList.contains("docked")) {
          this.overlay.classList.remove("docked");
          localStorage.removeItem(this.config.DOCKED_KEY);
        }
        idx = true;
        const typeVal = this.overlay.getBoundingClientRect();
        this.overlay.style.left = typeVal.left + "px";
        this.overlay.style.top = typeVal.top + "px";
        this.overlay.style.bottom = "auto";
        this.overlay.style.right = "auto";
        key =
          (mode.clientX || mode.touches?.[0]?.["clientX"]) -
          typeVal.left;
        err =
          (mode.clientY || mode.touches?.[0]?.["clientY"]) -
          typeVal.top;
        document.addEventListener("mousemove", nameVal);
        document.addEventListener("mouseup", opts);
        document.addEventListener("touchmove", nameVal, {
          passive: false,
        });
        document.addEventListener("touchend", opts);
      };
      const nameVal = (ref) => {
        if (!idx) {
          return;
        }
        ref.preventDefault();
        const val =
          ref.clientX || ref.touches?.[0]?.["clientX"];
        const obj =
          ref.clientY || ref.touches?.[0]?.["clientY"];
        this.overlay.style.left = val - key + "px";
        this.overlay.style.top = obj - err + "px";
      };
      const opts = () => {
        if (!idx) {
          return;
        }
        idx = false;
        if (!this.overlay.classList.contains("closed")) {
          const fn = this.overlay.getBoundingClientRect();
          localStorage.setItem(
            this.config.POS_KEY,
            JSON.stringify({
              x: fn.left,
              y: fn.top,
            }),
          );
        }
        document.removeEventListener("mousemove", nameVal);
        document.removeEventListener("mouseup", opts);
        document.removeEventListener("touchmove", nameVal);
        document.removeEventListener("touchend", opts);
      };
      item.addEventListener("mousedown", len);
      item.addEventListener("touchstart", len, {
        passive: false,
      });
    },
    setupDockButton: function () {
      const arg = this.overlay.querySelector("footer");
      if (!arg) {
        return;
      }
      const tmp = document.createElement("button");
      tmp.textContent = "⇲";
      tmp.title = "Dock overlay to bottom-right";
      tmp.style.cssText =
        "\n        background: transparent;\n        border: none;\n        color: #888;\n        font-size: 14px;\n        cursor: pointer;\n        margin-left: 6px;\n        padding: 2px 4px;\n        opacity: 0.8;\n        transition: opacity 0.2s ease, color 0.2s ease;\n      ";
      tmp.addEventListener("click", (node) => {
        node.stopPropagation();
        localStorage.removeItem(this.config.POS_KEY);
        this.overlay.classList.add("docked");
        localStorage.setItem(this.config.DOCKED_KEY, "true");
        this.overlay.style.bottom = "";
        this.overlay.style.right = "16px";
        this.overlay.style.left = "auto";
        this.overlay.style.top = "";
      });
      arg.querySelector("a")?.["after"](tmp);
    },
    setupClearButton: function () {
      const list = document.getElementById("adt-clear-events");
      if (!list) {
        return;
      }
      list.addEventListener("click", () => {
        const entry = document.getElementById("adt-ov-events");
        if (entry) {
          entry.innerHTML = "";
        }
      });
    },
    setupSearchBox: function () {
      const state = document.getElementById("adt-search");
      if (!state) {
        return;
      }
      state.addEventListener("input", () => {
        const ctx = state.value.trim().toLowerCase();
        const data = document.getElementById("adt-ov-events");
        if (!data) {
          return;
        }
        data.querySelectorAll("li").forEach((row) => {
          const col = row.textContent.toLowerCase();
          row.style.display = col.includes(ctx) ? "" : "none";
        });
      });
    },
    setupEventDropdown: function () {
      const mapVal = document.getElementById("adt-event-dropdown");
      if (!mapVal) {
        return;
      }
      mapVal.addEventListener("change", () => {
        const setVal = mapVal.value;
        const buf = document.getElementById("adt-ov-events");
        if (!buf) {
          return;
        }
        buf.querySelectorAll("li").forEach((raw) => {
          raw.style.display =
            !setVal ||
            raw.querySelector("code")?.["textContent"] === setVal
              ? ""
              : "none";
        });
      });
    },
    setupFilters: function () {
      if (window.ADTData?.["show_event_filters"] !== 1) {
        return;
      }
      const parsed = ["ecom", "form", "intent", "engagement", "other"];
      parsed.forEach((text) => {
        const html = document.getElementById("filter-" + text);
        if (!html) {
          return;
        }
        const cmpName = localStorage.getItem("adt_filter_" + text);
        if (cmpName !== null) {
          html.checked = cmpName === "1";
        }
        html.addEventListener("change", () => {
          localStorage.setItem(
            "adt_filter_" + text,
            html.checked ? "1" : "0",
          );
          this.applyFiltersToExistingEvents();
        });
      });
      this.applyFiltersToExistingEvents();
    },
    applyFiltersToExistingEvents: function () {
      const handler = document.getElementById("adt-ov-events");
      if (!handler) {
        return;
      }
      handler.querySelectorAll("li").forEach((callback) => {
        if (!callback.querySelector("code")) {
          return;
        }
        if (this.passesFilters(callback, {})) {
          callback.style.display = "";
        } else {
          callback.style.display = "none";
        }
      });
    },
    setupDownloadButton: function () {
      const response = document.getElementById("adt-download-pinned");
      if (!response) {
        return;
      }
      response.addEventListener("click", (request) => {
        request.stopPropagation();
        const fields = JSON.parse(
          localStorage.getItem("adt_pinned_events") || "{}",
        );
        const formId = Object.values(fields);
        const fieldId = new Blob([JSON.stringify(formId, null, 0x2)], {
          type: "application/json",
        });
        const cartAdds = URL.createObjectURL(fieldId);
        const cartRemoves = document.createElement("a");
        cartRemoves.href = cartAdds;
        cartRemoves.download = "adt-pinned-events.json";
        document.body.appendChild(cartRemoves);
        cartRemoves.click();
        document.body.removeChild(cartRemoves);
        URL.revokeObjectURL(cartAdds);
      });
    },
    hookDataLayer: function () {
      if (this._dataLayerHooked) {
        window.adtDebug("Overlay: dataLayer already hooked, skipping");
        return;
      }
      this._dataLayerHooked = true;
      window.adtDebug(
        "Overlay: Listening for dataLayer events via custom event",
      );
      const sessionInfo = this;
      window.addEventListener("adt_datalayer_push", (hookData) => {
        sessionInfo.renderEvent(hookData.detail);
      });
      if (window.dataLayer && Array.isArray(window.dataLayer)) {
        window.dataLayer.forEach((pixelEvt) => {
          if (pixelEvt && typeof pixelEvt === "object" && pixelEvt.event) {
            this.renderEvent(pixelEvt);
          }
        });
      }
      window.adtDebug("Overlay: Event listener installed");
    },
    renderEvent: function (overlayEvt) {
      const filterEvt =
        overlayEvt["gtm.uniqueEventId"] || overlayEvt.timestamp || Date.now();
      const searchParams = overlayEvt.event + "_" + filterEvt;
      if (this.firedEvents.has(searchParams)) {
        window.adtDebug(
          "Overlay: Skipping duplicate event:",
          overlayEvt.event,
          searchParams,
        );
        return;
      }
      this.firedEvents.add(searchParams);
      if (this.firedEvents.size > 200) {
        const clickId = Array.from(this.firedEvents);
        clickId
          .slice(0, 100)
          .forEach((utmData) => this.firedEvents["delete"](utmData));
      }
      const cookieVal =
        typeof window.hasConsent === "function"
          ? window.hasConsent("analytics")
          : true;
      const cookieKey = window.ADTData?.["show_blocked_events_overlay"] === 1;
      window.adtDebug(
        "Overlay:",
        overlayEvt.event,
        "| hasConsent:",
        cookieVal,
        "| showBlocked:",
        cookieKey,
        "| will skip?",
        !cookieVal && !cookieKey,
      );
      if (!cookieVal && !cookieKey) {
        window.adtDebug("Overlay: Event hidden (no consent):", overlayEvt.event);
        return;
      }
      if (!this.shouldRenderEvent(overlayEvt)) {
        return;
      }
      if (window._adtIsUnloading) {
        return;
      }
      const consentRaw = document.getElementById("adt-ov-events");
      const consentObj = document.getElementById("adt-ov-body");
      if (!consentRaw || !consentObj) {
        return;
      }
      if (overlayEvt?.["element"]?.["id"]?.["includes"]("adt-debug-overlay")) {
        return;
      }
      const prevConsent = this.createEventListItem(overlayEvt);
      if (!prevConsent) {
        return;
      }
      if (!cookieVal) {
        prevConsent.classList.add("blocked-event");
        prevConsent.style.opacity = "0.5";
        prevConsent.style.background =
          "linear-gradient(90deg, rgba(255,0,0,0.05) 0%, rgba(255,0,0,0.1) 100%)";
        const now = prevConsent.querySelector("code");
        if (now) {
          const last = now.textContent;
          now.innerHTML =
            last +
            ' <span style="color:#ff4444;font-size:11px;" title="Blocked - no consent">🚫</span>';
        }
      }
      if (!this.passesFilters(prevConsent, overlayEvt)) {
        return;
      }
      this.addTimeSeparatorIfNeeded(consentRaw);
      consentRaw.prepend(prevConsent);
      const diff = document.getElementById("adt-scroll-lock");
      if (!diff?.["checked"]) {
        consentObj.scrollTop = consentObj.scrollHeight;
      }
      while (consentRaw.children.length > this.config.MAX_EVENTS) {
        consentRaw.removeChild(consentRaw.lastChild);
      }
      this.addEventToDropdown(overlayEvt.event);
      if (
        cookieVal &&
        (overlayEvt.event === "intentScore" ||
          overlayEvt.event === "session_profile")
      ) {
        if (typeof window.updateIntent === "function") {
          window.updateIntent();
        }
      }
    },
    shouldRenderEvent: function (found) {
      if (
        !found ||
        typeof found !== "object" ||
        typeof found.event !== "string"
      ) {
        return false;
      }
      if (
        Array.isArray(found) &&
        ["config", "set", "js"].includes(found[0])
      ) {
        return false;
      }
      const detected = [
        "view_item_list",
        "view_item",
        "add_to_cart",
        "remove_from_cart",
        "cart_update",
        "view_cart",
        "begin_checkout",
        "checkout_progress",
        "purchase",
      ];
      return true;
    },
    createEventListItem: function (evt) {
      const li = document.createElement("li");
      const eventLabel = evt.event || "anonymous";
      const isEcom = !!evt.ecommerce;
      const isForm =
        eventLabel.startsWith("form_") || eventLabel === "form_submit";
      const isEngagement = [
        "scroll_depth",
        "time_on_page",
        "active_time",
      ].includes(eventLabel);
      const isCustom = ![
        "page_view",
        "form_submit",
        "scroll_depth",
        "time_on_page",
        "active_time",
        "add_to_cart",
        "purchase",
      ].includes(eventLabel);
      if (isEcom) {
        li.classList.add("ecom");
      }
      if (isForm) {
        li.classList.add("form");
      }
      if (isEngagement) {
        li.classList.add("engagement");
      }
      if (isCustom) {
        li.classList.add("custom");
      }
      const timeLabel = new Date().toLocaleTimeString();
      li.innerHTML =
        '<span class="ts">' +
        timeLabel +
        "</span><code>" +
        eventLabel +
        "</code>";
      if (evt._simulated) {
        const codeEl = li.querySelector("code");
        if (codeEl) {
          codeEl.innerHTML =
            eventLabel +
            ' <span style="font-size:10px;opacity:0.7;" title="Simulated Event">👻</span>';
        }
      }
      if (evt.formVendor) {
        li.title = "Vendor: " + evt.formVendor;
      }
      if (isEcom) {
        const ecom = evt.ecommerce || {};
        const itemCount = Array.isArray(ecom.items) ? ecom.items.length : 0;
        const unitCount = Array.isArray(ecom.items)
          ? ecom.items.reduce(
              (sum, item) => sum + (item.quantity || 0),
              0,
            )
          : 0;
        const ecomValue = ecom.value || 0;
        const currency = ecom.currency || "USD";
        let ecomSummary =
          unitCount > itemCount
            ? "items: " + itemCount + " (" + unitCount + " units)"
            : "items: " + itemCount;
        if (ecomValue > 0) {
          ecomSummary += " | " + currency + " " + ecomValue.toFixed(2);
        }
        if (evt.event === "purchase" && ecom.transaction_id) {
          ecomSummary += " | #" + ecom.transaction_id;
        }
        li.innerHTML += "<br><small>" + ecomSummary + "</small>";
        if (ecom.items?.[0]?.["item_name"]) {
          li.innerHTML +=
            '<br><small style="opacity:0.7">' +
            ecom.items[0].item_name +
            "</small>";
        }
      }
      this.addEventButtons(li, evt);
      const jsonPre = document.createElement("pre");
      jsonPre.textContent = JSON.stringify(evt, null, 2);
      jsonPre.style.display = ["purchase", "session_profile"].includes(
        eventLabel,
      )
        ? "block"
        : "none";
      li.appendChild(jsonPre);
      li.addEventListener("click", () => {
        jsonPre.style.display =
          jsonPre.style.display === "none" ? "block" : "none";
      });
      if (window.ADTMarkup?.["enhanceCheckoutDisplay"]) {
        window.ADTMarkup.enhanceCheckoutDisplay(li, evt);
      }
      return li;
    },
    addEventButtons: function (listItem, eventPayload) {
      const pinBtn = document.createElement("span");
      pinBtn.title = "Pin this event";
      pinBtn.innerHTML =
        '\n        <svg viewBox="0 0 24 24" width="12" height="12" fill="white"\n             xmlns="http://www.w3.org/2000/svg">\n          <path d="M12 2L14.9 8.6L22 9.2L17 14.1L18.4 21.1L12 17.8L5.6 21.1L7 14.1L2 9.2L9.1 8.6L12 2Z"\n                stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>\n        </svg>\n      ';
      Object.assign(pinBtn.style, {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "20px",
        height: "20px",
        background: "black",
        borderRadius: "4px",
        cursor: "pointer",
        float: "right",
        opacity: "0.6",
        marginLeft: "6px",
      });
      pinBtn.addEventListener("click", (pinClick) => {
        pinClick.stopPropagation();
        this.togglePinEvent(listItem, eventPayload);
      });
      listItem.appendChild(pinBtn);
      const copyBtn = document.createElement("span");
      copyBtn.title = "Copy JSON to clipboard";
      copyBtn.innerHTML =
        '\n        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"\n             xmlns="http://www.w3.org/2000/svg">\n          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="white" stroke-width="2" fill="none"/>\n          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="white" stroke-width="2" fill="none"/>\n        </svg>\n      ';
      Object.assign(copyBtn.style, {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "20px",
        height: "20px",
        background: "black",
        borderRadius: "4px",
        cursor: "pointer",
        float: "right",
        opacity: "0.6",
        marginLeft: "6px",
        transition: "opacity 0.2s",
      });
      copyBtn.addEventListener("click", (copyClick) => {
        copyClick.stopPropagation();
        this.copyEventJSON(copyBtn, eventPayload);
      });
      listItem.appendChild(copyBtn);
      const noteBtn = document.createElement("button");
      noteBtn.title = "Add Note";
      noteBtn.innerHTML =
        '\n        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"\n             xmlns="http://www.w3.org/2000/svg">\n          <path d="M12 20h9" stroke="white" stroke-width="2" stroke-linecap="round"/>\n          <path d="M16.5 3.5l4 4L9 19H5v-4L16.5 3.5z"\n                stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>\n        </svg>\n      ';
      Object.assign(noteBtn.style, {
        background: "transparent",
        border: "none",
        padding: "4px",
        borderRadius: "4px",
        cursor: "pointer",
        marginLeft: "6px",
      });
      const noteKey = eventPayload._pinKey || JSON.stringify(eventPayload);
      noteBtn.addEventListener("click", (noteClick) => {
        noteClick.stopPropagation();
        const existingNote = localStorage.getItem("adt_note_" + noteKey) || "";
        const noteText = prompt("Enter note:", existingNote);
        if (noteText !== null) {
          localStorage.setItem("adt_note_" + noteKey, noteText);
          const noteEl = listItem.querySelector(".note-text");
          if (noteEl) {
            noteEl.textContent = noteText;
          }
        }
      });
      listItem.appendChild(noteBtn);
      const noteDiv = document.createElement("div");
      noteDiv.className = "note-text";
      Object.assign(noteDiv.style, {
        fontSize: "10px",
        marginTop: "4px",
        fontStyle: "italic",
        color: "#ccc",
      });
      noteDiv.textContent = localStorage.getItem("adt_note_" + noteKey) || "";
      listItem.appendChild(noteDiv);
    },
    togglePinEvent: function (listItem, eventPayload) {
      const pinnedList = document.getElementById("adt-ov-pinned");
      if (!pinnedList) {
        return;
      }
      const inPinned = listItem.closest("#adt-ov-pinned");
      let pinnedStore = {};
      try {
        pinnedStore = JSON.parse(
          localStorage.getItem("adt_pinned_events") || "{}",
        );
      } catch (parseErr) {}
      if (inPinned) {
        const pinKey = eventPayload._pinKey;
        listItem.remove();
        if (pinKey) {
          delete pinnedStore[pinKey];
          localStorage.setItem("adt_pinned_events", JSON.stringify(pinnedStore));
        }
      } else {
        const pinKey =
          eventPayload.event +
          "_" +
          (eventPayload.vendorId ||
            eventPayload.formId ||
            eventPayload.timestamp ||
            Math.random());
        eventPayload._pinKey = pinKey;
        pinnedList.prepend(listItem);
        pinnedStore[pinKey] = eventPayload;
        localStorage.setItem("adt_pinned_events", JSON.stringify(pinnedStore));
      }
    },
    copyEventJSON: function (copyBtn, eventPayload) {
      try {
        const jsonText = JSON.stringify(eventPayload, null, 2);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard
            .writeText(jsonText)
            .then(() => {
              this.showCopyFeedback(copyBtn, true);
            })
            ["catch"](() => {
              this.fallbackCopy(jsonText, copyBtn);
            });
        } else {
          this.fallbackCopy(jsonText, copyBtn);
        }
      } catch (copyErr) {
        window.adtError("Failed to copy JSON:", copyErr);
        this.showCopyFeedback(copyBtn, false);
      }
    },
    fallbackCopy: function (text, copyBtn) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        const ok = document.execCommand("copy");
        this.showCopyFeedback(copyBtn, ok);
      } catch (copyErr) {
        window.adtError("Fallback copy failed:", copyErr);
        this.showCopyFeedback(copyBtn, false);
      } finally {
        document.body.removeChild(textarea);
      }
    },
    showCopyFeedback: function (copyBtn, success) {
      const prevHtml = copyBtn.innerHTML;
      const prevOpacity = copyBtn.style.opacity;
      if (success) {
        copyBtn.innerHTML =
          '\n          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"\n               xmlns="http://www.w3.org/2000/svg">\n            <path d="M20 6L9 17L4 12" stroke="#4ade80" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>\n          </svg>\n        ';
        copyBtn.style.opacity = "1";
        copyBtn.style.background = "#16a34a";
      } else {
        copyBtn.innerHTML =
          '\n          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"\n               xmlns="http://www.w3.org/2000/svg">\n            <path d="M18 6L6 18M6 6L18 18" stroke="#ef4444" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>\n          </svg>\n        ';
        copyBtn.style.opacity = "1";
        copyBtn.style.background = "#dc2626";
      }
      setTimeout(() => {
        copyBtn.innerHTML = prevHtml;
        copyBtn.style.opacity = prevOpacity;
        copyBtn.style.background = "black";
      }, 1500);
    },
    passesFilters: function (listItem) {
      const showEcom = document.getElementById("filter-ecom")?.["checked"];
      const showForm = document.getElementById("filter-form")?.["checked"];
      const showIntent = document.getElementById("filter-intent")?.["checked"];
      const showEngagement =
        document.getElementById("filter-engagement")?.["checked"];
      const showOther = document.getElementById("filter-other")?.["checked"];
      const isEcom = listItem.classList.contains("ecom");
      const isForm = listItem.classList.contains("form");
      const isIntent = listItem.classList.contains("intent");
      const isEngagement = listItem.classList.contains("engagement");
      if (
        (isEcom && !showEcom) ||
        (isForm && !showForm) ||
        (isIntent && !showIntent) ||
        (isEngagement && !showEngagement) ||
        (!isEcom && !isForm && !isIntent && !isEngagement && !showOther)
      ) {
        return false;
      }
      return true;
    },
    addTimeSeparatorIfNeeded: function (eventsList) {
      const now = Date.now();
      const gapMs = now - this.lastRenderTime;
      if (gapMs > 10000) {
        const separator = document.createElement("li");
        separator.textContent =
          "──── " + Math.round(gapMs / 1000) + "s later ────";
        separator.style.opacity = "0.4";
        separator.style.fontSize = "10px";
        separator.style.textAlign = "center";
        eventsList.prepend(separator);
      }
      this.lastRenderTime = now;
    },
    addEventToDropdown: function (eventName) {
      if (!eventName || this.eventSet.has(eventName)) {
        return;
      }
      this.eventSet.add(eventName);
      const dropdown = document.getElementById("adt-event-dropdown");
      if (!dropdown) {
        return;
      }
      const option = document.createElement("option");
      option.value = eventName;
      option.textContent = eventName;
      dropdown.appendChild(option);
    },
    restoreState: function () {
      try {
        const rawPinned = localStorage.getItem("adt_pinned_events");
        let pinnedStore = {};
        if (rawPinned) {
          const parsed = JSON.parse(rawPinned);
          if (Array.isArray(parsed)) {
            parsed.forEach((evt) => {
              if (evt && typeof evt === "object") {
                const pinKey = evt._pinKey || evt.event + "_" + Math.random();
                evt._pinKey = pinKey;
                pinnedStore[pinKey] = evt;
              }
            });
            localStorage.setItem(
              "adt_pinned_events",
              JSON.stringify(pinnedStore),
            );
          } else if (parsed && typeof parsed === "object") {
            pinnedStore = parsed;
          }
        }
        Object.entries(pinnedStore).forEach(([pinKey, evt]) => {
          if (evt && typeof evt === "object") {
            evt._pinKey = pinKey;
            this.renderPinnedEvent(evt);
          }
        });
      } catch (loadErr) {
        if (window.ADTData?.["debug"]) {
          console.warn("[ADT] Failed to load pinned events:", loadErr);
        }
      }
    },
    renderPinnedEvent: function (evt) {
      const pinnedList = document.getElementById("adt-ov-pinned");
      if (!pinnedList) {
        return;
      }
      const listItem = this.createEventListItem(evt);
      if (listItem) {
        listItem.classList.add("pinned");
        listItem.style.opacity = "0.95";
        pinnedList.prepend(listItem);
      }
    },
    initializeIntegrations: function () {
      if (typeof window.updateDualPixelIndicator === "function") {
        setTimeout(() => window.updateDualPixelIndicator(), 200);
      }
      this.initializeFormVendorDetection();
      if (window.ADTSession) {
        this.initializeSessionIntegration();
      }
    },
    initializeFormVendorDetection: function () {
      const vendorDetectors = {
        hubspot: () =>
          !!document.querySelector(
            'form.hs-form, form[action*="hubspot"], div[class*="hs-form"]',
          ),
        marketo: () =>
          !!document.querySelector(
            'form[data-marketo-form-id], form[id^="mktoForm_"]',
          ),
        gravityforms: () =>
          !!document.querySelector('form.gform_wrapper, form[id^="gform_"]'),
        mailchimp: () =>
          !!document.querySelector('form[action*="list-manage.com"]'),
      };
      const logDetectedVendors = () => {
        const detected = Object.entries(vendorDetectors)
          .filter(([vendorId, detectFn]) => {
            try {
              return detectFn();
            } catch (detectErr) {
              return false;
            }
          })
          .map(([vendorId]) => vendorId);
        if (detected.length && window.ADTData?.["debug"]) {
          window.adtDebug("[ADT-Overlay] Detected form vendors:", detected);
        }
      };
      window.addEventListener("load", () => {
        logDetectedVendors();
        setTimeout(logDetectedVendors, 1000);
      });
    },
    initializeSessionIntegration: function () {},
    setupEventListeners: function () {
      window.addEventListener("adt_consent_loaded", () => {
        if (
          this.initialized &&
          typeof this.updateConsentBanner === "function"
        ) {
          this.updateConsentBanner();
        }
      });
      window.addEventListener("adt_consent_revoked", () => {
        if (
          this.initialized &&
          typeof this.updateConsentBanner === "function"
        ) {
          this.updateConsentBanner();
        }
      });
      document.addEventListener("adtSettingUpdated", (settingEvt) => {
        const settingKey = settingEvt.detail?.["key"];
        if (settingKey === "dual_pixel_mode") {
          if (typeof window.updateDualPixelIndicator === "function") {
            window.updateDualPixelIndicator();
          }
        }
      });
      this.observePixelReadiness();
    },
    updateConsentBanner: function () {
      const banner = document.getElementById("adt-blocked-banner");
      if (!banner) {
        return;
      }
      const analyticsOk =
        typeof window.hasConsent === "function"
          ? window.hasConsent("analytics")
          : true;
      banner.classList.toggle("adt-hidden", analyticsOk);
      window.adtDebug("Overlay: Banner updated - hasConsent:", analyticsOk);
    },
    observePixelReadiness: function () {
      if (typeof window.getPixelReadinessStatus !== "function") {
        return;
      }
      let lastStatus = window.getPixelReadinessStatus();
      let pollCount = 0;
      const pollPixels = () => {
        const status = window.getPixelReadinessStatus();
        pollCount++;
        const changed =
          status.metaReady !== lastStatus.metaReady ||
          status.tiktokReady !== lastStatus.tiktokReady ||
          status.anyPixelReady !== lastStatus.anyPixelReady;
        if (changed || pollCount === 1) {
          if (typeof window.updateDualPixelIndicator === "function") {
            window.updateDualPixelIndicator();
          }
          lastStatus = status;
        }
        if (!status.anyPixelReady && pollCount < 20) {
          setTimeout(pollPixels, 500);
        }
      };
      pollPixels();
    },
  };
  function bootstrapOverlay(retryCount = 0) {
    if (typeof window.hasConsent !== "function") {
      if (retryCount < 10) {
        setTimeout(() => bootstrapOverlay(retryCount + 1), 100);
      }
      return;
    }
    window.ADTOverlayCore.init();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrapOverlay);
  } else {
    bootstrapOverlay();
  }
  window.ADTDebugOverlay = Object.assign(window.ADTDebugOverlay || {}, {
    init: () => window.ADTOverlayCore.init(),
    recheckPixelStatus: () => {
      if (typeof window.updateDualPixelIndicator === "function") {
        window.updateDualPixelIndicator();
      }
    },
  });
})();
