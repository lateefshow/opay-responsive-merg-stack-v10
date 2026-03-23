import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Headphones,
  QrCode,
  ArrowLeftRight,
  Landmark,
  ArrowUpFromLine,
  Smartphone,
  Database,
  Gamepad2,
  Tv2,
  PiggyBank,
  Users,
  MoreHorizontal,
  ChevronRight,
  Pencil,
  Zap,
  TrendingUp,
  Eye,
  EyeOff,
  Plus,
  RefreshCw,
  ShieldCheck,
  Banknote,
  Send,
  ArrowLeftRight as Exchange,
  Shield,
  Activity,
  Calendar,
  DollarSign,
  Gift,
  Globe,
} from "lucide-react";
import { useAuthStore }       from '@/store/useAuthStore'
import { useWalletStore }     from '@/store/useWalletStore'
import { useInvestmentStore } from '@/store/useInvestmentStore'
import { useSavingsStore }    from '@/store/useSavingsStore'
import { useLoanStore }       from '@/store/useLoanStore'
import { useInsuranceStore }  from '@/store/useInsuranceStore'
import { useSchedulerStore }  from '@/store/useSchedulerStore'
import { useCashbackStore }   from '@/store/useCashbackStore'
import { getGreeting, getInitials, formatCurrency, cn } from '@/lib/utils'
import TransactionItem  from '@/components/common/TransactionItem'
import { TransactionSkeleton } from '@/components/common/Skeleton'
import AddMoneyModal    from '@/components/modals/AddMoneyModal'
import TransferModal    from '@/components/modals/TransferModal'
import WithdrawModal    from '@/components/modals/WithdrawModal'
import AppHeader        from '@/components/layout/AppHeader'
import DeviceFrame      from '@/components/layout/DeviceFrame'
import MarketTicker     from '@/components/ui/MarketTicker'
import NetWorthCard     from '@/components/ui/NetWorthCard'
import QuickSendBar     from '@/components/ui/QuickSendBar'
import { useDeviceViewStore } from '@/store/useDeviceViewStore'
import type { Contact } from '@/types'

const quickAccess = [
  { icon:Smartphone,    label:'Airtime',    to:'/bills?cat=airtime',  bg:'bg-blue-50',   color:'text-blue-600'   },
  { icon:Database,      label:'Data',       to:'/bills?cat=data',     bg:'bg-purple-50', color:'text-purple-600' },
  { icon:Zap,           label:'Bills',      to:'/bills',              bg:'bg-yellow-50', color:'text-yellow-600' },
  { icon:Tv2,           label:'TV',         to:'/bills?cat=tv',       bg:'bg-red-50',    color:'text-red-600'    },
  { icon:PiggyBank,     label:'Save',       to:'/savings',            bg:'bg-brand-50',  color:'text-brand-600'  },
  { icon:TrendingUp,    label:'Invest',     to:'/investments',        bg:'bg-teal-50',   color:'text-teal-600'   },
  { icon:Banknote,      label:'Loans',      to:'/loans',              bg:'bg-orange-50', color:'text-orange-600' },
  { icon:Exchange,      label:'Exchange',   to:'/exchange',           bg:'bg-amber-50',  color:'text-amber-600'  },
  { icon:Shield,        label:'Insurance',  to:'/insurance',          bg:'bg-indigo-50', color:'text-indigo-600' },
  { icon:Activity,      label:'Analytics',  to:'/analytics',          bg:'bg-pink-50',   color:'text-pink-600'   },
  { icon:Calendar,      label:'Scheduler',  to:'/scheduler',          bg:'bg-cyan-50',   color:'text-cyan-600'   },
  { icon:Users,         label:'Refer',      to:'/rewards',            bg:'bg-lime-50',   color:'text-lime-600'   },
  { icon:Globe,         label:'Remit',       to:'/remittance',          bg:'bg-teal-50',   color:'text-teal-600'   },
  { icon:Gift,          label:'Gift Cards',  to:'/gift-cards',          bg:'bg-rose-50',   color:'text-rose-600'   },
]

export default function Home() {
  const { user }  = useAuthStore()
  const { balance, transactions, isLoading, fetchBalance, fetchTransactions } = useWalletStore()
  const { totalValue }  = useInvestmentStore()
  const { plans }       = useSavingsStore()
  const { activeLoan }  = useLoanStore()
  const { activeCount } = useInsuranceStore()
  const { payments }    = useSchedulerStore()
  const { totalEarned } = useCashbackStore()
  const { view }        = useDeviceViewStore()
  const navigate        = useNavigate()

  const [showBalance,  setShowBalance]  = useState(true)
  const [showAddMoney, setShowAddMoney] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)

  useEffect(() => { fetchBalance(); fetchTransactions(1, true) }, [])

  const safePlans    = plans ?? []
  const safePayments = payments ?? []
  const safeTxs      = transactions ?? []
  const totalSavings = safePlans.reduce((s,p) => s+p.currentAmount, 0)
  const netWorth     = { wallet:balance, savings:totalSavings, investments:totalValue(), total:balance+totalSavings+totalValue() }
  const loan         = activeLoan()
  const upcomingCount = safePayments.filter(p=>p.active).length

  const gridCols = view==='mobile'?'grid-cols-4':view==='tablet'?'grid-cols-6':'grid-cols-12'

  const content = (
    <div className="page-container">
      <MarketTicker/>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="relative cursor-pointer" onClick={()=>navigate('/profile')}>
            <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center ring-2 ring-brand-200">
              <span className="text-brand-700 font-bold">{user?getInitials(user.firstName,user.lastName):'U'}</span>
            </div>
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-brand-500 rounded-full border-2 border-white"/>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold">{getGreeting()}</p>
            <p className="font-display font-bold text-gray-900 text-base">Hi, {user?.firstName??'there'} 👋</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-icon bg-gray-100 hover:bg-gray-200"><Headphones size={17} className="text-gray-600"/></button>
          <Link to="/scan" className="btn-icon bg-gray-100 hover:bg-gray-200"><QrCode size={17} className="text-gray-600"/></Link>
        </div>
      </div>

      {/* Balance card */}
      <div className="mx-4 rounded-4xl overflow-hidden bg-brand-gradient p-5 shadow-float-green relative">
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full border-[24px] border-white/10 pointer-events-none"/>
        <div className="absolute -right-2 top-14 w-32 h-32 rounded-full border-[16px] border-white/10 pointer-events-none"/>
        <div className="absolute right-16 -bottom-8 w-24 h-24 rounded-full border-[12px] border-white/10 pointer-events-none"/>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-brand-200"/>
              <span className="text-brand-100 text-xs font-semibold">Wallet Balance</span>
              {user?.tier==='elite' && <span className="badge bg-amber-400/30 text-amber-200 text-[9px]">Elite</span>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={()=>fetchBalance()} className="text-brand-200 hover:text-white transition-colors"><RefreshCw size={14}/></button>
              <button onClick={()=>setShowBalance(v=>!v)} className="text-brand-200 hover:text-white transition-colors">
                {showBalance?<Eye size={15}/>:<EyeOff size={15}/>}
              </button>
            </div>
          </div>
          <p className="font-display font-bold text-white leading-none mb-1" style={{fontSize:'clamp(1.6rem,5vw,2.2rem)'}}>
            {showBalance?formatCurrency(balance):'₦ ••••••••'}
          </p>
          {netWorth.total>0 && (
            <p className="text-brand-200 text-xs mb-4 cursor-pointer hover:text-white transition-colors" onClick={()=>navigate('/analytics')}>
              Net worth: {showBalance?formatCurrency(netWorth.total,'NGN',true):'••••'} · tap for insights
            </p>
          )}
          <div className="flex items-center justify-between">
            <button onClick={()=>setShowAddMoney(true)} className="flex items-center gap-1.5 bg-white text-brand-700 text-sm font-bold px-4 py-2 rounded-2xl hover:bg-brand-50 transition-all active:scale-95 shadow-float-green">
              <Plus size={15} strokeWidth={2.5}/> Add Money
            </button>
            <div className="flex gap-2">
              {[{icon:Send,label:'Send',action:()=>setShowTransfer(true)},{icon:ArrowUpFromLine,label:'Withdraw',action:()=>setShowWithdraw(true)},{icon:ArrowLeftRight,label:'Exchange',action:()=>navigate('/exchange')}].map(({icon:Icon,label,action})=>(
                <button key={label} onClick={action} className="flex flex-col items-center gap-0.5 bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold px-2.5 py-2 rounded-2xl transition-all active:scale-95">
                  <Icon size={13}/><span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Net Worth Card */}
      {netWorth.total>0 && <div className="mt-3"><NetWorthCard data={netWorth}/></div>}

      {/* Feature alerts row */}
      {(loan || activeCount()>0 || upcomingCount>0 || totalEarned()>0) && (
        <div className="mx-4 mt-3 flex gap-2 overflow-x-auto pb-1">
          {loan && (
            <Link to="/loans" className="flex-shrink-0 flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-2xl px-3 py-2">
              <Banknote size={13} className="text-purple-600"/>
              <span className="text-xs font-bold text-purple-700">Loan due</span>
            </Link>
          )}
          {activeCount()>0 && (
            <Link to="/insurance" className="flex-shrink-0 flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-2xl px-3 py-2">
              <Shield size={13} className="text-teal-600"/>
              <span className="text-xs font-bold text-teal-700">{activeCount()} insured</span>
            </Link>
          )}
          {upcomingCount>0 && (
            <Link to="/scheduler" className="flex-shrink-0 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-2xl px-3 py-2">
              <Calendar size={13} className="text-blue-600"/>
              <span className="text-xs font-bold text-blue-700">{upcomingCount} scheduled</span>
            </Link>
          )}
          {totalEarned()>0 && (
            <Link to="/cashback" className="flex-shrink-0 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-3 py-2">
              <Gift size={13} className="text-amber-600"/>
              <span className="text-xs font-bold text-amber-700">{formatCurrency(totalEarned(),'NGN',true)} cashback</span>
            </Link>
          )}
        </div>
      )}

      {/* Quick actions */}
      <div className="mx-4 mt-3 bg-white rounded-3xl shadow-card flex divide-x divide-gray-100 overflow-hidden">
        {[
          {icon:ArrowLeftRight,label:'To Opay',  onClick:()=>setShowTransfer(true), color:'text-brand-600'},
          {icon:Landmark,       label:'To Bank',  onClick:()=>setShowWithdraw(true), color:'text-blue-600' },
          {icon:ArrowUpFromLine,label:'Withdraw', onClick:()=>setShowWithdraw(true), color:'text-orange-500'},
          {icon:Exchange,       label:'Exchange', onClick:()=>navigate('/exchange'), color:'text-amber-600' },
        ].map(({icon:Icon,label,onClick,color})=>(
          <button key={label} onClick={onClick} className="flex-1 flex flex-col items-center gap-2 py-4 hover:bg-gray-50 active:scale-95 transition-all">
            <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center"><Icon size={18} className={color} strokeWidth={1.8}/></div>
            <span className="text-[10px] font-bold text-gray-600">{label}</span>
          </button>
        ))}
      </div>

      {/* Quick Send */}
      <div className="px-4 mt-5">
        <QuickSendBar onSelect={(_:Contact)=>navigate('/send')} onNew={()=>navigate('/send')}/>
      </div>

      {/* Quick Access Grid */}
      <div className="mt-5 px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-gray-900">Quick Access</h2>
          <button className="flex items-center gap-1 text-brand-600 text-xs font-bold hover:text-brand-700"><Pencil size={12}/> Edit</button>
        </div>
        <div className={cn('grid gap-1', gridCols)}>
          {quickAccess.map(({icon:Icon,label,to,bg,color})=>(
            <Link key={label} to={to} className="flex flex-col items-center gap-1.5 py-3 rounded-2xl hover:bg-gray-50 active:scale-95 transition-all">
              <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center',bg)}><Icon size={20} className={color} strokeWidth={1.6}/></div>
              <span className="text-[10px] font-bold text-gray-600 text-center leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Promo banners 2x2 */}
      <div className="px-4 mt-4 grid grid-cols-2 gap-3">
        {[
          {to:'/investments',gradient:'bg-investment-gradient',icon:TrendingUp,  iconColor:'text-amber-400', title:'Earn 19% p.a.',   sub:'Treasury Bills'      },
          {to:'/loans',      gradient:'bg-loan-gradient',      icon:Banknote,    iconColor:'text-purple-200',title:'QuickLoan',        sub:'Up to ₦500K'         },
          {to:'/insurance',  gradient:'bg-insurance-gradient', icon:Shield,      iconColor:'text-teal-200',  title:'Get Insured',      sub:'From ₦1,200/mo'      },
          {to:'/exchange',   gradient:'bg-exchange-gradient',  icon:Exchange,    iconColor:'text-amber-200', title:'FX Exchange',      sub:'Real-time rates'     },
        ].map(({to,gradient,icon:Icon,iconColor,title,sub})=>(
          <Link key={to} to={to} className={cn('rounded-3xl p-4 relative overflow-hidden text-white', gradient)}>
            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full border-[10px] border-white/10 pointer-events-none"/>
            <div className="relative z-10">
              <Icon size={20} className={cn('mb-2', iconColor)}/>
              <p className="text-white font-bold text-sm leading-tight">{title}</p>
              <p className="text-white/70 text-xs mt-0.5">{sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Transaction history */}
      <div className="mt-5 px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-gray-900">Recent Transactions</h2>
          <Link to="/finance" className="text-brand-600 text-xs font-bold hover:text-brand-700">See all</Link>
        </div>
        <div className="bg-white rounded-3xl shadow-card overflow-hidden">
          {isLoading
            ? Array.from({length:4}).map((_,i)=><TransactionSkeleton key={i}/>)
            : safeTxs.length===0
              ? <div className="text-center py-10 text-gray-400">
                  <ArrowLeftRight size={32} className="mx-auto mb-2 opacity-30"/>
                  <p className="text-sm font-bold">No transactions yet</p>
                </div>
              : safeTxs.slice(0,5).map(tx=><TransactionItem key={tx.id} tx={tx}/>)
          }
        </div>
      </div>
    </div>
  )

  return (
    <>
      <AppHeader title="OPay"/>
      <DeviceFrame>{content}</DeviceFrame>
      <AddMoneyModal isOpen={showAddMoney} onClose={()=>setShowAddMoney(false)}/>
      <TransferModal  isOpen={showTransfer} onClose={()=>setShowTransfer(false)}/>
      <WithdrawModal  isOpen={showWithdraw} onClose={()=>setShowWithdraw(false)}/>
    </>
  )
}
