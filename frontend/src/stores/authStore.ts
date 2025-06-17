import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'
import toast from 'react-hot-toast'

interface User {
  id: string
  playerName: string
  role: 'admin' | 'player'
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  initializeAuth: () => void
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (username: string, password: string) => {
        set({ isLoading: true })
        
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            username,
            password
          })

          const { token, user } = response.data.data
          
          // Configurar token no axios para próximas requisições
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false
          })

          toast.success('Login realizado com sucesso!')
          return true
        } catch (error: any) {
          const message = error.response?.data?.message || 'Erro ao fazer login'
          toast.error(message)
          
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false
          })
          
          return false
        }
      },

      logout: () => {
        // Remover token do axios
        delete axios.defaults.headers.common['Authorization']
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        })
        
        toast.success('Logout realizado com sucesso!')
      },

      initializeAuth: () => {
        const { token } = get()
        
        if (token) {
          // Configurar token no axios
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          // Verificar se o token ainda é válido
          axios.get(`${API_BASE_URL}/auth/validate`)
            .then(() => {
              set({ isAuthenticated: true })
            })
            .catch(() => {
              // Token inválido, fazer logout
              get().logout()
            })
        }
      }
    }),
    {
      name: 'bpd-auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token 
      })
    }
  )
)