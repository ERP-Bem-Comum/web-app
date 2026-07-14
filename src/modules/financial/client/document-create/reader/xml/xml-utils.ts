/**
 * xml-utils — helpers PUROS de navegação em árvore de XML parseada (§XI · §VI). Reescreve o `any` do blueprint
 * com `unknown` + type guards (§VII: sem `any`). Usado por todos os parsers de leiaute.
 *
 * A árvore vem do `fast-xml-parser` (a mesma lib do core-api). Ela devolve `unknown` na prática — objetos
 * aninhados, strings, números ou arrays. Aqui tratamos tudo como `unknown` e estreitamos com guards.
 */
import { XMLParser } from 'fast-xml-parser'

/** Guard: valor é um objeto-registro navegável (não array, não null). */
export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

/** Parseia XML com atributos (prefixo `@_`) e sem prefixos de namespace. Devolve `unknown`. */
export const parseXml = (xml: string, withAttributes: boolean): unknown => {
  const parser = new XMLParser({
    ignoreAttributes: !withAttributes,
    attributeNamePrefix: '@_',
    removeNSPrefix: true,
  })
  return parser.parse(xml)
}

/** Estreita `unknown` para um primitivo renderizável (string/number/boolean) ou `null`. */
const primitive = (v: unknown): string | number | boolean | null =>
  typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' ? v : null

/** Converte valor numérico (`"0,00"` ou `"0.00"`) em number; ausente/ inválido → 0. */
export const num = (v: unknown): number => {
  const p = primitive(v)
  if (p === null || p === '') return 0
  const n = Number(String(p).replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

/** Normaliza para string não-vazia ou `null`. */
export const str = (v: unknown): string | null => {
  const p = primitive(v)
  if (p === null) return null
  const s = String(p).trim()
  return s.length > 0 ? s : null
}

/** `"2026-05"` ou `"2026-05-13"` → `"05/2026"`. */
export const competenceBR = (v: unknown): string | null => {
  const s = str(v)
  if (s === null) return null
  const m = /^(\d{4})-(\d{2})/.exec(s)
  if (m === null) return s
  const [, year, month] = m
  return year !== undefined && month !== undefined ? `${month}/${year}` : s
}

/** `"2026-05-13T11:10:00-03:00"` → `"2026-05-13"` (compatível com `<input type=date>`). */
export const dataISO = (v: unknown): string | null => {
  const s = str(v)
  if (s === null) return null
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(s)
  return m?.[1] ?? null
}

/**
 * Busca o primeiro caminho pontilhado existente (tolerante a variações de leiaute). Cada passo estreita com
 * `isRecord`; para em `undefined`/`null`.
 */
export const pick = (obj: unknown, ...paths: readonly string[]): unknown => {
  for (const path of paths) {
    let acc: unknown = obj
    for (const key of path.split('.')) {
      if (!isRecord(acc)) {
        acc = undefined
        break
      }
      acc = acc[key]
    }
    if (acc !== undefined && acc !== null) return acc
  }
  return undefined
}

/** Busca em profundidade a primeira chave com esse nome (leiautes ABRASF/SP sem caminho fixo). */
export const deep = (obj: unknown, key: string): unknown => {
  if (!isRecord(obj)) return undefined
  if (key in obj) return obj[key]
  for (const k of Object.keys(obj)) {
    const r = deep(obj[k], key)
    if (r !== undefined) return r
  }
  return undefined
}

/** Coage `unknown` para array (elemento único → `[el]`; ausente → `[]`). Para `det`/itens repetíveis. */
export const asArray = (v: unknown): readonly unknown[] => (Array.isArray(v) ? v : v == null ? [] : [v])
