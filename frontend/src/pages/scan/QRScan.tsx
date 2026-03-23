import { QrCode, Camera, Zap } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'

export default function QRScan() {
  return (
    <>
      <AppHeader title="Scan QR Code" showBack/>
      <DeviceFrame>
        <div className="flex flex-col items-center justify-center min-h-[600px] px-8 text-center page-container">
          <div className="relative w-56 h-56 mb-8">
            <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-brand-600 rounded-tl-xl"/>
            <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-brand-600 rounded-tr-xl"/>
            <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-brand-600 rounded-bl-xl"/>
            <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-brand-600 rounded-br-xl"/>
            <div className="absolute inset-4 bg-gray-100 rounded-2xl flex items-center justify-center"><QrCode size={80} className="text-gray-300"/></div>
            <div className="absolute inset-x-4 top-1/2 h-0.5 bg-brand-500 animate-pulse"/>
          </div>
          <h2 className="font-display font-bold text-xl text-gray-900 mb-2">Scan to Pay</h2>
          <p className="text-gray-500 text-sm mb-8">Point your camera at an OPay QR code to send money instantly</p>
          <div className="flex gap-4">
            {[{icon:Camera,label:'Camera'},{icon:Zap,label:'Flash'}].map(({icon:Icon,label})=>(
              <button key={label} className="flex flex-col items-center gap-2 w-16">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"><Icon size={24} className="text-gray-600"/></div>
                <span className="text-xs font-semibold text-gray-600">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </DeviceFrame>
    </>
  )
}
