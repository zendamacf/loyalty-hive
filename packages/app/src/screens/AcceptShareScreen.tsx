import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import type { TFunction } from "i18next";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppTitle } from "@/components/AppTitle";
import { Button } from "@/components/Button";
import { Routes } from "@/constants/routes.constants";
import { I18nNamespace } from "@/i18n/i18n.constants";
import {
  AnalyticsEvents,
  trackAppEvent,
  useTrackScreenView,
} from "@/lib/analytics";
import {
  getApiV1CardsQueryKey,
  type PostApiV1SharesPreviewResponse,
  postApiV1SharesAccept,
  postApiV1SharesPreview,
} from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { savePendingShareToken } from "@/lib/pending-share";
import { radius, spacing, typography } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";

/** API status → message. The API sends 400, 403 or 410 for a bad link. */
function linkErrorMessage(
  t: TFunction,
  status: number | undefined,
  err: unknown,
) {
  switch (status) {
    case 400:
      return t("acceptShareInvalid");
    case 403:
      return t("acceptShareOtherAccount");
    case 410:
      return t("acceptShareExpired");
    default:
      return getErrorMessage(err);
  }
}

type State =
  | { status: "loading" }
  | { status: "ready"; invite: PostApiV1SharesPreviewResponse }
  | { status: "accepting"; invite: PostApiV1SharesPreviewResponse }
  /** `code`: HTTP status of the failed call. The message is built at render time. */
  | { status: "error"; code?: number; error?: unknown };

/** Tracks the failure and returns the error state. `code` is unset for a network error. */
function failed(
  step: "preview" | "accept",
  code: number | undefined,
  error: unknown,
): State {
  void trackAppEvent(AnalyticsEvents.SHARE_ACCEPT_FAILED, {
    step,
    status_code: code,
  });
  return { status: "error", code, error };
}

export const AcceptShareScreen = () => {
  const { t } = useTranslation(I18nNamespace.Cards);
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const { isReady, isAuthenticated, user } = useAuth();
  // Plain values, not the user object: the user is fetched again on app resume.
  const hasUser = user !== null;
  const emailVerified = user?.emailVerified === true;
  const [state, setState] = useState<State>({ status: "loading" });
  useTrackScreenView(Routes.ACCEPT_SHARE, { title: "Accept share" });

  useEffect(() => {
    if (!isReady) return;
    if (typeof token !== "string" || !token) {
      setState({ status: "error", code: 400 });
      return;
    }
    // AuthProvider loads the user after sign-in. Wait for it.
    if (isAuthenticated && !hasUser) return;
    if (!isAuthenticated || !emailVerified) {
      // Sign-in, then email verification, end on the cards list, which opens the invite again.
      void savePendingShareToken(token).then(() =>
        router.replace(Routes.LOGIN),
      );
      return;
    }

    void (async () => {
      try {
        const { data, error, response } = await postApiV1SharesPreview({
          body: { token },
        });
        if (data) {
          setState({ status: "ready", invite: data });
          return;
        }
        setState(failed("preview", response?.status, error));
      } catch (err) {
        // The client throws when there is no network.
        setState(failed("preview", undefined, err));
      }
    })();
  }, [isReady, isAuthenticated, hasUser, emailVerified, token]);

  const accept = async (invite: PostApiV1SharesPreviewResponse) => {
    if (typeof token !== "string") return;
    setState({ status: "accepting", invite });
    try {
      const { error, response } = await postApiV1SharesAccept({
        body: { token },
      });
      if (error) {
        setState(failed("accept", response?.status, error));
        return;
      }
    } catch (err) {
      setState(failed("accept", undefined, err));
      return;
    }
    void trackAppEvent(AnalyticsEvents.SHARE_ACCEPT, { scope: invite.scope });
    await queryClient.invalidateQueries({ queryKey: getApiV1CardsQueryKey() });
    router.replace(Routes.CARDS);
  };

  const goToCards = () => router.replace(Routes.CARDS);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        <AppTitle />
        {state.status === "loading" ? (
          <>
            <ActivityIndicator color={theme.primary} />
            <Text style={[styles.body, { color: theme.textSecondary }]}>
              {t("acceptShareLoading")}
            </Text>
          </>
        ) : null}
        {state.status === "ready" || state.status === "accepting" ? (
          <>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              {state.invite.scope === "account"
                ? t("acceptShareAccountTitle", {
                    email: state.invite.ownerEmail,
                  })
                : t("acceptShareCardTitle", {
                    email: state.invite.ownerEmail,
                  })}
            </Text>
            <Text style={[styles.body, { color: theme.textSecondary }]}>
              {state.invite.scope === "account"
                ? t("acceptShareAccountBody")
                : t("acceptShareCardBody")}
            </Text>
            <Button
              title={
                state.status === "accepting"
                  ? t("acceptShareAccepting")
                  : t("acceptShareAccept")
              }
              disabled={state.status === "accepting"}
              onPress={() => {
                void accept(state.invite);
              }}
            />
            <Pressable
              accessibilityRole="button"
              disabled={state.status === "accepting"}
              onPress={goToCards}
              style={({ pressed }) => [
                styles.secondaryButton,
                { borderColor: theme.border },
                pressed && styles.secondaryButtonPressed,
              ]}
            >
              <Text
                style={[
                  styles.secondaryButtonText,
                  { color: theme.textPrimary },
                ]}
              >
                {t("acceptShareNotNow")}
              </Text>
            </Pressable>
          </>
        ) : null}
        {state.status === "error" ? (
          <>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              {t("acceptShareErrorTitle")}
            </Text>
            <Text style={[styles.body, { color: theme.error }]}>
              {linkErrorMessage(t, state.code, state.error)}
            </Text>
            <Button title={t("acceptShareBack")} onPress={goToCards} />
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  title: {
    ...typography.title,
    textAlign: "center",
  },
  body: {
    ...typography.body,
    textAlign: "center",
  },
  secondaryButton: {
    alignSelf: "stretch",
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  secondaryButtonPressed: {
    opacity: 0.7,
  },
  secondaryButtonText: {
    ...typography.bodySemibold,
  },
});
