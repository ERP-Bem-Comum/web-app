/**
 * Seletor de colunas do grid de Contas a Pagar (spec 129) — núcleo PURO. Guarda as colunas ESCONDIDAS (não
 * as visíveis): uma coluna nova no `COLUMNS` nasce visível para quem já tem preferência salva. Colunas
 * `locked` (Documento, Status) nunca entram no conjunto — nem por toggle, nem por um storage adulterado.
 */
import { COLUMNS, type ColumnKey } from './contas-a-pagar.view-model.ts'

export type HiddenColumns = ReadonlySet<ColumnKey>

const HIDEABLE: ReadonlySet<string> = new Set(COLUMNS.filter((c) => !c.locked).map((c) => c.key))

const isHideable = (key: unknown): key is ColumnKey => typeof key === 'string' && HIDEABLE.has(key)

export const NO_HIDDEN_COLUMNS: HiddenColumns = new Set()

// Tolerante: nulo, JSON corrompido, shape desconhecido ou chave que não existe / não pode sumir → ignorado.
export const parseHiddenColumns = (raw: string | null): HiddenColumns => {
  if (raw === null) return NO_HIDDEN_COLUMNS
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return NO_HIDDEN_COLUMNS
    return new Set(parsed.filter(isHideable))
  } catch {
    return NO_HIDDEN_COLUMNS
  }
}

// Ordem do `COLUMNS` — o mesmo conjunto serializa sempre igual.
export const serializeHiddenColumns = (hidden: HiddenColumns): string =>
  JSON.stringify(COLUMNS.filter((c) => hidden.has(c.key)).map((c) => c.key))

export const toggleHiddenColumn = (hidden: HiddenColumns, key: ColumnKey): HiddenColumns => {
  if (!isHideable(key)) return hidden
  const next = new Set(hidden)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  return next
}

export const visibleColumnsOf = (hidden: HiddenColumns): readonly (typeof COLUMNS)[number][] =>
  COLUMNS.filter((c) => !hidden.has(c.key))
