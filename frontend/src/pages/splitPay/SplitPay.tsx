import { useState, useEffect } from 'react'
import { Users, Plus, CheckCircle2, Clock, XCircle, Send, Trash2, MoreVertical, Receipt } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import Modal from '@/components/modals/Modal'
import { useSplitPayStore } from '@/store/useSplitPayStore'
import { useContactsStore } from '@/store/useContactsStore'
import { useWalletStore } from '@/store/useWalletStore'
import { useAuthStore } from '@/store/useAuthStore'
import { formatCurrency, formatDate, percentage, cn, sleep, AVATAR_COLORS } from '@/lib/utils'
import type { SplitRequest, SplitParticipant } from '@/types'
import toast from 'react-hot-toast'

const STATUS_META: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  pending:   { icon:Clock,         color:'text-amber-600', bg:'bg-amber-50',  label:'Pending'   },
  partial:   { icon:MoreVertical,  color:'text-blue-600',  bg:'bg-blue-50',   label:'Partial'   },
  complete:  { icon:CheckCircle2,  color:'text-brand-600', bg:'bg-brand-50',  label:'Complete'  },
  cancelled: { icon:XCircle,       color:'text-gray-500',  bg:'bg-gray-100',  label:'Cancelled' },
}

function SplitCard({ split, onMarkPaid, onCancel }: {
  split: SplitRequest
  onMarkPaid: (splitId: string, userId: string) => void
  onCancel: (id: string) => void
}) {
  const meta = STATUS_META[split.status] ?? STATUS_META.pending
  const Icon = meta.icon
  const paidCount  = split.participants.filter(p => p.paid).length
  const totalCount = split.participants.length
  const paidAmt    = split.participants.filter(p => p.paid).reduce((s, p) => s + p.amount, 0)
  const pct        = percentage(paidAmt, split.totalAmount)

  return (
    <div className="bg-white rounded-3xl shadow-card overflow-hidden">
      <div className={cn('h-1.5 w-full', split.status==='complete'?'bg-brand-500':split.status==='partial'?'bg-blue-500':split.status==='cancelled'?'bg-gray-300':'bg-amber-500')}/>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-bold text-gray-900">{split.title}</p>
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{split.description}</p>
          </div>
          <span className={cn('badge text-[10px] flex items-center gap-1 flex-shrink-0', meta.bg, meta.color)}>
            <Icon size={10}/>{meta.label}
          </span>
        </div>

        {/* Total and progress */}
        <div className="bg-gray-50 rounded-2xl px-4 py-3 mb-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-gray-400">Total</span>
            <span className="font-display font-bold text-gray-900">{formatCurrency(split.totalAmount)}</span>
          </div>
          <div className="progress-bar mb-1">
            <div className="progress-fill" style={{'--progress':`${pct}%`} as React.CSSProperties}/>
          </div>
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>Collected: {formatCurrency(paidAmt, 'NGN', true)}</span>
            <span>{paidCount}/{totalCount} paid</span>
          </div>
        </div>

        {/* Participants */}
        <div className="space-y-2 mb-3">
          {split.participants.map(p => (
            <div key={p.userId} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: p.avatarColor }}>
                {p.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{p.name}</p>
                {p.paid && p.paidAt && (
                  <p className="text-[10px] text-brand-600">Paid {formatDate(p.paidAt, 'relative')}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">{formatCurrency(p.amount, 'NGN', true)}</span>
                {p.paid
                  ? <CheckCircle2 size={16} className="text-brand-500"/>
                  : split.status !== 'cancelled' && split.status !== 'complete' && (
                    <button onClick={() => onMarkPaid(split.id, p.userId)}
                      className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded-lg hover:bg-brand-100 transition-colors">
                      Remind
                    </button>
                  )
                }
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">{formatDate(split.createdAt, 'relative')} · by {split.createdBy.split(' ')[0]}</p>
          {split.status !== 'cancelled' && split.status !== 'complete' && (
            <button onClick={() => onCancel(split.id)}
              className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors flex items-center gap-1">
              <Trash2 size={11}/> Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const splitSchema = z.object({
  title:       z.string().min(3, 'Enter a title'),
  description: z.string().min(5, 'Describe the split'),
  totalAmount: z.coerce.number().positive('Enter an amount'),
})
type SplitInput = z.infer<typeof splitSchema>

export default function SplitPay() {
  const { splits, fetchSplits, createSplit, markPaid, cancelSplit } = useSplitPayStore()
  const { contacts }  = useContactsStore()
  const { user }      = useAuthStore()
  const [showCreate, setShowCreate] = useState(false)
  const [selected, setSelected]    = useState<string[]>([])
  const [loading, setLoading]      = useState(false)
  const [tab, setTab]              = useState<'active'|'history'>('active')

  const safeSplits   = splits ?? []
  useEffect(() => { fetchSplits() }, [])
  const safeContacts = contacts ?? []

  const { register, handleSubmit, reset, watch, formState:{errors} } = useForm<SplitInput>({
    resolver: zodResolver(splitSchema),
  })

  const totalAmt  = Number(watch('totalAmount')) || 0
  const perPerson = selected.length > 0 ? totalAmt / (selected.length + 1) : totalAmt

  const onCreate = async (data: SplitInput) => {
    if (selected.length === 0) { toast.error('Select at least 1 participant'); return }
    setLoading(true)
    try {
      const participants: SplitParticipant[] = selected.map(cid => {
        const c = safeContacts.find(x => x.id === cid)!
        return { userId:cid, name:c.name, email:c.email, avatarColor:c.avatarColor, initials:c.initials, amount:perPerson, paid:false }
      })
      await createSplit({ title:data.title, description:data.description, totalAmount:data.totalAmount, participants })
      toast.success(`"${data.title}" split created!`)
      reset(); setSelected([]); setShowCreate(false)
    } catch (err: unknown) {
      toast.error((err as {response?:{data?:{error?:string}}})?.response?.data?.error ?? 'Failed to create split')
    } finally { setLoading(false) }
  }

  const handleMarkPaid = async (splitId: string, userId: string) => {
    await markPaid(splitId, userId)
    toast.success('Payment marked as received!')
  }

  const activeSplits  = safeSplits.filter(s => s.status !== 'complete' && s.status !== 'cancelled')
  const historySplits = safeSplits.filter(s => s.status === 'complete' || s.status === 'cancelled')

  const totalCollected = safeSplits.filter(s => s.status === 'complete')
    .reduce((sum, s) => sum + s.totalAmount, 0)

  const content = (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">Split Pay</h1><p className="page-subtitle">Split bills effortlessly</p></div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-bold px-4 py-2 rounded-2xl hover:bg-brand-700 shadow-float-green active:scale-95 transition-all">
          <Plus size={15}/> Split
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 px-4 mb-4">
        {[
          { label:'Total Splits',  value:safeSplits.length,           sub:'all time' },
          { label:'Active',        value:activeSplits.length,         sub:'pending collection' },
          { label:'Collected',     value:formatCurrency(totalCollected,'NGN',true), sub:'from completed' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-white rounded-3xl shadow-card p-3 text-center">
            <p className="text-xs font-bold text-gray-400 mb-0.5">{label}</p>
            <p className="font-display font-bold text-gray-900 text-base">{value}</p>
            <p className="text-[10px] text-gray-400">{sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 px-4 mb-4">
        {([['active', `Active (${activeSplits.length})`], ['history', `History (${historySplits.length})`]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn('tab-pill flex-1', tab===id?'tab-active':'tab-inactive')}>{label}</button>
        ))}
      </div>

      <div className="px-4 space-y-3">
        {tab === 'active' && (
          activeSplits.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl shadow-card">
              <Receipt size={40} className="mx-auto mb-3 text-gray-200"/>
              <p className="font-bold text-gray-500">No active splits</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">Split a bill with friends instantly</p>
              <button onClick={() => setShowCreate(true)} className="btn-primary px-6 py-2.5 text-sm">Create Split</button>
            </div>
          ) : activeSplits.map(s => <SplitCard key={s.id} split={s} onMarkPaid={handleMarkPaid} onCancel={cancelSplit}/>)
        )}
        {tab === 'history' && (
          historySplits.length === 0
            ? <div className="text-center py-10 text-gray-400 text-sm">No completed splits yet</div>
            : historySplits.map(s => <SplitCard key={s.id} split={s} onMarkPaid={handleMarkPaid} onCancel={cancelSplit}/>)
        )}
      </div>
    </div>
  )

  return (
    <>
      <AppHeader title="Split Pay" showBack/>
      <DeviceFrame>{content}</DeviceFrame>

      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); reset(); setSelected([]) }} title="Create Split">
        <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Title</label>
            <input {...register('title')} placeholder="e.g. Dinner at Yellow Chilli" className="input-field"/>
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Total Amount (₦)</label>
            <input {...register('totalAmount')} type="number" placeholder="0.00" className="input-field text-xl font-bold"/>
            {errors.totalAmount && <p className="text-red-500 text-xs mt-1">{errors.totalAmount.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Description</label>
            <input {...register('description')} placeholder="What is this split for?" className="input-field"/>
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Select Participants</label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {safeContacts.map(c => (
                <label key={c.id} className={cn('flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all',
                  selected.includes(c.id) ? 'border-brand-400 bg-brand-50' : 'border-gray-100 hover:border-gray-200')}>
                  <input type="checkbox" className="sr-only"
                    checked={selected.includes(c.id)}
                    onChange={e => setSelected(prev => e.target.checked ? [...prev, c.id] : prev.filter(x => x !== c.id))}/>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: c.avatarColor }}>{c.initials}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{c.name}</p>
                    <p className="text-xs text-gray-400 truncate">{c.email}</p>
                  </div>
                  {selected.includes(c.id) && <CheckCircle2 size={16} className="text-brand-500 flex-shrink-0"/>}
                </label>
              ))}
            </div>
          </div>

          {totalAmt > 0 && selected.length > 0 && (
            <div className="bg-brand-50 rounded-2xl px-4 py-3 flex justify-between text-sm">
              <span className="text-gray-600">Each person pays</span>
              <span className="font-bold text-brand-700">{formatCurrency(perPerson)}</span>
            </div>
          )}

          <button type="submit" disabled={loading || selected.length === 0} className="btn-primary w-full py-3.5">
            {loading ? 'Creating…' : `Create Split (${selected.length + 1} people)`}
          </button>
        </form>
      </Modal>
    </>
  )
}
