import { type RenderOptions, render } from "@testing-library/react-native";
import type { ReactElement } from "react";
import { ThemeProvider } from "@/theme/ThemeProvider";

export const renderWithTheme = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => render(ui, { wrapper: ThemeProvider, ...options });
