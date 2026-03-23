import { TrendingUp, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { formatCurrency, cn } from '@/lib/utils'
import type { NetWorthBreakdown } from '@/types'

export default function NetWorthCard({ data }: { data: NetWorthBreakdown }) {
  const [visible, setVisible] = useState(true)
  const items = [
    { label:'Wallet',      value:data.wallet,      color:'bg-brand-400', width:percentage(data.wallet,data.total) },
    { label:'Savings',     value:data.savings,     color:'bg-blue-400',  width:percentage(data.savings,data.total) },
    { label:'Investments', value:data.investments, color:'bg-amber-400', width:percentage(data.investments,data.total) },
  ]
  function percentage(v:number,t:number){ return t?Math.round((v/t)*100):0 }
  return (
    <div className="mx-4 bg-white rounded-3xl shadow-card p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2"><TrendingUp size={15} className="text-brand-600"/><span className="text-xs font-bold text-gray-500">Net Worth</span></div>
        <button onClick={()=>setVisible(v=>!v)} className="text-gray-400 hover:text-gray-600">{visible?<Eye size={15}/>:<EyeOff size={15}/>}</button>
      </div>
      <p className="font-display font-bold text-2xl text-gray-900 mb-4">{visible?formatCurrency(data.total):'₦ ••••••••'}</p>
      <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mb-3">
        {items.map(({color,width})=><div key={color} className={cn('h-full rounded-full transition-all',color)} style={{width:`${width}%`}}/>)}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {items.map(({label,value,color})=>(
          <div key={label} className="text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5"><div className={cn('w-2 h-2 rounded-full',color)}/><span className="text-[10px] font-bold text-gray-400">{label}</span></div>
            <p className="text-xs font-bold text-gray-900">{visible?formatCurrency(value,'NGN',true):'••••'}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
