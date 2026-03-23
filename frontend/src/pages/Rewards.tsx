import { useState } from 'react'
import { Gift, Copy, Share2, Users, ChevronRight, Star, Trophy, Zap, Crown, Lock, CheckCircle2, TrendingUp } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import Modal from '@/components/modals/Modal'
import { useAuthStore } from '@/store/useAuthStore'
import { useCashbackStore } from '@/store/useCashbackStore'
import { formatCurrency, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const REWARD_LEVELS = [
  { level:'Bronze',  min:0,     max:500,   color:'text-amber-700',  bg:'bg-amber-50',  border:'border-amber-200',  perks:['2% cashback','Basic support']                                   },
  { level:'Silver',  min:500,   max:2000,  color:'text-gray-500',   bg:'bg-gray-50',   border:'border-gray-200',   perks:['3% cashback','Priority support','Lower transfer fees']          },
  { level:'Gold',    min:2000,  max:5000,  color:'text-amber-500',  bg:'bg-amber-50',  border:'border-amber-300',  perks:['5% cashback','Dedicated manager','0% transfer fees','Free card']},
  { level:'Elite',   min:5000,  max:10000, color:'text-purple-600', bg:'bg-purple-50', border:'border-purple-300', perks:['7% cashback','Elite lounge','All perks','Priority investment']  },
  { level:'Diamond', min:10000, max:99999, color:'text-cyan-600',   bg:'bg-cyan-50',   border:'border-cyan-300',   perks:['10% cashback','Concierge','Custom card','VIP events']           },
]

const TASKS = [
  { icon:Star,      label:'Daily Check-in',     pts:50,   done:false, action:'check_in'   },
  { icon:Users,     label:'Refer a Friend',      pts:300,  done:false, action:'referral'   },
  { icon:Zap,       label:'First Bill Payment',  pts:200,  done:true,  action:'bill'       },
  { icon:TrendingUp,label:'Start Investing',     pts:500,  done:true,  action:'invest'     },
  { icon:Gift,      label:'Complete KYC Tier 2', pts:1000, done:false, action:'kyc'        },
  { icon:Crown,     label:'Reach Gold Status',   pts:2000, done:false, action:'gold'       },
  { icon:Lock,      label:'Set Transaction PIN', pts:100,  done:false, action:'pin'        },
  { icon:CheckCircle2,label:'Make 10 Transfers', pts:300,  done:false, action:'transfers'  },
]

const LEADERBOARD = [
  { name:'Chidi O.',    pts:9250,  rank:1, isMe:false },
  { name:'Amaka J.',    pts:8100,  rank:2, isMe:false },
  { name:'Emeka W.',    pts:7340,  rank:3, isMe:false },
  { name:'Ngozi A.',    pts:5890,  rank:4, isMe:false },
  { name:'You',         pts:1250,  rank:18,isMe:true  },
]

export default function Rewards() {
  const { user }     = useAuthStore()
  const { totalEarned } = useCashbackStore()
  const [pts,        setPts]        = useState(1250)
  const [showRedeem, setShowRedeem] = useState(false)
  const [tab,        setTab]        = useState<'overview'|'tasks'|'leaderboard'>('overview')

  const currentLevel = REWARD_LEVELS.findLast(l => pts >= l.min) ?? REWARD_LEVELS[0]
  const nextLevel    = REWARD_LEVELS[REWARD_LEVELS.indexOf(currentLevel)+1]
  const pctToNext    = nextLevel ? Math.round(((pts-currentLevel.min)/(nextLevel.min-currentLevel.min))*100) : 100

  const doTask = (task: typeof TASKS[0]) => {
    if (task.done) { toast('Already completed ✓'); return }
    setPts(p=>p+task.pts)
    toast.success(`+${task.pts} pts — ${task.label}!`)
  }

  const copyCode = () => {
    if (user?.referralCode) { navigator.clipboard.writeText(user.referralCode); toast.success('Code copied!') }
  }

  const content = (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">Rewards</h1><p className="page-subtitle">Earn points & unlock perks</p></div>
        <button onClick={()=>setShowRedeem(true)} className="btn-outline btn-sm">Redeem</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 px-4 mb-4">
        {(['overview','tasks','leaderboard'] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} className={cn('tab-pill flex-1 capitalize',tab===t?'tab-active':'tab-inactive')}>{t}</button>
        ))}
      </div>

      {tab==='overview' && (
        <>
          {/* Points hero */}
          <div className="mx-4 mb-4 bg-brand-gradient rounded-4xl p-5 relative overflow-hidden shadow-float-green">
            <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full border-[24px] border-white/10"/>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1"><Gift size={16} className="text-brand-200"/><span className="text-brand-100 text-sm font-semibold">Points Balance</span></div>
              <p className="font-number font-bold text-white text-5xl mb-2">{pts.toLocaleString()}</p>
              <p className="text-brand-200 text-xs mb-3">≈ {formatCurrency(pts*1,'NGN',true)} cash value</p>
              <div className="flex gap-2">
                <button onClick={()=>setShowRedeem(true)} className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all">Redeem Points</button>
                <button onClick={()=>doTask(TASKS[0])} className="bg-white text-brand-700 text-xs font-bold px-4 py-2 rounded-xl hover:bg-brand-50 transition-all active:scale-95">Daily Check-in</button>
              </div>
            </div>
          </div>

          {/* Level card */}
          <div className="mx-4 mb-4 bg-white rounded-3xl shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={cn('text-2xl font-display font-bold', currentLevel.color)}>{currentLevel.level}</span>
                  <Crown size={20} className={currentLevel.color}/>
                </div>
                {nextLevel && <p className="text-xs text-gray-400 mt-0.5">{(nextLevel.min-pts).toLocaleString()} pts to {nextLevel.level}</p>}
              </div>
              <div className="flex gap-1">
                {REWARD_LEVELS.map((l,i)=>(
                  <div key={i} className={cn('w-2 h-2 rounded-full transition-all', pts>=l.min?'bg-brand-500':'bg-gray-200')}/>
                ))}
              </div>
            </div>
            {nextLevel && (
              <>
                <div className="progress-bar mb-1">
                  <div className="progress-fill" style={{'--progress':`${pctToNext}%`} as React.CSSProperties}/>
                </div>
                <p className="text-xs text-gray-400">{pctToNext}% to {nextLevel.level}</p>
              </>
            )}
            <div className="mt-4 grid grid-cols-2 gap-1.5">
              {currentLevel.perks.map(p=>(
                <div key={p} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <CheckCircle2 size={11} className="text-brand-500 flex-shrink-0"/>{p}
                </div>
              ))}
            </div>
          </div>

          {/* Referral */}
          <div className="mx-4 mb-4 bg-white rounded-3xl shadow-card p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-brand-50 rounded-2xl flex items-center justify-center"><Users size={20} className="text-brand-600"/></div>
              <div><p className="font-bold text-sm text-gray-900">Refer & Earn ₦3,000</p><p className="text-xs text-gray-400">+300 pts per successful referral</p></div>
            </div>
            <div className="bg-brand-50 rounded-2xl px-4 py-3 flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Your code</p>
                <p className="font-mono font-bold text-gray-900 text-xl tracking-widest">{user?.referralCode??'—'}</p>
              </div>
              <button onClick={copyCode} className="flex items-center gap-1.5 bg-brand-600 text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-brand-700 transition-colors active:scale-95">
                <Copy size={13}/> Copy
              </button>
            </div>
            <button className="flex items-center justify-center gap-2 w-full border-2 border-brand-200 text-brand-600 text-sm font-bold py-2.5 rounded-2xl hover:bg-brand-50 transition-colors">
              <Share2 size={16}/> Share with Friends
            </button>
          </div>

          {/* Cashback earned */}
          {totalEarned()>0 && (
            <div className="mx-4 bg-amber-50 border border-amber-200 rounded-3xl p-4 flex items-center gap-3">
              <Gift size={22} className="text-amber-600 flex-shrink-0"/>
              <div className="flex-1"><p className="font-bold text-sm text-gray-900">Cashback Earned</p><p className="text-xs text-gray-500">{formatCurrency(totalEarned(),'NGN',true)} from partner merchants</p></div>
              <ChevronRight size={16} className="text-gray-300"/>
            </div>
          )}
        </>
      )}

      {tab==='tasks' && (
        <div className="px-4 space-y-3">
          {TASKS.map(task=>{
            const Icon=task.icon
            return (
              <button key={task.label} onClick={()=>doTask(task)}
                className={cn('w-full flex items-center gap-3 bg-white rounded-3xl shadow-card p-4 hover:shadow-card-hover transition-all text-left active:scale-[0.98]', task.done&&'opacity-60')}>
                <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0', task.done?'bg-brand-50':'bg-gray-50')}>
                  <Icon size={18} className={task.done?'text-brand-500':'text-gray-500'} strokeWidth={1.8}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{task.label}</p>
                  <p className="text-xs text-gray-400">{task.done?'Completed ✓':'Tap to complete'}</p>
                </div>
                <span className={cn('font-display font-bold text-sm', task.done?'text-brand-600':'text-gray-500')}>+{task.pts} pts</span>
              </button>
            )
          })}
        </div>
      )}

      {tab==='leaderboard' && (
        <div className="px-4">
          <div className="bg-white rounded-3xl shadow-card overflow-hidden">
            {LEADERBOARD.map(({name,pts:p,rank,isMe})=>(
              <div key={name} className={cn('flex items-center gap-3 px-4 py-4 border-b border-gray-50 last:border-0', isMe&&'bg-brand-50')}>
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-display font-bold flex-shrink-0',
                  rank===1?'bg-amber-400 text-white':rank===2?'bg-gray-300 text-white':rank===3?'bg-amber-700/60 text-white':'bg-gray-100 text-gray-600')}>
                  {rank<=3?['🥇','🥈','🥉'][rank-1]:rank}
                </div>
                <p className={cn('flex-1 font-bold text-sm', isMe?'text-brand-700':'text-gray-900')}>{name}{isMe&&' (You)'}</p>
                <p className="font-number font-bold text-sm text-gray-900">{p.toLocaleString()} pts</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center mt-3">Rankings reset on 1st of every month</p>
        </div>
      )}
    </div>
  )

  return (
    <>
      <AppHeader title="Rewards"/>
      <DeviceFrame>{content}</DeviceFrame>
      <Modal isOpen={showRedeem} onClose={()=>setShowRedeem(false)} title="Redeem Points">
        <div className="space-y-3">
          <p className="text-sm text-gray-600">You have <span className="font-bold text-brand-700">{pts.toLocaleString()} pts</span></p>
          {[{label:'₦500 Cashback',  cost:500,  icon:'💰'},{label:'₦1,000 Airtime',cost:1000, icon:'📱'},{label:'Free Transfer',cost:200,  icon:'✈️'}].map(({label,cost,icon})=>(
            <button key={label} onClick={()=>{if(pts>=cost){setPts(p=>p-cost);toast.success(`${label} redeemed!`);setShowRedeem(false)}else{toast.error(`Need ${cost-pts} more pts`)}}}
              className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-2xl hover:bg-brand-50 transition-colors active:scale-[0.98] text-left">
              <span className="text-2xl">{icon}</span>
              <div className="flex-1"><p className="text-sm font-bold text-gray-900">{label}</p></div>
              <span className="text-xs font-bold text-brand-600">{cost} pts</span>
            </button>
          ))}
        </div>
      </Modal>
    </>
  )
}
