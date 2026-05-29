/**
 * Função para validar e formatar valores monetários
 * Corrige problemas de números com muitos zeros vindos de importações do Excel
 */

export const formatCurrencyValue = (value: number | string | null | undefined): number => {
  if (value === null || value === undefined) return 0
  
  // Se for string, converte para número
  let numValue = typeof value === 'string' ? parseFloat(value) : value
  
  // Se não for um número válido, retorna 0
  if (isNaN(numValue)) return 0
  
  return numValue
}

/**
 * Função para formatar valor em centavos para exibição
 */
export const formatCentsToCurrency = (valueInCents: number | string | null | undefined): string => {
  const validValue = formatCurrencyValue(valueInCents)
  
  return (validValue / 100).toLocaleString('pt-br', {
    style: 'currency',
    currency: 'BRL',
  })
}

/**
 * Função para conversão precisa de centavos para reais
 * Evita problemas de ponto flutuante na divisão
 */
export const convertCentsToReais = (valueInCents: number | string | null | undefined): number => {
  const validValue = formatCurrencyValue(valueInCents)
  
  const valueInReais = Math.round(validValue) / 100
  
  return Math.round(valueInReais * 100) / 100
}

/**
 * Função para validar e formatar valores em centavos
 */
export const validateAndFormatCents = (valueInCents: number | string | null | undefined): number => {
  const validValue = formatCurrencyValue(valueInCents)
  return Math.round(validValue)
}
