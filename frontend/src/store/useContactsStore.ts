import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Contact } from '@/types'

// Mirrors the seeded contacts in cmd/seed/main.go
const SEED_CONTACTS: Contact[] = [
  { id:'c1', name:'Chukwuemeka Nwosu',  email:'emeka@opay.ng',   phone:'08023456789', avatarColor:'#16a34a', initials:'CN', isFavorite:true,  lastTransferDate: new Date(Date.now()-86400000*80).toISOString(), lastTransferAmount:50000 },
  { id:'c2', name:'Fatimah Abdullahi',  email:'fatimah@opay.ng', phone:'08034567890', avatarColor:'#3b82f6', initials:'FA', isFavorite:true,  lastTransferDate: undefined,                                   lastTransferAmount:0     },
  { id:'c3', name:'Babatunde Fashola',  email:'tunde@opay.ng',   phone:'08067890123', avatarColor:'#f59e0b', initials:'BF', isFavorite:false, lastTransferDate: undefined,                                   lastTransferAmount:0     },
  { id:'c4', name:'Amara Osei',         email:'amara@opay.ng',   phone:'08078901234', avatarColor:'#ef4444', initials:'AO', isFavorite:false, lastTransferDate: undefined,                                   lastTransferAmount:0     },
  { id:'c5', name:'Ngozi Eze',          email:'ngozi@opay.ng',   phone:'08056789012', avatarColor:'#8b5cf6', initials:'NE', isFavorite:false, lastTransferDate: undefined,                                   lastTransferAmount:0     },
]

interface State {
  contacts: Contact[]
  addContact: (c: Contact) => void
  toggleFavorite: (id: string) => void
  recentContacts: () => Contact[]
}

export const useContactsStore = create<State>()(
  persist(
    (set, get) => ({
      contacts: SEED_CONTACTS,
      addContact: (c) => set(s => ({ contacts: [c, ...(s.contacts ?? [])] })),
      toggleFavorite: (id) => set(s => ({
        contacts: (s.contacts ?? []).map(c => c.id === id ? { ...c, isFavorite: !c.isFavorite } : c),
      })),
      recentContacts: () =>
        (get().contacts ?? [])
          .filter(c => c.lastTransferDate)
          .sort((a, b) => new Date(b.lastTransferDate!).getTime() - new Date(a.lastTransferDate!).getTime())
          .slice(0, 5),
    }),
    {
      name: 'opay-contacts-v5',
      onRehydrateStorage: () => (state) => {
        if (state && !Array.isArray(state.contacts)) state.contacts = SEED_CONTACTS
      },
    }
  )
)
