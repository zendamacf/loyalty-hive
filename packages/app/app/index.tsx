import { Redirect } from "expo-router";

import { Routes } from "@/constants/routes.constants";
import { useAuth } from "@/lib/auth";
import { LoginScreen } from "@/screens/LoginScreen";

export default function Index() {
  const { isReady, isAuthenticated } = useAuth();

  if (!isReady) {
    return null;
  }

  if (isAuthenticated) {
    return <Redirect href={Routes.CARDS} />;
  }

  return <LoginScreen />;
}
