// src/components/providers/theme-provider.tsx
"use client"

import * as React from "react"
// VVV ----- จุดที่แก้ไข ----- VVV
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}