import { useState, useEffect } from 'react'
import { Landmark, TrendingUp, Calendar, DollarSign, Plus, RefreshCw, ChevronRight } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import Modal from '@/components/modals/Modal'
import { usePensionStore } from '@/store/usePensionStore'
import { useWalletStore } from '@/store/useWalletStore'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

// Client-side compound interest projection for instant chart updates
function projectPension(currentAge: number, retirementAge: number, currentBalance: number, monthly: number, matchPct: number, returnRate: number) {
  const years = retirementAge - currentAge
  const points: { age: number; balance: number }[] = []
  let bal = currentBalance
  const totalMonthly = monthly * (1 + matchPct / 100)
  const monthlyRate  = returnRate / 100 / 12
  for (let y = 0; y <= years; y++) {
    points.push({ age: currentAge + y, balance: Math.round(bal) })
    for (let m = 0; m < 12; m++) {
      bal = bal * (1 + monthlyRate) + totalMonthly
    }
  }
  return points
}

export default function PensionPlanner() {
  const { plan, isLoading, fetchPlan, updatePlan, contribute } = usePensionStore()
  const { balance, setBalance } = useWalletStore()

  const [showEdit, setShowEdit]       = useState(false)
  const [showContrib, setShowContrib] = useState(false)
  const [contribAmt, setContribAmt]   = useState('')
  const [loading, setLoading]         = useState(false)

  // Form state
  const [currentAge,    setCurrentAge]    = useState(plan?.currentAge          ?? 30)
  const [retirementAge, setRetirementAge] = useState(plan?.retirementAge       ?? 60)
  const [curBalance,    setCurBalance]    = useState(String(plan?.currentBalance ?? 500000))
  const [monthly,       setMonthly]       = useState(String(plan?.monthlyContribution ?? 25000))
  const [matchPct,      setMatchPct]      = useState(plan?.employerMatchPct    ?? 50)
  const [returnRate,    setReturnRate]    = useState(plan?.expectedReturn       ?? 10)

  useEffect(() => { fetchPlan() }, [])

  // Sync form when plan loads
  useEffect(() => {
    if (plan) {
      setCurrentAge(plan.currentAge); setRetirementAge(plan.retirementAge)
      setCurBalance(String(plan.currentBalance)); setMonthly(String(plan.monthlyContribution))
      setMatchPct(plan.employerMatchPct); setReturnRate(plan.expectedReturn)
    }
  }, [plan])

  const projData = projectPension(currentAge, retirementAge, Number(curBalance), Number(monthly), matchPct, returnRate)
  const projectedBalance    = projData[projData.length - 1]?.balance ?? 0
  const monthlyIncome       = Math.round(projectedBalance * 0.04 / 12)
  const yearsToRetirement   = retirementAge - currentAge

  const handleUpdate = async () => {
    if (retirementAge <= currentAge) { toast.error('Retirement age must be after current age'); return }
    setLoading(true)
    try {
      await updatePlan({ currentAge, retirementAge, currentBalance: Number(curBalance), monthlyContribution: Number(monthly), employerMatchPct: matchPct, expectedReturn: returnRate })
      toast.success('Pension plan updated!')
      setShowEdit(false)
    } catch { toast.error('Update failed') }
    finally { setLoading(false) }
  }

  const handleContribute = async () => {
    const amt = Number(contribAmt)
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return }
    if (amt > balance)    { toast.error('Insufficient wallet balance'); return }
    setLoading(true)
    try {
      await contribute(amt)
      setBalance(balance - amt)
      toast.success(`₦${amt.toLocaleString()} added to your pension!`)
      setShowContrib(false); setContribAmt('')
    } catch { toast.error('Contribution failed') }
    finally { setLoading(false) }
  }

  const content = (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">Pension Planner</h1><p className="page-subtitle">Secure your retirement</p></div>
        <button onClick={() => fetchPlan()} className="btn-icon bg-gray-100">
          <RefreshCw size={16} className={cn('text-gray-600', isLoading && 'animate-spin')} />
        </button>
      </div>

      {/* Projection Hero */}
      <div className="mx-4 mb-4 rounded-4xl bg-gradient-to-br from-teal-600 to-emerald-700 p-5 shadow-premium relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border-[20px] border-white/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1"><Landmark size={14} className="text-teal-200" /><span className="text-teal-100 text-xs font-semibold">Projected at Age {retirementAge}</span></div>
          <p className="font-display font-bold text-white text-3xl mb-0.5">{formatCurrency(projectedBalance, 'NGN', true)}</p>
          <p className="text-teal-200 text-xs mb-4">Monthly income: {formatCurrency(monthlyIncome, 'NGN', true)}/mo</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Current Balance', val: formatCurrency(plan?.currentBalance ?? Number(curBalance), 'NGN', true) },
              { label: 'Years Left',      val: `${yearsToRetirement} yrs` },
              { label: 'Monthly Total',   val: formatCurrency(Number(monthly) * (1 + matchPct / 100), 'NGN', true) },
            ].map(({ label, val }) => (
              <div key={label} className="bg-white/15 rounded-2xl p-2.5 text-center">
                <p className="text-white/50 text-[9px]">{label}</p>
                <p className="text-white font-display font-bold text-sm">{val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 px-4 mb-4">
        <button onClick={() => setShowContrib(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-teal-600 text-white font-bold py-3 rounded-2xl hover:bg-teal-700 shadow-lg active:scale-95 transition-all text-sm">
          <Plus size={16} /> Contribute Now
        </button>
        <button onClick={() => setShowEdit(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-white text-teal-600 font-bold py-3 rounded-2xl shadow-card hover:shadow-card-hover border border-teal-100 active:scale-95 transition-all text-sm">
          <ChevronRight size={16} /> Adjust Plan
        </button>
      </div>

      {/* Growth Projection Chart */}
      <div className="mx-4 mb-4 bg-white rounded-3xl shadow-card p-4">
        <p className="font-display font-bold text-sm text-gray-900 mb-3">Balance Growth Projection</p>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={projData.filter((_, i) => i % Math.max(1, Math.floor(projData.length / 8)) === 0 || i === projData.length - 1)}
            margin={{ top: 5, right: 0, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="penGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#0d9488" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0d9488" stopOpacity={0}   />
              </linearGradient>
            </defs>
            <XAxis dataKey="age" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false}
              tickFormatter={v => `Age ${v}`} />
            <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false}
              tickFormatter={v => `₦${(v / 1e6).toFixed(0)}M`} />
            <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 11 }}
              formatter={(v: number) => [formatCurrency(v), 'Projected Balance']} />
            <Area type="monotone" dataKey="balance" stroke="#0d9488" strokeWidth={2.5} fill="url(#penGrad)" />
          </AreaChart>
        </ResponsiveContainer>
        <p className="text-[10px] text-gray-400 mt-1 text-center">Assumes {returnRate}% annual return · {matchPct}% employer match</p>
      </div>

      {/* Contribution History */}
      {(plan?.contributions ?? []).length > 0 && (
        <div className="mx-4 mb-4 bg-white rounded-3xl shadow-card p-4">
          <p className="font-display font-bold text-sm text-gray-900 mb-3">Monthly Contributions</p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={plan?.contributions ?? []} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                tickFormatter={v => v.split(' ')[0]} />
              <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                tickFormatter={v => `₦${v / 1000}K`} />
              <Tooltip formatter={(v: number) => [formatCurrency(v)]}
                contentStyle={{ borderRadius: 12, border: 'none', fontSize: 11 }} />
              <Bar dataKey="amount" fill="#0d9488" radius={[4, 4, 0, 0]} name="Your contribution" />
              <Bar dataKey="employerMatch" fill="#5eead4" radius={[4, 4, 0, 0]} name="Employer match" />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 justify-center text-[10px] text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-teal-600 inline-block" />Your contribution</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-teal-300 inline-block" />Employer match</span>
          </div>
        </div>
      )}

      {/* Key stats */}
      <div className="px-4">
        <p className="section-label">Plan Details</p>
        <div className="surface">
          {[
            { label: 'Retirement Age', val: `Age ${plan?.retirementAge ?? retirementAge}` },
            { label: 'Monthly Contribution', val: formatCurrency(plan?.monthlyContribution ?? Number(monthly)) },
            { label: 'Employer Match', val: `${plan?.employerMatchPct ?? matchPct}%` },
            { label: 'Expected Annual Return', val: `${plan?.expectedReturn ?? returnRate}%` },
            { label: 'Projected Monthly Income', val: formatCurrency(monthlyIncome) },
          ].map(({ label, val }, i) => (
            <div key={label} className={cn('list-item', i < 4 && 'border-b border-gray-50')}>
              <p className="text-sm text-gray-600">{label}</p>
              <p className="text-sm font-bold text-gray-900">{val}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <AppHeader title="Pension Planner" showBack />
      <DeviceFrame>{content}</DeviceFrame>

      {/* Adjust Plan Modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Adjust Pension Plan">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Current Age</label>
              <input type="number" value={currentAge} onChange={e => setCurrentAge(Number(e.target.value))} min={18} max={65} className="input-field text-center font-bold" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Retirement Age</label>
              <input type="number" value={retirementAge} onChange={e => setRetirementAge(Number(e.target.value))} min={50} max={75} className="input-field text-center font-bold" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Current Pension Balance (₦)</label>
            <input type="number" value={curBalance} onChange={e => setCurBalance(e.target.value)} className="input-field font-bold" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Monthly Contribution (₦)</label>
            <input type="number" value={monthly} onChange={e => setMonthly(e.target.value)} className="input-field font-bold" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">Employer Match: {matchPct}%</label>
            <input type="range" min={0} max={100} step={5} value={matchPct} onChange={e => setMatchPct(Number(e.target.value))}
              className="w-full accent-teal-600" />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1"><span>0%</span><span>50%</span><span>100%</span></div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">Expected Annual Return: {returnRate}%</label>
            <input type="range" min={4} max={20} step={0.5} value={returnRate} onChange={e => setReturnRate(Number(e.target.value))}
              className="w-full accent-teal-600" />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1"><span>4%</span><span>12%</span><span>20%</span></div>
          </div>
          {/* Live preview */}
          <div className="bg-teal-50 rounded-2xl p-4 border border-teal-100">
            <p className="text-xs font-bold text-teal-800 mb-2">Live Projection</p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Projected Balance</span>
              <span className="font-bold text-teal-700">{formatCurrency(projectedBalance, 'NGN', true)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600">Monthly Income</span>
              <span className="font-bold text-teal-700">{formatCurrency(monthlyIncome, 'NGN', true)}/mo</span>
            </div>
          </div>
          <button onClick={handleUpdate} disabled={loading} className="w-full py-4 bg-teal-600 text-white font-bold rounded-2xl hover:bg-teal-700 transition-colors disabled:opacity-50">
            {loading ? 'Saving…' : 'Save Plan'}
          </button>
        </div>
      </Modal>

      {/* Contribute Modal */}
      <Modal isOpen={showContrib} onClose={() => setShowContrib(false)} title="Make Contribution">
        <div className="space-y-4">
          <div className="bg-teal-50 rounded-xl px-4 py-3 flex justify-between text-sm">
            <span className="text-gray-600">Wallet Balance</span>
            <span className="font-bold text-teal-700">{formatCurrency(balance)}</span>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Contribution Amount (₦)</label>
            <input type="number" value={contribAmt} onChange={e => setContribAmt(e.target.value)} placeholder="0.00" className="input-field text-2xl font-bold" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[5000, 10000, 25000, 50000].map(a => (
              <button key={a} type="button" onClick={() => setContribAmt(String(a))}
                className={cn('py-2.5 text-xs font-bold rounded-xl border-2 transition-all',
                  Number(contribAmt) === a ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-600')}>
                {formatCurrency(a, 'NGN', true)}
              </button>
            ))}
          </div>
          {contribAmt && Number(contribAmt) > balance && <p className="text-red-500 text-xs">Insufficient wallet balance</p>}
          <button onClick={handleContribute} disabled={loading || !contribAmt || Number(contribAmt) > balance}
            className="w-full py-4 bg-teal-600 text-white font-bold rounded-2xl hover:bg-teal-700 transition-colors disabled:opacity-50">
            {loading ? 'Contributing…' : `Contribute ${contribAmt ? formatCurrency(Number(contribAmt)) : '—'}`}
          </button>
        </div>
      </Modal>
    </>
  )
}
