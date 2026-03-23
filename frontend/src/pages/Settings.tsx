import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Moon, Sun, Bell, Shield, Fingerprint, HelpCircle, FileText,
  Star, LogOut, ChevronRight, User, Palette, Key, Globe,
  Lock, Eye, EyeOff
} from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import Modal from '@/components/modals/Modal'
import PinPad from '@/components/common/PinPad'
import { usePinPad } from '@/hooks/usePinPad'
import { useAuthStore } from '@/store/useAuthStore'
import { useThemeStore } from '@/store/useThemeStore'
import { cn, sleep } from '@/lib/utils'
import toast from 'react-hot-toast'

function ToggleSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      className={cn('relative w-12 h-6 rounded-full transition-all duration-300', on?'bg-brand-600':'bg-gray-200')}>
      <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300', on?'left-6':'left-0.5')}/>
    </button>
  )
}

export default function Settings() {
  const { logout, user } = useAuthStore()
  const { isDark, toggleTheme } = useThemeStore()
  const navigate = useNavigate()
  const [loggingOut,    setLoggingOut]    = useState(false)
  const [showSetPin,    setShowSetPin]    = useState(false)
  const [pinStep,       setPinStep]       = useState<'enter'|'confirm'>('enter')
  const [firstPin,      setFirstPin]      = useState('')
  const [notifications, setNotifications] = useState({ push:true, email:true, sms:false, transactions:true, promos:false })
  const [privacy,       setPrivacy]       = useState({ showBalance:true, twoFactor:false })

  const { digits, pin, complete, append, backspace, reset } = usePinPad(4)

  const handlePinDigit = (d: string) => {
    append(d)
    if (digits.length === 3) {
      const finalPin = [...digits, d].join('')
      if (pinStep === 'enter') {
        setFirstPin(finalPin); reset(); setPinStep('confirm')
      } else {
        if (finalPin === firstPin) {
          toast.success('PIN set successfully! 🔐')
          setShowSetPin(false); setPinStep('enter'); setFirstPin(''); reset()
        } else {
          toast.error('PINs do not match'); reset(); setPinStep('enter'); setFirstPin('')
        }
      }
    }
  }

  const handleLogout = async () => { setLoggingOut(true); await logout(); navigate('/login') }

  const notifItems = [
    { key:'push',         label:'Push Notifications', sub:'Alerts on your device' },
    { key:'email',        label:'Email Alerts',        sub:'Sent to your email'   },
    { key:'sms',          label:'SMS Alerts',          sub:'Text messages'        },
    { key:'transactions', label:'Transaction Alerts',  sub:'Every debit/credit'   },
    { key:'promos',       label:'Promotions',          sub:'Deals and offers'     },
  ]

  const content = (
    <div className="page-container">
      <div className="px-4 pt-4 pb-3">
        <h1 className="font-display font-bold text-xl text-gray-900">Settings</h1>
        <p className="text-gray-400 text-sm mt-0.5">Manage your preferences</p>
      </div>

      {/* Appearance */}
      <div className="mx-4 mb-4">
        <p className="section-label">Appearance</p>
        <div className="bg-white rounded-3xl shadow-card overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-4">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', isDark?'bg-gray-800':'bg-amber-50')}>
              {isDark ? <Moon size={16} className="text-indigo-400"/> : <Sun size={16} className="text-amber-500"/>}
            </div>
            <div className="flex-1"><p className="text-sm font-bold text-gray-900">{isDark?'Dark Mode':'Light Mode'}</p><p className="text-xs text-gray-400">Toggle theme</p></div>
            <ToggleSwitch on={isDark} onToggle={toggleTheme}/>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="mx-4 mb-4">
        <p className="section-label">Security</p>
        <div className="bg-white rounded-3xl shadow-card overflow-hidden">
          {[
            { icon:Key,         label:'Set / Change PIN',       sub:'4-digit transaction PIN',  onClick:()=>setShowSetPin(true)    },
            { icon:Lock,        label:'Change Password',        sub:'Update login password',    onClick:()=>toast('Coming soon!')  },
            { icon:Fingerprint, label:'Biometric Login',        sub:'Fingerprint or Face ID',   onClick:()=>toast('Coming soon!')  },
            { icon:Shield,      label:'Two-Factor Authentication', sub:privacy.twoFactor?'Enabled':'Disabled', onClick:()=>{setPrivacy(p=>({...p,twoFactor:!p.twoFactor}));toast(privacy.twoFactor?'2FA disabled':'2FA enabled')} },
          ].map(({ icon:Icon, label, sub, onClick }, idx, arr) => (
            <button key={label} onClick={onClick}
              className={cn('flex items-center gap-3 w-full px-4 py-4 hover:bg-gray-50 transition-colors text-left', idx<arr.length-1&&'border-b border-gray-50')}>
              <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0"><Icon size={16} className="text-brand-600"/></div>
              <div className="flex-1"><p className="text-sm font-bold text-gray-900">{label}</p><p className="text-xs text-gray-400">{sub}</p></div>
              <ChevronRight size={15} className="text-gray-300"/>
            </button>
          ))}
        </div>
      </div>

      {/* Privacy */}
      <div className="mx-4 mb-4">
        <p className="section-label">Privacy</p>
        <div className="bg-white rounded-3xl shadow-card overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-50">
            <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center"><Eye size={16} className="text-brand-600"/></div>
            <div className="flex-1"><p className="text-sm font-bold text-gray-900">Show Balance</p><p className="text-xs text-gray-400">Display balance on home screen</p></div>
            <ToggleSwitch on={privacy.showBalance} onToggle={()=>setPrivacy(p=>({...p,showBalance:!p.showBalance}))}/>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="mx-4 mb-4">
        <p className="section-label">Notifications</p>
        <div className="bg-white rounded-3xl shadow-card overflow-hidden">
          {notifItems.map(({ key, label, sub }, idx) => (
            <div key={key} className={cn('flex items-center gap-3 px-4 py-4', idx<notifItems.length-1&&'border-b border-gray-50')}>
              <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center"><Bell size={16} className="text-brand-600"/></div>
              <div className="flex-1"><p className="text-sm font-bold text-gray-900">{label}</p><p className="text-xs text-gray-400">{sub}</p></div>
              <ToggleSwitch on={notifications[key as keyof typeof notifications]} onToggle={()=>setNotifications(p=>({...p,[key]:!p[key as keyof typeof notifications]}))}/>
            </div>
          ))}
        </div>
      </div>

      {/* Support + Legal */}
      <div className="mx-4 mb-4">
        <p className="section-label">Support & Legal</p>
        <div className="bg-white rounded-3xl shadow-card overflow-hidden">
          {[
            { icon:HelpCircle, label:'Help & Support', onClick:()=>navigate('/support') },
            { icon:FileText,   label:'Terms & Privacy', onClick:()=>toast('Coming soon!') },
            { icon:Globe,      label:'Language',         onClick:()=>toast('Coming soon!') },
            { icon:Star,       label:'Rate OPay v3',     onClick:()=>toast('Thanks for the feedback! ⭐') },
          ].map(({ icon:Icon, label, onClick }, idx, arr) => (
            <button key={label} onClick={onClick}
              className={cn('flex items-center gap-3 w-full px-4 py-4 hover:bg-gray-50 transition-colors text-left', idx<arr.length-1&&'border-b border-gray-50')}>
              <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center"><Icon size={16} className="text-gray-500"/></div>
              <span className="flex-1 text-sm font-bold text-gray-900">{label}</span>
              <ChevronRight size={15} className="text-gray-300"/>
            </button>
          ))}
        </div>
      </div>

      <div className="mx-4 mb-4">
        <button onClick={handleLogout} disabled={loggingOut}
          className="btn-danger w-full py-3.5 flex items-center justify-center gap-2">
          <LogOut size={18}/>{loggingOut?'Signing out…':'Sign Out'}
        </button>
      </div>
      <p className="text-center text-xs text-gray-300 pb-4">OPay v3.0.0 · Built with ❤️</p>
    </div>
  )

  return (
    <>
      <AppHeader title="Settings" showBack/>
      <DeviceFrame>{content}</DeviceFrame>
      <Modal isOpen={showSetPin} onClose={()=>{setShowSetPin(false);setPinStep('enter');setFirstPin('');reset()}} className="sm:max-w-xs">
        <div className="py-4">
          <PinPad digits={digits} length={4} onAppend={handlePinDigit} onBackspace={backspace}
            title={pinStep==='enter'?'Set Your PIN':'Confirm PIN'}
            subtitle={pinStep==='enter'?'Choose a 4-digit transaction PIN':'Re-enter your PIN to confirm'}/>
        </div>
      </Modal>
    </>
  )
}
