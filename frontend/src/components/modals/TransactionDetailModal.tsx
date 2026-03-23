import { X, Copy, Share2, ArrowDownLeft, ArrowUpRight, CheckCircle2, Clock, XCircle, RotateCcw } from 'lucide-react'
import { formatCurrency, formatDate, cn, getStatusColor } from '@/lib/utils'
import type { Transaction } from '@/types'
import toast from 'react-hot-toast'

interface Props { tx: Transaction | null; onClose: () => void }

const TYPE_META: Record<string, { label: string; icon: React.ElementType; bg: string; color: string }> = {
  fund:             { label:'Wallet Funded',      icon:ArrowDownLeft, bg:'bg-blue-50',   color:'text-blue-600'   },
  receive:          { label:'Money Received',      icon:ArrowDownLeft, bg:'bg-brand-50',  color:'text-brand-600'  },
  p2p_receive:      { label:'P2P Received',        icon:ArrowDownLeft, bg:'bg-brand-50',  color:'text-brand-600'  },
  transfer:         { label:'Transfer Sent',       icon:ArrowUpRight,  bg:'bg-orange-50', color:'text-orange-600' },
  p2p_send:         { label:'P2P Transfer',        icon:ArrowUpRight,  bg:'bg-orange-50', color:'text-orange-600' },
  withdraw:         { label:'Bank Withdrawal',     icon:ArrowUpRight,  bg:'bg-red-50',    color:'text-red-600'    },
  bill:             { label:'Bill Payment',        icon:ArrowUpRight,  bg:'bg-yellow-50', color:'text-yellow-600' },
  savings:          { label:'Savings Deposit',     icon:ArrowUpRight,  bg:'bg-purple-50', color:'text-purple-600' },
  investment:       { label:'Investment',          icon:ArrowUpRight,  bg:'bg-teal-50',   color:'text-teal-600'   },
  loan_disbursement:{ label:'Loan Disbursement',   icon:ArrowDownLeft, bg:'bg-green-50',  color:'text-green-600'  },
  loan_repayment:   { label:'Loan Repayment',      icon:ArrowUpRight,  bg:'bg-red-50',    color:'text-red-600'    },
  referral:         { label:'Referral Bonus',      icon:ArrowDownLeft, bg:'bg-pink-50',   color:'text-pink-600'   },
}

const STATUS_ICONS = {
  success:  { icon: CheckCircle2, color: 'text-brand-600', bg: 'bg-brand-50' },
  pending:  { icon: Clock,        color: 'text-amber-600', bg: 'bg-amber-50' },
  failed:   { icon: XCircle,      color: 'text-red-600',   bg: 'bg-red-50'   },
  reversed: { icon: RotateCcw,    color: 'text-blue-600',  bg: 'bg-blue-50'  },
}

export default function TransactionDetailModal({ tx, onClose }: Props) {
  if (!tx) return null

  const meta   = TYPE_META[tx.type] ?? TYPE_META.fund
  const Icon   = meta.icon
  const status = STATUS_ICONS[tx.status] ?? STATUS_ICONS.pending
  const StatusIcon = status.icon
  const isCredit = tx.amount > 0

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied!`)
  }

  const rows = [
    tx.counterpartyName && [isCredit ? 'From' : 'To', tx.counterpartyName],
    ['Reference',    tx.reference],
    ['Date & Time',  formatDate(tx.createdAt, 'long')],
    ['Balance Before', formatCurrency(tx.balanceBefore)],
    ['Balance After',  formatCurrency(tx.balanceAfter)],
    tx.fee > 0 && ['Fee', formatCurrency(tx.fee)],
    tx.category && ['Category', tx.category],
  ].filter(Boolean) as [string, string][]

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}/>
      <div className="relative z-10 w-full bg-white rounded-t-4xl sm:rounded-4xl shadow-float animate-slide-up sm:max-w-md sm:mx-4 overflow-hidden">
        {/* Handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full"/>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h2 className="font-display font-bold text-lg text-gray-900">Transaction Details</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-2xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <X size={15} className="text-gray-600"/>
          </button>
        </div>

        {/* Amount hero */}
        <div className="px-5 py-4 flex flex-col items-center text-center border-b border-gray-50">
          <div className={cn('w-16 h-16 rounded-3xl flex items-center justify-center mb-3', meta.bg)}>
            <Icon size={28} className={meta.color}/>
          </div>
          <p className="text-xs font-bold text-gray-500 mb-1">{meta.label}</p>
          <p className={cn('font-display font-bold text-3xl mb-2', isCredit ? 'text-brand-600' : 'text-gray-900')}>
            {isCredit ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
          </p>
          <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full', status.bg)}>
            <StatusIcon size={13} className={status.color}/>
            <span className={cn('text-xs font-bold capitalize', status.color)}>{tx.status}</span>
          </div>
        </div>

        {/* Details rows */}
        <div className="px-5 py-4 space-y-3 max-h-64 overflow-y-auto">
          <div className="bg-gray-50 rounded-2xl divide-y divide-gray-100">
            {rows.map(([key, val]) => (
              <div key={key} className="flex items-center justify-between px-4 py-3 gap-4">
                <span className="text-xs font-semibold text-gray-500 flex-shrink-0">{key}</span>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-bold text-gray-900 truncate text-right">{val}</span>
                  {key === 'Reference' && (
                    <button onClick={() => copy(val, 'Reference')} className="flex-shrink-0">
                      <Copy size={13} className="text-gray-400 hover:text-brand-600"/>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {tx.description && (
            <div className="bg-gray-50 rounded-2xl px-4 py-3">
              <p className="text-xs font-semibold text-gray-500 mb-1">Description</p>
              <p className="text-sm text-gray-900">{tx.description}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 pb-6 pt-2 flex gap-3">
          <button onClick={() => copy(tx.reference, 'Reference')}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors text-sm font-bold text-gray-700">
            <Copy size={15}/> Copy Ref
          </button>
          <button onClick={() => toast.success('Receipt shared!')}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-brand-50 rounded-2xl hover:bg-brand-100 transition-colors text-sm font-bold text-brand-700">
            <Share2 size={15}/> Share Receipt
          </button>
        </div>
      </div>
    </div>
  )
}
