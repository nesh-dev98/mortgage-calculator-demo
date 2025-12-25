import { type ComponentType, useMemo, useState } from 'react'
import {
  BadgeDollarSign,
  Building2,
  HandCoins,
  Home,
  Landmark,
  RefreshCcw
} from 'lucide-react'
import { CashOutCalculator } from './components/CashOutCalculator'
import { PurchaseCalculator } from './components/PurchaseCalculator'
import { RateBuydownCalculator } from './components/RateBuydownCalculator'
import { RefinanceCalculator } from './components/RefinanceCalculator'
import { RentVsBuyCalculator } from './components/RentVsBuyCalculator'
import { ReverseMortgageCalculator } from './components/ReverseMortgageCalculator'

type TabKey =
  | 'purchase'
  | 'refinance'
  | 'rent-vs-buy'
  | 'cash-out'
  | 'rate-buydown'
  | 'reverse-mortgage'

type TabDef = {
  key: TabKey
  label: string
  Icon: ComponentType<{ className?: string }>
}

export default function App() {
  const tabs = useMemo<TabDef[]>(
    () => [
      { key: 'purchase', label: 'Purchase', Icon: Home },
      { key: 'refinance', label: 'Refinance', Icon: RefreshCcw },
      { key: 'rent-vs-buy', label: 'Rent vs Buy', Icon: Building2 },
      { key: 'cash-out', label: 'Cash Out', Icon: HandCoins },
      { key: 'rate-buydown', label: 'Rate Buydown', Icon: BadgeDollarSign },
      { key: 'reverse-mortgage', label: 'Reverse Mortgage', Icon: Landmark }
    ],
    []
  )

  const [activeTab, setActiveTab] = useState<TabKey>('purchase')

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-navy-900 shadow-sm ring-1 ring-slate-200/60" />
                <div className="truncate text-base font-semibold tracking-tight text-slate-900">
                  Mortgage Calculator Suite
                </div>
              </div>
              <div className="mt-1 text-sm text-slate-500">
                Clean fintech UI with tabbed calculators (placeholder screens for now).
              </div>
            </div>

            <div className="hidden items-center gap-2 sm:flex">
              <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                Navy accents · Subtle shadows
              </div>
            </div>
          </div>

          <nav className="mt-4">
            <div className="flex flex-wrap gap-2">
              {tabs.map(({ key, label, Icon }) => {
                const isActive = key === activeTab
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    className={[
                      'group inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium shadow-sm transition',
                      isActive
                        ? 'border-navy-900 bg-navy-900 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    ].join(' ')}
                  >
                    <Icon
                      className={[
                        'h-4 w-4',
                        isActive ? 'text-white' : 'text-navy-900'
                      ].join(' ')}
                    />
                    <span>{label}</span>
                  </button>
                )
              })}
            </div>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.25)]">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Active Calculator
              </div>
              <div className="mt-1 text-lg font-semibold text-slate-900">
                {tabs.find(t => t.key === activeTab)?.label}
              </div>
            </div>
            <div className="rounded-xl bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
              Coming soon: inputs, amortization, charts
            </div>
          </div>

          {activeTab === 'purchase' && <PurchaseCalculator />}
          {activeTab === 'refinance' && <RefinanceCalculator />}
          {activeTab === 'rent-vs-buy' && <RentVsBuyCalculator />}
          {activeTab === 'cash-out' && <CashOutCalculator />}
          {activeTab === 'rate-buydown' && <RateBuydownCalculator />}
          {activeTab === 'reverse-mortgage' && <ReverseMortgageCalculator />}
        </div>

        <footer className="mt-8 text-center text-xs text-slate-500">
          Built with Vite + React + TypeScript · Styled with Tailwind · Icons by lucide-react
        </footer>
      </main>
    </div>
  )
}


