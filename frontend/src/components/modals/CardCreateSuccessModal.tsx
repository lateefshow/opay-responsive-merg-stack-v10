import { CheckCircle2, Copy, Share2 } from 'lucide-react'
import Modal from './Modal'
import toast from 'react-hot-toast'
import type { CardPublic } from '@/types'

export default function CardCreateSuccessModal({ isOpen, onClose, card }: { isOpen:boolean; onClose:()=>void; card:CardPublic|null }) {
  if (!card) return null
  const expiry = `${String(card.expiryMonth).padStart(2,'0')}/${String(card.expiryYear).slice(-2)}`
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center text-center pb-2">
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center animate-success-ring">
            <CheckCircle2 size={40} className="text-brand-600 animate-scale-in"/>
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold">✓</div>
        </div>
        <h2 className="font-display font-bold text-xl text-gray-900 mb-1">Card Created! 🎉</h2>
        <p className="text-gray-500 text-sm mb-5">Your virtual card is ready to use</p>
        <div className="w-full bg-brand-gradient rounded-3xl p-5 mb-5 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full border-[16px] border-white/10"/>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-5">
              <span className="text-white font-display font-bold text-lg">OPay</span>
              <span className="text-brand-200 text-sm">{card.network}</span>
            </div>
            <p className="font-mono text-white text-base tracking-widest mb-4 opacity-90">{card.maskedNumber}</p>
            <div className="flex justify-between items-end">
              <div><p className="text-brand-200 text-[10px] uppercase tracking-wider">Cardholder</p><p className="text-white text-sm font-bold">{card.cardHolder}</p></div>
              <div className="text-right"><p className="text-brand-200 text-[10px] uppercase tracking-wider">Expires</p><p className="text-white text-sm font-bold">{expiry}</p></div>
            </div>
          </div>
        </div>
        <div className="w-full grid grid-cols-2 gap-2 mb-5">
          <button onClick={() => { navigator.clipboard.writeText(card.maskedNumber.replace(/\s/g,'')); toast.success('Card number copied!') }}
            className="flex items-center justify-center gap-2 py-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors text-sm font-bold text-gray-700">
            <Copy size={15}/> Copy Number
          </button>
          <button onClick={() => toast.success('Share coming soon!')}
            className="flex items-center justify-center gap-2 py-3 bg-brand-50 rounded-2xl hover:bg-brand-100 transition-colors text-sm font-bold text-brand-700">
            <Share2 size={15}/> Share Card
          </button>
        </div>
        <button onClick={onClose} className="btn-primary w-full py-3.5">Done</button>
      </div>
    </Modal>
  )
}
