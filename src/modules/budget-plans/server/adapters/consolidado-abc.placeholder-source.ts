/**
 * ⚠️ FONTE PLACEHOLDER (front-first) — NÃO é mock de teste (ADR-0011). É o conteúdo INTERINO do Consolidado
 * ABC no BFF enquanto o core-api `GET /budget-plans/consolidated-result` NÃO existe. Os dados reproduzem a
 * amostra oficial (`HANDBOOK-plano-orcamentario-consolidado-abc-export-exemplo.csv`): serializados por
 * `consolidatedAbcToCsv`, produzem EXATAMENTE aquele CSV (é o critério de aceite). Valores em centavos (§IV).
 *
 * 🔁 INTERINO (troca única): quando o endpoint fechar, substitui-se SÓ esta fonte pela chamada real ao core
 * (validada por `parseConsolidatedResult`). O serializador e a server fn permanecem intactos.
 *
 * A fonte parseia o RAW pela MESMA borda Zod (`parseConsolidatedResult`) que validará a resposta real do
 * core — garante que o placeholder conforma ao contrato e exercita o caminho de mapeamento futuro.
 */
import type {
  ConsolidatedAbc,
  CostCenterConsolidated,
} from '#modules/budget-plans/server/domain/consolidado-abc.io.ts'
import { parseConsolidatedResult } from '#modules/budget-plans/server/adapters/core-api/consolidado-result.schema.ts'

/** Monta um Centro de Custo com uma única Categoria (padrão do export PARC 2026 do handbook). */
const singleCategoryCenter = (
  name: string,
  categoryName: string,
  monthlyInCents: readonly number[],
  totalInCents: number,
): CostCenterConsolidated => ({
  name,
  totalInCents,
  monthlyInCents,
  categories: [{ name: categoryName, totalInCents, monthlyInCents, subCategories: [] }],
})

// Centros de custo na MESMA ordem do handbook (não ordenado). Meses Jan…Dez em centavos.
const COST_CENTERS: readonly CostCenterConsolidated[] = [
  singleCategoryCenter(
    'CONSULTORIA ESTRATÉGICA',
    '1. CONSULTORIA ESTRATÉGICA (PARC)',
    [
      85_622_900, 85_622_900, 89_355_920, 89_327_920, 89_327_920, 89_327_920, 89_327_920, 89_327_920,
      89_327_920, 89_327_920, 89_327_920, 89_327_920,
    ],
    1_064_553_000,
  ),
  singleCategoryCenter(
    'ADMINISTRAÇÃO',
    '8. ADMINISTRAÇÃO (PARC)',
    [
      2_600_176, 1_929_064, 3_312_306, 2_629_064, 3_300_176, 2_629_064, 3_300_176, 3_054_413, 2_629_064,
      3_087_502, 1_929_064, 1_929_064,
    ],
    32_329_133,
  ),
  singleCategoryCenter(
    'EVENTOS',
    '6. EVENTOS (PARC)',
    [0, 0, 0, 20_798_500, 0, 18_723_600, 0, 20_798_500, 0, 0, 0, 0],
    60_320_600,
  ),
  singleCategoryCenter(
    'CONSULTORIA DE BASE',
    '3. CONSULTORIA DE BASE (PARC)',
    [
      22_539_500, 22_539_500, 23_441_080, 23_441_080, 23_441_080, 23_441_080, 23_441_080, 23_441_080,
      23_441_080, 23_441_080, 23_441_080, 23_441_080,
    ],
    279_489_800,
  ),
  singleCategoryCenter(
    'CONSULTORIA TEMÁTICA',
    '2. CONSULTORIA TEMÁTICA (PARC)',
    [
      29_654_333, 29_654_333, 29_654_333, 29_654_333, 29_654_333, 29_654_333, 29_654_333, 29_654_333,
      29_654_333, 29_654_333, 29_654_333, 29_654_333,
    ],
    355_851_996,
  ),
  singleCategoryCenter(
    'LOGÍSTICA',
    '4. LOGÍSTICA (PARC)',
    [
      5_767_734, 38_531_734, 23_577_333, 23_577_333, 43_677_734, 18_234_533, 30_629_334, 18_816_133,
      23_577_333, 19_433_733, 22_378_133, 26_485_733,
    ],
    294_686_800,
  ),
  singleCategoryCenter(
    'AVALIAÇÃO',
    '5. AVALIAÇÃO (PARC)',
    [0, 0, 219_131_626, 0, 0, 219_131_626, 0, 0, 28_487_111, 0, 28_487_111, 0],
    495_237_474,
  ),
]

const GRAND_TOTAL_IN_CENTS = 2_582_468_803

const RAW: ConsolidatedAbc = {
  year: 2026,
  totalInCents: GRAND_TOTAL_IN_CENTS,
  subtotalsByProgram: [{ program: 'PARC', totalInCents: GRAND_TOTAL_IN_CENTS }],
  costCenters: COST_CENTERS,
}

const EMPTY: ConsolidatedAbc = { year: RAW.year, totalInCents: 0, subtotalsByProgram: [], costCenters: [] }

/**
 * Consolidado ABC INTERINO. Devolve os dados do handbook (validados pela borda Zod). O filtro por
 * Ano Base × Programa passa a ser server-side quando o core-api fechar o endpoint (por ora, a amostra fixa).
 */
export const consolidadoAbcPlaceholderSource = (): ConsolidatedAbc => parseConsolidatedResult(RAW) ?? EMPTY
