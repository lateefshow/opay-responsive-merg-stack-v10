import { NavLink } from 'react-router-dom'
import { Home, Gift, BarChart2, CreditCard, User } from 'lucide-react'
import { cn } from '@/lib/utils'
const navItems = [{to:'/',icon:Home,label:'Home'},{to:'/rewards',icon:Gift,label:'Rewards'},{to:'/finance',icon:BarChart2,label:'Finance'},{to:'/cards',icon:CreditCard,label:'Cards'},{to:'/profile',icon:User,label:'Me'}]
export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-gray-100 safe-area-pb lg:hidden">
      <div className="flex items-stretch justify-around max-w-lg mx-auto">
        {navItems.map(({to,icon:Icon,label}) => (
          <NavLink key={to} to={to} end={to==='/'} className={({isActive})=>cn('flex flex-col items-center justify-center gap-0.5 flex-1 py-2.5 px-1 transition-all duration-150',isActive?'text-brand-600':'text-gray-400 hover:text-gray-600')}>
            {({isActive})=>(
              <>
                <div className={cn('p-1.5 rounded-xl transition-all duration-200',isActive&&'bg-brand-50 shadow-xs')}><Icon size={20} strokeWidth={isActive?2.5:1.8}/></div>
                <span className={cn('text-[10px] font-semibold',isActive&&'font-bold')}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
