/*!
 * DataLayer Tracker - DataLayer Enhancements
 *
 * Enhances native dataLayer functionality with additional features
 *
 * @preserve
 * @package    DataLayer_Tracker
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
(function () {
  const adtData = !!ADTData?.["enableOverlay"];
  const config = !!ADTData?.["debug"];
  if (config) {
    console.debug("[ADT] Enhancements script loaded");
  }
  if (
    typeof ADTData === "undefined" ||
    typeof ADTData.include !== "object" ||
    document.body.classList.contains("wp-admin")
  ) {
    if (config) {
      console.debug("[ADT] Skipping enhancements — not running in frontend.");
    }
    return;
  }
  function payload(eventName) {
    if (Array.isArray(window.dataLayer)) {
      return eventName();
    }
    const detail = setInterval(() => {
      if (Array.isArray(window.dataLayer)) {
        clearInterval(detail);
        eventName();
      }
    }, 50);
  }
  payload(() => {
    const element = window.dataLayer.push.bind(window.dataLayer);
    window.dataLayer.push = function (...target) {
      return element(...target);
    };
    if (config) {
      console.info("[ADT] DL enhancements ready");
    }
    if (ADTData.include?.["pageTiming"]) {
      window.addEventListener("load", () => {
        const result = performance.timing;
        const value = {
          event: "page_timing",
          domInteractive: result.domInteractive - result.navigationStart,
          domComplete: result.domComplete - result.navigationStart,
          loadEventEnd: result.loadEventEnd - result.navigationStart,
          ttfb: result.responseStart - result.requestStart,
          timestamp: new Date().toISOString(),
        };
        dataLayer.push(value);
      });
    }
    if (ADTData.include?.["viewportImpressions"]) {
      const flag = document.querySelectorAll("[data-track-impression]");
      const enabled = new IntersectionObserver(
        (url) => {
          url.forEach((pattern) => {
            if (pattern.isIntersecting && !pattern.target.dataset.seen) {
              pattern.target.dataset.seen = "true";
              const regex = pattern.target.dataset.label || "unknown";
              dataLayer.push({
                event: "element_impression",
                label: regex,
                timestamp: new Date().toISOString(),
              });
            }
          });
        },
        {
          threshold: 0.5,
        },
      );
      flag.forEach((depth) => enabled.observe(depth));
    }
    const percent = (scrollY) => {
      dataLayer.push({
        ...scrollY,
        timestamp: new Date().toISOString(),
      });
    };
    window.ADTpush = percent;
    if (adtData || config) {
      window.dispatchEvent(new CustomEvent("ADT:EnhancementsReady"));
      if (window.ADTDebugOverlay?.["renderEvent"] && adtData) {
        window.ADTDebugOverlay.renderEvent({
          event: "adt_overlay_ready",
          message: "Enhancements script signaled overlay ready.",
          timestamp: new Date().toISOString(),
        });
      }
      if (config) {
        console.debug("[ADT] Dispatched: ADT:EnhancementsReady");
        dataLayer.push({
          event: "adt_qa_test_event",
          message: "This is a simulated QA event for GTM preview",
          timestamp: new Date().toISOString(),
        });
        console.debug("[ADT] Simulated QA event pushed");
      }
    }
    window.addEventListener("error", (scrollTop) => {
      const pageKey = {
        event: "adt_error",
        message: scrollTop.message,
        filename: scrollTop.filename,
        lineno: scrollTop.lineno,
        colno: scrollTop.colno,
        timestamp: new Date().toISOString(),
      };
      dataLayer.push(pageKey);
      if (config) {
        console.warn("[ADT] adt_error:", pageKey);
      }
    });
    window.addEventListener("unhandledrejection", (firedSet) => {
      const milestone = {
        event: "adt_error",
        message: firedSet.reason?.["message"] || "Unhandled rejection",
        stack: firedSet.reason?.["stack"] || null,
        timestamp: new Date().toISOString(),
      };
      dataLayer.push(milestone);
      if (config) {
        console.warn("[ADT] adt_error (unhandled):", milestone);
      }
    });
  });
})();
