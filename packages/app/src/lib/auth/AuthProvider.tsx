import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { queryClient } from "@/lib/query-client";

import {
  clearAuthToken,
  loadAuthToken,
  persistAuthToken,
  setClientAuth,
} from "./session";

type AuthContextValue = {
  isReady: boolean;
  isAuthenticated: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
      }

      setIsReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (token: string) => {
    await persistAuthToken(token);
    setClientAuth(token);
    setIsAuthenticated(true);
  }, []);

  const signOut = useCallback(async () => {
    await clearAuthToken();
    setClientAuth(undefined);
    setIsAuthenticated(false);
    queryClient.clear();
  }, []);

  const value = useMemo(
    () => ({ isReady, isAuthenticated, signIn, signOut }),
    [isReady, isAuthenticated, signIn, signOut],
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
