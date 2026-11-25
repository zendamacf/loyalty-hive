import {
  type ResetPasswordEmailProps,
  resetPasswordEmailTemplate,
} from "./reset-password.js";
import { type VerifyEmailProps, verifyEmailTemplate } from "./verify-email.js";

export type RenderedEmail = { subject: string; html: string; text: string };

/**
 * Registry of email types. To add an email:
 * 1. Create `templates/<name>.ts`. Export a props type and a function that
 *    returns `RenderedEmail`. Build the HTML with `renderLayout` and the helpers
 *    in `layout.ts`, so each email keeps the app branding.
 * 2. Add the props type to `EmailTemplateProps` and the function to
 *    `emailTemplates` below.
 * 3. Add sample props to `templates.unit.test.ts`. The test renders each
 *    registered template and checks the branding.
 * 4. Send it with `sendTemplatedEmail("<name>", to, props)`.
 */
export type EmailTemplateProps = {
  verifyEmail: VerifyEmailProps;
  resetPassword: ResetPasswordEmailProps;
};

export type EmailType = keyof EmailTemplateProps;

export const emailTemplates: {
  [K in EmailType]: (props: EmailTemplateProps[K]) => RenderedEmail;
} = {
  verifyEmail: verifyEmailTemplate,
  resetPassword: resetPasswordEmailTemplate,
};
