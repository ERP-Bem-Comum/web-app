/**
 * RBAC do client (contracts) — verificação PURA de permissão. A UI usa `can(granted, required)` para
 * ocultar/desabilitar ações de escrita (ex.: "Incluir documento assinado") conforme o RBAC do core-api.
 *
 * FONTE de `granted` — LIGADA fim-a-fim: o core-api `GET /api/v2/auth/me` entrega `permissions[]`
 * (degradação simétrica `[]` em falha); `MeSchema`/`CurrentUser` propagam o campo; o ViewModel/binding
 * obtém `currentUser.permissions`. Espelha `src/modules/partners/client/data/helpers/can.ts`.
 */
export const CONTRACT_PERMISSIONS = [
  'contract:read',
  'contract:write',
  'contract:mass-approve',
] as const

export type ContractPermission = (typeof CONTRACT_PERMISSIONS)[number]

const isContractPermission = (p: string): p is ContractPermission =>
  (CONTRACT_PERMISSIONS as readonly string[]).includes(p)

/**
 * Narrowing REAL do `permissions[]` cru (`readonly string[]`) → `ContractPermission[]`: filtra valores
 * desconhecidos via type predicate, sem `as` que "mente". Ponto único de conversão.
 */
export const grantedContractPermissions = (
  permissions: readonly string[] | undefined,
): readonly ContractPermission[] => (permissions ?? []).filter(isContractPermission)

export const can = (
  granted: readonly ContractPermission[],
  required: ContractPermission,
): boolean => granted.includes(required)
