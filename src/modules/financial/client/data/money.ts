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
 * Máscara monetária "as-you-type" por ENTRADA DECIMAL: agrupa o milhar e prefixa `R$`, mantendo o
 * significado em reais (`"540"` → `"R$ 540"`, `"1234,56"` → `"R$ 1.234,56"`). Aceita vírgula decimal
 * (máx. 2 casas), descarta o resto. Vazio → `""` (deixa o placeholder). Idempotente sobre a saída de
 * `centsToBRL` (a hidratação do form não "embaralha" o valor) e aceito de volta por `reaisToCents`.
 */
export const maskMoneyBRL = (raw: string): string => {
  const cleaned = raw.replace(/[^\d,]/g, '')
  if (cleaned === '') return ''
  const comma = cleaned.indexOf(',')
  const intRaw = (comma === -1 ? cleaned : cleaned.slice(0, comma)).replace(/^0+(?=\d)/, '')
  const dec =
    comma === -1
      ? ''
      : cleaned
          .slice(comma + 1)
          .replace(/\D/g, '')
          .slice(0, 2)
  const intGrouped = (intRaw === '' ? '0' : intRaw).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `R$ ${intGrouped}${comma === -1 ? '' : `,${dec}`}`
}

/** Soma de strings de centavos (defaults a 0 quando indefinido/vazio). Retorna string de centavos. */
export const sumCents = (...values: readonly (string | undefined)[]): string => {
  const total = values.reduce<number>((acc, v) => {
    const n = v === undefined || v === '' ? 0 : Number.parseInt(v, 10)
    return acc + (Number.isFinite(n) ? n : 0)
  }, 0)
  return String(total)
}
