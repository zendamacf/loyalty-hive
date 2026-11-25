import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";

import { App } from "./App";

afterEach(cleanup);

describe("[Component] App", () => {
  it("renders the admin heading", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { name: "LoyaltyHive Admin" }),
    ).toBeDefined();
  });
});
