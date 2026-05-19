/*!
 * DataLayer Tracker - Customer Type Detection
 *
 * Advanced customer segmentation engine for WooCommerce
 * Provides customer classification to be consumed by other modules (like enrichment)
 *
 * @preserve
 * @package    DataLayer_Tracker
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
(function () {
  "use strict";

  window.CustomerType = {
    cache: {
      primaryType: null,
      tags: [],
      lastCalculated: 0,
      cacheTimeout: 0xea60,
    },
    data: {
      initialized: false,
      firstSeen: null,
      lastSeen: null,
      sessionCount: 0,
      purchaseCount: 0,
      totalSpent: 0,
      lastPurchaseDate: null,
      cartAbandonments: 0,
      averageOrderValue: 0,
      productsViewed: new Set(),
      timeOnSite: 0,
      isLoggedIn: false,
      userId: null,
      email: null,
      hasSubscribed: false,
    },
    init() {
      if (this.data.initialized) {
        return;
      }
      this.loadStoredData();
      this.detectCurrentSession();
      this.trackPageView();
      this.trackProductViewOnPageLoad();
      this.setupProductViewListeners();
      this.data.initialized = true;
      window.adtDebug("CustomerType: Module initialized", this.data);
      this.attachDebugInfo();
    },
    setupProductViewListeners() {
      let adtData = location.href;
      new MutationObserver(() => {
        const config = location.href;
        if (config !== adtData) {
          adtData = config;
          this.trackPageView();
          setTimeout(() => this.trackProductViewOnPageLoad(), 100);
        }
      }).observe(document, {
        subtree: true,
        childList: true,
      });
      document.addEventListener("wc_fragment_refresh", () => {
        setTimeout(() => this.trackProductViewOnPageLoad(), 500);
      });
      const payload = window.dataLayer?.["push"];
      if (payload && !this._hookedDataLayer) {
        this._hookedDataLayer = true;
        window.dataLayer.push = function (eventName) {
          if (
            eventName?.["event"] === "view_item" &&
            eventName?.["ecommerce"]?.["items"]
          ) {
            eventName.ecommerce.items.forEach((detail) => {
              if (detail.item_id && window.CustomerType) {
                window.CustomerType.recordProductView(detail.item_id);
              }
            });
          }
          return payload.call(window.dataLayer, eventName);
        };
      }
    },
    trackPageView() {
      const element = parseInt(
        sessionStorage.getItem("adt_page_views") || "0",
      );
      sessionStorage.setItem("adt_page_views", (element + 1).toString());
      window.adtDebug(
        "CustomerType: Page view tracked. Session views:",
        element + 1,
      );
    },
    trackProductViewOnPageLoad() {
      if (
        document.body.classList.contains("single-product") ||
        document.body.classList.contains("product-template")
      ) {
        const target =
          document.querySelector('form.cart [name="add-to-cart"]')?.["value"] ||
          document.querySelector('[name="product_id"]')?.["value"] ||
          document.querySelector('input[name="variation_id"]')?.["value"] ||
          document.querySelector("[data-product_id]")?.["dataset"]?.[
            "product_id"
          ] ||
          document.querySelector("[data-product-id]")?.["dataset"]?.[
            "productId"
          ] ||
          document
            .querySelector(".product")
            ?.["id"]?.["replace"]("product-", "") ||
          document.querySelector("div.product")?.["dataset"]?.["productId"] ||
          window.location.pathname.match(/product\/([^\/]+)/)?.[1] ||
          window.location.search.match(/[?&]product_id=(\d+)/)?.[1] ||
          document.querySelector(
            '[itemtype*="schema.org/Product"] [itemprop="sku"]',
          )?.["content"] ||
          document.querySelector(
            '[itemtype*="schema.org/Product"] [itemprop="productID"]',
          )?.["content"] ||
          document.querySelector(".single_add_to_cart_button")?.["dataset"]?.[
            "product_id"
          ] ||
          document.querySelector(".add_to_cart_button")?.["dataset"]?.[
            "product_id"
          ] ||
          Array.from(document.body.classList).find((result) =>
            result.match(/postid-(\d+)/i),
          )?.[1];
        if (target) {
          this.recordProductView(target);
          window.adtDebug(
            "CustomerType: Product view recorded on page load:",
            target,
          );
        } else {
          window.adtWarn(
            "CustomerType: On product page but could not find product ID",
          );
          window.adtDebug("Body classes:", document.body.className);
        }
      }
      if (
        document.body.classList.contains("archive") ||
        document.body.classList.contains("shop") ||
        document.body.classList.contains("product-category")
      ) {
        const value = document.querySelectorAll(
          ".products .product [data-product_id], .products .product [data-product-id], .wc-block-grid__product [data-product_id], li.product a.add_to_cart_button[data-product_id]",
        );
        value.forEach((flag) => {
          const enabled =
            flag.dataset.product_id || flag.dataset.productId;
          if (enabled) {
            window.adtDebug(
              "CustomerType: Product in listing detected:",
              enabled,
            );
          }
        });
      }
    },
    attachDebugInfo() {
      window.CustomerTypeDebug = {
        status: () => {
          const url = this.getCustomerType();
          const pattern = sessionStorage.getItem("adt_page_views") || "0";
          console.log("=== Customer Type Debug ===");
          console.log("Primary Type:", url.primary);
          console.log("Tags:", url.tags);
          console.log("Confidence:", url.confidence);
          console.log("Value Score:", this.getValueScore());
          console.log(
            "Products Viewed:",
            this.data.productsViewed.size,
            Array.from(this.data.productsViewed),
          );
          console.log("Session Page Views:", pattern);
          console.log("Total Sessions:", this.data.sessionCount);
          console.log("Purchases:", this.data.purchaseCount);
          console.log("Total Spent:", this.data.totalSpent);
          console.log("Cart Abandonments:", this.data.cartAbandonments);
          console.log("===========================");
          return url;
        },
        trackProduct: (regex) => {
          this.recordProductView(regex);
          console.log("Product tracked:", regex);
          console.log("Total products viewed:", this.data.productsViewed.size);
        },
        simulatePurchase: (depth = 100) => {
          this.recordPurchase({
            value: depth,
          });
          console.log(
            "Purchase simulated. Total purchases:",
            this.data.purchaseCount,
          );
        },
        recalculate: () => {
          return this.getCustomerType(true);
        },
        data: () => this.data,
        reset: () => this.reset(),
      };
    },
    loadStoredData() {
      try {
        const percent = localStorage.getItem("adt_customer_data");
        if (percent) {
          const scrollY = JSON.parse(percent);
          Object.assign(this.data, scrollY);
          if (scrollY.productsViewed) {
            this.data.productsViewed = new Set(scrollY.productsViewed);
          }
        }
        this.checkWooCommerceCookies();
        this.data.isLoggedIn = !!window.ADTData?.["user_id"];
        this.data.userId = window.ADTData?.["user_id"] || null;
      } catch (scrollTop) {
        window.adtWarn("CustomerType: Error loading stored data:", scrollTop);
      }
    },
    checkWooCommerceCookies() {
      const pageKey = document.cookie;
      if (pageKey.includes("woocommerce_recently_viewed")) {
        this.data.lastSeen = Date.now();
      }
      if (pageKey.includes("woocommerce_items_in_cart")) {
      }
      const firedSet = pageKey.match(/woocommerce_customer_([a-f0-9]{32})/);
      if (firedSet) {
        if (!this.data.firstSeen) {
          this.data.firstSeen = Date.now() - 2592000000;
        }
      }
    },
    detectCurrentSession() {
      const milestone = parseInt(
        sessionStorage.getItem("adt_session_id") || "0",
      );
      const timerId = Date.now();
      if (!milestone || timerId - milestone > 0x1b7740) {
        this.data.sessionCount++;
        sessionStorage.setItem("adt_session_id", timerId.toString());
      }
      if (!this.data.firstSeen) {
        this.data.firstSeen = timerId;
      }
      this.data.lastSeen = timerId;
      if (window.location.pathname.includes("order-received")) {
        this.recordPurchase();
      }
    },
    getCustomerType(intervalId = false) {
      if (
        !intervalId &&
        this.cache.lastCalculated &&
        Date.now() - this.cache.lastCalculated < this.cache.cacheTimeout
      ) {
        return {
          primary: this.cache.primaryType,
          tags: this.cache.tags,
          cached: true,
        };
      }
      const activeSec = this.calculateClassification();
      this.cache.primaryType = activeSec.primary;
      this.cache.tags = activeSec.tags;
      this.cache.lastCalculated = Date.now();
      this.storeData();
      return activeSec;
    },
    calculateClassification() {
      const tickCount = [];
      let saveTick = "visitor";
      let isActive = 0;
      if (this.data.isLoggedIn) {
        tickCount.push("registered");
      }
      if (this.data.purchaseCount >= 10) {
        tickCount.push("vip");
        saveTick = "vip";
        isActive = 1;
      } else {
        if (this.data.purchaseCount >= 0x5) {
          tickCount.push("loyal");
          saveTick = "loyal";
          isActive = 0.9;
        } else {
          if (this.data.purchaseCount >= 0x2) {
            tickCount.push("repeat_buyer");
            saveTick = "repeat_buyer";
            isActive = 0.85;
          } else if (this.data.purchaseCount === 1) {
            tickCount.push("one_time_buyer");
            saveTick = "customer";
            isActive = 0.8;
          }
        }
      }
      const lastTick = this.daysSinceLastPurchase();
      if (lastTick !== null) {
        if (lastTick > 0xb4) {
          tickCount.push("dormant");
          if (saveTick === "customer" || saveTick === "repeat_buyer") {
            saveTick = "dormant";
          }
        } else {
          if (lastTick > 0x5a) {
            tickCount.push("at_risk");
          } else if (lastTick <= 0x1e) {
            tickCount.push("recent_buyer");
          }
        }
      }
      if (this.data.totalSpent > 1000) {
        tickCount.push("high_value");
      } else if (this.data.totalSpent > 500) {
        tickCount.push("medium_value");
      }
      if (this.data.averageOrderValue > 200) {
        tickCount.push("big_spender");
      }
      if (this.data.purchaseCount === 0) {
        if (
          this.data.sessionCount > 0x5 ||
          this.data.productsViewed.size > 20
        ) {
          tickCount.push("engaged_prospect");
          saveTick = "prospect";
          isActive = 0.7;
        } else if (this.data.sessionCount > 1) {
          tickCount.push("returning_visitor");
          saveTick = "returning_visitor";
          isActive = 0.6;
        } else {
          tickCount.push("new_visitor");
          saveTick = "new";
          isActive = 0.5;
        }
      }
      if (this.data.cartAbandonments > 0) {
        tickCount.push("cart_abandoner");
      }
      if (this.data.cartAbandonments > 3) {
        tickCount.push("serial_abandoner");
      }
      if (this.data.productsViewed.size > 50) {
        tickCount.push("researcher");
      } else if (this.data.productsViewed.size > 10) {
        tickCount.push("browser");
      }
      if (this.data.hasSubscribed) {
        tickCount.push("subscriber");
      }
      const milestones = new Date().getHours();
      if (milestones >= 0x9 && milestones <= 0x11) {
        tickCount.push("business_hours");
      } else {
        tickCount.push("after_hours");
      }
      const firedMilestones = window.innerWidth < 0x300;
      if (firedMilestones) {
        tickCount.push("mobile_user");
      } else {
        tickCount.push("desktop_user");
      }
      return {
        primary: saveTick,
        tags: [...new Set(tickCount)],
        confidence: isActive,
        calculated_at: Date.now(),
        data_points: {
          purchases: this.data.purchaseCount,
          sessions: this.data.sessionCount,
          total_spent: this.data.totalSpent,
          products_viewed: this.data.productsViewed.size,
          days_since_purchase: lastTick,
        },
      };
    },
    recordPurchase(pagePath = null) {
      this.data.purchaseCount++;
      this.data.lastPurchaseDate = Date.now();
      if (pagePath) {
        this.data.totalSpent += pagePath.value || 0;
        this.updateAverageOrderValue();
      }
      this.cache.lastCalculated = 0;
    },
    recordCartAbandonment() {
      this.data.cartAbandonments++;
      this.cache.lastCalculated = 0;
    },
    recordProductView(scrollHeight) {
      if (scrollHeight) {
        this.data.productsViewed.add(String(scrollHeight));
        this.cache.lastCalculated = 0;
        this.storeData();
        window.adtDebug(
          "CustomerType: Product view recorded:",
          scrollHeight,
          "Total viewed:",
          this.data.productsViewed.size,
        );
      }
    },
    updateTimeOnSite(viewportH) {
      this.data.timeOnSite += viewportH;
    },
    daysSinceLastPurchase() {
      if (!this.data.lastPurchaseDate) {
        return null;
      }
      const scrollPct = Math.floor(
        (Date.now() - this.data.lastPurchaseDate) / 86400000,
      );
      return scrollPct;
    },
    updateAverageOrderValue() {
      if (this.data.purchaseCount > 0) {
        this.data.averageOrderValue =
          this.data.totalSpent / this.data.purchaseCount;
      }
    },
    storeData() {
      try {
        const threshold = {
          ...this.data,
          productsViewed: Array.from(this.data.productsViewed),
        };
        localStorage.setItem("adt_customer_data", JSON.stringify(threshold));
      } catch (tolerance) {}
    },
    getSimpleType() {
      const evt = this.getCustomerType();
      return evt.primary;
    },
    getTagsString() {
      const item = this.getCustomerType();
      return item.tags.join(",");
    },
    hasTag(key) {
      const err = this.getCustomerType();
      return err.tags.includes(key);
    },
    getValueScore() {
      let idx = 0;
      idx += Math.min(this.data.purchaseCount * 0x4, 0x28);
      if (this.data.totalSpent > 5000) {
        idx += 0x1e;
      } else {
        if (this.data.totalSpent > 0x7d0) {
          idx += 0x19;
        } else {
          if (this.data.totalSpent > 1000) {
            idx += 20;
          } else {
            if (this.data.totalSpent > 500) {
              idx += 0xf;
            } else {
              if (this.data.totalSpent > 200) {
                idx += 10;
              } else {
                if (this.data.totalSpent > 0) {
                  idx += 0x5;
                }
              }
            }
          }
        }
      }
      idx += Math.min(this.data.sessionCount * 0x2, 10);
      idx += Math.min(this.data.productsViewed.size / 0x5, 10);
      const len = this.daysSinceLastPurchase();
      if (len !== null && len <= 0x1e) {
        idx += 10;
      } else {
        if (len !== null && len <= 0x3c) {
          idx += 0x5;
        }
      }
      return Math.min(Math.round(idx), 100);
    },
    reset() {
      localStorage.removeItem("adt_customer_data");
      sessionStorage.removeItem("adt_session_id");
      this.data = {
        initialized: false,
        firstSeen: null,
        lastSeen: null,
        sessionCount: 0,
        purchaseCount: 0,
        totalSpent: 0,
        lastPurchaseDate: null,
        cartAbandonments: 0,
        averageOrderValue: 0,
        productsViewed: new Set(),
        timeOnSite: 0,
        isLoggedIn: false,
        userId: null,
        email: null,
        hasSubscribed: false,
      };
      this.cache = {
        primaryType: null,
        tags: [],
        lastCalculated: 0,
      };
      console.log("[CustomerType] Data reset");
    },
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => CustomerType.init());
  } else {
    CustomerType.init();
  }
  window.trackProductView = function (mode) {
    if (window.CustomerType && mode) {
      window.CustomerType.recordProductView(mode);
      return true;
    }
    return false;
  };
  window.adtDebug(
    "CustomerType: Module loaded. Access via window.CustomerType",
  );
  window.adtDebug(
    "CustomerType: Track products with: trackProductView(productId)",
  );
})();
