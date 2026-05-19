/*!
 * DataLayer Tracker - Debug Overlay Markup
 *
 * Handles all HTML generation and DOM manipulation
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

  window.ADTMarkup = {
    createOverlayHTML: function () {
      return (
        '\n        <header class="header">\n          <div style="width:150px;">\n            \n            <span style="display:inline-block; margin-top:10px">\n              <strong>DataLayer Tracker</strong>\n            </span>\n          </div>\n          <div class="adt-header-actions">\n            <span id="adt-ov-toggle" class="ov-arrow" title="Toggle" style="cursor: pointer; display: inline-block;">\n              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">\n                <polyline points="6 8 10 12 14 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>\n              </svg>\n            </span>\n          </div>\n        </header>\n\n        <section id="adt-ov-controls" style="display:flex;flex-direction:column;gap:0px;">\n          <div class="adt-dual-status" id="adt-dual-status">\n            <div class="adt-dual-left"></div>\n          </div>\n\n  \t\t  <div class="adt-controls-row">\n            <button id="adt-download-pinned" class="adt-control-btn" title="Download Pinned Events">\n              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">\n                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>\n              </svg>\n              <span>Save Pins</span>\n            </button>\n    \n            <label class="adt-control-btn" for="adt-scroll-lock" title="Lock scroll to bottom">\n              <input type="checkbox" id="adt-scroll-lock" />\n              <span>LOCK SCROLL</span>\n            </label>\n          </div>\n        \n          ' +
        (window.ADTData?.["is_ip_excluded"]
          ? '\n            <div style="background:#ff6b35;color:#fff;padding:8px;border-radius:6px;font-size:11px;font-weight:600;text-align:center;margin:8px 0;">\n              🚫 IP EXCLUDED - Tracking Disabled<br>\n              <span style="font-size:10px;font-weight:normal;opacity:0.9;">Your IP is excluded from all tracking</span>\n            </div>\n          '
          : "") +
        '\n  \n  \t  \t  <fieldset id="adt-filter-fieldset" style="border:1px solid #444; padding:4px 6px; border-radius:6px; margin-bottom:0px; margin-top:0px;">\n            <legend style="font-size:10px;color:#999;">Event Filters</legend>\n            <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;">\n              <label><input type="checkbox" id="filter-ecom" checked> Ecommerce</label>\n              <label><input type="checkbox" id="filter-form" checked> Forms</label>\n              <label><input type="checkbox" id="filter-engagement" checked> Engagement</label>\n              <label><input type="checkbox" id="filter-other" checked> Other</label>\n            </div>\n          </fieldset>\n\n          ' +
        this.createSDKStatusHTML() +
        '\n\n          <select id="adt-event-dropdown" style="width:100%; font-size:11px; padding:4px 6px;border-radius:4px; border:none; background:var(--ctrl);color:var(--fg);">\n            <option value="">All Events</option>\n          </select>\n\n          <input id="adt-search" \n                 type="search" \n                 placeholder="Search events…"\n                 style="width:100%; font-size:11px; padding:4px 6px; border-radius:4px; border:none; background:#111; color:var(--fg);" />\n        </section>\n\n        <button id="adt-clear-events"\n                style="margin-left:auto; font-size:10px; padding:2px 6px; border:none; border-radius:4px; background:#333; color:#eee; cursor:pointer;">\n          ✕ Clear\n        </button>\n\n        <section id="adt-ov-body">\n          <div id="adt-ov-intent" role="status" aria-live="polite" aria-label="User Intent Summary"></div>\n          <ol id="adt-ov-events"></ol>\n        </section>\n\n        <div class="adt-resize-handle"></div>\n      '
      );
    },
    createSDKStatusHTML: function () {
      if (window.ADTData?.["show_sdk_status"] !== "1") {
        return "";
      }
      return '\n\t    <!-- PIXEL SDK STATUS PANEL -->\n\t    <section id="adt-ov-status" class="adt-box">\n\t      <header class="adt-box-header">\n\t        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"\n\t             xmlns="http://www.w3.org/2000/svg">\n\t          <rect x="3" y="3" width="18" height="18" rx="2" stroke="white" stroke-width="2"/>\n\t          <rect x="7" y="7" width="2" height="2" fill="white"/>\n\t          <rect x="11" y="7" width="2" height="2" fill="white"/>\n\t          <rect x="15" y="7" width="2" height="2" fill="white"/>\n\t          <rect x="7" y="11" width="2" height="2" fill="white"/>\n\t          <rect x="11" y="11" width="2" height="2" fill="white"/>\n\t          <rect x="15" y="11" width="2" height="2" fill="white"/>\n\t          <rect x="7" y="15" width="2" height="2" fill="white"/>\n\t          <rect x="11" y="15" width="2" height="2" fill="white"/>\n\t          <rect x="15" y="15" width="2" height="2" fill="white"/>\n\t        </svg>\n\t        <span>Pixel SDKs Detected</span>\n\t        <span id="adt-toggle-sdk" title="Toggle SDK list"\n\t              style="cursor:pointer;float:right;display:inline-flex;align-items:center;">\n\t          <svg id="adt-sdk-arrow" width="12" height="12" viewBox="0 0 20 20" fill="none">\n\t            <polyline points="6 8 10 12 14 8"\n\t                      stroke="white" stroke-width="2"\n\t                      stroke-linecap="round" stroke-linejoin="round"/>\n\t          </svg>\n\t        </span>\n\t      </header>\n\t      <div id="adt-sdk-status"\n\t           style="max-height: 150px; overflow: auto; padding: 6px 8px; display: none;"></div>\n\t    </section>\n\t  ';
    },
    createFooterHTML: function () {
      return '\n        <div class="footer">\n          <a href="https://datalayer-tracker.com.dev" target="_blank" rel="noopener" \n             style="font-size: 10px;color: #888;text-decoration: none;">\n            Made by Whittfield Holmes\n          </a>\n        </div>\n      ';
    },
    renderPageContext: function () {
      const adtData = window.ADTData || {};
      const config = document.querySelector("#adt-ov-body");
      if (!config) {
        if (
          adtData.debug &&
          adtData.is_logged_in &&
          adtData.userRole !== "guest"
        ) {
          console.warn(
            "[ADT-debug] ⚠️ renderPageContext: #adt-ov-body not found – skipping",
          );
        }
        return;
      }
      const payload = [
        ["Slug", adtData.slug],
        ["Path", adtData.path],
        ["Post ID", adtData.postId],
        ["Template", adtData.template],
        ["Page Type", adtData.pageType],
      ];
      const eventName = document.createElement("div");
      eventName.id = "adt-page-context";
      eventName.setAttribute("aria-label", "Page Metadata");
      eventName.style.cssText =
        "font-size:10px;color:#ccc;padding:6px 8px;border-bottom:1px solid #333;margin-bottom:6px;";
      eventName.innerHTML =
        '\n        <div style="display:flex;justify-content:space-between;align-items:center;">\n          <strong>Page Context</strong>\n          <span id="adt-toggle-pagectx" style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:4px;background:black;cursor:pointer;">\n            <svg id="adt-pagectx-arrow" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 20 20" fill="none">\n              <polyline points="6 8 10 12 14 8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>\n            </svg>\n          </span>\n        </div>\n        <div id="adt-pagectx-details"\n             class="adt-collapsible adt-collapsed"\n             style="margin-top:4px;font-size:10px;white-space:pre-wrap;color:#bbb;">\n        </div>\n      ';
      const detail = eventName.querySelector("#adt-toggle-pagectx");
      const element = eventName.querySelector("#adt-pagectx-arrow");
      const target = eventName.querySelector("#adt-pagectx-details");
      if (target) {
        target.innerHTML = payload
          .map(
            ([result, value]) =>
              "<div><strong>" +
              result +
              ":</strong> " +
              (value ?? "-") +
              "</div>",
          )
          .join("");
      }
      let flag = localStorage.getItem("adt_pagectx_collapsed");
      if (flag === null) {
        flag = "1";
        localStorage.setItem("adt_pagectx_collapsed", flag);
      }
      const enabled = flag === "1";
      if (detail && target && element) {
        target.classList.add("adt-collapsible");
        target.classList.toggle("adt-collapsed", enabled);
        element.setAttribute(
          "points",
          enabled ? "6 8 10 12 14 8" : "6 12 10 8 14 12",
        );
        detail.addEventListener("click", (url) => {
          url.stopPropagation();
          const pattern = !target.classList.contains("adt-collapsed");
          target.classList.toggle("adt-collapsed", pattern);
          element.setAttribute(
            "points",
            pattern ? "6 8 10 12 14 8" : "6 12 10 8 14 12",
          );
          localStorage.setItem("adt_pagectx_collapsed", pattern ? "1" : "0");
        });
      }
      config.prepend(eventName);
    },
    renderSDKStatus: function (regex = 0) {
      const depth = document.getElementById("adt-ov-status");
      const percent = document.getElementById("adt-toggle-sdk");
      const scrollY = document.getElementById("adt-sdk-status");
      if (
        !window.ADTData?.["pixelSettings"]?.["enabled"]
      ) {
        depth?.["remove"]();
        return;
      }
      if (!depth || !scrollY || !percent) {
        if (regex < 10) {
          setTimeout(() => this.renderSDKStatus(regex + 1), 100);
        }
        return;
      }
      const scrollTop = new Date().toLocaleTimeString();
      const pageKey = [
        {
          label: "Meta Pixel",
          ok: typeof window.fbq === "function",
        },
        {
          label: "GTM (dataLayer)",
          ok: typeof window.dataLayer !== "undefined",
        },
        {
          label: "LinkedIn Insight",
          ok: typeof window._linkedin_data_partner_ids !== "undefined",
        },
        {
          label: "TikTok Pixel",
          ok: typeof window.ttq === "function",
        },
        {
          label: "Pinterest",
          ok: typeof window.pintrk === "function",
        },
        {
          label: "Bing (UET)",
          ok: Array.isArray(window.uetq),
        },
        {
          label: "Reddit Pixel",
          ok: typeof window.rdt === "function",
        },
        {
          label: "Quora Pixel",
          ok: typeof window.qtrack === "function",
        },
      ];
      const firedSet = pageKey.filter((milestone) => milestone.ok);
      const timerId =
        '<div style="font-size:10px;color:#666;">🕐 Checked at ' +
        scrollTop +
        "</div>";
      if (firedSet.length) {
        const intervalId = firedSet
          .map((activeSec) => {
            const tickCount = activeSec.label.includes("GTM (dataLayer)")
              ? this.gtmDataLayerSVG()
              : "✅";
            return (
              '\n            <div style="display:flex;gap:6px;align-items:center;font-size:10px;color:#ccc;margin-bottom:2px;">\n              <span style="display:inline-flex;line-height:0;">' +
              tickCount +
              "</span>\n              <span>" +
              activeSec.label +
              "</span>\n            </div>\n          "
            );
          })
          .join("");
        scrollY.innerHTML = intervalId + timerId;
      } else {
        scrollY.innerHTML =
          '\n          <div style="font-size:10px;color:#ffcc00;margin-bottom:4px;">\n            ⚠️ No pixel SDKs detected on this page.\n          </div>\n          ' +
          timerId +
          "\n        ";
      }
      if (percent && !percent.dataset.bound) {
        percent.dataset.bound = "true";
        const saveTick = percent.querySelector("#adt-sdk-arrow");
        percent.addEventListener("click", () => {
          const isActive = scrollY.style.display !== "none";
          scrollY.style.display = isActive ? "none" : "";
          if (saveTick) {
            saveTick.setAttribute(
              "points",
              isActive ? "6 8 10 12 14 8" : "6 12 10 8 14 12",
            );
          }
          localStorage.setItem("adt_state_pixel_sdks", isActive ? "1" : "0");
        });
        let lastTick = localStorage.getItem("adt_state_pixel_sdks");
        if (lastTick === null) {
          lastTick = "1";
          localStorage.setItem("adt_state_pixel_sdks", lastTick);
        }
        const milestones = lastTick === "1";
        scrollY.style.display = milestones ? "none" : "";
        if (saveTick) {
          saveTick.setAttribute(
            "points",
            milestones ? "6 8 10 12 14 8" : "6 12 10 8 14 12",
          );
        }
      }
    },
    gtmDataLayerSVG: function () {
      return '\n        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-label="dataLayer">\n          <rect x="3" y="4" width="14" height="3" rx="1" stroke="white" stroke-width="2"/>\n          <rect x="3" y="9" width="14" height="3" rx="1" stroke="white" stroke-width="2"/>\n          <rect x="3" y="14" width="14" height="3" rx="1" stroke="white" stroke-width="2"/>\n        </svg>';
    },
    enhanceCheckoutDisplay: function (firedMilestones, pagePath) {
      if (!firedMilestones || !pagePath) {
        if (window.ADTData?.["debug"]) {
          console.warn(
            "[ADT-debug] ⚠️ enhanceCheckoutDisplay: Missing li or obj – skipping",
          );
        }
        return;
      }
      if (
        !pagePath.event ||
        (pagePath.event !== "begin_checkout" && !pagePath.ecommerce)
      ) {
        return;
      }
      const scrollHeight = {
        checkout_progress: () => ({
          step: pagePath.ecommerce?.["checkout_step"],
          label:
            {
              0x2: "Billing",
              3: "Shipping",
              0x4: "Payment",
            }[pagePath.ecommerce?.["checkout_step"]] ||
            "Step " + pagePath.ecommerce?.["checkout_step"],
        }),
        begin_checkout: () => ({
          step: 1,
          label: "Checkout Start",
        }),
        add_shipping_info: () => ({
          step: 3,
          label: "Shipping",
        }),
        add_payment_info: () => ({
          step: 0x4,
          label: "Payment",
        }),
        purchase: () => ({
          step: 0x5,
          label: "Complete",
        }),
      };
      if (!scrollHeight[pagePath.event]) {
        return;
      }
      const { step: viewportH, label: scrollPct } =
        scrollHeight[pagePath.event]();
      const threshold = pagePath.ecommerce?.["items"] || [];
      const tolerance = document.createElement("div");
      tolerance.className =
        "adt-checkout-step adt-step-" +
        viewportH +
        " adt-event-" +
        pagePath.event;
      tolerance.innerHTML =
        '\n        <div class="step-indicator">\n          <span class="adt-chip">' +
        viewportH +
        "/5 • " +
        scrollPct +
        "</span>\n          " +
        (threshold.length
          ? '<span class="items-count">' +
            threshold.length +
            " item" +
            (threshold.length > 1 ? "s" : "") +
            "</span>"
          : "") +
        '\n        </div>\n        <div class="step-progress">\n          <div class="progress-bar" style="width:' +
        (viewportH / 0x5) * 100 +
        '%"></div>\n        </div>\n      ';
      const evt = firedMilestones.querySelector("pre");
      if (evt) {
        firedMilestones.insertBefore(tolerance, evt);
      } else {
        firedMilestones.appendChild(tolerance);
      }
    },
    createConsentBanner: function () {
      const item = document.createElement("div");
      item.id = "adt-blocked-banner";
      item.textContent = "⚠️ dataLayerBlocked: true (no consent)";
      item.className =
        typeof window.hasConsent === "function" && window.hasConsent()
          ? "adt-hidden"
          : "";
      return item;
    },
  };
})();
