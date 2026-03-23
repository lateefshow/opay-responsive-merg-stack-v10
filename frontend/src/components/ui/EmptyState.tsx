import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon:       LucideIcon
  title:      string
  subtitle?:  string
  action?:    { label: string; onClick: () => void }
  className?: string
}

export default function EmptyState({ icon: Icon, title, subtitle, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center px-6', className)}>
      <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mb-4">
        <Icon size={28} className="text-gray-300" strokeWidth={1.5}/>
      </div>
      <p className="font-display font-bold text-gray-500 text-base mb-1">{title}</p>
      {subtitle && <p className="text-sm text-gray-400 max-w-xs">{subtitle}</p>}
      {action && (
        <button onClick={action.onClick} className="btn-primary mt-5 px-6 py-2.5 text-sm">
          {action.label}
        </button>
      )}
    </div>
  )
}
