import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";
const ThemeContext = createContext<{ theme: Theme; toggle: () => void } | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("isf-theme")) as Theme | null;
    const prefersDark = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const initial = saved ?? (prefersDark ? "dark" : "light");
    setTheme(initial);
  }, []);
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
  const toggle = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") localStorage.setItem("isf-theme", next);
      return next;
    });
  };
  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const v = useContext(ThemeContext);
  if (!v) throw new Error("useTheme must be used inside ThemeProvider");
  return v;
}