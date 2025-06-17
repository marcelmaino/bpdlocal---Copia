import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, TrendingUp, Clock, BarChart3, Activity } from 'lucide-react'
import { useDashboardStore } from '@/stores/dashboardStore'
import { useAuthStore } from '@/stores/authStore'
import { formatNumber, formatCurrency } from '@/lib/utils'
import { useState } from 'react'
import axios from 'axios'

interface DayVolumeData {
  day: string
  dayName: string
  hands: number
  sessions: number
  averageSessionLength: number // in minutes
  totalGains: number
  averageGainPerHand: number
  peakHour: number // 0-23
}

interface VolumeByDayResponse {
  data: DayVolumeData[]
  insights: {
    bestDay: DayVolumeData
    mostActiveDay: DayVolumeData
    averageSessionsPerDay: number
    totalWeeklyHands: number
    recommendedDays: string[]
  }
}

const DAYS_PT = {
  'Monday': 'Segunda',
  'Tuesday': 'Terça',
  'Wednesday': 'Quarta',
  'Thursday': 'Quinta',
  'Friday': 'Sexta',
  'Saturday': 'Sábado',
  'Sunday': 'Domingo'
}

const VolumeByDayChart = () => {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar')
  const [metric, setMetric] = useState<'hands' | 'sessions' | 'gains'>('hands')
  const { getDateRangeForAPI, currency, filters } = useDashboardStore()
  const { user } = useAuthStore()

  const { data: chartData, isLoading, error } = useQuery<VolumeByDayResponse>({
    queryKey: ['volume-by-day', getDateRangeForAPI(), currency, filters, user?.id],
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

      // Process data to group by day of week
      const dayStats = new Map<string, { hands: number, sessions: number, totalGains: number, sessionLengths: number[] }>()
      
      rawData.forEach((row: any) => {
        const date = new Date(row.dia)
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' })
        
        const hands = parseInt(row.hands) || 0
        const gains = parseFloat(row.realWins) || 0
        const sessionLength = parseInt(row.sessionLength) || 60 // default 60 minutes
        
        if (dayStats.has(dayOfWeek)) {
          const existing = dayStats.get(dayOfWeek)!
          dayStats.set(dayOfWeek, {
            hands: existing.hands + hands,
            sessions: existing.sessions + 1,
            totalGains: existing.totalGains + gains,
            sessionLengths: [...existing.sessionLengths, sessionLength]
          })
        } else {
          dayStats.set(dayOfWeek, {
            hands,
            sessions: 1,
            totalGains: gains,
            sessionLengths: [sessionLength]
          })
        }
      })

      // Convert to array format
      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      const mockData: DayVolumeData[] = daysOfWeek.map(day => {
        const stats = dayStats.get(day) || { hands: 0, sessions: 0, totalGains: 0, sessionLengths: [] }
        const avgSessionLength = stats.sessionLengths.length > 0 
          ? stats.sessionLengths.reduce((sum, len) => sum + len, 0) / stats.sessionLengths.length 
          : 0
        
        return {
          day,
          dayName: DAYS_PT[day as keyof typeof DAYS_PT],
          hands: stats.hands,
          sessions: stats.sessions,
          averageSessionLength: Math.round(avgSessionLength),
          totalGains: stats.totalGains,
          averageGainPerHand: stats.hands > 0 ? stats.totalGains / stats.hands : 0,
          peakHour: 20 // Default peak hour
        }
      })
      
      // Calculate insights
      const bestDay = mockData.reduce((best, current) => 
        current.totalGains > best.totalGains ? current : best
      )
      
      const mostActiveDay = mockData.reduce((most, current) => 
        current.hands > most.hands ? current : most
      )
      
      const averageSessionsPerDay = mockData.reduce((sum, day) => sum + day.sessions, 0) / mockData.length
      const totalWeeklyHands = mockData.reduce((sum, day) => sum + day.hands, 0)
      
      // Recommend top 3 days by performance
      const recommendedDays = [...mockData]
        .sort((a, b) => b.averageGainPerHand - a.averageGainPerHand)
        .slice(0, 3)
        .map(day => day.dayName)
      
      return {
        data: mockData,
        insights: {
          bestDay,
          mostActiveDay,
          averageSessionsPerDay,
          totalWeeklyHands,
          recommendedDays
        }
      }
    },
    enabled: !!user,
    refetchOnWindowFocus: false,
    staleTime: 300000
  })

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg max-w-xs">
          <p className="font-medium text-gray-800 mb-2">{data.dayName}</p>
          <div className="space-y-1 text-sm">
            <p className="text-blue-600">
              Mãos: {formatNumber(data.hands)}
            </p>
            <p className="text-green-600">
              Sessões: {data.sessions}
            </p>
            <p className="text-purple-600">
              Duração Média: {data.averageSessionLength}min
            </p>
            <p className="text-orange-600">
              Ganhos: {formatCurrency(data.totalGains, currency === 'BOTH' ? 'BRL' : currency)}
            </p>
            <p className="text-gray-600">
              Pico: {data.peakHour}:00
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  const getMetricValue = (data: DayVolumeData) => {
    switch (metric) {
      case 'hands': return data.hands
      case 'sessions': return data.sessions
      case 'gains': return data.totalGains
      default: return data.hands
    }
  }

  const getMetricLabel = () => {
    switch (metric) {
      case 'hands': return 'Mãos'
      case 'sessions': return 'Sessões'
      case 'gains': return 'Ganhos'
      default: return 'Mãos'
    }
  }

  const formatMetricValue = (value: number) => {
    if (metric === 'gains') {
      return formatCurrency(value, currency === 'BOTH' ? 'BRL' : currency, true)
    }
    return formatNumber(value, true)
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Erro ao carregar dados do gráfico</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            <span>Volume por Dia da Semana</span>
          </CardTitle>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <div className="flex items-center space-x-2">
              <Button
                variant={metric === 'hands' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMetric('hands')}
              >
                Mãos
              </Button>
              <Button
                variant={metric === 'sessions' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMetric('sessions')}
              >
                Sessões
              </Button>
              <Button
                variant={metric === 'gains' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMetric('gains')}
              >
                Ganhos
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant={chartType === 'bar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('bar')}
                className="flex items-center space-x-1"
              >
                <BarChart3 size={16} />
              </Button>
              <Button
                variant={chartType === 'line' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('line')}
                className="flex items-center space-x-1"
              >
                <TrendingUp size={16} />
              </Button>
              <Button
                variant={chartType === 'area' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('area')}
                className="flex items-center space-x-1"
              >
                <Activity size={16} />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Insights */}
        {chartData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Melhor Dia</span>
              </div>
              <p className="text-lg font-bold text-green-700 mt-1">
                {chartData.insights.bestDay.dayName}
              </p>
              <p className="text-xs text-green-600">
                {formatCurrency(chartData.insights.bestDay.totalGains, currency === 'BOTH' ? 'BRL' : currency)}
              </p>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Mais Ativo</span>
              </div>
              <p className="text-lg font-bold text-blue-700 mt-1">
                {chartData.insights.mostActiveDay.dayName}
              </p>
              <p className="text-xs text-blue-600">
                {formatNumber(chartData.insights.mostActiveDay.hands)} mãos
              </p>
            </div>
            
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">Sessões/Dia</span>
              </div>
              <p className="text-lg font-bold text-purple-700 mt-1">
                {chartData.insights.averageSessionsPerDay.toFixed(1)}
              </p>
              <p className="text-xs text-purple-600">
                média semanal
              </p>
            </div>
            
            <div className="p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Recomendados</span>
              </div>
              <p className="text-sm font-bold text-orange-700 mt-1">
                {chartData.insights.recommendedDays.slice(0, 2).join(', ')}
              </p>
              <p className="text-xs text-orange-600">
                melhor performance
              </p>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="animate-pulse">
              <div className="h-80 bg-gray-200 rounded"></div>
            </div>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={chartData?.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="dayName" 
                    stroke="#6B7280"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#6B7280"
                    fontSize={12}
                    tickFormatter={formatMetricValue}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey={metric}
                    name={getMetricLabel()}
                    fill="#8B5CF6" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              ) : chartType === 'line' ? (
                <LineChart data={chartData?.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="dayName" 
                    stroke="#6B7280"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#6B7280"
                    fontSize={12}
                    tickFormatter={formatMetricValue}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey={metric}
                    stroke="#8B5CF6"
                    strokeWidth={3}
                    dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, stroke: '#8B5CF6', strokeWidth: 2 }}
                  />
                </LineChart>
              ) : (
                <AreaChart data={chartData?.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="dayName" 
                    stroke="#6B7280"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#6B7280"
                    fontSize={12}
                    tickFormatter={formatMetricValue}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey={metric}
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    fill="url(#volumeGradient)"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default VolumeByDayChart