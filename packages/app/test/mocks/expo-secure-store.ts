import { mock } from "bun:test";

const secureStore = new Map<string, string>();

export const secureStoreGetMock = mock(async (key: string) =>
  secureStore.get(key) ?? null,
);
export const secureStoreSetMock = mock(
  async (key: string, value: string) => {
    secureStore.set(key, value);
  },
);
export const secureStoreDeleteMock = mock(async (key: string) => {
  secureStore.delete(key);
});

export function clearSecureStoreMock() {
  secureStore.clear();
}

export function setSecureStoreItem(key: string, value: string) {
  secureStore.set(key, value);
}

mock.module("expo-secure-store", () => ({
  getItemAsync: secureStoreGetMock,
  setItemAsync: secureStoreSetMock,
  deleteItemAsync: secureStoreDeleteMock,
}));
