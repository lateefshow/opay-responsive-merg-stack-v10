import { useState, useEffect } from 'react'
import { Gift, Users, Share2, Copy, ChevronRight, Star, Trophy, Check, RefreshCw } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import Modal from '@/components/modals/Modal'
import { useReferralStore } from '@/store/useReferralStore'
import { useAuthStore } from '@/store/useAuthStore'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const TIERS = [
  { name: 'Bronze',  min: 0,  max: 4,  color: '#b45309', bg: 'bg-amber-50',  badge: '🥉', perks: ['₦3,000 per referral'] },
  { name: 'Silver',  min: 5,  max: 9,  color: '#94a3b8', bg: 'bg-slate-50',  badge: '🥈', perks: ['₦3,000 per referral', '+₦5,000 milestone bonus'] },
  { name: 'Gold',    min: 10, max: 19, color: '#d97706', bg: 'bg-amber-50',  badge: '🥇', perks: ['₦3,500 per referral', '+₦10,000 milestone bonus', 'Priority support'] },
  { name: 'Diamond', min: 20, max: 999,color: '#0ea5e9', bg: 'bg-sky-50',    badge: '💎', perks: ['₦4,000 per referral', '+₦25,000 bonus', 'VIP badge', 'Exclusive offers'] },
]

export default function ReferralCenter() {
  const { referralCode, referralLink, shareMessage, stats, referrals, milestones, bonusPerReferral, isLoading, fetch, getShareLink } = useReferralStore()
  const { user } = useAuthStore()
  const [showShare, setShowShare] = useState(false)
  const [copied, setCopied]       = useState(false)

  useEffect(() => { fetch() }, [])

  const code    = referralCode || user?.referralCode || 'LOADING'
  const link    = referralLink || `https://opay.ng/join?ref=${code}`
  const tierIdx = TIERS.findIndex(t => stats.tierLevel === t.name)
  const tier    = TIERS[Math.max(0, tierIdx)]
  const nextTier = TIERS[Math.min(TIERS.length - 1, tierIdx + 1)]
  const progress = nextTier && nextTier.min > 0 ? Math.min(100, Math.round((stats.totalReferrals / nextTier.min) * 100)) : 100

  const copyCode = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success('Referral code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    setShowShare(true)
    if (!shareMessage) await getShareLink()
  }

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join OPay!', text: shareMessage, url: link })
      } catch {}
    } else {
      navigator.clipboard.writeText(shareMessage)
      toast.success('Share message copied!')
    }
  }

  const content = (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">Referral Center</h1><p className="page-subtitle">Earn ₦{bonusPerReferral.toLocaleString()} per friend</p></div>
        <button onClick={() => fetch()} className="btn-icon bg-gray-100">
          <RefreshCw size={16} className={cn('text-gray-600', isLoading && 'animate-spin')} />
        </button>
      </div>

      {/* Tier hero */}
      <div className="mx-4 mb-4 rounded-4xl overflow-hidden shadow-premium relative"
        style={{ background: `linear-gradient(135deg, ${tier.color}dd, ${tier.color}88)` }}>
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border-[20px] border-white/10" />
        <div className="relative z-10 p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">{tier.badge}</span>
            <div>
              <p className="text-white/80 text-xs font-semibold">Current Tier</p>
              <p className="text-white font-display font-bold text-2xl">{tier.name}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-white/80 text-xs">Total Earned</p>
              <p className="text-white font-display font-bold text-lg">{formatCurrency(stats.totalEarned, 'NGN', true)}</p>
            </div>
          </div>

          {/* Progress to next tier */}
          {stats.tierLevel !== 'Diamond' && (
            <div>
              <div className="flex justify-between text-xs text-white/70 mb-1">
                <span>{stats.totalReferrals} referrals</span>
                <span>{nextTier.min} for {nextTier.name}</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 mt-3">
            {[{ l: 'Referrals', v: stats.totalReferrals }, { l: 'Paid', v: stats.paidBonuses }, { l: 'Pending', v: stats.pendingBonuses }].map(({ l, v }) => (
              <div key={l} className="bg-white/15 rounded-2xl p-2.5 text-center">
                <p className="text-white/60 text-[9px]">{l}</p>
                <p className="text-white font-display font-bold text-lg">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Referral code card */}
      <div className="mx-4 mb-4 bg-white rounded-3xl shadow-card p-4">
        <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Your Referral Code</p>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 bg-gray-50 rounded-2xl px-4 py-3 border-2 border-dashed border-gray-200">
            <p className="font-mono font-bold text-gray-900 text-xl tracking-widest text-center">{code}</p>
          </div>
          <button onClick={copyCode}
            className={cn('w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all', copied ? 'bg-brand-500' : 'bg-gray-100 hover:bg-gray-200')}>
            {copied ? <Check size={18} className="text-white" /> : <Copy size={18} className="text-gray-600" />}
          </button>
        </div>
        <button onClick={handleShare}
          className="w-full flex items-center justify-center gap-2 py-3 bg-brand-600 text-white font-bold rounded-2xl hover:bg-brand-700 transition-all active:scale-95 shadow-float-green">
          <Share2 size={16} /> Share & Earn {formatCurrency(bonusPerReferral, 'NGN', true)}
        </button>
      </div>

      {/* How it works */}
      <div className="mx-4 mb-4 bg-white rounded-3xl shadow-card p-4">
        <p className="font-display font-bold text-sm text-gray-900 mb-3">How it works</p>
        <div className="space-y-3">
          {[
            { step: '1', text: 'Share your referral code with friends', color: 'bg-brand-50 text-brand-600' },
            { step: '2', text: 'Friend signs up with your code', color: 'bg-blue-50 text-blue-600' },
            { step: '3', text: `You both get ${formatCurrency(bonusPerReferral)} credited instantly!`, color: 'bg-purple-50 text-purple-600' },
          ].map(({ step, text, color }) => (
            <div key={step} className="flex items-center gap-3">
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0', color)}>{step}</div>
              <p className="text-sm text-gray-700">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tier benefits */}
      <div className="px-4 mb-4">
        <p className="section-label">Tier Benefits</p>
        <div className="space-y-2">
          {TIERS.map(t => (
            <div key={t.name} className={cn('bg-white rounded-2xl shadow-card p-4 border-2 transition-all', stats.tierLevel === t.name ? 'border-brand-400 bg-brand-50/30' : 'border-transparent')}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{t.badge}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900">{t.name}</p>
                    {stats.tierLevel === t.name && <span className="badge badge-green text-[9px]">Current</span>}
                    {t.min > 0 && <span className="text-xs text-gray-400">{t.min}+ referrals</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{t.perks.join(' · ')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Milestones */}
      {milestones.length > 0 && (
        <div className="px-4 mb-4">
          <p className="section-label">Milestone Bonuses</p>
          <div className="space-y-2">
            {milestones.map((m, i) => (
              <div key={i} className={cn('bg-white rounded-2xl shadow-card p-4 flex items-center gap-3', stats.totalReferrals >= m.referrals && 'bg-brand-50')}>
                <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0', stats.totalReferrals >= m.referrals ? 'bg-brand-500' : 'bg-gray-100')}>
                  {stats.totalReferrals >= m.referrals ? <Trophy size={18} className="text-white" /> : <Star size={18} className="text-gray-400" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">{m.referrals} referrals</p>
                  <p className="text-xs text-gray-400">{m.bonus}</p>
                </div>
                <span className={cn('font-display font-bold text-sm', stats.totalReferrals >= m.referrals ? 'text-brand-600' : 'text-gray-400')}>
                  {stats.totalReferrals >= m.referrals ? '✓ Earned' : `${m.referrals - stats.totalReferrals} left`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Referral history */}
      {referrals.length > 0 && (
        <div className="px-4">
          <p className="section-label">Your Referrals ({referrals.length})</p>
          <div className="surface">
            {referrals.map((r, idx) => (
              <div key={r.id} className={cn('list-item', idx < referrals.length - 1 && 'border-b border-gray-50')}>
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold flex-shrink-0">
                  {r.refereeName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{r.refereeName}</p>
                  <p className="text-xs text-gray-400">{formatDate(r.joinedAt, 'relative')}</p>
                </div>
                <div className="text-right">
                  <p className={cn('text-sm font-bold', r.status === 'paid' ? 'text-brand-600' : 'text-amber-600')}>
                    {r.status === 'paid' ? `+${formatCurrency(r.bonusAmount, 'NGN', true)}` : 'Pending'}
                  </p>
                  <span className={cn('badge text-[9px]', r.status === 'paid' ? 'badge-green' : 'badge-gold')}>{r.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      <AppHeader title="Referral Center" showBack />
      <DeviceFrame>{content}</DeviceFrame>

      <Modal isOpen={showShare} onClose={() => setShowShare(false)} title="Share & Earn">
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-sm text-gray-700 leading-relaxed">{shareMessage || `Join OPay with my code ${code} and get ₦${bonusPerReferral.toLocaleString()} bonus! opay.ng/join?ref=${code}`}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'WhatsApp', emoji: '💬', color: 'bg-green-500', action: () => window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage || link)}`) },
              { label: 'Twitter',  emoji: '🐦', color: 'bg-blue-400',  action: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage || link)}`) },
            ].map(({ label, emoji, color, action }) => (
              <button key={label} onClick={action}
                className={cn('flex items-center justify-center gap-2 py-3 rounded-2xl text-white font-bold text-sm', color)}>
                {emoji} {label}
              </button>
            ))}
          </div>
          <button onClick={nativeShare} className="w-full flex items-center justify-center gap-2 py-3 bg-brand-600 text-white font-bold rounded-2xl hover:bg-brand-700 transition-all">
            <Share2 size={16} /> Share via…
          </button>
          <button onClick={() => { navigator.clipboard.writeText(code); toast.success('Code copied!'); setShowShare(false) }}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-all">
            <Copy size={16} /> Copy Code Only
          </button>
        </div>
      </Modal>
    </>
  )
}
