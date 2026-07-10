/**
 * BudgetPlansError — erro do Plano Orçamentário propagado pelo BFF (string union; ESPELHA o
 * `BudgetPlansError` do server). Arquivo NEUTRO da camada `client/data` (§I: não importa `server/`). A UI
 * nunca olha status HTTP — trata só a tag i18n (§V).
 */
export type BudgetPlansError =
  | 'unauthorized' // 401 — sessão ausente/expirada
  | 'budget-plan-already-exists' // 409 — já existe plano p/ esse ano+programa (unicidade server-side)
  | 'budget-plan-not-found' // 404 — plano inexistente (GET /budget-plans/:id — leitura do detalhe, feature 059)
  | 'invalid-input' // 400/422 — payload rejeitado pelo core-api
  // ── Ciclo de vida (feature 060 — ações do menu). 409 mapeado por CONTEXTO do endpoint (o core esconde o slug).
  | 'budget-plan-already-approved' // approve — plano já aprovado
  | 'budget-plan-not-approved' // scenery — só planos aprovados geram cenário
  | 'budget-plan-invalid-transition' // start-calibration — transição de estado inválida (genérico)
  | 'budget-plan-not-editable' // escrita de estrutura (feature 061) — plano não aceita mais escrita (ex.: aprovado)
  | 'unexpected' // parse/inesperado

/** Forma do retorno RPC das server fns do Plano Orçamentário (`{ ok, data } | { ok, error }`). */
export type BudgetPlansFnResult<T> =
  | Readonly<{ ok: true; data: T }>
  | Readonly<{ ok: false; error: BudgetPlansError }>
