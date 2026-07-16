/**
 * Mapper PURO (§II sem throw, §XI lógica no domínio) do DETALHE do Plano Orçamentário: compõe o cabeçalho
 * (`GET /budget-plans/:id`) + a árvore de estrutura de custo (`GET /:id/cost-structure`) no `PlanDetailComposed`
 * que o BFF entrega pronto. Sem I/O, sem framework — 100% testável por node:test.
 *
 * Regras (decisões da feature 059):
 *   1. IDs de nó NUMÉRICOS sintéticos por índice (o uuid do backend é descartado nesta fase de leitura):
 *      centro = i+1; categoria = centroId*100 + j+1; sub = categoriaId*100 + k+1. Únicos/estáveis entre
 *      irmãos e em toda a árvore (o front usa `id: number` como chave de render).
 *   2. Valores = 0 (SÓ estrutura/nomes): `monthlyInCents` = 12 zeros, `networkInCents` = [], totais de nó = 0.
 *      O `totalInCents` do CABEÇALHO usa o REAL do `GET /:id` (plano-level; plano novo = 0). `networks` = [].
 *   3. `version` string → number (float legado; inválida → 1). `programAbbreviation`/`scenarioName` = null.
 *   4. Enums TOLERANTES por lookup: `direction` → `type` (desconhecido → 'A PAGAR'); `launchType` →
 *      `releaseType` (desconhecido → OMITE `releaseType`, respeitando `exactOptionalPropertyTypes`).
 */
import type {
  CostCenterConsolidated,
  CostCenterType,
  CostStructureInput,
  PlanDetailComposed,
  PlanDetailHeaderInput,
  ReleaseType,
  BudgetResultRow,
} from '#modules/budget-plans/server/domain/plan-detail.io.ts'

/** 12 zeros (série mensal nesta fase — só estrutura, sem valores). Novo array por nó (imutabilidade §VII). */
const zeros12 = (): readonly number[] => Array.from({ length: 12 }, () => 0)

// version "1.0" → 1.0 (float legado). String inválida → 1 (fail-soft; espelha o `parseVersion` da lista).
const parseVersion = (v: string): number => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 1
}

/** Normaliza um rótulo p/ lookup tolerante: minúsculas, sem acento, sem separadores/espaços. */
const normalize = (raw: string): string =>
  raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/gu, '') // remove diacríticos (combining marks)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // remove espaços, hífens, underscores, etc.

// ── direction → CostCenterType (tolerante a A-PAGAR/A_PAGAR/"A PAGAR"/APAGAR e variações de A RECEBER). ──
const DIRECTION_FALLBACK: CostCenterType = 'A PAGAR'

/** direction cru → tipo do centro. Reconhece "a receber" (→ A RECEBER); qualquer outra coisa → 'A PAGAR'. */
export const mapDirection = (direction: string): CostCenterType => {
  const key = normalize(direction)
  if (key.includes('areceber') || key.includes('receber')) return 'A RECEBER'
  if (key.includes('apagar') || key.includes('pagar')) return 'A PAGAR'
  return DIRECTION_FALLBACK
}

// ── launchType → ReleaseType (dicionário tolerante). Desconhecido → undefined (OMITE releaseType). ──
/** launchType cru → modelo de cálculo, ou `undefined` quando não casa nenhum sinal conhecido. */
export const mapLaunchType = (launchType: string): ReleaseType | undefined => {
  const key = normalize(launchType)
  if (key.includes('pessoal') || key.includes('pessoais') || key.includes('folha')) return 'DESPESAS_PESSOAIS'
  if (key.includes('ipca')) return 'IPCA'
  if (key.includes('caed') || key.includes('matricula')) return 'CAED'
  if (key.includes('logistic') || key.includes('viagem')) return 'DESPESAS_LOGISTICAS'
  return undefined
}

/** Compõe o detalhe pronto (§III: o BFF entrega o `PlanDetail` já montado; o client não compõe). */
/**
 * Chave do mapa de nomes de rede. Composta por (kind, ref) DE PROPÓSITO: `ref` é chave natural em DOIS
 * espaços diferentes — UF pra estado, código IBGE pra município. Chavear só por `ref` misturaria os dois.
 */
export const networkNameKey = (kind: string, ref: string): string => `${kind}:${ref}`

/**
 * (kind, ref) → rótulo da rede, montado do catálogo (`GET /options`). Carrega `uf` além do nome porque o
 * filtro do detalhe agrupa MUNICÍPIOS por ESTADO (como no legado) — e a `ref` de um município é o código
 * IBGE, que não diz de que estado ele é.
 */
export type NetworkNames = ReadonlyMap<string, Readonly<{ name: string; uf: string }>>

export const mapPlanDetail = (
  header: PlanDetailHeaderInput,
  costStructure: CostStructureInput,
  networkNames?: NetworkNames,
): PlanDetailComposed => {
  const costCenters: readonly CostCenterConsolidated[] = costStructure.costCenters.map((cc, i) => {
    const centerId = i + 1
    return {
      id: centerId,
      ref: cc.id, // UUID do backend (feature 061 — o POST de categoria referencia o centro-pai por UUID)
      name: cc.name,
      type: mapDirection(cc.direction),
      totalInCents: 0,
      monthlyInCents: zeros12(),
      networkInCents: [],
      categories: cc.categories.map((cat, j) => {
        const categoryId = centerId * 100 + (j + 1)
        return {
          id: categoryId,
          ref: cat.id, // UUID do backend (→ o POST de subcategoria referencia a categoria-pai por UUID)
          name: cat.name,
          totalInCents: 0,
          monthlyInCents: zeros12(),
          networkInCents: [],
          subCategories: cat.subcategories.map((sub, k) => {
            const releaseType = mapLaunchType(sub.launchType)
            return {
              id: categoryId * 100 + (k + 1),
              ref: sub.id, // #394/C2: UUID do backend → casa com `budget-results.subcategoryId` no cálculo
              name: sub.name,
              totalInCents: 0,
              monthlyInCents: zeros12(),
              networkInCents: [],
              // exactOptionalPropertyTypes: só inclui a chave quando o launchType casa.
              ...(releaseType !== undefined ? { releaseType } : {}),
            }
          }),
        }
      }),
    }
  })

  return {
    id: header.id,
    year: header.year,
    programName: header.programName,
    programAbbreviation: null, // não vem no detalhe nesta fase (join de options fica na lista)
    version: parseVersion(header.version),
    scenarioName: null, // cenários/versões-filhas: core-api#317/#318
    status: header.status,
    totalInCents: header.totalInCents, // real do GET /:id (plano-level; plano novo = 0)
    // #394: colunas "Por Rede" a partir dos orçamentos reais (id por índice). O NOME sai do catálogo de redes
    // (`GET /options`, que devolve `{kind, ref, name}`); sem ele a coluna mostraria a chave natural CRUA — 'CE'
    // no lugar de "Ceará", e o código IBGE ('2304400') no lugar de "Fortaleza", que é ilegível. Ausente do mapa
    // → cai no `ref`: degradado, mas honesto (mostra a chave, não um nome inventado).
    networks: header.budgets.map((b, i) => ({
      id: i,
      name: networkNames?.get(networkNameKey(b.partnerKind, b.partnerRef))?.name ?? b.partnerRef,
      // Fora do catálogo: no ESTADO a própria `ref` É a UF; no município não há como adivinhar → ''.
      uf:
        networkNames?.get(networkNameKey(b.partnerKind, b.partnerRef))?.uf ??
        (b.partnerKind === 'state' ? b.partnerRef : ''),
      ref: b.partnerRef,
      kind: b.partnerKind,
      budgetId: b.budgetId,
      totalInCents: b.valueInCents,
    })),
    costCenters,
  }
}

/**
 * #C2: preenche `networkInCents` da matriz "Por Rede" com os resultados de cálculo. `resultsPerNetwork` está
 * ALINHADO por índice a `detail.networks` (cada item = os resultados daquela rede). Preenche a subcategoria
 * pelo `ref` (UUID) e faz o ROLL-UP (categoria = Σ subs; centro = Σ categorias; total do nó = Σ redes).
 *
 * ⚠️ O ANUAL da rede é a **soma dos 12 meses** (core-api#413). Isto era um `new Map(rows.map(...))`, que com
 * chave repetida **sobrescreve**: quando o backend passou a devolver 12 linhas por subcategoria (uma por mês),
 * o "Por Rede" mostraria o valor do ÚLTIMO mês como se fosse o anual — em silêncio, sem erro. Agora soma.
 */
export const fillNetworkCells = (
  detail: PlanDetailComposed,
  resultsPerNetwork: readonly (readonly BudgetResultRow[])[],
): PlanDetailComposed => {
  const maps = resultsPerNetwork.map((rows) =>
    rows.reduce(
      (acc, r) => acc.set(r.subcategoryRef, (acc.get(r.subcategoryRef) ?? 0) + r.valueInCents),
      new Map<string, number>(),
    ),
  )
  const nets = detail.networks.map((_, i) => i)
  const sumCols = (rows: readonly (readonly number[])[]): number[] =>
    nets.map((i) => rows.reduce((acc, r) => acc + (r[i] ?? 0), 0))
  const total = (cols: readonly number[]): number => cols.reduce((a, b) => a + b, 0)

  const costCenters = detail.costCenters.map((cc) => {
    const categories = cc.categories.map((cat) => {
      const subCategories = cat.subCategories.map((sub) => {
        const cells = nets.map((i) => maps[i]?.get(sub.ref) ?? 0)
        return { ...sub, networkInCents: cells, totalInCents: total(cells) }
      })
      const cells = sumCols(subCategories.map((s) => s.networkInCents))
      return { ...cat, subCategories, networkInCents: cells, totalInCents: total(cells) }
    })
    const cells = sumCols(categories.map((c) => c.networkInCents))
    return { ...cc, categories, networkInCents: cells, totalInCents: total(cells) }
  })
  return { ...detail, costCenters }
}

/**
 * #413: preenche `monthlyInCents` (12 posições, Jan..Dez) com os lançamentos de **UMA** rede — é o que a
 * EDIÇÃO de Orçamento (HANDBOOK §1.7) mostra: a matriz Categorias × 12 meses daquela rede.
 *
 * Difere do `fillNetworkCells`, que agrega o ANUAL por rede (colunas = redes). Aqui as colunas são MESES e a
 * rede é uma só — por isso a Edição tem cadeia própria (§III: uma fn completa por caso de uso).
 *
 * `month` vem 1..12 do core-api e vira índice 0..11. Mês fora da faixa é IGNORADO (o schema já valida na
 * borda; aqui é defesa em profundidade — um índice inválido corromperia a série silenciosamente).
 * Roll-up: categoria = Σ subs por mês; centro = Σ categorias por mês; `totalInCents` do nó = Σ dos 12.
 */
export const fillMonthlyCells = (
  detail: PlanDetailComposed,
  rows: readonly BudgetResultRow[],
): PlanDetailComposed => {
  // subcategoryRef → série de 12 meses (soma: o mesmo (sub, mês) não deve repetir — o backend tem UNIQUE —,
  // mas somar é o comportamento correto se repetir, e não perde dado como um `set` perderia.
  const bySub = new Map<string, number[]>()
  for (const r of rows) {
    if (!Number.isInteger(r.month) || r.month < 1 || r.month > 12) continue
    const serie = bySub.get(r.subcategoryRef) ?? zeros12().slice()
    serie[r.month - 1] = (serie[r.month - 1] ?? 0) + r.valueInCents
    bySub.set(r.subcategoryRef, serie)
  }

  const sumSeries = (series: readonly (readonly number[])[]): number[] =>
    Array.from({ length: 12 }, (_, m) => series.reduce((acc, s) => acc + (s[m] ?? 0), 0))
  const total = (serie: readonly number[]): number => serie.reduce((a, b) => a + b, 0)

  const costCenters = detail.costCenters.map((cc) => {
    const categories = cc.categories.map((cat) => {
      const subCategories = cat.subCategories.map((sub) => {
        const serie = bySub.get(sub.ref) ?? zeros12()
        return { ...sub, monthlyInCents: serie, totalInCents: total(serie) }
      })
      const serie = sumSeries(subCategories.map((s) => s.monthlyInCents))
      return { ...cat, subCategories, monthlyInCents: serie, totalInCents: total(serie) }
    })
    const serie = sumSeries(categories.map((c) => c.monthlyInCents))
    return { ...cc, categories, monthlyInCents: serie, totalInCents: total(serie) }
  })

  return { ...detail, costCenters }
}

/**
 * INTERINO (core-api#458): deriva o TOTAL do plano e o de cada rede dos LANÇAMENTOS já preenchidos na matriz.
 *
 * Por que existe: `bgp_budgets.value_cents` está **0** para toda rede — o core-api guarda o total como campo
 * e nunca o deriva dos lançamentos. Resultado em tela: "Total Orçamento: R$ 0,00" ao lado de uma grade
 * somando R$ 149.879,22 (achado da P.O.). A verdade chega no MESMO payload; exibir zero seria mentir com o
 * dado certo na mão.
 *
 * Não é fórmula nova: é a mesma que o #458 pede ao backend (total = Σ lançamentos). Quando o core-api
 * derivar, o número dele e este coincidem — e esta função vira redundante, não conflitante.
 *
 * ⚠️ Só vale onde os lançamentos foram carregados (detalhe/edição). A LISTA não os busca, então o total de
 * lá continua vindo do core-api — e continua 0 até o #458. A divergência é conhecida e é do backend.
 *
 * Chamar SEMPRE depois de `fillNetworkCells` (é dele que saem as células por rede).
 */
export const deriveTotalsFromCells = (detail: PlanDetailComposed): PlanDetailComposed => {
  const perNetwork = detail.networks.map((_, i) =>
    detail.costCenters.reduce((acc, cc) => acc + (cc.networkInCents[i] ?? 0), 0),
  )
  const planTotal = perNetwork.reduce((a, b) => a + b, 0)
  return {
    ...detail,
    totalInCents: planTotal,
    networks: detail.networks.map((n, i) => ({ ...n, totalInCents: perNetwork[i] ?? 0 })),
  }
}
