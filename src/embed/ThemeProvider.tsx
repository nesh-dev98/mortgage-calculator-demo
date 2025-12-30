import React, { createContext, useContext, useMemo } from 'react'
import type { EmbedTheme } from './theme'
import { DEFAULT_THEME, mergeTheme } from './theme'

type ThemeContextValue = {
  theme: EmbedTheme
}

const ThemeContext = createContext<ThemeContextValue>({ theme: DEFAULT_THEME })

export function useEmbedTheme() {
  return useContext(ThemeContext).theme
}

function themeToCssVars(theme: EmbedTheme): React.CSSProperties {
  return {
    ['--mc-bg' as any]: theme.bg,
    ['--mc-surface' as any]: theme.surface,
    ['--mc-surface-muted' as any]: theme.surfaceMuted,
    ['--mc-border' as any]: theme.border,
    ['--mc-text' as any]: theme.text,
    ['--mc-muted' as any]: theme.muted,
    ['--mc-primary' as any]: theme.primary,
    ['--mc-primary-contrast' as any]: theme.primaryContrast,
    ['--mc-input-bg' as any]: theme.inputBg,
    ['--mc-input-border' as any]: theme.inputBorder,
    ['--mc-ring' as any]: theme.ring,
    ['--mc-chart-primary-from' as any]: theme.chart.primaryFrom,
    ['--mc-chart-primary-to' as any]: theme.chart.primaryTo,
    ['--mc-chart-secondary-from' as any]: theme.chart.secondaryFrom,
    ['--mc-chart-secondary-to' as any]: theme.chart.secondaryTo,
    ['--mc-chart-accent-from' as any]: theme.chart.accentFrom,
    ['--mc-chart-accent-to' as any]: theme.chart.accentTo,
    ['--mc-chart-neutral-from' as any]: theme.chart.neutralFrom,
    ['--mc-chart-neutral-to' as any]: theme.chart.neutralTo
  }
}

export function ThemeProvider({
  theme,
  children,
  className
}: {
  theme?: Partial<EmbedTheme>
  children: React.ReactNode
  className?: string
}) {
  const merged = useMemo(() => mergeTheme(theme), [theme])
  const value = useMemo<ThemeContextValue>(() => ({ theme: merged }), [merged])

  return (
    <ThemeContext.Provider value={value}>
      <div
        className={className}
        style={themeToCssVars(merged)}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  )
}


