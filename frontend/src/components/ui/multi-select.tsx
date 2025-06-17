import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface MultiSelectProps {
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  isLoading?: boolean
  maxDisplay?: number
}

const MultiSelect = ({
  options,
  selected,
  onChange,
  placeholder = "Selecionar opções",
  isLoading = false,
  maxDisplay = 2
}: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleToggleOption = (option: string) => {
    const newSelected = selected.includes(option)
      ? selected.filter(item => item !== option)
      : [...selected, option]
    
    onChange(newSelected)
  }

  const handleRemoveOption = (option: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(selected.filter(item => item !== option))
  }

  const getDisplayText = () => {
    if (selected.length === 0) {
      return placeholder
    }
    
    if (selected.length <= maxDisplay) {
      return selected.join(', ')
    }
    
    return `${selected.slice(0, maxDisplay).join(', ')} +${selected.length - maxDisplay}`
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <Button
        ref={buttonRef}
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full justify-between text-left font-normal",
          selected.length === 0 && "text-muted-foreground"
        )}
        disabled={isLoading}
      >
        <span className="truncate">{getDisplayText()}</span>
        <ChevronDown className={cn(
          "ml-2 h-4 w-4 shrink-0 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </Button>

      {/* Selected Items Display */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selected.slice(0, 3).map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
            >
              <span className="truncate max-w-[100px]">{item}</span>
              <button
                onClick={(e) => handleRemoveOption(item, e)}
                className="hover:bg-blue-200 rounded-full p-0.5"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {selected.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
              +{selected.length - 3} mais
            </span>
          )}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-hidden"
        >
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <Input
              placeholder="Pesquisar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8"
            />
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm">Carregando...</p>
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p className="text-sm">
                  {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhuma opção disponível'}
                </p>
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selected.includes(option)
                return (
                  <button
                    key={option}
                    onClick={() => handleToggleOption(option)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition-colors",
                      isSelected && "bg-blue-50 text-blue-700"
                    )}
                  >
                    <span className="truncate">{option}</span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                  </button>
                )
              })
            )}
          </div>

          {/* Footer */}
          {selected.length > 0 && (
            <div className="p-2 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => onChange([])}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Limpar seleção ({selected.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MultiSelect