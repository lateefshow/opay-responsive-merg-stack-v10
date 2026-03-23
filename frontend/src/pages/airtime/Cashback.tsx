import { Gift, Zap, ShoppingBag, Car, Tv, Phone, CheckCircle2 } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import { useCashbackStore } from '@/store/useCashbackStore'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const CAT_ICONS: Record<string, React.ElementType> = {
  Shopping: ShoppingBag, Transport: Car, Entertainment: Tv, Airtime: Phone, Bills: Zap,
}

export default function Cashback() {
  const { offers: rawOffers, earned: rawEarned, totalEarned, addEarned } = useCashbackStore()
  const offers = rawOffers ?? []
  const earned = rawEarned ?? []

  const claimOffer = (offerId: string, merchant: string, pct: number) => {
    const amount = Math.floor(Math.random() * 500 + 100) * pct / 100
    addEarned({ id:crypto.randomUUID(), offerId, amount, txRef:`CB-${Date.now()}`, createdAt:new Date().toISOString() })
    toast.success(`₦${amount.toFixed(0)} cashback earned from ${merchant}!`)
  }

  const content = (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">Cashback Rewards</h1><p className="page-subtitle">Earn money back on purchases</p></div>
      </div>

      {/* Total earned banner */}
      <div className="mx-4 mb-4 bg-brand-gradient rounded-3xl p-5 relative overflow-hidden shadow-float-green">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border-[20px] border-white/10"/>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1"><Gift size={16} className="text-brand-200"/><span className="text-brand-100 text-xs font-semibold">Total Cashback Earned</span></div>
          <p className="font-display font-bold text-white text-4xl">{formatCurrency(totalEarned())}</p>
          <p className="text-brand-200 text-xs mt-1">{earned.length} successful cashbacks</p>
          {totalEarned()>0 && (
            <button onClick={()=>toast.success('Cashback credited to wallet!')} className="mt-3 bg-white text-brand-700 text-sm font-bold px-4 py-2 rounded-2xl hover:bg-brand-50 transition-all active:scale-95">
              Redeem to Wallet
            </button>
          )}
        </div>
      </div>

      {/* Active offers */}
      <div className="px-4 mb-5">
        <p className="section-label">Active Cashback Offers</p>
        <div className="space-y-3">
          {offers.map(offer => {
            const Icon = CAT_ICONS[offer.category] ?? ShoppingBag
            const alreadyEarned = earned.some(e=>e.offerId===offer.id)
            return (
              <div key={offer.id} className="bg-white rounded-3xl shadow-card overflow-hidden">
                <div className="h-1.5 w-full" style={{background:offer.color}}/>
                <div className="p-4 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-display font-bold text-xl" style={{background:offer.color}}>
                    {offer.merchant[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-bold text-sm text-gray-900">{offer.merchant}</p>
                      <span className="badge badge-gold text-[10px]">{offer.percentage}% back</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-0.5">Max: {formatCurrency(offer.maxAmount,'NGN',true)}</p>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Icon size={10}/> {offer.category} · Expires {formatDate(offer.validUntil,'short')}
                    </p>
                  </div>
                  <button onClick={()=>claimOffer(offer.id,offer.merchant,offer.percentage)}
                    disabled={alreadyEarned}
                    className={cn('flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all active:scale-95',
                      alreadyEarned
                        ? 'bg-brand-50 text-brand-600 cursor-default'
                        : 'bg-brand-600 text-white hover:bg-brand-700')}>
                    {alreadyEarned ? <><CheckCircle2 size={12}/>Earned</> : 'Claim'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Earned history */}
      {earned.length > 0 && (
        <div className="px-4">
          <p className="section-label">Cashback History</p>
          <div className="surface">
            {earned.map(e=>{
              const offer = offers.find(o=>o.id===e.offerId)
              return (
                <div key={e.id} className="list-item">
                  <div className="w-10 h-10 rounded-2xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <Gift size={17} className="text-brand-600"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{offer?.merchant ?? 'Cashback'}</p>
                    <p className="text-xs text-gray-400">{formatDate(e.createdAt,'relative')} · #{e.txRef}</p>
                  </div>
                  <p className="text-sm font-bold text-brand-600">+{formatCurrency(e.amount,'NGN',true)}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      <AppHeader title="Cashback" showBack/>
      <DeviceFrame>{content}</DeviceFrame>
    </>
  )
}
