"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-10 w-full animate-pulse rounded-xl bg-muted/50" />;
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-pressed={isDark}
      className="
        group flex w-full items-center gap-3
        rounded-xl border border-border
        bg-card px-3 py-2.5
        text-card-foreground
        transition-colors duration-200
        hover:cursor-pointer
      "
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
        {isDark ? (
          <Sun className="h-4 w-4 text-foreground" />
        ) : (
          <Moon className="h-4 w-4 text-foreground" />
        )}
      </span>

      <span className="flex-1 text-left text-xs font-medium">
        {isDark ? "Light Mode" : "Dark Mode"}
      </span>
    </button>
  );
}
