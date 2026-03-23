import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, ArrowRight, Fingerprint, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { loginSchema, type LoginInput } from '@/lib/validators'
import { useAuthStore } from '@/store/useAuthStore'
import api from '@/lib/axios'

export default function Login() {
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setUser } = useAuthStore()
  const navigate = useNavigate()
  const { register, handleSubmit, formState:{errors} } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginInput) => {
    setLoading(true)
    try {
      const res = await api.post('/auth/login', data)
      const { user, accessToken } = res.data.data
      setUser(user, accessToken)
      toast.success(`Welcome back, ${user.firstName}! 👋`)
      navigate('/')
    } catch (err: unknown) {
      toast.error((err as {response?:{data?:{error?:string}}})?.response?.data?.error ?? 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Background */}
      <div className="absolute inset-0 bg-mesh-green"/>
      <div className="absolute top-0 left-0 right-0 h-64 bg-brand-gradient opacity-10"/>

      <div className="relative w-full max-w-sm animate-fade-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="w-20 h-20 bg-brand-gradient rounded-4xl flex items-center justify-center shadow-float-green animate-float">
              <span className="text-white font-display font-bold text-4xl">O</span>
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow-float-gold">
              <Sparkles size={12} className="text-white"/>
            </div>
          </div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Premium Banking · v3</p>
        </div>

        <div className="bg-white rounded-4xl shadow-float p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Email Address</label>
              <input {...register('email')} type="email" placeholder="you@example.com" autoComplete="email" className="input-field"/>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input {...register('password')} type={showPwd?'text':'password'} placeholder="Your password" autoComplete="current-password" className="input-field pr-11"/>
                <button type="button" onClick={()=>setShowPwd(v=>!v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPwd?<EyeOff size={18}/>:<Eye size={18}/>}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm font-bold text-brand-600 hover:text-brand-700">Forgot password?</Link>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-base">
              {loading
                ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>
                : <><span>Sign In</span><ArrowRight size={18}/></>}
            </button>
          </form>
          <div className="flex items-center gap-3 my-4"><div className="flex-1 h-px bg-gray-100"/><span className="text-xs text-gray-400 font-semibold">OR</span><div className="flex-1 h-px bg-gray-100"/></div>
          <button className="flex items-center justify-center gap-2 w-full py-4 border-2 border-gray-100 rounded-2xl text-gray-600 font-bold text-sm hover:bg-gray-50 hover:border-brand-200 transition-all active:scale-[0.98]">
            <Fingerprint size={20} className="text-brand-600"/> Sign in with Biometrics
          </button>
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-600 font-bold hover:text-brand-700">Create one</Link>
        </p>
      </div>
    </div>
  )
}
