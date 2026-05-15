import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Routes } from "@/constants/routes.constants";
import {
  client,
  postApiV1AuthLogin,
  postApiV1AuthSignup,
} from "@/lib/api-client";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { AppTitle } from "../components/AppTitle";
import { Button } from "../components/Button";
import { ThemeToggle } from "../components/ThemeToggle";
import { radius, spacing, typography } from "../theme/theme";
import { useTheme } from "../theme/useTheme";

const icon = require("../../assets/images/icon.png");

type AuthMode = "login" | "signup";

export const LoginScreen = () => {
  const { colors } = useTheme();
  const passwordRef = useRef<TextInput>(null);
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
  };

  const completeWithToken = (token: string) => {
    client.setConfig({ auth: token });
    router.replace(Routes.CARDS);
  };

  const submitLogin = async (trimmedEmail: string, pwd: string) => {
    const { data, error: apiError } = await postApiV1AuthLogin({
      body: { email: trimmedEmail, password: pwd },
    });

    if (apiError) {
      setError(getErrorMessage(apiError));
      return;
    }

    if (data?.token) {
      completeWithToken(data.token);
    } else {
      setError("Unexpected response from server.");
    }
  };

  const submitSignup = async (trimmedEmail: string, pwd: string) => {
    const { data, error: apiError } = await postApiV1AuthSignup({
      body: { email: trimmedEmail, password: pwd },
    });

    if (apiError) {
      setError(getErrorMessage(apiError));
      return;
    }

    if (!data?.id) {
      setError("Unexpected response from server.");
      return;
    }

    await submitLogin(trimmedEmail, pwd);
  };

  const submit = async () => {
    setError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Enter your email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "login") {
        await submitLogin(trimmedEmail, password);
      } else {
        await submitSignup(trimmedEmail, password);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const primaryLabel =
    mode === "login"
      ? isSubmitting
        ? "Signing in…"
        : "Sign in"
      : isSubmitting
        ? "Creating account…"
        : "Create account";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <ThemeToggle />
      </View>
      <View style={styles.content}>
        <Image
          accessibilityLabel="App logo"
          source={icon}
          style={styles.logo}
        />
        <AppTitle />
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {mode === "login"
            ? "Sign in to manage your loyalty cards"
            : "Create an account to get started"}
        </Text>

        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isSubmitting}
          keyboardType="email-address"
          placeholder="Email"
          placeholderTextColor={colors.textSecondary}
          returnKeyType="next"
          submitBehavior="submit"
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.textPrimary,
            },
          ]}
          value={email}
          onChangeText={setEmail}
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <TextInput
          ref={passwordRef}
          editable={!isSubmitting}
          placeholder="Password"
          placeholderTextColor={colors.textSecondary}
          returnKeyType="go"
          secureTextEntry
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.textPrimary,
            },
          ]}
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={() => {
            if (!isSubmitting) void submit();
          }}
        />

        {error && (
          <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
        )}

        <Button
          disabled={isSubmitting}
          title={primaryLabel}
          onPress={() => {
            void submit();
          }}
        />

        <Pressable
          accessibilityRole="button"
          disabled={isSubmitting}
          hitSlop={8}
          onPress={() => switchMode(mode === "login" ? "signup" : "login")}
        >
          <Text style={[styles.modeToggle, { color: colors.primary }]}>
            {mode === "login"
              ? "Need an account? Sign up"
              : "Already have an account? Sign in"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  logo: {
    width: 160,
    height: 160,
    alignSelf: "center",
    borderRadius: radius.lg,
  },
  subtitle: {
    ...typography.subtitle,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    ...typography.body,
  },
  error: {
    ...typography.caption,
    textAlign: "center",
  },
  modeToggle: {
    ...typography.link,
    textAlign: "center",
    marginTop: spacing.sm,
  },
});
