import { useState } from 'react'
import { Shield, CheckCircle2, Lock, Upload, Camera, ChevronRight, AlertCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import { useAuthStore } from '@/store/useAuthStore'
import { kycSchema, type KYCInput } from '@/lib/validators'
import { cn, sleep } from '@/lib/utils'
import toast from 'react-hot-toast'

const TIERS = [
  { level:1, name:'Tier 1 – Basic',    limit:'₦50,000/day',  requires:['BVN or NIN verification'],                    color:'bg-brand-50 border-brand-200 text-brand-700' },
  { level:2, name:'Tier 2 – Standard', limit:'₦200,000/day', requires:['Tier 1 complete','Government ID','Selfie photo'], color:'bg-blue-50 border-blue-200 text-blue-700'   },
  { level:3, name:'Tier 3 – Premium',  limit:'₦5,000,000/day',requires:['Tier 2 complete','Proof of address','Video verification'], color:'bg-purple-50 border-purple-200 text-purple-700' },
]

const DOC_TYPES = [
  {value:'bvn',            label:'BVN (Bank Verification Number)'},
  {value:'nin',            label:'NIN (National ID Number)'},
  {value:'passport',       label:"International Passport"},
  {value:'drivers_license',label:"Driver's License"},
  {value:'voters_card',    label:"Voter's Card"},
]

export default function KYC() {
  const { user, updateUser } = useAuthStore()
  const currentLevel = user?.kycLevel ?? 0
  const [activeLevel, setActiveLevel] = useState<1|2|3>(currentLevel<3 ? (currentLevel+1) as 1|2|3 : 3)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState:{errors} } = useForm<KYCInput>({ resolver: zodResolver(kycSchema) })

  const onSubmit = async (data: KYCInput) => {
    setLoading(true)
    await sleep(2000)
    updateUser({ kycLevel: activeLevel as 0|1|2|3 })
    toast.success(`Tier ${activeLevel} verification submitted! Under review.`)
    setLoading(false)
  }

  const content = (
    <div className="page-container">
      <div className="px-4 pt-4 pb-3">
        <h1 className="font-display font-bold text-xl text-gray-900">Identity Verification</h1>
        <p className="text-gray-400 text-sm mt-0.5">Unlock higher limits with KYC</p>
      </div>

      {/* Current level card */}
      <div className="mx-4 mb-4 bg-brand-gradient rounded-3xl p-5 relative overflow-hidden shadow-float-green">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border-[20px] border-white/10"/>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center"><Shield size={28} className="text-white"/></div>
          <div>
            <p className="text-white/70 text-xs font-semibold">Current KYC Level</p>
            <p className="font-display font-bold text-white text-2xl">Tier {currentLevel}</p>
            <p className="text-brand-200 text-xs">Transaction limit: {currentLevel===0?'₦20,000':currentLevel===1?'₦50,000':currentLevel===2?'₦200,000':'₦5,000,000'}/day</p>
          </div>
        </div>
        <div className="relative z-10 mt-4 flex gap-1.5">
          {[1,2,3].map(l=>(
            <div key={l} className={cn('flex-1 h-2 rounded-full transition-all',l<=currentLevel?'bg-white':'bg-white/25')}/>
          ))}
        </div>
      </div>

      {/* Tier cards */}
      <div className="px-4 mb-5 space-y-3">
        {TIERS.map(tier => {
          const done = currentLevel >= tier.level
          const current = currentLevel === tier.level - 1
          return (
            <button key={tier.level} onClick={() => setActiveLevel(tier.level as 1|2|3)}
              className={cn('w-full rounded-3xl p-4 text-left border-2 transition-all',
                done?'bg-brand-50 border-brand-200 opacity-80':
                activeLevel===tier.level?'bg-white border-brand-400 shadow-card-hover':'bg-white border-gray-100 shadow-card hover:border-gray-200')}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {done ? <CheckCircle2 size={20} className="text-brand-600"/> : <div className={cn('w-5 h-5 rounded-full border-2',current?'border-brand-500':'border-gray-300')}/>}
                  <p className="font-bold text-sm text-gray-900">{tier.name}</p>
                </div>
                <span className="badge badge-green text-[10px]">{tier.limit}</span>
              </div>
              <div className="space-y-1 ml-8">
                {tier.requires.map(r=><p key={r} className="text-xs text-gray-500 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0"/>{r}</p>)}
              </div>
            </button>
          )
        })}
      </div>

      {/* Verification form */}
      {currentLevel < 3 && (
        <div className="px-4">
          <p className="font-display font-bold text-gray-900 mb-3">Submit Tier {activeLevel} Verification</p>
          <div className="bg-white rounded-3xl shadow-card p-5">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Document Type</label>
                <select {...register('docType')} className="input-field bg-white">
                  {DOC_TYPES.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
                {errors.docType && <p className="text-red-500 text-xs mt-1">{errors.docType.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Document Number</label>
                <input {...register('docNumber')} placeholder="Enter document number" className="input-field font-mono tracking-widest"/>
                {errors.docNumber && <p className="text-red-500 text-xs mt-1">{errors.docNumber.message}</p>}
              </div>
              {activeLevel >= 2 && (
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center gap-3 hover:border-brand-300 transition-colors cursor-pointer">
                  <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center"><Camera size={22} className="text-brand-600"/></div>
                  <div className="text-center"><p className="text-sm font-bold text-gray-700">Upload Selfie</p><p className="text-xs text-gray-400">Take a clear photo of your face</p></div>
                  <button type="button" className="badge badge-green">Take Photo</button>
                </div>
              )}
              <div className="flex items-start gap-2 bg-amber-50 rounded-xl p-3">
                <AlertCircle size={15} className="text-amber-600 flex-shrink-0 mt-0.5"/>
                <p className="text-xs text-amber-700">Your data is encrypted and processed securely per CBN guidelines.</p>
              </div>
              <button type="submit" disabled={loading || currentLevel>=activeLevel} className="btn-primary w-full py-3.5">
                {loading?<div className="flex items-center justify-center gap-2"><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Submitting…</div>
                :currentLevel>=activeLevel?'Already Verified ✓':'Submit Verification'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      <AppHeader title="KYC Verification" showBack/>
      <DeviceFrame>{content}</DeviceFrame>
    </>
  )
}
