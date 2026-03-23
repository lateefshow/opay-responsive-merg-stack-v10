import { useState, useEffect } from 'react'
import { Trophy, Zap, Target, TrendingDown, Plus, CheckCircle2, Clock, XCircle, ChevronRight, Star } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import Modal from '@/components/modals/Modal'
import { useChallengeStore, type UserChallenge, type CatalogueChallenge } from '@/store/useChallengeStore'
import { useWalletStore } from '@/store/useWalletStore'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const TYPE_META: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  savings:   { icon: Target,       color: 'text-brand-600',  bg: 'bg-brand-50',  label: 'Savings'   },
  spending:  { icon: TrendingDown, color: 'text-blue-600',   bg: 'bg-blue-50',   label: 'Spending'  },
  no_spend:  { icon: Zap,          color: 'text-purple-600', bg: 'bg-purple-50', label: 'No-Spend'  },
  debt:      { icon: TrendingDown, color: 'text-red-600',    bg: 'bg-red-50',    label: 'Debt'      },
}

const STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
  active:    { color: 'text-blue-700',  bg: 'bg-blue-50',  label: 'Active'    },
  completed: { color: 'text-brand-700', bg: 'bg-brand-50', label: 'Completed' },
  failed:    { color: 'text-red-600',   bg: 'bg-red-50',   label: 'Failed'    },
  abandoned: { color: 'text-gray-500',  bg: 'bg-gray-100', label: 'Abandoned' },
}

function ChallengeCard({ challenge, onJoin }: { challenge: CatalogueChallenge; onJoin: (id: string) => void }) {
  const meta = TYPE_META[challenge.type] ?? TYPE_META.savings
  const Icon = meta.icon
  return (
    <div className="bg-white rounded-3xl shadow-card overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0', meta.bg)}>
            <Icon size={18} className={meta.color} strokeWidth={1.8} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className={cn('badge text-[9px]', meta.bg, meta.color)}>{meta.label}</span>
            {challenge.joined && <span className="badge badge-green text-[9px]">Joined</span>}
          </div>
        </div>
        <p className="font-bold text-gray-900 mb-1">{challenge.name}</p>
        <p className="text-xs text-gray-400 mb-3 line-clamp-2">{challenge.description}</p>
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-gray-500">
            <span className="font-bold text-gray-900">{challenge.duration} {challenge.durationUnit}</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
            <Trophy size={11} />
            {formatCurrency(challenge.reward, 'NGN', true)} reward
          </div>
        </div>
        {!challenge.joined && (
          <button onClick={() => onJoin(challenge.id)}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-brand-600 bg-brand-50 rounded-2xl hover:bg-brand-100 transition-all active:scale-95">
            <Plus size={14} /> Join Challenge
          </button>
        )}
      </div>
    </div>
  )
}

function ActiveChallengeCard({ challenge, onProgress, onAbandon }: {
  challenge: UserChallenge; onProgress: (id: string, amt: number) => void; onAbandon: (id: string) => void
}) {
  const [adding, setAdding] = useState(false)
  const [amt, setAmt]       = useState('')
  const meta = STATUS_META[challenge.status] ?? STATUS_META.active
  const typeMeta = TYPE_META[challenge.type] ?? TYPE_META.savings
  const Icon = typeMeta.icon
  const daysLeft = Math.max(0, Math.ceil((new Date(challenge.endDate).getTime() - Date.now()) / 86400000))

  return (
    <div className="bg-white rounded-3xl shadow-card overflow-hidden">
      <div className="h-1.5 w-full" style={{ background: challenge.status === 'completed' ? '#16a34a' : challenge.status === 'active' ? '#3b82f6' : '#ef4444' }} />
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0', typeMeta.bg)}>
              <Icon size={18} className={typeMeta.color} strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-bold text-gray-900">{challenge.name}</p>
              <p className="text-xs text-gray-400">{daysLeft} days left</p>
            </div>
          </div>
          <span className={cn('badge text-[9px]', meta.bg, meta.color)}>{meta.label}</span>
        </div>

        {challenge.targetAmount > 0 && (
          <div className="bg-gray-50 rounded-2xl p-3 mb-3">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-bold text-gray-400">Progress</span>
              <span className="font-display font-bold text-gray-900">{formatCurrency(challenge.currentAmount, 'NGN', true)} <span className="text-gray-400 font-normal text-xs">/ {formatCurrency(challenge.targetAmount, 'NGN', true)}</span></span>
            </div>
            <div className="progress-bar mb-1">
              <div className="progress-fill" style={{ '--progress': `${challenge.progress}%` } as React.CSSProperties} />
            </div>
            <p className="text-[10px] text-gray-400">{Math.round(challenge.progress)}% complete</p>
          </div>
        )}

        {/* Milestones */}
        {challenge.milestones.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
            {challenge.milestones.map((ms, i) => (
              <div key={i} className={cn('flex-shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold', ms.achieved ? 'bg-brand-50 text-brand-700' : 'bg-gray-100 text-gray-500')}>
                {ms.achieved ? '✓' : '○'} {ms.label}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="text-xs text-amber-600 font-bold bg-amber-50 px-2.5 py-1 rounded-lg flex items-center gap-1">
            <Trophy size={11} />{formatCurrency(challenge.reward, 'NGN', true)}
          </div>

          {challenge.status === 'active' && challenge.targetAmount > 0 && (
            <>
              {!adding ? (
                <button onClick={() => setAdding(true)}
                  className="flex-1 py-2 text-xs font-bold text-brand-600 bg-brand-50 rounded-xl hover:bg-brand-100 transition-colors text-center">
                  + Log Progress
                </button>
              ) : (
                <div className="flex-1 flex gap-1.5">
                  <input type="number" value={amt} onChange={e => setAmt(e.target.value)}
                    placeholder="₦ amount" className="flex-1 text-xs px-2 py-2 border border-gray-200 rounded-xl font-bold" />
                  <button onClick={() => { if (amt) { onProgress(challenge.id, Number(amt)); setAmt(''); setAdding(false) } }}
                    className="px-3 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700">
                    Save
                  </button>
                  <button onClick={() => setAdding(false)} className="px-2 py-2 bg-gray-100 rounded-xl"><XCircle size={13} className="text-gray-500" /></button>
                </div>
              )}
            </>
          )}

          {challenge.status === 'active' && (
            <button onClick={() => onAbandon(challenge.id)}
              className="px-3 py-2 text-xs font-bold text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
              Quit
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function BudgetChallenges() {
  const { available, joined, totalRewards, completedCount, activeCount, isLoading, fetchChallenges, joinChallenge, updateProgress, abandonChallenge } = useChallengeStore()
  const { setBalance, balance } = useWalletStore()
  const [tab, setTab]     = useState<'active' | 'explore'>('explore')
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchChallenges() }, [])

  const safeAvailable = available ?? []
  const safeJoined    = joined    ?? []
  const activeOnes    = safeJoined.filter(c => c.status === 'active')
  const historicOnes  = safeJoined.filter(c => c.status !== 'active')

  const handleJoin = async (challengeId: string) => {
    setLoading(true)
    try {
      await joinChallenge(challengeId)
      toast.success('Challenge joined! 🏆 Good luck!')
      setTab('active')
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to join')
    } finally { setLoading(false) }
  }

  const handleProgress = async (id: string, amount: number) => {
    const updated = await updateProgress(id, amount)
    if (updated.status === 'completed') {
      setBalance(balance + (updated.reward ?? 0))
      toast.success(`🎉 Challenge COMPLETED! ₦${(updated.reward ?? 0).toLocaleString()} reward credited!`)
    } else {
      toast.success(`Progress updated! ${Math.round(updated.progress)}% done`)
    }
  }

  const handleAbandon = async (id: string) => {
    await abandonChallenge(id)
    toast('Challenge abandoned', { icon: '😞' })
  }

  const content = (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">Budget Challenges</h1><p className="page-subtitle">Turn saving into a game</p></div>
      </div>

      {/* Stats hero */}
      <div className="mx-4 mb-4 rounded-4xl bg-gradient-to-br from-violet-600 to-purple-700 p-5 shadow-premium relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border-[20px] border-white/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <Trophy size={28} className="text-amber-300" />
            <div>
              <p className="text-white/70 text-xs">Total Rewards Earned</p>
              <p className="text-white font-display font-bold text-2xl">{formatCurrency(totalRewards, 'NGN', true)}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[{ l: 'Active', v: activeCount }, { l: 'Completed', v: completedCount }, { l: 'Joined', v: safeJoined.length }].map(({ l, v }) => (
              <div key={l} className="bg-white/15 rounded-2xl p-2.5 text-center">
                <p className="text-white/60 text-[9px]">{l}</p>
                <p className="text-white font-display font-bold text-lg">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 px-4 mb-4">
        {(['active', 'explore'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('tab-pill flex-1 capitalize', tab === t ? 'tab-active' : 'tab-inactive')}>
            {t === 'active' ? `My Challenges (${activeOnes.length})` : `Explore (${safeAvailable.length})`}
          </button>
        ))}
      </div>

      {tab === 'active' ? (
        <div className="px-4 space-y-3">
          {activeOnes.length === 0 && historicOnes.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl shadow-card">
              <Trophy size={40} className="mx-auto mb-3 text-gray-200" />
              <p className="font-bold text-gray-500">No challenges yet</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">Explore challenges and start earning rewards</p>
              <button onClick={() => setTab('explore')} className="btn-primary px-6 py-2.5 text-sm">Explore Challenges</button>
            </div>
          ) : (
            <>
              {activeOnes.map(c => <ActiveChallengeCard key={c.id} challenge={c} onProgress={handleProgress} onAbandon={handleAbandon} />)}
              {historicOnes.length > 0 && (
                <>
                  <p className="section-label mt-2">History</p>
                  {historicOnes.map(c => <ActiveChallengeCard key={c.id} challenge={c} onProgress={handleProgress} onAbandon={handleAbandon} />)}
                </>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="px-4 grid grid-cols-1 gap-3">
          {safeAvailable.map(ch => <ChallengeCard key={ch.id} challenge={ch} onJoin={handleJoin} />)}
        </div>
      )}
    </div>
  )

  return (
    <>
      <AppHeader title="Budget Challenges" showBack />
      <DeviceFrame>{content}</DeviceFrame>
    </>
  )
}
