import { type RenderOptions, render } from "@testing-library/react-native";
import type { ReactElement } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { TestLanguageProvider } from "./TestLanguageProvider";

const Providers = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>
    <TestLanguageProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </TestLanguageProvider>
  </I18nextProvider>
);

export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => render(ui, { wrapper: Providers, ...options });

/** @deprecated Use renderWithProviders */
export const renderWithTheme = renderWithProviders;
