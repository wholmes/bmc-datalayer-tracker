class ADTSetupWizard {
  constructor(adtData) {
    this.$ = adtData;
    this.currentStep = 1;
    this.totalSteps = 0x6;
    this.setupMode = "recommended";
    this.wizardData = {};
    this.init();
  }
  ["init"]() {
    this.attachEventListeners();
    this.loadSavedProgress();
    this.updateProgressBar();
    this.initializeToggleStates();
  }
  ["initializeToggleStates"]() {
    const config = this.$;
    const payload = config("#ga4_mp_enabled");
    if (payload.length) {
      const eventName = config('[data-depends="ga4_mp_enabled"]');
      if (payload.is(":checked")) {
        eventName.show();
      } else {
        eventName.hide();
      }
    }
    const detail = config("#meta_capi_enabled");
    if (detail.length) {
      const element = config('[data-depends="meta_capi_enabled"]');
      if (detail.is(":checked")) {
        element.show();
      } else {
        element.hide();
      }
    }
    const target = config('input[name="pixel_tracking_enabled"]:checked');
    const result = config("#pixel-details");
    if (target.length) {
      if (target.val() === "1") {
        result.show();
      } else {
        result.hide();
      }
    } else {
      result.hide();
    }
  }
  ["attachEventListeners"]() {
    const value = this.$;
    value("#wizard-next").on("click", () => this.nextStep());
    value("#wizard-prev").on("click", () => this.prevStep());
    value("#wizard-skip").on("click", () => this.skipStep());
    value("#complete-wizard").on("click", () => this.completeWizard());
    value('input[name="setup_mode"]').on("change", (flag) => {
      this.setupMode = value(flag.target).val();
      this.toggleCustomMode();
    });
    value('input[name="config_preset"]').on("change", (enabled) => {
      this.applyPreset(value(enabled.target).val());
    });
    value('input[name="enable_ecommerce_tracking"]').on(
      "change",
      (url) => {
        this.toggleDependentFields(url.target);
      },
    );
    value("#ga4_mp_enabled").on("change", (pattern) => {
      this.toggleIntegrationConfig(pattern.target, "ga4_mp_enabled");
    });
    value("#meta_capi_enabled").on("change", (regex) => {
      this.toggleIntegrationConfig(regex.target, "meta_capi_enabled");
    });
    value('input[name="pixel_tracking_enabled"]').on(
      "change",
      (depth) => {
        this.togglePixelDetails(value(depth.target).val());
      },
    );
    value('.adt-pixel-item input[type="checkbox"]').on(
      "change",
      (percent) => {
        value(percent.target)
          .closest(".adt-pixel-item")
          .find(".adt-pixel-config")
          .toggle(percent.target.checked);
      },
    );
    value("#test-ga4-connection").on("click", () =>
      this.testGA4Connection(),
    );
    value("#test-meta-connection").on("click", () =>
      this.testMetaConnection(),
    );
    value(".adt-wizard-step input, .adt-wizard-step select").on(
      "change",
      () => {
        this.saveProgress();
      },
    );
    value(document).on("keydown", (scrollY) => {
      if (
        scrollY.key === "Enter" &&
        !value(scrollY.target).is("textarea")
      ) {
        scrollY.preventDefault();
        this.nextStep();
      }
    });
  }
  ["toggleCustomMode"]() {
    const scrollTop = this.$;
    const pageKey = this.setupMode === "custom";
    scrollTop(".adt-custom-toggle").toggle(pageKey);
  }
  ["toggleDependentFields"](firedSet) {
    const milestone = this.$;
    const timerId = milestone(firedSet);
    const intervalId = timerId.attr("name");
    milestone('[data-depends="' + intervalId + '"]').toggle(
      timerId.is(":checked"),
    );
  }
  ["toggleIntegrationConfig"](activeSec, tickCount) {
    const saveTick = this.$;
    const isActive = saveTick(activeSec);
    const lastTick = saveTick('[data-depends="' + tickCount + '"]');
    if (isActive.is(":checked")) {
      lastTick.slideDown(0x12c);
    } else {
      lastTick.slideUp(0x12c);
    }
  }
  ["togglePixelDetails"](milestones) {
    const firedMilestones = this.$;
    const pagePath = firedMilestones("#pixel-details");
    if (milestones === "1") {
      pagePath.slideDown(0x12c);
    } else {
      pagePath.slideUp(0x12c);
    }
  }
  ["applyPreset"](scrollHeight) {
    const viewportH = this.$;
    const scrollPct = {
      recommended: {
        enable_ecommerce_tracking: false,
        include_content_intelligence: false,
      },
      ecommerce: {
        enable_ecommerce_tracking: true,
        include_ga4_item_metadata: true,
        include_content_intelligence: false,
      },
      content: {
        enable_ecommerce_tracking: false,
        include_content_intelligence: true,
        include_last_engaged_section: true,
        include_scroll_back_up: true,
      },
      minimal: {
        enable_ecommerce_tracking: false,
        include_content_intelligence: false,
        include_hover_intent: false,
        include_video_progress: false,
      },
    };
    const threshold = scrollPct[scrollHeight];
    if (!threshold) {
      return;
    }
    Object.keys(threshold).forEach((tolerance) => {
      const evt = viewportH('input[name="' + tolerance + '"]');
      if (evt.is(":checkbox")) {
        evt.prop("checked", threshold[tolerance]).trigger("change");
      }
    });
    this.showNotification("Preset applied successfully", "success");
  }
  async ["testGA4Connection"]() {
    const item = this.$;
    const key = item("#test-ga4-connection");
    const err = item("#ga4-test-result");
    const idx = item('input[name="ga4_measurement_id"]').val();
    const len = item('input[name="ga4_api_secret"]').val();
    if (!idx || !len) {
      this.showTestResult(
        err,
        "error",
        "Please enter both Measurement ID and API Secret",
      );
      return;
    }
    key
      .prop("disabled", true)
      .html('<span class="dashicons dashicons-update spin"></span> Testing...');
    try {
      const mode = await item.ajax({
        url: ajaxurl,
        type: "POST",
        data: {
          action: "adt_test_ga4_connection",
          nonce: adtWizard.nonce,
          measurement_id: idx,
          api_secret: len,
        },
      });
      if (mode.success) {
        this.showTestResult(
          err,
          "success",
          "Connection successful! Credentials are valid.",
        );
      } else {
        this.showTestResult(
          err,
          "error",
          mode.data.message || "Connection failed",
        );
      }
    } catch (typeVal) {
      this.showTestResult(
        err,
        "error",
        "Request failed. Please check your credentials.",
      );
    }
    key
      .prop("disabled", false)
      .html(
        '<span class="dashicons dashicons-yes-alt"></span> Test Connection',
      );
  }
  async ["testMetaConnection"]() {
    const nameVal = this.$;
    const opts = nameVal("#test-meta-connection");
    const ref = nameVal("#meta-test-result");
    const val = nameVal('input[name="meta_pixel_id_server"]').val();
    const obj = nameVal('input[name="meta_access_token"]').val();
    if (!val || !obj) {
      this.showTestResult(
        ref,
        "error",
        "Please enter both Pixel ID and Access Token",
      );
      return;
    }
    opts
      .prop("disabled", true)
      .html('<span class="dashicons dashicons-update spin"></span> Testing...');
    try {
      const fn = await nameVal.ajax({
        url: ajaxurl,
        type: "POST",
        data: {
          action: "adt_test_meta_connection",
          nonce: adtWizard.nonce,
          pixel_id: val,
          access_token: obj,
        },
      });
      if (fn.success) {
        this.showTestResult(
          ref,
          "success",
          "Connection successful! Credentials are valid.",
        );
      } else {
        this.showTestResult(
          ref,
          "error",
          fn.data.message || "Connection failed",
        );
      }
    } catch (arg) {
      this.showTestResult(
        ref,
        "error",
        "Request failed. Please check your credentials.",
      );
    }
    opts
      .prop("disabled", false)
      .html(
        '<span class="dashicons dashicons-yes-alt"></span> Test Connection',
      );
  }
  ["showTestResult"](tmp, node, list) {
    const entry = node === "success" ? "yes-alt" : "dismiss";
    const state =
      node === "success" ? "adt-test-success" : "adt-test-error";
    tmp
      .removeClass("adt-test-success adt-test-error")
      .addClass(state)
      .html(
        '<span class="dashicons dashicons-' +
          entry +
          '"></span> ' +
          list,
      )
      .slideDown(0x12c);
  }
  ["nextStep"]() {
    if (this.currentStep < this.totalSteps) {
      if (this.validateStep(this.currentStep)) {
        this.currentStep++;
        this.showStep(this.currentStep);
        this.updateProgressBar();
        this.saveProgress();
      }
    }
  }
  ["prevStep"]() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.showStep(this.currentStep);
      this.updateProgressBar();
    }
  }
  ["skipStep"]() {
    this.nextStep();
  }
  ["showStep"](ctx) {
    const data = this.$;
    data(".adt-wizard-step").removeClass("active");
    data('.adt-wizard-step[data-step="' + ctx + '"]').addClass(
      "active",
    );
    data(".adt-step-indicator").removeClass("active completed");
    for (let row = 1; row < ctx; row++) {
      data('.adt-step-indicator[data-step="' + row + '"]').addClass(
        "completed",
      );
    }
    data('.adt-step-indicator[data-step="' + ctx + '"]').addClass(
      "active",
    );
    data("#wizard-prev").toggle(ctx > 1);
    data("#wizard-next").toggle(ctx < this.totalSteps);
    data("#wizard-skip").toggle(ctx === 0x4 || ctx === 0x5);
    data(".adt-wizard-container").animate(
      {
        scrollTop: 0,
      },
      0x12c,
    );
    if (ctx === this.totalSteps) {
      this.updateReview();
    }
  }
  ["validateStep"](col) {
    const mapVal = this.$;
    let setVal = true;
    switch (col) {
      case 1:
        break;
      case 0x2:
        break;
      case 3:
        break;
      case 0x4:
        if (mapVal("#ga4_mp_enabled").is(":checked")) {
          const buf = mapVal('input[name="ga4_measurement_id"]').val();
          const raw = mapVal('input[name="ga4_api_secret"]').val();
          if (!buf || !raw) {
            this.showNotification(
              "Please complete GA4 credentials or disable GA4 Measurement Protocol",
              "warning",
            );
            setVal = false;
          }
        }
        if (mapVal("#meta_capi_enabled").is(":checked")) {
          const parsed = mapVal(
            'input[name="meta_pixel_id_server"]',
          ).val();
          const text = mapVal('input[name="meta_access_token"]').val();
          if (!parsed || !text) {
            this.showNotification(
              "Please complete Meta CAPI credentials or disable Meta Conversions API",
              "warning",
            );
            setVal = false;
          }
        }
        break;
      case 0x5:
        if (
          mapVal('input[name="pixel_tracking_enabled"]:checked').val() ===
          "1"
        ) {
          let html = false;
          let cmpName = true;
          mapVal('.adt-pixel-item input[type="checkbox"]').each(
            (handler, callback) => {
              if (mapVal(callback).is(":checked")) {
                html = true;
                const response = mapVal(callback)
                  .closest(".adt-pixel-item")
                  .find('input[type="text"]');
                if (!response.val()) {
                  cmpName = false;
                }
              }
            },
          );
          if (!html) {
            this.showNotification(
              "Please enable at least one pixel or switch to GTM Only mode",
              "warning",
            );
            setVal = false;
          } else if (!cmpName) {
            this.showNotification(
              "Please enter IDs for all enabled pixels",
              "warning",
            );
            setVal = false;
          }
        }
        break;
    }
    return setVal;
  }
  ["updateProgressBar"]() {
    const request = this.$;
    const fields =
      ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;
    request(".adt-progress-fill")
      .css("width", fields + "%")
      .attr("data-progress", fields);
  }
  ["updateReview"]() {
    const formId = this.$;
    const fieldId =
      formId('input[name="config_preset"]:checked').val() || "recommended";
    const cartAdds = {
      recommended: "Recommended Configuration",
      ecommerce: "E-commerce Configuration",
      content: "Content Site Configuration",
      minimal: "Minimal Configuration",
    };
    formId("#review-preset").text(cartAdds[fieldId]);
    const cartRemoves = [];
    formId('.adt-feature-section input[type="checkbox"]:checked').each(
      (sessionInfo, hookData) => {
        const pixelEvt = formId(hookData)
          .closest(".adt-toggle-field")
          .find("strong")
          .text();
        if (pixelEvt) {
          cartRemoves.push(pixelEvt);
        }
      },
    );
    if (cartRemoves.length > 0) {
      formId("#review-features").html(
        cartRemoves
          .slice(0, 0x5)
          .map(
            (overlayEvt) =>
              '<div class="adt-review-item">' + overlayEvt + "</div>",
          )
          .join("") +
          (cartRemoves.length > 0x5
            ? '<div class="adt-review-item">...and ' +
              (cartRemoves.length - 0x5) +
              " more</div>"
            : ""),
      );
    }
    const filterEvt = [];
    if (formId("#ga4_mp_enabled").is(":checked")) {
      filterEvt.push("Google Analytics 4 Measurement Protocol");
    }
    if (formId("#meta_capi_enabled").is(":checked")) {
      filterEvt.push("Meta Conversions API");
    }
    if (filterEvt.length > 0) {
      formId("#review-server-side").html(
        filterEvt
          .map(
            (searchParams) =>
              '<div class="adt-review-item">' + searchParams + "</div>",
          )
          .join(""),
      );
    } else {
      formId("#review-server-side").html(
        '<div class="adt-review-item adt-review-disabled">Not configured</div>',
      );
    }
    const clickId = formId(
      'input[name="pixel_tracking_enabled"]:checked',
    ).val();
    if (clickId === "0") {
      formId("#review-pixels").html(
        '<div class="adt-review-item adt-review-disabled">GTM Only (recommended)</div>',
      );
    } else {
      const utmData = [];
      formId('.adt-pixel-item input[type="checkbox"]:checked').each(
        (cookieVal, cookieKey) => {
          const consentRaw = formId(cookieKey)
            .closest(".adt-pixel-toggle")
            .find("strong")
            .text();
          utmData.push(consentRaw);
        },
      );
      if (utmData.length > 0) {
        formId("#review-pixels").html(
          utmData
            .map(
              (consentObj) =>
                '<div class="adt-review-item">' + consentObj + "</div>",
            )
            .join(""),
        );
      } else {
        formId("#review-pixels").html(
          '<div class="adt-review-item adt-review-disabled">No pixels configured</div>',
        );
      }
    }
  }
  async ["completeWizard"]() {
    const prevConsent = this.$;
    const now = prevConsent("#complete-wizard");
    now
      .prop("disabled", true)
      .html(
        '<span class="dashicons dashicons-update spin"></span> Saving Configuration...',
      );
    const last = this.collectFormData();
    try {
      const diff = await prevConsent.ajax({
        url: ajaxurl,
        type: "POST",
        data: {
          action: "adt_complete_wizard",
          nonce: adtWizard.nonce,
          wizard_data: last,
        },
      });
      if (diff.success) {
        this.showCompletionMessage();
      } else {
        this.showNotification(
          "Failed to save configuration: " +
            (diff.data?.["message"] || "Unknown error"),
          "error",
        );
        now
          .prop("disabled", false)
          .html('<span class="dashicons dashicons-yes"></span> Complete Setup');
      }
    } catch (found) {
      this.showNotification("Request failed. Please try again.", "error");
      now
        .prop("disabled", false)
        .html('<span class="dashicons dashicons-yes"></span> Complete Setup');
    }
  }
  ["collectFormData"]() {
    const detected = this.$;
    const retryCount = {};
    detected(".adt-wizard-step input, .adt-wizard-step select").each(
      (maxRetries, delayMs) => {
        const timeoutMs = detected(delayMs);
        const hasConsent = timeoutMs.attr("name");
        if (!hasConsent) {
          return;
        }
        if (timeoutMs.is(":checkbox")) {
          retryCount[hasConsent] = timeoutMs.is(":checked") ? 1 : 0;
        } else if (timeoutMs.is(":radio")) {
          if (timeoutMs.is(":checked")) {
            retryCount[hasConsent] = timeoutMs.val();
          }
        } else {
          retryCount[hasConsent] = timeoutMs.val();
        }
      },
    );
    return retryCount;
  }
  ["showCompletionMessage"]() {
    const blocked = this.$;
    blocked(".adt-wizard-content, .adt-wizard-navigation").fadeOut(
      0x190,
      () => {
        blocked(".adt-wizard-container")
          .html(
            '\n                <div class="adt-completion-screen">\n                    <div class="adt-completion-icon">\n                        <span class="dashicons dashicons-yes-alt"></span>\n                    </div>\n                    <h1>All Set!</h1>\n                    <p class="adt-completion-message">\n                        Your tracking configuration has been saved successfully. \n                        DataLayer Tracker is now active and ready to capture events.\n                    </p>\n                    <div class="adt-completion-actions">\n                        <a href="' +
              adtWizard.settingsUrl +
              '" class="adt-button adt-button-primary">\n                            <span class="dashicons dashicons-admin-settings"></span>\n                            Go to Settings\n                        </a>\n                        <a href="' +
              adtWizard.dashboardUrl +
              '" class="adt-button adt-button-secondary">\n                            <span class="dashicons dashicons-chart-area"></span>\n                            View Dashboard\n                        </a>\n                        <a href="' +
              adtWizard.docsUrl +
              '" class="adt-button adt-button-secondary" target="_blank">\n                            <span class="dashicons dashicons-book"></span>\n                            Read Documentation\n                        </a>\n                    </div>\n                    <div class="adt-next-steps-box">\n                        <h3>Recommended Next Steps</h3>\n                        <ol>\n                            <li>Test your tracking using GTM Preview mode</li>\n                            <li>Review the debug overlay on your site (visible to admins)</li>\n                            <li>Configure your consent management platform</li>\n                            <li>Set up custom event mappings if needed</li>\n                        </ol>\n                    </div>\n                </div>\n            ',
          )
          .fadeIn(0x190);
      },
    );
  }
  ["saveProgress"]() {
    const wasBlocked = this.collectFormData();
    wasBlocked.current_step = this.currentStep;
    wasBlocked.setup_mode = this.setupMode;
    localStorage.setItem("adt_wizard_progress", JSON.stringify(wasBlocked));
  }
  ["loadSavedProgress"]() {
    const analyticsOk = this.$;
    const marketingOk = localStorage.getItem("adt_wizard_progress");
    if (!marketingOk) {
      return;
    }
    try {
      const extra = JSON.parse(marketingOk);
      Object.keys(extra).forEach((source) => {
        const granted = analyticsOk('[name="' + source + '"]');
        if (granted.is(":checkbox")) {
          granted.prop("checked", extra[source] == 1);
        } else if (granted.is(":radio")) {
          granted
            .filter('[value="' + extra[source] + '"]')
            .prop("checked", true);
        } else {
          granted.val(extra[source]);
        }
      });
      this.initializeToggleStates();
      if (extra.current_step && extra.current_step > 1) {
        if (confirm("Would you like to continue from where you left off?")) {
          this.currentStep = parseInt(extra.current_step);
          this.showStep(this.currentStep);
        }
      }
    } catch (previous) {
      console.error("Failed to restore wizard progress:", previous);
    }
  }
  ["showNotification"](storageErr, localA = "info") {
    const localB = this.$;
    const localC =
      localA === "success"
        ? "yes-alt"
        : localA === "error"
          ? "dismiss"
          : "info";
    const localD = "adt-notification adt-notification-" + localA;
    const localE = localB(
      '\n            <div class="' +
        localD +
        '">\n                <span class="dashicons dashicons-' +
        localC +
        '"></span>\n                <span>' +
        storageErr +
        "</span>\n            </div>\n        ",
    );
    localB("body").append(localE);
    setTimeout(() => {
      localE.addClass("show");
    }, 100);
    setTimeout(() => {
      localE.removeClass("show");
      setTimeout(() => localE.remove(), 0x12c);
    }, 0xfa0);
  }
}
jQuery(document).ready(function (localF) {
  if (localF(".adt-setup-wizard").length) {
    window.adtWizard = new ADTSetupWizard(localF);
  }
});
