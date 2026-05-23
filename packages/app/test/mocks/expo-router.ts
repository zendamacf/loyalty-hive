import type { mock } from "bun:test";

export type ExpoRouterMocks = {
  push: ReturnType<typeof mock>;
  back: ReturnType<typeof mock>;
  dismissTo: ReturnType<typeof mock>;
  replace: ReturnType<typeof mock>;
  params: Record<string, string | undefined>;
};

export function getExpoRouterMocks(): ExpoRouterMocks {
  return (
    globalThis as typeof globalThis & { __expoRouterMocks: ExpoRouterMocks }
  ).__expoRouterMocks;
}
