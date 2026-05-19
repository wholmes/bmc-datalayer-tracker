/*!
 * DataLayer Tracker - E-commerce Enrichment
 * 
 * Adds user behavior and business metrics to ecommerce events when enabled in settings
 * Integrates with existing WooCommerce tracking via plugin architecture
 * 
 * @preserve
 * @package    DataLayer_Tracker
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
(function () {
  'use strict';

  const config = window.ADTData?.["include_ga4_item_metadata"] !== '0';
  if (!config) {
    return;
  }
  window.adtDebug("Enrichment: Module loading (GA4 enrichment enabled)");
  let payload = parseInt(sessionStorage.getItem("adt_session_start") || '0');
  if (!payload) {
    payload = Date.now();
    sessionStorage.setItem("adt_session_start", payload.toString());
  }
  const eventName = {
    'startTime': payload,
    'pageViews': 0,
    'productsViewed': new Set(),
    'cartAdds': 0,
    'cartRemoves': 0,
    'firstAddTime': parseInt(sessionStorage.getItem("adt_first_add_time") || '0') || null,
    'lastActivity': Date.now(),
    'checkoutAttempts': 0
  };
  const detail = parseInt(sessionStorage.getItem('adt_page_views') || '0');
  sessionStorage.setItem("adt_page_views", (detail + 1).toString());
  eventName.cartAdds = parseInt(sessionStorage.getItem("adt_cart_adds") || '0');
  eventName.cartRemoves = parseInt(sessionStorage.getItem("adt_cart_removes") || '0');
  const element = {
    'eventsToEnrich': ['add_to_cart', "begin_checkout", "purchase", 'cart_abandonment', "cart_abandonment_exit", "view_cart", "add_shipping_info", "add_payment_info", 'select_item'],
    'init'() {
      if (window._ADTEnrichmentInitialized) {
        window.adtDebug("Enrichment: Already initialized, skipping...");
        return;
      }
      window._ADTEnrichmentInitialized = true;
      window.adtDebug("Enrichment: Starting initialization...");
      window.dataLayer = window.dataLayer || [];
      const target = this.hookIntoPushEvent();
      if (target) {
        const result = window.dataLayer.find(value => value.event === "purchase" && value.ecommerce);
        if (result) {
          window.adtDebug("Enrichment: Found existing purchase event, processing now");
          window.adtDebugLog("🔥 Processing existing purchase event:", result);
          this.enrichEvent(result);
        }
      }
      if (document.body.classList.contains('single-product')) {
        const flag = document.querySelector("[name=\"add-to-cart\"]")?.["value"] || document.querySelector(".product")?.['id'];
        if (flag) {
          eventName.productsViewed.add(flag);
        }
      }
      window.adtDebug("Enrichment: Module initialized");
      window.adtDebug("Enrichment: Hooks installed:", target);
      window.adtDebug("Enrichment: Session data:", eventName);
      window.adtDebug("Enrichment: CustomerType available:", !!window.CustomerType);
    },
    'hookIntoPushEvent'() {
      if (this._hookInstalled) {
        window.adtDebug("Enrichment: Hook already installed, skipping");
        return true;
      }
      this._hookInstalled = true;
      window.adtDebug("🟢 Enrichment registering as processor");
      const enabled = this;
      if (typeof window.adtRegisterProcessor === "function") {
        window.adtRegisterProcessor("enrichment", function (url) {
          if (url.event && url.ecommerce && enabled.eventsToEnrich.includes(url.event)) {
            window.adtDebug("Enrichment: Enriching event:", url.event);
            enabled.enrichEvent(url);
          } else if (url.event) {
            window.adtDebug("Enrichment: Skipped enrichment for:", url.event);
          }
        });
        window.adtDebug("Enrichment: ✅ Registered as processor");
        window.adtDebug("Enrichment: Will enrich these events:", this.eventsToEnrich);
        return true;
      }
      console.warn("[ADT Enrichment] Processor system not available - enrichment disabled");
      console.warn("[ADT Enrichment] Make sure adt-utils-lite.js is loaded first");
      return false;
    },
    'enrichEvent'(pattern) {
      const regex = pattern.event;
      const depth = pattern.ecommerce;
      window.adtDebug("📥 enrichEvent called:", regex);
      if (window.CustomerType) {
        switch (regex) {
          case "view_item":
          case "view_item_list":
          case "select_item":
            if (depth && depth.items && Array.isArray(depth.items)) {
              depth.items.forEach(percent => {
                if (percent.item_id) {
                  window.CustomerType.recordProductView(percent.item_id);
                }
              });
            }
            break;
          case 'add_to_cart':
            if (depth && depth.items && depth.items[0]?.["item_id"]) {
              window.CustomerType.recordProductView(depth.items[0].item_id);
            }
            break;
          case "purchase":
            if (depth && depth.value !== undefined) {
              const scrollY = {
                'value': depth.value,
                'transaction_id': depth.transaction_id
              };
              window.adtDebug("  ✅ Calling recordPurchase with:", scrollY);
              window.CustomerType.recordPurchase(scrollY);
            } else {
              console.warn("⚠️ [ADT] Purchase event missing ecommerce.value:", pattern);
              console.warn("  ecommerce:", depth);
              console.warn("  ecommerce.value:", depth?.["value"]);
            }
            break;
          case 'cart_abandonment':
          case "cart_abandonment_exit":
            window.CustomerType.recordCartAbandonment();
            break;
        }
      }
      if (!this.eventsToEnrich.includes(regex)) {
        return pattern;
      }
      if (!depth) {
        console.warn("[ADT] Event has no ecommerce data, skipping enrichment:", regex);
        return pattern;
      }
      const scrollTop = this.universalEnrichments(depth);
      let pageKey = {};
      switch (regex) {
        case "add_to_cart":
          pageKey = this.enrichAddToCart(scrollTop);
          break;
        case "view_cart":
          pageKey = this.enrichCartEvents(scrollTop);
          break;
        case "begin_checkout":
        case 'add_shipping_info':
        case "add_payment_info":
        case "purchase":
          break;
      }
      pattern.ecommerce = {
        ...scrollTop,
        ...pageKey
      };
      this.updateSessionData(regex);
      return pattern;
    },
    'universalEnrichments'(firedSet) {
      let milestone = {
        'primary': "unknown",
        'tags': []
      };
      let timerId = 0;
      let intervalId = 0;
      let activeSec = 0;
      if (window.CustomerType && typeof window.CustomerType.getCustomerType === "function") {
        milestone = window.CustomerType.getCustomerType();
        timerId = window.CustomerType.data?.['productsViewed']?.['size'] || 0;
        const tickCount = window.CustomerType.data?.["purchases"] || 0;
        const saveTick = window.CustomerType.data?.["totalValue"] || 0;
        if (tickCount > 0) {
          intervalId = Math.min(100, Math.round(saveTick / 10));
        }
        let isActive = 0;
        if (timerId > 0) {
          isActive++;
        }
        if (tickCount > 0) {
          isActive++;
        }
        activeSec = Math.min(1, isActive * 0.25);
      }
      const lastTick = parseInt(sessionStorage.getItem("adt_page_views") || '0') || 0;
      const milestones = Math.round((Date.now() - eventName.startTime) / 1000);
      return {
        ...firedSet,
        'session_duration_seconds': milestones,
        'session_page_views': lastTick,
        'products_viewed_count': timerId,
        'customer_type': milestone.primary || "unknown",
        'customer_tags': milestone.tags ? milestone.tags.join(',') : '',
        'customer_confidence': activeSec,
        'customer_value_score': intervalId
      };
    },
    'enrichAddToCart'(firedMilestones) {
      eventName.cartAdds++;
      sessionStorage.setItem("adt_cart_adds", eventName.cartAdds.toString());
      if (!eventName.firstAddTime) {
        eventName.firstAddTime = Date.now();
        sessionStorage.setItem("adt_first_add_time", eventName.firstAddTime.toString());
      }
      return {
        ...firedMilestones,
        'time_to_first_add': eventName.firstAddTime ? Math.round((eventName.firstAddTime - eventName.startTime) / 1000) : 0,
        'cart_adds_session': eventName.cartAdds,
        'add_to_cart_location': document.body.classList.contains("single-product") ? "product_page" : "shop_page",
        'products_viewed_before_add': window.CustomerType?.["data"]?.["productsViewed"]?.["size"] || 0
      };
    },
    'enrichRemoveFromCart'(pagePath) {
      eventName.cartRemoves++;
      sessionStorage.setItem("adt_cart_removes", eventName.cartRemoves.toString());
      return {
        ...pagePath,
        'cart_removes_session': eventName.cartRemoves,
        'cart_modification_ratio': 0
      };
    },
    'enrichCartEvents'(scrollHeight) {
      let viewportH = 0;
      let scrollPct = 0;
      if (scrollHeight.items && scrollHeight.items.length > 0) {
        scrollPct = scrollHeight.items.reduce((threshold, tolerance) => threshold + (tolerance.quantity || 1), 0);
        if (scrollPct > 0) {
          viewportH = parseFloat((scrollHeight.value / scrollPct).toFixed(0x2));
        }
      }
      const evt = window.CustomerType?.["data"]?.["productsViewed"]?.['size'] || 0;
      const item = new Set();
      if (scrollHeight.items && Array.isArray(scrollHeight.items)) {
        scrollHeight.items.forEach(key => {
          if (key.item_id) {
            item.add(key.item_id);
          }
        });
      }
      const err = evt > 0 && item.size > 0 ? parseFloat((item.size / evt).toFixed(0x2)) : 0;
      return {
        'avg_item_value': viewportH,
        'cart_value_tier': this.getValueTier(scrollHeight.value),
        'total_quantity': scrollPct,
        'cart_interactions': 0,
        'browse_to_cart_rate': err
      };
    },
    'getValueTier'(idx) {
      if (!idx || idx === 0) {
        return "empty";
      }
      if (idx < 50) {
        return "low";
      }
      if (idx < 200) {
        return "medium";
      }
      if (idx < 500) {
        return "high";
      }
      return "premium";
    },
    'updateSessionData'(len) {
      eventName.lastActivity = Date.now();
      if (len === 'begin_checkout' && !eventName.checkoutStartTime) {
        eventName.checkoutStartTime = Date.now();
      }
    }
  };
  if (document.readyState === 'complete') {
    element.init();
  } else {
    window.addEventListener("load", () => element.init());
  }
  if (window.ADTData?.['debug']) {
    window.ADTEnrichment = element;
    window.ADTSessionData = eventName;
    window.testViewCartEnrichment = function () {
      const mode = {
        'event': 'view_cart',
        'ecommerce': {
          'currency': "USD",
          'value': 0x96,
          'items': [{
            'item_id': "CART123",
            'item_name': "Cart Product",
            'price': 0x4b,
            'quantity': 0x2
          }]
        }
      };
      const typeVal = element.enrichEvent(JSON.parse(JSON.stringify(mode)));
      return typeVal;
    };
    window.adtDebug("Enrichment: Debug tools available:");
    window.adtDebug("  - testViewCartEnrichment() : Test view_cart enrichment");
    window.adtDebug("  - ADTEnrichment.eventsToEnrich : See which events to enrich");
  }
})();