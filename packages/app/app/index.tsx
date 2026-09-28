import { Redirect } from "expo-router";
import { useEffect } from "react";

import { Routes } from "@/constants/routes.constants";
import { useAuth } from "@/lib/auth";
import { LoginScreen } from "@/screens/LoginScreen";

export default function Index() {
  const { isReady, isAuthenticated, user, refreshUser } = useAuth();

  useEffect(() => {
    if (isAuthenticated && !user) {
      void refreshUser();
    }
  }, [isAuthenticated, user, refreshUser]);

  if (!isReady) {
    return null;
  }

  if (isAuthenticated) {
    if (!user) {
      return null;
    }
    if (!user.emailVerified) {
      return <Redirect href={Routes.CHECK_EMAIL} />;
    }
    return <Redirect href={Routes.CARDS} />;
  }

  return <LoginScreen />;
}
