import { useState } from 'react'
import { Calendar, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDashboardStore, DatePreset } from '@/stores/dashboardStore'
import { cn } from '@/lib/utils'

interface DateRangeSelectorProps {
  onClose: () => void
}

const DateRangeSelector = ({ onClose }: DateRangeSelectorProps) => {
  const { dateRange, setDateRange } = useDashboardStore()
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  const presetOptions = [
    { value: 'current_week' as DatePreset, label: 'Semana Atual' },
    { value: 'today' as DatePreset, label: 'Hoje' },
    { value: 'last_week' as DatePreset, label: 'Última Semana' },
    { value: 'last_30_days' as DatePreset, label: 'Últimos 30 dias' },
    { value: 'all_time' as DatePreset, label: 'Todos os Registros' },
    { value: 'custom' as DatePreset, label: 'Período Personalizado' }
  ]

  const handlePresetSelect = (preset: DatePreset) => {
    if (preset === 'custom') {
      setDateRange({
        startDate: null,
        endDate: null,
        preset: 'custom'
      })
    } else {
      setDateRange({
        startDate: null,
        endDate: null,
        preset
      })
      onClose()
    }
  }

  const handleCustomDateApply = () => {
    if (customStartDate && customEndDate) {
      setDateRange({
        startDate: customStartDate,
        endDate: customEndDate,
        preset: 'custom'
      })
      onClose()
    }
  }

  const isCustomSelected = dateRange.preset === 'custom'

  return (
    <Card className="w-80 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Calendar size={20} />
          <span>Selecionar Período</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Preset Options */}
        <div className="space-y-2">
          {presetOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handlePresetSelect(option.value)}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-200 text-left",
                dateRange.preset === option.value
                  ? "border-bpd-primary bg-bpd-primary/5 text-bpd-primary"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              )}
            >
              <span className="font-medium">{option.label}</span>
              {dateRange.preset === option.value && (
                <Check size={16} className="text-bpd-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Custom Date Range */}
        {isCustomSelected && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="space-y-2">
              <Label htmlFor="start-date">Data Inicial</Label>
              <Input
                id="start-date"
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end-date">Data Final</Label>
              <Input
                id="end-date"
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                min={customStartDate}
                className="w-full"
              />
            </div>
            
            <div className="flex space-x-2 pt-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCustomDateApply}
                disabled={!customStartDate || !customEndDate}
                className="flex-1 bg-bpd-primary hover:bg-bpd-primary/90"
              >
                Aplicar
              </Button>
            </div>
          </div>
        )}

        {/* Close button for non-custom selections */}
        {!isCustomSelected && (
          <div className="pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full"
            >
              Fechar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default DateRangeSelector