import { EMAIL_VERIFICATION_LINK_BASE } from "../constants.js";
import { sendEmail } from "./send-email.js";

export function buildVerificationLink(token: string): string {
  const base = EMAIL_VERIFICATION_LINK_BASE;
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}token=${encodeURIComponent(token)}`;
}

export async function sendVerificationEmail(
  to: string,
  token: string,
): Promise<void> {
  const link = buildVerificationLink(token);
  const subject = "Verify your Loyalty Hive email";
  const text = `Verify your email address by opening this link:\n\n${link}\n\nIf you did not create an account, you can ignore this email.`;
  const html = `<p>Verify your email address by opening this link:</p><p><a href="${link}">${link}</a></p><p>If you did not create an account, you can ignore this email.</p>`;

  await sendEmail({ to, subject, text, html });
}
