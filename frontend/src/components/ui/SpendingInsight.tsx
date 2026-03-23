import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency, CATEGORY_COLORS } from '@/lib/utils'
import type { SpendingCategory } from '@/types'

const DEFAULT: SpendingCategory[] = [
  {category:'Bills',amount:45000,percentage:35,color:CATEGORY_COLORS[0]},
  {category:'Transfer',amount:30000,percentage:23,color:CATEGORY_COLORS[1]},
  {category:'Food',amount:20000,percentage:16,color:CATEGORY_COLORS[2]},
  {category:'Shopping',amount:15000,percentage:12,color:CATEGORY_COLORS[3]},
  {category:'Others',amount:18000,percentage:14,color:CATEGORY_COLORS[4]},
]

export default function SpendingInsight({ data=DEFAULT }: { data?: SpendingCategory[] }) {
  return (
    <div className="bg-white rounded-3xl shadow-card p-4">
      <p className="font-display font-bold text-sm text-gray-900 mb-4">Spending Breakdown</p>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={110} height={110}>
          <PieChart><Pie data={data} cx={50} cy={50} innerRadius={32} outerRadius={52} dataKey="amount" paddingAngle={3}>
            {data.map((e,i)=><Cell key={i} fill={e.color}/>)}
          </Pie></PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-1.5">
          {data.map(cat=>(
            <div key={cat.category} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:cat.color}}/>
              <span className="text-xs text-gray-600 flex-1 font-medium">{cat.category}</span>
              <span className="text-xs font-bold text-gray-900">{cat.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
