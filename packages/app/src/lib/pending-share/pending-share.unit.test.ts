import { describe, expect, it } from "bun:test";

import { savePendingShareToken, takePendingShareToken } from "./pending-share";

describe("[Unit] pending share token", () => {
  it("returns the saved token one time", async () => {
    await savePendingShareToken("share-token");

    expect(await takePendingShareToken()).toBe("share-token");
    expect(await takePendingShareToken()).toBeNull();
  });
});
