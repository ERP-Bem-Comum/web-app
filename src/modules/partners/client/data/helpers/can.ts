/**
 * RBAC do client (FR-020) — verificação PURA de permissão. A UI usa `can(granted, required)` para
 * ocultar/desabilitar ações de escrita conforme o RBAC do core-api.
 *
 * FONTE de `granted` — LIGADA fim-a-fim: o core-api `GET /api/v2/auth/me` entrega `permissions[]`
 * (degradação simétrica `[]` em falha); `MeSchema`/`AuthUser`/`CurrentUser` propagam o campo e o
 * ViewModel/binding obtém `currentUser.permissions` (via `useCurrentUser`). Consumido nas views de
 * fornecedores (feature 010, esconder/desabilitar ações de escrita) e no menu do shell (feature 011,
 * `requiredPermission: 'supplier:read'`). O resultado do LOGIN NÃO carrega permissões — é `AuthenticatedUser`
 * (só `userId`); permissões são responsabilidade exclusiva do `/me`. FR-020.
 */
export const PARTNER_PERMISSIONS = [
  'collaborator:read',
  'collaborator:write',
  'collaborator:edit-sensitive',
  'supplier:read',
  'supplier:write',
  'supplier:edit-sensitive',
  'financier:read',
  'financier:write',
  'financier:edit-sensitive',
  'geography:read',
  'geography:write',
] as const

export type PartnerPermission = (typeof PARTNER_PERMISSIONS)[number]

const isPartnerPermission = (p: string): p is PartnerPermission =>
  (PARTNER_PERMISSIONS as readonly string[]).includes(p)

/**
 * Narrowing REAL do `permissions[]` cru vindo do `/me` (`readonly string[]`) → `PartnerPermission[]`:
 * filtra valores desconhecidos via type predicate, sem `as` que "mente". Ponto único de conversão
 * (antes era um cast `as readonly PartnerPermission[]` repetido em cada binding).
 */
export const grantedPermissions = (
  permissions: readonly string[] | undefined,
): readonly PartnerPermission[] => (permissions ?? []).filter(isPartnerPermission)

export const can = (
  granted: readonly PartnerPermission[],
  required: PartnerPermission,
): boolean => granted.includes(required)
