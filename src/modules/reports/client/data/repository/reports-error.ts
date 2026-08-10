/**
 * ReportsError — erro dos Relatórios (leitura) propagado pelo BFF (string union; espelha o `ReportsError` do
 * server `domain/errors/reports.errors.ts`). Arquivo NEUTRO da camada `client/data`. A UI nunca olha status
 * HTTP — trata só a tag i18n via `reportsErrorTag` (§V). Espelha `financial-error.ts` (subconjunto read-only:
 * os 3 endpoints são GET puros de agregação, sem estados de negócio como conflict/not-found).
 */
export type ReportsError = 'unauthorized' | 'forbidden' | 'validation' | 'connectivity' | 'server'

/** Forma do retorno RPC das server fns do módulo (`{ ok, data } | { ok, error }`). */
export type FnResult<T> = Readonly<{ ok: true; data: T }> | Readonly<{ ok: false; error: ReportsError }>
