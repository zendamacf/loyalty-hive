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

export type VerifyEmailProps = {
  verifyUrl: string;
};

export function verifyEmailTemplate({
  verifyUrl,
}: VerifyEmailProps): RenderedEmail {
  const ignoreNote =
    "If you did not create an account, you can ignore this email.";

  return {
    subject: `Verify your ${APP_NAME} email`,
    html: renderLayout(
      [
        renderHeading("Verify your email"),
        renderParagraph(
          `Verify your email address to start using ${APP_NAME}.`,
        ),
        `<p style="margin:0 0 24px;">${renderButton(verifyUrl, "Verify email")}</p>`,
        renderMuted(ignoreNote),
        renderLinkFallback(
          verifyUrl,
          "If the button does not work, copy and paste this link into your browser:",
        ),
      ].join("\n"),
    ),
    text: `Verify your email address by opening this link:\n\n${verifyUrl}\n\n${ignoreNote}`,
  };
}
