import { useId, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
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

export function CashOutCalculator() {
  const theme = useEmbedTheme()
  const DEFAULT_TERM_YEARS = 30
  const MAX_LTV = 0.8
  const chartId = `cp-cashout-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

  const [currentHomeValue, setCurrentHomeValue] = useState(500_000)
  const [existingMortgageBalance, setExistingMortgageBalance] = useState(250_000)
  const [desiredCashOutAmount, setDesiredCashOutAmount] = useState(50_000)
  const [newInterestRate, setNewInterestRate] = useState(6.75)
  const [annualHomeAppreciationPct, setAnnualHomeAppreciationPct] = useState(3)

  const {
    maxLoanAllowed,
    maxCashOutAllowed,
    adjustedCashOut,
    newLoanAmount,
    newMonthlyPayment,
    ltvPercent,
    wasCapped
  } = useMemo(() => {
    const homeValue = clampNonNegative(currentHomeValue)
    const existing = clampNonNegative(existingMortgageBalance)
    const desired = clampNonNegative(desiredCashOutAmount)

    const maxLoan = homeValue * MAX_LTV
    const maxCashOut = Math.max(0, maxLoan - existing)

    const cashOut = Math.min(desired, maxCashOut)
    const loan = existing + cashOut
    const payment = calculateMonthlyPrincipalAndInterest(loan, newInterestRate, DEFAULT_TERM_YEARS)

    const ltv = homeValue > 0 ? (loan / homeValue) * 100 : 0

    return {
      maxLoanAllowed: maxLoan,
      maxCashOutAllowed: maxCashOut,
      adjustedCashOut: cashOut,
      newLoanAmount: loan,
      newMonthlyPayment: payment,
      ltvPercent: ltv,
      wasCapped: desired > maxCashOut
    }
  }, [currentHomeValue, desiredCashOutAmount, existingMortgageBalance, newInterestRate])

  const yearSeries = useMemo(() => {
    const years = DEFAULT_TERM_YEARS
    const hv0 = clampNonNegative(currentHomeValue)
    const appr = clampNonNegative(annualHomeAppreciationPct) / 100

    const principal0 = clampNonNegative(newLoanAmount)
    const annualRate = clampNonNegative(newInterestRate) / 100
    const r = annualRate / 12
    const payment = calculateMonthlyPrincipalAndInterest(principal0, newInterestRate, DEFAULT_TERM_YEARS)

    let balance = principal0
    const points: Array<{
      year: number
      homeValue: number
      remainingBalance: number
      ltvPercent: number
    }> = []

    // Year 0 snapshot
    const hv00 = hv0
    const ltv0 = hv00 > 0 ? (balance / hv00) * 100 : 0
    points.push({
      year: 0,
      homeValue: hv00,
      remainingBalance: balance,
      ltvPercent: ltv0
    })

    for (let y = 1; y <= years; y++) {
      // amortize 12 months
      for (let m = 0; m < 12; m++) {
        if (balance <= 0) break
        const interest = balance * r
        const principalPaid = Math.max(0, payment - interest)
        balance = Math.max(0, balance - principalPaid)
      }

      const hv = hv0 * Math.pow(1 + appr, y)
      const ltv = hv > 0 ? (balance / hv) * 100 : 0
      points.push({
        year: y,
        homeValue: hv,
        remainingBalance: balance,
        ltvPercent: ltv
      })
    }

    return points
  }, [DEFAULT_TERM_YEARS, annualHomeAppreciationPct, currentHomeValue, newInterestRate, newLoanAmount])

  return (
    <div className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface)] p-6 shadow-sm text-[var(--mc-text)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-[var(--mc-text)]">Cash Out</div>
          <div className="mt-1 text-sm text-[var(--mc-muted)]">
            Estimate your new payment while respecting an 80% max LTV.
          </div>
        </div>
        <div className="rounded-xl border border-[var(--mc-border)] bg-[var(--mc-surface-muted)] px-3 py-2 text-xs font-semibold text-[var(--mc-muted)]">
          {DEFAULT_TERM_YEARS}-year assumption
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Inputs */}
        <section className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface)] p-5 shadow-sm">
          <div className="mb-4 text-sm font-semibold text-[var(--mc-text)]">Inputs</div>
          <div className="grid gap-4">
            <MoneyInput
              id="homeValue"
              label="Current Home Value"
              value={currentHomeValue}
              onChange={setCurrentHomeValue}
            />
            <MoneyInput
              id="existingBalance"
              label="Existing Mortgage Balance"
              value={existingMortgageBalance}
              onChange={setExistingMortgageBalance}
            />
            <MoneyInput
              id="cashOut"
              label="Desired Cash Out Amount"
              value={desiredCashOutAmount}
              onChange={setDesiredCashOutAmount}
              helper={
                wasCapped
                  ? `Capped by 80% LTV. Max allowed cash out: ${formatCurrency(maxCashOutAllowed)}`
                  : undefined
              }
            />
            <NumberInput
              id="newRate"
              label="New Interest Rate"
              value={newInterestRate}
              onChange={setNewInterestRate}
              min={0}
              step={0.01}
              suffix="%"
            />
            <NumberInput
              id="homeAppr"
              label="Home appreciation (projection)"
              value={annualHomeAppreciationPct}
              onChange={setAnnualHomeAppreciationPct}
              min={0}
              step={0.1}
              suffix="%"
              helper="Used only for the charts below."
            />
          </div>
        </section>

        {/* Results */}
        <section className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface)] p-5 shadow-sm">
          <div className="mb-4 text-sm font-semibold text-[var(--mc-text)]">Results</div>

          {wasCapped ? (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <div className="font-semibold">Requested cash out exceeds 80% LTV.</div>
              <div className="mt-1 text-amber-900/80">
                We capped the cash out amount to keep the new loan at or below{' '}
                {(MAX_LTV * 100).toFixed(0)}% of home value.
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface-muted)] p-5 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-[var(--mc-muted)]">
                  New Monthly Payment
                </div>
                <div className="mt-1 text-3xl font-semibold tracking-tight text-[var(--mc-text)]">
                  {formatCurrency(newMonthlyPayment)}
                </div>
                <div className="mt-1 text-xs text-[var(--mc-muted)]">
                  Principal &amp; interest only ({DEFAULT_TERM_YEARS} years).
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-[var(--mc-muted)]">
                  Total Cash in Hand
                </div>
                <div className="mt-1 text-3xl font-semibold tracking-tight text-[var(--mc-text)]">
                  {formatCurrency(adjustedCashOut)}
                </div>
                <div className="mt-1 text-xs text-[var(--mc-muted)]">
                  Adjusted for max LTV if needed.
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-[color:var(--mc-text)]/80">New Loan Amount</span>
                <span className="font-semibold text-[var(--mc-text)]">
                  {formatCurrency(newLoanAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-[color:var(--mc-text)]/80">Max Loan Allowed (80% LTV)</span>
                <span className="font-semibold text-[var(--mc-text)]">
                  {formatCurrency(maxLoanAllowed)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-[color:var(--mc-text)]/80">Resulting LTV</span>
                <span className="font-semibold text-[var(--mc-text)]">
                  {ltvPercent.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface)] p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold text-[var(--mc-text)]">30-year projection</div>
          <div className="text-xs font-medium text-[var(--mc-muted)]">Balance + home value + LTV</div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart key={chartId} data={yearSeries} margin={{ left: 8, right: 20, top: 8, bottom: 8 }}>
              {renderCyberpunkDefs(chartId, theme.chart)}
              <CartesianGrid strokeDasharray="4 8" stroke="rgba(148,163,184,0.25)" />
              <XAxis
                dataKey="year"
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'rgba(148,163,184,0.9)', fontSize: 12 }}
              />
              <YAxis
                yAxisId="usd"
                tickLine={false}
                axisLine={false}
                width={74}
                tickFormatter={v => `$${Math.round(Number(v)).toLocaleString('en-US')}`}
                tick={{ fill: 'rgba(148,163,184,0.9)', fontSize: 12 }}
              />
              <YAxis
                yAxisId="pct"
                orientation="right"
                tickLine={false}
                axisLine={false}
                width={54}
                tickFormatter={v => `${Math.round(Number(v))}%`}
                tick={{ fill: 'rgba(148,163,184,0.9)', fontSize: 12 }}
              />
              <Tooltip
                formatter={(v: unknown, name: unknown) => {
                  if (name === 'ltvPercent') return `${Number(v).toFixed(1)}%`
                  return formatCurrency(typeof v === 'number' ? v : Number(v))
                }}
                labelFormatter={label => `Year ${label}`}
                content={
                  <CyberpunkTooltip
                    labelFormatter={l => `Year ${String(l)}`}
                    valueFormatter={v => (typeof v === 'number' ? formatCurrency(v) : formatCurrency(Number(v)))}
                  />
                }
                cursor={{ stroke: 'rgba(79,172,254,0.3)', strokeWidth: 1 }}
              />
              <Line
                yAxisId="usd"
                type="monotone"
                dataKey="remainingBalance"
                name="Remaining Balance"
                stroke={`url(#${chartId}-grad-primary)`}
                strokeWidth={3}
                dot={false}
                isAnimationActive
                animationDuration={CHART_ANIMATION.durationMs}
                animationEasing={CHART_ANIMATION.easing}
                animationBegin={50}
              />
              <Line
                yAxisId="usd"
                type="monotone"
                dataKey="homeValue"
                name="Projected Home Value"
                stroke={`url(#${chartId}-grad-neutral)`}
                strokeWidth={3}
                dot={false}
                isAnimationActive
                animationDuration={CHART_ANIMATION.durationMs}
                animationEasing={CHART_ANIMATION.easing}
                animationBegin={50}
              />
              <Line
                yAxisId="pct"
                type="monotone"
                dataKey="ltvPercent"
                name="LTV %"
                stroke={`url(#${chartId}-grad-accent)`}
                strokeWidth={3}
                dot={false}
                isAnimationActive
                animationDuration={CHART_ANIMATION.durationMs}
                animationEasing={CHART_ANIMATION.easing}
                animationBegin={50}
                activeDot={{
                  r: 6,
                  fill: 'rgba(15,23,42,0.95)',
                  stroke: theme.chart.accentTo,
                  strokeWidth: 2,
                  filter: `url(#${chartId}-glow)`
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 text-xs text-[var(--mc-muted)]">
          Projection assumes the new loan is a fixed-rate amortizing loan. Home value projection uses your selected appreciation rate.
        </div>
      </div>
    </div>
  )
}


