import { EMAIL_VERIFICATION_LINK_BASE } from "../constants.js";
import { sendTemplatedEmail } from "./send-templated-email.js";

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

export async function sendVerificationEmail(
  to: string,
  token: string,
): Promise<void> {
  const link = buildVerificationLink(token);

  let lastError: unknown;
  for (let attempt = 0; attempt < SEND_MAX_ATTEMPTS; attempt++) {
    try {
      await sendTemplatedEmail("verifyEmail", to, { verifyUrl: link });
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
