import { afterAll, describe, expect, it, mock } from "bun:test";

import * as sendEmailModule from "./send-email.js";

// mock.module lasts for the whole test run. Put the real module back for later files.
const realSendEmail = { ...sendEmailModule };

describe("[Unit] verification email retries", () => {
  afterAll(() => {
    mock.module("./send-email.js", () => realSendEmail);
  });

  it("retries when send fails with a retryable error", async () => {
    const sendEmail = mock(() => Promise.reject({ statusCode: 503 }));

    mock.module("./send-email.js", () => ({ sendEmail }));

    const { sendVerificationEmail } = await import("./verification-email.js");

    await expect(
      sendVerificationEmail("retry@example.com", "sample-token"),
    ).rejects.toEqual({ statusCode: 503 });

    expect(sendEmail).toHaveBeenCalledTimes(3);
  });

  it("does not retry when send fails with a client error", async () => {
    const sendEmail = mock(() => Promise.reject({ statusCode: 422 }));

    mock.module("./send-email.js", () => ({ sendEmail }));

    const { sendVerificationEmail } = await import("./verification-email.js");

    await expect(
      sendVerificationEmail("fail@example.com", "sample-token"),
    ).rejects.toEqual({ statusCode: 422 });

    expect(sendEmail).toHaveBeenCalledTimes(1);
  });
});
