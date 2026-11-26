import * as Sentry from "@sentry/react-native";
import { router } from "expo-router";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Routes } from "@/constants/routes.constants";
import {
  clearAnalyticsUserId,
  signOutAnalytics,
} from "@/lib/analytics/analytics-user";
import { installErrorReportingInterceptor } from "@/lib/api-client/error-reporting";
import { installRequestContextInterceptor } from "@/lib/api-client/request-context";
import {
  installUnauthorizedInterceptor,
  setUnauthorizedHandler,
} from "@/lib/api-client/unauthorized";
import { clearOfflineCache } from "@/lib/offline-cache";
import { queryClient } from "@/lib/query-client";

import { type CurrentUser, fetchCurrentUser } from "./current-user";
import {
  clearAuthToken,
  loadAuthToken,
  persistAuthToken,
  setClientAuth,
} from "./session";
import { markSessionExpired } from "./session-expired-notice";
import { subscribeOnAppResume } from "./subscribe-app-resume";

type AuthContextValue = {
  isReady: boolean;
  isAuthenticated: boolean;
  user: CurrentUser | null;
  signIn: (token: string) => Promise<CurrentUser | null>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<CurrentUser | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

installUnauthorizedInterceptor();
installRequestContextInterceptor();
installErrorReportingInterceptor();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const signOutRef = useRef<() => Promise<void>>(async () => {});

  const refreshUser = useCallback(async (): Promise<CurrentUser | null> => {
    const nextUser = await fetchCurrentUser();
    setUser(nextUser);
    return nextUser;
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const token = await loadAuthToken();
      if (cancelled) {
        return;
      }

      if (token) {
        Sentry.addBreadcrumb({
          category: "auth",
          message: "Restored saved session",
        });
        setClientAuth(token);
        setIsAuthenticated(true);
        void refreshUser();
      }

      setIsReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

  const signIn = useCallback(
    async (token: string) => {
      Sentry.addBreadcrumb({ category: "auth", message: "Signed in" });
      await persistAuthToken(token);
      setClientAuth(token);
      setIsAuthenticated(true);
      return await refreshUser();
    },
    [refreshUser],
  );

  const signOut = useCallback(async () => {
    Sentry.addBreadcrumb({ category: "auth", message: "Signed out" });
    try {
      // Cached cards go first so a failure below can never leave them behind.
      await clearOfflineCache();
    } catch (err) {
      Sentry.captureException(err);
    }
    signOutAnalytics();
    await clearAnalyticsUserId();
    setUser(null);
    await clearAuthToken();
    setClientAuth(undefined);
    setIsAuthenticated(false);
    queryClient.clear();
  }, []);

  signOutRef.current = signOut;

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      Sentry.addBreadcrumb({
        category: "auth",
        message: "Session expired",
        level: "warning",
      });
      markSessionExpired();
      await signOutRef.current();
      router.replace(Routes.LOGIN);
    });

    return () => {
      setUnauthorizedHandler(undefined);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    return subscribeOnAppResume(() => {
      void refreshUser();
    });
  }, [isAuthenticated, refreshUser]);

  const value = useMemo(
    () => ({
      isReady,
      isAuthenticated,
      user,
      signIn,
      signOut,
      refreshUser,
    }),
    [isReady, isAuthenticated, user, signIn, signOut, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
