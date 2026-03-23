import { create } from 'zustand'
import { persist } from 'zustand/middleware'
export type DeviceView = 'mobile'|'tablet'|'desktop'
interface State { view: DeviceView; setView: (v: DeviceView) => void }
export const useDeviceViewStore = create<State>()(persist((set) => ({ view:'mobile', setView:(v)=>set({view:v}) }), { name:'opay-device-v3' }))
