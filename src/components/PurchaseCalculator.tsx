import { useEffect, useMemo, useState } from 'react'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
})

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0
})

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) return '$0'
  return currencyFormatter.format(Math.max(0, Math.round(value)))
}

function parseCurrencyInput(raw: string) {
  const cleaned = raw.replace(/[^\d.]/g, '')
  const num = Number(cleaned)
  return Number.isFinite(num) ? num : 0
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

type RangeConfig = {
  min: number
  max: number
  step: number
}

type RangeSliderProps = {
  label: string
  value: number
  setValue: (n: number) => void
  range: RangeConfig
}

function RangeSlider({ label, value, setValue, range }: RangeSliderProps) {
  return (
    <input
      type="range"
      min={range.min}
      max={range.max}
      step={range.step}
      value={Math.min(range.max, Math.max(range.min, Number.isFinite(value) ? value : 0))}
      onChange={e => setValue(clampNonNegative(Number(e.target.value)))}
      className="mt-3 w-full cursor-pointer accent-[var(--mc-primary)]"
      aria-label={`${label} slider`}
    />
  )
}

type CurrencyFieldProps = {
  id: string
  label: string
  value: number
  setValue: (n: number) => void
  helper?: string
  range?: RangeConfig
}

function CurrencyField({ id, label, value, setValue, helper, range }: CurrencyFieldProps) {
  const [text, setText] = useState(() => formatCurrency(value))
  const [isFocused, setIsFocused] = useState(false)

  // Keep display in sync when value changes externally.
  useEffect(() => {
    if (!isFocused) setText(formatCurrency(value))
  }, [isFocused, value])

  return (
    <label className="block">
      <div className="text-sm font-medium text-[color:var(--mc-text)]/85">{label}</div>
      <div className="mt-2 flex items-center rounded-xl border border-[var(--mc-input-border)] bg-[var(--mc-input-bg)] shadow-sm focus-within:border-[var(--mc-primary)] focus-within:ring-2 focus-within:ring-[var(--mc-ring)]">
        <span className="select-none pl-3 text-sm font-semibold text-[var(--mc-muted)]">$</span>
        <input
          id={id}
          inputMode="decimal"
          value={text.replace(/^\$/, '')}
          onFocus={() => {
            setIsFocused(true)
            setText(numberFormatter.format(clampNonNegative(value)))
          }}
          onBlur={() => {
            setIsFocused(false)
            setText(formatCurrency(value))
          }}
          onChange={e => {
            const nextText = e.target.value
            setText(nextText)
            setValue(clampNonNegative(parseCurrencyInput(nextText)))
          }}
          className="w-full bg-transparent px-2 py-2.5 text-sm font-medium text-[var(--mc-text)] outline-none"
          placeholder="0"
          aria-label={label}
        />
      </div>
      {range ? <RangeSlider label={label} value={value} setValue={setValue} range={range} /> : null}
      {helper ? <div className="mt-1 text-xs text-[var(--mc-muted)]">{helper}</div> : null}
    </label>
  )
}

type NumberFieldProps = {
  id: string
  label: string
  value: number
  setValue: (n: number) => void
  min?: number
  step?: number
  suffix?: string
  helper?: string
  range?: RangeConfig
}

function NumberField({
  id,
  label,
  value,
  setValue,
  min = 0,
  step,
  suffix,
  helper,
  range
}: NumberFieldProps) {
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
          onChange={e => setValue(clampNonNegative(Number(e.target.value)))}
          className="w-full bg-transparent px-3 py-2.5 text-sm font-medium text-[var(--mc-text)] outline-none"
          aria-label={label}
        />
        {suffix ? (
          <span className="select-none pr-3 text-sm font-semibold text-[var(--mc-muted)]">
            {suffix}
          </span>
        ) : null}
      </div>
      {range ? <RangeSlider label={label} value={value} setValue={setValue} range={range} /> : null}
      {helper ? <div className="mt-1 text-xs text-[var(--mc-muted)]">{helper}</div> : null}
    </label>
  )
}

function formatMonthly(value: number) {
  return currencyFormatter.format(Math.max(0, Math.round(value)))
}

export function PurchaseCalculator() {
  const [homePrice, setHomePrice] = useState(400_000)
  const [downPayment, setDownPayment] = useState(80_000)
  const [interestRatePercent, setInterestRatePercent] = useState(6.5)
  const [loanTermYears, setLoanTermYears] = useState(30)

  const { loanAmount, monthlyPI } = useMemo(() => {
    const loan = Math.max(0, homePrice - downPayment)
    const pi = calculateMonthlyPrincipalAndInterest(loan, interestRatePercent, loanTermYears)

    return {
      loanAmount: loan,
      monthlyPI: pi
    }
  }, [downPayment, homePrice, interestRatePercent, loanTermYears])

  const downPaymentPct = homePrice > 0 ? (downPayment / homePrice) * 100 : 0

  return (
    <div className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface)] p-6 shadow-sm text-[var(--mc-text)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-[var(--mc-text)]">Purchase</div>
          <div className="mt-1 text-sm text-[var(--mc-muted)]">
            Estimate your monthly principal and interest payments.
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Inputs */}
        <section className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface)] p-5 shadow-sm">
          <div className="mb-4 text-sm font-semibold text-[var(--mc-text)]">Inputs</div>
          <div className="grid gap-4">
            <CurrencyField
              id="homePrice"
              label="Home Price"
              value={homePrice}
              setValue={setHomePrice}
              range={{ min: 50_000, max: 2_000_000, step: 5_000 }}
            />
            <CurrencyField
              id="downPayment"
              label="Down Payment"
              value={downPayment}
              setValue={setDownPayment}
              helper={`≈ ${downPaymentPct.toFixed(1)}% down`}
              range={{ min: 0, max: Math.max(0, homePrice), step: 1_000 }}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField
                id="interestRate"
                label="Interest Rate"
                value={interestRatePercent}
                setValue={setInterestRatePercent}
                min={0}
                step={0.01}
                suffix="%"
                range={{ min: 0, max: 15, step: 0.125 }}
              />
              <NumberField
                id="loanTerm"
                label="Loan Term"
                value={loanTermYears}
                setValue={setLoanTermYears}
                min={1}
                step={1}
                suffix="yrs"
                range={{ min: 5, max: 40, step: 1 }}
              />
            </div>

          </div>
        </section>

        {/* Results */}
        <section className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface)] p-5 shadow-sm">
          <div className="mb-4 text-sm font-semibold text-[var(--mc-text)]">Results</div>

          <div className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface-muted)] p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--mc-muted)]">
              Estimated Monthly Principal &amp; Interest
            </div>
            <div className="mt-1 text-3xl font-semibold tracking-tight text-[var(--mc-text)]">
              {formatMonthly(monthlyPI)}
            </div>
            <div className="mt-1 text-xs text-[var(--mc-muted)]">Excludes taxes and insurance</div>
          </div>

          <div className="mt-4 rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface-muted)] p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--mc-muted)]">
              Loan Amount
            </div>
            <div className="mt-1 text-lg font-semibold text-[var(--mc-text)]">
              {formatCurrency(loanAmount)}
            </div>
            <div className="mt-1 text-xs text-[var(--mc-muted)]">
              Home price minus down payment.
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}


