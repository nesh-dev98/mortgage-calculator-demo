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

function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}

function estimatedAvailabilityPct(age: number) {
  // Simplified rule with light interpolation inside each band:
  // 62-69: 35% -> 40%
  // 70-79: 45% -> 50%
  // 80+:   55% -> 60% (cap at 95 for interpolation)
  const a = clamp(age, 0, 120)

  if (a < 62) return 0

  if (a <= 69) {
    const t = (a - 62) / (69 - 62)
    return 0.35 + t * (0.4 - 0.35)
  }

  if (a <= 79) {
    const t = (a - 70) / (79 - 70)
    return 0.45 + t * (0.5 - 0.45)
  }

  const capped = Math.min(a, 95)
  const t = (capped - 80) / (95 - 80)
  return 0.55 + t * (0.6 - 0.55)
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

export function ReverseMortgageCalculator() {
  const theme = useEmbedTheme()
  const chartId = `cp-reverse-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

  const [youngestBorrowerAge, setYoungestBorrowerAge] = useState(70)
  const [homeValue, setHomeValue] = useState(500_000)
  const [currentMortgageBalance, setCurrentMortgageBalance] = useState(150_000)
  const [projectionYears, setProjectionYears] = useState(20)
  const [annualHomeAppreciationPct, setAnnualHomeAppreciationPct] = useState(3)

  const { availabilityPct, grossPrincipalLimit, netPrincipalLimit, ageEligible } = useMemo(() => {
    const age = clampNonNegative(youngestBorrowerAge)
    const eligible = age >= 62
    const pct = estimatedAvailabilityPct(age)
    const gross = clampNonNegative(homeValue) * pct
    const net = Math.max(0, gross - clampNonNegative(currentMortgageBalance))
    return {
      availabilityPct: pct,
      grossPrincipalLimit: gross,
      netPrincipalLimit: net,
      ageEligible: eligible
    }
  }, [currentMortgageBalance, homeValue, youngestBorrowerAge])

  const curveByAge = useMemo(() => {
    const startAge = 55
    const endAge = 95
    const hv = clampNonNegative(homeValue)
    const mb = clampNonNegative(currentMortgageBalance)
    const points = []
    for (let age = startAge; age <= endAge; age++) {
      const pct = estimatedAvailabilityPct(age)
      const gross = hv * pct
      const net = Math.max(0, gross - mb)
      points.push({
        age,
        availabilityPct: pct * 100,
        netPrincipalLimit: net
      })
    }
    return points
  }, [currentMortgageBalance, homeValue])

  const projectionSeries = useMemo(() => {
    const years = Math.min(40, Math.max(1, Math.round(clampNonNegative(projectionYears))))
    const a0 = clampNonNegative(youngestBorrowerAge)
    const mb = clampNonNegative(currentMortgageBalance)
    const hv0 = clampNonNegative(homeValue)
    const appr = clampNonNegative(annualHomeAppreciationPct) / 100

    const points = []
    for (let y = 0; y <= years; y++) {
      const age = a0 + y
      const hv = hv0 * Math.pow(1 + appr, y)
      const pct = estimatedAvailabilityPct(age)
      const gross = hv * pct
      const net = Math.max(0, gross - mb)
      points.push({
        year: y,
        age,
        homeValue: hv,
        availabilityPct: pct * 100,
        netPrincipalLimit: net
      })
    }
    return points
  }, [annualHomeAppreciationPct, currentMortgageBalance, homeValue, projectionYears, youngestBorrowerAge])

  return (
    <div className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface)] p-6 shadow-sm text-[var(--mc-text)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-[var(--mc-text)]">Reverse Mortgage</div>
          <div className="mt-1 text-sm text-[var(--mc-muted)]">
            Quick estimate of available cash based on age and home value.
          </div>
        </div>
        <div className="rounded-xl border border-[var(--mc-border)] bg-[var(--mc-surface-muted)] px-3 py-2 text-xs font-semibold text-[var(--mc-muted)]">
          Estimation
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Inputs */}
        <section className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface)] p-5 shadow-sm">
          <div className="mb-4 text-sm font-semibold text-[var(--mc-text)]">Inputs</div>
          <div className="grid gap-4">
            <NumberInput
              id="youngestAge"
              label="Age of youngest borrower"
              value={youngestBorrowerAge}
              onChange={setYoungestBorrowerAge}
              min={0}
              step={1}
              suffix="yrs"
              helper="Must be 62+ to be eligible."
            />

            {!ageEligible ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <div className="font-semibold">Not eligible (age requirement).</div>
                <div className="mt-1 text-amber-900/80">
                  Reverse mortgages typically require the youngest borrower to be at least 62.
                </div>
              </div>
            ) : null}

            <MoneyInput
              id="homeValue"
              label="Home Value"
              value={homeValue}
              onChange={setHomeValue}
            />
            <MoneyInput
              id="mortgageBalance"
              label="Current Mortgage Balance"
              value={currentMortgageBalance}
              onChange={setCurrentMortgageBalance}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <NumberInput
                id="projectionYears"
                label="Projection"
                value={projectionYears}
                onChange={setProjectionYears}
                min={1}
                step={1}
                suffix="yrs"
                helper="0..40 years (we cap at 40)."
              />
              <NumberInput
                id="homeAppr"
                label="Home appreciation"
                value={annualHomeAppreciationPct}
                onChange={setAnnualHomeAppreciationPct}
                min={0}
                step={0.1}
                suffix="%"
                helper="Used only for the projection chart."
              />
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface)] p-5 shadow-sm">
          <div className="mb-4 text-sm font-semibold text-[var(--mc-text)]">Results</div>

          <div className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface-muted)] p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--mc-muted)]">
              Estimated Net Principal Limit (Available Cash)
            </div>
            <div className="mt-1 text-3xl font-semibold tracking-tight text-[var(--mc-text)]">
              {ageEligible ? formatCurrency(netPrincipalLimit) : '$0'}
            </div>

            <div className="mt-4 grid gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-[color:var(--mc-text)]/80">Estimated availability</span>
                <span className="font-semibold text-[var(--mc-text)]">
                  {ageEligible ? `${(availabilityPct * 100).toFixed(1)}%` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-[color:var(--mc-text)]/80">Estimated principal limit</span>
                <span className="font-semibold text-[var(--mc-text)]">
                  {ageEligible ? formatCurrency(grossPrincipalLimit) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-[color:var(--mc-text)]/80">Less: current mortgage</span>
                <span className="font-semibold text-[var(--mc-text)]">
                  {formatCurrency(currentMortgageBalance)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 text-xs text-[var(--mc-muted)]">
            This is a simplified estimate for educational purposes. Actual eligibility and proceeds
            depend on factors like program guidelines, interest rates, fees, and a formal appraisal.
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface)] p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-[var(--mc-text)]">Availability curve by age</div>
            <div className="text-xs font-medium text-[var(--mc-muted)]">Line chart</div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={curveByAge} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                {renderCyberpunkDefs(`${chartId}-age`, theme.chart)}
                <CartesianGrid strokeDasharray="4 8" stroke="rgba(148,163,184,0.25)" />
                <XAxis
                  dataKey="age"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'rgba(148,163,184,0.9)', fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={54}
                  tickFormatter={v => `${Math.round(Number(v))}%`}
                  tick={{ fill: 'rgba(148,163,184,0.9)', fontSize: 12 }}
                />
                <Tooltip
                  formatter={(v: unknown, name: unknown) => {
                    if (name === 'netPrincipalLimit') {
                      return formatCurrency(typeof v === 'number' ? v : Number(v))
                    }
                    return `${Number(v).toFixed(1)}%`
                  }}
                  labelFormatter={label => `Age ${label}`}
                  content={
                    <CyberpunkTooltip
                      labelFormatter={l => `Age ${String(l)}`}
                      valueFormatter={v => (typeof v === 'number' ? v.toFixed(1) : String(v))}
                    />
                  }
                  cursor={{ stroke: 'rgba(79,172,254,0.3)', strokeWidth: 1 }}
                />
                <Line
                  type="monotone"
                  dataKey="availabilityPct"
                  name="Availability %"
                  stroke={`url(#${chartId}-age-grad-primary)`}
                  strokeWidth={3}
                  dot={false}
                  isAnimationActive
                  animationDuration={CHART_ANIMATION.durationMs}
                  animationEasing={CHART_ANIMATION.easing}
                  animationBegin={50}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface)] p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-[var(--mc-text)]">Projected available cash</div>
            <div className="text-xs font-medium text-[var(--mc-muted)]">{Math.round(projectionYears)}-year projection</div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={projectionSeries} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                {renderCyberpunkDefs(`${chartId}-proj`, theme.chart)}
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
                  dataKey="netPrincipalLimit"
                  name="Net principal limit"
                  stroke={`url(#${chartId}-proj-grad-primary)`}
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
                    filter: `url(#${chartId}-proj-glow)`
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-[var(--mc-muted)]">
            Projection assumes your current mortgage balance stays constant and home value grows at the selected appreciation rate.
          </div>
        </div>
      </div>
    </div>
  )
}


