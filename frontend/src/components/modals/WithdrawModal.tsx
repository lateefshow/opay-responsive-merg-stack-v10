import { useState } from 'react'
import Modal from './Modal'
import { formatCurrency } from '@/lib/utils'
import { useWalletStore } from '@/store/useWalletStore'
import toast from 'react-hot-toast'

const BANKS = [
  {code:'011',name:'First Bank'},{code:'044',name:'Access Bank'},{code:'058',name:'GTBank'},
  {code:'033',name:'UBA'},{code:'057',name:'Zenith Bank'},{code:'050',name:'Ecobank'},
]

export default function WithdrawModal({ isOpen, onClose }: { isOpen:boolean; onClose:()=>void }) {
  const { balance } = useWalletStore()
  const [step, setStep]   = useState<1|2>(1)
  const [bank, setBank]   = useState('')
  const [acct, setAcct]   = useState('')
  const [amount, setAmt]  = useState('')
  const [loading, setLoading] = useState(false)

  const reset = () => { setStep(1); setBank(''); setAcct(''); setAmt('') }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 1) { setStep(2); return }
    const num = parseFloat(amount)
    if (isNaN(num)||num<=0) { toast.error('Enter valid amount'); return }
    if (num>balance) { toast.error('Insufficient balance'); return }
    setLoading(true)
    await new Promise(r=>setTimeout(r,1500))
    toast.success(`${formatCurrency(num)} withdrawal initiated! ✅`)
    setLoading(false); reset(); onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={() => { reset(); onClose() }} title="Withdraw to Bank">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-brand-50 rounded-2xl px-4 py-3 flex justify-between items-center">
          <span className="text-sm text-gray-600">Available Balance</span>
          <span className="font-display font-bold text-brand-700">{formatCurrency(balance)}</span>
        </div>

        {step === 1 ? (
          <>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Select Bank</label>
              <select value={bank} onChange={e=>setBank(e.target.value)} required className="input-field bg-white">
                <option value="">-- Select bank --</option>
                {BANKS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Account Number</label>
              <input value={acct} onChange={e=>setAcct(e.target.value.replace(/\D/,'').slice(0,10))}
                placeholder="10-digit account number" className="input-field font-mono tracking-widest" required minLength={10} maxLength={10}/>
            </div>
            <button type="submit" className="btn-primary w-full py-3.5">Continue</button>
          </>
        ) : (
          <>
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Bank</span><span className="font-bold">{BANKS.find(b=>b.code===bank)?.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Account</span><span className="font-mono font-bold">{acct}</span></div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Amount (₦)</label>
              <input value={amount} onChange={e=>setAmt(e.target.value)} type="number" placeholder="0.00" className="input-field text-2xl font-display font-bold" required/>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 py-3.5">Back</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 py-3.5">
                {loading ? <div className="flex items-center justify-center gap-2"><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Processing…</div> : 'Withdraw'}
              </button>
            </div>
          </>
        )}
      </form>
    </Modal>
  )
}
