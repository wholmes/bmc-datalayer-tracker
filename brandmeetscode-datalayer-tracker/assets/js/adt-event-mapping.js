/*!
 * DataLayer Tracker - Event Mapping
 *
 * Enhanced event mapping: events → triggers → tags → variables
 * Features: Search, category filters, CSV export, statistics, sorting
 *
 * @preserve
 * @package    DataLayer_Tracker
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
(function () {
  let adtData = localStorage.getItem("adt_event_category_filter") || "all";
  let config = {};
  let payload = [];
  const eventName = {
    engagement: [
      "scrolldepth",
      "timeonpage",
      "activetime",
      "focusblur",
      "sectionengagement",
      "hoverintent",
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
    ],
    forms: ["formsubmit", "form_start", "form_abandon"],
    video: ["video_start", "video_progress", "video_complete"],
    session: ["page_view", "session_start", "session_end"],
  };
  function detail(element) {
    const target = element.toLowerCase();
    for (const [result, value] of Object.entries(eventName)) {
      if (value.includes(target)) {
        return result;
      }
    }
    return "other";
  }
  function flag(enabled) {
    const url = enabled.type || "";
    if (url === "html") {
      return '<span style="background:#fee;color:#900;padding:2px 6px;border-radius:3px;font-size:10px;font-weight:600;">HTML</span>';
    }
    if (url === "gaawe") {
      return '<span style="background:#e8f5e9;color:#2e7d32;padding:2px 6px;border-radius:3px;font-size:10px;font-weight:600;">GA4</span>';
    }
    if (url.includes("pixel") || url.includes("fb")) {
      return '<span style="background:#e3f2fd;color:#1565c0;padding:2px 6px;border-radius:3px;font-size:10px;font-weight:600;">PIXEL</span>';
    }
    return (
      '<span style="background:#f5f5f5;color:#666;padding:2px 6px;border-radius:3px;font-size:10px;font-weight:600;">' +
      url.toUpperCase() +
      "</span>"
    );
  }
  function pattern(regex, depth) {
    const percent = document.querySelectorAll(".adt-event-row");
    let scrollY = 0;
    percent.forEach((scrollTop) => {
      const pageKey = scrollTop.dataset.event || "";
      const firedSet = scrollTop.dataset.category || "";
      const milestone =
        !regex || pageKey.toLowerCase().includes(regex.toLowerCase());
      const timerId = depth === "all" || firedSet === depth;
      if (milestone && timerId) {
        scrollTop.style.display = "";
        scrollY++;
      } else {
        scrollTop.style.display = "none";
      }
    });
    const intervalId = document.getElementById("adt-mapping-results");
    if (intervalId) {
      intervalId.textContent =
        "Showing " + scrollY + " of " + percent.length + " events";
    }
  }
  function activeSec() {
    const tickCount = [
      ["Event", "Category", "Trigger", "Trigger Type", "Tags", "Variables"],
    ];
    payload.forEach(([saveTick, isActive]) => {
      const lastTick = detail(saveTick);
      const milestones = isActive.triggers
        .map((firedMilestones) => firedMilestones.name)
        .join(" | ");
      const pagePath = [
        ...new Set(isActive.triggers.map((scrollHeight) => scrollHeight.type)),
      ].join(" | ");
      const viewportH = isActive.tags
        .map((scrollPct) => scrollPct.name)
        .join(" | ");
      const threshold = new Set();
      isActive.tags.forEach((tolerance) =>
        tolerance.parameter?.["forEach"]((evt) => {
          if (
            typeof evt.value === "string" &&
            evt.value.startsWith("{{") &&
            evt.value.endsWith("}}")
          ) {
            threshold.add(evt.value.slice(0x2, -0x2));
          }
        }),
      );
      tickCount.push([
        saveTick,
        lastTick,
        milestones || "(none)",
        pagePath || "direct push",
        viewportH || "(none)",
        Array.from(threshold).join(" | ") || "(none)",
      ]);
    });
    const item = tickCount
      .map((key) =>
        key.map((err) => '"' + err + '"').join(","),
      )
      .join("\n");
    const idx = new Blob([item], {
      type: "text/csv",
    });
    const len = URL.createObjectURL(idx);
    const mode = document.createElement("a");
    mode.href = len;
    mode.download =
      "adt-event-mapping-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(mode);
    mode.click();
    document.body.removeChild(mode);
    URL.revokeObjectURL(len);
  }
  function typeVal() {
    const nameVal = document.getElementById("adt-event-breakdown");
    const opts = window.latestExportJson;
    if (!nameVal || !opts) {
      return;
    }
    const ref = opts.gtm?.["containerVersion"]
      ? opts.gtm
      : opts;
    const val = ref.containerVersion?.["tag"] || [];
    const obj = ref.containerVersion?.["trigger"] || [];
    const fn = Object.fromEntries(
      obj.map((arg) => [arg.triggerId, arg]),
    );
    const tmp = (node) => {
      const list = node.parameter?.["find"](
        (entry) => entry.key === "eventName",
      );
      if (list?.["value"]) {
        return (list.value || "").trim().toLowerCase();
      }
      if (node.type === "html") {
        const state = node.parameter?.["find"](
          (ctx) => ctx.key === "html",
        );
        if (state?.["value"]) {
          const data = state.value.match(/'event'\s*:\s*'([^']+)'/);
          if (data) {
            return (data[1] || "").trim().toLowerCase();
          }
        }
      }
      return (node.name || "unnamed_event" || "").trim().toLowerCase();
    };
    config = {};
    val.forEach((row) => {
      const col = tmp(row);
      if (!config[col]) {
        config[col] = {
          trigger: null,
          tags: [],
          label: col,
          triggers: [],
        };
      }
      config[col].tags.push(row);
      (row.firingTriggerId || []).forEach((mapVal) => {
        const setVal = fn[mapVal];
        if (
          setVal &&
          !config[col].triggers.some(
            (buf) => buf.triggerId === mapVal,
          )
        ) {
          config[col].triggers.push(setVal);
          if (!config[col].trigger) {
            config[col].trigger = setVal;
          }
        }
      });
    });
    const raw = [
      "purchase",
      "refund",
      "add_to_cart",
      "remove_from_cart",
      "begin_checkout",
      "view_cart",
      "view_item",
      "view_item_list",
      "page_view",
      "formSubmit",
      "sectionEngagement",
      "scrollDepth",
      "timeOnPage",
      "hoverIntent",
      "video_progress",
      "lastEngagedSection",
      "contentStats",
      "scrollBackUp",
      "lastContentTypeViewed",
      "defaultClicks",
      "view_promotion",
      "select_promotion",
      "select_item",
    ];
    raw.forEach((parsed) => {
      const text = (parsed || "").trim().toLowerCase();
      const html = Object.keys(config).some(
        (cmpName) => (cmpName || "").trim().toLowerCase() === text,
      );
      if (!html) {
        config[text] = {
          trigger: {
            name: "(none)",
            type: "direct push",
          },
          tags: [],
          label: parsed,
          triggers: [],
        };
      }
    });
    const handler = {};
    Object.entries(config).forEach(([callback, response]) => {
      const request = (callback || "").trim().toLowerCase();
      if (!handler[request]) {
        handler[request] = [];
      }
      handler[request].push([callback, response]);
    });
    Object.entries(handler).forEach(([fields, formId]) => {
      const fieldId = formId.some(
        ([, cartAdds]) => cartAdds.trigger?.["type"] !== "direct push",
      );
      if (fieldId) {
        formId.forEach(([cartRemoves, sessionInfo]) => {
          if (sessionInfo.trigger?.["type"] === "direct push") {
            delete config[cartRemoves];
          }
        });
      }
    });
    payload = Object.entries(config).filter(
      ([, hookData]) =>
        hookData.trigger?.["type"] !== "direct push" ||
        hookData.tags.length > 0,
    );
    const pixelEvt =
      localStorage.getItem("adt_metadata_details_open") === "true";
    let overlayEvt = localStorage.getItem("adt_event_breakdown_mode");
    if (!overlayEvt && window.ADTData?.["eventFormatMode"]) {
      overlayEvt = window.ADTData.eventFormatMode;
    }
    if (overlayEvt !== "minimal" && overlayEvt !== "detailed") {
      overlayEvt = "detailed";
    }
    const filterEvt = {
      events: payload.length,
      triggers: obj.length,
      tags: val.length,
      categories: {
        engagement: payload.filter(
          ([searchParams]) => detail(searchParams) === "engagement",
        ).length,
        ecommerce: payload.filter(
          ([clickId]) => detail(clickId) === "ecommerce",
        ).length,
        forms: payload.filter(
          ([utmData]) => detail(utmData) === "forms",
        ).length,
        video: payload.filter(
          ([cookieVal]) => detail(cookieVal) === "video",
        ).length,
        other: payload.filter(
          ([cookieKey]) => detail(cookieKey) === "other",
        ).length,
      },
    };
    const consentRaw =
      '\n<span class="adt-breakdown-toggle" style="display:flex; align-items:center; gap:12px;">\n  <button id="adt-toggle-breakdown-minimal" aria-pressed="' +
      (overlayEvt === "minimal") +
      '" style="font-size:12px;border:none;background:none;cursor:pointer;margin-right:10px;color:' +
      (overlayEvt === "minimal" ? "#1e8c3a" : "#333") +
      '">' +
      (ADTData?.["i18n"]?.["label_minimal"] || "Minimal") +
      '</button>\n  <button id="adt-toggle-breakdown-detailed" aria-pressed="' +
      (overlayEvt === "detailed") +
      '" style="font-size:12px;border:none;background:none;cursor:pointer;color:' +
      (overlayEvt === "detailed" ? "#1e8c3a" : "#333") +
      '">' +
      (ADTData?.["i18n"]?.["label_detailed"] || "Detailed") +
      "</button>\n</span>\n";
    const consentObj =
      '\n<summary style="font-size:15px;font-weight:600;display:flex;align-items:center;justify-content:space-between;cursor:pointer;">\n  <span style="display:flex;align-items:center;gap:6px;">\n\t<svg class="adt-chevron" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; transition: transform 0.2s;">\n\t  <polyline points="6 9 12 15 18 9"/>\n\t</svg> \n    🎯 ' +
      (ADTData?.["i18n"]?.["label_event"] || "Event") +
      " Mapping\n  </span>\n  " +
      consentRaw +
      "\n</summary>\n";
    const prevConsent =
      '\n<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;padding:12px 16px;background:#f9f9f9;border-radius:6px;margin:16px 0;">\n  <div style="flex:1;min-width:200px;">\n    <input type="text" id="adt-event-search" placeholder="Search events..." style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:4px;font-size:13px;" />\n  </div>\n  \n  <div style="display:flex;gap:8px;flex-wrap:wrap;">\n    <button class="adt-category-filter ' +
      (adtData === "all" ? "active" : "") +
      '" data-category="all" style="padding:6px 12px;border:1px solid #ddd;background:' +
      (adtData === "all" ? "#0073aa" : "white") +
      ";color:" +
      (adtData === "all" ? "white" : "#333") +
      ';border-radius:4px;cursor:pointer;font-size:12px;font-weight:600;">All (' +
      filterEvt.events +
      ')</button>\n    <button class="adt-category-filter ' +
      (adtData === "engagement" ? "active" : "") +
      '" data-category="engagement" style="padding:6px 12px;border:1px solid #ddd;background:' +
      (adtData === "engagement" ? "#0073aa" : "white") +
      ";color:" +
      (adtData === "engagement" ? "white" : "#333") +
      ';border-radius:4px;cursor:pointer;font-size:12px;font-weight:600;">Engagement (' +
      filterEvt.categories.engagement +
      ')</button>\n    <button class="adt-category-filter ' +
      (adtData === "ecommerce" ? "active" : "") +
      '" data-category="ecommerce" style="padding:6px 12px;border:1px solid #ddd;background:' +
      (adtData === "ecommerce" ? "#0073aa" : "white") +
      ";color:" +
      (adtData === "ecommerce" ? "white" : "#333") +
      ';border-radius:4px;cursor:pointer;font-size:12px;font-weight:600;">E-commerce (' +
      filterEvt.categories.ecommerce +
      ')</button>\n    <button class="adt-category-filter ' +
      (adtData === "forms" ? "active" : "") +
      '" data-category="forms" style="padding:6px 12px;border:1px solid #ddd;background:' +
      (adtData === "forms" ? "#0073aa" : "white") +
      ";color:" +
      (adtData === "forms" ? "white" : "#333") +
      ';border-radius:4px;cursor:pointer;font-size:12px;font-weight:600;">Forms (' +
      filterEvt.categories.forms +
      ')</button>\n  </div>\n  \n  <button id="adt-export-csv" style="padding:6px 16px;border:1px solid #0073aa;background:white;color:#0073aa;border-radius:4px;cursor:pointer;font-size:12px;font-weight:600;margin-left:auto;">\n    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;">\n      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>\n    </svg>\n    Export CSV\n  </button>\n</div>\n\n<div id="adt-mapping-results" style="font-size:12px;color:#666;margin-bottom:8px;padding:0 4px;">Showing ' +
      filterEvt.events +
      " events</div>\n";
    let now =
      "<style>.adt-row-unwired td{color:#777;font-style:italic;} .adt-category-filter.active{font-weight:700;}</style>";
    if (overlayEvt === "minimal") {
      now +=
        '<details class="adt-section" id="adt-event-mapping-details" style="margin-top:1.5em;" ' +
        (pixelEvt ? "open" : "") +
        ">";
      now += consentObj;
      now += prevConsent;
      now +=
        '<ul style="margin:10px 0;padding-left:18px;font-size:13px;line-height:1.5;">';
      now +=
        payload
          .map(([last, diff]) => {
            const found = detail(last);
            const detected = diff.tags
              .map((retryCount) => retryCount.name)
              .join(", ");
            const maxRetries =
              found === "ecommerce"
                ? '<em style="color:#2e7d32;">ecommerce</em>'
                : found === "engagement"
                  ? '<em style="color:#1565c0;">engagement</em>'
                  : '<em style="color:#666;">' + found + "</em>";
            return (
              '<li class="adt-event-row" data-event="' +
              last +
              '" data-category="' +
              found +
              '"><strong>' +
              last +
              "</strong> " +
              maxRetries +
              " → " +
              (detected || "(no tags)") +
              "</li>"
            );
          })
          .join("") || "<li><em>No event-triggered tags found.</em></li>";
      now += "</ul></details>";
    } else {
      now +=
        '<details class="adt-section" id="adt-event-mapping-details" style="margin-top:1.5em;" ' +
        (pixelEvt ? "open" : "") +
        ">";
      now += consentObj;
      now += prevConsent;
      now +=
        '<div class="adt-table-container"><table class="adt-event-table"><thead style="position:sticky;top:0;background:#f9f9f9;z-index:1;"><tr>\n        <th style="text-align:left;border-bottom:1px solid #ccc;padding:6px;">' +
        (ADTData?.["i18n"]?.["label_event"] || "Event") +
        '</th>\n        <th style="text-align:left;border-bottom:1px solid #ccc;padding:6px;">' +
        (ADTData?.["i18n"]?.["label_trigger"] || "Trigger") +
        '</th>\n        <th style="text-align:left;border-bottom:1px solid #ccc;padding:6px;">' +
        (ADTData?.["i18n"]?.["label_tags"] || "Tags") +
        '</th>\n        <th style="text-align:left;border-bottom:1px solid #ccc;padding:6px;">' +
        (ADTData?.["i18n"]?.["label_variables"] || "Variables") +
        "</th>\n      </tr></thead><tbody>";
      now +=
        payload
          .map(([delayMs, timeoutMs]) => {
            const hasConsent = detail(delayMs);
            const blocked =
              timeoutMs.trigger?.["type"] === "direct push"
                ? "adt-row-unwired"
                : "";
            const wasBlocked =
              timeoutMs.triggers.length > 0
                ? timeoutMs.triggers
                    .map((analyticsOk) => analyticsOk.name)
                    .join(", ")
                : timeoutMs.trigger?.["name"] || "Unnamed";
            const marketingOk =
              wasBlocked +
              ' <span style="color:#999;font-size:11px;">(' +
              (timeoutMs.trigger?.["type"] || "unknown") +
              ")</span>";
            const extra = timeoutMs.tags
              .map(
                (source) =>
                  (source.name || "(unnamed)") + " " + flag(source),
              )
              .join("<br/>");
            const granted = new Set();
            timeoutMs.tags.forEach((previous) =>
              previous.parameter?.["forEach"]((storageErr) => {
                if (
                  typeof storageErr.value === "string" &&
                  storageErr.value.startsWith("{{") &&
                  storageErr.value.endsWith("}}")
                ) {
                  granted.add(storageErr.value.slice(0x2, -0x2));
                }
              }),
            );
            return (
              '<tr class="' +
              blocked +
              ' adt-event-row" data-event="' +
              delayMs +
              '" data-category="' +
              hasConsent +
              '">\n          <td style="padding:6px;border-bottom:1px solid #eee;"><strong>' +
              delayMs +
              '</strong></td>\n          <td style="padding:6px;border-bottom:1px solid #eee;font-size:13px;">' +
              marketingOk +
              '</td>\n          <td style="padding:6px;border-bottom:1px solid #eee;font-size:13px;">' +
              (extra || "<em>(none)</em>") +
              '</td>\n          <td style="padding:6px;border-bottom:1px solid #eee;font-size:11px;color:#666;">' +
              (Array.from(granted).join(", ") || "<em>(none)</em>") +
              "</td>\n        </tr>"
            );
          })
          .join("") ||
        '<tr><td colspan="4" style="padding:10px;"><em>No event-triggered tags found.</em></td></tr>';
      now += "</tbody></table></div></details>";
    }
    nameVal.innerHTML = now;
    const localA = document.getElementById("adt-event-search");
    if (localA) {
      localA.addEventListener("input", (localB) => {
        pattern(localB.target.value, adtData);
      });
    }
    const localC = document.querySelectorAll(".adt-category-filter");
    localC.forEach((localD) => {
      localD.addEventListener("click", (localE) => {
        adtData = localE.target.dataset.category;
        localStorage.setItem("adt_event_category_filter", adtData);
        localC.forEach((localF) => {
          localF.classList.remove("active");
          localF.style.background = "white";
          localF.style.color = "#333";
        });
        localE.target.classList.add("active");
        localE.target.style.background = "#0073aa";
        localE.target.style.color = "white";
        pattern(localA?.["value"] || "", adtData);
      });
    });
    const localG = document.getElementById("adt-export-csv");
    if (localG) {
      localG.addEventListener("click", activeSec);
    }
    const localH = document.getElementById("adt-event-mapping-details");
    if (localH) {
      const localI = localH.querySelector(".adt-breakdown-toggle");
      if (localI) {
        const localJ = () =>
          (localI.style.display = localH.open ? "inline" : "none");
        localI.style.display = localH.open ? "inline" : "none";
        localH.addEventListener("toggle", localJ);
      }
      localH.addEventListener("toggle", () =>
        localStorage.setItem("adt_metadata_details_open", localH.open),
      );
    }
    document
      .getElementById("adt-toggle-breakdown-minimal")
      ?.["addEventListener"]("click", (exportClick) => {
        exportClick.preventDefault();
        localStorage.setItem("adt_event_breakdown_mode", "minimal");
        typeVal();
      });
    document
      .getElementById("adt-toggle-breakdown-detailed")
      ?.["addEventListener"]("click", (filterClick) => {
        filterClick.preventDefault();
        localStorage.setItem("adt_event_breakdown_mode", "detailed");
        typeVal();
      });
    pattern("", adtData);
  }
  ADTPreviewUtils.waitForLatestExport(() => {
    typeVal();
    document
      .getElementById("adt-event-breakdown")
      ?.["setAttribute"]("data-ready", "true");
  });
  document.addEventListener("adtPreviewReady", () => {
    ADTPreviewUtils.waitForLatestExport(typeVal);
  });
  document.addEventListener("adtLanguageChange", typeVal);
  window.renderEventBreakdown = typeVal;
})();
