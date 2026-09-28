import { describe, expect, it } from "bun:test";

import {
  consumeSessionExpiredNotice,
  markSessionExpired,
} from "./session-expired-notice";

describe("[Unit] session-expired-notice", () => {
  it("consumes a pending notice once", () => {
    markSessionExpired();

    expect(consumeSessionExpiredNotice()).toBe(true);
    expect(consumeSessionExpiredNotice()).toBe(false);
  });
});
