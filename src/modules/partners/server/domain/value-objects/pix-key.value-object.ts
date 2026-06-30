/**
 * PixKey VO — par { keyType, key } com coerência entre o tipo e o valor (§IV). Imutável (Readonly).
 * Reusa os VOs CPF/CNPJ/Email/Phone para validar a chave conforme o tipo; `random` valida UUID.
 */
import { ok, err, isOk, type Result } from '#shared/primitives/result.ts'
import { CPF } from './cpf.value-object.ts'
import { CNPJ } from './cnpj.value-object.ts'
import { Email } from './email.value-object.ts'
import { Phone } from './phone.value-object.ts'

export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random'
export type PixKey = Readonly<{ keyType: PixKeyType; key: string }>
export type PixKeyError = 'empty-key' | 'invalid-for-type'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const isValidForType = (keyType: PixKeyType, key: string): boolean => {
  switch (keyType) {
    case 'cpf':
      return isOk(CPF(key))
    case 'cnpj':
      return isOk(CNPJ(key))
    case 'email':
      return isOk(Email(key))
    case 'phone':
      return isOk(Phone(key))
    case 'random':
      return UUID_RE.test(key)
    default: {
      const _exhaustive: never = keyType
      return _exhaustive
    }
  }
}

export const PixKey = (keyType: PixKeyType, rawKey: string): Result<PixKey, PixKeyError> => {
  const key = rawKey.trim()
  if (key === '') return err('empty-key')
  if (!isValidForType(keyType, key)) return err('invalid-for-type')
  return ok({ keyType, key })
}
