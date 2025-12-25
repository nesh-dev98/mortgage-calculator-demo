import { useId, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
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

function calculateMonthlyPayment(principal: number, annualRatePercent: number, termYears: number) {
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

type DataPoint = {
  year: number
  rentCost: number
  buyNetCost: number
}

export function RentVsBuyCalculator() {
  const chartId = `cp-rvb-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  // Inputs requested
  const [targetHomePrice, setTargetHomePrice] = useState(400_000)
  const [currentMonthlyRent, setCurrentMonthlyRent] = useState(2_500)
  const [rentInflationPct, setRentInflationPct] = useState(3)
  const [homeAppreciationPct, setHomeAppreciationPct] = useState(3)
  const [durationYears, setDurationYears] = useState(10)

  // Simple defaults/assumptions (kept intentionally minimal since not requested as inputs)
  const ASSUMED_DOWN_PCT = 0.2
  const ASSUMED_RATE_PCT = 6.5
  const ASSUMED_TERM_YEARS = 30
  const ASSUMED_TAX_PCT = 0.01
  const ASSUMED_MAINT_PCT = 0.01

  const { data, crossoverYear, summary } = useMemo(() => {
    const years = Math.min(50, Math.max(1, Math.round(durationYears)))
    const price0 = clampNonNegative(targetHomePrice)
    const rent0 = clampNonNegative(currentMonthlyRent)

    const rentInfl = clampNonNegative(rentInflationPct) / 100
    const appr = clampNonNegative(homeAppreciationPct) / 100

    const downPayment = price0 * ASSUMED_DOWN_PCT
    const loanAmount = Math.max(0, price0 - downPayment)

    const monthlyMortgagePayment = calculateMonthlyPayment(
      loanAmount,
      ASSUMED_RATE_PCT,
      ASSUMED_TERM_YEARS
    )

    // Amortization to compute principal paid over time (monthly)
    const r = (ASSUMED_RATE_PCT / 100) / 12
    let remainingBalance = loanAmount
    let cumulativePrincipalPaid = 0

    let cumulativeRentCost = 0
    let cumulativeMortgagePaid = 0
    let cumulativeTaxPaid = 0
    let cumulativeMaintenancePaid = 0

    const points: DataPoint[] = []
    let firstCrossover: number | null = null

    for (let year = 1; year <= years; year++) {
      const yearHomeValue = price0 * Math.pow(1 + appr, year - 1)

      // Rent for this year inflates once per year
      const yearMonthlyRent = rent0 * Math.pow(1 + rentInfl, year - 1)
      const yearRentCost = yearMonthlyRent * 12
      cumulativeRentCost += yearRentCost

      // Mortgage P&I for the year (fixed payment)
      for (let m = 0; m < 12; m++) {
        if (remainingBalance <= 0) break
        const interestPayment = remainingBalance * r
        const principalPayment = Math.max(0, monthlyMortgagePayment - interestPayment)
        remainingBalance = Math.max(0, remainingBalance - principalPayment)
        cumulativePrincipalPaid += principalPayment
      }
      const yearMortgagePaid = monthlyMortgagePayment * 12
      cumulativeMortgagePaid += yearMortgagePaid

      // Tax & maintenance (assumed % of current home value, paid annually)
      const yearTax = yearHomeValue * ASSUMED_TAX_PCT
      const yearMaint = yearHomeValue * ASSUMED_MAINT_PCT
      cumulativeTaxPaid += yearTax
      cumulativeMaintenancePaid += yearMaint

      // Equity gained: down payment + principal paid + appreciation gain
      const appreciationGain = Math.max(0, yearHomeValue - price0)
      const equity = downPayment + cumulativePrincipalPaid + appreciationGain

      // Buying cash outlay: down payment + mortgage payments + tax + maintenance
      const cashOut =
        downPayment + cumulativeMortgagePaid + cumulativeTaxPaid + cumulativeMaintenancePaid

      // Net cost: cash outlay minus equity (simplified model)
      const netBuyCost = Math.max(0, cashOut - equity)

      if (firstCrossover === null && netBuyCost <= cumulativeRentCost) {
        firstCrossover = year
      }

      points.push({
        year,
        rentCost: cumulativeRentCost,
        buyNetCost: netBuyCost
      })
    }

    const last = points[points.length - 1]
    return {
      data: points,
      crossoverYear: firstCrossover,
      summary: {
        finalRentCost: last?.rentCost ?? 0,
        finalBuyNetCost: last?.buyNetCost ?? 0,
        downPayment,
        loanAmount,
        monthlyMortgagePayment
      }
    }
  }, [currentMonthlyRent, durationYears, homeAppreciationPct, rentInflationPct, targetHomePrice])

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">Rent vs Buy</div>
          <div className="mt-1 text-sm text-slate-500">
            Compare cumulative renting vs net buying costs over time (simplified model).
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
              id="targetHomePrice"
              label="Target Home Price"
              value={targetHomePrice}
              onChange={setTargetHomePrice}
            />
            <MoneyInput
              id="currentMonthlyRent"
              label="Current Monthly Rent"
              value={currentMonthlyRent}
              onChange={setCurrentMonthlyRent}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberInput
                id="rentInflation"
                label="Rent Inflation"
                value={rentInflationPct}
                onChange={setRentInflationPct}
                min={0}
                step={0.1}
                suffix="%"
              />
              <NumberInput
                id="homeAppreciation"
                label="Home Appreciation"
                value={homeAppreciationPct}
                onChange={setHomeAppreciationPct}
                min={0}
                step={0.1}
                suffix="%"
              />
            </div>
            <NumberInput
              id="duration"
              label="Duration"
              value={durationYears}
              onChange={setDurationYears}
              min={1}
              step={1}
              suffix="yrs"
              helper="Chart uses years 1..N."
            />

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
              <div className="font-semibold text-slate-700">Assumptions</div>
              <div className="mt-1">
                {Math.round(ASSUMED_DOWN_PCT * 100)}% down, {ASSUMED_TERM_YEARS}-year fixed at{' '}
                {ASSUMED_RATE_PCT}% · Property tax {Math.round(ASSUMED_TAX_PCT * 100)}%/yr ·
                Maintenance {Math.round(ASSUMED_MAINT_PCT * 100)}%/yr
              </div>
            </div>
          </div>
        </section>

        {/* Results + Chart */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Results</div>
              <div className="mt-1 text-xs text-slate-500">
                Net buying cost = mortgage + tax + maintenance − equity gained (principal + appreciation + down payment).
              </div>
            </div>
            <div
              className={[
                'rounded-xl px-3 py-2 text-xs font-semibold',
                crossoverYear
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border border-slate-200 bg-slate-50 text-slate-700'
              ].join(' ')}
            >
              {crossoverYear ? `Crossover: Year ${crossoverYear}` : 'No crossover in range'}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Rent cost ({Math.round(durationYears)} yrs)
                </div>
                <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                  {formatCurrency(summary.finalRentCost)}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Net buy cost ({Math.round(durationYears)} yrs)
                </div>
                <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                  {formatCurrency(summary.finalBuyNetCost)}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700">Down Payment (assumed)</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(summary.downPayment)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700">Loan Amount (assumed)</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(summary.loanAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700">Mortgage P&amp;I (monthly)</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(summary.monthlyMortgagePayment)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">Cumulative cost over time</div>
              <div className="text-xs font-medium text-slate-500">Line chart</div>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                {/* IDs are per-chart to avoid collisions across the app */}
                <LineChart
                  key={chartId}
                  data={data}
                  margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
                >
                  {renderCyberpunkDefs(chartId)}
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
                    formatter={(v: unknown) =>
                      formatCurrency(typeof v === 'number' ? v : Number(v))
                    }
                    labelFormatter={label => `Year ${label}`}
                    content={
                      <CyberpunkTooltip
                        labelFormatter={l => `Year ${String(l)}`}
                        valueFormatter={v => formatCurrency(typeof v === 'number' ? v : Number(v))}
                      />
                    }
                    cursor={{ stroke: 'rgba(79,172,254,0.3)', strokeWidth: 1 }}
                  />
                  {crossoverYear ? (
                    <ReferenceLine
                      x={crossoverYear}
                      stroke="#22c55e"
                      strokeDasharray="4 4"
                      ifOverflow="extendDomain"
                    />
                  ) : null}
                  <Line
                    type="monotone"
                    dataKey="rentCost"
                    name="Total Cost of Renting"
                    stroke={`url(#${chartId}-grad-secondary)`}
                    strokeWidth={3}
                    dot={false}
                    isAnimationActive
                    animationDuration={CHART_ANIMATION.durationMs}
                    animationEasing={CHART_ANIMATION.easing}
                    animationBegin={50}
                    activeDot={{
                      r: 6,
                      fill: 'rgba(15,23,42,0.95)',
                      stroke: '#fe8c00',
                      strokeWidth: 2,
                      filter: `url(#${chartId}-glow)`
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="buyNetCost"
                    name="Net Cost of Buying"
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
                      stroke: '#00f2fe',
                      strokeWidth: 2,
                      filter: `url(#${chartId}-glow)`
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}


