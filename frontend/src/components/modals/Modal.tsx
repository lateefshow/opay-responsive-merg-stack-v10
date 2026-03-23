import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps { isOpen:boolean; onClose:()=>void; title?:string; children:React.ReactNode; className?:string }

export default function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}/>
      <div className={cn('relative z-10 w-full bg-white rounded-t-4xl sm:rounded-4xl shadow-float animate-slide-up sm:max-w-md sm:mx-4', className)}>
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full"/>
        </div>
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-display font-bold text-gray-900 text-lg">{title}</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-2xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
              <X size={15} className="text-gray-600"/>
            </button>
          </div>
        )}
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}
