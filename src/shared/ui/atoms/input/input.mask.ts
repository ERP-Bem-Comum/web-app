/**
 * Máscaras de input (apresentação). O Input exibe o valor MASCARADO mas emite só os DÍGITOS via
 * onChange — o estado/submit ficam crus (os schemas de CPF/CNPJ normalizam; telefone vira dígitos).
 * Funções puras e idempotentes (sempre extraem os dígitos primeiro).
 */
export type InputMask = 'cpf' | 'cnpj' | 'cpf-cnpj' | 'phone' | 'agency'

const onlyDigits = (value: string): string => value.replace(/\D/g, '')

function maskCpf(d: string): string {
  const x = d.slice(0, 11)
  let out = x.slice(0, 3)
  if (x.length > 3) out += `.${x.slice(3, 6)}`
  if (x.length > 6) out += `.${x.slice(6, 9)}`
  if (x.length > 9) out += `-${x.slice(9, 11)}`
  return out
}

function maskCnpj(d: string): string {
  const x = d.slice(0, 14)
  let out = x.slice(0, 2)
  if (x.length > 2) out += `.${x.slice(2, 5)}`
  if (x.length > 5) out += `.${x.slice(5, 8)}`
  if (x.length > 8) out += `/${x.slice(8, 12)}`
  if (x.length > 12) out += `-${x.slice(12, 14)}`
  return out
}

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

/** Valor cru (somente dígitos) — o que o onChange do Input emite e o estado guarda. */
export function unmask(value: string): string {
  return onlyDigits(value)
}

/** Valor mascarado para exibição, a partir de qualquer entrada (cru ou já mascarado). */
export function formatMask(mask: InputMask, value: string): string {
  const d = onlyDigits(value)
  switch (mask) {
    case 'cpf':
      return maskCpf(d)
    case 'cnpj':
      return maskCnpj(d)
    case 'cpf-cnpj':
      return d.length > 11 ? maskCnpj(d) : maskCpf(d)
    case 'phone':
      return maskPhone(d)
    case 'agency':
      return maskAgency(d)
    default: {
      const _exhaustive: never = mask
      return _exhaustive
    }
  }
}
