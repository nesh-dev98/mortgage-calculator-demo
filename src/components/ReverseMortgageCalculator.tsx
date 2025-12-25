import { useMemo, useState } from 'react'

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

export function ReverseMortgageCalculator() {
  const [youngestBorrowerAge, setYoungestBorrowerAge] = useState(70)
  const [homeValue, setHomeValue] = useState(500_000)
  const [currentMortgageBalance, setCurrentMortgageBalance] = useState(150_000)

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

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">Reverse Mortgage</div>
          <div className="mt-1 text-sm text-slate-500">
            Quick estimate of available cash based on age and home value.
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
          Estimation
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Inputs */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 text-sm font-semibold text-slate-900">Inputs</div>
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
          </div>
        </section>

        {/* Results */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 text-sm font-semibold text-slate-900">Results</div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Estimated Net Principal Limit (Available Cash)
            </div>
            <div className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
              {ageEligible ? formatCurrency(netPrincipalLimit) : '$0'}
            </div>

            <div className="mt-4 grid gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700">Estimated availability</span>
                <span className="font-semibold text-slate-900">
                  {ageEligible ? `${(availabilityPct * 100).toFixed(1)}%` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700">Estimated principal limit</span>
                <span className="font-semibold text-slate-900">
                  {ageEligible ? formatCurrency(grossPrincipalLimit) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700">Less: current mortgage</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(currentMortgageBalance)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 text-xs text-slate-500">
            This is a simplified estimate for educational purposes. Actual eligibility and proceeds
            depend on factors like program guidelines, interest rates, fees, and a formal appraisal.
          </div>
        </section>
      </div>
    </div>
  )
}


