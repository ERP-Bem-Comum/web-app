export function formatContractNumber(code: string): string {
  const match = /(CT|OS|CNT|C|A)-(\d{4})-(\d{4})/.exec(code)
  if (match) {
    const prefix =
      match[1] === 'CNT' || match[1] === 'C'
        ? 'CT'
        : match[1] === 'A'
          ? 'OS'
          : match[1]
    return `${prefix} ${match[3]}/${match[2]}`
  }
  return code
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-BR')
}
