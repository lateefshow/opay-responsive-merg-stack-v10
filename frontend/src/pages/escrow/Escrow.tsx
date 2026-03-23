import { useState, useEffect } from 'react'
import { Shield, Plus, CheckCircle2, Clock, XCircle, AlertTriangle, ChevronRight, Banknote, RefreshCw } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import Modal from '@/components/modals/Modal'
import { useEscrowStore, type EscrowContract, type EscrowMilestone } from '@/store/useEscrowStore'
import { useWalletStore } from '@/store/useWalletStore'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUS_META: Record<string, { color: string; bg: string; label: string; icon: React.ElementType }> = {
  open:        { color: 'text-gray-600',   bg: 'bg-gray-100',  label: 'Open',        icon: Clock         },
  funded:      { color: 'text-blue-700',   bg: 'bg-blue-50',   label: 'Funded',      icon: Banknote      },
  in_progress: { color: 'text-amber-700',  bg: 'bg-amber-50',  label: 'In Progress', icon: Clock         },
  completed:   { color: 'text-brand-700',  bg: 'bg-brand-50',  label: 'Completed',   icon: CheckCircle2  },
  disputed:    { color: 'text-red-700',    bg: 'bg-red-50',    label: 'Disputed',    icon: AlertTriangle },
  cancelled:   { color: 'text-gray-500',   bg: 'bg-gray-100',  label: 'Cancelled',   icon: XCircle       },
}

function EscrowCard({ ec, onRelease, onCancel }: {
  ec: EscrowContract; onRelease: (cId: string, mId: string, title: string) => void; onCancel: (id: string) => void
}) {
  const meta = STATUS_META[ec.status] ?? STATUS_META.funded
  const Icon = meta.icon
  const pct  = ec.totalAmount > 0 ? Math.round((ec.amountReleased / ec.totalAmount) * 100) : 0

  return (
    <div className="bg-white rounded-3xl shadow-card overflow-hidden">
      <div className="h-1.5 w-full" style={{ background: ec.status === 'completed' ? '#16a34a' : ec.status === 'cancelled' ? '#9ca3af' : '#3b82f6' }} />
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 truncate">{ec.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">To: {ec.sellerName} · {ec.sellerEmail}</p>
          </div>
          <span className={cn('badge text-[10px] flex items-center gap-1 flex-shrink-0 ml-2', meta.bg, meta.color)}>
            <Icon size={10} />{meta.label}
          </span>
        </div>

        <div className="bg-gray-50 rounded-2xl p-3 mb-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-gray-400">Progress</span>
            <span className="font-display font-bold text-gray-900">{formatCurrency(ec.amountReleased, 'NGN', true)} <span className="text-gray-400 font-normal text-xs">/ {formatCurrency(ec.totalAmount, 'NGN', true)}</span></span>
          </div>
          <div className="progress-bar mb-1">
            <div className="progress-fill" style={{ '--progress': `${pct}%` } as React.CSSProperties} />
          </div>
          <p className="text-[10px] text-gray-400">{pct}% released · ₦{ec.amountHeld.toLocaleString()} still held</p>
        </div>

        {/* Milestones */}
        <div className="space-y-2 mb-3">
          {ec.milestones.map(ms => (
            <div key={ms.id} className="flex items-center gap-3 py-1">
              <div className={cn('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0', ms.status === 'released' ? 'bg-brand-500' : 'bg-gray-200')}>
                {ms.status === 'released' ? <CheckCircle2 size={12} className="text-white" /> : <Clock size={12} className="text-gray-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">{ms.title}</p>
                {ms.releasedAt && <p className="text-[10px] text-brand-600">Released {formatDate(ms.releasedAt, 'relative')}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-900">{formatCurrency(ms.amount, 'NGN', true)}</span>
                {ms.status === 'pending' && ec.status !== 'cancelled' && (
                  <button onClick={() => onRelease(ec.id, ms.id, ms.title)}
                    className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded-lg hover:bg-brand-100 transition-colors">
                    Release
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{formatDate(ec.createdAt, 'relative')}</span>
          {ec.status !== 'completed' && ec.status !== 'cancelled' && (
            <button onClick={() => onCancel(ec.id)} className="text-red-500 font-bold hover:text-red-700">Cancel & Refund</button>
          )}
        </div>
      </div>
    </div>
  )
}

interface MilestoneInput { title: string; description: string; amount: string }

export default function Escrow() {
  const { contracts, totalHeld, isLoading, fetchEscrows, createEscrow, releaseMilestone, cancelEscrow } = useEscrowStore()
  const { balance, setBalance } = useWalletStore()
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading]       = useState(false)

  // Form state
  const [sellerEmail, setSellerEmail] = useState('')
  const [sellerName, setSellerName]   = useState('')
  const [title, setTitle]             = useState('')
  const [desc, setDesc]               = useState('')
  const [milestones, setMilestones]   = useState<MilestoneInput[]>([
    { title: '', description: '', amount: '' },
    { title: '', description: '', amount: '' },
  ])

  useEffect(() => { fetchEscrows() }, [])

  const safeContracts = contracts ?? []
  const active        = safeContracts.filter(c => c.status !== 'completed' && c.status !== 'cancelled')
  const totalAmount   = milestones.reduce((s, m) => s + (Number(m.amount) || 0), 0)
  const fee           = totalAmount * 0.01

  const handleCreate = async () => {
    if (!sellerEmail || !title || !desc) { toast.error('Fill all required fields'); return }
    const filled = milestones.filter(m => m.title && m.amount)
    if (filled.length < 1) { toast.error('Add at least 1 milestone'); return }
    if (totalAmount + fee > balance) { toast.error('Insufficient balance'); return }
    setLoading(true)
    try {
      const { contract, fee: f } = await createEscrow({
        sellerEmail, sellerName, title, description: desc,
        milestones: filled.map(m => ({ title: m.title, description: m.description, amount: Number(m.amount) })),
      })
      setBalance(balance - (contract.amountHeld + f))
      toast.success(`Escrow created! ₦${contract.amountHeld.toLocaleString()} held securely`)
      setShowCreate(false)
      setSellerEmail(''); setSellerName(''); setTitle(''); setDesc('')
      setMilestones([{ title: '', description: '', amount: '' }, { title: '', description: '', amount: '' }])
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to create escrow')
    } finally { setLoading(false) }
  }

  const handleRelease = async (contractId: string, milestoneId: string, msTitle: string) => {
    setLoading(true)
    try {
      await releaseMilestone(contractId, milestoneId)
      toast.success(`"${msTitle}" milestone released to seller!`)
    } catch { toast.error('Release failed') }
    finally { setLoading(false) }
  }

  const handleCancel = async (id: string) => {
    await cancelEscrow(id)
    toast.success('Escrow cancelled — funds refunded')
  }

  const updateMilestone = (idx: number, field: keyof MilestoneInput, val: string) => {
    setMilestones(prev => prev.map((m, i) => i === idx ? { ...m, [field]: val } : m))
  }

  const content = (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">Escrow</h1><p className="page-subtitle">Safe milestone-based payments</p></div>
        <div className="flex gap-2">
          <button onClick={() => fetchEscrows()} className="btn-icon bg-gray-100"><RefreshCw size={16} className={cn('text-gray-600', isLoading && 'animate-spin')} /></button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-bold px-4 py-2 rounded-2xl hover:bg-brand-700 shadow-float-green active:scale-95 transition-all">
            <Plus size={15} /> New
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="mx-4 mb-4 bg-dark-gradient rounded-3xl p-5 shadow-premium relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border-[20px] border-white/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1"><Shield size={14} className="text-white/60" /><span className="text-white/60 text-xs font-semibold">Total Held in Escrow</span></div>
          <p className="font-display font-bold text-white text-3xl mb-3">{formatCurrency(totalHeld)}</p>
          <div className="grid grid-cols-3 gap-2">
            {[{ l:'Total', v:safeContracts.length }, { l:'Active', v:active.length }, { l:'Completed', v:safeContracts.filter(c=>c.status==='completed').length }].map(({ l, v }) => (
              <div key={l} className="bg-white/10 rounded-2xl p-2.5 text-center">
                <p className="text-white/50 text-[9px]">{l}</p>
                <p className="text-white font-display font-bold text-lg">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="mx-4 mb-4 bg-brand-50 border border-brand-100 rounded-2xl p-4 flex items-start gap-3">
        <Shield size={16} className="text-brand-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-brand-900">How Escrow Works</p>
          <p className="text-xs text-brand-700 mt-0.5">Funds are locked until you approve each milestone. The seller gets paid only after you confirm their work. 1% escrow fee applies.</p>
        </div>
      </div>

      {/* Contracts list */}
      <div className="px-4 space-y-3">
        {safeContracts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl shadow-card">
            <Shield size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="font-bold text-gray-500">No escrow contracts yet</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">Use escrow for safe buying from sellers</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary px-6 py-2.5 text-sm">Create First Escrow</button>
          </div>
        ) : safeContracts.map(ec => (
          <EscrowCard key={ec.id} ec={ec} onRelease={handleRelease} onCancel={handleCancel} />
        ))}
      </div>
    </div>
  )

  return (
    <>
      <AppHeader title="Escrow" showBack />
      <DeviceFrame>{content}</DeviceFrame>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Escrow Contract" size="lg">
        <div className="space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Contract Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Website Development" className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Seller Name</label>
              <input value={sellerName} onChange={e => setSellerName(e.target.value)} placeholder="Full name" className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Seller Email</label>
              <input value={sellerEmail} onChange={e => setSellerEmail(e.target.value)} type="email" placeholder="seller@email.com" className="input-field" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Description</label>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="Describe what you're buying…" className="input-field resize-none" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-gray-700">Milestones</label>
              <button onClick={() => setMilestones(prev => [...prev, { title:'', description:'', amount:'' }])}
                className="text-xs font-bold text-brand-600 hover:text-brand-700">+ Add milestone</button>
            </div>
            {milestones.map((ms, idx) => (
              <div key={idx} className="bg-gray-50 rounded-2xl p-3 mb-2">
                <p className="text-[10px] font-bold text-gray-500 mb-2">Milestone {idx + 1}</p>
                <div className="grid grid-cols-2 gap-2">
                  <input value={ms.title} onChange={e => updateMilestone(idx, 'title', e.target.value)}
                    placeholder="Milestone title" className="input-field text-xs col-span-2" />
                  <input value={ms.description} onChange={e => updateMilestone(idx, 'description', e.target.value)}
                    placeholder="Description (optional)" className="input-field text-xs" />
                  <input value={ms.amount} onChange={e => updateMilestone(idx, 'amount', e.target.value)}
                    type="number" placeholder="Amount ₦" className="input-field text-xs font-bold" />
                </div>
              </div>
            ))}
          </div>

          {totalAmount > 0 && (
            <div className="bg-brand-50 rounded-2xl p-3 space-y-1 text-sm border border-brand-100">
              <div className="flex justify-between"><span className="text-gray-600">Total</span><span className="font-bold">{formatCurrency(totalAmount)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Escrow fee (1%)</span><span className="font-bold text-orange-500">+{formatCurrency(fee)}</span></div>
              <div className="flex justify-between border-t border-brand-200 pt-1.5"><span className="font-bold">Total deducted</span><span className="font-bold text-brand-600">{formatCurrency(totalAmount + fee)}</span></div>
            </div>
          )}
          {totalAmount + fee > balance && totalAmount > 0 && <p className="text-red-500 text-xs">Insufficient balance</p>}

          <button onClick={handleCreate} disabled={loading || !title || !sellerEmail || totalAmount === 0 || totalAmount + fee > balance}
            className="btn-primary w-full py-4 sticky bottom-0">
            {loading ? 'Creating…' : `Lock ${formatCurrency(totalAmount)} in Escrow`}
          </button>
        </div>
      </Modal>
    </>
  )
}
