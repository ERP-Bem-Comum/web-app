/**
 * ViewModel da geografia — AGNÓSTICO (objeto puro, zero React). Derivações: ordenação, toggle OTIMISTA
 * (imutável — retorna nova lista com o item-alvo atualizado) e contagem de parceiros. Testável em node:test.
 */
import type { PartnerMunicipality, PartnerState } from '#modules/partners/client/data/model/geography.model.ts'

/** Ordena estados por UF (alfabético, estável). Não muta a entrada. */
export function sortStates(states: readonly PartnerState[]): readonly PartnerState[] {
  return [...states].sort((a, b) => a.uf.localeCompare(b.uf))
}

/** Ordena municípios por nome (alfabético, estável). Não muta a entrada. */
export function sortMunicipalities(items: readonly PartnerMunicipality[]): readonly PartnerMunicipality[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name))
}

/** Toggle OTIMISTA de um estado (por `uf`): retorna nova lista com `isPartner` trocado no alvo. */
export function applyStateToggle(
  states: readonly PartnerState[],
  uf: string,
  isPartner: boolean,
): readonly PartnerState[] {
  return states.map((s) => (s.uf === uf ? { ...s, isPartner } : s))
}

/** Toggle OTIMISTA de um município (por `ibgeCode`): nova lista com `isPartner` trocado no alvo. */
export function applyMunicipalityToggle(
  items: readonly PartnerMunicipality[],
  ibgeCode: string,
  isPartner: boolean,
): readonly PartnerMunicipality[] {
  return items.map((m) => (m.ibgeCode === ibgeCode ? { ...m, isPartner } : m))
}

/** Conta quantos itens são parceiros (para resumos de painel). */
export function countPartners(items: readonly Readonly<{ isPartner: boolean }>[]): number {
  return items.reduce((acc, it) => (it.isPartner ? acc + 1 : acc), 0)
}
