import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
}

interface SelectTriggerProps {
  className?: string
  children: React.ReactNode
}

interface SelectContentProps {
  children: React.ReactNode
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
}

interface SelectValueProps {
  placeholder?: string
}

const SelectContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
} | null>(null)

const Select = ({ value, onValueChange, children }: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentValue, setCurrentValue] = useState(value)

  // Update internal state when prop changes
  React.useEffect(() => {
    setCurrentValue(value)
  }, [value])

  const handleValueChange = (newValue: string) => {
    setCurrentValue(newValue)
    onValueChange(newValue)
  }

  return (
    <SelectContext.Provider value={{ value: currentValue, onValueChange: handleValueChange, isOpen, setIsOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

const SelectTrigger = ({ className, children }: SelectTriggerProps) => {
  const context = React.useContext(SelectContext)
  const ref = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        context?.setIsOpen(false)
      }
    }

    if (context?.isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [context?.isOpen])

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onClick={() => context?.setIsOpen(!context.isOpen)}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  )
}

const SelectContent = ({ children }: SelectContentProps) => {
  const context = React.useContext(SelectContext)

  if (!context?.isOpen) return null

  return (
    <div className="absolute top-full left-0 z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
      {children}
    </div>
  )
}

const SelectItem = ({ value, children }: SelectItemProps) => {
  const context = React.useContext(SelectContext)

  return (
    <div
      className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 flex items-center"
      onClick={() => {
        context?.onValueChange(value)
        context?.setIsOpen(false)
      }}
    >
      {children}
    </div>
  )
}

const SelectValue = ({ placeholder }: SelectValueProps) => {
  const context = React.useContext(SelectContext)
  
  // Map values to display text for common cases
  const getDisplayText = () => {
    if (!context?.value) return placeholder
    
    // For pagination select, show formatted text
    if (['10', '25', '50', '100', '200'].includes(context.value)) {
      return `${context.value} por página`
    }
    
    return context.value
  }
  
  const displayValue = getDisplayText()
  
  return (
    <span className={cn(
      "block truncate",
      !context?.value && "text-gray-400"
    )}>
      {displayValue}
    </span>
  )
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }