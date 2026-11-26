import { router } from "expo-router";
import { useEffect } from "react";

import { Routes } from "@/constants/routes.constants";

import { takePendingShareToken } from "./pending-share";

/**
 * Opens a share invite that arrived before the user logged in or verified
 * the email. Use it on the first screen after sign-in (the cards list).
 */
export function usePendingShareRedirect(): void {
  useEffect(() => {
    // No cleanup flag: the token is removed when it is read, so the redirect
    // must happen even if a dev-mode double effect unmounts this first.
    void takePendingShareToken().then((token) => {
      if (token) {
        router.push({ pathname: Routes.ACCEPT_SHARE, params: { token } });
      }
    });
  }, []);
}
