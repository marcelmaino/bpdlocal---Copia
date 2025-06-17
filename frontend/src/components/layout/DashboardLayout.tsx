import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useAuthStore } from '@/stores/authStore'

const DashboardLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const location = useLocation()
  const { user } = useAuthStore()

  // Determinar título da página baseado na rota
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
      case '/':
        return 'Dashboard'
      case '/charts':
        return 'Gráficos'
      default:
        return 'Dashboard'
    }
  }

  return (
    <div className="min-h-screen bg-bpd-background flex">
      {/* Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        {/* Header */}
        <Header 
          title={getPageTitle()}
          user={user}
          onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout