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

export function CashOutCalculator() {
  const DEFAULT_TERM_YEARS = 30
  const MAX_LTV = 0.8

  const [currentHomeValue, setCurrentHomeValue] = useState(500_000)
  const [existingMortgageBalance, setExistingMortgageBalance] = useState(250_000)
  const [desiredCashOutAmount, setDesiredCashOutAmount] = useState(50_000)
  const [newInterestRate, setNewInterestRate] = useState(6.75)

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

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">Cash Out</div>
          <div className="mt-1 text-sm text-slate-500">
            Estimate your new payment while respecting an 80% max LTV.
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
          {DEFAULT_TERM_YEARS}-year assumption
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Inputs */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 text-sm font-semibold text-slate-900">Inputs</div>
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
          </div>
        </section>

        {/* Results */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 text-sm font-semibold text-slate-900">Results</div>

          {wasCapped ? (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <div className="font-semibold">Requested cash out exceeds 80% LTV.</div>
              <div className="mt-1 text-amber-900/80">
                We capped the cash out amount to keep the new loan at or below{' '}
                {(MAX_LTV * 100).toFixed(0)}% of home value.
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  New Monthly Payment
                </div>
                <div className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
                  {formatCurrency(newMonthlyPayment)}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Principal &amp; interest only ({DEFAULT_TERM_YEARS} years).
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total Cash in Hand
                </div>
                <div className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
                  {formatCurrency(adjustedCashOut)}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Adjusted for max LTV if needed.
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700">New Loan Amount</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(newLoanAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700">Max Loan Allowed (80% LTV)</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(maxLoanAllowed)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700">Resulting LTV</span>
                <span className="font-semibold text-slate-900">
                  {ltvPercent.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}


