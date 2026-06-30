/**
 * Mapeia o DETALHE de um parceiro (qualquer tipo) para os campos do formulário de contrato (puro, sem I/O).
 * Inclui só os campos que o parceiro possui (não inventa): banco (`checkDigit`→`dv`), PIX, e-mail, telefone.
 * Banco/PIX no contrato são SOMENTE-LEITURA — este mapper só os alimenta para exibição; o contato é editável.
 */
export type PartnerDetailLike = Readonly<{
  email?: string | null
  telephone?: string | null
  bankAccount?: Readonly<{ bank: string; agency: string; accountNumber: string; checkDigit: string }> | null
  pixKey?: Readonly<{ keyType: string; key: string }> | null
}>

export type ContractPrefill = Readonly<{
  bancaryInfo?: Readonly<{ bank: string; agency: string; accountNumber: string; dv: string }>
  pixInfo?: Readonly<{ keyType: string; key: string }>
  email?: string
  telephone?: string
}>

const has = (v: string | null | undefined): v is string => v !== null && v !== undefined && v !== ''

export function partnerDetailToContractFields(detail: PartnerDetailLike): ContractPrefill {
  const bank = detail.bankAccount
  const pix = detail.pixKey
  return {
    ...(has(detail.email) ? { email: detail.email } : {}),
    ...(has(detail.telephone) ? { telephone: detail.telephone } : {}),
    ...(bank != null
      ? { bancaryInfo: { bank: bank.bank, agency: bank.agency, accountNumber: bank.accountNumber, dv: bank.checkDigit } }
      : {}),
    ...(pix != null ? { pixInfo: { keyType: pix.keyType, key: pix.key } } : {}),
  }
}
