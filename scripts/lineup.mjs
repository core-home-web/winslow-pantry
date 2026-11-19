#!/usr/bin/env node
// Flip the public product lineup in src/site.json, then rebuild.
// Usage: node scripts/lineup.mjs launch|all

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { root } from "./lib.mjs";

const mode = process.argv[2];
if (mode !== "launch" && mode !== "all") {
  console.error('Usage: node scripts/lineup.mjs launch|all');
  process.exit(1);
}

const path = join(root, "src/site.json");
const site = JSON.parse(readFileSync(path, "utf8"));
site.lineup = mode;
site.lineupPreview = false;
writeFileSync(path, `${JSON.stringify(site, null, 2)}\n`);
console.log(`lineup → ${mode} (preview off)`);

const build = spawnSync(process.execPath, ["scripts/build.mjs"], {
  cwd: root,
  stdio: "inherit",
});
process.exit(build.status ?? 1);
