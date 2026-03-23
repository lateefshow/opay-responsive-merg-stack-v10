import { useState, useEffect } from 'react'
import { Shield, Smartphone, Monitor, AlertTriangle, CheckCircle2, XCircle, Eye, Lock, Bell, ChevronRight, LogOut, RefreshCw } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import Modal from '@/components/modals/Modal'
import { useSecurityStore } from '@/store/useSecurityStore'
import { formatDate, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const SEVERITY_META: Record<string, { color: string; bg: string; border: string }> = {
  critical: { color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200'    },
  high:     { color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-100'    },
  medium:   { color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-100'  },
  low:      { color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-100'   },
}

export default function SecurityCenter() {
  const { devices, loginHistory, alerts, unreadAlerts, twoFactorEnabled, isLoading, fetchOverview, blockDevice, markAlertRead, markAllRead, toggle2FA } = useSecurityStore()
  const [tab, setTab]             = useState<'overview' | 'devices' | 'alerts'>('overview')
  const [showBlock, setShowBlock] = useState<string | null>(null)
  const [loading2FA, setLoading2FA] = useState(false)

  useEffect(() => { fetchOverview() }, [])

  const safeDevices  = devices ?? []
  const safeHistory  = loginHistory ?? []
  const safeAlerts   = alerts ?? []
  const trustedCount = safeDevices.filter(d => d.trust === 'trusted').length
  const untrustCount = safeDevices.filter(d => d.trust === 'untrusted').length
  const secScore     = Math.round(((twoFactorEnabled ? 40 : 0) + (untrustCount === 0 ? 30 : 10) + (safeAlerts.filter(a => !a.isRead && (a.severity === 'critical' || a.severity === 'high')).length === 0 ? 30 : 10)))

  const handle2FA = async () => {
    setLoading2FA(true)
    try {
      await toggle2FA()
      toast.success(twoFactorEnabled ? '2FA disabled' : '2FA enabled — your account is more secure!')
    } catch { toast.error('Failed to toggle 2FA') }
    finally { setLoading2FA(false) }
  }

  const handleBlock = async (id: string) => {
    await blockDevice(id)
    setShowBlock(null)
    toast.success('Device blocked and sessions revoked')
  }

  const content = (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">Security Center</h1><p className="page-subtitle">Protect your account</p></div>
        <button onClick={() => fetchOverview()} className="btn-icon bg-gray-100">
          <RefreshCw size={16} className={cn('text-gray-600', isLoading && 'animate-spin')} />
        </button>
      </div>

      {/* Security Score Hero */}
      <div className="mx-4 mb-4 rounded-4xl bg-dark-gradient p-5 shadow-premium relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border-[20px] border-white/5" />
        <div className="relative z-10 flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
              <circle cx="40" cy="40" r="34" fill="none"
                stroke={secScore >= 80 ? '#16a34a' : secScore >= 50 ? '#f59e0b' : '#ef4444'}
                strokeWidth="8" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 34 * secScore / 100} 999`}
                transform="rotate(-90 40 40)" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="font-display font-bold text-white text-xl">{secScore}</p>
            </div>
          </div>
          <div>
            <p className={cn('font-display font-bold text-lg', secScore >= 80 ? 'text-brand-300' : secScore >= 50 ? 'text-amber-300' : 'text-red-300')}>
              {secScore >= 80 ? 'Strong' : secScore >= 50 ? 'Fair' : 'At Risk'}
            </p>
            <p className="text-white/60 text-xs mt-0.5">Security Score</p>
            <div className="flex gap-2 mt-2">
              {unreadAlerts > 0 && <span className="badge bg-red-500/20 text-red-300 text-[10px]">{unreadAlerts} alerts</span>}
              {untrustCount > 0 && <span className="badge bg-amber-500/20 text-amber-300 text-[10px]">{untrustCount} unknown device{untrustCount > 1 ? 's' : ''}</span>}
              {secScore >= 80 && <span className="badge bg-brand-500/20 text-brand-300 text-[10px]">All clear ✓</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 px-4 mb-4">
        {([['overview', 'Overview'], ['devices', `Devices (${safeDevices.length})`], ['alerts', `Alerts ${unreadAlerts > 0 ? `(${unreadAlerts})` : ''}`]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn('tab-pill flex-1 text-[11px]', tab === id ? 'tab-active' : 'tab-inactive')}>{label}</button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === 'overview' && (
        <div className="px-4 space-y-3">
          {/* 2FA Toggle */}
          <div className="bg-white rounded-3xl shadow-card p-4 flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0', twoFactorEnabled ? 'bg-brand-50' : 'bg-gray-100')}>
              <Lock size={18} className={twoFactorEnabled ? 'text-brand-600' : 'text-gray-500'} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900">Two-Factor Authentication</p>
              <p className="text-xs text-gray-400 mt-0.5">{twoFactorEnabled ? 'Active — login requires OTP confirmation' : 'Disabled — enable for stronger protection'}</p>
            </div>
            <button onClick={handle2FA} disabled={loading2FA}
              className={cn('relative w-12 h-6 rounded-full transition-all', twoFactorEnabled ? 'bg-brand-500' : 'bg-gray-200')}>
              <div className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all', twoFactorEnabled ? 'left-6' : 'left-0.5')} />
            </button>
          </div>

          {/* Security tips */}
          {[
            { done: twoFactorEnabled, label: 'Enable 2FA', desc: 'Adds OTP to every login', icon: Lock },
            { done: untrustCount === 0, label: 'Review unknown devices', desc: `${untrustCount} untrusted device${untrustCount !== 1 ? 's' : ''} detected`, icon: Smartphone },
            { done: safeAlerts.filter(a => !a.isRead).length === 0, label: 'Review all alerts', desc: `${unreadAlerts} unread alert${unreadAlerts !== 1 ? 's' : ''}`, icon: Bell },
            { done: true, label: 'Strong PIN set', desc: '6-digit transaction PIN active', icon: CheckCircle2 },
          ].map(({ done, label, desc, icon: Icon }) => (
            <div key={label} className="bg-white rounded-2xl shadow-card p-4 flex items-center gap-3">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', done ? 'bg-brand-50' : 'bg-amber-50')}>
                <Icon size={16} className={done ? 'text-brand-600' : 'text-amber-600'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              {done ? <CheckCircle2 size={18} className="text-brand-500 flex-shrink-0" /> : <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />}
            </div>
          ))}

          {/* Recent login history */}
          <p className="section-label mt-2">Recent Login Activity</p>
          <div className="surface">
            {safeHistory.slice(0, 5).map((h, idx) => (
              <div key={h.id} className={cn('list-item', idx < Math.min(safeHistory.length, 5) - 1 && 'border-b border-gray-50')}>
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', h.success ? 'bg-brand-50' : 'bg-red-50')}>
                  {h.success ? <CheckCircle2 size={16} className="text-brand-600" /> : <XCircle size={16} className="text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{h.device}</p>
                  <p className="text-xs text-gray-400">{h.location} · {formatDate(h.timestamp, 'relative')}</p>
                </div>
                <span className={cn('text-[10px] font-bold', h.success ? 'text-brand-600' : 'text-red-500')}>{h.success ? 'Success' : 'Failed'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DEVICES TAB */}
      {tab === 'devices' && (
        <div className="px-4 space-y-3">
          {safeDevices.map(device => {
            const isDesktop = device.browser.toLowerCase().includes('chrome') || device.browser.toLowerCase().includes('firefox')
            const Icon      = isDesktop ? Monitor : Smartphone
            return (
              <div key={device.id} className={cn('bg-white rounded-3xl shadow-card p-4', device.trust === 'blocked' && 'opacity-60')}>
                <div className="flex items-start gap-3">
                  <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0',
                    device.isCurrent ? 'bg-brand-50' : device.trust === 'untrusted' ? 'bg-amber-50' : device.trust === 'blocked' ? 'bg-gray-100' : 'bg-gray-50')}>
                    <Icon size={18} className={device.isCurrent ? 'text-brand-600' : device.trust === 'untrusted' ? 'text-amber-600' : 'text-gray-500'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-sm font-bold text-gray-900">{device.name}</p>
                      {device.isCurrent && <span className="badge badge-green text-[9px]">Current</span>}
                      {device.trust === 'untrusted' && <span className="badge badge-gold text-[9px]">Unknown</span>}
                      {device.trust === 'blocked'   && <span className="badge badge-red text-[9px]">Blocked</span>}
                    </div>
                    <p className="text-xs text-gray-400">{device.browser} · {device.os}</p>
                    <p className="text-xs text-gray-400">{device.location} · {device.ip}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Last seen {formatDate(device.lastSeen, 'relative')}</p>
                  </div>
                </div>
                {!device.isCurrent && device.trust !== 'blocked' && (
                  <button onClick={() => setShowBlock(device.id)}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                    <LogOut size={12} /> Block & Revoke Sessions
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ALERTS TAB */}
      {tab === 'alerts' && (
        <div className="px-4">
          {unreadAlerts > 0 && (
            <button onClick={() => { markAllRead(); toast.success('All alerts marked as read') }}
              className="w-full flex items-center justify-center gap-2 py-2.5 mb-3 text-xs font-bold text-brand-600 bg-brand-50 rounded-2xl hover:bg-brand-100 transition-colors">
              <Eye size={13} /> Mark All as Read
            </button>
          )}
          <div className="space-y-2">
            {safeAlerts.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-3xl shadow-card">
                <Shield size={36} className="mx-auto mb-3 text-gray-200" />
                <p className="font-bold text-gray-400">No security alerts</p>
              </div>
            ) : safeAlerts.map(alert => {
              const sev = SEVERITY_META[alert.severity] ?? SEVERITY_META.low
              return (
                <div key={alert.id} onClick={() => markAlertRead(alert.id)}
                  className={cn('bg-white rounded-2xl shadow-card p-4 border cursor-pointer transition-all hover:shadow-card-hover', !alert.isRead ? sev.border : 'border-transparent')}>
                  <div className="flex items-start gap-3">
                    <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5', sev.bg)}>
                      <AlertTriangle size={14} className={sev.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold text-gray-900">{alert.title}</p>
                        {!alert.isRead && <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-500">{alert.description}</p>
                      <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1.5">
                        <span className={cn('badge text-[9px]', sev.bg, sev.color)}>{alert.severity}</span>
                        {formatDate(alert.createdAt, 'relative')}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      <AppHeader title="Security" showBack />
      <DeviceFrame>{content}</DeviceFrame>

      <Modal isOpen={!!showBlock} onClose={() => setShowBlock(null)} title="Block Device?">
        <div className="text-center py-2">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <LogOut size={28} className="text-red-600" />
          </div>
          <p className="text-sm text-gray-600 mb-5">This will block the device and revoke all active sessions on it. You cannot undo this.</p>
          <div className="flex gap-3">
            <button onClick={() => setShowBlock(null)} className="flex-1 py-3 text-sm font-bold bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors">Cancel</button>
            <button onClick={() => showBlock && handleBlock(showBlock)} className="flex-1 py-3 text-sm font-bold bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-colors">Block Device</button>
          </div>
        </div>
      </Modal>
    </>
  )
}
