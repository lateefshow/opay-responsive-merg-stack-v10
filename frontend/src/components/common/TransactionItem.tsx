import { ArrowDownLeft,ArrowUpRight,Wallet,Banknote,Zap,PiggyBank,Gift,TrendingUp,Users } from 'lucide-react'
import { formatCurrency,formatDate,cn } from '@/lib/utils'
import type { Transaction } from '@/types'

const META: Record<string,{icon:React.ElementType;bg:string;color:string}> = {
  fund:{icon:Wallet,bg:'bg-blue-50',color:'text-blue-600'},
  receive:{icon:ArrowDownLeft,bg:'bg-brand-50',color:'text-brand-600'},
  p2p_receive:{icon:ArrowDownLeft,bg:'bg-brand-50',color:'text-brand-600'},
  transfer:{icon:ArrowUpRight,bg:'bg-orange-50',color:'text-orange-600'},
  p2p_send:{icon:ArrowUpRight,bg:'bg-orange-50',color:'text-orange-600'},
  withdraw:{icon:Banknote,bg:'bg-red-50',color:'text-red-600'},
  bill:{icon:Zap,bg:'bg-yellow-50',color:'text-yellow-600'},
  savings:{icon:PiggyBank,bg:'bg-purple-50',color:'text-purple-600'},
  investment:{icon:TrendingUp,bg:'bg-teal-50',color:'text-teal-600'},
  loan_disbursement:{icon:Wallet,bg:'bg-green-50',color:'text-green-600'},
  loan_repayment:{icon:ArrowUpRight,bg:'bg-red-50',color:'text-red-600'},
  referral:{icon:Gift,bg:'bg-pink-50',color:'text-pink-600'},
}

export default function TransactionItem({ tx, compact=false }: { tx: Transaction; compact?: boolean }) {
  const m = META[tx.type] ?? META.fund
  const Icon = m.icon
  const isCredit = tx.amount > 0
  return (
    <div className="flex items-center gap-3 py-3.5 px-4 hover:bg-gray-50/80 transition-colors border-b border-gray-50 last:border-0">
      <div className={cn('rounded-2xl flex items-center justify-center flex-shrink-0', m.bg, compact?'w-9 h-9':'w-11 h-11')}>
        <Icon size={compact?16:18} className={m.color}/>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 truncate">
          {tx.counterpartyName ? (isCredit?`From ${tx.counterpartyName}`:`To ${tx.counterpartyName}`) : tx.description}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{formatDate(tx.createdAt,'relative')}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={cn('text-sm font-display font-bold', isCredit?'text-brand-600':'text-gray-900')}>
          {isCredit?'+':''}{formatCurrency(Math.abs(tx.amount),'NGN',true)}
        </p>
        <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full',
          tx.status==='success'?'bg-brand-50 text-brand-700':tx.status==='pending'?'bg-amber-50 text-amber-700':'bg-red-50 text-red-700')}>
          {tx.status}
        </span>
      </div>
    </div>
  )
}
