import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Plus, BarChart2, RefreshCw, Trash2 } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import Modal from '@/components/modals/Modal'
import { usePortfolioStore, type PortfolioHolding } from '@/store/usePortfolioStore'
import { useWalletStore } from '@/store/useWalletStore'
import { formatCurrency, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const ASSETS = {
  stocks: [
    { symbol:'DANGOTE', name:'Dangote Cement',      price:380.50,  color:'#16a34a' },
    { symbol:'GTCO',    name:'Guaranty Trust Holding',price:58.20,  color:'#0ea5e9' },
    { symbol:'ZENITH',  name:'Zenith Bank',          price:42.80,  color:'#8b5cf6' },
    { symbol:'MTNN',    name:'MTN Nigeria',           price:248.00, color:'#f97316' },
    { symbol:'AIRTEL',  name:'Airtel Africa',         price:2180.00,color:'#ef4444' },
    { symbol:'SEPLAT',  name:'Seplat Energy',         price:4200.00,color:'#f59e0b' },
  ],
  crypto: [
    { symbol:'BTC',   name:'Bitcoin',   price:97000000, color:'#f97316' },
    { symbol:'ETH',   name:'Ethereum',  price:5400000,  color:'#6366f1' },
    { symbol:'BNB',   name:'BNB',       price:920000,   color:'#f59e0b' },
    { symbol:'SOL',   name:'Solana',    price:590000,   color:'#8b5cf6' },
    { symbol:'USDT',  name:'Tether',    price:1590.00,  color:'#22c55e' },
  ],
}

const TYPE_COLORS: Record<string, string> = { stock:'#16a34a', crypto:'#f97316', etf:'#6366f1' }

function HoldingCard({ holding, onSell }: { holding: PortfolioHolding; onSell: (h: PortfolioHolding) => void }) {
  const isUp = holding.pnl >= 0
  return (
    <div className="bg-white rounded-3xl shadow-card p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ background: holding.color }}>
            {holding.symbol.slice(0, 2)}
          </div>
          <div>
            <p className="font-bold text-gray-900">{holding.symbol}</p>
            <p className="text-xs text-gray-400 capitalize">{holding.name} · {holding.type}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-display font-bold text-gray-900">{formatCurrency(holding.currentValue, 'NGN', true)}</p>
          <div className={cn('flex items-center gap-1 justify-end text-xs font-bold', isUp ? 'text-brand-600' : 'text-red-500')}>
            {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {isUp ? '+' : ''}{formatCurrency(holding.pnl, 'NGN', true)} ({isUp ? '+' : ''}{holding.pnlPercent.toFixed(2)}%)
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
        <div className="bg-gray-50 rounded-xl p-2 text-center">
          <p className="text-gray-400">Qty</p>
          <p className="font-bold text-gray-900">{holding.quantity}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-2 text-center">
          <p className="text-gray-400">Avg Price</p>
          <p className="font-bold text-gray-900">{formatCurrency(holding.avgBuyPrice, 'NGN', true)}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-2 text-center">
          <p className="text-gray-400">Current</p>
          <p className="font-bold text-gray-900">{formatCurrency(holding.currentPrice, 'NGN', true)}</p>
        </div>
      </div>
      <button onClick={() => onSell(holding)}
        className="w-full py-2 text-xs font-bold text-red-600 bg-red-50 rounded-2xl hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5">
        <Trash2 size={11} /> Sell Position
      </button>
    </div>
  )
}

export default function Portfolio() {
  const { holdings, totalValue, totalCost, totalPnL, totalPnLPercent, isLoading, fetchPortfolio, buyAsset, sellAsset } = usePortfolioStore()
  const { balance, setBalance } = useWalletStore()
  const [showBuy, setShowBuy]     = useState(false)
  const [showSell, setShowSell]   = useState<PortfolioHolding | null>(null)
  const [assetType, setAssetType] = useState<'stocks' | 'crypto'>('stocks')
  const [selected, setSelected]   = useState<typeof ASSETS.stocks[0] | null>(null)
  const [qty, setQty]             = useState('')
  const [sellQty, setSellQty]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [tab, setTab]             = useState<'holdings' | 'discover'>('holdings')

  useEffect(() => { fetchPortfolio() }, [])

  const safeHoldings = holdings ?? []
  const isUp = totalPnL >= 0

  const cost       = selected ? Number(qty) * selected.price : 0
  const sellValue  = showSell ? Number(sellQty) * showSell.currentPrice : 0

  const pieData = safeHoldings.map(h => ({ name: h.symbol, value: h.currentValue, color: h.color }))

  const handleBuy = async () => {
    if (!selected || !qty) { toast.error('Select asset and quantity'); return }
    if (cost > balance) { toast.error('Insufficient balance'); return }
    setLoading(true)
    try {
      await buyAsset({ symbol: selected.symbol, name: selected.name, type: assetType === 'stocks' ? 'stock' : 'crypto', quantity: Number(qty), price: selected.price, color: selected.color })
      setBalance(balance - cost)
      await fetchPortfolio()
      toast.success(`Bought ${qty} × ${selected.symbol}!`)
      setShowBuy(false); setSelected(null); setQty('')
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Purchase failed')
    } finally { setLoading(false) }
  }

  const handleSell = async () => {
    if (!showSell || !sellQty) return
    if (Number(sellQty) > showSell.quantity) { toast.error('Cannot sell more than you hold'); return }
    setLoading(true)
    try {
      await sellAsset(showSell.id, Number(sellQty))
      setBalance(balance + sellValue)
      await fetchPortfolio()
      toast.success(`Sold ${sellQty} × ${showSell.symbol} for ${formatCurrency(sellValue, 'NGN', true)}`)
      setShowSell(null); setSellQty('')
    } catch { toast.error('Sale failed') }
    finally { setLoading(false) }
  }

  const content = (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">Portfolio</h1><p className="page-subtitle">Stocks & crypto intelligence</p></div>
        <div className="flex gap-2">
          <button onClick={() => fetchPortfolio()} className="btn-icon bg-gray-100"><RefreshCw size={16} className={cn('text-gray-600', isLoading && 'animate-spin')} /></button>
          <button onClick={() => setShowBuy(true)} className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-bold px-4 py-2 rounded-2xl hover:bg-brand-700 shadow-float-green active:scale-95 transition-all">
            <Plus size={15} /> Buy
          </button>
        </div>
      </div>

      {/* P&L Hero */}
      <div className={cn('mx-4 mb-4 rounded-4xl p-5 shadow-premium relative overflow-hidden', isUp ? 'bg-brand-gradient' : 'bg-gradient-to-br from-red-600 to-rose-700')}>
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border-[20px] border-white/10" />
        <div className="relative z-10">
          <p className="text-white/70 text-xs mb-1">Portfolio Value</p>
          <p className="font-display font-bold text-white text-3xl mb-0.5">{formatCurrency(totalValue, 'NGN', true)}</p>
          <div className={cn('flex items-center gap-2 mb-4 text-sm font-bold', isUp ? 'text-brand-200' : 'text-red-200')}>
            {isUp ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
            {isUp ? '+' : ''}{formatCurrency(totalPnL, 'NGN', true)} ({isUp ? '+' : ''}{totalPnLPercent.toFixed(2)}%)
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[{ l:'Invested', v:formatCurrency(totalCost,'NGN',true) }, { l:'Holdings', v:safeHoldings.length }, { l:'P&L', v:`${isUp?'+':''}${totalPnLPercent.toFixed(1)}%` }].map(({ l, v }) => (
              <div key={l} className="bg-white/15 rounded-2xl p-2.5 text-center">
                <p className="text-white/50 text-[9px]">{l}</p>
                <p className="text-white font-display font-bold text-sm">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 px-4 mb-4">
        {(['holdings', 'discover'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('tab-pill flex-1 capitalize', tab === t ? 'tab-active' : 'tab-inactive')}>
            {t === 'holdings' ? `Holdings (${safeHoldings.length})` : 'Discover Assets'}
          </button>
        ))}
      </div>

      {tab === 'holdings' && (
        <div className="px-4">
          {safeHoldings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl shadow-card">
              <BarChart2 size={40} className="mx-auto mb-3 text-gray-200" />
              <p className="font-bold text-gray-500">No holdings yet</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">Start building your portfolio with Nigerian stocks and crypto</p>
              <button onClick={() => setShowBuy(true)} className="btn-primary px-6 py-2.5 text-sm">Buy First Asset</button>
            </div>
          ) : (
            <>
              {/* Pie chart */}
              {safeHoldings.length > 1 && (
                <div className="bg-white rounded-3xl shadow-card p-4 mb-4 flex items-center gap-4">
                  <PieChart width={100} height={100}>
                    <Pie data={pieData} cx={45} cy={45} outerRadius={45} dataKey="value" paddingAngle={3}>
                      {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [formatCurrency(v, 'NGN', true), 'Value']} />
                  </PieChart>
                  <div className="flex-1 space-y-1">
                    {pieData.slice(0, 4).map(d => (
                      <div key={d.name} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />{d.name}
                        </span>
                        <span className="font-bold text-gray-700">{totalValue > 0 ? Math.round(d.value / totalValue * 100) : 0}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-3">
                {safeHoldings.map(h => <HoldingCard key={h.id} holding={h} onSell={setShowSell} />)}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'discover' && (
        <div className="px-4">
          {(['stocks', 'crypto'] as const).map(type => (
            <div key={type} className="mb-5">
              <p className="section-label capitalize">{type === 'stocks' ? '🇳🇬 Nigerian Stocks' : '₿ Cryptocurrency'}</p>
              <div className="surface">
                {ASSETS[type].map((asset, idx) => (
                  <div key={asset.symbol} className={cn('list-item', idx < ASSETS[type].length - 1 && 'border-b border-gray-50')}>
                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: asset.color }}>{asset.symbol.slice(0, 2)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{asset.symbol}</p>
                      <p className="text-xs text-gray-400 truncate">{asset.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(asset.price, 'NGN', true)}</p>
                      <button onClick={() => { setSelected(asset); setAssetType(type); setShowBuy(true) }}
                        className="px-2.5 py-1.5 bg-brand-50 text-brand-700 font-bold text-xs rounded-xl hover:bg-brand-100 transition-colors">
                        Buy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <>
      <AppHeader title="Portfolio" showBack />
      <DeviceFrame>{content}</DeviceFrame>

      {/* Buy Modal */}
      <Modal isOpen={showBuy} onClose={() => { setShowBuy(false); setSelected(null); setQty('') }} title="Buy Asset">
        <div className="space-y-4">
          {!selected ? (
            <>
              <div className="flex gap-2 mb-2">
                {(['stocks', 'crypto'] as const).map(t => (
                  <button key={t} onClick={() => setAssetType(t)} className={cn('flex-1 py-2 text-sm font-bold rounded-xl capitalize transition-all border-2', assetType===t?'border-brand-500 bg-brand-50 text-brand-700':'border-gray-200 text-gray-600')}>{t}</button>
                ))}
              </div>
              <div className="space-y-2">
                {ASSETS[assetType].map(a => (
                  <button key={a.symbol} onClick={() => setSelected(a)}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-2xl hover:bg-brand-50 transition-all text-left">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: a.color }}>{a.symbol.slice(0, 2)}</div>
                    <div className="flex-1"><p className="text-sm font-bold text-gray-900">{a.symbol}</p><p className="text-xs text-gray-400">{a.name}</p></div>
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(a.price, 'NGN', true)}</p>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: `${selected.color}15` }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold" style={{ background: selected.color }}>{selected.symbol.slice(0, 2)}</div>
                <div>
                  <p className="font-bold text-gray-900">{selected.symbol}</p>
                  <p className="text-xs text-gray-500">{formatCurrency(selected.price, 'NGN', true)} per unit · {assetType}</p>
                </div>
                <button onClick={() => setSelected(null)} className="ml-auto text-xs text-gray-400 hover:text-gray-600">Change</button>
              </div>
              <div className="bg-brand-50 rounded-xl px-4 py-3 flex justify-between text-sm">
                <span className="text-gray-600">Wallet Balance</span>
                <span className="font-bold text-brand-700">{formatCurrency(balance)}</span>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Quantity</label>
                <input value={qty} onChange={e => setQty(e.target.value)} type="number" placeholder="e.g. 100" className="input-field text-xl font-bold" />
              </div>
              {cost > 0 && (
                <div className="bg-gray-50 rounded-2xl px-4 py-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Total cost</span><span className="font-bold text-brand-600">{formatCurrency(cost)}</span></div>
                  {cost > balance && <p className="text-red-500 text-xs mt-1">Insufficient balance</p>}
                </div>
              )}
              <button onClick={handleBuy} disabled={loading || !qty || cost > balance} className="btn-primary w-full py-4">
                {loading ? 'Buying…' : `Buy ${qty || 0} × ${selected.symbol} · ${formatCurrency(cost)}`}
              </button>
            </>
          )}
        </div>
      </Modal>

      {/* Sell Modal */}
      <Modal isOpen={!!showSell} onClose={() => { setShowSell(null); setSellQty('') }} title={`Sell ${showSell?.symbol ?? ''}`}>
        {showSell && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-2xl p-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">Holding</span><span className="font-bold">{showSell.quantity} units</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Current Price</span><span className="font-bold">{formatCurrency(showSell.currentPrice, 'NGN', true)}</span></div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Quantity to Sell</label>
              <input value={sellQty} onChange={e => setSellQty(e.target.value)} type="number" max={showSell.quantity} placeholder={`Max: ${showSell.quantity}`} className="input-field text-xl font-bold" />
            </div>
            {sellQty && (
              <div className="bg-gray-50 rounded-2xl px-4 py-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Proceeds</span><span className="font-bold text-brand-600">{formatCurrency(sellValue)}</span></div>
              </div>
            )}
            <button onClick={handleSell} disabled={loading || !sellQty || Number(sellQty) > showSell.quantity} className="w-full py-4 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-colors disabled:opacity-50">
              {loading ? 'Selling…' : `Sell ${sellQty || 0} × ${showSell.symbol}`}
            </button>
          </div>
        )}
      </Modal>
    </>
  )
}
