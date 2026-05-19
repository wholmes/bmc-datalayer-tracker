/**
 * DataLayer Tracker - Form Vendor Integrations
 *
 * Detects and handles vendor-specific form implementations
 *
 * @package    DataLayer_Tracker
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @version    2.0.0
 * @since      1.0.0
 */
(function () {
  "use strict";

  if (window.ADTFormVendors) {
    return;
  }
  if (window.ADTData?.["shouldTrackPage"] === false) {
    if (window.ADTData?.["debug"]) {
      console.log("[ADT ModuleName] Event blocked - page excluded by regex");
    }
    return;
  }
  const adtData =
    window.ADTData?.["debug"] === "1" || window.ADTData?.["debug"] === true;
  window.ADTFormVendors = {
    vendorForms: new WeakMap(),
    vendors: {
      marketo: {
        selectors: ["form[data-marketo-form-id]", 'form[id^="mktoForm_"]'],
        detect: (config) => {
          return (
            config.hasAttribute("data-marketo-form-id") ||
            config.id?.["startsWith"]("mktoForm_") ||
            config.querySelector(
              'input[name="mkt_tok"], input[name="marketo_form_id"]',
            ) !== null
          );
        },
        getFormId: (payload) => {
          return (
            payload.getAttribute("data-marketo-form-id") ||
            payload.id?.["replace"]("mktoForm_", "") ||
            "marketo_form"
          );
        },
      },
      hubspot: {
        selectors: ["form.hs-form", "form[data-hs-form-id]"],
        detect: (eventName) => {
          return (
            eventName.classList.contains("hs-form") ||
            eventName.hasAttribute("data-hs-form-id") ||
            eventName.querySelector(
              'input[name="hs_context"], input[name="hubspotutk"]',
            ) !== null
          );
        },
        getFormId: (detail) => {
          return (
            detail.getAttribute("data-hs-form-id") ||
            detail.id ||
            "hubspot_form"
          );
        },
      },
      gravityforms: {
        selectors: ["form.gform_wrapper", 'form[id^="gform_"]'],
        detect: (element) => {
          return (
            element.classList.contains("gform_wrapper") ||
            element.id?.["startsWith"]("gform_") ||
            element.querySelector('input[name="gform_submit"]') !== null
          );
        },
        getFormId: (target) => {
          const result = target.querySelector(
            'input[name="gform_submit"]',
          );
          return result?.["value"] || target.id || "gravity_form";
        },
      },
      contactform7: {
        selectors: ["form.wpcf7-form"],
        detect: (value) => {
          return (
            value.classList.contains("wpcf7-form") ||
            value.id?.["includes"]("wpcf7")
          );
        },
        getFormId: (flag) => {
          return (
            flag.getAttribute("data-id") || flag.id || "cf7_form"
          );
        },
      },
      wpforms: {
        selectors: ["form.wpforms-form"],
        detect: (enabled) => {
          return (
            enabled.classList.contains("wpforms-form") ||
            enabled.id?.["includes"]("wpforms")
          );
        },
        getFormId: (url) => {
          return (
            url.getAttribute("data-formid") ||
            url.id ||
            "wpforms_form"
          );
        },
      },
      ninjaforms: {
        selectors: ["form.ninja-forms-form", 'form[id^="nf-form"]'],
        detect: (pattern) => {
          return (
            pattern.classList.contains("ninja-forms-form") ||
            pattern.id?.["startsWith"]("nf-form")
          );
        },
        getFormId: (regex) => {
          return (
            regex.getAttribute("data-form-id") ||
            regex.id ||
            "ninja_form"
          );
        },
      },
      formidable: {
        selectors: ["form.frm-show-form"],
        detect: (depth) => {
          return (
            depth.classList.contains("frm-show-form") ||
            depth.querySelector('input[name="form_id"][type="hidden"]') !==
              null
          );
        },
        getFormId: (percent) => {
          const scrollY = percent.querySelector('input[name="form_id"]');
          return scrollY?.["value"] || percent.id || "formidable_form";
        },
        handleAjax: true,
      },
      pardot: {
        selectors: ['form[action*="pardot"]'],
        detect: (scrollTop) => {
          return (
            scrollTop.action?.["includes"]("pardot") ||
            scrollTop.id?.["includes"]("pardot")
          );
        },
        getFormId: (pageKey) => {
          return pageKey.id || "pardot_form";
        },
      },
      mailchimp: {
        selectors: ['form[action*="list-manage.com"]'],
        detect: (firedSet) => {
          return (
            firedSet.action?.["includes"]("list-manage.com") ||
            firedSet.action?.["includes"]("mailchimp")
          );
        },
        getFormId: (milestone) => {
          return milestone.id || "mailchimp_form";
        },
      },
      activecampaign: {
        selectors: ['form[action*="activehosted"]'],
        detect: (timerId) => {
          return (
            timerId.action?.["includes"]("activehosted") ||
            timerId.className?.["includes"]("ac-form")
          );
        },
        getFormId: (intervalId) => {
          return intervalId.id || "activecampaign_form";
        },
      },
      typeform: {
        selectors: ['iframe[src*="typeform"]', "div[data-tf-widget]"],
        detect: (activeSec) => {
          if (activeSec.tagName === "IFRAME") {
            return activeSec.src?.["includes"]("typeform");
          }
          return activeSec.hasAttribute("data-tf-widget");
        },
        getFormId: (tickCount) => {
          if (tickCount.tagName === "IFRAME") {
            const saveTick = tickCount.src.match(/\/to\/([^/?]+)/);
            return saveTick?.[1] || "typeform_embed";
          }
          return tickCount.getAttribute("data-tf-widget") || "typeform_widget";
        },
        isEmbed: true,
      },
    },
    init() {
      if (this.initialized) {
        return;
      }
      if (
        !window.ADTData?.["include"]?.["formVendorTracking"] &&
        !window.ADTData?.["include"]?.["content"]?.["formVendorTracking"] &&
        !window.ADTData?.["formVendorTracking"]
      ) {
        if (adtData) {
          console.log("[ADT Form Vendors] Vendor tracking disabled");
        }
        return;
      }
      this.scanForVendorForms();
      this.initVendorHandlers();
      this.initialized = true;
      if (adtData) {
        console.log("[ADT Form Vendors] Initialized");
      }
    },
    detectVendor(isActive) {
      if (this.vendorForms.has(isActive)) {
        return this.vendorForms.get(isActive);
      }
      if (isActive.dataset.vendor) {
        this.vendorForms.set(isActive, isActive.dataset.vendor);
        return isActive.dataset.vendor;
      }
      for (const [lastTick, milestones] of Object.entries(this.vendors)) {
        if (milestones.detect(isActive)) {
          this.vendorForms.set(isActive, lastTick);
          return lastTick;
        }
      }
      this.vendorForms.set(isActive, "unknown");
      return "unknown";
    },
    getVendorFormId(firedMilestones, pagePath) {
      const scrollHeight = this.vendors[pagePath];
      if (scrollHeight?.["getFormId"]) {
        return scrollHeight.getFormId(firedMilestones);
      }
      return firedMilestones.id || firedMilestones.getAttribute("name") || "unknown_form";
    },
    scanForVendorForms() {
      Object.entries(this.vendors).forEach(([viewportH, scrollPct]) => {
        if (!scrollPct.selectors) {
          return;
        }
        scrollPct.selectors.forEach((threshold) => {
          const tolerance = document.querySelectorAll(threshold);
          tolerance.forEach((evt) => {
            if (evt.dataset.adtVendorTracked === "true") {
              return;
            }
            if (scrollPct.isEmbed) {
              this.trackEmbedForm(evt, viewportH, scrollPct);
            } else {
              this.enhanceVendorForm(evt, viewportH, scrollPct);
            }
            evt.dataset.adtVendorTracked = "true";
          });
        });
      });
      if (adtData) {
        const item = {};
        document
          .querySelectorAll('[data-adt-vendor-tracked="true"]')
          .forEach((key) => {
            const err = this.detectVendor(key);
            item[err] = (item[err] || 0) + 1;
          });
        if (Object.keys(item).length > 0) {
          console.log("[ADT Form Vendors] Detected forms:", item);
        }
      }
    },
    enhanceVendorForm(idx, len, mode) {
      this.vendorForms.set(idx, len);
      idx.dataset.adtVendor = len;
      if (mode.handleAjax) {
        this.setupAjaxHandlers(idx, len);
      }
      idx.addEventListener(
        "submit",
        (typeVal) => {
          idx.dataset.adtVendor = len;
        },
        true,
      );
    },
    trackEmbedForm(nameVal, opts, ref) {
      const val = ref.getFormId(nameVal);
      if (nameVal.tagName === "IFRAME") {
        nameVal.addEventListener("load", () => {
          const obj = {
            event: "form_view",
            form_vendor: opts,
            form_id: val,
            form_type: "embed",
            page_url: window.location.href,
            timestamp: new Date().toISOString(),
          };
          this.pushEvent(obj, "form_view_" + opts + "_" + val);
        });
      }
      if (nameVal.hasAttribute("data-tf-widget")) {
        if (window.tf) {
          window.tf.createWidget(nameVal.getAttribute("data-tf-widget"), {
            onSubmit: () => {
              const fn = {
                event: "form_submit",
                form_vendor: opts,
                form_id: val,
                form_type: "widget",
                timestamp: new Date().toISOString(),
              };
              this.pushEvent(
                fn,
                "form_submit_" + opts + "_" + val,
              );
            },
          });
        }
      }
    },
    setupAjaxHandlers(arg, tmp) {
      if (tmp === "formidable" && window.jQuery) {
        const node = window.jQuery;
        const list = node(arg);
        list.on("frmFormComplete", () => {
          const entry = {
            event: "form_submit",
            form_vendor: "formidable",
            form_id: this.getVendorFormId(arg, "formidable"),
            status: "success",
            timestamp: new Date().toISOString(),
          };
          this.pushEvent(entry, "formidable_success_" + entry.form_id);
        });
        list.on("frmFormErrors", () => {
          const state = {
            event: "form_error",
            form_vendor: "formidable",
            form_id: this.getVendorFormId(arg, "formidable"),
            status: "validation_error",
            timestamp: new Date().toISOString(),
          };
          this.pushEvent(state, "formidable_error_" + state.form_id);
        });
      }
    },
    initVendorHandlers() {
      if (window.hbspt) {
        window.hbspt.forms.onFormSubmit = (ctx) => {
          const data = {
            event: "form_submit",
            form_vendor: "hubspot",
            form_id: ctx,
            timestamp: new Date().toISOString(),
          };
          this.pushEvent(data, "hubspot_submit_" + ctx);
        };
      }
      if (window.MktoForms2) {
        window.MktoForms2.whenReady((row) => {
          row.onSuccess(() => {
            const col = {
              event: "form_submit",
              form_vendor: "marketo",
              form_id: row.getId(),
              timestamp: new Date().toISOString(),
            };
            this.pushEvent(col, "marketo_submit_" + row.getId());
            return true;
          });
        });
      }
      if (window.wpcf7) {
        document.addEventListener("wpcf7mailsent", (mapVal) => {
          const setVal = {
            event: "form_submit",
            form_vendor: "contactform7",
            form_id: mapVal.detail.contactFormId,
            status: "success",
            timestamp: new Date().toISOString(),
          };
          this.pushEvent(
            setVal,
            "cf7_submit_" + mapVal.detail.contactFormId,
          );
        });
        document.addEventListener("wpcf7invalid", (buf) => {
          const raw = {
            event: "form_error",
            form_vendor: "contactform7",
            form_id: buf.detail.contactFormId,
            status: "validation_error",
            timestamp: new Date().toISOString(),
          };
          this.pushEvent(
            raw,
            "cf7_error_" + buf.detail.contactFormId,
          );
        });
      }
    },
    pushEvent(parsed, text) {
      if (window.ADTFormTracker) {
        window.ADTFormTracker.pushEvent(parsed, text);
      } else if (typeof window.adtPushDeduped === "function") {
        window.adtPushDeduped(parsed, text, 500);
      } else {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(parsed);
      }
    },
  };
})();
