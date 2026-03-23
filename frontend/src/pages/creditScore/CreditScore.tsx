import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts'
import { Shield, TrendingUp, TrendingDown, Info, CheckCircle2, AlertTriangle, Zap, ChevronRight, RefreshCw, Award } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import ProgressRing from '@/components/ui/ProgressRing'
import { useCreditScoreStore } from '@/store/useCreditScoreStore'
import { useWalletStore } from '@/store/useWalletStore'
import { useLoanStore } from '@/store/useLoanStore'
import { formatDate, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const TIER_META = {
  poor:      { label:'Poor',      color:'#ef4444', bg:'bg-red-50',    text:'text-red-600',    range:'300–579',  desc:'High-risk borrower. Urgent improvement needed.' },
  fair:      { label:'Fair',      color:'#f59e0b', bg:'bg-amber-50',  text:'text-amber-600',  range:'580–669',  desc:'Below average. Lenders may charge higher rates.' },
  good:      { label:'Good',      color:'#16a34a', bg:'bg-brand-50',  text:'text-brand-600',  range:'670–739',  desc:'Near or slightly above average. Good rates available.' },
  excellent: { label:'Excellent', color:'#0891b2', bg:'bg-cyan-50',   text:'text-cyan-600',   range:'740–850',  desc:'Top-tier borrower. Best rates and terms available.' },
}

const BOOST_ACTIONS = [
  { id:'pay_loan',    icon:CheckCircle2,  label:'Pay Loan on Time',       points:'+8 pts',  desc:'Your next repayment boosts history score', color:'text-brand-600',  bg:'bg-brand-50'  },
  { id:'reduce_debt', icon:TrendingDown,  label:'Reduce Loan Balance',    points:'+12 pts', desc:'Pay down ₦10,000+ to improve utilization',  color:'text-blue-600',   bg:'bg-blue-50'   },
  { id:'add_card',    icon:Zap,           label:'Activate Virtual Card',  points:'+5 pts',  desc:'Having an active card improves credit mix',  color:'text-purple-600', bg:'bg-purple-50' },
  { id:'verify_kyc',  icon:Shield,        label:'Complete KYC Tier 3',    points:'+10 pts', desc:'Higher KYC unlocks better credit products',  color:'text-amber-600',  bg:'bg-amber-50'  },
  { id:'auto_save',   icon:Award,         label:'Enable Auto-Save',       points:'+3 pts',  desc:'Regular saving shows financial discipline',  color:'text-teal-600',   bg:'bg-teal-50'   },
]

export default function CreditScore() {
  const { score, tier, factors, history, lastUpdated, isLoading, fetchScore, simulateImprovement } = useCreditScoreStore()
  const { balance } = useWalletStore()
  const { applications } = useLoanStore()
  const [refreshing, setRefreshing] = useState(false)
  useEffect(() => { fetchScore() }, [])
  const [expandedFactor, setExpandedFactor] = useState<string | null>(null)

  const meta = TIER_META[tier]
  const scorePercentage = Math.round(((score - 300) / (850 - 300)) * 100)

  const activeLoan = (applications ?? []).find(l => l.status === 'active' || l.status === 'overdue')

  const handleRefresh = async () => {
    setRefreshing(true)
    await new Promise(r => setTimeout(r, 1500))
    setRefreshing(false)
    toast.success('Credit score refreshed!')
  }

  const handleBoost = async (actionId: string, label: string, points: string) => {
    await simulateImprovement(actionId)
    toast.success(`${label} applied! ${points} projected boost 🚀`)
  }

  const radarData = factors.map(f => ({ factor: f.label.split(' ')[0], score: f.score }))

  const content = (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">Credit Score</h1><p className="page-subtitle">AI-powered credit intelligence</p></div>
        <button onClick={handleRefresh} className="btn-icon bg-gray-100 hover:bg-gray-200">
          <RefreshCw size={16} className={cn('text-gray-600', refreshing && 'animate-spin-slow')}/>
        </button>
      </div>

      {/* Score hero */}
      <div className="mx-4 mb-4 bg-dark-gradient rounded-4xl p-6 relative overflow-hidden shadow-premium">
        <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full border-[24px] border-white/5"/>
        <div className="relative z-10 flex items-center gap-6">
          <div className="flex-shrink-0">
            <ProgressRing value={scorePercentage} size={100} stroke={8} color={meta.color} trackColor="rgba(255,255,255,0.1)">
              <div className="text-center">
                <p className="font-number font-bold text-white text-xl leading-none">{score}</p>
                <p className="text-white/60 text-[9px] font-bold mt-0.5">/ 850</p>
              </div>
            </ProgressRing>
          </div>
          <div className="flex-1 min-w-0">
            <div className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2', meta.bg, meta.text)}>
              <Shield size={11}/>{meta.label}
            </div>
            <p className="text-white font-display font-bold text-lg leading-tight mb-1">{meta.desc}</p>
            <p className="text-white/50 text-xs">Range: {meta.range} · Updated {formatDate(lastUpdated, 'relative')}</p>
          </div>
        </div>

        {/* Score breakdown bar */}
        <div className="relative z-10 mt-5">
          <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
            {[{c:'#ef4444',w:22},{c:'#f59e0b',w:17},{c:'#16a34a',w:13},{c:'#0891b2',w:12}].map((seg,i)=>(
              <div key={i} className="rounded-full" style={{background:seg.c, width:`${seg.w}%`}}/>
            ))}
          </div>
          <div className="flex justify-between mt-1.5 text-[9px] font-bold text-white/40">
            <span>300</span><span>580</span><span>670</span><span>740</span><span>850</span>
          </div>
          {/* Score pointer */}
          <div className="absolute -top-1 transition-all" style={{left:`${scorePercentage}%`, transform:'translateX(-50%)'}}>
            <div className="w-3 h-3 rounded-full bg-white shadow-lg border-2 border-white"/>
          </div>
        </div>
      </div>

      {/* Score history chart */}
      <div className="mx-4 mb-4 bg-white rounded-3xl shadow-card p-4">
        <p className="font-display font-bold text-sm text-gray-900 mb-3">Score History (7 months)</p>
        <ResponsiveContainer width="100%" height={130}>
          <LineChart data={history} margin={{top:5,right:0,left:-20,bottom:0}}>
            <XAxis dataKey="month" tick={{fontSize:9,fill:'#9ca3af'}} axisLine={false} tickLine={false}
              tickFormatter={(v) => v.split(' ')[0]}/>
            <YAxis domain={[680, 760]} tick={{fontSize:9,fill:'#9ca3af'}} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{borderRadius:12,border:'none',fontSize:11,boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}}
              formatter={(v: number) => [v, 'Score']}/>
            <Line type="monotone" dataKey="score" stroke={meta.color} strokeWidth={2.5}
              dot={{fill:meta.color, r:4}} activeDot={{r:6}}/>
          </LineChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
          <span>6 months ago: {history[0]?.score}</span>
          <span className={cn('font-bold flex items-center gap-1', score > (history[0]?.score ?? 0) ? 'text-brand-600' : 'text-red-500')}>
            <TrendingUp size={11}/>+{score - (history[0]?.score ?? 0)} pts overall
          </span>
        </div>
      </div>

      {/* Active loan alert */}
      {activeLoan && (
        <div className="mx-4 mb-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5"/>
          <div>
            <p className="text-sm font-bold text-gray-900">Active Loan Detected</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Timely repayment of your {activeLoan.status === 'overdue' ? '⚠️ overdue' : 'active'} loan
              will {activeLoan.status === 'overdue' ? 'prevent further score drop' : 'boost your score by +8 pts'}.
            </p>
          </div>
        </div>
      )}

      {/* Credit factors */}
      <div className="px-4 mb-4">
        <p className="section-label">Score Factors</p>
        <div className="space-y-2">
          {factors.map(factor => (
            <div key={factor.label}
              className="bg-white rounded-2xl shadow-card overflow-hidden">
              <button
                onClick={() => setExpandedFactor(expandedFactor === factor.label ? null : factor.label)}
                className="w-full flex items-center gap-3 p-4 text-left">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-gray-900">{factor.label}</p>
                    <div className="flex items-center gap-2">
                      <span className={cn('badge text-[10px]',
                        factor.status==='good'?'badge-green':factor.status==='fair'?'badge-gold':'badge-red')}>
                        {factor.status}
                      </span>
                      <span className="text-sm font-bold text-gray-900">{factor.score}</span>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{
                      '--progress': `${factor.score}%`,
                      background: factor.status==='good' ? '#16a34a' : factor.status==='fair' ? '#f59e0b' : '#ef4444',
                    } as React.CSSProperties}/>
                  </div>
                </div>
                <ChevronRight size={14} className={cn('text-gray-300 flex-shrink-0 transition-transform', expandedFactor===factor.label&&'rotate-90')}/>
              </button>
              {expandedFactor === factor.label && (
                <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                  <p className="text-xs text-gray-600 mt-3 flex items-start gap-2">
                    <Info size={12} className="text-brand-500 flex-shrink-0 mt-0.5"/>
                    {factor.tip}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Radar chart */}
      <div className="mx-4 mb-4 bg-white rounded-3xl shadow-card p-4">
        <p className="font-display font-bold text-sm text-gray-900 mb-3">Credit Profile Radar</p>
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={radarData} margin={{top:0,right:20,bottom:0,left:20}}>
            <PolarGrid stroke="#f1f5f9"/>
            <PolarAngleAxis dataKey="factor" tick={{fontSize:10,fill:'#6b7280'}}/>
            <Radar name="Score" dataKey="score" stroke={meta.color} fill={meta.color} fillOpacity={0.25} strokeWidth={2}/>
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Boost actions */}
      <div className="px-4">
        <p className="section-label">Boost Your Score</p>
        <div className="space-y-2">
          {BOOST_ACTIONS.map(action => {
            const Icon = action.icon
            return (
              <button key={action.id} onClick={() => handleBoost(action.id, action.label, action.points)}
                className="w-full flex items-center gap-3 bg-white rounded-2xl shadow-card p-4 text-left hover:shadow-card-hover transition-all active:scale-[0.98]">
                <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0', action.bg)}>
                  <Icon size={18} className={action.color} strokeWidth={1.8}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{action.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{action.desc}</p>
                </div>
                <span className="font-display font-bold text-xs text-brand-600 flex-shrink-0">{action.points}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <AppHeader title="Credit Score" showBack/>
      <DeviceFrame>{content}</DeviceFrame>
    </>
  )
}
