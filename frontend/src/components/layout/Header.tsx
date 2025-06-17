import { useState } from 'react'
import { Calendar, ChevronDown, LogOut, Menu, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { useDashboardStore } from '@/stores/dashboardStore'
import DateRangeSelector from '@/components/dashboard/DateRangeSelector'
import CurrencySelector from '@/components/dashboard/CurrencySelector'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface HeaderProps {
  title: string
  user: any
  onMenuToggle: () => void
}

const Header = ({ title, user, onMenuToggle }: HeaderProps) => {
  const { logout } = useAuthStore()
  const { dateRange, currency } = useDashboardStore()
  const [showDatePicker, setShowDatePicker] = useState(false)

  const handleLogout = () => {
    logout()
  }

  const formatDateRange = () => {
    if (dateRange.preset) {
      switch (dateRange.preset) {
        case 'current_week':
          return 'Semana Atual'
        case 'today':
          return 'Hoje'
        case 'last_week':
          return 'Última Semana'
        case 'last_30_days':
          return 'Últimos 30 dias'
        case 'all_time':
          return 'Todos os Registros'
        default:
          return 'Período Personalizado'
      }
    }
    
    if (dateRange.startDate && dateRange.endDate) {
      const start = new Date(dateRange.startDate).toLocaleDateString('pt-BR')
      const end = new Date(dateRange.endDate).toLocaleDateString('pt-BR')
      return `${start} - ${end}`
    }
    
    return 'Selecionar período'
  }

  const getCurrencyLabel = () => {
    switch (currency) {
      case 'BRL':
        return 'Real (R$)'
      case 'USD':
        return 'Dólar (US$)'
      case 'BOTH':
        return 'Ambas'
      default:
        return 'Ambas'
    }
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          className="lg:hidden"
        >
          <Menu size={20} />
        </Button>
        
        {/* Page Title */}
        <h1 className="text-xl font-semibold text-gray-800">
          {title} BPD
        </h1>
      </div>

      {/* Center Section - Date and Currency Selectors */}
      <div className="hidden md:flex items-center space-x-4">
        {/* Date Range Selector */}
        <div className="relative">
          <Button
            variant="outline"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center space-x-2 min-w-[200px] justify-between"
          >
            <div className="flex items-center space-x-2">
              <Calendar size={16} />
              <span className="text-sm">{formatDateRange()}</span>
            </div>
            <ChevronDown size={16} />
          </Button>
          
          {showDatePicker && (
            <div className="absolute top-full left-0 mt-2 z-50">
              <DateRangeSelector onClose={() => setShowDatePicker(false)} />
            </div>
          )}
        </div>

        {/* Currency Selector */}
        {/* <CurrencySelector /> */}
      </div>

      {/* Right Section - User Menu */}
      <div className="flex items-center space-x-4">
        {/* Mobile Date/Currency - Simplified */}
        <div className="md:hidden flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDatePicker(!showDatePicker)}
          >
            <Calendar size={16} />
          </Button>
        </div>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-100">
              <div className="w-8 h-8 bg-bpd-primary rounded-full flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium text-gray-700">
                  {user?.playerName || 'Usuário'}
                </div>
                <div className="text-xs text-gray-500 capitalize">
                  {user?.role === 'admin' ? 'Administrador' : 'Jogador'}
                </div>
              </div>
              <ChevronDown size={16} className="text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.playerName || 'Usuário'}
                </p>
                <p className="text-xs leading-none text-muted-foreground capitalize">
                  {user?.role === 'admin' ? 'Administrador' : 'Jogador'}
                </p>
              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile Date Picker Overlay */}
      {showDatePicker && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowDatePicker(false)}>
          <div className="absolute top-20 left-4 right-4" onClick={(e) => e.stopPropagation()}>
            <DateRangeSelector onClose={() => setShowDatePicker(false)} />
          </div>
        </div>
      )}
    </header>
  )
}

export default Header