#!/usr/bin/env node
/**
 * Replace common hex numeric literals with decimals (readability for reviewers).
 * Skips files where 0x could be part of strings; only touches listed safe files.
 */
const fs = require("fs");
const path = require("path");

const JS_DIR = path.join(__dirname, "../brandmeetscode-datalayer-tracker/assets/js");

const MAP = new Map([
  ["0x0", "0"],
  ["0x5", "5"],
  ["0xa", "10"],
  ["0xf", "15"],
  ["0x14", "20"],
  ["0x19", "25"],
  ["0x1e", "30"],
  ["0x28", "40"],
  ["0x3c", "60"],
  ["0x46", "70"],
  ["0x4b", "75"],
  ["0x64", "100"],
  ["0x78", "120"],
  ["0x96", "150"],
  ["0x12c", "300"],
]);

const files = process.argv.slice(2);
const targets =
  files.length > 0
    ? files
    : ["adt-engagement-tracking.js", "adt-ecommerce-lite.js"];

for (const file of targets) {
  const filePath = path.join(JS_DIR, file);
  let code = fs.readFileSync(filePath, "utf8");
  const before = code;
  const keys = [...MAP.keys()].sort((a, b) => b.length - a.length);
  for (const hex of keys) {
    const dec = MAP.get(hex);
    code = code.replace(new RegExp(`\\b${hex}\\b`, "g"), dec);
  }
  if (code !== before) {
    fs.writeFileSync(filePath, code);
    console.log("normalized hex in", file);
  }
}
