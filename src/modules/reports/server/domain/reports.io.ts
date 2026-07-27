/**
 * Relatórios (#114) — tipos de I/O do domínio (PUROS, sem Zod — §VI). O BFF entrega a resposta COMPLETA
 * por caso de uso (§III, ADR-0010) para cada um dos 3 endpoints de LEITURA do core-api `/api/v2/reports`.
 * A UI consome como server-state. Os schemas Zod da resposta crua vivem na borda
 * (`../adapters/core-api/reports.schema.ts`), nunca aqui (§IX).
 *
 * NOTA de dinheiro: diferente do Financeiro (money = string de centavos), estes endpoints já entregam os
 * `*Cents` como **number** — o Model mantém number (§IV: centavos inteiros).
 */

/**
 * Membro da equipe (relatório Equipe ABC — LGPD-safe, sem demografia). `program`/`education` e
 * `experienceInPublicSector` são nullable; os demais campos são string livre do backend.
 */
export type TeamMember = Readonly<{
  id: string
  name: string
  program: string | null
  role: string
  employmentRelationship: string
  startOfContract: string
  registrationStatus: string
  active: boolean
  education: string | null
  experienceInPublicSector: boolean | null
}>

/**
 * Uma fatia de distribuição demográfica (core-api#477). `id` é a chave CANÔNICA e estável
 * (`MULHER_CIS`, `INDIGENA`, `ATE_29`, `OUTROS`, `NA`); `label` é o texto PT-BR já pronto para exibição.
 *
 * O `label` viaja junto de propósito: era o front que mantinha o mapa id→label, e era ele que
 * **descartava em silêncio** o `INDIGENA` e 5 das 8 identidades de gênero (a lista canônica local só
 * conhecia 3). Com o rótulo vindo da API, categoria nova aparece sozinha — sem release de front.
 */
export type CategoryCount = Readonly<{
  id: string
  label: string
  count: number
}>

/**
 * Distribuições demográficas agregadas da equipe (`GET /reports/team/demographics`).
 *
 * Só ESTATÍSTICA cruza a fronteira — raça, identidade de gênero e data de nascimento nunca saem como
 * linha por pessoa (decisão da P.O., Opção A). Sem k-anonimato (P.O. 2026-07-20): a contagem é a real.
 *
 * **Invariante do backend:** a soma dos `count` de cada dimensão == `totalActive`. Valor fora da lista
 * canônica cai no balde `OUTROS` e continua somando — ninguém some da distribuição.
 */
export type TeamDemographics = Readonly<{
  totalActive: number
  gender: readonly CategoryCount[]
  ageRange: readonly CategoryCount[]
  race: readonly CategoryCount[]
}>

/** Fornecedor sem contrato: total AGREGADO pago sem contrato + contagem de títulos. `name` nullable. */
export type SupplierWithoutContract = Readonly<{
  supplierRef: string
  name: string | null
  totalCents: number
  payableCount: number
}>

/**
 * Posição de pagamentos: uma linha da matriz fornecedor × centro de custo × categoria com os 3 buckets
 * (pendente/pago/atrasado). Todas as dimensões (refs e nomes) são nullable; os `*Cents` são number.
 */
export type PaymentPosition = Readonly<{
  supplierRef: string | null
  supplierName: string | null
  costCenterRef: string | null
  costCenterName: string | null
  categoryRef: string | null
  categoryName: string | null
  pendingCents: number
  paidCents: number
  overdueCents: number
}>

/**
 * Análise de Pagamentos (#446 · GET /reports/analysis/payables) — matriz TEMPO-orçamentária: árvore Plano
 * Orçamentário → Centro de Custo, cada nó com uma SÉRIE MENSAL PRÓPRIA (`itens`: `monthYear` → `total`). Os
 * `total` estão em CENTAVOS inteiros (number). `id`/`name` são nullable: `name` null → "Sem plano" / "Sem
 * centro de custo" na UI (o mapeamento p/ rótulo é do client). O client re-agrega no shape da tela (AnaliseReport).
 */
export type PaymentAnalysisMonthCell = Readonly<{ monthYear: string; total: number }>
export type PaymentAnalysisCostCenter = Readonly<{
  id: string | null
  name: string | null
  total: number
  itens: readonly PaymentAnalysisMonthCell[]
}>
export type PaymentAnalysisPlan = Readonly<{
  id: string | null
  name: string | null
  total: number
  itens: readonly PaymentAnalysisMonthCell[]
  costCenters: readonly PaymentAnalysisCostCenter[]
}>
export type PaymentAnalysis = Readonly<{
  totalValueOfPeriod: number
  data: readonly PaymentAnalysisPlan[]
}>

/**
 * Filtros de consulta da Análise de Pagamentos (#446). Janela de vencimento HALF-OPEN [dueStart, dueEnd)
 * (`dueEnd` EXCLUSIVO) em `YYYY-MM-DD`; `status` opcional (string livre no backend).
 */
export type PaymentAnalysisQuery = Readonly<{
  dueStart: string
  dueEnd: string
  status?: string
}>

/**
 * Realizado × Planejado (`GET /reports/realized`) — filtros de consulta. `year` obrigatório; os demais
 * recortam a árvore (programa, plano orçamentário, UF/município do parceiro). Refs são string opaca.
 */
export type RealizedReportQuery = Readonly<{
  year: number
  programId?: string
  budgetPlanId?: string
  partnerStateId?: string
  partnerMunicipalityId?: string
}>

/**
 * Célula mensal do Realizado × Planejado. `month` já vem CONVERTIDO para 0..11 (janeiro=0) — o backend
 * entrega 1..12 e o mapper subtrai 1. Todos os valores são centavos inteiros (number).
 */
export type RealizedMonthCell = Readonly<{
  month: number
  planejadoCents: number
  realizadoCents: number
  provisionadoCents: number
}>

/**
 * Linha ACHATADA do Realizado × Planejado — uma por subcategoria folha (ou, quando a categoria não tem
 * subcategorias, uma linha com `subcategoria: ''`). O BFF achata a árvore centro→categoria→subcategoria;
 * o client re-agrega. `months` traz sempre as 12 células (janeiro..dezembro).
 */
export type RealizedBudgetRow = Readonly<{
  centroCusto: string
  categoria: string
  subcategoria: string
  months: readonly RealizedMonthCell[]
}>
