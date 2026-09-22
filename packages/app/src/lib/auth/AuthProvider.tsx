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
import { clearAnalyticsUser, clearAnalyticsUserId } from "@/lib/analytics";
import { installRequestContextInterceptor } from "@/lib/api-client/request-context";
import {
  installUnauthorizedInterceptor,
  setUnauthorizedHandler,
} from "@/lib/api-client/unauthorized";
import { queryClient } from "@/lib/query-client";

import { type CurrentUser, fetchCurrentUser } from "./current-user";
import {
  clearAuthToken,
  loadAuthToken,
  persistAuthToken,
  setClientAuth,
} from "./session";
import { subscribeOnAppResume } from "./subscribe-app-resume";

type AuthContextValue = {
  isReady: boolean;
  isAuthenticated: boolean;
  user: CurrentUser | null;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<CurrentUser | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

installUnauthorizedInterceptor();
installRequestContextInterceptor();

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
      await persistAuthToken(token);
      setClientAuth(token);
      setIsAuthenticated(true);
      await refreshUser();
    },
    [refreshUser],
  );

  const signOut = useCallback(async () => {
    clearAnalyticsUser();
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
