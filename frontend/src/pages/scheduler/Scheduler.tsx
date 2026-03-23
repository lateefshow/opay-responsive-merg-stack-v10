import { useState } from 'react'
import { Calendar, Plus, Zap, Send, PiggyBank, Pause, Play, Trash2, Edit3, CheckCircle2, Clock } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import Modal from '@/components/modals/Modal'
import { useSchedulerStore } from '@/store/useSchedulerStore'
import { schedulerSchema, type SchedulerInput } from '@/lib/validators'
import { formatCurrency, formatDate, cn, sleep } from '@/lib/utils'
import type { ScheduledPayment } from '@/types'
import toast from 'react-hot-toast'

const FREQ_LABELS: Record<string,string> = { once:'One-time', daily:'Daily', weekly:'Weekly', monthly:'Monthly' }
const TYPE_META: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  transfer: { icon:Send,     color:'text-brand-600',  bg:'bg-brand-50',  label:'Transfer'  },
  bill:     { icon:Zap,      color:'text-yellow-600', bg:'bg-yellow-50', label:'Bill Pay'  },
  savings:  { icon:PiggyBank,color:'text-purple-600', bg:'bg-purple-50', label:'Savings'   },
}

function PaymentCard({ payment, onToggle, onDelete }: { payment: ScheduledPayment; onToggle:()=>void; onDelete:()=>void }) {
  const meta = TYPE_META[payment.type] ?? TYPE_META.transfer
  const Icon = meta.icon
  const daysUntil = Math.ceil((new Date(payment.nextRunDate).getTime()-Date.now())/86400000)
  return (
    <div className={cn('bg-white rounded-3xl shadow-card overflow-hidden transition-all', !payment.active&&'opacity-60')}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center', meta.bg)}>
              <Icon size={18} className={meta.color}/>
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900">{payment.name}</p>
              <p className="text-xs text-gray-400">{meta.label} · {FREQ_LABELS[payment.frequency]}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onToggle} className={cn('w-8 h-8 rounded-xl flex items-center justify-center transition-all',
              payment.active?'bg-amber-50 text-amber-600 hover:bg-amber-100':'bg-brand-50 text-brand-600 hover:bg-brand-100')}>
              {payment.active ? <Pause size={14}/> : <Play size={14}/>}
            </button>
            <button onClick={onDelete} className="w-8 h-8 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-all">
              <Trash2 size={14}/>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gray-50 rounded-xl p-2.5">
            <p className="text-[9px] font-bold text-gray-400 mb-0.5">Amount</p>
            <p className="text-sm font-bold text-gray-900">{formatCurrency(payment.amount,'NGN',true)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-2.5">
            <p className="text-[9px] font-bold text-gray-400 mb-0.5">Next Run</p>
            <p className="text-xs font-bold text-gray-900">{daysUntil<=0?'Today':`${daysUntil}d`}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-2.5">
            <p className="text-[9px] font-bold text-gray-400 mb-0.5">Status</p>
            <p className={cn('text-xs font-bold', payment.active?'text-brand-600':'text-gray-400')}>
              {payment.active?'Active':'Paused'}
            </p>
          </div>
        </div>

        {payment.lastRunDate && (
          <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
            <CheckCircle2 size={10} className="text-brand-500"/> Last ran {formatDate(payment.lastRunDate,'relative')}
          </p>
        )}
      </div>
    </div>
  )
}

export default function Scheduler() {
  const { payments, addPayment, toggleActive, deletePayment } = useSchedulerStore()
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, reset, formState:{errors} } = useForm<SchedulerInput>({
    resolver: zodResolver(schedulerSchema),
    defaultValues: { type:'bill', frequency:'monthly', amount:0 },
  })

  const onCreate = async (data: SchedulerInput) => {
    setLoading(true)
    await sleep(800)
    const p: ScheduledPayment = {
      id:crypto.randomUUID(), userId:'', type:data.type, name:data.name,
      amount:data.amount, recipientEmail:data.recipientEmail, billCategory:data.billCategory,
      frequency:data.frequency, nextRunDate:data.nextRunDate || new Date(Date.now()+604800000).toISOString(),
      active:true, createdAt:new Date().toISOString(),
    }
    addPayment(p)
    toast.success(`Scheduled payment "${data.name}" created!`)
    reset(); setShowCreate(false); setLoading(false)
  }

  const safePayments = payments ?? []
  const activeCount  = safePayments.filter(p=>p.active).length
  const totalMonthly = safePayments.filter(p=>p.active&&p.frequency==='monthly').reduce((s,p)=>s+p.amount,0)

  const upcoming = safePayments.filter(p=>p.active).sort((a,b)=>
    new Date(a.nextRunDate).getTime()-new Date(b.nextRunDate).getTime()
  ).slice(0,3)

  const content = (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">Scheduled Payments</h1><p className="page-subtitle">Automate your finances</p></div>
        <button onClick={()=>setShowCreate(true)} className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-bold px-4 py-2 rounded-2xl hover:bg-brand-700 shadow-float-green active:scale-95 transition-all">
          <Plus size={15}/> Schedule
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 px-4 mb-4">
        <div className="bg-white rounded-3xl shadow-card p-4">
          <div className="flex items-center gap-2 mb-2"><Calendar size={16} className="text-brand-600"/><span className="text-xs font-bold text-gray-400">Active</span></div>
          <p className="font-display font-bold text-2xl text-gray-900">{activeCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">scheduled payments</p>
        </div>
        <div className="bg-white rounded-3xl shadow-card p-4">
          <div className="flex items-center gap-2 mb-2"><Clock size={16} className="text-purple-600"/><span className="text-xs font-bold text-gray-400">Monthly Auto</span></div>
          <p className="font-display font-bold text-lg text-purple-700">{formatCurrency(totalMonthly,'NGN',true)}</p>
          <p className="text-xs text-gray-400 mt-0.5">auto-deducted</p>
        </div>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="mx-4 mb-4 bg-white rounded-3xl shadow-card p-4">
          <p className="font-display font-bold text-sm text-gray-900 mb-3">Upcoming Payments</p>
          <div className="space-y-2">
            {upcoming.map(p=>{
              const meta = TYPE_META[p.type] ?? TYPE_META.transfer
              const Icon = meta.icon
              const days = Math.ceil((new Date(p.nextRunDate).getTime()-Date.now())/86400000)
              return (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',meta.bg)}>
                    <Icon size={15} className={meta.color}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{days<=0?'Today':days===1?'Tomorrow':`In ${days} days`}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(p.amount,'NGN',true)}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* All payments */}
      <div className="px-4">
        <p className="section-label">All Scheduled Payments ({payments.length})</p>
        {payments.length===0 ? (
          <div className="text-center py-12 bg-white rounded-3xl shadow-card">
            <Calendar size={40} className="mx-auto mb-3 text-gray-200"/>
            <p className="font-bold text-gray-500">No scheduled payments</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">Set up automatic payments to save time</p>
            <button onClick={()=>setShowCreate(true)} className="btn-primary px-6 py-2.5 text-sm">Schedule Payment</button>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map(p=>(
              <PaymentCard key={p.id} payment={p}
                onToggle={()=>{toggleActive(p.id);toast.success(p.active?`"${p.name}" paused`:`"${p.name}" resumed`)}}
                onDelete={()=>{deletePayment(p.id);toast.success('Payment deleted')}}/>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      <AppHeader title="Scheduler" showBack/>
      <DeviceFrame>{content}</DeviceFrame>
      <Modal isOpen={showCreate} onClose={()=>{setShowCreate(false);reset()}} title="Schedule Payment">
        <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Payment Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['transfer','bill','savings'] as const).map(t=>{
                const meta=TYPE_META[t]; const Icon=meta.icon
                return (
                  <label key={t} className={cn('flex flex-col items-center gap-2 p-3 rounded-2xl border-2 cursor-pointer transition-all',
                    watch('type')===t?'border-brand-500 bg-brand-50':'border-gray-100 hover:border-gray-200')}>
                    <input type="radio" {...register('type')} value={t} className="sr-only"/>
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center',meta.bg)}><Icon size={16} className={meta.color}/></div>
                    <span className="text-xs font-bold text-gray-700 capitalize">{meta.label}</span>
                  </label>
                )
              })}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Name</label>
            <input {...register('name')} placeholder="e.g. Monthly Rent" className="input-field"/>
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Amount (₦)</label>
            <input {...register('amount')} type="number" placeholder="0.00" className="input-field text-lg font-bold"/>
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
          </div>
          {watch('type')==='transfer' && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Recipient Email</label>
              <input {...register('recipientEmail')} type="email" placeholder="recipient@example.com" className="input-field"/>
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Frequency</label>
            <select {...register('frequency')} className="input-field bg-white">
              {(['once','daily','weekly','monthly'] as const).map(f=><option key={f} value={f}>{FREQ_LABELS[f]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">First Run Date</label>
            <input {...register('nextRunDate')} type="date" className="input-field"
              min={new Date().toISOString().split('T')[0]}/>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
            {loading?'Creating…':'Schedule Payment'}
          </button>
        </form>
      </Modal>
    </>
  )
}
