/*!
 * DataLayer Tracker - E-commerce Tracking (Lite)
 *
 * Complete ecommerce tracking for WooCommerce with cart abandonment and session context
 *
 * Features:
 * - Full GA4 ecommerce event tracking
 * - Cart abandonment detection (30min inactivity, 10min tab away, exit intent)
 * - Session-aware commerce metrics
 * - Checkout funnel tracking
 * - Purchase verification with multiple fallbacks
 * - WooCommerce AJAX event handling
 *
 * @preserve
 * @package    DataLayer_Tracker
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @version    2.0.0
 * @since      1.0.0
 */
(function () {
  window.adtDebug("Ecommerce: File loaded and executing");
  ("use strict");
  if (typeof window === "undefined") {
    return;
  }
  function bootstrapEcommerce() {
    if (window._adtEcommerceInitialized) {
      window.adtDebug("Ecommerce: already initialized, skipping");
      return;
    }
    window._adtEcommerceInitialized = true;
    const trackingEnabled =
      String(window.ADTData?.["enable_ecommerce_tracking"]) === "1" ||
      window.ADTData?.["enable_ecommerce_tracking"] === true ||
      window.ADTData?.["enable_ecommerce_tracking"] === "true";
    if (!trackingEnabled) {
      window.adtDebug("Ecommerce: Disabled - Enabled:", trackingEnabled);
      return;
    }
    const hasAnalyticsConsent =
      typeof window.hasConsent === "function"
        ? window.hasConsent("analytics")
        : window.ADTData?.["fallback_track_without_cmp"] === "1";
    if (!hasAnalyticsConsent) {
      window.adtDebug("Ecommerce: Blocked - no consent");
      return;
    }
    window.dataLayer = window.dataLayer || [];
    window._adtConversionEvents = window._adtConversionEvents || [];
    const defaultCurrency = window.ADTData?.["currency"] || "USD";
    const ecomLog = function (...args) {
      window.adtDebug("Ecommerce:", ...args);
    };
    ecomLog("Ecommerce: Module initializing...");
    const ecommerce = {
      cartState: {
        items: [],
        value: 0,
        currency: defaultCurrency,
        lastUpdated: null,
        hasBeenViewed: false,
        checkoutStarted: false,
        paymentInfoAdded: false,
        shippingInfoAdded: false,
      },
      viewedProducts: new Set(),
      cartAdditions: [],
      cartRemovals: [],
      cartActivityTimer: null,
      lastCartActivity: Date.now(),
      cartAbandoned: false,
      checkoutStepsTracked: {
        begin: false,
        shipping: false,
        payment: false,
      },
      eventQueue: new Map(),
      DEDUPE_WINDOW: 1500,
      init() {
        ecomLog("Ecommerce: Initializing ecommerce tracking");
        this.loadCartState();
        this.loadViewedProducts();
        this.loadCartMetrics();
        this.setupEventListeners();
        this.initPageContext();
        this.initSessionIntegration();
        this.setupAbandonmentTracking();
        window.ADTEcommerce = {
          trackEvent: (result, value) =>
            this.trackEvent(result, value),
          getCartState: () => this.getCartState(),
          getMetrics: () => this.getEcommerceMetrics(),
          extractOrderData: () => this.extractOrderData(),
          addToCart: (flag) => this.addToCart(flag),
          removeFromCart: (enabled) => this.removeFromCart(enabled),
          updateCartFromDOM: () => this.updateCartFromDOM(),
          viewItem: () => this.viewItem(),
          viewItemList: () => this.viewItemList(),
          viewCart: () => this.viewCart(),
          beginCheckout: () => this.beginCheckout(),
          addShippingInfo: () => this.addShippingInfo(),
          addPaymentInfo: () => this.addPaymentInfo(),
          purchase: (url) => this.purchase(url),
        };
        ecomLog("Ecommerce: tracking initialized");
      },
      parsePriceFrom(pattern) {
        if (!pattern) {
          return 0;
        }
        const regex = pattern?.["textContent"]?.["trim"]() || "";
        const depth = regex
          .replace(/[^\d.,]/g, "")
          .replace(/,(?=\d{3})/g, "");
        const percent = parseFloat(depth);
        return isNaN(percent) ? 0 : Math.abs(percent);
      },
      getProductContext(scrollY) {
        const scrollTop =
          scrollY?.["closest"](
            ".product, li.product, .wc-block-grid__product",
          ) ||
          document.querySelector(".product") ||
          document;
        const pageKey =
          scrollY?.["getAttribute"]?.("data-product_id") ||
          scrollY?.["dataset"]?.["productId"] ||
          scrollTop.querySelector(
            '[name="product_id"], input[name="add-to-cart"]',
          )?.["value"] ||
          scrollTop.querySelector("[data-product_id]")?.["dataset"]?.[
            "product_id"
          ] ||
          "unknown";
        const firedSet =
          scrollY?.["getAttribute"]?.("data-product_name") ||
          scrollY?.["dataset"]?.["productName"] ||
          scrollTop
            .querySelector(
              ".product_title, .woocommerce-loop-product__title, h1.product_title",
            )
            ?.["textContent"]?.["trim"]() ||
          document
            .querySelector("h1.product_title, .entry-title")
            ?.["textContent"]?.["trim"]() ||
          document.title.replace(/\s*[-–|]\s*.*$/, "").trim();
        const milestone = scrollTop.querySelector(
          ".price ins .amount, .price > .amount, .woocommerce-Price-amount",
        );
        const timerId = this.parsePriceFrom(milestone) || 0;
        let intervalId;
        if (scrollY?.["tagName"] === "FORM") {
          intervalId = scrollY.querySelector(
            'input[name="quantity"], .quantity input.qty, input.qty',
          );
        } else {
          intervalId = scrollTop.querySelector(
            'input[name="quantity"], .quantity input.qty, input.qty',
          );
        }
        const activeSec =
          intervalId?.["value"] ||
          scrollY?.["getAttribute"]?.("data-quantity") ||
          "1";
        const tickCount = Math.max(1, parseInt(activeSec, 10) || 1);
        return {
          id: pageKey,
          name: firedSet,
          price: timerId,
          quantity: tickCount,
        };
      },
      generateEventKey(saveTick, isActive) {
        const lastTick = isActive?.["items"] || [];
        const milestones = lastTick
          .map((firedMilestones) => firedMilestones.item_id || firedMilestones.id)
          .join(",");
        return saveTick + "_" + milestones + "_" + (isActive.value || "");
      },
      getDedupeWindow(pagePath) {
        const scrollHeight = {
          add_to_cart: 0x7d0,
          remove_from_cart: 0x7d0,
          view_item: 5000,
          begin_checkout: 0xbb8,
          purchase: 0x2710,
        };
        return scrollHeight[pagePath] || 0xbb8;
      },
      pushEvent(viewportH, scrollPct = {}, threshold = true) {
        try {
          const tolerance = this.generateEventKey(viewportH, scrollPct);
          const evt = this.getDedupeWindow(viewportH);
          const item = {
            event: viewportH,
            ecommerce: scrollPct,
          };
          ecomLog(
            "Ecommerce: pushEvent called for",
            viewportH,
            "payload:",
            item,
            "dedupe check type:",
            typeof window.adtPushDeduped,
          );
          if (typeof window.adtPushDeduped === "function") {
            window.adtPushDeduped(item, tolerance, evt);
          } else {
            window.dataLayer.push(item);
          }
          ecomLog("Ecommerce:", viewportH, "pushed:", item);
        } catch (key) {
          ecomLog("Ecommerce: Error pushing", viewportH, ":", key);
        }
      },
      trackEvent(err, idx = {}) {
        this.handleEventSpecifics(err, idx);
        this.pushEvent(err, idx);
        if (
          window.ADTData?.["dual_pixel_mode"] === "1" &&
          window.ADTPixels?.["trackEvent"]
        ) {
          window.ADTPixels.trackEvent(err, idx);
        }
      },
      handleEventSpecifics(len, mode) {
        switch (len) {
          case "view_item":
            if (mode.items?.[0]?.["item_id"]) {
              this.viewedProducts.add(mode.items[0].item_id);
              this.saveViewedProducts();
            }
            break;
          case "add_to_cart":
            this.trackCartActivity();
            if (mode.items) {
              this.cartAdditions.push({
                items: mode.items,
                value: mode.value,
                timestamp: Date.now(),
              });
              this.updateCartState("add", mode);
              this.saveCartMetrics();
            }
            break;
          case "remove_from_cart":
            if (mode.items) {
              this.cartRemovals.push({
                items: mode.items,
                value: mode.value,
                timestamp: Date.now(),
              });
              this.updateCartState("remove", mode);
              this.saveCartMetrics();
            }
            break;
          case "view_cart":
            this.cartState.hasBeenViewed = true;
            this.trackCartActivity();
            this.saveCartState();
            break;
          case "begin_checkout":
            this.cartState.checkoutStarted = true;
            this.checkoutStepsTracked.begin = true;
            this.saveCartState();
            break;
          case "add_shipping_info":
            this.cartState.shippingInfoAdded = true;
            this.checkoutStepsTracked.shipping = true;
            this.saveCartState();
            break;
          case "add_payment_info":
            this.cartState.paymentInfoAdded = true;
            this.checkoutStepsTracked.payment = true;
            this.saveCartState();
            break;
          case "purchase":
            this.handlePurchase(mode);
            break;
        }
      },
      loadCartState() {
        try {
          const typeVal = sessionStorage.getItem("adt_cart_state");
          if (typeVal) {
            const nameVal = JSON.parse(typeVal);
            this.cartState = {
              ...this.cartState,
              ...nameVal,
            };
            ecomLog("Ecommerce: Loaded cart state:", this.cartState);
          }
        } catch (opts) {
          ecomLog("Ecommerce: Error loading cart state:", opts);
        }
      },
      loadViewedProducts() {
        try {
          const ref = sessionStorage.getItem("adt_viewed_products");
          if (ref) {
            const val = JSON.parse(ref);
            this.viewedProducts = new Set(val);
            ecomLog(
              "Ecommerce: Loaded viewed products:",
              this.viewedProducts.size,
              "products",
            );
          }
        } catch (obj) {
          ecomLog("Ecommerce: Error loading viewed products:", obj);
        }
      },
      saveCartState() {
        try {
          sessionStorage.setItem(
            "adt_cart_state",
            JSON.stringify(this.cartState),
          );
        } catch (fn) {
          ecomLog("Error saving cart state:", fn);
        }
      },
      saveViewedProducts() {
        try {
          const arg = Array.from(this.viewedProducts);
          sessionStorage.setItem(
            "adt_viewed_products",
            JSON.stringify(arg),
          );
        } catch (tmp) {
          ecomLog("Error saving viewed products:", tmp);
        }
      },
      loadCartMetrics() {
        try {
          const node = sessionStorage.getItem("adt_cart_metrics");
          if (node) {
            const list = JSON.parse(node);
            this.cartAdditions = list.additions || [];
            this.cartRemovals = list.removals || [];
            ecomLog("Ecommerce: Loaded cart metrics:", {
              additions: this.cartAdditions.length,
              removals: this.cartRemovals.length,
            });
          }
        } catch (entry) {
          ecomLog("Ecommerce: Error loading cart metrics:", entry);
        }
      },
      saveCartMetrics() {
        try {
          const state = {
            additions: this.cartAdditions,
            removals: this.cartRemovals,
          };
          sessionStorage.setItem("adt_cart_metrics", JSON.stringify(state));
        } catch (ctx) {
          ecomLog("Error saving cart metrics:", ctx);
        }
      },
      getCartState() {
        return {
          hasItems: this.cartState.items.length > 0,
          itemCount: this.cartState.items.length,
          value: this.cartState.value,
          currency: this.cartState.currency,
          checkoutStarted: this.cartState.checkoutStarted,
          paymentInfoAdded: this.cartState.paymentInfoAdded,
        };
      },
      getEcommerceMetrics() {
        return {
          productsViewed: this.viewedProducts.size,
          cartAdditions: this.cartAdditions.length,
          cartRemovals: this.cartRemovals.length,
          cartValue: this.cartState.value,
          cartItems: this.cartState.items.length,
          checkoutStarted: this.cartState.checkoutStarted,
          paymentInfoAdded: this.cartState.paymentInfoAdded,
          shippingInfoAdded: this.cartState.shippingInfoAdded,
        };
      },
      updateCartState(data, row) {
        if (data === "add" && row.items) {
          row.items.forEach((col) => {
            const mapVal = this.cartState.items.findIndex(
              (setVal) => setVal.item_id === col.item_id,
            );
            if (mapVal >= 0) {
              this.cartState.items[mapVal].quantity +=
                col.quantity || 1;
            } else {
              this.cartState.items.push(col);
            }
          });
          if (row.value) {
            this.cartState.value += row.value;
          }
        } else {
          if (data === "remove" && row.items) {
            row.items.forEach((buf) => {
              const raw = this.cartState.items.findIndex(
                (parsed) => parsed.item_id === buf.item_id,
              );
              if (raw >= 0) {
                this.cartState.items.splice(raw, 1);
              }
            });
            if (row.value) {
              this.cartState.value = Math.max(
                0,
                this.cartState.value - row.value,
              );
            }
          } else if (data === "update") {
            this.cartState.items = row.items || [];
            this.cartState.value = row.value || 0;
          }
        }
        this.cartState.lastUpdated = Date.now();
        this.cartState.currency = row.currency || this.cartState.currency;
        this.saveCartState();
      },
      trackCartActivity() {
        this.lastCartActivity = Date.now();
        this.cartAbandoned = false;
        if (this.cartActivityTimer) {
          clearTimeout(this.cartActivityTimer);
        }
        this.cartActivityTimer = setTimeout(() => {
          if (!this.cartAbandoned && !window._adtPurchaseTracked) {
            this.triggerCartAbandonment("inactivity");
          }
        }, 1800000);
      },
      triggerCartAbandonment(text = "unknown") {
        if (
          window.location.pathname.includes("order-received") ||
          window.location.pathname.includes("checkout") ||
          this.cartAbandoned
        ) {
          return;
        }
        const html = this.getCartState();
        if (!html.hasItems) {
          return;
        }
        this.cartAbandoned = true;
        let cmpName = "cart_add";
        if (this.cartState.paymentInfoAdded) {
          cmpName = "payment";
        } else {
          if (this.cartState.shippingInfoAdded) {
            cmpName = "shipping";
          } else {
            if (this.cartState.checkoutStarted) {
              cmpName = "checkout";
            } else if (this.cartState.hasBeenViewed) {
              cmpName = "cart_view";
            }
          }
        }
        const handler = {
          event: "cart_abandonment",
          ecommerce: {
            currency: this.cartState.currency,
            value: this.cartState.value,
            items: this.cartState.items,
            abandonment_reason: text,
            abandonment_stage: cmpName,
            abandonment_time: Math.round(
              (Date.now() - this.lastCartActivity) / 1000,
            ),
          },
        };
        if (window._adtSessionInitialized && window.ADTSession) {
          handler.session_id = window.ADTSession.id();
          handler.session_number = window.ADTSession.number();
          handler.tab_id = window.ADTSession.tabId();
        }
        this.pushEvent(
          "cart_abandonment",
          handler.ecommerce,
          "cart_abandon_" + text,
          0,
        );
        if (
          window.ADTData?.["dual_pixel_mode"] === "1" &&
          window.ADTPixels?.["trackEvent"]
        ) {
          window.ADTPixels.trackEvent("cart_abandonment", handler.ecommerce);
        }
        ecomLog("Cart abandonment triggered:", cmpName, text);
      },
      handlePurchase(callback) {
        const response = callback.transaction_id || callback.id;
        if (window._adtPurchaseTracked === response) {
          return;
        }
        window._adtPurchaseTracked = response;
        window._adtConversionEvents.push({
          transaction_id: response,
          value: callback.value,
          currency: callback.currency || this.cartState.currency,
          items: callback.items,
          timestamp: Date.now(),
          session_id: window._adtSessionInitialized
            ? window.ADTSession?.["id"]()
            : null,
          session_number: window._adtSessionInitialized
            ? window.ADTSession?.["number"]()
            : 0,
        });
        this.cartState = {
          items: [],
          value: 0,
          currency: callback.currency || this.cartState.currency,
          lastUpdated: Date.now(),
          hasBeenViewed: false,
          checkoutStarted: false,
          paymentInfoAdded: false,
          shippingInfoAdded: false,
        };
        this.saveCartState();
        this.cartAdditions = [];
        this.cartRemovals = [];
        this.saveCartMetrics();
        this.cartAbandoned = false;
        try {
          sessionStorage.removeItem("adt_cart_data");
          sessionStorage.removeItem("adt_cart_state");
          sessionStorage.removeItem("adt_cart_metrics");
        } catch (request) {}
        ecomLog("Purchase completed, cart cleared");
      },
      addToCart(fields) {
        window.adtDebug("Ecommerce: addToCart called with:", fields);
        window.adtDebug(
          "Ecommerce: fromEl is form?",
          fields?.["tagName"] === "FORM",
        );
        let formId;
        if (fields?.["tagName"] === "FORM") {
          formId = fields.querySelector(
            'input[name="quantity"], .quantity input.qty, input.qty',
          );
        } else {
          const fieldId =
            fields?.["closest"](".product") ||
            document.querySelector(".product");
          formId = fieldId?.["querySelector"](
            'input[name="quantity"], .quantity input.qty, input.qty',
          );
        }
        window.adtDebug("Ecommerce: Quantity input found:", formId);
        window.adtDebug(
          "Ecommerce: Quantity input value:",
          formId?.["value"],
        );
        window.adtDebug("Ecommerce: Quantity input type:", formId?.["type"]);
        const cartAdds = this.getProductContext(fields);
        window.adtDebug("Ecommerce: Product context:", cartAdds);
        if (cartAdds.id === "unknown") {
          window.adtWarn("Ecommerce: Add to cart with unknown product ID");
        }
        const cartRemoves = [
          {
            item_id: cartAdds.id,
            item_name: cartAdds.name,
            price: cartAdds.price,
            quantity: cartAdds.quantity,
          },
        ];
        window.adtDebug("Ecommerce: Final items array:", cartRemoves);
        const sessionInfo = {
          currency: this.cartState.currency,
          value: cartAdds.price * cartAdds.quantity,
          items: cartRemoves,
        };
        this.trackEvent("add_to_cart", sessionInfo);
      },
      removeFromCart(hookData) {
        const pixelEvt = hookData.closest(
          ".cart_item, .wc-block-cart-items__row, .mini_cart_item, tr.cart_item",
        );
        if (!pixelEvt) {
          ecomLog("Ecommerce: Remove button without row context");
          return;
        }
        const overlayEvt = pixelEvt.querySelector(
          ".product-name a, .product-title, .wc-block-components-product-name",
        );
        const filterEvt = overlayEvt?.["textContent"]?.["trim"]() || "Unknown";
        const searchParams =
          hookData.dataset?.["product_id"] ||
          pixelEvt.querySelector("[data-product_id]")?.["dataset"]?.[
            "product_id"
          ] ||
          filterEvt;
        const clickId = pixelEvt.querySelector("input.qty, .quantity input");
        const utmData = parseInt(clickId?.["value"] || "1", 10) || 1;
        const cookieVal = pixelEvt.querySelector(".product-subtotal .amount");
        const cookieKey = this.parsePriceFrom(cookieVal);
        const consentRaw = utmData > 0 ? cookieKey / utmData : 0;
        const consentObj = {
          currency: this.cartState.currency,
          value: consentRaw * utmData,
          items: [
            {
              item_id: searchParams,
              item_name: filterEvt,
              price: consentRaw,
              quantity: utmData,
            },
          ],
        };
        this.trackEvent("remove_from_cart", consentObj);
      },
      updateCartFromDOM() {
        const prevConsent = document.querySelectorAll(
          ".cart_item, .wc-block-cart-items__row, tr.cart_item",
        );
        const now = [];
        let last = 0;
        prevConsent.forEach((diff) => {
          try {
            const found = diff.querySelector(
              ".product-name a, .product-title",
            );
            const detected =
              found?.["textContent"]?.["trim"]() || "Unknown";
            const retryCount =
              diff.querySelector("[data-product_id]")?.["dataset"]?.[
                "product_id"
              ] ||
              diff.querySelector(".remove")?.["dataset"]?.["product_id"] ||
              detected;
            const maxRetries = diff.querySelector(
              "input.qty, .quantity input",
            );
            const delayMs = parseInt(maxRetries?.["value"] || "1", 10) || 1;
            const timeoutMs = diff.querySelector(
              ".product-subtotal .amount",
            );
            const hasConsent = this.parsePriceFrom(timeoutMs);
            const blocked = delayMs > 0 ? hasConsent / delayMs : 0;
            if (blocked > 0) {
              now.push({
                item_id: retryCount,
                item_name: detected,
                quantity: delayMs,
                price: blocked,
              });
              last += blocked * delayMs;
            }
          } catch (wasBlocked) {
            ecomLog("Ecommerce: Error parsing cart row:", wasBlocked);
          }
        });
        this.updateCartState("update", {
          items: now,
          value: last,
        });
        if (now.length > 0) {
          this.trackCartActivity();
        }
        return {
          items: now,
          value: last,
        };
      },
      viewItem() {
        const analyticsOk = this.getProductContext(
          document.querySelector(".product"),
        );
        if (analyticsOk.id !== "unknown") {
          const marketingOk = {
            currency: this.cartState.currency,
            value: analyticsOk.price,
            items: [
              {
                item_id: analyticsOk.id,
                item_name: analyticsOk.name,
                price: analyticsOk.price,
                quantity: 1,
              },
            ],
          };
          this.trackEvent("view_item", marketingOk);
        }
      },
      viewItemList() {
        if (this._viewItemListFired) {
          window.adtDebug("Ecommerce: viewItemList already fired, skipping");
          return;
        }
        this._viewItemListFired = true;
        const extra = [];
        const source = document.querySelectorAll(
          "ul.products li.product, .wc-block-grid__product",
        );
        window.adtDebug("Ecommerce: Found product elements:", source.length);
        source.forEach((granted, previous) => {
          try {
            const storageErr =
              granted.querySelector("[data-product_id]")?.["dataset"]?.[
                "product_id"
              ] ||
              granted.querySelector(".add_to_cart_button")?.["dataset"]?.[
                "product_id"
              ] ||
              "product_" + previous;
            const localA =
              granted
                .querySelector(".woocommerce-loop-product__title, h2")
                ?.["textContent"]?.["trim"]() || "Unknown Product";
            const localB = granted.querySelector(
              ".price ins .amount, .price > .amount",
            );
            const localC = this.parsePriceFrom(localB);
            window.adtDebug("Ecommerce: Product parsed:", {
              id: storageErr,
              name: localA,
              price: localC,
            });
            if (localC > 0 || storageErr !== "product_" + previous) {
              extra.push({
                item_id: storageErr,
                item_name: localA,
                price: localC || 0,
                quantity: 1,
                item_list_name: "Product List",
                index: previous + 1,
              });
            }
          } catch (localD) {
            ecomLog("Ecommerce: Error parsing product:", localD);
          }
        });
        window.adtDebug("Ecommerce: Products array:", extra);
        if (extra.length) {
          window.adtDebug(
            "Ecommerce: Pushing view_item_list with",
            extra.length,
            "products",
          );
          const localE = {
            currency: this.cartState.currency,
            items: extra,
            item_list_name: "Product List",
          };
          this.trackEvent("view_item_list", localE);
          this._viewItemListFired = true;
        } else {
          window.adtDebug("Ecommerce: No products found, not pushing event");
        }
      },
      selectItem(selectInput) {
        const localG = this.getProductContext(localF);
        const localH = {
          currency: this.cartState.currency,
          items: [
            {
              item_id: localG.id,
              item_name: localG.name,
              price: localG.price,
              quantity: 1,
            },
          ],
          item_list_name: "Product List",
        };
        this.trackEvent("select_item", localH);
      },
      viewCart() {
        const localI = this.updateCartFromDOM();
        const localJ = {
          currency: this.cartState.currency,
          value: localI.value,
          items: localI.items,
        };
        this.trackEvent("view_cart", localJ);
      },
      beginCheckout() {
        if (
          window.location.pathname.includes("order-received") ||
          this.checkoutStepsTracked.begin
        ) {
          return;
        }
        const cartSnapshot = this.updateCartFromDOM();
        const checkoutPayload = {
          currency: this.cartState.currency,
          value: cartSnapshot.value || this.cartState.value,
          items: cartSnapshot.items.length
            ? cartSnapshot.items
            : this.cartState.items,
        };
        this.trackEvent("begin_checkout", checkoutPayload);
      },
      addShippingInfo() {
        if (
          window.location.pathname.includes("order-received") ||
          this.checkoutStepsTracked.shipping
        ) {
          return;
        }
        const cartSnapshot = {
          currency: this.cartState.currency,
          value: this.cartState.value,
          items: this.cartState.items,
        };
        this.trackEvent("add_shipping_info", cartSnapshot);
      },
      addPaymentInfo() {
        if (
          window.location.pathname.includes("order-received") ||
          this.checkoutStepsTracked.payment
        ) {
          return;
        }
        const cartSnapshot = {
          currency: this.cartState.currency,
          value: this.cartState.value,
          items: this.cartState.items,
        };
        this.trackEvent("add_payment_info", cartSnapshot);
      },
      purchase(orderInput) {
        const cartSnapshot = checkoutPayload?.["id"] || checkoutPayload?.["transaction_id"];
        if (window._adtPurchaseTracked === cartSnapshot) {
          return;
        }
        const shippingPayload = {
          transaction_id: cartSnapshot,
          affiliation: "Online Store",
          currency: checkoutPayload.currency || this.cartState.currency,
          value: parseFloat(checkoutPayload.total || checkoutPayload.value || 0),
          tax: parseFloat(checkoutPayload.tax || 0),
          shipping: parseFloat(checkoutPayload.shipping || 0),
          items: checkoutPayload.items || [],
        };
        if (checkoutPayload.coupon) {
          shippingPayload.coupon = checkoutPayload.coupon;
        }
        this.trackEvent("purchase", shippingPayload);
        this.handlePurchase(shippingPayload);
        ecomLog("Ecommerce: Purchase tracked:", shippingPayload);
      },
      extractOrderData() {
        try {
          let cartSnapshot = null;
          const checkoutPayload = window.location.pathname.match(
            /order-received\/(\d+)/,
          );
          if (checkoutPayload) {
            cartSnapshot = checkoutPayload[1];
          } else {
            const shippingPayload = document.querySelector(
              ".woocommerce-order-overview__order strong, .order strong",
            );
            if (shippingPayload) {
              const paymentPayload = shippingPayload.textContent.match(/\d+/);
              if (paymentPayload) {
                cartSnapshot = paymentPayload[0];
              }
            }
          }
          let orderInput = 0;
          const transactionId = document.querySelector(
            "li.total .woocommerce-Price-amount, tr.order-total .amount",
          );
          if (transactionId) {
            orderInput = this.parsePriceFrom(transactionId);
          }
          const purchasePayload = [];
          const orderId = document.querySelectorAll(
            "tbody .order_item, .woocommerce-table__line-item",
          );
          orderId.forEach((pathMatch) => {
            if (pathMatch.textContent.match(/Total|Subtotal|Tax|Shipping/i)) {
              return;
            }
            const orderNumEl = pathMatch
              .querySelector(".product-name")
              ?.["textContent"]?.["trim"]();
            const orderNumMatch = pathMatch.querySelector(".product-total .amount");
            const orderTotal = this.parsePriceFrom(orderNumMatch);
            if (orderNumEl && orderTotal > 0) {
              let totalEl = 1;
              const lineItems = pathMatch.textContent.match(/[×x]\s*(\d+)/i);
              if (lineItems) {
                totalEl = parseInt(lineItems[1], 10) || 1;
              }
              purchasePayload.push({
                item_name: orderNumEl.replace(/\s*[×x]\s*\d+.*$/i, "").trim(),
                item_id: orderNumEl.replace(/\s*[×x]\s*\d+.*$/i, "").trim(),
                quantity: totalEl,
                price: orderTotal / totalEl,
              });
            }
          });
          if (cartSnapshot && orderInput > 0) {
            return {
              id: cartSnapshot,
              total: orderInput,
              items: purchasePayload.length
                ? purchasePayload
                : [
                    {
                      item_name: "Order",
                      item_id: cartSnapshot,
                      quantity: 1,
                      price: orderInput,
                    },
                  ],
            };
          }
          return null;
        } catch (lineRows) {
          ecomLog("Error extracting order data:", lineRows);
          return null;
        }
      },
      setupAbandonmentTracking() {
        document.addEventListener("visibilitychange", () => {
          if (document.hidden) {
            const cartSnapshot = Date.now() - this.lastCartActivity;
            if (
              cartSnapshot > 0x927c0 &&
              this.cartState.items.length > 0 &&
              !this.cartAbandoned
            ) {
              this.triggerCartAbandonment("tab_away");
            }
          } else if (this.cartState.items.length > 0) {
            this.trackCartActivity();
          }
        });
        const checkoutPayload = () => {
          if (
            this.cartState.items.length > 0 &&
            !window.location.pathname.includes("checkout") &&
            !window.location.pathname.includes("order-received") &&
            !window._adtPurchaseTracked &&
            !this.cartAbandoned
          ) {
            if (navigator.sendBeacon && window.dataLayer) {
              const shippingPayload = {
                event: "cart_abandonment_exit",
                ecommerce: {
                  currency: this.cartState.currency,
                  value: this.cartState.value,
                  items: this.cartState.items,
                },
                session_id: window._adtSessionInitialized
                  ? window.ADTSession?.["id"]()
                  : null,
                session_number: window._adtSessionInitialized
                  ? window.ADTSession?.["number"]()
                  : 0,
              };
              const paymentPayload = new Blob([JSON.stringify(shippingPayload)], {
                type: "application/json",
              });
              navigator.sendBeacon("/wp-json/adt/v1/track", paymentPayload);
              if (
                window.ADTData?.["dual_pixel_mode"] === "1" &&
                window.ADTPixels?.["trackEvent"]
              ) {
                window.ADTPixels.trackEvent(
                  "cart_abandonment_exit",
                  shippingPayload.ecommerce,
                );
              }
            } else {
              this.triggerCartAbandonment("exit");
            }
          }
        };
        window.addEventListener("beforeunload", checkoutPayload);
        window.addEventListener("pagehide", checkoutPayload);
        ecomLog("Abandonment tracking setup complete");
      },
      setupEventListeners() {
        const cartSnapshot = this;
        document.body.addEventListener(
          "click",
          function (checkoutPayload) {
            if (!checkoutPayload.isTrusted) {
              return;
            }
            const shippingPayload = checkoutPayload.target.closest(
              ".add_to_cart_button, .single_add_to_cart_button",
            );
            if (shippingPayload) {
              const paymentPayload = shippingPayload.closest(
                "form.cart, form.variations_form",
              );
              if (paymentPayload) {
                ecomLog(
                  "Add to cart button inside form, letting submit handler track it",
                );
                return;
              }
              ecomLog("Add to cart button clicked (AJAX)");
              cartSnapshot.addToCart(shippingPayload);
              return;
            }
            const orderInput = checkoutPayload.target.closest(
              ".remove_from_cart_button, .product-remove a, a.remove",
            );
            if (orderInput) {
              setTimeout(() => cartSnapshot.removeFromCart(orderInput), 100);
              return;
            }
            const transactionId = checkoutPayload.target.closest(
              'li.product a[href*="/product/"], .wc-block-grid__product a[href*="/product/"], .product a[href*="/product/"], a.woocommerce-LoopProduct-link[href*="/product/"]',
            );
            if (
              transactionId &&
              !transactionId.classList.contains("add_to_cart_button") &&
              !transactionId.classList.contains("added_to_cart") &&
              !transactionId.closest(".add_to_cart_button")
            ) {
              window.adtDebug(
                "Ecommerce: Product link clicked:",
                transactionId.href,
              );
              cartSnapshot.selectItem(transactionId);
              return;
            }
            const purchasePayload = checkoutPayload.target.closest(
              'button[name="update_cart"]',
            );
            if (purchasePayload) {
              setTimeout(() => cartSnapshot.updateCartFromDOM(), 500);
              return;
            }
          },
          true,
        );
        document.body.addEventListener(
          "submit",
          function (orderId) {
            if (!orderId.isTrusted) {
              return;
            }
            const pathMatch = orderId.target;
            if (pathMatch.matches("form.cart, form.variations_form")) {
              cartSnapshot.addToCart(pathMatch);
            }
            if (pathMatch.matches("form.checkout, form.woocommerce-checkout")) {
              cartSnapshot.beginCheckout();
            }
          },
          true,
        );
        let orderNumEl;
        document.body.addEventListener("input", function (orderNumMatch) {
          if (orderNumMatch.target.matches("input.qty")) {
            clearTimeout(orderNumEl);
            orderNumEl = setTimeout(() => cartSnapshot.updateCartFromDOM(), 0x320);
          }
        });
        const orderTotal = [
          "wc_fragment_refresh",
          "wc_fragments_refreshed",
          "wc_fragments_loaded",
          "updated_wc_div",
          "updated_cart_totals",
          "added_to_cart",
          "removed_from_cart",
        ];
        orderTotal.forEach((totalEl) => {
          document.body.addEventListener(totalEl, () => {
            ecomLog("WooCommerce event: " + totalEl);
            setTimeout(() => cartSnapshot.updateCartFromDOM(), 300);
          });
        });
        if (window.jQuery) {
          jQuery(document).on(
            "added_to_cart",
            (lineItems, lineRows, lineRow, productName) => {
              ecomLog("jQuery: Item added to cart");
              const priceEl = productName?.["data"]("product_id");
              if (priceEl) {
                cartSnapshot.trackCartActivity();
              }
            },
          );
          jQuery(document).on("removed_from_cart", () => {
            ecomLog("jQuery: Item removed from cart");
          });
          if (document.body.classList.contains("woocommerce-checkout")) {
            jQuery(document).on("updated_checkout", function () {
              ecomLog("Checkout updated");
              cartSnapshot.checkCheckoutFields();
            });
          }
        }
        ecomLog("Event listeners setup complete");
      },
      checkCheckoutFields() {
        const cartSnapshot =
          document.querySelector("#billing_postcode")?.["value"] ||
          document.querySelector("#shipping_postcode")?.["value"];
        if (cartSnapshot && !this.checkoutStepsTracked.shipping) {
          this.addShippingInfo();
        }
        const checkoutPayload = document.querySelector(
          'input[name="payment_method"]:checked',
        );
        if (checkoutPayload && !this.checkoutStepsTracked.payment) {
          this.addPaymentInfo();
        }
      },
      initPageContext() {
        window.adtDebug(
          "Ecommerce: initPageContext called, body classes:",
          document.body.className,
        );
        const cartSnapshot = document.body.classList;
        if (!this._viewItemListFired) {
          this._viewItemListFired = false;
        }
        if (cartSnapshot.contains("woocommerce-cart")) {
          this.viewCart();
        } else {
          if (cartSnapshot.contains("single-product")) {
            this.viewItem();
          } else {
            if (
              cartSnapshot.contains("woocommerce-order-received") ||
              window.location.pathname.includes("order-received")
            ) {
              ecomLog("✅ Thank you page detected!");
              const checkoutPayload = () => {
                ecomLog("🔄 Attempting to extract order data...");
                const shippingPayload = this.extractOrderData();
                ecomLog("📦 Order data:", shippingPayload);
                ecomLog("🔒 Already tracked?", window._adtPurchaseTracked);
                if (shippingPayload && !window._adtPurchaseTracked) {
                  ecomLog("🎉 Firing purchase event!");
                  this.purchase(shippingPayload);
                } else {
                  ecomLog(
                    "❌ Purchase not fired - orderData:",
                    !!shippingPayload,
                    "tracked:",
                    !!window._adtPurchaseTracked,
                  );
                }
              };
              checkoutPayload();
              setTimeout(checkoutPayload, 1000);
              setTimeout(checkoutPayload, 0x7d0);
            } else {
              if (cartSnapshot.contains("woocommerce-checkout")) {
                this.beginCheckout();
                setTimeout(() => this.checkCheckoutFields(), 1000);
                document.addEventListener("focusout", (paymentPayload) => {
                  if (
                    paymentPayload.target.matches(
                      "#billing_postcode, #shipping_postcode",
                    )
                  ) {
                    setTimeout(() => this.checkCheckoutFields(), 500);
                  }
                });
                document.addEventListener("change", (orderInput) => {
                  if (
                    orderInput.target.matches('input[name="payment_method"]')
                  ) {
                    this.checkCheckoutFields();
                  }
                });
              } else {
                if (
                  cartSnapshot.contains("woocommerce-shop") ||
                  cartSnapshot.contains("archive") ||
                  cartSnapshot.contains("post-type-archive-product") ||
                  cartSnapshot.contains("tax-product_cat") ||
                  cartSnapshot.contains("product-category") ||
                  cartSnapshot.contains("product-tag") ||
                  (document.body.className.includes("woocommerce") &&
                    (document.body.className.includes("archive") ||
                      document.body.className.includes("category") ||
                      document.body.className.includes("taxonomy")))
                ) {
                  const transactionId = (purchasePayload = 0) => {
                    const orderId = document.querySelectorAll(
                      "ul.products li.product, .wc-block-grid__product",
                    );
                    if (orderId.length > 0) {
                      this.viewItemList();
                    } else if (purchasePayload < 5) {
                      ecomLog(
                        "No products found yet, retrying (" +
                          (purchasePayload + 1) +
                          "/5)...",
                      );
                      setTimeout(() => transactionId(purchasePayload + 1), 200);
                    } else {
                      ecomLog("No products found after 5 retries");
                    }
                  };
                  setTimeout(() => transactionId(), 300);
                }
              }
            }
          }
        }
        ecomLog("Page context initialized");
      },
      initSessionIntegration() {
        if (this._sessionIntegrated) {
          return;
        }
        if (this._sessionRetryTimeout) {
          clearTimeout(this._sessionRetryTimeout);
        }
        if (!window.ADTSession) {
          if (!this._sessionRetryCount) {
            this._sessionRetryCount = 0;
          }
          if (this._sessionRetryCount < 10) {
            this._sessionRetryCount++;
            this._sessionRetryTimeout = setTimeout(
              () => this.initSessionIntegration(),
              500,
            );
            window.adtDebug("Session manager not ready, retrying...");
          } else {
            window.adtDebug("Session manager not available after retries");
          }
          return;
        }
        if (typeof window.ADTSession.registerHook !== "function") {
          window.adtDebug(
            "Ecommerce: Session manager is a stub (session hooks unavailable)",
          );
          return;
        }
        this._sessionIntegrated = true;
        window.adtDebug("Ecommerce: Integrating with session manager");
        const cartSnapshot = this;
        try {
          window.ADTSession.registerHook("start", function (checkoutPayload) {
            const shippingPayload = cartSnapshot.getCartState();
            if (shippingPayload.hasItems) {
              const paymentPayload = {
                event: "session_start_with_cart",
                session_id: checkoutPayload.sessionId,
                tab_id: checkoutPayload.tabId,
                cart_value: shippingPayload.value,
                cart_items: shippingPayload.itemCount,
                checkout_started: shippingPayload.checkoutStarted,
              };
              window.dataLayer.push(paymentPayload);
              window.adtDebug("Session started with active cart");
            }
          });
          window.ADTSession.registerHook("ping", function (orderInput) {
            const transactionId = cartSnapshot.getEcommerceMetrics();
            if (transactionId.productsViewed > 0 || transactionId.cartValue > 0) {
              const purchasePayload = {
                event: "session_commerce_ping",
                session_id: orderInput.sessionId,
                commerce_metrics: transactionId,
              };
              if (typeof window.adtPushDeduped === "function") {
                window.adtPushDeduped(
                  purchasePayload,
                  "commerce_ping_" + orderInput.sessionId,
                  30000,
                );
              } else {
                window.dataLayer.push(purchasePayload);
              }
              if (
                window.ADTData?.["dual_pixel_mode"] === "1" &&
                window.ADTPixels?.["trackEvent"] &&
                transactionId.cartValue > 0
              ) {
                window.ADTPixels.trackEvent("commerce_activity", {
                  value: transactionId.cartValue,
                  items: cartSnapshot.cartState.items,
                });
              }
            }
          });
          window.ADTSession.registerHook("exit", function (orderId) {
            const pathMatch = cartSnapshot.getCartState();
            const orderNumEl = cartSnapshot.getEcommerceMetrics();
            if (pathMatch.hasItems && !window._adtPurchaseTracked) {
              let orderNumMatch = "cart_add";
              if (cartSnapshot.cartState.paymentInfoAdded) {
                orderNumMatch = "payment";
              } else {
                if (cartSnapshot.cartState.shippingInfoAdded) {
                  orderNumMatch = "shipping";
                } else {
                  if (cartSnapshot.cartState.checkoutStarted) {
                    orderNumMatch = "checkout";
                  } else {
                    if (cartSnapshot.cartState.hasBeenViewed) {
                      orderNumMatch = "cart_view";
                    }
                  }
                }
              }
              const orderTotal = {
                event: "session_cart_abandonment",
                session_id: orderId.sessionId,
                tab_id: orderId.tabId,
                exit_reason: orderId.reason,
                cart_value: pathMatch.value,
                cart_items: pathMatch.itemCount,
                abandonment_stage: orderNumMatch,
              };
              window.dataLayer.push(orderTotal);
            }
            const totalEl = {
              event: "session_commerce_summary",
              session_id: orderId.sessionId,
              products_viewed: orderNumEl.productsViewed,
              cart_additions: orderNumEl.cartAdditions,
              cart_removals: orderNumEl.cartRemovals,
              final_cart_value: pathMatch.value,
              checkout_reached: orderNumEl.checkoutStarted,
              conversions: window._adtConversionEvents?.["length"] || 0,
            };
            window.dataLayer.push(totalEl);
            ecomLog("Commerce summary sent");
          });
          window.ADTSession.registerHook("idle", function (lineItems) {
            const lineRows = cartSnapshot.getCartState();
            if (lineRows.hasItems || cartSnapshot.viewedProducts.size > 0) {
              const lineRow = {
                event: "commerce_idle",
                session_id: lineItems.sessionId,
                cart_value: lineRows.value,
                products_viewed: cartSnapshot.viewedProducts.size,
                in_checkout: lineRows.checkoutStarted,
              };
              window.dataLayer.push(lineRow);
            }
          });
        } catch (productName) {
          window.adtDebug("Error registering session hooks:", productName);
        }
        window.adtDebug("Session integration complete");
      },
    };
    ecommerce.init();
    if (window.ADTIntegration) {
      window.ADTIntegration.moduleReady("ecommerce");
    }
    window.adtDebug("Ecommerce tracking initialized");
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrapEcommerce);
  } else {
    bootstrapEcommerce();
  }
})();
