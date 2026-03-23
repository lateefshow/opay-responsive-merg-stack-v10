import { useEffect, useState } from 'react'
export function useCountUp(target: number, duration=1000): number {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const start = Date.now(), startVal = val
    const animate = () => {
      const elapsed = Date.now()-start, progress = Math.min(elapsed/duration, 1)
      const ease = 1-Math.pow(1-progress, 3)
      setVal(startVal + (target-startVal)*ease)
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [target, duration])
  return val
}
