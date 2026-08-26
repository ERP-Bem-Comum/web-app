/**
 * Regera `src/shared/banking/febraban-banks.ts` — a tabela de bancos (código de compensação FEBRABAN).
 *
 *   node scripts/gen-febraban-banks.mjs
 *
 * Fonte: Banco Central (participantes do STR/SPI), servida pela BrasilAPI (`/api/banks/v1`), que a
 * sincroniza com o Bacen. O CSV histórico do próprio Bacen
 * (`www.bcb.gov.br/pom/spb/estatistica/port/ParticipantesSTRport.csv`) está congelado em ABRIL/2023 —
 * conferido em 26/08/2026 pelo `last-modified` — e por isso NÃO é usado aqui.
 *
 * Rode quando um banco novo faltar no seletor. O script FALHA se algum dos 12 bancos do grupo
 * "Mais usados" sumir da fonte, para não degradar o seletor em silêncio.
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const SYNCED_AT = new Date().toISOString().slice(0, 10)
const SOURCE = 'https://brasilapi.com.br/api/banks/v1'
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'shared', 'banking', 'febraban-banks.ts')

// Nomes comerciais que JÁ existiam no repo (lista curada da Conciliação). Preferidos ao nome
// reduzido do Bacen porque são os que o operador reconhece ("Nubank", não "NU PAGAMENTOS - IP").
const FREQUENT = new Map([
  ['001', 'Banco do Brasil'],
  ['033', 'Santander'],
  ['077', 'Banco Inter'],
  ['104', 'Caixa Econômica Federal'],
  ['212', 'Banco Original'],
  ['237', 'Bradesco'],
  ['260', 'Nubank'],
  ['336', 'C6 Bank'],
  ['341', 'Itaú Unibanco'],
  ['422', 'Banco Safra'],
  ['748', 'Sicredi'],
  ['756', 'Sicoob'],
])

const raw = await (await fetch(SOURCE)).json()
const seen = new Set()
const rows = []
for (const b of raw) {
  if (b.code === null || b.code === undefined) continue
  const code = String(b.code).padStart(3, '0')
  if (!/^\d{3}$/.test(code) || code === '000') continue
  if (seen.has(code)) continue
  seen.add(code)
  const name = FREQUENT.get(code) ?? String(b.name).trim().replace(/\s+/g, ' ')
  rows.push({ code, name, frequent: FREQUENT.has(code) })
}
rows.sort((a, b) => a.code.localeCompare(b.code))

const missing = [...FREQUENT.keys()].filter((c) => !seen.has(c))
if (missing.length > 0) throw new Error('banco curado ausente da fonte: ' + missing.join(','))

const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
const lines = rows
  .map((r) => `  { code: '${r.code}', name: '${esc(r.name)}'${r.frequent ? ', frequent: true' : ''} },`)
  .join('\n')

const file = `/**
 * Tabela de bancos (código de compensação FEBRABAN/COMPE de 3 dígitos) — FONTE ÚNICA do produto.
 *
 * ⚠️ GERADO. Não editar à mão. Regerar com \`scripts/gen-febraban-banks.mjs\` (ver o cabeçalho do script).
 * Fonte: Banco Central (participantes do STR/SPI), via BrasilAPI \`/api/banks/v1\`.
 * Sincronizado em: ${SYNCED_AT} — ${rows.length} instituições com código de compensação.
 *
 * ⚠️ O CSV histórico do Bacen (\`pom/spb/estatistica/port/ParticipantesSTRport.csv\`) está congelado em
 * abril/2023 e NÃO serve como fonte: perde as instituições criadas depois.
 *
 * POR QUE VERSIONADO NO REPO e não uma tabela no banco (a decisão de DoD que estava aberta no
 * core-api#708): o de-para banco→código é vocabulário estável e o picker precisa dele para RENDERIZAR,
 * sem ida ao servidor. Um endpoint aqui trocaria um arquivo de 20 KB por uma dependência de rede num
 * campo de formulário. Quando o backend passar a validar o código (hoje aceita string livre), esta
 * lista continua sendo a do FRONT — a validação é dele.
 *
 * \`frequent\` marca os 12 bancos que já eram a lista curada da Conciliação: eles aparecem num grupo
 * "Mais usados" no topo do seletor. Não é ranking inventado — é a lista que já estava em produção.
 * Para esses 12, o nome é o COMERCIAL ("Nubank"), não o reduzido do Bacen ("NU PAGAMENTOS - IP"),
 * porque é assim que o operador procura.
 */

export type BankOption = Readonly<{
  /** Código de compensação, SEMPRE 3 dígitos com zeros à esquerda ('001'). É o que o CNAB grava. */
  code: string
  name: string
  /** Aparece no grupo "Mais usados" do seletor. */
  frequent?: true
}>

export const FEBRABAN_BANKS: readonly BankOption[] = [
${lines}
]

/** Índice por código. Map (e não \`.find\`) porque o grid resolve o nome LINHA A LINHA. */
const BY_CODE: ReadonlyMap<string, BankOption> = new Map(FEBRABAN_BANKS.map((b) => [b.code, b]))

/** Os 12 do grupo "Mais usados", na ordem da lista. */
export const FREQUENT_BANKS: readonly BankOption[] = FEBRABAN_BANKS.filter((b) => b.frequent === true)

/**
 * Normaliza o que já está gravado num cadastro ANTIGO (campo texto livre) para um código de 3 dígitos.
 * Aceita '237', '0237', '237 - Bradesco'. Devolve \`null\` quando não dá para reconhecer com certeza —
 * e aí quem chama PRESERVA o texto original em vez de descartá-lo (ver o seletor do fornecedor).
 * Não tenta adivinhar por nome: 'Banco Santander' × 'Santander' × 'Santander Brasil' resolveriam por
 * heurística, e errar o banco aqui é pagamento recusado.
 */
export const toBankCode = (raw: string): string | null => {
  const digits = /^0*(\\d{1,3})\\b/.exec(raw.trim())?.[1]
  if (digits === undefined) return null
  const code = digits.padStart(3, '0')
  return BY_CODE.has(code) ? code : null
}

/** Nome do banco pelo código; \`undefined\` quando o código não existe na tabela. */
export const bankNameByCode = (code: string): string | undefined => BY_CODE.get(code)?.name

/** Rótulo de exibição "237 · Bradesco". Devolve o próprio \`code\` quando não reconhecido. */
export const bankLabel = (code: string): string => {
  const name = BY_CODE.get(code)?.name
  return name === undefined ? code : \`\${code} · \${name}\`
}
`
writeFileSync(OUT, file)
console.log('linhas:', rows.length, '| frequentes:', rows.filter((r) => r.frequent).length)
console.log('bytes:', file.length)
