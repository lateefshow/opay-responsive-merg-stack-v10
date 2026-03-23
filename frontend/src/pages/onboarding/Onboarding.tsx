import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Shield, Zap, TrendingUp, Gift } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { cn } from '@/lib/utils'

const SLIDES = [
  { icon:Zap,         color:'bg-brand-600',   title:'Instant Transfers',    body:'Send money to any OPay user in seconds. No queues, no delays — just tap and done.', gradient:'from-brand-600 to-brand-700' },
  { icon:TrendingUp,  color:'bg-blue-600',     title:'Grow Your Wealth',     body:'Earn up to 19% p.a. with Treasury Bills, Fixed Income and OWealth savings products.', gradient:'from-blue-600 to-indigo-700' },
  { icon:Shield,      color:'bg-purple-600',   title:'Bank-Grade Security',  body:'CBN licensed, NDIC insured. Biometric authentication and 2FA protect every naira.', gradient:'from-purple-600 to-violet-700' },
  { icon:Gift,        color:'bg-amber-500',    title:'Earn as You Spend',    body:'Collect reward points on every transaction. Refer friends and earn ₦3,000 per referral.', gradient:'from-amber-500 to-orange-600' },
]

export default function Onboarding() {
  const [slide, setSlide] = useState(0)
  const { setOnboardingComplete } = useAuthStore()
  const navigate = useNavigate()
  const cur = SLIDES[slide]
  const Icon = cur.icon

  const finish = () => { setOnboardingComplete(true); navigate('/') }
  const next = () => slide < SLIDES.length-1 ? setSlide(s=>s+1) : finish()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Skip */}
      <div className="flex justify-end p-4">
        <button onClick={finish} className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors px-3 py-1.5 rounded-xl hover:bg-gray-100">Skip</button>
      </div>

      {/* Illustration */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-8">
        <div className={cn('w-32 h-32 rounded-4xl bg-gradient-to-br flex items-center justify-center shadow-float mb-8 animate-float', `${cur.gradient}`)}>
          <Icon size={56} className="text-white" strokeWidth={1.5}/>
        </div>

        <div className="text-center animate-onboard-slide">
          <h1 className="font-display font-bold text-3xl text-gray-900 mb-4 leading-tight">{cur.title}</h1>
          <p className="text-gray-500 text-base leading-relaxed max-w-sm">{cur.body}</p>
        </div>
      </div>

      {/* Dots + nav */}
      <div className="px-8 pb-12 space-y-6">
        <div className="flex justify-center gap-2">
          {SLIDES.map((_,i)=>(
            <button key={i} onClick={()=>setSlide(i)}
              className={cn('rounded-full transition-all duration-300', i===slide?'w-8 h-2.5 bg-brand-600':'w-2.5 h-2.5 bg-gray-200 hover:bg-gray-300')}/>
          ))}
        </div>
        <button onClick={next} className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2">
          {slide===SLIDES.length-1 ? 'Get Started' : 'Continue'}
          <ArrowRight size={18}/>
        </button>
        {slide===0 && (
          <p className="text-center text-xs text-gray-400">Already have an account? <button onClick={()=>navigate('/login')} className="text-brand-600 font-bold hover:underline">Sign In</button></p>
        )}
      </div>
    </div>
  )
}
