import { HTTPException } from "hono/http-exception";

export function Unauthorized(message: string = "Unauthorized") {
  return new HTTPException(401, { message });
}
