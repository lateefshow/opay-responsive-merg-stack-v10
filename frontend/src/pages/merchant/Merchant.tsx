import { useState, useEffect } from 'react'
import { Store, QrCode, TrendingUp, DollarSign, ArrowDownLeft, Plus, Copy, CheckCircle2, BarChart2, RefreshCw } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import Modal from '@/components/modals/Modal'
import { useMerchantStore } from '@/store/useMerchantStore'
import { useWalletStore } from '@/store/useWalletStore'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const CATEGORIES = ['retail', 'food', 'services', 'entertainment', 'transport', 'health']

export default function MerchantPage() {
  const { profile, transactions, totalReceived, todayAmount, isLoading, fetchProfile, fetchTransactions, createProfile, receivePayment } = useMerchantStore()
  const { setBalance, balance } = useWalletStore()

  const [showSetup, setShowSetup]   = useState(false)
  const [showReceive, setShowReceive] = useState(false)
  const [showQR, setShowQR]         = useState(false)
  const [bizName, setBizName]       = useState('')
  const [category, setCategory]     = useState('retail')
  const [bizDesc, setBizDesc]       = useState('')
  const [recAmount, setRecAmount]   = useState('')
  const [recDesc, setRecDesc]       = useState('')
  const [loading, setLoading]       = useState(false)

  useEffect(() => {
    fetchProfile()
    fetchTransactions()
  }, [])

  const safeTxs = transactions ?? []

  // Build chart data from transactions
  const last7 = [...Array(7)].map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const day = d.toLocaleDateString('en-NG', { weekday: 'short' })
    const amt = safeTxs.filter(t => {
      const td = new Date(t.createdAt)
      return td.toDateString() === d.toDateString()
    }).reduce((s, t) => s + t.netAmount, 0)
    return { day, amount: amt }
  })

  const handleSetup = async () => {
    if (!bizName || !bizDesc) { toast.error('Fill all fields'); return }
    setLoading(true)
    try {
      await createProfile(bizName, category, bizDesc)
      toast.success('Merchant profile created!')
      setShowSetup(false)
      fetchTransactions()
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Setup failed')
    } finally { setLoading(false) }
  }

  const handleReceive = async () => {
    if (!recAmount) { toast.error('Enter amount'); return }
    setLoading(true)
    try {
      const tx = await receivePayment(Number(recAmount), recDesc || 'Customer payment')
      setBalance(balance + tx.netAmount)
      toast.success(`₦${tx.netAmount.toLocaleString()} received! (₦${tx.fee.toLocaleString()} fee deducted)`)
      setShowReceive(false); setRecAmount(''); setRecDesc('')
      fetchTransactions()
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Payment failed')
    } finally { setLoading(false) }
  }

  if (!profile && !isLoading) {
    return (
      <>
        <AppHeader title="Merchant" showBack />
        <DeviceFrame>
          <div className="page-container flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
            <div className="w-20 h-20 rounded-3xl bg-brand-50 flex items-center justify-center mb-5">
              <Store size={36} className="text-brand-600" />
            </div>
            <h2 className="font-display font-bold text-2xl mb-2">Accept Payments</h2>
            <p className="text-gray-400 text-sm mb-6">Set up your merchant profile to start receiving payments via QR code and payment links</p>
            <div className="grid grid-cols-3 gap-4 w-full max-w-xs mb-8">
              {[['⚡', 'Instant', 'Settle in seconds'], ['📊', 'Analytics', 'Track your sales'], ['💸', '1.5% fee', 'Industry lowest']].map(([e, t, s]) => (
                <div key={t} className="text-center">
                  <p className="text-2xl mb-1">{e}</p>
                  <p className="text-xs font-bold text-gray-900">{t}</p>
                  <p className="text-[10px] text-gray-400">{s}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setShowSetup(true)} className="btn-primary w-full py-4 text-base">
              Set Up Merchant Account
            </button>
          </div>
        </DeviceFrame>

        <Modal isOpen={showSetup} onClose={() => setShowSetup(false)} title="Create Merchant Profile">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Business Name</label>
              <input value={bizName} onChange={e => setBizName(e.target.value)} placeholder="e.g. Adaeze Fabrics Ltd" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Category</label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat} type="button" onClick={() => setCategory(cat)}
                    className={cn('py-2 text-xs font-bold rounded-xl capitalize transition-all border-2',
                      category === cat ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600')}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Business Description</label>
              <textarea value={bizDesc} onChange={e => setBizDesc(e.target.value)} placeholder="Describe your business…" rows={3} className="input-field resize-none" />
            </div>
            <button onClick={handleSetup} disabled={loading || !bizName || !bizDesc} className="btn-primary w-full py-4">
              {loading ? 'Creating…' : 'Create Profile'}
            </button>
          </div>
        </Modal>
      </>
    )
  }

  const content = (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{profile?.businessName ?? 'Merchant'}</h1>
          <p className="page-subtitle flex items-center gap-1.5">
            {profile?.isVerified && <CheckCircle2 size={12} className="text-brand-500" />}
            {profile?.isVerified ? 'Verified Business' : 'Pending Verification'} · {profile?.category}
          </p>
        </div>
        <button onClick={() => { fetchProfile(); fetchTransactions() }} className="btn-icon bg-gray-100">
          <RefreshCw size={16} className={cn('text-gray-600', isLoading && 'animate-spin')} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 px-4 mb-4">
        {[
          { label: "Today's Earnings", value: formatCurrency(todayAmount, 'NGN', true), sub: 'net after 1.5% fee', color: 'text-brand-600', icon: TrendingUp },
          { label: 'Total Received',   value: formatCurrency(totalReceived, 'NGN', true), sub: `${safeTxs.length} transactions`, color: 'text-blue-600', icon: DollarSign },
        ].map(({ label, value, sub, color, icon: Icon }) => (
          <div key={label} className="bg-white rounded-3xl shadow-card p-4">
            <Icon size={16} className={cn('mb-2', color)} />
            <p className="text-xs font-bold text-gray-400">{label}</p>
            <p className={cn('font-display font-bold text-lg mt-0.5', color)}>{value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 px-4 mb-4">
        <button onClick={() => setShowReceive(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-brand-600 text-white font-bold py-3.5 rounded-2xl hover:bg-brand-700 shadow-float-green active:scale-95 transition-all">
          <Plus size={18} /> Receive Payment
        </button>
        <button onClick={() => setShowQR(true)}
          className="w-14 h-14 flex items-center justify-center bg-white rounded-2xl shadow-card hover:shadow-card-hover border border-gray-100 active:scale-95 transition-all">
          <QrCode size={22} className="text-gray-700" />
        </button>
      </div>

      {/* 7-day chart */}
      <div className="mx-4 mb-4 bg-white rounded-3xl shadow-card p-4">
        <p className="font-display font-bold text-sm text-gray-900 mb-3 flex items-center gap-2">
          <BarChart2 size={14} className="text-brand-500" /> 7-Day Sales
        </p>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={last7} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false}
              tickFormatter={v => v >= 1000 ? `₦${v / 1000}K` : `₦${v}`} />
            <Tooltip formatter={(v: number) => [formatCurrency(v), 'Sales']}
              contentStyle={{ borderRadius: 12, border: 'none', fontSize: 11 }} />
            <Bar dataKey="amount" fill="#16a34a" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Account number */}
      <div className="mx-4 mb-4 bg-white rounded-3xl shadow-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 mb-0.5">Business Account Number</p>
            <p className="font-mono font-bold text-gray-900 text-lg tracking-widest">{profile?.accountNumber}</p>
            <p className="text-xs text-gray-400 mt-0.5">OPay Business Bank</p>
          </div>
          <button onClick={() => { navigator.clipboard.writeText(profile?.accountNumber ?? ''); toast.success('Copied!') }}
            className="p-2.5 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
            <Copy size={16} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="px-4">
        <p className="section-label">Recent Payments</p>
        {safeTxs.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-3xl shadow-card">
            <ArrowDownLeft size={32} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-bold text-gray-400">No payments yet</p>
          </div>
        ) : (
          <div className="surface">
            {safeTxs.slice(0, 10).map((tx, idx) => (
              <div key={tx.id} className={cn('list-item', idx < Math.min(safeTxs.length, 10) - 1 && 'border-b border-gray-50')}>
                <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <ArrowDownLeft size={16} className="text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{tx.customerName}</p>
                  <p className="text-xs text-gray-400">{formatDate(tx.createdAt, 'relative')} · ref {tx.reference.slice(-6)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-brand-600">+{formatCurrency(tx.netAmount, 'NGN', true)}</p>
                  <p className="text-[10px] text-gray-400">fee {formatCurrency(tx.fee, 'NGN', true)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      <AppHeader title="Merchant" showBack />
      <DeviceFrame>{content}</DeviceFrame>

      {/* Receive Payment Modal */}
      <Modal isOpen={showReceive} onClose={() => setShowReceive(false)} title="Receive Payment">
        <div className="space-y-4">
          <div className="bg-brand-50 rounded-xl px-4 py-3 flex justify-between text-sm">
            <span className="text-gray-600">Fee (1.5%)</span>
            <span className="font-bold text-gray-700">{recAmount ? formatCurrency(Number(recAmount) * 0.015) : '—'}</span>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Amount (₦)</label>
            <input value={recAmount} onChange={e => setRecAmount(e.target.value)} type="number" placeholder="0.00" className="input-field text-2xl font-bold" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Description (optional)</label>
            <input value={recDesc} onChange={e => setRecDesc(e.target.value)} placeholder="e.g. Fabric purchase" className="input-field" />
          </div>
          {recAmount && (
            <div className="bg-gray-50 rounded-2xl px-4 py-3 flex justify-between text-sm">
              <span className="text-gray-600">You receive</span>
              <span className="font-bold text-brand-600">{formatCurrency(Number(recAmount) * 0.985)}</span>
            </div>
          )}
          <button onClick={handleReceive} disabled={loading || !recAmount} className="btn-primary w-full py-4">
            {loading ? 'Processing…' : 'Confirm Receipt'}
          </button>
        </div>
      </Modal>

      {/* QR Code Modal */}
      <Modal isOpen={showQR} onClose={() => setShowQR(false)} title="Your Payment QR Code">
        <div className="flex flex-col items-center py-4">
          <div className="w-48 h-48 bg-gray-50 rounded-3xl flex items-center justify-center mb-5 border-4 border-white shadow-lg">
            <div className="text-center">
              <QrCode size={80} className="text-gray-800 mx-auto mb-2" />
              <p className="text-[9px] text-gray-500 font-mono break-all px-2">{profile?.qrCode?.slice(0, 28)}…</p>
            </div>
          </div>
          <p className="font-bold text-gray-900 text-lg">{profile?.businessName}</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">Show this code to customers to receive payments instantly</p>
          <button onClick={() => { navigator.clipboard.writeText(profile?.qrCode ?? ''); toast.success('QR link copied!') }}
            className="flex items-center gap-2 w-full justify-center bg-brand-50 text-brand-700 font-bold py-3 rounded-2xl hover:bg-brand-100 transition-colors">
            <Copy size={15} /> Copy Payment Link
          </button>
        </div>
      </Modal>
    </>
  )
}
