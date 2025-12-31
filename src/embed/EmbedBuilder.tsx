import { useMemo, useState } from 'react'
import { Code, Copy, Wand2 } from 'lucide-react'
import { CashOutCalculator } from '../components/CashOutCalculator'
import { PurchaseCalculator } from '../components/PurchaseCalculator'
import { RateBuydownCalculator } from '../components/RateBuydownCalculator'
import { RefinanceCalculator } from '../components/RefinanceCalculator'
import { RentVsBuyCalculator } from '../components/RentVsBuyCalculator'
import { ReverseMortgageCalculator } from '../components/ReverseMortgageCalculator'
import { ThemeProvider } from './ThemeProvider'
import { DEFAULT_THEME, type EmbedTheme, encodeThemeToParam, mergeTheme } from './theme'

type CalculatorKey =
  | 'purchase'
  | 'refinance'
  | 'rent-vs-buy'
  | 'cash-out'
  | 'rate-buydown'
  | 'reverse-mortgage'

function ColorField({
  label,
  value,
  onChange
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-[var(--mc-border)] bg-[var(--mc-surface)] px-3 py-2">
      <span className="text-sm font-medium text-[color:var(--mc-text)]/85">{label}</span>
      <input
        type="color"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-8 w-14 cursor-pointer rounded-lg border border-[var(--mc-border)] bg-transparent"
        aria-label={label}
      />
    </label>
  )
}

export function EmbedBuilder() {
  const [calculator, setCalculator] = useState<CalculatorKey>('purchase')
  const [theme, setTheme] = useState<EmbedTheme>(DEFAULT_THEME)
  const [generatedCode, setGeneratedCode] = useState<string>('')
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle')

  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  const preview = useMemo(() => {
    switch (calculator) {
      case 'purchase':
        return <PurchaseCalculator />
      case 'refinance':
        return <RefinanceCalculator />
      case 'rent-vs-buy':
        return <RentVsBuyCalculator />
      case 'cash-out':
        return <CashOutCalculator />
      case 'rate-buydown':
        return <RateBuydownCalculator />
      case 'reverse-mortgage':
        return <ReverseMortgageCalculator />
      default:
        return <PurchaseCalculator />
    }
  }, [calculator])

  function generate() {
    const merged = mergeTheme(theme)
    const t = encodeThemeToParam(merged)
    const src = `${origin}/embed?calculator=${encodeURIComponent(calculator)}&t=${encodeURIComponent(t)}`
    const code = `<iframe src="${src}" style="border:0;width:100%;max-width:980px;height:820px;" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`
    setGeneratedCode(code)
    setCopyState('idle')
  }

  async function copy() {
    if (!generatedCode) return
    try {
      await navigator.clipboard.writeText(generatedCode)
      setCopyState('copied')
      window.setTimeout(() => setCopyState('idle'), 1500)
    } catch {
      // Fallback: user can copy manually.
      setCopyState('idle')
    }
  }

  return (
    <div className="text-[var(--mc-text)]">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface)] p-5 shadow-sm">
        <div>
          <div className="text-sm font-semibold text-[var(--mc-text)]">Embed Builder</div>
          <div className="mt-1 text-sm text-[var(--mc-muted)]">
            Customize colors, preview, then generate an embed code you can paste on any website.
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={generate}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--mc-primary)] bg-[var(--mc-primary)] px-3 py-2 text-sm font-semibold text-[var(--mc-primary-contrast)] shadow-sm"
          >
            <Wand2 className="h-4 w-4" />
            Generate Calculator
          </button>
          <button
            type="button"
            onClick={() => setTheme(DEFAULT_THEME)}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--mc-border)] bg-[var(--mc-surface)] px-3 py-2 text-sm font-semibold text-[color:var(--mc-text)]/80 shadow-sm hover:bg-[var(--mc-surface-muted)]"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)]">
        {/* Theme sidebar (outside the preview container) */}
        <section className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface-muted)] p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-[var(--mc-text)]">Theme</div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--mc-muted)]">
              <Code className="h-4 w-4" />
              iframe embed
            </div>
          </div>

          <label className="block">
            <div className="text-sm font-medium text-[color:var(--mc-text)]/85">Calculator</div>
            <select
              value={calculator}
              onChange={e => setCalculator(e.target.value as CalculatorKey)}
              className="mt-2 w-full rounded-xl border border-[var(--mc-input-border)] bg-[var(--mc-input-bg)] px-3 py-2.5 text-sm font-medium text-[var(--mc-text)] shadow-sm outline-none focus:border-[var(--mc-primary)] focus:ring-2 focus:ring-[var(--mc-ring)]"
            >
              <option value="purchase">Purchase</option>
              <option value="refinance">Refinance</option>
              <option value="rent-vs-buy">Rent vs Buy</option>
              <option value="cash-out">Cash Out</option>
              <option value="rate-buydown">Rate Buydown</option>
              <option value="reverse-mortgage">Reverse Mortgage</option>
            </select>
          </label>

          <div className="mt-4 grid gap-2">
            <ColorField label="Background" value={theme.bg} onChange={v => setTheme(t => ({ ...t, bg: v }))} />
            <ColorField
              label="Surface"
              value={theme.surface}
              onChange={v => setTheme(t => ({ ...t, surface: v }))}
            />
            <ColorField
              label="Surface (muted)"
              value={theme.surfaceMuted}
              onChange={v => setTheme(t => ({ ...t, surfaceMuted: v }))}
            />
            <ColorField
              label="Border"
              value={theme.border}
              onChange={v => setTheme(t => ({ ...t, border: v }))}
            />
            <ColorField label="Text" value={theme.text} onChange={v => setTheme(t => ({ ...t, text: v }))} />
            <ColorField
              label="Muted text"
              value={theme.muted}
              onChange={v => setTheme(t => ({ ...t, muted: v }))}
            />
            <ColorField
              label="Primary"
              value={theme.primary}
              onChange={v => setTheme(t => ({ ...t, primary: v }))}
            />
            <ColorField
              label="Primary contrast"
              value={theme.primaryContrast}
              onChange={v => setTheme(t => ({ ...t, primaryContrast: v }))}
            />
            <ColorField
              label="Input background"
              value={theme.inputBg}
              onChange={v => setTheme(t => ({ ...t, inputBg: v }))}
            />
            <ColorField
              label="Input border"
              value={theme.inputBorder}
              onChange={v => setTheme(t => ({ ...t, inputBorder: v }))}
            />
          </div>

          <div className="mt-4 rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface)] p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--mc-muted)]">
              Charts
            </div>
            <div className="mt-2 grid gap-2">
              <ColorField
                label="Primary (from)"
                value={theme.chart.primaryFrom}
                onChange={v => setTheme(t => ({ ...t, chart: { ...t.chart, primaryFrom: v } }))}
              />
              <ColorField
                label="Primary (to)"
                value={theme.chart.primaryTo}
                onChange={v => setTheme(t => ({ ...t, chart: { ...t.chart, primaryTo: v } }))}
              />
              <ColorField
                label="Secondary (from)"
                value={theme.chart.secondaryFrom}
                onChange={v => setTheme(t => ({ ...t, chart: { ...t.chart, secondaryFrom: v } }))}
              />
              <ColorField
                label="Secondary (to)"
                value={theme.chart.secondaryTo}
                onChange={v => setTheme(t => ({ ...t, chart: { ...t.chart, secondaryTo: v } }))}
              />
              <ColorField
                label="Accent (from)"
                value={theme.chart.accentFrom}
                onChange={v => setTheme(t => ({ ...t, chart: { ...t.chart, accentFrom: v } }))}
              />
              <ColorField
                label="Accent (to)"
                value={theme.chart.accentTo}
                onChange={v => setTheme(t => ({ ...t, chart: { ...t.chart, accentTo: v } }))}
              />
              <ColorField
                label="Neutral (from)"
                value={theme.chart.neutralFrom}
                onChange={v => setTheme(t => ({ ...t, chart: { ...t.chart, neutralFrom: v } }))}
              />
              <ColorField
                label="Neutral (to)"
                value={theme.chart.neutralTo}
                onChange={v => setTheme(t => ({ ...t, chart: { ...t.chart, neutralTo: v } }))}
              />
            </div>
          </div>

          {generatedCode ? (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold text-[var(--mc-text)]">Embed code</div>
                <button
                  type="button"
                  onClick={copy}
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--mc-border)] bg-[var(--mc-surface)] px-3 py-2 text-xs font-semibold text-[color:var(--mc-text)]/80 shadow-sm hover:bg-[var(--mc-surface-muted)]"
                >
                  <Copy className="h-4 w-4" />
                  {copyState === 'copied' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <textarea
                value={generatedCode}
                readOnly
                className="h-32 w-full resize-none rounded-2xl border border-[var(--mc-input-border)] bg-[var(--mc-input-bg)] p-3 font-mono text-xs text-[var(--mc-text)] shadow-sm outline-none"
              />
              <div className="mt-2 text-xs text-[var(--mc-muted)]">
                Tip: you can adjust the iframe height/width in the embed code to fit your page.
              </div>
            </div>
          ) : null}
        </section>

        {/* Preview gets the majority of width */}
        <section className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface-muted)] p-4 shadow-sm">
          <div className="mb-3 text-sm font-semibold text-[var(--mc-text)]">Preview</div>
          <ThemeProvider theme={theme} className="rounded-2xl bg-[var(--mc-bg)] p-2 sm:p-3">
            {preview}
          </ThemeProvider>
        </section>
      </div>
    </div>
  )
}


