/**
 * Dados PLACEHOLDER do relatório "Posição de Recebimentos" (front-first). É um SNAPSHOT da posição dos
 * recebíveis, em árvore de 3 níveis: Financiador → Centro de Custo → Categoria (folha). Cada folha traz as
 * 3 MEDIDAS DERIVADAS em CENTAVOS inteiros (§IV — dinheiro nunca em float), NEUTRAS no shape (as mesmas chaves
 * de "Posição de Pagamentos"); só a SEMÂNTICA/rótulos mudam para o lado de RECEBER:
 *   • emAtrasoCents = NÃO recebido E vencido (dueDate < hoje) → rótulo "Em atraso".
 *   • pagoCents     = já RECEBIDO (liquidado)               → rótulo "Recebido".
 *   • aPagarCents   = NÃO recebido E a vencer (dueDate ≥ hoje) → rótulo "A receber".
 *
 * ⚠️ PLACEHOLDER só p/ VALIDAR a UI/fluxo (diretriz da P.O. 2026-07-07): NÃO existe recebível registrado (nem
 * no legado — vem ZERADO). Estas são CONSTANTES de domínio SINTÉTICAS (financiadores fictícios pt-BR, sem PII).
 * Quando o Contas a Receber subir (core-api#114), REMOVE-SE este placeholder retornando `[]` em `loadPosicao('r')`
 * e a tela cai LIMPA no empty state honesto ("Nenhum recebimento registrado"). NÃO é um mock de teste (ADR-0011:
 * doubles só em `tests/`) — é dado de domínio provisório. O shape (`RawPosicaoRow`) é o MESMO de Pagamentos.
 */

import type { RawPosicaoRow } from './posicao-pagamentos.placeholder.ts'

/**
 * Linhas cruas placeholder de RECEBÍVEIS — 5 financiadores, cada um com 1-3 centros de custo, cada CC com 2-4
 * categorias-folha. Valores em centavos plausíveis: a MAIOR parte em Em atraso, algum A receber, Recebido
 * baixo/0 (snapshot de posição pendente). Ordem de inserção = ordem de exibição na árvore.
 */
export const POSICAO_RECEBIMENTOS_RAW: readonly RawPosicaoRow[] = [
  // ── Fundação Horizonte Social ──
  {
    supplier: 'Fundação Horizonte Social',
    costCenter: 'Programa Educação Integral',
    category: 'Convênio de Cooperação',
    emAtrasoCents: 8_400_000,
    pagoCents: 2_100_000,
    aPagarCents: 4_200_000,
  },
  {
    supplier: 'Fundação Horizonte Social',
    costCenter: 'Programa Educação Integral',
    category: 'Aporte de Contrapartida',
    emAtrasoCents: 3_250_000,
    pagoCents: 0,
    aPagarCents: 1_650_000,
  },
  {
    supplier: 'Fundação Horizonte Social',
    costCenter: 'Gestão e Monitoramento',
    category: 'Repasse de Custeio',
    emAtrasoCents: 5_600_000,
    pagoCents: 1_400_000,
    aPagarCents: 2_800_000,
  },

  // ── Instituto Aurora de Fomento ──
  {
    supplier: 'Instituto Aurora de Fomento',
    costCenter: 'Projeto Sementes do Amanhã',
    category: 'Subvenção de Projeto',
    emAtrasoCents: 4_500_000,
    pagoCents: 2_250_000,
    aPagarCents: 2_250_000,
  },
  {
    supplier: 'Instituto Aurora de Fomento',
    costCenter: 'Projeto Sementes do Amanhã',
    category: 'Bolsas e Auxílios',
    emAtrasoCents: 2_880_000,
    pagoCents: 0,
    aPagarCents: 1_440_000,
  },
  {
    supplier: 'Instituto Aurora de Fomento',
    costCenter: 'Assistência Técnica',
    category: 'Consultoria de Campo',
    emAtrasoCents: 1_360_000,
    pagoCents: 340_000,
    aPagarCents: 680_000,
  },

  // ── Banco de Desenvolvimento Meridiano ──
  {
    supplier: 'Banco de Desenvolvimento Meridiano',
    costCenter: 'Linha de Fomento Social',
    category: 'Desembolso Contratual',
    emAtrasoCents: 6_200_000,
    pagoCents: 1_550_000,
    aPagarCents: 3_100_000,
  },
  {
    supplier: 'Banco de Desenvolvimento Meridiano',
    costCenter: 'Linha de Fomento Social',
    category: 'Rendimento de Aplicação',
    emAtrasoCents: 1_920_000,
    pagoCents: 640_000,
    aPagarCents: 960_000,
  },
  {
    supplier: 'Banco de Desenvolvimento Meridiano',
    costCenter: 'Garantias e Contrapartidas',
    category: 'Liberação de Garantia',
    emAtrasoCents: 3_450_000,
    pagoCents: 0,
    aPagarCents: 1_150_000,
  },

  // ── Patrocínio Solidário Vértice S.A. ──
  {
    supplier: 'Patrocínio Solidário Vértice S.A.',
    costCenter: 'Ações de Mobilização',
    category: 'Patrocínio de Evento',
    emAtrasoCents: 2_520_000,
    pagoCents: 840_000,
    aPagarCents: 1_680_000,
  },
  {
    supplier: 'Patrocínio Solidário Vértice S.A.',
    costCenter: 'Ações de Mobilização',
    category: 'Apoio Institucional',
    emAtrasoCents: 1_170_000,
    pagoCents: 390_000,
    aPagarCents: 780_000,
  },
  {
    supplier: 'Patrocínio Solidário Vértice S.A.',
    costCenter: 'Comunicação e Marca',
    category: 'Cota de Mídia',
    emAtrasoCents: 3_900_000,
    pagoCents: 0,
    aPagarCents: 1_300_000,
  },

  // ── Fundo Municipal Semear ──
  {
    supplier: 'Fundo Municipal Semear',
    costCenter: 'Convênio Municipal',
    category: 'Repasse de Emenda',
    emAtrasoCents: 5_040_000,
    pagoCents: 1_260_000,
    aPagarCents: 1_890_000,
  },
  {
    supplier: 'Fundo Municipal Semear',
    costCenter: 'Convênio Municipal',
    category: 'Contrapartida Municipal',
    emAtrasoCents: 1_780_000,
    pagoCents: 0,
    aPagarCents: 890_000,
  },
]
