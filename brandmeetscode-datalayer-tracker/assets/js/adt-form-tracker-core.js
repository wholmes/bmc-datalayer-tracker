/*!
 * DataLayer Tracker - Form Tracker Core
 *
 * Core form tracking functionality with field-level tracking
 *
 * @preserve
 * @package    DataLayer_Tracker
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
(function () {
  "use strict";

  if (window.ADTFormTracker) {
    return;
  }
  const fieldInteractionUnlocked =
    window.adtAllFeaturesEnabled?.() !== false;
  window._adtFormSessionState = window._adtFormSessionState || {
    forms_started: 0,
    total_fields_interacted: 0,
    forms_submitted: 0,
  };
  function persistFormSessionState() {
    try {
      sessionStorage.setItem(
        "adt_form_session_state",
        JSON.stringify(window._adtFormSessionState),
      );
    } catch (payload) {
      window.adtDebug(
        "[ADT Form Tracker] Failed to save session state (storage quota or disabled)",
      );
    }
  }
  function eventName() {
    try {
      const detail = sessionStorage.getItem("adt_form_session_state");
      if (detail) {
        const element = JSON.parse(detail);
        window._adtFormSessionState = {
          forms_started: element.forms_started || 0,
          total_fields_interacted: element.total_fields_interacted || 0,
          forms_submitted: element.forms_submitted || 0,
        };
        window.adtDebug(
          "[ADT Form Tracker] Restored session state:",
          window._adtFormSessionState,
        );
      }
    } catch (target) {
      window.adtDebug(
        "[ADT Form Tracker] Could not restore session state, starting fresh",
      );
    }
  }
  eventName();
  window.ADTFormTracker = {
    trackedForms: new Set(),
    trackedFields: new WeakSet(),
    fieldInteractionData: {},
    formStartTimes: {},
    initialized: false,
    SENSITIVE_PATTERNS: [
      "email",
      "e-mail",
      "e_mail",
      "mail",
      "name",
      "firstname",
      "first-name",
      "first_name",
      "fname",
      "lastname",
      "last-name",
      "last_name",
      "lname",
      "surname",
      "middlename",
      "middle-name",
      "middle_name",
      "fullname",
      "full-name",
      "full_name",
      "username",
      "user-name",
      "user_name",
      "login",
      "phone",
      "tel",
      "mobile",
      "cell",
      "fax",
      "address",
      "street",
      "city",
      "state",
      "zip",
      "postal",
      "country",
      "location",
      "residence",
      "ssn",
      "social",
      "tax",
      "ein",
      "itin",
      "card",
      "credit",
      "debit",
      "cvv",
      "cvc",
      "ccv",
      "account",
      "routing",
      "bank",
      "iban",
      "swift",
      "salary",
      "income",
      "wage",
      "payment",
      "password",
      "passwd",
      "pwd",
      "pass",
      "secret",
      "pin",
      "code",
      "token",
      "birth",
      "dob",
      "age",
      "birthday",
      "gender",
      "sex",
      "race",
      "ethnicity",
      "license",
      "passport",
      "visa",
      "permit",
      "medical",
      "health",
      "diagnosis",
      "prescription",
      "insurance",
      "policy",
      "signature",
      "sign",
      "legal",
      "beneficiary",
      "guardian",
      "fingerprint",
      "retina",
      "face",
      "biometric",
    ],
    SENSITIVE_FIELD_TYPES: ["password", "tel", "email"],
    SENSITIVE_AUTOCOMPLETE: [
      "name",
      "email",
      "username",
      "tel",
      "address-line1",
      "address-line2",
      "street-address",
      "postal-code",
      "cc-number",
      "cc-exp",
      "cc-csc",
      "bday",
      "sex",
      "tel-national",
      "tel-local",
    ],
    isSensitiveField(result) {
      if (this.SENSITIVE_FIELD_TYPES.includes(result.type)) {
        return true;
      }
      const value = (
        result.getAttribute("autocomplete") || ""
      ).toLowerCase();
      if (
        this.SENSITIVE_AUTOCOMPLETE.some((flag) =>
          value.includes(flag),
        )
      ) {
        return true;
      }
      const enabled = (
        result.getAttribute("inputmode") || ""
      ).toLowerCase();
      if (["email", "tel"].includes(enabled)) {
        return true;
      }
      const url = (
        (result.name || "") +
        " " +
        (result.id || "") +
        " " +
        (result.className || "") +
        " " +
        (result.placeholder || "") +
        " " +
        (result.getAttribute("aria-label") || "") +
        " " +
        (result.getAttribute("data-label") || "")
      ).toLowerCase();
      return this.SENSITIVE_PATTERNS.some((pattern) => {
        const regex = new RegExp(
          "(^|[^a-z])" + pattern + "([^a-z]|$)",
          "i",
        );
        return regex.test(url);
      });
    },
    isFieldInteractionEnabled() {
      return (
        window.ADTData?.["include"]?.["fieldInteraction"] ||
        window.ADTData?.["include"]?.["content"]?.["fieldInteraction"] ||
        window.ADTData?.["include_field_interaction"]
      );
    },
    getFormId(depth) {
      let percent =
        depth.id || depth.getAttribute("name") || depth.className;
      if (!percent && window.ADTFormVendors) {
        const scrollY = window.ADTFormVendors.detectVendor(depth);
        percent = window.ADTFormVendors.getVendorFormId(depth, scrollY);
      }
      return (
        percent || "form_" + Math.random().toString(0x24).slice(0x2, 0x8)
      );
    },
    getFieldId(scrollTop) {
      const pageKey =
        scrollTop.id ||
        scrollTop.name ||
        scrollTop.className ||
        scrollTop.type ||
        "unnamed_field";
      if (this.isSensitiveField(scrollTop)) {
        return "sensitive_" + (scrollTop.type || "field");
      }
      return pageKey;
    },
    init() {
      if (this.initialized) {
        window.adtDebug("[ADT Form Tracker] Already initialized");
        return;
      }
      window.adtDebug("[ADT Form Tracker] Init called...");
      const firedSet = () => {
        if (window.hasConsent && !window.hasConsent("analytics")) {
          window.adtDebug(
            "[ADT Form Tracker] Waiting for analytics consent...",
          );
          window.addEventListener(
            "adt_consent_granted",
            () => {
              window.adtDebug(
                "[ADT Form Tracker] Consent granted, initializing...",
              );
              if (!this.initialized) {
                this.initTracking();
              }
            },
            {
              once: true,
            },
          );
          return;
        }
        this.initTracking();
      };
      if (document.readyState === "loading") {
        window.adtDebug("[ADT Form Tracker] Waiting for DOM...");
        document.addEventListener("DOMContentLoaded", () => {
          window.adtDebug("[ADT Form Tracker] DOM ready, checking consent...");
          firedSet();
        });
      } else {
        window.adtDebug(
          "[ADT Form Tracker] DOM already ready, checking consent...",
        );
        firedSet();
      }
    },
    initTracking() {
      if (this.initialized) {
        window.adtDebug(
          "[ADT Form Tracker] Already initialized in initTracking",
        );
        return;
      }
      window.adtDebug("[ADT Form Tracker] Starting initTracking...");
      this.initSubmissionTracking();
      this.initFieldTracking();
      this.initSessionIntegration();
      this.observeDynamicForms();
      if (window.ADTFormVendors) {
        window.ADTFormVendors.init();
      }
      this.initialized = true;
      window.adtDebug("[ADT Form Tracker] ✅ Initialization complete");
    },
    initSubmissionTracking() {
      window.adtDebug("[ADT Form Tracker] Setting up submission tracking...");
      document.addEventListener(
        "submit",
        (milestone) => {
          const timerId = milestone.target;
          if (!timerId || !(timerId instanceof HTMLFormElement)) {
            return;
          }
          if (!window.hasConsent || !window.hasConsent("analytics")) {
            window.adtDebug(
              "[ADT Form Tracker] Submission tracking delayed - waiting for consent",
            );
            return;
          }
          if (this.trackedForms.has(timerId)) {
            return;
          }
          this.trackedForms.add(timerId);
          setTimeout(() => this.trackedForms["delete"](timerId), 100);
          if (timerId.dataset.adtIgnore === "true") {
            return;
          }
          if (timerId.id === "adminbarsearch") {
            return;
          }
          window._adtFormSessionState.forms_submitted++;
          persistFormSessionState();
          const intervalId = this.buildSubmissionPayload(timerId);
          this.pushEvent(intervalId, "form_submit_" + intervalId.form_id);
          window.adtDebug(
            "[ADT Form Tracker] Session forms_submitted:",
            window._adtFormSessionState.forms_submitted,
          );
        },
        true,
      );
      window.adtDebug("[ADT Form Tracker] ✅ Submission tracking ready");
    },
    buildSubmissionPayload(activeSec) {
      const tickCount = this.getFormId(activeSec);
      const saveTick = {
        event: "form_submit",
        form_id: tickCount,
        page_url: window.location.href,
        page_title: document.title,
        timestamp: new Date().toISOString(),
      };
      if (window._adtSessionInitialized && window.ADTSession) {
        saveTick.session_id = window.ADTSession.id();
        saveTick.session_number = window.ADTSession.number();
        saveTick.tab_id = window.ADTSession.tabId();
      }
      if (window.ADTFormVendors) {
        const isActive = window.ADTFormVendors.detectVendor(activeSec);
        if (isActive && isActive !== "unknown") {
          saveTick.form_vendor = isActive;
        }
      }
      if (fieldInteractionUnlocked) {
        saveTick.form_action = activeSec.getAttribute("action") || "";
        saveTick.form_method = activeSec.getAttribute("method") || "POST";
        const lastTick = activeSec.querySelectorAll(
          'input:not([type="hidden"]), select, textarea',
        );
        let milestones = 0;
        let firedMilestones = 0;
        lastTick.forEach((pagePath) => {
          if (this.isSensitiveField(pagePath)) {
            firedMilestones++;
          } else {
            milestones++;
          }
        });
        saveTick.field_count = milestones;
        saveTick.sensitive_fields_present = firedMilestones > 0;
        if (this.fieldInteractionData[tickCount]) {
          const scrollHeight = Object.values(this.fieldInteractionData[tickCount]);
          saveTick.fields_interacted = scrollHeight.length;
          saveTick.total_interaction_time = Math.round(
            scrollHeight.reduce(
              (viewportH, scrollPct) => viewportH + scrollPct.timeSpent,
              0,
            ) / 1000,
          );
        }
        if (this.formStartTimes[tickCount]) {
          saveTick.form_completion_time = Math.round(
            (Date.now() - this.formStartTimes[tickCount]) / 1000,
          );
        }
      }
      return saveTick;
    },
    initFieldTracking() {
      const threshold =
        window.ADTData?.["include"]?.["fieldTracking"] ||
        window.ADTData?.["include"]?.["content"]?.["fieldTracking"];
      if (!threshold) {
        window.adtDebug(
          "[ADT Form Tracker] Field tracking disabled - skipping field listener setup",
        );
        return;
      }
      window.adtDebug(
        "[ADT Form Tracker] Field tracking enabled - initializing...",
      );
      const tolerance = document.querySelectorAll("form");
      window.adtDebug(
        "[ADT Form Tracker] Found " + tolerance.length + " forms to track",
      );
      tolerance.forEach((evt) => this.trackFormFields(evt));
      window.adtDebug(
        "[ADT Form Tracker] ✅ Field tracking initialization complete",
      );
    },
    trackFormFields(item) {
      if (item.dataset.adtIgnore === "true") {
        window.adtDebug(
          "[ADT Form Tracker] Skipping form - marked as ignored:",
          item,
        );
        return;
      }
      if (item.id === "adminbarsearch") {
        window.adtDebug("[ADT Form Tracker] Skipping admin bar search form");
        return;
      }
      const key = window.getComputedStyle(item);
      if (key.display === "none" || key.visibility === "hidden") {
        window.adtDebug("[ADT Form Tracker] Skipping hidden form:", item);
        return;
      }
      const err = this.getFormId(item);
      const idx = item.querySelectorAll(
        'input:not([type="hidden"]), select, textarea',
      );
      window.adtDebug(
        '[ADT Form Tracker] Processing form "' +
          err +
          '" with ' +
          idx.length +
          " fields",
      );
      let len = 0;
      let mode = 0;
      let typeVal = 0;
      idx.forEach((nameVal) => {
        if (this.trackedFields.has(nameVal)) {
          mode++;
          return;
        }
        if (
          nameVal.name &&
          (nameVal.name.toLowerCase().includes("honeypot") ||
            nameVal.name.toLowerCase().includes("_hp_"))
        ) {
          mode++;
          window.adtDebug(
            "[ADT Form Tracker] Skipping honeypot field:",
            nameVal.name,
          );
          return;
        }
        if (this.isSensitiveField(nameVal)) {
          typeVal++;
          this.trackedFields.add(nameVal);
          window.adtDebug(
            "[ADT Form Tracker] Skipping sensitive field:",
            this.getFieldId(nameVal),
          );
          return;
        }
        this.addFieldListeners(nameVal, err);
        this.trackedFields.add(nameVal);
        len++;
      });
      window.adtDebug(
        '[ADT Form Tracker] Form "' +
          err +
          '" - Tracked: ' +
          len +
          ", Sensitive: " +
          typeVal +
          ", Skipped: " +
          mode,
      );
    },
    addFieldListeners(opts, ref) {
      const val = this.getFieldId(opts);
      window.adtDebug(
        '[ADT Form Tracker] Adding listeners to field "' +
          val +
          '" in form "' +
          ref +
          '"',
      );
      if (!this._fieldStates) {
        this._fieldStates = new Map();
      }
      const obj = ref + "_" + val;
      if (!this._fieldStates.has(obj)) {
        this._fieldStates.set(obj, {
          startFired: false,
          completeFired: false,
          abandonFired: false,
          firstFocusValue: null,
        });
      }
      const fn = this._fieldStates.get(obj);
      opts.addEventListener("focus", () => {
        window.adtDebug("[ADT Form Tracker] Field focused: " + val);
        if (!window.hasConsent || !window.hasConsent("analytics")) {
          window.adtDebug(
            "[ADT Form Tracker] No analytics consent - skipping field focus tracking",
          );
          return;
        }
        window.adtDebug(
          "[ADT Form Tracker] Field focus tracking active for: " + val,
        );
        if (!this.formStartTimes[ref]) {
          this.formStartTimes[ref] = Date.now();
          window._adtFormSessionState.forms_started++;
          persistFormSessionState();
          const arg = {
            event: "form_start",
            form_id: ref,
            timestamp: new Date().toISOString(),
          };
          if (window._adtSessionInitialized && window.ADTSession) {
            arg.session_id = window.ADTSession.id();
            arg.session_number = window.ADTSession.number();
            arg.tab_id = window.ADTSession.tabId();
          }
          this.pushEvent(arg, "form_start_" + ref);
          window.adtDebug(
            "[ADT Form Tracker] Pushed form_start event:",
            arg,
          );
          window.adtDebug(
            "[ADT Form Tracker] Session forms_started:",
            window._adtFormSessionState.forms_started,
          );
        }
        if (!this.fieldInteractionData[ref]) {
          this.fieldInteractionData[ref] = {};
        }
        if (!this.fieldInteractionData[ref][val]) {
          this.fieldInteractionData[ref][val] = {
            interactions: 0,
            timeSpent: 0,
            lastFocusTime: null,
            firstFocusValue: opts.value || "",
            currentValue: opts.value || "",
            hadInput: false,
          };
          window._adtFormSessionState.total_fields_interacted++;
          persistFormSessionState();
          fn.firstFocusValue = opts.value || "";
          window.adtDebug(
            "[ADT Form Tracker] Initialized field data for: " + val,
            this.fieldInteractionData[ref][val],
          );
          window.adtDebug(
            "[ADT Form Tracker] Session total_fields_interacted:",
            window._adtFormSessionState.total_fields_interacted,
          );
        }
        const tmp = this.fieldInteractionData[ref][val];
        tmp.lastFocusTime = Date.now();
        tmp.interactions++;
        window.adtDebug(
          "[ADT Form Tracker] Field state for " + val + ":",
          {
            interactions: tmp.interactions,
            startFired: fn.startFired,
          },
        );
        if (!fn.startFired) {
          fn.startFired = true;
          const node = {
            event: "form_field_start",
            form_id: ref,
            field_id: val,
            field_type: opts.type || "unknown",
            timestamp: new Date().toISOString(),
          };
          if (window._adtSessionInitialized && window.ADTSession) {
            node.session_id = window.ADTSession.id();
            node.session_number = window.ADTSession.number();
            node.tab_id = window.ADTSession.tabId();
          }
          this.pushEvent(
            node,
            "field_start_" + ref + "_" + val,
          );
          window.adtDebug(
            "[ADT Form Tracker] Pushed form_field_start event:",
            node,
          );
        } else {
          window.adtDebug(
            "[ADT Form Tracker] form_field_start already fired for: " +
              val,
          );
        }
      });
      opts.addEventListener("input", () => {
        const list = this.fieldInteractionData[ref]?.[val];
        if (list) {
          list.hadInput = true;
          list.currentValue = opts.value || "";
          window.adtDebug(
            "[ADT Form Tracker] Input detected on field: " + val,
            {
              hadInput: list.hadInput,
              currentValue: list.currentValue,
            },
          );
        }
      });
      opts.addEventListener("blur", () => {
        console.log("🔍 BLUR CHECKPOINT 1: Blur event fired for:", val);
        if (!window.hasConsent || !window.hasConsent("analytics")) {
          console.error("❌ BLOCKED AT CHECKPOINT 2: No analytics consent");
          return;
        }
        console.log("✅ CHECKPOINT 2 PASSED: Has consent");
        const entry = this.fieldInteractionData[ref]?.[val];
        if (!entry) {
          console.error(
            "❌ BLOCKED AT CHECKPOINT 3: No field data for",
            ref,
            val,
          );
          console.log("Available form data:", this.fieldInteractionData);
          return;
        }
        console.log("✅ CHECKPOINT 3 PASSED: Field data exists", entry);
        if (!entry.lastFocusTime) {
          console.error(
            "❌ BLOCKED AT CHECKPOINT 4: No lastFocusTime recorded",
          );
          return;
        }
        console.log(
          "✅ CHECKPOINT 4 PASSED: Focus time recorded:",
          entry.lastFocusTime,
        );
        const state = Date.now() - entry.lastFocusTime;
        entry.timeSpent += state;
        entry.lastFocusTime = null;
        console.log("✅ CHECKPOINT 5: Time calculated:", {
          timeSpent: state + "ms",
          totalTime: entry.timeSpent + "ms",
        });
        const ctx = (opts.value || "").trim();
        entry.currentValue = ctx;
        const data = ctx.length > 0;
        const row =
          ctx !== (fn.firstFocusValue || "").trim();
        console.log("✅ CHECKPOINT 6: Value analysis:", {
          hadValue: data,
          valueChanged: row,
          hadInput: entry.hadInput,
          firstValue: fn.firstFocusValue,
          currentValue: ctx,
          fieldType: opts.type,
        });
        const col =
          data &&
          (row ||
            entry.hadInput ||
            (opts.type === "checkbox" && opts.checked) ||
            (opts.type === "radio" && opts.checked) ||
            (opts.tagName === "SELECT" && ctx));
        console.log("✅ CHECKPOINT 7: Completion status:", {
          isCompleted: col,
          completeFired: fn.completeFired,
          abandonFired: fn.abandonFired,
        });
        const mapVal = {};
        if (window._adtSessionInitialized && window.ADTSession) {
          mapVal.session_id = window.ADTSession.id();
          mapVal.session_number = window.ADTSession.number();
          mapVal.tab_id = window.ADTSession.tabId();
        }
        if (col && !fn.completeFired) {
          fn.completeFired = true;
          const setVal = {
            event: "form_field_complete",
            form_id: ref,
            field_id: val,
            field_type: opts.type || "unknown",
            timestamp: new Date().toISOString(),
            ...mapVal,
          };
          console.log(
            "🚀 CHECKPOINT 8: Pushing form_field_complete:",
            setVal,
          );
          this.pushEvent(
            setVal,
            "field_complete_" + ref + "_" + val,
          );
          fn.abandonFired = true;
        } else {
          if (
            !col &&
            (entry.hadInput || row) &&
            !fn.abandonFired
          ) {
            fn.abandonFired = true;
            const buf = {
              event: "form_field_abandon",
              form_id: ref,
              field_id: val,
              field_type: opts.type || "unknown",
              timestamp: new Date().toISOString(),
              ...mapVal,
            };
            console.log(
              "🚀 CHECKPOINT 9: Pushing form_field_abandon:",
              buf,
            );
            this.pushEvent(
              buf,
              "field_abandon_" + ref + "_" + val,
            );
          } else {
            console.log("⚠️ CHECKPOINT 8/9 SKIPPED:", {
              isCompleted: col,
              hadInput: entry.hadInput,
              valueChanged: row,
              abandonFired: fn.abandonFired,
              completeFired: fn.completeFired,
            });
          }
        }
        const raw = this.isFieldInteractionEnabled();
        console.log("✅ CHECKPOINT 10: Interaction check:", {
          timeSpent: state + "ms",
          threshold: "1000ms",
          meetsThreshold: state > 1000,
          featureEnabled: raw,
          featuresEnabled: fieldInteractionUnlocked,
        });
        if (state > 1000 && raw) {
          if (!fieldInteractionUnlocked) {
            return;
          }
          const parsed = {
            event: "form_field_interaction",
            form_id: ref,
            field_id: val,
            field_type: opts.type || "unknown",
            interaction_time: Math.round(state / 1000),
            total_interactions: entry.interactions,
            cumulative_time: Math.round(entry.timeSpent / 1000),
            timestamp: new Date().toISOString(),
            ...mapVal,
          };
          console.log(
            "🚀 CHECKPOINT 10: Pushing form_field_interaction:",
            parsed,
          );
          this.pushEvent(
            parsed,
            "field_interaction_" +
              ref +
              "_" +
              val +
              "_" +
              Date.now(),
          );
        } else {
          console.warn(
            "⚠️ CHECKPOINT 10 SKIPPED: Time or feature requirement not met",
          );
        }
        console.log("✅ BLUR HANDLER COMPLETE for:", val);
      });
      if (opts.type === "checkbox" || opts.type === "radio") {
        opts.addEventListener("change", () => {
          window.adtDebug(
            "[ADT Form Tracker] Change detected on " +
              opts.type +
              ": " +
              val,
          );
          if (!window.hasConsent || !window.hasConsent("analytics")) {
            window.adtDebug(
              "[ADT Form Tracker] No analytics consent - skipping change tracking",
            );
            return;
          }
          const text = this.fieldInteractionData[ref]?.[val];
          if (text) {
            text.hadInput = true;
            text.currentValue = opts.checked
              ? "checked"
              : "unchecked";
          }
          const html = {
            event: "form_field_change",
            form_id: ref,
            field_id: val,
            field_type: opts.type,
            field_value: opts.checked ? "checked" : "unchecked",
            timestamp: new Date().toISOString(),
          };
          if (window._adtSessionInitialized && window.ADTSession) {
            html.session_id = window.ADTSession.id();
            html.session_number = window.ADTSession.number();
            html.tab_id = window.ADTSession.tabId();
          }
          this.pushEvent(
            html,
            "field_change_" + ref + "_" + val + "_" + Date.now(),
          );
          window.adtDebug(
            "[ADT Form Tracker] Pushed form_field_change event:",
            html,
          );
        });
      }
      if (opts.tagName === "SELECT") {
        opts.addEventListener("change", () => {
          window.adtDebug(
            "[ADT Form Tracker] Change detected on select: " + val,
          );
          if (!window.hasConsent || !window.hasConsent("analytics")) {
            return;
          }
          const cmpName = this.fieldInteractionData[ref]?.[val];
          if (cmpName) {
            cmpName.hadInput = true;
            cmpName.currentValue = opts.value || "";
            window.adtDebug(
              "[ADT Form Tracker] Select value changed to: " +
                cmpName.currentValue,
            );
          }
        });
      }
      window.adtDebug(
        "[ADT Form Tracker] Listeners successfully added to field: " +
          val,
      );
    },
    pushEvent(handler, callback) {
      window.dataLayer = window.dataLayer || [];
      const response = handler.event;
      const request = {
        ...handler,
      };
      delete request.event;
      window.dataLayer.push(request);
      window.dataLayer.push({
        event: response,
      });
      if (
        fieldInteractionUnlocked &&
        window.ADTData?.["dual_pixel_mode"] === "1" &&
        window.ADTPixels?.["trackEvent"]
      ) {
        window.ADTPixels.trackEvent(response, handler);
      }
      window.adtDebug("[ADT Form Tracker] Event:", response, handler);
    },
    observeDynamicForms() {
      if (this._formObserverInitialized) {
        window.adtDebug("[ADT Form Tracker] Form observer already initialized");
        return;
      }
      if (typeof MutationObserver !== "function") {
        return;
      }
      this._formObserverInitialized = true;
      let fields;
      const formId = new MutationObserver((fieldId) => {
        let cartAdds = false;
        for (const cartRemoves of fieldId) {
          if (cartRemoves.addedNodes.length === 0) {
            continue;
          }
          for (const sessionInfo of cartRemoves.addedNodes) {
            if (sessionInfo.nodeType !== 1) {
              continue;
            }
            if (
              sessionInfo.tagName === "FORM" ||
              (sessionInfo.querySelector && sessionInfo.querySelector("form"))
            ) {
              cartAdds = true;
              break;
            }
          }
          if (cartAdds) {
            break;
          }
        }
        if (cartAdds) {
          clearTimeout(fields);
          fields = setTimeout(() => {
            this.initFieldTracking();
            if (window.ADTFormVendors) {
              window.ADTFormVendors.scanForVendorForms();
            }
          }, 500);
        }
      });
      formId.observe(document.body, {
        childList: true,
        subtree: true,
      });
      window.adtDebug("[ADT Form Tracker] Mutation observer active");
    },
    initSessionIntegration() {
      if (this._sessionIntegrated) {
        window.adtDebug("[ADT Form Tracker] Session already integrated");
        return;
      }
      if (
        !window.ADTSession ||
        typeof window.ADTSession.registerHook !== "function"
      ) {
        window.adtDebug("[ADT Form Tracker] Session manager not available");
        return;
      }
      this._sessionIntegrated = true;
      window.adtDebug("[ADT Form Tracker] Integrating with session manager");
      const hookData = this;
      window.ADTSession.registerHook("exit", (pixelEvt) => {
        window.adtDebug("[ADT Form Tracker] EXIT HOOK FIRED!", pixelEvt);
        const overlayEvt = {
          event: "session_form_summary",
          session_id: pixelEvt.sessionId,
          exit_reason: pixelEvt.reason,
          forms_started: window._adtFormSessionState.forms_started,
          forms_submitted: window._adtFormSessionState.forms_submitted,
          fields_interacted:
            window._adtFormSessionState.total_fields_interacted,
          total_forms: document.querySelectorAll("form").length,
          timestamp: new Date().toISOString(),
        };
        if (overlayEvt.fields_interacted === 0) {
          delete overlayEvt.fields_interacted;
        }
        if (overlayEvt.forms_submitted === 0) {
          delete overlayEvt.forms_submitted;
        }
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(overlayEvt);
        window.adtDebug(
          "[ADT Form Tracker] Form summary sent on session exit:",
          overlayEvt,
        );
        window.adtDebug(
          "[ADT Form Tracker] Session state:",
          window._adtFormSessionState,
        );
      });
      window.ADTSession.registerHook("idle", (filterEvt) => {
        const searchParams = Object.keys(hookData.formStartTimes);
        if (searchParams.length > 0) {
          const clickId = {
            event: "form_idle_abandonment",
            session_id: filterEvt.sessionId,
            forms_in_progress: searchParams,
            timestamp: new Date().toISOString(),
          };
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push(clickId);
          window.adtDebug(
            "[ADT Form Tracker] Form idle abandonment:",
            clickId,
          );
        }
      });
      window.adtDebug("[ADT Form Tracker] Session integration complete");
    },
  };
  window.adtDebug("[ADT Form Tracker] Auto-initializing...");
  window.ADTFormTracker.init();
})();
