/**
 * CSV dos relatórios — regras ÚNICAS de montagem do arquivo (ADR-0009, §XI: puro, zero React/DOM).
 *
 * Existe porque os 7 builders do módulo repetiam o mesmo padrão à mão (`"${valor}"` concatenado) e cada um
 * divergiu num ponto: dinheiro formatado em uns e cru em outro, cabeçalho com aspas num só, "sem valor" ora
 * vazio ora `N/A`. Auditoria de 2026-08-10.
 *
 * ── ESCAPE (RFC 4180) ── Aspas DENTRO do campo são DOBRADAS. Sem isso, um `"` no texto altera o valor lido e,
 * junto com um `;`, DESLOCA as colunas da linha — verificado com parser padrão: `Consultoria "jan; fev"`
 * produzia 4 colunas onde deviam existir 3.
 *
 * ── DINHEIRO É NÚMERO ── `1234,56`: sem símbolo, sem separador de milhar. `Intl` com `style:'currency'`
 * produz `R$` + espaço NÃO-QUEBRÁVEL (U+00A0), o que faz a planilha tratar a célula como TEXTO — não soma,
 * não ordena, não entra em fórmula. A moeda vive no CABEÇALHO (`Valor (R$)`), não na célula.
 *
 * ── SEM VALOR = VAZIO ── Uma convenção só. `N/A`/`—` em coluna numérica força a coluna inteira a texto.
 */

/** Delimitador: `;` (padrão pt-BR — a vírgula é separador decimal). */
export const CSV_DELIMITER = ';'

/** Fim de linha CRLF, como o legado. */
export const CSV_EOL = '\r\n'

/**
 * BOM UTF-8. Sem ele o Excel/Windows abre o arquivo na codepage ANSI e todo acento do cabeçalho quebra
 * ("Plano Orçamentário" → "Plano OrÃ§amentÃ¡rio"). Vai no download, não no conteúdo montado aqui.
 */
export const CSV_BOM = '﻿'

/** Escapa e delimita UM campo (RFC 4180): aspas internas dobradas, campo entre aspas. `null` → vazio. */
export function csvField(value: string | null | undefined): string {
  const text = value ?? ''
  return `"${text.replaceAll('"', '""')}"`
}

/** Monta uma linha já escapada a partir dos campos crus. */
export function csvLine(fields: readonly (string | null | undefined)[]): string {
  return fields.map(csvField).join(CSV_DELIMITER)
}

/**
 * Cabeçalho: mesmo escape dos dados (era o único lugar que saía sem aspas em 6 dos 7 relatórios, e com
 * aspas no sétimo).
 */
export function csvHeaderLine(labels: readonly string[]): string {
  return csvLine(labels)
}

/**
 * Centavos → `1234,56` (vírgula decimal, sem milhar, sem símbolo) — NÚMERO para a planilha. Negativo mantém
 * o sinal à frente (`-500,00`), que é o que a planilha entende.
 */
export function csvNumber(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',')
}

/** Inteiro nullable (ex.: Idade) → o número, ou VAZIO. Nunca `N/A`: letra em coluna numérica vira texto. */
export function csvInteger(value: number | null | undefined): string {
  return value === null || value === undefined ? '' : String(value)
}

/** Junta cabeçalho + linhas no conteúdo final (CRLF). */
export function csvContent(header: string, rows: readonly string[]): string {
  return [header, ...rows].join(CSV_EOL)
}
