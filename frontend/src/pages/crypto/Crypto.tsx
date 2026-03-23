import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, RefreshCw, ArrowUpDown, Plus, Minus } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import Modal from '@/components/modals/Modal'
import { useCryptoStore, type CryptoCoin } from '@/store/useCryptoStore'
import { useWalletStore } from '@/store/useWalletStore'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const TX_TYPE_META: Record<string, { label: string; color: string }> = {
  buy:          { label: 'Bought',   color: 'text-brand-600'  },
  sell:         { label: 'Sold',     color: 'text-red-500'    },
  convert:      { label: 'Converted',color: 'text-blue-600'   },
  receive:      { label: 'Received', color: 'text-brand-600'  },
  send_crypto:  { label: 'Sent',     color: 'text-orange-500' },
}

// Format crypto quantity with up to 8 decimal places, trimming trailing zeros
function fmtQty(qty: number) {
  if (!qty) return '0'
  if (qty >= 1) return qty.toFixed(4).replace(/\.?0+$/, '')
  return qty.toFixed(8).replace(/\.?0+$/, '')
}

export default function CryptoWallet() {
  const { holdings, totalNGN, transactions, coins, prices, isLoading, fetchWallet, buyCrypto, sellCrypto, convertCrypto } = useCryptoStore()
  const { balance, setBalance } = useWalletStore()

  const [tab, setTab]           = useState<'wallet' | 'market' | 'history'>('wallet')
  const [showBuy, setShowBuy]   = useState(false)
  const [showSell, setShowSell] = useState(false)
  const [showConvert, setShowConvert] = useState(false)
  const [loading, setLoading]   = useState(false)

  // Buy form
  const [buyCoin, setBuyCoin]   = useState('')
  const [buyNGN, setBuyNGN]     = useState('')

  // Sell form
  const [sellCoin, setSellCoin] = useState('')
  const [sellQty, setSellQty]   = useState('')

  // Convert form
  const [fromCoin, setFromCoin] = useState('')
  const [toCoin, setToCoin]     = useState('')
  const [convQty, setConvQty]   = useState('')

  useEffect(() => { fetchWallet() }, [])

  const safeHoldings = holdings ?? []
  const safeCoins    = coins    ?? []
  const safeTxs      = transactions ?? []

  // Derived buy values
  const buyPrice    = buyCoin ? (prices[buyCoin] ?? 0) : 0
  const buyQty      = buyPrice > 0 && Number(buyNGN) > 0 ? (Number(buyNGN) * 0.995) / buyPrice : 0
  const buyFee      = Number(buyNGN) * 0.005

  // Derived sell values
  const sellPrice   = sellCoin ? (prices[sellCoin] ?? 0) : 0
  const sellNGNNet  = sellPrice > 0 ? Number(sellQty) * sellPrice * 0.995 : 0
  const holdingQty  = safeHoldings.find(h => h.symbol === sellCoin)?.quantity ?? 0

  const pieData = safeHoldings.map(h => ({ name: h.symbol, value: h.ngnValue, color: h.color }))

  const handleBuy = async () => {
    if (!buyCoin || !buyNGN) { toast.error('Select coin and amount'); return }
    const ngnAmt = Number(buyNGN)
    if (ngnAmt > balance) { toast.error('Insufficient wallet balance'); return }
    setLoading(true)
    try {
      await buyCrypto(buyCoin, ngnAmt)
      setBalance(balance - ngnAmt - buyFee)
      await fetchWallet()
      toast.success(`Bought ${fmtQty(buyQty)} ${buyCoin}!`)
      setShowBuy(false); setBuyCoin(''); setBuyNGN('')
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Purchase failed')
    } finally { setLoading(false) }
  }

  const handleSell = async () => {
    if (!sellCoin || !sellQty) { toast.error('Select coin and quantity'); return }
    if (Number(sellQty) > holdingQty) { toast.error('Insufficient crypto balance'); return }
    setLoading(true)
    try {
      await sellCrypto(sellCoin, Number(sellQty))
      setBalance(balance + sellNGNNet)
      await fetchWallet()
      toast.success(`Sold ${sellQty} ${sellCoin} for ${formatCurrency(sellNGNNet, 'NGN', true)}!`)
      setShowSell(false); setSellCoin(''); setSellQty('')
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Sale failed')
    } finally { setLoading(false) }
  }

  const handleConvert = async () => {
    if (!fromCoin || !toCoin || !convQty) { toast.error('Fill all fields'); return }
    if (fromCoin === toCoin) { toast.error('Cannot convert to the same coin'); return }
    const fromQty = safeHoldings.find(h => h.symbol === fromCoin)?.quantity ?? 0
    if (Number(convQty) > fromQty) { toast.error('Insufficient balance'); return }
    setLoading(true)
    try {
      await convertCrypto(fromCoin, toCoin, Number(convQty))
      await fetchWallet()
      toast.success(`Converted ${convQty} ${fromCoin} → ${toCoin}!`)
      setShowConvert(false); setFromCoin(''); setToCoin(''); setConvQty('')
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Conversion failed')
    } finally { setLoading(false) }
  }

  const content = (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">Crypto</h1><p className="page-subtitle">Buy, sell & convert digital assets</p></div>
        <button onClick={() => fetchWallet()} className="btn-icon bg-gray-100">
          <RefreshCw size={16} className={cn('text-gray-600', isLoading && 'animate-spin')} />
        </button>
      </div>

      {/* Portfolio Hero */}
      <div className="mx-4 mb-4 rounded-4xl overflow-hidden shadow-premium bg-gradient-to-br from-orange-500 to-amber-600 relative">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border-[20px] border-white/10" />
        <div className="p-5 relative z-10">
          <p className="text-white/70 text-xs mb-1">Portfolio Value</p>
          <p className="font-display font-bold text-white text-3xl mb-3">{formatCurrency(totalNGN, 'NGN', true)}</p>
          <div className="flex gap-3">
            <button onClick={() => setShowBuy(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-white text-orange-600 font-bold py-2.5 rounded-2xl hover:bg-orange-50 transition-all text-sm active:scale-95">
              <Plus size={15} /> Buy
            </button>
            <button onClick={() => setShowSell(true)} disabled={safeHoldings.length === 0}
              className="flex-1 flex items-center justify-center gap-2 bg-white/20 text-white font-bold py-2.5 rounded-2xl hover:bg-white/30 transition-all text-sm active:scale-95 disabled:opacity-40">
              <Minus size={15} /> Sell
            </button>
            <button onClick={() => setShowConvert(true)} disabled={safeHoldings.length < 1}
              className="flex-1 flex items-center justify-center gap-2 bg-white/20 text-white font-bold py-2.5 rounded-2xl hover:bg-white/30 transition-all text-sm active:scale-95 disabled:opacity-40">
              <ArrowUpDown size={15} /> Convert
            </button>
          </div>
        </div>
      </div>

      {/* 0.5% fee notice */}
      <div className="mx-4 mb-4 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 text-xs text-amber-800">
        <strong>0.5% fee</strong> applied on all buy and sell transactions.
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 px-4 mb-4">
        {(['wallet', 'market', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('tab-pill flex-1 capitalize', tab === t ? 'tab-active' : 'tab-inactive')}>
            {t === 'history' ? `History (${safeTxs.length})` : t === 'wallet' ? `Holdings (${safeHoldings.length})` : 'Market'}
          </button>
        ))}
      </div>

      {/* WALLET TAB */}
      {tab === 'wallet' && (
        <div className="px-4">
          {safeHoldings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl shadow-card">
              <p className="text-4xl mb-3">₿</p>
              <p className="font-bold text-gray-500">No crypto holdings yet</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">Buy your first crypto with NGN</p>
              <button onClick={() => setShowBuy(true)} className="btn-primary px-6 py-2.5 text-sm">Buy Crypto</button>
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
                    <Tooltip formatter={(v: number) => [formatCurrency(v, 'NGN', true)]} contentStyle={{ borderRadius: 12, border: 'none', fontSize: 11 }} />
                  </PieChart>
                  <div className="flex-1 space-y-1.5">
                    {safeHoldings.map(h => (
                      <div key={h.symbol} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: h.color }} />
                          <span className="font-bold text-gray-700">{h.symbol}</span>
                        </span>
                        <span className="text-gray-500">{totalNGN > 0 ? Math.round(h.ngnValue / totalNGN * 100) : 0}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                {safeHoldings.map(h => (
                  <div key={h.symbol} className="bg-white rounded-3xl shadow-card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ background: h.color }}>
                      {h.symbol.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900">{h.name}</p>
                      <p className="text-xs text-gray-400">{fmtQty(h.quantity)} {h.symbol}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-gray-900">{formatCurrency(h.ngnValue, 'NGN', true)}</p>
                      <p className="text-xs text-gray-400">@ {formatCurrency(h.price, 'NGN', true)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* MARKET TAB */}
      {tab === 'market' && (
        <div className="px-4">
          <div className="surface">
            {safeCoins.map((coin, idx) => (
              <div key={coin.symbol} className={cn('list-item', idx < safeCoins.length - 1 && 'border-b border-gray-50')}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ background: coin.color }}>
                  {coin.symbol.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{coin.symbol}</p>
                  <p className="text-xs text-gray-400">{coin.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(coin.price, 'NGN', true)}</p>
                    <div className="flex items-center gap-1 justify-end">
                      <TrendingUp size={10} className="text-brand-500" />
                      <span className="text-[10px] text-brand-600 font-bold">+2.4%</span>
                    </div>
                  </div>
                  <button onClick={() => { setBuyCoin(coin.symbol); setShowBuy(true) }}
                    className="px-2.5 py-1.5 bg-brand-50 text-brand-700 font-bold text-xs rounded-xl hover:bg-brand-100 transition-colors">
                    Buy
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HISTORY TAB */}
      {tab === 'history' && (
        <div className="px-4">
          {safeTxs.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm bg-white rounded-3xl shadow-card">No transactions yet</div>
          ) : (
            <div className="surface">
              {safeTxs.map((tx, idx) => {
                const meta = TX_TYPE_META[tx.type] ?? { label: tx.type, color: 'text-gray-600' }
                return (
                  <div key={tx.id} className={cn('list-item', idx < safeTxs.length - 1 && 'border-b border-gray-50')}>
                    <div className="w-9 h-9 rounded-2xl bg-gray-50 flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: `${(coins.find(c => c.symbol === tx.symbol) as CryptoCoin | undefined)?.color ?? '#9ca3af'}20` }}>
                      {tx.symbol.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{meta.label} {tx.symbol}</p>
                      <p className="text-xs text-gray-400">{fmtQty(tx.amount)} {tx.symbol} · {formatDate(tx.createdAt, 'relative')}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn('text-sm font-bold', meta.color)}>{formatCurrency(tx.ngnValue, 'NGN', true)}</p>
                      <p className="text-[10px] text-gray-400">fee {formatCurrency(tx.fee, 'NGN', true)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <>
      <AppHeader title="Crypto Wallet" showBack />
      <DeviceFrame>{content}</DeviceFrame>

      {/* Buy Modal */}
      <Modal isOpen={showBuy} onClose={() => { setShowBuy(false); setBuyCoin(''); setBuyNGN('') }} title="Buy Crypto">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Select Coin</label>
            <div className="grid grid-cols-4 gap-2">
              {safeCoins.map(c => (
                <button key={c.symbol} onClick={() => setBuyCoin(c.symbol)}
                  className={cn('flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-all',
                    buyCoin === c.symbol ? 'border-brand-500 bg-brand-50' : 'border-gray-200')}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: c.color }}>{c.symbol.slice(0,2)}</div>
                  <p className="text-[10px] font-bold text-gray-900">{c.symbol}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="bg-brand-50 rounded-xl px-4 py-3 flex justify-between text-sm">
            <span className="text-gray-600">Wallet</span>
            <span className="font-bold text-brand-700">{formatCurrency(balance)}</span>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Amount to Spend (₦)</label>
            <input value={buyNGN} onChange={e => setBuyNGN(e.target.value)} type="number" placeholder="0.00" className="input-field text-2xl font-bold" />
          </div>
          {buyCoin && Number(buyNGN) > 0 && (
            <div className="bg-gray-50 rounded-2xl p-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">You get</span><span className="font-bold text-gray-900">{fmtQty(buyQty)} {buyCoin}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Fee (0.5%)</span><span className="font-bold text-orange-500">+{formatCurrency(buyFee)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total deducted</span><span className="font-bold">{formatCurrency(Number(buyNGN) + buyFee)}</span></div>
            </div>
          )}
          {Number(buyNGN) + buyFee > balance && Number(buyNGN) > 0 && <p className="text-red-500 text-xs">Insufficient balance</p>}
          <button onClick={handleBuy} disabled={loading || !buyCoin || !buyNGN || Number(buyNGN) + buyFee > balance}
            className="btn-primary w-full py-4">{loading ? 'Buying…' : `Buy ${buyCoin || 'Crypto'}`}</button>
        </div>
      </Modal>

      {/* Sell Modal */}
      <Modal isOpen={showSell} onClose={() => { setShowSell(false); setSellCoin(''); setSellQty('') }} title="Sell Crypto">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Select Coin to Sell</label>
            <div className="space-y-2">
              {safeHoldings.map(h => (
                <button key={h.symbol} onClick={() => setSellCoin(h.symbol)}
                  className={cn('w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left',
                    sellCoin === h.symbol ? 'border-brand-400 bg-brand-50' : 'border-gray-200')}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold" style={{ background: h.color }}>{h.symbol.slice(0,2)}</div>
                  <div className="flex-1"><p className="text-sm font-bold text-gray-900">{h.symbol}</p><p className="text-xs text-gray-400">{fmtQty(h.quantity)} available</p></div>
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(h.ngnValue, 'NGN', true)}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Quantity to Sell</label>
            <input value={sellQty} onChange={e => setSellQty(e.target.value)} type="number" placeholder={`Max: ${holdingQty}`} className="input-field text-xl font-bold" />
          </div>
          {sellCoin && Number(sellQty) > 0 && (
            <div className="bg-gray-50 rounded-2xl p-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">You receive</span><span className="font-bold text-brand-600">{formatCurrency(sellNGNNet)}</span></div>
              <div className="flex justify-between mt-1"><span className="text-gray-500">Fee (0.5%)</span><span className="font-bold text-orange-500">-{formatCurrency(Number(sellQty) * sellPrice * 0.005)}</span></div>
            </div>
          )}
          <button onClick={handleSell} disabled={loading || !sellCoin || !sellQty || Number(sellQty) > holdingQty}
            className="w-full py-4 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-colors disabled:opacity-50">
            {loading ? 'Selling…' : `Sell ${sellCoin || 'Crypto'}`}</button>
        </div>
      </Modal>

      {/* Convert Modal */}
      <Modal isOpen={showConvert} onClose={() => { setShowConvert(false); setFromCoin(''); setToCoin(''); setConvQty('') }} title="Convert Crypto">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">From</label>
              <select value={fromCoin} onChange={e => setFromCoin(e.target.value)} className="input-field text-sm">
                <option value="">Select…</option>
                {safeHoldings.map(h => <option key={h.symbol} value={h.symbol}>{h.symbol} ({fmtQty(h.quantity)})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">To</label>
              <select value={toCoin} onChange={e => setToCoin(e.target.value)} className="input-field text-sm">
                <option value="">Select…</option>
                {safeCoins.filter(c => c.symbol !== fromCoin).map(c => <option key={c.symbol} value={c.symbol}>{c.symbol} — {c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Quantity</label>
            <input value={convQty} onChange={e => setConvQty(e.target.value)} type="number" placeholder="Amount to convert" className="input-field text-xl font-bold" />
          </div>
          {fromCoin && toCoin && Number(convQty) > 0 && (
            <div className="bg-gray-50 rounded-2xl p-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">NGN value</span><span className="font-bold">{formatCurrency(Number(convQty) * (prices[fromCoin] ?? 0))}</span></div>
              <div className="flex justify-between mt-1"><span className="text-gray-500">You get ≈</span><span className="font-bold text-brand-600">{fmtQty(Number(convQty) * (prices[fromCoin] ?? 0) * 0.995 / (prices[toCoin] ?? 1))} {toCoin}</span></div>
            </div>
          )}
          <button onClick={handleConvert} disabled={loading || !fromCoin || !toCoin || !convQty}
            className="btn-primary w-full py-4">{loading ? 'Converting…' : 'Convert'}</button>
        </div>
      </Modal>
    </>
  )
}
