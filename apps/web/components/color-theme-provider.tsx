"use client";

import * as React from "react";

export type ColorThemeKey = "azure" | "emerald" | "violet" | "rose" | "amber";

export interface ColorTheme {
  key: ColorThemeKey;
  label: string;
  swatch: string;
  vars: {
    "--primary": string;
    "--ring": string;
    "--sidebar-primary": string;
    "--sidebar-ring": string;
    "--chart-1": string;
  };
}

export const COLOR_THEMES: ColorTheme[] = [
  {
    key: "azure",
    label: "Azure",
    swatch: "#2f6fed",
    vars: {
      "--primary": "oklch(0.62 0.16 252)",
      "--ring": "oklch(0.62 0.16 252)",
      "--sidebar-primary": "oklch(0.62 0.16 252)",
      "--sidebar-ring": "oklch(0.62 0.16 252)",
      "--chart-1": "oklch(0.62 0.16 252)",
    },
  },
  {
    key: "emerald",
    label: "Emerald",
    swatch: "#0f9f75",
    vars: {
      "--primary": "oklch(0.62 0.13 160)",
      "--ring": "oklch(0.62 0.13 160)",
      "--sidebar-primary": "oklch(0.62 0.13 160)",
      "--sidebar-ring": "oklch(0.62 0.13 160)",
      "--chart-1": "oklch(0.62 0.13 160)",
    },
  },
  {
    key: "violet",
    label: "Violet",
    swatch: "#7e5bef",
    vars: {
      "--primary": "oklch(0.6 0.16 292)",
      "--ring": "oklch(0.6 0.16 292)",
      "--sidebar-primary": "oklch(0.6 0.16 292)",
      "--sidebar-ring": "oklch(0.6 0.16 292)",
      "--chart-1": "oklch(0.6 0.16 292)",
    },
  },
  {
    key: "rose",
    label: "Rose",
    swatch: "#d83a5f",
    vars: {
      "--primary": "oklch(0.61 0.17 18)",
      "--ring": "oklch(0.61 0.17 18)",
      "--sidebar-primary": "oklch(0.61 0.17 18)",
      "--sidebar-ring": "oklch(0.61 0.17 18)",
      "--chart-1": "oklch(0.61 0.17 18)",
    },
  },
  {
    key: "amber",
    label: "Gold",
    swatch: "#d99a16",
    vars: {
      "--primary": "oklch(0.69 0.12 74)",
      "--ring": "oklch(0.69 0.12 74)",
      "--sidebar-primary": "oklch(0.69 0.12 74)",
      "--sidebar-ring": "oklch(0.69 0.12 74)",
      "--chart-1": "oklch(0.69 0.12 74)",
    },
  },
];

const DEFAULT_THEME: ColorThemeKey = "azure";
const STORAGE_KEY = "vivia-color-theme";

interface ColorThemeContextValue {
  colorTheme: ColorThemeKey;
  setColorTheme: (key: ColorThemeKey) => void;
  themes: ColorTheme[];
}

const ColorThemeContext = React.createContext<ColorThemeContextValue>({
  colorTheme: DEFAULT_THEME,
  setColorTheme: () => {},
  themes: COLOR_THEMES,
});

const isColorThemeKey = (value: string): value is ColorThemeKey =>
  COLOR_THEMES.some((theme) => theme.key === value);

export function ColorThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [colorTheme, setColorThemeState] =
    React.useState<ColorThemeKey>(DEFAULT_THEME);

  React.useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored && isColorThemeKey(stored)) {
      setColorThemeState(stored);
      return;
    }

    setColorThemeState(DEFAULT_THEME);
    localStorage.setItem(STORAGE_KEY, DEFAULT_THEME);
  }, []);

  React.useEffect(() => {
    const theme = COLOR_THEMES.find((item) => item.key === colorTheme);
    if (!theme) return;

    Object.entries(theme.vars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, [colorTheme]);

  const setColorTheme = React.useCallback((key: ColorThemeKey) => {
    setColorThemeState(key);
    localStorage.setItem(STORAGE_KEY, key);
  }, []);

  return (
    <ColorThemeContext.Provider
      value={{ colorTheme, setColorTheme, themes: COLOR_THEMES }}
    >
      {children}
    </ColorThemeContext.Provider>
  );
}

export function useColorTheme() {
  return React.useContext(ColorThemeContext);
}
