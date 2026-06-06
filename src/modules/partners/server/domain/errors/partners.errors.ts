/**
 * PartnersError — união discriminada (string-literal kebab-case EN) das falhas do módulo partners.
 * Slugs alinhados aos contratos do core-api (`/api/v1`) + locais. Mapeados para AppError/tags i18n na
 * borda do client (ver `client/data/helpers/partners-error-tag.ts`).
 */
export type PartnersError =
  // genéricos / borda
  | 'not-found' // 404
  | 'validation' // 400/422 input inválido
  | 'unauthorized' // 401 (sessão) — signOut
  | 'forbidden' // 403 (sem permissão RBAC)
  | 'conflict' // 409
  | 'connectivity' // backend fora / timeout
  | 'server' // 5xx / inesperado
  // colaboradores
  | 'collaborator-import-malformed' // CSV malformado
  | 'invalid-registration-transition' // situação cadastral só avança Pré → Cadastrado
  | 'deactivation-reason-required' // desativar colaborador exige motivo
  // fornecedores
  | 'invalid-service-category' // categoria fora do catálogo (39)
  // geografia
  | 'invalid-state' // UF fora do catálogo
  | 'invalid-ibge-code' // município fora do catálogo
