/**
 * Mapeador PURO do response cross-state `GET /partner-municipalities/added`. Sem I/O (testável por
 * node:test). Recebe os itens JÁ ACUMULADOS (todas as páginas concatenadas) e devolve o model de domínio
 * `PartnerMunicipality[]` com `isPartner: true` fixo (todos no `/added` são parceiros), ordenado por
 * UF e depois nome (`localeCompare`, estável). A acumulação de páginas (I/O) vive no adapter.
 */
import type { PartnerMunicipality } from '#modules/partners/server/domain/geography/geography.types.ts'

export type AddedMunicipalityDto = Readonly<{ ibgeCode: string; uf: string; name: string }>

export const toAddedMunicipalities = (
  items: readonly AddedMunicipalityDto[],
): readonly PartnerMunicipality[] =>
  items
    .map((m) => ({ ibgeCode: m.ibgeCode, uf: m.uf, name: m.name, isPartner: true }))
    .sort((a, b) => a.uf.localeCompare(b.uf) || a.name.localeCompare(b.name))
