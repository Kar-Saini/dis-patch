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
    return (
      <div className="fixed right-5 top-5 z-[100] h-10 w-10 rounded-full border border-border bg-card/90" />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-pressed={isDark}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="
        fixed right-5 top-5 z-[100]
        flex h-10 w-10 items-center justify-center
        rounded-full border border-border
        bg-card/90 text-foreground
        shadow-md backdrop-blur-xl
        transition-all duration-200
        hover:scale-105 hover:bg-muted
        active:scale-95
      "
    >
      {isDark ? (
        <Sun className="h-[18px] w-[18px]" />
      ) : (
        <Moon className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}
