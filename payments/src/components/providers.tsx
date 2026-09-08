"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * Shared client providers for every micro-frontend shell/remote:
 * - next-themes for class-based light/dark (SSR-safe, no flash)
 * - Radix TooltipProvider so tooltips work app-wide
 */
export function UIProviders({
  children,
  ...themeProps
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...themeProps}
    >
      <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
    </NextThemesProvider>
  );
}
