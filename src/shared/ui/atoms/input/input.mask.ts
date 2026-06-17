/**
 * Máscaras de input (apresentação). O Input exibe o valor MASCARADO mas emite o valor CRU via onChange.
 * Para CPF/telefone/agência o cru são só dígitos; para CNPJ (e cpf-cnpj) o cru é alfanumérico maiúsculo
 * (Serpro/2026) — a lógica de CNPJ vive no helper único `#shared/document/cnpj.ts`.
 * Funções puras e idempotentes.
 */
import { maskCnpj, maskCpf, maskCpfCnpj, unmaskCnpj } from '#shared/document/cnpj.ts'

export type InputMask = 'cpf' | 'cnpj' | 'cpf-cnpj' | 'phone' | 'agency'

const onlyDigits = (value: string): string => value.replace(/\D/g, '')

/** Celular/telefone: (xx) xxxxx-xxxx (11 díg.) ou (xx) xxxx-xxxx (10 díg.). */
function maskPhone(d: string): string {
  const x = d.slice(0, 11)
  if (x.length === 0) return ''
  if (x.length <= 2) return `(${x}`
  const ddd = x.slice(0, 2)
  const rest = x.slice(2)
  if (rest.length <= 4) return `(${ddd}) ${rest}`
  const breakAt = rest.length > 8 ? 5 : 4 // 9 díg. → 5+4 ; 8 díg. → 4+4
  return `(${ddd}) ${rest.slice(0, breakAt)}-${rest.slice(breakAt)}`
}

/** Agência bancária: 4 dígitos + DV opcional (5º dígito). Ex.: "1234" ou "1234-5". */
function maskAgency(d: string): string {
  const x = d.slice(0, 5)
  return x.length > 4 ? `${x.slice(0, 4)}-${x.slice(4, 5)}` : x.slice(0, 4)
}

/** Máscaras que carregam alfanumérico (CNPJ) — o cru preserva letras. */
const ALNUM_MASKS: ReadonlySet<InputMask> = new Set<InputMask>(['cnpj', 'cpf-cnpj'])

/**
 * Valor cru emitido pelo onChange do Input e guardado no estado. CNPJ/cpf-cnpj → alfanumérico maiúsculo
 * (preserva letras); demais → só dígitos. (O `mask` é opcional p/ retrocompat de chamadas antigas.)
 */
export function unmask(value: string, mask?: InputMask): string {
  return mask !== undefined && ALNUM_MASKS.has(mask) ? unmaskCnpj(value) : onlyDigits(value)
}

/** Valor mascarado para exibição, a partir de qualquer entrada (cru ou já mascarado). */
export function formatMask(mask: InputMask, value: string): string {
  switch (mask) {
    case 'cpf':
      return maskCpf(value)
    case 'cnpj':
      return maskCnpj(value)
    case 'cpf-cnpj':
      return maskCpfCnpj(value)
    case 'phone':
      return maskPhone(onlyDigits(value))
    case 'agency':
      return maskAgency(onlyDigits(value))
    default: {
      const _exhaustive: never = mask
      return _exhaustive
    }
  }
}
