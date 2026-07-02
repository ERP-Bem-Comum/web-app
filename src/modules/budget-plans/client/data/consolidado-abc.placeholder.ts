/**
 * ⚠️ DADOS PLACEHOLDER (front-first) — NÃO é mock de teste (ADR-0011): é o conteúdo temporário do
 * Consolidado ABC enquanto o core-api NÃO tem `GET /budget-plans/consolidated-result` (HANDBOOK §B). Reproduz
 * com fidelidade visual o relatório (HANDBOOK §2): matriz Centro de Custo → Categoria × meses, categorias
 * com SUFIXO do programa entre parênteses (ex.: "Consultoria Educacional (ETI)"), pois agrega múltiplos
 * programas. Só reflete planos APROVADOS. Centavos.
 *
 * 🔁 TODO(#113): trocar por `consolidated-result.server-fn.ts` + repository + `*.query.ts`. A forma já é
 * `ConsolidatedAbc` (o contrato real), então a substituição é só a origem — a view-model e a view não mudam.
 */
import type { ConsolidatedAbc } from '#modules/budget-plans/client/data/model/consolidado-abc.model.ts'
import type {
  MonthlyCents,
  CostCenterConsolidated,
} from '#modules/budget-plans/client/data/model/plan-detail.model.ts'

/** Monta os 12 meses (Jan…Dez) a partir de pares {mês(1-12): centavos}; resto = 0. Rede não se aplica aqui. */
const months = (values: Readonly<Record<number, number>>): MonthlyCents =>
  Array.from({ length: 12 }, (_, i) => values[i + 1] ?? 0)

const NO_NET: readonly number[] = []

// Valores lineares (mensais iguais) — padrão observado no export do PARC 2026 (HANDBOOK §2).
const linear = (perMonthInCents: number): MonthlyCents =>
  months(Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, perMonthInCents])))

const sum = (m: MonthlyCents): number => m.reduce((acc, v) => acc + v, 0)

/** Soma elemento-a-elemento de séries mensais (12 posições), sem indexação insegura. */
const addMonthly = (series: readonly MonthlyCents[]): MonthlyCents =>
  Array.from({ length: 12 }, (_, i) => series.reduce((acc, m) => acc + (m[i] ?? 0), 0))

// Consultoria (ETI) — 2 categorias com sufixo do programa; valores fiéis ao padrão do mapa.
const consultoriaEducacional = linear(85_000_00) // R$ 85.000,00/mês
const outrasConsultorias = months({ 3: 40_000_00, 6: 40_000_00, 9: 40_000_00, 11: 40_000_00 })

const CC_CONSULTORIA: CostCenterConsolidated = {
  id: 1,
  name: 'Consultoria',
  type: 'A PAGAR',
  totalInCents: sum(consultoriaEducacional) + sum(outrasConsultorias),
  monthlyInCents: addMonthly([consultoriaEducacional, outrasConsultorias]),
  networkInCents: [...NO_NET],
  categories: [
    {
      id: 11,
      name: 'Consultoria Educacional (ETI)',
      totalInCents: sum(consultoriaEducacional),
      monthlyInCents: consultoriaEducacional,
      networkInCents: [...NO_NET],
      subCategories: [],
    },
    {
      id: 12,
      name: 'Outras consultorias (ETI)',
      totalInCents: sum(outrasConsultorias),
      monthlyInCents: outrasConsultorias,
      networkInCents: [...NO_NET],
      subCategories: [],
      iconKind: 'doc',
    },
  ],
}

const avaliacao = months({ 6: 120_000_00, 11: 120_000_00 })
const CC_AVALIACAO: CostCenterConsolidated = {
  id: 4,
  name: 'Avaliação Externa',
  type: 'A PAGAR',
  totalInCents: sum(avaliacao),
  monthlyInCents: avaliacao,
  networkInCents: [...NO_NET],
  iconKind: 'report',
  categories: [
    {
      id: 41,
      name: 'Avaliação (ETI)',
      totalInCents: sum(avaliacao),
      monthlyInCents: avaliacao,
      networkInCents: [...NO_NET],
      subCategories: [],
      iconKind: 'report',
    },
  ],
}

const ETI_CENTERS: readonly CostCenterConsolidated[] = [CC_CONSULTORIA, CC_AVALIACAO]
const etiTotal = ETI_CENTERS.reduce((acc, cc) => acc + cc.totalInCents, 0)

/** 2026 ABC com dados (planos aprovados de ETI). Outros anos = vazio (demonstra "Nenhum resultado"). */
const CONSOLIDATED_2026: ConsolidatedAbc = {
  year: 2026,
  totalInCents: etiTotal,
  subtotalsByProgram: [{ program: 'ETI', totalInCents: etiTotal }],
  costCenters: [...ETI_CENTERS],
}

/**
 * Consolidado placeholder por Ano Base + Programa(s). Filtra por ano (2026 tem dados; demais anos → vazio) e,
 * se `programs` vier preenchido, por sufixo "(PROG)" nas categorias — recalculando os totais/subtotais.
 * Programas sem interseção → resultado vazio.
 */
export const consolidadoAbcPlaceholder = (year: number, programs: readonly string[]): ConsolidatedAbc => {
  const base =
    year === 2026 ? CONSOLIDATED_2026 : { year, totalInCents: 0, subtotalsByProgram: [], costCenters: [] }
  if (programs.length === 0) return { ...base, year }

  const wanted = new Set(programs.map((p) => p.toUpperCase()))
  const matchesProgram = (categoryName: string): boolean => {
    const open = categoryName.lastIndexOf('(')
    const close = categoryName.lastIndexOf(')')
    if (open < 0 || close <= open) return false
    return wanted.has(
      categoryName
        .slice(open + 1, close)
        .trim()
        .toUpperCase(),
    )
  }

  const centers = base.costCenters
    .map((cc) => {
      const categories = cc.categories.filter((cat) => matchesProgram(cat.name))
      const totalInCents = categories.reduce((acc, cat) => acc + cat.totalInCents, 0)
      const monthlyInCents = addMonthly(categories.map((cat) => cat.monthlyInCents))
      return { ...cc, categories, totalInCents, monthlyInCents }
    })
    .filter((cc) => cc.categories.length > 0)

  const totalInCents = centers.reduce((acc, cc) => acc + cc.totalInCents, 0)
  const subtotalsByProgram = base.subtotalsByProgram.filter((s) => wanted.has(s.program.toUpperCase()))
  return { year, totalInCents, subtotalsByProgram, costCenters: centers }
}

/** Programas oferecidos no filtro (distinct dos sufixos do placeholder). 🔁 TODO(#113): virá de GET /programs. */
export const CONSOLIDADO_PROGRAM_OPTIONS: readonly string[] = ['ETI', 'PARC', 'EPV']
