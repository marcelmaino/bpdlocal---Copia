import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Função para formatar valores monetários
export function formatCurrency(value: number, currency: 'BRL' | 'USD' = 'BRL'): string {
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency === 'BRL' ? 'BRL' : 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  
  return formatter.format(value)
}

// Função para formatar números
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

// Função para formatar datas
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR').format(dateObj)
}

// Função para calcular balanço final
export function calculateFinalBalance(
  wins: number,
  fees: number,
  rakeback: number
): number {
  return wins - fees + rakeback
}

// Função para determinar cor baseada no valor (positivo/negativo)
export function getValueColor(value: number): string {
  if (value > 0) return 'text-green-600'
  if (value < 0) return 'text-red-600'
  return 'text-gray-600'
}

// Função para gerar senha padrão do jogador
export function generatePlayerPassword(playerName: string): string {
  if (!playerName || playerName.length < 4) {
    throw new Error('Nome do jogador deve ter pelo menos 4 caracteres')
  }
  
  const firstLetter = playerName.charAt(0).toUpperCase()
  const lastFourChars = playerName.slice(-4)
  
  return `${firstLetter}2025${lastFourChars}`
}