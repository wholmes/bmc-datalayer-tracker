#!/usr/bin/env node
/**
 * WordPress.org build: replace legacy premium gates with capability / config checks.
 */
const fs = require("fs");
const path = require("path");

const JS_DIR = path.join(__dirname, "../brandmeetscode-datalayer-tracker/assets/js");

const files = [
  "adt-ecommerce-lite.js",
  "adt-debug-overlay-core.js",
  "adt-debug-overlay-markup.js",
  "adt-complete-diagnostic-v2.js",
  "adt-log-manager.js",
  "adt-smart-diagnostic-v3.js",
  "adt-engagement-tracking.js",
];

const replacements = [
  [
    /window\.isADTPremium\(\)\s*&&\s*window\.ADTData\?\.\["dual_pixel_mode"\]/g,
    'window.ADTData?.["dual_pixel_mode"]',
  ],
  [
    /window\.isADTPremium\(\)\s*&&\s*window\.ADTData\?\.dual_pixel_mode/g,
    "window.ADTData?.dual_pixel_mode",
  ],
  [
    /window\.IS_PREMIUM\s*=\s*window\.isADTPremium\(\);/g,
    "window.IS_FULL_BUILD = window.adtAllFeaturesEnabled?.() ?? true;",
  ],
  [
    /Pixel tracking enabled but NOT PREMIUM/g,
    "Pixel tracking enabled but pixels module not loaded in this build",
  ],
  [
    /GA4 MP enabled but NOT PREMIUM/g,
    "GA4 Measurement Protocol enabled but server-side module not in this build",
  ],
  [
    /not loaded \(not premium\)/g,
    "not loaded (not available in this build)",
  ],
  [
    /premium feature disabled/gi,
    "session hooks unavailable",
  ],
  [
    /isPremium: window\.isADTPremium \? window\.isADTPremium\(\) : false/g,
    "featuresEnabled: window.adtAllFeaturesEnabled?.() ?? true",
  ],
  [
    /\(window\.isADTPremium \? window\.isADTPremium\(\) : "Unknown"\)/g,
    '(window.adtAllFeaturesEnabled ? window.adtAllFeaturesEnabled() : "Unknown")',
  ],
  [
    /premium: window\.isADTPremium \? window\.isADTPremium\(\) : false/g,
    "fullBuild: window.adtAllFeaturesEnabled ? window.adtAllFeaturesEnabled() : true",
  ],
];

function patchDebugOverlayCore(code) {
  const block = `      if (!window.isADTPremium() && detected.includes(found.event)) {
        return false;
      }
      const retryCount = ["marketo", "hubspot", "gravityforms"];
      if (
        !window.isADTPremium() &&
        retryCount.includes((found.formVendor || "").toLowerCase())
      ) {
        return false;
      }
`;
  if (code.includes(block)) {
    code = code.replace(block, "");
  }
  return code;
}

function patchDebugOverlayMarkup(code) {
  return code.replace(
    /!window\.isADTPremium\(\) \|\|\s*!window\.ADTData\?\.\["pixelSettings"\]\?\.\["enabled"\]/,
    '!window.ADTData?.["pixelSettings"]?.["enabled"]',
  );
}

let changed = 0;
for (const file of files) {
  const filePath = path.join(JS_DIR, file);
  if (!fs.existsSync(filePath)) {
    continue;
  }
  let code = fs.readFileSync(filePath, "utf8");
  const before = code;
  for (const [from, to] of replacements) {
    code = code.replace(from, to);
  }
  if (file === "adt-debug-overlay-core.js") {
    code = patchDebugOverlayCore(code);
  }
  if (file === "adt-debug-overlay-markup.js") {
    code = patchDebugOverlayMarkup(code);
  }
  if (code !== before) {
    fs.writeFileSync(filePath, code);
    console.log("patched", file);
    changed++;
  }
}

console.log(`Done. ${changed} file(s) updated.`);
