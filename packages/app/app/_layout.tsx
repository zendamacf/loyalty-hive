import * as Sentry from "@sentry/react-native";
import { Stack } from "expo-router";

Sentry.init({
  environment: process.env.NODE_ENV ?? "development",
  dsn: process.env.SENTRY_DSN,
  sendDefaultPii: true,
  enableLogs: true,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration()],
});

export default Sentry.wrap(function Layout() {
  return <Stack screenOptions={{ headerShown: false }} />;
});
