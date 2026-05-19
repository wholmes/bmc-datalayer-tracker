/*!
 * DataLayer Tracker - Utils
 *
 * @preserve
 * @package    DataLayer_Tracker
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
window.adtDebug = (...adtData) => {
  if (!window.ADTData?.["debug"]) {
    return;
  }
  const config = window.ADTData?.["debug_level"] || "normal";
  if (config === "quiet") {
    const payload = adtData.map(String).join(" ").toLowerCase();
    if (
      payload.includes("error") ||
      payload.includes("❌") ||
      payload.includes("form_submit") ||
      payload.includes("purchase")
    ) {
      console.log("[ADT]", ...adtData);
    }
    return;
  }
};
window.adtWarn = (...eventName) => {
  if (!window.ADTData?.["debug"]) {
    return;
  }
};
window.adtError = (...detail) => {
  if (!window.ADTData?.["debug"]) {
    return;
  }
};
window.adtLog = (element, target) => {
  if (!window.ADTData?.["debug"]) {
    return;
  }
};
window.adtDebugLog = window.adtDebug;
window.ADTUtils = window.ADTUtils || {};
window.ADTPixels = window.ADTPixels || {
  trackEvent: (result, value) => {
    window.adtDebug("[ADT-stub] trackEvent called for " + result, value);
  },
};
window.isOverlayInteraction =
  window.isOverlayInteraction ||
  function (flag) {
    const enabled = [
      "#wpadminbar",
      ".adt-debug-overlay",
      "[data-adt-ignore-click]",
      '[aria-hidden="true"]',
    ];
    return (
      flag && enabled.some((url) => flag.closest(url))
    );
  };
window.ADTUtils.safeJSONStringify = function safeJSONStringify(
  pattern,
  regex = null,
  depth = 0,
) {
  const percent = new WeakSet();
  return JSON.stringify(
    pattern,
    (scrollY, scrollTop) => {
      if (typeof scrollTop === "object" && scrollTop !== null) {
        if (percent.has(scrollTop)) {
          return "[Circular]";
        }
        percent.add(scrollTop);
      }
      if (scrollTop instanceof HTMLElement) {
        return "[HTMLElement:" + scrollTop.tagName + "]";
      }
      if (typeof regex === "function") {
        return regex(scrollY, scrollTop);
      }
      return scrollTop;
    },
    depth,
  );
};
ADTUtils.sha256 = async function sha256(pageKey) {
  try {
    if (typeof pageKey !== "string") {
      throw new TypeError("Input must be a string");
    }
    if (!crypto?.["subtle"]?.["digest"]) {
      throw new Error("Web Crypto API not available");
    }
    const firedSet = new TextEncoder();
    const milestone = firedSet.encode(pageKey);
    const timerId = await crypto.subtle.digest("SHA-256", milestone);
    const intervalId = Array.from(new Uint8Array(timerId));
    const activeSec = intervalId
      .map((tickCount) => tickCount.toString(0x10).padStart(0x2, "0"))
      .join("");
    return activeSec;
  } catch (saveTick) {
    window.adtError("SHA-256 hashing error:", saveTick);
    throw saveTick;
  }
};
window.sha256 = ADTUtils.sha256;
