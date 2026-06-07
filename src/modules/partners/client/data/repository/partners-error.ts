/**
 * PartnersError — erro do módulo partners propagado pelo BFF (string union; espelha o `PartnersError`
 * do server). Vive num arquivo NEUTRO da camada `client/data` para ser compartilhado por todos os
 * repositories do módulo (supplier, financier, …) sem que um vertical importe o outro (boundary §I).
 * A UI nunca olha status HTTP — trata só a tag i18n derivada via `partnersErrorTag` (§V).
 */
export type PartnersError =
  | 'not-found'
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'conflict'
  | 'connectivity'
  | 'server'
  | 'collaborator-import-malformed'
  | 'invalid-registration-transition'
  | 'deactivation-reason-required'
  | 'invalid-service-category'
  | 'invalid-state'
  | 'invalid-ibge-code'

/** Forma do retorno RPC das server fns do módulo (`{ ok, data } | { ok, error }`). */
export type FnResult<T> =
  | Readonly<{ ok: true; data: T }>
  | Readonly<{ ok: false; error: PartnersError }>
