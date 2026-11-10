import { create } from 'zustand'
import { api } from '../utils/api'

export interface User {
  id: number
  telegramId: string
  username?: string
  firstName: string
  lastName?: string
  coins: number
  tickets: number
  experience: number
  level: number
  rank: string
  referralCode: string
  isAdmin: boolean
  dailyStreak: number
  lastDailyBonus?: string
  createdAt: string
  _count: {
    inventory: number
    referrals: number
    caseOpenings: number
  }
}

interface UserStore {
  user: User | null
  loading: boolean
  error: string | null
  fetchUser: () => Promise<void>
  updateBalance: (coins: number, tickets: number) => void
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  loading: false,
  error: null,

  fetchUser: async () => {
    set({ loading: true, error: null })
    try {
      const user = await api.get<User>('/users/me')
      set({ user, loading: false })
    } catch (err: any) {
      set({ error: err.message, loading: false })
    }
  },

  updateBalance: (coins, tickets) => {
    set((state) => ({
      user: state.user ? { ...state.user, coins, tickets } : null
    }))
  },
}))
