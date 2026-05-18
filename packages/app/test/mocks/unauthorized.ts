import { mock } from "bun:test";

export type UnauthorizedHandler = () => void | Promise<void>;

let capturedUnauthorizedHandler: UnauthorizedHandler | undefined;

export function getUnauthorizedHandler(): UnauthorizedHandler | undefined {
  return capturedUnauthorizedHandler;
}

export function clearUnauthorizedHandlerMock(): void {
  capturedUnauthorizedHandler = undefined;
}

export const installUnauthorizedInterceptorMock = mock(() => {});

export const setUnauthorizedHandlerMock = mock(
  (handler: UnauthorizedHandler | undefined) => {
    capturedUnauthorizedHandler = handler;
  },
);

mock.module("@/lib/api-client/unauthorized", () => ({
  installUnauthorizedInterceptor: installUnauthorizedInterceptorMock,
  setUnauthorizedHandler: setUnauthorizedHandlerMock,
}));
