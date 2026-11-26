import * as SecureStore from "expo-secure-store";

/** Share link token kept while the user logs in or verifies the email. */
export const PENDING_SHARE_TOKEN_KEY = "loyalty-hive.pending-share-token";

export function savePendingShareToken(token: string): Promise<void> {
  return SecureStore.setItemAsync(PENDING_SHARE_TOKEN_KEY, token);
}

/** Returns the saved token and removes it, so the invite opens one time. */
export async function takePendingShareToken(): Promise<string | null> {
  const token = await SecureStore.getItemAsync(PENDING_SHARE_TOKEN_KEY);
  if (token) {
    await SecureStore.deleteItemAsync(PENDING_SHARE_TOKEN_KEY);
  }
  return token;
}
