/**
 * Geography — tipos das associações territoriais de parceria. Imutável (§IV). Não há "agregado-pessoa":
 * é seleção territorial. Estado identificado por `uf`; Município por `ibgeCode` (não por nome). O toggle
 * é idempotente no core-api e devolve o DTO confirmando o estado (atualização otimista, sem refetch).
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
