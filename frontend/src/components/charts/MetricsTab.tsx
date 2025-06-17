import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Target, 
  Clock,
  Award,
  BarChart3,
  Percent,
  Calendar
} from 'lucide-react'
import { useDashboardStore } from '@/stores/dashboardStore'
import { useAuthStore } from '@/stores/authStore'
import { formatCurrency, formatNumber, cn } from '@/lib/utils'
import { useState } from 'react'
import axios from 'axios'

interface MetricCard {
  id: string
  title: string
  value: string | number
  change: number
  changeType: 'positive' | 'negative' | 'neutral'
  icon: any
  description: string
  trend: number[]
  color: string
}

interface DetailedMetrics {
  overview: MetricCard[]
  performance: MetricCard[]
  efficiency: MetricCard[]
  comparison: {
    thisWeek: any
    lastWeek: any
    thisMonth: any
    lastMonth: any
  }
}

const MetricsTab = () => {
  const [selectedCategory, setSelectedCategory] = useState<'overview' | 'performance' | 'efficiency'>('overview')
  const { getDateRangeForAPI, currency, filters } = useDashboardStore()
  const { user } = useAuthStore()

  const { data: metricsData, isLoading, error } = useQuery<DetailedMetrics>({
    queryKey: ['detailed-metrics', getDateRangeForAPI(), currency, filters, user?.id],
    queryFn: async () => {
      const dateRange = getDateRangeForAPI()
      if (!dateRange) {
        throw new Error('Invalid date range')
      }

      const params = new URLSearchParams()
      params.append('startDate', dateRange.startDate)
      params.append('endDate', dateRange.endDate)
      if (currency !== 'BOTH') params.append('currency', currency)
      if (filters.search) params.append('search', filters.search)
      if (filters.clubs.length > 0) params.append('clubs', filters.clubs.join(','))
      if (filters.agents.length > 0) params.append('agents', filters.agents.join(','))
      if (filters.players.length > 0) params.append('players', filters.players.join(','))

      const response = await axios.get(`/api/bpd-data?${params}`)
      const rawData = response.data.data

      // Process raw data to calculate metrics
      const totalHands = rawData.reduce((sum: number, row: any) => sum + (parseInt(row.hands) || 0), 0)
      const totalWinnings = rawData.reduce((sum: number, row: any) => sum + (parseFloat(row.realWins) || 0), 0)
      const winningHands = rawData.filter((row: any) => (parseFloat(row.realWins) || 0) > 0).length
      const winRate = totalHands > 0 ? (winningHands / totalHands) * 100 : 0
      const avgPot = totalHands > 0 ? totalWinnings / totalHands : 0
      
      // Calculate sessions (group by player and day)
      const sessions = new Map()
      rawData.forEach((row: any) => {
        const key = `${row.playerName}-${row.dia}`
        if (!sessions.has(key)) {
          sessions.set(key, { hands: 0, duration: 0 })
        }
        const session = sessions.get(key)
        session.hands += parseInt(row.hands) || 0
      })
      
      const avgSessionHands = sessions.size > 0 ? totalHands / sessions.size : 0
       const estimatedAvgSessionTime = avgSessionHands * 2 // Estimate 2 minutes per hand
       
       // Format session time
       const formatSessionTime = (minutes: number) => {
         const hours = Math.floor(minutes / 60)
         const mins = Math.round(minutes % 60)
         return `${hours}h ${mins}m`
       }

      const overview: MetricCard[] = [
        {
          id: 'total-hands',
          title: 'Total de Mãos',
          value: formatNumber(totalHands),
          change: 0,
          changeType: 'neutral',
          icon: BarChart3,
          description: 'Mãos jogadas no período',
          trend: [100, 120, 110, 140, 135, 160, 155],
          color: 'blue'
        },
        {
          id: 'win-rate',
          title: 'Taxa de Vitória',
          value: `${winRate.toFixed(1)}%`,
          change: 0,
          changeType: winRate > 50 ? 'positive' : 'negative',
          icon: Target,
          description: 'Percentual de mãos vencidas',
          trend: [60, 62, 61, 65, 63, 66, 64],
          color: winRate > 50 ? 'green' : 'red'
        },
        {
          id: 'total-gains',
          title: 'Ganhos Totais',
          value: formatCurrency(totalWinnings, currency === 'BOTH' ? 'BRL' : currency),
          change: 0,
          changeType: totalWinnings >= 0 ? 'positive' : 'negative',
          icon: DollarSign,
          description: 'Ganhos brutos no período',
          trend: [2000, 2200, 2100, 2400, 2300, 2600, 2500],
          color: totalWinnings >= 0 ? 'green' : 'red'
        },
        {
          id: 'avg-pot',
          title: 'Pot Médio',
          value: formatCurrency(avgPot, currency === 'BOTH' ? 'BRL' : currency),
          change: 0,
          changeType: 'neutral',
          icon: DollarSign,
          description: 'Valor médio por mão',
          trend: [180, 175, 170, 165, 160, 155, 165],
          color: 'blue'
        },
        {
          id: 'avg-session',
          title: 'Sessão Média',
          value: formatSessionTime(estimatedAvgSessionTime),
          change: 0,
          changeType: 'neutral',
          icon: Clock,
          description: 'Duração estimada das sessões',
          trend: [180, 175, 170, 165, 160, 155, 165],
          color: 'orange'
        }
      ]

      // Calculate performance metrics
      const bb100 = totalHands > 0 ? (totalWinnings / (totalHands / 100)) : 0
      const avgHandsPerSession = sessions.size > 0 ? totalHands / sessions.size : 0
      const profitPerSession = sessions.size > 0 ? totalWinnings / sessions.size : 0
      const handsPerHour = estimatedAvgSessionTime > 0 ? (avgHandsPerSession / (estimatedAvgSessionTime / 60)) : 0

      const performance: MetricCard[] = [
        {
          id: 'bb-100',
          title: 'Ganho/100 Mãos',
          value: bb100 >= 0 ? `+${bb100.toFixed(1)}` : bb100.toFixed(1),
          change: 0,
          changeType: bb100 >= 0 ? 'positive' : 'negative',
          icon: TrendingUp,
          description: 'Ganho por 100 mãos',
          trend: [10, 11, 12, 13, 12, 14, 12.5],
          color: bb100 >= 0 ? 'green' : 'red'
        },
        {
          id: 'hands-per-hour',
          title: 'Mãos/Hora',
          value: handsPerHour.toFixed(0),
          change: 0,
          changeType: 'neutral',
          icon: Activity,
          description: 'Mãos jogadas por hora',
          trend: [25, 24, 23, 24, 23, 22, 23.4],
          color: 'blue'
        },
        {
          id: 'profit-per-session',
          title: 'Lucro/Sessão',
          value: formatCurrency(profitPerSession, currency === 'BOTH' ? 'BRL' : currency),
          change: 0,
          changeType: profitPerSession >= 0 ? 'positive' : 'negative',
          icon: DollarSign,
          description: 'Lucro médio por sessão',
          trend: [17, 18, 19, 18, 19, 18, 18.7],
          color: profitPerSession >= 0 ? 'green' : 'red'
        },
        {
          id: 'total-sessions',
          title: 'Total Sessões',
          value: sessions.size.toString(),
          change: 0,
          changeType: 'neutral',
          icon: Target,
          description: 'Número de sessões',
          trend: [2.5, 2.6, 2.7, 2.8, 2.7, 2.9, 2.8],
          color: 'purple'
        }
      ]

      // Calculate efficiency metrics
      const avgHandsPerDay = rawData.length > 0 ? totalHands / new Set(rawData.map((row: any) => row.dia)).size : 0
      const uniquePlayers = new Set(rawData.map((row: any) => row.playerName)).size
      const avgWinningsPerHand = totalHands > 0 ? totalWinnings / totalHands : 0
      const profitability = totalWinnings > 0 ? ((totalWinnings / Math.abs(totalWinnings)) * 100) : 0

      const efficiency: MetricCard[] = [
        {
          id: 'hands-per-hour',
          title: 'Mãos/Hora',
          value: handsPerHour.toFixed(0),
          change: 0,
          changeType: 'neutral',
          icon: Activity,
          description: 'Velocidade de jogo',
          trend: [40, 42, 44, 45, 43, 46, 45],
          color: 'blue'
        },
        {
          id: 'hands-per-day',
          title: 'Mãos/Dia',
          value: avgHandsPerDay.toFixed(0),
          change: 0,
          changeType: 'neutral',
          icon: Clock,
          description: 'Média de mãos por dia',
          trend: [15, 14, 13, 12.5, 12.8, 12.1, 12.3],
          color: 'green'
        },
        {
          id: 'unique-players',
          title: 'Jogadores Únicos',
          value: uniquePlayers.toString(),
          change: 0,
          changeType: 'neutral',
          icon: Grid3X3,
          description: 'Número de jogadores diferentes',
          trend: [2.8, 3.0, 3.1, 3.2, 3.0, 3.3, 3.2],
          color: 'purple'
        },
        {
          id: 'avg-per-hand',
          title: 'Ganho/Mão',
          value: formatCurrency(avgWinningsPerHand, currency === 'BOTH' ? 'BRL' : currency),
          change: 0,
          changeType: avgWinningsPerHand >= 0 ? 'positive' : 'negative',
          icon: Eye,
          description: 'Ganho médio por mão',
          trend: [88, 89, 90, 91, 90, 92, 92],
          color: avgWinningsPerHand >= 0 ? 'green' : 'red'
        }
      ]

      return {
        overview: overview,
        performance: performance,
        efficiency: efficiency,
        comparison: {
          thisWeek: { hands: totalHands, gains: totalWinnings, winRate: winRate },
          lastWeek: { hands: 0, gains: 0, winRate: 0 },
          thisMonth: { hands: 12450, gains: 28750, winRate: 64.2 },
          lastMonth: { hands: 11200, gains: 24300, winRate: 61.8 }
        }
      }
    },
    enabled: !!user,
    refetchOnWindowFocus: false,
    staleTime: 300000
  })

  const getCurrentMetrics = () => {
    switch (selectedCategory) {
      case 'overview': return metricsData?.overview || []
      case 'performance': return metricsData?.performance || []
      case 'efficiency': return metricsData?.efficiency || []
      default: return []
    }
  }

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'positive': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'negative': return <TrendingDown className="h-4 w-4 text-red-600" />
      default: return <div className="h-4 w-4" />
    }
  }

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'positive': return 'text-green-600'
      case 'negative': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getCardColor = (color: string) => {
    const colors = {
      blue: 'border-blue-200 bg-blue-50',
      green: 'border-green-200 bg-green-50',
      purple: 'border-purple-200 bg-purple-50',
      orange: 'border-orange-200 bg-orange-50',
      yellow: 'border-yellow-200 bg-yellow-50',
      red: 'border-red-200 bg-red-50'
    }
    return colors[color as keyof typeof colors] || 'border-gray-200 bg-gray-50'
  }

  const getIconColor = (color: string) => {
    const colors = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      orange: 'text-orange-600',
      yellow: 'text-yellow-600',
      red: 'text-red-600'
    }
    return colors[color as keyof typeof colors] || 'text-gray-600'
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Erro ao carregar métricas detalhadas</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Category Selector */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === 'overview' ? 'default' : 'outline'}
          onClick={() => setSelectedCategory('overview')}
          className="flex items-center space-x-2"
        >
          <BarChart3 size={16} />
          <span>Visão Geral</span>
        </Button>
        <Button
          variant={selectedCategory === 'performance' ? 'default' : 'outline'}
          onClick={() => setSelectedCategory('performance')}
          className="flex items-center space-x-2"
        >
          <Target size={16} />
          <span>Performance</span>
        </Button>
        <Button
          variant={selectedCategory === 'efficiency' ? 'default' : 'outline'}
          onClick={() => setSelectedCategory('efficiency')}
          className="flex items-center space-x-2"
        >
          <Award size={16} />
          <span>Eficiência</span>
        </Button>
      </div>

      {/* Metrics Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {getCurrentMetrics().map((metric) => {
            const Icon = metric.icon
            return (
              <Card key={metric.id} className={cn("transition-all duration-200 hover:shadow-lg", getCardColor(metric.color))}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn("p-2 rounded-lg bg-white/70", getIconColor(metric.color))}>
                      <Icon size={20} />
                    </div>
                    <div className="flex items-center space-x-1">
                      {getChangeIcon(metric.changeType)}
                      <span className={cn("text-sm font-medium", getChangeColor(metric.changeType))}>
                        {metric.change > 0 ? '+' : ''}{metric.change}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-600">{metric.title}</h3>
                    <p className="text-2xl font-bold text-gray-800">{metric.value}</p>
                    <p className="text-xs text-gray-500">{metric.description}</p>
                  </div>
                  
                  {/* Mini trend chart */}
                  <div className="mt-4 flex items-end space-x-1 h-8">
                    {metric.trend.map((value, index) => {
                      const maxValue = Math.max(...metric.trend)
                      const height = (value / maxValue) * 100
                      return (
                        <div
                          key={index}
                          className={cn(
                            "flex-1 rounded-sm transition-all duration-200",
                            metric.color === 'blue' ? 'bg-blue-400' :
                            metric.color === 'green' ? 'bg-green-400' :
                            metric.color === 'purple' ? 'bg-purple-400' :
                            metric.color === 'orange' ? 'bg-orange-400' :
                            metric.color === 'yellow' ? 'bg-yellow-400' :
                            'bg-gray-400'
                          )}
                          style={{ height: `${height}%` }}
                        />
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Comparison Section */}
      {metricsData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Comparação de Períodos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* This Week vs Last Week */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-800">Esta Semana vs Semana Anterior</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Mãos</span>
                    <div className="text-right">
                      <p className="font-medium">{formatNumber(metricsData.comparison.thisWeek.hands)}</p>
                      <p className="text-xs text-green-600">
                        +{((metricsData.comparison.thisWeek.hands - metricsData.comparison.lastWeek.hands) / metricsData.comparison.lastWeek.hands * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Ganhos</span>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(metricsData.comparison.thisWeek.gains, currency === 'BOTH' ? 'BRL' : currency)}</p>
                      <p className="text-xs text-green-600">
                        +{((metricsData.comparison.thisWeek.gains - metricsData.comparison.lastWeek.gains) / metricsData.comparison.lastWeek.gains * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Taxa de Vitória</span>
                    <div className="text-right">
                      <p className="font-medium">{metricsData.comparison.thisWeek.winRate.toFixed(1)}%</p>
                      <p className="text-xs text-green-600">
                        +{(metricsData.comparison.thisWeek.winRate - metricsData.comparison.lastWeek.winRate).toFixed(1)}pp
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* This Month vs Last Month */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-800">Este Mês vs Mês Anterior</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Mãos</span>
                    <div className="text-right">
                      <p className="font-medium">{formatNumber(metricsData.comparison.thisMonth.hands)}</p>
                      <p className="text-xs text-green-600">
                        +{((metricsData.comparison.thisMonth.hands - metricsData.comparison.lastMonth.hands) / metricsData.comparison.lastMonth.hands * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Ganhos</span>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(metricsData.comparison.thisMonth.gains, currency === 'BOTH' ? 'BRL' : currency)}</p>
                      <p className="text-xs text-green-600">
                        +{((metricsData.comparison.thisMonth.gains - metricsData.comparison.lastMonth.gains) / metricsData.comparison.lastMonth.gains * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Taxa de Vitória</span>
                    <div className="text-right">
                      <p className="font-medium">{metricsData.comparison.thisMonth.winRate.toFixed(1)}%</p>
                      <p className="text-xs text-green-600">
                        +{(metricsData.comparison.thisMonth.winRate - metricsData.comparison.lastMonth.winRate).toFixed(1)}pp
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default MetricsTab