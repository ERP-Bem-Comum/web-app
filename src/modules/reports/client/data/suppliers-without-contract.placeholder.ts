/**
 * Dados PLACEHOLDER do relatório "Fornecedores sem Contrato" (front-first). Fiéis ao CSV legado, já
 * agregados por fornecedor → { plano orçamentário: total em centavos }. NÃO é um mock de teste (ADR-0011:
 * mocks/doubles só em `tests/`) — são CONSTANTES de domínio que a tela consome enquanto o endpoint do
 * core-api (#114) não existe. Quando o backend nascer, a `data/` passa a montar estas linhas do DTO real.
 *
 * Valores em CENTAVOS inteiros (§IV — dinheiro nunca em float). A ordem dos fornecedores é a ORDEM DE
 * INSERÇÃO do print legado (a ViewModel preserva; não ordena por valor).
 */

/** Uma linha crua (pré-agregação): fornecedor + plano orçamentário + total daquele par, em centavos. */
export type RawSupplierRow = Readonly<{
  supplier: string
  budgetPlan: string
  totalCents: number
}>

// Helper local (só constrói a constante abaixo) — reais → centavos, sem erro de ponto flutuante.
const brl = (reais: number): number => Math.round(reais * 100)

export const SUPPLIERS_WITHOUT_CONTRACT_RAW: readonly RawSupplierRow[] = [
  { supplier: 'WEE TRAVEL', budgetPlan: '2025 PARC 1.0', totalCents: brl(7137.13) },
  { supplier: 'WEE TRAVEL', budgetPlan: '2025 EPV 1.0', totalCents: brl(5844.72) },
  {
    supplier: 'ANA SICILIA GUIMARAES FIGUEIREDO CORREIA',
    budgetPlan: '2025 PARC 1.0',
    totalCents: brl(10000.0),
  },
  { supplier: 'TECNOVETTI', budgetPlan: '2025 PARC 1.0', totalCents: brl(1628.48) },
  { supplier: 'TECNOVETTI', budgetPlan: '2025 EPV 1.0', totalCents: brl(639.24) },
  { supplier: 'Beneficio Social', budgetPlan: '2025 PARC 1.0', totalCents: brl(352.0) },
  { supplier: 'POLO MOVEIS', budgetPlan: '2025 PARC 1.0', totalCents: brl(7000.08) },
  { supplier: 'A3 TURISMO LTDA', budgetPlan: '2025 PARC 1.0', totalCents: brl(9058.56) },
  { supplier: 'A3 TURISMO LTDA', budgetPlan: '2026 PARC 1.0', totalCents: brl(12.0) },
  { supplier: 'Associação Bem Comum', budgetPlan: '2025 EPV 1.0', totalCents: brl(9.8) },
  { supplier: 'Associação Bem Comum', budgetPlan: '2025 PARC 1.0', totalCents: brl(1.0) },
  { supplier: 'Holmes', budgetPlan: '2025 EPV 1.0', totalCents: brl(2102.6) },
  { supplier: 'Holmes', budgetPlan: '2025 PARC 1.0', totalCents: brl(2302.6) },
  { supplier: 'SAMANTHA EVELYN', budgetPlan: '2025 PARC 1.0', totalCents: brl(810.0) },
  { supplier: 'ICTS GLOBAL', budgetPlan: '2025 PARC 1.0', totalCents: brl(1550.0) },
  { supplier: 'VEXPENSES S.A', budgetPlan: '2025 PARC 1.0', totalCents: brl(3180.0) },
  { supplier: 'LUCAS GABRIEL', budgetPlan: '2025 EPV 1.0', totalCents: brl(1100.0) },
] as const
