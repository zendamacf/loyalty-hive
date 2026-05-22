import type { GenerateSpecOptions } from "hono-openapi";
import { config } from "./config";
import { API_KEY_HEADER } from "./constants";

const BASE_DOCS = {
  documentation: {
    info: {
      title: "LoyaltyHive API",
      version: config.libVersion,
    },
    components: {
      securitySchemes: {
        apiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: API_KEY_HEADER,
        },
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
} as const;

export const publicDocs: Partial<GenerateSpecOptions> = {
  ...BASE_DOCS,
  documentation: {
    ...BASE_DOCS.documentation,
    info: {
      ...BASE_DOCS.documentation.info,
      description:
        "<strong>REST API for the LoyaltyHive mobile app.</strong><br />All your loyalty cards. One place.",
    },
    servers: [
      {
        url: "https://loyaltyhive.kalopsia.dev",
        description: "Production server",
      },
    ],
  },
};

export const codeGenDocs: Partial<GenerateSpecOptions> = {
  ...BASE_DOCS,
  documentation: {
    ...BASE_DOCS.documentation,
    info: {
      ...BASE_DOCS.documentation.info,
      description: "REST API for the LoyaltyHive mobile app.",
    },
    servers: [
      {
        url: "https://rut-roman-cubicle.ngrok-free.dev",
        description: "Local server",
      },
      {
        url: "https://loyaltyhive.kalopsia.dev",
        description: "Production server",
      },
    ],
  },
};
