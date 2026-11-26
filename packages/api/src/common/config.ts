import "dotenv/config";

import { API_PACKAGE_VERSION } from "../api-package";
import { DEFAULT_APP_DEEP_LINK_BASE } from "./constants";
import {
  DEFAULT_ADMIN_JWT_TTL,
  parseJwtAccessTtlSeconds,
} from "./jwt-access-ttl";

const environment = process.env.NODE_ENV ?? "development";
const baseUrl = (process.env.BASE_URL ?? "").replace(/\/+$/, "");

export const config: Config = {
  environment,
  exposeOpenApi: environment !== "production",
  admin: {
    /** Admin panel build. Relative paths start at the working directory (packages/api). */
    distDir: process.env.ADMIN_DIST_DIR ?? "../admin/dist",
  },
  libVersion: process.env.LIB_VERSION ?? API_PACKAGE_VERSION,
  server: {
    hostname: process.env.LISTEN_HOST ?? "0.0.0.0",
    port: Number.parseInt(process.env.PORT ?? "3000", 10),
    baseUrl,
    fileStorageUrl:
      process.env.FILE_STORAGE_URL || (baseUrl ? `${baseUrl}/` : ""),
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? "",
    accessTtlSeconds: parseJwtAccessTtlSeconds(process.env.JWT_ACCESS_TTL),
  },
  adminJwt: {
    secret: process.env.ADMIN_JWT_SECRET ?? "",
    ttlSeconds: parseJwtAccessTtlSeconds(
      process.env.ADMIN_JWT_TTL,
      DEFAULT_ADMIN_JWT_TTL,
    ),
  },
  db: {
    url: process.env.DATABASE_URL ?? "",
  },
  tracing: {
    sentryDsn: process.env.SENTRY_DSN ?? "",
  },
  mail: {
    resendApiKey: process.env.RESEND_API_KEY ?? "",
    from: process.env.EMAIL_FROM ?? "",
  },
  appLinks: {
    deepLinkBase: process.env.APP_DEEP_LINK_BASE || DEFAULT_APP_DEEP_LINK_BASE,
  },
};

interface Config {
  environment: string;
  exposeOpenApi: boolean;
  admin: {
    distDir: string;
  };
  libVersion: string;
  server: {
    hostname: string;
    port: number;
    /** Public URL of this API, without a trailing slash. Email links point here. */
    baseUrl: string;
    /** Where brand logos are served, with a trailing slash. Defaults to `${baseUrl}/`. */
    fileStorageUrl: string;
  };
  jwt: {
    accessSecret: string;
    accessTtlSeconds: number;
  };
  adminJwt: {
    secret: string;
    ttlSeconds: number;
  };
  db: {
    url: string;
  };
  tracing: {
    sentryDsn: string;
  };
  mail: {
    resendApiKey: string;
    from: string;
  };
  appLinks: {
    /** Start of the app deep link that email links redirect to, e.g. `loyaltyhive://` or `exp://<host>:8081/--/`. */
    deepLinkBase: string;
  };
}
