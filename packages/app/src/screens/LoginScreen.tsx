import { router } from "expo-router";
import { EyeIcon, EyeOffIcon } from "lucide-react-native";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { I18nNamespace } from "@/i18n/i18n.constants";
import { postApiV1AuthLogin, postApiV1AuthSignup } from "@/lib/api-client";
import { authApiHeaders } from "@/lib/api-client/auth-api-headers";
import { useAuth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { AppTitle } from "../components/AppTitle";
import { Button } from "../components/Button";
import { ThemeToggle } from "../components/ThemeToggle";
import { icon as iconSize, radius, spacing, typography } from "../theme/theme";
import { useTheme } from "../theme/useTheme";

const icon = require("../../assets/images/icon.png");

type AuthMode = "login" | "signup";

export const LoginScreen = () => {
  const { t } = useTranslation([I18nNamespace.Auth, I18nNamespace.Common]);
  const { colors } = useTheme();
  const { signIn } = useAuth();
  const passwordRef = useRef<TextInput>(null);
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
  };

  const completeWithToken = async (token: string) => {
    await signIn(token);
    router.replace(Routes.CARDS);
  };

  const submitLogin = async (trimmedEmail: string, pwd: string) => {
    const { data, error: apiError } = await postApiV1AuthLogin({
      body: { email: trimmedEmail, password: pwd },
      headers: authApiHeaders(),
    });

    if (apiError) {
      setError(getErrorMessage(apiError));
      return;
    }

    if (data?.token) {
      await completeWithToken(data.token);
    } else {
      setError(t("unexpectedResponse"));
    }
  };

  const submitSignup = async (trimmedEmail: string, pwd: string) => {
    const { data, error: apiError } = await postApiV1AuthSignup({
      body: { email: trimmedEmail, password: pwd },
      headers: authApiHeaders(),
    });

    if (apiError) {
      setError(getErrorMessage(apiError));
      return;
    }

    if (!data?.id) {
      setError(t("unexpectedResponse"));
      return;
    }

    await submitLogin(trimmedEmail, pwd);
  };

  const submit = async () => {
    setError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError(t("enterEmailPassword"));
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
        ? t("signingIn")
        : t("signIn")
      : isSubmitting
        ? t("creatingAccount")
        : t("createAccount");

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <ThemeToggle />
      </View>
      <View style={styles.content}>
        <Image
          accessibilityLabel={t("appLogo", { ns: I18nNamespace.Common })}
          source={icon}
          style={styles.logo}
        />
        <AppTitle />
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {mode === "login" ? t("subtitleLogin") : t("subtitleSignup")}
        </Text>

        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isSubmitting}
          keyboardType="email-address"
          placeholder={t("email")}
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
        <View
          style={[
            styles.passwordField,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <TextInput
            ref={passwordRef}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isSubmitting}
            placeholder={t("password")}
            placeholderTextColor={colors.textSecondary}
            returnKeyType="go"
            secureTextEntry={!showPassword}
            style={[styles.passwordInput, { color: colors.textPrimary }]}
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={() => {
              if (!isSubmitting) void submit();
            }}
          />
          <Pressable
            accessibilityLabel={
              showPassword ? t("hidePassword") : t("showPassword")
            }
            accessibilityRole="button"
            disabled={isSubmitting}
            hitSlop={8}
            style={styles.passwordToggle}
            onPress={() => setShowPassword((visible) => !visible)}
          >
            {showPassword ? (
              <EyeOffIcon color={colors.textSecondary} size={iconSize.md} />
            ) : (
              <EyeIcon color={colors.textSecondary} size={iconSize.md} />
            )}
          </Pressable>
        </View>

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
            {mode === "login" ? t("needAccount") : t("alreadyHaveAccount")}
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
    paddingTop: spacing.md,
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
  passwordField: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.md,
    paddingRight: spacing.xs,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    ...typography.body,
  },
  passwordToggle: {
    padding: spacing.xs,
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
