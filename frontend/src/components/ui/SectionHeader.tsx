import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  title:       string
  action?:     { label: string; onClick: () => void }
  subtitle?:   string
  className?:  string
}

export default function SectionHeader({ title, action, subtitle, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-3', className)}>
      <div>
        <h2 className="font-display font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && (
        <button onClick={action.onClick} className="flex items-center gap-0.5 text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors">
          {action.label} <ChevronRight size={13}/>
        </button>
      )}
    </div>
  )
}
