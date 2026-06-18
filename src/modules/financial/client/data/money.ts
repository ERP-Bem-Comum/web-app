/**
 * Dinheiro do Financeiro — conversão reais↔centavos e formatação BRL. PURO, sem I/O (§VIII: nativo
 * `Intl`). A borda do core-api usa **string de centavos** (`"150050"` = R$ 1.500,50); a UI entra/exibe em
 * reais. Vive no client (`reais↔centavos` é concern de UI; o server só repassa a string de centavos).
 */
import { ok, err, type Result } from '#shared/primitives/result.ts'

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** Centavos (string de dígitos ou number) → `"R$ 1.500,50"`. Vazio/ inválido → `"R$ 0,00"`. */
export const centsToBRL = (cents: string | number): string => {
  const n = typeof cents === 'number' ? cents : Number.parseInt(cents, 10)
  return brl.format(Number.isFinite(n) ? n / 100 : 0)
}

/**
 * Entrada em reais (`"R$ 1.500,50"`, `"1.500,50"`, `"1500,50"`, `"1500"`) → **string de centavos**
 * (`"150050"`). Aceita máscara (R$, pontos de milhar, vírgula decimal). Inválido → `err('invalid-money')`.
 */
export const reaisToCents = (raw: string): Result<string, 'invalid-money'> => {
  const cleaned = raw
    .trim()
    .replace(/[R$\s.]/g, '')
    .replace(',', '.')
  // Regex linear (sem quantificadores aninhados sobrepostos) — falso-positivo do detect-unsafe-regex.
  // eslint-disable-next-line security/detect-unsafe-regex -- `\d+(\.\d{1,2})?` não tem backtracking catastrófico
  if (cleaned === '' || !/^\d+(\.\d{1,2})?$/.test(cleaned)) return err('invalid-money')
  return ok(String(Math.round(Number.parseFloat(cleaned) * 100)))
}

/**
 * Máscara monetária "as-you-type" (acumulador de centavos, SEM `R$`): os dígitos preenchem da direita,
 * com a vírgula sempre 2 casas antes do fim e ponto de milhar (`"123456"` → `"1.234,56"`). Vazio → `""`
 * (deixa o placeholder). Idempotente (reaplica sobre `"1.234,56"`/`"R$ 1.234,56"`) e aceito de volta por
 * `reaisToCents`. O número digitado é o valor em CENTAVOS (as 2 últimas casas são os centavos).
 */
export const maskMoneyBRL = (raw: string): string => {
  const digits = raw.replace(/\D/g, '')
  if (digits === '') return ''
  const padded = digits.padStart(3, '0') // garante ao menos "0,XX"
  const int = padded.slice(0, -2).replace(/^0+(?=\d)/, '') // remove zeros à esquerda (mantém 1)
  const dec = padded.slice(-2)
  const intGrouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${intGrouped},${dec}`
}

/** Centavos → reais SEM o `R$` (`"150050"` → `"1.500,50"`) — hidrata campos de valor sem prefixo. */
export const centsToReais = (cents: string | number): string => maskMoneyBRL(String(cents))

/** Soma de strings de centavos (defaults a 0 quando indefinido/vazio). Retorna string de centavos. */
export const sumCents = (...values: readonly (string | undefined)[]): string => {
  const total = values.reduce<number>((acc, v) => {
    const n = v === undefined || v === '' ? 0 : Number.parseInt(v, 10)
    return acc + (Number.isFinite(n) ? n : 0)
  }, 0)
  return String(total)
}
