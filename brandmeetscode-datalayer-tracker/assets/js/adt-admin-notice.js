/*!
 * DataLayer Tracker - Admin Notice Handler
 *
 * Manages admin notices and dismissible alerts
 *
 * @preserve
 * @package    DataLayer_Tracker
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".adt-admin-notice").forEach(function (adtData) {
    adtData.addEventListener("click", function (config) {
      if (config.target.classList.contains("notice-dismiss")) {
        const payload = adtData.dataset.noticeType || "dual_pixel";
        const eventName = new URLSearchParams();
        eventName.append("action", "adt_dismiss_notice");
        eventName.append("which", payload);
        if (typeof ADTData !== "undefined" && ADTData.nonce) {
          eventName.append("security", ADTData.nonce);
        }
        fetch(ADTData.ajax_url || ajaxurl, {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: eventName.toString(),
        })
          .then((detail) => {
            if (!detail.ok) {
              throw new Error(
                "HTTP " + detail.status + ": " + detail.statusText,
              );
            }
            return detail.json ? detail.json() : detail.text();
          })
          .then((element) => {
            if (ADTData?.["debug"]) {
              console.log(
                "[ADT] Notice '" + payload + "' dismissed:",
                element,
              );
            }
          })
          ["catch"]((target) => {
            if (ADTData?.["debug"]) {
              console.error("[ADT] Notice dismiss error:", target);
            }
          });
      }
    });
  });
});
