/**
 * Deriva a chave PIX a partir do campo correspondente do formulário (puro, sem React). Genérico para
 * todos os tipos de parceiro: cpf/cnpj → documento; email → e-mail; phone → telefone; aleatória → vazio.
 * Campo ausente/vazio → vazio (não inventa). `switch` exaustivo com guard `never`.
 */
import type { PixKeyType } from '#modules/partners/client/data/model/supplier.model.ts'

export type PixKeySource = Readonly<{
  document?: string
  email?: string
  telephone?: string
}>

export function derivePixKey(keyType: PixKeyType, src: PixKeySource): string {
  switch (keyType) {
    case 'cpf':
    case 'cnpj':
      return src.document ?? ''
    case 'email':
      return src.email ?? ''
    case 'phone':
      return src.telephone ?? ''
    case 'random-key':
      return ''
    default: {
      const _exhaustive: never = keyType
      return _exhaustive
    }
  }
}
