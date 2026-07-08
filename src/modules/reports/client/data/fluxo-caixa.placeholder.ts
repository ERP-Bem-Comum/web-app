/**
 * Dados PLACEHOLDER do relatório "Fluxo de Caixa" (front-first). É um espelho do relatório legado do
 * ERP-BACKEND (`reports/services/cashflow-report.service.ts`): DUAS seções — **Saídas** (payables +
 * movimentação de cartão) e **Entradas** (receivables) — cada uma em árvore Categoria → Subcategoria (folha),
 * com 2 MEDIDAS por folha em CENTAVOS inteiros (§IV — dinheiro nunca em float):
 *   • Realizado (REALIZED) = valor efetivado.
 *   • Previsto  (EXPECTED) = valor previsto (a realizar).
 *
 * Cada folha carrega também o MÊS de vencimento (`month`, chave `YYYY-MM`) — a série mensal do gráfico "por
 * vencimento" é derivada daí, iterando o intervalo do período por ÍNDICE/ORDINAL (NUNCA `new Date(string)` —
 * o bug "Invalid Date" do legado que não reproduzimos). A ViewModel só EXIBE; não deriva domínio.
 *
 * NÃO é um mock de teste (ADR-0011: mocks/doubles só em `tests/`) — são CONSTANTES de domínio SINTÉTICAS
 * (nomes pt-BR fictícios, sem PII) que a tela consome enquanto o endpoint do core-api (#114) não existe.
 *
 * ⚠️ ENTRADAS = receivables. O Contas a Receber ainda não subiu (core-api#114/receivables); as linhas de
 * Entradas abaixo são um placeholder MÍNIMO só para VALIDAR a seção e o Saldo. Quando o A-Receber nascer,
 * troque `FLUXO_ENTRADAS_RAW` por `[]` (ou pela fonte real): a seção Entradas cai LIMPA no empty state
 * ("Nenhuma entrada registrada") SEM quebrar Saídas nem o Saldo (que passa a ser 0 − Saídas).
 */

/** Intervalo do período (mês-01), formato `YYYY-MM`. A ViewModel deriva as chaves de mês daqui. */
export type MonthRange = Readonly<{ start: string; end: string }>

/** Período do relatório placeholder: jan–jun/2026 (6 meses). Front-first (viria dos filtros no backend). */
export const FLUXO_PERIOD: MonthRange = { start: '2026-01', end: '2026-06' }

/**
 * Uma linha CRUA = uma FOLHA da árvore de uma seção (Categoria → Subcategoria) + o mês de vencimento + o
 * Centro de Custo + as 2 medidas. Várias folhas podem compartilhar Categoria/Subcategoria em meses diferentes
 * — a árvore soma; o gráfico "linha do tempo" agrupa por `month`; o gráfico "por Centro de Custo" agrupa por
 * `costCenter`. O `costCenter` é a dimensão de DESPESA (rótulos sintéticos, sem PII — LGPD ok); nas Entradas
 * carrega um rótulo de captação/gestão só para manter o shape uniforme (o gráfico de CC agrega as Saídas).
 */
export type RawFluxoLeaf = Readonly<{
  category: string
  subcategory: string
  /** Mês de vencimento (`YYYY-MM`) — fonte da série "linha do tempo" e da série mensal por vencimento. */
  month: string
  /** Centro de Custo (dimensão de despesa) — fonte do gráfico "Agrupado por Centro de Custo". */
  costCenter: string
  realizedCents: number
  expectedCents: number
}>

/**
 * SAÍDAS — payables + movimentação de cartão. 4 categorias (Pessoal, Operacional, Cartão Corporativo,
 * Serviços de Terceiros), folhas espalhadas por jan–jun/2026 (o gráfico por vencimento fica populado em todos
 * os meses) e mapeadas a Centros de Custo sintéticos (Analistas, Hospedagem, Passagens, Plataformas,
 * Despesas, Manutenção, Especialista, Gestor). Valores realistas de uma ONG de educação (pt-BR).
 */
export const FLUXO_SAIDAS_RAW: readonly RawFluxoLeaf[] = [
  // ── Pessoal ──
  {
    category: 'Pessoal',
    subcategory: 'Salários',
    month: '2026-01',
    costCenter: 'Analistas',
    realizedCents: 8_500_000,
    expectedCents: 8_500_000,
  },
  {
    category: 'Pessoal',
    subcategory: 'Encargos',
    month: '2026-01',
    costCenter: 'Analistas',
    realizedCents: 3_200_000,
    expectedCents: 3_400_000,
  },
  {
    category: 'Pessoal',
    subcategory: 'Benefícios',
    month: '2026-02',
    costCenter: 'Especialista',
    realizedCents: 1_450_000,
    expectedCents: 1_500_000,
  },
  // ── Operacional ──
  {
    category: 'Operacional',
    subcategory: 'Aluguel',
    month: '2026-02',
    costCenter: 'Hospedagem',
    realizedCents: 2_400_000,
    expectedCents: 2_400_000,
  },
  {
    category: 'Operacional',
    subcategory: 'Serviços de TI',
    month: '2026-03',
    costCenter: 'Plataformas',
    realizedCents: 1_890_000,
    expectedCents: 2_100_000,
  },
  {
    category: 'Operacional',
    subcategory: 'Materiais de Escritório',
    month: '2026-03',
    costCenter: 'Despesas',
    realizedCents: 640_000,
    expectedCents: 700_000,
  },
  {
    category: 'Operacional',
    subcategory: 'Energia e Água',
    month: '2026-04',
    costCenter: 'Despesas',
    realizedCents: 820_000,
    expectedCents: 900_000,
  },
  // ── Cartão Corporativo (movimentação de cartão) ──
  {
    category: 'Cartão Corporativo',
    subcategory: 'Viagens e Deslocamento',
    month: '2026-04',
    costCenter: 'Passagens',
    realizedCents: 1_260_000,
    expectedCents: 1_400_000,
  },
  {
    category: 'Cartão Corporativo',
    subcategory: 'Assinaturas de Software',
    month: '2026-05',
    costCenter: 'Plataformas',
    realizedCents: 540_000,
    expectedCents: 540_000,
  },
  {
    category: 'Cartão Corporativo',
    subcategory: 'Alimentação em Campo',
    month: '2026-05',
    costCenter: 'Passagens',
    realizedCents: 380_000,
    expectedCents: 420_000,
  },
  // ── Serviços de Terceiros ──
  {
    category: 'Serviços de Terceiros',
    subcategory: 'Manutenção Predial',
    month: '2026-03',
    costCenter: 'Manutenção',
    realizedCents: 720_000,
    expectedCents: 800_000,
  },
  {
    category: 'Serviços de Terceiros',
    subcategory: 'Consultoria Jurídica',
    month: '2026-06',
    costCenter: 'Gestor',
    realizedCents: 2_100_000,
    expectedCents: 2_100_000,
  },
  {
    category: 'Serviços de Terceiros',
    subcategory: 'Auditoria Externa',
    month: '2026-06',
    costCenter: 'Gestor',
    realizedCents: 1_500_000,
    expectedCents: 1_800_000,
  },
]

/**
 * ENTRADAS — receivables. Placeholder MÍNIMO (3 folhas) só para validar a seção + o Saldo. Quando o Contas a
 * Receber (core-api#114/receivables) subir, troque por `[]` → a seção cai no empty state honesto SEM quebrar
 * Saídas/Saldo. Ver o header deste arquivo. O `costCenter` aqui é só um rótulo de captação/gestão (o gráfico
 * "por Centro de Custo" agrega as SAÍDAS — dimensão de despesa).
 */
export const FLUXO_ENTRADAS_RAW: readonly RawFluxoLeaf[] = [
  {
    category: 'Doações e Convênios',
    subcategory: 'Convênio Federal',
    month: '2026-02',
    costCenter: 'Captação',
    realizedCents: 12_000_000,
    expectedCents: 12_000_000,
  },
  {
    category: 'Doações e Convênios',
    subcategory: 'Doação Pessoa Jurídica',
    month: '2026-04',
    costCenter: 'Captação',
    realizedCents: 3_500_000,
    expectedCents: 4_000_000,
  },
  {
    category: 'Rendimentos',
    subcategory: 'Aplicações Financeiras',
    month: '2026-05',
    costCenter: 'Gestão Financeira',
    realizedCents: 480_000,
    expectedCents: 500_000,
  },
]
