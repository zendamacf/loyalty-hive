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
