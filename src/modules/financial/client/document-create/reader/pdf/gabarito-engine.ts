/**
 * gabarito-engine — motor PURO de extração de campos de PDF DIGITAL por "gabarito" (template) parametrizado
 * (§XI · sem React/DOM/I/O). A leitura da camada de texto do PDF (pdf.js) vive no `document-reader.binding.ts`;
 * aqui só recebemos os `TextItem[]` (texto + coordenadas) e trabalhamos.
 *
 * NÃO é OCR de imagem: opera sobre o texto real embutido no PDF, com coordenadas (x, y). Passos:
 *   1) agrupa itens em linhas (y aproximado), ordenadas esquerda→direita;
 *   2) detecta qual gabarito reconhece o documento;
 *   3) para cada campo, acha o RÓTULO âncora e pega o VALOR ao lado/abaixo/coluna/regex.
 */

/** Trecho de texto com coordenadas (origem: pdf.js `getTextContent`). */
export type TextItem = Readonly<{
  str: string
  x: number // canto esquerdo do trecho
  y: number // linha de base (quanto MAIOR, mais no topo da página)
  width: number
  page: number
}>

/** Linha = itens de mesmo `y` (± tolerância), ordenados por `x`, com o texto concatenado. */
export type Line = Readonly<{
  y: number
  page: number
  items: readonly TextItem[]
  text: string
}>

/** Agrupa itens da mesma linha (y aproximado) e ordena por x. Página, depois topo→base (y decrescente). */
export const groupLines = (items: readonly TextItem[], tolY = 3): readonly Line[] => {
  const acc: { y: number; page: number; items: TextItem[] }[] = []
  for (const it of items) {
    const target = acc.find((l) => l.page === it.page && Math.abs(l.y - it.y) <= tolY)
    if (target !== undefined) target.items.push(it)
    else acc.push({ y: it.y, page: it.page, items: [it] })
  }
  const lines: Line[] = acc.map((l) => {
    const sorted = [...l.items].sort((a, b) => a.x - b.x)
    return {
      y: l.y,
      page: l.page,
      items: sorted,
      text: sorted
        .map((i) => i.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim(),
    }
  })
  return lines.sort((a, b) => a.page - b.page || b.y - a.y)
}

/* ---------------------------------------------------------------- conversores */

export type FieldType = 'texto' | 'moeda' | 'data' | 'competencia' | 'inteiro'

export type FieldValue = string | number | null

export const convert = (raw: string, type: FieldType): FieldValue => {
  const s = raw.trim()
  if (s === '') return null

  switch (type) {
    case 'moeda': {
      if (s === '-') return 0 // "-" na DANFSe = sem valor
      const m = /[\d.]+,\d{2}|\d+\.\d{2}|\d+/.exec(s)
      const first = m?.[0]
      if (first === undefined) return 0
      const v = first.includes(',') ? first.replace(/\./g, '').replace(',', '.') : first
      const n = Number(v)
      return Number.isFinite(n) ? n : 0
    }
    case 'inteiro': {
      const m = /\d+/.exec(s)
      return m?.[0] !== undefined ? Number(m[0]) : null
    }
    case 'data': {
      const m = /(\d{2})\/(\d{2})\/(\d{4})/.exec(s)
      if (m === null) return null
      const [, d, mo, y] = m
      return d !== undefined && mo !== undefined && y !== undefined ? `${y}-${mo}-${d}` : null
    }
    case 'competencia': {
      const full = /(\d{2})\/(\d{2})\/(\d{4})/.exec(s)
      if (full !== null) {
        const [, , mo, y] = full
        if (mo !== undefined && y !== undefined) return `${mo}/${y}` // MM/AAAA a partir de DD/MM/AAAA
      }
      const mm = /(\d{2})\/(\d{4})/.exec(s)
      if (mm === null) return null
      const [, month, year] = mm
      return month !== undefined && year !== undefined ? `${month}/${year}` : null
    }
    case 'texto':
      return s
  }
}

/* ------------------------------------------------------------ tipos do gabarito */

export type Strategy =
  | Readonly<{ mode: 'direita'; rotulo: string | RegExp }> // valor na MESMA linha, à direita do rótulo
  | Readonly<{ mode: 'abaixo'; rotulo: string | RegExp }> // valor na linha DE BAIXO, alinhado ao rótulo
  | Readonly<{ mode: 'coluna'; rotulo: string | RegExp; indice: number }> // linha de baixo tokenizada em colunas
  | Readonly<{ mode: 'regex'; padrao: RegExp }> // captura direta no texto inteiro (grupo 1)

export type GabaritoField = Readonly<{
  nome: string
  tipo: FieldType
  estrategia: Strategy
}>

export type Gabarito = Readonly<{
  nome: string
  detectar: (textoCompleto: string) => boolean
  campos: readonly GabaritoField[]
  posProcessar?: (campos: Readonly<Record<string, FieldValue>>) => Record<string, FieldValue>
}>

/* ------------------------------------------------------------------ helpers */

const matches = (text: string, rotulo: string | RegExp): boolean =>
  typeof rotulo === 'string' ? text.toLowerCase().includes(rotulo.toLowerCase()) : rotulo.test(text)

const findLineWithRotulo = (lines: readonly Line[], rotulo: string | RegExp): Line | undefined =>
  lines.find((l) => matches(l.text, rotulo))

/** Texto à direita do rótulo na mesma linha. */
const valueRight = (line: Line, rotulo: string | RegExp): string => {
  const at = line.items.findIndex((i) => matches(i.str, rotulo))
  if (at === -1) return ''
  return line.items
    .slice(at + 1)
    .map((i) => i.str)
    .join(' ')
    .trim()
}

/** Linha imediatamente abaixo (mesma página) da linha de referência. */
const lineBelow = (lines: readonly Line[], ref: Line): Line | undefined =>
  lines.filter((l) => l.page === ref.page && l.y < ref.y).sort((a, b) => b.y - a.y)[0]

/** Texto da linha imediatamente abaixo, alinhado horizontalmente ao rótulo. */
const valueBelow = (lines: readonly Line[], labelLine: Line, rotulo: string | RegExp): string => {
  const item = labelLine.items.find((i) => matches(i.str, rotulo))
  const xRef = item?.x ?? labelLine.items[0]?.x ?? 0
  const below = lineBelow(lines, labelLine)
  if (below === undefined) return ''
  const cand = below.items.map((i) => ({ i, dist: Math.abs(i.x - xRef) })).sort((a, b) => a.dist - b.dist)[0]
  return cand !== undefined ? cand.i.str : below.text
}

/** Tokeniza uma linha de valores em colunas: "R$ 1.234,56" = 1 token; cada "-" = 1 coluna vazia. */
const tokenizeColumns = (text: string): readonly string[] => text.match(/R\$\s?[\d.,]+|-/g) ?? []

export type ExtractionResult = Readonly<{
  gabarito: string | null
  campos: Readonly<Record<string, FieldValue>>
}>

export const extractWithGabarito = (
  lines: readonly Line[],
  gabaritos: readonly Gabarito[],
): ExtractionResult => {
  const textoCompleto = lines.map((l) => l.text).join('\n')
  const g = gabaritos.find((gb) => gb.detectar(textoCompleto))
  if (g === undefined) return { gabarito: null, campos: {} }

  const campos: Record<string, FieldValue> = {}
  for (const campo of g.campos) {
    let bruto = ''
    const est = campo.estrategia
    if (est.mode === 'regex') {
      const m = est.padrao.exec(textoCompleto)
      bruto = m?.[1] ?? ''
    } else if (est.mode === 'coluna') {
      const cab = findLineWithRotulo(lines, est.rotulo)
      const val = cab !== undefined ? lineBelow(lines, cab) : undefined
      if (val !== undefined) bruto = tokenizeColumns(val.text)[est.indice] ?? ''
    } else {
      const line = findLineWithRotulo(lines, est.rotulo)
      if (line !== undefined) {
        bruto = est.mode === 'direita' ? valueRight(line, est.rotulo) : valueBelow(lines, line, est.rotulo)
      }
    }
    campos[campo.nome] = convert(bruto, campo.tipo)
  }
  return { gabarito: g.nome, campos: g.posProcessar !== undefined ? g.posProcessar(campos) : campos }
}
