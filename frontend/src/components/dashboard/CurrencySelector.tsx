import { DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDashboardStore, CurrencyType } from '@/stores/dashboardStore'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const CurrencySelector = () => {
  const { currency, setCurrency } = useDashboardStore()

  const currencyOptions = [
    { value: 'BRL' as CurrencyType, label: 'Real (R$)', symbol: 'R$' },
    { value: 'USD' as CurrencyType, label: 'Dólar (US$)', symbol: 'US$' },
    { value: 'BOTH' as CurrencyType, label: 'Ambas', symbol: 'R$/US$' }
  ]

  const currentOption = currencyOptions.find(option => option.value === currency)

  const handleCurrencyChange = (newCurrency: CurrencyType) => {
    setCurrency(newCurrency)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center space-x-2 min-w-[120px] justify-between"
        >
          <div className="flex items-center space-x-2">
            <DollarSign size={16} />
            <span className="text-sm">{currentOption?.symbol}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-48">
        {currencyOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleCurrencyChange(option.value)}
            className={cn(
              "flex items-center justify-between cursor-pointer",
              currency === option.value && "bg-bpd-primary/10 text-bpd-primary"
            )}
          >
            <span>{option.label}</span>
            {currency === option.value && (
              <div className="w-2 h-2 bg-bpd-primary rounded-full" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default CurrencySelector