/**
 * Dados PLACEHOLDER do relatório "Análise de Recebimentos" (front-first). ESPELHO da "Análise de Pagamentos":
 * mesma matriz TEMPO-orçamentária (árvore Plano Orçamentário → Centro de Custo × SÉRIE MENSAL de valores em
 * CENTAVOS inteiros, §IV — dinheiro nunca em float), mesmo período e MESMO shape das linhas cruas
 * (`RawAnaliseRow`). Só muda a FONTE (valores de RECEBÍVEIS) e a semântica (entradas por mês de previsão de
 * recebimento). O engine da ViewModel é NEUTRO: `loadAnalise('r')` agrega estas linhas exatamente como o 'p'.
 *
 * ⚠️ PLACEHOLDER só p/ VALIDAR a UI/fluxo (diretriz da P.O.): NÃO existe recebível registrado ainda. São
 * CONSTANTES de domínio SINTÉTICAS (planos/centros de custo fictícios pt-BR, SEM PII). Quando o Contas a Receber
 * subir (core-api#114/consolidated), REMOVE-SE este placeholder retornando `[]` em `loadAnalise('r')` e a tela
 * cai LIMPA no empty state honesto ("Nenhum recebimento registrado"). NÃO é mock de teste (ADR-0011: doubles só
 * em `tests/`) — é dado de domínio provisório. O período é o MESMO da Análise de Pagamentos (jan–jun/2026).
 */

import type { RawAnaliseRow } from './analise-pagamentos.placeholder.ts'

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
 * Linhas cruas placeholder de RECEBÍVEIS — 3 planos orçamentários, cada um com 2-3 centros de custo, série de
 * 6 meses em centavos. Ordem de inserção = ordem de exibição da árvore. Valores realistas de entradas de uma
 * ONG de educação (convênios/aportes/desembolsos), com sazonalidade (nem todo mês tem valor).
 */
export const ANALISE_RECEBIMENTOS_RAW: readonly RawAnaliseRow[] = [
  // ── CONV — Convênios de Cooperação ──
  {
    plano: 'CONV — Convênios de Cooperação',
    costCenter: 'Repasse de Custeio',
    monthValues: series(9_600_000, 9_600_000, 9_600_000, 9_600_000, 9_600_000, 9_600_000),
  },
  {
    plano: 'CONV — Convênios de Cooperação',
    costCenter: 'Aporte de Contrapartida',
    monthValues: series(0, 4_320_000, 0, 4_320_000, 0, 4_320_000),
  },
  {
    plano: 'CONV — Convênios de Cooperação',
    costCenter: 'Repasse de Emenda',
    monthValues: series(0, 0, 7_150_000, 0, 0, 7_150_000),
  },
  // ── FOM — Fomento e Subvenções ──
  {
    plano: 'FOM — Fomento e Subvenções',
    costCenter: 'Subvenção de Projeto',
    monthValues: series(6_250_000, 6_250_000, 6_250_000, 6_250_000, 6_250_000, 6_250_000),
  },
  {
    plano: 'FOM — Fomento e Subvenções',
    costCenter: 'Desembolso Contratual',
    monthValues: series(3_100_000, 3_100_000, 4_180_000, 4_180_000, 4_180_000, 5_240_000),
  },
  {
    plano: 'FOM — Fomento e Subvenções',
    costCenter: 'Rendimento de Aplicação',
    monthValues: series(512_400, 528_900, 541_300, 552_800, 561_200, 573_600),
  },
  // ── PATR — Patrocínios e Apoios ──
  {
    plano: 'PATR — Patrocínios e Apoios',
    costCenter: 'Patrocínio de Evento',
    monthValues: series(0, 0, 5_400_000, 0, 5_400_000, 0),
  },
  {
    plano: 'PATR — Patrocínios e Apoios',
    costCenter: 'Apoio Institucional',
    monthValues: series(1_950_000, 1_950_000, 1_950_000, 1_950_000, 1_950_000, 1_950_000),
  },
]
