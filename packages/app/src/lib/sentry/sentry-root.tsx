import * as Sentry from "@sentry/react-native";
import type { ErrorBoundaryProps } from "expo-router";
import type { ComponentType } from "react";

import { initSentry } from "./init-sentry";

export function wrapRootLayout(Layout: ComponentType): ComponentType {
  initSentry();
  return Sentry.wrap(Layout);
}

export function wrapExpoErrorBoundary(
  ExpoErrorBoundary: ComponentType<ErrorBoundaryProps>,
): ComponentType<ErrorBoundaryProps> {
  initSentry();
  return Sentry.wrapExpoRouterErrorBoundary(ExpoErrorBoundary);
}
