import { useState } from 'react'
import { X } from 'lucide-react'
import PinPad from '@/components/common/PinPad'
import { usePinPad } from '@/hooks/usePinPad'

interface PinModalProps {
  isOpen:    boolean
  onClose:   () => void
  onSuccess: (pin: string) => void
  title?:    string
  subtitle?: string
}

export default function PinModal({ isOpen, onClose, onSuccess, title = 'Enter PIN', subtitle = 'Enter your 4-digit transaction PIN' }: PinModalProps) {
  const { digits, pin, complete, append, backspace, reset } = usePinPad(4)
  const [error, setError] = useState('')
  const [shaking, setShaking] = useState(false)

  const handleAppend = (d: string) => {
    setError('')
    append(d)
    if (digits.length === 3) {
      const finalPin = [...digits, d].join('')
      setTimeout(() => {
        onSuccess(finalPin)
        reset()
      }, 200)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => { reset(); onClose() }}/>
      <div className={`relative z-10 w-full bg-white rounded-t-4xl sm:rounded-4xl shadow-float animate-slide-up sm:max-w-sm sm:mx-4 ${shaking ? 'animate-bounce' : ''}`}>
        <div className="sm:hidden flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-gray-200 rounded-full"/></div>
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div/>
          <button onClick={() => { reset(); onClose() }} className="w-8 h-8 rounded-2xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <X size={15} className="text-gray-600"/>
          </button>
        </div>
        <div className="px-5 pb-8">
          <PinPad digits={digits} length={4} onAppend={handleAppend} onBackspace={backspace} title={title} subtitle={subtitle} error={error}/>
        </div>
      </div>
    </div>
  )
}
