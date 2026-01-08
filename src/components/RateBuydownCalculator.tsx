import { useId, useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CHART_ANIMATION, CyberpunkTooltip, renderCyberpunkDefs } from './charts/cyberpunk'
import { useEmbedTheme } from '../embed/ThemeProvider'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
})

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) return '$0'
  return currencyFormatter.format(Math.max(0, Math.round(value)))
}

function clampNonNegative(n: number) {
  return Number.isFinite(n) ? Math.max(0, n) : 0
}

function calculateMonthlyPrincipalAndInterest(
  principal: number,
  annualRatePercent: number,
  termYears: number
) {
  const P = clampNonNegative(principal)
  const years = clampNonNegative(termYears)
  const n = Math.round(years * 12)
  if (P === 0 || n === 0) return 0

  const annualRate = clampNonNegative(annualRatePercent) / 100
  const r = annualRate / 12
  if (r === 0) return P / n

  const pow = Math.pow(1 + r, n)
  return (P * r * pow) / (pow - 1)
}

type MoneyInputProps = {
  id: string
  label: string
  value: number
  onChange: (n: number) => void
  helper?: string
}

function MoneyInput({ id, label, value, onChange, helper }: MoneyInputProps) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-[color:var(--mc-text)]/85">{label}</div>
      <div className="mt-2 flex items-center rounded-xl border border-[var(--mc-input-border)] bg-[var(--mc-input-bg)] shadow-sm focus-within:border-[var(--mc-primary)] focus-within:ring-2 focus-within:ring-[var(--mc-ring)]">
        <span className="select-none pl-3 text-sm font-semibold text-[var(--mc-muted)]">$</span>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          value={Number.isFinite(value) ? value : 0}
          onChange={e => onChange(clampNonNegative(Number(e.target.value)))}
          className="w-full bg-transparent px-2 py-2.5 text-sm font-medium text-[var(--mc-text)] outline-none"
          aria-label={label}
        />
      </div>
      {helper ? <div className="mt-1 text-xs text-[var(--mc-muted)]">{helper}</div> : null}
    </label>
  )
}

type NumberInputProps = {
  id: string
  label: string
  value: number
  onChange: (n: number) => void
  min?: number
  step?: number
  suffix?: string
  helper?: string
}

function NumberInput({
  id,
  label,
  value,
  onChange,
  min = 0,
  step,
  suffix,
  helper
}: NumberInputProps) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-[color:var(--mc-text)]/85">{label}</div>
      <div className="mt-2 flex items-center rounded-xl border border-[var(--mc-input-border)] bg-[var(--mc-input-bg)] shadow-sm focus-within:border-[var(--mc-primary)] focus-within:ring-2 focus-within:ring-[var(--mc-ring)]">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          value={Number.isFinite(value) ? value : 0}
          onChange={e => onChange(clampNonNegative(Number(e.target.value)))}
          className="w-full bg-transparent px-3 py-2.5 text-sm font-medium text-[var(--mc-text)] outline-none"
          aria-label={label}
        />
        {suffix ? (
          <span className="select-none pr-3 text-sm font-semibold text-[var(--mc-muted)]">
            {suffix}
          </span>
        ) : null}
      </div>
      {helper ? <div className="mt-1 text-xs text-[var(--mc-muted)]">{helper}</div> : null}
    </label>
  )
}

type BuydownType = 'none' | 'temporary-2-1'

type ScheduleRow = {
  periodLabel: string
  ratePercent: number
  monthlyPayment: number
  annualPayment: number
  savingsMonthly?: number
  savingsAnnual?: number
}

export function RateBuydownCalculator() {
  const theme = useEmbedTheme()
  const TERM_YEARS = 30

  const [buydownType, setBuydownType] = useState<BuydownType>('temporary-2-1')
  const [loanAmount, setLoanAmount] = useState(320_000)
  const [baseRatePercent, setBaseRatePercent] = useState(6.5)

  const chartId = `cp-buydown-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

  const { baseMonthlyPayment, schedule } = useMemo(() => {
    const basePayment = calculateMonthlyPrincipalAndInterest(loanAmount, baseRatePercent, TERM_YEARS)

    const rows: ScheduleRow[] = []

    if (buydownType === 'temporary-2-1') {
      const y1Rate = Math.max(0, baseRatePercent - 2)
      const y2Rate = Math.max(0, baseRatePercent - 1)
      const y3Rate = Math.max(0, baseRatePercent)

      const y1Pay = calculateMonthlyPrincipalAndInterest(loanAmount, y1Rate, TERM_YEARS)
      const y2Pay = calculateMonthlyPrincipalAndInterest(loanAmount, y2Rate, TERM_YEARS)
      const y3Pay = calculateMonthlyPrincipalAndInterest(loanAmount, y3Rate, TERM_YEARS)

      rows.push({
        periodLabel: 'Year 1',
        ratePercent: y1Rate,
        monthlyPayment: y1Pay,
        annualPayment: y1Pay * 12,
        savingsMonthly: basePayment - y1Pay,
        savingsAnnual: (basePayment - y1Pay) * 12
      })
      rows.push({
        periodLabel: 'Year 2',
        ratePercent: y2Rate,
        monthlyPayment: y2Pay,
        annualPayment: y2Pay * 12,
        savingsMonthly: basePayment - y2Pay,
        savingsAnnual: (basePayment - y2Pay) * 12
      })
      rows.push({
        periodLabel: 'Year 3–30',
        ratePercent: y3Rate,
        monthlyPayment: y3Pay,
        annualPayment: y3Pay * 12
      })
    } else {
      rows.push({
        periodLabel: 'Year 1–30',
        ratePercent: Math.max(0, baseRatePercent),
        monthlyPayment: basePayment,
        annualPayment: basePayment * 12
      })
    }

    return { baseMonthlyPayment: basePayment, schedule: rows }
  }, [baseRatePercent, buydownType, loanAmount])

  const yearlySeries = useMemo(() => {
    const basePayment = calculateMonthlyPrincipalAndInterest(loanAmount, baseRatePercent, TERM_YEARS)
    let cumulativeSavings = 0

    const points = Array.from({ length: TERM_YEARS }, (_, idx) => {
      const year = idx + 1
      const effectiveRate =
        buydownType === 'temporary-2-1'
          ? year === 1
            ? Math.max(0, baseRatePercent - 2)
            : year === 2
              ? Math.max(0, baseRatePercent - 1)
              : Math.max(0, baseRatePercent)
          : Math.max(0, baseRatePercent)

      const payment = calculateMonthlyPrincipalAndInterest(loanAmount, effectiveRate, TERM_YEARS)
      const savingsMonthly = Math.max(0, basePayment - payment)
      const savingsAnnual = savingsMonthly * 12
      cumulativeSavings += savingsAnnual

      return {
        year,
        payment,
        basePayment,
        savingsAnnual,
        cumulativeSavings
      }
    })

    // In a 2-1 buydown, savings stop after year 2; keep cumulative flat (nicer chart).
    if (buydownType === 'temporary-2-1') {
      const y2 = points[1]?.cumulativeSavings ?? 0
      for (let i = 2; i < points.length; i++) points[i]!.cumulativeSavings = y2
    }

    return points
  }, [baseRatePercent, buydownType, loanAmount])

  return (
    <div className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface)] p-6 shadow-sm text-[var(--mc-text)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-[var(--mc-text)]">Rate Buydown</div>
          <div className="mt-1 text-sm text-[var(--mc-muted)]">
            Model a temporary buydown payment schedule (2-1) vs the base rate.
          </div>
        </div>
        <div className="rounded-xl border border-[var(--mc-border)] bg-[var(--mc-surface-muted)] px-3 py-2 text-xs font-semibold text-[var(--mc-muted)]">
          {TERM_YEARS}-year assumption
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Inputs */}
        <section className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface)] p-5 shadow-sm">
          <div className="mb-4 text-sm font-semibold text-[var(--mc-text)]">Inputs</div>
          <div className="grid gap-4">
            <label className="block">
              <div className="text-sm font-medium text-[color:var(--mc-text)]/85">Buydown Type</div>
              <div className="mt-2">
                <select
                  value={buydownType}
                  onChange={e => setBuydownType(e.target.value as BuydownType)}
                  className="w-full rounded-xl border border-[var(--mc-input-border)] bg-[var(--mc-input-bg)] px-3 py-2.5 text-sm font-medium text-[var(--mc-text)] shadow-sm outline-none focus:border-[var(--mc-primary)] focus:ring-2 focus:ring-[var(--mc-ring)]"
                >
                  <option value="temporary-2-1">Temporary 2-1 Buydown</option>
                  <option value="none">None</option>
                </select>
              </div>
            </label>

            <MoneyInput id="loanAmount" label="Loan Amount" value={loanAmount} onChange={setLoanAmount} />
            <NumberInput
              id="baseRate"
              label="Base Interest Rate"
              value={baseRatePercent}
              onChange={setBaseRatePercent}
              min={0}
              step={0.01}
              suffix="%"
            />

            <div className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface-muted)] p-4 text-xs text-[var(--mc-muted)]">
              <div className="font-semibold text-[color:var(--mc-text)]/80">Base payment (monthly)</div>
              <div className="mt-1 text-lg font-semibold text-[var(--mc-text)]">
                {formatCurrency(baseMonthlyPayment)}
              </div>
              <div className="mt-1">Used to compute Year 1 &amp; 2 savings.</div>
            </div>
          </div>
        </section>

        {/* Table */}
        <section className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface)] p-5 shadow-sm">
          <div className="mb-4 text-sm font-semibold text-[var(--mc-text)]">Payment schedule</div>

          <div className="overflow-hidden rounded-2xl border border-[var(--mc-border)]">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-[var(--mc-surface-muted)]">
                <tr className="text-xs font-semibold uppercase tracking-wide text-[var(--mc-muted)]">
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Rate</th>
                  <th className="px-4 py-3">Monthly</th>
                  <th className="px-4 py-3">Savings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--mc-border)] bg-[var(--mc-surface)]">
                {schedule.map(row => {
                  const savingsMonthly = row.savingsMonthly ?? 0
                  const hasSavings = row.savingsMonthly !== undefined
                  return (
                    <tr key={row.periodLabel} className="hover:bg-[var(--mc-surface-muted)]/60">
                      <td className="px-4 py-3 font-medium text-[var(--mc-text)]">{row.periodLabel}</td>
                      <td className="px-4 py-3 text-[color:var(--mc-text)]/80">{row.ratePercent.toFixed(2)}%</td>
                      <td className="px-4 py-3 font-semibold text-[var(--mc-text)]">
                        {formatCurrency(row.monthlyPayment)}
                      </td>
                      <td className="px-4 py-3">
                        {hasSavings ? (
                          <div className="font-semibold text-emerald-700">
                            {formatCurrency(savingsMonthly)}/mo
                            <div className="mt-0.5 text-xs font-medium text-emerald-700/80">
                              {formatCurrency(row.savingsAnnual ?? savingsMonthly * 12)}/yr
                            </div>
                          </div>
                        ) : (
                          <span className="text-[color:var(--mc-text)]/30">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {buydownType === 'temporary-2-1' ? (
            <div className="mt-4 rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface-muted)] p-4 text-xs text-[var(--mc-muted)]">
              Savings shown are vs the <span className="font-semibold text-[color:var(--mc-text)]/80">base rate</span>{' '}
              payment. (This is a simplified schedule view.)
            </div>
          ) : null}
        </section>
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface)] p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold text-[var(--mc-text)]">Year-by-year timeline</div>
          <div className="text-xs font-medium text-[var(--mc-muted)]">Line chart</div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart key={chartId} data={yearlySeries} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
              {renderCyberpunkDefs(chartId, theme.chart)}
              <CartesianGrid strokeDasharray="4 8" stroke="rgba(148,163,184,0.25)" />
              <XAxis
                dataKey="year"
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'rgba(148,163,184,0.9)', fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={72}
                tickFormatter={v => `$${Math.round(Number(v)).toLocaleString('en-US')}`}
                tick={{ fill: 'rgba(148,163,184,0.9)', fontSize: 12 }}
              />
              <Tooltip
                formatter={(v: unknown) => formatCurrency(typeof v === 'number' ? v : Number(v))}
                labelFormatter={label => `Year ${label}`}
                content={
                  <CyberpunkTooltip
                    labelFormatter={l => `Year ${String(l)}`}
                    valueFormatter={v => formatCurrency(typeof v === 'number' ? v : Number(v))}
                  />
                }
                cursor={{ stroke: 'rgba(79,172,254,0.3)', strokeWidth: 1 }}
              />
              <Line
                type="monotone"
                dataKey="basePayment"
                name="Base Payment"
                stroke={`url(#${chartId}-grad-secondary)`}
                strokeWidth={3}
                dot={false}
                isAnimationActive
                animationDuration={CHART_ANIMATION.durationMs}
                animationEasing={CHART_ANIMATION.easing}
                animationBegin={50}
              />
              <Line
                type="monotone"
                dataKey="payment"
                name="Buydown Payment"
                stroke={`url(#${chartId}-grad-primary)`}
                strokeWidth={3}
                dot={false}
                isAnimationActive
                animationDuration={CHART_ANIMATION.durationMs}
                animationEasing={CHART_ANIMATION.easing}
                animationBegin={50}
                activeDot={{
                  r: 6,
                  fill: 'rgba(15,23,42,0.95)',
                  stroke: theme.chart.primaryTo,
                  strokeWidth: 2,
                  filter: `url(#${chartId}-glow)`
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}


