import { format, isValid, parse, parseISO } from 'date-fns'

export function getYears(actual = true as boolean) {
  const date = new Date()
  const list = []
  for (let i = 2019; i <= (actual ? date.getFullYear() : date.getFullYear() - 1); i++) {
    list.push(i)
  }
  return list
}

export type IMonth = {
  id: number
  name: string
}
export function getMonths() {
  return [
    { id: 1, name: 'Janeiro' },
    { id: 2, name: 'Fevereiro' },
    { id: 3, name: 'Março' },
    { id: 4, name: 'Abril' },
    { id: 5, name: 'Maio' },
    { id: 6, name: 'Junho' },
    { id: 7, name: 'Julho' },
    { id: 8, name: 'Agosto' },
    { id: 9, name: 'Setembro' },
    { id: 10, name: 'Outubro' },
    { id: 11, name: 'Novembro' },
    { id: 12, name: 'Dezembro' },
  ] as IMonth[]
}

export const handleDates = (date: Date | undefined | null | string): Date | undefined => {
  if (!date) return undefined

  if (typeof date === 'string') {
    // Se a string está no formato ISO (com timezone), extrair apenas a parte da data
    // e criar uma data local para evitar problemas de timezone
    if (date.includes('T')) {
      // Formato ISO: "2025-12-29T00:00:00.000Z" ou "2025-12-29T00:00:00"
      const dateOnly = date.split('T')[0] // Pega apenas "2025-12-29"
      const [year, month, day] = dateOnly.split('-').map(Number)
      // Criar data local (sem timezone) para evitar subtração de dias
      return new Date(year, month - 1, day)
    } else {
      // Se for formato simples como "2025-12-29", criar data local
      const parts = date.split('-')
      if (parts.length === 3) {
        const [year, month, day] = parts.map(Number)
        return new Date(year, month - 1, day)
      }
      // Fallback para parseISO
      return parseISO(date)
    }
  }

  return isValid(date) ? date : undefined
}

export const formatDate = (date: Date | undefined | null | string) => {
  const parsedDate = handleDates(date)
  if (parsedDate) {
    return format(parsedDate, 'dd/MM/yyyy')
  }
  return ''
}

export const getMonthName = (month: number): string => {
  const monthNames = [
    'JAN',
    'FER',
    'MAR',
    'ABR',
    'MAR',
    'JUN',
    'JUL',
    'AGO',
    'SET',
    'OUT',
    'NOV',
    'DEZ',
  ]
  return monthNames[month - 1]
}
