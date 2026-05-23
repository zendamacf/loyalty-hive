import { afterEach } from "bun:test";
import AsyncStorage from "@react-native-async-storage/async-storage";

import i18n from "@/i18n";
import { LANGUAGE_STORAGE_KEY } from "@/i18n/i18n.constants";

import { resetUnauthorizedModuleStateForTests } from "../src/lib/api-client/unauthorized.impl";
import { resetSheetsForTest } from "./mocks/react-native-actions-sheet";

afterEach(async () => {
  resetUnauthorizedModuleStateForTests();
  resetSheetsForTest();
  await AsyncStorage.removeItem(LANGUAGE_STORAGE_KEY);
  await i18n.changeLanguage("en");
});
