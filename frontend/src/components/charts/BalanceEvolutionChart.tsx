import { useQuery } from '@tanstack/react-query'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, Calendar } from 'lucide-react'
import { useDashboardStore } from '@/stores/dashboardStore'
import { useAuthStore } from '@/stores/authStore'
import { formatCurrency } from '@/lib/utils'
import { useState } from 'react'
import axios from 'axios'

interface BalancePoint {
  date: string
  balance: number
  cumulativeBalance: number
  hands: number
}

interface BalanceEvolutionData {
  data: BalancePoint[]
  totalGrowth: number
  bestDay: BalancePoint
  worstDay: BalancePoint
}

const BalanceEvolutionChart = () => {
  const [chartType, setChartType] = useState<'line' | 'area'>('area')
  const { getDateRangeForAPI, currency, filters } = useDashboardStore()
  const { user } = useAuthStore()

  const { data: chartData, isLoading, error } = useQuery<BalanceEvolutionData>({
    queryKey: ['balance-evolution', getDateRangeForAPI(), currency, filters, user?.id],
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

      // Process data to create balance evolution
      const dailyBalances = new Map<string, { balance: number, hands: number }>()
      
      rawData.forEach((row: any) => {
        const date = row.dia
        const balance = parseFloat(row.realWins) || 0
        const hands = parseInt(row.hands) || 0
        
        if (dailyBalances.has(date)) {
          const existing = dailyBalances.get(date)!
          dailyBalances.set(date, {
            balance: existing.balance + balance,
            hands: existing.hands + hands
          })
        } else {
          dailyBalances.set(date, { balance, hands })
        }
      })

      // Convert to array and sort by date
      const sortedDates = Array.from(dailyBalances.keys()).sort()
      const mockData: BalancePoint[] = []
      let cumulativeBalance = 0
      
      sortedDates.forEach(date => {
        const dayData = dailyBalances.get(date)!
        cumulativeBalance += dayData.balance
        
        mockData.push({
          date,
          balance: dayData.balance,
          cumulativeBalance,
          hands: dayData.hands
        })
      })
      
      const sortedByBalance = [...mockData].sort((a, b) => b.balance - a.balance)
      
      return {
        data: mockData,
        totalGrowth: cumulativeBalance,
        bestDay: sortedByBalance.length > 0 ? sortedByBalance[0] : null,
        worstDay: sortedByBalance.length > 0 ? sortedByBalance[sortedByBalance.length - 1] : null
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
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-800">
            {new Date(label).toLocaleDateString('pt-BR')}
          </p>
          <p className="text-sm text-blue-600">
            Saldo do Dia: {formatCurrency(data.balance, currency === 'BOTH' ? 'BRL' : currency)}
          </p>
          <p className="text-sm text-green-600">
            Saldo Acumulado: {formatCurrency(data.cumulativeBalance, currency === 'BOTH' ? 'BRL' : currency)}
          </p>
          <p className="text-sm text-gray-600">
            Mãos Jogadas: {data.hands}
          </p>
        </div>
      )
    }
    return null
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
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <span>Evolução do Saldo</span>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={chartType === 'area' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('area')}
            >
              Área
            </Button>
            <Button
              variant={chartType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('line')}
            >
              Linha
            </Button>
          </div>
        </div>
        
        {/* Stats */}
        {chartData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Crescimento Total</span>
              </div>
              <p className="text-lg font-bold text-green-700 mt-1">
                {formatCurrency(chartData.totalGrowth || 0, currency === 'BOTH' ? 'BRL' : currency)}
              </p>
            </div>
            
            {chartData.bestDay && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Melhor Dia</span>
                </div>
                <p className="text-lg font-bold text-blue-700 mt-1">
                  {formatCurrency(chartData.bestDay.balance || 0, currency === 'BOTH' ? 'BRL' : currency)}
                </p>
                <p className="text-xs text-blue-600">
                  {new Date(chartData.bestDay.date).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
            
            {chartData.worstDay && (
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">Pior Dia</span>
                </div>
                <p className="text-lg font-bold text-red-700 mt-1">
                  {formatCurrency(chartData.worstDay.balance || 0, currency === 'BOTH' ? 'BRL' : currency)}
                </p>
                <p className="text-xs text-red-600">
                  {new Date(chartData.worstDay.date).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
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
              {chartType === 'area' ? (
                <AreaChart data={chartData?.data}>
                  <defs>
                    <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6B7280"
                    fontSize={12}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis 
                    stroke="#6B7280"
                    fontSize={12}
                    tickFormatter={(value) => formatCurrency(value, currency === 'BOTH' ? 'BRL' : currency, true)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="cumulativeBalance"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fill="url(#balanceGradient)"
                  />
                </AreaChart>
              ) : (
                <LineChart data={chartData?.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6B7280"
                    fontSize={12}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis 
                    stroke="#6B7280"
                    fontSize={12}
                    tickFormatter={(value) => formatCurrency(value, currency === 'BOTH' ? 'BRL' : currency, true)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="cumulativeBalance"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default BalanceEvolutionChart