import { cn } from '@/lib/utils'

interface ProgressRingProps {
  value:      number   // 0–100
  size?:      number
  stroke?:    number
  color?:     string
  trackColor?: string
  children?:  React.ReactNode
  className?: string
}

export default function ProgressRing({
  value, size = 80, stroke = 7,
  color = '#16a34a', trackColor = '#f1f5f9',
  children, className,
}: ProgressRingProps) {
  const r   = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (value / 100) * circ

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}/>
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">{children}</div>
      )}
    </div>
  )
}
