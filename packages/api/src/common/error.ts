import { HTTPException } from "hono/http-exception";

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

export function BadRequest(message: string = "Bad request") {
  return new HTTPException(400, { message });
}

export const EMAIL_NOT_VERIFIED_MESSAGE = "Email address not verified";

export const INVALID_VERIFICATION_TOKEN_MESSAGE =
  "Invalid or expired verification link";
