#!/usr/bin/env node
/**
 * Post-deobfuscation cleanup: rename top-level opaque identifiers and normalize hex literals.
 */
const fs = require("fs");
const path = require("path");

const JS_DIR = path.join(__dirname, "../brandmeetscode-datalayer-tracker/assets/js");

const FILE_MAPS = {
  "adt-pageview.js": {
    _0x5c8387: "pvLog",
    _0xb44f28: "pvError",
    _0x3945c0: "pageviewModule",
    _0x4ef778: "tryFirePageview",
    _0x372b31: "integrateWithSession",
    _0x2bfc1a: "bootstrapPageview",
    _0x413f16: "args",
    _0x154cc8: "args",
    _0x262712: "out",
    _0x4e6b47: "adtData",
    _0x506e31: "flags",
    _0x3059bc: "err",
    _0x170c60: "err",
    _0x3320a7: "parts",
    _0x1cb4c9: "err",
    _0x28719a: "err",
    _0x1d5013: "out",
    _0x1a3f72: "adtData",
    _0x324805: "flags",
    _0x56e8fe: "err",
    _0x515de0: "out",
    _0xdc1ebd: "adtData",
    _0x4afe6a: "flags",
    _0x43a982: "err",
    _0x167fae: "out",
    _0x14a7f3: "adtData",
    _0x29b222: "flags",
    _0x3c5f08: "err",
    _0x2e8922: "err",
    _0x87d1ec: "out",
    _0x209f25: "adtData",
    _0xa20e03: "flags",
    _0x50ece5: "utm",
    _0x44ab50: "params",
    _0x3fb732: "clickIds",
    _0x33808b: "key",
    _0x462d08: "val",
    _0x2fedba: "err",
    _0x28844e: "err",
    _0x11c649: "bodyClass",
    _0x17f208: "err",
    _0x29c288: "err",
    _0xee441f: "payload",
    _0x529ff7: "sessionId",
    _0x5681df: "sessionNumber",
    _0x577d6d: "tabId",
    _0x38750b: "err",
    _0x514eb6: "payload",
    _0x4f8b59: "err",
    _0x31f3a9: "payload",
    _0x2f12c0: "evt",
    _0x475a63: "err",
    _0x545e6d: "blockedByConsent",
    _0x318c17: "payload",
    _0x2078cc: "key",
    _0x3dc2b5: "err",
    _0x149271: "sessionInfo",
    _0xee8561: "pageCtx",
    _0x1cd99d: "evt",
    _0x20d241: "pingInfo",
    _0x3a5fe3: "pageCtx",
    _0x5300b7: "evt",
    _0x3a0fa1: "exitInfo",
    _0x935af2: "pageCtx",
    _0x2a960e: "evt",
    _0x1d2d19: "err",
    _0x31eff8: "adtData",
    _0x2d50eb: "err",
    _0xc930e: "err",
    _0x463e22: "err",
  },
  "adt-engagement-tracking.js": {
    _0x4fa711: "adtData",
    _0x2b0b2b: "engLog",
    _0x315422: "args",
    _0x4fc173: "loadEngagementMetrics",
    _0x2fc033: "saveEngagementMetrics",
    _0x5a22fb: "raw",
    _0x524255: "parsed",
    _0x1edaa0: "err",
    _0x3af1d3: "snapshot",
    _0xe9da2c: "err",
  },
  "adt-cookie-tracking.js": {
    _0x1f71d3: "log",
  },
  "adt-consent-manager.js": {
    _0x1f71d3: "consentLog",
    _0x440499: "pushConsentEvent",
    _0x52da5c: "syncDataLayerBlocked",
    _0x1f910b: "cmpIntegrations",
    _0x54ddce: "initPreferredCmp",
    _0x51303c: "applyCmpConsent",
    _0x24af61: "bootstrapConsent",
    _0x5cdd31: "args",
    _0x41b880: "eventName",
    _0x4807cd: "extra",
    _0x17576e: "throttleMs",
    _0x535d01: "now",
    _0xe491ab: "last",
    _0x20fa9f: "evt",
    _0x4e1929: "category",
    _0x522c8a: "altCategory",
    _0x219625: "altVal",
    _0x199fb6: "val",
    _0x58551e: "type",
    _0x2c59f0: "granted",
    _0x4b4938: "source",
    _0x59ba7a: "previous",
    _0x211b34: "storageErr",
    _0x1ccc50: "source",
    _0x22868f: "key",
    _0x526cf4: "analyticsOk",
    _0x19ba5d: "fallback",
    _0x32c675: "wasBlocked",
    _0x55ac9d: "evt",
  },
};

function normalizeHexLiterals(code) {
  return code
    // Do not replace bare 0x0 — breaks patterns like 0x0++ when removed incorrectly.
    .replace(/\b0x1\b/g, "1")
    .replace(/\b0x3e8\b/g, "1000")
    .replace(/\b0x5dc\b/g, "1500")
    .replace(/\b0x64\b/g, "100")
    .replace(/\b0x14\b/g, "20")
    .replace(/\b0xa\b/g, "10")
    .replace(/\b0x3\b/g, "3")
    .replace(/\b0xc8\b/g, "200")
    .replace(/\b0x1388\b/g, "5000")
    .replace(/\b0x7530\b/g, "30000")
    .replace(/\b0x1f4\b/g, "500")
    .replace(/\b0x32\b/g, "50");
}

function applyMap(code, map) {
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  let out = code;
  for (const from of keys) {
    const to = map[from];
    const re = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    out = out.replace(re, to);
  }
  return out;
}

function stripNamedFunctionWrappers(code) {
  return code.replace(
    /function (_0x[a-f0-9]+)\(/g,
    "function (",
  );
}

for (const [file, map] of Object.entries(FILE_MAPS)) {
  const filePath = path.join(JS_DIR, file);
  if (!fs.existsSync(filePath)) {
    console.warn("skip missing", file);
    continue;
  }
  let code = fs.readFileSync(filePath, "utf8");
  code = applyMap(code, map);
  code = normalizeHexLiterals(code);
  fs.writeFileSync(filePath, code);
  console.log("cleaned", file);
}

// Normalize hex literals in all plugin JS (not only mapped files).
for (const file of fs.readdirSync(JS_DIR).filter((f) => f.endsWith(".js"))) {
  const filePath = path.join(JS_DIR, file);
  let code = fs.readFileSync(filePath, "utf8");
  const next = normalizeHexLiterals(code);
  if (next !== code) {
    fs.writeFileSync(filePath, next);
    console.log("hex-normalized", file);
  }
}

console.log("Done.");
