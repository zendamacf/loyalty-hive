import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";

import { ForceUpdateScreen } from "@/components/ForceUpdateScreen";
import { getApiV1MetaAppVersion } from "@/lib/api-client";
import { authApiHeaders } from "@/lib/api-client/auth-api-headers";

import { isBelowMinimumVersion } from "./compareSemver";
import { getAppVersion } from "./getAppVersion";
import { shouldSkipVersionCheck } from "./version-check.constants";

type VersionCheckContextValue = {
  isReady: boolean;
  updateRequired: boolean;
};

const VersionCheckContext = createContext<VersionCheckContextValue | null>(
  null,
);

async function checkMinimumAppVersion(): Promise<boolean> {
  const { data, error } = await getApiV1MetaAppVersion({
    headers: authApiHeaders(),
  });

  if (error || !data) {
    return false;
  }

  return isBelowMinimumVersion(getAppVersion(), data.minimumVersion);
}

export function VersionCheckProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(
    shouldSkipVersionCheck() || Platform.OS === "web",
  );
  const [updateRequired, setUpdateRequired] = useState(false);

  useEffect(() => {
    if (shouldSkipVersionCheck() || Platform.OS === "web") {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const requiresUpdate = await checkMinimumAppVersion();
        if (cancelled) {
          return;
        }

        setUpdateRequired(requiresUpdate);
      } catch {
        // Fail open when the version check cannot be completed.
      } finally {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      isReady,
      updateRequired,
    }),
    [isReady, updateRequired],
  );

  if (!isReady) {
    return null;
  }

  if (updateRequired) {
    return <ForceUpdateScreen />;
  }

  return (
    <VersionCheckContext.Provider value={value}>
      {children}
    </VersionCheckContext.Provider>
  );
}

export function useVersionCheck(): VersionCheckContextValue {
  const context = useContext(VersionCheckContext);

  if (!context) {
    throw new Error("useVersionCheck must be used within VersionCheckProvider");
  }

  return context;
}
