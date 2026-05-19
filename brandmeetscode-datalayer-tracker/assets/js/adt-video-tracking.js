/*!
 * DataLayer Tracker - Video Tracking
 *
 * Comprehensive video tracking for HTML5, YouTube, Vimeo, Wistia, and more
 *
 * @preserve
 * @package    DataLayer_Tracker
 * @copyright  Copyright (c) 2024-2026 Brand Meets Code
 * @license    GPL-2.0+
 * @version    1.0.1
 * @since      1.0.0
 *
 * CHANGELOG v1.0.1:
 * - Added session manager integration
 */
(function () {
  "use strict";

  if (typeof window === "undefined") {
    return;
  }
  const videoLog = function (...args) {
    window.adtDebug("Video:", ...args);
  };
  const videoProgressEnabled =
    window.ADTData?.include?.content?.videoProgress;
  if (!videoProgressEnabled) {
    videoLog("Video tracking disabled, but monitoring for session summary");
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => initVideoSessionHooks());
    } else {
      initVideoSessionHooks();
    }
    return;
  }
  videoLog("Module initializing...");
  window._adtVideoFlags = window._adtVideoFlags || {};
  const progressMilestones = [0, 25, 50, 75, 90, 100];
  window._adtVideoMetrics = window._adtVideoMetrics || {
    videosStarted: 0,
    videosCompleted: 0,
    totalWatchTime: 0,
    highestCompletion: 0,
    activeVideo: null,
    sessionStartTime: Date.now(),
  };
  if (window._adtVideoMetrics.videosStarted === 0) {
    try {
      const storedMetricsRaw = sessionStorage.getItem("_adtVideoMetrics");
      if (storedMetricsRaw) {
        const restored = JSON.parse(storedMetricsRaw);
        window._adtVideoMetrics = {
          ...window._adtVideoMetrics,
          ...restored,
          activeVideo: null,
        };
        videoLog(
          "Restored video metrics from sessionStorage:",
          window._adtVideoMetrics,
        );
      }
    } catch (restoreErr) {
      videoLog("Could not load persisted video metrics:", result);
    }
  }
  const value = window._adtVideoMetrics;
  function markVideoOnce(videoId, milestone) {
    const flagKey = videoId + "_" + milestone;
    if (window._adtVideoFlags[flagKey]) {
      return false;
    }
    window._adtVideoFlags[flagKey] = true;
    return true;
  }
  function trackVideoProgress(eventType, videoData, milestonePercent = null) {
    if (window.ADTData?.["shouldTrackPage"] === false) {
      if (window.ADTData?.["debug"]) {
        console.log("[ADT Video] Event blocked - page excluded by regex");
      }
      return;
    }
    const payload = {
      event: "video_" + eventType,
      video_title: videoData.title || "Untitled Video",
      video_url: videoData.url || "",
      video_provider: videoData.provider || "unknown",
      video_duration: Math.round(videoData.duration || 0),
      timestamp: new Date().toISOString(),
    };
    if (milestonePercent !== null && milestonePercent !== undefined) {
      payload.video_percent = milestonePercent;
      payload.event = "video_progress";
    }
    if (
      window._adtSessionInitialized &&
      window.ADTSession &&
      typeof window.ADTSession.id === "function"
    ) {
      try {
        payload.session_id = window.ADTSession.id();
        payload.session_number = window.ADTSession.number();
        payload.tab_id = window.ADTSession.tabId();
      } catch (sessionErr) {
        videoLog("Error adding session context:", sessionErr);
      }
    }
    if (typeof window.adtPushDeduped === "function") {
      const dedupeKey =
        "video_" + eventType + "_" + videoData.id + "_" + (milestonePercent ?? "");
      window.adtPushDeduped(payload, dedupeKey, 500);
    } else {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(payload);
    }
    updateVideoMetrics(eventType, videoData, milestonePercent);
    videoLog(eventType + " event:", payload);
  }
  function updateVideoMetrics(eventType, videoData, milestonePercent) {
    if (window.ADTData?.["shouldTrackPage"] === false) {
      if (window.ADTData?.["debug"]) {
        console.log("[ADT ModuleName] Event blocked - page excluded by regex");
      }
      return;
    }
    if (!eventType || !videoData) {
      return;
    }
    try {
      switch (eventType) {
        case "start":
          value.videosStarted++;
          value.activeVideo = {
            id: videoData.id,
            title: videoData.title,
            provider: videoData.provider,
            startTime: Date.now(),
          };
          break;
        case "complete":
          value.videosCompleted++;
          value.activeVideo = null;
          break;
        case "progress":
          if (
            typeof milestonePercent === "number" &&
            milestonePercent > value.highestCompletion
          ) {
            value.highestCompletion = milestonePercent;
          }
          break;
      }
      try {
        sessionStorage.setItem(
          "_adtVideoMetrics",
          JSON.stringify({
            videosStarted: value.videosStarted,
            videosCompleted: value.videosCompleted,
            highestCompletion: value.highestCompletion,
            sessionStartTime: value.sessionStartTime,
          }),
        );
      } catch (tickCount) {
        videoLog(
          "Could not persist video metrics to sessionStorage:",
          tickCount,
        );
      }
    } catch (saveTick) {
      videoLog("Error updating video metrics:", saveTick);
    }
  }
  function isActive() {
    try {
      const lastTick = Math.round(
        (Date.now() - value.sessionStartTime) / 1000,
      );
      return {
        videos_started: Math.max(0, value.videosStarted),
        videos_completed: Math.max(0, value.videosCompleted),
        completion_rate:
          value.videosStarted > 0
            ? Math.round(
                (value.videosCompleted / value.videosStarted) * 100,
              )
            : 0,
        highest_completion: Math.max(
          0,
          Math.min(100, value.highestCompletion),
        ),
        has_active_video: !!(value.activeVideo && value.activeVideo.id),
        active_video_title: value.activeVideo?.["title"] || null,
        active_video_provider: value.activeVideo?.["provider"] || null,
        session_duration: Math.max(0, lastTick),
      };
    } catch (milestones) {
      videoLog("Error getting video metrics:", milestones);
      return {
        videos_started: 0,
        videos_completed: 0,
        completion_rate: 0,
        highest_completion: 0,
        has_active_video: false,
        active_video_title: null,
        active_video_provider: null,
        session_duration: 0,
      };
    }
  }
  function firedMilestones() {
    if (window.ADTData?.["shouldTrackPage"] === false) {
      if (window.ADTData?.["debug"]) {
        console.log("[ADT ModuleName] Event blocked - page excluded by regex");
      }
      return;
    }
    const pagePath = document.querySelectorAll("video");
    if (!pagePath.length) {
      return;
    }
    pagePath.forEach((scrollHeight, viewportH) => {
      if (scrollHeight.dataset.adtTracking) {
        return;
      }
      scrollHeight.dataset.adtTracking = "true";
      const scrollPct = {
        id: scrollHeight.id || "html5_video_" + viewportH,
        title:
          scrollHeight.title ||
          scrollHeight.getAttribute("data-title") ||
          "Video " + (viewportH + 1),
        url: scrollHeight.currentSrc || scrollHeight.src || window.location.href,
        provider: "html5",
        duration: 0,
      };
      let threshold = false;
      scrollHeight.addEventListener("play", () => {
        if (!threshold) {
          threshold = true;
          scrollPct.duration = scrollHeight.duration;
        }
        if (markVideoOnce(scrollPct.id, "start")) {
          trackVideoProgress("start", scrollPct);
        }
      });
      scrollHeight.addEventListener("timeupdate", () => {
        if (!scrollHeight.duration) {
          return;
        }
        const tolerance = Math.round(
          (scrollHeight.currentTime / scrollHeight.duration) * 100,
        );
        progressMilestones.forEach((evt) => {
          if (tolerance >= evt && markVideoOnce(scrollPct.id, evt)) {
            trackVideoProgress("progress", scrollPct, evt);
          }
        });
      });
      scrollHeight.addEventListener("ended", () => {
        trackVideoProgress("complete", scrollPct);
      });
      videoLog("Tracking HTML5 video:", scrollPct.id);
    });
  }
  function item() {
    if (window.ADTData?.["shouldTrackPage"] === false) {
      if (window.ADTData?.["debug"]) {
        console.log("[ADT ModuleName] Event blocked - page excluded by regex");
      }
      return;
    }
    if (window.ADTData?.["letGTMHandleYouTube"]) {
      return;
    }
    const key = document.querySelectorAll(
      'iframe[src*="youtube.com"], iframe[src*="youtu.be"], iframe[src*="youtube-nocookie.com"], iframe[data-src*="youtube.com"], iframe[data-src*="youtu.be"], iframe[data-src*="youtube-nocookie.com"]',
    );
    if (!key.length) {
      videoLog("No YouTube videos found");
      return;
    }
    videoLog("Found " + key.length + " YouTube videos");
    if (!window.YT || !window.YT.Player) {
      videoLog("Loading YouTube API...");
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const err = document.createElement("script");
        err.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(err);
      }
      window.onYouTubeIframeAPIReady = function () {
        videoLog("YouTube API ready");
        setTimeout(() => idx(), 100);
      };
    } else {
      videoLog("YouTube API already loaded");
      setTimeout(() => idx(), 100);
    }
    function idx() {
      if (window._adtYouTubeIntervals) {
        Object.keys(window._adtYouTubeIntervals).forEach((len) => {
          if (!document.getElementById(len)) {
            clearInterval(window._adtYouTubeIntervals[len]);
            delete window._adtYouTubeIntervals[len];
            videoLog("Cleaned up interval for removed video:", len);
          }
        });
      }
      const mode = document.querySelectorAll(
        'iframe[src*="youtube.com"], iframe[src*="youtu.be"], iframe[src*="youtube-nocookie.com"], iframe[data-src*="youtube.com"], iframe[data-src*="youtu.be"], iframe[data-src*="youtube-nocookie.com"]',
      );
      mode.forEach((typeVal, nameVal) => {
        if (typeVal.dataset.adtTracking === "true") {
          return;
        }
        let opts = typeVal.src || typeVal.dataset.src;
        if (!opts) {
          videoLog("Skipping iframe without src:", typeVal);
          return;
        }
        if (!typeVal.src && typeVal.dataset.src) {
          typeVal.src = typeVal.dataset.src;
          opts = typeVal.src;
        }
        if (!typeVal.id) {
          typeVal.id = "yt_player_" + Date.now() + "_" + nameVal;
        }
        if (!opts.includes("enablejsapi=1")) {
          videoLog(
            "Warning: enablejsapi not found, video may not track:",
            typeVal.id,
          );
        }
        typeVal.dataset.adtTracking = "true";
        const ref = typeVal.closest(".plyr") ? 1000 : 500;
        setTimeout(() => {
          try {
            let val;
            if (window.YT && window.YT.get) {
              val = window.YT.get(typeVal.id);
            }
            if (!val) {
              val = new YT.Player(typeVal.id, {
                events: {
                  onReady: function (obj) {
                    videoLog("YouTube player ready:", typeVal.id);
                  },
                  onStateChange: function (fn) {
                    arg(fn, typeVal.id);
                  },
                  onError: function (tmp) {
                    videoLog(
                      "YouTube player error:",
                      tmp.data,
                      typeVal.id,
                    );
                  },
                },
              });
              videoLog("Created YouTube player for:", typeVal.id);
            } else {
              videoLog("Using existing player for:", typeVal.id);
              val.addEventListener("onStateChange", function (node) {
                arg(node, typeVal.id);
              });
            }
          } catch (list) {
            videoLog(
              "Error creating YouTube player:",
              list,
              typeVal.id,
            );
            typeVal.dataset.adtTracking = "false";
          }
        }, ref);
      });
    }
    function arg(entry, state) {
      if (window.ADTData?.["shouldTrackPage"] === false) {
        if (window.ADTData?.["debug"]) {
          console.log(
            "[ADT ModuleName] Event blocked - page excluded by regex",
          );
        }
        return;
      }
      if (!entry || !entry.target) {
        videoLog("Invalid YouTube event:", entry);
        return;
      }
      let ctx = "YouTube Video";
      let data = "";
      let row = 0;
      try {
        const col = entry.target.getVideoData();
        ctx = col.title || ctx;
        data = entry.target.getVideoUrl() || "";
        row = entry.target.getDuration() || 0;
      } catch (mapVal) {
        videoLog("Error getting video data:", mapVal);
      }
      const setVal = {
        id: state,
        title: ctx,
        url: data,
        provider: "youtube",
        duration: row,
      };
      if (!window._adtYouTubeIntervals) {
        window._adtYouTubeIntervals = {};
      }
      if (entry.data === YT.PlayerState.PLAYING) {
        videoLog("YouTube playing:", setVal.title);
        const buf = state + "_started";
        if (!window._adtVideoFlags[buf]) {
          window._adtVideoFlags[buf] = true;
          trackVideoProgress("start", setVal);
        }
        if (window._adtYouTubeIntervals[state]) {
          clearInterval(window._adtYouTubeIntervals[state]);
        }
        window._adtYouTubeIntervals[state] = setInterval(() => {
          try {
            if (
              !entry.target ||
              entry.target.getPlayerState() !== YT.PlayerState.PLAYING
            ) {
              clearInterval(window._adtYouTubeIntervals[state]);
              delete window._adtYouTubeIntervals[state];
              return;
            }
            const raw = entry.target.getCurrentTime();
            const parsed = entry.target.getDuration();
            if (!parsed || parsed <= 0) {
              return;
            }
            const text = Math.round((raw / parsed) * 100);
            progressMilestones.forEach((html) => {
              if (
                text >= html &&
                markVideoOnce(setVal.id, html)
              ) {
                trackVideoProgress("progress", setVal, html);
              }
            });
          } catch (cmpName) {
            videoLog("Error in YouTube progress tracking:", cmpName);
            clearInterval(window._adtYouTubeIntervals[state]);
            delete window._adtYouTubeIntervals[state];
          }
        }, 1000);
      } else {
        if (entry.data === YT.PlayerState.PAUSED) {
          if (
            window._adtYouTubeIntervals &&
            window._adtYouTubeIntervals[state]
          ) {
            clearInterval(window._adtYouTubeIntervals[state]);
            delete window._adtYouTubeIntervals[state];
          }
        } else if (entry.data === YT.PlayerState.ENDED) {
          videoLog("YouTube ended:", setVal.title);
          trackVideoProgress("complete", setVal);
          if (
            window._adtYouTubeIntervals &&
            window._adtYouTubeIntervals[state]
          ) {
            clearInterval(window._adtYouTubeIntervals[state]);
            delete window._adtYouTubeIntervals[state];
          }
        }
      }
    }
    const handler = new MutationObserver(() => {
      const callback = document.querySelectorAll(
        'iframe[src*="youtube.com"], iframe[src*="youtu.be"], iframe[src*="youtube-nocookie.com"], iframe[data-src*="youtube.com"], iframe[data-src*="youtu.be"], iframe[data-src*="youtube-nocookie.com"]',
      );
      const response = Array.from(callback).filter(
        (request) => request.dataset.adtTracking !== "true",
      );
      if (response.length > 0) {
        videoLog("Found " + response.length + " new YouTube videos");
        if (window.YT && window.YT.Player) {
          idx();
        } else {
          idx();
        }
      }
    });
    handler.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
  function fields() {
    if (window.ADTData?.["shouldTrackPage"] === false) {
      if (window.ADTData?.["debug"]) {
        console.log("[ADT ModuleName] Event blocked - page excluded by regex");
      }
      return;
    }
    const formId = document.querySelectorAll(
      'iframe[src*="vimeo.com"], iframe[data-src*="vimeo.com"]',
    );
    if (!formId.length) {
      return;
    }
    videoLog("Found " + formId.length + " Vimeo videos");
    if (!window.Vimeo) {
      const fieldId = document.querySelector(
        'script[src*="player.vimeo.com/api/player.js"]',
      );
      if (!fieldId) {
        const cartAdds = document.createElement("script");
        cartAdds.src = "https://player.vimeo.com/api/player.js";
        cartAdds.onload = () => {
          videoLog("Vimeo API loaded");
          setTimeout(() => cartRemoves(), 100);
        };
        document.head.appendChild(cartAdds);
      }
    } else {
      cartRemoves();
    }
    function cartRemoves() {
      if (window.ADTData?.["shouldTrackPage"] === false) {
        if (window.ADTData?.["debug"]) {
          console.log(
            "[ADT ModuleName] Event blocked - page excluded by regex",
          );
        }
        return;
      }
      formId.forEach((sessionInfo, hookData) => {
        if (sessionInfo.dataset.adtTracking === "true") {
          return;
        }
        if (!sessionInfo.src && sessionInfo.dataset.src) {
          sessionInfo.src = sessionInfo.dataset.src;
        }
        if (!sessionInfo.src) {
          videoLog("Skipping Vimeo iframe without src");
          return;
        }
        sessionInfo.dataset.adtTracking = "true";
        try {
          const pixelEvt = new Vimeo.Player(sessionInfo);
          const overlayEvt = {
            id: sessionInfo.id || "vimeo_" + Date.now() + "_" + hookData,
            title: "Vimeo Video",
            url: sessionInfo.src,
            provider: "vimeo",
            duration: 0,
          };
          pixelEvt
            .getVideoTitle()
            .then((filterEvt) => {
              overlayEvt.title = filterEvt;
              videoLog("Vimeo video title:", filterEvt);
            })
            ["catch"]((searchParams) => {
              videoLog("Error getting Vimeo title:", searchParams);
            });
          pixelEvt
            .getDuration()
            .then((clickId) => {
              overlayEvt.duration = clickId;
            })
            ["catch"]((utmData) => {
              videoLog("Error getting Vimeo duration:", utmData);
            });
          let cookieVal = false;
          pixelEvt.on("play", () => {
            if (!cookieVal) {
              cookieVal = true;
              trackVideoProgress("start", overlayEvt);
              videoLog("Vimeo started:", "Vimeo Video");
            }
          });
          pixelEvt.on("timeupdate", (cookieKey) => {
            const consentRaw = Math.round(cookieKey.percent * 100);
            progressMilestones.forEach((consentObj) => {
              if (
                consentRaw >= consentObj &&
                markVideoOnce(overlayEvt.id, consentObj)
              ) {
                trackVideoProgress("progress", overlayEvt, consentObj);
              }
            });
          });
          pixelEvt.on("ended", () => {
            trackVideoProgress("complete", overlayEvt);
            videoLog("Vimeo completed:", "Vimeo Video");
          });
          videoLog("Tracking Vimeo video:", overlayEvt.id);
        } catch (prevConsent) {
          videoLog("Error initializing Vimeo player:", prevConsent);
          sessionInfo.dataset.adtTracking = "false";
        }
      });
    }
  }
  function now() {
    if (window.ADTData?.["shouldTrackPage"] === false) {
      window.adtDebug(
        "[ADT ModuleName] Event blocked - page excluded by regex",
      );
      return;
    }
    const last = document.querySelectorAll(
      '.wistia_embed, .wistia_async, iframe[src*="wistia.net"], iframe[src*="wistia.com"], [data-wistia-id]',
    );
    if (last.length) {
      window.adtDebug("Found " + last.length + " potential Wistia videos");
    }
    if (!window.Wistia) {
      const diff = document.querySelector('script[src*="fast.wistia"]');
      if (!diff) {
        window.adtDebug("Wistia API not found, waiting for it to load...");
      }
      const found = setInterval(() => {
        if (window.Wistia) {
          clearInterval(found);
          window.adtDebug("Wistia API now available");
          detected();
        }
      }, 500);
      setTimeout(() => clearInterval(found), 0x2710);
    } else {
      detected();
    }
    function detected() {
      window._wq = window._wq || [];
      window._wq.push({
        id: "_all",
        onReady: function (retryCount) {
          if (retryCount._adtTracking) {
            return;
          }
          retryCount._adtTracking = true;
          const maxRetries = {
            id: retryCount.hashedId() || "wistia_" + Date.now(),
            title: retryCount.name() || "Wistia Video",
            url: window.location.href,
            provider: "wistia",
            duration: retryCount.duration() || 0,
          };
          window.adtDebug("Wistia video ready:", maxRetries.title);
          let delayMs = false;
          retryCount.bind("play", () => {
            if (!delayMs) {
              delayMs = true;
              trackVideoProgress("start", maxRetries);
              videoLog("Wistia started:", maxRetries.title);
            }
          });
          let timeoutMs = -1;
          retryCount.bind("secondchange", (hasConsent) => {
            const blocked = Math.round(
              (hasConsent / retryCount.duration()) * 100,
            );
            progressMilestones.forEach((wasBlocked) => {
              if (
                blocked >= wasBlocked &&
                wasBlocked > timeoutMs &&
                markVideoOnce(maxRetries.id, wasBlocked)
              ) {
                timeoutMs = wasBlocked;
                trackVideoProgress("progress", maxRetries, wasBlocked);
              }
            });
          });
          retryCount.bind("end", () => {
            trackVideoProgress("complete", maxRetries);
            videoLog("Wistia completed:", maxRetries.title);
          });
          window.adtDebug("Tracking Wistia video:", maxRetries.id);
        },
        onHasData: function (analyticsOk) {
          window.adtDebug("Wistia video has data:", analyticsOk.name());
        },
      });
    }
  }
  function initVideoSessionHooks() {
    if (window._adtVideoSessionIntegrated) {
      return;
    }
    if (window.ADTData?.["shouldTrackPage"] === false) {
      window.adtDebug("ModuleName: Event blocked - page excluded by regex");
      return;
    }
    if (window._adtVideoSessionTimeout) {
      clearTimeout(window._adtVideoSessionTimeout);
    }
    if (!window.ADTSession) {
      if (!window._adtVideoRetryCount) {
        window._adtVideoRetryCount = 0;
      }
      if (window._adtVideoRetryCount < 10) {
        window._adtVideoRetryCount++;
        window._adtVideoSessionTimeout = setTimeout(() => initVideoSessionHooks(), 500);
        window.adtDebug("Session manager not ready, retrying...");
      } else {
        window.adtDebug("Session manager not available after retries");
      }
      return;
    }
    if (typeof window.ADTSession.registerHook !== "function") {
      window.adtDebug("Session manager is a stub (hooks unavailable)");
      return;
    }
    if (!window._adtSessionInitialized) {
      if (!window._adtVideoRetryCount) {
        window._adtVideoRetryCount = 0;
      }
      if (window._adtVideoRetryCount < 10) {
        window._adtVideoRetryCount++;
        window._adtVideoSessionTimeout = setTimeout(() => initVideoSessionHooks(), 500);
        window.adtDebug("Session exists but not initialized, retrying...");
        return;
      }
    }
    window._adtVideoSessionIntegrated = true;
    videoLog("Integrating with session manager");
    try {
      window.ADTSession.registerHook("ping", function (marketingOk) {
        const extra = isActive();
        if (extra.videos_started > 0) {
          const source = {
            event: "session_video_ping",
            session_id: marketingOk.sessionId,
            video_metrics: extra,
            timestamp: new Date().toISOString(),
          };
          if (typeof window.adtPushDeduped === "function") {
            window.adtPushDeduped(
              source,
              "video_ping_" + marketingOk.sessionId,
              30000,
            );
          } else {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push(source);
          }
          window.adtDebug("Video ping sent:", extra);
        }
      });
      window.ADTSession.registerHook("exit", function (granted) {
        if (window._adtYouTubeIntervals) {
          Object.keys(window._adtYouTubeIntervals).forEach((previous) => {
            try {
              clearInterval(window._adtYouTubeIntervals[previous]);
            } catch (storageErr) {
              window.adtDebug("Error clearing YouTube interval:", storageErr);
            }
          });
          window._adtYouTubeIntervals = {};
        }
        const localA = isActive();
        window.adtDebug("Session exit - video metrics check:", {
          videos_started: localA.videos_started,
          videos_completed: localA.videos_completed,
          highest_completion: localA.highest_completion,
          will_fire_summary: localA.videos_started > 0,
        });
        if (localA.videos_started > 0) {
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({
            session_id: granted.sessionId,
            exit_reason: granted.reason,
            final_video_metrics: localA,
            video_engagement_score: calculateVideoEngagementScore(localA),
            timestamp: new Date().toISOString(),
          });
          window.dataLayer.push({
            event: "session_video_summary",
          });
          videoLog("Video summary sent on exit (2-push pattern)");
        }
      });
      window.ADTSession.registerHook("idle", function (localC) {
        const localD = isActive();
        if (localD.has_active_video || localD.videos_started > 0) {
          const localE = {
            event: "video_idle",
            session_id: localC.sessionId,
            video_metrics_at_idle: localD,
            was_watching_video: localD.has_active_video,
            timestamp: new Date().toISOString(),
          };
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push(localE);
          window.adtDebug("User became idle during video session:", localD);
        }
      });
      window.ADTSession.registerHook("active", function (localF) {
        const localG = isActive();
        if (localG.videos_started > 0) {
          const localH = {
            event: "video_reactivated",
            session_id: localF.sessionId,
            video_metrics: localG,
            timestamp: new Date().toISOString(),
          };
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push(localH);
          window.adtDebug("User reactivated during video session");
        }
      });
    } catch (localI) {
      window.adtDebug("Error registering session hooks:", localI);
    }
    window.adtDebug("Session integration complete");
  }
  function calculateVideoEngagementScore(metrics) {
    if (!metrics || typeof metrics !== "object") {
      return 0;
    }
    try {
      let score = 0;
      const videosStarted = Math.max(0, parseInt(metrics.videos_started, 10) || 0);
      score += Math.min(20, videosStarted * 5);
      const completionRate = Math.max(
        0,
        Math.min(100, parseInt(metrics.completion_rate, 10) || 0),
      );
      score += Math.round(completionRate * 0.4);
      const highestCompletion = Math.max(
        0,
        Math.min(100, parseInt(metrics.highest_completion, 10) || 0),
      );
      score += Math.round(highestCompletion * 0.25);
      if (videosStarted > 1) {
        score += Math.min(15, (videosStarted - 1) * 5);
      }
      return Math.max(0, Math.min(100, Math.round(score)));
    } catch (scoreErr) {
      window.adtDebug("Error calculating video engagement score:", scoreErr);
      return 0;
    }
  }
  let videoRescanTimer = null;
  function scheduleVideoRescan() {
    if (videoRescanTimer) {
      clearTimeout(videoRescanTimer);
    }
    videoRescanTimer = setTimeout(() => {
      videoRescanTimer = null;
      scanAllVideoProviders();
    }, 500);
  }
  function scanAllVideoProviders() {
    firedMilestones();
    item();
    fields();
    now();
  }
  function bootstrapVideoTracking() {
    window.adtDebug("Initializing video tracking...");
    scanAllVideoProviders();
    initVideoSessionHooks();
    const videoDomObserver = new MutationObserver((mutations) => {
      let foundVideo = false;
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1) {
              if (
                node.tagName === "VIDEO" ||
                node.tagName === "IFRAME" ||
                (node.querySelector &&
                  (node.querySelector("video") ||
                    node.querySelector('iframe[src*="youtube"]') ||
                    node.querySelector('iframe[src*="vimeo"]') ||
                    node.querySelector('iframe[src*="wistia"]') ||
                    node.querySelector(".wistia_embed")))
              ) {
                foundVideo = true;
                break;
              }
            }
          }
        }
        if (foundVideo) {
          break;
        }
      }
      if (foundVideo) {
        window.adtDebug("New video elements detected, rescanning...");
        scheduleVideoRescan();
      }
    });
    videoDomObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "data-src"],
    });
    ["shown.bs.modal", "opened.fancybox", "elementor/popup/show"].forEach(
      (modalEvent) => {
        document.addEventListener(modalEvent, () => {
          window.adtDebug("Modal event detected: " + modalEvent);
          scheduleVideoRescan();
        });
      },
    );
    document.addEventListener(
      "load",
      (loadEvt) => {
        if (loadEvt.target.tagName === "IFRAME") {
          const iframeSrc = loadEvt.target.src || "";
          if (
            iframeSrc.includes("youtube") ||
            iframeSrc.includes("vimeo") ||
            iframeSrc.includes("wistia")
          ) {
            window.adtDebug("Video iframe loaded:", iframeSrc);
            scheduleVideoRescan();
          }
        }
      },
      true,
    );
    window.adtDebug("Video tracking initialized with session integration");
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrapVideoTracking);
  } else {
    bootstrapVideoTracking();
  }
  if (window.adtIsDebugEnabled && window.adtIsDebugEnabled()) {
    window.ADTVideoTracking = {
      flags: window._adtVideoFlags,
      metrics: value,
      getMetrics: isActive,
      calculateEngagementScore: () =>
        calculateVideoEngagementScore(isActive()),
      reset: function () {
        window._adtVideoFlags = {};
        value.videosStarted = 0;
        value.videosCompleted = 0;
        value.totalWatchTime = 0;
        value.highestCompletion = 0;
        value.activeVideo = null;
        console.log("Video tracking flags and metrics reset");
      },
      status: function () {
        console.log("Video flags:", window._adtVideoFlags);
        console.log("Video metrics:", isActive());
        console.log("Session integrated:", !!window._adtVideoSessionIntegrated);
      },
    };
  }
  window.ADTVideoTracking = window.ADTVideoTracking || {};
  window.ADTVideoTracking.testVideoSummary = function (
    isYouTube = 1,
    isVimeo = 1,
    isWistia = 100,
  ) {
    if (!window._adtVideoMetrics) {
      console.error("❌ Video metrics not initialized");
      return false;
    }
    console.log("🧪 Setting test video metrics...");
    window._adtVideoMetrics.videosStarted = isYouTube;
    window._adtVideoMetrics.videosCompleted = isVimeo;
    window._adtVideoMetrics.highestCompletion = isWistia;
    console.log("✅ Video metrics set:", {
      videosStarted: window._adtVideoMetrics.videosStarted,
      videosCompleted: window._adtVideoMetrics.videosCompleted,
      highestCompletion: window._adtVideoMetrics.highestCompletion,
    });
    console.log('💡 Now run: window.ADTSession.triggerExit("manual_test")');
    return true;
  };
})();
