import { addBreadcrumb } from "../sentry-breadcrumbs.js";
import { sendEmail } from "./send-email.js";
import {
  type EmailTemplateProps,
  type EmailType,
  emailTemplates,
} from "./templates/index.js";

/** Render a registered template and send it. */
export async function sendTemplatedEmail<K extends EmailType>(
  type: K,
  to: string,
  props: EmailTemplateProps[K],
): Promise<void> {
  const { subject, text, html } = emailTemplates[type](props);
  addBreadcrumb({ category: "email", message: `Sending ${type} email` });
  await sendEmail({ to, subject, text, html });
}
