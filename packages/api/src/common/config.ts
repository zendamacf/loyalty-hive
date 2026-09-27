import "dotenv/config";

import { resolveExposeOpenApi } from "./expose-openapi";
import { readPackageVersion } from "./lib-version";

const environment = process.env.NODE_ENV ?? "development";

export const config: Config = {
  environment,
  exposeOpenApi: resolveExposeOpenApi(environment, process.env.EXPOSE_OPENAPI),
  libVersion: process.env.LIB_VERSION ?? readPackageVersion(),
  server: {
    hostname: process.env.LISTEN_HOST ?? "0.0.0.0",
    port: Number.parseInt(process.env.PORT ?? "3000", 10),
    fileStorageUrl: process.env.FILE_STORAGE_URL ?? "",
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? "",
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
  };
  db: {
    url: string;
  };
  tracing: {
    sentryDsn: string;
  };
}
