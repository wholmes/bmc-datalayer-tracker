/*!
 * DataLayer Tracker - Consent Manager
 *
 * Manages consent state and CMP integrations
 * IMPORTANT: Must load before all tracking modules
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

  if (window._adtConsentInitialized) {
    if (window.ADTData?.["debug_mode"] === "1") {
      console.warn("[ADT Consent] Already initialized, skipping");
    }
    return;
  }
  window._adtConsentInitialized = true;
  if (typeof window.ADTData === "undefined") {
    console.error("[ADT Consent] ADTData not found! Check script load order.");
    return;
  }
  window.ADTConsent = window.ADTConsent || {};
  if (typeof window.ADTData === "undefined") {
    window.ADTData = {};
  }
  const consentLog = function (...args) {
    window.adtDebug("Consent:", ...args);
  };
  function pushConsentEvent(eventName, extra = {}, throttleMs = null) {
    window._adtConsentEvents = window._adtConsentEvents || {};
    if (throttleMs === null) {
      if (window._adtConsentEvents[eventName] === true) {
        consentLog("Skipping duplicate " + eventName + " (already fired)");
        return;
      }
      window._adtConsentEvents[eventName] = true;
    } else {
      const now = Date.now();
      const last = window._adtConsentEvents[eventName] || 0;
      if (now - last < throttleMs) {
        consentLog("Skipping duplicate " + eventName + " (throttled)");
        return;
      }
      window._adtConsentEvents[eventName] = now;
    }
    const evt = {
      event: eventName,
      timestamp: Date.now(),
      ...extra,
    };
    window.dataLayer.push(evt);
    consentLog(eventName + " pushed:", evt);
  }
  window.hasConsent = function (category = "analytics", altCategory = null) {
    if (
      window.ADTData?.["fallback_track_without_cmp"] === "1" ||
      window.ADTData?.["fallback_track_without_cmp"] === true
    ) {
      return true;
    }
    if (altCategory) {
      const altVal = window.ADTConsent?.[altCategory];
      if (typeof altVal === "boolean") {
        return altVal;
      }
    }
    const val = window.ADTConsent?.[category];
    if (typeof val === "boolean") {
      return val;
    }
    if (window.__gtmPolicy?.["analytics_storage"] === "granted") {
      return true;
    }
    return window.ADTData?.["fallback_track_without_cmp"] === "1";
  };
  window.adtHasConsent = function (category = "analytics", altCategory = null) {
    return window.hasConsent(category, altCategory);
  };
  window.setADTConsent = function (type, granted, source = "manual") {
    const previous = window.ADTConsent[type];
    window.ADTConsent[type] = granted;
    try {
      sessionStorage.setItem(
        "adt_consent_" + type,
        JSON.stringify({
          value: granted,
          source: source,
          timestamp: Date.now(),
        }),
      );
    } catch (storageErr) {}
    window.ADTConsentAudit = window.ADTConsentAudit || [];
    window.ADTConsentAudit.push({
      type: type,
      value: granted,
      source: source,
      timestamp: Date.now(),
      previousValue: previous,
    });
    if (previous !== granted) {
      consentLog(
        "Consent changed: " +
          type +
          " = " +
          granted +
          " (source: " +
          source +
          ")",
      );
      if (granted) {
        pushConsentEvent("consent_granted", {
          consent_type: type,
          consent_value: granted,
          consent_source: source,
          all_consents: {
            ...window.ADTConsent,
          },
        });
        window.dispatchEvent(new Event("adt_consent_granted"));
      } else {
        pushConsentEvent("consent_revoked", {
          revoked_categories: type,
          revocation_reason: source,
          consent_type: type,
          consent_value: granted,
          consent_source: source,
          all_consents: {
            ...window.ADTConsent,
          },
        });
      }
      pushConsentEvent("adt_consent_" + (granted ? "granted" : "revoked"), {
        consent_type: type,
        consent_value: granted,
        consent_source: source,
        all_consents: {
          ...window.ADTConsent,
        },
      });
      syncDataLayerBlocked();
    }
  };
  window.revokeAllConsent = function (source = "user_action") {
    consentLog("Revoking all consent");
    Object.keys(window.ADTConsent).forEach((key) => {
      window.setADTConsent(key, false, source);
    });
    pushConsentEvent("consent_revoked", {
      revoked_categories: "all",
      revocation_reason: source,
      source: source,
      timestamp: Date.now(),
    });
    pushConsentEvent("adt_consent_revoked_all", {
      source: source,
      timestamp: Date.now(),
    });
  };
  function syncDataLayerBlocked() {
    const analyticsOk = hasConsent("analytics");
    const fallback = window.ADTData?.["fallback_track_without_cmp"] === "1";
    const wasBlocked = window.dataLayerBlocked;
    window.dataLayerBlocked = fallback ? false : !analyticsOk;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      _adtBlocked: window.dataLayerBlocked,
    });
    if (window.ADTData?.["set_dataLayerBlocked_flag"] === "1") {
      pushConsentEvent("adt_dataLayer_blocked_status", {
        dataLayerBlocked: window.dataLayerBlocked,
        _adtBlocked: window.dataLayerBlocked,
      });
    }
    if (wasBlocked !== window.dataLayerBlocked) {
      window.dispatchEvent(
        new CustomEvent("adt_blocked_status_changed", {
          detail: {
            blocked: window.dataLayerBlocked,
          },
        }),
      );
      consentLog(
        "dataLayerBlocked changed: " +
          wasBlocked +
          " → " +
          window.dataLayerBlocked,
      );
      consentLog("_adtBlocked pushed to dataLayer: " + window.dataLayerBlocked);
    }
  }
  window.addEventListener("adt_blocked_status_changed", (evt) => {
    if (window.ADTDebugOverlay?.["updateConsentBanner"]) {
      window.ADTDebugOverlay.updateConsentBanner();
    }
  });
  const cmpIntegrations = {
    cookiesyes: {
      detect: () =>
        typeof window.cookieyes !== "undefined" ||
        document.querySelector(".cky-consent-container"),
      init: () => {
        if (
          typeof window.cookieyes !== "undefined" &&
          window.cookieyes.consent
        ) {
          consentLog("CookiesYes Pro detected - using event API");
          document.addEventListener("cookieyes_consent_update", (payload) => {
            const eventName = payload.detail;
            window.setADTConsent(
              "analytics",
              eventName.accepted.includes("analytics") ||
                eventName.accepted.includes("performance"),
              "cookiesyes_pro",
            );
            window.setADTConsent(
              "marketing",
              eventName.accepted.includes("advertisement") ||
                eventName.accepted.includes("marketing"),
              "cookiesyes_pro",
            );
            consentLog("CookiesYes Pro consent updated via event", eventName);
          });
          if (window.cookieyes.consent.accepted) {
            const detail = window.cookieyes.consent.accepted;
            window.setADTConsent(
              "analytics",
              detail.includes("analytics") ||
                detail.includes("performance"),
              "cookiesyes_pro",
            );
            window.setADTConsent(
              "marketing",
              detail.includes("advertisement") ||
                detail.includes("marketing"),
              "cookiesyes_pro",
            );
            consentLog("CookiesYes Pro initial consent", detail);
          }
        }
        let lastCookieSignature = null;
        const pollCookieYesConsent = () => {
          const cookieMatch = document.cookie.match(/cookieyes-consent=([^;]*)/);
          if (cookieMatch && cookieMatch[1]) {
            try {
              const rawCookieValue = decodeURIComponent(cookieMatch[1]);
              let consentFlags = {};
              if (rawCookieValue.includes("consent:")) {
                const consentParts = rawCookieValue.split(",");
                consentParts.forEach((part) => {
                  const [categoryKey, categoryValue] = part.split(":");
                  if (categoryKey && categoryValue) {
                    consentFlags[categoryKey.trim()] = categoryValue.trim();
                  }
                });
              } else {
                if (rawCookieValue.startsWith("ey") || rawCookieValue.includes("=")) {
                  try {
                    const decodedB64 = atob(rawCookieValue);
                    consentFlags = JSON.parse(decodedB64);
                  } catch (parseErr) {
                    consentFlags = JSON.parse(rawCookieValue);
                  }
                } else {
                  consentFlags = JSON.parse(rawCookieValue);
                }
              }
              const consentSignature = JSON.stringify(consentFlags);
              if (consentSignature !== lastCookieSignature) {
                lastCookieSignature = consentSignature;
                const analyticsGranted =
                  consentFlags.analytics === "yes" ||
                  consentFlags.statistics === "yes" ||
                  consentFlags.performance === "yes" ||
                  consentFlags.analytical === "yes" ||
                  consentFlags.analytic === "yes";
                const marketingGranted =
                  consentFlags.advertisement === "yes" ||
                  consentFlags.marketing === "yes" ||
                  consentFlags.targeting === "yes" ||
                  consentFlags.promotional === "yes";
                window.setADTConsent("analytics", analyticsGranted, "cookiesyes");
                window.setADTConsent("marketing", marketingGranted, "cookiesyes");
                window.ADTConsent.analytics = analyticsGranted;
                window.ADTConsent.marketing = marketingGranted;
                consentLog("CookiesYes consent updated", {
                  analytics: analyticsGranted,
                  marketing: marketingGranted,
                  rawConsent: consentFlags,
                });
                window.dispatchEvent(
                  new CustomEvent("adt_consent_update", {
                    detail: {
                      analytics: analyticsGranted,
                      marketing: marketingGranted,
                    },
                  }),
                );
              }
            } catch (cookieParseErr) {
              if (
                window.ADTData?.["debug_mode"] === "1" &&
                lastCookieSignature !== "error_logged"
              ) {
                consentLog(
                  "CookiesYes cookie format error:",
                  cookieParseErr.message,
                );
                lastCookieSignature = "error_logged";
              }
            }
          }
        };
        pollCookieYesConsent();
        setInterval(pollCookieYesConsent, 1000);
      },
    },
    cookiebot: {
      detect: () => typeof window.Cookiebot !== "undefined",
      init: () => {
        window.addEventListener("CookiebotOnConsentReady", () => {
          window.setADTConsent(
            "analytics",
            window.Cookiebot.consent.statistics,
            "cookiebot",
          );
          window.setADTConsent(
            "marketing",
            window.Cookiebot.consent.marketing,
            "cookiebot",
          );
          consentLog("Cookiebot consent ready");
        });
        window.addEventListener("CookiebotOnAccept", () => {
          window.setADTConsent(
            "analytics",
            window.Cookiebot.consent.statistics,
            "cookiebot",
          );
          window.setADTConsent(
            "marketing",
            window.Cookiebot.consent.marketing,
            "cookiebot",
          );
          consentLog("Cookiebot consent accepted");
        });
        window.addEventListener("CookiebotOnDecline", () => {
          window.setADTConsent("analytics", false, "cookiebot");
          window.setADTConsent("marketing", false, "cookiebot");
          consentLog("Cookiebot consent declined");
        });
        if (window.Cookiebot && window.Cookiebot.consent) {
          window.setADTConsent(
            "analytics",
            window.Cookiebot.consent.statistics,
            "cookiebot",
          );
          window.setADTConsent(
            "marketing",
            window.Cookiebot.consent.marketing,
            "cookiebot",
          );
        }
      },
    },
    onetrust: {
      detect: () => typeof window.OneTrust !== "undefined",
      init: () => {
        window.OneTrust?.["OnConsentChanged"]?.(() => {
          const activeGroups = window.OnetrustActiveGroups || "";
          window.setADTConsent(
            "analytics",
            activeGroups.includes("C0002"),
            "onetrust",
          );
          window.setADTConsent(
            "marketing",
            activeGroups.includes("C0004"),
            "onetrust",
          );
          consentLog("OneTrust consent updated");
        });
        const initialGroups = window.OnetrustActiveGroups || "";
        if (initialGroups) {
          window.setADTConsent(
            "analytics",
            initialGroups.includes("C0002"),
            "onetrust",
          );
          window.setADTConsent(
            "marketing",
            initialGroups.includes("C0004"),
            "onetrust",
          );
        }
      },
    },
    klaro: {
      detect: () => typeof window.klaro !== "undefined",
      init: () => {
        if (window.klaro && window.klaro.getManager) {
          const klaroManager = window.klaro.getManager();
          if (klaroManager) {
            klaroManager.watch({
              update: (consentsState) => {
                window.setADTConsent(
                  "analytics",
                  consentsState.consents?.["analytics"] === true,
                  "klaro",
                );
                window.setADTConsent(
                  "marketing",
                  consentsState.consents?.["marketing"] === true,
                  "klaro",
                );
                consentLog("Klaro consent updated");
              },
            });
            if (klaroManager.consents) {
              window.setADTConsent(
                "analytics",
                klaroManager.consents.analytics === true,
                "klaro",
              );
              window.setADTConsent(
                "marketing",
                klaroManager.consents.marketing === true,
                "klaro",
              );
            }
          }
        }
      },
    },
    osano: {
      detect: () => typeof window.Osano !== "undefined",
      init: () => {
        if (window.Osano && window.Osano.cm) {
          window.Osano.cm.addEventListener(
            "osano-cm-consent-changed",
            (osanoEvent) => {
              const osanoConsent =
                osanoEvent.detail || window.Osano.cm.getConsent();
              window.setADTConsent(
                "analytics",
                osanoConsent?.["ANALYTICS"] === "ACCEPT",
                "osano",
              );
              window.setADTConsent(
                "marketing",
                osanoConsent?.["MARKETING"] === "ACCEPT",
                "osano",
              );
              consentLog("Osano consent updated");
            },
          );
          const initialOsano = window.Osano.cm.getConsent();
          if (initialOsano) {
            window.setADTConsent(
              "analytics",
              initialOsano.ANALYTICS === "ACCEPT",
              "osano",
            );
            window.setADTConsent(
              "marketing",
              initialOsano.MARKETING === "ACCEPT",
              "osano",
            );
          }
        }
      },
    },
    complianz: {
      detect: () => typeof window.complianz !== "undefined",
      init: () => {
        document.addEventListener("cmplz_status_change", () => {
          if (window.complianz && window.complianz.consents) {
            window.setADTConsent(
              "analytics",
              window.complianz.consents.statistics === "allow",
              "complianz",
            );
            window.setADTConsent(
              "marketing",
              window.complianz.consents.marketing === "allow",
              "complianz",
            );
            consentLog("Complianz consent updated");
          }
        });
        if (window.complianz && window.complianz.consents) {
          window.setADTConsent(
            "analytics",
            window.complianz.consents.statistics === "allow",
            "complianz",
          );
          window.setADTConsent(
            "marketing",
            window.complianz.consents.marketing === "allow",
            "complianz",
          );
        }
      },
    },
    termly: {
      detect: () => typeof window.Termly !== "undefined",
      init: () => {
        if (window.Termly) {
          window.Termly.onConsentChanged = (termlyState) => {
            window.setADTConsent(
              "analytics",
              termlyState?.["analytics"] === true,
              "termly",
            );
            window.setADTConsent(
              "marketing",
              termlyState?.["advertising"] === true,
              "termly",
            );
            consentLog("Termly consent updated");
          };
          if (window.Termly.getConsentState) {
            const termlyConsent = window.Termly.getConsentState();
            if (termlyConsent) {
              window.setADTConsent(
                "analytics",
                termlyConsent.analytics === true,
                "termly",
              );
              window.setADTConsent(
                "marketing",
                termlyConsent.advertising === true,
                "termly",
              );
            }
          }
        }
      },
    },
    borlabs: {
      detect: () => typeof window.BorlabsCookie !== "undefined",
      init: () => {
        document.addEventListener("borlabs-cookie-consent-saved", () => {
          if (window.BorlabsCookie && window.BorlabsCookie.checkCookieConsent) {
            window.setADTConsent(
              "analytics",
              window.BorlabsCookie.checkCookieConsent("analytics"),
              "borlabs",
            );
            window.setADTConsent(
              "marketing",
              window.BorlabsCookie.checkCookieConsent("marketing"),
              "borlabs",
            );
            consentLog("Borlabs consent updated");
          }
        });
        if (window.BorlabsCookie && window.BorlabsCookie.checkCookieConsent) {
          window.setADTConsent(
            "analytics",
            window.BorlabsCookie.checkCookieConsent("analytics"),
            "borlabs",
          );
          window.setADTConsent(
            "marketing",
            window.BorlabsCookie.checkCookieConsent("marketing"),
            "borlabs",
          );
        }
      },
    },
    gtm: {
      detect: () => typeof window.gtag !== "undefined",
      init: () => {
        window.addEventListener("adt_datalayer_push", (dlPushEvt) => {
          const dlPayload = dlPushEvt.detail;
          if (
            Array.isArray(dlPayload) &&
            dlPayload[0] === "consent" &&
            dlPayload[1] === "update"
          ) {
            const consentUpdate = dlPayload[2];
            if (consentUpdate?.["analytics_storage"]) {
              window.setADTConsent(
                "analytics",
                consentUpdate.analytics_storage === "granted",
                "gtm",
              );
            }
            if (consentUpdate?.["ad_storage"]) {
              window.setADTConsent(
                "marketing",
                consentUpdate.ad_storage === "granted",
                "gtm",
              );
            }
            consentLog("GTM consent updated");
          }
        });
      },
    },
    tcf: {
      detect: () => typeof window.__tcfapi !== "undefined",
      init: () => {
        window.__tcfapi("addEventListener", 2, (tcData, success) => {
          if (
            (success && tcData.eventStatus === "useractioncomplete") ||
            tcData.eventStatus === "tcloaded"
          ) {
            const tcfAnalytics = !!(
              tcData.purpose?.["consents"]?.[1] &&
              (tcData.purpose?.["consents"]?.[7] ||
                tcData.purpose?.["consents"]?.[10])
            );
            const tcfMarketing = !!(
              tcData.purpose?.["consents"]?.[2] ||
              tcData.purpose?.["consents"]?.[3] ||
              tcData.purpose?.["consents"]?.[4]
            );
            window.setADTConsent("analytics", tcfAnalytics, "tcf");
            window.setADTConsent("marketing", tcfMarketing, "tcf");
            if (tcData.vendor?.["consents"]) {
              if (typeof tcData.vendor.consents[755] !== "undefined") {
                window.setADTConsent(
                  "google",
                  tcData.vendor.consents[755],
                  "tcf",
                );
              }
              if (typeof tcData.vendor.consents[89] !== "undefined") {
                window.setADTConsent(
                  "meta",
                  tcData.vendor.consents[89],
                  "tcf",
                );
              }
              if (typeof tcData.vendor.consents[793] !== "undefined") {
                window.setADTConsent(
                  "amazon",
                  tcData.vendor.consents[793],
                  "tcf",
                );
              }
            }
            consentLog("TCF consent updated");
          }
        });
      },
    },
    cookieconsent: {
      detect: () => typeof window.cookieconsent !== "undefined",
      init: () => {
        if (window.cookieconsent) {
          window.cookieconsent.initialise({
            onStatusChange: function (status) {
              const allowed = status === "allow";
              window.setADTConsent("analytics", allowed, "cookieconsent");
              window.setADTConsent("marketing", allowed, "cookieconsent");
              consentLog("Cookie Consent updated:", status);
            },
          });
        }
      },
    },
  };
  function initPreferredCmp() {
    let cmpDetected = false;
    let retryCount = 0;
    const tryDetectCmps = () => {
      for (const [cmpId, cmp] of Object.entries(cmpIntegrations)) {
        if (cmp.detect()) {
          consentLog("Detected CMP: " + cmpId);
          cmp.init();
          cmpDetected = true;
        }
      }
      if (!cmpDetected && retryCount < 10) {
        retryCount++;
        setTimeout(tryDetectCmps, 500);
      } else {
        if (!cmpDetected) {
          consentLog("No CMP detected after retries");
          if (window.ADTData?.["fallback_track_without_cmp"] === "1") {
            window.setADTConsent("analytics", true, "no_cmp_override");
            window.setADTConsent("marketing", true, "no_cmp_override");
          } else if (window.ADTData?.["fallback_track_without_cmp"] === "1") {
            window.setADTConsent("analytics", true, "no_cmp_fallback");
          }
        }
      }
    };
    tryDetectCmps();
    return cmpDetected;
  }
  function applyCmpConsent(onReady, waitTimeoutMs = null) {
    if (window.ADTData?.["delay_until_consent"] !== "1") {
      onReady();
      return;
    }
    if (!waitTimeoutMs) {
      waitTimeoutMs =
        (parseInt(window.ADTData?.["cmp_detection_timeout"]) || 5) * 1000;
    }
    const waitStartedAt = Date.now();
    const waitInterval = setInterval(() => {
      const hasAnalytics = hasConsent("analytics");
      const elapsedMs = Date.now() - waitStartedAt;
      if (hasAnalytics) {
        clearInterval(waitInterval);
        consentLog("Consent granted, starting tracking");
        onReady();
      } else if (elapsedMs >= waitTimeoutMs) {
        clearInterval(waitInterval);
        consentLog("Consent timeout reached (" + waitTimeoutMs + "ms)");
        if (window.ADTData?.["fallback_track_without_cmp"] === "1") {
          consentLog("Using fallback, starting tracking");
          onReady();
        }
      }
    }, 300);
  }
  function bootstrapConsent() {
    consentLog("Initializing consent manager");
    try {
      [
        "analytics",
        "marketing",
        "meta",
        "google",
        "tiktok",
        "linkedin",
      ].forEach((entry) => {
        const state = sessionStorage.getItem("adt_consent_" + entry);
        if (state) {
          const ctx = JSON.parse(state);
          window.ADTConsent[entry] = ctx.value;
          consentLog("Restored consent: " + entry + " = " + ctx.value);
        }
      });
    } catch (restoreErr) {
      consentLog("Could not restore consent from storage", restoreErr);
    }
    const cmpName = initPreferredCmp();
    if (hasConsent("analytics")) {
      consentLog("Consent already granted on page load, firing event");
      setTimeout(() => {
        window.dispatchEvent(new Event("adt_consent_granted"));
      }, 100);
    }
    syncDataLayerBlocked();
    const initialStatus =
      window.ADTConsent.analytics === true
        ? "granted"
        : window.ADTConsent.analytics === false
          ? "denied"
          : "unknown";
    pushConsentEvent("consent_loaded", {
      cmp_name: cmpName || "none",
      initial_consent: initialStatus,
      consent_status: initialStatus,
      consent_source: cmpName ? "cmp" : "default",
      all_consents: {
        ...window.ADTConsent,
      },
    });
    window.ADTConsentReady = true;
    consentLog("Consent manager ready");
    if (window.ADTIntegration) {
      window.ADTIntegration.moduleReady("consent");
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrapConsent);
  } else {
    bootstrapConsent();
  }
  window.ADTConsentManager = {
    hasConsent: window.hasConsent,
    setConsent: window.setADTConsent,
    getState: () => ({
      ...window.ADTConsent,
    }),
    waitForConsent: applyCmpConsent,
    isReady: () => window.ADTConsentReady === true,
  };
})();
