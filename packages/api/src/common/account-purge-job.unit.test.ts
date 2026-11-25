import { afterEach, describe, expect, it, mock, spyOn } from "bun:test";

import { startAccountPurgeJob } from "./account-purge-job.js";

describe("[Unit] account purge job", () => {
  afterEach(() => {
    mock.restore();
  });

  async function runJob(count: number) {
    const info = spyOn(console, "info").mockImplementation(() => {});
    const stop = startAccountPurgeJob(() => Promise.resolve(count));
    await new Promise((resolve) => setTimeout(resolve, 0));
    stop();
    return info;
  }

  it("logs when there are no accounts to remove", async () => {
    const info = await runJob(0);
    expect(info).toHaveBeenCalledWith(
      "[account-purge] No deleted accounts to remove",
    );
  });

  it("logs the number of removed accounts", async () => {
    const info = await runJob(2);
    expect(info).toHaveBeenCalledWith(
      "[account-purge] Removed 2 deleted account(s)",
    );
  });

  it("logs and keeps running when the purge fails", async () => {
    const error = spyOn(console, "error").mockImplementation(() => {});
    const stop = startAccountPurgeJob(() =>
      Promise.reject(new Error("db down")),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    stop();
    expect(error).toHaveBeenCalled();
  });
});
