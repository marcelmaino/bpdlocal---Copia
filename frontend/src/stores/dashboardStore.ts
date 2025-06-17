import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CurrencyType = 'BRL' | 'USD' | 'BOTH'
export type DatePreset = 'current_week' | 'today' | 'last_week' | 'last_30_days' | 'all_time' | 'custom'

interface DateRange {
  startDate: string | null
  endDate: string | null
  preset: DatePreset | null
}

interface Filters {
  search: string
  clubs: string[]
  agents: string[]
  players: string[]
}

interface DashboardState {
  // Date and Currency
  dateRange: DateRange
  currency: CurrencyType
  
  // Filters
  filters: Filters
  
  // Loading states
  isLoading: boolean
  
  // Actions
  setDateRange: (range: DateRange) => void
  setCurrency: (currency: CurrencyType) => void
  setFilters: (filters: Partial<Filters>) => void
  clearFilters: () => void
  setLoading: (loading: boolean) => void
  
  // Helper functions
  getDateRangeForAPI: () => { startDate: string; endDate: string }
  initializeDefaultDates: () => void
}

// Helper function to get start of week (Monday)
const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  return new Date(d.setDate(diff))
}

// Helper function to get end of week (Sunday)
const getEndOfWeek = (date: Date): Date => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? 0 : 7) // Adjust when day is Sunday
  return new Date(d.setDate(diff))
}

// Helper function to format date for API (YYYY-MM-DD)
const formatDateForAPI = (date: Date): string => {
  return date.toISOString().split('T')[0]
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      // Initial state
      dateRange: {
        startDate: null,
        endDate: null,
        preset: 'current_week'
      },
      currency: 'BOTH',
      filters: {
        search: '',
        clubs: [],
        agents: [],
        players: []
      },
      isLoading: false,

      // Actions
      setDateRange: (range: DateRange) => {
        set({ dateRange: range })
      },

      setCurrency: (currency: CurrencyType) => {
        set({ currency })
      },

      setFilters: (newFilters: Partial<Filters>) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters }
        }))
      },

      clearFilters: () => {
        set({
          filters: {
            search: '',
            clubs: [],
            agents: [],
            players: []
          }
        })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      // Helper to get date range for API calls
      getDateRangeForAPI: () => {
        const { dateRange } = get()
        const today = new Date()
        
        if (dateRange.startDate && dateRange.endDate) {
          return {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate
          }
        }
        
        // Calculate based on preset
        switch (dateRange.preset) {
          case 'today':
            return {
              startDate: formatDateForAPI(today),
              endDate: formatDateForAPI(today)
            }
            
          case 'current_week': {
            const startOfWeek = getStartOfWeek(today)
            return {
              startDate: formatDateForAPI(startOfWeek),
              endDate: formatDateForAPI(today)
            }
          }
          
          case 'last_week': {
            const lastWeek = new Date(today)
            lastWeek.setDate(today.getDate() - 7)
            const startOfLastWeek = getStartOfWeek(lastWeek)
            const endOfLastWeek = getEndOfWeek(lastWeek)
            return {
              startDate: formatDateForAPI(startOfLastWeek),
              endDate: formatDateForAPI(endOfLastWeek)
            }
          }
          
          case 'last_30_days': {
            const thirtyDaysAgo = new Date(today)
            thirtyDaysAgo.setDate(today.getDate() - 30)
            return {
              startDate: formatDateForAPI(thirtyDaysAgo),
              endDate: formatDateForAPI(today)
            }
          }
          
          case 'all_time': {
            // Return empty strings to indicate no date filtering (all records)
            return {
              startDate: '',
              endDate: ''
            }
          }
          
          default: {
            // Default to current week
            const startOfWeek = getStartOfWeek(today)
            return {
              startDate: formatDateForAPI(startOfWeek),
              endDate: formatDateForAPI(today)
            }
          }
        }
      },

      // Initialize default dates
      initializeDefaultDates: () => {
        const today = new Date()
        const startOfWeek = getStartOfWeek(today)
        
        set({
          dateRange: {
            startDate: formatDateForAPI(startOfWeek),
            endDate: formatDateForAPI(today),
            preset: 'current_week'
          }
        })
      }
    }),
    {
      name: 'bpd-dashboard-storage',
      partialize: (state) => ({
        currency: state.currency,
        dateRange: state.dateRange
      })
    }
  )
)