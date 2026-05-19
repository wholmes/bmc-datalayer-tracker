/*!
 * DataLayer Tracker - Admin AJAX Handler
 *
 * Handles GTM preview export and setting persistence
 *
 * @preserve
 * @package    DataLayer_Tracker
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
(function () {
  if (window._adtAdminScriptLoaded) {
    return;
  }
  setTimeout(() => {
    if (typeof ADTExportUtils?.["bindExportButtons"] !== "function") {
    }
  }, 500);
  window._adtAdminScriptLoaded = true;
  window.latestExportJson = null;
  window.adtShowToast =
    window.adtShowToast ||
    function (adtData, config = "success") {
      let payload = document.getElementById("adt-toast");
      if (!payload) {
        payload = document.createElement("div");
        payload.id = "adt-toast";
        payload.style.cssText =
          "\n        position: fixed;\n        bottom: 20px;\n        right: 20px;\n        padding: 10px 16px;\n        border-radius: 4px;\n        z-index: 9999;\n        color: #fff;\n        box-shadow: 0 2px 6px rgba(0,0,0,0.2);\n        opacity: 0;\n        transition: opacity 0.3s;\n      ";
        document.body.appendChild(payload);
      }
      payload.textContent = adtData;
      const eventName = {
        success: "#00a32a",
        error: "#d63638",
        warning: "#dba617",
        info: "#2271b1",
        default: "#646970",
      };
      payload.style.background = eventName[config] || "#646970";
      payload.style.opacity = 1;
      setTimeout(() => {
        payload.style.opacity = 0;
        setTimeout(() => payload.remove(), 0x12c);
      }, 0xbb8);
    };
  function detail(element) {
    if (!element || typeof element !== "object") {
      return "<p>⚠️ Invalid export.</p>";
    }
    const target = element.summary || {};
    const result =
      element.gtm ||
      (element.exportFormatVersion && element.containerVersion
        ? element
        : null);
    const value = Number.isInteger(target.tag_count)
      ? target.tag_count
      : Array.isArray(result?.["containerVersion"]?.["tag"])
        ? result.containerVersion.tag.length
        : 0;
    const flag = Number.isInteger(target.trigger_count)
      ? target.trigger_count
      : Array.isArray(result?.["containerVersion"]?.["trigger"])
        ? result.containerVersion.trigger.length
        : 0;
    const enabled = Number.isInteger(target.variable_count)
      ? target.variable_count
      : Array.isArray(result?.["containerVersion"]?.["variable"])
        ? result.containerVersion.variable.length
        : 0;
    const url = {
      raw: "Raw JSON Export",
      fallback: "Plugin Settings (Fallback)",
      filtered: "Selected Features",
    };
    const pattern = (element.mode || "filtered").toLowerCase();
    const regex = url[pattern] || pattern;
    let depth = "None";
    if (
      Array.isArray(element.featuresIncluded) &&
      element.featuresIncluded.length > 0
    ) {
      const percent = element.featuresIncluded.length;
      const scrollY = element.featuresIncluded.join(", ");
      depth =
        percent +
        '<br><span style="font-size: 11px; color: #666; line-height: 1.6;">' +
        scrollY +
        "</span>";
    }
    const scrollTop = new Date().toLocaleString();
    const pageKey = element.canUsePremium === true ? "✅ Enabled" : "—";
    const firedSet = element.debug ? "ON" : "OFF";
    const milestone = element.fallbackTrackWithoutCMP ? "ON" : "OFF";
    const timerId = element.pluginVersion || "n/a";
    let intervalId = "None";
    if (
      element.pixelEventMap &&
      typeof element.pixelEventMap === "object"
    ) {
      const activeSec = [
        ...new Set(Object.values(element.pixelEventMap).flat()),
      ];
      intervalId = activeSec.length ? activeSec.join(", ") : "None";
    } else {
      if (
        element.pixelSettings &&
        typeof element.pixelSettings === "object"
      ) {
        const tickCount = Object.keys(element.pixelSettings);
        intervalId = tickCount.length ? tickCount.join(", ") : "None";
      }
    }
    return (
      '\n     <div class="adt-metadata-banner" style="\n       background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n       color: white;\n       padding: 20px 24px;\n       border-radius: 8px;\n       margin-bottom: 20px;\n       box-shadow: 0 4px 12px rgba(0,0,0,0.15);\n     ">\n       <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">\n        \n         <!-- Export Time -->\n         <div>\n           <div style="font-size: 11px; text-transform: uppercase; opacity: 0.85; letter-spacing: 0.5px; margin-bottom: 4px;">\n             ' +
      (ADTData?.["i18n"]?.["label_export_time"] || "Export Time") +
      '\n           </div>\n           <div style="font-size: 14px; font-weight: 600;">' +
      scrollTop +
      '</div>\n         </div>\n\n         <!-- Tags -->\n         <div>\n           <div style="font-size: 11px; text-transform: uppercase; opacity: 0.85; letter-spacing: 0.5px; margin-bottom: 4px;">\n             ' +
      (ADTData?.["i18n"]?.["label_tag_count"] || "Tags") +
      '\n           </div>\n           <div style="font-size: 14px; font-weight: 600;">' +
      value +
      '</div>\n         </div>\n\n         <!-- Triggers -->\n         <div>\n           <div style="font-size: 11px; text-transform: uppercase; opacity: 0.85; letter-spacing: 0.5px; margin-bottom: 4px;">\n             ' +
      (ADTData?.["i18n"]?.["label_trigger_count"] || "Triggers") +
      '\n           </div>\n           <div style="font-size: 14px; font-weight: 600;">' +
      flag +
      '</div>\n         </div>\n\n         <!-- Variables -->\n         <div>\n           <div style="font-size: 11px; text-transform: uppercase; opacity: 0.85; letter-spacing: 0.5px; margin-bottom: 4px;">\n             ' +
      (ADTData?.["i18n"]?.["label_variable_count"] || "Variables") +
      '\n           </div>\n           <div style="font-size: 14px; font-weight: 600;">' +
      enabled +
      '</div>\n         </div>\n\n         <!-- Mode -->\n         <div>\n           <div style="font-size: 11px; text-transform: uppercase; opacity: 0.85; letter-spacing: 0.5px; margin-bottom: 4px;">\n             ' +
      (ADTData?.["i18n"]?.["label_mode"] || "Mode") +
      '\n           </div>\n           <div style="font-size: 14px; font-weight: 600;">' +
      regex +
      '</div>\n         </div>\n\n         <!-- Features - UPDATED WITH COUNT -->\n         <div style="grid-column: 1 / -1;">\n           <div style="font-size: 11px; text-transform: uppercase; opacity: 0.85; letter-spacing: 0.5px; margin-bottom: 4px;">\n             ' +
      (ADTData?.["i18n"]?.["label_features"] || "Features") +
      '\n           </div>\n           <div style="font-size: 14px; font-weight: 600; line-height: 1.8;">' +
      depth +
      '</div>\n         </div>\n\n         <!-- Premium Status -->\n         <div>\n           <div style="font-size: 11px; text-transform: uppercase; opacity: 0.85; letter-spacing: 0.5px; margin-bottom: 4px;">\n             Premium\n           </div>\n           <div style="font-size: 14px; font-weight: 600;">' +
      pageKey +
      '</div>\n         </div>\n\n         <!-- Debug Mode -->\n         <div>\n           <div style="font-size: 11px; text-transform: uppercase; opacity: 0.85; letter-spacing: 0.5px; margin-bottom: 4px;">\n             Debug\n           </div>\n           <div style="font-size: 14px; font-weight: 600;">' +
      firedSet +
      '</div>\n         </div>\n\n         <!-- Fallback Tracking -->\n         <div>\n           <div style="font-size: 11px; text-transform: uppercase; opacity: 0.85; letter-spacing: 0.5px; margin-bottom: 4px;">\n             No-CMP Fallback\n           </div>\n           <div style="font-size: 14px; font-weight: 600;">' +
      milestone +
      "</div>\n         </div>\n\n         <!-- Pixel Platforms -->\n         " +
      (intervalId !== "None"
        ? '\n         <div style="grid-column: 1 / -1;">\n           <div style="font-size: 11px; text-transform: uppercase; opacity: 0.85; letter-spacing: 0.5px; margin-bottom: 4px;">\n             Pixel Platforms\n           </div>\n           <div style="font-size: 14px; font-weight: 600;">' +
          intervalId +
          "</div>\n         </div>\n         "
        : "") +
      '\n\n         <!-- Plugin Version -->\n         <div>\n           <div style="font-size: 11px; text-transform: uppercase; opacity: 0.85; letter-spacing: 0.5px; margin-bottom: 4px;">\n             Plugin Version\n           </div>\n           <div style="font-size: 14px; font-weight: 600;">' +
      timerId +
      "</div>\n         </div>\n\n       </div>\n     </div>\n   "
    );
  }
  async function saveTick(isActive, lastTick = "1") {
    window.adtDebug("saveADTSetting called with:", isActive, lastTick);
    const milestones =
      document.querySelector(
        'input[type="checkbox"][data-adt-setting="' + isActive + '"]',
      ) || document.querySelector('[data-adt-setting="' + isActive + '"]');
    window.adtDebug(
      "Element found:",
      milestones,
      "checked:",
      milestones?.["checked"],
    );
    if (milestones) {
      milestones.classList.add("adt-saving");
    }
    const firedMilestones = milestones?.["type"] || "text";
    try {
      const pagePath = await adtPostWithRetry("adt_save_setting", {
        key: isActive,
        value: lastTick,
        type: firedMilestones,
      });
      if (!pagePath?.["success"]) {
        throw new Error(pagePath?.["data"]?.["message"] || "Unknown error");
      }
      adtShowToast(pagePath.data?.["message"] || "Saved ✓", "success");
      document.dispatchEvent(
        new CustomEvent("adtSettingUpdated", {
          detail: {
            key: isActive,
            value: pagePath.data?.["value"] ?? lastTick,
          },
        }),
      );
      if (pagePath.data?.["cachePurged"]) {
        adtShowToast("LiteSpeed cache purged ✓", "info");
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: "cache_purged",
          method: "litespeed",
          setting: isActive,
          timestamp: new Date().toISOString(),
        });
        if (isActive === "enable_debug_overlay") {
          adtShowToast("Refresh page to see changes", "info");
        }
      }
      return pagePath.data;
    } catch (scrollHeight) {
      adtShowToast(scrollHeight.message || "Save failed", "error");
      throw scrollHeight;
    } finally {
      if (milestones) {
        milestones.classList.remove("adt-saving");
      }
    }
  }
  function viewportH(scrollPct) {
    if (["checkbox", "radio"].includes(scrollPct.type)) {
      return scrollPct.checked ? "1" : "0";
    }
    if (scrollPct.tagName === "SELECT" && scrollPct.multiple) {
      return Array.from(scrollPct.selectedOptions)
        .map((threshold) => threshold.value)
        .join(",");
    }
    return scrollPct.value;
  }
  function tolerance() {
    const evt = document.getElementById("adt-preview-notice");
    if (!evt) {
      return;
    }
    evt.textContent =
      "Settings have changed. Click “Preview” again to update your export.";
    evt.style.display = "block";
    evt.style.opacity = 0;
    requestAnimationFrame(() => {
      evt.style.transition = "opacity 0.4s ease";
      evt.style.opacity = 1;
    });
  }
  function item() {
    document.addEventListener(
      "change",
      (key) => {
        if (!key.target?.["dataset"]?.["adtSetting"]) {
          return;
        }
        window.adtDebug(
          "Change detected:",
          key.target.dataset.adtSetting,
          key.target.type,
        );
        const err = key.target.dataset.adtSetting;
        const idx = viewportH(key.target);
        if (err === "pixel_event_map_json") {
          if (!idx.trim()) {
            key.target.style.borderColor = "";
            saveTick(err, "");
            tolerance();
            return;
          }
          try {
            JSON.parse(idx);
            key.target.style.borderColor = "";
          } catch {
            toast("Invalid JSON – not saved.", false);
            key.target.style.borderColor = "red";
            return;
          }
        }
        saveTick(err, idx);
        tolerance();
      },
      false,
    );
    document.addEventListener(
      "blur",
      (len) => {
        if (!len.target?.["dataset"]?.["adtSetting"]) {
          return;
        }
        const mode = len.target.dataset.adtSetting;
        const typeVal = viewportH(len.target);
        if (mode === "pixel_event_map_json") {
          if (!typeVal.trim()) {
            len.target.style.borderColor = "";
            saveTick(mode, "");
            tolerance();
            return;
          }
          try {
            JSON.parse(typeVal);
            len.target.style.borderColor = "";
          } catch {
            toast("Invalid JSON – not saved.", false);
            len.target.style.borderColor = "red";
            return;
          }
        }
        saveTick(mode, typeVal);
        tolerance();
      },
      true,
    );
  }
  function nameVal() {
    const opts = document.querySelector(
      '[data-adt-setting="delay_until_consent"]',
    );
    const ref = document.querySelector(
      '[data-adt-setting="fallback_track_without_cmp"]',
    );
    if (!opts || !ref) {
      return;
    }
    function val(obj = false) {
      if (opts.checked) {
        const fn = ref.checked;
        ref.disabled = true;
        ref.checked = false;
        ref.style.opacity = "0.5";
        let arg = ref
          .closest("tr")
          ?.["querySelector"](".adt-conflict-msg");
        if (!arg) {
          arg = document.createElement("p");
          arg.className = "adt-conflict-msg description";
          arg.style.color = "#d63638";
          arg.innerHTML =
            '⚠️ Disabled because "Delay until consent" is enabled';
          ref.closest("td")?.["appendChild"](arg);
        }
        arg.style.display = "block";
        if (obj || fn) {
          saveTick("fallback_track_without_cmp", "0");
        }
      } else {
        ref.disabled = false;
        ref.style.opacity = "1";
        const tmp = ref
          .closest("tr")
          ?.["querySelector"](".adt-conflict-msg");
        if (tmp) {
          tmp.style.display = "none";
        }
      }
    }
    val(false);
    opts.addEventListener("change", () => val(true));
  }
  document.addEventListener("DOMContentLoaded", nameVal);
  async function node(list = false) {
    const entry = document.getElementById("adt-export-preview");
    const state = window.ADT_FEATURE_KEYS || [];
    const ctx = new URLSearchParams({
      action: "adt_preview_gtm_export",
      security: ADTData.nonce,
    });
    const data = localStorage.getItem("adt_export_mode") || "settings";
    if (data === "settings") {
      ctx.append("mode", "fallback");
    } else {
      const row = [];
      state.forEach((col) => {
        const mapVal = document.querySelector(
          '[data-adt-feature="' + col + '"]',
        );
        if (mapVal?.["checked"]) {
          ctx.append("include_" + col, "1");
          row.push(col);
        }
      });
      if (row.length === 0) {
        ctx.append("mode", "fallback");
      } else {
        ctx.append("mode", "filtered");
      }
    }
    try {
      const setVal = document.getElementById("adt-export-preview");
      if (setVal) {
        ADTLoader.show();
      }
      const buf = await fetch(ADTData.ajax_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        credentials: "same-origin",
        body: ctx.toString(),
      });
      if (buf.status === 0x193 && !list) {
        const raw = await refreshADTNonce();
        if (raw) {
          return node(true);
        }
      }
      if (!buf.ok) {
        throw new Error(
          "[ADT] ❌ Server responded with " +
            buf.status +
            " " +
            buf.statusText,
        );
      }
      const parsed = await buf.text();
      let text;
      try {
        text = JSON.parse(parsed);
      } catch (html) {
        throw new Error(
          "❌ Export failed. Server response was not valid JSON.",
        );
      }
      if (!text.success || !text.data) {
        throw new Error("❌ Export failed. Response missing expected data.");
      }
      window.setExportJsonAndInit(text.data);
      ADTExportUtils.waitForADTExportHistory(() => {});
      const cmpName = document.getElementById("adt-export-metadata");
      if (cmpName) {
        cmpName.innerHTML = detail(text.data);
      }
      if (!setVal) {
        window.adtWarn("⛔ Cannot render preview: missing preview element.");
      } else {
        const handler = (
          ADTData.previewMode ||
          localStorage.getItem("adt_preview_mode") ||
          "raw"
        ).toLowerCase();
        localStorage.setItem("adt_preview_mode", handler);
        window.latestExportJson = window.latestExportJson || text.data;
        if (
          !window.latestExportJson ||
          typeof window.latestExportJson !== "object"
        ) {
          window.adtWarn("⛔ Cannot render preview: export JSON not loaded.");
        } else {
          if (!window.latestExportJson.containerVersion) {
            window.adtWarn(
              "⛔ Cannot render preview: containerVersion is missing.",
            );
          } else {
            if (["raw", "json"].includes(handler)) {
              setVal.style.padding = "16px";
              setVal.style.background = "#f8f8f8";
              setVal.style.border = "1px solid #ddd";
              setVal.style.fontFamily = "'Courier New', monospace";
              setVal.innerHTML =
                '<div style="text-align:center;padding:20px;color:#666;">Rendering JSON...</div>';
              requestAnimationFrame(() => {
                setVal.innerHTML = ADTExportUtils.renderStyledJSON(
                  window.latestExportJson,
                );
                window.adtDebug("🧾 Preview rendered in raw/json mode.");
                ADTLoader.hide();
              });
            } else {
              if (typeof window.renderExportSummary === "function") {
                setVal.style.padding = "0";
                setVal.style.background = "transparent";
                setVal.style.border = "none";
                setVal.style.fontFamily = "inherit";
                setVal.innerHTML = "";
                window.renderExportSummary(window.latestExportJson);
                const callback = document.getElementById(
                  "adt-format-json-btn",
                );
                if (callback) {
                  callback.style.display = "none";
                  callback.disabled = false;
                  callback.innerHTML =
                    '<span class="dashicons dashicons-admin-appearance" style="vertical-align: middle;"></span> Format JSON';
                }
                window.adtDebug("📄 Preview rendered in summary mode.");
                ADTLoader.hide();
              } else {
                setVal.innerHTML =
                  "<p><em>Summary view not available.</em></p>";
                window.adtWarn("⚠️ No summary renderer found.");
                ADTLoader.hide();
              }
            }
          }
        }
      }
      setTimeout(() => {
        let response = document.getElementById("adt-event-breakdown");
        if (!response) {
          response = document.createElement("div");
          response.id = "adt-event-breakdown";
          response.style.marginTop = "1em";
          const request = document.getElementById("adt-preview-container");
          if (request && request.parentNode) {
            request.parentNode.insertBefore(response, request.nextSibling);
          } else if (setVal?.["parentNode"]) {
            setVal.parentNode.insertBefore(response, setVal.nextSibling);
          }
        }
        if (typeof window.renderEventBreakdown === "function") {
          window.renderEventBreakdown();
        }
      }, 50);
      document.dispatchEvent(new CustomEvent("adtPreviewReady"));
    } catch (fields) {
      window.adtError("Fetch Error:", fields);
      if (entry) {
        entry.textContent = "⚠️ Failed to fetch preview.";
      }
      ADTLoader.hide();
    }
  }
  window.refreshADTNonce = async function formId() {
    try {
      const fieldId = await fetch(ADTData.ajax_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        credentials: "same-origin",
        body: new URLSearchParams({
          action: "adt_refresh_nonce",
          security: ADTData.nonce,
        }),
      });
      if (!fieldId.ok) {
        window.adtWarn(
          "❌ Failed to refresh nonce: " +
            fieldId.status +
            " " +
            fieldId.statusText,
        );
        return false;
      }
      let cartAdds;
      try {
        cartAdds = await fieldId.json();
      } catch (cartRemoves) {
        window.adtError(
          "❌ Failed to parse nonce refresh response:",
          cartRemoves,
        );
        return false;
      }
      return cartAdds.success && cartAdds.data?.["newNonce"]
        ? ((ADTData.nonce = String(cartAdds.data.newNonce || "").trim()), true)
        : (window.adtWarn("❌ Server returned invalid nonce data:", cartAdds),
          false);
    } catch (sessionInfo) {
      window.adtError("❌ Error during nonce refresh:", sessionInfo);
      return false;
    }
  };
  function hookData() {
    const pixelEvt = document.getElementById("adt-preview-button");
    if (!pixelEvt) {
      return;
    }
    if (document.getElementById("adt-preview-notice")) {
      return;
    }
    const overlayEvt = document.createElement("div");
    overlayEvt.id = "adt-preview-notice";
    overlayEvt.className = "adt-notice";
    overlayEvt.style.cssText =
      "\n\t    display: none;\n\t    background: #fffbea;\n\t    border: 1px solid #ffe58f;\n\t    padding: 8px 12px;\n\t    margin-bottom: 12px;\n\t    border-radius: 6px;\n\t    font-size: 14px;\n\t    color: #664d03;\n\t    font-weight: 500;\n\t    box-shadow: 0 1px 2px rgba(0,0,0,0.04);\n\t  ";
    pixelEvt.parentElement.insertBefore(overlayEvt, pixelEvt);
  }
  function filterEvt() {
    const searchParams = document.getElementById("adt-export-preview-btn");
    if (!searchParams || searchParams.dataset.bound === "true") {
      return;
    }
    searchParams.dataset.bound = "true";
    searchParams.addEventListener("click", (clickId) => {
      clickId.preventDefault();
      node();
    });
  }
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".adt-tab-btn").forEach((utmData) => {
      utmData.addEventListener("click", () => {
        const cookieVal = utmData.getAttribute("data-target");
        const cookieKey = cookieVal.replace("section-", "");
        const consentRaw = new URL(window.location);
        consentRaw.searchParams.set("tab", cookieKey);
        history.replaceState(null, "", consentRaw);
        document
          .querySelectorAll(".adt-tab-btn, .adt-tab-content")
          .forEach((consentObj) => consentObj.classList.remove("active"));
        utmData.classList.add("active");
        document.getElementById(cookieVal)?.["classList"]["add"]("active");
        if (cookieKey === "adt_gtm_export") {
          setTimeout(filterEvt, 100);
        }
      });
    });
    document.addEventListener(
      "ADTDataReady",
      () => {
        if (!ADTData?.["nonce"] || ADTData.nonce === "undefined") {
          console.warn(
            "[ADT] ⛔ Skipping preview logic — nonce is missing or invalid.",
          );
          return;
        }
        if (window.ADTExportUtils?.["bindExportButtons"]) {
          ADTExportUtils.bindExportButtons();
        }
        item();
        filterEvt();
        hookData();
        const prevConsent = (
          ADTData.previewMode ||
          localStorage.getItem("adt_preview_mode") ||
          "raw"
        ).toLowerCase();
        localStorage.setItem("adt_preview_mode", prevConsent);
        const now = new URLSearchParams(window.location.search).get(
          "tab",
        );
        const last = now || "adt_page_context";
        const diff = document.querySelector(
          '.adt-tab-btn[data-target="section-' + last + '"]',
        );
        const found = document.getElementById("section-" + last);
        if (diff && found) {
          document
            .querySelectorAll(".adt-tab-btn, .adt-tab-content")
            .forEach((detected) => detected.classList.remove("active"));
          diff.classList.add("active");
          found.classList.add("active");
          if (last === "adt_gtm_export") {
            setTimeout(filterEvt, 0x96);
          }
        }
      },
      {
        once: true,
      },
    );
    if (typeof ADTData !== "undefined") {
      setTimeout(() => {
        document.dispatchEvent(new Event("ADTDataReady"));
      }, 50);
    }
  });
  window.fetchGTMPreview = node;
})();
