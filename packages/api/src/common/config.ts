import "dotenv/config";

import { API_PACKAGE_VERSION } from "../api-package";
import {
  DEFAULT_ADMIN_JWT_TTL,
  parseJwtAccessTtlSeconds,
} from "./jwt-access-ttl";

export function parseTrustProxyHops(value: string | undefined): number {
  if (value === undefined || value.trim() === "") return 0;
  const hops = Number(value);
  if (!Number.isInteger(hops) || hops < 0 || hops > 10) {
    throw new Error(
      `Invalid TRUST_PROXY_HOPS "${value}": use a whole number from 0 to 10`,
    );
  }
  return hops;
}

const environment = process.env.NODE_ENV ?? "development";

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
    fileStorageUrl: process.env.FILE_STORAGE_URL ?? "",
    trustProxyHops: parseTrustProxyHops(process.env.TRUST_PROXY_HOPS),
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
    fileStorageUrl: string;
    /** Number of our own proxies in front of the API. 0 ignores X-Forwarded-For. */
    trustProxyHops: number;
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
}
