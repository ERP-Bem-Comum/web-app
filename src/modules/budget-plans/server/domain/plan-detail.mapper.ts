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
export const mapPlanDetail = (
  header: PlanDetailHeaderInput,
  costStructure: CostStructureInput,
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
    // #394: colunas "Por Rede" a partir dos orçamentos reais (id por índice; nome = ref até resolver rótulo).
    networks: header.budgets.map((b, i) => ({
      id: i,
      name: b.partnerRef,
      ref: b.partnerRef,
      kind: b.partnerKind,
      budgetId: b.budgetId,
      totalInCents: b.valueInCents,
    })),
    costCenters,
  }
}

// #C2: preenche `networkInCents` da matriz "Por Rede" com os resultados de cálculo. `resultsPerNetwork` está
// ALINHADO por índice a `detail.networks` (cada item = os resultados daquela rede). Preenche a subcategoria
// pelo `ref` (UUID) e faz o ROLL-UP (categoria = Σ subs; centro = Σ categorias; total do nó = Σ redes).
export const fillNetworkCells = (
  detail: PlanDetailComposed,
  resultsPerNetwork: readonly (readonly BudgetResultRow[])[],
): PlanDetailComposed => {
  const maps = resultsPerNetwork.map((rows) => new Map(rows.map((r) => [r.subcategoryRef, r.valueInCents])))
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
