import { useState } from 'react'
import { MessageCircle, Phone, Mail, ChevronRight, Plus, Send, HelpCircle, BookOpen, CheckCircle2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import Modal from '@/components/modals/Modal'
import { supportSchema, type SupportInput } from '@/lib/validators'
import { cn, formatDate, sleep } from '@/lib/utils'
import type { SupportTicket } from '@/types'
import toast from 'react-hot-toast'

const FAQS = [
  { q:'How do I fund my OPay wallet?',       a:'Tap "Add Money" on the Home screen. You can fund via bank transfer, USSD, or card payment.' },
  { q:'What is the daily transfer limit?',   a:'Limits depend on your KYC tier: Tier 1 (₦50K), Tier 2 (₦200K), Tier 3 (₦5M) per day.' },
  { q:'How do I create a virtual card?',     a:'Go to Cards tab, select Virtual Cards, accept Terms & Conditions, then tap "Get It Now".' },
  { q:'How does OWealth savings work?',       a:'OWealth offers Flex (6% p.a.), Target (10% p.a.), and Fixed (15% p.a.) savings products.' },
  { q:'Can I get a loan on OPay?',           a:'Yes! Navigate to Loans tab to see your eligibility and apply for QuickLoan, SalaryAdvance, or Business Loan.' },
]

const MOCK_TICKETS: SupportTicket[] = [
  { id:'TKT001', subject:'Transfer delay issue', category:'transaction', status:'in_progress', messages:[{id:'1',sender:'user',body:'My transfer of ₦50,000 is showing pending for 2 hours.',createdAt:new Date(Date.now()-3600000).toISOString()},{id:'2',sender:'agent',body:'Hi! We are investigating this. Please allow 24 hours.',createdAt:new Date(Date.now()-1800000).toISOString()}], createdAt:new Date(Date.now()-7200000).toISOString() },
  { id:'TKT002', subject:'Card not working online', category:'card', status:'resolved', messages:[{id:'1',sender:'user',body:'My virtual card was declined on Amazon.',createdAt:new Date(Date.now()-172800000).toISOString()}], createdAt:new Date(Date.now()-172800000).toISOString() },
]

const STATUS_STYLES: Record<string,string> = { open:'badge-gold', in_progress:'badge-blue', resolved:'badge-green', closed:'badge-gray' }

export default function Support() {
  const [tab, setTab] = useState<'faq'|'tickets'|'contact'>('faq')
  const [openFaq, setOpenFaq] = useState<number|null>(null)
  const [tickets, setTickets] = useState(MOCK_TICKETS)
  const [showCreate, setShowCreate] = useState(false)
  const [activeTicket, setActiveTicket] = useState<SupportTicket|null>(null)
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, reset, formState:{errors} } = useForm<SupportInput>({ resolver: zodResolver(supportSchema), defaultValues:{category:'general'} })

  const onCreate = async (data: SupportInput) => {
    setLoading(true); await sleep(1000)
    const t: SupportTicket = { id:`TKT${String(tickets.length+1).padStart(3,'0')}`, subject:data.subject, category:data.category, status:'open', messages:[{id:'1',sender:'user' as const,body:data.description,createdAt:new Date().toISOString()}], createdAt:new Date().toISOString() }
    setTickets(prev => [t,...prev]); toast.success('Ticket submitted! We\'ll respond within 24h.'); reset(); setShowCreate(false); setLoading(false)
  }

  const sendReply = () => {
    if (!reply.trim()||!activeTicket) return
    const msg = {id:crypto.randomUUID(),sender:'user' as const,body:reply,createdAt:new Date().toISOString()}
    setActiveTicket(t => t ? {...t,messages:[...t.messages,msg]} : t)
    setTickets(ts => ts.map(t=>t.id===activeTicket.id?{...t,messages:[...t.messages,msg]}:t))
    setReply('')
  }

  const content = (
    <div className="page-container">
      <div className="px-4 pt-4 pb-3">
        <h1 className="font-display font-bold text-xl text-gray-900">Help & Support</h1>
        <p className="text-gray-400 text-sm mt-0.5">We're here to help 24/7</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 mb-4">
        {([['faq','FAQs'],['tickets','My Tickets'],['contact','Contact Us']] as const).map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} className={cn('tab-pill flex-1', tab===id?'tab-active':'tab-inactive')}>{label}</button>
        ))}
      </div>

      {tab==='faq' && (
        <div className="px-4">
          <div className="mb-4 bg-brand-50 rounded-3xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0"><HelpCircle size={20} className="text-brand-600"/></div>
            <div><p className="font-bold text-sm text-gray-900">Quick Answers</p><p className="text-xs text-gray-500">Most common questions answered</p></div>
          </div>
          <div className="bg-white rounded-3xl shadow-card overflow-hidden">
            {FAQS.map((faq,i)=>(
              <div key={i} className="border-b border-gray-50 last:border-0">
                <button onClick={()=>setOpenFaq(openFaq===i?null:i)} className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-gray-50 transition-colors">
                  <span className="text-sm font-bold text-gray-900 flex-1 pr-3">{faq.q}</span>
                  <ChevronRight size={16} className={cn('text-gray-400 transition-transform flex-shrink-0',openFaq===i&&'rotate-90')}/>
                </button>
                {openFaq===i && <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed bg-brand-50/30">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==='tickets' && (
        <div className="px-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-display font-bold text-gray-900">My Tickets</p>
            <button onClick={()=>setShowCreate(true)} className="flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-brand-700"><Plus size={14}/>New</button>
          </div>
          {tickets.length===0 ? (
            <div className="text-center py-12 bg-white rounded-3xl shadow-card">
              <MessageCircle size={40} className="mx-auto mb-3 text-gray-200"/>
              <p className="font-bold text-gray-500">No support tickets</p>
              <button onClick={()=>setShowCreate(true)} className="btn-primary mt-4 px-6 py-2.5 text-sm">Create Ticket</button>
            </div>
          ) : (
            <div className="space-y-2">
              {tickets.map(t=>(
                <button key={t.id} onClick={()=>setActiveTicket(t)} className="w-full bg-white rounded-3xl shadow-card p-4 text-left hover:shadow-card-hover transition-all active:scale-[0.99]">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <p className="font-bold text-sm text-gray-900 truncate">{t.subject}</p>
                    <span className={cn('badge text-[10px] flex-shrink-0', STATUS_STYLES[t.status]??'badge-gray')}>{t.status.replace('_',' ')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="capitalize">{t.category}</span><span>·</span>
                    <span>{t.messages.length} msg{t.messages.length!==1?'s':''}</span><span>·</span>
                    <span>{formatDate(t.createdAt,'relative')}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {tab==='contact' && (
        <div className="px-4 space-y-3">
          {[
            {icon:MessageCircle,label:'Live Chat',sub:'Average 2 min response',color:'bg-brand-50 text-brand-600',action:()=>toast('Live chat coming soon!')},
            {icon:Phone,        label:'Call Us',  sub:'+234 700 OPay (6729)',  color:'bg-blue-50 text-blue-600',  action:()=>{}},
            {icon:Mail,         label:'Email',    sub:'support@opay.com',       color:'bg-purple-50 text-purple-600',action:()=>{}},
            {icon:BookOpen,     label:'Help Docs',sub:'Browse all articles',    color:'bg-amber-50 text-amber-600', action:()=>{}},
          ].map(({icon:Icon,label,sub,color,action})=>(
            <button key={label} onClick={action} className="w-full bg-white rounded-3xl shadow-card p-4 flex items-center gap-4 hover:shadow-card-hover transition-all active:scale-[0.98]">
              <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0', color)}><Icon size={22} strokeWidth={1.8}/></div>
              <div className="flex-1 text-left"><p className="font-bold text-sm text-gray-900">{label}</p><p className="text-xs text-gray-400">{sub}</p></div>
              <ChevronRight size={16} className="text-gray-300"/>
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <>
      <AppHeader title="Support"/>
      <DeviceFrame>{content}</DeviceFrame>

      {/* Create ticket modal */}
      <Modal isOpen={showCreate} onClose={()=>setShowCreate(false)} title="New Support Ticket">
        <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
          <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Subject</label><input {...register('subject')} placeholder="Briefly describe your issue" className="input-field"/>{errors.subject&&<p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>}</div>
          <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Category</label>
            <select {...register('category')} className="input-field bg-white">
              {(['transaction','account','card','loan','general'] as const).map(c=><option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Description</label><textarea {...register('description')} placeholder="Describe your issue in detail…" className="input-field resize-none" rows={4}/>{errors.description&&<p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}</div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">{loading?'Submitting…':'Submit Ticket'}</button>
        </form>
      </Modal>

      {/* Ticket conversation modal */}
      <Modal isOpen={!!activeTicket} onClose={()=>setActiveTicket(null)} title={activeTicket?.subject ?? ''} className="sm:max-w-lg">
        {activeTicket && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className={cn('badge', STATUS_STYLES[activeTicket.status]??'badge-gray')}>{activeTicket.status.replace('_',' ')}</span>
              <span className="text-xs text-gray-400">{activeTicket.id}</span>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
              {activeTicket.messages.map(m=>(
                <div key={m.id} className={cn('flex',m.sender==='user'?'justify-end':'justify-start')}>
                  <div className={cn('max-w-[80%] px-3 py-2 rounded-2xl text-sm',m.sender==='user'?'bg-brand-600 text-white':'bg-gray-100 text-gray-900')}>
                    <p>{m.body}</p><p className={cn('text-[10px] mt-1',m.sender==='user'?'text-brand-200':'text-gray-400')}>{formatDate(m.createdAt,'relative')}</p>
                  </div>
                </div>
              ))}
            </div>
            {activeTicket.status!=='resolved'&&activeTicket.status!=='closed' && (
              <div className="flex gap-2">
                <input value={reply} onChange={e=>setReply(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendReply()} placeholder="Type a reply…" className="input-field flex-1"/>
                <button onClick={sendReply} className="btn-primary px-4 py-3"><Send size={16}/></button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}
