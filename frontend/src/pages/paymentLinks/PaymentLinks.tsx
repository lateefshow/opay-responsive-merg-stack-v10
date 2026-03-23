import { useState, useEffect } from 'react'
import { Link2, Plus, Copy, ToggleLeft, ToggleRight, Trash2, ExternalLink, RefreshCw, Play } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import Modal from '@/components/modals/Modal'
import { usePaymentLinkStore, type PaymentLink } from '@/store/usePaymentLinkStore'
import { useWalletStore } from '@/store/useWalletStore'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
  active:   { color: 'text-brand-700', bg: 'bg-brand-50',  label: 'Active'   },
  inactive: { color: 'text-gray-500',  bg: 'bg-gray-100',  label: 'Paused'   },
  expired:  { color: 'text-red-600',   bg: 'bg-red-50',    label: 'Expired'  },
}

function LinkCard({ link, onCopy, onToggle, onDelete, onSimulate }: {
  link: PaymentLink
  onCopy: (url: string) => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onSimulate: (link: PaymentLink) => void
}) {
  const meta = STATUS_META[link.status] ?? STATUS_META.active
  return (
    <div className={cn('bg-white rounded-3xl shadow-card overflow-hidden', link.status === 'inactive' && 'opacity-70')}>
      <div className="h-1 w-full" style={{ background: link.status === 'active' ? '#16a34a' : link.status === 'expired' ? '#ef4444' : '#9ca3af' }} />
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 truncate">{link.title}</p>
            {link.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{link.description}</p>}
          </div>
          <span className={cn('badge text-[10px] ml-2 flex-shrink-0', meta.bg, meta.color)}>{meta.label}</span>
        </div>

        {/* Amount & stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-gray-400">Amount</p>
            <p className="text-xs font-bold text-gray-900">{link.isFixedAmount ? formatCurrency(link.amount, 'NGN', true) : 'Open'}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-gray-400">Collected</p>
            <p className="text-xs font-bold text-brand-600">{formatCurrency(link.totalCollected, 'NGN', true)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-gray-400">Payments</p>
            <p className="text-xs font-bold text-gray-900">{link.paymentCount}</p>
          </div>
        </div>

        {/* URL */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 mb-3">
          <Link2 size={12} className="text-gray-400 flex-shrink-0" />
          <p className="text-[10px] text-gray-600 truncate flex-1 font-mono">{link.url}</p>
          <button onClick={() => onCopy(link.url)} className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0">
            <Copy size={12} className="text-gray-500" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {link.status === 'active' && (
            <button onClick={() => onSimulate(link)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-brand-600 bg-brand-50 rounded-xl hover:bg-brand-100 transition-colors">
              <Play size={11} /> Test Payment
            </button>
          )}
          <button onClick={() => onToggle(link.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
            {link.status === 'active' ? <ToggleRight size={12} className="text-brand-500" /> : <ToggleLeft size={12} />}
            {link.status === 'active' ? 'Pause' : 'Activate'}
          </button>
          <button onClick={() => onDelete(link.id)}
            className="w-9 flex items-center justify-center py-2 text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>

        {link.expiresAt && <p className="text-[10px] text-gray-400 mt-2 text-center">Expires {formatDate(link.expiresAt, 'short')}</p>}
      </div>
    </div>
  )
}

export default function PaymentLinks() {
  const { links, totalCollected, isLoading, fetchLinks, createLink, toggleLink, deleteLink, simulatePayment } = usePaymentLinkStore()
  const { balance, setBalance } = useWalletStore()
  const [showCreate, setShowCreate]   = useState(false)
  const [showSim, setShowSim]         = useState<PaymentLink | null>(null)
  const [loading, setLoading]         = useState(false)

  // Create form
  const [title, setTitle]             = useState('')
  const [desc, setDesc]               = useState('')
  const [amount, setAmount]           = useState('')
  const [isFixed, setIsFixed]         = useState(true)

  // Simulate form
  const [simAmt, setSimAmt]           = useState('')
  const [simName, setSimName]         = useState('Walk-in Customer')
  const [simEmail, setSimEmail]       = useState('customer@email.com')

  useEffect(() => { fetchLinks() }, [])

  const safeLinks = links ?? []
  const activeLinks = safeLinks.filter(l => l.status === 'active')

  const handleCreate = async () => {
    if (!title) { toast.error('Enter a title'); return }
    if (isFixed && !amount) { toast.error('Enter amount for fixed payment'); return }
    setLoading(true)
    try {
      await createLink({ title, description: desc, amount: Number(amount) || 0, isFixedAmount: isFixed })
      toast.success('Payment link created! 🔗')
      setShowCreate(false); setTitle(''); setDesc(''); setAmount('')
    } catch { toast.error('Failed to create link') }
    finally { setLoading(false) }
  }

  const handleSim = async () => {
    if (!showSim) return
    const amt = showSim.isFixedAmount ? showSim.amount : Number(simAmt) || 0
    if (!amt) { toast.error('Enter payment amount'); return }
    setLoading(true)
    try {
      await simulatePayment(showSim.id, amt, simName, simEmail)
      setBalance(balance + amt)
      toast.success(`₦${amt.toLocaleString()} payment received! 💰`)
      setShowSim(null); setSimAmt('')
    } catch { toast.error('Simulation failed') }
    finally { setLoading(false) }
  }

  const handleCopy = (url: string) => { navigator.clipboard.writeText(url); toast.success('Link copied! 📋') }
  const handleToggle = async (id: string) => { await toggleLink(id); toast.success('Link status updated') }
  const handleDelete = async (id: string) => { await deleteLink(id); toast.success('Link deleted') }

  const content = (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">Payment Links</h1><p className="page-subtitle">Create & share payment requests</p></div>
        <div className="flex gap-2">
          <button onClick={() => fetchLinks()} className="btn-icon bg-gray-100"><RefreshCw size={16} className={cn('text-gray-600', isLoading && 'animate-spin')} /></button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-bold px-4 py-2 rounded-2xl hover:bg-brand-700 shadow-float-green active:scale-95 transition-all">
            <Plus size={15} /> Create
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="mx-4 mb-4 bg-brand-gradient rounded-3xl p-5 shadow-float-green relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border-[20px] border-white/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1"><Link2 size={14} className="text-brand-200" /><span className="text-brand-100 text-xs font-semibold">Total Collected</span></div>
          <p className="font-display font-bold text-white text-3xl mb-3">{formatCurrency(totalCollected)}</p>
          <div className="grid grid-cols-3 gap-2">
            {[{ l:'Links', v:safeLinks.length }, { l:'Active', v:activeLinks.length }, { l:'Payments', v:safeLinks.reduce((s,l)=>s+l.paymentCount,0) }].map(({ l, v }) => (
              <div key={l} className="bg-white/15 rounded-2xl p-2.5 text-center">
                <p className="text-white/60 text-[9px]">{l}</p>
                <p className="text-white font-display font-bold text-lg">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Links grid */}
      <div className="px-4 space-y-3">
        {safeLinks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl shadow-card">
            <Link2 size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="font-bold text-gray-500">No payment links yet</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">Create a link and share it to receive payments instantly</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary px-6 py-2.5 text-sm">Create First Link</button>
          </div>
        ) : safeLinks.map(link => (
          <LinkCard key={link.id} link={link} onCopy={handleCopy} onToggle={handleToggle} onDelete={handleDelete} onSimulate={(l) => { setShowSim(l); setSimAmt(l.isFixedAmount ? String(l.amount) : '') }} />
        ))}
      </div>
    </div>
  )

  return (
    <>
      <AppHeader title="Payment Links" showBack />
      <DeviceFrame>{content}</DeviceFrame>

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Payment Link">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Freelance Payment, Donation" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Description <span className="font-normal text-gray-400">optional</span></label>
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="What is this payment for?" className="input-field" />
          </div>
          <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3">
            <div>
              <p className="text-sm font-bold text-gray-900">{isFixed ? 'Fixed Amount' : 'Open Amount'}</p>
              <p className="text-xs text-gray-400">{isFixed ? 'Payer pays a set amount' : 'Payer chooses how much to pay'}</p>
            </div>
            <button onClick={() => setIsFixed(v => !v)}
              className={cn('relative w-12 h-6 rounded-full transition-all', isFixed ? 'bg-brand-500' : 'bg-gray-200')}>
              <div className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all', isFixed ? 'left-6' : 'left-0.5')} />
            </button>
          </div>
          {isFixed && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Amount (₦)</label>
              <input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="0.00" className="input-field text-xl font-bold" />
            </div>
          )}
          <button onClick={handleCreate} disabled={loading || !title || (isFixed && !amount)} className="btn-primary w-full py-4">
            {loading ? 'Creating…' : 'Create Payment Link'}
          </button>
        </div>
      </Modal>

      {/* Simulate Modal */}
      <Modal isOpen={!!showSim} onClose={() => setShowSim(null)} title={`Test: ${showSim?.title ?? ''}`}>
        {showSim && (
          <div className="space-y-4">
            <div className="bg-brand-50 rounded-2xl p-4">
              <p className="text-xs font-bold text-brand-900 mb-1">Simulating a customer payment</p>
              <p className="text-xs text-brand-700">This will credit your wallet with the payment amount.</p>
            </div>
            {!showSim.isFixedAmount && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Payment Amount (₦)</label>
                <input value={simAmt} onChange={e => setSimAmt(e.target.value)} type="number" placeholder="0.00" className="input-field text-xl font-bold" />
              </div>
            )}
            {showSim.isFixedAmount && (
              <div className="bg-gray-50 rounded-2xl px-4 py-3 flex justify-between text-sm">
                <span className="text-gray-600">Fixed amount</span>
                <span className="font-bold text-gray-900">{formatCurrency(showSim.amount)}</span>
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Payer Name</label>
              <input value={simName} onChange={e => setSimName(e.target.value)} className="input-field" />
            </div>
            <button onClick={handleSim} disabled={loading} className="btn-primary w-full py-4">
              {loading ? 'Processing…' : `Simulate Payment · ${formatCurrency(showSim.isFixedAmount ? showSim.amount : Number(simAmt)||0)}`}
            </button>
          </div>
        )}
      </Modal>
    </>
  )
}
