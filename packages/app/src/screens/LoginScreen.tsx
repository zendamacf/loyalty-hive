import { router } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../components/Button";
import { client, postApiV1AuthLogin } from "../lib/api-client";
import { radius, spacing } from "../theme/theme";
import { useTheme } from "../theme/useTheme";

const icon = require("../../assets/images/icon.png");

export const LoginScreen = () => {
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    setError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Enter your email and password.");
      return;
    }

    setIsSubmitting(true);
    const { data, error } = await postApiV1AuthLogin({
      body: { email: trimmedEmail, password },
    });
    setIsSubmitting(false);

    if (error) {
      setError(error.error);
      return;
    }

    if (data?.token) {
      client.setConfig({ auth: data.token });
      router.replace("/home");
    } else {
      setError("Unexpected response from server.");
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.content}>
        <Image
          accessibilityLabel="App logo"
          source={icon}
          style={styles.logo}
        />
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Loyalty Hive
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Sign in to manage your loyalty cards
        </Text>

        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isSubmitting}
          keyboardType="email-address"
          placeholder="Email"
          placeholderTextColor={colors.textSecondary}
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
        />
        <TextInput
          editable={!isSubmitting}
          placeholder="Password"
          placeholderTextColor={colors.textSecondary}
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
        />

        {error && (
          <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
        )}

        <Button
          disabled={isSubmitting}
          title={isSubmitting ? "Signing in…" : "Sign in"}
          onPress={() => {
            void submit();
          }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  logo: {
    width: 96,
    height: 96,
    alignSelf: "center",
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 16,
  },
  error: {
    fontSize: 14,
    textAlign: "center",
  },
});
