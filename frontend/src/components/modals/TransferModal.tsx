import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import Modal from './Modal'
import { transferSchema, type TransferInput } from '@/lib/validators'
import { useWalletStore } from '@/store/useWalletStore'
import { formatCurrency } from '@/lib/utils'

export default function TransferModal({ isOpen, onClose }: { isOpen:boolean; onClose:()=>void }) {
  const { transfer, balance } = useWalletStore()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, reset, watch, formState:{errors} } = useForm<TransferInput>({ resolver: zodResolver(transferSchema) })

  const onSubmit = async (data: TransferInput) => {
    if (data.amount > balance) { toast.error('Insufficient balance'); return }
    setLoading(true)
    try {
      await transfer(data.recipientEmail, data.amount, data.note)
      toast.success(`${formatCurrency(data.amount)} sent! ✅`)
      reset(); onClose()
    } catch (err: unknown) {
      toast.error((err as {response?:{data?:{error?:string}}})?.response?.data?.error ?? 'Transfer failed')
    } finally { setLoading(false) }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transfer to OPay">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="bg-brand-50 rounded-2xl px-4 py-3 flex justify-between items-center">
          <span className="text-sm text-gray-600">Available Balance</span>
          <span className="font-display font-bold text-brand-700">{formatCurrency(balance)}</span>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Recipient Email</label>
          <input {...register('recipientEmail')} type="email" placeholder="recipient@example.com" className="input-field"/>
          {errors.recipientEmail && <p className="text-red-500 text-xs mt-1">{errors.recipientEmail.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Amount (₦)</label>
          <input {...register('amount')} type="number" placeholder="0.00" className="input-field text-2xl font-display font-bold"/>
          {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Note <span className="text-gray-400 font-normal">(optional)</span></label>
          <input {...register('note')} placeholder="What's this for?" className="input-field"/>
        </div>
        {watch('amount') && Number(watch('amount')) > 0 && (
          <div className="bg-gray-50 rounded-2xl p-3 text-sm space-y-1">
            <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-bold">{formatCurrency(Number(watch('amount')))}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Fee</span><span className="font-bold text-brand-600">Free</span></div>
          </div>
        )}
        <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base">
          {loading ? <div className="flex items-center justify-center gap-2"><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Sending…</div> : 'Send Money'}
        </button>
      </form>
    </Modal>
  )
}
