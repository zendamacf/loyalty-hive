import { type ReactNode, useEffect, useState } from "react";
import { AppState } from "react-native";

import { useAuth } from "@/lib/auth/AuthProvider";
import {
  flushBufferedAnalyticsEvents,
  getAnalyticsIdentityMode,
  resolveAnalyticsIdentity,
  setAnalyticsIdentityMode,
} from "./analytics-state";
import {
  loadAnalyticsUserId,
  persistAnalyticsUserId,
  setupUmami,
  syncAnalyticsUser,
} from "./analytics-user";

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const { isReady, isAuthenticated, user } = useAuth();
  const [umamiReady, setUmamiReady] = useState(false);

  useEffect(() => {
    void setupUmami().then(() => {
      setUmamiReady(true);
    });
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "background" && state !== "inactive") {
        return;
      }

      if (getAnalyticsIdentityMode() !== "deferred") {
        return;
      }

      void flushBufferedAnalyticsEvents();
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!umamiReady) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const persistedUserId = await loadAnalyticsUserId();
      if (cancelled) {
        return;
      }

      const resolution = resolveAnalyticsIdentity({
        persistedUserId,
        isAuthReady: isReady,
        isAuthenticated,
        userId: user?.id ?? null,
      });

      if (resolution.mode === "pending") {
        setAnalyticsIdentityMode("pending");
        return;
      }

      if (resolution.mode === "identified" && resolution.userId) {
        await syncAnalyticsUser(resolution.userId);
        if (cancelled) {
          return;
        }

        if (resolution.shouldPersistUserId) {
          await persistAnalyticsUserId(resolution.userId);
        }

        await flushBufferedAnalyticsEvents();
        if (cancelled) {
          return;
        }

        setAnalyticsIdentityMode("identified");
        return;
      }

      setAnalyticsIdentityMode("deferred");
    })();

    return () => {
      cancelled = true;
    };
  }, [umamiReady, isReady, isAuthenticated, user?.id]);

  return children;
}
