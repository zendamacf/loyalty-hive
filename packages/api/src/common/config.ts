export const config: Config = {
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
