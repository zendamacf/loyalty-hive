import { resolver } from "hono-openapi";
import z from "zod";

export function jsonResponse(description: string, schema: z.ZodType) {
  return {
    description,
    content: {
      "application/json": {
        schema: resolver(schema),
      },
    },
  } as const;
}

export function noContentResponse(description: string = "Successful response") {
  return { description };
}

export const errorJson = {
  "application/json": {
    schema: resolver(z.object({ error: z.string() })),
  },
} as const;

export function errorResponse(description: string) {
  return { description, content: errorJson };
}

export const validationErrorJson = {
  "application/json": {
    schema: resolver(
      z.object({
        error: z.string(),
        issues: z.array(z.unknown()),
      }),
    ),
  },
} as const;

export function validationErrorResponse(
  description: string = "Invalid request input",
) {
  return { description, content: validationErrorJson };
}
