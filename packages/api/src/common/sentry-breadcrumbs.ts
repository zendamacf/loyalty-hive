import { tryGetContext } from "hono/context-storage";

export type Breadcrumb = {
  category: string;
  message: string;
  level?: "debug" | "info" | "warning" | "error";
  data?: Record<string, unknown>;
};

type BreadcrumbEnv = {
  Variables: {
    sentry?: { addBreadcrumb(breadcrumb: Breadcrumb): unknown };
  };
};

/** Longest SQL kept in a breadcrumb. Sentry trims long values anyway. */
const MAX_QUERY_LENGTH = 1000;

/**
 * Adds a breadcrumb to the current request's Sentry scope. It does nothing
 * outside a request, such as in scripts and tests.
 */
export function addBreadcrumb(breadcrumb: Breadcrumb): void {
  tryGetContext<BreadcrumbEnv>()?.get("sentry")?.addBreadcrumb(breadcrumb);
}

/**
 * Drizzle logger that records each SQL query as a breadcrumb. Parameters are
 * left out, because they hold emails, password hashes, and tokens.
 */
export const sentryQueryLogger = {
  logQuery(query: string): void {
    addBreadcrumb({
      category: "db.query",
      message:
        query.length > MAX_QUERY_LENGTH
          ? `${query.slice(0, MAX_QUERY_LENGTH)}…`
          : query,
    });
  },
};
