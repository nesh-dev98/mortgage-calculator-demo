import { useId, useMemo, useState } from 'react'
import {
  Cell,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { CHART_ANIMATION, CyberpunkTooltip, renderCyberpunkDefs } from './charts/cyberpunk'

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
      <div className="text-sm font-medium text-slate-800">{label}</div>
      <div className="mt-2 flex items-center rounded-xl border border-slate-200 bg-white shadow-sm focus-within:border-navy-900 focus-within:ring-2 focus-within:ring-navy-900/10">
        <span className="select-none pl-3 text-sm font-semibold text-slate-500">$</span>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          value={Number.isFinite(value) ? value : 0}
          onChange={e => onChange(clampNonNegative(Number(e.target.value)))}
          className="w-full bg-transparent px-2 py-2.5 text-sm font-medium text-slate-900 outline-none"
          aria-label={label}
        />
      </div>
      {helper ? <div className="mt-1 text-xs text-slate-500">{helper}</div> : null}
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
      <div className="text-sm font-medium text-slate-800">{label}</div>
      <div className="mt-2 flex items-center rounded-xl border border-slate-200 bg-white shadow-sm focus-within:border-navy-900 focus-within:ring-2 focus-within:ring-navy-900/10">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          value={Number.isFinite(value) ? value : 0}
          onChange={e => onChange(clampNonNegative(Number(e.target.value)))}
          className="w-full bg-transparent px-3 py-2.5 text-sm font-medium text-slate-900 outline-none"
          aria-label={label}
        />
        {suffix ? (
          <span className="select-none pr-3 text-sm font-semibold text-slate-500">
            {suffix}
          </span>
        ) : null}
      </div>
      {helper ? <div className="mt-1 text-xs text-slate-500">{helper}</div> : null}
    </label>
  )
}

export function RefinanceCalculator() {
  const [originalLoanBalance, setOriginalLoanBalance] = useState(320_000)
  const [currentRate, setCurrentRate] = useState(7.25)
  const [newRate, setNewRate] = useState(6.5)
  const [newTermYears, setNewTermYears] = useState(30)
  const [closingCosts, setClosingCosts] = useState(6_000)

  const { oldMonthlyPayment, newMonthlyPayment, monthlySavings, breakEvenMonths } = useMemo(() => {
    // Note: since we don't have an explicit "remaining term" input, we use the same term for both
    // old and new payments so the comparison is apples-to-apples.
    const oldPay = calculateMonthlyPrincipalAndInterest(
      originalLoanBalance,
      currentRate,
      newTermYears
    )
    const newPay = calculateMonthlyPrincipalAndInterest(
      originalLoanBalance,
      newRate,
      newTermYears
    )
    const savings = oldPay - newPay
    const months =
      savings > 0 ? Math.ceil(clampNonNegative(closingCosts) / savings) : Infinity
    return {
      oldMonthlyPayment: oldPay,
      newMonthlyPayment: newPay,
      monthlySavings: savings,
      breakEvenMonths: months
    }
  }, [closingCosts, currentRate, newRate, newTermYears, originalLoanBalance])

  const chartId = `cp-refinance-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const chartData = useMemo(
    () => [
      { name: 'Old', payment: oldMonthlyPayment, fill: `url(#${chartId}-grad-secondary)` },
      { name: 'New', payment: newMonthlyPayment, fill: `url(#${chartId}-grad-primary)` }
    ],
    [newMonthlyPayment, oldMonthlyPayment]
  )

  const showBreakEven = Number.isFinite(breakEvenMonths) && breakEvenMonths > 0

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">Refinance</div>
          <div className="mt-1 text-sm text-slate-500">
            Compare monthly payments and estimate a break-even point.
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
          Live updates
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Inputs */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 text-sm font-semibold text-slate-900">Inputs</div>
          <div className="grid gap-4">
            <MoneyInput
              id="origBalance"
              label="Original Loan Balance"
              value={originalLoanBalance}
              onChange={setOriginalLoanBalance}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberInput
                id="currentRate"
                label="Current Rate"
                value={currentRate}
                onChange={setCurrentRate}
                min={0}
                step={0.01}
                suffix="%"
              />
              <NumberInput
                id="newRate"
                label="New Rate"
                value={newRate}
                onChange={setNewRate}
                min={0}
                step={0.01}
                suffix="%"
              />
            </div>
            <NumberInput
              id="newTerm"
              label="New Term"
              value={newTermYears}
              onChange={setNewTermYears}
              min={1}
              step={1}
              suffix="yrs"
              helper="We use this same term for both Old and New payments for a clean comparison."
            />
            <MoneyInput
              id="closingCosts"
              label="Closing Costs"
              value={closingCosts}
              onChange={setClosingCosts}
            />
          </div>
        </section>

        {/* Results */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 text-sm font-semibold text-slate-900">Results</div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Monthly Savings
                </div>
                <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                  {monthlySavings >= 0
                    ? formatCurrency(monthlySavings)
                    : `-${formatCurrency(Math.abs(monthlySavings))}`}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Old payment minus new payment.
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Break-even Point
                </div>
                <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                  {showBreakEven ? `${breakEvenMonths} mo` : 'N/A'}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Months to recover closing costs.
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700">Old Monthly Payment</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(oldMonthlyPayment)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700">New Monthly Payment</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(newMonthlyPayment)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">Payment comparison</div>
              <div className="text-xs font-medium text-slate-500">Bar chart</div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart key={chartId} data={chartData} margin={{ left: 8, right: 8 }}>
                  {renderCyberpunkDefs(chartId)}
                  <CartesianGrid strokeDasharray="4 8" stroke="rgba(148,163,184,0.25)" />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'rgba(148,163,184,0.9)', fontSize: 12 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => `$${Math.round(Number(v)).toLocaleString('en-US')}`}
                    width={64}
                    tick={{ fill: 'rgba(148,163,184,0.9)', fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(v: unknown) =>
                      formatCurrency(typeof v === 'number' ? v : Number(v))
                    }
                    content={
                      <CyberpunkTooltip valueFormatter={v =>
                        formatCurrency(typeof v === 'number' ? v : Number(v))
                      } />
                    }
                    cursor={{ fill: 'rgba(79,172,254,0.06)' }}
                  />
                  <Bar
                    dataKey="payment"
                    radius={[14, 14, 14, 14]}
                    isAnimationActive
                    animationDuration={CHART_ANIMATION.durationMs}
                    animationEasing={CHART_ANIMATION.easing}
                    animationBegin={50}
                  >
                    {chartData.map((entry, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={entry.fill}
                        filter={`url(#${chartId}-glow)`}
                        stroke="rgba(255,255,255,0.25)"
                        strokeWidth={1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}


