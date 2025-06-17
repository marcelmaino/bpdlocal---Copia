import { Link, useLocation } from 'react-router-dom'
import { BarChart3, Home, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  const location = useLocation()

  const menuItems = [
    {
      icon: Home,
      label: 'Dashboard',
      path: '/dashboard',
      active: location.pathname === '/dashboard' || location.pathname === '/'
    },
    {
      icon: BarChart3,
      label: 'Gráficos',
      path: '/charts',
      active: location.pathname === '/charts'
    }
  ]

  return (
    <>
      {/* Overlay para mobile */}
      {!collapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-50 transition-all duration-300 shadow-lg",
        collapsed ? "w-16" : "w-64"
      )}>
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-center border-b border-gray-200 bg-bpd-primary">
          <div className={cn(
            "transition-all duration-300",
            collapsed ? "w-8 h-10" : "w-12 h-15"
          )}>
            <svg viewBox="0 0 143.7 179.94" className="w-full h-full text-blue-500">
              <path 
                className="fill-blue-400" 
                d="M25.71,129.08v-15.46l53.21-20.31,26.22-10.28c21.85-10.8,33.42-25.45,33.42-43.7C138.56,13.37,117.22,0,80.2,0H0v129.08h25.71ZM25.71,21.34h54.5c21.59,0,31.62,6.43,31.62,20.05s-9,21.59-29.82,29.31l-56.3,21.08V21.34Z"/>
              <polygon points="108.36 81.36 108.36 81.36 108.36 81.36 108.36 81.36"/>
              <path 
                className="fill-black" 
                d="M105.14,83.03l-26.22,10.28,7.71,4.63c20.82,12.6,30.33,20.82,30.33,35.22,0,16.71-11.31,25.45-33.42,25.45H0v21.34h83.55c38.82,0,60.15-16.45,60.15-45.24,0-22.11-9.77-35.22-38.56-51.67Z"/>
            </svg>
          </div>
        </div>

        {/* Toggle Button - Visível apenas em desktop */}
        <div className="hidden lg:block absolute -right-3 top-20">
          <Button
            variant="outline"
            size="icon"
            onClick={onToggle}
            className="h-6 w-6 rounded-full bg-white border-2 border-gray-200 shadow-md hover:shadow-lg"
          >
            {collapsed ? <Menu size={12} /> : <X size={12} />}
          </Button>
        </div>

        {/* Navigation Menu */}
        <nav className="mt-6 px-2">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center px-3 py-3 rounded-lg transition-all duration-200 group",
                      item.active 
                        ? "bg-bpd-primary text-neutral-700 shadow-md" 
                        : "text-gray-600 hover:bg-gray-100 hover:text-bpd-primary",
                      collapsed ? "justify-center" : "justify-start"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon 
                      size={20} 
                      className={cn(
                        "transition-colors duration-200 text-neutral-700",
                        collapsed ? "" : "mr-3"
                      )} 
                    />
                    {!collapsed && (
                      <span className="font-medium text-sm">
                        {item.label}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer - Versão */}
        {!collapsed && (
          <div className="absolute bottom-4 left-0 right-0 px-4">
            <div className="text-xs text-gray-400 text-center">
              BPD Dashboard v1.0
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default Sidebar