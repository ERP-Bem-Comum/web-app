/**
 * Download do CSV — único ponto do módulo que toca o DOM para baixar o arquivo (antes: 7 cópias idênticas nas
 * pages/views, todas sem BOM).
 *
 * O **BOM UTF-8** é o motivo de isto existir: sem ele o Excel no Windows abre o arquivo na codepage ANSI e
 * todo acento quebra — "Plano Orçamentário" vira "Plano OrÃ§amentÃ¡rio". Todo cabeçalho do módulo tem acento.
 * Auditoria de 2026-08-10.
 */
import { CSV_BOM } from '../csv.view-model.ts'

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([CSV_BOM, csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
