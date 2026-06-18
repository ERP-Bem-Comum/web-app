/**
 * Helper de paginação: busca TODOS os colaboradores ATIVOS (o list-fn limita a 25/página, diferente de
 * fornecedor/financiador/ato que aceitam 100). Usado pelos bindings do picker (Lançar Documento) e do
 * mapa de parceiros (grid Contas a Pagar) p/ resolver o `supplierRef`. Erro numa página → devolve o que já
 * veio (degrada sem quebrar; o picker/grid mostram lista parcial em vez de falhar).
 */
import { listCollaboratorsFn, type CollaboratorListItem } from '#modules/partners/public-api/index.ts'

const PAGE_LIMIT = 25 as const

export async function listAllActiveCollaborators(): Promise<readonly CollaboratorListItem[]> {
  const out: CollaboratorListItem[] = []
  let page = 1
  for (;;) {
    const r = await listCollaboratorsFn({ data: { active: true, page, limit: PAGE_LIMIT } })
    if (!r.ok) break
    out.push(...r.data.items)
    const { total, limit } = r.data.meta
    if (r.data.items.length === 0 || page * limit >= total) break
    page += 1
  }
  return out
}
