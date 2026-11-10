import { create } from 'zustand'

export type Tab = 'contests' | 'upgrade' | 'cases' | 'friends' | 'profile'

interface AppStore {
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
  notification: { message: string; type: 'success' | 'error' | 'info' } | null
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void
  hideNotification: () => void
}

export const useAppStore = create<AppStore>((set) => ({
  activeTab: 'cases',
  setActiveTab: (tab) => set({ activeTab: tab }),
  notification: null,
  showNotification: (message, type = 'info') => {
    set({ notification: { message, type } })
    setTimeout(() => set({ notification: null }), 3000)
  },
  hideNotification: () => set({ notification: null }),
}))
