/*!
 * DataLayer Tracker - Analytics Dashboard
 *
 * Real-time visualization of active tracking configuration
 *
 * @preserve
 * @package    DataLayer_Tracker
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @since      1.0.0
 */
(function () {
  "use strict";

  const adtData = {
    engagement: "#2196F3",
    ecommerce: "#4CAF50",
    forms: "#FF9800",
    video: "#E91E63",
    session: "#9C27B0",
    content: "#00BCD4",
    consent: "#9C27B0",
    other: "#757575",
  };
  class config {
    constructor(payload) {
      this.data = payload;
      this.processed = null;
    }
    ["process"]() {
      const eventName = this.data.events || {};
      const detail = Object.entries(eventName).map(
        ([element, target]) => ({
          name: element,
          category: target.category || "other",
          label: target.label || element,
          milestones: target.milestones || [],
          enabled: true,
        }),
      );
      this.processed = {
        events: detail,
        session: this.data.session || {},
        features: this.data.features || {},
        settings: this.data.settings || {},
        metrics: this._calculateMetrics(detail),
      };
      return this.processed;
    }
    ["_calculateMetrics"](result) {
      const value = {};
      Object.keys(adtData).forEach((flag) => {
        value[flag] = result.filter(
          (enabled) => enabled.category === flag,
        ).length;
      });
      const url = result.length;
      const pattern = result.filter(
        (regex) => regex.category === "engagement",
      ).length;
      const depth = result.filter(
        (percent) => percent.category === "ecommerce",
      ).length;
      return {
        totalEvents: url,
        engagementEvents: pattern,
        ecommerceEvents: depth,
        byCategory: value,
        coverageScore: this._calculateCoverage(result),
        topCategories: Object.entries(value)
          .filter(([, scrollY]) => scrollY > 0)
          .sort((scrollTop, pageKey) => pageKey[1] - scrollTop[1])
          .slice(0, 0x5),
      };
    }
    ["_calculateCoverage"](firedSet) {
      const milestone = this.data.settings || {};
      const timerId = this.data.features || {};
      let intervalId = 0;
      let activeSec = 0x1e;
      const tickCount = ["page_view", "session_start", "user_engagement"];
      const saveTick = tickCount.every((isActive) =>
        firedSet.find((lastTick) => lastTick.name === isActive),
      );
      const milestones =
        milestone.gtm_container_id && milestone.gtm_container_id.trim() !== "";
      const firedMilestones = timerId.debug_mode || timerId.debug_overlay;
      if (saveTick) {
        intervalId += 0xf;
      }
      if (milestones || firedMilestones) {
        intervalId += 0xf;
      }
      if (
        milestone.ga4_mp_enabled == 1 ||
        milestone.ga4_mp_enabled === "1" ||
        milestone.ga4_mp_enabled === true
      ) {
        activeSec += 10;
        const pagePath =
          milestone.ga4_measurement_id && milestone.ga4_api_secret;
        if (pagePath) {
          intervalId += 10;
        }
      }
      if (
        milestone.meta_capi_enabled == 1 ||
        milestone.meta_capi_enabled === "1" ||
        milestone.meta_capi_enabled === true
      ) {
        activeSec += 10;
        const scrollHeight =
          milestone.meta_access_token && milestone.meta_pixel_id;
        if (scrollHeight) {
          intervalId += 10;
        }
      }
      if (
        milestone.enable_ecommerce_tracking == 1 ||
        milestone.enable_ecommerce_tracking === "1" ||
        milestone.enable_ecommerce_tracking === true
      ) {
        activeSec += 10;
        const viewportH = firedSet.some(
          (scrollPct) => scrollPct.category === "ecommerce",
        );
        if (viewportH) {
          intervalId += 10;
        }
      }
      if (
        milestone.enable_form_tracking == 1 ||
        milestone.enable_form_tracking === "1" ||
        milestone.enable_form_tracking === true
      ) {
        activeSec += 10;
        const threshold = firedSet.some(
          (tolerance) => tolerance.category === "forms",
        );
        if (threshold) {
          intervalId += 10;
        }
      }
      if (
        milestone.enable_video_tracking == 1 ||
        milestone.enable_video_tracking === "1" ||
        milestone.enable_video_tracking === true
      ) {
        activeSec += 10;
        const evt = firedSet.some(
          (item) => item.category === "video",
        );
        if (evt) {
          intervalId += 10;
        }
      }
      if (
        milestone.export_gtm_enabled == 1 ||
        milestone.export_gtm_enabled === "1" ||
        milestone.export_gtm_enabled === true
      ) {
        activeSec += 0x5;
        const key = milestone.gtm_last_export_date || false;
        if (key) {
          intervalId += 0x5;
        }
      }
      if (
        milestone.consent_mode_enabled == 1 ||
        milestone.consent_mode_enabled === "1" ||
        milestone.consent_mode_enabled === true
      ) {
        activeSec += 0x5;
        const err =
          milestone.consent_cmp && milestone.consent_cmp !== "none";
        if (err) {
          intervalId += 0x5;
        }
      }
      const idx =
        timerId.meta_pixel ||
        timerId.tiktok_pixel ||
        timerId.google_ads ||
        timerId.pinterest_pixel ||
        timerId.linkedin_pixel;
      if (idx) {
        activeSec += 0x5;
        const len =
          milestone.meta_pixel_id ||
          milestone.tiktok_pixel_id ||
          milestone.google_ads_id ||
          milestone.pinterest_tag_id ||
          milestone.linkedin_partner_id;
        if (len) {
          intervalId += 0x5;
        }
      }
      if (timerId.session_manager) {
        activeSec += 0x5;
        const mode =
          milestone.session_timeout_minutes &&
          milestone.session_timeout_minutes > 0;
        if (mode) {
          intervalId += 0x5;
        }
      }
      return Math.round((intervalId / activeSec) * 100);
    }
  }
  class typeVal {
    constructor(nameVal) {
      this.container = document.getElementById(nameVal);
      this.data = null;
      this.timelineRefreshInterval = null;
    }
    ["render"](opts) {
      if (!this.container) {
        return;
      }
      this.data = opts;
      this.container.innerHTML =
        "\n        " +
        this._renderStats() +
        "\n        " +
        this._renderQuickActions() +
        "\n        " +
        this._renderConnectedPlatforms() +
        "\n        " +
        this._renderSessionInfo() +
        "\n        " +
        this._renderSessionSummaries() +
        "\n        " +
        this._renderGTMExportStatus() +
        "\n        " +
        this._renderHealth() +
        '\n        <div class="adt-dash-grid">\n          ' +
        this._renderCategoryChart() +
        "\n        </div>\n        " +
        this._renderFeatureStatus() +
        "\n        " +
        this._renderEventList() +
        "\n      ";
      this._bindEvents();
    }
    ["_renderStats"]() {
      const ref = this.data.metrics;
      return (
        '\n\t<div class="adt-stats-grid">\n\t  <div class="adt-stat-card adt-gradient-purple">\n\t    <div class="adt-stat-label">Active Events</div>\n\t    <div class="adt-stat-value">' +
        ref.totalEvents +
        '</div>\n\t    <div class="adt-stat-sublabel">Tracking now</div>\n\t  </div>\n\t  <div class="adt-stat-card adt-gradient-blue">\n\t    <div class="adt-stat-label">Engagement</div>\n\t    <div class="adt-stat-value">' +
        ref.engagementEvents +
        '</div>\n\t    <div class="adt-stat-sublabel">User behavior events</div>\n\t  </div>\n\t  <div class="adt-stat-card adt-gradient-green">\n\t    <div class="adt-stat-label">E-commerce</div>\n\t    <div class="adt-stat-value">' +
        ref.ecommerceEvents +
        '</div>\n\t    <div class="adt-stat-sublabel">Conversion events</div>\n\t  </div>\n\t  <div class="adt-stat-card ' +
        this._getCoverageClass(ref.coverageScore) +
        '">\n\t    <div class="adt-stat-label">Setup Score</div>\n\t    <div class="adt-stat-value">' +
        ref.coverageScore +
        '%</div>\n\t    <div class="adt-stat-sublabel">' +
        this._getCoverageLabel(ref.coverageScore) +
        '</div>\n\t  </div>\n\t  <div class="adt-stat-card ' +
        (adtDashboardData.is_ip_excluded
          ? "adt-gradient-red"
          : "adt-gradient-green") +
        '">\n\t    <div class="adt-stat-label">IP Status</div>\n\t    <div class="adt-stat-value">' +
        (adtDashboardData.is_ip_excluded ? "EXCLUDED" : "ACTIVE") +
        '</div>\n\t    <div class="adt-stat-sublabel">Current IP: ' +
        (adtDashboardData.current_ip || "Unknown") +
        "</div>\n\t  </div>\n\t</div>"
      );
    }
    ["_renderSessionInfo"]() {
      const val = this.data.session;
      return (
        '\n<div class="adt-session-info">\n  <h3>Session Configuration</h3>\n  <div class="adt-session-grid">\n    <div class="adt-session-item">\n      <div class="adt-session-label">Session Timeout</div>\n      <div class="adt-session-value">' +
        (val.timeout_minutes || 0x1e) +
        ' minutes</div>\n    </div>\n    <div class="adt-session-item">\n      <div class="adt-session-label">Ping Interval</div>\n      <div class="adt-session-value">' +
        (val.ping_interval || 0x1e) +
        ' seconds</div>\n    </div>\n    <div class="adt-session-item">\n      <div class="adt-session-label">Engagement Milestones</div>\n      <div class="adt-session-value">' +
        (val.engagement_milestones || []).join("s, ") +
        's</div>\n    </div>\n    <div class="adt-session-item">\n      <div class="adt-session-label">Cross-Page Tracking</div>\n      <div class="adt-session-value">' +
        (val.tracks_cross_page ? "✓ Enabled" : "✗ Disabled") +
        "</div>\n    </div>\n  </div>\n</div>"
      );
    }
    ["_renderQuickActions"]() {
      const obj = this.data.settings || {};
      const fn =
        obj.ga4_mp_enabled == 1 ||
        obj.ga4_mp_enabled === "1" ||
        obj.ga4_mp_enabled === true;
      const arg =
        obj.export_gtm_enabled == 1 ||
        obj.export_gtm_enabled === "1" ||
        obj.export_gtm_enabled === true;
      return (
        '\n<div class="adt-quick-actions">\n  <h3>Quick Actions</h3>\n  <div class="adt-action-grid">\n    <a href="admin.php?page=adt-settings" class="adt-action-card">\n      <span class="adt-action-icon">⚙️</span>\n      <div class="adt-action-content">\n        <div class="adt-action-title">Plugin Settings</div>\n        <div class="adt-action-desc">Configure tracking features</div>\n      </div>\n    </a>\n    \n    ' +
        (fn
          ? '\n    <a href="admin.php?page=adt-setup-wizard" class="adt-action-card">\n      <span class="adt-action-icon">🚀</span>\n      <div class="adt-action-content">\n        <div class="adt-action-title">GA4 Setup Wizard</div>\n        <div class="adt-action-desc">Configure server-side tracking</div>\n      </div>\n    </a>'
          : "") +
        "\n    \n    " +
        (arg
          ? '\n    <a href="admin.php?page=adt-settings&tab=adt_gtm_export" class="adt-action-card">\n      <span class="adt-action-icon">📦</span>\n      <div class="adt-action-content">\n        <div class="adt-action-title">GTM Export</div>\n        <div class="adt-action-desc">Download container configuration</div>\n      </div>\n    </a>'
          : "") +
        '\n    \n    <a href="admin.php?page=adt-settings&tab=adt_general" class="adt-action-card">\n      <span class="adt-action-icon">🔍</span>\n      <div class="adt-action-content">\n        <div class="adt-action-title">Debug Tools</div>\n        <div class="adt-action-desc">Test & troubleshoot</div>\n      </div>\n    </a>\n  </div>\n</div>'
      );
    }
    ["_renderConnectedPlatforms"]() {
      const tmp = this.data.settings || {};
      const node = [
        {
          name: "Google Tag Manager",
          enabled:
            tmp.export_gtm_enabled == 1 ||
            tmp.export_gtm_enabled === "1" ||
            tmp.export_gtm_enabled === true,
          configured: tmp.gtm_container_id,
          icon: "🏷️",
          details: tmp.gtm_container_id
            ? "Container: " + tmp.gtm_container_id
            : "Not configured",
          settingsTab: "adt_integrations#gtm_integration_header",
        },
        {
          name: "GA4 Measurement Protocol",
          enabled:
            tmp.ga4_mp_enabled == 1 ||
            tmp.ga4_mp_enabled === "1" ||
            tmp.ga4_mp_enabled === true,
          configured: tmp.ga4_measurement_id && tmp.ga4_api_secret,
          icon: "📊",
          details: tmp.ga4_measurement_id
            ? "ID: " + tmp.ga4_measurement_id
            : "Not configured",
          settingsTab: "adt_server_side_tracking#ga4_mp_section_header",
        },
        {
          name: "Meta Conversions API",
          enabled:
            tmp.meta_capi_enabled == 1 ||
            tmp.meta_capi_enabled === "1" ||
            tmp.meta_capi_enabled === true,
          configured:
            tmp.meta_pixel_id && tmp.meta_capi_access_token,
          icon: "🔵",
          details:
            tmp.meta_pixel_id && tmp.meta_capi_access_token
              ? "Pixel: " + tmp.meta_pixel_id
              : "Not configured",
          settingsTab: "adt_server_side_tracking#meta_capi_header",
        },
        {
          name: "Meta Pixel (Client-Side)",
          enabled:
            tmp.meta_pixel_enabled == 1 ||
            tmp.meta_pixel_enabled === "1" ||
            tmp.meta_pixel_enabled === true,
          configured: tmp.meta_pixel_id,
          icon: "👁️",
          details: tmp.meta_pixel_id
            ? "Pixel: " + tmp.meta_pixel_id
            : "Not configured",
          settingsTab: "adt_pixel_tracking",
        },
        {
          name: "Consent Management",
          enabled:
            tmp.delay_until_consent == 1 ||
            tmp.delay_until_consent === "1" ||
            tmp.delay_until_consent === true,
          configured:
            tmp.delay_until_consent && tmp.consent_platform,
          icon: "🔒",
          details: tmp.consent_platform
            ? "Platform: " + tmp.consent_platform
            : tmp.delay_until_consent
              ? "Enabled (auto-detect)"
              : "Not configured",
          settingsTab: "adt_advanced#consent_management_header",
        },
      ];
      const list = node.filter((entry) => entry.enabled);
      return (
        '\n<div class="adt-connected-platforms">\n  <h3>Connected Platforms</h3>\n  ' +
        (list.length === 0
          ? '\n    <div class="adt-empty-state">\n      <span class="adt-empty-icon">🔌</span>\n      <p>No platforms connected yet</p>\n      <a href="admin.php?page=adt-settings" class="button button-primary">Connect Platforms</a>\n    </div>\n  '
          : '\n    <div class="adt-platform-grid">\n      ' +
            list
              .map(
                (state) =>
                  '\n        <div class="adt-platform-card ' +
                  (state.configured ? "configured" : "unconfigured") +
                  '">\n          <div class="adt-platform-header">\n            <span class="adt-platform-icon">' +
                  state.icon +
                  '</span>\n            <div class="adt-platform-info">\n              <div class="adt-platform-name">' +
                  state.name +
                  '</div>\n              <div class="adt-platform-status ' +
                  (state.configured ? "active" : "pending") +
                  '">\n                ' +
                  (state.configured
                    ? "✓ Configured"
                    : "⚠️ Setup Required") +
                  '\n              </div>\n            </div>\n          </div>\n          <div class="adt-platform-details">' +
                  state.details +
                  '</div>\n          <a href="admin.php?page=adt-settings&tab=' +
                  state.settingsTab +
                  '" class="adt-platform-link">\n            Manage Settings →\n          </a>\n        </div>\n      ',
              )
              .join("") +
            "\n    </div>\n  ") +
        "\n</div>"
      );
    }
    ["_renderSessionSummaries"]() {
      const ctx = this.data.settings || {};
      const data = this.data.session || {};
      const row = [];
      if (
        ctx.include_session_summary !== "0" &&
        ctx.include_session_summary !== 0
      ) {
        row.push({
          event: "session_summary_on_exit",
          trigger: "Page exit, tab close, or navigation",
          metrics: [
            "Active time",
            "Time on page",
            "Scroll depth",
            "Engagement milestones",
          ],
          frequency: "Once per session exit",
        });
      }
      if (ctx.include_session_engagement_milestone) {
        const col = data.engagement_milestones || [
          0x1e, 0x3c, 0x78, 0x12c,
        ];
        row.push({
          event: "session_engagement_milestone",
          trigger: "At " + col.join("s, ") + "s of engagement",
          metrics: [
            "Current active time",
            "Total time on page",
            "Pages viewed",
          ],
          frequency: col.length + " times per session",
        });
      }
      return (
        '\n<div class="adt-session-summaries">\n  <h3>Session Summary Events</h3>\n  ' +
        (row.length === 0
          ? '\n    <div class="adt-empty-state">\n      <span class="adt-empty-icon">📋</span>\n      <p>No session summaries enabled</p>\n      <a href="admin.php?page=adt-settings&tab=adt_advanced" class="button">Enable Session Tracking</a>\n    </div>\n  '
          : '\n    <div class="adt-summary-list">\n      ' +
            row
              .map(
                (mapVal) =>
                  '\n        <div class="adt-summary-card">\n          <div class="adt-summary-header">\n            <span class="adt-summary-badge">Event</span>\n            <code class="adt-summary-event">' +
                  mapVal.event +
                  '</code>\n          </div>\n          <div class="adt-summary-row">\n            <span class="adt-summary-label">Trigger:</span>\n            <span class="adt-summary-value">' +
                  mapVal.trigger +
                  '</span>\n          </div>\n          <div class="adt-summary-row">\n            <span class="adt-summary-label">Frequency:</span>\n            <span class="adt-summary-value">' +
                  mapVal.frequency +
                  '</span>\n          </div>\n          <div class="adt-summary-metrics">\n            <span class="adt-summary-label">Metrics Included:</span>\n            <div class="adt-metric-tags">\n              ' +
                  mapVal.metrics
                    .map(
                      (setVal) =>
                        '<span class="adt-metric-tag">' + setVal + "</span>",
                    )
                    .join("") +
                  "\n            </div>\n          </div>\n        </div>\n      ",
              )
              .join("") +
            "\n    </div>\n  ") +
        "\n</div>"
      );
    }
    ["_renderGTMExportStatus"]() {
      const buf = this.data.settings || {};
      const raw =
        buf.export_gtm_enabled == 1 ||
        buf.export_gtm_enabled === "1" ||
        buf.export_gtm_enabled === true;
      if (!raw) {
        return '\n<div class="adt-gtm-export-status disabled">\n  <h3>GTM Container Export</h3>\n  <div class="adt-empty-state">\n    <span class="adt-empty-icon">📦</span>\n    <p>GTM Export is not enabled</p>\n    <a href="admin.php?page=adt-settings&tab=adt_integrations#gtm_integration_header" class="button button-primary">Enable GTM Export</a>\n  </div>\n</div>';
      }
      const parsed = buf.gtm_container_id || "Not configured";
      const text = buf.gtm_last_export_date || "Never";
      const html = this.data.events.length;
      return (
        '\n<div class="adt-gtm-export-status">\n  <h3>GTM Container Export</h3>\n  <div class="adt-gtm-grid">\n    <div class="adt-gtm-info-card">\n      <div class="adt-gtm-stat">\n        <span class="adt-gtm-label">Container ID</span>\n        <code class="adt-gtm-value">' +
        parsed +
        '</code>\n      </div>\n      <div class="adt-gtm-stat">\n        <span class="adt-gtm-label">Events to Export</span>\n        <span class="adt-gtm-value">' +
        html +
        ' events</span>\n      </div>\n      <div class="adt-gtm-stat">\n        <span class="adt-gtm-label">Last Export</span>\n        <span class="adt-gtm-value">' +
        text +
        '</span>\n      </div>\n    </div>\n    <div class="adt-gtm-actions-card">\n      <p class="adt-gtm-desc">Export a complete GTM container with tags, triggers, and variables for all your configured events.</p>\n      <a href="admin.php?page=adt-settings&tab=adt_gtm_export" class="button button-primary button-large">\n        <span class="dashicons dashicons-download" style="margin-top:3px;"></span>\n        Export GTM Container\n      </a>\n    </div>\n  </div>\n</div>'
      );
    }
    ["_getCoverageClass"](cmpName) {
      return cmpName >= 0x50
        ? "adt-gradient-green"
        : cmpName >= 50
          ? "adt-gradient-yellow"
          : "adt-gradient-red";
    }
    ["_getCoverageLabel"](handler) {
      return handler >= 0x50
        ? "Excellent"
        : handler >= 50
          ? "Good"
          : "Basic";
    }
    ["_renderHealth"]() {
      const callback = this.data.metrics;
      const response = this.data.features;
      const request = this.data.settings;
      const fields = [];
      if (callback.totalEvents < 0x5) {
        fields.push({
          icon: "⚠️",
          title: "Limited Event Tracking",
          desc: "Enable more events to get better insights",
          color: "#ff9800",
        });
      }
      if (
        request.ga4_mp_enabled &&
        (!request.ga4_measurement_id || !request.ga4_api_secret)
      ) {
        const formId = [];
        if (!request.ga4_measurement_id) {
          formId.push("Measurement ID");
        }
        if (!request.ga4_api_secret) {
          formId.push("API Secret");
        }
        fields.push({
          icon: "🟡",
          title: "GA4 Measurement Protocol Incomplete",
          desc:
            "Missing: " +
            formId.join(", ") +
            ". Complete setup to enable server-side tracking.",
          color: "#ff9800",
          action: "Complete GA4 Setup",
          actionUrl: "admin.php?page=adt-settings&tab=adt_server_side_tracking",
        });
      }
      if (!response.ga4_mp && !response.meta_pixel) {
        fields.push({
          icon: "🔴",
          title: "No Destinations Configured",
          desc: "Enable GA4 MP or Meta Pixel to send data",
          color: "#f44336",
          action: "Configure Server-Side Tracking",
          actionUrl: "admin.php?page=adt-settings&tab=adt_server_side_tracking",
        });
      }
      if (fields.length === 0) {
        return '\n<div class="adt-health-success">\n  <span class="adt-health-icon">✅</span>\n  <div>\n    <div class="adt-health-title">Configuration: Excellent</div>\n    <div class="adt-health-desc">Your tracking is properly configured and ready to collect data.</div>\n  </div>\n</div>';
      }
      return (
        '\n<div class="adt-health-warnings">\n  <h3>Recommendations</h3>\n  ' +
        fields
          .map(
            (fieldId) =>
              '\n    <div class="adt-health-warning" style="border-left-color:' +
              fieldId.color +
              '">\n      <span class="adt-health-icon">' +
              fieldId.icon +
              '</span>\n      <div style="flex: 1;">\n        <div class="adt-health-title">' +
              fieldId.title +
              '</div>\n        <div class="adt-health-desc">' +
              fieldId.desc +
              "</div>\n        " +
              (fieldId.action
                ? '<a href="' +
                  fieldId.actionUrl +
                  '" class="button button-small" style="margin-top: 8px;">' +
                  fieldId.action +
                  "</a>"
                : "") +
              "\n      </div>\n    </div>\n  ",
          )
          .join("") +
        "\n</div>"
      );
    }
    ["_renderCategoryChart"]() {
      const cartAdds = Object.entries(this.data.metrics.byCategory)
        .filter(([, cartRemoves]) => cartRemoves > 0)
        .sort((sessionInfo, hookData) => hookData[1] - sessionInfo[1]);
      const pixelEvt = cartAdds.reduce(
        (overlayEvt, [, filterEvt]) => overlayEvt + filterEvt,
        0,
      );
      return (
        '\n<div class="adt-chart-card">\n  <h3>Events by Category</h3>\n  <div class="adt-bars">\n    ' +
        cartAdds
          .map(([searchParams, clickId]) => {
            const utmData = ((clickId / pixelEvt) * 100).toFixed(1);
            const cookieVal = adtData[searchParams] || "#757575";
            return (
              '\n        <div class="adt-bar-row">\n          <div class="adt-bar-label">\n            <span class="adt-bar-name">' +
              searchParams +
              '</span>\n            <span class="adt-bar-count">' +
              clickId +
              " events (" +
              utmData +
              '%)</span>\n          </div>\n          <div class="adt-bar-track">\n            <div class="adt-bar-fill" style="width:' +
              utmData +
              "%;background:" +
              cookieVal +
              '"></div>\n          </div>\n        </div>\n      '
            );
          })
          .join("") +
        "\n  </div>\n</div>"
      );
    }
    ["_getCategoryForEvent"](cookieKey) {
      const consentRaw = {
        page_view: "session",
        session_start: "session",
        user_engagement: "session",
        scroll: "engagement",
        scroll_depth: "engagement",
        scroll_25: "engagement",
        scroll_50: "engagement",
        scroll_75: "engagement",
        scroll_100: "engagement",
        active_time: "engagement",
        time_on_page: "engagement",
        click: "engagement",
        outbound_click: "engagement",
        file_download: "engagement",
        form_start: "forms",
        form_submit: "forms",
        form_abandon: "forms",
        view_item: "ecommerce",
        add_to_cart: "ecommerce",
        remove_from_cart: "ecommerce",
        view_cart: "ecommerce",
        begin_checkout: "ecommerce",
        purchase: "ecommerce",
        video_start: "video",
        video_progress: "video",
        video_complete: "video",
        consent_granted: "consent",
        consent_change: "consent",
      };
      return consentRaw[cookieKey] || "other";
    }
    ["_renderFeatureStatus"]() {
      const consentObj = this.data.features;
      const prevConsent = [
        {
          name: "GA4 Measurement Protocol",
          enabled: consentObj.ga4_mp,
          key: "ga4_mp",
        },
        {
          name: "Meta Pixel",
          enabled: consentObj.meta_pixel,
          key: "meta_pixel",
        },
        {
          name: "TikTok Pixel",
          enabled: consentObj.tiktok_pixel,
          key: "tiktok_pixel",
        },
        {
          name: "Google Ads",
          enabled: consentObj.google_ads,
          key: "google_ads",
        },
        {
          name: "Pinterest Pixel",
          enabled: consentObj.pinterest_pixel,
          key: "pinterest_pixel",
        },
        {
          name: "LinkedIn Pixel",
          enabled: consentObj.linkedin_pixel,
          key: "linkedin_pixel",
        },
      ];
      const now = [
        {
          name: "Consent Mode",
          enabled: consentObj.consent_mode,
          key: "consent_mode",
        },
        {
          name: "Debug Mode",
          enabled: consentObj.debug_mode,
          key: "debug_mode",
        },
        {
          name: "Debug Overlay",
          enabled: consentObj.debug_overlay,
          key: "debug_overlay",
        },
        {
          name: "Session Manager",
          enabled: consentObj.session_manager,
          key: "session_manager",
        },
      ];
      const last = [
        {
          name: "Ecommerce Tracking",
          enabled: consentObj.ecommerce_base,
          key: "ecommerce_base",
          important: true,
        },
        {
          name: "↳ View Item",
          enabled: consentObj.ecommerce_view_item,
          key: "ecommerce_view_item",
          indent: true,
        },
        {
          name: "↳ Add to Cart",
          enabled: consentObj.ecommerce_add_to_cart,
          key: "ecommerce_add_to_cart",
          indent: true,
        },
        {
          name: "↳ View Cart",
          enabled: consentObj.ecommerce_view_cart,
          key: "ecommerce_view_cart",
          indent: true,
        },
        {
          name: "↳ Checkout",
          enabled: consentObj.ecommerce_checkout,
          key: "ecommerce_checkout",
          indent: true,
        },
        {
          name: "↳ Purchase",
          enabled: consentObj.ecommerce_purchase,
          key: "ecommerce_purchase",
          indent: true,
        },
        {
          name: "↳ Refund",
          enabled: consentObj.ecommerce_refund,
          key: "ecommerce_refund",
          indent: true,
        },
      ];
      return (
        '\n<div class="adt-chart-card adt-feature-status-card">\n  <h3>Feature Status</h3>\n  \n  <div class="adt-feature-section">\n    <h4 class="adt-feature-section-title">Destinations</h4>\n    <div class="adt-feature-list">\n      ' +
        prevConsent
          .map((diff) => this._renderFeatureItem(diff))
          .join("") +
        '\n    </div>\n  </div>\n  \n  <div class="adt-feature-section">\n    <h4 class="adt-feature-section-title">E-commerce</h4>\n    <div class="adt-feature-list">\n      ' +
        last
          .map((found) => this._renderFeatureItem(found))
          .join("") +
        '\n    </div>\n  </div>\n  \n  <div class="adt-feature-section">\n    <h4 class="adt-feature-section-title">Core Features</h4>\n    <div class="adt-feature-list">\n      ' +
        now
          .map((detected) => this._renderFeatureItem(detected))
          .join("") +
        "\n    </div>\n  </div>\n</div>"
      );
    }
    ["_renderFeatureItem"](retryCount) {
      const maxRetries = retryCount.indent ? "indent" : "";
      const delayMs = retryCount.important ? "important" : "";
      return (
        '\n        <div class="adt-feature-item ' +
        (retryCount.enabled ? "enabled" : "disabled") +
        " " +
        maxRetries +
        " " +
        delayMs +
        '">\n          <span class="adt-feature-status">' +
        (retryCount.enabled ? "✓" : "○") +
        '</span>\n          <span class="adt-feature-name">' +
        retryCount.name +
        '</span>\n          <span class="adt-feature-badge ' +
        (retryCount.enabled ? "active" : "inactive") +
        '">\n            ' +
        (retryCount.enabled ? "Active" : "Inactive") +
        "\n          </span>\n        </div>\n      "
      );
    }
    ["_renderEventList"]() {
      const timeoutMs = this.data.events;
      return (
        '\n<div class="adt-chart-card">\n  <div class="adt-explorer-header">\n    <h3>Active Events (' +
        timeoutMs.length +
        ')</h3>\n    <button id="adt-export-csv" class="adt-export-btn">\n      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">\n        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>\n      </svg>\n      Export CSV\n    </button>\n  </div>\n  \n  <div class="adt-explorer-controls">\n    <input type="text" id="adt-search" class="adt-search-input" placeholder="Search events..." />\n    <div class="adt-filter-buttons">\n      <button class="adt-filter-btn active" data-category="all">all (' +
        timeoutMs.length +
        ")</button>\n      " +
        Object.keys(adtData)
          .map((hasConsent) => {
            const blocked = timeoutMs.filter(
              (wasBlocked) => wasBlocked.category === hasConsent,
            ).length;
            if (blocked === 0) {
              return "";
            }
            return (
              '\n          <button class="adt-filter-btn" data-category="' +
              hasConsent +
              '">\n            ' +
              hasConsent +
              " (" +
              blocked +
              ")\n          </button>\n        "
            );
          })
          .join("") +
        '\n    </div>\n  </div>\n  \n  <div id="adt-results-count" class="adt-results-count">Showing ' +
        timeoutMs.length +
        ' events</div>\n  \n  <div class="adt-event-cards">\n    ' +
        timeoutMs
          .map((analyticsOk) => {
            const marketingOk = adtData[analyticsOk.category];
            return (
              '\n        <div class="adt-event-card" data-event="' +
              analyticsOk.name +
              '" data-category="' +
              analyticsOk.category +
              '">\n          <div class="adt-card-header">\n            <span class="adt-card-name">' +
              (analyticsOk.label || analyticsOk.name) +
              '</span>\n            <span class="adt-card-badge" style="background:' +
              marketingOk +
              '">' +
              analyticsOk.category +
              "</span>\n          </div>\n          " +
              (analyticsOk.milestones && analyticsOk.milestones.length > 0
                ? '\n            <div class="adt-card-milestones">\n              <strong>Milestones:</strong> ' +
                  analyticsOk.milestones.join(", ") +
                  "\n            </div>\n          "
                : "") +
              "\n        </div>\n      "
            );
          })
          .join("") +
        "\n  </div>\n</div>"
      );
    }
    ["_bindEvents"]() {
      const extra = document.getElementById("adt-search");
      const source = document.querySelectorAll(".adt-filter-btn");
      const granted = document.getElementById("adt-export-csv");
      let previous = "all";
      const storageErr = () => {
        const localA = extra?.["value"]["toLowerCase"]() || "";
        const localB = document.querySelectorAll(".adt-event-card");
        let localC = 0;
        localB.forEach((localD) => {
          const localE = localD.dataset.event;
          const localF = localD.dataset.category;
          const localG = !localA || localE.includes(localA);
          const localH = previous === "all" || localF === previous;
          if (localG && localH) {
            localD.style.display = "";
            localC++;
          } else {
            localD.style.display = "none";
          }
        });
        const localI = document.getElementById("adt-results-count");
        if (localI) {
          localI.textContent =
            "Showing " + localC + " of " + localB.length + " events";
        }
      };
      if (extra) {
        extra.addEventListener("input", storageErr);
      }
      source.forEach((localJ) => {
        localJ.addEventListener("click", () => {
          previous = localJ.dataset.category;
          source.forEach((tabBtn) =>
            tabBtn.classList.remove("active"),
          );
          localJ.classList.add("active");
          storageErr();
        });
      });
      if (granted) {
        granted.addEventListener("click", () => this._exportCSV());
      }
    }
    ["_exportCSV"]() {
      const tabBtn = [["Event Name", "Category", "Label", "Milestones"]];
      this.data.events.forEach((csvRows) => {
        tabBtn.push([
          csvRows.name,
          csvRows.category,
          csvRows.label || csvRows.name,
          (csvRows.milestones || []).join("; "),
        ]);
      });
      const evtRow = tabBtn
        .map((csvLine) =>
          csvLine.map((csvCell) => '"' + csvCell + '"').join(","),
        )
        .join("\n");
      const csvBlob = new Blob([evtRow], {
        type: "text/csv",
      });
      const blobUrl = URL.createObjectURL(csvBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = blobUrl;
      downloadLink.download =
        "adt-events-" + new Date().toISOString().slice(0, 10) + ".csv";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(blobUrl);
    }
    ["destroy"]() {
      if (this.timelineRefreshInterval) {
        clearInterval(this.timelineRefreshInterval);
      }
    }
  }
  window.ADTDashboard = {
    renderer: null,
    init: function () {
      if (!window.adtDashboardData) {
        console.warn("ADT Dashboard: No dashboard data available");
        return;
      }
      const tabBtn = new config(window.adtDashboardData);
      const csvRows = tabBtn.process();
      this.renderer = new typeVal("adt-analytics-dashboard");
      this.renderer.render(csvRows);
    },
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      if (window.adtDashboardData) {
        window.ADTDashboard.init();
      }
    });
  } else {
    if (window.adtDashboardData) {
      window.ADTDashboard.init();
    }
  }
})();
