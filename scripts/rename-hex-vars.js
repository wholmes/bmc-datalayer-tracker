#!/usr/bin/env node
/**
 * Replace _0x[a-f0-9]+ identifiers with readable names (order of first appearance).
 */
const fs = require("fs");
const path = require("path");

const JS_DIR = path.join(__dirname, "../brandmeetscode-datalayer-tracker/assets/js");

const SKIP = new Set([
  "adt-runtime-flags.js",
  "adt-free-coordinator.js",
  "adt-cmp-debug.js",
  "adt-cmp-toolbar.js",
  "adt-consent-universal.js",
  "adt-setup-wizard-free-flow.js",
  "adt-wc-cart-sync.js",
  "adt-utils-lite.js",
  "adt-core-lite.js",
  "adt-event-queue.js",
  "adt-pageview.js",
]);

const WORD_POOL = [
  "adtData",
  "config",
  "payload",
  "eventName",
  "detail",
  "element",
  "target",
  "result",
  "value",
  "flag",
  "enabled",
  "url",
  "pattern",
  "regex",
  "depth",
  "percent",
  "scrollY",
  "scrollTop",
  "pageKey",
  "firedSet",
  "milestone",
  "timerId",
  "intervalId",
  "activeSec",
  "tickCount",
  "saveTick",
  "isActive",
  "lastTick",
  "milestones",
  "firedMilestones",
  "pagePath",
  "scrollHeight",
  "viewportH",
  "scrollPct",
  "threshold",
  "tolerance",
  "evt",
  "item",
  "key",
  "err",
  "idx",
  "len",
  "mode",
  "type",
  "name",
  "opts",
  "ref",
  "val",
  "obj",
  "fn",
  "arg",
  "tmp",
  "node",
  "list",
  "entry",
  "state",
  "ctx",
  "data",
  "row",
  "col",
  "map",
  "set",
  "buf",
  "raw",
  "parsed",
  "text",
  "html",
  "cmpName",
  "handler",
  "callback",
  "response",
  "request",
  "fields",
  "formId",
  "fieldId",
  "cartAdds",
  "cartRemoves",
  "sessionInfo",
  "hookData",
  "pixelEvt",
  "overlayEvt",
  "filterEvt",
  "searchParams",
  "clickId",
  "utmData",
  "cookieVal",
  "cookieKey",
  "consentRaw",
  "consentObj",
  "prevConsent",
  "now",
  "last",
  "diff",
  "found",
  "detected",
  "retryCount",
  "maxRetries",
  "delayMs",
  "timeoutMs",
  "hasConsent",
  "blocked",
  "wasBlocked",
  "analyticsOk",
  "marketingOk",
  "extra",
  "source",
  "granted",
  "previous",
  "storageErr",
  "localA",
  "localB",
  "localC",
  "localD",
  "localE",
  "localF",
  "localG",
  "localH",
  "localI",
  "localJ",
];

function collectReservedNames(code) {
  const reserved = new Set([
    "window",
    "document",
    "console",
    "dataLayer",
    "sessionStorage",
    "localStorage",
    "history",
    "location",
    "navigator",
    "JSON",
    "Date",
    "Math",
    "RegExp",
    "URLSearchParams",
    "CustomEvent",
    "Event",
    "setTimeout",
    "setInterval",
    "clearInterval",
    "addEventListener",
  ]);
  const decl =
    /\b(?:const|let|var|function)\s+([a-zA-Z_$][\w$]*)/g;
  let m;
  while ((m = decl.exec(code)) !== null) {
    reserved.add(m[1]);
  }
  return reserved;
}

function buildRenameMap(code) {
  const reserved = collectReservedNames(code);
  const re = /_0x[a-f0-9]+/g;
  const seen = new Map();
  let poolIdx = 0;
  let localCounter = 1;
  let m;
  while ((m = re.exec(code)) !== null) {
    const id = m[0];
    if (!seen.has(id)) {
      let name;
      do {
        if (poolIdx < WORD_POOL.length) {
          name = WORD_POOL[poolIdx];
          poolIdx++;
        } else {
          name = `local${localCounter++}`;
        }
        if (["event", "name", "type", "length", "map", "set"].includes(name)) {
          name = name + "Val";
        }
      } while (reserved.has(name));
      reserved.add(name);
      seen.set(id, name);
    }
  }
  return seen;
}

function applyMap(code, map) {
  const keys = [...map.keys()].sort((a, b) => b.length - a.length);
  let out = code;
  for (const from of keys) {
    const to = map.get(from);
    const re = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    out = out.replace(re, to);
  }
  return out;
}

const targets = process.argv.slice(2);
const files =
  targets.length > 0
    ? targets
    : fs.readdirSync(JS_DIR).filter((f) => f.endsWith(".js") && !SKIP.has(f));

let changed = 0;
for (const file of files) {
  const filePath = path.join(JS_DIR, file);
  if (!fs.existsSync(filePath)) {
    console.warn("skip missing", file);
    continue;
  }
  const before = fs.readFileSync(filePath, "utf8");
  if (!/_0x[a-f0-9]+/.test(before)) {
    continue;
  }
  const map = buildRenameMap(before);
  const after = applyMap(before, map);
  if (after !== before) {
    fs.writeFileSync(filePath, after);
    console.log("renamed", file, `(${map.size} identifiers)`);
    changed++;
  }
}

console.log(`Done. ${changed} file(s) updated.`);
