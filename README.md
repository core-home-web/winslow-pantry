# Winslow Pantry

Brochure website for **Winslow Pantry**, built from the *Winslow Pantry Brand Guidelines*. It is a static site served by the Cloudflare Worker `winslow-pantry`, published in English, Spanish and French.

## Pages

| Path | Page |
| --- | --- |
| `/` | Home: brand story, the collection, materials and values |
| `/collection/` | Every product with features, what's included and care |
| `/our-story/` | The brand story in long form |
| `/contact/` | Wholesale, product and press contacts, plus FAQ |
| `/es/...`, `/fr/...` | The same pages in Spanish and French |
| `/styleguide/` | **Internal** brand style guide, password protected |

## How it's built

- `src/i18n/<lang>.json` holds every word of public copy. The templates contain no text of their own.
- `src/site.json` holds the site URL, the public contact email (`contactEmail`, shown in the footer and on the Contact page), the inbox the Contact page topic buttons send to (`inquiryEmail`) and the list of published languages.
- `src/data/products.json` holds product images and feature icons (the words are in the i18n files), plus the print names and the print for each product. Prints are internal: they appear only in the style guide, never in public copy.
- `scripts/build.mjs` renders every page in every language into `public/`, along with `sitemap.xml`, `robots.txt`, the web manifest and translated 404 pages. Run `npm run build` after any change. The generated HTML is committed, and `wrangler deploy` also runs the build first.
- `scripts/styleguide.mjs` renders the internal style guide.
- `scripts/og.mjs` renders the 1200 × 630 share images (one per page per language) into `public/assets/og/`.
- `src/worker.js` serves the static files and puts Basic Auth in front of `/styleguide/`.

### Build checks

The build fails if:

- an em dash or en dash appears anywhere in the copy (house style: use a period, comma or colon instead), or
- a page title is longer than 60 characters or a meta description is longer than 160.

It also lists any keys a translation is missing; those fall back to English.

## SEO and sharing

Each page gets a unique title and meta description, a canonical URL, `hreflang` alternates for every language plus `x-default`, Open Graph and Twitter Card tags with a localized share image, and JSON-LD structured data (Organization, WebSite, page type and breadcrumbs). The sitemap lists every page with its language alternates.

**Before launch:** set `"url"` in `src/site.json` to the real domain (it is used for canonical URLs, share images and the sitemap), confirm `"contactEmail"`, then run `npm run build` and `npm run og`.

## Translation

1. Copy `src/i18n/en.json` to `src/i18n/<code>.json` and translate the values (never the keys).
2. Add the language to `"locales"` in `src/site.json` with its name, `hreflang` and Open Graph locale.
3. Run `npm run build` and `npm run og`.

The language menu, footer links, hreflang tags, sitemap and share images pick up the new language automatically. Visitors are never redirected; if their browser prefers another published language, a small banner offers it once and remembers the choice.

## Motion

Animations use [GSAP](https://gsap.com) 3.13 with ScrollTrigger, self hosted in `public/assets/js/vendor/` (GSAP's free standard license). Everything lives in `public/assets/js/motion.js`:

- a cornflower page curtain with the plaid edge and badge that rises on exit and lifts on arrival,
- a hero intro (the script kicker writes in, the headline rises word by word, packages are set down and sway),
- scroll reveals: cards laid out one by one, material swatches turning, a drifting plaid and gentle parallax on fruit,
- arch-window reveals and an "in view" marker on the Collection page, plus smooth FAQ and menu transitions.

Motion follows the brand: unhurried, eased and settling. A tiny script in `<head>` turns it on only when the visitor has not asked for reduced motion, ambient sways come to rest within five seconds (WCAG 2.2.2), and the page stays fully visible without JavaScript. The style guide's Motion section lists the easing and timing tokens and has a replay demo.

## Accessibility and color blindness

The brand colors are used exactly as specified in the guide. Accessibility comes from how they are paired, not from changing them:

- Body text is always Ink (433 C) or white on Harbor (7698 C) and Ink. All public pages pass an automated WCAG 2.2 AA audit (axe).
- Meaning never depends on color alone: product colors are named in text, links are underlined, the current page is marked with an underline, and the style guide's contrast ratings use words and symbols.
- Small link text uses "Harbor deep" (`#33607A`), a darker step of 7698 C, only where 7698 C would fall short of 4.5:1.
- Visible focus outlines everywhere, and support for reduced motion, higher contrast and forced colors.
- The style guide has a color vision preview (protanopia, deuteranopia, tritanopia, achromatopsia).

## Style guide access

The style guide is for internal use only. It is left out of all navigation and the sitemap, marked `noindex`, disallowed in `robots.txt`, and gated by the Worker. To enable access, set a password on the Worker:

```sh
npx wrangler secret put STYLEGUIDE_PASSWORD   # username is "winslow" (override with STYLEGUIDE_USER)
```

Until a password is set, `/styleguide/` returns a locked message.

## Develop

```sh
npm install
echo 'STYLEGUIDE_PASSWORD="local"' > .dev.vars
npm run dev      # builds, then serves at http://localhost:8787
```

To regenerate share images (needs Playwright, which is not a project dependency):

```sh
npm i --no-save playwright && npx playwright install chromium
npm run og
```

## Deploy

Connect the repository to Cloudflare Workers Builds; a push to `main` then runs `npx wrangler deploy`.

## Fonts

The brand typefaces, **Begum Bold** and **Quimby Mayoral**, are listed first in the font stacks in `public/assets/css/tokens.css`, so adding licensed web fonts makes them take over automatically. Until then the site self-hosts the open-source stand-ins **Playfair Display**, **Yellowtail** and **Instrument Sans** (see `public/assets/fonts/LICENSE.md`).
