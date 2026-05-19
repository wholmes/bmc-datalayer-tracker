/*!
 * DataLayer Tracker - Session Manager
 *
 * Manages session lifecycle with server-side validation
 *
 * @preserve
 * @package    DataLayer_Tracker
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @version    2.1.0
 * @since      1.0.0
 */
(function () {
  "use strict";

  window.adtDebugLog =
    window.adtDebugLog ||
    function (...adtData) {
      if (window.ADTData?.["debug_mode"]) {
        console.log(...adtData);
      }
    };
  window.adtDebugLog(
    "[ADT Session] Module loading, features enabled:",
    window.adtAllFeaturesEnabled
      ? window.adtAllFeaturesEnabled()
      : "function not found",
  );
  const config = {
    id: () => null,
    tabId: () => null,
    number: () => 0,
    registerHook: () => {},
    getActiveTime: () => 0,
    isIdle: () => false,
    _isStub: true,
  };
  if (window.adtAllFeaturesEnabled && !window.adtAllFeaturesEnabled()) {
    window.adtDebugLog("[ADT Session] Features disabled, returning stub");
    window.ADTSession = config;
    return;
  }
  window.adtDebugLog("[ADT Session] Initializing session manager");

  function normalizeSessionId(sessionId) {
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
        /* use raw string */
      }
    }
    return trimmed;
  }

  window.adtNormalizeSessionId = normalizeSessionId;

  const payload = {
    config: {
      sessionKey: "adt_session_id",
      startedKey: "adt_session_started",
      tabKey: "adt_tab_id",
      numberKey: "adt_session_number",
      yearKey: "adt_session_year",
      timeoutMinutes: window.ADTData?.["session_timeout_minutes"] || 0x1e,
      heartbeatMinutes: 0x5,
      pushSessionPings: true,
      pushSessionExit: true,
      pushPageExit: true,
      serverValidationEnabled:
        window.ADTData?.["enable_server_validation"] === "1" ||
        window.ADTData?.["enable_server_validation"] === true,
      validationInterval: 300000,
    },
    state: {
      sessionId: null,
      tabId: null,
      sessionNumber: 0,
      startTime: Date.now(),
      pingCount: 0,
      exitFired: false,
      activeSeconds: 0,
      lastActivity: Date.now(),
      isIdle: false,
      serverValidated: false,
      lastValidation: 0,
      validationTimer: null,
    },
    hooks: {
      start: [],
      exit: [],
      ping: [],
      idle: [],
      active: [],
      onExit: {},
    },
    registerHook(eventName, detail, element) {
      if (
        eventName === "onExit" &&
        typeof detail === "string" &&
        typeof element === "function"
      ) {
        if (!this.hooks.onExit) {
          this.hooks.onExit = {};
        }
        this.hooks.onExit[detail] = element;
        window.adtDebug("Registered onExit hook: " + detail);
        return;
      }
      if (this.hooks[eventName] && typeof detail === "function") {
        this.hooks[eventName].push(detail);
        window.adtDebug("Registered " + eventName + " hook");
      }
    },
    executeHooks(target, result) {
      if (!this.hooks[target]) {
        return;
      }
      this.hooks[target].forEach((value) => {
        try {
          value(result);
        } catch (flag) {
          window.adtDebug("Hook error (" + target + "):", flag);
        }
      });
    },
    generateId(enabled) {
      return (
        enabled +
        "_" +
        Date.now() +
        "_" +
        Math.random().toString(0x24).substr(0x2, 0x9)
      );
    },
    storage: {
      set(url, pattern) {
        try {
          localStorage.setItem(url, String(pattern));
          return true;
        } catch (regex) {
          console.warn(
            "[ADT] Storage quota exceeded, session data not persisted",
          );
          return false;
        }
      },
      get(depth, percent = null) {
        try {
          const raw = localStorage.getItem(depth) || percent;
          if (depth === "adt_session_id" && raw != null && raw !== "") {
            return normalizeSessionId(raw);
          }
          return raw;
        } catch (scrollY) {
          return percent;
        }
      },
      setSession(scrollTop, pageKey) {
        try {
          sessionStorage.setItem(scrollTop, String(pageKey));
          return true;
        } catch (firedSet) {
          return false;
        }
      },
      getSession(milestone, timerId = null) {
        try {
          return sessionStorage.getItem(milestone) || timerId;
        } catch (intervalId) {
          return timerId;
        }
      },
    },
    async validateWithServer(activeSec) {
      if (!this.config.serverValidationEnabled) {
        return {
          valid: true,
          client_only: true,
        };
      }
      if (!activeSec || activeSec === "null" || activeSec === "undefined") {
        if (window.ADTData?.["debug_mode"]) {
          window.adtDebug("Server validation skipped: invalid session ID");
        }
        return {
          valid: true,
          client_only: true,
          skipped: true,
        };
      }
      try {
        const tickCount = new FormData();
        tickCount.append("action", "adt_validate_session");
        tickCount.append(
          "nonce",
          window.ADTSessionValidation?.["session_nonce"] || "",
        );
        tickCount.append("session_id", activeSec);
        const saveTick = await fetch(
          window.ADTSessionValidation?.["ajax_url"] ||
            "/wp-admin/admin-ajax.php",
          {
            method: "POST",
            body: tickCount,
            credentials: "same-origin",
          },
        );
        if (!saveTick.ok) {
          if (window.ADTData?.["debug_mode"]) {
            window.adtDebug("Server validation HTTP error:", saveTick.status);
          }
          return {
            valid: true,
            error: "http_error",
            client_only: true,
          };
        }
        const isActive = await saveTick.json();
        return isActive.success
          ? ((this.state.serverValidated = true),
            (this.state.lastValidation = Date.now()),
            window.ADTData?.["debug_mode"] &&
              window.adtDebug("Server validation success"),
            {
              valid: true,
              ...isActive.data,
            })
          : (window.ADTData?.["debug_mode"] &&
              window.adtDebug(
                "Server validation failed:",
                isActive.data?.["error"],
              ),
            {
              valid: false,
              error: isActive.data,
            });
      } catch (lastTick) {
        if (window.ADTData?.["debug_mode"]) {
          window.adtDebug("Server validation error:", lastTick.message);
        }
        return {
          valid: true,
          error: "validation_failed",
          client_only: true,
        };
      }
    },
    async requestServerSession() {
      if (!this.config.serverValidationEnabled) {
        return null;
      }
      const milestones = this.state.sessionId || "";
      if (milestones === "null" || milestones === "undefined") {
        if (window.ADTData?.["debug_mode"]) {
          window.adtDebug(
            "Server session request skipped: invalid session ID format",
          );
        }
        return null;
      }
      try {
        const firedMilestones = new FormData();
        firedMilestones.append("action", "adt_refresh_session");
        firedMilestones.append(
          "nonce",
          window.ADTSessionValidation?.["session_nonce"] || "",
        );
        firedMilestones.append("session_id", this.state.sessionId || "");
        const pagePath = await fetch(
          window.ADTSessionValidation?.["ajax_url"] ||
            "/wp-admin/admin-ajax.php",
          {
            method: "POST",
            body: firedMilestones,
            credentials: "same-origin",
          },
        );
        if (!pagePath.ok) {
          if (window.ADTData?.["debug_mode"]) {
            window.adtDebug(
              "Server session request HTTP error:",
              pagePath.status,
            );
          }
          return null;
        }
        const scrollHeight = await pagePath.json();
        return scrollHeight.success
          ? (window.ADTData?.["debug_mode"] &&
              window.adtDebug("Server session created/refreshed"),
            scrollHeight.data)
          : (window.ADTData?.["debug_mode"] &&
              window.adtDebug(
                "Server session request failed:",
                scrollHeight.data?.["error"],
              ),
            null);
      } catch (viewportH) {
        if (window.ADTData?.["debug_mode"]) {
          window.adtDebug("Server session request error:", viewportH.message);
        }
        return null;
      }
    },
    async getOrCreateSessionId() {
      const scrollPct = Date.now();
      const threshold = this.config.timeoutMinutes * 0x3c * 1000;
      let tolerance = this.storage.get(this.config.sessionKey);
      try {
        const rawSession = localStorage.getItem(this.config.sessionKey);
        if (rawSession && tolerance && rawSession !== tolerance) {
          this.storage.set(this.config.sessionKey, tolerance);
        }
      } catch (storageNormalizeErr) {
        /* ignore */
      }
      const evt = parseInt(this.storage.get(this.config.startedKey, "0"));
      if (tolerance && evt && scrollPct - evt < threshold) {
        if (this.config.serverValidationEnabled) {
          const item = await this.validateWithServer(tolerance);
          if (item.valid) {
            return {
              id: tolerance,
              isNew: false,
              serverValidated: true,
            };
          } else if (window.ADTData?.["debug_mode"]) {
            window.adtDebug("Server invalidated existing session");
          }
        } else {
          return {
            id: tolerance,
            isNew: false,
            serverValidated: false,
          };
        }
      }
      let key = null;
      let err = false;
      if (this.config.serverValidationEnabled) {
        const idx = await this.requestServerSession();
        if (idx && idx.session_id) {
          key = idx.session_id;
          err = true;
          if (window.ADTData?.["debug_mode"]) {
            window.adtDebug("Using server-generated session ID");
          }
        }
      }
      if (!key) {
        key = this.generateId("sess");
        if (window.ADTData?.["debug_mode"]) {
          window.adtDebug("Using client-generated session ID");
        }
      }
      this.storage.set(this.config.sessionKey, key);
      this.storage.set(this.config.startedKey, scrollPct);
      try {
        document.cookie =
          this.config.sessionKey +
          "=" +
          key +
          "; path=/; max-age=" +
          this.config.timeoutMinutes * 0x3c +
          "; SameSite=Lax";
      } catch (len) {}
      return {
        id: key,
        isNew: true,
        serverValidated: err,
      };
    },
    getOrCreateTabId() {
      let mode = this.storage.getSession(this.config.tabKey);
      if (!mode) {
        mode = this.generateId("tab");
        this.storage.setSession(this.config.tabKey, mode);
      }
      return mode;
    },
    updateSessionNumber() {
      const typeVal = new Date().getFullYear();
      const nameVal = parseInt(this.storage.get(this.config.yearKey, "0"));
      let opts = parseInt(this.storage.get(this.config.numberKey, "0"));
      if (nameVal !== typeVal) {
        opts = 1;
        this.storage.set(this.config.yearKey, typeVal);
      } else {
        opts++;
      }
      this.storage.set(this.config.numberKey, opts);
      return opts;
    },
    startServerValidation() {
      if (!this.config.serverValidationEnabled) {
        return;
      }
      if (this.state.validationTimer) {
        clearInterval(this.state.validationTimer);
      }
      this.state.validationTimer = setInterval(async () => {
        const ref = await this.validateWithServer(this.state.sessionId);
        if (!ref.valid) {
          window.adtDebug("Session invalidated by server, restarting");
          this.exitSession("server_invalidated");
          setTimeout(() => {
            this.startSession("server_refresh");
          }, 100);
        }
      }, this.config.validationInterval);
    },
    async startSession(val = "pageload") {
      let obj = false;
      try {
        const fn = sessionStorage.getItem("adt_exit_pending");
        if (fn) {
          window.adtDebug(
            "Clearing pending exit - internal navigation detected",
          );
          sessionStorage.removeItem("adt_exit_pending");
          obj = true;
          this.state.exitFired = true;
        }
      } catch (arg) {}
      const tmp = await this.getOrCreateSessionId();
      this.state.sessionId = normalizeSessionId(tmp.id);
      this.state.tabId = this.getOrCreateTabId();
      this.state.serverValidated = tmp.serverValidated || false;
      setTimeout(() => {
        this.state.exitFired = false;
      }, 100);
      if (tmp.isNew) {
        this.state.sessionNumber = this.updateSessionNumber();
        this.state.startTime = Date.now();
        this.state.pingCount = 0;
        const node = {
          event: "session_start",
          session_id: this.state.sessionId,
          tab_id: this.state.tabId,
          session_number: this.state.sessionNumber,
          reason: val,
          server_validated: this.state.serverValidated,
          timestamp: new Date().toISOString(),
        };
        this.pushEvent(node);
        window.adtDebug("New session started:", this.state.sessionId);
      } else {
        this.state.sessionNumber = parseInt(
          this.storage.get(this.config.numberKey, "0"),
        );
        window.adtDebug("Continuing existing session:", this.state.sessionId);
      }
      this.executeHooks("start", {
        sessionId: this.state.sessionId,
        tabId: this.state.tabId,
        reason: val,
        isNew: tmp.isNew,
        serverValidated: this.state.serverValidated,
      });
      if (this.config.pushSessionPings) {
        this.startHeartbeat();
      }
      this.startServerValidation();
      window.adtDebug("[DEBUG] Session started:", {
        sessionId: this.state.sessionId,
        tabId: this.state.tabId,
        sessionNumber: this.state.sessionNumber,
        isNew: tmp.isNew,
        hadPendingExit: obj,
        serverValidated: this.state.serverValidated,
      });
    },
    collectExitData(list, entry) {
      if (!this.hooks.onExit || Object.keys(this.hooks.onExit).length === 0) {
        window.adtDebug(
          "[ADT Session] No exit hooks registered, skipping summary collection",
        );
        return;
      }
      const state = {};
      Object.keys(this.hooks.onExit).forEach((ctx) => {
        try {
          const data = this.hooks.onExit[ctx](list);
          if (data && typeof data === "object") {
            state[ctx] = data;
          }
        } catch (row) {
          console.error(
            "[ADT Session] Error in " + ctx + " exit hook:",
            row,
          );
        }
      });
      if (state.engagement) {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: "session_engagement_summary",
          ...state.engagement,
          session_id: this.state.sessionId,
          exit_reason: list,
          session_duration: entry,
        });
        window.adtDebug("[ADT Session] Pushed session_engagement_summary");
      }
      if (state.content) {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: "session_content_summary",
          ...state.content,
          session_id: this.state.sessionId,
          exit_reason: list,
        });
        window.adtDebug("[ADT Session] Pushed session_content_summary");
      }
    },
    exitSession(col = "timeout") {
      if (this.state.exitFired) {
        window.adtDebug("Session already exited, skipping");
        return;
      }
      this.state.exitFired = true;
      window.adtDebug("Exiting session:", col);
      this.stopHeartbeat();
      if (this.state.validationTimer) {
        clearInterval(this.state.validationTimer);
        this.state.validationTimer = null;
      }
      const mapVal = Math.round((Date.now() - this.state.startTime) / 1000);
      if (this.config.pushSessionExit) {
        const setVal = {
          event: "session_exit",
          session_id: this.state.sessionId,
          tab_id: this.state.tabId,
          session_number: this.state.sessionNumber,
          reason: col,
          duration_seconds: mapVal,
          active_seconds: this.state.activeSeconds,
          ping_count: this.state.pingCount,
          server_validated: this.state.serverValidated,
          timestamp: new Date().toISOString(),
        };
        this.pushEvent(setVal);
      }
      this.executeHooks("exit", {
        sessionId: this.state.sessionId,
        reason: col,
        duration: mapVal,
      });
      this.collectExitData(col, mapVal);
      this.broadcast("session_exit", {
        reason: col,
      });
      window.adtDebug("Session exited:", col);
    },
    sendPing() {
      this.state.pingCount++;
      if (this.config.pushSessionPings) {
        const buf = {
          event: "session_ping",
          session_id: this.state.sessionId,
          tab_id: this.state.tabId,
          ping_number: this.state.pingCount,
          active_seconds: this.state.activeSeconds,
          is_idle: this.state.isIdle,
          timestamp: new Date().toISOString(),
        };
        this.pushEvent(buf);
        window.adtDebug("Ping sent:", this.state.pingCount);
      }
      this.executeHooks("ping", {
        sessionId: this.state.sessionId,
        pingNumber: this.state.pingCount,
      });
    },
    startHeartbeat() {
      this.stopHeartbeat();
      this.sendPing();
      const raw = this.config.heartbeatMinutes * 0x3c * 1000;
      this.heartbeatTimer = setInterval(() => {
        this.sendPing();
      }, raw);
    },
    stopHeartbeat() {
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
    },
    trackActivity() {
      const parsed = Date.now();
      const text = this.state.isIdle;
      this.state.isIdle = false;
      this.state.lastActivity = parsed;
      this.resetIdleTimer();
      if (text) {
        this.executeHooks("active", {
          sessionId: this.state.sessionId,
        });
      }
    },
    resetIdleTimer() {
      if (this.idleTimer) {
        clearTimeout(this.idleTimer);
      }
      const html = this.config.timeoutMinutes * 0x3c * 1000;
      this.idleTimer = setTimeout(() => {
        this.handleIdle();
      }, html);
    },
    handleIdle() {
      this.state.isIdle = true;
      this.executeHooks("idle", {
        sessionId: this.state.sessionId,
      });
      this.exitSession("idle");
      window.adtDebug("Session idle timeout");
    },
    trackActiveTime() {
      const cmpName = Date.now();
      if (!this.state.isIdle && cmpName - this.state.lastActivity < 30000) {
        this.state.activeSeconds++;
        const handler =
          parseInt(this.storage.get("adt_active_seconds_lifetime", "0")) + 1;
        this.storage.set("adt_active_seconds_lifetime", handler);
        const callback = new Date().toISOString().slice(0, 10);
        const response = this.storage.get("adt_active_date");
        if (response === callback) {
          const request =
            parseInt(this.storage.get("adt_active_seconds_today", "0")) + 1;
          this.storage.set("adt_active_seconds_today", request);
        } else {
          this.storage.set("adt_active_date", callback);
          this.storage.set("adt_active_seconds_today", 1);
        }
      }
    },
    pushEvent(fields) {
      if (fields && fields.session_id != null) {
        fields.session_id = normalizeSessionId(fields.session_id);
      }
      if (typeof window.adtPushDeduped === "function") {
        const dedupeKey =
          fields.event +
          "_" +
          normalizeSessionId(this.state.sessionId) +
          "_" +
          (fields.ping_number || fields.timestamp || "");
        window.adtPushDeduped(fields, dedupeKey, 5000);
      } else if (typeof window.adt_push_deduped === "function") {
        const formId = fields.event + "_" + this.state.sessionId;
        window.adt_push_deduped(fields, formId, {
          throttleMs: 5000,
        });
      } else {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(fields);
      }
    },
    broadcast(fieldId, cartAdds) {
      try {
        const cartRemoves = {
          event: fieldId,
          sessionId: this.state.sessionId,
          data: cartAdds,
          timestamp: Date.now(),
        };
        this.storage.set("adt_session_broadcast", JSON.stringify(cartRemoves));
      } catch (sessionInfo) {}
    },
    handleBroadcast(hookData) {
      if (hookData.key !== "adt_session_broadcast" || !hookData.newValue) {
        return;
      }
      try {
        const pixelEvt = JSON.parse(hookData.newValue);
        if (pixelEvt.event === "session_exit") {
          this.state.exitFired = true;
          this.stopHeartbeat();
          if (this.state.validationTimer) {
            clearInterval(this.state.validationTimer);
            this.state.validationTimer = null;
          }
          window.adtDebug("Session exit broadcast received");
        }
      } catch (overlayEvt) {}
    },
    init() {
      if (window._adtSessionInitialized) {
        return;
      }
      window._adtSessionInitialized = true;
      window.adtDebug("Initializing session manager");
      this.startSession("pageload");
      ["click", "scroll", "keydown", "mousemove", "touchstart"].forEach(
        (filterEvt) => {
          document.addEventListener(filterEvt, () => this.trackActivity(), {
            passive: true,
          });
        },
      );
      setInterval(() => this.trackActiveTime(), 1000);
      let searchParams;
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
          searchParams = setTimeout(() => {
            if (document.visibilityState === "hidden") {
              window.adtDebug(
                "Tab hidden for 5 minutes, firing exit summaries",
              );
              this.exitSession("tab_close");
            }
          }, 0x493e0);
          if (this.config.pushPageExit) {
            this.pushEvent({
              event: "page_exit",
              session_id: this.state.sessionId,
              tab_id: this.state.tabId,
              reason: "hidden",
              timestamp: new Date().toISOString(),
            });
          }
        } else if (searchParams) {
          clearTimeout(searchParams);
          window.adtDebug("Tab visible again, canceling exit timer");
        }
      });
      window.addEventListener("storage", (clickId) =>
        this.handleBroadcast(clickId),
      );
      window.ADTSession = {
        id: () => normalizeSessionId(this.state.sessionId),
        tabId: () => this.state.tabId,
        number: () => this.state.sessionNumber,
        registerHook: (utmData, cookieVal, cookieKey) =>
          this.registerHook(utmData, cookieVal, cookieKey),
        getActiveTime: () => this.state.activeSeconds,
        isIdle: () => this.state.isIdle,
        hooks: this.hooks,
        triggerExit: (consentRaw = "manual") => {
          this.state.exitFired = false;
          this.exitSession(consentRaw);
        },
        getContext: () => ({
          session_id: this.state.sessionId,
          tab_id: this.state.tabId,
          session_number: this.state.sessionNumber,
          active_seconds: this.state.activeSeconds,
          server_validated: this.state.serverValidated,
        }),
      };
      window.adtDebug("Session manager ready");
    },
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => payload.init());
  } else {
    payload.init();
  }
})();
