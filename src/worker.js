// Winslow Pantry: Worker entry.
// Serves the static site from /public, keeps the internal style guide
// behind HTTP Basic Auth and redirects /email to the inquiry inbox.
// Set the secrets with:
//   npx wrangler secret put STYLEGUIDE_PASSWORD
//   npx wrangler secret put INQUIRY_EMAIL
// (optional) STYLEGUIDE_USER, defaults to "winslow".

const PROTECTED = /^\/styleguide(\/|$)/;
const EMAIL = /^\/email\/?$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (EMAIL.test(url.pathname)) return emailRedirect(url, env);
    if (!PROTECTED.test(url.pathname)) return env.ASSETS.fetch(request);

    const password = env.STYLEGUIDE_PASSWORD;
    if (!password) {
      return new Response(
        "The Winslow Pantry style guide is internal. Set the STYLEGUIDE_PASSWORD secret on this Worker to enable access.",
        { status: 503, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" } }
      );
    }

    if (!(await authorized(request, env.STYLEGUIDE_USER || "winslow", password))) {
      return new Response("Authentication required.", {
        status: 401,
        headers: {
          "www-authenticate": 'Basic realm="Winslow Pantry style guide", charset="UTF-8"',
          "cache-control": "no-store",
          "x-robots-tag": "noindex, nofollow",
        },
      });
    }

    const res = await env.ASSETS.fetch(request);
    const headers = new Headers(res.headers);
    headers.set("cache-control", "private, no-store");
    headers.set("x-robots-tag", "noindex, nofollow");
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  },
};

// The Contact page buttons link here instead of to a mailto: address, so the
// inbox stays out of the HTML (and this public repo) where scrapers look for it.
function emailRedirect(url, env) {
  const headers = { "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" };
  const address = env.INQUIRY_EMAIL;
  if (!address) {
    return new Response("Email is not available right now. Please try again later.", {
      status: 503,
      headers: { ...headers, "content-type": "text/plain; charset=utf-8" },
    });
  }
  const subject = (url.searchParams.get("subject") || "").replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 100);
  const location = `mailto:${address}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;
  return new Response(null, { status: 302, headers: { ...headers, location } });
}

async function authorized(request, user, password) {
  const header = request.headers.get("authorization") || "";
  const [scheme, encoded] = header.split(" ");
  if (scheme !== "Basic" || !encoded) return false;
  let decoded;
  try {
    decoded = atob(encoded);
  } catch {
    return false;
  }
  if (!decoded.includes(":")) return false;
  const [a, b] = await Promise.all([digest(decoded), digest(`${user}:${password}`)]);
  return crypto.subtle.timingSafeEqual(a, b);
}

async function digest(text) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
}
