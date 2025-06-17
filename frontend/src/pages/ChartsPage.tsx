import { useState, useEffect } from 'react'
import { BarChart3, LineChart, PieChart, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useDashboardStore } from '@/stores/dashboardStore'
import FiltersSection from '@/components/dashboard/FiltersSection'
import BalanceEvolutionChart from '@/components/charts/BalanceEvolutionChart'
import GainsVsFeesChart from '@/components/charts/GainsVsFeesChart'
import HandsByClubChart from '@/components/charts/HandsByClubChart'
import VolumeByDayChart from '@/components/charts/VolumeByDayChart'
import MetricsTab from '@/components/charts/MetricsTab'

type TabType = 'charts' | 'metrics'

const ChartsPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('charts')
  const { initializeDefaultDates } = useDashboardStore()

  useEffect(() => {
    // Initialize default dates on component mount
    initializeDefaultDates()
  }, [])

  const tabs = [
    {
      id: 'charts' as TabType,
      label: 'Gráficos',
      icon: BarChart3
    },
    {
      id: 'metrics' as TabType,
      label: 'Métricas',
      icon: TrendingUp
    }
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quadro de Desempenho Geral</h1>
          <p className="text-gray-600 mt-1">Análise visual e métricas detalhadas de performance</p>
        </div>
      </div>

      {/* Filters Section */}
      <FiltersSection />

      {/* Tabs Container */}
      <Card className="w-full">
        {/* Tab Headers */}
        <CardHeader className="pb-0">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <Button
                  key={tab.id}
                  variant="ghost"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-all duration-200",
                    activeTab === tab.id
                      ? "bg-white shadow-sm text-bpd-primary font-medium"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </Button>
              )
            })}
          </div>
        </CardHeader>

        {/* Tab Content */}
        <CardContent className="pt-6">
          {activeTab === 'charts' && (
            <div className="space-y-6">
              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Balance Evolution Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <LineChart size={20} className="text-bpd-primary" />
                      <span>Evolução do Balanço</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BalanceEvolutionChart />
                  </CardContent>
                </Card>

                {/* Gains vs Fees Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 size={20} className="text-green-600" />
                      <span>Ganhos vs Taxas</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <GainsVsFeesChart />
                  </CardContent>
                </Card>

                {/* Hands by Club Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <PieChart size={20} className="text-purple-600" />
                      <span>Distribuição de Mãos por Clube</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <HandsByClubChart />
                  </CardContent>
                </Card>

                {/* Volume by Day Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp size={20} className="text-blue-600" />
                      <span>Volume de Jogos por Dia da Semana</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <VolumeByDayChart />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'metrics' && (
            <MetricsTab />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ChartsPage