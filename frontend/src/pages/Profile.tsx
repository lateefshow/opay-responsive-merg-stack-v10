import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Mail, Phone, Shield, Copy, LogOut, ChevronRight,
  Camera, Edit3, Star, CheckCircle2, Lock, Key, Smartphone
} from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import Modal from '@/components/modals/Modal'
import ProgressRing from '@/components/ui/ProgressRing'
import { useAuthStore } from '@/store/useAuthStore'
import { useWalletStore } from '@/store/useWalletStore'
import { useSavingsStore } from '@/store/useSavingsStore'
import { useInvestmentStore } from '@/store/useInvestmentStore'
import { settingsProfileSchema, type SettingsProfileInput } from '@/lib/validators'
import { getInitials, formatCurrency, formatDate, percentage, cn, sleep } from '@/lib/utils'
import toast from 'react-hot-toast'

const KYC_LABELS = ['Unverified','Tier 1 – Basic','Tier 2 – Standard','Tier 3 – Premium']
const KYC_LIMITS = ['₦20K/day','₦50K/day','₦200K/day','₦5M/day']
const KYC_COLORS = ['#ef4444','#f59e0b','#3b82f6','#16a34a']

export default function Profile() {
  const { user, logout, updateUser } = useAuthStore()
  const { balance } = useWalletStore()
  const { plans } = useSavingsStore()
  const { totalValue } = useInvestmentStore()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)
  const [showEdit,   setShowEdit]   = useState(false)
  const [saving,     setSaving]     = useState(false)

  const { register, handleSubmit, formState:{errors} } = useForm<SettingsProfileInput>({
    resolver: zodResolver(settingsProfileSchema),
    defaultValues: { firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', phone: user?.phone ?? '' },
  })

  const kycLevel = user?.kycLevel ?? 0
  const kycPct   = (kycLevel / 3) * 100
  const totalSavings = (plans ?? []).reduce((s,p)=>s+p.currentAmount,0)
  const netWorth     = balance + totalSavings + totalValue()

  const onSaveProfile = async (data: SettingsProfileInput) => {
    setSaving(true)
    await sleep(800)
    updateUser({ firstName: data.firstName, lastName: data.lastName, phone: data.phone })
    toast.success('Profile updated!')
    setSaving(false)
    setShowEdit(false)
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
    navigate('/login')
  }

  const menuSections = [
    {
      title: 'Security',
      items: [
        { icon:Lock,        label:'Change Password',   sub:'Update your password',          to:'/settings' },
        { icon:Key,         label:'Set Transaction PIN',sub:'4-digit authorization PIN',    to:'/settings' },
        { icon:Shield,      label:'Two-Factor Auth',   sub:user?.twoFactorEnabled?'Enabled':'Disabled', to:'/settings' },
        { icon:Smartphone,  label:'Biometrics',        sub:'Face ID or fingerprint',        to:'/settings' },
      ],
    },
    {
      title: 'Verification',
      items: [
        { icon:CheckCircle2, label:'KYC Verification', sub:`${KYC_LABELS[kycLevel]} · ${KYC_LIMITS[kycLevel]}`, to:'/kyc' },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon:Star,  label:'Rate OPay v3',    sub:'Share your feedback', to:'/support' },
      ],
    },
  ]

  const content = (
    <div className="page-container">
      {/* Hero banner */}
      <div className="relative">
        <div className="h-32 bg-brand-gradient relative overflow-hidden">
          <div className="absolute bg-card-shine inset-0"/>
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border-[20px] border-white/10"/>
          <div className="absolute -left-4 bottom-0 w-24 h-24 rounded-full border-[12px] border-white/10"/>
        </div>
        <div className="px-4 -mt-12 pb-4">
          <div className="relative inline-block mb-3">
            <div className="w-24 h-24 rounded-full bg-white ring-4 ring-white shadow-float flex items-center justify-center overflow-hidden">
              {user?.avatarUrl
                ? <img src={user.avatarUrl} className="w-full h-full object-cover" alt="avatar"/>
                : <div className="w-full h-full bg-brand-gradient flex items-center justify-center">
                    <span className="text-white font-display font-bold text-2xl">{user ? getInitials(user.firstName,user.lastName) : 'U'}</span>
                  </div>
              }
            </div>
            <button className="absolute bottom-1 right-1 w-7 h-7 bg-brand-600 rounded-full flex items-center justify-center shadow-lg hover:bg-brand-700 transition-colors active:scale-95">
              <Camera size={13} className="text-white"/>
            </button>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display font-bold text-2xl text-gray-900">{user?.firstName} {user?.lastName}</h2>
                {user?.isVerified && <span className="badge badge-green text-[10px]"><Shield size={9}/> Verified</span>}
              </div>
              <p className="text-gray-400 text-sm mt-0.5">{user?.email}</p>
              {user?.createdAt && <p className="text-xs text-gray-300 mt-0.5">Member since {formatDate(user.createdAt,'short')}</p>}
            </div>
            <button onClick={() => setShowEdit(true)}
              className="flex items-center gap-1.5 text-brand-600 text-sm font-bold hover:text-brand-700 transition-colors mt-1">
              <Edit3 size={14}/> Edit
            </button>
          </div>
        </div>
      </div>

      {/* Net worth card */}
      <div className="mx-4 mb-4 bg-brand-gradient rounded-3xl p-4 relative overflow-hidden shadow-float-green">
        <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full border-[16px] border-white/10"/>
        <div className="relative z-10">
          <p className="text-brand-100 text-xs font-semibold mb-0.5">Total Net Worth</p>
          <p className="font-display font-bold text-white text-2xl">{formatCurrency(netWorth)}</p>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[{label:'Wallet',val:balance},{label:'Savings',val:totalSavings},{label:'Invested',val:totalValue()}].map(({label,val})=>(
              <div key={label} className="bg-white/15 rounded-xl p-2 text-center">
                <p className="text-white/60 text-[9px] font-semibold">{label}</p>
                <p className="text-white font-bold text-xs">{formatCurrency(val,'NGN',true)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KYC level */}
      <div className="mx-4 mb-4 bg-white rounded-3xl shadow-card p-4">
        <div className="flex items-center gap-4">
          <ProgressRing value={kycPct} size={72} stroke={7} color={KYC_COLORS[kycLevel]}>
            <span className="text-xs font-bold" style={{color:KYC_COLORS[kycLevel]}}>{kycLevel}/3</span>
          </ProgressRing>
          <div className="flex-1">
            <p className="font-bold text-sm text-gray-900">{KYC_LABELS[kycLevel]}</p>
            <p className="text-xs text-gray-400 mt-0.5">Limit: {KYC_LIMITS[kycLevel]}</p>
            {kycLevel < 3 && (
              <button onClick={() => navigate('/kyc')} className="mt-2 text-xs font-bold text-brand-600 hover:text-brand-700">
                Upgrade to Tier {kycLevel+1} →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Referral */}
      <div className="mx-4 mb-4 bg-brand-50 border border-brand-100 rounded-3xl p-4 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 mb-0.5">Referral Code</p>
          <p className="font-mono font-bold text-gray-900 text-xl tracking-widest">{user?.referralCode ?? '—'}</p>
        </div>
        <button onClick={() => { navigator.clipboard.writeText(user?.referralCode ?? ''); toast.success('Copied!') }}
          className="flex items-center gap-1.5 bg-brand-600 text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-brand-700 transition-colors active:scale-95">
          <Copy size={13}/> Copy
        </button>
      </div>

      {/* Menu sections */}
      {menuSections.map(({ title, items }) => (
        <div key={title} className="mx-4 mb-4">
          <p className="section-label">{title}</p>
          <div className="bg-white rounded-3xl shadow-card overflow-hidden">
            {items.map(({ icon:Icon, label, sub, to }, idx) => (
              <button key={label} onClick={() => navigate(to)}
                className={cn('flex items-center gap-3 w-full px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left', idx < items.length-1 && 'border-b border-gray-50')}>
                <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-brand-600"/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400">{sub}</p>
                </div>
                <ChevronRight size={15} className="text-gray-300"/>
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="mx-4 mb-6">
        <button onClick={handleLogout} disabled={loggingOut}
          className="btn-danger w-full py-3.5 flex items-center justify-center gap-2">
          <LogOut size={18}/>{loggingOut?'Signing out…':'Sign Out'}
        </button>
      </div>
    </div>
  )

  return (
    <>
      <AppHeader title="Profile"/>
      <DeviceFrame>{content}</DeviceFrame>
      <Modal isOpen={showEdit} onClose={()=>setShowEdit(false)} title="Edit Profile">
        <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-bold text-gray-700 mb-1">First Name</label><input {...register('firstName')} className="input-field py-3 text-sm"/>{errors.firstName&&<p className="text-red-500 text-xs mt-0.5">{errors.firstName.message}</p>}</div>
            <div><label className="block text-xs font-bold text-gray-700 mb-1">Last Name</label><input {...register('lastName')} className="input-field py-3 text-sm"/>{errors.lastName&&<p className="text-red-500 text-xs mt-0.5">{errors.lastName.message}</p>}</div>
          </div>
          <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Phone Number</label><input {...register('phone')} type="tel" placeholder="08012345678" className="input-field"/>{errors.phone&&<p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}</div>
          <button type="submit" disabled={saving} className="btn-primary w-full py-3.5">{saving?'Saving…':'Save Changes'}</button>
        </form>
      </Modal>
    </>
  )
}
