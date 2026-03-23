import { useEffect, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Filter, TrendingUp, TrendingDown, Download, BarChart3, Activity } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import { useWalletStore } from '@/store/useWalletStore'
import TransactionItem from '@/components/common/TransactionItem'
import { TransactionSkeleton } from '@/components/common/Skeleton'
import TransactionDetailModal from '@/components/modals/TransactionDetailModal'
import SpendingInsight from '@/components/ui/SpendingInsight'
import SectionHeader from '@/components/ui/SectionHeader'
import { formatCurrency, cn, CATEGORY_COLORS } from '@/lib/utils'
import type { Transaction } from '@/types'
import toast from 'react-hot-toast'

type FilterType = 'all'|'credit'|'debit'
type PeriodType = '7d'|'30d'|'90d'
type TabType    = 'overview'|'transactions'|'analytics'

const MOCK_AREA = [
  { month:'Jan', income:120000, expense:80000, savings:15000 },
  { month:'Feb', income:95000,  expense:65000, savings:12000 },
  { month:'Mar', income:180000, expense:110000,savings:25000 },
  { month:'Apr', income:140000, expense:90000, savings:18000 },
  { month:'May', income:220000, expense:130000,savings:35000 },
  { month:'Jun', income:190000, expense:100000,savings:30000 },
]

export default function Finance() {
  const { transactions, totalTransactions, isLoading, fetchTransactions, balance } = useWalletStore()
  const [filter,    setFilter]    = useState<FilterType>('all')
  const [period,    setPeriod]    = useState<PeriodType>('30d')
  const [tab,       setTab]       = useState<TabType>('overview')
  const [page,      setPage]      = useState(1)
  const [detailTx,  setDetailTx]  = useState<Transaction|null>(null)

  useEffect(() => { fetchTransactions(1, true); setPage(1) }, [])

  const loadMore = async () => { const n = page+1; await fetchTransactions(n); setPage(n) }

  const safeTxs = transactions ?? []
  const filtered = safeTxs.filter(tx => {
    if (filter==='credit') return tx.amount > 0
    if (filter==='debit')  return tx.amount < 0
    return true
  })

  const totalCredit = safeTxs.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0)
  const totalDebit  = safeTxs.filter(t=>t.amount<0).reduce((s,t)=>s+Math.abs(t.amount),0)
  const netFlow     = totalCredit - totalDebit

  const exportCSV = () => {
    const rows = [
      ['Date','Description','Type','Amount','Status','Reference'],
      ...safeTxs.map(tx => [tx.createdAt, tx.description, tx.type, tx.amount, tx.status, tx.reference]),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type:'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href=url; a.download='transactions.csv'; a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported!')
  }

  const content = (
    <div className="page-container">
      <div className="px-4 pt-4 pb-3">
        <h1 className="font-display font-bold text-xl text-gray-900">Finance</h1>
        <p className="text-gray-400 text-sm mt-0.5">Your complete financial picture</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 px-4 mb-4">
        {(['overview','transactions','analytics'] as const).map(t => (
          <button key={t} onClick={()=>setTab(t)} className={cn('tab-pill flex-1 capitalize', tab===t?'tab-active':'tab-inactive')}>{t}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3 px-4 mb-4">
            <div className="bg-white rounded-3xl shadow-card p-4">
              <div className="flex items-center gap-1.5 mb-2"><ArrowDownLeft size={14} className="text-brand-600"/><span className="text-[10px] font-bold text-gray-400">Income</span></div>
              <p className="font-display font-bold text-brand-700 text-base">{formatCurrency(totalCredit,'NGN',true)}</p>
              <p className="text-[10px] text-brand-500 flex items-center gap-0.5 mt-1"><TrendingUp size={9}/>+12%</p>
            </div>
            <div className="bg-white rounded-3xl shadow-card p-4">
              <div className="flex items-center gap-1.5 mb-2"><ArrowUpRight size={14} className="text-red-500"/><span className="text-[10px] font-bold text-gray-400">Expenses</span></div>
              <p className="font-display font-bold text-red-600 text-base">{formatCurrency(totalDebit,'NGN',true)}</p>
              <p className="text-[10px] text-red-400 flex items-center gap-0.5 mt-1"><TrendingDown size={9}/>-5%</p>
            </div>
            <div className="bg-white rounded-3xl shadow-card p-4">
              <div className="flex items-center gap-1.5 mb-2"><Activity size={14} className="text-purple-600"/><span className="text-[10px] font-bold text-gray-400">Net Flow</span></div>
              <p className={cn('font-display font-bold text-base', netFlow>=0?'text-brand-700':'text-red-600')}>{formatCurrency(netFlow,'NGN',true)}</p>
              <p className="text-[10px] text-gray-400 mt-1">This month</p>
            </div>
          </div>

          {/* Balance hero */}
          <div className="mx-4 mb-4 bg-brand-gradient rounded-3xl p-4 flex items-center justify-between shadow-float-green">
            <div><p className="text-brand-100 text-xs font-semibold">Current Balance</p><p className="font-display font-bold text-white text-2xl">{formatCurrency(balance)}</p></div>
            <button onClick={exportCSV} className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all">
              <Download size={13}/> Export
            </button>
          </div>

          {/* Area Chart */}
          <div className="mx-4 mb-4 bg-white rounded-3xl shadow-card p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><BarChart3 size={16} className="text-brand-600"/><p className="font-display font-bold text-sm text-gray-900">Cash Flow</p></div>
              <div className="flex gap-1">
                {(['7d','30d','90d'] as const).map(p=>(
                  <button key={p} onClick={()=>setPeriod(p)} className={cn('tab-pill text-[11px]', period===p?'tab-active':'tab-inactive')}>{p}</button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={MOCK_AREA} margin={{top:5,right:0,left:-20,bottom:0}}>
                <defs>
                  <linearGradient id="incG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#16a34a" stopOpacity={0.3}/><stop offset="95%" stopColor="#16a34a" stopOpacity={0}/></linearGradient>
                  <linearGradient id="expG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{fontSize:10,fill:'#9ca3af'}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10,fill:'#9ca3af'}} axisLine={false} tickLine={false} tickFormatter={v=>`₦${v/1000}K`}/>
                <Tooltip formatter={(v:number)=>formatCurrency(v)} contentStyle={{borderRadius:14,border:'none',boxShadow:'0 4px 24px rgba(0,0,0,0.1)',fontSize:12}}/>
                <Area type="monotone" dataKey="income"  stroke="#16a34a" strokeWidth={2.5} fill="url(#incG)" name="Income"/>
                <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2.5} fill="url(#expG)" name="Expenses"/>
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-2">
              {[{color:'bg-brand-600',label:'Income'},{color:'bg-red-500',label:'Expenses'}].map(({color,label})=>(
                <span key={label} className="flex items-center gap-1.5 text-xs text-gray-500"><span className={cn('w-3 h-1.5 rounded-full',color)}/>{label}</span>
              ))}
            </div>
          </div>

          {/* Recent transactions */}
          <div className="px-4">
            <SectionHeader title="Recent Transactions" action={{ label:'View All', onClick:()=>setTab('transactions') }}/>
            <div className="bg-white rounded-3xl shadow-card overflow-hidden">
              {isLoading ? Array.from({length:4}).map((_,i)=><TransactionSkeleton key={i}/>) :
               filtered.length===0 ? <div className="text-center py-10 text-gray-400 text-sm">No transactions yet</div> :
               filtered.slice(0,5).map(tx => <div key={tx.id} onClick={()=>setDetailTx(tx)} className="cursor-pointer"><TransactionItem tx={tx}/></div>)
              }
            </div>
          </div>
        </>
      )}

      {tab === 'transactions' && (
        <div className="px-4">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Filter size={14} className="text-gray-400"/>
            {(['all','credit','debit'] as const).map(f=>(
              <button key={f} onClick={()=>setFilter(f)} className={cn('tab-pill capitalize', filter===f?'tab-active':'tab-inactive')}>{f}</button>
            ))}
            <button onClick={exportCSV} className="ml-auto flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-brand-600 transition-colors">
              <Download size={13}/> CSV
            </button>
            <span className="text-xs text-gray-400">{totalTransactions} total</span>
          </div>
          <div className="bg-white rounded-3xl shadow-card overflow-hidden">
            {isLoading && page===1 ? Array.from({length:6}).map((_,i)=><TransactionSkeleton key={i}/>) :
             filtered.length===0 ? <div className="text-center py-12 text-gray-400 text-sm font-medium">No transactions found</div> : (
              <>
                {filtered.map(tx=>(
                  <div key={tx.id} onClick={()=>setDetailTx(tx)} className="cursor-pointer">
                    <TransactionItem tx={tx}/>
                  </div>
                ))}
                {safeTxs.length < totalTransactions && (
                  <div className="p-4 text-center border-t border-gray-50">
                    <button onClick={loadMore} disabled={isLoading} className="text-brand-600 text-sm font-bold hover:text-brand-700 disabled:opacity-50">
                      {isLoading?'Loading…':'Load more'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {tab === 'analytics' && (
        <div className="px-4 space-y-4">
          {/* Bar chart */}
          <div className="bg-white rounded-3xl shadow-card p-4">
            <SectionHeader title="Monthly Comparison" subtitle="Income vs Expenses"/>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={MOCK_AREA} margin={{top:5,right:0,left:-20,bottom:0}} barCategoryGap="30%">
                <XAxis dataKey="month" tick={{fontSize:10,fill:'#9ca3af'}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10,fill:'#9ca3af'}} axisLine={false} tickLine={false} tickFormatter={v=>`₦${v/1000}K`}/>
                <Tooltip formatter={(v:number)=>formatCurrency(v)} contentStyle={{borderRadius:12,border:'none',boxShadow:'0 4px 24px rgba(0,0,0,0.1)',fontSize:12}}/>
                <Bar dataKey="income"  fill="#16a34a" radius={[6,6,0,0]} name="Income"/>
                <Bar dataKey="expense" fill="#fca5a5" radius={[6,6,0,0]} name="Expenses"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Spending breakdown */}
          <SpendingInsight/>
          {/* Monthly trend table */}
          <div className="bg-white rounded-3xl shadow-card overflow-hidden">
            <div className="px-4 pt-4 pb-2"><p className="font-display font-bold text-sm text-gray-900">Monthly Breakdown</p></div>
            {MOCK_AREA.slice().reverse().map((m,i)=>(
              <div key={m.month} className={cn('px-4 py-3.5 border-b border-gray-50 last:border-0',i===0&&'bg-brand-50/30')}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-900">{m.month} 2024</span>
                  <span className={cn('text-sm font-bold', (m.income-m.expense)>=0?'text-brand-600':'text-red-500')}>
                    {m.income-m.expense>=0?'+':''}{formatCurrency(m.income-m.expense,'NGN',true)}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1">
                  <div className="h-full bg-brand-500 rounded-full" style={{width:`${(m.income/220000)*100}%`}}/>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>In: {formatCurrency(m.income,'NGN',true)}</span>
                  <span>Out: {formatCurrency(m.expense,'NGN',true)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      <AppHeader title="Finance"/>
      <DeviceFrame>{content}</DeviceFrame>
      <TransactionDetailModal tx={detailTx} onClose={()=>setDetailTx(null)}/>
    </>
  )
}
