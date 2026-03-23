import { Delete } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PinPadProps {
  digits: string[]; length?: number
  onAppend: (d:string)=>void; onBackspace: ()=>void
  title?: string; subtitle?: string; error?: string
}

export default function PinPad({ digits,length=4,onAppend,onBackspace,title,subtitle,error }: PinPadProps) {
  const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫']
  return (
    <div className="flex flex-col items-center">
      {title && <h3 className="font-display font-bold text-xl text-gray-900 mb-1">{title}</h3>}
      {subtitle && <p className="text-sm text-gray-500 mb-6 text-center">{subtitle}</p>}
      {/* Dots */}
      <div className="flex gap-4 mb-8">
        {Array.from({length}).map((_,i)=>(
          <div key={i} className={cn('w-4 h-4 rounded-full transition-all duration-200', i<digits.length?'bg-brand-600 scale-110':'bg-gray-200')}/>
        ))}
      </div>
      {error && <p className="text-red-500 text-sm font-semibold mb-4 animate-bounce-in">{error}</p>}
      {/* Keypad */}
      <div className="grid grid-cols-3 gap-4">
        {KEYS.map((key,i)=>(
          <button key={i} onClick={()=>key==='⌫'?onBackspace():key?onAppend(key):undefined}
            disabled={!key}
            className={cn('pin-btn', !key&&'invisible', key==='⌫'&&'bg-gray-50')}>
            {key==='⌫' ? <Delete size={20}/> : key}
          </button>
        ))}
      </div>
    </div>
  )
}
