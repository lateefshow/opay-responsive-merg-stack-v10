import { useState, useMemo } from 'react'
import { Calculator, TrendingDown, BarChart2, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import { formatCurrency, cn } from '@/lib/utils'

// ── Pure math helpers ────────────────────────────────────────────────────────
function calcEMI(principal: number, annualRate: number, months: number) {
  if (months <= 0 || principal <= 0) return { emi: 0, totalPayment: 0, totalInterest: 0 }
  if (annualRate === 0) {
    const emi = principal / months
    return { emi, totalPayment: principal, totalInterest: 0 }
  }
  const r = annualRate / 100 / 12
  const emi = principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1)
  const totalPayment = emi * months
  const totalInterest = totalPayment - principal
  return {
    emi: Math.round(emi * 100) / 100,
    totalPayment: Math.round(totalPayment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
  }
}

function buildSchedule(principal: number, annualRate: number, months: number) {
  if (months <= 0 || principal <= 0) return []
  const { emi } = calcEMI(principal, annualRate, months)
  const r = annualRate / 100 / 12
  const schedule = []
  let balance = principal
  for (let m = 1; m <= Math.min(months, 60); m++) {
    const interest  = Math.round(balance * r * 100) / 100
    const principal_payment = Math.round((emi - interest) * 100) / 100
    balance = Math.max(0, Math.round((balance - principal_payment) * 100) / 100)
    schedule.push({ month: m, emi: Math.round(emi), principal: principal_payment, interest, balance })
  }
  return schedule
}

// ── Preset loan types ────────────────────────────────────────────────────────
const LOAN_PRESETS = [
  { label: 'Personal',  rate: 24,  term: 24,  color: '#16a34a' },
  { label: 'Business',  rate: 18,  term: 36,  color: '#3b82f6' },
  { label: 'Mortgage',  rate: 12,  term: 240, color: '#8b5cf6' },
  { label: 'Auto',      rate: 20,  term: 48,  color: '#f59e0b' },
]

// ── Compare scenarios ────────────────────────────────────────────────────────
interface Scenario { label: string; rate: number; months: number }

export default function LoanCalculator() {
  const [principal, setPrincipal] = useState('1000000')
  const [rate, setRate]           = useState(24)
  const [months, setMonths]       = useState(12)
  const [showSchedule, setShowSchedule] = useState(false)
  const [tab, setTab]             = useState<'calc' | 'compare' | 'schedule'>('calc')

  const num     = Number(principal) || 0
  const { emi, totalPayment, totalInterest } = useMemo(() => calcEMI(num, rate, months), [num, rate, months])
  const schedule = useMemo(() => buildSchedule(num, rate, months), [num, rate, months])

  // Chart data — monthly balance over time
  const chartData = schedule.map(s => ({
    month: `M${s.month}`,
    principal: s.principal,
    interest: s.interest,
    balance: s.balance,
  }))

  // Compare 3 scenarios
  const scenarios: Scenario[] = [
    { label: 'Fast (6 mo)',   rate, months: 6  },
    { label: 'Standard',      rate, months     },
    { label: 'Extended (3x)', rate, months: months * 3 },
  ]

  const quick = [100000, 250000, 500000, 1000000, 2000000, 5000000]

  const content = (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">Loan Calculator</h1><p className="page-subtitle">Plan before you borrow</p></div>
        <button onClick={() => { setPrincipal('1000000'); setRate(24); setMonths(12) }}
          className="btn-icon bg-gray-100"><RefreshCw size={16} className="text-gray-600" /></button>
      </div>

      {/* Result Hero */}
      <div className="mx-4 mb-4 bg-brand-gradient rounded-4xl p-5 shadow-float-green relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border-[20px] border-white/10" />
        <div className="relative z-10">
          <p className="text-white/70 text-xs mb-1">Monthly EMI</p>
          <p className="font-display font-bold text-white text-4xl mb-3">
            {emi > 0 ? formatCurrency(emi) : '—'}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { l: 'Principal',    v: formatCurrency(num, 'NGN', true) },
              { l: 'Total Interest', v: formatCurrency(totalInterest, 'NGN', true) },
              { l: 'Total Payable', v: formatCurrency(totalPayment, 'NGN', true) },
            ].map(({ l, v }) => (
              <div key={l} className="bg-white/15 rounded-2xl p-2.5 text-center">
                <p className="text-white/50 text-[9px]">{l}</p>
                <p className="text-white font-display font-bold text-sm">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 px-4 mb-4">
        {(['calc', 'compare', 'schedule'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('tab-pill flex-1 capitalize', tab === t ? 'tab-active' : 'tab-inactive')}>
            {t === 'calc' ? 'Calculator' : t === 'compare' ? 'Compare' : 'Schedule'}
          </button>
        ))}
      </div>

      {/* CALCULATOR TAB */}
      {tab === 'calc' && (
        <div className="px-4 space-y-4">
          {/* Quick presets */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Loan Type Presets</label>
            <div className="grid grid-cols-4 gap-2">
              {LOAN_PRESETS.map(p => (
                <button key={p.label} onClick={() => { setRate(p.rate); setMonths(p.term) }}
                  className="flex flex-col items-center py-3 rounded-2xl border-2 border-gray-200 hover:border-brand-400 hover:bg-brand-50 transition-all">
                  <p className="text-[10px] font-bold text-gray-900">{p.label}</p>
                  <p className="text-[10px] text-gray-400">{p.rate}% p.a.</p>
                </button>
              ))}
            </div>
          </div>

          {/* Principal */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Loan Amount (₦)</label>
            <input value={principal} onChange={e => setPrincipal(e.target.value)} type="number"
              className="input-field text-2xl font-bold" placeholder="0" />
            <div className="flex gap-2 mt-2 flex-wrap">
              {quick.map(a => (
                <button key={a} onClick={() => setPrincipal(String(a))}
                  className={cn('px-3 py-1.5 text-xs font-bold rounded-xl border-2 transition-all',
                    Number(principal) === a ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
                  {formatCurrency(a, 'NGN', true)}
                </button>
              ))}
            </div>
          </div>

          {/* Interest rate */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-bold text-gray-700">Annual Interest Rate</label>
              <span className="font-display font-bold text-brand-600 text-lg">{rate}%</span>
            </div>
            <input type="range" min={1} max={60} step={0.5} value={rate} onChange={e => setRate(Number(e.target.value))}
              className="w-full accent-brand-600 h-2" />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1"><span>1%</span><span>30%</span><span>60%</span></div>
          </div>

          {/* Tenure */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-bold text-gray-700">Loan Tenure</label>
              <span className="font-display font-bold text-brand-600 text-lg">{months} months</span>
            </div>
            <input type="range" min={1} max={360} step={1} value={months} onChange={e => setMonths(Number(e.target.value))}
              className="w-full accent-brand-600 h-2" />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              {[1, 12, 24, 60, 120, 360].map(m => (
                <button key={m} onClick={() => setMonths(m)}
                  className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-lg transition-all',
                    months === m ? 'bg-brand-100 text-brand-700' : 'text-gray-400 hover:text-gray-600')}>
                  {m >= 12 ? `${m / 12}yr` : `${m}mo`}
                </button>
              ))}
            </div>
          </div>

          {/* Summary breakdown */}
          {emi > 0 && (
            <div className="bg-white rounded-3xl shadow-card p-4 space-y-3">
              <p className="font-bold text-sm text-gray-900">Repayment Breakdown</p>
              {[
                { label: 'Monthly EMI',    val: formatCurrency(emi),            color: 'text-brand-600' },
                { label: 'Total Principal', val: formatCurrency(num),            color: 'text-gray-900'  },
                { label: 'Total Interest', val: formatCurrency(totalInterest),   color: 'text-red-500'   },
                { label: 'Total Payable',  val: formatCurrency(totalPayment),    color: 'text-gray-900', bold: true },
                { label: 'Interest Share', val: `${num > 0 ? Math.round(totalInterest / totalPayment * 100) : 0}%`, color: 'text-amber-600' },
              ].map(({ label, val, color, bold }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{label}</span>
                  <span className={cn('text-sm font-bold', color, bold && 'text-base')}>{val}</span>
                </div>
              ))}
              {/* Visual bar */}
              <div className="h-3 rounded-full overflow-hidden flex">
                <div className="bg-brand-500 h-full transition-all" style={{ width: `${num > 0 ? Math.round(num / totalPayment * 100) : 0}%` }} />
                <div className="bg-red-400 h-full flex-1" />
              </div>
              <div className="flex gap-4 text-[10px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-500 inline-block" />Principal</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Interest</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* COMPARE TAB */}
      {tab === 'compare' && (
        <div className="px-4 space-y-3">
          <p className="text-xs text-gray-500 bg-blue-50 rounded-2xl p-3">Comparing different tenures for <span className="font-bold text-gray-900">{formatCurrency(num)}</span> at <span className="font-bold text-gray-900">{rate}%</span> p.a.</p>
          {scenarios.filter(s => s.months > 0).map((s, i) => {
            const r = calcEMI(num, s.rate, s.months)
            const colors = ['#16a34a', '#3b82f6', '#f97316']
            return (
              <div key={i} className="bg-white rounded-3xl shadow-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-gray-900">{s.label}</p>
                  <span className="text-xs text-gray-400">{s.months} months</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { l: 'EMI / month',    v: formatCurrency(r.emi, 'NGN', true)      },
                    { l: 'Total Interest', v: formatCurrency(r.totalInterest, 'NGN', true) },
                    { l: 'Total Cost',     v: formatCurrency(r.totalPayment, 'NGN', true)  },
                  ].map(({ l, v }) => (
                    <div key={l} className="bg-gray-50 rounded-xl p-2">
                      <p className="text-[9px] text-gray-400">{l}</p>
                      <p className="text-xs font-bold text-gray-900 mt-0.5">{v}</p>
                    </div>
                  ))}
                </div>
                <div className="h-1.5 rounded-full mt-3 transition-all" style={{ background: colors[i], width: `${Math.max(10, 100 - i * 25)}%` }} />
              </div>
            )
          })}

          {/* Bar chart comparison */}
          <div className="bg-white rounded-3xl shadow-card p-4">
            <p className="font-display font-bold text-sm text-gray-900 mb-3">Interest Cost Comparison</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={scenarios.filter(s => s.months > 0).map(s => ({ name: s.label, interest: calcEMI(num, s.rate, s.months).totalInterest }))}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `₦${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => [formatCurrency(v), 'Total Interest']}
                  contentStyle={{ borderRadius: 12, border: 'none', fontSize: 11 }} />
                <Bar dataKey="interest" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* SCHEDULE TAB */}
      {tab === 'schedule' && (
        <div className="px-4">
          <div className="bg-white rounded-3xl shadow-card p-4 mb-3">
            <p className="font-display font-bold text-sm text-gray-900 mb-3">Balance Over Time</p>
            <ResponsiveContainer width="100%" height={130}>
              <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 8, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                  interval={Math.floor(chartData.length / 5)} />
                <YAxis tick={{ fontSize: 8, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `₦${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => [formatCurrency(v)]} contentStyle={{ borderRadius: 12, border: 'none', fontSize: 11 }} />
                <Area type="monotone" dataKey="balance" stroke="#16a34a" strokeWidth={2} fill="url(#balGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-gray-400 mb-3 text-center">Showing up to 60 months</p>
          <div className="surface">
            <div className="flex items-center px-4 py-2 bg-gray-50 border-b border-gray-100">
              {['Mo.', 'EMI', 'Principal', 'Interest', 'Balance'].map((h, i) => (
                <p key={h} className={cn('text-[10px] font-bold text-gray-500 flex-1', i > 0 && 'text-right')}>{h}</p>
              ))}
            </div>
            {schedule.slice(0, 24).map((s, i) => (
              <div key={s.month} className={cn('flex items-center px-4 py-2.5', i < schedule.length - 1 && 'border-b border-gray-50')}>
                <p className="text-xs font-bold text-gray-700 flex-1">{s.month}</p>
                <p className="text-xs text-gray-900 font-bold flex-1 text-right">{formatCurrency(s.emi, 'NGN', true)}</p>
                <p className="text-xs text-brand-600 font-bold flex-1 text-right">{formatCurrency(s.principal, 'NGN', true)}</p>
                <p className="text-xs text-red-500 flex-1 text-right">{formatCurrency(s.interest, 'NGN', true)}</p>
                <p className="text-xs text-gray-600 flex-1 text-right">{formatCurrency(s.balance, 'NGN', true)}</p>
              </div>
            ))}
            {schedule.length > 24 && (
              <p className="text-center text-xs text-gray-400 py-3">… {schedule.length - 24} more months</p>
            )}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      <AppHeader title="Loan Calculator" showBack />
      <DeviceFrame>{content}</DeviceFrame>
    </>
  )
}
