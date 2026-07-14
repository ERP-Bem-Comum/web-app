/**
 * ViewModel PURA do relatório "Posição de Pagamentos" (ADR-0009, §XI): agrega as linhas cruas (folhas) na
 * árvore Fornecedor → Centro de Custo → Categoria, somando as 3 MEDIDAS DERIVADAS (Em atraso · Pago · A pagar)
 * folha → CC → fornecedor → Total Geral, deriva o total por fornecedor (gráfico de barras) e monta o CSV.
 * ZERO React/TanStack (o lint barra `react`/`@tanstack/react-*` em `*.view-model.ts`). Testável em node:test.
 *
 * ── 3 MEDIDAS DERIVADAS — CONTRATO DE DERIVAÇÃO (ratificado pela P.O. 2026-07-07) ──
 * As colunas/medidas NÃO são status crus, e sim 3 buckets DERIVADOS do estado real de cada obrigação a pagar
 * (máquina title-centric: Rascunho → Aberto → Aprovado → Transmitido → Pago → Conciliado):
 *   • Pago      = status Pago OU Conciliado (Conciliado conta como pago — já liquidado; só amarrado ao extrato).
 *   • Em atraso = NÃO pago (Aberto/Aprovado/Transmitido) E vencido (dueDate < hoje).
 *   • A pagar   = NÃO pago (Aberto/Aprovado/Transmitido) E a vencer (dueDate ≥ hoje).
 * ATENÇÃO: "Em atraso" e "A pagar" são o MESMO conjunto (não pagos), separado pela DATA — não pelo status;
 * o mesmo título Aberto/Aprovado cai em um ou no outro conforme já venceu. EXCLUÍDOS de TODOS os buckets (e do
 * Total): Rascunho (não é obrigação firme) e Recusado (não pagável). O Total é derivado = soma das 3.
 * Quando o core-api#114 subir, o backend/BFF derivará esses 3 buckets por esta regra e entregará o snapshot
 * pronto; aqui é PLACEHOLDER sintético (front-first) — o front só EXIBE, não deriva.
 *
 * ── ENGINE DE "POSIÇÃO" REUTILIZÁVEL ──
 * O shape agregado (`PosicaoNode`/`PosicaoReport`) é NEUTRO: `level` é um enum, `name` é string — não fala
 * "fornecedor" no tipo. A MESMA árvore/agregação serve Posição de PAGAMENTOS e, no futuro, Posição de
 * RECEBÍVEIS (`type: 'r'`): quando o core-api#114 + o Contas a Receber subirem, `loadPosicao('r')` mapeará os
 * 3 buckets dos RECEBÍVEIS neste MESMO shape neutro — as agregações e a View NÃO mudam; só a fonte e os rótulos.
 *
 * Dinheiro em CENTAVOS inteiros (§IV). A árvore preserva a ORDEM DE INSERÇÃO. Sem `throw` nas derivações (§II).
 */
import { POSICAO_PAGAMENTOS_RAW, type RawPosicaoRow } from './data/posicao-pagamentos.placeholder.ts'
import { POSICAO_RECEBIMENTOS_RAW } from './data/posicao-recebimentos.placeholder.ts'
import type { PaymentPosition } from './data/model/payment-position.model.ts'

/** Nível do nó na árvore: fornecedor (0) → centro de custo (1) → categoria (folha, 2). */
export type PosicaoLevel = 'supplier' | 'costCenter' | 'category'

/**
 * As 3 medidas DERIVADAS de um nó, em centavos. Ordem canônica de exibição (colunas/CSV/legenda):
 * Em atraso → Pago → A pagar. O total é derivado (`measureTotal`), não é um campo.
 */
export type PosicaoMeasures = Readonly<{
  emAtrasoCents: number
  pagoCents: number
  aPagarCents: number
}>

/** Nó da árvore agregada (com as 3 medidas somadas + filhos). Shape NEUTRO (serve 'p' e 'r'). */
export type PosicaoNode = Readonly<{
  /** chave estável (caminho na árvore) para React key / expand-state. */
  id: string
  name: string
  level: PosicaoLevel
  measures: PosicaoMeasures
  children: readonly PosicaoNode[]
}>

/** Relatório completo: os fornecedores (raízes) + os totais gerais das 3 medidas. */
export type PosicaoReport = Readonly<{
  totals: PosicaoMeasures
  suppliers: readonly PosicaoNode[]
}>

/** Tipo de posição: 'p' = Pagamentos (Fornecedor) · 'r' = Recebíveis (Financiador — quando o A-Receber subir). */
export type PosicaoType = 'p' | 'r'

/** Total por fornecedor (soma das 3 medidas), para o gráfico de barras "Distribuição por Fornecedor". */
export type SupplierTotal = Readonly<{ id: string; name: string; valueCents: number }>

const emptyMeasures = (): PosicaoMeasures => ({ emAtrasoCents: 0, pagoCents: 0, aPagarCents: 0 })

const addMeasures = (a: PosicaoMeasures, b: PosicaoMeasures): PosicaoMeasures => ({
  emAtrasoCents: a.emAtrasoCents + b.emAtrasoCents,
  pagoCents: a.pagoCents + b.pagoCents,
  aPagarCents: a.aPagarCents + b.aPagarCents,
})

/** Total (soma das 3 medidas) de um nó — a coluna/KPI "Total" e o valor por fornecedor derivam daqui. */
export function measureTotal(m: PosicaoMeasures): number {
  return m.emAtrasoCents + m.pagoCents + m.aPagarCents
}

/** Extrai as 3 medidas de uma linha crua (folha). */
const rowMeasures = (row: RawPosicaoRow): PosicaoMeasures => ({
  emAtrasoCents: row.emAtrasoCents,
  pagoCents: row.pagoCents,
  aPagarCents: row.aPagarCents,
})

/**
 * Agrega as linhas cruas (folhas) na árvore Fornecedor → Centro de Custo → Categoria (ordem de inserção),
 * somando as 3 medidas de baixo para cima: cada folha (categoria) recebe as medidas da sua linha; os
 * subtotais de Centro de Custo e Fornecedor somam os filhos; o Total Geral soma os fornecedores.
 */
export function aggregatePosicao(raw: readonly RawPosicaoRow[]): PosicaoReport {
  // Estrutura mutável interna (preserva ordem via arrays de chaves).
  interface Node {
    name: string
    order: string[]
    kids: Map<string, Node>
    measures: PosicaoMeasures
    level: PosicaoLevel
    id: string
  }
  const makeNode = (name: string, level: PosicaoLevel, id: string): Node => ({
    name,
    order: [],
    kids: new Map(),
    measures: emptyMeasures(),
    level,
    id,
  })
  const root: Node = makeNode('__root__', 'supplier', '')
  const getChild = (parent: Node, name: string, level: PosicaoLevel): Node => {
    const existing = parent.kids.get(name)
    if (existing) return existing
    const id = parent.id === '' ? name : `${parent.id} ▸ ${name}`
    const node = makeNode(name, level, id)
    parent.kids.set(name, node)
    parent.order.push(name)
    return node
  }

  for (const row of raw) {
    const leaf = rowMeasures(row)
    const supplier = getChild(root, row.supplier, 'supplier')
    const costCenter = getChild(supplier, row.costCenter, 'costCenter')
    const category = getChild(costCenter, row.category, 'category')
    // Soma na folha (categoria) e propaga para os ancestrais.
    category.measures = addMeasures(category.measures, leaf)
    costCenter.measures = addMeasures(costCenter.measures, leaf)
    supplier.measures = addMeasures(supplier.measures, leaf)
  }

  const makeNodeFallback = (name: string, parentLevel: PosicaoLevel): PosicaoNode => ({
    id: name,
    name,
    level: parentLevel === 'supplier' ? 'costCenter' : 'category',
    measures: emptyMeasures(),
    children: [],
  })
  const toNode = (node: Node): PosicaoNode => ({
    id: node.id,
    name: node.name,
    level: node.level,
    measures: node.measures,
    children: node.order.map((k) => {
      const child = node.kids.get(k)
      // child sempre existe (inserido junto com order) — fallback só p/ satisfazer o tipo sem throw.
      return child ? toNode(child) : makeNodeFallback(k, node.level)
    }),
  })

  const suppliers = root.order.map((k) => {
    const s = root.kids.get(k)
    return s ? toNode(s) : makeNodeFallback(k, 'supplier')
  })
  const totals = suppliers.reduce<PosicaoMeasures>((acc, s) => addMeasures(acc, s.measures), emptyMeasures())

  return { totals, suppliers }
}

/**
 * Total por FORNECEDOR (soma das 3 medidas), em ordem DECRESCENTE — fonte do gráfico de barras horizontais
 * "Distribuição por Fornecedor". Não muta o relatório (copia antes de ordenar §VII). Empates preservam a
 * ordem de inserção (sort estável).
 */
export function supplierTotals(report: PosicaoReport): readonly SupplierTotal[] {
  return [...report.suppliers]
    .map((s): SupplierTotal => ({ id: s.id, name: s.name, valueCents: measureTotal(s.measures) }))
    .sort((a, b) => b.valueCents - a.valueCents)
}

/**
 * Fonte da tela (front-first): a árvore agregada dos dados PLACEHOLDER. Ponto ÚNICO pelo qual a View obtém o
 * relatório — mantém a View sem tocar a `data/` (boundary client-ui ↛ client-data).
 *
 * `type` seleciona a fonte com o MESMO shape agregado (engine NEUTRO): `'p'` (Pagamentos → Fornecedor) usa
 * `POSICAO_PAGAMENTOS_RAW`; `'r'` (Recebimentos → Financiador) usa `POSICAO_RECEBIMENTOS_RAW`. As agregações e
 * a View NÃO mudam entre os dois — só a FONTE e os RÓTULOS (estes últimos vêm por props/i18n na tela).
 *
 * ⚠️ Ambas as fontes são PLACEHOLDER sintético (front-first) enquanto o core-api#114 não existe. Para
 * Recebimentos, quando o Contas a Receber subir, basta o placeholder retornar `[]` → a árvore vem VAZIA
 * (0 nós, totais 0) e a tela cai no empty state honesto ("Nenhum recebimento registrado"). Sem `throw` (§II).
 */
export function loadPosicao(type: PosicaoType = 'p'): PosicaoReport {
  return aggregatePosicao(type === 'r' ? POSICAO_RECEBIMENTOS_RAW : POSICAO_PAGAMENTOS_RAW)
}

/**
 * ADAPTER (puro) DTO real (`PaymentPosition[]`) → linhas cruas da árvore (`RawPosicaoRow[]`). Mapeamento 1:1
 * (D1 do plano): `supplierName/costCenterName/categoryName` (nullable → "—") viram os 3 níveis; os 3 buckets
 * DERIVADOS já vêm prontos do BFF/core-api — `overdueCents→emAtraso`, `paidCents→pago`, `pendingCents→aPagar`.
 * O binding chama `aggregatePosicao(toRawPosicaoRows(positions))` p/ montar a árvore (a View não muda). Sem
 * `throw` (§II). Lista vazia → árvore vazia → empty-state honesto na View.
 */
export function toRawPosicaoRows(positions: readonly PaymentPosition[]): readonly RawPosicaoRow[] {
  return positions.map((p) => ({
    supplier: p.supplierName ?? '—',
    costCenter: p.costCenterName ?? '—',
    category: p.categoryName ?? '—',
    // O backend devolve `pendingCents` = TODOS os não-pagos (Open/Approved), e `overdueCents` = os não-pagos
    // JÁ VENCIDOS (subconjunto de pending). "A pagar" aqui é só o A VENCER → `pending − overdue`; senão os
    // vencidos contariam nas DUAS colunas (Em atraso E A pagar) e o total inflaria. Assim as 3 medidas são
    // mutuamente exclusivas e o total (`measureTotal`) = pago + não-pago, sem dupla contagem. `pending ≥
    // overdue` sempre (overdue ⊆ pending) → nunca negativo.
    emAtrasoCents: p.overdueCents,
    pagoCents: p.paidCents,
    aPagarCents: p.pendingCents - p.overdueCents,
  }))
}

// ── Formatação ──

const brlFmt = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Centavos → "R$ 1.234,56". */
export function formatBRL(cents: number): string {
  return brlFmt.format(cents / 100)
}

/** Centavos → "R$ 1,2 mi" / "R$ 345 mil" — rótulo curto p/ o centro do donut/legenda (evita transbordo). */
export function formatBRLShort(cents: number): string {
  const reais = cents / 100
  if (Math.abs(reais) >= 1_000_000) {
    return `R$ ${(reais / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`
  }
  if (Math.abs(reais) >= 1_000) {
    return `R$ ${(reais / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} mil`
  }
  return `R$ ${reais.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
}

/** Percentual "63,4%" / "55%" — sem casas quando inteiro; 1 casa quando fracionário. Guard não-finito → "0%". */
export function formatPercent(pct: number): string {
  if (!Number.isFinite(pct)) return '0%'
  const rounded = Math.round(pct * 10) / 10
  if (Number.isInteger(rounded)) return `${String(rounded)}%`
  return `${rounded.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}

/** % de uma fatia sobre o total (legenda/tooltip do donut e largura das barras). Guard ÷0 → 0. */
export function sharePercent(valueCents: number, totalCents: number): number {
  return totalCents === 0 ? 0 : (valueCents / totalCents) * 100
}

// ── Export CSV (client-side; header pt-BR fiel às 3 medidas derivadas) ──

/** Header pt-BR do CSV de PAGAMENTOS (fiel às 3 medidas derivadas na ordem canônica). */
export const CSV_HEADER = 'Fornecedor;Centro de custo;Categoria;Em atraso;Pago;A pagar'

/** Header pt-BR do CSV de RECEBIMENTOS — rótulos do lado de receber (Financiador · Recebido · A receber). */
export const CSV_HEADER_RECEBIMENTOS = 'Financiador;Centro de custo;Categoria;Em atraso;Recebido;A receber'

/**
 * Monta o CSV: uma linha por FOLHA (raiz → Centro de Custo → Categoria), com as 3 medidas derivadas em BRL,
 * na ordem canônica (Em atraso · Pago/Recebido · A pagar/A receber). Delimitado por ';'. Percorre a árvore
 * agregada até a folha (categoria) — assim as células já são os valores somados por folha (idênticos às
 * linhas cruas). O `header` é parametrizável (Pagamentos vs Recebimentos) — o CORPO é idêntico (só valores).
 */
export function buildCsv(report: PosicaoReport = loadPosicao('p'), header: string = CSV_HEADER): string {
  const lines: string[] = [header]
  for (const supplier of report.suppliers) {
    for (const costCenter of supplier.children) {
      for (const category of costCenter.children) {
        lines.push(
          [
            `"${supplier.name}"`,
            `"${costCenter.name}"`,
            `"${category.name}"`,
            `"${formatBRL(category.measures.emAtrasoCents)}"`,
            `"${formatBRL(category.measures.pagoCents)}"`,
            `"${formatBRL(category.measures.aPagarCents)}"`,
          ].join(';'),
        )
      }
    }
  }
  return lines.join('\r\n')
}
