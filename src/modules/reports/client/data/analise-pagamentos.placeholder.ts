/**
 * Dados PLACEHOLDER do relatório "Análise de Pagamentos" (front-first). Matriz TEMPO-orçamentária: árvore
 * Plano Orçamentário → Centro de Custo, cada Centro de Custo com uma SÉRIE MENSAL de valores (agregado por mês
 * de vencimento) em CENTAVOS inteiros (§IV — dinheiro nunca em float). NÃO é um mock de teste (ADR-0011: mocks/
 * doubles só em `tests/`) — são CONSTANTES de domínio que a tela consome enquanto o endpoint do core-api (#114/
 * consolidated) não existe. Quando o backend nascer, a `data/` monta estas linhas do DTO real (mesmo shape).
 *
 * ── PERÍODO ── A série mensal é derivada de um INTERVALO bem-formado `{start,end}` no formato `YYYY-MM`
 *    (mês-01 de cada mês). Os valores mensais são indexados por CHAVE de mês `YYYY-MM` — a ViewModel gera as
 *    chaves iterando o intervalo (nunca `new Date(string)`), evitando o bug de "Invalid Date" do legado.
 * ── DADOS ── SINTÉTICOS/realistas (sem PII): 3 planos, cada um com 2-4 centros de custo, série de 6 meses
 *    (jan–jun/2026) com valores plausíveis. Nem todo mês tem valor (sazonalidade: eventos/avaliações pontuais).
 */

/** Intervalo do período (mês-01), formato `YYYY-MM`. A ViewModel deriva as chaves de mês daqui. */
export type MonthRange = Readonly<{ start: string; end: string }>

/**
 * Período do relatório placeholder: jan–jun/2026 (6 meses). Quando o core-api entregar o DTO, o período virá
 * dos filtros aplicados; aqui é fixo (front-first).
 */
export const ANALISE_PERIOD: MonthRange = { start: '2026-01', end: '2026-06' }

/**
 * Uma linha crua (folha da árvore): Plano Orçamentário → Centro de Custo + os valores por mês (chave `YYYY-MM`
 * → centavos). Chaves ausentes = 0 naquele mês (a ViewModel completa com 0 as chaves do período).
 */
export type RawAnaliseRow = Readonly<{
  plano: string
  costCenter: string
  /** Mapa chave-de-mês (`YYYY-MM`) → valor em centavos. Só os meses com valor precisam constar. */
  monthValues: Readonly<Record<string, number>>
}>

/** Atalho: monta o mapa mensal a partir dos 6 valores (jan..jun/2026) em centavos, na ordem do período. */
const series = (
  jan: number,
  feb: number,
  mar: number,
  apr: number,
  may: number,
  jun: number,
): Readonly<Record<string, number>> => ({
  '2026-01': jan,
  '2026-02': feb,
  '2026-03': mar,
  '2026-04': apr,
  '2026-05': may,
  '2026-06': jun,
})

/**
 * Linhas cruas placeholder — 3 planos orçamentários, cada um com 2-4 centros de custo, série de 6 meses em
 * centavos. Ordem de inserção = ordem de exibição da árvore. Valores realistas de uma ONG de educação (pt-BR).
 */
export const ANALISE_PAGAMENTOS_RAW: readonly RawAnaliseRow[] = [
  // ── PARC — Parceria pela Alfabetização ──
  {
    plano: 'PARC — Parceria pela Alfabetização',
    costCenter: 'Consultoria Estratégica',
    monthValues: series(13798200, 13798200, 14488200, 14488200, 14488200, 14488200),
  },
  {
    plano: 'PARC — Parceria pela Alfabetização',
    costCenter: 'Consultoria de Base',
    monthValues: series(6761850, 6761850, 7031292, 7031292, 7031292, 7031292),
  },
  {
    plano: 'PARC — Parceria pela Alfabetização',
    costCenter: 'Logística de Campo',
    monthValues: series(1730100, 11559510, 7057200, 7057200, 13103340, 5470359),
  },
  // ── ETI — Educação em Tempo Integral ──
  {
    plano: 'ETI — Educação em Tempo Integral',
    costCenter: 'Formação de Equipes Regionais',
    monthValues: series(9048900, 9048900, 9048900, 9048900, 9048900, 9048900),
  },
  {
    plano: 'ETI — Educação em Tempo Integral',
    costCenter: 'Avaliação Diagnóstica',
    monthValues: series(0, 0, 5149986, 0, 0, 5149986),
  },
  {
    plano: 'ETI — Educação em Tempo Integral',
    costCenter: 'Seminários e Eventos',
    monthValues: series(0, 0, 0, 6239550, 0, 5617080),
  },
  {
    plano: 'ETI — Educação em Tempo Integral',
    costCenter: 'Administração',
    monthValues: series(2129133, 2129133, 2129133, 2129133, 2129133, 2129133),
  },
  // ── EPV — Ensino Médio de Percurso Vocacional ──
  {
    plano: 'EPV — Ensino Médio de Percurso Vocacional',
    costCenter: 'Consultoria Temática',
    monthValues: series(4374999, 4374999, 4374999, 4374999, 4374999, 4374999),
  },
  {
    plano: 'EPV — Ensino Médio de Percurso Vocacional',
    costCenter: 'Material Didático',
    monthValues: series(0, 0, 8250000, 0, 8250000, 0),
  },
]
