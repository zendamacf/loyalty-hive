import { afterEach } from "bun:test";
import AsyncStorage from "@react-native-async-storage/async-storage";

import i18n from "@/i18n";
import { LANGUAGE_STORAGE_KEY } from "@/i18n/i18n.constants";

import { clearSecureStoreMock } from "./mocks/expo-secure-store";
import { resetSheetsForTest } from "./mocks/react-native-actions-sheet";

afterEach(async () => {
  resetSheetsForTest();
  // Imported lazily: this file loads before the module mocks in setup.ts.
  const { clearOfflineCache } = await import("@/lib/offline-cache");
  await clearOfflineCache();
  clearSecureStoreMock();
  await AsyncStorage.removeItem(LANGUAGE_STORAGE_KEY);
  await i18n.changeLanguage("en");
});
