// Winslow Pantry: internal brand style guide (/styleguide/).
// English only, noindex, kept out of navigation and the sitemap, and served
// behind HTTP Basic Auth by src/worker.js.

import { site, products, prints, locales, PAGES, t, pageUrl, ogImage, esc } from "./lib.mjs";
import { icon, sprite, ICONS } from "./icons.mjs";

/* ------------------------------------------------------------- palette */
export const PALETTE = [
  { name: "Oat", pantone: "4246 C", hex: "#CDC2AB", role: "Soft neutral for cards, labels and backgrounds." },
  { name: "Rose", pantone: "2446 C", hex: "#D1848A", role: "Warm accent. Silicone tools and the strawberry print." },
  { name: "Terracotta", pantone: "4034 C", hex: "#CC9475", role: "Earthy accent for illustrations and seasonal moments." },
  { name: "Wheat", pantone: "4029 C", hex: "#E8CCA6", role: "Light warm neutral. Pairs with Ink text." },
  { name: "Sage", pantone: "4218 C", hex: "#ADB39C", role: "Garden green for backgrounds and the lime print." },
  { name: "Mist", pantone: "428 C", hex: "#BEC4C9", role: "Cool neutral for dividers and quiet surfaces." },
  { name: "Harbor", pantone: "7698 C", hex: "#3F738C", role: "Primary action color. Buttons, icons and display text." },
  { name: "Ink", pantone: "433 C", hex: "#1C252E", role: "All body text, the logo and the footer." },
  { name: "Cornflower", pantone: "2155 C", hex: "#9BB4CB", role: "Signature blue. Headers, heroes and the plaid." },
  { name: "Lake", pantone: "4156 C", hex: "#94BECC", role: "Fresh blue accent for the blueberry print and stripes." },
];
const SURFACES = [
  { name: "Cream", hex: "#F2E3CE", role: "Page background, taken from the guide." },
  { name: "Paper", hex: "#FBF6EE", role: "Cards and textured watercolor paper sections." },
  { name: "Harbor deep", hex: "#33607A", role: "Web only. Small link text on light surfaces (a darker step of 7698 C)." },
  { name: "Ink soft", hex: "#3B4652", role: "Web only. Secondary body text." },
];
const LOGO_COLORS = [
  { name: "Logo ink", hex: "#231F20" },
  { name: "Olive", hex: "#727A4D" },
  { name: "Blue", hex: "#5781A6" },
  { name: "Taupe", hex: "#968A87" },
];

const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
export const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", ");
function rating(r) {
  if (r >= 7) return { cls: "pass", ic: "check", label: "AAA: any text" };
  if (r >= 4.5) return { cls: "pass", ic: "check", label: "AA: any text" };
  if (r >= 3) return { cls: "warn", ic: "info", label: "Large text and icons only" };
  return { cls: "fail", ic: "cross", label: "Decorative only, no text" };
}

const PAIRS = [
  ["Ink", "#1C252E", "Cream", "#F2E3CE"],
  ["Ink", "#1C252E", "Cornflower", "#9BB4CB"],
  ["Ink", "#1C252E", "Paper", "#FBF6EE"],
  ["Ink", "#1C252E", "Rose", "#D1848A"],
  ["Ink", "#1C252E", "Sage", "#ADB39C"],
  ["White", "#FFFFFF", "Harbor", "#3F738C"],
  ["White", "#FFFFFF", "Ink", "#1C252E"],
  ["Harbor deep", "#33607A", "Cream", "#F2E3CE"],
  ["Harbor", "#3F738C", "Cream", "#F2E3CE"],
  ["Harbor", "#3F738C", "Cornflower", "#9BB4CB"],
  ["White", "#FFFFFF", "Cornflower", "#9BB4CB"],
  ["White", "#FFFFFF", "Rose", "#D1848A"],
];

/* ----------------------------------------------------------- sections */
const NAV = [
  ["intro", "Overview"],
  ["logo", "Logo"],
  ["color", "Color"],
  ["access", "Accessibility"],
  ["type", "Typography"],
  ["elements", "Design elements"],
  ["prints", "Prints"],
  ["packaging", "Packaging"],
  ["components", "Components"],
  ["motion", "Motion"],
  ["voice", "Voice and copy"],
  ["i18n", "Translation"],
  ["seo", "SEO and sharing"],
];

const swatch = (c, extra = "") => {
  const onInk = contrast(c.hex, "#1C252E");
  const fg = onInk >= 4.5 ? "#1C252E" : "#FFFFFF";
  return `<li class="sg-swatch">
          <div class="sg-swatch__chip" style="background:${c.hex};color:${fg}"><span>${esc(c.name)}</span></div>
          <dl class="sg-swatch__meta">
            ${c.pantone ? `<div><dt>Pantone</dt><dd>${c.pantone}</dd></div>` : ""}
            <div><dt>HEX</dt><dd><button class="sg-copy" type="button" data-copy="${c.hex}">${c.hex}</button></dd></div>
            <div><dt>RGB</dt><dd>${rgb(c.hex)}</dd></div>
          </dl>
          ${c.role ? `<p>${esc(c.role)}</p>` : ""}${extra}
        </li>`;
};

function section(id, title, body, lead = "") {
  return `<section class="sg-section" id="${id}" aria-labelledby="${id}-title">
      ${id === "intro" ? `<h1 class="h2" id="${id}-title">${title}</h1>` : `<h2 class="h2" id="${id}-title">${title}</h2>`}
      ${lead ? `<p class="lead">${lead}</p>` : ""}
      ${body}
    </section>`;
}

function metaRows() {
  return locales
    .flatMap((l) =>
      [...PAGES.map((p) => p.key), "notFound"].map((key) => {
        const title = t(l.code, `meta.${key}.title`);
        const desc = t(l.code, `meta.${key}.description`);
        return `<tr><td>${l.code.toUpperCase()}</td><td>${key === "notFound" ? "404" : `<a href="${pageUrl(l.code, key)}">${pageUrl(l.code, key)}</a>`}</td><td>${esc(title)} <span class="sg-count">${title.length}/60</span></td><td>${esc(desc)} <span class="sg-count">${desc.length}/160</span></td></tr>`;
      })
    )
    .join("\n            ");
}

export function styleguide() {
  const logoTile = (src, label, bg, note = "") =>
    `<figure class="sg-logo" style="background:${bg}"><img src="${src}" alt="${esc(label)}"><figcaption>${esc(label)}${note ? `<span>${esc(note)}</span>` : ""}</figcaption></figure>`;

  const body = `
    ${section(
      "intro",
      "Winslow Pantry brand style guide",
      `<div class="sg-note">${icon("info")}<p><strong>Internal use only.</strong> This page is password protected, hidden from search engines and not linked from the public site. Please do not share the link outside the team.</p></div>
      <div class="sg-story">
        <p>Winslow Pantry is inspired by the charm of the local farmer's market and a simpler life, bringing a fresh, inviting spirit to the heart of the home. Rooted in the bounty of color and new sensations that come with the seasons, our kitchen collection blends timeless charm with everyday function.</p>
        <p>This guide translates the printed Brand Guidelines into rules for the website: the logo, colors, type, patterns and packaging from the guide, plus the accessibility, copy and translation standards the site is built on.</p>
      </div>`
    )}

    ${section(
      "logo",
      "Logo",
      `<div class="sg-grid sg-grid--2">
        ${logoTile("/assets/img/brand/logo.svg", "Primary logo", "#F2E3CE", "Use whenever there is room.")}
        ${logoTile("/assets/img/brand/wordmark.svg", "Word mark", "#F2E3CE", "For tight spaces, engraving and silkscreen.")}
      </div>
      <h3 class="h3">Color variations</h3>
      <div class="sg-grid sg-grid--4">
        ${logoTile("/assets/img/brand/badge-green.svg", "Olive badge", "#FBF6EE")}
        ${logoTile("/assets/img/brand/badge-blue.svg", "Blue badge", "#FBF6EE")}
        ${logoTile("/assets/img/brand/badge-taupe.svg", "Taupe badge", "#FBF6EE")}
        ${logoTile("/assets/img/brand/logo-white.svg", "Reversed logo", "#1C252E", "On Ink or Harbor only.")}
      </div>
      <h3 class="h3">Clear space</h3>
      <div class="sg-clear">
        <div class="sg-clear__diagram" aria-hidden="true"><img src="/assets/img/brand/logo.svg" alt=""></div>
        <div>
          <p>Keep a clear space of <strong>half the logo height (½ H)</strong> on every side. Nothing else (text, edges, photos or patterns) should enter that area.</p>
          <p>On the website the header logo is never smaller than 108px wide, and the badge versions are never set below 72px wide, so the script "Pantry" stays readable.</p>
          <h4 class="h4">Please don't</h4>
          <ul class="sg-dont" role="list">
            <li>${icon("cross")}Stretch, skew or rotate the logo.</li>
            <li>${icon("cross")}Recolor it outside the ink, white and badge versions shown here.</li>
            <li>${icon("cross")}Place the outline logo directly on a busy fruit print. Use a badge version instead.</li>
            <li>${icon("cross")}Rebuild the word mark in a font. Always use the artwork files.</li>
          </ul>
        </div>
      </div>
      <p class="sg-files">Files: <a href="/assets/img/brand/logo.svg" download>logo.svg</a> · <a href="/assets/img/brand/logo-white.svg" download>logo-white.svg</a> · <a href="/assets/img/brand/wordmark.svg" download>wordmark.svg</a> · <a href="/assets/img/brand/wordmark-white.svg" download>wordmark-white.svg</a> · <a href="/assets/img/brand/badge-green.svg" download>badge-green.svg</a> · <a href="/assets/img/brand/badge-blue.svg" download>badge-blue.svg</a> · <a href="/assets/img/brand/badge-taupe.svg" download>badge-taupe.svg</a></p>`
    )}

    ${section(
      "color",
      "Color",
      `<h3 class="h3">Brand colors</h3>
      <ul class="sg-swatches" role="list">
        ${PALETTE.map((c) => swatch(c)).join("\n        ")}
      </ul>
      <h3 class="h3">Surfaces and web helpers</h3>
      <ul class="sg-swatches" role="list">
        ${SURFACES.map((c) => swatch(c)).join("\n        ")}
      </ul>
      <h3 class="h3">Logo colors</h3>
      <ul class="sg-swatches sg-swatches--small" role="list">
        ${LOGO_COLORS.map((c) => swatch(c)).join("\n        ")}
      </ul>
      <h3 class="h3">Materials and patterns</h3>
      <ul class="sg-materials" role="list">
        <li><span class="sg-dot sg-dot--bronze"></span>Metallic bronze</li>
        <li><span class="sg-dot sg-dot--gold"></span>Metallic gold</li>
        <li><span class="sg-dot sg-dot--copper"></span>Metallic copper</li>
        <li><span class="sg-dot" style="background-image:url(/assets/img/textures/bamboo.jpg)"></span>Bamboo</li>
        <li><span class="sg-dot" style="background-image:url(/assets/img/textures/acacia.jpg)"></span>Acacia</li>
        <li><span class="sg-dot plaid-dot"></span>Plaid</li>
        <li><span class="sg-dot sg-dot--gingham"></span>Gingham</li>
        <li><span class="sg-dot sg-dot--stripes"></span>Stripes</li>
      </ul>`,
      "Ten Pantone colors from the Brand Guidelines. Use them as they are. When a color can't carry text on its own, change the text color, never the brand color."
    )}

    ${section(
      "access",
      "Accessibility and color vision",
      `<h3 class="h3">Contrast pairings</h3>
      <p>Ratings follow WCAG 2.2. AA needs 4.5:1 for body text and 3:1 for large text (24px and up, or 19px bold) and for icons and outlines. Each result is spelled out in words and marked with a symbol, so it never depends on color.</p>
      <ul class="sg-pairs" role="list">
        ${PAIRS.map(([fn, fg, bn, bg]) => {
          const r = contrast(fg, bg);
          const g = rating(r);
          return `<li class="sg-pair">
          <div class="sg-pair__sample" style="background:${bg};color:${fg}"><span class="sg-pair__big">Aa</span><span>Fresh from the market</span></div>
          <p class="sg-pair__name">${fn} on ${bn}</p>
          <p class="sg-pair__rating sg-pair__rating--${g.cls}">${icon(g.ic)}<span><strong>${r.toFixed(2)}:1</strong> ${g.label}</span></p>
        </li>`;
        }).join("\n        ")}
      </ul>

      <h3 class="h3">Preview with color vision deficiencies</h3>
      <p>About 1 in 12 men and 1 in 200 women see color differently. Use these filters to check any part of this guide, or the live site, the way those visitors would see it.</p>
      <div class="sg-cvd" role="group" aria-label="Color vision simulation">
        <button type="button" class="chip" data-cvd="" aria-pressed="true">Typical vision</button>
        <button type="button" class="chip" data-cvd="protanopia" aria-pressed="false">Protanopia (red blind)</button>
        <button type="button" class="chip" data-cvd="deuteranopia" aria-pressed="false">Deuteranopia (green blind)</button>
        <button type="button" class="chip" data-cvd="tritanopia" aria-pressed="false">Tritanopia (blue blind)</button>
        <button type="button" class="chip" data-cvd="achromatopsia" aria-pressed="false">Achromatopsia (no color)</button>
      </div>

      <h3 class="h3">Rules the site follows</h3>
      <ul class="sg-rules" role="list">
        <li>${icon("check")}<span><strong>Never use color alone to carry meaning.</strong> Finishes and product colors are always named in text ("oat, wheat, lake blue, navy and stone").</span></li>
        <li>${icon("check")}<span><strong>Links are underlined</strong> in running text, and the current page in the menu is marked with a heavy underline and a light pill, not only a color change.</span></li>
        <li>${icon("check")}<span><strong>Body text is always Ink</strong> (or white on Harbor and Ink). Pastel brand colors are backgrounds, never text.</span></li>
        <li>${icon("check")}<span><strong>Harbor carries buttons</strong> with white text (5.2:1). For small link text on cream we use Harbor deep, a darker step of the same hue.</span></li>
        <li>${icon("check")}<span><strong>Avoid red and green side by side</strong> to tell things apart. In internal materials the cherry and lime prints are always labeled.</span></li>
        <li>${icon("check")}<span><strong>Focus is always visible</strong>: a 3px Ink outline with a white halo (reversed on dark sections).</span></li>
        <li>${icon("check")}<span><strong>Respect user settings</strong>: reduced motion turns off transitions, higher contrast removes soft tints, and forced colors keep button outlines.</span></li>
      </ul>`,
      "The brand palette is soft and pastel. These rules keep it exactly as designed while making sure every visitor, including people with color blindness or low vision, can read and use the site."
    )}

    ${section(
      "type",
      "Typography",
      `<div class="sg-grid sg-grid--3">
        <div class="sg-type">
          <p class="sg-label">Primary</p>
          <p class="sg-type__name">Begum Bold</p>
          <p class="sg-type__sample" style="font-family:var(--font-display);font-weight:700">Aa Bb Cc 123</p>
          <p class="small">Headlines and product names. On the web we use <strong>Playfair Display</strong> (open source) until a Begum web license is added. The font stack lists Begum first, so it takes over automatically.</p>
        </div>
        <div class="sg-type">
          <p class="sg-label">Secondary</p>
          <p class="sg-type__name">Quimby Mayoral</p>
          <p class="sg-type__sample" style="font-family:var(--font-script)">Aa Bb Cc 123</p>
          <p class="small">Short script accents only (a few words, never full sentences). Web stand-in: <strong>Yellowtail</strong>.</p>
        </div>
        <div class="sg-type">
          <p class="sg-label">Body (web)</p>
          <p class="sg-type__name">Instrument Sans</p>
          <p class="sg-type__sample" style="font-family:var(--font-body)">Aa Bb Cc 123</p>
          <p class="small">A clean grotesk that echoes the guide's section labels. Used for body copy, labels, buttons and navigation.</p>
        </div>
      </div>
      <div class="sg-scale">
        <p class="kicker">fresh from the market</p>
        <p class="display">Display: Simple charm for the heart of the home</p>
        <p class="h2">Heading 2: Five kitchen helpers to start</p>
        <p class="h3">Heading 3: Bamboo Utensil Set</p>
        <p class="h4">Label: What's included</p>
        <p class="lead">Lead: Winslow Pantry brings the easy spirit of a Saturday farmer's market into your kitchen.</p>
        <p>Body: Honest materials, cheerful color and tools that earn their spot by the stove. Body text is 16 to 17px with a 1.65 line height and a maximum line length of about 65 characters.</p>
      </div>`
    )}

    ${section(
      "elements",
      "Design elements",
      `<h3 class="h3">Plaid, gingham and stripes</h3>
      <div class="sg-grid sg-grid--3">
        <figure class="sg-pattern"><div class="plaid" style="height:160px"></div><figcaption>Cornflower plaid. Section breaks under heroes.</figcaption></figure>
        <figure class="sg-pattern"><div class="gingham" style="height:160px"></div><figcaption>Gingham. Footer edge and small accents.</figcaption></figure>
        <figure class="sg-pattern"><div style="height:160px;background:url(/assets/img/brand/stripes.svg) 0 0 / 40px 40px"></div><figcaption>Stripes. Packaging borders.</figcaption></figure>
      </div>
      <h3 class="h3">Fruit illustrations</h3>
      <p>Watercolor fruit with soft edges and leaves, always on white or watercolor paper. On the public site single fruits appear only as decoration, never named or labeled. Each fruit also has a matching all-over print, documented in <a href="#prints">Prints</a>.</p>
      <h3 class="h3">Paper texture</h3>
      <div class="sg-paper"><p>Textured watercolor paper sits behind cards and content sections, tinted with Paper so text stays crisp.</p></div>`
    )}

    ${section(
      "prints",
      "Prints",
      `<div class="sg-note">${icon("info")}<p><strong>Internal only.</strong> Print names, notes and the print tag are for the team, line sheets and retail partners. The public site shows the prints on packaging photos and product panels, but never names them or gives them their own section.</p></div>
      <h3 class="h3">The prints</h3>
      <p>Each print pairs a watercolor fruit with an all-over pattern. The name and note are the house wording for internal materials.</p>
      <ul class="prints" role="list">
        ${prints
          .map(
            (p) => `<li class="print">
          <div class="print__tile${p.stripe ? ` print__tile--${p.id}` : ""}"${p.tile ? ` style="background-image:url(${p.tile})"` : ""}>
            ${p.spot ? `<img class="print__spot" src="${p.spot}" width="${p.spotWidth}" height="${p.spotHeight}" alt="" loading="lazy">` : ""}
          </div>
          <h4 class="print__name">${esc(p.name)}</h4>
          <p class="print__note">${esc(p.note)}</p>
        </li>`
          )
          .join("\n        ")}
      </ul>
      <h3 class="h3">Prints by product</h3>
      <div class="sg-table-wrap">
        <table class="sg-table">
          <caption class="visually-hidden">Which print each product wears</caption>
          <thead><tr><th scope="col">Product</th><th scope="col">Print</th><th scope="col">Tag</th></tr></thead>
          <tbody>
            ${products
              .map((p) => {
                const pr = prints.find((x) => x.id === p.print);
                return `<tr><td>${esc(t("en", `products.${p.slug}.name`))}</td><td>${esc(pr.name)}</td><td><p class="print-tag"><span class="print-tag__swatch print-tag__swatch--${pr.id}" aria-hidden="true"></span>Print: ${esc(pr.name)}</p></td></tr>`;
              })
              .join("\n            ")}
          </tbody>
        </table>
      </div>
      <h3 class="h3">Print tag</h3>
      <p>A round swatch with the print name in text, so the print never depends on color alone. Use it on line sheets, order forms and other internal or partner materials.</p>
      <div class="sg-demo">
        <p class="print-tag"><span class="print-tag__swatch print-tag__swatch--lemon" aria-hidden="true"></span>Print: Lemon</p>
        <p class="print-tag"><span class="print-tag__swatch print-tag__swatch--blueberry" aria-hidden="true"></span>Print: Blueberry</p>
        <p class="print-tag"><span class="print-tag__swatch print-tag__swatch--strawberry" aria-hidden="true"></span>Print: Strawberry</p>
      </div>
      <h3 class="h3">Rules</h3>
      <ul class="sg-rules" role="list">
        <li>${icon("check")}<span><strong>Keep prints off the public copy.</strong> No print names, print tags or "our prints" sections on the website. Let the packaging speak for itself.</span></li>
        <li>${icon("check")}<span><strong>Always name a print in text</strong> wherever it is listed internally, and never tell prints apart by color alone.</span></li>
        <li>${icon("check")}<span><strong>One print per package.</strong> Do not mix prints on the same product or panel.</span></li>
      </ul>`,
      "The all-over fruit patterns on our packaging. This is the reference for which print goes with which product."
    )}

    ${section(
      "packaging",
      "Packaging",
      `<p>Arched cards and header tags with a gold hairline frame, a fruit print border and the badge logo at the top. Product names are set in Begum Bold in Ink, with set counts in a light sans.</p>
      <ul class="sg-packs" role="list">
        ${products.map((p) => `<li><img src="${p.image.src}" alt="${esc(t("en", `products.${p.slug}.alt`))}" width="${p.image.width}" height="${p.image.height}" loading="lazy"><p>${esc(t("en", `products.${p.slug}.name`))}</p></li>`).join("\n        ")}
      </ul>
      <h3 class="h3">Engraving and silkscreen</h3>
      <div class="sg-grid sg-grid--2">
        <figure class="sg-logo" style="background:#F2E3CE"><img src="/assets/img/products/board-engraved.webp" alt="The logo engraved in the corner of an acacia cutting board" loading="lazy"><figcaption>Engraved primary logo on acacia</figcaption></figure>
        <figure class="sg-logo" style="background:#F2E3CE"><img src="/assets/img/products/spoon.webp" alt="The word mark silkscreened on a rose silicone spoon" style="max-height:260px;transform:rotate(-90deg)" loading="lazy"><figcaption>Tone on tone word mark on silicone</figcaption></figure>
      </div>`
    )}

    ${section(
      "components",
      "Components",
      `<h3 class="h3">Buttons and links</h3>
      <div class="sg-demo">
        <a class="btn" href="#components">Primary button${icon("arrow", "btn__icon")}</a>
        <a class="btn btn--ghost" href="#components">Secondary button</a>
        <a class="chip" href="#components">Chip</a>
        <a class="text-link" href="#components">Text link${icon("arrow", "icon--inline")}</a>
      </div>
      <div class="sg-demo sg-demo--dark">
        <a class="btn btn--light" href="#components">Button on Harbor${icon("arrow", "btn__icon")}</a>
      </div>
      <h3 class="h3">Script kicker</h3>
      <div class="sg-demo">
        <p class="kicker">the collection</p>
      </div>
      <h3 class="h3">Feature icons</h3>
      <p>Line icons on a 32px grid with a 2px stroke, drawn to match the packaging. Always paired with a text label.</p>
      <ul class="sg-icons" role="list">
        ${Object.keys(ICONS).map((k) => `<li>${icon(k)}<span>${k}</span></li>`).join("\n        ")}
      </ul>
      <h3 class="h3">Product card</h3>
      <ul class="product-grid sg-cards" role="list">
        ${(() => {
          const p = products[2];
          return `<li class="product-card"><div class="product-card__media panel panel--${p.panel}"><img src="${p.image.src}" alt="" width="${p.image.width}" height="${p.image.height}" loading="lazy"></div><div class="product-card__body"><p class="product-card__set">${esc(t("en", `products.${p.slug}.set`))}</p><h4 class="product-card__name"><a href="${pageUrl("en", "collection")}#${p.slug}">${esc(t("en", `products.${p.slug}.name`))}</a></h4><p>${esc(t("en", `products.${p.slug}.short`))}</p></div></li>`;
        })()}
      </ul>`
    )}

    ${section(
      "motion",
      "Motion",
      `<div class="sg-grid sg-grid--2">
        <div>
          <h3 class="h3">Principles</h3>
          <ul class="sg-rules" role="list">
            <li>${icon("check")}<span><strong>Set down, then settle.</strong> Things arrive like goods placed on a market table: a soft drop with a small overshoot, never a snap.</span></li>
            <li>${icon("check")}<span><strong>Unhurried.</strong> Most moves take 0.6 to 1.3 seconds and are staggered so the eye can follow one thing at a time.</span></li>
            <li>${icon("check")}<span><strong>Borrowed from the market.</strong> Tags sway on their pegs, fruit rolls into place, wood slices turn, the plaid drifts as you scroll.</span></li>
            <li>${icon("check")}<span><strong>Quiet when idle.</strong> Ambient sways play once and come to rest within five seconds (WCAG 2.2.2).</span></li>
            <li>${icon("check")}<span><strong>Optional.</strong> Visitors who ask for reduced motion get the same page with no animation, and every element is visible without JavaScript.</span></li>
          </ul>
        </div>
        <div>
          <h3 class="h3">Tokens</h3>
          <div class="sg-table-wrap">
            <table class="sg-table">
              <caption class="visually-hidden">Motion tokens</caption>
              <thead><tr><th scope="col">Token</th><th scope="col">Value</th><th scope="col">Use</th></tr></thead>
              <tbody>
                <tr><td>ease.out</td><td><code>power3.out</code></td><td>Reveals and text</td></tr>
                <tr><td>ease.settle</td><td><code>back.out(1.5)</code></td><td>Packages, cards, fruit</td></tr>
                <tr><td>ease.sway</td><td><code>sine.inOut</code></td><td>Idle sway and bob</td></tr>
                <tr><td>ease.curtain</td><td><code>power3.inOut</code></td><td>Page curtain, panel wipes</td></tr>
                <tr><td>duration.quick</td><td>0.45s</td><td>Menus, small UI</td></tr>
                <tr><td>duration.base</td><td>0.9s</td><td>Most reveals</td></tr>
                <tr><td>duration.slow</td><td>1.3s</td><td>Script kicker, panels, photos</td></tr>
                <tr><td>stagger</td><td>0.05 to 0.14s</td><td>Words, cards, lists</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <h3 class="h3">Try it</h3>
      <div class="sg-motion-demo">
        <div class="sg-motion-demo__stage" aria-hidden="true">
          <img class="sg-md-pkg" src="/assets/img/products/bag-clips.webp" alt="" style="transform:rotate(-5deg)">
          <img class="sg-md-pkg" src="/assets/img/products/utensil-rest.webp" alt="" style="transform:rotate(3deg)">
          <img class="sg-md-pkg" src="/assets/img/products/funnels.webp" alt="" style="transform:rotate(7deg)">
          <div class="sg-md-tile" style="background-image:url(/assets/img/patterns/orange.webp)"></div>
        </div>
        <button class="btn" type="button" id="sg-motion-play">Replay the motion</button>
        <p class="small" id="sg-motion-note">Packages settle, then sway once. The orange print rolls in.</p>
      </div>
      <h3 class="h3">Where it is used</h3>
      <ul class="sg-rules" role="list">
        <li>${icon("check")}<span><strong>Page curtain</strong>: the cornflower cover with the plaid edge and badge rises when you follow a link and lifts away on the next page.</span></li>
        <li>${icon("check")}<span><strong>Hero</strong>: the script kicker writes itself in, the headline rises word by word, the packages are set down and sway.</span></li>
        <li>${icon("check")}<span><strong>Scroll</strong>: section headings and copy rise in, product cards are laid out one by one, material swatches turn, the plaid drifts and fruit spots float with gentle parallax.</span></li>
        <li>${icon("check")}<span><strong>Collection</strong>: each product panel opens like an arch window, and the jump menu marks the product in view.</span></li>
        <li>${icon("check")}<span><strong>Interface</strong>: FAQ answers open smoothly, and the mobile menu and language menu ease in.</span></li>
      </ul>
      <p class="small">Built with GSAP 3.13 and ScrollTrigger, self hosted in <code>public/assets/js/vendor/</code>. All motion lives in <code>public/assets/js/motion.js</code>.</p>`,
      "Motion should feel like a slow Saturday morning at the market. It adds warmth, never urgency."
    )}

    ${section(
      "voice",
      "Voice and copy",
      `<div class="sg-grid sg-grid--2">
        <div>
          <h3 class="h3">How we sound</h3>
          <ul class="sg-rules" role="list">
            <li>${icon("check")}<span><strong>Warm and neighborly</strong>, like the person behind the farm stand.</span></li>
            <li>${icon("check")}<span><strong>Concrete.</strong> Name real foods, real moments and real materials.</span></li>
            <li>${icon("check")}<span><strong>Short sentences.</strong> Plain words. One idea at a time.</span></li>
            <li>${icon("check")}<span><strong>Honest.</strong> Only claim what the product and packaging support.</span></li>
          </ul>
        </div>
        <div>
          <h3 class="h3">House rules</h3>
          <ul class="sg-dont" role="list">
            <li>${icon("cross")}<span><strong>No em dashes or en dashes.</strong> Use a period, a comma or a colon instead. The build fails if one appears in the site copy.</span></li>
            <li>${icon("cross")}<span>No filler words like "elevate", "curated", "seamless" or "game changer".</span></li>
            <li>${icon("cross")}<span>No "Whether you're..." openers or stacked lists of three adjectives.</span></li>
            <li>${icon("cross")}<span>No exclamation marks in headlines.</span></li>
          </ul>
        </div>
      </div>
      <div class="sg-example">
        <p><span class="sg-tag sg-tag--fail">${icon("cross")}Avoid</span> Elevate your kitchen with curated tools that seamlessly blend form and function.</p>
        <p><span class="sg-tag sg-tag--pass">${icon("check")}Write</span> Honest materials, cheerful color and tools that earn their spot by the stove.</p>
      </div>`
    )}

    ${section(
      "i18n",
      "Translation",
      `<p>The site is published in ${locales.map((l) => `<strong>${esc(l.name)}</strong>`).join(", ")}. Every word of public copy lives in <code>src/i18n/&lt;language&gt;.json</code>; the templates contain no text of their own.</p>
      <ol class="sg-steps">
        <li>Copy <code>src/i18n/en.json</code> to a new file named with the language code, for example <code>src/i18n/de.json</code>.</li>
        <li>Translate the values (never the keys). Anything left out falls back to English, and the build lists what is missing.</li>
        <li>Add the language to <code>"locales"</code> in <code>src/site.json</code> with its name, hreflang and Open Graph locale.</li>
        <li>Run <code>npm run build</code> and <code>npm run og</code>. Pages, hreflang tags, the sitemap, the language menu and the share images are all generated.</li>
      </ol>
      <p>Visitors are never redirected. If their browser prefers a language we publish, a small banner offers it once and remembers the choice.</p>`
    )}

    ${section(
      "seo",
      "SEO and sharing",
      `<p>Every page has a unique title (60 characters or fewer), a meta description (160 or fewer), a canonical URL, hreflang alternates, Open Graph and Twitter tags, structured data and a 1200 × 630 share image in its own language. The build checks the lengths below.</p>
      <ul class="sg-og" role="list">
        ${locales
          .flatMap((l) => PAGES.map((p) => `<li><img src="${ogImage(l.code, p.key)}" alt="${esc(t(l.code, `meta.ogAlt.${p.key}`))}" width="1200" height="630" loading="lazy"><p><strong>${l.code.toUpperCase()}</strong> ${esc(t(l.code, `meta.${p.key}.title`))}</p></li>`))
          .join("\n        ")}
      </ul>
      <div class="sg-table-wrap">
        <table class="sg-table">
          <caption class="visually-hidden">Titles and descriptions for every page</caption>
          <thead><tr><th scope="col">Lang</th><th scope="col">Page</th><th scope="col">Title</th><th scope="col">Description</th></tr></thead>
          <tbody>
            ${metaRows()}
          </tbody>
        </table>
      </div>`
    )}`;

  return `<!doctype html>
<html lang="en" class="no-js">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Brand Style Guide | Winslow Pantry (internal)</title>
  <meta name="robots" content="noindex, nofollow, noarchive">
  <meta name="description" content="Internal Winslow Pantry brand style guide.">
  <link rel="icon" href="/favicon.ico" sizes="32x32">
  <link rel="icon" href="/assets/img/brand/icon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/css/tokens.css">
  <link rel="stylesheet" href="/assets/css/site.css">
  <link rel="stylesheet" href="/assets/css/styleguide.css">
  <script src="/assets/js/vendor/gsap.min.js" defer></script>
  <script src="/assets/js/main.js" defer></script>
  <script src="/assets/js/styleguide.js" defer></script>
</head>
<body class="sg">
  <a class="skip-link" href="#main">Skip to main content</a>
  ${sprite()}
  <svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
    <filter id="protanopia"><feColorMatrix type="matrix" values="0.152286 1.052583 -0.204868 0 0  0.114503 0.786281 0.099216 0 0  -0.003882 -0.048116 1.051998 0 0  0 0 0 1 0"/></filter>
    <filter id="deuteranopia"><feColorMatrix type="matrix" values="0.367322 0.860646 -0.227968 0 0  0.280085 0.672501 0.047413 0 0  -0.011820 0.042940 0.968881 0 0  0 0 0 1 0"/></filter>
    <filter id="tritanopia"><feColorMatrix type="matrix" values="1.255528 -0.076749 -0.178779 0 0  -0.078411 0.930809 0.147602 0 0  0.004733 0.691367 0.303900 0 0  0 0 0 1 0"/></filter>
    <filter id="achromatopsia"><feColorMatrix type="matrix" values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0"/></filter>
  </svg>
  <header class="sg-header">
    <div class="sg-header__inner">
      <a class="brand" href="#intro"><img src="/assets/img/brand/logo.svg" width="474" height="301" alt="Winslow Pantry"></a>
      <p class="sg-header__title">Brand style guide <span>Internal</span></p>
      <a class="btn btn--ghost sg-header__site" href="/">View the site</a>
    </div>
    <div class="plaid plaid--sm" aria-hidden="true"></div>
  </header>
  <div class="sg-layout">
    <nav class="sg-nav" aria-label="Style guide sections">
      <ul role="list">
        ${NAV.map(([id, label]) => `<li><a href="#${id}">${label}</a></li>`).join("\n        ")}
      </ul>
    </nav>
    <main id="main" class="sg-main" tabindex="-1">
${body}
    </main>
  </div>
</body>
</html>
`;
}
