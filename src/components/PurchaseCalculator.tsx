import { useEffect, useId, useMemo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Sector, Tooltip } from 'recharts'
import { CHART_ANIMATION, CyberpunkTooltip, renderCyberpunkDefs } from './charts/cyberpunk'
import { useEmbedTheme } from '../embed/ThemeProvider'
import { hexToRgba } from '../embed/color'

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

type CurrencyFieldProps = {
  id: string
  label: string
  value: number
  setValue: (n: number) => void
  helper?: string
}

function CurrencyField({ id, label, value, setValue, helper }: CurrencyFieldProps) {
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
}

function NumberField({
  id,
  label,
  value,
  setValue,
  min = 0,
  step,
  suffix,
  helper
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
      {helper ? <div className="mt-1 text-xs text-[var(--mc-muted)]">{helper}</div> : null}
    </label>
  )
}

function formatMonthly(value: number) {
  return currencyFormatter.format(Math.max(0, Math.round(value)))
}

export function PurchaseCalculator() {
  const theme = useEmbedTheme()
  const [homePrice, setHomePrice] = useState(400_000)
  const [downPayment, setDownPayment] = useState(80_000)
  const [interestRatePercent, setInterestRatePercent] = useState(6.5)
  const [loanTermYears, setLoanTermYears] = useState(30)
  const [annualPropertyTax, setAnnualPropertyTax] = useState(4_000)
  const [annualHomeInsurance, setAnnualHomeInsurance] = useState(1_200)

  const {
    loanAmount,
    monthlyPI,
    monthlyTax,
    monthlyInsurance,
    totalMonthlyPayment
  } = useMemo(() => {
    const loan = Math.max(0, homePrice - downPayment)
    const pi = calculateMonthlyPrincipalAndInterest(loan, interestRatePercent, loanTermYears)
    const tax = clampNonNegative(annualPropertyTax) / 12
    const ins = clampNonNegative(annualHomeInsurance) / 12
    const total = pi + tax + ins

    return {
      loanAmount: loan,
      monthlyPI: pi,
      monthlyTax: tax,
      monthlyInsurance: ins,
      totalMonthlyPayment: total
    }
  }, [annualHomeInsurance, annualPropertyTax, downPayment, homePrice, interestRatePercent, loanTermYears])

  const chartData = useMemo(
    () => [
      { name: 'Principal & Interest', value: monthlyPI },
      { name: 'Tax', value: monthlyTax },
      { name: 'Insurance', value: monthlyInsurance }
    ],
    [monthlyPI, monthlyTax, monthlyInsurance]
  )

  const chartId = `cp-purchase-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const [activeSlice, setActiveSlice] = useState<number | null>(null)

  const downPaymentPct = homePrice > 0 ? (downPayment / homePrice) * 100 : 0

  return (
    <div className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface)] p-6 shadow-sm text-[var(--mc-text)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-[var(--mc-text)]">Purchase</div>
          <div className="mt-1 text-sm text-[var(--mc-muted)]">
            Estimate your monthly payment with taxes and insurance.
          </div>
        </div>
        <div className="rounded-xl border border-[var(--mc-border)] bg-[var(--mc-surface-muted)] px-3 py-2 text-xs font-semibold text-[var(--mc-muted)]">
          Live updates
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
            />
            <CurrencyField
              id="downPayment"
              label="Down Payment"
              value={downPayment}
              setValue={setDownPayment}
              helper={`≈ ${downPaymentPct.toFixed(1)}% down`}
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
              />
              <NumberField
                id="loanTerm"
                label="Loan Term"
                value={loanTermYears}
                setValue={setLoanTermYears}
                min={1}
                step={1}
                suffix="yrs"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <CurrencyField
                id="propertyTax"
                label="Annual Property Tax"
                value={annualPropertyTax}
                setValue={setAnnualPropertyTax}
              />
              <CurrencyField
                id="homeInsurance"
                label="Annual Home Insurance"
                value={annualHomeInsurance}
                setValue={setAnnualHomeInsurance}
              />
            </div>

            <div className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface-muted)] p-4">
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
          </div>
        </section>

        {/* Results */}
        <section className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface)] p-5 shadow-sm">
          <div className="mb-4 text-sm font-semibold text-[var(--mc-text)]">Results</div>

          <div className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface-muted)] p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--mc-muted)]">
              Total Monthly Payment
            </div>
            <div className="mt-1 text-3xl font-semibold tracking-tight text-[var(--mc-text)]">
              {formatMonthly(totalMonthlyPayment)}
            </div>

            <div className="mt-4 grid gap-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${theme.chart.primaryFrom} 0%, ${theme.chart.primaryTo} 100%)`,
                      boxShadow: `0 0 14px ${hexToRgba(theme.chart.primaryTo, 0.28)}`
                    }}
                  />
                  <span className="font-medium text-[color:var(--mc-text)]/80">
                    Principal &amp; Interest
                  </span>
                </div>
                <div className="font-semibold text-[var(--mc-text)]">{formatMonthly(monthlyPI)}</div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${theme.chart.accentFrom} 0%, ${theme.chart.accentTo} 100%)`,
                      boxShadow: `0 0 14px ${hexToRgba(theme.chart.accentTo, 0.2)}`
                    }}
                  />
                  <span className="font-medium text-[color:var(--mc-text)]/80">Tax</span>
                </div>
                <div className="font-semibold text-[var(--mc-text)]">{formatMonthly(monthlyTax)}</div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${theme.chart.neutralFrom} 0%, ${theme.chart.neutralTo} 100%)`,
                      boxShadow: `0 0 10px ${hexToRgba(theme.chart.neutralTo, 0.12)}`
                    }}
                  />
                  <span className="font-medium text-[color:var(--mc-text)]/80">Insurance</span>
                </div>
                <div className="font-semibold text-[var(--mc-text)]">
                  {formatMonthly(monthlyInsurance)}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-1">
            <div className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface)] p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold text-[var(--mc-text)]">Breakdown</div>
                <div className="text-xs font-medium text-[var(--mc-muted)]">Donut chart</div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart key={chartId}>
                    {renderCyberpunkDefs(chartId, theme.chart)}
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={70}
                      outerRadius={105}
                      paddingAngle={2}
                      isAnimationActive
                      animationDuration={CHART_ANIMATION.durationMs}
                      animationEasing={CHART_ANIMATION.easing}
                      animationBegin={50}
                      activeIndex={activeSlice ?? -1}
                      activeShape={(props: unknown) => {
                        const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } =
                          props as {
                            cx: number
                            cy: number
                            innerRadius: number
                            outerRadius: number
                            startAngle: number
                            endAngle: number
                            fill: string
                          }

                        return (
                          <Sector
                            cx={cx}
                            cy={cy}
                            innerRadius={innerRadius}
                            outerRadius={outerRadius + 15}
                            startAngle={startAngle}
                            endAngle={endAngle}
                            fill={fill}
                            filter={`url(#${chartId}-glow)`}
                          />
                        )
                      }}
                      onMouseEnter={(_, idx) => setActiveSlice(idx)}
                      onMouseLeave={() => setActiveSlice(null)}
                    >
                      <Cell
                        fill={`url(#${chartId}-grad-primary)`}
                        stroke="rgba(255,255,255,0.35)"
                        strokeWidth={1}
                      />
                      <Cell
                        fill={`url(#${chartId}-grad-accent)`}
                        stroke="rgba(255,255,255,0.35)"
                        strokeWidth={1}
                      />
                      <Cell
                        fill={`url(#${chartId}-grad-neutral)`}
                        stroke="rgba(255,255,255,0.35)"
                        strokeWidth={1}
                      />
                    </Pie>
                    <Tooltip
                      formatter={(v: unknown) =>
                        formatMonthly(typeof v === 'number' ? v : Number(v))
                      }
                      content={
                        <CyberpunkTooltip valueFormatter={v =>
                          formatMonthly(typeof v === 'number' ? v : Number(v))
                        } />
                      }
                      cursor={false}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}


