"use client"

import * as React from "react"
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes"

interface ExtendedThemeProviderProps extends ThemeProviderProps {
  suppressHydrationWarning?: boolean
}

export function ThemeProvider({ 
  children, 
  suppressHydrationWarning, 
  ...props 
}: ExtendedThemeProviderProps) {
  return (
    <div suppressHydrationWarning={suppressHydrationWarning}>
      <NextThemesProvider {...props}>
        {children}
      </NextThemesProvider>
    </div>
  )
}