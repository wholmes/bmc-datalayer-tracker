/*!
 * DataLayer Tracker - Notices Patch
 *
 * Fixes and enhancements for admin notice handling
 *
 * @preserve
 * @package    DataLayer_Tracker
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
(function () {
  function adtData(config) {
    if (
      config &&
      typeof config === "object" &&
      !("notices" in config)
    ) {
      if (window.ADTData?.["debug"]) {
        console.warn(
          "[ADT] 🚑 Injecting empty notices to prevent WC Services error",
        );
      }
      config.notices = "";
    }
  }
  function payload() {
    try {
      const eventName = localStorage.getItem("wc_cart_fragments");
      if (eventName) {
        const detail = JSON.parse(eventName);
        if (!detail?.["fragments"]?.["notices"]) {
          if (window.ADTData?.["debug"]) {
            console.warn(
              "[ADT] 🧹 Clearing bad wc_cart_fragments cache (missing notices)",
            );
          }
          localStorage.removeItem("wc_cart_fragments");
          sessionStorage.removeItem("wc_cart_hash");
        }
      }
    } catch (element) {}
  }
  payload();
  if (window.wc_cart_fragments_params?.["fragments"]) {
    adtData(window.wc_cart_fragments_params.fragments);
  }
  if (window.storeApiCartData?.["fragments"]) {
    adtData(window.storeApiCartData.fragments);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", target);
  } else {
    target();
  }
  function target() {
    document.body.addEventListener("wc_fragments_refreshed", () => {
      if (window.wc_cart_fragments_params?.["fragments"]) {
        adtData(window.wc_cart_fragments_params.fragments);
      }
    });
  }
})();
