import { useWalletStore } from '@/store/useWalletStore'
import { useEffect } from 'react'
export function useLocalBalance() {
  const { balance, fetchBalance } = useWalletStore()
  useEffect(() => { fetchBalance() }, [])
  return balance
}
