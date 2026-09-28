import "dotenv/config";

import { API_PACKAGE_VERSION } from "../api-package";
import { parseJwtAccessTtlSeconds } from "./jwt-access-ttl";

const environment = process.env.NODE_ENV ?? "development";

export const config: Config = {
  environment,
  exposeOpenApi: environment !== "production",
  libVersion: process.env.LIB_VERSION ?? API_PACKAGE_VERSION,
  server: {
    hostname: process.env.LISTEN_HOST ?? "0.0.0.0",
    port: Number.parseInt(process.env.PORT ?? "3000", 10),
    fileStorageUrl: process.env.FILE_STORAGE_URL ?? "",
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? "",
    accessTtlSeconds: parseJwtAccessTtlSeconds(process.env.JWT_ACCESS_TTL),
  },
  db: {
    url: process.env.DATABASE_URL ?? "",
  },
  tracing: {
    sentryDsn: process.env.SENTRY_DSN ?? "",
  },
};

interface Config {
  environment: string;
  exposeOpenApi: boolean;
  libVersion: string;
  server: {
    hostname: string;
    port: number;
    fileStorageUrl: string;
  };
  jwt: {
    accessSecret: string;
    accessTtlSeconds: number;
  };
  db: {
    url: string;
  };
  tracing: {
    sentryDsn: string;
  };
}
