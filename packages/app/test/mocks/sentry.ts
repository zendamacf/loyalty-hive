import { mock } from "bun:test";

export const sentryLoggerInfoMock = mock(() => {});
export const sentryLoggerErrorMock = mock(() => {});

export const sentrySetTagMock = mock(() => {});

mock.module("@sentry/react-native", () => ({
  init: mock(() => {}),
  setTag: sentrySetTagMock,
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
