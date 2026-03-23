import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Plus, Edit3, TrendingDown, CheckCircle2, AlertCircle } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import Modal from '@/components/modals/Modal'
import { useBudgetStore } from '@/store/useBudgetStore'
import { formatCurrency, percentage, cn, formatDate } from '@/lib/utils'
import type { BudgetCategory } from '@/types'
import toast from 'react-hot-toast'

export default function Budget() {
  const { budget, updateTotal, updateCategory, resetMonth } = useBudgetStore()
  const [showEdit, setShowEdit] = useState(false)
  const [editCat,  setEditCat]  = useState<BudgetCategory|null>(null)
  const [newAlloc, setNewAlloc] = useState('')
  const [newTotal, setNewTotal] = useState('')

  const totalSpent    = (budget?.categories ?? []).reduce((s,c)=>s+c.spent, 0)
  const totalAlloc    = (budget?.categories ?? []).reduce((s,c)=>s+c.allocated, 0)
  const totalPct      = percentage(totalSpent, budget.totalBudget)
  const overBudgetCats= (budget?.categories ?? []).filter(c=>c.spent>c.allocated)

  const saveCatEdit = () => {
    if (!editCat || !newAlloc) return
    updateCategory(editCat.category, { allocated: Number(newAlloc) })
    toast.success('Budget updated!')
    setEditCat(null); setNewAlloc('')
  }

  const content = (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Budget Manager</h1>
          <p className="page-subtitle">{formatDate(new Date(),'month')}</p>
        </div>
        <button onClick={() => setShowEdit(true)} className="btn-icon bg-gray-100 hover:bg-gray-200">
          <Edit3 size={16} className="text-gray-600"/>
        </button>
      </div>

      {/* Overview card */}
      <div className="mx-4 mb-4 bg-analytics-gradient rounded-3xl p-5 relative overflow-hidden shadow-premium">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border-[20px] border-white/10"/>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white/60 text-xs font-semibold">Monthly Budget</p>
              <p className="font-display font-bold text-white text-3xl">{formatCurrency(budget.totalBudget,'NGN',true)}</p>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-xs font-semibold">Spent</p>
              <p className={cn('font-display font-bold text-2xl', totalPct>=90?'text-red-300':totalPct>=70?'text-amber-300':'text-white')}>
                {formatCurrency(totalSpent,'NGN',true)}
              </p>
            </div>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-1.5">
            <div className="h-full rounded-full transition-all" style={{
              width:`${totalPct}%`,
              background: totalPct>=90?'#ef4444':totalPct>=70?'#f59e0b':'#22c55e'
            }}/>
          </div>
          <div className="flex justify-between text-xs text-white/60">
            <span>{totalPct}% used</span>
            <span>{formatCurrency(budget.totalBudget-totalSpent,'NGN',true)} remaining</span>
          </div>
        </div>
      </div>

      {/* Alert */}
      {overBudgetCats.length > 0 && (
        <div className="mx-4 mb-4 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0"/>
          <p className="text-sm font-bold text-red-700">
            Over budget in: {overBudgetCats.map(c=>c.category).join(', ')}
          </p>
        </div>
      )}

      {/* Pie chart */}
      <div className="mx-4 mb-4 bg-white rounded-3xl shadow-card p-4">
        <p className="font-display font-bold text-sm text-gray-900 mb-4">Spending by Category</p>
        <div className="flex items-center gap-4">
          <ResponsiveContainer width={120} height={120}>
            <PieChart>
              <Pie data={budget.categories} cx={55} cy={55} innerRadius={35} outerRadius={55} dataKey="spent" paddingAngle={2}>
                {budget.categories.map((c,i)=><Cell key={i} fill={c.color}/>)}
              </Pie>
              <Tooltip formatter={(v:number)=>formatCurrency(v)} contentStyle={{borderRadius:12,border:'none',fontSize:11}}/>
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-1.5 max-h-28 overflow-y-auto">
            {budget.categories.map(cat=>(
              <div key={cat.category} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:cat.color}}/>
                <span className="text-xs text-gray-600 flex-1 truncate">{cat.category}</span>
                <span className="text-xs font-bold text-gray-900">{percentage(cat.spent,cat.allocated)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="px-4">
        <p className="section-label">Category Breakdown</p>
        <div className="space-y-3">
          {budget.categories.map(cat=>{
            const pct = percentage(cat.spent, cat.allocated)
            const over = cat.spent > cat.allocated
            return (
              <div key={cat.category} className="bg-white rounded-3xl shadow-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{background:cat.color}}/>
                    <span className="text-sm font-bold text-gray-900">{cat.category}</span>
                    {over && <span className="badge badge-red text-[9px]">Over budget</span>}
                  </div>
                  <button onClick={()=>{setEditCat(cat);setNewAlloc(String(cat.allocated))}} className="text-xs text-brand-600 font-bold hover:text-brand-700">
                    Edit
                  </button>
                </div>
                <div className="progress-bar mb-1.5">
                  <div className="progress-fill" style={{
                    '--progress':`${Math.min(pct,100)}%`,
                    background: over?'#ef4444':cat.color
                  } as React.CSSProperties}/>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Spent: <span className={cn('font-bold',over?'text-red-600':'text-gray-900')}>{formatCurrency(cat.spent,'NGN',true)}</span></span>
                  <span>Budget: <span className="font-bold text-gray-900">{formatCurrency(cat.allocated,'NGN',true)}</span></span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Reset month */}
        <div className="mt-5 mb-4">
          <button onClick={()=>{resetMonth();toast.success('Budget reset for new month!')}}
            className="w-full py-3.5 border-2 border-gray-200 rounded-2xl text-sm font-bold text-gray-500 hover:border-gray-300 hover:bg-gray-50 transition-all">
            Reset for New Month
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <AppHeader title="Budget" showBack/>
      <DeviceFrame>{content}</DeviceFrame>

      {/* Edit total modal */}
      <Modal isOpen={showEdit} onClose={()=>setShowEdit(false)} title="Edit Monthly Budget">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Total Budget (₦)</label>
            <input value={newTotal} onChange={e=>setNewTotal(e.target.value)} type="number" placeholder={String(budget.totalBudget)} className="input-field text-xl font-bold"/>
          </div>
          <button onClick={()=>{if(newTotal){updateTotal(Number(newTotal));toast.success('Budget updated!');setShowEdit(false);setNewTotal('')}}} className="btn-primary w-full py-3.5">
            Save Budget
          </button>
        </div>
      </Modal>

      {/* Edit category modal */}
      <Modal isOpen={!!editCat} onClose={()=>{setEditCat(null);setNewAlloc('')}} title={`Edit ${editCat?.category}`}>
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-2xl p-3 flex justify-between text-sm">
            <span className="text-gray-500">Current spent</span>
            <span className="font-bold">{formatCurrency(editCat?.spent??0)}</span>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">New Budget Allocation (₦)</label>
            <input value={newAlloc} onChange={e=>setNewAlloc(e.target.value)} type="number" className="input-field text-lg font-bold"/>
          </div>
          <button onClick={saveCatEdit} className="btn-primary w-full py-3.5">Save</button>
        </div>
      </Modal>
    </>
  )
}
