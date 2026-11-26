import { describe, expect, it, mock } from "bun:test";
import { Hono } from "hono";
import { contextStorage } from "hono/context-storage";
import {
  addBreadcrumb,
  type Breadcrumb,
  sentryQueryLogger,
} from "./sentry-breadcrumbs";

function createApp(addBreadcrumbMock: (b: Breadcrumb) => void) {
  return new Hono<{
    Variables: { sentry: { addBreadcrumb: (b: Breadcrumb) => void } };
  }>()
    .use(contextStorage())
    .use(async (c, next) => {
      c.set("sentry", { addBreadcrumb: addBreadcrumbMock });
      await next();
    });
}

describe("addBreadcrumb", () => {
  it("adds the breadcrumb to the request's Sentry scope", async () => {
    const add = mock((_b: Breadcrumb) => {});
    const app = createApp(add).get("/", (c) => {
      addBreadcrumb({ category: "test", message: "hello" });
      return c.text("ok");
    });

    await app.request("/");

    expect(add).toHaveBeenCalledWith({ category: "test", message: "hello" });
  });

  it("does nothing outside a request", () => {
    expect(() =>
      addBreadcrumb({ category: "test", message: "hello" }),
    ).not.toThrow();
  });
});

describe("sentryQueryLogger", () => {
  it("records the SQL without parameters", async () => {
    const add = mock((_b: Breadcrumb) => {});
    const app = createApp(add).get("/", (c) => {
      sentryQueryLogger.logQuery("select * from users where email = $1");
      return c.text("ok");
    });

    await app.request("/");

    expect(add).toHaveBeenCalledWith({
      category: "db.query",
      message: "select * from users where email = $1",
    });
  });

  it("shortens long queries", async () => {
    const add = mock((_b: Breadcrumb) => {});
    const app = createApp(add).get("/", (c) => {
      sentryQueryLogger.logQuery("x".repeat(2000));
      return c.text("ok");
    });

    await app.request("/");

    expect(add.mock.calls[0]?.[0].message).toHaveLength(1001);
  });
});
