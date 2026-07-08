/**
 * Composition root do export do Consolidado ABC (BFF). Injeta a FONTE (hoje o placeholder isolado) no
 * use-case. 🔁 INTERINO: para ligar o core-api, troque `source` pela chamada real ao
 * `GET /budget-plans/consolidated-result` (parseada por `parseConsolidatedResult`) — nada mais muda.
 */
import { createExportConsolidadoAbcCsv } from '#modules/budget-plans/server/application/export-consolidado-abc-csv.use-case.ts'
import { consolidadoAbcPlaceholderSource } from '#modules/budget-plans/server/adapters/consolidado-abc.placeholder-source.ts'

export const consolidadoAbcServer = () => ({
  exportConsolidadoAbcCsv: createExportConsolidadoAbcCsv({
    source: () => consolidadoAbcPlaceholderSource(),
  }),
})
