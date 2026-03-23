import { useState } from 'react'
import { PiggyBank, Plus, Target, TrendingUp, Lock, Users, ChevronRight, Trophy, Flame, Calendar } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import Modal from '@/components/modals/Modal'
import ProgressRing from '@/components/ui/ProgressRing'
import { useSavingsStore } from '@/store/useSavingsStore'
import { useWalletStore } from '@/store/useWalletStore'
import { savingsSchema, type SavingsInput } from '@/lib/validators'
import { formatCurrency, percentage, cn, sleep, formatDate, addDays } from '@/lib/utils'
import type { SavingsPlan } from '@/types'
import toast from 'react-hot-toast'

const SAVINGS_TYPES = [
  { id:'flex'  as const, icon:TrendingUp, label:'Flex Save',    desc:'Save & withdraw anytime',    rate:6,  color:'bg-blue-50',   textColor:'text-blue-600',   gradient:'from-blue-500 to-blue-700'   },
  { id:'target'as const, icon:Target,     label:'Target Save',  desc:'Goal-based saving with bonus',rate:10, color:'bg-purple-50', textColor:'text-purple-600', gradient:'from-purple-500 to-purple-700'},
  { id:'fixed' as const, icon:Lock,       label:'Fixed Deposit', desc:'Lock for maximum returns',   rate:15, color:'bg-amber-50',  textColor:'text-amber-600',  gradient:'from-amber-500 to-amber-700' },
  { id:'group' as const, icon:Users,      label:'Group Save',    desc:'Save together with friends', rate:8,  color:'bg-teal-50',   textColor:'text-teal-600',   gradient:'from-teal-500 to-teal-700'   },
]

const EMOJIS = ['🎯','🏠','✈️','💍','🚗','📱','🏋️','💼','🎓','💰','🏖️','🎮']

const GROWTH_CHART = [
  {month:'Now',  value:0   },{month:'1mo', value:600  },{month:'3mo', value:1850 },
  {month:'6mo',  value:3850},{month:'9mo', value:5970 },{month:'12mo',value:8225 },
]

function PlanCard({ plan, onTopUp }: { plan:SavingsPlan; onTopUp:(id:string)=>void }) {
  const pct      = percentage(plan.currentAmount, plan.targetAmount)
  const typeInfo = SAVINGS_TYPES.find(t=>t.id===plan.type)
  const Icon     = typeInfo?.icon ?? PiggyBank
  const daysLeft = plan.endDate ? Math.max(0,Math.ceil((new Date(plan.endDate).getTime()-Date.now())/86400000)) : null
  const dailyNeed = daysLeft && daysLeft>0 ? (plan.targetAmount-plan.currentAmount)/daysLeft : null

  return (
    <div className="bg-white rounded-3xl shadow-card overflow-hidden hover:shadow-card-hover transition-all">
      <div className={cn('h-1.5 w-full bg-gradient-to-r', `${typeInfo?.gradient}`)}/>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0', typeInfo?.color)}>
              {plan.emoji || <Icon size={22} className={typeInfo?.textColor} strokeWidth={1.8}/>}
            </div>
            <div>
              <p className="font-bold text-gray-900">{plan.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={cn('text-xs font-bold', typeInfo?.textColor)}>{plan.interestRate}% p.a.</span>
                <span className="text-gray-300">·</span>
                <span className={cn('badge text-[9px]', plan.status==='active'?'badge-green':'badge-gold')}>{plan.status}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <ProgressRing value={pct} size={48} stroke={5} color={pct>=100?'#16a34a':'#6366f1'}>
              <span className="text-[9px] font-bold text-gray-700">{pct}%</span>
            </ProgressRing>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-gray-50 rounded-xl p-2.5">
            <p className="text-[9px] font-bold text-gray-400">Saved</p>
            <p className="text-sm font-display font-bold text-brand-700">{formatCurrency(plan.currentAmount,'NGN',true)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-2.5">
            <p className="text-[9px] font-bold text-gray-400">Target</p>
            <p className="text-sm font-display font-bold text-gray-900">{formatCurrency(plan.targetAmount,'NGN',true)}</p>
          </div>
          {plan.interestEarned>0 && (
            <div className="bg-brand-50 rounded-xl p-2.5">
              <p className="text-[9px] font-bold text-gray-400">Interest Earned</p>
              <p className="text-sm font-bold text-brand-600">+{formatCurrency(plan.interestEarned,'NGN',true)}</p>
            </div>
          )}
          {daysLeft!==null && (
            <div className="bg-gray-50 rounded-xl p-2.5">
              <p className="text-[9px] font-bold text-gray-400">Days Left</p>
              <p className="text-sm font-bold text-gray-900">{daysLeft}d</p>
            </div>
          )}
        </div>

        {dailyNeed && dailyNeed>0 && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2 mb-3">
            <Flame size={12}/>
            <span className="font-bold">Save {formatCurrency(dailyNeed,'NGN',true)}/day to reach goal</span>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={()=>onTopUp(plan.id)} className="flex-1 flex items-center justify-center gap-1.5 bg-brand-600 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-brand-700 transition-colors active:scale-95">
            <Plus size={13}/> Top Up
          </button>
          {plan.type==='flex' && (
            <button onClick={()=>toast.success('Withdrawal initiated!')} className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-bold py-2.5 rounded-xl hover:bg-gray-200 transition-colors active:scale-95">
              Withdraw
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Savings() {
  const { plans, addPlan, topUp } = useSavingsStore()
  const { balance, setBalance }   = useWalletStore()
  const [showCreate, setShowCreate] = useState(false)
  const [topUpModal, setTopUpModal] = useState<string|null>(null)
  const [topUpAmt,   setTopUpAmt]   = useState('')
  const [loading,    setLoading]    = useState(false)
  const [emoji,      setEmoji]      = useState('🎯')

  const { register, handleSubmit, reset, watch, formState:{errors} } = useForm<SavingsInput>({
    resolver: zodResolver(savingsSchema),
    defaultValues: { autoSave:false, type:'flex' },
  })

  const onCreate = async (data:SavingsInput) => {
    setLoading(true); await sleep(800)
    const rates: Record<string,number> = { flex:6, target:10, fixed:15, group:8 }
    const p: SavingsPlan = {
      id:crypto.randomUUID(), userId:'', name:data.name, emoji,
      type:data.type, targetAmount:data.targetAmount, currentAmount:0,
      interestRate:rates[data.type]??6, interestEarned:0,
      startDate:new Date().toISOString(), endDate:data.endDate,
      status:'active', autoSave:data.autoSave, frequency:data.frequency,
      color:'#16a34a', createdAt:new Date().toISOString(),
    }
    addPlan(p); toast.success(`"${p.name}" savings plan created! 🎉`)
    reset(); setShowCreate(false); setLoading(false)
  }

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmt)
    if (!amount||amount<=0) { toast.error('Enter valid amount'); return }
    if (amount>balance) { toast.error('Insufficient balance'); return }
    topUp(topUpModal!, amount); setBalance(balance-amount)
    toast.success(`Topped up ${formatCurrency(amount)}!`)
    setTopUpModal(null); setTopUpAmt('')
  }

  const safePlans    = plans ?? []
  const totalSaved   = safePlans.reduce((s,p)=>s+p.currentAmount,0)
  const totalTarget  = safePlans.reduce((s,p)=>s+p.targetAmount,0)
  const totalInterest = safePlans.reduce((s,p)=>s+p.interestEarned,0)
  const overallPct   = percentage(totalSaved, totalTarget)

  const content = (
    <div className="page-container">
      <div className="flex items-center justify-between page-header">
        <div><h1 className="page-title">OWealth Savings</h1><p className="page-subtitle">Earn up to 15% p.a.</p></div>
        <button onClick={()=>setShowCreate(true)} className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-bold px-4 py-2 rounded-2xl hover:bg-brand-700 shadow-float-green active:scale-95 transition-all">
          <Plus size={15}/> New Plan
        </button>
      </div>

      {/* Overview */}
      <div className="mx-4 mb-4 bg-savings-gradient rounded-4xl p-5 relative overflow-hidden shadow-float">
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full border-[24px] border-white/10"/>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1"><PiggyBank size={16} className="text-cyan-200"/><span className="text-cyan-100 text-xs font-semibold">Total Savings</span></div>
          <p className="font-display font-bold text-white text-3xl mb-1">{formatCurrency(totalSaved)}</p>
          {totalInterest>0 && <p className="text-cyan-200 text-xs mb-3">+{formatCurrency(totalInterest,'NGN',true)} interest earned</p>}
          {totalTarget>0 && (
            <>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-1.5">
                <div className="h-full bg-white rounded-full transition-all" style={{width:`${overallPct}%`}}/>
              </div>
              <div className="flex justify-between text-xs text-cyan-200">
                <span>{overallPct}% of total goals</span>
                <span>Target: {formatCurrency(totalTarget,'NGN',true)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Savings types */}
      <div className="px-4 mb-5">
        <p className="section-label">Savings Products</p>
        <div className="grid grid-cols-2 gap-3">
          {SAVINGS_TYPES.map(({id,icon:Icon,label,desc,rate,color,textColor,gradient})=>(
            <button key={id} onClick={()=>{setShowCreate(true)}}
              className="bg-white rounded-3xl shadow-card p-4 text-left hover:shadow-card-hover transition-all active:scale-95">
              <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center mb-3 bg-gradient-to-br', gradient)}>
                <Icon size={20} className="text-white" strokeWidth={1.8}/>
              </div>
              <p className="font-bold text-sm text-gray-900">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5 mb-2">{desc}</p>
              <span className={cn('font-display font-bold text-sm', textColor)}>{rate}% p.a.</span>
            </button>
          ))}
        </div>
      </div>

      {/* Plans */}
      <div className="px-4">
        <p className="section-label">My Plans ({plans.length})</p>
        {plans.length===0 ? (
          <div className="text-center py-12 bg-white rounded-3xl shadow-card">
            <Trophy size={40} className="mx-auto mb-3 text-gray-200"/>
            <p className="font-bold text-gray-500">No savings plans yet</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">Start saving from ₦100 today</p>
            <button onClick={()=>setShowCreate(true)} className="btn-primary px-6 py-2.5 text-sm">Create Plan</button>
          </div>
        ) : (
          <div className="space-y-3">
            {plans.map(p=><PlanCard key={p.id} plan={p} onTopUp={id=>setTopUpModal(id)}/>)}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      <AppHeader title="Savings"/>
      <DeviceFrame>{content}</DeviceFrame>

      <Modal isOpen={showCreate} onClose={()=>{setShowCreate(false);reset()}} title="New Savings Plan">
        <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
          {/* Emoji picker */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Choose Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map(e=>(
                <button key={e} type="button" onClick={()=>setEmoji(e)}
                  className={cn('w-10 h-10 rounded-xl text-xl flex items-center justify-center border-2 transition-all',
                    emoji===e?'border-brand-500 bg-brand-50':'border-gray-200 hover:border-gray-300')}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Plan Name</label>
            <input {...register('name')} placeholder="e.g. Emergency Fund" className="input-field"/>
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Plan Type</label>
            <div className="grid grid-cols-2 gap-2">
              {SAVINGS_TYPES.map(t=>(
                <label key={t.id} className={cn('flex items-center gap-2 p-3 rounded-2xl border-2 cursor-pointer transition-all',
                  watch('type')===t.id?'border-brand-500 bg-brand-50':'border-gray-100 hover:border-gray-200')}>
                  <input type="radio" {...register('type')} value={t.id} className="sr-only"/>
                  <t.icon size={16} className={t.textColor} strokeWidth={1.8}/>
                  <div><p className="text-xs font-bold text-gray-900">{t.label}</p><p className="text-[10px] text-brand-600 font-bold">{t.rate}% p.a.</p></div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Target Amount (₦)</label>
            <input {...register('targetAmount')} type="number" placeholder="0.00" className="input-field text-lg font-bold"/>
            {errors.targetAmount && <p className="text-red-500 text-xs mt-1">{errors.targetAmount.message}</p>}
          </div>

          {watch('type')!=='flex' && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Target Date</label>
              <input {...register('endDate')} type="date" className="input-field" min={addDays(new Date(),7).toISOString().split('T')[0]}/>
            </div>
          )}

          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <input type="checkbox" {...register('autoSave')} id="autoSave" className="w-4 h-4 accent-brand-600"/>
            <label htmlFor="autoSave" className="text-sm font-semibold text-gray-700">Enable Auto-Save</label>
          </div>

          {watch('autoSave') && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Frequency</label>
              <select {...register('frequency')} className="input-field bg-white">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
            {loading?'Creating…':'Create Plan'}
          </button>
        </form>
      </Modal>

      <Modal isOpen={!!topUpModal} onClose={()=>setTopUpModal(null)} title="Top Up Savings">
        <div className="space-y-4">
          <div className="bg-brand-50 rounded-2xl px-4 py-3 flex justify-between">
            <span className="text-sm text-gray-600">Available Balance</span>
            <span className="font-display font-bold text-brand-700">{formatCurrency(balance)}</span>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Amount (₦)</label>
            <input value={topUpAmt} onChange={e=>setTopUpAmt(e.target.value)} type="number" placeholder="0.00" className="input-field text-xl font-bold"/>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[1000,5000,10000,50000].map(a=>(
              <button key={a} onClick={()=>setTopUpAmt(String(a))}
                className={cn('py-2.5 text-xs font-bold rounded-xl border-2 transition-all', parseFloat(topUpAmt)===a?'border-brand-500 bg-brand-50 text-brand-700':'border-gray-200 text-gray-600 hover:border-gray-300')}>
                {formatCurrency(a,'NGN',true)}
              </button>
            ))}
          </div>
          <button onClick={handleTopUp} className="btn-primary w-full py-3.5">Confirm Top Up</button>
        </div>
      </Modal>
    </>
  )
}
