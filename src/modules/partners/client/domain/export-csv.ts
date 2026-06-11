/**
 * Helpers de exportação CSV (PUROS, client-domain) — usados pelos dropdowns de export dos grids de
 * Parceiros. `buildCsv` monta o conteúdo (separador `;`, aspas escapadas); `csvFileStamp` gera o sufixo
 * de data do nome do arquivo (fora de component/page → não fere C1).
 */
export function buildCsv(
  headers: readonly string[],
  rows: readonly (readonly string[])[],
): string {
  const esc = (cell: string): string => `"${cell.replace(/"/g, '""')}"`
  const line = (cells: readonly string[]): string => cells.map(esc).join(';')
  return [line(headers), ...rows.map(line)].join('\n')
}

export function csvFileStamp(): string {
  const d = new Date()
  const p = (n: number): string => String(n).padStart(2, '0')
  return `${String(d.getFullYear())}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`
}

/** Cabeçalhos do template de importação de colaboradores (ordem fixa = a esperada pelo import). */
export const COLLABORATOR_IMPORT_HEADERS: readonly string[] = [
  'name',
  'email',
  'cpf',
  'occupationArea',
  'role',
  'startOfContract',
  'employmentRelationship',
]
