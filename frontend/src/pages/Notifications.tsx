import { Bell, CheckCheck, Trash2, ArrowDownLeft, Shield, Gift, CheckCircle, TrendingUp, Banknote } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import { useNotificationStore } from '@/store/useNotificationStore'
import { formatDate, cn } from '@/lib/utils'
import type { Notification, NotificationCategory } from '@/types'
import toast from 'react-hot-toast'

const ICON_MAP: Record<string, React.ElementType> = {
  ArrowDownLeft, Shield, Gift, CheckCircle, TrendingUp, Banknote, Bell,
}

const CAT_META: Record<NotificationCategory, { bg: string; color: string; label: string }> = {
  transaction: { bg:'bg-brand-50',  color:'text-brand-600',  label:'Transaction' },
  security:    { bg:'bg-red-50',    color:'text-red-600',    label:'Security'    },
  promo:       { bg:'bg-amber-50',  color:'text-amber-600',  label:'Promo'       },
  system:      { bg:'bg-blue-50',   color:'text-blue-600',   label:'System'      },
  loan:        { bg:'bg-purple-50', color:'text-purple-600', label:'Loan'        },
  investment:  { bg:'bg-teal-50',   color:'text-teal-600',   label:'Investment'  },
}

const PRIORITY_DOT: Record<string, string> = {
  high:   'bg-red-500',
  medium: 'bg-amber-500',
  low:    'bg-gray-300',
}

function NotifItem({ n, onRead, onDelete }: { n: Notification; onRead: (id:string)=>void; onDelete: (id:string)=>void }) {
  const meta = CAT_META[n.category] ?? CAT_META.system
  const Icon = ICON_MAP[n.iconName ?? ''] ?? Bell
  return (
    <div className={cn('flex items-start gap-3 px-4 py-4 border-b border-gray-50 last:border-0 transition-colors group',
      n.isRead ? 'bg-white' : 'bg-brand-50/20')}>
      <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0', meta.bg)}>
        <Icon size={18} className={meta.color}/>
      </div>
      <button onClick={() => onRead(n.id)} className="flex-1 text-left min-w-0">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <p className={cn('text-sm leading-snug', n.isRead?'font-semibold text-gray-700':'font-bold text-gray-900')}>{n.title}</p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {!n.isRead && n.priority && <span className={cn('w-2 h-2 rounded-full flex-shrink-0', PRIORITY_DOT[n.priority]??'bg-gray-300')}/>}
            <span className="text-[10px] text-gray-400 whitespace-nowrap">{formatDate(n.createdAt,'relative')}</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">{n.body}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className={cn('badge text-[9px]', meta.bg, meta.color)}>{meta.label}</span>
        </div>
      </button>
      <button onClick={() => onDelete(n.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-50 flex-shrink-0">
        <Trash2 size={14} className="text-red-400"/>
      </button>
    </div>
  )
}

export default function Notifications() {
  const { notifications, unreadCount, markRead, markAllRead, remove } = useNotificationStore()

  const handleDelete = (id: string) => {
    remove(id)
    toast.success('Notification removed')
  }

  const safeNotifs = notifications ?? []
  const grouped = safeNotifs.reduce((acc, n) => {
    const date = new Date(n.createdAt)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)
    const key = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Yesterday' : 'Earlier'
    if (!acc[key]) acc[key] = []
    acc[key].push(n)
    return acc
  }, {} as Record<string, Notification[]>)

  const content = (
    <div className="page-container">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div>
          <h1 className="font-display font-bold text-xl text-gray-900">Notifications</h1>
          {unreadCount > 0 && <p className="text-xs font-bold text-brand-600 mt-0.5">{unreadCount} unread</p>}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors">
            <CheckCheck size={15}/> All read
          </button>
        )}
      </div>

      {safeNotifs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mb-4"><Bell size={28} className="text-gray-300"/></div>
          <p className="font-bold text-gray-500">All caught up!</p>
          <p className="text-xs text-gray-400 mt-1">New notifications will appear here</p>
        </div>
      ) : (
        <div className="px-4 space-y-4">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <p className="section-label">{group}</p>
              <div className="bg-white rounded-3xl shadow-card overflow-hidden">
                {items.map(n => <NotifItem key={n.id} n={n} onRead={markRead} onDelete={handleDelete}/>)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <>
      <AppHeader title="Notifications" showBack/>
      <DeviceFrame>{content}</DeviceFrame>
    </>
  )
}
