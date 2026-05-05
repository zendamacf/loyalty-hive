import * as Sentry from "@sentry/react-native";
import { Stack } from "expo-router";

Sentry.init({
  dsn: "https://74e37cfea8703595ffd65f353854184b@o4509541345591296.ingest.de.sentry.io/4511337311436881",
  sendDefaultPii: true,
  enableLogs: true,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration()],
});

export default Sentry.wrap(function Layout() {
  return <Stack screenOptions={{ headerShown: false }} />;
});
