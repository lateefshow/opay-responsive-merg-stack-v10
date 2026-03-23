import { useState, useEffect } from 'react'
import { Users, Plus, Crown, Shield, User, DollarSign, RefreshCw, Wallet, ChevronRight } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import Modal from '@/components/modals/Modal'
import { useFamilyStore, type FamilyMember } from '@/store/useFamilyStore'
import { useWalletStore } from '@/store/useWalletStore'
import { useAuthStore } from '@/store/useAuthStore'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const ROLE_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  owner:  { label: 'Owner',  icon: Crown,  color: 'text-amber-700', bg: 'bg-amber-50'  },
  admin:  { label: 'Admin',  icon: Shield, color: 'text-blue-700',  bg: 'bg-blue-50'   },
  member: { label: 'Member', icon: User,   color: 'text-gray-600',  bg: 'bg-gray-100'  },
}

function MemberCard({ member, isOwner, onSetLimit }: {
  member: FamilyMember; isOwner: boolean; onSetLimit: (m: FamilyMember) => void
}) {
  const meta    = ROLE_META[member.role] ?? ROLE_META.member
  const Icon    = meta.icon
  const spentPct = member.spendLimit > 0 ? Math.min(100, Math.round((member.spentThisMonth / member.spendLimit) * 100)) : 0
  const isOver   = spentPct >= 90

  return (
    <div className="bg-white rounded-3xl shadow-card p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
          style={{ background: member.avatarColor }}>
          {member.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-gray-900 truncate">{member.name}</p>
            <span className={cn('badge text-[9px] flex items-center gap-0.5', meta.bg, meta.color)}>
              <Icon size={9} />{meta.label}
            </span>
          </div>
          <p className="text-xs text-gray-400 truncate">{member.email}</p>
          <p className="text-[10px] text-gray-400">Joined {formatDate(member.joinedAt, 'relative')}</p>
        </div>
      </div>

      {member.role !== 'owner' && (
        <div className="bg-gray-50 rounded-2xl p-3">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-bold text-gray-500">Monthly Spend</span>
            <span className="text-xs font-bold text-gray-900">
              {formatCurrency(member.spentThisMonth, 'NGN', true)}
              {member.spendLimit > 0 && <span className="text-gray-400 font-normal"> / {formatCurrency(member.spendLimit, 'NGN', true)}</span>}
            </span>
          </div>
          {member.spendLimit > 0 && (
            <>
              <div className="progress-bar mb-1">
                <div style={{ height:'100%', borderRadius:9999, width:`${spentPct}%`, background: isOver ? '#ef4444' : '#16a34a', transition:'width 1s ease' }} />
              </div>
              <p className={cn('text-[10px]', isOver ? 'text-red-500 font-bold' : 'text-gray-400')}>{spentPct}% of limit used{isOver && ' — near limit!'}</p>
            </>
          )}
          {member.spendLimit === 0 && <p className="text-[10px] text-gray-400">No spend limit set</p>}
          {isOwner && (
            <button onClick={() => onSetLimit(member)}
              className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold text-brand-600 bg-brand-50 rounded-xl hover:bg-brand-100 transition-colors">
              <DollarSign size={11} /> {member.spendLimit > 0 ? 'Update Limit' : 'Set Limit'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function FamilyAccount() {
  const { account, isLoading, fetchFamily, createFamily, inviteMember, fundFamily, setSpendLimit } = useFamilyStore()
  const { balance, setBalance } = useWalletStore()
  const { user }   = useAuthStore()
  const [showCreate, setShowCreate]   = useState(false)
  const [showInvite, setShowInvite]   = useState(false)
  const [showFund, setShowFund]       = useState(false)
  const [showLimit, setShowLimit]     = useState<FamilyMember | null>(null)
  const [loading, setLoading]         = useState(false)

  // Form state
  const [familyName, setFamilyName] = useState('')
  const [invEmail, setInvEmail]     = useState('')
  const [invName, setInvName]       = useState('')
  const [invLimit, setInvLimit]     = useState('')
  const [fundAmt, setFundAmt]       = useState('')
  const [newLimit, setNewLimit]     = useState('')

  useEffect(() => { fetchFamily() }, [])

  const isOwner = account?.ownerId === user?.id

  const handleCreate = async () => {
    if (!familyName) { toast.error('Enter family name'); return }
    setLoading(true)
    try { await createFamily(familyName); toast.success('Family account created!'); setShowCreate(false) }
    catch (e: unknown) { toast.error((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Creation failed') }
    finally { setLoading(false) }
  }

  const handleInvite = async () => {
    if (!invEmail || !invName) { toast.error('Fill name and email'); return }
    setLoading(true)
    try {
      await inviteMember(invEmail, invName, Number(invLimit) || 0)
      toast.success(`${invName} invited to family!`)
      setShowInvite(false); setInvEmail(''); setInvName(''); setInvLimit('')
    } catch (e: unknown) { toast.error((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Invite failed') }
    finally { setLoading(false) }
  }

  const handleFund = async () => {
    const amt = Number(fundAmt)
    if (!amt || amt <= 0) { toast.error('Enter valid amount'); return }
    if (amt > balance) { toast.error('Insufficient balance'); return }
    setLoading(true)
    try {
      await fundFamily(amt); setBalance(balance - amt)
      toast.success(`₦${amt.toLocaleString()} added to family account!`)
      setShowFund(false); setFundAmt('')
    } catch { toast.error('Funding failed') }
    finally { setLoading(false) }
  }

  const handleSetLimit = async () => {
    if (!showLimit) return
    setLoading(true)
    try {
      await setSpendLimit(showLimit.email, Number(newLimit) || 0)
      toast.success('Spend limit updated!')
      setShowLimit(null); setNewLimit('')
    } catch { toast.error('Failed to set limit') }
    finally { setLoading(false) }
  }

  // No family account yet
  if (!account) {
    return (
      <>
        <AppHeader title="Family Account" showBack />
        <DeviceFrame>
          <div className="page-container flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
            <div className="w-20 h-20 rounded-3xl bg-brand-50 flex items-center justify-center mb-5"><Users size={36} className="text-brand-600" /></div>
            <h2 className="font-display font-bold text-2xl mb-2">Family Banking</h2>
            <p className="text-gray-400 text-sm mb-6">Create a shared wallet for your family. Set spend limits, fund the account and see everyone's spending in one place.</p>
            <div className="grid grid-cols-3 gap-4 w-full max-w-xs mb-8">
              {[['👨‍👩‍👧', 'Shared Wallet', 'One balance for all'], ['💳', 'Spend Limits', 'Control each member'], ['📊', 'Analytics', 'Track family spend']].map(([e, t, s]) => (
                <div key={t} className="text-center"><p className="text-2xl mb-1">{e}</p><p className="text-xs font-bold text-gray-900">{t}</p><p className="text-[10px] text-gray-400">{s}</p></div>
              ))}
            </div>
            <button onClick={() => setShowCreate(true)} className="btn-primary w-full py-4 text-base">Create Family Account</button>
          </div>
        </DeviceFrame>
        <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Family Account">
          <div className="space-y-4">
            <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Family Name</label><input value={familyName} onChange={e => setFamilyName(e.target.value)} placeholder="e.g. The Okonkwo Family" className="input-field" /></div>
            <button onClick={handleCreate} disabled={loading || !familyName} className="btn-primary w-full py-4">{loading ? 'Creating…' : 'Create Account'}</button>
          </div>
        </Modal>
      </>
    )
  }

  const members = account.members ?? []

  const content = (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">{account.name}</h1><p className="page-subtitle">{members.length} member{members.length !== 1 ? 's' : ''}</p></div>
        <button onClick={() => fetchFamily()} className="btn-icon bg-gray-100"><RefreshCw size={16} className={cn('text-gray-600', isLoading && 'animate-spin')} /></button>
      </div>

      {/* Shared balance hero */}
      <div className="mx-4 mb-4 bg-brand-gradient rounded-3xl p-5 shadow-float-green relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border-[20px] border-white/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1"><Wallet size={14} className="text-brand-200" /><span className="text-brand-100 text-xs font-semibold">Shared Balance</span></div>
          <p className="font-display font-bold text-white text-3xl mb-3">{formatCurrency(account.sharedBalance)}</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setShowFund(true)} className="flex items-center justify-center gap-2 bg-white text-brand-700 font-bold py-2.5 rounded-2xl hover:bg-brand-50 transition-all text-sm active:scale-95">
              <Plus size={15} /> Add Funds
            </button>
            {isOwner && (
              <button onClick={() => setShowInvite(true)} className="flex items-center justify-center gap-2 bg-white/20 text-white font-bold py-2.5 rounded-2xl hover:bg-white/30 transition-all text-sm active:scale-95">
                <Users size={15} /> Invite Member
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Monthly spend summary */}
      <div className="mx-4 mb-4 bg-white rounded-3xl shadow-card p-4">
        <p className="font-display font-bold text-sm text-gray-900 mb-3">This Month's Spending</p>
        <div className="space-y-2">
          {members.filter(m => m.role !== 'owner').map(m => {
            const pct = m.spendLimit > 0 ? Math.min(100, Math.round(m.spentThisMonth / m.spendLimit * 100)) : 0
            return (
              <div key={m.userId.toString()}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-gray-700 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full text-white text-[10px] flex items-center justify-center font-bold" style={{ background: m.avatarColor }}>{m.initials}</span>
                    {m.name}
                  </span>
                  <span className="text-xs text-gray-600">{formatCurrency(m.spentThisMonth, 'NGN', true)} {m.spendLimit > 0 ? `/ ${formatCurrency(m.spendLimit, 'NGN', true)}` : ''}</span>
                </div>
                {m.spendLimit > 0 && (
                  <div className="progress-bar h-1.5">
                    <div style={{ height:'100%', borderRadius:9999, width:`${pct}%`, background: pct >= 90 ? '#ef4444' : '#16a34a' }} />
                  </div>
                )}
              </div>
            )
          })}
          {members.filter(m => m.role !== 'owner').length === 0 && <p className="text-xs text-gray-400 text-center py-2">Invite family members to start tracking</p>}
        </div>
      </div>

      {/* Members */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <p className="section-label mb-0">Members ({members.length})</p>
          {isOwner && <button onClick={() => setShowInvite(true)} className="text-xs font-bold text-brand-600 flex items-center gap-1"><Plus size={12} />Invite</button>}
        </div>
        <div className="space-y-3">
          {members.map(m => <MemberCard key={m.userId.toString()} member={m} isOwner={isOwner} onSetLimit={(mem) => { setShowLimit(mem); setNewLimit(String(mem.spendLimit)) }} />)}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <AppHeader title="Family Account" showBack />
      <DeviceFrame>{content}</DeviceFrame>

      <Modal isOpen={showInvite} onClose={() => setShowInvite(false)} title="Invite Family Member">
        <div className="space-y-4">
          <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Full Name</label><input value={invName} onChange={e => setInvName(e.target.value)} placeholder="Member's full name" className="input-field" /></div>
          <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Email Address</label><input value={invEmail} onChange={e => setInvEmail(e.target.value)} type="email" placeholder="member@email.com" className="input-field" /></div>
          <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Monthly Spend Limit (₦) <span className="font-normal text-gray-400">optional</span></label><input value={invLimit} onChange={e => setInvLimit(e.target.value)} type="number" placeholder="0 = no limit" className="input-field" /></div>
          <button onClick={handleInvite} disabled={loading || !invEmail || !invName} className="btn-primary w-full py-4">{loading ? 'Inviting…' : 'Send Invite'}</button>
        </div>
      </Modal>

      <Modal isOpen={showFund} onClose={() => setShowFund(false)} title="Add Funds to Family">
        <div className="space-y-4">
          <div className="bg-brand-50 rounded-xl px-4 py-3 flex justify-between text-sm"><span className="text-gray-600">Your Wallet</span><span className="font-bold text-brand-700">{formatCurrency(balance)}</span></div>
          <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Amount (₦)</label><input value={fundAmt} onChange={e => setFundAmt(e.target.value)} type="number" placeholder="0.00" className="input-field text-2xl font-bold" /></div>
          {Number(fundAmt) > balance && <p className="text-red-500 text-xs">Insufficient balance</p>}
          <button onClick={handleFund} disabled={loading || !fundAmt || Number(fundAmt) > balance} className="btn-primary w-full py-4">{loading ? 'Adding…' : `Add ${fundAmt ? formatCurrency(Number(fundAmt)) : '—'}`}</button>
        </div>
      </Modal>

      <Modal isOpen={!!showLimit} onClose={() => setShowLimit(null)} title={`Set Limit for ${showLimit?.name ?? ''}`}>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Set a monthly spending cap for this family member. They will be notified when they approach the limit.</p>
          <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Monthly Limit (₦)</label><input value={newLimit} onChange={e => setNewLimit(e.target.value)} type="number" placeholder="0 = no limit" className="input-field text-xl font-bold" /></div>
          <button onClick={handleSetLimit} disabled={loading} className="btn-primary w-full py-4">{loading ? 'Saving…' : 'Update Limit'}</button>
        </div>
      </Modal>
    </>
  )
}
