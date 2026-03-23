import { useState, useEffect } from 'react'
import { FileText, Calculator, Download, CheckCircle2, Clock, AlertTriangle, RefreshCw, ChevronRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import Modal from '@/components/modals/Modal'
import { useTaxStore } from '@/store/useTaxStore'
import { formatCurrency, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const BRACKET_COLORS = ['#16a34a', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#0891b2']

const DOCS = [
  { type: 'annual_statement', label: 'Annual Tax Statement', desc: 'Full income and tax summary for the year', icon: '📄' },
  { type: 'paye_certificate', label: 'PAYE Certificate',     desc: 'Official Pay-As-You-Earn certificate',    icon: '🏛️' },
  { type: 'tax_clearance',    label: 'Tax Clearance',         desc: 'Proof of tax compliance for contracts',   icon: '✅' },
]

export default function TaxCenter() {
  const { taxYear, documents, summary, effectiveRate, isLoading, fetchTax, computeTax, generateDoc } = useTaxStore()
  const [showCalc, setShowCalc]   = useState(false)
  const [showDoc, setShowDoc]     = useState(false)
  const [gross, setGross]         = useState('')
  const [deductions, setDeductions] = useState('')
  const [calcResult, setCalcResult] = useState<{ taxOwed: number; effectiveRate: number; breakdown: any[] } | null>(null)
  const [loading, setLoading]     = useState(false)
  const [tab, setTab]             = useState<'summary' | 'brackets' | 'docs'>('summary')

  useEffect(() => { fetchTax() }, [])

  const handleCompute = async () => {
    if (!gross) { toast.error('Enter your gross income'); return }
    setLoading(true)
    try {
      const result = await computeTax(Number(gross), Number(deductions) || 0, new Date().getFullYear())
      setCalcResult(result)
      toast.success('Tax computed!')
    } catch { toast.error('Computation failed') }
    finally { setLoading(false) }
  }

  const handleGenDoc = async (docType: string) => {
    setLoading(true)
    try {
      await generateDoc(docType)
      toast.success('Document generated!')
      setShowDoc(false)
    } catch { toast.error('Generation failed') }
    finally { setLoading(false) }
  }

  const breakdownData = (calcResult?.breakdown ?? taxYear?.breakdown ?? []).map(b => ({
    name: b.label.replace('First ', '').replace('Next ', '').replace('Above ', 'Over '),
    tax: b.tax, rate: b.rate,
  }))

  const balance = (summary?.taxOwed ?? 0) - (summary?.taxPaid ?? 0)

  const content = (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">Tax Center</h1><p className="page-subtitle">Nigerian PAYE tax management</p></div>
        <button onClick={() => fetchTax()} className="btn-icon bg-gray-100">
          <RefreshCw size={16} className={cn('text-gray-600', isLoading && 'animate-spin')} />
        </button>
      </div>

      {/* Status hero */}
      <div className={cn('mx-4 mb-4 rounded-4xl p-5 shadow-premium relative overflow-hidden',
        balance > 0 ? 'bg-gradient-to-br from-red-600 to-rose-700' : balance < 0 ? 'bg-gradient-to-br from-brand-600 to-emerald-700' : 'bg-dark-gradient')}>
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border-[20px] border-white/10" />
        <div className="relative z-10">
          <p className="text-white/70 text-xs font-semibold mb-1">{new Date().getFullYear()} Tax Year</p>
          <p className="text-white font-display font-bold text-3xl mb-0.5">
            {balance > 0 ? `-${formatCurrency(balance, 'NGN', true)}` : balance < 0 ? `+${formatCurrency(Math.abs(balance), 'NGN', true)}` : '₦0 Due'}
          </p>
          <p className="text-white/60 text-xs mb-4">
            {balance > 0 ? 'Tax still owed' : balance < 0 ? 'Refund due to you' : 'Fully settled'}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { l: 'Gross Income', v: formatCurrency(summary?.grossIncome ?? 0, 'NGN', true) },
              { l: 'Tax Owed', v: formatCurrency(summary?.taxOwed ?? 0, 'NGN', true) },
              { l: 'Eff. Rate', v: `${effectiveRate}%` },
            ].map(({ l, v }) => (
              <div key={l} className="bg-white/15 rounded-2xl p-2.5 text-center">
                <p className="text-white/50 text-[9px]">{l}</p>
                <p className="text-white font-display font-bold text-sm">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 px-4 mb-4">
        <button onClick={() => setShowCalc(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-2xl shadow-card hover:shadow-card-hover transition-all text-sm active:scale-95">
          <Calculator size={16} /> Calculate Tax
        </button>
        <button onClick={() => setShowDoc(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-brand-600 text-white font-bold py-3 rounded-2xl shadow-float-green hover:bg-brand-700 transition-all text-sm active:scale-95">
          <Download size={16} /> Get Documents
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 px-4 mb-4">
        {(['summary', 'brackets', 'docs'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('tab-pill flex-1 capitalize', tab === t ? 'tab-active' : 'tab-inactive')}>{t}</button>
        ))}
      </div>

      {/* SUMMARY TAB */}
      {tab === 'summary' && summary && (
        <div className="px-4 space-y-3">
          {[
            { label: 'Gross Annual Income',  val: formatCurrency(summary.grossIncome) },
            { label: 'Total Deductions',     val: `-${formatCurrency(summary.deductions)}`,    color:'text-brand-600' },
            { label: 'Taxable Income',       val: formatCurrency(summary.taxableIncome),       bold: true },
            { label: 'Total Tax Owed',       val: formatCurrency(summary.taxOwed),             color:'text-red-600', bold: true },
            { label: 'Effective Tax Rate',   val: `${effectiveRate}%` },
          ].map(({ label, val, color, bold }) => (
            <div key={label} className="bg-white rounded-2xl shadow-card p-4 flex justify-between items-center">
              <p className="text-sm text-gray-600">{label}</p>
              <p className={cn('text-sm', bold ? 'font-display font-bold text-gray-900 text-base' : 'font-bold', color ?? 'text-gray-900')}>{val}</p>
            </div>
          ))}

          {/* Deductions tip */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
            <p className="text-xs font-bold text-amber-800 mb-1">💡 Allowable Deductions</p>
            <p className="text-xs text-amber-700">Pension contributions, life insurance premiums, NHF contributions and national housing fund can reduce your taxable income.</p>
          </div>
        </div>
      )}

      {/* BRACKETS TAB */}
      {tab === 'brackets' && (
        <div className="px-4 space-y-4">
          <div className="bg-white rounded-3xl shadow-card p-4">
            <p className="font-display font-bold text-sm text-gray-900 mb-3">Tax by Bracket</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={breakdownData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `₦${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`} />
                <Tooltip formatter={(v: number) => [formatCurrency(v), 'Tax']}
                  contentStyle={{ borderRadius: 12, border: 'none', fontSize: 11 }} />
                <Bar dataKey="tax" radius={[6, 6, 0, 0]}>
                  {breakdownData.map((_, i) => <Cell key={i} fill={BRACKET_COLORS[i % BRACKET_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="surface">
            {(taxYear?.breakdown ?? []).map((b, idx) => (
              <div key={idx} className={cn('list-item', idx < (taxYear?.breakdown?.length ?? 1) - 1 && 'border-b border-gray-50')}>
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: BRACKET_COLORS[idx % BRACKET_COLORS.length] }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{b.label}</p>
                  <p className="text-xs text-gray-400">{b.rate}% rate</p>
                </div>
                <p className="text-sm font-bold text-gray-900">{formatCurrency(b.tax, 'NGN', true)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DOCS TAB */}
      {tab === 'docs' && (
        <div className="px-4 space-y-3">
          {documents.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-3xl shadow-card">
              <FileText size={36} className="mx-auto mb-3 text-gray-200" />
              <p className="font-bold text-gray-500">No documents yet</p>
              <button onClick={() => setShowDoc(true)} className="btn-primary mt-4 px-6 py-2.5 text-sm">Generate Documents</button>
            </div>
          ) : documents.map(doc => (
            <div key={doc.id} className="bg-white rounded-2xl shadow-card p-4 flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0', doc.status === 'ready' ? 'bg-brand-50' : 'bg-gray-100')}>
                {doc.status === 'ready' ? <CheckCircle2 size={18} className="text-brand-600" /> : <Clock size={18} className="text-gray-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{doc.name}</p>
                <span className={cn('badge text-[9px]', doc.status === 'ready' ? 'badge-green' : 'badge-gold')}>{doc.status}</span>
              </div>
              {doc.status === 'ready' && (
                <button onClick={() => toast.success('Document downloaded! (demo)')}
                  className="p-2 bg-brand-50 rounded-xl hover:bg-brand-100 transition-colors">
                  <Download size={14} className="text-brand-600" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <>
      <AppHeader title="Tax Center" showBack />
      <DeviceFrame>{content}</DeviceFrame>

      {/* Tax Calculator */}
      <Modal isOpen={showCalc} onClose={() => { setShowCalc(false); setCalcResult(null) }} title="Tax Calculator">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Annual Gross Income (₦)</label>
            <input value={gross} onChange={e => setGross(e.target.value)} type="number" placeholder="e.g. 3,600,000" className="input-field text-xl font-bold" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Total Deductions (₦) <span className="font-normal text-gray-400">(optional)</span></label>
            <input value={deductions} onChange={e => setDeductions(e.target.value)} type="number" placeholder="Pension, NHF, insurance…" className="input-field" />
          </div>
          <button onClick={handleCompute} disabled={loading || !gross} className="btn-primary w-full py-3.5">
            {loading ? 'Computing…' : 'Calculate Tax'}
          </button>

          {calcResult && (
            <div className="bg-brand-50 rounded-2xl p-4 space-y-2 border border-brand-100">
              <p className="text-sm font-bold text-brand-900">Results</p>
              {[['Taxable Income', formatCurrency(Number(gross) - (Number(deductions) || 0))], ['Tax Owed', formatCurrency(calcResult.taxOwed)], ['Effective Rate', `${calcResult.effectiveRate}%`]].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-gray-600">{k}</span>
                  <span className="font-bold text-gray-900">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Generate Documents */}
      <Modal isOpen={showDoc} onClose={() => setShowDoc(false)} title="Tax Documents">
        <div className="space-y-3">
          {DOCS.map(doc => (
            <button key={doc.type} onClick={() => handleGenDoc(doc.type)} disabled={loading}
              className="w-full flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-brand-50 transition-all text-left active:scale-98 disabled:opacity-50">
              <span className="text-2xl">{doc.icon}</span>
              <div className="flex-1">
                <p className="font-bold text-gray-900">{doc.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{doc.desc}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
            </button>
          ))}
        </div>
      </Modal>
    </>
  )
}
