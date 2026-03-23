import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown, Target, Award, Lightbulb, BarChart3, PieChart as PieIcon, Activity } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import { useWalletStore } from '@/store/useWalletStore'
import { useSavingsStore } from '@/store/useSavingsStore'
import { useInvestmentStore } from '@/store/useInvestmentStore'
import { useBudgetStore } from '@/store/useBudgetStore'
import { formatCurrency, percentage, cn, CATEGORY_COLORS } from '@/lib/utils'

const MONTHLY = [
  { month:'Jan', income:120000, expense:80000, savings:15000, netWorth:350000 },
  { month:'Feb', income:95000,  expense:65000, savings:12000, netWorth:362000 },
  { month:'Mar', income:180000, expense:110000,savings:25000, netWorth:395000 },
  { month:'Apr', income:140000, expense:90000, savings:18000, netWorth:420000 },
  { month:'May', income:220000, expense:130000,savings:35000, netWorth:468000 },
  { month:'Jun', income:190000, expense:100000,savings:30000, netWorth:510000 },
  { month:'Jul', income:210000, expense:120000,savings:40000, netWorth:562000 },
]

const DAILY_SPEND = [
  {day:'Mon',amount:8500},{day:'Tue',amount:3200},{day:'Wed',amount:15000},
  {day:'Thu',amount:6800},{day:'Fri',amount:22000},{day:'Sat',amount:18500},{day:'Sun',amount:4000},
]

const FINANCIAL_SCORE = [
  { axis:'Savings Rate',    value:72 },
  { axis:'Debt Ratio',      value:85 },
  { axis:'Investment Div.',  value:60 },
  { axis:'Emergency Fund',  value:45 },
  { axis:'Budget Adherence',value:78 },
]

const INSIGHTS = [
  { icon:TrendingUp,  color:'text-brand-600',  bg:'bg-brand-50',  title:'Savings Rate +8%',  body:'You saved more than last month. Keep it up!' },
  { icon:TrendingDown,color:'text-red-500',    bg:'bg-red-50',    title:'Food spending +23%', body:'₦8,200 over your food budget this month.' },
  { icon:Target,      color:'text-purple-600', bg:'bg-purple-50', title:'Investment goal 68%', body:'₦32,000 more to reach your ₦100K target.' },
  { icon:Award,       color:'text-amber-600',  bg:'bg-amber-50',  title:'Financial Score: 72',body:'Better than 65% of OPay users your age.' },
]

type ChartTab = 'cashflow' | 'spending' | 'networth' | 'daily'

export default function Analytics() {
  const { balance, transactions } = useWalletStore()
  const { plans } = useSavingsStore()
  const { investments, totalValue } = useInvestmentStore()
  const { budget } = useBudgetStore()
  const [chart, setChart] = useState<ChartTab>('cashflow')
  const [period, setPeriod] = useState<'1m'|'3m'|'6m'>('6m')

  const totalSavings = (plans ?? []).reduce((s,p)=>s+p.currentAmount,0)
  const totalInvested = totalValue() ?? 0
  const savingsRate = balance > 0 ? percentage(totalSavings, balance+totalSavings) : 0
  const budgetUtilization = percentage(budget.categories.reduce((s,c)=>s+c.spent,0), budget.totalBudget)

  const spendByCategory = budget.categories.map((c,i)=>({
    name:c.category, value:c.spent, color:CATEGORY_COLORS[i]
  }))

  const content = (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">Analytics</h1><p className="page-subtitle">Your financial health dashboard</p></div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 px-4 mb-4">
        {[
          { label:'Net Worth',         value:formatCurrency(balance+totalSavings+totalInvested,'NGN',true), color:'text-brand-700',  bg:'bg-brand-50', trend:+12.4 },
          { label:'Savings Rate',      value:`${savingsRate}%`,                                              color:'text-blue-700',  bg:'bg-blue-50',  trend:+8.1 },
          { label:'Budget Used',       value:`${budgetUtilization}%`,                                        color:budgetUtilization>80?'text-red-700':'text-purple-700', bg:budgetUtilization>80?'bg-red-50':'bg-purple-50', trend:-2.3 },
          { label:'Investments',       value:formatCurrency(totalInvested,'NGN',true),                       color:'text-amber-700', bg:'bg-amber-50', trend:+15.8 },
        ].map(({ label, value, color, bg, trend }) => (
          <div key={label} className="bg-white rounded-3xl shadow-card p-4">
            <p className="text-xs font-bold text-gray-400 mb-1">{label}</p>
            <p className={cn('font-display font-bold text-lg', color)}>{value}</p>
            <p className={cn('text-[10px] font-bold flex items-center gap-0.5 mt-0.5', trend>=0?'text-brand-600':'text-red-500')}>
              {trend>=0?<TrendingUp size={9}/>:<TrendingDown size={9}/>}{Math.abs(trend)}% vs last month
            </p>
          </div>
        ))}
      </div>

      {/* Financial health score */}
      <div className="mx-4 mb-4 bg-analytics-gradient rounded-3xl p-5 relative overflow-hidden shadow-premium">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border-[20px] border-white/10"/>
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-white/60 text-xs font-semibold mb-1">Financial Health Score</p>
            <p className="font-display font-bold text-white text-4xl">72</p>
            <p className="text-indigo-200 text-xs mt-1">Good · Better than 65% of users</p>
          </div>
          <div className="w-20 h-20 relative">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3"/>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#818cf8" strokeWidth="3"
                strokeDasharray="72 28" strokeLinecap="round"/>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-bold text-sm">72%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart switcher */}
      <div className="px-4 mb-3">
        <div className="flex gap-1.5 bg-gray-100 rounded-2xl p-1">
          {([
            {id:'cashflow' as ChartTab, icon:Activity,   label:'Flow'     },
            {id:'spending' as ChartTab, icon:PieIcon,    label:'Spending' },
            {id:'networth' as ChartTab, icon:TrendingUp, label:'Worth'    },
            {id:'daily'    as ChartTab, icon:BarChart3,  label:'Daily'    },
          ]).map(({id,icon:Icon,label})=>(
            <button key={id} onClick={()=>setChart(id)}
              className={cn('flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition-all',
                chart===id?'bg-white text-brand-700 shadow-sm':'text-gray-500 hover:text-gray-700')}>
              <Icon size={13}/>{label}
            </button>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="mx-4 mb-4 bg-white rounded-3xl shadow-card p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="font-display font-bold text-sm text-gray-900">
            {chart==='cashflow'?'Cash Flow':chart==='spending'?'Spending Mix':chart==='networth'?'Net Worth Growth':'Daily Spend'}
          </p>
          {chart!=='spending' && (
            <div className="flex gap-1">
              {(['1m','3m','6m'] as const).map(p=>(
                <button key={p} onClick={()=>setPeriod(p)} className={cn('tab-pill text-[10px]',period===p?'tab-active':'tab-inactive')}>{p}</button>
              ))}
            </div>
          )}
        </div>

        {chart==='cashflow' && (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={MONTHLY} margin={{top:5,right:0,left:-20,bottom:0}}>
              <defs>
                <linearGradient id="ig4" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#16a34a" stopOpacity={0.3}/><stop offset="95%" stopColor="#16a34a" stopOpacity={0}/></linearGradient>
                <linearGradient id="eg4" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{fontSize:10,fill:'#9ca3af'}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10,fill:'#9ca3af'}} axisLine={false} tickLine={false} tickFormatter={v=>`₦${v/1000}K`}/>
              <Tooltip formatter={(v:number)=>formatCurrency(v)} contentStyle={{borderRadius:12,border:'none',boxShadow:'0 4px 20px rgba(0,0,0,0.1)',fontSize:11}}/>
              <Area type="monotone" dataKey="income"  stroke="#16a34a" strokeWidth={2.5} fill="url(#ig4)" name="Income"/>
              <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2.5} fill="url(#eg4)" name="Expenses"/>
            </AreaChart>
          </ResponsiveContainer>
        )}

        {chart==='spending' && (
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={120} height={120}>
              <PieChart><Pie data={spendByCategory} cx={55} cy={55} innerRadius={35} outerRadius={55} dataKey="value" paddingAngle={2}>
                {spendByCategory.map((c,i)=><Cell key={i} fill={c.color}/>)}
              </Pie></PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2 max-h-32 overflow-y-auto">
              {spendByCategory.map(c=>(
                <div key={c.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{background:c.color}}/>
                  <span className="text-xs text-gray-600 flex-1 truncate">{c.name}</span>
                  <span className="text-xs font-bold text-gray-900">{formatCurrency(c.value,'NGN',true)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {chart==='networth' && (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={MONTHLY} margin={{top:5,right:0,left:-20,bottom:0}}>
              <XAxis dataKey="month" tick={{fontSize:10,fill:'#9ca3af'}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10,fill:'#9ca3af'}} axisLine={false} tickLine={false} tickFormatter={v=>`₦${v/1000}K`}/>
              <Tooltip formatter={(v:number)=>formatCurrency(v)} contentStyle={{borderRadius:12,border:'none',fontSize:11}}/>
              <Line type="monotone" dataKey="netWorth" stroke="#8b5cf6" strokeWidth={2.5} dot={{fill:'#8b5cf6',r:4}} name="Net Worth"/>
            </LineChart>
          </ResponsiveContainer>
        )}

        {chart==='daily' && (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={DAILY_SPEND} margin={{top:5,right:0,left:-20,bottom:0}} barSize={20}>
              <XAxis dataKey="day" tick={{fontSize:10,fill:'#9ca3af'}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10,fill:'#9ca3af'}} axisLine={false} tickLine={false} tickFormatter={v=>`₦${v/1000}K`}/>
              <Tooltip formatter={(v:number)=>formatCurrency(v)} contentStyle={{borderRadius:12,border:'none',fontSize:11}}/>
              <Bar dataKey="amount" fill="#16a34a" radius={[6,6,0,0]} name="Spending"/>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* AI Insights */}
      <div className="px-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={16} className="text-amber-500"/>
          <p className="font-display font-bold text-gray-900">Smart Insights</p>
        </div>
        <div className="space-y-3">
          {INSIGHTS.map(({ icon:Icon, color, bg, title, body }) => (
            <div key={title} className="bg-white rounded-3xl shadow-card p-4 flex items-start gap-3">
              <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0', bg)}>
                <Icon size={18} className={color} strokeWidth={1.8}/>
              </div>
              <div>
                <p className="font-bold text-sm text-gray-900">{title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <AppHeader title="Analytics" showBack/>
      <DeviceFrame>{content}</DeviceFrame>
    </>
  )
}
