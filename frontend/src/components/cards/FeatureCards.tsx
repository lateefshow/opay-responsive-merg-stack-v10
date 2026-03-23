import { Zap, ShoppingBag, Store, ShieldCheck } from 'lucide-react'

const features = [
  { icon:Zap,         color:'text-yellow-600', bg:'bg-yellow-50', title:'Instant Access',              desc:<span>Apply and activate <span className="text-brand-600 font-semibold">Instantly</span></span> },
  { icon:ShoppingBag, color:'text-brand-600',  bg:'bg-brand-50',  title:'Safety',                     desc:<span><span className="text-red-500 font-semibold">No</span> physical handing. No risk of loss</span> },
  { icon:Store,       color:'text-brand-600',  bg:'bg-brand-50',  title:'Online Merchant Acceptance',  desc:<span>Accepted by <span className="text-orange-500 font-semibold">40,000+</span> merchants including JUMIA, KONGA, NETFLIX & more</span> },
  { icon:ShieldCheck, color:'text-brand-600',  bg:'bg-brand-50',  title:'Security',                   desc:<span><span className="text-brand-600 font-semibold">CBN</span> licensed, <span className="text-brand-600 font-semibold">NDIC</span> insured</span> },
]

export default function FeatureCards() {
  return (
    <div className="space-y-4">
      {features.map(({ icon:Icon, color, bg, title, desc }) => (
        <div key={title} className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
            <Icon size={18} className={color} strokeWidth={1.8}/>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{title}</p>
            <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
