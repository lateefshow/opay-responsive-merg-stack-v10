import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import Modal from './Modal'
import { fundSchema, type FundInput } from '@/lib/validators'
import { useWalletStore } from '@/store/useWalletStore'
import { formatCurrency } from '@/lib/utils'

const quickAmounts = [1000,5000,10000,50000,100000,500000]

export default function AddMoneyModal({ isOpen, onClose }: { isOpen:boolean; onClose:()=>void }) {
  const { fund } = useWalletStore()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, setValue, reset, watch, formState:{errors} } = useForm<FundInput>({ resolver: zodResolver(fundSchema) })

  const onSubmit = async (data: FundInput) => {
    setLoading(true)
    try {
      await fund(data.amount)
      toast.success(`${formatCurrency(data.amount)} added to wallet! 🎉`)
      reset(); onClose()
    } catch (err: unknown) {
      toast.error((err as {response?:{data?:{error?:string}}})?.response?.data?.error ?? 'Failed to add money')
    } finally { setLoading(false) }
  }

  const amt = watch('amount')

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Money">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <p className="text-sm font-bold text-gray-600 mb-2">Quick amounts</p>
          <div className="grid grid-cols-3 gap-2">
            {quickAmounts.map(a => (
              <button key={a} type="button" onClick={() => setValue('amount', a)}
                className={`py-2.5 text-sm font-bold rounded-2xl transition-all ${Number(amt)===a ? 'bg-brand-600 text-white shadow-float-green' : 'bg-brand-50 text-brand-700 hover:bg-brand-100'}`}>
                {formatCurrency(a,'NGN',true)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Custom Amount (₦)</label>
          <input {...register('amount')} type="number" placeholder="0.00" className="input-field text-2xl font-display font-bold"/>
          {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
        </div>
        <p className="text-xs text-gray-400 text-center">Demo mode — no real money charged</p>
        <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base">
          {loading ? <div className="flex items-center justify-center gap-2"><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Processing…</div> : 'Add Money'}
        </button>
      </form>
    </Modal>
  )
}
