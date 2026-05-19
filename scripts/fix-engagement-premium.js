#!/usr/bin/env node
/** Remove premium-only early returns in engagement (free .org build). */
const fs = require("fs");
const path = require("path");

const file = path.join(
  __dirname,
  "../brandmeetscode-datalayer-tracker/assets/js/adt-engagement-tracking.js",
);
let code = fs.readFileSync(file, "utf8");

code = code.replace(
  /if \(!window\.isADTPremium \|\| !window\.isADTPremium\(\)\) \{\s*engLog\("\[ADT Engagement\] Active time tracking is premium-only"\);\s*return;\s*\}/,
  "// Active time enabled in this build (no license gate).",
);

code = code.replace(
  /window\.isADTPremium &&\s*window\.isADTPremium\(\) &&\s*window\.ADTData\?\.\["dual_pixel_mode"\]/g,
  "window.ADTData?.dual_pixel_mode",
);

code = code.replace(
  /engLog\("\[ADT Engagement\] Hover intent is premium-only"\);\s*return;/g,
  "// Hover intent enabled in this build.",
);

fs.writeFileSync(file, code);
console.log("Patched adt-engagement-tracking.js");
