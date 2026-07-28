/**
 * Resumo dos filtros APLICADOS — funções PURAS (ViewModel, §XI; sem React/TanStack, testável em node:test).
 * Constrói a linha "Rótulo: valor · Rótulo: valor · …" que aparece abaixo do título quando os filtros estão
 * recolhidos, refletindo o recorte VIGENTE (o estado aplicado, não o rascunho). A view só junta as partes com
 * " · " e renderiza; a page monta as dimensões a partir do filtro aplicado + as listas de opções.
 *
 * Resolução UUID→rótulo: o value aplicado é um UUID/enum; o rótulo vem da lista de options da dimensão. Se o
 * value não estiver na lista (ex.: opções recarregadas p/ outro plano), cai no PRÓPRIO value (nunca some).
 * Datas em `YYYY-MM-DD` → `DD/MM/AAAA` sem `Date` (à prova de "Invalid Date").
 */

export type FilterOption = Readonly<{ value: string; label: string }>

/** Uma dimensão do resumo: rótulo i18n + value aplicado ('' = não setado → pulada) + options p/ resolver. */
export type SummaryDimension = Readonly<{
  label: string
  value: string
  /** Lista p/ resolver value→label (UUID/enum). Ausente → usa o `value` cru (ex.: período já formatado). */
  options?: readonly FilterOption[]
}>

/** `YYYY-MM-DD` → `DD/MM/AAAA`. Malformado → a própria string (sem `Date`, nunca "Invalid Date"). */
export function formatIsoDateBR(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (m === null) return iso
  const [, year, month, day] = m
  if (year === undefined || month === undefined || day === undefined) return iso
  return `${day}/${month}/${year}`
}

/** Palavras de conector do intervalo de datas (i18n resolvido na page). */
export type DueRangeWords = Readonly<{ fromPrefix: string; toPrefix: string }>

/**
 * Intervalo de vencimento aplicado: ambas → "DD/MM/AAAA – DD/MM/AAAA"; só início → "a partir de DD/MM/AAAA";
 * só fim → "até DD/MM/AAAA"; nenhuma → '' (a page trata '' como dimensão não-setada → pulada).
 */
export function formatDueRange(dueFrom: string, dueTo: string, words: DueRangeWords): string {
  const from = dueFrom === '' ? null : formatIsoDateBR(dueFrom)
  const to = dueTo === '' ? null : formatIsoDateBR(dueTo)
  if (from !== null && to !== null) return `${from} – ${to}`
  if (from !== null) return `${words.fromPrefix} ${from}`
  if (to !== null) return `${words.toPrefix} ${to}`
  return ''
}

/** Resolve o rótulo de um value: '' → null (pula); com options → label ou o próprio value; sem options → value. */
export function resolveDimensionLabel(dim: SummaryDimension): string | null {
  if (dim.value === '') return null
  if (dim.options === undefined) return dim.value
  return dim.options.find((o) => o.value === dim.value)?.label ?? dim.value
}

/**
 * Monta as PARTES "Rótulo: valor" só das dimensões SETADAS (pula '' / vazias), na ordem informada. A view junta
 * com " · ". Vazio → `[]` (a view não renderiza a linha). Não muta a entrada (§VII).
 */
export function buildFilterSummaryParts(dims: readonly SummaryDimension[]): readonly string[] {
  const parts: string[] = []
  for (const dim of dims) {
    const label = resolveDimensionLabel(dim)
    if (label !== null) parts.push(`${dim.label}: ${label}`)
  }
  return parts
}
