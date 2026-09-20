import { mock } from "bun:test";

export const sentryLoggerInfoMock = mock(() => {});
export const sentryLoggerErrorMock = mock(() => {});

mock.module("@sentry/react-native", () => ({
  init: mock(() => {}),
  wrap: (component: unknown) => component,
  wrapExpoRouterErrorBoundary: (component: unknown) => component,
  expoRouterIntegration: mock(() => ({})),
  mobileReplayIntegration: mock(() => ({})),
  logger: {
    info: sentryLoggerInfoMock,
    error: sentryLoggerErrorMock,
    warn: mock(() => {}),
    debug: mock(() => {}),
  },
}));
