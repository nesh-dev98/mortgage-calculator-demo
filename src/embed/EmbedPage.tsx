import { CashOutCalculator } from '../components/CashOutCalculator'
import { PurchaseCalculator } from '../components/PurchaseCalculator'
import { RateBuydownCalculator } from '../components/RateBuydownCalculator'
import { RefinanceCalculator } from '../components/RefinanceCalculator'
import { RentVsBuyCalculator } from '../components/RentVsBuyCalculator'
import { ReverseMortgageCalculator } from '../components/ReverseMortgageCalculator'
import { ThemeProvider } from './ThemeProvider'
import { decodeThemeFromParam } from './theme'

type EmbedCalculatorKey =
  | 'purchase'
  | 'refinance'
  | 'rent-vs-buy'
  | 'cash-out'
  | 'rate-buydown'
  | 'reverse-mortgage'

function getCalculatorFromSearch(search: string): EmbedCalculatorKey {
  const params = new URLSearchParams(search)
  const raw = params.get('calculator') ?? 'purchase'
  const allowed: EmbedCalculatorKey[] = [
    'purchase',
    'refinance',
    'rent-vs-buy',
    'cash-out',
    'rate-buydown',
    'reverse-mortgage'
  ]
  return (allowed as string[]).includes(raw) ? (raw as EmbedCalculatorKey) : 'purchase'
}

export function EmbedPage() {
  const params = new URLSearchParams(window.location.search)
  const theme = decodeThemeFromParam(params.get('t'))
  const calculator = getCalculatorFromSearch(window.location.search)

  return (
    <ThemeProvider theme={theme} className="min-h-screen bg-[var(--mc-bg)] text-[var(--mc-text)]">
      <main className="mx-auto max-w-5xl p-4 sm:p-6">
        {calculator === 'purchase' && <PurchaseCalculator />}
        {calculator === 'refinance' && <RefinanceCalculator />}
        {calculator === 'rent-vs-buy' && <RentVsBuyCalculator />}
        {calculator === 'cash-out' && <CashOutCalculator />}
        {calculator === 'rate-buydown' && <RateBuydownCalculator />}
        {calculator === 'reverse-mortgage' && <ReverseMortgageCalculator />}
      </main>
    </ThemeProvider>
  )
}


