import { TrendingUp, TrendingDown } from 'lucide-react'

const TICKERS = [
  { label:'USD/NGN', value:'₦1,580', change:'+0.3%', up:true  },
  { label:'GBP/NGN', value:'₦2,028', change:'-0.1%', up:false },
  { label:'EUR/NGN', value:'₦1,720', change:'+0.5%', up:true  },
  { label:'TBILL 91d', value:'19.2%', change:'p.a.', up:true  },
  { label:'TBILL 182d',value:'20.1%', change:'p.a.', up:true  },
  { label:'BTC',     value:'$67.4K', change:'+2.1%', up:true  },
  { label:'ETH',     value:'$3,580', change:'+1.4%', up:true  },
  { label:'GHS/NGN', value:'₦126',   change:'+1.2%', up:true  },
  { label:'OPay Stock',value:'NGN 48.70',change:'+3.2%',up:true},
  { label:'NSE Index',value:'99,842',change:'+0.8%', up:true  },
]

export default function MarketTicker() {
  return (
    <div className="bg-gray-900 py-2 overflow-hidden select-none">
      <div className="ticker-inner">
        {[...TICKERS, ...TICKERS].map((t,i) => (
          <div key={i} className="flex items-center gap-2 flex-shrink-0 px-1">
            <span className="text-gray-400 text-[11px] font-mono font-semibold">{t.label}</span>
            <span className="text-white text-[11px] font-mono font-bold">{t.value}</span>
            <span className={`flex items-center gap-0.5 text-[11px] font-bold ${t.up?'text-brand-400':'text-red-400'}`}>
              {t.up?<TrendingUp size={9}/>:<TrendingDown size={9}/>}{t.change}
            </span>
            <span className="text-gray-700 text-xs">·</span>
          </div>
        ))}
      </div>
    </div>
  )
}
