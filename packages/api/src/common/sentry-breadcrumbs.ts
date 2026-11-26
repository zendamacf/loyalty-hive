import { tryGetContext } from "hono/context-storage";
import type { Toucan } from "toucan-js";

type Breadcrumb = Parameters<Toucan["addBreadcrumb"]>[0];

/**
 * Adds a breadcrumb to the current request's Sentry scope. It does nothing
 * outside a request, such as in scripts and tests.
 */
export function addBreadcrumb(breadcrumb: Breadcrumb): void {
  tryGetContext()?.get("sentry")?.addBreadcrumb(breadcrumb);
}

/**
 * Drizzle logger that records each SQL query as a breadcrumb. Parameters are
 * left out, because they hold emails, password hashes, and tokens.
 */
export const sentryQueryLogger = {
  logQuery(query: string): void {
    addBreadcrumb({ category: "db.query", message: query });
  },
};
