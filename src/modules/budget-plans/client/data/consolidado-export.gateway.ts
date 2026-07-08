/**
 * Gateway do export CSV do Consolidado ABC (client/data) — a PORTA do client para a server function. O CSV
 * chega PRONTO do BFF (gerado server-side, Decisão 11); aqui só repassamos `{ filename, content }`. Erros
 * como valores (§II, sem throw); o erro do servidor é colapsado numa tag client (a UI trata a mensagem).
 */
import { err, ok, type Result } from '#shared/primitives/result.ts'
import { exportConsolidadoAbcCsvFn } from '#modules/budget-plans/server/adapters/server-fns/export-consolidado-abc-csv.query.fn.ts'

export type ConsolidadoExportInput = Readonly<{ year: number; programs: readonly string[] }>
export type ConsolidadoCsvFile = Readonly<{ filename: string; content: string }>
export type ConsolidadoExportError = 'export-failed'

/** Chama a server fn e devolve o artefato CSV (ou o erro-valor). */
export const exportConsolidadoAbcCsv = async (
  input: ConsolidadoExportInput,
): Promise<Result<ConsolidadoCsvFile, ConsolidadoExportError>> => {
  const r = await exportConsolidadoAbcCsvFn({ data: { year: input.year, programs: [...input.programs] } })
  return r.ok ? ok(r.data) : err('export-failed')
}
