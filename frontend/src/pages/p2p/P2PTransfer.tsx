import { useState } from 'react'
import { Search, Star, StarOff, Clock, CheckCircle2, Send, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import PinModal from '@/components/modals/PinModal'
import { useContactsStore } from '@/store/useContactsStore'
import { useWalletStore } from '@/store/useWalletStore'
import { transferSchema, type TransferInput } from '@/lib/validators'
import { formatCurrency, formatDate, cn, sleep } from '@/lib/utils'
import type { Contact } from '@/types'
import toast from 'react-hot-toast'

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000]

function ContactAvatar({ contact, size = 'md', onClick }: { contact: Contact; size?: 'sm'|'md'|'lg'; onClick?: () => void }) {
  const sizes = { sm:'w-9 h-9 text-xs', md:'w-12 h-12 text-sm', lg:'w-16 h-16 text-base' }
  return (
    <button onClick={onClick}
      className={cn('rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 active:scale-95 transition-all', sizes[size])}
      style={{ background: contact.avatarColor }}>
      {contact.initials}
    </button>
  )
}

export default function P2PTransfer() {
  const { contacts, toggleFavorite, recentContacts } = useContactsStore()
  const { balance, transfer } = useWalletStore()
  const [query,       setQuery]       = useState('')
  const [selected,    setSelected]    = useState<Contact | null>(null)
  const [showPin,     setShowPin]     = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [step,        setStep]        = useState<'select'|'amount'|'confirm'|'success'>('select')
  const [pendingData, setPendingData] = useState<TransferInput | null>(null)

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<TransferInput>({
    resolver: zodResolver(transferSchema),
    defaultValues: { recipientEmail: '', amount: 0, note: '' },
  })

  const filtered = query
    ? contacts.filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || c.email.toLowerCase().includes(query.toLowerCase()))
    : contacts

  const favorites = contacts.filter(c => c.isFavorite)
  const recents   = recentContacts()

  const selectContact = (c: Contact) => {
    setSelected(c)
    setValue('recipientEmail', c.email)
    setStep('amount')
  }

  const onAmountSubmit = (data: TransferInput) => {
    if (data.amount > balance) { toast.error('Insufficient balance'); return }
    setPendingData(data)
    setStep('confirm')
  }

  const onConfirm = () => setShowPin(true)

  const onPinSuccess = async () => {
    setShowPin(false)
    setLoading(true)
    try {
      await transfer(pendingData!.recipientEmail, pendingData!.amount, pendingData!.note)
      setStep('success')
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Transfer failed')
    } finally {
      setLoading(false)
    }
  }

  const startOver = () => { setStep('select'); setSelected(null); setPendingData(null); reset() }

  const amount = Number(watch('amount')) || 0

  const content = (
    <div className="page-container">
      {/* Step: Select Contact */}
      {step === 'select' && (
        <>
          <div className="px-4 pt-4 pb-3">
            <h1 className="font-display font-bold text-xl text-gray-900">Send Money</h1>
            <p className="text-gray-400 text-sm mt-0.5">Search or select a recipient</p>
          </div>

          {/* Balance pill */}
          <div className="mx-4 mb-4 bg-brand-50 rounded-2xl px-4 py-3 flex justify-between items-center">
            <span className="text-sm text-gray-600 font-medium">Wallet Balance</span>
            <span className="font-display font-bold text-brand-700">{formatCurrency(balance)}</span>
          </div>

          {/* Search */}
          <div className="px-4 mb-4">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Name or email address…"
                className="input-field pl-10"/>
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  <X size={15} className="text-gray-400"/>
                </button>
              )}
            </div>
          </div>

          {/* Manual email entry */}
          {query.includes('@') && (
            <div className="px-4 mb-3">
              <button onClick={() => {
                const c: Contact = { id: 'new', name: query, email: query, avatarColor: '#16a34a', initials: query[0].toUpperCase(), isFavorite: false }
                selectContact(c)
              }} className="w-full flex items-center gap-3 bg-brand-50 border-2 border-brand-200 rounded-3xl p-3.5 hover:bg-brand-100 transition-colors">
                <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-sm">{query[0]?.toUpperCase()}</div>
                <div className="text-left">
                  <p className="text-sm font-bold text-brand-700">Send to {query}</p>
                  <p className="text-xs text-brand-500">Tap to continue</p>
                </div>
              </button>
            </div>
          )}

          {/* Favorites */}
          {!query && favorites.length > 0 && (
            <div className="px-4 mb-4">
              <p className="section-label">⭐ Favorites</p>
              <div className="flex gap-4 overflow-x-auto pb-1">
                {favorites.map(c => (
                  <button key={c.id} onClick={() => selectContact(c)} className="flex flex-col items-center gap-1.5 flex-shrink-0 active:scale-95 transition-all">
                    <ContactAvatar contact={c} size="md"/>
                    <span className="text-[10px] font-bold text-gray-600 max-w-[48px] truncate">{c.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recents */}
          {!query && recents.length > 0 && (
            <div className="px-4 mb-4">
              <p className="section-label">Recent</p>
              <div className="bg-white rounded-3xl shadow-card overflow-hidden">
                {recents.map((c, idx) => (
                  <button key={c.id} onClick={() => selectContact(c)}
                    className={cn('w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:scale-[0.99] transition-all text-left', idx < recents.length-1 && 'border-b border-gray-50')}>
                    <ContactAvatar contact={c} size="sm"/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{c.name}</p>
                      {c.lastTransferDate && (
                        <p className="text-xs text-gray-400">{formatDate(c.lastTransferDate, 'relative')} · {formatCurrency(c.lastTransferAmount ?? 0, 'NGN', true)}</p>
                      )}
                    </div>
                    <button onClick={e => { e.stopPropagation(); toggleFavorite(c.id) }} className="p-1">
                      {c.isFavorite ? <Star size={15} className="text-amber-400 fill-amber-400"/> : <StarOff size={15} className="text-gray-300"/>}
                    </button>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* All contacts filtered */}
          {(query || !recents.length) && (
            <div className="px-4">
              <p className="section-label">{query ? 'Results' : 'All Contacts'}</p>
              {filtered.length === 0 ? (
                <div className="text-center py-8 text-gray-400"><Search size={28} className="mx-auto mb-2 opacity-30"/><p className="text-sm">No contacts found</p></div>
              ) : (
                <div className="bg-white rounded-3xl shadow-card overflow-hidden">
                  {filtered.map((c, idx) => (
                    <button key={c.id} onClick={() => selectContact(c)}
                      className={cn('w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-all text-left active:scale-[0.99]', idx < filtered.length-1 && 'border-b border-gray-50')}>
                      <ContactAvatar contact={c} size="sm"/>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{c.name}</p>
                        <p className="text-xs text-gray-400 truncate">{c.email}</p>
                      </div>
                      <button onClick={e => { e.stopPropagation(); toggleFavorite(c.id) }} className="p-1">
                        {c.isFavorite ? <Star size={15} className="text-amber-400 fill-amber-400"/> : <StarOff size={15} className="text-gray-300"/>}
                      </button>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Step: Enter Amount */}
      {step === 'amount' && selected && (
        <div className="px-4 pt-4">
          <div className="flex items-center gap-3 mb-6">
            <ContactAvatar contact={selected} size="lg"/>
            <div>
              <p className="font-display font-bold text-xl text-gray-900">{selected.name}</p>
              <p className="text-sm text-gray-400">{selected.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onAmountSubmit)} className="space-y-4">
            <input type="hidden" {...register('recipientEmail')} value={selected.email}/>

            {/* Big amount input */}
            <div className="text-center py-6 bg-gray-50 rounded-3xl">
              <p className="text-xs font-bold text-gray-400 mb-2">Enter Amount</p>
              <div className="flex items-center justify-center gap-2">
                <span className="font-display font-bold text-3xl text-gray-400">₦</span>
                <input {...register('amount')} type="number" placeholder="0.00" min="1"
                  className="font-display font-bold text-4xl text-gray-900 bg-transparent border-none outline-none w-48 text-center"/>
              </div>
              {errors.amount && <p className="text-red-500 text-xs mt-2">{errors.amount.message}</p>}
              {amount > balance && <p className="text-red-500 text-xs mt-1">Exceeds your balance of {formatCurrency(balance)}</p>}
            </div>

            {/* Quick amounts */}
            <div className="grid grid-cols-3 gap-2">
              {QUICK_AMOUNTS.map(a => (
                <button key={a} type="button" onClick={() => setValue('amount', a)}
                  className={cn('py-2.5 text-sm font-bold rounded-2xl transition-all',
                    amount===a ? 'bg-brand-600 text-white shadow-float-green' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>
                  {formatCurrency(a, 'NGN', true)}
                </button>
              ))}
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Note <span className="text-gray-400 font-normal">(optional)</span></label>
              <input {...register('note')} placeholder="What's this for?" className="input-field"/>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={startOver} className="btn-secondary flex-1 py-3.5">Back</button>
              <button type="submit" disabled={!amount || amount > balance}
                className="btn-primary flex-1 py-3.5 flex items-center justify-center gap-2">
                <Send size={16}/> Continue
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step: Confirm */}
      {step === 'confirm' && selected && pendingData && (
        <div className="px-4 pt-6 flex flex-col items-center">
          <div className="w-full bg-white rounded-3xl shadow-card p-5 mb-6">
            <p className="text-xs font-bold text-gray-400 text-center mb-4">CONFIRM TRANSFER</p>
            <div className="flex flex-col items-center mb-6">
              <ContactAvatar contact={selected} size="lg"/>
              <p className="font-display font-bold text-2xl text-gray-900 mt-3">{formatCurrency(pendingData.amount)}</p>
              <p className="text-sm text-gray-500 mt-1">to {selected.name}</p>
            </div>
            <div className="bg-gray-50 rounded-2xl divide-y divide-gray-100">
              {[
                ['Recipient',  selected.name],
                ['Email',      selected.email],
                ['Amount',     formatCurrency(pendingData.amount)],
                ['Fee',        'Free'],
                pendingData.note && ['Note', pendingData.note],
              ].filter(Boolean).map(([k, v]) => (
                <div key={k} className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-gray-500">{k}</span>
                  <span className={cn('font-bold', k==='Fee'&&'text-brand-600')}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3 w-full">
            <button onClick={() => setStep('amount')} className="btn-secondary flex-1 py-3.5">Back</button>
            <button onClick={onConfirm} disabled={loading}
              className="btn-primary flex-1 py-3.5 flex items-center justify-center gap-2">
              {loading ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/> : <><Send size={16}/>Send Now</>}
            </button>
          </div>
        </div>
      )}

      {/* Step: Success */}
      {step === 'success' && pendingData && selected && (
        <div className="flex flex-col items-center justify-center min-h-[600px] px-6 text-center">
          <div className="w-24 h-24 rounded-full bg-brand-50 flex items-center justify-center mb-6 animate-bounce-in">
            <CheckCircle2 size={48} className="text-brand-600"/>
          </div>
          <h2 className="font-display font-bold text-2xl text-gray-900 mb-2">Sent! 🎉</h2>
          <p className="text-gray-500 mb-1">{formatCurrency(pendingData.amount)}</p>
          <p className="text-sm text-gray-400 mb-8">Successfully sent to {selected.name}</p>
          <div className="flex gap-3 w-full max-w-sm">
            <button onClick={startOver} className="btn-secondary flex-1 py-3.5">Send Again</button>
            <button onClick={() => window.history.back()} className="btn-primary flex-1 py-3.5">Done</button>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      <AppHeader title="Send Money" showBack={step !== 'select'} onBack={() => step==='amount'?startOver():step==='confirm'?setStep('amount'):startOver()}/>
      <DeviceFrame>{content}</DeviceFrame>
      <PinModal isOpen={showPin} onClose={() => setShowPin(false)} onSuccess={onPinSuccess}
        title="Confirm Transfer" subtitle={`Enter PIN to send ${formatCurrency(pendingData?.amount??0)}`}/>
    </>
  )
}
