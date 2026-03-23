import { useState } from 'react'
import { Eye, EyeOff, Plus, ShieldCheck, RefreshCw } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface BalanceCardProps {
  balance: number
  onAddMoney: () => void
  isLoading?: boolean
}

export default function BalanceCard({ balance, onAddMoney, isLoading }: BalanceCardProps) {
  const [visible, setVisible] = useState(true)

  return (
    <div className="relative mx-4 rounded-2xl overflow-hidden bg-brand-600 p-5 shadow-float">
      {/* Background decorative rings */}
      <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border-[20px] border-white/10" />
      <div className="absolute -right-2 top-8 w-28 h-28 rounded-full border-[14px] border-white/10" />
      <div className="absolute right-12 -bottom-6 w-20 h-20 rounded-full border-[10px] border-white/10" />

      <div className="relative z-10">
        {/* Top row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-brand-200" />
            <span className="text-brand-100 text-xs font-medium">Available Balance</span>
          </div>
          <button
            onClick={() => setVisible(v => !v)}
            className="text-brand-200 hover:text-white transition-colors"
            aria-label={visible ? 'Hide balance' : 'Show balance'}
          >
            {visible ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>

        {/* Balance */}
        {isLoading ? (
          <div className="h-9 w-48 rounded-lg bg-white/20 animate-pulse mb-4" />
        ) : (
          <div className="mb-4">
            <p className={cn(
              'font-display font-bold text-white transition-all',
              visible ? 'text-3xl' : 'text-3xl tracking-widest'
            )}>
              {visible ? formatCurrency(balance) : '₦ ••••••••'}
            </p>
          </div>
        )}

        {/* Actions row */}
        <div className="flex items-center justify-between">
          <button
            onClick={onAddMoney}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 active:bg-white/40 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-150"
          >
            <Plus size={15} strokeWidth={2.5} />
            Add Money
          </button>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <RefreshCw size={18} className="text-white" />
          </div>
        </div>
      </div>
    </div>
  )
}
