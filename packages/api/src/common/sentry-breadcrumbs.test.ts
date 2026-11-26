import { describe, expect, it, mock } from "bun:test";
import { Hono } from "hono";
import { contextStorage } from "hono/context-storage";
import type { Toucan } from "toucan-js";
import { addBreadcrumb, sentryQueryLogger } from "./sentry-breadcrumbs";

/** Runs `fn` inside a request and returns the breadcrumbs it added. */
async function breadcrumbsDuring(fn: () => void): Promise<unknown[]> {
  const add = mock((_breadcrumb: unknown) => {});
  await new Hono()
    .use(contextStorage())
    .get("/", (c) => {
      c.set("sentry", { addBreadcrumb: add } as unknown as Toucan);
      fn();
      return c.text("ok");
    })
    .request("/");
  return add.mock.calls.map(([breadcrumb]) => breadcrumb);
}

describe("addBreadcrumb", () => {
  it("adds the breadcrumb to the request's Sentry scope", async () => {
    expect(
      await breadcrumbsDuring(() =>
        addBreadcrumb({ category: "test", message: "hello" }),
      ),
    ).toEqual([{ category: "test", message: "hello" }]);
  });

  it("does nothing outside a request", () => {
    expect(() =>
      addBreadcrumb({ category: "test", message: "hello" }),
    ).not.toThrow();
  });
});

describe("sentryQueryLogger", () => {
  it("records the SQL without parameters", async () => {
    expect(
      await breadcrumbsDuring(() =>
        sentryQueryLogger.logQuery("select * from users where email = $1"),
      ),
    ).toEqual([
      { category: "db.query", message: "select * from users where email = $1" },
    ]);
  });
});
