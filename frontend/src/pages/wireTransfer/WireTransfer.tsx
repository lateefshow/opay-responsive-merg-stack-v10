import { useState, useEffect } from 'react'
import { Building2, Plus, Send, Clock, CheckCircle2, XCircle, CreditCard, ChevronDown, RefreshCw } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import Modal from '@/components/modals/Modal'
import { useWireTransferStore } from '@/store/useWireTransferStore'
import { useWalletStore } from '@/store/useWalletStore'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUS_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  completed:  { icon: CheckCircle2, color: 'text-brand-600', bg: 'bg-brand-50' },
  processing: { icon: Clock,        color: 'text-blue-600',  bg: 'bg-blue-50'  },
  pending:    { icon: Clock,        color: 'text-amber-600', bg: 'bg-amber-50' },
  failed:     { icon: XCircle,      color: 'text-red-600',   bg: 'bg-red-50'   },
  cancelled:  { icon: XCircle,      color: 'text-gray-500',  bg: 'bg-gray-100' },
}

function calcFee(amt: number) { return amt <= 5000 ? 10.75 : amt <= 50000 ? 25 : 50 }

export default function WireTransfer() {
  const { accounts, banks, transfers, totalSent, isLoading, fetchAll, addAccount, sendWire } = useWireTransferStore()
  const { balance, setBalance } = useWalletStore()

  const [showSend, setShowSend]     = useState(false)
  const [showAdd, setShowAdd]       = useState(false)
  const [loading, setLoading]       = useState(false)
  const [tab, setTab]               = useState<'send' | 'history'>('send')

  // Send form
  const [selAcc, setSelAcc]         = useState<typeof accounts[0] | null>(null)
  const [manualMode, setManualMode] = useState(false)
  const [bankCode, setBankCode]     = useState('')
  const [accNum, setAccNum]         = useState('')
  const [accName, setAccName]       = useState('')
  const [bankName, setBankName]     = useState('')
  const [amount, setAmount]         = useState('')
  const [narration, setNarration]   = useState('')

  // Add account form
  const [newBankCode, setNewBankCode] = useState('')
  const [newAccNum, setNewAccNum]     = useState('')
  const [newAccName, setNewAccName]   = useState('')
  const [newBankName, setNewBankName] = useState('')

  useEffect(() => { fetchAll() }, [])

  const safeAccounts  = accounts  ?? []
  const safeBanks     = banks     ?? []
  const safeTransfers = transfers ?? []

  const numAmt = Number(amount) || 0
  const fee    = calcFee(numAmt)
  const total  = numAmt + fee

  const recipientBankCode = selAcc?.bankCode  || bankCode
  const recipientAccNum   = selAcc?.accountNumber || accNum
  const recipientAccName  = selAcc?.accountName   || accName
  const recipientBankName = selAcc?.bankName      || bankName

  const handleSend = async () => {
    if (!recipientAccNum || !numAmt || !recipientBankCode || !recipientAccName) { toast.error('Fill all fields'); return }
    if (total > balance) { toast.error('Insufficient wallet balance'); return }
    setLoading(true)
    try {
      await sendWire({ bankCode: recipientBankCode, accountNumber: recipientAccNum, accountName: recipientAccName, bankName: recipientBankName, amount: numAmt, narration })
      setBalance(balance - total)
      toast.success(`₦${numAmt.toLocaleString()} sent to ${recipientAccName}!`)
      setShowSend(false)
      setSelAcc(null); setAmount(''); setNarration(''); setBankCode(''); setAccNum(''); setAccName('')
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Transfer failed')
    } finally { setLoading(false) }
  }

  const handleAddAccount = async () => {
    if (!newBankCode || !newAccNum || !newAccName) { toast.error('Fill all fields'); return }
    setLoading(true)
    try {
      await addAccount(newBankName, newBankCode, newAccNum, newAccName)
      toast.success('Bank account saved!')
      setShowAdd(false); setNewBankCode(''); setNewAccNum(''); setNewAccName(''); setNewBankName('')
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to add account')
    } finally { setLoading(false) }
  }

  const content = (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">Wire Transfer</h1><p className="page-subtitle">Send to any Nigerian bank</p></div>
        <button onClick={() => fetchAll()} className="btn-icon bg-gray-100">
          <RefreshCw size={16} className={cn('text-gray-600', isLoading && 'animate-spin')} />
        </button>
      </div>

      {/* Hero */}
      <div className="mx-4 mb-4 bg-dark-gradient rounded-3xl p-5 shadow-premium relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border-[20px] border-white/10" />
        <div className="relative z-10">
          <p className="text-white/60 text-xs font-semibold mb-1">Total Sent</p>
          <p className="font-display font-bold text-white text-3xl mb-1">{formatCurrency(totalSent)}</p>
          <p className="text-white/40 text-xs mb-4">across {safeTransfers.filter(t => t.status === 'completed').length} transfers</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => { setShowSend(true); setManualMode(false) }}
              className="flex items-center justify-center gap-2 bg-brand-500 text-white font-bold py-3 rounded-2xl hover:bg-brand-400 transition-all active:scale-95 text-sm">
              <Send size={15} /> New Transfer
            </button>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center justify-center gap-2 bg-white/15 text-white font-bold py-3 rounded-2xl hover:bg-white/20 transition-all active:scale-95 text-sm">
              <Plus size={15} /> Save Account
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mx-4 mb-4 bg-blue-50 rounded-2xl p-4 flex items-start gap-3">
        <CreditCard size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-blue-900">NIP Transfer Fees</p>
          <p className="text-xs text-blue-700 mt-0.5">₦0–₦5,000: ₦10.75 · ₦5,001–₦50,000: ₦25 · Above ₦50,000: ₦50</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 px-4 mb-4">
        {(['send', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('tab-pill flex-1 capitalize', tab === t ? 'tab-active' : 'tab-inactive')}>
            {t === 'history' ? `History (${safeTransfers.length})` : 'Saved Accounts'}
          </button>
        ))}
      </div>

      {tab === 'send' && (
        <div className="px-4">
          {safeAccounts.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-3xl shadow-card">
              <Building2 size={36} className="mx-auto mb-3 text-gray-200" />
              <p className="font-bold text-gray-500">No saved accounts</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">Save accounts for quick transfers</p>
              <button onClick={() => setShowAdd(true)} className="btn-primary px-6 py-2.5 text-sm">Add Bank Account</button>
            </div>
          ) : (
            <div className="surface">
              {safeAccounts.map((acc, idx) => (
                <div key={acc.id} className={cn('list-item cursor-pointer hover:bg-gray-50 transition-colors', idx < safeAccounts.length - 1 && 'border-b border-gray-50')}
                  onClick={() => { setSelAcc(acc); setManualMode(false); setShowSend(true) }}>
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Building2 size={18} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{acc.accountName}</p>
                    <p className="text-xs text-gray-400">{acc.bankName} · ****{acc.accountNumber.slice(-4)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {acc.isDefault && <span className="badge badge-green text-[9px]">Default</span>}
                    <Send size={14} className="text-brand-500" />
                  </div>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => { setManualMode(true); setSelAcc(null); setShowSend(true) }}
            className="w-full flex items-center justify-center gap-2 mt-3 py-3 bg-gray-50 text-gray-600 font-bold rounded-2xl hover:bg-gray-100 transition-colors text-sm border-2 border-dashed border-gray-200">
            <Plus size={15} /> Transfer to New Account
          </button>
        </div>
      )}

      {tab === 'history' && (
        <div className="px-4">
          {safeTransfers.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">No transfers yet</div>
          ) : (
            <div className="surface">
              {safeTransfers.map((t, idx) => {
                const meta = STATUS_META[t.status] ?? STATUS_META.completed
                const Icon = meta.icon
                return (
                  <div key={t.id} className={cn('list-item', idx < safeTransfers.length - 1 && 'border-b border-gray-50')}>
                    <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0', meta.bg)}>
                      <Icon size={16} className={meta.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{t.accountName}</p>
                      <p className="text-xs text-gray-400">{t.bankName} · {formatDate(t.createdAt, 'relative')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">-{formatCurrency(t.amount, 'NGN', true)}</p>
                      <p className="text-[10px] text-gray-400">fee {formatCurrency(t.fee, 'NGN', true)}</p>
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
      <AppHeader title="Wire Transfer" showBack />
      <DeviceFrame>{content}</DeviceFrame>

      {/* Send Transfer Modal */}
      <Modal isOpen={showSend} onClose={() => { setShowSend(false); setSelAcc(null); setAmount(''); setNarration('') }} title={selAcc ? `Send to ${selAcc.accountName}` : 'New Transfer'}>
        <div className="space-y-4">
          {(selAcc || !manualMode) && selAcc ? (
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl">
              <Building2 size={22} className="text-blue-600" />
              <div>
                <p className="font-bold text-gray-900">{selAcc.accountName}</p>
                <p className="text-xs text-gray-500">{selAcc.bankName} · {selAcc.accountNumber}</p>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Bank</label>
                <select value={bankCode} onChange={e => { setBankCode(e.target.value); setBankName(safeBanks.find(b => b.code === e.target.value)?.name ?? '') }}
                  className="input-field">
                  <option value="">Select bank…</option>
                  {safeBanks.sort((a, b) => a.name.localeCompare(b.name)).map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Account Number</label>
                <input value={accNum} onChange={e => setAccNum(e.target.value)} maxLength={10} placeholder="10-digit account number" className="input-field font-mono" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Account Name</label>
                <input value={accName} onChange={e => setAccName(e.target.value)} placeholder="Account holder name" className="input-field" />
              </div>
            </>
          )}

          <div className="bg-brand-50 rounded-xl px-4 py-3 flex justify-between text-sm">
            <span className="text-gray-600">Wallet Balance</span>
            <span className="font-bold text-brand-700">{formatCurrency(balance)}</span>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Amount (₦)</label>
            <input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="0.00" className="input-field text-2xl font-bold" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Narration (optional)</label>
            <input value={narration} onChange={e => setNarration(e.target.value)} placeholder="e.g. Rent payment" className="input-field" />
          </div>

          {numAmt > 0 && (
            <div className="bg-gray-50 rounded-2xl p-3 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-bold">{formatCurrency(numAmt)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">NIP Fee</span><span className="font-bold text-orange-500">+{formatCurrency(fee)}</span></div>
              <div className="flex justify-between border-t border-gray-200 pt-1.5"><span className="font-bold">Total</span><span className="font-bold text-brand-600">{formatCurrency(total)}</span></div>
            </div>
          )}
          {total > balance && numAmt > 0 && <p className="text-red-500 text-xs">Insufficient balance (need {formatCurrency(total)})</p>}

          <button onClick={handleSend} disabled={loading || !numAmt || total > balance || !recipientAccNum} className="btn-primary w-full py-4">
            {loading ? 'Sending…' : `Send ${numAmt ? formatCurrency(numAmt) : '—'}`}
          </button>
        </div>
      </Modal>

      {/* Add Account Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Save Bank Account">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Bank</label>
            <select value={newBankCode} onChange={e => { setNewBankCode(e.target.value); setNewBankName(safeBanks.find(b => b.code === e.target.value)?.name ?? '') }} className="input-field">
              <option value="">Select bank…</option>
              {safeBanks.sort((a, b) => a.name.localeCompare(b.name)).map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Account Number</label>
            <input value={newAccNum} onChange={e => setNewAccNum(e.target.value)} maxLength={10} placeholder="10-digit account number" className="input-field font-mono" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Account Name</label>
            <input value={newAccName} onChange={e => setNewAccName(e.target.value)} placeholder="As shown on bank account" className="input-field" />
          </div>
          <button onClick={handleAddAccount} disabled={loading || !newBankCode || !newAccNum || !newAccName} className="btn-primary w-full py-4">
            {loading ? 'Saving…' : 'Save Account'}
          </button>
        </div>
      </Modal>
    </>
  )
}
