import { type ComponentType, useState } from 'react'
import {
  BadgeDollarSign,
  Building2,
  Code,
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
import { EmbedBuilder } from './embed/EmbedBuilder'
import { EmbedPage } from './embed/EmbedPage'

type TabKey =
  | 'purchase'
  | 'refinance'
  | 'rent-vs-buy'
  | 'cash-out'
  | 'rate-buydown'
  | 'reverse-mortgage'
  | 'embed'

type TabDef = {
  key: TabKey
  label: string
  Icon: ComponentType<{ className?: string }>
}

const TABS: TabDef[] = [
  { key: 'purchase', label: 'Purchase', Icon: Home },
  { key: 'refinance', label: 'Refinance', Icon: RefreshCcw },
  { key: 'rent-vs-buy', label: 'Rent vs Buy', Icon: Building2 },
  { key: 'cash-out', label: 'Cash Out', Icon: HandCoins },
  { key: 'rate-buydown', label: 'Rate Buydown', Icon: BadgeDollarSign },
  { key: 'reverse-mortgage', label: 'Reverse Mortgage', Icon: Landmark },
  { key: 'embed', label: 'Embed', Icon: Code }
]

export default function App() {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/embed')) {
    return <EmbedPage />
  }

  const [activeTab, setActiveTab] = useState<TabKey>('purchase')

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.25)]">
          <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {TABS.map(({ key, label, Icon }) => {
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
          </div>

          {activeTab === 'purchase' && <PurchaseCalculator />}
          {activeTab === 'refinance' && <RefinanceCalculator />}
          {activeTab === 'rent-vs-buy' && <RentVsBuyCalculator />}
          {activeTab === 'cash-out' && <CashOutCalculator />}
          {activeTab === 'rate-buydown' && <RateBuydownCalculator />}
          {activeTab === 'reverse-mortgage' && <ReverseMortgageCalculator />}
          {activeTab === 'embed' && <EmbedBuilder />}
        </div>

        <footer className="mt-8 text-center text-xs text-slate-500">
          Built by FutureOne V1
        </footer>
      </main>
    </div>
  )
}


