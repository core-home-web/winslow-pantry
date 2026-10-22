// Winslow Pantry: static page generator.
// Renders every public page once per locale into /public, plus the sitemap,
// robots.txt, localized 404 pages and the internal style guide.
// Run with `npm run build` after editing copy (src/i18n), data or templates.

import { writeFileSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { root, site, products, DEFAULT, PAGES, locales, missing, t, tList, localeRoot, pageUrl, abs, ogImage, esc } from "./lib.mjs";
import { icon, sprite } from "./icons.mjs";
import { styleguide } from "./styleguide.mjs";

const out = join(root, "public");
const YEAR = new Date().getFullYear();

function write(path, html) {
  const file = join(out, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
  console.log("  wrote", path);
}

/* ------------------------------------------------------------- head/seo */
// Runs before first paint. Turns motion on only for visitors who have not asked
// for reduced motion, carries the page curtain across navigations, and reveals
// the page after 2.5s if the animation scripts never load.
const MOTION_BOOT = `(function(r){try{if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;r.classList.add("motion");if(sessionStorage.getItem("wp-curtain")){sessionStorage.removeItem("wp-curtain");r.classList.add("curtain-in")}setTimeout(function(){r.classList.add("motion-ready");r.classList.remove("curtain-in")},2500)}catch(e){}})(document.documentElement)`;

function head(L, key, { noindex = false, metaKey = key } = {}) {
  const title = t(L, `meta.${metaKey}.title`);
  const description = t(L, `meta.${metaKey}.description`);
  const ogKey = key === "notFound" ? "home" : key;
  const loc = locales.find((l) => l.code === L);
  const indexable = !noindex;
  const alternates = indexable
    ? [
        ...locales.map((l) => `<link rel="alternate" hreflang="${l.hreflang}" href="${abs(pageUrl(l.code, key))}">`),
        `<link rel="alternate" hreflang="x-default" href="${abs(pageUrl(DEFAULT, key))}">`,
      ].join("\n  ")
    : "";
  const url = indexable ? abs(pageUrl(L, key)) : abs(localeRoot(L));
  return `<meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  ${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${url}">\n  ${alternates}`}
  <meta name="theme-color" content="${site.themeColor}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${esc(site.name)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:locale" content="${loc.og}">
  ${locales.filter((l) => l.code !== L).map((l) => `<meta property="og:locale:alternate" content="${l.og}">`).join("\n  ")}
  <meta property="og:image" content="${abs(ogImage(L, ogKey))}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${esc(t(L, `meta.ogAlt.${ogKey}`))}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${abs(ogImage(L, ogKey))}">
  <meta name="twitter:image:alt" content="${esc(t(L, `meta.ogAlt.${ogKey}`))}">
  <link rel="icon" href="/favicon.ico" sizes="32x32">
  <link rel="icon" href="/assets/img/brand/icon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="preload" href="/assets/fonts/instrument-sans-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/playfair-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/assets/css/tokens.css">
  <link rel="stylesheet" href="/assets/css/site.css">
  <script>${MOTION_BOOT}</script>
  <script src="/assets/js/vendor/gsap.min.js" defer></script>
  <script src="/assets/js/vendor/ScrollTrigger.min.js" defer></script>
  <script src="/assets/js/motion.js" defer></script>
  <script src="/assets/js/main.js" defer></script>`;
}

function jsonLd(L, key) {
  const name = site.name;
  const home = abs(localeRoot(L));
  const graph = [];
  if (key === "home") {
    graph.push(
      { "@type": "Organization", "@id": `${abs("/")}#org`, name, url: abs("/"), logo: abs("/assets/img/brand/logo-512.png") },
      { "@type": "WebSite", "@id": `${abs("/")}#site`, name, url: home, inLanguage: L, publisher: { "@id": `${abs("/")}#org` } }
    );
  }
  graph.push({
    "@type": key === "collection" ? "CollectionPage" : key === "contact" ? "ContactPage" : key === "story" ? "AboutPage" : "WebPage",
    "@id": `${abs(pageUrl(L, key))}#page`,
    url: abs(pageUrl(L, key)),
    name: t(L, `meta.${key}.title`),
    description: t(L, `meta.${key}.description`),
    inLanguage: L,
    isPartOf: { "@id": `${abs("/")}#site` },
    primaryImageOfPage: abs(ogImage(L, key)),
  });
  if (key !== "home") {
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: t(L, "global.footerHome"), item: home },
        { "@type": "ListItem", position: 2, name: t(L, `global.nav.${key}`), item: abs(pageUrl(L, key)) },
      ],
    });
  }
  return `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c")}</script>`;
}

/* --------------------------------------------------------------- layout */
function langSwitch(L, key) {
  const cur = locales.find((l) => l.code === L);
  return `<details class="lang">
          <summary class="lang__toggle">${icon("globe")}<span class="lang__current">${esc(cur.name)}</span><span class="visually-hidden">. ${esc(t(L, "global.languageMenu"))}</span>${icon("chevron", "lang__chev")}</summary>
          <ul class="lang__menu" role="list">
            ${locales
              .map(
                (l) =>
                  `<li><a class="lang__link" href="${pageUrl(l.code, key)}" hreflang="${l.hreflang}" lang="${l.hreflang}" data-lang="${l.code}"${l.code === L ? ' aria-current="true"' : ""}>${icon("check", "lang__check")}${esc(l.name)}</a></li>`
              )
              .join("\n            ")}
          </ul>
        </details>`;
}

function header(L, key) {
  const nav = PAGES.filter((p) => p.key !== "home");
  return `<header class="site-header">
    <div class="container site-header__inner">
      <a class="brand" href="${localeRoot(L)}" aria-label="${esc(t(L, "global.homeLabel"))}">
        <img src="/assets/img/brand/logo.svg" width="474" height="301" alt="">
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">
        <span class="nav-toggle__bars" aria-hidden="true"><span></span><span></span><span></span></span>
        <span class="nav-toggle__label">${esc(t(L, "global.menu"))}</span>
      </button>
      <div class="site-nav" id="site-nav">
        <nav aria-label="${esc(t(L, "global.primaryNav"))}">
          <ul class="site-nav__list" role="list">
            ${nav.map((p) => `<li><a class="site-nav__link" href="${pageUrl(L, p.key)}"${p.key === key ? ' aria-current="page"' : ""}>${esc(t(L, `global.nav.${p.key}`))}</a></li>`).join("\n            ")}
          </ul>
        </nav>
        ${langSwitch(L, key)}
      </div>
    </div>
  </header>`;
}

function footer(L, key) {
  return `<footer class="site-footer">
    <div class="gingham gingham--footer" aria-hidden="true"></div>
    <div class="container site-footer__grid">
      <div class="site-footer__brand">
        <img src="/assets/img/brand/logo-white.svg" width="474" height="301" alt="${esc(site.name)}">
        <p>${esc(t(L, "global.footerTagline"))}</p>
      </div>
      <div>
        <h2 class="site-footer__title">${esc(t(L, "global.footerExplore"))}</h2>
        <ul role="list">
          ${PAGES.map((p) => `<li><a href="${pageUrl(L, p.key)}">${esc(p.key === "home" ? t(L, "global.footerHome") : t(L, `global.nav.${p.key}`))}</a></li>`).join("\n          ")}
        </ul>
      </div>
      <div>
        <h2 class="site-footer__title">${esc(t(L, "global.footerHello"))}</h2>
        <ul role="list">
          <li><a href="${pageUrl(L, "contact")}">${esc(t(L, "global.nav.contact"))}</a></li>
        </ul>
      </div>
      <div>
        <h2 class="site-footer__title" id="footer-lang">${esc(t(L, "global.language"))}</h2>
        <ul role="list" aria-labelledby="footer-lang">
          ${locales.map((l) => `<li><a href="${pageUrl(l.code, key)}" hreflang="${l.hreflang}" lang="${l.hreflang}" data-lang="${l.code}"${l.code === L ? ' aria-current="true"' : ""}>${esc(l.name)}</a></li>`).join("\n          ")}
        </ul>
      </div>
    </div>
    <div class="container site-footer__base">
      <p>${esc(t(L, "global.copyright", { year: YEAR }))}</p>
    </div>
  </footer>`;
}

// Per-language strings for the "also available in your language" banner.
function langData(L, key) {
  const data = Object.fromEntries(
    locales.map((l) => [l.code, { text: t(l.code, "global.suggest"), link: t(l.code, "global.suggestLink"), dismiss: t(l.code, "global.suggestDismiss"), href: pageUrl(l.code, key) }])
  );
  return `<script type="application/json" id="lang-data">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
}

function page(L, key, body, { noindex = false, bodyClass = "" } = {}) {
  const metaKey = key;
  const navKey = key === "notFound" ? "home" : key;
  return `<!doctype html>
<html lang="${locales.find((l) => l.code === L).hreflang}" class="no-js">
<head>
  ${head(L, navKey, { noindex, metaKey })}
  ${noindex ? "" : jsonLd(L, key)}
</head>
<body class="${bodyClass}">
  <a class="skip-link" href="#main">${esc(t(L, "global.skip"))}</a>
  ${sprite()}
  ${header(L, navKey)}
  <main id="main" tabindex="-1">
${body}
  </main>
  ${footer(L, navKey)}
  ${langData(L, navKey)}
</body>
</html>
`;
}

/* ----------------------------------------------------------- components */
const kicker = (text, cls = "") => `<p class="kicker ${cls}">${esc(text)}</p>`;
const arrowLink = (href, text, cls = "") => `<a class="text-link ${cls}" href="${href}">${esc(text)}${icon("arrow", "icon--inline")}</a>`;

function featureList(L, p, cls = "") {
  const labels = tList(L, `products.${p.slug}.features`);
  return `<ul class="features ${cls}" role="list">${labels.map((f, i) => `<li>${icon(p.features[i] || "check")}<span>${esc(f)}</span></li>`).join("")}</ul>`;
}

function productCard(L, p) {
  const P = (k) => t(L, `products.${p.slug}.${k}`);
  return `<li class="product-card">
          <div class="product-card__media panel panel--${p.panel}">
            <img src="${p.image.src}" width="${p.image.width}" height="${p.image.height}" alt="${esc(P("alt"))}" loading="lazy">
          </div>
          <div class="product-card__body">
            <p class="product-card__set">${esc(P("set"))}</p>
            <h3 class="product-card__name"><a href="${pageUrl(L, "collection")}#${p.slug}">${esc(P("name"))}</a></h3>
            <p>${esc(P("short"))}</p>
            <span class="product-card__more" aria-hidden="true">${esc(t(L, "global.seeDetails"))}${icon("arrow", "icon--inline")}</span>
          </div>
        </li>`;
}

function valuesList(L) {
  const icons = { charm: "sprig", function: "spoon", spirit: "sun" };
  return `<ul class="values" role="list">
        ${Object.keys(icons)
          .map((k) => `<li class="value">${icon(icons[k], "value__icon")}<h3>${esc(t(L, `home.values.${k}.name`))}</h3><p>${esc(t(L, `home.values.${k}.text`))}</p></li>`)
          .join("\n        ")}
      </ul>`;
}

function pageHero(L, ns, { art = "" } = {}) {
  return `<section class="hero hero--page" aria-labelledby="page-title">
      <div class="container hero__inner">
        <div class="hero__copy">
          ${kicker(t(L, `${ns}.heroKicker`), "kicker--on-blue")}
          <h1 class="display" id="page-title">${esc(t(L, `${ns}.heroTitle`))}</h1>
          <p class="lead">${esc(t(L, `${ns}.heroLead`))}</p>
        </div>
        ${art}
      </div>
      <div class="plaid plaid--sm" aria-hidden="true"></div>
    </section>`;
}

function ctaBand(L, { title, text, button, href, spot = "/assets/img/fruit/lemon.webp", w = 251, h = 161 }) {
  return `<section class="cta-band" aria-labelledby="cta-title">
      <div class="container cta-band__inner">
        <img class="cta-band__spot" src="${spot}" width="${w}" height="${h}" alt="" loading="lazy">
        <div class="cta-band__copy">
          <h2 id="cta-title">${esc(title)}</h2>
          <p>${esc(text)}</p>
        </div>
        <a class="btn btn--light" href="${href}">${esc(button)}${icon("arrow", "btn__icon")}</a>
      </div>
    </section>`;
}

/* ---------------------------------------------------------------- pages */
function home(L) {
  const H = (k) => t(L, `home.${k}`);
  const materials = [
    { k: "bamboo", style: "background-image:url(/assets/img/textures/bamboo.jpg)" },
    { k: "acacia", style: "background-image:url(/assets/img/textures/acacia.jpg)" },
    { k: "silicone", style: "", cls: "material__swatch--silicone", img: `<img src="/assets/img/products/spoon.webp" width="409" height="1871" alt="" loading="lazy">` },
  ];
  return `    <section class="hero hero--home" aria-labelledby="page-title">
      <div class="container hero__inner">
        <div class="hero__copy">
          ${kicker(H("heroKicker"), "kicker--on-blue")}
          <h1 class="display" id="page-title">${esc(H("heroTitle"))}</h1>
          <p class="lead">${esc(H("heroLead"))}</p>
          <div class="actions">
            <a class="btn" href="${pageUrl(L, "collection")}">${esc(H("heroCta"))}${icon("arrow", "btn__icon")}</a>
            <a class="btn btn--ghost" href="${pageUrl(L, "story")}">${esc(H("heroCta2"))}</a>
          </div>
        </div>
        <div class="hero__art" role="img" aria-label="${esc(H("heroAlt"))}">
          <img class="hero__pkg hero__pkg--a" src="/assets/img/products/bag-clips.webp" width="760" height="1190" alt="" fetchpriority="high">
          <img class="hero__pkg hero__pkg--b" src="/assets/img/products/utensil-rest.webp" width="640" height="873" alt="">
          <img class="hero__pkg hero__pkg--c" src="/assets/img/products/funnels.webp" width="640" height="1034" alt="">
          <img class="hero__fruit" src="/assets/img/fruit/blueberries.webp" width="289" height="274" alt="">
        </div>
      </div>
      <div class="plaid" aria-hidden="true"></div>
    </section>

    <section class="section section--paper story-intro" aria-labelledby="story-title">
      <div class="container split">
        <figure class="split__media photo-frame">
          <img src="/assets/img/photos/market.webp" width="832" height="795" alt="${esc(H("storyAlt"))}" loading="lazy">
        </figure>
        <div class="split__copy">
          ${kicker(H("storyKicker"))}
          <h2 class="h2" id="story-title">${esc(H("storyTitle"))}</h2>
          <p>${esc(H("storyP1"))}</p>
          <p>${esc(H("storyP2"))}</p>
          ${arrowLink(pageUrl(L, "story"), H("storyLink"))}
          <img class="story-intro__spot" src="/assets/img/fruit/blueberry-sprig.webp" width="185" height="176" alt="" loading="lazy">
        </div>
      </div>
    </section>

    <section class="section" aria-labelledby="collection-title">
      <div class="container">
        <div class="section-head">
          ${kicker(H("collectionKicker"))}
          <h2 class="h2" id="collection-title">${esc(H("collectionTitle"))}</h2>
          <p class="lead">${esc(H("collectionLead"))}</p>
        </div>
        <ul class="product-grid" role="list">
        ${products.map((p) => productCard(L, p)).join("\n        ")}
        </ul>
        <p class="section-foot"><a class="btn btn--ghost" href="${pageUrl(L, "collection")}">${esc(H("collectionCta"))}${icon("arrow", "btn__icon")}</a></p>
      </div>
    </section>

    <section class="section section--paper" aria-labelledby="materials-title">
      <div class="container">
        <div class="section-head">
          ${kicker(H("materialsKicker"))}
          <h2 class="h2" id="materials-title">${esc(H("materialsTitle"))}</h2>
        </div>
        <ul class="materials" role="list">
          ${materials
            .map(
              (m) => `<li class="material">
            <div class="material__swatch ${m.cls || ""}" style="${m.style}" aria-hidden="true">${m.img || ""}</div>
            <div><h3>${esc(H(`materials.${m.k}.name`))}</h3><p>${esc(H(`materials.${m.k}.text`))}</p></div>
          </li>`
            )
            .join("\n          ")}
        </ul>
      </div>
    </section>

    <section class="section section--blue" aria-labelledby="values-title">
      <div class="container">
        <div class="section-head">
          ${kicker(H("valuesKicker"), "kicker--on-blue")}
          <h2 class="h2" id="values-title">${esc(H("valuesTitle"))}</h2>
        </div>
        ${valuesList(L)}
      </div>
    </section>

    ${ctaBand(L, { title: H("partnerTitle"), text: H("partnerText"), button: H("partnerCta"), href: pageUrl(L, "contact") })}
`;
}

function story(L) {
  const S = (k) => t(L, `story.${k}`);
  return `    ${pageHero(L, "story", { art: `<img class="hero__spot" src="/assets/img/fruit/cherries.webp" width="183" height="176" alt="">` })}

    <section class="section section--paper" aria-labelledby="s1-title">
      <div class="container split">
        <figure class="split__media photo-frame">
          <img src="/assets/img/photos/market.webp" width="832" height="795" alt="${esc(t(L, "home.storyAlt"))}" loading="lazy">
        </figure>
        <div class="split__copy prose">
          <h2 class="h2" id="s1-title">${esc(S("s1Title"))}</h2>
          <p>${esc(S("s1P1"))}</p>
          <p>${esc(S("s1P2"))}</p>
        </div>
      </div>
    </section>

    <section class="quote-band">
      <div class="container">
        <figure class="quote">
          <img class="quote__spot" src="/assets/img/fruit/blueberries.webp" width="289" height="274" alt="" loading="lazy">
          <blockquote><p>${esc(S("quote"))}</p></blockquote>
          <figcaption>${esc(S("quoteSource"))}</figcaption>
        </figure>
      </div>
    </section>

    <section class="section" aria-labelledby="s2-title">
      <div class="container split split--reverse">
        <figure class="split__media">
          <img src="/assets/img/products/board-engraved.webp" width="900" height="696" alt="${esc(S("s3Alt"))}" loading="lazy">
        </figure>
        <div class="split__copy prose">
          <h2 class="h2" id="s2-title">${esc(S("s2Title"))}</h2>
          <p>${esc(S("s2P1"))}</p>
          <p>${esc(S("s2P2"))}</p>
        </div>
      </div>
    </section>

    <section class="section section--blue" aria-labelledby="values-title">
      <div class="container">
        <div class="section-head">
          ${kicker(t(L, "home.valuesKicker"), "kicker--on-blue")}
          <h2 class="h2" id="values-title">${esc(t(L, "home.valuesTitle"))}</h2>
        </div>
        ${valuesList(L)}
      </div>
    </section>

    ${ctaBand(L, { title: S("ctaTitle"), text: S("ctaText"), button: S("ctaButton"), href: pageUrl(L, "collection"), spot: "/assets/img/fruit/orange.webp", w: 221, h: 176 })}
`;
}

function collection(L) {
  const C = (k) => t(L, `collection.${k}`);
  return `    ${pageHero(L, "collection", { art: `<img class="hero__spot" src="/assets/img/fruit/lemon.webp" width="251" height="161" alt="">` })}

    <nav class="jump" aria-label="${esc(C("jump"))}">
      <div class="container">
        <ul class="jump__list" role="list">
          ${products.map((p) => `<li><a class="chip" href="#${p.slug}">${esc(t(L, `products.${p.slug}.name`))}</a></li>`).join("\n          ")}
        </ul>
      </div>
    </nav>

    ${products
      .map((p, i) => {
        const P = (k) => t(L, `products.${p.slug}.${k}`);
        return `<section class="product section${i % 2 ? " section--paper" : ""}" id="${p.slug}" aria-labelledby="${p.slug}-title">
      <div class="container product__inner${i % 2 ? " product__inner--reverse" : ""}">
        <div class="product__media panel panel--${p.panel}">
          <img src="${p.image.src}" width="${p.image.width}" height="${p.image.height}" alt="${esc(P("alt"))}"${i ? ' loading="lazy"' : ""}>
        </div>
        <div class="product__body">
          <p class="product__set">${esc(P("set"))}</p>
          <h2 class="h2" id="${p.slug}-title">${esc(P("name"))}</h2>
          <p class="lead">${esc(P("short"))}</p>
          <p>${esc(P("description"))}</p>
          <div class="product__details">
            <div>
              <h3 class="h4">${esc(C("features"))}</h3>
              ${featureList(L, p)}
            </div>
            <div>
              <h3 class="h4">${esc(C("included"))}</h3>
              <ul class="ticks" role="list">${tList(L, `products.${p.slug}.included`).map((x) => `<li>${icon("check")}<span>${esc(x)}</span></li>`).join("")}</ul>
              <h3 class="h4">${esc(C("care"))}</h3>
              <p class="small">${esc(P("care"))}</p>
            </div>
          </div>
        </div>
      </div>
    </section>`;
      })
      .join("\n\n    ")}

    ${ctaBand(L, { title: C("ctaTitle"), text: C("ctaText"), button: C("ctaButton"), href: pageUrl(L, "contact"), spot: "/assets/img/fruit/lime.webp", w: 234, h: 160 })}
`;
}

function contact(L) {
  const C = (k) => t(L, `contact.${k}`);
  const cards = { wholesale: "store", care: "spoon", press: "mail" };
  return `    ${pageHero(L, "contact", { art: `<img class="hero__spot" src="/assets/img/fruit/blueberry-sprig.webp" width="185" height="176" alt="">` })}

    <section class="section" aria-label="${esc(C("heroKicker"))}">
      <div class="container">
        <ul class="contact-cards" role="list">
          ${Object.entries(cards)
            .map(([k, ic]) => {
              // The Worker redirects /email to the inbox, so the address never appears in the page.
              const href = `/email?subject=${encodeURIComponent(C(`cards.${k}.subject`))}`;
              return `<li class="contact-card">
            ${icon(ic, "contact-card__icon")}
            <h2 class="h3">${esc(C(`cards.${k}.title`))}</h2>
            <p>${esc(C(`cards.${k}.text`))}</p>
            <a class="btn" href="${href}" rel="nofollow">${icon("mail", "btn__icon btn__icon--lead")}${esc(C(`cards.${k}.button`))}<span class="visually-hidden"> (${esc(C("opensEmail"))})</span></a>
          </li>`;
            })
            .join("\n          ")}
        </ul>
      </div>
    </section>

    <section class="section section--paper" aria-labelledby="faq-title">
      <div class="container container--narrow">
        <h2 class="h2" id="faq-title">${esc(C("faqTitle"))}</h2>
        <div class="faq">
          ${tList(L, "contact.faq")
            .map((f) => `<details class="faq__item"><summary>${esc(f.q)}${icon("chevron", "faq__chev")}</summary><p>${esc(f.a)}</p></details>`)
            .join("\n          ")}
        </div>
      </div>
    </section>
`;
}

function notFound(L) {
  const N = (k) => t(L, `notFound.${k}`);
  return `    <section class="hero hero--page hero--404" aria-labelledby="page-title">
      <div class="container hero__inner">
        <div class="hero__copy">
          ${kicker(N("kicker"), "kicker--on-blue")}
          <h1 class="display" id="page-title">${esc(N("title"))}</h1>
          <p class="lead">${esc(N("text"))}</p>
          <div class="actions">
            <a class="btn" href="${localeRoot(L)}">${esc(N("home"))}</a>
            <a class="btn btn--ghost" href="${pageUrl(L, "collection")}">${esc(N("collection"))}</a>
          </div>
        </div>
        <img class="hero__spot" src="/assets/img/fruit/blueberries.webp" width="289" height="274" alt="">
      </div>
      <div class="plaid" aria-hidden="true"></div>
    </section>
`;
}

const RENDER = { home, story, collection, contact };

/* ---------------------------------------------------------------- build */
console.log("Building Winslow Pantry");
for (const [code, keys] of Object.entries(missing)) {
  if (keys.length) console.warn(`! ${code}: ${keys.length} untranslated keys fall back to English:\n    ${keys.join("\n    ")}`);
}

const built = [];
for (const { code: L } of locales) {
  const base = L === DEFAULT ? "" : `${L}/`;
  for (const p of PAGES) {
    const file = `${base}${p.path}index.html`;
    write(file, page(L, p.key, RENDER[p.key](L), { bodyClass: `page-${p.key}` }));
    built.push(file);
  }
  write(`${base}404.html`, page(L, "notFound", notFound(L), { noindex: true, bodyClass: "page-404" }));
  built.push(`${base}404.html`);
}

write("styleguide/index.html", styleguide());
built.push("styleguide/index.html");

// Sitemap with hreflang alternates for every page.
write(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${locales
  .flatMap((l) =>
    PAGES.map(
      (p) => `  <url>
    <loc>${abs(pageUrl(l.code, p.key))}</loc>
${locales.map((a) => `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${abs(pageUrl(a.code, p.key))}"/>`).join("\n")}
    <xhtml:link rel="alternate" hreflang="x-default" href="${abs(pageUrl(DEFAULT, p.key))}"/>
  </url>`
    )
  )
  .join("\n")}
</urlset>
`
);

write("robots.txt", `User-agent: *\nDisallow: /styleguide/\nDisallow: /email\n\nSitemap: ${abs("/sitemap.xml")}\n`);

write(
  "site.webmanifest",
  JSON.stringify(
    {
      name: site.name,
      short_name: site.name,
      start_url: "/",
      display: "browser",
      background_color: "#F2E3CE",
      theme_color: site.themeColor,
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/assets/img/brand/logo-512.png", sizes: "512x512", type: "image/png" },
      ],
    },
    null,
    2
  ) + "\n"
);

/* ---------------------------------------------------------- copy checks */
// House style: no em dashes or en dashes anywhere in the site copy.
// They read as machine written, so the build fails if one sneaks in.
const DASHES = /[\u2014\u2013]/;
const problems = [];
for (const f of readdirSync(join(root, "src/i18n"))) {
  readFileSync(join(root, "src/i18n", f), "utf8")
    .split("\n")
    .forEach((line, i) => DASHES.test(line) && problems.push(`src/i18n/${f}:${i + 1}: ${line.trim()}`));
}
for (const f of built) {
  const text = readFileSync(join(out, f), "utf8").replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "");
  if (DASHES.test(text)) problems.push(`public/${f}: contains an em or en dash`);
}
// Every page needs a title and description that fit in search results.
for (const { code: L } of locales) {
  for (const key of [...PAGES.map((p) => p.key), "notFound"]) {
    const title = t(L, `meta.${key}.title`);
    const desc = t(L, `meta.${key}.description`);
    if (title.length > 60) problems.push(`${L} meta.${key}.title is ${title.length} characters (keep it to 60)`);
    if (desc.length > 160) problems.push(`${L} meta.${key}.description is ${desc.length} characters (keep it to 160)`);
  }
}
if (problems.length) {
  console.error("\nCopy check failed:\n  " + problems.join("\n  "));
  process.exit(1);
}
console.log(`Done: ${built.length} pages in ${locales.length} languages.`);
