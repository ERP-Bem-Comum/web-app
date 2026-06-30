/**
 * Geography — tipos de I/O do domínio (PUROS, sem Zod — C2 do review). Os schemas Zod correspondentes
 * vivem em `../../adapters/geography.io-schemas.ts` (a borda). `togglePartner*` recebe `isPartner`
 * (o BFF traduz para POST=ativar / DELETE=desativar). A listagem de municípios exige `uf`.
 */

export interface TogglePartnerStateInput {
  uf: string
  isPartner: boolean
}

export interface ListMunicipalitiesByUfInput {
  uf: string
}

export interface TogglePartnerMunicipalityInput {
  ibgeCode: string
  isPartner: boolean
}
