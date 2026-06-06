/**
 * RBAC do client (FR-020) — verificação PURA de permissão. A UI usa `can(granted, required)` para
 * ocultar/desabilitar ações de escrita conforme o RBAC do core-api.
 *
 * FONTE de `granted` (Rev. 2): o core-api `GET /api/v2/auth/me` já entrega `permissions[]`
 * (degradação simétrica `[]` em falha). Falta só a ponte no front: estender `MeSchema`/`AuthUser`/
 * `CurrentUser` do módulo `auth` para propagar o campo; aí o ViewModel passa `me.permissions` como
 * `granted`. Enquanto a ponte não existe, `granted = []` (degradado: ações de escrita ocultas). FR-020.
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
