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
 * Status filtrável da Posição de Pagamentos (core-api#588) — enum FECHADO de 6 valores. NÃO inclui
 * `Draft`/`Refused` (decisão da P.O.: o relatório não recorta por rascunho/recusado).
 */
export type PaymentPositionStatus =
  | 'Open'
  | 'Approved'
  | 'Transmitted'
  | 'Paid'
  | 'PartiallyReconciled'
  | 'Reconciled'

/**
 * Filtros de consulta da Posição de Pagamentos (core-api#588 · GET /reports/payment-position). TODOS
 * opcionais e combinados por AND no servidor; refs são UUID opaco. `dueFrom`/`dueTo` = janela HALF-OPEN
 * [dueFrom, dueTo) em `YYYY-MM-DD` (o `dueTo` é EXCLUSIVO no backend). Ausente = sem recorte por aquele campo.
 */
export type PaymentPositionFilter = Readonly<{
  budgetPlanRef?: string
  cedenteAccountRef?: string
  costCenterRef?: string
  categoryRef?: string
  subcategoryRef?: string
  supplierRef?: string
  dueFrom?: string
  dueTo?: string
  status?: PaymentPositionStatus
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

/**
 * Fluxo de Caixa (#590 · GET /reports/cashflow + /cashflow/chart). O core-api agrega as SAÍDAS (payables)
 * por Categoria × Subcategoria em 2 baldes: `realizedCents` (status Paid) e `expectedCents` (Open/Approved).
 * NÃO há eixo de Centro de Custo (CC é filtro que restringe a população, não dimensão de saída — CA6). Os
 * `*Cents` são number (§IV). `*Ref`/`*Name` são nullable ("Sem categoria"/"Sem subcategoria" na UI).
 */
export type CashflowRow = Readonly<{
  categoryRef: string | null
  categoryName: string | null
  subcategoryRef: string | null
  subcategoryName: string | null
  realizedCents: number
  expectedCents: number
}>

/** Linha da SÉRIE TEMPORAL (Slice B) — a mesma linha do Slice A com o mês de vencimento `YYYY-MM`. */
export type CashflowChartRow = CashflowRow & Readonly<{ dueMonth: string }>

/**
 * Corte por Centro de Custo (eixo do 4º gráfico do legado). O #590 NÃO devolve CC como eixo (CA6: é filtro),
 * então o BFF RECONSTRÓI via fan-out: uma chamada `/cashflow?costCenterId=<ref>` por CC do catálogo, somando
 * os totais. `realizedCents`/`expectedCents` em centavos. Ver core-api#<fan-out issue> p/ o eixo nativo.
 */
export type CashflowCostCenter = Readonly<{
  ref: string
  name: string
  realizedCents: number
  expectedCents: number
}>

/**
 * Resposta COMPLETA do caso de uso "Fluxo de Caixa" (§III, ADR-0010): o BFF compõe as chamadas do core-api.
 * `payables` = árvore Categoria × Subcategoria (Slice A); `receivables` = SEMPRE `[]` (financial é
 * payables-centric, #179 — A-Receber não existe); `chart` = mesma agregação com eixo de mês (Slice B);
 * `byCostCenter` = corte por Centro de Custo RECONSTRUÍDO via fan-out (o #590 não o expõe como eixo).
 */
export type CashflowReport = Readonly<{
  payables: readonly CashflowRow[]
  receivables: readonly CashflowRow[]
  chart: readonly CashflowChartRow[]
  byCostCenter: readonly CashflowCostCenter[]
}>

/**
 * Filtros de consulta do Fluxo de Caixa (#590). TODOS opcionais, combinados por AND no servidor; refs são
 * UUID opaco. `dueFrom`/`dueTo` = janela HALF-OPEN [dueFrom, dueTo) em `YYYY-MM-DD` (`dueTo` EXCLUSIVO).
 * `costCenterId` RESTRINGE a população (não é eixo). Nomes id-suffixed = padrão do endpoint (#442).
 */
export type CashflowFilter = Readonly<{
  programId?: string
  budgetPlanId?: string
  dueFrom?: string
  dueTo?: string
  accountId?: string
  costCenterId?: string
  categoryId?: string
  subCategoryId?: string
  entityId?: string
  status?: string
}>

/**
 * Relatório Geral (#442 · GET /reports/generalReport) — LEDGER plano e PAGINADO de títulos a-pagar (Slice
 * A+B+C+D). `payeeKind` distingue o favorecido (fornecedor/financiador/ato/colaborador); só o NOME relevante
 * vem preenchido. `pixKey`/`bankAccount` só chegam para fornecedor COM `bank-account:read` (senão null —
 * redação campo-a-campo, Slice C). `contractNumber` = nº sequencial do contrato (Slice D). `valueCents` em
 * centavos (§IV). Datas cruas (`dueDate` ISO) — o client formata (nunca `Date` no domínio).
 */
export type GeneralReportPixKey = Readonly<{ keyType: string; key: string }>
export type GeneralReportBankAccount = Readonly<{
  bank: string
  agency: string
  accountNumber: string
  checkDigit: string
}>
export type GeneralReportRow = Readonly<{
  payableId: string
  documentId: string
  code: string | null
  dueDate: string
  payeeKind: 'supplier' | 'financier' | 'act' | 'collaborator'
  supplierName: string | null
  financierName: string | null
  collaboratorName: string | null
  costCenterName: string | null
  categoryName: string | null
  subcategoryName: string | null
  valueCents: number
  contractNumber: string | null
  pixKey: GeneralReportPixKey | null
  bankAccount: GeneralReportBankAccount | null
}>

/** Página do Relatório Geral (molde `Page<T>` do core-api). `total` é a contagem GLOBAL (todas as páginas). */
export type GeneralReportPage = Readonly<{
  items: readonly GeneralReportRow[]
  page: number
  pageSize: number
  total: number
}>

/**
 * Consulta do Relatório Geral (#442). Paginação obrigatória (o BFF passa page/limit); os demais filtros são
 * opcionais (AND no servidor). `search` = LIKE em nº do documento + fornecedor. `dueFrom`/`dueTo` em `YYYY-MM-DD`.
 */
export type GeneralReportQuery = Readonly<{
  page: number
  limit: number
  search?: string
  programId?: string
  budgetPlanId?: string
  dueFrom?: string
  dueTo?: string
  accountId?: string
  costCenterId?: string
  categoryId?: string
  subCategoryId?: string
  entityId?: string
  status?: string
}>
