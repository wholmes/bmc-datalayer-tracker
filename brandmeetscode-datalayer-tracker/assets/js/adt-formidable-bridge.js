/*!
 * DataLayer Tracker - Formidable Forms Bridge
 *
 * Integration bridge for Formidable Forms plugin
 *
 * @preserve
 * @package    DataLayer_Tracker
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
(function () {
  "use strict";

  try {
    var adtData = window.jQuery;
    function config(payload, eventName) {
      try {
        if (payload.form_id && window.formStats?.[payload.form_id]) {
          const detail = window.formStats[payload.form_id];
          payload.field_stats = {
            started: detail.started || 0,
            completed: detail.completed || 0,
            abandoned: detail.abandoned || 0,
            errors: detail.errors || 0,
            completed_fields: Array.from(detail.completedFields || []),
            abandoned_fields: Array.from(detail.abandonedFields || []),
            error_fields: Array.from(detail.errorFields || []),
          };
        }
        const element =
          typeof window.enrichPayload === "function"
            ? window.enrichPayload(payload)
            : payload;
        if (typeof window.adt_push_deduped === "function") {
          window.adt_push_deduped(element, eventName, {
            throttleMs: 0,
          });
        } else {
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push(element);
        }
        window.adtDebug("FormidableBridge: push:", element, eventName || "");
      } catch (target) {
        window.adtWarn("FormidableBridge: push failed:", target, payload);
      }
    }
    function result(value) {
      const flag = adtData(value);
      return {
        form_id:
          (flag.find('input[name="form_id"]').val() || "").trim() ||
          value.id ||
          "unknown",
        form_key:
          (flag.find('input[name="form_key"]').val() || "").trim() || null,
        form_class: value.className || null,
        form_action: value.action || null,
        page_path: location.pathname,
        page_title: document.title,
      };
    }
    const enabled = new Map();
    function url(pattern, regex) {
      const depth = Date.now();
      const percent = enabled.get(pattern) || 0;
      if (depth - percent < regex) {
        return true;
      }
      enabled.set(pattern, depth);
      return false;
    }
    if (!document.querySelector(".frm-show-form.frm_ajax_submit")) {
      window.adtDebug(
        "FormidableBridge: No AJAX Formidable forms detected — bridge idle (fallback to generic submit).",
      );
    }
    adtData(document).on(
      "frmFormComplete.adtFrm",
      function (scrollY, scrollTop) {
        const pageKey = adtData(scrollTop);
        if (!pageKey.hasClass("frm_ajax_submit")) {
          return;
        }
        const firedSet = result(scrollTop);
        const milestone = "frm_submit_success_" + firedSet.form_id;
        if (url(milestone, 1500)) {
          return;
        }
        config(
          {
            event: "formidable_form_submitted",
            status: "success",
            ...firedSet,
          },
          milestone,
        );
        if (typeof window.initFormFieldTracking === "function") {
          window.adtDebug(
            "FormidableBridge: 🔄 Rebinding field tracking after frmFormComplete",
          );
          window.initFormFieldTracking();
        }
      },
    );
    adtData(document).on(
      "frmFormErrors.adtFrm",
      function (timerId, intervalId) {
        const activeSec = result(intervalId);
        const tickCount = "frm_submit_error_" + activeSec.form_id;
        if (url(tickCount, 1500)) {
          return;
        }
        config(
          {
            event: "formidable_form_error",
            status: "error",
            ...activeSec,
          },
          tickCount,
        );
        if (typeof window.initFormFieldTracking === "function") {
          window.adtDebug(
            "FormidableBridge: 🔄 Rebinding field tracking after frmFormErrors",
          );
          window.initFormFieldTracking();
        }
      },
    );
    adtData(document).on(
      "frmBeforeFormRedirect.adtFrm",
      function (saveTick, isActive, lastTick) {
        const milestones = result(isActive);
        const firedMilestones = typeof lastTick === "string" ? lastTick : null;
        const pagePath = "frm_submit_redirect_" + milestones.form_id;
        if (url(pagePath, 1500)) {
          return;
        }
        config(
          {
            event: "formidable_form_redirect",
            status: "redirect",
            redirect_url: firedMilestones,
            ...milestones,
          },
          pagePath,
        );
        if (typeof window.initFormFieldTracking === "function") {
          window.adtDebug(
            "FormidableBridge: 🔄 Rebinding field tracking after frmBeforeFormRedirect",
          );
          window.initFormFieldTracking();
        }
      },
    );
    adtData(document).on(
      "frmPageChanged.adtFrm",
      function (scrollHeight, viewportH) {
        const scrollPct = result(viewportH);
        config(
          {
            event: "formidable_form_page_changed",
            ...scrollPct,
          },
          "frm_page_" + scrollPct.form_id + "_" + Date.now(),
        );
        if (typeof window.initFormFieldTracking === "function") {
          window.adtDebug(
            "FormidableBridge: 🔄 Rebinding field tracking after frmPageChanged",
          );
          window.initFormFieldTracking();
        }
      },
    );
    document.addEventListener(
      "submit",
      function (threshold) {
        const tolerance = threshold.target;
        if (!(tolerance instanceof HTMLFormElement)) {
          return;
        }
        if (!tolerance.classList.contains("frm-show-form")) {
          return;
        }
        if (tolerance.classList.contains("frm_ajax_submit")) {
          return;
        }
        const evt = result(tolerance);
        const item = "frm_submit_nonajax_" + evt.form_id;
        if (url(item, 1500)) {
          return;
        }
        config(
          {
            event: "formidable_form_submit",
            status: "submit",
            ...evt,
          },
          item,
        );
        if (typeof window.initFormFieldTracking === "function") {
          window.adtDebug(
            "FormidableBridge: 🔄 Rebinding field tracking after non-AJAX submit",
          );
          window.initFormFieldTracking();
        }
      },
      true,
    );
  } catch (key) {
    window.adtWarn("FormidableBridge: init failed:", key);
  }
})();
