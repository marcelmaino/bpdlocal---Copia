import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, PieChart as PieChartIcon, BarChart3, Trophy } from 'lucide-react'
import { useDashboardStore } from '@/stores/dashboardStore'
import { useAuthStore } from '@/stores/authStore'
import { formatNumber, formatCurrency } from '@/lib/utils'
import axios from 'axios'

interface ClubData {
  club: string
  hands: number
  wins: number
  winRate: number
  totalGains: number
  averageGain: number
  color: string
}

interface HandsByClubResponse {
  data: ClubData[]
  totals: {
    totalHands: number
    totalWins: number
    overallWinRate: number
    totalGains: number
  }
}

const CLUB_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
]

const HandsByClubChart = () => {
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar')
  const [metric, setMetric] = useState<'hands' | 'gains'>('hands')
  const { getDateRangeForAPI, currency, filters } = useDashboardStore()
  const { user } = useAuthStore()

  const { data: chartData, isLoading, error } = useQuery<HandsByClubResponse>({
    queryKey: ['hands-by-club', getDateRangeForAPI(), currency, filters, user?.id],
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

      // Process data to group by club
      const clubStats = new Map<string, { hands: number, wins: number, totalGains: number }>()
      
      rawData.forEach((row: any) => {
        const club = row.club || 'Sem Clube'
        const hands = parseInt(row.hands) || 0
        const gains = parseFloat(row.realWins) || 0
        const wins = gains > 0 ? 1 : 0
        
        if (clubStats.has(club)) {
          const existing = clubStats.get(club)!
          clubStats.set(club, {
            hands: existing.hands + hands,
            wins: existing.wins + wins,
            totalGains: existing.totalGains + gains
          })
        } else {
          clubStats.set(club, { hands, wins, totalGains: gains })
        }
      })

      // Convert to array and calculate metrics
      const clubData: ClubData[] = Array.from(clubStats.entries()).map(([club, stats], index) => ({
        club,
        hands: stats.hands,
        wins: stats.wins,
        winRate: stats.hands > 0 ? (stats.wins / stats.hands) * 100 : 0,
        totalGains: stats.totalGains,
        averageGain: stats.hands > 0 ? stats.totalGains / stats.hands : 0,
        color: CLUB_COLORS[index % CLUB_COLORS.length]
      })).sort((a, b) => b.hands - a.hands)

      const totals = {
        totalHands: clubData.reduce((sum, club) => sum + club.hands, 0),
        totalWins: clubData.reduce((sum, club) => sum + club.wins, 0),
        overallWinRate: 0,
        totalGains: clubData.reduce((sum, club) => sum + club.totalGains, 0)
      }
      
      totals.overallWinRate = totals.totalHands > 0 ? (totals.totalWins / totals.totalHands) * 100 : 0

      return { data: clubData, totals }
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
          <p className="font-medium text-gray-800 mb-2">{data.club}</p>
          <div className="space-y-1 text-sm">
            <p className="text-blue-600">
              Mãos: {formatNumber(data.hands)}
            </p>
            <p className="text-green-600">
              Vitórias: {formatNumber(data.wins)} ({data.winRate.toFixed(1)}%)
            </p>
            <p className="text-purple-600">
              Ganhos: {formatCurrency(data.totalGains, currency === 'BOTH' ? 'BRL' : currency)}
            </p>
            <p className="text-gray-600">
              Média/Mão: {formatCurrency(data.averageGain, currency === 'BOTH' ? 'BRL' : currency)}
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-800">{data.club}</p>
          <p className="text-sm text-gray-600">
            {metric === 'hands' 
              ? `${formatNumber(data.hands)} mãos`
              : formatCurrency(data.totalGains, currency === 'BOTH' ? 'BRL' : currency)
            }
          </p>
          <p className="text-xs text-gray-500">
            {((data[metric] / chartData?.totals[metric === 'hands' ? 'totalHands' : 'totalGains']!) * 100).toFixed(1)}% do total
          </p>
        </div>
      )
    }
    return null
  }

  const getBestPerformingClub = () => {
    if (!chartData?.data || chartData.data.length === 0) return null
    return chartData.data.reduce((best, current) => 
      current.winRate > best.winRate ? current : best
    )
  }

  const bestClub = getBestPerformingClub()

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
            <Building2 className="h-5 w-5 text-blue-600" />
            <span>Distribuição por Clube</span>
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
        </div>
        
        {/* Summary Stats */}
        {chartData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Total de Clubes</span>
              </div>
              <p className="text-lg font-bold text-blue-700 mt-1">
                {chartData.data.length}
              </p>
            </div>
            
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-800">Total de Mãos</span>
              </div>
              <p className="text-lg font-bold text-green-700 mt-1">
                {formatNumber(chartData.totals.totalHands)}
              </p>
            </div>
            
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-medium text-purple-800">Taxa Geral</span>
              </div>
              <p className="text-lg font-bold text-purple-700 mt-1">
                {chartData.totals.overallWinRate.toFixed(1)}%
              </p>
            </div>
            
            {bestClub && (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Melhor Clube</span>
                </div>
                <p className="text-sm font-bold text-yellow-700 mt-1 truncate">
                  {bestClub.club}
                </p>
                <p className="text-xs text-yellow-600">
                  {bestClub.winRate.toFixed(1)}% vitórias
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
              {chartType === 'bar' ? (
                <BarChart 
                  data={chartData?.data} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="club" 
                    stroke="#6B7280"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis 
                    stroke="#6B7280"
                    fontSize={12}
                    tickFormatter={(value) => 
                      metric === 'hands' 
                        ? formatNumber(value, true)
                        : formatCurrency(value, currency === 'BOTH' ? 'BRL' : currency, true)
                    }
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey={metric === 'hands' ? 'hands' : 'totalGains'}
                    fill={(entry: any, index: number) => chartData?.data[index]?.color || '#3B82F6'}
                    radius={[4, 4, 0, 0]}
                  >
                    {chartData?.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <PieChart width={400} height={300}>
                    <Pie
                      data={chartData?.data}
                      cx={200}
                      cy={150}
                      outerRadius={100}
                      innerRadius={40}
                      paddingAngle={2}
                      dataKey={metric === 'hands' ? 'hands' : 'totalGains'}
                      label={({ club, percent }) => 
                        `${club.split(' ')[0]} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {chartData?.data.map((entry, index) => (
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

export default HandsByClubChart