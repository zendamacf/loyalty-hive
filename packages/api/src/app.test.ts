import { describe, expect, it } from "bun:test";
import app from "./app";

describe("API app", () => {
  it("responds with 404 on unknown route", async () => {
    const response = await app.request("/does-not-exist");

    expect(response.status).toBe(404);
  });
});
