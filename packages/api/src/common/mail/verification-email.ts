import { EMAIL_VERIFICATION_LINK_BASE } from "../constants.js";
import { sendEmail } from "./send-email.js";

const SEND_MAX_ATTEMPTS = 3;

function isRetryableSendError(error: unknown): boolean {
  if (typeof error === "object" && error !== null && "statusCode" in error) {
    const statusCode = (error as { statusCode: unknown }).statusCode;
    if (
      typeof statusCode === "number" &&
      statusCode >= 400 &&
      statusCode < 500
    ) {
      return false;
    }
  }
  return true;
}

export function buildVerificationLink(token: string): string {
  const base = EMAIL_VERIFICATION_LINK_BASE;
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}token=${encodeURIComponent(token)}`;
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeHtmlAttr(text: string): string {
  return escapeHtml(text).replaceAll("'", "&#39;");
}

function buildVerificationEmailContent(link: string): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = "Verify your LoyaltyHive email";
  const text = `Verify your email address by opening this link:\n\n${link}\n\nIf you did not create an account, you can ignore this email.`;
  const safeHref = escapeHtmlAttr(link);
  const safeLinkText = escapeHtml(link);
  const html = `<!DOCTYPE html>
<html lang="en">
<body style="font-family:system-ui,sans-serif;line-height:1.5;color:#0f172a;">
<p>Verify your email address for LoyaltyHive.</p>
<p><a href="${safeHref}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">Verify email</a></p>
<p style="font-size:13px;color:#64748b;">If the button does not work, copy and paste this link into your browser:</p>
<p style="font-size:13px;word-break:break-all;"><a href="${safeHref}">${safeLinkText}</a></p>
<p style="font-size:13px;color:#64748b;">If you did not create an account, you can ignore this email.</p>
</body>
</html>`;

  return { subject, text, html };
}

export async function sendVerificationEmail(
  to: string,
  token: string,
): Promise<void> {
  const link = buildVerificationLink(token);
  const { subject, text, html } = buildVerificationEmailContent(link);

  let lastError: unknown;
  for (let attempt = 0; attempt < SEND_MAX_ATTEMPTS; attempt++) {
    try {
      await sendEmail({ to, subject, text, html });
      return;
    } catch (error) {
      lastError = error;
      if (!isRetryableSendError(error)) {
        throw error;
      }
      if (attempt < SEND_MAX_ATTEMPTS - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, 250 * (attempt + 1)),
        );
      }
    }
  }

  throw lastError;
}
