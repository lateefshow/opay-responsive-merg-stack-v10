import { create } from 'zustand'
import type { Notification } from '@/types'

const MOCK: Notification[] = [
  { id:'1',userId:'',title:'Transfer Received',body:'You received ₦150,000 from Chidi Okeke',category:'transaction',isRead:false,iconName:'ArrowDownLeft',priority:'high',createdAt:new Date(Date.now()-120000).toISOString() },
  { id:'2',userId:'',title:'Investment Matured! 🎉',body:'Your Treasury Bill investment of ₦100,000 has matured with ₦8,500 interest',category:'investment',isRead:false,iconName:'TrendingUp',priority:'high',createdAt:new Date(Date.now()-3600000).toISOString() },
  { id:'3',userId:'',title:'Loan Pre-Approved',body:'Congratulations! You are pre-approved for up to ₦500,000 QuickLoan',category:'loan',isRead:false,iconName:'CheckCircle',priority:'medium',createdAt:new Date(Date.now()-7200000).toISOString() },
  { id:'4',userId:'',title:'Security Alert',body:'New login from Lagos, NG on Chrome browser',category:'security',isRead:true,iconName:'Shield',priority:'high',createdAt:new Date(Date.now()-86400000).toISOString() },
  { id:'5',userId:'',title:'Earn ₦3,000 bonus!',body:'Refer a friend and earn instantly',category:'promo',isRead:true,iconName:'Gift',priority:'low',createdAt:new Date(Date.now()-172800000).toISOString() },
]

interface State {
  notifications: Notification[]; unreadCount: number
  markRead: (id:string)=>void; markAllRead: ()=>void; add: (n:Notification)=>void; remove: (id:string)=>void
}
export const useNotificationStore = create<State>((set) => ({
  notifications: MOCK, unreadCount: MOCK.filter(n=>!n.isRead).length,
  markRead: (id) => set(s => { const ns = s.notifications.map(n=>n.id===id?{...n,isRead:true}:n); return { notifications:ns, unreadCount:ns.filter(n=>!n.isRead).length } }),
  markAllRead: () => set(s => ({ notifications:s.notifications.map(n=>({...n,isRead:true})), unreadCount:0 })),
  add: (n) => set(s => ({ notifications:[n,...s.notifications], unreadCount:s.unreadCount+(n.isRead?0:1) })),
  remove: (id) => set(s => { const ns=s.notifications.filter(n=>n.id!==id); return { notifications:ns, unreadCount:ns.filter(n=>!n.isRead).length } }),
}))
