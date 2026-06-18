/**
 * downloadCsvFile — dispara o download de um arquivo CSV no navegador (Blob + anchor click).
 * Client-side puro (DOM); centraliza o mecanismo de download já usado pelos dropdowns de export do
 * módulo, evitando duplicação divergente (FR-006). Não lança; é um efeito de UI idempotente.
 */
export function downloadCsvFile(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
