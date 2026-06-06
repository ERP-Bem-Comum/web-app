/**
 * RBAC do client (FR-020) — verificação PURA de permissão. A UI usa `can(granted, required)` para
 * ocultar/desabilitar ações de escrita conforme o RBAC do core-api.
 *
 * ⚠️ DEPENDÊNCIA: a FONTE de `granted` (as permissões do usuário) ainda NÃO existe no front — o
 * `CurrentUser` atual carrega só `userId`. Para ativar o gating de verdade, o BFF (`auth`/`/me`) precisa
 * passar a expor as permissões vindas do core-api. Até lá, o ViewModel pode tratar `granted` como `[]`
 * (degradado: ações de escrita ocultas) ou confiar no 403 do backend (`forbidden`). Ver spec FR-020.
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
