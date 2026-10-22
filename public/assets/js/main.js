// Winslow Pantry: small progressive enhancements. The site works without JS.
(() => {
  document.documentElement.classList.replace("no-js", "js");

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  };

  /* Mobile navigation toggle */
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  if (toggle && nav) {
    const close = () => { nav.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); };
    toggle.addEventListener("click", () => {
      const open = !nav.classList.contains("is-open");
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("is-open")) { close(); toggle.focus(); }
    });
  }

  /* Preview switch: the full collection or the launch product only */
  const lineup = document.querySelector(".lineup-switch");
  if (lineup) {
    const root = document.documentElement;
    const apply = (mode) => {
      root.setAttribute("data-lineup", mode);
      lineup.setAttribute("aria-checked", String(mode === "all"));
      document.querySelectorAll("[data-label-all]").forEach((el) =>
        el.setAttribute("aria-label", mode === "all" ? el.dataset.labelAll : el.dataset.labelLaunch)
      );
    };
    apply(root.getAttribute("data-lineup") === "launch" ? "launch" : "all");
    lineup.addEventListener("click", () => {
      const mode = root.getAttribute("data-lineup") === "all" ? "launch" : "all";
      store.set("wp-lineup", mode);
      apply(mode);
      // Shown or hidden sections move the page, so scroll animations re-measure.
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    });
  }

  /* Language menu: close on Escape or an outside click */
  document.querySelectorAll("details.lang").forEach((d) => {
    d.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && d.open) { d.open = false; d.querySelector("summary").focus(); }
    });
    document.addEventListener("click", (e) => { if (d.open && !d.contains(e.target)) d.open = false; });
  });

  /* Remember an explicit language choice */
  document.querySelectorAll("a[data-lang]").forEach((a) =>
    a.addEventListener("click", () => store.set("wp-lang", a.dataset.lang))
  );

  /* Offer the visitor's own language once, without redirecting them */
  const dataEl = document.getElementById("lang-data");
  if (dataEl && !store.get("wp-lang")) {
    const data = JSON.parse(dataEl.textContent);
    const current = document.documentElement.lang.slice(0, 2);
    const wanted = (navigator.languages || [navigator.language || ""])
      .map((l) => l.slice(0, 2).toLowerCase())
      .find((l) => data[l]);
    if (wanted && wanted !== current) {
      const s = data[wanted];
      const bar = document.createElement("div");
      bar.className = "lang-banner";
      bar.setAttribute("role", "region");
      bar.setAttribute("aria-label", s.text);
      bar.lang = wanted;
      bar.innerHTML = '<div class="container lang-banner__inner"><p></p><a></a><button type="button"></button></div>';
      bar.querySelector("p").textContent = s.text;
      const link = bar.querySelector("a");
      link.textContent = s.link;
      link.href = s.href;
      link.hreflang = wanted;
      link.addEventListener("click", () => store.set("wp-lang", wanted));
      const btn = bar.querySelector("button");
      btn.textContent = s.dismiss;
      btn.addEventListener("click", () => { store.set("wp-lang", current); bar.remove(); });
      document.body.insertBefore(bar, document.querySelector(".site-header"));
      if (window.WPMotion) window.WPMotion.banner(bar);
    }
  }
})();
