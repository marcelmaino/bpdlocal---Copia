import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign, PieChart as PieChartIcon, BarChart3 } from 'lucide-react'
import { useDashboardStore } from '@/stores/dashboardStore'
import { useAuthStore } from '@/stores/authStore'
import { formatCurrency } from '@/lib/utils'
import { useState } from 'react'
import axios from 'axios'

interface GainsFeesData {
  period: string
  gains: number
  fees: number
  rakeback: number
  net: number
}

interface GainsFeesResponse {
  data: GainsFeesData[]
  totals: {
    totalGains: number
    totalFees: number
    totalRakeback: number
    netResult: number
  }
  pieData: {
    name: string
    value: number
    color: string
  }[]
}

const GainsVsFeesChart = () => {
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar')
  const { getDateRangeForAPI, currency, filters } = useDashboardStore()
  const { user } = useAuthStore()

  const { data: chartData, isLoading, error } = useQuery<GainsFeesResponse>({
    queryKey: ['gains-fees', getDateRangeForAPI(), currency, filters, user?.id],
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

      // Process data to create gains vs fees analysis
      const weeklyStats = new Map<string, { gains: number, fees: number, rakeback: number }>()
      
      rawData.forEach((row: any) => {
        const date = new Date(row.dia)
        const weekStart = new Date(date.setDate(date.getDate() - date.getDay()))
        const weekKey = `Sem ${Math.ceil(weekStart.getDate() / 7)}`
        
        const gains = parseFloat(row.realWins) || 0
        const fees = parseFloat(row.rake) || 0
        const rakeback = parseFloat(row.rakeback) || 0
        
        if (weeklyStats.has(weekKey)) {
          const existing = weeklyStats.get(weekKey)!
          weeklyStats.set(weekKey, {
            gains: existing.gains + gains,
            fees: existing.fees + fees,
            rakeback: existing.rakeback + rakeback
          })
        } else {
          weeklyStats.set(weekKey, { gains, fees, rakeback })
        }
      })

      // Convert to array format
      const mockData: GainsFeesData[] = Array.from(weeklyStats.entries()).map(([period, stats]) => ({
        period,
        gains: stats.gains,
        fees: stats.fees,
        rakeback: stats.rakeback,
        net: stats.gains - stats.fees + stats.rakeback
      }))
      
      const totals = mockData.reduce((acc, item) => ({
        totalGains: acc.totalGains + item.gains,
        totalFees: acc.totalFees + item.fees,
        totalRakeback: acc.totalRakeback + item.rakeback,
        netResult: acc.netResult + item.net
      }), {
        totalGains: 0,
        totalFees: 0,
        totalRakeback: 0,
        netResult: 0
      })
      
      const pieData = [
        {
          name: 'Ganhos Brutos',
          value: totals.totalGains,
          color: '#10B981'
        },
        {
          name: 'Taxas',
          value: totals.totalFees,
          color: '#EF4444'
        },
        {
          name: 'Rakeback',
          value: totals.totalRakeback,
          color: '#3B82F6'
        }
      ]
      
      return {
        data: mockData,
        totals,
        pieData
      }
    },
    enabled: !!user,
    refetchOnWindowFocus: false,
    staleTime: 300000
  })

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-800 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value, currency === 'BOTH' ? 'BRL' : currency)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-800">{data.name}</p>
          <p className="text-sm text-gray-600">
            {formatCurrency(data.value, currency === 'BOTH' ? 'BRL' : currency)}
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
            <DollarSign className="h-5 w-5 text-green-600" />
            <span>Ganhos vs Taxas</span>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={chartType === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('bar')}
              className="flex items-center space-x-1"
            >
              <BarChart3 size={16} />
              <span>Barras</span>
            </Button>
            <Button
              variant={chartType === 'pie' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('pie')}
              className="flex items-center space-x-1"
            >
              <PieChartIcon size={16} />
              <span>Pizza</span>
            </Button>
          </div>
        </div>
        
        {/* Summary Stats */}
        {chartData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-800">Ganhos Brutos</span>
              </div>
              <p className="text-lg font-bold text-green-700 mt-1">
                {formatCurrency(chartData.totals.totalGains, currency === 'BOTH' ? 'BRL' : currency)}
              </p>
            </div>
            
            <div className="p-3 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-red-800">Taxas</span>
              </div>
              <p className="text-lg font-bold text-red-700 mt-1">
                {formatCurrency(chartData.totals.totalFees, currency === 'BOTH' ? 'BRL' : currency)}
              </p>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-800">Rakeback</span>
              </div>
              <p className="text-lg font-bold text-blue-700 mt-1">
                {formatCurrency(chartData.totals.totalRakeback, currency === 'BOTH' ? 'BRL' : currency)}
              </p>
            </div>
            
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-medium text-purple-800">Resultado Líquido</span>
              </div>
              <p className={`text-lg font-bold mt-1 ${
                chartData.totals.netResult >= 0 ? 'text-green-700' : 'text-red-700'
              }`}>
                {formatCurrency(chartData.totals.netResult, currency === 'BOTH' ? 'BRL' : currency)}
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
                    dataKey="period" 
                    stroke="#6B7280"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#6B7280"
                    fontSize={12}
                    tickFormatter={(value) => formatCurrency(value, currency === 'BOTH' ? 'BRL' : currency, true)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="gains" 
                    name="Ganhos" 
                    fill="#10B981" 
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar 
                    dataKey="fees" 
                    name="Taxas" 
                    fill="#EF4444" 
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar 
                    dataKey="rakeback" 
                    name="Rakeback" 
                    fill="#3B82F6" 
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <PieChart width={400} height={300}>
                    <Pie
                      data={chartData?.pieData}
                      cx={200}
                      cy={150}
                      outerRadius={100}
                      innerRadius={40}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {chartData?.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </div>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default GainsVsFeesChart