import { cn } from '@/lib/utils'
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 bg-[length:200%_100%] animate-shimmer rounded-2xl',className)}/>
}
export function TransactionSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50">
      <Skeleton className="w-11 h-11 rounded-2xl flex-shrink-0"/>
      <div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-2/3"/><Skeleton className="h-3 w-1/3"/></div>
      <div className="space-y-1.5 text-right"><Skeleton className="h-4 w-16"/><Skeleton className="h-3 w-12 ml-auto"/></div>
    </div>
  )
}
export function CardSkeleton() {
  return <div className="mx-4 rounded-3xl overflow-hidden bg-gray-200 animate-pulse h-48"/>
}
export function StatSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-4 space-y-3">
      <Skeleton className="h-3 w-16"/><Skeleton className="h-7 w-28"/><Skeleton className="h-3 w-20"/>
    </div>
  )
}
