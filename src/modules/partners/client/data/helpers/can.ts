/**
 * RBAC do client (FR-020) — verificação PURA de permissão. A UI usa `can(granted, required)` para
 * ocultar/desabilitar ações de escrita conforme o RBAC do core-api.
 *
 * FONTE de `granted` — LIGADA: o core-api `GET /api/v2/auth/me` entrega `permissions[]` (degradação
 * simétrica `[]` em falha) e a ponte no front está feita — `MeSchema`/`AuthUser`/`CurrentUser` propagam
 * o campo. O ViewModel/binding obtém `currentUser.permissions` (via `useCurrentUser`) e passa como
 * `granted`. Falta apenas o uso final nas views de US1 (esconder/desabilitar ações). FR-020.
 */
export type PartnerPermission =
  | 'collaborator:read'
  | 'collaborator:write'
  | 'collaborator:edit-sensitive'
  | 'supplier:read'
  | 'supplier:write'
  | 'supplier:edit-sensitive'
  | 'financier:read'
  | 'financier:write'
  | 'financier:edit-sensitive'
  | 'geography:read'
  | 'geography:write'

export const can = (
  granted: readonly PartnerPermission[],
  required: PartnerPermission,
): boolean => granted.includes(required)
