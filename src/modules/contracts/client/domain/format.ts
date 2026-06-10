// Padroniza o número do contrato para "CT 0001/2026" (contrato) / "OS 0001/2026" (ordem de serviço):
// prefixo por classificação + sequencial com 4 dígitos + ano. Reconhece tanto o formato legado com
// hífen (`CT-2026-0001`) quanto o formato do backend atual (`941/2026`). O prefixo CT/OS depende da
// classificação — que o backend ainda NÃO persiste (gap, ver ticket CTR-NUMBER-PROGRAM): por ora vem
// sempre 'Contrato' → CT. Quando o backend devolver a classificação, o prefixo passa a refletir OS.
export function formatContractNumber(code: string, classification?: string): string {
  const isServiceOrder =
    classification === 'Ordem de Serviço' || classification === 'ServiceOrder' || classification === 'OS'

  const dashed = /(CT|OS|CNT|C|A)-(\d{4})-(\d{4})/.exec(code)
  if (dashed) {
    const [, kind = '', year = '', seq = ''] = dashed
    const prefix =
      kind === 'CNT' || kind === 'C' ? 'CT' : kind === 'A' ? 'OS' : kind
    return `${prefix} ${seq.padStart(4, '0')}/${year}`
  }

  // Formato do backend atual: "NNN/AAAA" (ou "NNNN/AAAA").
  const slashed = /^(\d{1,5})\/(\d{4})$/.exec(code.trim())
  if (slashed) {
    const [, seq = '', year = ''] = slashed
    return `${isServiceOrder ? 'OS' : 'CT'} ${seq.padStart(4, '0')}/${year}`
  }

  return code
}

/**
 * Iniciais do contratado para o avatar do grid: primeira + segunda inicial do nome (não a última).
 * Nome de uma só palavra → as duas primeiras letras dela. Vazio → ''.
 */
export function contractorInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const first = words[0]
  if (first === undefined) return ''
  if (words.length === 1) return first.slice(0, 2).toUpperCase()
  const second = words[1] ?? first
  return ((first[0] ?? '') + (second[0] ?? '')).toUpperCase()
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

// Formata uma string de data (YYYY-MM-DD) para exibição, com fallback "—" para vazio/inválido.
// Vive no domínio (helper puro) para as views burras não instanciarem `new Date(` no render (C1).
export function formatDateOrDash(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}
