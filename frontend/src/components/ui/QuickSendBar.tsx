import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useContactsStore } from '@/store/useContactsStore'
import type { Contact } from '@/types'

interface Props { onSelect: (contact: Contact) => void; onNew: () => void }
export default function QuickSendBar({ onSelect, onNew }: Props) {
  const { recentContacts } = useContactsStore()
  const recents = recentContacts()
  return (
    <div>
      <p className="font-display font-bold text-gray-900 text-sm mb-3">Quick Send</p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        <button onClick={onNew} className="flex flex-col items-center gap-1.5 flex-shrink-0">
          <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-brand-400 hover:bg-brand-50 transition-all active:scale-95"><Plus size={18} className="text-gray-400"/></div>
          <span className="text-[10px] font-semibold text-gray-500">New</span>
        </button>
        {recents.map(c=>(
          <button key={c.id} onClick={()=>onSelect(c)} className="flex flex-col items-center gap-1.5 flex-shrink-0 active:scale-95 transition-all">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-card" style={{background:c.avatarColor}}>{c.initials}</div>
            <span className="text-[10px] font-semibold text-gray-600 max-w-[48px] truncate text-center">{c.name.split(' ')[0]}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
