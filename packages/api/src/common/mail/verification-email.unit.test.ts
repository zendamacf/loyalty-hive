import { describe, expect, it } from "bun:test";
import {
  buildVerificationLink,
  sendVerificationEmail,
} from "./verification-email.js";

describe("[Unit] verification email", () => {
  it("builds a deep link with an encoded token query param", () => {
    const link = buildVerificationLink("token+value=");
    expect(link).toBe("loyaltyhive://verify-email?token=token%2Bvalue%3D");
  });

  it("completes when outbound mail is not configured", async () => {
    await expect(
      sendVerificationEmail("verify@example.com", "sample-token"),
    ).resolves.toBeUndefined();
  });
});
