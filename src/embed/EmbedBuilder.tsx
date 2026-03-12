import { useMemo, useState } from 'react'
import { Code, Copy, Wand2, Info } from 'lucide-react'
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
  onChange,
  tooltip
}: {
  label: string
  value: string
  onChange: (v: string) => void
  tooltip: string
}) {
  return (
    <label className="group flex items-center justify-between gap-3 rounded-xl border border-[var(--mc-border)] bg-[var(--mc-surface)] px-3 py-2.5 transition-all hover:border-[var(--mc-primary)]/40 hover:shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-[color:var(--mc-text)]/85">{label}</span>
        <div className="relative">
          <Info className="h-3.5 w-3.5 cursor-help text-[var(--mc-muted)] transition-colors group-hover:text-[var(--mc-primary)]" />
          <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-48 -translate-x-1/2 rounded-lg border border-[var(--mc-border)] bg-[var(--mc-surface)] px-3 py-2 text-xs text-[var(--mc-text)] opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            {tooltip}
            <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[var(--mc-border)]" />
          </div>
        </div>
      </div>
      <input
        type="color"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-8 w-14 cursor-pointer rounded-lg border border-[var(--mc-border)] bg-transparent transition-transform hover:scale-105"
        aria-label={label}
      />
    </label>
  )
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-3">
      <h3 className="text-sm font-semibold text-[var(--mc-text)]">{title}</h3>
      <p className="mt-0.5 text-xs text-[var(--mc-muted)]">{description}</p>
    </div>
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
    const id = `mc-${Math.random().toString(36).slice(2, 8)}`
    const code = `<iframe id="${id}" src="${src}" style="border:0;width:100%;max-width:980px;height:800px;" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>\n<script>window.addEventListener('message',function(e){if(e.data&&e.data.type==='mc-resize'){var f=document.getElementById('${id}');if(f)f.style.height=e.data.height+'px';}});<\/script>`
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
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface)] p-5 shadow-sm">
        <div>
          <h1 className="text-lg font-semibold text-[var(--mc-text)]">Embed Builder</h1>
          <p className="mt-1 text-sm text-[var(--mc-muted)]">
            Customize your calculator's appearance, preview in real-time, then generate embed code.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTheme(DEFAULT_THEME)}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--mc-border)] bg-[var(--mc-surface)] px-4 py-2.5 text-sm font-semibold text-[color:var(--mc-text)]/80 shadow-sm transition-all hover:bg-[var(--mc-surface-muted)] hover:shadow-md"
          >
            Reset to Default
          </button>
          <button
            type="button"
            onClick={generate}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--mc-primary)] bg-[var(--mc-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--mc-primary-contrast)] shadow-sm transition-all hover:opacity-90 hover:shadow-md"
          >
            <Wand2 className="h-4 w-4" />
            Generate Embed Code
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)]">
        {/* Theme sidebar (outside the preview container) */}
        <section className="space-y-5 rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface-muted)] p-5 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--mc-border)] pb-4">
            <div>
              <h2 className="text-base font-semibold text-[var(--mc-text)]">Theme Customization</h2>
              <p className="mt-0.5 text-xs text-[var(--mc-muted)]">Customize the appearance of your embedded calculator</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-[var(--mc-surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--mc-muted)]">
              <Code className="h-3.5 w-3.5" />
              iframe
            </div>
          </div>

          {/* Calculator Selection */}
          <div className="rounded-xl border border-[var(--mc-border)] bg-[var(--mc-surface)] p-4">
            <SectionHeader
              title="Calculator Type"
              description="Select which calculator to embed on your website"
            />
            <select
              value={calculator}
              onChange={e => setCalculator(e.target.value as CalculatorKey)}
              className="w-full rounded-xl border border-[var(--mc-input-border)] bg-[var(--mc-input-bg)] px-3 py-2.5 text-sm font-medium text-[var(--mc-text)] shadow-sm outline-none transition-all focus:border-[var(--mc-primary)] focus:ring-2 focus:ring-[var(--mc-ring)]"
            >
              <option value="purchase">Purchase Calculator</option>
              <option value="refinance">Refinance Calculator</option>
              <option value="rent-vs-buy">Rent vs Buy Comparison</option>
              <option value="cash-out">Cash Out Refinance</option>
              <option value="rate-buydown">Rate Buydown Analysis</option>
              <option value="reverse-mortgage">Reverse Mortgage</option>
            </select>
          </div>

          {/* Layout Colors */}
          <div className="rounded-xl border border-[var(--mc-border)] bg-[var(--mc-surface)] p-4">
            <SectionHeader
              title="Layout Colors"
              description="Control the main background and container colors"
            />
            <div className="space-y-2">
              <ColorField
                label="Page Background"
                value={theme.bg}
                onChange={v => setTheme(t => ({ ...t, bg: v }))}
                tooltip="The main background color behind all content. Sets the overall page tone."
              />
              <ColorField
                label="Card Background"
                value={theme.surface}
                onChange={v => setTheme(t => ({ ...t, surface: v }))}
                tooltip="Background color for cards, panels, and elevated surfaces."
              />
              <ColorField
                label="Secondary Surface"
                value={theme.surfaceMuted}
                onChange={v => setTheme(t => ({ ...t, surfaceMuted: v }))}
                tooltip="Subtle background for secondary areas and nested containers."
              />
              <ColorField
                label="Border Color"
                value={theme.border}
                onChange={v => setTheme(t => ({ ...t, border: v }))}
                tooltip="Color for all borders, dividers, and separators."
              />
            </div>
          </div>

          {/* Typography Colors */}
          <div className="rounded-xl border border-[var(--mc-border)] bg-[var(--mc-surface)] p-4">
            <SectionHeader
              title="Typography"
              description="Customize text colors and readability"
            />
            <div className="space-y-2">
              <ColorField
                label="Primary Text"
                value={theme.text}
                onChange={v => setTheme(t => ({ ...t, text: v }))}
                tooltip="Main text color for headings, labels, and body content."
              />
              <ColorField
                label="Secondary Text"
                value={theme.muted}
                onChange={v => setTheme(t => ({ ...t, muted: v }))}
                tooltip="Subdued text for hints, descriptions, and less important content."
              />
            </div>
          </div>

          {/* Brand & Accent Colors */}
          <div className="rounded-xl border border-[var(--mc-border)] bg-[var(--mc-surface)] p-4">
            <SectionHeader
              title="Brand & Accent"
              description="Define your primary brand colors"
            />
            <div className="space-y-2">
              <ColorField
                label="Primary Color"
                value={theme.primary}
                onChange={v => setTheme(t => ({ ...t, primary: v }))}
                tooltip="Main brand color used for buttons, links, and highlights."
              />
              <ColorField
                label="Primary Text"
                value={theme.primaryContrast}
                onChange={v => setTheme(t => ({ ...t, primaryContrast: v }))}
                tooltip="Text color on primary-colored backgrounds for readability."
              />
            </div>
          </div>

          {/* Form Input Styles */}
          <div className="rounded-xl border border-[var(--mc-border)] bg-[var(--mc-surface)] p-4">
            <SectionHeader
              title="Form Inputs"
              description="Style text fields, dropdowns, and input elements"
            />
            <div className="space-y-2">
              <ColorField
                label="Input Background"
                value={theme.inputBg}
                onChange={v => setTheme(t => ({ ...t, inputBg: v }))}
                tooltip="Background color inside text fields and form inputs."
              />
              <ColorField
                label="Input Border"
                value={theme.inputBorder}
                onChange={v => setTheme(t => ({ ...t, inputBorder: v }))}
                tooltip="Border color around input fields and form controls."
              />
            </div>
          </div>

          {/* Chart Colors */}
          <div className="rounded-xl border border-[var(--mc-border)] bg-[var(--mc-surface)] p-4">
            <SectionHeader
              title="Chart & Graph Colors"
              description="Customize gradients and colors for data visualizations"
            />

            <div className="space-y-4">
              {/* Primary Chart Color */}
              <div className="rounded-lg border border-[var(--mc-border)]/50 bg-[var(--mc-surface-muted)] p-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--mc-muted)]">Primary Series</div>
                <div className="space-y-2">
                  <ColorField
                    label="Gradient Start"
                    value={theme.chart.primaryFrom}
                    onChange={v => setTheme(t => ({ ...t, chart: { ...t.chart, primaryFrom: v } }))}
                    tooltip="Starting color of the primary data series gradient (e.g., principal in pie charts)."
                  />
                  <ColorField
                    label="Gradient End"
                    value={theme.chart.primaryTo}
                    onChange={v => setTheme(t => ({ ...t, chart: { ...t.chart, primaryTo: v } }))}
                    tooltip="Ending color of the primary data series gradient."
                  />
                </div>
              </div>

              {/* Secondary Chart Color */}
              <div className="rounded-lg border border-[var(--mc-border)]/50 bg-[var(--mc-surface-muted)] p-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--mc-muted)]">Secondary Series</div>
                <div className="space-y-2">
                  <ColorField
                    label="Gradient Start"
                    value={theme.chart.secondaryFrom}
                    onChange={v => setTheme(t => ({ ...t, chart: { ...t.chart, secondaryFrom: v } }))}
                    tooltip="Starting color of the secondary data series gradient (e.g., interest in charts)."
                  />
                  <ColorField
                    label="Gradient End"
                    value={theme.chart.secondaryTo}
                    onChange={v => setTheme(t => ({ ...t, chart: { ...t.chart, secondaryTo: v } }))}
                    tooltip="Ending color of the secondary data series gradient."
                  />
                </div>
              </div>

              {/* Accent Chart Color */}
              <div className="rounded-lg border border-[var(--mc-border)]/50 bg-[var(--mc-surface-muted)] p-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--mc-muted)]">Accent Series</div>
                <div className="space-y-2">
                  <ColorField
                    label="Gradient Start"
                    value={theme.chart.accentFrom}
                    onChange={v => setTheme(t => ({ ...t, chart: { ...t.chart, accentFrom: v } }))}
                    tooltip="Starting color for accent/highlight data (e.g., taxes, insurance)."
                  />
                  <ColorField
                    label="Gradient End"
                    value={theme.chart.accentTo}
                    onChange={v => setTheme(t => ({ ...t, chart: { ...t.chart, accentTo: v } }))}
                    tooltip="Ending color for accent/highlight data gradient."
                  />
                </div>
              </div>

              {/* Neutral Chart Color */}
              <div className="rounded-lg border border-[var(--mc-border)]/50 bg-[var(--mc-surface-muted)] p-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--mc-muted)]">Neutral Series</div>
                <div className="space-y-2">
                  <ColorField
                    label="Gradient Start"
                    value={theme.chart.neutralFrom}
                    onChange={v => setTheme(t => ({ ...t, chart: { ...t.chart, neutralFrom: v } }))}
                    tooltip="Starting color for neutral/baseline data (e.g., remaining balance)."
                  />
                  <ColorField
                    label="Gradient End"
                    value={theme.chart.neutralTo}
                    onChange={v => setTheme(t => ({ ...t, chart: { ...t.chart, neutralTo: v } }))}
                    tooltip="Ending color for neutral/baseline data gradient."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Generated Embed Code */}
          {generatedCode ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--mc-text)]">Your Embed Code</h3>
                  <p className="mt-0.5 text-xs text-[var(--mc-muted)]">Copy and paste this into your website's HTML</p>
                </div>
                <button
                  type="button"
                  onClick={copy}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold shadow-sm transition-all ${
                    copyState === 'copied'
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-[var(--mc-border)] bg-[var(--mc-surface)] text-[color:var(--mc-text)]/80 hover:bg-[var(--mc-surface-muted)]'
                  }`}
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copyState === 'copied' ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
              <textarea
                value={generatedCode}
                readOnly
                className="h-28 w-full resize-none rounded-xl border border-[var(--mc-input-border)] bg-[var(--mc-input-bg)] p-3 font-mono text-xs text-[var(--mc-text)] shadow-inner outline-none"
              />
              <div className="mt-2 flex items-start gap-2 text-xs text-[var(--mc-muted)]">
                <Info className="mt-0.5 h-3 w-3 shrink-0" />
                <span>The height adjusts automatically to fit the full calculator. You can change the <code className="rounded bg-[var(--mc-surface-muted)] px-1 py-0.5">max-width</code> to fit your layout.</span>
              </div>
            </div>
          ) : null}
        </section>

        {/* Preview Panel */}
        <section className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface-muted)] p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[var(--mc-text)]">Live Preview</h2>
              <p className="mt-0.5 text-xs text-[var(--mc-muted)]">See how your calculator will look when embedded</p>
            </div>
            <div className="rounded-lg bg-[var(--mc-surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--mc-muted)]">
              Real-time
            </div>
          </div>
          <ThemeProvider theme={theme} className="rounded-2xl bg-[var(--mc-bg)] p-3 shadow-inner sm:p-4">
            {preview}
          </ThemeProvider>
        </section>
      </div>
    </div>
  )
}


