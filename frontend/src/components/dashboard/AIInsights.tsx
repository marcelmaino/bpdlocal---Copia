import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Brain, TrendingUp, AlertTriangle, Lightbulb, ChevronRight, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useDashboardStore } from '@/stores/dashboardStore'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import axios from 'axios'

interface AIInsight {
  type: 'performance' | 'recommendation' | 'prediction' | 'alert'
  title: string
  description: string
  value?: string
  trend?: 'up' | 'down' | 'stable'
  confidence: number
}

interface AIInsightsData {
  insights: AIInsight[]
  summary: string
}

const AIInsights = () => {
  const [expanded, setExpanded] = useState(false)
  const { getDateRangeForAPI, currency, filters } = useDashboardStore()
  const { user } = useAuthStore()

  const { data: aiData, isLoading, error } = useQuery<AIInsightsData>({
    queryKey: ['ai-insights', getDateRangeForAPI(), currency, filters, user?.id],
    queryFn: async () => {
      // Simulated AI insights - In real implementation, this would call an AI service
      const dateRange = getDateRangeForAPI()
      
      // Mock data for demonstration
      const mockInsights: AIInsight[] = [
        {
          type: 'performance',
          title: 'Melhor Performance',
          description: 'Seu melhor desempenho foi no clube "Royal Flush" com 23% mais ganhos que a média.',
          value: '+23%',
          trend: 'up',
          confidence: 87
        },
        {
          type: 'recommendation',
          title: 'Padrão Temporal',
          description: 'Você tem 15% mais ganhos às quartas-feiras. Considere aumentar o volume neste dia.',
          value: '+15%',
          trend: 'up',
          confidence: 92
        },
        {
          type: 'prediction',
          title: 'Projeção 7 dias',
          description: 'Com base no padrão atual, projeção de ganhos para os próximos 7 dias.',
          value: 'R$ 2.450',
          trend: 'up',
          confidence: 78
        },
        {
          type: 'alert',
          title: 'Variação Significativa',
          description: 'Sua taxa de vitória aumentou 8% este mês comparado ao anterior.',
          value: '+8%',
          trend: 'up',
          confidence: 95
        }
      ]

      return {
        insights: mockInsights,
        summary: 'Análise geral mostra tendência positiva com oportunidades de otimização em dias específicos da semana.'
      }
    },
    enabled: !!user,
    refetchOnWindowFocus: false,
    staleTime: 300000 // 5 minutes
  })

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'performance':
        return TrendingUp
      case 'recommendation':
        return Lightbulb
      case 'prediction':
        return Sparkles
      case 'alert':
        return AlertTriangle
      default:
        return Brain
    }
  }

  const getInsightColor = (type: AIInsight['type']) => {
    switch (type) {
      case 'performance':
        return 'text-blue-600 bg-blue-50'
      case 'recommendation':
        return 'text-green-600 bg-green-50'
      case 'prediction':
        return 'text-purple-600 bg-purple-50'
      case 'alert':
        return 'text-orange-600 bg-orange-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getTrendIcon = (trend?: string) => {
    if (trend === 'up') return '↗️'
    if (trend === 'down') return '↘️'
    return '➡️'
  }

  if (error) {
    return (
      <Card className="border-orange-200">
        <CardContent className="p-6">
          <div className="text-center text-orange-600">
            <AlertTriangle className="mx-auto mb-2" size={24} />
            <p className="text-sm">Análise de IA temporariamente indisponível</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Análise de Performance com IA</h3>
              <p className="text-sm text-gray-600">Insights automáticos baseados nos seus dados</p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center space-x-1"
          >
            <span className="text-sm">{expanded ? 'Menos' : 'Mais'}</span>
            <ChevronRight 
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                expanded && "rotate-90"
              )} 
            />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="p-4 bg-white/70 rounded-lg border border-purple-100">
              <p className="text-sm text-gray-700 leading-relaxed">
                {aiData?.summary}
              </p>
            </div>

            {/* Insights Grid */}
            <div className={cn(
              "grid gap-4 transition-all duration-300",
              expanded ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
            )}>
              {(expanded ? aiData?.insights : aiData?.insights.slice(0, 4))?.map((insight, index) => {
                const Icon = getInsightIcon(insight.type)
                const colorClasses = getInsightColor(insight.type)
                
                return (
                  <div
                    key={index}
                    className="p-4 bg-white/80 rounded-lg border border-gray-100 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${colorClasses}`}>
                        <Icon size={16} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-gray-800 truncate">
                            {insight.title}
                          </h4>
                          {insight.value && (
                            <span className="text-sm font-semibold text-gray-700 flex items-center">
                              {getTrendIcon(insight.trend)} {insight.value}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {insight.description}
                        </p>
                        
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                                style={{ width: `${insight.confidence}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">
                              {insight.confidence}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AIInsights