import { formatCurrency, cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatItem {
  label:   string
  value:   number
  isCurrency?: boolean
  trend?:  number   // positive = up, negative = down
  color?:  string
}

export default function StatsBar({ stats }: { stats: StatItem[] }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}>
      {stats.map(({ label, value, isCurrency, trend, color }) => (
        <div key={label} className="bg-white rounded-3xl shadow-card p-4">
          <p className="text-xs font-bold text-gray-400 mb-1">{label}</p>
          <p className={cn('font-display font-bold text-lg leading-tight', color ?? 'text-gray-900')}>
            {isCurrency ? formatCurrency(value, 'NGN', true) : value.toLocaleString()}
          </p>
          {trend !== undefined && (
            <div className={cn('flex items-center gap-1 mt-1 text-xs font-bold', trend >= 0 ? 'text-brand-600' : 'text-red-500')}>
              {trend >= 0 ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
              <span>{Math.abs(trend).toFixed(1)}%</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
