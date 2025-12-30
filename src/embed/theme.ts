export type EmbedTheme = {
  /** Page background behind the calculator */
  bg: string
  /** Card/background surfaces */
  surface: string
  surfaceMuted: string
  /** Border + text */
  border: string
  text: string
  muted: string
  /** Primary/accent */
  primary: string
  primaryContrast: string
  /** Inputs */
  inputBg: string
  inputBorder: string
  ring: string
  /** Chart palette (gradients) */
  chart: {
    primaryFrom: string
    primaryTo: string
    secondaryFrom: string
    secondaryTo: string
    accentFrom: string
    accentTo: string
    neutralFrom: string
    neutralTo: string
  }
}

export const DEFAULT_THEME: EmbedTheme = {
  bg: '#ffffff',
  surface: '#ffffff',
  surfaceMuted: '#f8fafc', // slate-50
  border: '#e2e8f0', // slate-200
  text: '#0f172a', // slate-900
  muted: '#64748b', // slate-500
  primary: '#1e1b4b', // navy-900
  primaryContrast: '#ffffff',
  inputBg: '#ffffff',
  inputBorder: '#e2e8f0',
  ring: 'rgba(30, 27, 75, 0.10)',
  chart: {
    primaryFrom: '#00f2fe',
    primaryTo: '#4facfe',
    secondaryFrom: '#fe8c00',
    secondaryTo: '#f83600',
    accentFrom: '#22d3ee',
    accentTo: '#22c55e',
    neutralFrom: '#e2e8f0',
    neutralTo: '#94a3b8'
  }
}

type JsonPrimitive = string | number | boolean | null
type Json = JsonPrimitive | Json[] | { [k: string]: Json }

function safeJsonParse(input: string): Json | undefined {
  try {
    return JSON.parse(input) as Json
  } catch {
    return undefined
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function coerceColor(v: unknown, fallback: string) {
  return typeof v === 'string' && v.trim().length > 0 ? v : fallback
}

export function mergeTheme(partial: Partial<EmbedTheme> | undefined): EmbedTheme {
  if (!partial) return DEFAULT_THEME
  const p = partial as Partial<EmbedTheme> & { chart?: Partial<EmbedTheme['chart']> }
  return {
    ...DEFAULT_THEME,
    ...p,
    chart: {
      ...DEFAULT_THEME.chart,
      ...(p.chart ?? {})
    }
  }
}

function base64UrlEncode(input: string) {
  const btoaFn: ((s: string) => string) | undefined = (globalThis as any).btoa
  const BufferCtor: any = (globalThis as any).Buffer

  const b64 = btoaFn
    ? btoaFn(unescape(encodeURIComponent(input)))
    : BufferCtor
      ? BufferCtor.from(input, 'utf8').toString('base64')
      : ''
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlDecode(input: string) {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
  const atobFn: ((s: string) => string) | undefined = (globalThis as any).atob
  const BufferCtor: any = (globalThis as any).Buffer

  if (atobFn) return decodeURIComponent(escape(atobFn(padded)))
  if (BufferCtor) return BufferCtor.from(padded, 'base64').toString('utf8')
  return ''
}

export function encodeThemeToParam(theme: EmbedTheme) {
  return base64UrlEncode(JSON.stringify(theme))
}

export function decodeThemeFromParam(param: string | null | undefined): EmbedTheme {
  if (!param) return DEFAULT_THEME
  const decoded = base64UrlDecode(param)
  const parsed = safeJsonParse(decoded)
  if (!parsed || !isRecord(parsed)) return DEFAULT_THEME

  const chart = isRecord(parsed.chart) ? parsed.chart : undefined
  const partial: Partial<EmbedTheme> = {
    bg: coerceColor(parsed.bg, DEFAULT_THEME.bg),
    surface: coerceColor(parsed.surface, DEFAULT_THEME.surface),
    surfaceMuted: coerceColor(parsed.surfaceMuted, DEFAULT_THEME.surfaceMuted),
    border: coerceColor(parsed.border, DEFAULT_THEME.border),
    text: coerceColor(parsed.text, DEFAULT_THEME.text),
    muted: coerceColor(parsed.muted, DEFAULT_THEME.muted),
    primary: coerceColor(parsed.primary, DEFAULT_THEME.primary),
    primaryContrast: coerceColor(parsed.primaryContrast, DEFAULT_THEME.primaryContrast),
    inputBg: coerceColor(parsed.inputBg, DEFAULT_THEME.inputBg),
    inputBorder: coerceColor(parsed.inputBorder, DEFAULT_THEME.inputBorder),
    ring: coerceColor(parsed.ring, DEFAULT_THEME.ring),
    chart: chart
      ? {
          primaryFrom: coerceColor(chart.primaryFrom, DEFAULT_THEME.chart.primaryFrom),
          primaryTo: coerceColor(chart.primaryTo, DEFAULT_THEME.chart.primaryTo),
          secondaryFrom: coerceColor(chart.secondaryFrom, DEFAULT_THEME.chart.secondaryFrom),
          secondaryTo: coerceColor(chart.secondaryTo, DEFAULT_THEME.chart.secondaryTo),
          accentFrom: coerceColor(chart.accentFrom, DEFAULT_THEME.chart.accentFrom),
          accentTo: coerceColor(chart.accentTo, DEFAULT_THEME.chart.accentTo),
          neutralFrom: coerceColor(chart.neutralFrom, DEFAULT_THEME.chart.neutralFrom),
          neutralTo: coerceColor(chart.neutralTo, DEFAULT_THEME.chart.neutralTo)
        }
      : undefined
  }

  return mergeTheme(partial)
}


