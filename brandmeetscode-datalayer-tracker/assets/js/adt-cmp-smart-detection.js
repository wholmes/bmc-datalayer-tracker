/*!
 * DataLayer Tracker - CMP Smart Detection
 *
 * Intelligent detection and integration with consent management platforms
 *
 * @preserve
 * @package    DataLayer_Tracker
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
(function () {
  "use strict";

  let adtData = {
    status: "detecting",
    cmp: null,
    attempts: 0,
    startTime: Date.now(),
    isReady: false,
    lastCheck: null,
  };
  const config = [];
  window.ADTOnCMPReady = function (payload) {
    if (typeof payload === "function") {
      if (adtData.isReady) {
        payload(adtData);
      } else {
        config.push(payload);
      }
    }
  };
  const eventName = {
    OneTrust: {
      exists: () => typeof window.OneTrust !== "undefined",
      isReady: () => {
        return (
          window.OneTrust &&
          typeof window.OneTrust.IsAlertBoxClosed === "function" &&
          (window.OnetrustActiveGroups !== undefined ||
            window.OneTrust.IsAlertBoxClosed())
        );
      },
      waitFor: () => {
        return new Promise((detail) => {
          if (eventName.OneTrust.isReady()) {
            detail(true);
          } else {
            if (window.OneTrustReadyCallback) {
              const element = window.OneTrustReadyCallback;
              window.OneTrustReadyCallback = function () {
                if (element) {
                  element();
                }
                detail(true);
              };
            } else {
              let target = 0;
              const result = setInterval(() => {
                if (eventName.OneTrust.isReady() || target++ > 20) {
                  clearInterval(result);
                  detail(eventName.OneTrust.isReady());
                }
              }, 0xfa);
            }
          }
        });
      },
    },
    Cookiebot: {
      exists: () => typeof window.Cookiebot !== "undefined",
      isReady: () => {
        return (
          window.Cookiebot &&
          typeof window.Cookiebot.consent !== "undefined" &&
          window.Cookiebot.hasResponse === true
        );
      },
      waitFor: () => {
        return new Promise((value) => {
          if (eventName.Cookiebot.isReady()) {
            value(true);
          } else {
            const flag = () => {
              value(true);
              window.removeEventListener("CookiebotOnLoad", flag);
            };
            window.addEventListener("CookiebotOnLoad", flag);
            setTimeout(() => {
              window.removeEventListener("CookiebotOnLoad", flag);
              value(eventName.Cookiebot.isReady());
            }, 5000);
          }
        });
      },
    },
    Klaro: {
      exists: () =>
        typeof window.klaro !== "undefined" ||
        typeof window.klaroConfig !== "undefined",
      isReady: () => {
        return (
          window.klaro &&
          typeof window.klaro.getManager === "function" &&
          window.klaro.getManager() !== null
        );
      },
      waitFor: () => {
        return new Promise((enabled) => {
          if (eventName.Klaro.isReady()) {
            enabled(true);
          } else {
            let url = 0;
            const pattern = setInterval(() => {
              if (eventName.Klaro.isReady() || url++ > 20) {
                clearInterval(pattern);
                enabled(eventName.Klaro.isReady());
              }
            }, 0xfa);
          }
        });
      },
    },
    Complianz: {
      exists: () =>
        typeof window.complianz !== "undefined" ||
        typeof window.cmplz_get_cookie === "function",
      isReady: () => {
        return (
          typeof window.cmplz_get_cookie === "function" &&
          document.cookie.includes("cmplz_consent_status")
        );
      },
      waitFor: () => {
        return new Promise((regex) => {
          if (eventName.Complianz.isReady()) {
            regex(true);
          } else {
            document.addEventListener(
              "cmplz_cookie_warning_loaded",
              () => regex(true),
              {
                once: true,
              },
            );
            setTimeout(() => regex(eventName.Complianz.isReady()), 5000);
          }
        });
      },
    },
    CookieYes: {
      exists: () =>
        typeof window.CookieYes !== "undefined" ||
        document.querySelector("[data-cky-tag]"),
      isReady: () => {
        return (
          window.CookieYes && typeof window.CookieYes.getConsent === "function"
        );
      },
      waitFor: () => {
        return new Promise((depth) => {
          if (eventName.CookieYes.isReady()) {
            depth(true);
          } else {
            document.addEventListener("cookieyes:load", () => depth(true), {
              once: true,
            });
            setTimeout(() => depth(eventName.CookieYes.isReady()), 5000);
          }
        });
      },
    },
    TCF: {
      exists: () => typeof window.__tcfapi === "function",
      isReady: () => {
        let percent = false;
        if (typeof window.__tcfapi === "function") {
          window.__tcfapi("ping", 0x2, (scrollY) => {
            percent = scrollY && scrollY.cmpLoaded;
          });
        }
        return percent;
      },
      waitFor: () => {
        return new Promise((scrollTop) => {
          if (eventName.TCF.isReady()) {
            scrollTop(true);
          } else if (window.__tcfapi) {
            window.__tcfapi("addEventListener", 0x2, (pageKey, firedSet) => {
              if (firedSet && pageKey.eventStatus === "tcloaded") {
                scrollTop(true);
              }
            });
            setTimeout(() => scrollTop(eventName.TCF.isReady()), 5000);
          } else {
            scrollTop(false);
          }
        });
      },
    },
  };
  async function milestone() {
    adtData.attempts++;
    adtData.lastCheck = Date.now();
    for (const [timerId, intervalId] of Object.entries(eventName)) {
      if (intervalId.exists()) {
        console.log(
          "[ADT] " + timerId + " detected, waiting for ready state...",
        );
        adtData.status = "initializing";
        adtData.cmp = timerId;
        activeSec();
        const tickCount = await intervalId.waitFor();
        if (tickCount) {
          console.log("[ADT] " + timerId + " is ready!");
          adtData.status = "ready";
          adtData.isReady = true;
          config.forEach((saveTick) => saveTick(adtData));
          config.length = 0;
          activeSec();
          return timerId;
        } else {
          console.log("[ADT] " + timerId + " detected but not fully ready");
          adtData.status = "detected";
        }
      }
    }
    return null;
  }
  async function isActive() {
    await new Promise((lastTick) => setTimeout(lastTick, 100));
    let milestones = null;
    const firedMilestones = Date.now() + 0x2710;
    while (!milestones && Date.now() < firedMilestones && adtData.attempts < 10) {
      milestones = await milestone();
      if (!milestones) {
        const pagePath = Math.min(
          500 * Math.pow(1.5, adtData.attempts),
          0x7d0,
        );
        await new Promise((scrollHeight) => setTimeout(scrollHeight, pagePath));
      }
    }
    if (milestones) {
      adtData.status = "ready";
      adtData.cmp = milestones;
    } else if (
      window.ADTData?.["fallback_track_without_cmp"] === "1" ||
      window.ADTData?.["fallback_track_without_cmp"] === "1"
    ) {
      adtData.status = "fallback";
      adtData.cmp = "ADT Fallback";
    } else {
      adtData.status = "none";
      adtData.cmp = "No CMP detected";
    }
    adtData.isReady = true;
    activeSec();
    config.forEach((viewportH) => viewportH(adtData));
    config.length = 0;
    return milestones;
  }
  function activeSec() {
    const scrollPct = [
      "#adt-debug-info",
      ".adt-info-panel",
      ".cmp-status",
      "[data-adt-info]",
      ".adt-debug-overlay .info-content",
    ];
    let threshold = null;
    for (const tolerance of scrollPct) {
      threshold = document.querySelector(tolerance);
      if (threshold) {
        break;
      }
    }
    if (!threshold) {
      console.warn("[ADT] No info element found for CMP display");
      return false;
    }
    let evt = null;
    let item = null;
    const key = threshold.querySelectorAll("strong");
    for (const err of key) {
      if (err.textContent.includes("CMP")) {
        evt = err;
        item = err.nextElementSibling;
        break;
      }
    }
    if (!evt) {
      evt = threshold.querySelector("[data-cmp-label]");
      item = threshold.querySelector("[data-cmp-status]");
    }
    if (!evt) {
      const idx = document.createElement("div");
      idx.className = "cmp-status-line";
      idx.innerHTML =
        "<strong>CMP:</strong> <span data-cmp-status></span>";
      threshold.insertBefore(idx, threshold.firstChild);
      evt = idx.querySelector("strong");
      item = idx.querySelector("[data-cmp-status]");
    }
    if (!item) {
      console.warn("[ADT] Could not find or create CMP status span");
      return false;
    }
    const len = mode();
    let typeVal = "";
    let nameVal = "status-neutral";
    switch (len.status) {
      case "detecting":
        nameVal = "status-warning";
        typeVal =
          '<span class="' +
          nameVal +
          '">\n\t                <span class="status-icon">⏳</span> \n\t                Detecting... \n\t                <span class="status-detail">(' +
          len.attempts +
          "/" +
          len.maxAttempts +
          ")</span>\n\t            </span>";
        if (len.attempts > 0x2) {
          const opts = (len.attempts / len.maxAttempts) * 100;
          typeVal +=
            '\n\t                    <div class="cmp-detection-progress" style="margin-top:2px;">\n\t                        <div class="progress-bar" style="width:' +
            opts +
            '%;"></div>\n\t                    </div>';
        }
        break;
      case "initializing":
        nameVal = "status-warning";
        typeVal =
          '<span class="' +
          nameVal +
          '">\n\t                <span class="status-icon">⚙️</span> \n\t                ' +
          len.cmp +
          ' initializing...\n\t                <span class="status-detail">(' +
          len.elapsed +
          "s)</span>\n\t            </span>";
        break;
      case "ready":
        nameVal = "status-good";
        const ref = Array.isArray(len.cmp)
          ? len.cmp.join(", ")
          : len.cmp;
        typeVal =
          '<span class="' +
          nameVal +
          '">\n\t                <span class="status-icon">✅</span> \n\t                ' +
          ref +
          "\n\t                " +
          (len.version
            ? '<span class="status-version">v' + len.version + "</span>"
            : "") +
          "\n\t            </span>";
        if (len.consentSummary) {
          typeVal +=
            '\n\t                    <div class="consent-summary">\n\t                        ' +
            len.consentSummary +
            "\n\t                    </div>";
        }
        break;
      case "fallback":
        nameVal = "status-neutral";
        typeVal =
          '<span class="' +
          nameVal +
          '">\n\t                <span class="status-icon">📋</span> \n\t                ' +
          len.cmp +
          '\n\t                <span class="status-detail">(' +
          len.reason +
          ")</span>\n\t            </span>";
        break;
      case "none":
        nameVal = "status-bad";
        typeVal =
          '<span class="' +
          nameVal +
          '">\n\t                <span class="status-icon">❌</span> \n\t                No CMP detected\n\t                ' +
          (len.allowTracking
            ? '<span class="status-detail">(Tracking allowed)</span>'
            : "") +
          "\n\t            </span>";
        break;
      case "error":
        nameVal = "status-bad";
        typeVal =
          '<span class="' +
          nameVal +
          '">\n\t                <span class="status-icon">⚠️</span> \n\t                Detection error\n\t                <span class="status-detail" title="' +
          len.error +
          '">(hover for details)</span>\n\t            </span>';
        break;
      default:
        typeVal =
          '<span class="' +
          nameVal +
          '">\n\t                ' +
          (len.cmp || "Unknown") +
          "\n\t                " +
          (len.details
            ? '<span class="status-detail">' + len.details + "</span>"
            : "") +
          "\n\t            </span>";
    }
    if (len.status === "detecting" && len.attempts > 3) {
      typeVal +=
        '<div class="status-hint">Taking longer than expected...</div>';
      if (len.attempts > 0x5) {
        typeVal +=
          '\n\t                <button class="cmp-refresh-btn" onclick="window.ADTRedetectCMP?.()">\n\t                    Retry Detection\n\t                </button>';
      }
    }
    item.innerHTML = typeVal;
    item.className = "cmp-status " + nameVal;
    item.classList.add("status-updated");
    setTimeout(() => item.classList.remove("status-updated"), 0x12c);
    return true;
  }
  function mode() {
    const val = {
      status: "detecting",
      cmp: null,
      attempts: 0,
      maxAttempts: 10,
      elapsed: 0,
      version: null,
      consentSummary: null,
      allowTracking: false,
      reason: null,
      error: null,
      details: null,
    };
    if (window.ADTConsentReady === true) {
      const obj = window.ADTConsentAudit || [];
      const fn = [
        ...new Set(
          obj.map((arg) => arg.source).filter(Boolean),
        ),
      ];
      const tmp = fn.filter(
        (node) =>
          !["manual", "no_cmp_override", "no_cmp_fallback", "default"].includes(
            node,
          ),
      );
      if (tmp.length > 0) {
        val.status = "ready";
        val.cmp = tmp.length === 1 ? tmp[0] : tmp;
        const list =
          window.ADTConsentManager?.["getState"]?.() || window.ADTConsent || {};
        const entry = [];
        if (typeof list.analytics === "boolean") {
          entry.push("A:" + (list.analytics ? "✓" : "✗"));
        }
        if (typeof list.marketing === "boolean") {
          entry.push("M:" + (list.marketing ? "✓" : "✗"));
        }
        if (entry.length > 0) {
          val.consentSummary = entry.join(" ");
        }
        val.version = state(tmp[0]);
      } else {
        if (fn.includes("no_cmp_override")) {
          val.status = "fallback";
          val.cmp = "ADT Override";
          val.reason = "fallback_track_without_cmp";
          val.allowTracking = true;
        } else if (fn.includes("no_cmp_fallback")) {
          val.status = "fallback";
          val.cmp = "ADT Fallback";
          val.reason = "fallback_track_without_cmp";
          val.allowTracking = true;
        } else {
          val.status = "none";
          val.allowTracking =
            window.ADTData?.["fallback_track_without_cmp"] === "1";
        }
      }
    } else {
      if (window.detectionState) {
        Object.assign(val, window.detectionState);
        val.elapsed = Math.round(
          (Date.now() - (window.detectionState.startTime || Date.now())) /
            1000,
        );
      } else {
        const ctx = data();
        if (ctx) {
          val.status = "initializing";
          val.cmp = ctx;
        } else {
          val.status = "detecting";
          val.attempts = 1;
        }
      }
    }
    return val;
  }
  function data() {
    if (typeof window.OneTrust !== "undefined") {
      return "OneTrust";
    }
    if (typeof window.Cookiebot !== "undefined") {
      return "Cookiebot";
    }
    if (typeof window.cookieyes !== "undefined") {
      return "CookieYes";
    }
    if (typeof window.klaro !== "undefined") {
      return "Klaro";
    }
    if (typeof window.Osano !== "undefined") {
      return "Osano";
    }
    if (typeof window.complianz !== "undefined") {
      return "Complianz";
    }
    if (typeof window.Termly !== "undefined") {
      return "Termly";
    }
    if (typeof window.__tcfapi === "function") {
      return "TCF 2.0";
    }
    if (document.querySelector(".cky-consent-container")) {
      return "CookieYes";
    }
    if (document.querySelector("#onetrust-banner-sdk")) {
      return "OneTrust";
    }
    if (document.querySelector("#cookiebot")) {
      return "Cookiebot";
    }
    return null;
  }
  function state(row) {
    try {
      switch (row?.["toLowerCase"]()) {
        case "onetrust":
          return window.OneTrust?.["version"] || null;
        case "cookiebot":
          return window.Cookiebot?.["version"] || null;
        case "cookieyes":
          return window.cookieyes?.["version"] || null;
        case "klaro":
          return window.klaroConfig?.["version"] || null;
        default:
          return null;
      }
    } catch (col) {
      return null;
    }
  }
  function mapVal() {
    let setVal = 0;
    const buf = setInterval(() => {
      setVal++;
      const raw = activeSec();
      const parsed =
        !raw ||
        setVal >= 20 ||
        window.ADTConsentReady === true ||
        window.detectionState?.["status"] === "ready";
      if (parsed) {
        clearInterval(buf);
        window.adtDebug("CMP display updater stopped");
      }
    }, 500);
    return buf;
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mapVal);
  } else {
    mapVal();
  }
  document.addEventListener("adt_consent_loaded", activeSec);
  if (!document.getElementById("adt-cmp-display-styles")) {
    const text = document.createElement("div");
    text.id = "adt-cmp-display-styles";
    text.innerHTML =
      "\n\t<style>\n\t.cmp-status {\n\t    transition: all 0.3s ease;\n\t}\n\n\t.cmp-status.status-updated {\n\t    animation: highlight 0.3s ease;\n\t}\n\n\t@keyframes highlight {\n\t    0% { background: rgba(255,255,255,0.1); }\n\t    50% { background: rgba(255,255,255,0.2); }\n\t    100% { background: transparent; }\n\t}\n\n\t.status-icon {\n\t    display: inline-block;\n\t    margin-right: 4px;\n\t}\n\n\t.status-detail {\n\t    font-size: 0.85em;\n\t    opacity: 0.8;\n\t    margin-left: 4px;\n\t}\n\n\t.status-version {\n\t    font-size: 0.8em;\n\t    opacity: 0.6;\n\t    margin-left: 4px;\n\t}\n\n\t.status-hint {\n\t    font-size: 0.8em;\n\t    color: #999;\n\t    margin-top: 4px;\n\t}\n\n\t.consent-summary {\n\t    font-size: 0.85em;\n\t    margin-top: 2px;\n\t    padding-left: 24px;\n\t    opacity: 0.9;\n\t}\n\n\t.cmp-detection-progress {\n\t    width: 100%;\n\t    height: 2px;\n\t    background: rgba(255,255,255,0.1);\n\t    border-radius: 1px;\n\t    overflow: hidden;\n\t}\n\n\t.progress-bar {\n\t    height: 100%;\n\t    background: linear-gradient(90deg, #fbbf24, #f59e0b);\n\t    transition: width 0.3s ease;\n\t}\n\n\t.cmp-refresh-btn {\n\t    margin-top: 4px;\n\t    padding: 2px 8px;\n\t    font-size: 11px;\n\t    background: rgba(255,255,255,0.1);\n\t    border: 1px solid rgba(255,255,255,0.2);\n\t    color: #fff;\n\t    cursor: pointer;\n\t    border-radius: 3px;\n\t}\n\n\t.cmp-refresh-btn:hover {\n\t    background: rgba(255,255,255,0.2);\n\t}\n\t</style>\n\t";
    document.head.appendChild(text.firstElementChild);
  }
  window.ADTRedetectCMP = async function () {
    window.adtDebug("Manual CMP re-detection triggered");
    adtData = {
      status: "detecting",
      cmp: null,
      attempts: 0,
      startTime: Date.now(),
      isReady: false,
      lastCheck: null,
    };
    activeSec();
    return await isActive();
  };
  function html() {
    window.adtDebug("Starting smart CMP detection...");
    isActive().then((cmpName) => {
      window.adtDebug("CMP detection complete:", cmpName || "No CMP found");
    });
    if ("MutationObserver" in window) {
      const handler = new MutationObserver((callback) => {
        if (!adtData.isReady || adtData.status === "none") {
          for (const response of callback) {
            if (response.type === "childList") {
              const request = Array.from(response.addedNodes).some(
                (fields) =>
                  fields.tagName === "SCRIPT" &&
                  (fields.src.includes("cookie") ||
                    fields.src.includes("consent") ||
                    fields.src.includes("gdpr") ||
                    fields.src.includes("onetrust") ||
                    fields.src.includes("klaro")),
              );
              if (request) {
                window.adtDebug("New consent script detected, re-checking...");
                setTimeout(() => milestone(), 1000);
                break;
              }
            }
          }
        }
      });
      handler.observe(document.head, {
        childList: true,
        subtree: true,
      });
      setTimeout(() => handler.disconnect(), 30000);
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", html);
  } else if (document.readyState === "interactive") {
    setTimeout(html, 100);
  } else {
    html();
  }
  window.ADTCMPDetection = {
    getState: () => adtData,
    redetect: window.ADTRedetectCMP,
    onReady: window.ADTOnCMPReady,
  };
})();
if (!document.getElementById("adt-cmp-detection-styles")) {
  const styleEl = document.createElement("div");
  styleEl.id = "adt-cmp-detection-styles";
  styleEl.innerHTML =
    "\n<style>\n.status-warning {\n    color: #fbbf24;\n    animation: pulse 1.5s ease-in-out infinite;\n}\n\n.status-good {\n    color: #4ade80;\n}\n\n.status-bad {\n    color: #f87171;\n}\n\n.status-neutral {\n    color: #94a3b8;\n}\n\n@keyframes pulse {\n    0%, 100% { opacity: 1; }\n    50% { opacity: 0.5; }\n}\n</style>\n";
  document.head.appendChild(styleEl.firstElementChild);
}
