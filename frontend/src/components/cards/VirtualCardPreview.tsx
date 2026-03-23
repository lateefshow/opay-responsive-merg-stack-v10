import type { CardPublic } from '@/pages/Cards'

interface VirtualCardPreviewProps {
  card: CardPublic
}

export default function VirtualCardPreview({ card }: VirtualCardPreviewProps) {
  const expiry = `${String(card.expiryMonth).padStart(2, '0')}/${String(card.expiryYear).slice(-2)}`

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden p-6 shadow-float"
      style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 60%, #166534 100%)' }}
    >
      {/* Decorative rings */}
      <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full border-[22px] border-white/10 pointer-events-none" />
      <div className="absolute -right-2 top-12 w-32 h-32 rounded-full border-[14px] border-white/10 pointer-events-none" />
      <div className="absolute right-16 -bottom-8 w-24 h-24 rounded-full border-[12px] border-white/10 pointer-events-none" />

      <div className="relative z-10">
        {/* Top */}
        <div className="flex justify-between items-start mb-8">
          <span className="text-white font-display font-bold text-xl tracking-tight">OPay</span>
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full border-2 border-white" />
          </div>
        </div>

        {/* Card number */}
        <p className="font-mono text-white text-base tracking-widest mb-6 opacity-90">
          {card.maskedNumber}
        </p>

        {/* Bottom row */}
        <div className="flex justify-between items-end">
          <div>
            <p className="text-green-200 text-[10px] uppercase tracking-widest mb-0.5">Cardholder</p>
            <p className="text-white text-sm font-semibold">{card.cardHolder}</p>
          </div>
          <div className="text-center">
            <p className="text-green-200 text-[10px] uppercase tracking-widest mb-0.5">Expires</p>
            <p className="text-white text-sm font-semibold">{expiry}</p>
          </div>
          {/* Verve logo */}
          <div className="flex items-center">
            <span className="text-white font-display font-bold text-sm">
              <span className="bg-red-500 text-white rounded px-1 py-0.5 mr-0.5">V</span>
              erve
            </span>
          </div>
        </div>

        {/* Card type label */}
        <div className="mt-4 flex justify-between items-center">
          <span className="text-green-200 text-xs">Virtual Card</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            card.status === 'active' ? 'bg-white/20 text-white' : 'bg-red-500/30 text-red-200'
          }`}>
            {card.status}
          </span>
        </div>
      </div>
    </div>
  )
}
