export function formatContractNumber(code: string): string {
  const match = /(CT|OS|CNT|C|A)-(\d{4})-(\d{4})/.exec(code)
  if (match) {
    const [, kind = '', year = '', seq = ''] = match
    const prefix =
      kind === 'CNT' || kind === 'C'
        ? 'CT'
        : kind === 'A'
          ? 'OS'
          : kind
    return `${prefix} ${seq}/${year}`
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
  // Datas de contrato são YYYY-MM-DD (meia-noite UTC); formatar em UTC evita recuar 1 dia em BRT.
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}
