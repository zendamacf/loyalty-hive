import { Resend } from "resend";

import { config } from "../config.js";

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const { resendApiKey, from } = config.mail;

  if (!resendApiKey || !from) {
    console.info(
      "[mail] Skipping send (RESEND_API_KEY or EMAIL_FROM not set)",
      {
        to: input.to,
        subject: input.subject,
        text: input.text,
      },
    );
    return;
  }

  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });

  if (error) {
    console.error("[mail] Resend error", error);
    throw error;
  }
}
