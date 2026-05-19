/*!
 * DataLayer Tracker - Event Mapping Page
 *
 * Enhanced event mapping with search, filter, and export
 * Standalone page version with additional features
 *
 * @preserve
 * @package    DataLayer_Tracker
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
(function () {
  let adtData =
    localStorage.getItem("adt_event_breakdown_mode") || "detailed";
  let config = localStorage.getItem("adt_event_category_filter") || "all";
  let payload = "";
  const eventName = {
    engagement: [
      "scroll_depth",
      "scroll_back_up",
      "time_on_page",
      "active_time",
      "focus_blur",
      "hover_intent",
      "section_engagement",
      "click",
      "defaultclicks",
    ],
    ecommerce: [
      "view_item",
      "add_to_cart",
      "remove_from_cart",
      "view_cart",
      "begin_checkout",
      "checkout_progress",
      "purchase",
      "refund",
      "select_item",
      "view_item_list",
    ],
    forms: [
      "form_view",
      "form_start",
      "form_submit",
      "form_error",
      "form_abandon",
      "field_interaction",
    ],
    video: [
      "video_start",
      "video_progress",
      "video_complete",
      "video_pause",
      "video_resume",
    ],
    session: [
      "session_engagement_summary",
      "session_content_summary",
      "session_attribution_summary",
      "session_page_summary",
      "session_video_summary",
      "session_engagement_milestone",
    ],
  };
  function detail(element) {
    const target = element.toLowerCase().replace(/[_\s]/g, "");
    for (const [result, value] of Object.entries(eventName)) {
      if (
        value.some((flag) =>
          target.includes(flag.replace(/[_\s]/g, "")),
        )
      ) {
        return result;
      }
    }
    return "other";
  }
  function enabled() {
    const url = document.getElementById("adt-event-breakdown");
    const pattern = window.latestExportJson;
    if (!url || !pattern) {
      return;
    }
    const regex = pattern.gtm?.["containerVersion"]
      ? pattern.gtm
      : pattern;
    const depth = regex.containerVersion?.["tag"] || [];
    const percent = regex.containerVersion?.["trigger"] || [];
    const scrollY = Object.fromEntries(
      percent.map((scrollTop) => [scrollTop.triggerId, scrollTop]),
    );
    const pageKey = (firedSet) => {
      const milestone = firedSet.parameter?.["find"](
        (timerId) => timerId.key === "eventName",
      );
      if (milestone?.["value"]) {
        return (milestone.value || "").trim().toLowerCase();
      }
      if (firedSet.type === "html") {
        const intervalId = firedSet.parameter?.["find"](
          (activeSec) => activeSec.key === "html",
        );
        if (intervalId?.["value"]) {
          const tickCount = intervalId.value.match(/'event'\s*:\s*'([^']+)'/);
          if (tickCount) {
            return (tickCount[1] || "").trim().toLowerCase();
          }
        }
      }
      return (firedSet.name || "unnamed_event" || "").trim().toLowerCase();
    };
    const saveTick = {};
    depth.forEach((isActive) => {
      const lastTick = pageKey(isActive);
      if (!saveTick[lastTick]) {
        saveTick[lastTick] = {
          trigger: null,
          tags: [],
          label: lastTick,
          triggers: [],
          variables: [],
        };
      }
      saveTick[lastTick].tags.push(isActive);
      (isActive.firingTriggerId || []).forEach((milestones) => {
        const firedMilestones = scrollY[milestones];
        if (
          firedMilestones &&
          !saveTick[lastTick].triggers.some(
            (pagePath) => pagePath.triggerId === milestones,
          )
        ) {
          saveTick[lastTick].triggers.push(firedMilestones);
          if (!saveTick[lastTick].trigger) {
            saveTick[lastTick].trigger = firedMilestones;
          }
        }
      });
      (isActive.parameter || []).forEach((scrollHeight) => {
        if (scrollHeight.type === "template" && scrollHeight.value) {
          const viewportH = scrollHeight.value.match(/\{\{([^}]+)\}\}/g);
          if (viewportH) {
            viewportH.forEach((scrollPct) => {
              const threshold = scrollPct.replace(/\{\{|\}\}/g, "").trim();
              if (!saveTick[lastTick].variables.includes(threshold)) {
                saveTick[lastTick].variables.push(threshold);
              }
            });
          }
        }
      });
    });
    const tolerance = [
      "purchase",
      "refund",
      "add_to_cart",
      "remove_from_cart",
      "begin_checkout",
      "view_cart",
      "view_item",
      "view_item_list",
      "page_view",
      "form_submit",
      "section_engagement",
      "scroll_depth",
      "time_on_page",
      "hover_intent",
      "video_progress",
      "last_engaged_section",
      "scroll_back_up",
      "last_content_type_viewed",
      "default_clicks",
    ];
    tolerance.forEach((evt) => {
      const item = (evt || "").trim().toLowerCase();
      const key = Object.keys(saveTick).some(
        (err) => (err || "").trim().toLowerCase() === item,
      );
      if (!key) {
        saveTick[item] = {
          trigger: {
            name: "(none)",
            type: "direct push",
          },
          tags: [],
          label: evt,
          triggers: [],
          variables: [],
        };
      }
    });
    window.adtEventMappingData = saveTick;
    if (adtData === "minimal") {
      idx(saveTick);
    } else {
      len(saveTick);
    }
    mode();
  }
  function idx(typeVal) {
    const nameVal = document.getElementById("adt-event-breakdown");
    let opts = '<ul class="adt-event-list">';
    Object.entries(typeVal)
      .sort(([ref], [val]) => ref.localeCompare(val))
      .forEach(([obj, { tags: fn, triggers: arg }]) => {
        const tmp = detail(obj);
        opts +=
          '\n          <li class="adt-event-row" data-event="' +
          obj +
          '" data-category="' +
          tmp +
          '">\n            <div style="display: flex; align-items: center; gap: 12px;">\n              <span class="adt-event-name">' +
          obj +
          '</span>\n              <span class="adt-category-badge ' +
          tmp +
          '">' +
          tmp +
          '</span>\n            </div>\n            <div class="adt-event-meta">\n              <span>' +
          fn.length +
          " tag" +
          (fn.length !== 1 ? "s" : "") +
          "</span>\n              <span>·</span>\n              <span>" +
          arg.length +
          " trigger" +
          (arg.length !== 1 ? "s" : "") +
          "</span>\n            </div>\n          </li>\n        ";
      });
    opts += "</ul>";
    nameVal.innerHTML = opts;
  }
  function len(node) {
    const list = document.getElementById("adt-event-breakdown");
    let entry =
      '\n      <div class="adt-table-container">\n        <table class="adt-event-table">\n          <thead>\n            <tr>\n              <th style="width: 25%;">Event Name</th>\n              <th style="width: 25%;">Triggers</th>\n              <th style="width: 35%;">Tags</th>\n              <th style="width: 15%;">Variables</th>\n            </tr>\n          </thead>\n          <tbody>\n    ';
    Object.entries(node)
      .sort(([state], [ctx]) => state.localeCompare(ctx))
      .forEach(
        ([
          data,
          { tags: row, triggers: col, variables: mapVal },
        ]) => {
          const setVal = detail(data);
          const buf = row.length === 0 ? "adt-row-unwired" : "";
          const raw =
            col.map((parsed) => parsed.name).join("<br>") ||
            "<em>(none)</em>";
          const text =
            row.map((html) => html.name).join("<br>") ||
            "<em>(no tags)</em>";
          const cmpName = mapVal.length;
          entry +=
            '\n          <tr class="adt-event-row ' +
            buf +
            '" data-event="' +
            data +
            '" data-category="' +
            setVal +
            '">\n            <td>\n              <div style="display: flex; flex-direction: column; gap: 6px;">\n                <strong style="color: #667eea;">' +
            data +
            '</strong>\n                <span class="adt-category-badge ' +
            setVal +
            '">' +
            setVal +
            '</span>\n              </div>\n            </td>\n            <td style="font-size: 13px;">' +
            raw +
            '</td>\n            <td style="font-size: 13px;">' +
            text +
            '</td>\n            <td style="text-align: center;">' +
            (cmpName > 0 ? cmpName : "-") +
            "</td>\n          </tr>\n        ";
        },
      );
    entry += "\n          </tbody>\n        </table>\n      </div>\n    ";
    list.innerHTML = entry;
  }
  function handler() {
    const callback = document.querySelectorAll(".adt-event-row");
    let response = 0;
    callback.forEach((request) => {
      const fields = request.dataset.event || "";
      const formId = request.dataset.category || "";
      const fieldId =
        payload === "" || fields.includes(payload.toLowerCase());
      const cartAdds = config === "all" || formId === config;
      if (fieldId && cartAdds) {
        request.classList.remove("hidden");
        request.style.display = "";
        response++;
      } else {
        request.classList.add("hidden");
        request.style.display = "none";
      }
    });
    mode(response);
  }
  function mode(cartRemoves = null) {
    const sessionInfo = document.getElementById("adt-results-count");
    if (!sessionInfo) {
      return;
    }
    const hookData = document.querySelectorAll(".adt-event-row").length;
    if (cartRemoves === null) {
      cartRemoves = hookData;
    }
    if (payload || config !== "all") {
      sessionInfo.textContent =
        "Showing " + cartRemoves + " of " + hookData + " events";
    } else {
      sessionInfo.textContent = hookData + " events total";
    }
  }
  function pixelEvt() {
    const overlayEvt = window.adtEventMappingData;
    if (!overlayEvt) {
      return;
    }
    let filterEvt =
      "Event Name,Category,Trigger Count,Tag Count,Triggers,Tags,Variables\n";
    Object.entries(overlayEvt)
      .sort(([searchParams], [clickId]) => searchParams.localeCompare(clickId))
      .forEach(
        ([
          utmData,
          { tags: cookieVal, triggers: cookieKey, variables: consentRaw },
        ]) => {
          const consentObj = detail(utmData);
          const prevConsent = cookieKey
            .map((now) => now.name)
            .join("; ");
          const last = cookieVal
            .map((diff) => diff.name)
            .join("; ");
          const found = consentRaw.join("; ");
          filterEvt +=
            '"' +
            utmData +
            '","' +
            consentObj +
            '",' +
            cookieKey.length +
            "," +
            cookieVal.length +
            ',"' +
            prevConsent +
            '","' +
            last +
            '","' +
            found +
            '"\n';
        },
      );
    const detected = new Blob([filterEvt], {
      type: "text/csv",
    });
    const retryCount = window.URL.createObjectURL(detected);
    const maxRetries = document.createElement("a");
    maxRetries.href = retryCount;
    maxRetries.download =
      "adt-event-mapping-" + new Date().toISOString().split("T")[0] + ".csv";
    document.body.appendChild(maxRetries);
    maxRetries.click();
    document.body.removeChild(maxRetries);
    window.URL.revokeObjectURL(retryCount);
  }
  document.addEventListener("DOMContentLoaded", function () {
    enabled();
    const delayMs = document.getElementById("adt-toggle-minimal");
    const timeoutMs = document.getElementById("adt-toggle-detailed");
    if (adtData === "minimal") {
      delayMs?.["classList"]["add"]("button-primary");
      timeoutMs?.["classList"]["remove"]("button-primary");
    } else {
      timeoutMs?.["classList"]["add"]("button-primary");
      delayMs?.["classList"]["remove"]("button-primary");
    }
    document.querySelectorAll(".adt-category-filter").forEach((hasConsent) => {
      if (hasConsent.dataset.category === config) {
        hasConsent.classList.add("active");
      } else {
        hasConsent.classList.remove("active");
      }
    });
    delayMs?.["addEventListener"]("click", function () {
      adtData = "minimal";
      localStorage.setItem("adt_event_breakdown_mode", "minimal");
      delayMs.classList.add("button-primary");
      timeoutMs.classList.remove("button-primary");
      enabled();
      handler();
    });
    timeoutMs?.["addEventListener"]("click", function () {
      adtData = "detailed";
      localStorage.setItem("adt_event_breakdown_mode", "detailed");
      timeoutMs.classList.add("button-primary");
      delayMs.classList.remove("button-primary");
      enabled();
      handler();
    });
    const blocked = document.getElementById("adt-event-search");
    blocked?.["addEventListener"]("input", function (wasBlocked) {
      payload = wasBlocked.target.value.trim();
      handler();
    });
    document.querySelectorAll(".adt-category-filter").forEach((analyticsOk) => {
      analyticsOk.addEventListener("click", function () {
        document
          .querySelectorAll(".adt-category-filter")
          .forEach((marketingOk) => marketingOk.classList.remove("active"));
        this.classList.add("active");
        config = this.dataset.category;
        localStorage.setItem("adt_event_category_filter", config);
        handler();
      });
    });
    const extra = document.getElementById("adt-export-csv");
    extra?.["addEventListener"]("click", pixelEvt);
  });
})();
