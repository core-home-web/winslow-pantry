// Winslow Pantry: motion. Built on GSAP + ScrollTrigger.
//
// The feeling is a slow Saturday at the market: things are set down on the
// table and settle, tags sway a little on their pegs, fruit rolls into place.
// Nothing snaps, flashes or loops fast. Everything is skipped when the visitor
// prefers reduced motion (the head script never adds the "motion" class), and
// the page is fully visible without JavaScript.

(() => {
  const root = document.documentElement;
  const ready = () => root.classList.add("motion-ready");
  if (!root.classList.contains("motion") || !window.gsap || !window.ScrollTrigger) {
    root.classList.remove("curtain-in");
    ready();
    return;
  }

  const { gsap, ScrollTrigger } = window;
  const arriving = root.classList.contains("curtain-in");
  // Visible from here on; every tween below sets its own starting state.
  ready();
  gsap.registerPlugin(ScrollTrigger);

  // Brand motion tokens (documented in the style guide).
  const EASE = { out: "power3.out", settle: "back.out(1.5)", sway: "sine.inOut", curtain: "power3.inOut" };
  const DUR = { quick: 0.45, base: 0.9, slow: 1.3 };
  gsap.defaults({ ease: EASE.out, duration: DUR.base });

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  // Ambient motion: one slow sway out and back, finished well within the
  // five seconds WCAG 2.2.2 allows for movement that has no pause control.
  const sway = (targets, vars) => gsap.to(targets, { ease: EASE.sway, yoyo: true, repeat: 1, ...vars });
  const reveal = (targets, vars, trigger) => {
    const els = Array.isArray(targets) ? targets : $$(targets);
    if (!els.length) return;
    gsap.from(els, { y: 32, autoAlpha: 0, stagger: 0.1, ...vars, scrollTrigger: { trigger: trigger || els[0], start: "top 85%", once: true } });
  };

  /* ------------------------------------------------ page curtain */
  // A cornflower panel with the plaid leading edge and the badge, like the
  // cover of the brand guide. It lifts away on arrival and rises on exit.
  const curtain = document.createElement("div");
  curtain.className = "curtain";
  curtain.setAttribute("aria-hidden", "true");
  curtain.innerHTML = '<img src="/assets/img/brand/logo.svg" alt="" width="170">';
  document.body.appendChild(curtain);

  // GSAP owns the curtain's transform; it is positioned before the first paint.
  if (arriving) {
    gsap.set(curtain, { y: 0, yPercent: 0 });
    root.classList.remove("curtain-in");
    gsap.to(curtain, { yPercent: -100, duration: 0.85, ease: EASE.curtain, delay: 0.05 });
  } else {
    gsap.set(curtain, { y: 0, yPercent: 100 });
  }

  const sameSite = (a) =>
    a.origin === location.origin &&
    !a.hasAttribute("download") &&
    (!a.target || a.target === "_self") &&
    !a.pathname.startsWith("/styleguide") &&
    !(a.pathname === location.pathname && a.hash);

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!sameSite(a) || a.href === location.href) return;
    e.preventDefault();
    try { sessionStorage.setItem("wp-curtain", "1"); } catch {}
    gsap.fromTo(curtain, { yPercent: 100 }, { yPercent: 0, duration: 0.6, ease: EASE.curtain, onComplete: () => (location.href = a.href) });
  });
  // Coming back with the browser's back button restores a frozen page; lower the curtain.
  window.addEventListener("pageshow", (e) => { if (e.persisted) gsap.set(curtain, { yPercent: 100 }); });

  /* -------------------------------------------------- split text */
  // Wraps each word so headlines can rise line by line. Headings keep their
  // text as one phrase for screen readers through aria-label.
  function splitWords(el, { label = true } = {}) {
    if (!el || el.dataset.split) return [];
    el.dataset.split = "1";
    if (label) el.setAttribute("aria-label", el.textContent.trim());
    const hide = label ? ' aria-hidden="true"' : "";
    const words = el.textContent.trim().split(/ +/);
    el.innerHTML = words.map((w) => `<span class="word"${hide}><span class="word__inner">${w.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</span></span>`).join(" ");
    return $$(".word__inner", el);
  }

  /* --------------------------------------------------------- hero */
  const hero = $(".hero");
  if (hero) {
    const tl = gsap.timeline({ delay: arriving ? 0.35 : 0.1 });
    const kicker = $(".hero .kicker");
    const words = splitWords($(".hero h1"));
    if (kicker) tl.fromTo(kicker, { clipPath: "inset(-20% 100% -20% 0)", autoAlpha: 1 }, { clipPath: "inset(-20% 0% -20% 0)", duration: DUR.slow, ease: "power1.inOut" }, 0);
    if (words.length) tl.from(words, { yPercent: 110, rotate: 3, duration: DUR.base, stagger: 0.055 }, 0.2);
    tl.from($$(".hero .lead, .hero .actions > *"), { y: 18, autoAlpha: 0, stagger: 0.1 }, 0.55);

    // Packages are set down on the table, then sway gently on their pegs.
    const pkgs = $$(".hero__pkg");
    if (pkgs.length) {
      tl.from(pkgs, { y: -70, rotation: "+=10", autoAlpha: 0, duration: 1.1, ease: EASE.settle, stagger: 0.14 }, 0.35);
      tl.add(() => pkgs.forEach((p, i) => sway(p, { rotation: `+=${i % 2 ? -1.6 : 1.6}`, duration: 1.8 + i * 0.3 })));
    }
    const fruit = $$(".hero__fruit, .hero__spot");
    if (fruit.length) {
      tl.from(fruit, { scale: 0.5, rotation: -25, autoAlpha: 0, duration: 1, ease: EASE.settle }, 0.8);
      tl.add(() => sway(fruit, { y: -10, rotation: "+=3", duration: 2.2 }));
    }
  }

  /* -------------------------------------------- plaid and parallax */
  $$(".plaid").forEach((p) =>
    gsap.fromTo(p, { backgroundPosition: "0px 0px" }, { backgroundPosition: "-180px 0px", ease: "none", scrollTrigger: { trigger: p, start: "top bottom", end: "bottom top", scrub: 0.6 } })
  );
  $$(".story-intro__spot, .quote__spot, .cta-band__spot").forEach((el) =>
    gsap.fromTo(el, { y: 30 }, { y: -30, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.8 } })
  );

  /* ------------------------------------------------ section reveals */
  $$(".section-head").forEach((h) => reveal($$(":scope > *", h), {}, h));
  $$(".split").forEach((s) => {
    const frame = $(".photo-frame", s);
    if (frame) gsap.from(frame, { rotation: "-=6", y: 50, autoAlpha: 0, duration: DUR.slow, ease: EASE.settle, scrollTrigger: { trigger: s, start: "top 80%", once: true } });
    const media = $(".split__media:not(.photo-frame) img", s);
    if (media) gsap.from(media, { x: 60, rotation: 4, autoAlpha: 0, duration: DUR.slow, scrollTrigger: { trigger: s, start: "top 80%", once: true } });
    reveal($$(".split__copy > :not(.story-intro__spot)", s), { stagger: 0.09 }, s);
  });

  // Product cards are laid out on the table one after another.
  gsap.set(".product-card", { autoAlpha: 0 });
  ScrollTrigger.batch(".product-card", {
    start: "top 88%",
    once: true,
    onEnter: (batch) => gsap.fromTo(batch, { y: 60, autoAlpha: 0, rotation: (i) => (i % 2 ? 1.5 : -1.5) }, { y: 0, autoAlpha: 1, rotation: 0, duration: 1, stagger: 0.1, ease: EASE.settle }),
  });

  // Material swatches turn in like a slice of wood on a lathe.
  $$(".material").forEach((m, i) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: m, start: "top 88%", once: true }, delay: i * 0.08 });
    tl.from($(".material__swatch", m), { rotation: -140, scale: 0.6, autoAlpha: 0, duration: 1.1, ease: EASE.settle }).from($$("h3, p", m), { y: 16, autoAlpha: 0, stagger: 0.08, duration: 0.7 }, 0.25);
  });

  reveal(".value", { y: 46, stagger: 0.12, duration: 1 });
  $$(".value__icon").forEach((ic, i) =>
    sway(ic, { rotation: 8, transformOrigin: "50% 100%", duration: 1.4, delay: 0.5 + i * 0.15, scrollTrigger: { trigger: ic, start: "top 85%", once: true } })
  );

  $$(".cta-band").forEach((band) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: band, start: "top 85%", once: true } });
    const spot = $(".cta-band__spot", band);
    if (spot) tl.from(spot, { x: -120, rotation: -200, autoAlpha: 0, duration: 1.3, ease: EASE.settle });
    tl.from($$(".cta-band__copy > *, .cta-band .btn", band), { y: 20, autoAlpha: 0, stagger: 0.1, duration: 0.8 }, 0.25);
  });

  // Story quote: the words arrive one at a time as you read.
  const quote = $(".quote blockquote p");
  if (quote) {
    const words = splitWords(quote, { label: false });
    gsap.fromTo(words, { autoAlpha: 0.15 }, { autoAlpha: 1, stagger: 0.08, ease: "none", scrollTrigger: { trigger: quote, start: "top 80%", end: "bottom 45%", scrub: 0.6 } });
    reveal($$(".quote figcaption"), {}, quote);
  }

  /* ---------------------------------------------- collection page */
  $$(".product").forEach((section) => {
    const panel = $(".product__media", section);
    const tl = gsap.timeline({ scrollTrigger: { trigger: section, start: "top 75%", once: true } });
    if (panel) {
      tl.fromTo(panel, { clipPath: "inset(100% 0% 0% 0% round 999px 999px 18px 18px)" }, { clipPath: "inset(0% 0% 0% 0% round 999px 999px 18px 18px)", duration: DUR.slow, ease: EASE.curtain, clearProps: "clipPath" });
      tl.from($("img", panel), { y: 80, rotation: -4, autoAlpha: 0, duration: 1.1, ease: EASE.settle }, 0.35);
    }
    tl.from($$(".product__body > :not(.product__details)", section), { y: 24, autoAlpha: 0, stagger: 0.08, duration: 0.8 }, 0.2);
    tl.from($$(".product__details li, .product__details h3, .product__details p", section), { y: 14, autoAlpha: 0, stagger: 0.04, duration: 0.6 }, 0.6);
  });

  // Jump menu follows along and marks the product in view.
  const chips = $$(".jump .chip");
  chips.forEach((chip) => {
    const target = document.getElementById(chip.hash.slice(1));
    if (!target) return;
    ScrollTrigger.create({
      trigger: target,
      start: "top 45%",
      end: "bottom 45%",
      onToggle: (self) => {
        if (self.isActive) chip.setAttribute("aria-current", "true");
        else chip.removeAttribute("aria-current");
        if (self.isActive) chip.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
      },
    });
  });
  if (chips.length) gsap.from(chips, { y: -12, autoAlpha: 0, stagger: 0.06, duration: 0.6, delay: 0.6 });

  /* ------------------------------------------------- contact page */
  reveal(".contact-card", { y: 50, stagger: 0.12, ease: EASE.settle, duration: 1 });
  reveal(".faq__item", { y: 20, stagger: 0.07 });

  // FAQ answers open and close smoothly instead of jumping.
  $$(".faq__item").forEach((d) => {
    const summary = $("summary", d);
    const body = $("p", d);
    let busy = false;
    summary.addEventListener("click", (e) => {
      e.preventDefault();
      if (busy) return;
      busy = true;
      if (!d.open) {
        d.open = true;
        gsap.from(body, { height: 0, autoAlpha: 0, paddingBottom: 0, duration: 0.5, clearProps: "all", onComplete: () => (busy = false) });
      } else {
        gsap.to(body, { height: 0, autoAlpha: 0, paddingBottom: 0, duration: 0.4, ease: "power2.inOut", onComplete: () => { d.open = false; gsap.set(body, { clearProps: "all" }); busy = false; } });
      }
    });
  });

  /* --------------------------------------------- header and footer */
  const toggle = $(".nav-toggle");
  if (toggle) {
    new MutationObserver(() => {
      if (toggle.getAttribute("aria-expanded") === "true") gsap.from($$(".site-nav__list li, .site-nav .lang"), { x: -16, autoAlpha: 0, stagger: 0.06, duration: 0.5 });
    }).observe(toggle, { attributes: true, attributeFilter: ["aria-expanded"] });
  }
  $$("details.lang").forEach((d) =>
    d.addEventListener("toggle", () => { if (d.open) gsap.from($(".lang__menu", d), { y: -8, autoAlpha: 0, duration: 0.3 }); })
  );
  reveal($$(".site-footer__grid > *"), { y: 20, stagger: 0.08, duration: 0.8 });

  // Exposed for main.js: the language banner slides down instead of popping in.
  window.WPMotion = { banner: (el) => gsap.from(el, { yPercent: -100, autoAlpha: 0, duration: 0.6, delay: 0.9 }) };

  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
