import "dotenv/config";

export const config: Config = {
  environment: process.env.NODE_ENV ?? "development",
  server: {
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
  server: {
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
