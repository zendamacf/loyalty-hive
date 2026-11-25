/**
 * Colors mirror the app themes (`packages/app/src/theme/themes.ts` and `brand.ts`).
 * Email clients cannot read the app theme, so the values are written out here.
 * Keep them in sync with the app.
 */
export const emailColors = {
  light: {
    page: "#F8FAFC",
    card: "#FFFFFF",
    text: "#0F172A",
    muted: "#64748B",
    border: "#E2E8F0",
  },
  dark: {
    page: "#0D1B2A",
    card: "#1E293B",
    text: "#F1F5F9",
    muted: "#94A3B8",
    border: "#334155",
  },
  /** Brand yellow. It carries dark text: white on this yellow fails contrast. */
  brand: "#FFC43D",
  brandText: "#0F172A",
  /** Dark header band that holds the wordmark. */
  chrome: "#0D1B2A",
  chromeText: "#F1F5F9",
} as const;

/** Mirrors `packages/app/src/constants/branding.constants.ts`. */
export const APP_NAME_PREFIX = "Loyalty";
export const APP_NAME_ACCENT = "Hive";
export const APP_NAME = `${APP_NAME_PREFIX}${APP_NAME_ACCENT}`;

export const FONT_STACK =
  "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Heading. Pass plain text: it is escaped here. */
export function renderHeading(text: string): string {
  return `<h1 style="font-size:24px;line-height:1.2;font-weight:700;margin:0 0 12px;">${escapeHtml(text)}</h1>`;
}

/** Body paragraph. Pass plain text: it is escaped here. */
export function renderParagraph(text: string): string {
  return `<p style="margin:0 0 20px;">${escapeHtml(text)}</p>`;
}

/** Secondary text. The `muted` class lets dark mode change the color. */
export function renderMuted(text: string): string {
  return `<p class="muted" style="margin:0 0 12px;font-size:13px;color:${emailColors.light.muted};">${escapeHtml(text)}</p>`;
}

/** Primary call to action, styled like the app's primary button. */
export function renderButton(href: string, label: string): string {
  return `<a class="btn" href="${escapeHtml(href)}" style="display:inline-block;padding:12px 22px;background:${emailColors.brand};color:${emailColors.brandText};border-radius:8px;font-weight:600;text-decoration:none;">${escapeHtml(label)}</a>`;
}

/** Fallback for clients that block buttons: the link as plain text. */
export function renderLinkFallback(href: string, intro: string): string {
  return `<p class="muted" style="margin:16px 0 0;font-size:12px;color:${emailColors.light.muted};word-break:break-all;">${escapeHtml(intro)}<br><a href="${escapeHtml(href)}" style="color:inherit;">${escapeHtml(href)}</a></p>`;
}

/**
 * Shared HTML shell for each email: dark header with the wordmark, themed card,
 * and light and dark mode (with `prefers-color-scheme`, where the client supports it).
 * `bodyHtml` must be escaped already: build it with the render helpers above.
 */
export function renderLayout(bodyHtml: string): string {
  const l = emailColors.light;
  const d = emailColors.dark;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <style>
      @media (prefers-color-scheme: dark) {
        .page { background: ${d.page} !important; }
        .card { background: ${d.card} !important; color: ${d.text} !important; border-color: ${d.border} !important; }
        .muted { color: ${d.muted} !important; }
      }
    </style>
  </head>
  <body class="page" style="margin:0;padding:24px 16px;background:${l.page};font-family:${FONT_STACK};">
    <div style="max-width:480px;margin:0 auto;">
      <div style="background:${emailColors.chrome};border-radius:16px 16px 0 0;padding:18px 28px;">
        <span style="font-size:22px;font-weight:700;color:${emailColors.chromeText};">${escapeHtml(APP_NAME_PREFIX)}<span style="color:${emailColors.brand};">${escapeHtml(APP_NAME_ACCENT)}</span></span>
      </div>
      <div class="card" style="background:${l.card};color:${l.text};border:1px solid ${l.border};border-top:0;border-radius:0 0 16px 16px;padding:28px;font-size:16px;line-height:1.5;">
        ${bodyHtml}
        <p class="muted" style="margin:28px 0 0;font-size:12px;color:${l.muted};">The ${escapeHtml(APP_NAME)} team</p>
      </div>
    </div>
  </body>
</html>`;
}
