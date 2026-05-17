import * as SecureStore from "expo-secure-store";

import { setBearerToken } from "@/lib/api-client/setup";
import { AUTH_TOKEN_STORAGE_KEY } from "./auth.constants";

export function setClientAuth(token: string | undefined) {
  setBearerToken(token);
}

export async function loadAuthToken(): Promise<string | null> {
  return SecureStore.getItemAsync(AUTH_TOKEN_STORAGE_KEY);
}

export async function persistAuthToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(AUTH_TOKEN_STORAGE_KEY, token);
}

export async function clearAuthToken(): Promise<void> {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_STORAGE_KEY);
}
