// Winslow Pantry: shared site data, translation helpers and URL helpers
// used by build.mjs (pages) and og.mjs (Open Graph images).

import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const json = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));

export const site = json("src/site.json");
export const { products, prints } = json("src/data/products.json");
export const DEFAULT = site.defaultLocale;

// Every public page, in navigation order. `path` is relative to the locale root.
export const PAGES = [
  { key: "home", path: "" },
  { key: "collection", path: "collection/" },
  { key: "story", path: "our-story/" },
  { key: "contact", path: "contact/" },
];

/* --------------------------------------------------------- translations */
// Each src/i18n/<code>.json is a locale. Missing keys fall back to English,
// so a new language can be added one section at a time.
const raw = Object.fromEntries(
  readdirSync(join(root, "src/i18n"))
    .filter((f) => f.endsWith(".json"))
    .map((f) => [f.replace(/\.json$/, ""), json(`src/i18n/${f}`)])
);

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
function merge(base, over) {
  if (!isObj(base) || !isObj(over)) return over ?? base;
  const out = { ...base };
  for (const k of Object.keys(over)) out[k] = merge(base[k], over[k]);
  return out;
}
function missingKeys(base, over, prefix = "") {
  const out = [];
  for (const k of Object.keys(base)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (!(k in (over || {}))) out.push(key);
    else if (isObj(base[k])) out.push(...missingKeys(base[k], over[k], key));
  }
  return out;
}

for (const code of Object.keys(raw)) {
  if (!site.locales.some((l) => l.code === code)) {
    console.warn(`! src/i18n/${code}.json has no entry in src/site.json "locales", so it is not built.`);
  }
}
export const locales = site.locales.filter((l) => raw[l.code]);
export const dict = Object.fromEntries(locales.map((l) => [l.code, merge(raw[DEFAULT], raw[l.code])]));
export const missing = Object.fromEntries(
  locales.filter((l) => l.code !== DEFAULT).map((l) => [l.code, missingKeys(raw[DEFAULT], raw[l.code])])
);

// Locale specific typography. French takes a narrow no-break space before
// two-part punctuation so it never wraps onto its own line.
const TYPO = {
  fr: (s) => s.replace(/ ([?!:;%])/g, " $1").replace(/(\d) (°)/g, "$1 $2"),
  es: (s) => s.replace(/(\d) (°)/g, "$1 $2"),
};

export function t(code, key, vars = {}) {
  let v = key.split(".").reduce((o, k) => (o == null ? o : o[k]), dict[code]);
  if (v == null) throw new Error(`Missing translation "${key}" (${code})`);
  if (typeof v !== "string") return v;
  v = v.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`));
  return TYPO[code] ? TYPO[code](v) : v;
}
// Arrays and objects (FAQ entries, included lists) get the same typography.
export function tList(code, key) {
  const fix = TYPO[code] || ((s) => s);
  const walk = (v) => (typeof v === "string" ? fix(v) : Array.isArray(v) ? v.map(walk) : isObj(v) ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)])) : v);
  return walk(t(code, key));
}

/* ----------------------------------------------------------------- urls */
export const localeRoot = (code) => (code === DEFAULT ? "/" : `/${code}/`);
export const pageUrl = (code, key) => localeRoot(code) + PAGES.find((p) => p.key === key).path;
export const abs = (path) => site.url.replace(/\/$/, "") + path;
export const ogImage = (code, key) => `/assets/og/${code}/${key}.jpg`;

// Stylesheet and script URLs carry a hash of the file, so a changed file gets a
// new URL and browsers never pair new pages with a week-old cached copy
// (public/_headers caches /assets/* for 7 days).
export const asset = (path) =>
  `${path}?v=${createHash("sha256").update(readFileSync(join(root, "public", path))).digest("hex").slice(0, 10)}`;

export const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
