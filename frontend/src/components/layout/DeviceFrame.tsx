import React from 'react'
import { cn } from '@/lib/utils'
import { useDeviceViewStore } from '@/store/useDeviceViewStore'

export default function DeviceFrame({ children }: { children: React.ReactNode }) {
  const { view } = useDeviceViewStore()
  return (
    <div className={cn('transition-all duration-500 ease-in-out w-full', view==='mobile'&&'px-4 py-6', view==='tablet'&&'px-6 py-6', view==='desktop'&&'px-0 py-4')}>
      <div className={cn('mx-auto overflow-hidden bg-white transition-all duration-500', view==='mobile'&&'device-frame-mobile', view==='tablet'&&'device-frame-tablet', view==='desktop'&&'device-frame-desktop')}>
        {view==='mobile' && (
          <div className="relative bg-white px-7 pt-3 pb-1 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-900 z-10">9:41</span>
            <div className="absolute left-1/2 -translate-x-1/2 top-1 w-28 h-7 bg-gray-900 rounded-b-3xl z-20"/>
            <div className="flex items-center gap-2 z-10">
              {[3,4,5,6].map((h,i)=><div key={i} className="rounded-sm bg-gray-900" style={{width:3,height:h,opacity:i<3?1:0.3}}/>)}
              <svg width="16" height="12" fill="none" viewBox="0 0 16 12"><path d="M8 2C10.3 2 12.3 3 13.7 4.6L15 3.3C13.2 1.3 10.7 0 8 0S2.8 1.3 1 3.3L2.3 4.6C3.7 3 5.7 2 8 2Z" fill="#111"/><path d="M8 5C9.4 5 10.7 5.6 11.6 6.6L12.9 5.3C11.6 3.9 9.9 3 8 3S4.4 3.9 3.1 5.3L4.4 6.6C5.3 5.6 6.6 5 8 5Z" fill="#111"/><circle cx="8" cy="9.5" r="1.5" fill="#111"/></svg>
              <div className="flex items-center gap-0.5"><div className="w-6 h-3 border border-gray-900 rounded-sm relative overflow-hidden"><div className="absolute left-0 top-0 bottom-0 bg-gray-900 rounded-sm" style={{width:'80%'}}/></div><div className="w-0.5 h-1.5 bg-gray-900/40 rounded-r-full"/></div>
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
