/**
 * BudgetPlansError — erro do Plano Orçamentário propagado pelo BFF (string union; ESPELHA o
 * `BudgetPlansError` do server). Arquivo NEUTRO da camada `client/data` (§I: não importa `server/`). A UI
 * nunca olha status HTTP — trata só a tag i18n (§V).
 */
export type BudgetPlansError =
  | 'unauthorized' // 401 — sessão ausente/expirada
  | 'unexpected' // parse/inesperado

/** Forma do retorno RPC das server fns do Plano Orçamentário (`{ ok, data } | { ok, error }`). */
export type BudgetPlansFnResult<T> =
  | Readonly<{ ok: true; data: T }>
  | Readonly<{ ok: false; error: BudgetPlansError }>
