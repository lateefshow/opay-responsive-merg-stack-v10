import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }

export function formatCurrency(amount: number, currency='NGN', compact=false): string {
  if (compact && Math.abs(amount)>=1_000_000_000) return `₦${(amount/1_000_000_000).toFixed(1)}B`
  if (compact && Math.abs(amount)>=1_000_000) return `₦${(amount/1_000_000).toFixed(1)}M`
  if (compact && Math.abs(amount)>=1_000) return `₦${(amount/1_000).toFixed(1)}K`
  return new Intl.NumberFormat('en-NG',{style:'currency',currency,minimumFractionDigits:2}).format(amount)
}

export function formatCurrencyForeign(amount: number, currency='USD'): string {
  const symbols: Record<string,string> = { USD:'$', GBP:'£', EUR:'€', GHS:'GH₵', KES:'KSh' }
  const sym = symbols[currency] ?? currency
  return `${sym}${amount.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`
}

export function formatDate(date: string|Date, style:'short'|'long'|'relative'|'day'|'month'='short'): string {
  const d = new Date(date)
  if (style==='relative') {
    const diff=Date.now()-d.getTime(), m=Math.floor(diff/60000)
    if(m<1) return 'Just now'; if(m<60) return `${m}m ago`
    const h=Math.floor(m/60); if(h<24) return `${h}h ago`
    const days=Math.floor(h/24); if(days===1) return 'Yesterday'
    if(days<7) return `${days}d ago`
  }
  if (style==='month') return new Intl.DateTimeFormat('en-NG',{month:'long',year:'numeric'}).format(d)
  if (style==='day')   return new Intl.DateTimeFormat('en-NG',{weekday:'long',month:'long',day:'numeric'}).format(d)
  if (style==='long')  return new Intl.DateTimeFormat('en-NG',{dateStyle:'medium',timeStyle:'short'}).format(d)
  return new Intl.DateTimeFormat('en-NG',{month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(d)
}

export function getInitials(a: string, b: string) { return `${a[0]??''}${b[0]??''}`.toUpperCase() }
export function getGreeting() { const h=new Date().getHours(); return h<12?'Good morning':h<17?'Good afternoon':'Good evening' }
export function sleep(ms: number) { return new Promise<void>(r=>setTimeout(r,ms)) }
export function clamp(v:number,min:number,max:number) { return Math.min(Math.max(v,min),max) }
export function percentage(v:number,total:number) { return total?clamp(Math.round((v/total)*100),0,100):0 }
export function truncate(s:string,l=30) { return s.length>l?`${s.slice(0,l)}…`:s }
export function generateRef(prefix='REF') { return `${prefix}-${Math.random().toString(36).substring(2,10).toUpperCase()}` }

export function addDays(d: Date, days: number): Date { const r=new Date(d); r.setDate(r.getDate()+days); return r }
export function addMonths(d: Date, months: number): Date { const r=new Date(d); r.setMonth(r.getMonth()+months); return r }
export function diffDays(a: Date, b: Date): number { return Math.ceil((b.getTime()-a.getTime())/86400000) }
export function isExpiringSoon(endDate: string, days=30): boolean { return diffDays(new Date(), new Date(endDate)) <= days }

export function calcLoanRepayment(p:number, ratePercent:number, n:number) {
  const r=ratePercent/100/12
  if(r===0) return {monthly:p/n,total:p,interest:0}
  const m=p*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1)
  return {monthly:m,total:m*n,interest:m*n-p}
}

export function getStatusColor(s: string) {
  const m: Record<string,string> = { success:'text-brand-600 bg-brand-50',pending:'text-amber-600 bg-amber-50',processing:'text-blue-600 bg-blue-50',failed:'text-red-600 bg-red-50',reversed:'text-purple-600 bg-purple-50',active:'text-brand-600 bg-brand-50',frozen:'text-blue-600 bg-blue-50',overdue:'text-red-600 bg-red-50',repaid:'text-brand-600 bg-brand-50',expired:'text-gray-600 bg-gray-50',cancelled:'text-red-600 bg-red-50' }
  return m[s]??'text-gray-600 bg-gray-50'
}

export function maskPhone(p: string) { return p.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') }
export function maskEmail(e: string) { const [l,d]=e.split('@'); return `${l[0]}${'*'.repeat(l.length-2)}${l.slice(-1)}@${d}` }

export const CATEGORY_COLORS = ['#16a34a','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899','#84cc16','#6366f1']
export const AVATAR_COLORS   = ['#16a34a','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316']

export const CURRENCIES = [
  { code:'USD', flag:'🇺🇸', name:'US Dollar'        },
  { code:'GBP', flag:'🇬🇧', name:'British Pound'    },
  { code:'EUR', flag:'🇪🇺', name:'Euro'              },
  { code:'GHS', flag:'🇬🇭', name:'Ghanaian Cedi'    },
  { code:'KES', flag:'🇰🇪', name:'Kenyan Shilling'  },
  { code:'ZAR', flag:'🇿🇦', name:'South African Rand'},
  { code:'CNY', flag:'🇨🇳', name:'Chinese Yuan'     },
]
