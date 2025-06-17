import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { CreditCard, DollarSign, Percent, Coins, TrendingUp, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDashboardStore } from '@/stores/dashboardStore'
import { useAuthStore } from '@/stores/authStore'
import { formatCurrency, formatNumber, calculateFinalBalance, getValueColor } from '@/lib/utils'
import axios from 'axios'

interface MetricsData {
  totalHands: number
  totalWinnings: number
  avgPot: number
  winRate: number
}

const MetricsCards = () => {
  const { getDateRangeForAPI, currency, filters, dateRange } = useDashboardStore()
  const { user } = useAuthStore()

  // Function to calculate previous period
  const getPreviousPeriod = () => {
    const current = getDateRangeForAPI()
    
    // If no dates are set (all_time), return null to disable comparison
    if (!current.startDate || !current.endDate) {
      return null
    }
    
    const startDate = new Date(current.startDate)
    const endDate = new Date(current.endDate)
    
    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return null
    }
    
    const diffTime = endDate.getTime() - startDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    const previousEndDate = new Date(startDate)
    previousEndDate.setDate(previousEndDate.getDate() - 1)
    
    const previousStartDate = new Date(previousEndDate)
    previousStartDate.setDate(previousStartDate.getDate() - diffDays + 1)
    
    return {
      startDate: previousStartDate.toISOString().split('T')[0],
      endDate: previousEndDate.toISOString().split('T')[0]
    }
  }

  const { data: metrics, isLoading, error } = useQuery<MetricsData>({
    queryKey: ['dashboard-metrics', getDateRangeForAPI(), currency, filters, user?.id],
    queryFn: async () => {
      const dateRange = getDateRangeForAPI()
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        currency: currency === 'BOTH' ? undefined : currency,
        search: filters.search || undefined,
        clubs: filters.clubs.length > 0 ? filters.clubs.join(',') : undefined,
        agents: filters.agents.length > 0 ? filters.agents.join(',') : undefined,
        players: filters.players.length > 0 ? filters.players.join(',') : undefined
      }

      const response = await axios.get('/api/dashboard/metrics', { params })
      return response.data.data
    },
    enabled: !!user,
      refetchOnWindowFocus: false,
      staleTime: 30000 // 30 seconds
    }
  )

  // Query for previous period data
  const { data: previousMetrics } = useQuery<MetricsData>({
    queryKey: ['dashboard-metrics-previous', getPreviousPeriod(), currency, filters, user?.id],
    queryFn: async () => {
      const previousPeriod = getPreviousPeriod()
      if (!previousPeriod) {
        throw new Error('No previous period available')
      }
      
      const params = {
        startDate: previousPeriod.startDate,
        endDate: previousPeriod.endDate,
        currency: currency === 'BOTH' ? undefined : currency,
        search: filters.search || undefined,
        clubs: filters.clubs.length > 0 ? filters.clubs.join(',') : undefined,
        agents: filters.agents.length > 0 ? filters.agents.join(',') : undefined,
        players: filters.players.length > 0 ? filters.players.join(',') : undefined
      }

      const response = await axios.get('/api/dashboard/metrics', { params })
      return response.data.data
    },
    enabled: !!user && !!metrics && !!getPreviousPeriod(),
    refetchOnWindowFocus: false,
    staleTime: 30000
  })

  const cards = [
    {
      title: 'Total de Mãos',
      value: metrics?.totalHands || 0,
      icon: CreditCard,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      format: 'number'
    },
    {
      title: 'Total de Ganhos',
      value: metrics?.totalWinnings || 0,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      format: 'currency'
    },
    {
      title: 'Pot Médio',
      value: metrics?.avgPot || 0,
      icon: Percent,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      format: 'currency'
    },
    {
      title: 'Taxa de Vitória',
      value: metrics?.winRate || 0,
      icon: Percent,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      format: 'percentage'
    },
    {
      title: 'Balanço Final',
      value: metrics?.totalWinnings || 0,
      icon: TrendingUp,
      color: getValueColor(metrics?.totalWinnings || 0),
      bgColor: (metrics?.totalWinnings || 0) >= 0 ? 'bg-green-50' : 'bg-red-50',
      format: 'currency'
    }
  ]

  // Function to calculate percentage change
  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  // Function to get comparison data
  const getComparison = (currentValue: number, field: keyof MetricsData) => {
    if (!previousMetrics) return null
    
    const previousValue = previousMetrics[field] || 0
    const percentageChange = calculatePercentageChange(currentValue, previousValue)
    const isPositive = percentageChange > 0
    const isNegative = percentageChange < 0
    
    return {
      percentageChange: Math.abs(percentageChange),
      isPositive,
      isNegative,
      isNeutral: percentageChange === 0
    }
  }

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        if (currency === 'BOTH') {
          return formatCurrency(value, 'BRL') // Default to BRL when both
        }
        return formatCurrency(value, currency === 'USD' ? 'USD' : 'BRL')
      case 'number':
        return formatNumber(value)
      case 'percentage':
        return `${value}%`
      default:
        return value.toString()
    }
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} className="border-red-200">
            <CardContent className="p-6">
              <div className="text-center text-red-600">
                <p className="text-sm">Erro ao carregar</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        const fieldMap: { [key: string]: keyof MetricsData } = {
          'Total de Mãos': 'totalHands',
          'Total de Ganhos': 'totalWinnings',
          'Pot Médio': 'avgPot',
          'Taxa de Vitória': 'winRate',
          'Balanço Final': 'totalWinnings'
        }
        const comparison = getComparison(card.value, fieldMap[card.title])
        
        return (
          <Card key={index} className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {isLoading ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ) : (
                  <>
                    <div className={`text-2xl font-bold ${card.color}`}>
                      {formatValue(card.value, card.format)}
                    </div>
                    
                    {/* Comparison with previous period */}
                    {comparison && (
                      <div className="flex items-center space-x-1">
                        {comparison.isPositive && (
                          <>
                            <ArrowUp className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">
                              +{comparison.percentageChange.toFixed(1)}%
                            </span>
                          </>
                        )}
                        {comparison.isNegative && (
                          <>
                            <ArrowDown className="h-3 w-3 text-red-600" />
                            <span className="text-xs text-red-600 font-medium">
                              -{comparison.percentageChange.toFixed(1)}%
                            </span>
                          </>
                        )}
                        {comparison.isNeutral && (
                          <>
                            <Minus className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-500 font-medium">
                              0%
                            </span>
                          </>
                        )}
                        <span className="text-xs text-gray-500">
                          vs período anterior
                        </span>
                      </div>
                    )}
                  </>
                )}
                

              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export default MetricsCards