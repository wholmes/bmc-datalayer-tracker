/*!
 * DataLayer Tracker - Debug Overlay Simulator
 *
 * Provides testing capabilities for various tracking events
 *
 * CHANGES:
 * - Added _simulated flag to all simulated events for ghost icon display
 * - Made simulator self-contained (no dependency errors)
 * - Fixed initialization timing issues
 *
 * @preserve
 * @package    DataLayer_Tracker
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @version    1.0.1
 * @since      1.0.0
 */
(function () {
  "use strict";

  window.ADTSimulator = {
    config: {
      vendors: [
        "generic",
        "hubspot",
        "marketo",
        "gravityforms",
        "typeform",
        "jotform",
        "growform",
      ],
      eventTypes: [
        {
          value: "allVendors",
          label: "Form Submit (All Vendors)",
        },
        {
          value: "formSubmit",
          label: "Form Submit (Single Vendor)",
        },
        {
          value: "ecommerce",
          label: "Ecommerce Flow",
        },
        {
          value: "engagement",
          label: "Engagement Signals",
        },
        {
          value: "pageView",
          label: "Page View",
        },
        {
          value: "sessionProfile",
          label: "Session Profile",
        },
        {
          value: "ctaExposure",
          label: "CTA Exposure",
        },
        {
          value: "fullJourney",
          label: "Full Journey Test",
        },
        {
          value: "randomJourney",
          label: "Random Journey",
        },
      ],
    },
    init: function (adtData = 0) {
      if (!window.ADTData) {
        if (adtData < 20) {
          return setTimeout(() => this.init(adtData + 1), 200);
        }
        console.warn("[ADT Simulator] ADTData not available, aborting");
        return;
      }
      const config = window.ADTData.showSimulator;
      if (config === 0 || config === "0" || config === false) {
        if (window.ADTData?.["debug"]) {
          console.log("[ADT-debug] 👻 Simulator disabled via settings");
        }
        return;
      }
      const payload = document.getElementById("adt-ov-controls");
      if (!payload) {
        if (adtData < 20) {
          return setTimeout(() => this.init(adtData + 1), 200);
        }
        if (window.ADTData?.["debug"]) {
          console.warn("[ADT-debug] ✗ Simulator: #adt-ov-controls not found");
        }
        return;
      }
      if (document.getElementById("adt-event-simulator")) {
        if (window.ADTData?.["debug"]) {
          console.log("[ADT-debug] 👻 Simulator already initialized");
        }
        return;
      }
      this.createSimulatorUI(payload);
      if (window.ADTData?.["debug"]) {
        console.log("[ADT-debug] 👻 Event Simulator initialized");
      }
    },
    createSimulatorUI: function (eventName) {
      const detail = document.createElement("div");
      detail.id = "adt-event-simulator";
      Object.assign(detail.style, {
        background: "var(--ctrl)",
        border: "1px solid #3a3a3a",
        borderRadius: "6px",
        marginTop: "6px",
        fontSize: "11px",
        color: "var(--fg)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
      });
      const element = this.createSimulatorHeader();
      detail.appendChild(element);
      const target = this.createSimulatorBody();
      detail.appendChild(target);
      this.setupCollapse(element, target);
      eventName.prepend(detail);
    },
    createSimulatorHeader: function () {
      const result = document.createElement("div");
      Object.assign(result.style, {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "4px 6px",
        cursor: "pointer",
        background: "rgba(255,255,255,0.04)",
        borderBottom: "1px solid #2a2a2a",
        fontSize: "11px",
        fontWeight: "600",
      });
      result.innerHTML =
        '\n        <span style="display:flex;align-items:center;gap:6px;">👻 Event Simulator</span>\n        <svg id="adt-sim-arrow" width="12" height="12" viewBox="0 0 20 20" fill="none"\n             xmlns="http://www.w3.org/2000/svg" style="transition:transform 0.2s ease;">\n          <polyline points="6 8 10 12 14 8" stroke="white" stroke-width="2"\n                    stroke-linecap="round" stroke-linejoin="round"/>\n        </svg>\n      ';
      return result;
    },
    createSimulatorBody: function () {
      const value = document.createElement("div");
      Object.assign(value.style, {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        padding: "6px",
      });
      const flag = this.createControlsRow();
      value.appendChild(flag);
      const enabled = this.createPushToggle();
      value.appendChild(enabled);
      return value;
    },
    createControlsRow: function () {
      const url = document.createElement("div");
      Object.assign(url.style, {
        display: "flex",
        gap: "6px",
        alignItems: "center",
      });
      const pattern = document.createElement("select");
      pattern.id = "adt-sim-event-type";
      Object.assign(pattern.style, {
        flex: "1",
        fontSize: "11px",
        padding: "3px 5px",
        background: "var(--ctrl)",
        color: "var(--fg)",
        border: "1px solid #444",
        borderRadius: "4px",
      });
      pattern.innerHTML =
        '<option value="">Select Event</option>' +
        this.config.eventTypes
          .map(
            (regex) =>
              '<option value="' +
              regex.value +
              '">' +
              regex.label +
              "</option>",
          )
          .join("");
      url.appendChild(pattern);
      const depth = document.createElement("select");
      depth.id = "adt-sim-vendor";
      Object.assign(depth.style, {
        flex: "0.8",
        fontSize: "11px",
        padding: "3px 5px",
        background: "var(--ctrl)",
        color: "var(--fg)",
        border: "1px solid #444",
        borderRadius: "4px",
        display: "none",
      });
      depth.innerHTML = this.config.vendors
        .map(
          (percent) =>
            '<option value="' + percent + '">' + percent + "</option>",
        )
        .join("");
      url.appendChild(depth);
      const scrollY = this.createRunButton();
      url.appendChild(scrollY);
      this.setupControlListeners(pattern, depth, scrollY);
      return url;
    },
    createRunButton: function () {
      const scrollTop = document.createElement("button");
      scrollTop.id = "adt-sim-run";
      Object.assign(scrollTop.style, {
        width: "26px",
        height: "26px",
        border: "1px solid #444",
        borderRadius: "4px",
        background: "#2a2a2a",
        color: "#fff",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        transition: "background 0.2s",
      });
      const pageKey = document.createElement("span");
      Object.assign(pageKey.style, {
        display: "inline-block",
        width: "0",
        height: "0",
        borderTop: "4px solid transparent",
        borderBottom: "4px solid transparent",
        borderLeft: "5px solid white",
        marginLeft: "2px",
      });
      scrollTop.appendChild(pageKey);
      scrollTop.onmouseenter = () => (scrollTop.style.background = "#444");
      scrollTop.onmouseleave = () => (scrollTop.style.background = "#2a2a2a");
      return scrollTop;
    },
    createPushToggle: function () {
      const firedSet = document.createElement("label");
      Object.assign(firedSet.style, {
        fontSize: "10px",
        color: "#aaa",
        display: "flex",
        alignItems: "center",
        gap: "4px",
      });
      firedSet.innerHTML =
        '\n        <input type="checkbox" id="adt-push-sim" style="margin:0;width:12px;height:12px;" checked />\n        <span style="user-select:none;">Push to dataLayer</span>\n      ';
      return firedSet;
    },
    setupCollapse: function (milestone, timerId) {
      const intervalId = milestone.querySelector("#adt-sim-arrow");
      milestone.addEventListener("click", () => {
        const activeSec = timerId.style.display === "none";
        timerId.style.display = activeSec ? "flex" : "none";
        intervalId.style.transform = activeSec
          ? "rotate(180deg)"
          : "rotate(0deg)";
        try {
          localStorage.setItem("adt_sim_collapsed", activeSec ? "0" : "1");
        } catch (tickCount) {}
      });
      try {
        if (localStorage.getItem("adt_sim_collapsed") === "1") {
          timerId.style.display = "none";
          intervalId.style.transform = "rotate(0deg)";
        } else {
          intervalId.style.transform = "rotate(180deg)";
        }
      } catch (saveTick) {
        intervalId.style.transform = "rotate(180deg)";
      }
    },
    setupControlListeners: function (isActive, lastTick, milestones) {
      isActive.addEventListener("change", () => {
        lastTick.style.display =
          isActive.value === "formSubmit" ? "" : "none";
        isActive.style.flex = isActive.value === "formSubmit" ? "1" : "auto";
      });
      milestones.addEventListener("click", () => {
        this.runSimulation(isActive.value, lastTick.value);
      });
    },
    runSimulation: function (firedMilestones, pagePath) {
      const scrollHeight =
        document.getElementById("adt-push-sim")?.["checked"] || false;
      switch (firedMilestones) {
        case "allVendors":
          this.simulateAllVendors(scrollHeight);
          break;
        case "formSubmit":
          if (!pagePath) {
            alert("Please select a vendor");
            return;
          }
          this.simulateFormSubmit(pagePath, scrollHeight);
          break;
        case "ecommerce":
          this.simulateEcommerce(scrollHeight);
          break;
        case "engagement":
          this.simulateEngagement(scrollHeight);
          break;
        case "pageView":
          this.simulatePageView(scrollHeight);
          break;
        case "sessionProfile":
          this.simulateSessionProfile(scrollHeight);
          break;
        case "ctaExposure":
          this.simulateCTAExposure(scrollHeight);
          break;
        case "fullJourney":
          this.simulateFullJourney(scrollHeight);
          break;
        case "randomJourney":
          this.simulateRandomJourney(scrollHeight);
          break;
        default:
          alert("Please select an event type");
      }
    },
    pushEvent: function (
      viewportH,
      scrollPct = null,
      threshold = {},
      tolerance = true,
    ) {
      viewportH._simulated = true;
      if (!tolerance) {
        if (window.ADTData?.["debug"]) {
          console.log("👻 Preview only:", viewportH);
        }
        return;
      }
      const evt =
        scrollPct || viewportH.event || JSON.stringify(viewportH);
      try {
        if (typeof window.adtPushDeduped === "function") {
          window.adtPushDeduped(viewportH, evt, threshold);
        } else {
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push(viewportH);
        }
      } catch (item) {
        console.warn(
          "[ADT Simulator] Push error, using basic dataLayer.push:",
          item,
        );
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(viewportH);
      }
      if (window.ADTData?.["debug"]) {
        console.log("[ADT Simulator Push]", viewportH);
      }
    },
    simulateAllVendors: function (key) {
      this.config.vendors.forEach((err, idx) => {
        setTimeout(() => {
          this.simulateFormSubmit(err, key);
        }, idx * 0x12c);
      });
    },
    simulateFormSubmit: function (len, mode) {
      const typeVal = {
        event: "form_submit",
        formVendor: len,
        formId: "sim-" + len,
        vendorId: "debug-" + len,
        formGoal: "sim_goal_" + len,
        page: {
          url: location.href,
          title: document.title,
        },
        fields: {
          name: "Sim User",
          email: "sim@" + len + ".com",
          company: "SimCo",
          phone: "555-1234",
        },
      };
      this.pushEvent(typeVal, "form_" + len, {}, mode);
    },
    simulateEcommerce: function (nameVal) {
      const opts = {
        item_id: "SKU-123",
        item_name: "Simulated T-Shirt",
        item_sku: "TSHIRT-123",
        item_variant: "Blue / Large",
        item_category: "Apparel",
        item_category2: "T-Shirts",
        item_brand: "SimBrand",
        price: 19.99,
        currency: "USD",
        quantity: 1,
      };
      const ref = {
        item_id: "SKU-456",
        item_name: "Simulated Jeans",
        item_sku: "JEANS-456",
        item_variant: "Black / 32",
        item_category: "Apparel",
        item_category2: "Jeans",
        item_brand: "SimDenim",
        price: 49.99,
        currency: "USD",
        quantity: 1,
      };
      const val = [
        {
          event: "view_item_list",
          ecommerce: {
            item_list_id: "sim_list",
            item_list_name: "Sim Category",
            items: [opts, ref],
          },
        },
        {
          event: "select_item",
          ecommerce: {
            item_list_id: "sim_list",
            items: [opts],
          },
        },
        {
          event: "view_item",
          ecommerce: {
            items: [opts],
          },
        },
        {
          event: "add_to_cart",
          ecommerce: {
            items: [opts, ref],
          },
        },
        {
          event: "view_cart",
          ecommerce: {
            items: [opts, ref],
          },
        },
        {
          event: "begin_checkout",
          ecommerce: {
            items: [opts, ref],
            checkout_step: 1,
            checkout_step_label: "Billing",
          },
        },
        {
          event: "checkout_progress",
          ecommerce: {
            items: [opts, ref],
            checkout_step: 0x2,
            checkout_step_label: "Shipping Info",
          },
        },
        {
          event: "checkout_progress",
          ecommerce: {
            items: [opts, ref],
            checkout_step: 3,
            checkout_step_label: "Payment Info",
          },
        },
        {
          event: "purchase",
          ecommerce: {
            transaction_id: "SIM-123",
            affiliation: "Simulator Store",
            value: 69.98,
            tax: 5.25,
            shipping: 7.99,
            currency: "USD",
            coupon: "TEST10",
            items: [opts, ref],
          },
        },
      ];
      val.forEach((obj, fn) => {
        setTimeout(() => {
          this.pushEvent(obj, obj.event + "_sim", {}, nameVal);
        }, fn * 0x12c);
      });
    },
    simulateEngagement: function (arg) {
      this.pushEvent(
        {
          event: "scroll_depth",
          scrollPercent: 0x4b,
        },
        "scroll75",
        {},
        arg,
      );
      setTimeout(() => {
        this.pushEvent(
          {
            event: "active_time",
            seconds: 0x3c,
          },
          "active60",
          {},
          arg,
        );
      }, 200);
      setTimeout(() => {
        this.pushEvent(
          {
            event: "time_on_page",
            seconds: 0x78,
          },
          "time120",
          {},
          arg,
        );
      }, 0x190);
    },
    simulatePageView: function (tmp) {
      this.pushEvent(
        {
          event: "page_view",
          page: {
            url: location.href,
            title: document.title,
          },
        },
        "page",
        {},
        tmp,
      );
    },
    simulateSessionProfile: function (node) {
      this.pushEvent(
        {
          event: "session_profile",
          visit_count: 3,
          likely_intent: "simulated",
          source_type: "direct",
        },
        "session",
        {},
        node,
      );
    },
    simulateCTAExposure: function (list) {
      this.pushEvent(
        {
          event: "ctaExposure",
          label: "Sim CTA",
          ctaText: "Get Started",
        },
        "cta",
        {},
        list,
      );
    },
    simulateFullJourney: function (entry) {
      const state = [
        {
          item_id: "SKU-123",
          item_name: "Simulated T-Shirt",
          price: 19.99,
          currency: "USD",
          quantity: 1,
        },
        {
          item_id: "SKU-456",
          item_name: "Simulated Jeans",
          price: 49.99,
          currency: "USD",
          quantity: 1,
        },
      ];
      const ctx = [
        {
          event: "page_view",
          page: {
            url: location.href,
            title: document.title,
          },
        },
        this.createFormSubmitEvent("hubspot"),
        {
          event: "scroll_depth",
          scrollPercent: 0x4b,
        },
        {
          event: "active_time",
          seconds: 0x3c,
        },
        {
          event: "time_on_page",
          seconds: 0x78,
        },
        {
          event: "view_item_list",
          ecommerce: {
            items: state,
          },
        },
        {
          event: "select_item",
          ecommerce: {
            items: [state[0]],
          },
        },
        {
          event: "view_item",
          ecommerce: {
            items: [state[0]],
          },
        },
        {
          event: "add_to_cart",
          ecommerce: {
            items: state,
          },
        },
        {
          event: "view_cart",
          ecommerce: {
            items: state,
          },
        },
        {
          event: "begin_checkout",
          ecommerce: {
            items: state,
            checkout_step: 1,
          },
        },
        {
          event: "checkout_progress",
          ecommerce: {
            items: state,
            checkout_step: 0x2,
          },
        },
        {
          event: "purchase",
          ecommerce: {
            transaction_id: "SIM-ORDER-123",
            value: 69.98,
            currency: "USD",
            items: state,
          },
        },
        {
          event: "session_profile",
          visit_count: 0x2,
          likely_intent: "engaged returner",
          source_type: "organic",
        },
      ];
      ctx.forEach((data, row) => {
        setTimeout(
          () => this.pushEvent(data, null, {}, entry),
          row * 0x12c,
        );
      });
    },
    simulateRandomJourney: function (col) {
      const mapVal = [
        {
          item_id: "SKU-789",
          item_name: "Simulated Hat",
          item_brand: "SimHeadwear",
          price: 14.99,
          currency: "USD",
          quantity: Math.ceil(Math.random() * 0x2),
        },
        {
          item_id: "SKU-321",
          item_name: "Simulated Sneakers",
          item_brand: "SimShoes",
          price: 79.99,
          currency: "USD",
          quantity: Math.ceil(Math.random() * 0x2),
        },
      ];
      const setVal = Math.random() > 0.5 ? "RAND10" : null;
      const buf = "SIM-RAND-" + Math.floor(Math.random() * 0x2710);
      const raw = [
        {
          event: "page_view",
          page: {
            url: location.href,
            title: document.title,
          },
        },
        {
          event: "view_item_list",
          ecommerce: {
            items: mapVal,
          },
        },
        {
          event: "select_item",
          ecommerce: {
            items: [mapVal[Math.floor(Math.random() * mapVal.length)]],
          },
        },
        {
          event: "view_item",
          ecommerce: {
            items: [mapVal[0]],
          },
        },
        {
          event: "add_to_cart",
          ecommerce: {
            items: mapVal,
          },
        },
        {
          event: "view_cart",
          ecommerce: {
            items: mapVal,
          },
        },
        {
          event: "begin_checkout",
          ecommerce: {
            items: mapVal,
            checkout_step: 1,
          },
        },
        {
          event: "checkout_progress",
          ecommerce: {
            items: mapVal,
            checkout_step: 0x2,
          },
        },
        {
          event: "purchase",
          ecommerce: {
            transaction_id: buf,
            value: mapVal.reduce(
              (parsed, text) =>
                parsed + text.price * text.quantity,
              0,
            ),
            currency: "USD",
            coupon: setVal,
            items: mapVal,
          },
        },
      ];
      const html = Math.random();
      let cmpName = raw.length;
      if (html < 0.3) {
        cmpName = 3;
      } else {
        if (html < 0.6) {
          cmpName = 0x5;
        } else if (html < 0.8) {
          cmpName = 0x7;
        }
      }
      raw.slice(0, cmpName).forEach((handler, callback) => {
        const response = 200 + Math.random() * 0x258;
        setTimeout(
          () => this.pushEvent(handler, null, {}, col),
          callback * response,
        );
      });
      if (cmpName < raw.length && window.ADTData?.["debug"]) {
        console.warn("👻 Simulated user abandoned journey at step", cmpName);
      }
    },
    createFormSubmitEvent: function (request) {
      return {
        event: "form_submit",
        formVendor: request,
        formId: "sim-" + request,
        vendorId: "debug-" + request,
        formGoal: "sim_goal_" + request,
        page: {
          url: location.href,
          title: document.title,
        },
        fields: {
          name: "Sim User",
          email: "sim@" + request + ".com",
          company: "SimCo",
          phone: "555-1234",
        },
      };
    },
  };
  document.addEventListener("adtOverlayReady", () => {
    if (window.ADTData?.["debug"]) {
      console.log("[ADT Simulator] Received adtOverlayReady event");
    }
    window.ADTSimulator.init();
  });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(() => window.ADTSimulator.init(), 500);
    });
  } else {
    setTimeout(() => window.ADTSimulator.init(), 500);
  }
})();
