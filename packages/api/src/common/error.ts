import { HTTPException } from "hono/http-exception";
import { ACCOUNT_DELETION_GRACE_DAYS, SUPPORT_EMAIL } from "./constants.js";

export function Unauthorized(message: string = "Unauthorized") {
  return new HTTPException(401, { message });
}

export class InvalidApiKeyError extends HTTPException {
  constructor(message: string = "Invalid API key") {
    super(403, { message });
  }
}

export function TooManyRequests(message: string = "Too many requests") {
  return new HTTPException(429, { message });
}

export function Forbidden(message: string = "Forbidden") {
  return new HTTPException(403, { message });
}

export function PayloadTooLarge(message: string = "Payload too large") {
  return new HTTPException(413, { message });
}

export function BadRequest(message: string = "Bad request") {
  return new HTTPException(400, { message });
}

export const EMAIL_NOT_VERIFIED_MESSAGE = "Email address not verified";

export const INVALID_VERIFICATION_TOKEN_MESSAGE =
  "Invalid or expired verification link";

export const INVALID_PASSWORD_RESET_TOKEN_MESSAGE =
  "Invalid or expired password reset link";

export const ACCOUNT_DELETED_MESSAGE = `This account was deleted. To restore it, contact ${SUPPORT_EMAIL} within ${ACCOUNT_DELETION_GRACE_DAYS} days.`;

export const ACCOUNT_PENDING_DELETION_EMAIL_MESSAGE = `This email belongs to an account that was deleted. To restore it, contact ${SUPPORT_EMAIL} within ${ACCOUNT_DELETION_GRACE_DAYS} days.`;

export const INCORRECT_PASSWORD_MESSAGE = "Incorrect password";

export const SHARE_INVITE_SENT_MESSAGE =
  "If there is a LoyaltyHive account with this email, we sent them an invite.";

export const INVALID_SHARE_LINK_MESSAGE = "Invalid share link";

export const SHARE_LINK_EXPIRED_MESSAGE =
  "This share link has expired or was cancelled";

export const SHARE_FOR_OTHER_ACCOUNT_MESSAGE =
  "This share is for a different account";
