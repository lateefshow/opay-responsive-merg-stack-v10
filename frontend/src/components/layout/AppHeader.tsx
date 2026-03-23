import React from 'react'
import { Smartphone, Tablet, Monitor, Bell, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useDeviceViewStore, type DeviceView } from '@/store/useDeviceViewStore'
import { useNotificationStore } from '@/store/useNotificationStore'

export function DeviceToggle({ className }: { className?: string }) {
  const { view, setView } = useDeviceViewStore()
  const btns: { id: DeviceView; icon: React.ReactNode; label: string }[] = [
    { id:'mobile',  icon:<Smartphone size={14}/>, label:'Mobile'  },
    { id:'tablet',  icon:<Tablet     size={14}/>, label:'Tablet'  },
    { id:'desktop', icon:<Monitor    size={14}/>, label:'Desktop' },
  ]
  return (
    <div className={cn('flex items-center gap-0.5 bg-gray-100 rounded-xl p-1', className)}>
      {btns.map(({ id, icon, label }) => (
        <button key={id} title={label} onClick={() => setView(id)}
          className={cn('flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200',
            view===id ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-400 hover:text-gray-700')}>
          {icon}<span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}

interface AppHeaderProps {
  title?: string; showBack?: boolean; rightSlot?: React.ReactNode
  transparent?: boolean; sticky?: boolean; onBack?: () => void
}
export default function AppHeader({ title, showBack, rightSlot, transparent, sticky=true, onBack }: AppHeaderProps) {
  const { unreadCount } = useNotificationStore()
  const navigate = useNavigate()
  return (
    <header className={cn('z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 transition-all', sticky && 'sticky top-0', transparent && 'bg-transparent border-transparent')}>
      <div className="flex items-center justify-between px-4 py-3 max-w-screen-2xl mx-auto gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {showBack ? (
            <button onClick={onBack ?? (() => navigate(-1))} className="w-9 h-9 rounded-2xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 active:scale-95 transition-all">
              <ArrowLeft size={17} className="text-gray-700"/>
            </button>
          ) : (
            <div className="w-9 h-9 bg-brand-gradient rounded-2xl flex items-center justify-center shadow-float-green">
              <span className="text-white font-display font-bold text-sm">O</span>
            </div>
          )}
          {title && <h1 className="font-display font-bold text-gray-900 text-lg truncate">{title}</h1>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {rightSlot}
          <button onClick={() => navigate('/notifications')} className="relative w-9 h-9 rounded-2xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 active:scale-95 transition-all">
            <Bell size={16} className="text-gray-600"/>
            {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">{unreadCount>9?'9+':unreadCount}</span>}
          </button>
          <DeviceToggle/>
        </div>
      </div>
    </header>
  )
}
