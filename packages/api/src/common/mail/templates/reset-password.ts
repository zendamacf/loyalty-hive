import type { RenderedEmail } from "./index.js";
import {
  APP_NAME,
  renderButton,
  renderHeading,
  renderLayout,
  renderLinkFallback,
  renderMuted,
  renderParagraph,
} from "./layout.js";

export type ResetPasswordEmailProps = {
  resetUrl: string;
  expiresInMinutes: number;
};

export function resetPasswordEmailTemplate({
  resetUrl,
  expiresInMinutes,
}: ResetPasswordEmailProps): RenderedEmail {
  const expiry = `This link expires in ${expiresInMinutes} minutes and works one time.`;
  const ignoreNote =
    "If you did not ask to reset your password, you can ignore this email. Your password stays the same.";

  return {
    subject: `Reset your ${APP_NAME} password`,
    html: renderLayout(
      [
        renderHeading("Reset your password"),
        renderParagraph(
          `We got a request to reset the password for your ${APP_NAME} account.`,
        ),
        `<p style="margin:0 0 24px;">${renderButton(resetUrl, "Reset password")}</p>`,
        renderMuted(expiry),
        renderMuted(ignoreNote),
        renderLinkFallback(
          resetUrl,
          "If the button does not work, copy and paste this link into your browser:",
        ),
      ].join("\n"),
    ),
    text: `Reset your ${APP_NAME} password by opening this link:\n\n${resetUrl}\n\n${expiry}\n\n${ignoreNote}`,
  };
}
