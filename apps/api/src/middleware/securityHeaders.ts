import type { Context, Next } from "hono";

// Helmet-style security headers for the Hono API.
// These protect against XSS, clickjacking, MIME sniffing, and other
// browser-based attacks on the API's responses.
const securityHeaders: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "X-XSS-Protection": "0",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(self), usb=()",
};

export async function securityHeadersMiddleware(c: Context, next: Next): Promise<Response | void> {
  for (const [header, value] of Object.entries(securityHeaders)) {
    c.header(header, value);
  }

  await next();
}

// Content-Security-Policy is intentionally NOT set globally because the API
// returns JSON responses. If a CDN or static server is added, set a CSP there.
