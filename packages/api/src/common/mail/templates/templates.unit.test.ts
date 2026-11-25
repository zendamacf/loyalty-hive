import { describe, expect, it } from "bun:test";

import {
  type EmailTemplateProps,
  type EmailType,
  emailTemplates,
} from "./index.js";
import { emailColors, escapeHtml } from "./layout.js";

/** One sample for each registered template. The type forces a sample for a new template. */
const samples: { [K in EmailType]: EmailTemplateProps[K] } = {
  verifyEmail: { verifyUrl: "loyaltyhive://verify-email?token=abc" },
  resetPassword: {
    resetUrl: "loyaltyhive://reset-password?token=abc",
    expiresInMinutes: 60,
  },
};

describe("[Unit] email templates", () => {
  for (const type of Object.keys(samples) as EmailType[]) {
    describe(type, () => {
      // The registry is keyed by type, so the call cannot be typed for each key in a loop.
      const render = emailTemplates[type] as (
        props: unknown,
      ) => ReturnType<(typeof emailTemplates)[EmailType]>;
      const email = render(samples[type]);

      it("has a subject, html and plain text body", () => {
        expect(email.subject).toContain("LoyaltyHive");
        expect(email.html.startsWith("<!doctype html>")).toBe(true);
        expect(email.text.length).toBeGreaterThan(0);
      });

      it("uses the brand shell", () => {
        expect(email.html).toContain(emailColors.brand);
        expect(email.html).toContain(emailColors.chrome);
        expect(email.html).toContain("prefers-color-scheme: dark");
        expect(email.html).toContain("Loyalty");
        expect(email.html).toContain("Hive");
      });
    });
  }

  it("verifyEmail puts the link in html and text, escaped in html", () => {
    const verifyUrl = 'loyaltyhive://verify-email?token=a&b="x"';
    const email = emailTemplates.verifyEmail({ verifyUrl });

    expect(email.html).toContain(escapeHtml(verifyUrl));
    expect(email.html).not.toContain(verifyUrl);
    expect(email.text).toContain(verifyUrl);
  });
});
