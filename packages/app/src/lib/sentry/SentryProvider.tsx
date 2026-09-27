import type { ReactNode } from "react";

import { initSentry } from "./init-sentry";

initSentry();

export function SentryProvider({ children }: { children: ReactNode }) {
  return children;
}
