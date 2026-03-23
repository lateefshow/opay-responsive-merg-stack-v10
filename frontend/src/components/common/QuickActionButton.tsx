import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickActionButtonProps {
  icon: LucideIcon
  label: string
  onClick: () => void
  variant?: 'default' | 'outline'
  className?: string
}

export default function QuickActionButton({
  icon: Icon,
  label,
  onClick,
  variant = 'default',
  className,
}: QuickActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center gap-2 flex-1 py-4 rounded-xl transition-all duration-150 active:scale-95',
        variant === 'default'
          ? 'bg-white hover:bg-gray-50 border border-gray-100 shadow-sm'
          : 'bg-brand-50 hover:bg-brand-100',
        className
      )}
    >
      <div className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center',
        variant === 'default' ? 'bg-brand-50' : 'bg-brand-100'
      )}>
        <Icon size={20} className="text-brand-600" strokeWidth={1.8} />
      </div>
      <span className="text-xs font-medium text-gray-700 text-center leading-tight">{label}</span>
    </button>
  )
}
