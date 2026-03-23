import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { registerSchema, type RegisterInput } from '@/lib/validators'
import { useAuthStore } from '@/store/useAuthStore'
import api from '@/lib/axios'
import { cn } from '@/lib/utils'

export default function Register() {
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setUser } = useAuthStore()
  const navigate = useNavigate()
  const { register, handleSubmit, watch, formState:{errors} } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })

  const pwd = watch('password') ?? ''
  const pwdStrength = pwd.length===0?0:pwd.length<6?1:pwd.length<10?2:/[A-Z]/.test(pwd)&&/[0-9]/.test(pwd)&&/[!@#$%]/.test(pwd)?4:/[A-Z]/.test(pwd)&&/[0-9]/.test(pwd)?3:2
  const strengthColors = ['','bg-red-400','bg-amber-400','bg-yellow-500','bg-brand-500']
  const strengthLabels = ['','Weak','Fair','Good','Strong']

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true)
    try {
      const res = await api.post('/auth/register', data)
      const { user, accessToken } = res.data.data
      setUser(user, accessToken)
      toast.success(`Welcome to OPay v3, ${user.firstName}! 🎉`)
      navigate('/')
    } catch (err: unknown) {
      toast.error((err as {response?:{data?:{error?:string}}})?.response?.data?.error ?? 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-mesh-green"/>
      <div className="relative w-full max-w-sm animate-fade-up">
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-4">
            <div className="w-16 h-16 bg-brand-gradient rounded-3xl flex items-center justify-center shadow-float-green">
              <span className="text-white font-display font-bold text-2xl">O</span>
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center"><Sparkles size={10} className="text-white"/></div>
          </div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Create account</h1>
          <p className="text-gray-500 text-sm mt-0.5">Join millions using OPay v3</p>
        </div>

        <div className="bg-white rounded-4xl shadow-float p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">First Name</label>
                <input {...register('firstName')} placeholder="John" className="input-field py-3 text-sm"/>
                {errors.firstName && <p className="text-red-500 text-xs mt-0.5">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Last Name</label>
                <input {...register('lastName')} placeholder="Doe" className="input-field py-3 text-sm"/>
                {errors.lastName && <p className="text-red-500 text-xs mt-0.5">{errors.lastName.message}</p>}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
              <input {...register('email')} type="email" placeholder="you@example.com" className="input-field py-3 text-sm"/>
              {errors.email && <p className="text-red-500 text-xs mt-0.5">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
              <input {...register('phone')} type="tel" placeholder="08012345678" className="input-field py-3 text-sm"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input {...register('password')} type={showPwd?'text':'password'} placeholder="Min. 8 characters" className="input-field py-3 text-sm pr-11"/>
                <button type="button" onClick={()=>setShowPwd(v=>!v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPwd?<EyeOff size={16}/>:<Eye size={16}/>}
                </button>
              </div>
              {pwd.length>0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">{[1,2,3,4].map(l=><div key={l} className={cn('flex-1 h-1.5 rounded-full transition-all',l<=pwdStrength?strengthColors[pwdStrength]:'bg-gray-100')}/>)}</div>
                  <p className={cn('text-xs font-bold',pwdStrength>=3?'text-brand-600':pwdStrength>=2?'text-amber-500':'text-red-500')}>{strengthLabels[pwdStrength]}</p>
                </div>
              )}
              {errors.password && <p className="text-red-500 text-xs mt-0.5">{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Referral Code <span className="text-gray-400 font-normal">(optional)</span></label>
              <input {...register('referredBy')} placeholder="e.g. ABC12345" className="input-field py-3 text-sm uppercase font-mono tracking-widest"/>
            </div>
            <p className="text-xs text-gray-400 text-center">By registering you agree to our <a href="#" className="text-brand-600 hover:underline">Terms</a> & <a href="#" className="text-brand-600 hover:underline">Privacy</a></p>
            <button type="submit" disabled={loading} className="btn-primary w-full py-4 flex items-center justify-center gap-2">
              {loading
                ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>
                : <><CheckCircle2 size={18}/><span>Create Account</span><ArrowRight size={18}/></>}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{' '}<Link to="/login" className="text-brand-600 font-bold hover:text-brand-700">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
