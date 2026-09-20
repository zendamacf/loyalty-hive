import { mock } from "bun:test";

const appStateHandlers = new Map<string, (state: string) => void>();

export const removeAppStateListenerMock = mock(() => {});

export function clearAppStateMocks(): void {
  appStateHandlers.clear();
  removeAppStateListenerMock.mockClear();
}

export function emitAppStateChange(state: string): void {
  const handler = appStateHandlers.get("change");
  handler?.(state);
}

export const appStateMock = {
  addEventListener: (event: string, handler: (state: string) => void) => {
    appStateHandlers.set(event, handler);
    return { remove: removeAppStateListenerMock };
  },
};
