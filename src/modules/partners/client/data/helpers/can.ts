/**
 * RBAC do client (FR-020) — verificação PURA de permissão. A UI usa `can(granted, required)` para
 * ocultar/desabilitar ações de escrita conforme o RBAC do core-api.
 *
 * FONTE de `granted` — LIGADA: o core-api `GET /api/v2/auth/me` entrega `permissions[]` (degradação
 * simétrica `[]` em falha) e a ponte no front está feita — `MeSchema`/`AuthUser`/`CurrentUser` propagam
 * o campo. O ViewModel/binding obtém `currentUser.permissions` (via `useCurrentUser`) e passa como
 * `granted`. Falta apenas o uso final nas views de US1 (esconder/desabilitar ações). FR-020.
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
