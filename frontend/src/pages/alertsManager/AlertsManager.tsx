import { useState, useEffect } from 'react'
import { Bell, BellOff, Plus, Trash2, Zap, TrendingDown, TrendingUp, Lock, CreditCard, PiggyBank, Smartphone, RefreshCw } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import Modal from '@/components/modals/Modal'
import { useAlertStore, type AlertRule } from '@/store/useAlertStore'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const TRIGGERS = [
  { id: 'balance_below',  label: 'Balance Below',      icon: TrendingDown, color: 'text-red-600',    bg: 'bg-red-50',    desc: 'Alert when wallet falls below amount',      hasThreshold: true  },
  { id: 'large_debit',    label: 'Large Debit',         icon: TrendingDown, color: 'text-orange-600', bg: 'bg-orange-50', desc: 'Alert when a debit exceeds amount',          hasThreshold: true  },
  { id: 'large_credit',   label: 'Large Credit',        icon: TrendingUp,   color: 'text-brand-600',  bg: 'bg-brand-50',  desc: 'Alert when a credit exceeds amount',         hasThreshold: true  },
  { id: 'loan_due',       label: 'Loan Due Soon',       icon: CreditCard,   color: 'text-amber-600',  bg: 'bg-amber-50',  desc: 'Alert when a loan payment is due in 3 days', hasThreshold: false },
  { id: 'savings_goal',   label: 'Savings Goal Reached',icon: PiggyBank,    color: 'text-purple-600', bg: 'bg-purple-50', desc: 'Alert when a savings plan hits its target',  hasThreshold: false },
  { id: 'foreign_login',  label: 'Unknown Device Login',icon: Lock,         color: 'text-red-700',    bg: 'bg-red-50',    desc: 'Alert on login from unrecognised device',    hasThreshold: false },
]

const CHANNELS = [
  { id: 'push',  label: 'Push',  icon: Smartphone, desc: 'In-app notification' },
  { id: 'email', label: 'Email', icon: Zap,         desc: 'Email notification'  },
  { id: 'sms',   label: 'SMS',   icon: Bell,        desc: 'Text message'        },
]

const SEVERITY_MAP: Record<string, { color: string; bg: string }> = {
  balance_below:  { color: 'text-red-600',    bg: 'bg-red-50'     },
  large_debit:    { color: 'text-orange-600', bg: 'bg-orange-50'  },
  large_credit:   { color: 'text-brand-600',  bg: 'bg-brand-50'   },
  loan_due:       { color: 'text-amber-600',  bg: 'bg-amber-50'   },
  savings_goal:   { color: 'text-purple-600', bg: 'bg-purple-50'  },
  foreign_login:  { color: 'text-red-700',    bg: 'bg-red-50'     },
}

function RuleCard({ rule, onToggle, onDelete }: {
  rule: AlertRule; onToggle: (id: string) => void; onDelete: (id: string) => void
}) {
  const trigger = TRIGGERS.find(t => t.id === rule.trigger) ?? TRIGGERS[0]
  const Icon    = trigger.icon
  const sev     = SEVERITY_MAP[rule.trigger] ?? { color: 'text-gray-600', bg: 'bg-gray-100' }
  const channel = CHANNELS.find(c => c.id === rule.channel)
  const ChanIcon = channel?.icon ?? Bell

  return (
    <div className={cn('bg-white rounded-3xl shadow-card overflow-hidden transition-all', !rule.isActive && 'opacity-60')}>
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0', sev.bg)}>
            <Icon size={18} className={sev.color} strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-gray-900 truncate">{rule.name}</p>
              <span className={cn('badge text-[9px]', sev.bg, sev.color)}>{trigger.label}</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{trigger.desc}</p>
          </div>
          <button onClick={() => onToggle(rule.id)}
            className={cn('relative w-11 h-6 rounded-full transition-all flex-shrink-0', rule.isActive ? 'bg-brand-500' : 'bg-gray-200')}>
            <div className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all', rule.isActive ? 'left-5' : 'left-0.5')} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {trigger.hasThreshold && rule.threshold > 0 && (
            <div className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-700">
              Threshold: <span className="text-brand-600">{formatCurrency(rule.threshold, 'NGN', true)}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-700">
            <ChanIcon size={11} className="text-gray-500" />
            {channel?.label ?? rule.channel}
          </div>
          {rule.triggeredCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Zap size={10} className="text-amber-500" />
              {rule.triggeredCount}× triggered
            </div>
          )}
          <button onClick={() => onDelete(rule.id)}
            className="ml-auto p-1.5 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
            <Trash2 size={13} className="text-red-500" />
          </button>
        </div>

        {rule.lastTriggered && (
          <p className="text-[10px] text-gray-400 mt-2">Last triggered {formatDate(rule.lastTriggered, 'relative')}</p>
        )}
      </div>
    </div>
  )
}

export default function AlertsManager() {
  const { rules, isLoading, fetchRules, createRule, toggleRule, deleteRule } = useAlertStore()
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [name, setName]             = useState('')
  const [trigger, setTrigger]       = useState('balance_below')
  const [threshold, setThreshold]   = useState('')
  const [channel, setChannel]       = useState('push')

  useEffect(() => { fetchRules() }, [])

  const safeRules  = rules ?? []
  const activeCount = safeRules.filter(r => r.isActive).length
  const selTrigger  = TRIGGERS.find(t => t.id === trigger) ?? TRIGGERS[0]

  const handleCreate = async () => {
    if (!name.trim()) { toast.error('Enter rule name'); return }
    setLoading(true)
    try {
      await createRule(name, trigger, Number(threshold) || 0, channel)
      toast.success('Alert rule created!')
      setShowCreate(false); setName(''); setTrigger('balance_below'); setThreshold(''); setChannel('push')
    } catch { toast.error('Failed to create rule') }
    finally { setLoading(false) }
  }

  const handleToggle = async (id: string) => {
    await toggleRule(id)
    const rule = safeRules.find(r => r.id === id)
    toast.success(rule?.isActive ? 'Alert paused' : 'Alert activated')
  }

  const handleDelete = async (id: string) => {
    await deleteRule(id)
    toast.success('Alert rule deleted')
  }

  const content = (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">Alerts Manager</h1><p className="page-subtitle">Custom financial triggers</p></div>
        <div className="flex gap-2">
          <button onClick={() => fetchRules()} className="btn-icon bg-gray-100">
            <RefreshCw size={16} className={cn('text-gray-600', isLoading && 'animate-spin')} />
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-bold px-4 py-2 rounded-2xl hover:bg-brand-700 shadow-float-green active:scale-95 transition-all">
            <Plus size={15} /> New
          </button>
        </div>
      </div>

      {/* Summary hero */}
      <div className="mx-4 mb-4 bg-dark-gradient rounded-3xl p-5 shadow-premium relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border-[20px] border-white/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1"><Bell size={14} className="text-white/60" /><span className="text-white/60 text-xs font-semibold">Alert Rules</span></div>
          <p className="font-display font-bold text-white text-3xl mb-3">{safeRules.length} rules</p>
          <div className="grid grid-cols-3 gap-2">
            {[{ l:'Active', v:activeCount }, { l:'Paused', v:safeRules.length-activeCount }, { l:'Triggered', v:safeRules.reduce((s,r)=>s+r.triggeredCount,0) }].map(({ l, v }) => (
              <div key={l} className="bg-white/10 rounded-2xl p-2.5 text-center">
                <p className="text-white/50 text-[9px]">{l}</p>
                <p className="text-white font-display font-bold text-lg">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mx-4 mb-4 bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
        <Bell size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800">Get notified exactly when you want. Set thresholds, choose channels, and stay on top of your money 24/7.</p>
      </div>

      {/* Rules list */}
      <div className="px-4 space-y-3">
        {safeRules.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl shadow-card">
            <BellOff size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="font-bold text-gray-500">No alert rules yet</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">Create rules to get notified about account activity</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary px-6 py-2.5 text-sm">Create First Alert</button>
          </div>
        ) : safeRules.map(rule => (
          <RuleCard key={rule.id} rule={rule} onToggle={handleToggle} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  )

  return (
    <>
      <AppHeader title="Alerts" showBack />
      <DeviceFrame>{content}</DeviceFrame>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Alert Rule">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Rule Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Low balance warning" className="input-field" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Trigger</label>
            <div className="space-y-2">
              {TRIGGERS.map(t => {
                const Icon = t.icon
                return (
                  <button key={t.id} onClick={() => setTrigger(t.id)}
                    className={cn('w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left',
                      trigger === t.id ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-gray-300')}>
                    <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', t.bg)}>
                      <Icon size={14} className={t.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{t.label}</p>
                      <p className="text-xs text-gray-400">{t.desc}</p>
                    </div>
                    {trigger === t.id && <div className="w-4 h-4 rounded-full bg-brand-500 flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>

          {selTrigger.hasThreshold && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Threshold Amount (₦)</label>
              <input value={threshold} onChange={e => setThreshold(e.target.value)} type="number"
                placeholder={trigger === 'balance_below' ? 'e.g. 5,000' : 'e.g. 50,000'} className="input-field text-xl font-bold" />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Notification Channel</label>
            <div className="grid grid-cols-3 gap-2">
              {CHANNELS.map(ch => {
                const Icon = ch.icon
                return (
                  <button key={ch.id} onClick={() => setChannel(ch.id)}
                    className={cn('flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-all',
                      channel === ch.id ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300')}>
                    <Icon size={18} className={channel === ch.id ? 'text-brand-600' : 'text-gray-400'} />
                    <p className="text-xs font-bold text-gray-700">{ch.label}</p>
                    <p className="text-[9px] text-gray-400">{ch.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>

          <button onClick={handleCreate} disabled={loading || !name.trim()} className="btn-primary w-full py-4">
            {loading ? 'Creating…' : 'Create Alert Rule'}
          </button>
        </div>
      </Modal>
    </>
  )
}
