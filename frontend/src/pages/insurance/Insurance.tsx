import { useState } from 'react'
import { Shield, Heart, Car, Smartphone, Plane, Home, CheckCircle2, Plus, ChevronRight, Calendar, AlertTriangle } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import Modal from '@/components/modals/Modal'
import { useInsuranceStore } from '@/store/useInsuranceStore'
import { useWalletStore } from '@/store/useWalletStore'
import { formatCurrency, formatDate, cn, sleep, isExpiringSoon, addMonths } from '@/lib/utils'
import type { InsurancePolicy, InsuranceType } from '@/types'
import toast from 'react-hot-toast'

const PLANS: {
  type: InsuranceType; icon: React.ElementType; name: string; desc: string
  color: string; gradient: string; plans: { name: string; premium: number; coverage: number; benefits: string[] }[]
}[] = [
  {
    type:'health', icon:Heart, name:'Health Insurance', desc:'Medical cover for you & family',
    color:'text-red-600', gradient:'from-red-500 to-rose-600',
    plans:[
      { name:'Basic',    premium:2500,  coverage:1000000,  benefits:['Outpatient care','Consultations','Emergency'] },
      { name:'Standard', premium:5500,  coverage:5000000,  benefits:['All Basic','Specialist','Dental','Optical'] },
      { name:'Premium',  premium:12000, coverage:15000000, benefits:['All Standard','International cover','Critical illness'] },
    ],
  },
  {
    type:'life', icon:Shield, name:'Life Insurance', desc:'Protect your loved ones',
    color:'text-blue-600', gradient:'from-blue-500 to-indigo-600',
    plans:[
      { name:'Term',  premium:1500, coverage:10000000, benefits:['Death benefit','Terminal illness','Natural death'] },
      { name:'Whole', premium:8000, coverage:50000000, benefits:['All Term','Cash value','Loans against policy'] },
    ],
  },
  {
    type:'auto', icon:Car, name:'Auto Insurance', desc:'Comprehensive vehicle cover',
    color:'text-brand-600', gradient:'from-brand-500 to-brand-700',
    plans:[
      { name:'Third Party', premium:3500,  coverage:2000000, benefits:['Third party damage','Bodily injury','Legal liability'] },
      { name:'Comprehensive',premium:12000, coverage:20000000,benefits:['All Third Party','Own damage','Theft','Fire'] },
    ],
  },
  {
    type:'device', icon:Smartphone, name:'Device Protection', desc:'Phone & gadget insurance',
    color:'text-purple-600', gradient:'from-purple-500 to-violet-600',
    plans:[
      { name:'Basic',   premium:1200, coverage:150000, benefits:['Accidental damage','Screen cracks','Theft'] },
      { name:'Premium', premium:2500, coverage:500000, benefits:['All Basic','Water damage','Worldwide cover'] },
    ],
  },
  {
    type:'travel', icon:Plane, name:'Travel Insurance', desc:'Safe journeys worldwide',
    color:'text-teal-600', gradient:'from-teal-500 to-cyan-600',
    plans:[
      { name:'Single Trip', premium:5000,  coverage:30000000, benefits:['Medical emergency','Trip cancellation','Lost baggage','Delays'] },
      { name:'Annual',      premium:25000, coverage:100000000,benefits:['All Single Trip','Unlimited trips','Sports cover'] },
    ],
  },
  {
    type:'home', icon:Home, name:'Home Insurance', desc:'Protect your property',
    color:'text-amber-600', gradient:'from-amber-500 to-orange-600',
    plans:[
      { name:'Contents', premium:2000, coverage:5000000,  benefits:['Theft','Fire','Water damage','Electronics'] },
      { name:'Buildings',premium:5000, coverage:25000000, benefits:['All Contents','Structural damage','Natural disaster'] },
    ],
  },
]

const STATUS_META: Record<string,{label:string;color:string;bg:string}> = {
  active:    { label:'Active',    color:'text-brand-700', bg:'bg-brand-50' },
  expired:   { label:'Expired',   color:'text-gray-600',  bg:'bg-gray-100' },
  cancelled: { label:'Cancelled', color:'text-red-700',   bg:'bg-red-50'   },
  pending:   { label:'Pending',   color:'text-amber-700', bg:'bg-amber-50' },
}

function PolicyCard({ policy, onCancel }: { policy: InsurancePolicy; onCancel: () => void }) {
  const plan   = PLANS.find(p => p.type === policy.type)!
  const Icon   = plan.icon
  const expiring = policy.status==='active' && isExpiringSoon(policy.endDate, 30)
  const meta   = STATUS_META[policy.status]
  return (
    <div className={cn('bg-white rounded-3xl shadow-card overflow-hidden', expiring && 'ring-2 ring-amber-300')}>
      <div className={cn('h-1.5 w-full bg-gradient-to-r', plan.gradient)}/>
      <div className="p-4">
        {expiring && (
          <div className="flex items-center gap-2 bg-amber-50 rounded-xl px-3 py-2 mb-3">
            <AlertTriangle size={14} className="text-amber-600 flex-shrink-0"/>
            <p className="text-xs font-bold text-amber-700">Expires in {Math.ceil((new Date(policy.endDate).getTime()-Date.now())/86400000)} days — renew now</p>
          </div>
        )}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center', `bg-gradient-to-br ${plan.gradient}`)}>
              <Icon size={20} className="text-white" strokeWidth={1.8}/>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">{policy.name}</p>
              <p className="text-xs text-gray-400">{policy.provider} · #{policy.policyNumber}</p>
            </div>
          </div>
          <span className={cn('badge text-[10px]', meta.bg, meta.color)}>{meta.label}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label:'Premium',  value:formatCurrency(policy.premium,'NGN',true)+'/mo' },
            { label:'Coverage', value:formatCurrency(policy.coverage,'NGN',true)      },
            { label:'Expires',  value:formatDate(policy.endDate,'short')              },
          ].map(({label,value})=>(
            <div key={label} className="bg-gray-50 rounded-xl p-2 text-center">
              <p className="text-[9px] font-bold text-gray-400 mb-0.5">{label}</p>
              <p className="text-xs font-bold text-gray-900">{value}</p>
            </div>
          ))}
        </div>
        <div className="mb-3">
          <p className="text-[10px] font-bold text-gray-400 mb-1.5">Benefits</p>
          <div className="flex flex-wrap gap-1.5">
            {policy.benefits.slice(0,3).map(b=>(
              <span key={b} className="badge-green text-[10px] badge">{b}</span>
            ))}
            {policy.benefits.length>3 && <span className="badge badge-gray text-[10px]">+{policy.benefits.length-3} more</span>}
          </div>
        </div>
        {policy.status==='active' && (
          <div className="flex gap-2">
            <button onClick={()=>toast.success('Renewal coming soon!')} className="flex-1 py-2 text-xs font-bold bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors">Renew</button>
            <button onClick={onCancel} className="flex-1 py-2 text-xs font-bold bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors">Cancel</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Insurance() {
  const { policies, addPolicy, cancelPolicy, activeCount } = useInsuranceStore()
  const { balance, setBalance } = useWalletStore()
  const [showBrowse,  setShowBrowse]  = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[0]|null>(null)
  const [selectedSub,  setSelectedSub]  = useState<typeof PLANS[0]['plans'][0]|null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<InsurancePolicy|null>(null)

  const onBuyInsurance = async () => {
    if (!selectedPlan || !selectedSub) return
    if (selectedSub.premium > balance) { toast.error('Insufficient balance'); return }
    setLoading(true)
    await sleep(1500)
    const policy: InsurancePolicy = {
      id: crypto.randomUUID(), userId:'',
      type: selectedPlan.type, name: `${selectedPlan.name} — ${selectedSub.name}`,
      provider:'AXA Mansard', premium:selectedSub.premium, frequency:'monthly',
      coverage:selectedSub.coverage, startDate:new Date().toISOString(),
      endDate:addMonths(new Date(),12).toISOString(), status:'active',
      policyNumber:`OPY-${Math.random().toString(36).substring(2,8).toUpperCase()}`,
      benefits:selectedSub.benefits, createdAt:new Date().toISOString(),
    }
    addPolicy(policy)
    setBalance(balance - selectedSub.premium)
    setSuccess(policy); setShowBrowse(false); setSelectedPlan(null); setSelectedSub(null); setLoading(false)
    toast.success(`${selectedPlan.name} activated!`)
  }

  const content = (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">Insurance</h1><p className="page-subtitle">Protect what matters most</p></div>
        <button onClick={()=>setShowBrowse(true)} className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-bold px-4 py-2 rounded-2xl hover:bg-brand-700 shadow-float-green active:scale-95 transition-all">
          <Plus size={15}/> Get Cover
        </button>
      </div>

      {/* Summary */}
      <div className="mx-4 mb-4 bg-insurance-gradient rounded-3xl p-5 relative overflow-hidden shadow-float">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border-[20px] border-white/10"/>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1"><Shield size={16} className="text-teal-200"/><span className="text-teal-100 text-xs font-semibold">Total Coverage</span></div>
          <p className="font-display font-bold text-white text-3xl mb-3">
            {formatCurrency((policies ?? []).filter(p=>p.status==='active').reduce((s,p)=>s+p.coverage,0),'NGN',true)}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/15 rounded-2xl p-3"><p className="text-white/60 text-[10px] font-semibold">Active Plans</p><p className="text-white font-display font-bold text-lg">{activeCount()}</p></div>
            <div className="bg-white/15 rounded-2xl p-3"><p className="text-white/60 text-[10px] font-semibold">Monthly Premium</p><p className="text-white font-display font-bold text-lg">{formatCurrency((policies ?? []).filter(p=>p.status==='active').reduce((s,p)=>s+p.premium,0),'NGN',true)}</p></div>
          </div>
        </div>
      </div>

      {/* Active policies */}
      <div className="px-4 mb-5">
        <p className="section-label">My Policies ({policies.length})</p>
        {policies.length===0 ? (
          <div className="text-center py-12 bg-white rounded-3xl shadow-card">
            <Shield size={40} className="mx-auto mb-3 text-gray-200"/>
            <p className="font-bold text-gray-500">No insurance yet</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">Protect yourself from the unexpected</p>
            <button onClick={()=>setShowBrowse(true)} className="btn-primary px-6 py-2.5 text-sm">Browse Plans</button>
          </div>
        ) : (
          <div className="space-y-3">
            {policies.map(p=><PolicyCard key={p.id} policy={p} onCancel={()=>{cancelPolicy(p.id);toast.success('Policy cancelled')}}/>)}
          </div>
        )}
      </div>

      {/* Browse categories */}
      <div className="px-4">
        <p className="section-label">All Insurance Types</p>
        <div className="grid grid-cols-2 gap-3">
          {PLANS.map(plan=>{
            const Icon=plan.icon
            const active=policies.filter(p=>p.type===plan.type&&p.status==='active').length
            return (
              <button key={plan.type} onClick={()=>{setSelectedPlan(plan);setShowBrowse(true)}}
                className="bg-white rounded-3xl shadow-card p-4 text-left hover:shadow-card-hover transition-all active:scale-95">
                <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mb-3 bg-gradient-to-br',plan.gradient)}>
                  <Icon size={22} className="text-white" strokeWidth={1.6}/>
                </div>
                <p className="font-bold text-sm text-gray-900">{plan.name}</p>
                <p className="text-xs text-gray-400 mt-0.5 mb-2">{plan.desc}</p>
                {active>0 && <span className="badge badge-green text-[10px]">{active} active</span>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <AppHeader title="Insurance"/>
      <DeviceFrame>{content}</DeviceFrame>

      {/* Browse modal */}
      <Modal isOpen={showBrowse} onClose={()=>{setShowBrowse(false);setSelectedPlan(null);setSelectedSub(null)}} title={selectedPlan?selectedPlan.name:'Choose Insurance'}>
        {!selectedPlan ? (
          <div className="grid grid-cols-2 gap-3">
            {PLANS.map(plan=>{
              const Icon=plan.icon
              return (
                <button key={plan.type} onClick={()=>setSelectedPlan(plan)}
                  className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-2xl hover:bg-brand-50 transition-all active:scale-95">
                  <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br',plan.gradient)}><Icon size={20} className="text-white"/></div>
                  <p className="text-xs font-bold text-gray-900 text-center">{plan.name}</p>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {selectedPlan.plans.map(sub=>(
              <label key={sub.name} className={cn('flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all',
                selectedSub?.name===sub.name?'border-brand-500 bg-brand-50':'border-gray-100 hover:border-gray-200')}>
                <input type="radio" name="plan" value={sub.name} className="sr-only" onChange={()=>setSelectedSub(sub)}/>
                <div className={cn('w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all',selectedSub?.name===sub.name?'border-brand-600 bg-brand-600':'border-gray-300')}>
                  {selectedSub?.name===sub.name&&<div className="w-2 h-2 rounded-full bg-white"/>}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-bold text-sm text-gray-900">{sub.name}</p>
                    <p className="font-display font-bold text-brand-600 text-sm">{formatCurrency(sub.premium,'NGN',true)}/mo</p>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">Coverage: {formatCurrency(sub.coverage,'NGN',true)}</p>
                  <div className="flex flex-wrap gap-1">
                    {sub.benefits.slice(0,3).map(b=><span key={b} className="badge badge-green text-[9px]">{b}</span>)}
                  </div>
                </div>
              </label>
            ))}
            <button onClick={onBuyInsurance} disabled={!selectedSub||loading} className="btn-primary w-full py-3.5 mt-2">
              {loading?'Activating…':`Activate — ${selectedSub?formatCurrency(selectedSub.premium,'NGN',true):''}/mo`}
            </button>
          </div>
        )}
      </Modal>

      {/* Success modal */}
      <Modal isOpen={!!success} onClose={()=>setSuccess(null)}>
        {success && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center mb-4 animate-bounce-in">
              <CheckCircle2 size={40} className="text-teal-600"/>
            </div>
            <h2 className="font-display font-bold text-xl mb-1">Policy Activated! 🛡️</h2>
            <p className="text-gray-500 text-sm mb-5">You are now covered</p>
            <div className="w-full bg-gray-50 rounded-2xl p-4 space-y-2 text-sm mb-5">
              {[['Plan',success.name],['Policy #',success.policyNumber],['Coverage',formatCurrency(success.coverage,'NGN',true)],['Premium',formatCurrency(success.premium,'NGN',true)+'/month']].map(([k,v])=>(
                <div key={k} className="flex justify-between"><span className="text-gray-500">{k}</span><span className="font-bold truncate ml-2">{v}</span></div>
              ))}
            </div>
            <button onClick={()=>setSuccess(null)} className="btn-primary w-full py-3.5">Done</button>
          </div>
        )}
      </Modal>
    </>
  )
}
