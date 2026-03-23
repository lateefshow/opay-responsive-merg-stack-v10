import { create } from 'zustand'
import { persist } from 'zustand/middleware'
interface State { isDark:boolean; toggleTheme:()=>void; setDark:(v:boolean)=>void }
export const useThemeStore = create<State>()(
  persist((set,get) => ({
    isDark: false,
    toggleTheme: () => { const n=!get().isDark; set({isDark:n}); document.documentElement.classList.toggle('dark',n) },
    setDark: (v) => { set({isDark:v}); document.documentElement.classList.toggle('dark',v) },
  }), { name:'opay-theme-v3' })
)
