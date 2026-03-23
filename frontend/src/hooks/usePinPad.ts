import { useState } from 'react'
export function usePinPad(length=4) {
  const [digits, setDigits] = useState<string[]>([])
  const append = (d:string) => { if(digits.length<length) setDigits(p=>[...p,d]) }
  const backspace = () => setDigits(p=>p.slice(0,-1))
  const reset = () => setDigits([])
  const pin = digits.join('')
  const complete = digits.length===length
  return { digits, pin, complete, append, backspace, reset }
}
