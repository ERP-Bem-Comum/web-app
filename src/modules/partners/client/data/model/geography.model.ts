/**
 * Model do client (client-data) — tipos de I/O da geografia de parceria, espelhando `geography.io.ts`.
 * Tipos locais (boundary §I). NÃO é CRUD: é seleção territorial (estado/município com `isPartner`).
 */
export type PartnerState = Readonly<{
  uf: string
  isPartner: boolean
}>

export type PartnerMunicipality = Readonly<{
  ibgeCode: string
  uf: string
  name: string
  isPartner: boolean
}>

// ── Inputs enviados pelo repository (a server fn valida no server) ──
export type ToggleStateInput = Readonly<{ uf: string; isPartner: boolean }>
export type ListMunicipalitiesInput = Readonly<{ uf: string }>
export type ToggleMunicipalityInput = Readonly<{ ibgeCode: string; isPartner: boolean }>
