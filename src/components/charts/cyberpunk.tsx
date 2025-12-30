import type { ReactNode } from 'react'

export const CYBERPUNK = {
  primaryFrom: '#00f2fe', // Electric Blue
  primaryTo: '#4facfe', // Neon Purple/Blue
  secondaryFrom: '#fe8c00', // Neon Orange
  secondaryTo: '#f83600', // Pink/Red
  accentFrom: '#22d3ee', // Cyan
  accentTo: '#22c55e', // Green
  neutralFrom: '#e2e8f0', // slate-200
  neutralTo: '#94a3b8' // slate-400
} as const

// Recharts supports a set of easing strings (via react-smooth). Use a widely supported one
// to ensure animations work consistently across builds.
export const CHART_ANIMATION = {
  durationMs: 1500,
  easing: 'ease-in-out' as const
}

export type CyberpunkPalette = {
  primaryFrom: string
  primaryTo: string
  secondaryFrom: string
  secondaryTo: string
  accentFrom: string
  accentTo: string
  neutralFrom: string
  neutralTo: string
}

// IMPORTANT: Recharts can filter/clone children; passing a custom <CyberpunkDefs/> component
// may get dropped in some cases. Export a function that returns a real <defs> element and
// call it inline so the tree contains an actual <defs>.
export function renderCyberpunkDefs(idPrefix: string, palette: CyberpunkPalette = CYBERPUNK) {
  return (
    <defs>
      <linearGradient id={`${idPrefix}-grad-primary`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={palette.primaryFrom} />
        <stop offset="100%" stopColor={palette.primaryTo} />
      </linearGradient>

      <linearGradient id={`${idPrefix}-grad-secondary`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={palette.secondaryFrom} />
        <stop offset="100%" stopColor={palette.secondaryTo} />
      </linearGradient>

      <linearGradient id={`${idPrefix}-grad-accent`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={palette.accentFrom} />
        <stop offset="100%" stopColor={palette.accentTo} />
      </linearGradient>

      <linearGradient id={`${idPrefix}-grad-neutral`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={palette.neutralFrom} />
        <stop offset="100%" stopColor={palette.neutralTo} />
      </linearGradient>

      {/* Subtle neon glow for “futuristic” look */}
      <filter id={`${idPrefix}-glow`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3.5" result="blur" />
        <feColorMatrix
          in="blur"
          type="matrix"
          values="
            1 0 0 0 0
            0 1 0 0 0
            0 0 1 0 0
            0 0 0 0.65 0"
          result="coloredBlur"
        />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  )
}

type CyberpunkTooltipProps = {
  active?: boolean
  payload?: Array<{ name?: ReactNode; value?: unknown; color?: string }>
  label?: ReactNode
  labelFormatter?: (label: unknown) => ReactNode
  valueFormatter?: (value: unknown) => ReactNode
}

export function CyberpunkTooltip({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter
}: CyberpunkTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const shownLabel = labelFormatter ? labelFormatter(label) : label
  const fmt = valueFormatter ?? (v => String(v ?? ''))

  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.78)',
        border: '1px solid rgba(79, 172, 254, 0.35)',
        borderRadius: 14,
        padding: '10px 12px',
        color: 'rgba(248, 250, 252, 0.95)',
        boxShadow:
          '0 12px 34px -18px rgba(0,0,0,0.55), 0 0 22px rgba(79,172,254,0.25)',
        backdropFilter: 'blur(10px)'
      }}
    >
      {shownLabel ? (
        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(226,232,240,0.9)' }}>
          {shownLabel}
        </div>
      ) : null}

      <div style={{ marginTop: shownLabel ? 8 : 0, display: 'grid', gap: 6 }}>
        {payload.map((p, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 14
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: p.color ?? 'rgba(79,172,254,0.9)',
                  boxShadow: '0 0 12px rgba(79,172,254,0.35)'
                }}
              />
              <span style={{ fontSize: 12, color: 'rgba(226,232,240,0.9)', whiteSpace: 'nowrap' }}>
                {p.name ?? ''}
              </span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(248,250,252,0.98)' }}>
              {fmt(p.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}


