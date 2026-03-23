import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/axios'

export interface SocialActivity { id:string; userId:string; userName:string; userInitials:string; avatarColor:string; type:string; caption:string; amount:number; isPublic:boolean; reactions:Array<{userId:string;emoji:string}>; commentCount:number; createdAt:string }
interface State {
  feed: SocialActivity[]; myPosts: SocialActivity[]; isLoading: boolean
  fetchFeed: () => Promise<void>
  fetchMyPosts: () => Promise<void>
  createPost: (caption:string, amount:number, type:string, isPublic:boolean) => Promise<SocialActivity>
  reactToPost: (id:string, emoji:string) => Promise<void>
}
export const useSocialStore = create<State>()(
  persist(
    (set) => ({
      feed:[], myPosts:[], isLoading:false,
      fetchFeed: async () => {
        set({ isLoading:true })
        try { const { data } = await api.get('/social/feed'); set({ feed:data.data.activities??[] }) }
        catch {} finally { set({ isLoading:false }) }
      },
      fetchMyPosts: async () => {
        try { const { data } = await api.get('/social/mine'); set({ myPosts:data.data.posts??[] }) }
        catch {}
      },
      createPost: async (caption, amount, type, isPublic) => {
        const { data } = await api.post('/social/posts', { caption, amount, type, isPublic })
        const post: SocialActivity = data.data
        set(s => ({ myPosts:[post,...(s.myPosts??[])], feed:isPublic?[post,...(s.feed??[])]:s.feed }))
        return post
      },
      reactToPost: async (id, emoji) => {
        await api.post(`/social/posts/${id}/react`, { emoji })
        set(s => ({ feed:(s.feed??[]).map(p => p.id===id ? {...p, reactions:[...p.reactions,{userId:'me',emoji}]} : p) }))
      },
    }),
    { name:'opay-social-v10', onRehydrateStorage:()=>(s)=>{ if(s){if(!Array.isArray(s.feed))s.feed=[];if(!Array.isArray(s.myPosts))s.myPosts=[]} } }
  )
)
