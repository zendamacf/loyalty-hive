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

export type ShareInviteEmailProps = {
  ownerEmail: string;
  scope: "card" | "account";
  acceptUrl: string;
  expiresInDays: number;
};

/** Do not put card numbers in this email. */
export function shareInviteEmailTemplate({
  ownerEmail,
  scope,
  acceptUrl,
  expiresInDays,
}: ShareInviteEmailProps): RenderedEmail {
  const what =
    scope === "account"
      ? "all their loyalty cards, including cards they add later"
      : "a loyalty card";
  const intro = `${ownerEmail} wants to share ${what} with you on ${APP_NAME}.`;
  const expiry = `This link expires in ${expiresInDays} days and works one time. Open it on the phone where you use ${APP_NAME}.`;
  const ignoreNote =
    "If you do not know this person, you can ignore this email.";

  return {
    subject: `${ownerEmail} shared loyalty cards with you on ${APP_NAME}`,
    html: renderLayout(
      [
        renderHeading("Cards shared with you"),
        renderParagraph(intro),
        `<p style="margin:0 0 24px;">${renderButton(acceptUrl, "View invite")}</p>`,
        renderMuted(expiry),
        renderMuted(ignoreNote),
        renderLinkFallback(
          acceptUrl,
          "If the button does not work, copy and paste this link into your browser:",
        ),
      ].join("\n"),
    ),
    text: `${intro}\n\nOpen this link to view the invite:\n\n${acceptUrl}\n\n${expiry}\n\n${ignoreNote}`,
  };
}
