import { useState, useEffect } from 'react'
import { Heart, ThumbsUp, Flame, Star, Plus, Send, Globe, Lock, RefreshCw, TrendingUp, PiggyBank, Trophy } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import Modal from '@/components/modals/Modal'
import { useSocialStore, type SocialActivity } from '@/store/useSocialStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useWalletStore } from '@/store/useWalletStore'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const EMOJIS = ['❤️', '🔥', '👏', '😍', '🚀', '💰', '🎉', '👑']

const TYPE_META: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  send:       { icon: Send,       color: 'text-blue-600',   bg: 'bg-blue-50',   label: 'sent money'      },
  receive:    { icon: TrendingUp, color: 'text-brand-600',  bg: 'bg-brand-50',  label: 'received money'  },
  savings:    { icon: PiggyBank,  color: 'text-purple-600', bg: 'bg-purple-50', label: 'saved money'     },
  investment: { icon: TrendingUp, color: 'text-amber-600',  bg: 'bg-amber-50',  label: 'invested'        },
  challenge:  { icon: Trophy,     color: 'text-rose-600',   bg: 'bg-rose-50',   label: 'completed challenge' },
}

const POST_TYPES = [
  { id: 'send',       label: 'Money Sent',        emoji: '💸' },
  { id: 'savings',    label: 'Savings Milestone',  emoji: '🏦' },
  { id: 'investment', label: 'Investment Win',      emoji: '📈' },
  { id: 'challenge',  label: 'Challenge Complete',  emoji: '🏆' },
  { id: 'receive',    label: 'Money Received',      emoji: '💰' },
]

// Seeded demo feed data (shown while API loads)
const DEMO_FEED: SocialActivity[] = [
  { id:'d1', userId:'u1', userName:'Babatunde Fashola', userInitials:'BF', avatarColor:'#8b5cf6', type:'investment', caption:'Just invested ₦500,000 in Fixed Income bonds. Passive income loading! 📈', amount:500000, isPublic:true, reactions:[{userId:'x',emoji:'🔥'},{userId:'y',emoji:'👏'}], commentCount:3, createdAt:new Date(Date.now()-3600000).toISOString() },
  { id:'d2', userId:'u2', userName:'Adaeze Okonkwo',    userInitials:'AO', avatarColor:'#16a34a', type:'savings',    caption:'Hit my Dubai vacation savings goal! ₦215K saved in 60 days ✈️🌟',       amount:215000, isPublic:true, reactions:[{userId:'x',emoji:'❤️'},{userId:'y',emoji:'🚀'},{userId:'z',emoji:'😍'}], commentCount:7, createdAt:new Date(Date.now()-7200000).toISOString() },
  { id:'d3', userId:'u3', userName:'Fatimah Abdullahi', userInitials:'FA', avatarColor:'#3b82f6', type:'challenge',  caption:'Completed the 52-Week Savings Challenge! Earned ₦10,000 reward 🏆',      amount:0,      isPublic:true, reactions:[{userId:'x',emoji:'👑'},{userId:'y',emoji:'🔥'}], commentCount:5, createdAt:new Date(Date.now()-86400000).toISOString() },
  { id:'d4', userId:'u4', userName:'Ngozi Eze',         userInitials:'NE', avatarColor:'#ef4444', type:'send',       caption:'Just paid my team on OPay. Running a business the easy way! 💼',         amount:45000,  isPublic:true, reactions:[{userId:'x',emoji:'❤️'}], commentCount:2, createdAt:new Date(Date.now()-172800000).toISOString() },
]

function ActivityCard({ activity, onReact }: { activity: SocialActivity; onReact: (id: string, emoji: string) => void }) {
  const meta     = TYPE_META[activity.type] ?? TYPE_META.send
  const Icon     = meta.icon
  const topEmoji = activity.reactions.length > 0 ? activity.reactions[activity.reactions.length - 1].emoji : null

  return (
    <div className="bg-white rounded-3xl shadow-card overflow-hidden">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
            style={{ background: activity.avatarColor }}>
            {activity.userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900">{activity.userName}</p>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className={cn('font-semibold', meta.color)}>{meta.label}</span>
              <span>·</span>
              <span>{formatDate(activity.createdAt, 'relative')}</span>
              {activity.isPublic ? <Globe size={10} className="text-gray-300" /> : <Lock size={10} className="text-gray-300" />}
            </div>
          </div>
          <div className={cn('w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0', meta.bg)}>
            <Icon size={16} className={meta.color} strokeWidth={1.8} />
          </div>
        </div>

        {/* Caption */}
        <p className="text-sm text-gray-700 mb-3 leading-relaxed">{activity.caption}</p>

        {/* Amount pill */}
        {activity.amount > 0 && (
          <div className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-sm font-bold mb-3', meta.bg, meta.color)}>
            {activity.type === 'send' ? '−' : '+'}{formatCurrency(activity.amount, 'NGN', true)}
          </div>
        )}

        {/* Reactions */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {EMOJIS.slice(0, 4).map(emoji => (
              <button key={emoji} onClick={() => onReact(activity.id, emoji)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-brand-50 text-sm transition-all active:scale-90">
                {emoji}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            {activity.reactions.length > 0 && (
              <span className="flex items-center gap-1">
                {topEmoji} <span className="font-bold text-gray-600">{activity.reactions.length}</span>
              </span>
            )}
            {activity.commentCount > 0 && <span>{activity.commentCount} comments</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SocialFeed() {
  const { feed, myPosts, isLoading, fetchFeed, fetchMyPosts, createPost, reactToPost } = useSocialStore()
  const { user }    = useAuthStore()
  const { balance } = useWalletStore()
  const [tab, setTab]       = useState<'feed' | 'mine'>('feed')
  const [showPost, setShowPost] = useState(false)
  const [caption, setCaption]   = useState('')
  const [amount, setAmount]     = useState('')
  const [postType, setPostType] = useState('savings')
  const [isPublic, setIsPublic] = useState(true)
  const [loading, setLoading]   = useState(false)

  useEffect(() => { fetchFeed(); fetchMyPosts() }, [])

  const displayFeed  = (feed ?? []).length > 0 ? feed ?? [] : DEMO_FEED
  const displayMine  = myPosts ?? []

  const handlePost = async () => {
    if (!caption.trim()) { toast.error('Write something to share'); return }
    setLoading(true)
    try {
      await createPost(caption, Number(amount) || 0, postType, isPublic)
      toast.success('Posted to your feed! 🎉')
      setShowPost(false); setCaption(''); setAmount(''); setTab('mine')
    } catch { toast.error('Failed to post') }
    finally { setLoading(false) }
  }

  const handleReact = async (id: string, emoji: string) => {
    try { await reactToPost(id, emoji) }
    catch { /* silent */ }
  }

  const content = (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">Social Feed</h1><p className="page-subtitle">See what your community is doing</p></div>
        <div className="flex gap-2">
          <button onClick={() => { fetchFeed(); fetchMyPosts() }} className="btn-icon bg-gray-100">
            <RefreshCw size={16} className={cn('text-gray-600', isLoading && 'animate-spin')} />
          </button>
          <button onClick={() => setShowPost(true)}
            className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-bold px-4 py-2 rounded-2xl hover:bg-brand-700 shadow-float-green active:scale-95 transition-all">
            <Plus size={15} /> Post
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 px-4 mb-4">
        {([['feed', '📢 Community Feed'], ['mine', `📌 My Posts (${displayMine.length})`]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn('tab-pill flex-1', tab === id ? 'tab-active' : 'tab-inactive')}>{label}</button>
        ))}
      </div>

      {/* Post prompt */}
      {tab === 'feed' && (
        <button onClick={() => setShowPost(true)}
          className="mx-4 mb-4 w-full flex items-center gap-3 bg-white rounded-3xl shadow-card p-4 text-left hover:shadow-card-hover transition-all">
          <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold flex-shrink-0">
            {user ? user.firstName[0] : 'U'}
          </div>
          <p className="text-sm text-gray-400 flex-1">Share a financial win with your community…</p>
          <Globe size={14} className="text-gray-300 flex-shrink-0" />
        </button>
      )}

      <div className="px-4 space-y-3">
        {tab === 'feed' ? (
          displayFeed.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl shadow-card">
              <Globe size={40} className="mx-auto mb-3 text-gray-200" />
              <p className="font-bold text-gray-500">No posts yet</p>
              <button onClick={() => setShowPost(true)} className="btn-primary mt-4 px-6 py-2.5 text-sm">Be the first to post</button>
            </div>
          ) : displayFeed.map(a => <ActivityCard key={a.id} activity={a} onReact={handleReact} />)
        ) : (
          displayMine.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl shadow-card">
              <Star size={40} className="mx-auto mb-3 text-gray-200" />
              <p className="font-bold text-gray-500">No posts yet</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">Share your financial milestones with the community</p>
              <button onClick={() => setShowPost(true)} className="btn-primary px-6 py-2.5 text-sm">Create Post</button>
            </div>
          ) : displayMine.map(a => <ActivityCard key={a.id} activity={a} onReact={handleReact} />)
        )}
      </div>
    </div>
  )

  return (
    <>
      <AppHeader title="Social Feed" showBack />
      <DeviceFrame>{content}</DeviceFrame>

      <Modal isOpen={showPost} onClose={() => setShowPost(false)} title="Share a Win 🎉">
        <div className="space-y-4">
          {/* Post type */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Activity Type</label>
            <div className="grid grid-cols-2 gap-2">
              {POST_TYPES.map(pt => (
                <button key={pt.id} onClick={() => setPostType(pt.id)}
                  className={cn('flex items-center gap-2 px-3 py-2.5 rounded-2xl text-sm font-bold border-2 transition-all',
                    postType === pt.id ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
                  <span>{pt.emoji}</span>{pt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Caption</label>
            <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={3}
              placeholder="Share your financial win! Keep it inspiring…" maxLength={280}
              className="input-field resize-none" />
            <p className="text-[10px] text-gray-400 mt-1 text-right">{caption.length}/280</p>
          </div>

          {/* Amount (optional) */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Amount (₦) <span className="font-normal text-gray-400">optional</span></label>
            <input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="0.00" className="input-field" />
          </div>

          {/* Visibility */}
          <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3">
            <div>
              <p className="text-sm font-bold text-gray-900">{isPublic ? 'Public' : 'Private'}</p>
              <p className="text-xs text-gray-400">{isPublic ? 'Visible to everyone in the feed' : 'Only visible to you'}</p>
            </div>
            <button onClick={() => setIsPublic(v => !v)}
              className={cn('relative w-12 h-6 rounded-full transition-all', isPublic ? 'bg-brand-500' : 'bg-gray-200')}>
              <div className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all', isPublic ? 'left-6' : 'left-0.5')} />
            </button>
          </div>

          <button onClick={handlePost} disabled={loading || !caption.trim()} className="btn-primary w-full py-4">
            {loading ? 'Posting…' : '🎉 Share with Community'}
          </button>
        </div>
      </Modal>
    </>
  )
}
