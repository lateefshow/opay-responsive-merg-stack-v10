import { useEffect } from 'react'
import { TrendingUp, TrendingDown, Wallet, PiggyBank, BarChart2, AlertTriangle, RefreshCw, ArrowUpRight } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import { useNetWorthStore } from '@/store/useNetWorthStore'
import { useWalletStore } from '@/store/useWalletStore'
import { useSavingsStore } from '@/store/useSavingsStore'
import { useInvestmentStore } from '@/store/useInvestmentStore'
import { useLoanStore } from '@/store/useLoanStore'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const ASSET_CONFIG = [
  { key: 'wallet',      label: 'Wallet',      icon: Wallet,    color: '#16a34a', bg: 'bg-brand-50' },
  { key: 'savings',     label: 'Savings',     icon: PiggyBank, color: '#3b82f6', bg: 'bg-blue-50'  },
  { key: 'investments', label: 'Investments', icon: BarChart2, color: '#8b5cf6', bg: 'bg-purple-50' },
]
const LIAB_CONFIG = [
  { key: 'loans', label: 'Loans',    color: '#ef4444' },
  { key: 'bnpl',  label: 'Pay Later',color: '#f97316' },
]

export default function NetWorth() {
  const { current, snapshots, isLoading, fetchNetWorth } = useNetWorthStore()
  const { balance }       = useWalletStore()
  const { plans: savPlans } = useSavingsStore()
  const { investments }   = useInvestmentStore()
  const { applications }  = useLoanStore()

  useEffect(() => { fetchNetWorth() }, [])

  const breakdown = current?.breakdown ?? {}
  const walletBal   = balance ?? breakdown.wallet    ?? 0
  const savingsVal  = (savPlans ?? []).filter(p => p.status === 'active').reduce((s, p) => s + p.currentAmount, 0)  || breakdown.savings     || 0
  const investVal   = (investments ?? []).filter(i => i.status === 'active').reduce((s, i) => s + i.currentValue, 0) || breakdown.investments || 0
  const loansOwed   = (applications ?? []).filter(l => l.status === 'active' || l.status === 'overdue').reduce((s, l) => s + l.totalRepayment, 0) || breakdown.loans || 0
  const bnplOwed    = breakdown.bnpl ?? 0
  const totalAssets = walletBal + savingsVal + investVal
  const totalLiab   = loansOwed + bnplOwed
  const netWorth    = totalAssets - totalLiab

  const assetBreakdown = [
    { ...ASSET_CONFIG[0], value: walletBal  },
    { ...ASSET_CONFIG[1], value: savingsVal },
    { ...ASSET_CONFIG[2], value: investVal  },
  ]
  const liabBreakdown = [
    { ...LIAB_CONFIG[0], value: loansOwed },
    { ...LIAB_CONFIG[1], value: bnplOwed  },
  ]
  const pieData = assetBreakdown.filter(a => a.value > 0)

  const trendData = [
    ...(snapshots ?? []).map(s => ({ date: formatDate(s.date ?? s.createdAt ?? '', 'relative'), value: s.netWorth })),
    { date: 'Now', value: netWorth },
  ].slice(-7)

  const handleRefresh = async () => {
    await fetchNetWorth()
    toast.success('Net worth refreshed')
  }

  const content = (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">Net Worth</h1><p className="page-subtitle">Your complete financial picture</p></div>
        <button onClick={handleRefresh} className="btn-icon bg-gray-100 hover:bg-gray-200">
          <RefreshCw size={16} className={cn('text-gray-600', isLoading && 'animate-spin')} />
        </button>
      </div>

      {/* Net Worth Hero */}
      <div className="mx-4 mb-4 rounded-4xl bg-dark-gradient p-6 relative overflow-hidden shadow-premium">
        <div className="absolute -right-10 -top-10 w-52 h-52 rounded-full border-[28px] border-white/5" />
        <div className="relative z-10">
          <p className="text-white/60 text-xs font-semibold mb-1">Total Net Worth</p>
          <p className="font-display font-bold text-white text-4xl mb-4">{formatCurrency(netWorth)}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 rounded-3xl p-3">
              <div className="flex items-center gap-1.5 mb-1"><TrendingUp size={12} className="text-brand-300" /><span className="text-white/60 text-[10px] font-bold">Total Assets</span></div>
              <p className="text-white font-display font-bold text-lg">{formatCurrency(totalAssets, 'NGN', true)}</p>
            </div>
            <div className="bg-white/10 rounded-3xl p-3">
              <div className="flex items-center gap-1.5 mb-1"><TrendingDown size={12} className="text-red-300" /><span className="text-white/60 text-[10px] font-bold">Total Liabilities</span></div>
              <p className="text-white font-display font-bold text-lg">{formatCurrency(totalLiab, 'NGN', true)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      {trendData.length > 1 && (
        <div className="mx-4 mb-4 bg-white rounded-3xl shadow-card p-4">
          <p className="font-display font-bold text-sm text-gray-900 mb-3">Net Worth Trend</p>
          <ResponsiveContainer width="100%" height={130}>
            <AreaChart data={trendData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                tickFormatter={v => `₦${(v / 1e6).toFixed(1)}M`} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 11 }}
                formatter={(v: number) => [formatCurrency(v), 'Net Worth']} />
              <Area type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2.5} fill="url(#nwGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Asset Breakdown */}
      <div className="px-4 mb-4">
        <p className="section-label">Assets · {formatCurrency(totalAssets, 'NGN', true)}</p>
        <div className="space-y-2">
          {assetBreakdown.map(a => {
            const Icon = a.icon
            const pct = totalAssets > 0 ? Math.round((a.value / totalAssets) * 100) : 0
            return (
              <div key={a.key} className="bg-white rounded-3xl shadow-card p-4 flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0', a.bg)}>
                  <Icon size={18} style={{ color: a.color }} strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-sm font-bold text-gray-900">{a.label}</p>
                    <p className="font-display font-bold text-gray-900">{formatCurrency(a.value, 'NGN', true)}</p>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ '--progress': `${pct}%`, background: a.color } as React.CSSProperties} />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">{pct}% of total assets</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pie chart */}
      {pieData.length > 0 && (
        <div className="mx-4 mb-4 bg-white rounded-3xl shadow-card p-4 flex items-center gap-4">
          <PieChart width={110} height={110}>
            <Pie data={pieData} cx={50} cy={50} innerRadius={30} outerRadius={50} paddingAngle={3} dataKey="value">
              {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
          </PieChart>
          <div className="flex-1">
            {pieData.map(a => (
              <div key={a.key} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: a.color }} />
                  <span className="text-xs font-bold text-gray-700">{a.label}</span>
                </div>
                <span className="text-xs text-gray-500">{totalAssets > 0 ? Math.round((a.value / totalAssets) * 100) : 0}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liabilities */}
      {totalLiab > 0 && (
        <div className="px-4 mb-4">
          <p className="section-label">Liabilities · {formatCurrency(totalLiab, 'NGN', true)}</p>
          <div className="space-y-2">
            {liabBreakdown.filter(l => l.value > 0).map(l => {
              const pct = totalLiab > 0 ? Math.round((l.value / totalLiab) * 100) : 0
              return (
                <div key={l.key} className="bg-white rounded-3xl shadow-card p-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-sm font-bold text-gray-900">{l.label}</p>
                    <p className="font-display font-bold text-red-600">{formatCurrency(l.value, 'NGN', true)}</p>
                  </div>
                  <div className="progress-bar">
                    <div style={{ height: '100%', borderRadius: 9999, width: `${pct}%`, background: l.color, transition: 'width 1s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Debt ratio insight */}
      {totalAssets > 0 && (
        <div className="mx-4 mb-4">
          <div className={cn('rounded-2xl p-4 flex items-start gap-3', totalLiab / totalAssets > 0.4 ? 'bg-red-50 border border-red-100' : 'bg-brand-50 border border-brand-100')}>
            {totalLiab / totalAssets > 0.4
              ? <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              : <ArrowUpRight size={18} className="text-brand-600 flex-shrink-0 mt-0.5" />}
            <div>
              <p className="text-sm font-bold text-gray-900">
                {totalLiab / totalAssets > 0.4 ? 'High Debt-to-Asset Ratio' : 'Healthy Financial Position'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Debt-to-assets: {totalAssets > 0 ? Math.round((totalLiab / totalAssets) * 100) : 0}%.
                {totalLiab / totalAssets > 0.4
                  ? ' Consider paying down loans to improve your ratio.'
                  : ' Keep building your assets. You\'re on the right track!'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      <AppHeader title="Net Worth" showBack />
      <DeviceFrame>{content}</DeviceFrame>
    </>
  )
}
